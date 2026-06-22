from fastapi import APIRouter, Depends, HTTPException, Query, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import List, Dict, Any, Optional
from app.database import get_db
from app.auth.service import get_current_user
from app.models.user import User
from app.models.email import Email
from app.models.task import Task
from app.models.memory import UserMemory
from app.schemas.email import EmailResponse, EmailListResponse, EmailReplyRequest, EmailActionResponse
from app.services.gmail import GmailService
from app.services.redis_cache import redis_cache
from app.agents.graph import app_graph
import json

router = APIRouter(prefix="/emails", tags=["Emails"])

async def run_agent_on_email(db: AsyncSession, user: User, email_data: dict) -> Email:
    # 1. Fetch user preferences & contacts memory
    result = await db.execute(select(UserMemory).filter(UserMemory.user_id == user.id))
    memory = result.scalars().first()
    
    tone_preference = "Detailed"
    meeting_times = {}
    contacts = []
    
    if memory:
        tone_preference = memory.tone_preference
        meeting_times = memory.preferred_meeting_times
        contacts = list(memory.learned_contacts_memory.keys())

    # 2. Setup LangGraph initial state
    initial_state = {
        "user_id": str(user.id),
        "email_id": email_data["id"],
        "thread_id": email_data["thread_id"],
        "subject": email_data["subject"],
        "sender": email_data["sender"],
        "body": email_data["body_text"] or email_data["body_html"] or "",
        "user_preferences": {
            "tone_preference": tone_preference,
            "preferred_meeting_times": meeting_times
        },
        "frequent_contacts": contacts
    }

    # 3. Execute LangGraph agents pipeline
    output_state = await app_graph.ainvoke(initial_state)

    # 4. Save email to database
    db_email = Email(
        id=email_data["id"],
        thread_id=email_data["thread_id"],
        user_id=user.id,
        subject=email_data["subject"],
        sender=email_data["sender"],
        recipient=email_data["recipient"],
        body_text=email_data["body_text"],
        body_html=email_data["body_html"],
        received_at=email_data["received_at"],
        category=output_state.get("category", "Personal"),
        priority=output_state.get("priority", "Medium"),
        is_read=email_data["is_read"],
        summary=output_state.get("summary", ""),
        sentiment=output_state.get("sentiment", "Neutral")
    )
    db.add(db_email)
    await db.flush()

    # 5. Extract and save action items
    action_items = output_state.get("action_items", [])
    for item in action_items:
        db_task = Task(
            user_id=user.id,
            email_id=db_email.id,
            title=item["title"],
            description=item.get("description"),
            priority=item.get("priority", "Medium"),
            status="Pending"
        )
        if item.get("deadline"):
            try:
                from datetime import datetime
                db_task.deadline = datetime.fromisoformat(item["deadline"])
            except Exception:
                pass
        db.add(db_task)

    # 6. Cache agent suggested replies & calendar options
    # This prevents storing ephemeral drafts in relational schema
    cache_data = {
        "replies": output_state.get("suggested_replies", {}),
        "calendar": output_state.get("calendar_actions", {})
    }
    redis_cache.set(f"email_actions:{db_email.id}", cache_data, expire_seconds=86400) # cache for 1 day
    
    return db_email

