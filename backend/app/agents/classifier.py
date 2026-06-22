import json
from langchain_core.prompts import ChatPromptTemplate
from app.agents.state import AgentState
from app.config import settings
from app.agents.llm import get_llm

CLASSIFIER_PROMPT = """
You are an expert AI Email Classifier for MailMind AI.
Analyze the email below and classify it accurately.

Email Details:
Sender: {sender}
Subject: {subject}
Body: {body}

User Preferences Context:
Frequent Contacts: {frequent_contacts}

Provide your classification in JSON format with exactly three fields:
1. "category": Choose exactly one of ["Important", "Meeting Requests", "Personal", "Promotions", "Newsletters", "Finance", "Spam"].
2. "priority": Choose exactly one of ["High", "Medium", "Low"].
3. "sentiment": Choose exactly one of ["Positive", "Neutral", "Negative"].

Rules:
- If it mentions billing, invoice, wire, payment, or banking, it is "Finance".
- If it contains scheduling, booking, call proposals, Zoom invites, or calendar slots, it is "Meeting Requests".
- If the sender is in the frequent contacts list, default priority to "High" or "Medium".
- Newsletters and Promotions should be "Low" priority.
- Standard replies/chat should be "Personal" or "Important".
"""

def classify_email(state: AgentState) -> dict:
    sender = state.get("sender", "")
    subject = state.get("subject", "")
    body = state.get("body", "")
    frequent_contacts = state.get("frequent_contacts", [])

    # Initialize LLM using helper
    llm = get_llm(temperature=0, json_mode=True)
    if not llm:
        return _mock_classify(sender, subject, body, frequent_contacts)

    try:
        
        prompt = ChatPromptTemplate.from_messages([
            ("system", CLASSIFIER_PROMPT),
            ("user", "Please classify the email.")
        ])
        
        chain = prompt | llm
        response = chain.invoke({
            "sender": sender,
            "subject": subject,
            "body": body,
            "frequent_contacts": str(frequent_contacts)
        })
        
        result = json.loads(response.content)
        return {
            "category": result.get("category", "Personal"),
            "priority": result.get("priority", "Medium"),
            "sentiment": result.get("sentiment", "Neutral")
        }
    except Exception as e:
        print(f"Error in Classification Agent: {e}. Falling back to rule-based classification.")
        return _mock_classify(sender, subject, body, frequent_contacts)

def _mock_classify(sender: str, subject: str, body: str, frequent_contacts: list) -> dict:
    s_lower = (subject or "").lower()
    b_lower = (body or "").lower()
    snd_lower = (sender or "").lower()
    
    # Defaults
    category = "Personal"
    priority = "Medium"
    sentiment = "Neutral"

    # Category matching rules
    if "invoice" in s_lower or "invoice" in b_lower or "billing" in s_lower or "payment" in b_lower or "finance" in s_lower:
        category = "Finance"
        priority = "High"
    elif "zoom" in b_lower or "google meet" in b_lower or "call" in s_lower or "calendar" in b_lower or "schedule" in s_lower or "free to jump" in b_lower or "meet" in s_lower:
        category = "Meeting Requests"
        priority = "High"
    elif "newsletter" in snd_lower or "digest" in s_lower or "weekly" in s_lower or "substack" in snd_lower:
        category = "Newsletters"
        priority = "Low"
    elif "offer" in s_lower or "discount" in b_lower or "deal" in s_lower or "pricing" in b_lower or "unsubscribe" in b_lower:
        category = "Promotions"
        priority = "Low"
    elif "viagra" in b_lower or "lottery" in s_lower or "win cash" in b_lower:
        category = "Spam"
        priority = "Low"
        sentiment = "Negative"

    # Priority modifier for frequent contacts
    for contact in frequent_contacts:
        if contact in snd_lower:
            priority = "High"
            break

    # Sentiment check
    if "thanks" in b_lower or "great" in b_lower or "awesome" in b_lower or "happy" in b_lower:
        sentiment = "Positive"
    elif "disappointed" in b_lower or "error" in b_lower or "urgent" in s_lower or "failed" in b_lower or "overdue" in s_lower:
        sentiment = "Negative"

    return {
        "category": category,
        "priority": priority,
        "sentiment": sentiment
    }
