from fastapi import APIRouter, Depends, HTTPException, Query
from datetime import datetime, timedelta
from typing import List, Optional
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.database import get_db
from app.auth.service import get_current_user
from app.models.user import User
from app.models.email import Email
from app.models.memory import UserMemory
from app.services.redis_cache import redis_cache
from app.agents.graph import app_graph
from app.services.calendar import CalendarService

router = APIRouter(prefix="/calendar", tags=["Calendar"])

class BookEventRequest(BaseModel):
    summary: str
    start_time: str # ISO string
    end_time: str   # ISO string
    attendees: Optional[List[str]] = None
    description: Optional[str] = ""

@router.get("/proposed-slots")
async def list_proposed_slots(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Fetch proposed meeting slots from parsed emails."""
    stmt = select(Email).filter(Email.user_id == current_user.id, Email.category == "Meeting Requests")
    res = await db.execute(stmt)
    emails = res.scalars().all()
    
    proposed_slots = []
    
    for email in emails:
        # Get cached actions
        cached_actions = redis_cache.get(f"email_actions:{email.id}")
        
        # If cache expired/missing, regenerate
        if not cached_actions:
            try:
                # Query user memory
                result = await db.execute(select(UserMemory).filter(UserMemory.user_id == current_user.id))
                memory = result.scalars().first()
                contacts = list(memory.learned_contacts_memory.keys()) if memory else []
                
                initial_state = {
                    "user_id": str(current_user.id),
                    "email_id": email.id,
                    "thread_id": email.thread_id,
                    "subject": email.subject,
                    "sender": email.sender,
                    "body": email.body_text or email.body_html or "",
                    "user_preferences": {"tone_preference": memory.tone_preference if memory else "Detailed"},
                    "frequent_contacts": contacts
                }
                output_state = await app_graph.ainvoke(initial_state)
                cached_actions = {
                    "replies": output_state.get("suggested_replies", {}),
                    "calendar": output_state.get("calendar_actions", {})
                }
                redis_cache.set(f"email_actions:{email.id}", cached_actions, expire_seconds=86400)
            except Exception:
                continue
                
        calendar_data = cached_actions.get("calendar", {})
        if calendar_data.get("intent_detected"):
            slots = calendar_data.get("suggested_slots", [])
            sender_name = email.sender.split("<")[0].strip() if "<" in email.sender else email.sender
            for slot in slots:
                proposed_slots.append({
                    "email_id": email.id,
                    "summary": f"{sender_name} ({email.subject})",
                    "start": slot.get("start"),
                    "end": slot.get("end"),
                    "formatted": slot.get("formatted"),
                    "sender": email.sender
                })
                
    return proposed_slots

@router.get("/events")
async def list_upcoming_events(
    days: int = Query(7, description="Number of days to check ahead"),
    current_user: User = Depends(get_current_user)
):
    """Fetch upcoming events for the next N days."""
    calendar_service = CalendarService(refresh_token=current_user.google_refresh_token)
    service = calendar_service._get_service()
    
    if service:
        start_time = datetime.utcnow()
        end_time = start_time + timedelta(days=days)
        busy_slots = calendar_service.get_busy_slots(start_time, end_time)
        
        events = []
        for i, slot in enumerate(busy_slots):
            s_dt = datetime.fromisoformat(slot["start"].replace("Z", ""))
            e_dt = datetime.fromisoformat(slot["end"].replace("Z", ""))
            events.append({
                "id": slot.get("id") or f"event-{i}",
                "summary": slot.get("summary") or "Busy / Meeting slot",
                "start": s_dt.strftime("%Y-%m-%d %H:%M"),
                "end": e_dt.strftime("%Y-%m-%d %H:%M"),
                "color": "#FFC8DD" if i % 2 == 0 else "#BDE0FE"
            })
        return events
        
    # Mock fallback
    events = redis_cache.get(f"mock_calendar_events:{current_user.id}")
    if events is None:
        tomorrow = datetime.utcnow() + timedelta(days=1)
        fmt = lambda h, m: datetime(tomorrow.year, tomorrow.month, tomorrow.day, h, m).strftime("%Y-%m-%d %H:%M")
        events = [
            { "id": "event-0", "summary": "Marketing sync (Proposed)", "start": fmt(14, 0), "end": fmt(14, 30), "color": "#CDB4DB" },
            { "id": "event-1", "summary": "Weekly Standup", "start": fmt(10, 0), "end": fmt(11, 0), "color": "#BDE0FE" },
            { "id": "event-2", "summary": "Product review", "start": fmt(15, 0), "end": fmt(16, 0), "color": "#FFC8DD" }
        ]
        redis_cache.set(f"mock_calendar_events:{current_user.id}", events, expire_seconds=86400 * 30)
        
    return events

@router.post("/events")
async def book_calendar_event(
    payload: BookEventRequest,
    current_user: User = Depends(get_current_user)
):
    """Insert a new meeting event on the user's primary calendar."""
    calendar_service = CalendarService(refresh_token=current_user.google_refresh_token)
    
    try:
        start_time = datetime.fromisoformat(payload.start_time.replace("Z", ""))
        end_time = datetime.fromisoformat(payload.end_time.replace("Z", ""))
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid date-time ISO format string")

    service = calendar_service._get_service()
    if service:
        event = calendar_service.create_meeting(
            summary=payload.summary,
            start_time=start_time,
            end_time=end_time,
            attendees=payload.attendees,
            description=payload.description
        )
        if not event:
            raise HTTPException(status_code=500, detail="Google Calendar API failed to schedule event")
        return {
            "success": True,
            "event_id": event.get("id"),
            "link": event.get("htmlLink"),
            "message": "Event booked successfully on Google Calendar."
        }
        
    # Mock fallback
    event_id = f"mock-evt-{int(datetime.utcnow().timestamp())}"
    new_event = {
        "id": event_id,
        "summary": payload.summary,
        "start": start_time.strftime("%Y-%m-%d %H:%M"),
        "end": end_time.strftime("%Y-%m-%d %H:%M"),
        "color": "#CDB4DB"
    }
    
    events = redis_cache.get(f"mock_calendar_events:{current_user.id}")
    if events is None:
        tomorrow = datetime.utcnow() + timedelta(days=1)
        fmt = lambda h, m: datetime(tomorrow.year, tomorrow.month, tomorrow.day, h, m).strftime("%Y-%m-%d %H:%M")
        events = [
            { "id": "event-0", "summary": "Marketing sync (Proposed)", "start": fmt(14, 0), "end": fmt(14, 30), "color": "#CDB4DB" },
            { "id": "event-1", "summary": "Weekly Standup", "start": fmt(10, 0), "end": fmt(11, 0), "color": "#BDE0FE" },
            { "id": "event-2", "summary": "Product review", "start": fmt(15, 0), "end": fmt(16, 0), "color": "#FFC8DD" }
        ]
        
    events.append(new_event)
    redis_cache.set(f"mock_calendar_events:{current_user.id}", events, expire_seconds=86400 * 30)
    
    return {
        "success": True,
        "event_id": event_id,
        "link": "https://calendar.google.com/calendar/r/eventedit",
        "message": "Event booked successfully."
    }

@router.delete("/events/{event_id}")
async def delete_calendar_event(
    event_id: str,
    current_user: User = Depends(get_current_user)
):
    """Delete a meeting event from the calendar."""
    calendar_service = CalendarService(refresh_token=current_user.google_refresh_token)
    
    service = calendar_service._get_service()
    if service:
        try:
            service.events().delete(calendarId="primary", eventId=event_id).execute()
            return {"success": True, "message": "Event deleted from Google Calendar."}
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Google Calendar delete failed: {str(e)}")
            
    # Mock fallback
    events = redis_cache.get(f"mock_calendar_events:{current_user.id}")
    if events:
        updated_events = [e for e in events if e.get("id") != event_id]
        redis_cache.set(f"mock_calendar_events:{current_user.id}", updated_events, expire_seconds=86400 * 30)
        return {"success": True, "message": "Mock event deleted."}
        
    return {"success": True, "message": "Event not found or already deleted."}