@router.get("", response_model=EmailListResponse)
async def list_emails(
    sync: bool = Query(True, description="Sync with Gmail API"),
    limit: int = Query(30, description="Number of recent emails to fetch from Gmail"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Retrieve emails list. Optionally syncs and executes agents on newly detected emails."""
    gmail_service = GmailService(refresh_token=current_user.google_refresh_token)
    
    if sync:
        # Fetch latest emails from Gmail
        fetched_emails = gmail_service.fetch_recent_emails(max_results=limit)
        
        for email_data in fetched_emails:
            # Check if email is already in database
            stmt = select(Email).filter(Email.id == email_data["id"])
            res = await db.execute(stmt)
            existing = res.scalars().first()
            
            if not existing:
                try:
                    await run_agent_on_email(db, current_user, email_data)
                except Exception as e:
                    print(f"Failed to process email {email_data['id']} through agents: {e}")
                    
        await db.commit()

    # Query all emails from DB
    result = await db.execute(
        select(Email)
        .filter(Email.user_id == current_user.id)
        .order_by(Email.received_at.desc())
    )
    emails = result.scalars().all()
    
    # Calculate unread
    unread_res = await db.execute(
        select(Email).filter(Email.user_id == current_user.id, Email.is_read == False)
    )
    unread_count = len(unread_res.scalars().all())

    return {
        "emails": emails,
        "unread_count": unread_count
    }

@router.get("/{id}")
async def get_email(
    id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Retrieve detailed email content along with cached reply drafts & calendar hooks."""
    stmt = select(Email).filter(Email.id == id, Email.user_id == current_user.id)
    res = await db.execute(stmt)
    email_obj = res.scalars().first()
    
    if not email_obj:
        raise HTTPException(status_code=404, detail="Email not found")

    # Mark as read in DB if it was unread
    if not email_obj.is_read:
        email_obj.is_read = True
        await db.commit()

    # Get cached replies and calendar choices
    cached_actions = redis_cache.get(f"email_actions:{email_obj.id}")
    if not cached_actions:
        # Regenerate if missing in cache
        result = await db.execute(select(UserMemory).filter(UserMemory.user_id == current_user.id))
        memory = result.scalars().first()
        contacts = list(memory.learned_contacts_memory.keys()) if memory else []
        
        initial_state = {
            "user_id": str(current_user.id),
            "email_id": email_obj.id,
            "thread_id": email_obj.thread_id,
            "subject": email_obj.subject,
            "sender": email_obj.sender,
            "body": email_obj.body_text or email_obj.body_html or "",
            "user_preferences": {"tone_preference": memory.tone_preference if memory else "Detailed"},
            "frequent_contacts": contacts
        }
        output_state = await app_graph.ainvoke(initial_state)
        cached_actions = {
            "replies": output_state.get("suggested_replies", {}),
            "calendar": output_state.get("calendar_actions", {})
        }
        redis_cache.set(f"email_actions:{email_obj.id}", cached_actions, expire_seconds=86400)

    return {
        "email": email_obj,
        "actions": cached_actions
    }

@router.post("/{id}/reply", response_model=EmailActionResponse)
async def send_email_reply(
    id: str,
    payload: EmailReplyRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Deliver reply draft using the Gmail API."""
    stmt = select(Email).filter(Email.id == id, Email.user_id == current_user.id)
    res = await db.execute(stmt)
    email_obj = res.scalars().first()
    
    if not email_obj:
        raise HTTPException(status_code=404, detail="Email not found")

    gmail_service = GmailService(refresh_token=current_user.google_refresh_token)
    success = gmail_service.send_reply(
        thread_id=email_obj.thread_id,
        to=email_obj.sender,
        subject=email_obj.subject,
        body_text=payload.body_text
    )

    if not success:
        raise HTTPException(status_code=500, detail="Failed to dispatch reply through Gmail service")

    return {
        "success": True,
        "message": "Reply dispatched successfully."
    }

@router.post("/{id}/re-evaluate", response_model=EmailActionResponse)
async def re_evaluate_email(
    id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Force re-run the LangGraph agents execution on this email to update classifications."""
    stmt = select(Email).filter(Email.id == id, Email.user_id == current_user.id)
    res = await db.execute(stmt)
    email_obj = res.scalars().first()
    
    if not email_obj:
        raise HTTPException(status_code=404, detail="Email not found")

    # Clean existing tasks created by this email
    del_stmt = select(Task).filter(Task.email_id == email_obj.id)
    tasks_res = await db.execute(del_stmt)
    for t in tasks_res.scalars().all():
        await db.delete(t)

    # Re-run agents
    email_data = {
        "id": email_obj.id,
        "thread_id": email_obj.thread_id,
        "subject": email_obj.subject,
        "sender": email_obj.sender,
        "recipient": email_obj.recipient,
        "body_text": email_obj.body_text,
        "body_html": email_obj.body_html,
        "received_at": email_obj.received_at,
        "is_read": email_obj.is_read
    }
    
    await db.delete(email_obj)
    await db.flush()
    
    new_email_obj = await run_agent_on_email(db, current_user, email_data)
    await db.commit()

    return {
        "success": True,
        "message": "AI analysis re-evaluated successfully.",
        "details": {"category": new_email_obj.category, "priority": new_email_obj.priority}
    }
