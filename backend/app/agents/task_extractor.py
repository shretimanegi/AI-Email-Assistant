import json
import re
from datetime import datetime, timedelta
from langchain_core.prompts import ChatPromptTemplate
from app.agents.state import AgentState
from app.config import settings
from app.agents.llm import get_llm

TASK_EXTRACTOR_PROMPT = """
You are an expert AI Action Item Extractor for MailMind AI.
Analyze the email text and extract any tasks, action items, todos, deadlines, and follow-ups.

Email details:
Sender: {sender}
Subject: {subject}
Body: {body}

Provide the action items in JSON format under the key "action_items" as a list of objects.
Each object must contain:
1. "title": The short title of the task.
2. "description": Detailed description of what is requested.
3. "deadline": ISO format date/time string if a deadline is mentioned, otherwise null.
4. "priority": One of ["High", "Medium", "Low"].

Extraction Guidelines:
- Link Identification: Look for links, URLs, or calls-to-action related to "registration" (signups, registrations), "confirmation" (verifying accounts, RSVPs, confirming details), or "reviewing" (drafts, docs, pull requests, files). Include the extracted link directly in the task description field.
- Assignments & Tasks: Identify any performance tasks, assignments, projects, feedback requests, or homework mentioned. Extract them as active tasks to be performed.
"""

def extract_tasks(state: AgentState) -> dict:
    sender = state.get("sender", "")
    subject = state.get("subject", "")
    body = state.get("body", "")

    llm = get_llm(temperature=0, json_mode=True)
    if not llm:
        return {"action_items": _mock_extract(sender, subject, body)}

    try:
        
        prompt = ChatPromptTemplate.from_messages([
            ("system", TASK_EXTRACTOR_PROMPT),
            ("user", "Extract action items:")
        ])
        
        chain = prompt | llm
        response = chain.invoke({
            "sender": sender,
            "subject": subject,
            "body": body
        })
        
        res = json.loads(response.content)
        return {"action_items": res.get("action_items", [])}
    except Exception as e:
        print(f"Error in Task Extraction Agent: {e}. Falling back to regex parser.")
        return {"action_items": _mock_extract(sender, subject, body)}

def _mock_extract(sender: str, subject: str, body: str) -> list:
    s_lower = (subject or "").lower()
    b_lower = (body or "").lower()
    sender_name = sender.split("<")[0].strip() if "<" in sender else sender
    
    tasks = []
    
    # 1. Base tasks from subject keywords
    if "invoice" in s_lower or "billing" in s_lower or "payment" in b_lower:
        deadline = (datetime.utcnow() + timedelta(days=4)).date().isoformat()
        # Find if a different date is mentioned in the body
        dates = re.findall(r'(?i)\b(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]* \d{1,2}|\b\d{1,2}/\d{1,2}/\d{2,4}\b', body or "")
        if dates:
            deadline = dates[0]
        tasks.append({
            "title": f"Process invoice payment",
            "description": f"Settle outstanding balance for invoice from {sender_name}. Confirm payment wire transfer or card payment.",
            "deadline": deadline,
            "priority": "High"
        })
    elif "call" in s_lower or "schedule" in s_lower or "meet" in s_lower:
        deadline = (datetime.utcnow() + timedelta(days=1)).date().isoformat()
        tasks.append({
            "title": "Prepare agenda for alignment call",
            "description": f"Coordinate slot and draft topics to discuss for the alignment sync with {sender_name}.",
            "deadline": deadline,
            "priority": "High"
        })

    # 2. Extract specific action lines from body instead of generic placeholders
    # Let's search for sentences starting with action keywords or questions
    sentences = re.split(r'[.!?\n]', body or "")
    action_sentences = []
    for s in sentences:
        s_clean = s.strip("-*• ")
        s_l = s_clean.lower()
        if any(kw in s_l for kw in ["please ", "could you", "would you", "need to", "must ", "should ", "action item:", "todo:", "task:"]):
            if len(s_clean) > 10 and len(s_clean) < 150:
                action_sentences.append(s_clean)
                
    if action_sentences:
        for idx, act in enumerate(action_sentences[:3]):
            # Try to find a date in this specific sentence
            deadline = None
            date_match = re.search(r'(?i)\b(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]* \d{1,2}|\b\d{1,2}/\d{1,2}/\d{2,4}\b|tomorrow|next week|today', act)
            if date_match:
                deadline = date_match.group(0)
            
            # Clean up task title
            title = act
            if ":" in title:
                title = title.split(":", 1)[1].strip()
            if len(title) > 60:
                title = title[:57] + "..."
                
            tasks.append({
                "title": title,
                "description": f"Action requested by {sender_name}: '{act}'",
                "deadline": deadline,
                "priority": "High" if any(k in act.lower() for k in ["urgent", "must", "immediately", "deadline"]) else "Medium"
            })
            
    # 3. Check for general followups if we haven't extracted any tasks yet
    if not tasks and ("please check" in b_lower or "follow up" in b_lower or "review" in b_lower):
        tasks.append({
            "title": f"Review message from {sender_name}",
            "description": f"Follow up on the details requested in their email regarding '{subject}'.",
            "deadline": None,
            "priority": "Medium"
        })
        
    # 4. Heuristics for links (registration, confirmation, review)
    urls = re.findall(r'(https?://\S+)', body or "")
    if urls:
        url = urls[0].rstrip('.,;)!?')
        # Try to find context line around the URL
        context = "Link found in email"
        for s in sentences:
            if url in s:
                context = s.strip("-*• ")
                break
        
        if "register" in b_lower or "signup" in b_lower or "sign-up" in b_lower:
            tasks.append({
                "title": "Complete registration",
                "description": f"Registration requested. Context: '{context}'. Link: {url}",
                "deadline": None,
                "priority": "High"
            })
        elif "confirm" in b_lower or "verify" in b_lower or "rsvp" in b_lower:
            tasks.append({
                "title": "RSVP / Confirm Details",
                "description": f"Verify or confirm your attendance/details. Context: '{context}'. Link: {url}",
                "deadline": None,
                "priority": "High"
            })
        elif "review" in b_lower or "approve" in b_lower or "check" in b_lower:
            tasks.append({
                "title": "Review requested content",
                "description": f"Review the resource. Context: '{context}'. Link: {url}",
                "deadline": None,
                "priority": "Medium"
            })

    # De-duplicate tasks by title
    seen = set()
    unique_tasks = []
    for t in tasks:
        t_title = t["title"].lower()
        if t_title not in seen:
            seen.add(t_title)
            unique_tasks.append(t)

    return unique_tasks[:4]
