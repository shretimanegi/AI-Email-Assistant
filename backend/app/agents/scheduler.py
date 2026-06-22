import json
from datetime import datetime, timedelta, timezone
from langchain_core.prompts import ChatPromptTemplate
from app.agents.state import AgentState
from app.config import settings
from app.agents.llm import get_llm

SCHEDULER_PROMPT = """
You are an expert AI Calendar Assistant for MailMind AI.
Analyze the email text and determine if the sender wants to schedule a meeting, call, or sync.

Email Subject: {subject}
Email Body: {body}

Current Time Context: {current_time}
User Working Hours Context: {working_hours}

Provide your analysis in JSON format with three fields:
1. "intent_detected": Boolean (true if they propose scheduling a meeting/call, false otherwise).
2. "proposed_times_raw": List of strings describing times proposed by the sender (e.g. ["tomorrow at 2 PM", "Friday morning"]).
3. "duration_minutes": Integer (estimated meeting duration, defaults to 30).
"""

def process_scheduling(state: AgentState) -> dict:
    subject = state.get("subject", "")
    body = state.get("body", "")
    prefs = state.get("user_preferences", {})
    working_hours = prefs.get("preferred_meeting_times", {"start": "09:00", "end": "17:00"})
    
    current_time = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC")

    llm = get_llm(temperature=0, json_mode=True)
    if not llm:
        intent, proposed = _mock_detect_intent(subject, body)
        return {"calendar_actions": _create_calendar_payload(intent, proposed, working_hours)}

    try:
        
        prompt = ChatPromptTemplate.from_messages([
            ("system", SCHEDULER_PROMPT),
            ("user", "Evaluate meeting intent:")
        ])
        
        chain = prompt | llm
        response = chain.invoke({
            "subject": subject,
            "body": body,
            "current_time": current_time,
            "working_hours": str(working_hours)
        })
        
        res = json.loads(response.content)
        intent = res.get("intent_detected", False)
        proposed = res.get("proposed_times_raw", [])
        
        return {"calendar_actions": _create_calendar_payload(intent, proposed, working_hours)}
    except Exception as e:
        print(f"Error in Scheduling Agent: {e}. Using rule-based fallback.")
        intent, proposed = _mock_detect_intent(subject, body)
        return {"calendar_actions": _create_calendar_payload(intent, proposed, working_hours)}

def _mock_detect_intent(subject: str, body: str) -> tuple[bool, list]:
    s_lower = (subject or "").lower()
    b_lower = (body or "").lower()
    
    intent = False
    proposed = []
    
    if "call" in s_lower or "meet" in s_lower or "schedule" in s_lower or "zoom" in b_lower or "calendar" in b_lower:
        intent = True
        # Extract matches
        if "2:00 pm" in b_lower:
            proposed.append("tomorrow at 2:00 PM EST")
        if "4:00 pm" in b_lower:
            proposed.append("tomorrow at 4:00 PM EST")
        if not proposed:
            proposed.append("tomorrow afternoon")
            
    return intent, proposed

def _create_calendar_payload(intent: bool, proposed: list, working_hours: dict) -> dict:
    if not intent:
        return {"intent_detected": False, "suggested_slots": [], "draft_email": ""}
        
    # Generate mock available slots based on work preferences
    tomorrow = datetime.now(timezone.utc) + timedelta(days=1)
    
    # We create two options that are free (avoiding simulated conflicts)
    slot1_start = datetime(tomorrow.year, tomorrow.month, tomorrow.day, 14, 0, tzinfo=timezone.utc)
    slot1_end = slot1_start + timedelta(minutes=30)
    
    slot2_start = datetime(tomorrow.year, tomorrow.month, tomorrow.day, 16, 0, tzinfo=timezone.utc)
    slot2_end = slot2_start + timedelta(minutes=30)
    
    slots = [
        {
            "start": slot1_start.isoformat(),
            "end": slot1_end.isoformat(),
            "formatted": slot1_start.strftime("%A, %b %d at %I:%M %p UTC")
        },
        {
            "start": slot2_start.isoformat(),
            "end": slot2_end.isoformat(),
            "formatted": slot2_start.strftime("%A, %b %d at %I:%M %p UTC")
        }
    ]
    
    draft_email = (
        f"Hi,\n\nI checked my calendar and I am free to connect during either of these slots:\n"
        f"1. {slots[0]['formatted']}\n"
        f"2. {slots[1]['formatted']}\n\n"
        f"Please let me know which option works best and I will send over a calendar invite.\n\n"
        f"Best,\nUser"
    )
    
    return {
        "intent_detected": True,
        "proposed_times": proposed,
        "suggested_slots": slots,
        "draft_email": draft_email
    }
stream = None
