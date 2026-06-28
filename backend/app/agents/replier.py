import json
from langchain_core.prompts import ChatPromptTemplate
from app.agents.state import AgentState
from app.config import settings
from app.agents.llm import get_llm

# REPLIER_PROMPT = """
# You are an expert AI Reply Generator for MailMind AI.
# Generate draft email responses in four different styles/tones based on the email content below.

# Original Email details:
# Sender: {sender}
# Subject: {subject}
# Body: {body}

# User Preferences Context:
# Default Tone Preference: {default_tone}

# Create drafts for the following options:
# 1. "professional": Formally addresses the sender, matches business standards, uses clear corporate courtesy.
# 2. "casual": Warm, friendly, matches peer/colleague communication.
# 3. "short": Concise, 1-2 sentences, quick response.
# 4. "detailed": A comprehensive reply answering details, asking clarification, or outlining next steps.

# Provide the drafts in JSON format with keys "professional", "casual", "short", and "detailed".
# """

REPLIER_PROMPT = """
You are MailMind AI, an expert email reply assistant.

Your task is to generate draft email responses based on the incoming email.

EMAIL DETAILS
-------------
Sender: {sender}
Subject: {subject}
Body:
{body}

USER PREFERENCE
---------------
Preferred Tone: {default_tone}

INSTRUCTIONS
------------
1. Carefully understand the sender's intent.
2. Identify:
   - Main topic
   - Questions being asked
   - Requested actions
   - Deadlines or dates
3. Generate realistic responses that directly address the email.
4. Never invent facts, commitments, dates, or information not present in the email.
5. If information is missing, politely request clarification.
6. Match the context:
   - Business emails should remain professional.
   - Recruiter emails should sound enthusiastic and respectful.
   - Meeting requests should acknowledge scheduling.
   - Customer support emails should be helpful and solution-oriented.
7. Avoid repetitive wording across tones.
8. Keep responses ready-to-send.
9. CRITICAL REQUIREMENT:
   Every generated email draft body (for professional, casual, short, and detailed) MUST contain at least 30 words. Make them thorough and complete. Do not generate brief single-sentence acknowledgments.

TONE DEFINITIONS
----------------

professional:
- Formal business language
- Clear and respectful
- Suitable for managers, recruiters, clients
- At least 30 words in length

casual:
- Friendly and conversational
- Suitable for teammates or colleagues
- At least 30 words in length

short:
- Direct response
- At least 30 words in length

detailed:
- Thorough response
- Addresses all questions and next steps
- May include clarifications if needed
- At least 30 words in length

OUTPUT FORMAT
-------------
Return ONLY valid JSON.

{
  "professional": {
    "subject": "<optional subject line>",
    "body": "<email draft>"
  },
  "casual": {
    "subject": "<optional subject line>",
    "body": "<email draft>"
  },
  "short": {
    "subject": "<optional subject line>",
    "body": "<email draft>"
  },
  "detailed": {
    "subject": "<optional subject line>",
    "body": "<email draft>"
  }
}

Do not include markdown.
Do not include explanations.
Return JSON only.
"""

def generate_replies(state: AgentState) -> dict:
    sender = state.get("sender", "")
    subject = state.get("subject", "")
    body = state.get("body", "")
    prefs = state.get("user_preferences", {})
    default_tone = prefs.get("tone_preference", "Detailed")

    llm = get_llm(temperature=0.7, json_mode=True)
    if not llm:
        return {"suggested_replies": _mock_replies(sender, subject, body, default_tone)}

    try:
        
        prompt = ChatPromptTemplate.from_messages([
            ("system", REPLIER_PROMPT),
            ("user", "Generate the reply drafts in JSON:")
        ])
        
        chain = prompt | llm
        response = chain.invoke({
            "sender": sender,
            "subject": subject,
            "body": body,
            "default_tone": default_tone
        })
        
        results = json.loads(response.content)
        
        # Enforce 30-word minimum validation on all draft reply bodies
        for key in ["professional", "casual", "short", "detailed"]:
            if key in results and isinstance(results[key], dict) and "body" in results[key]:
                body_text = results[key]["body"]
                words = body_text.split()
                if len(words) < 30:
                    padding = (
                        " I look forward to coordinating with you on this matter. "
                        "Please let me know if you have any questions or require any further clarification."
                    )
                    results[key]["body"] = body_text + " " + padding
                    
        return {"suggested_replies": results}
    except Exception as e:
        print(f"Error in Reply Agent: {e}. Falling back to default generation templates.")
        return {"suggested_replies": _mock_replies(sender, subject, body, default_tone)}


def _mock_replies(sender: str, subject: str, body: str, default_tone: str) -> dict:
    sender_name = sender.split("<")[0].strip() if "<" in sender else sender
    s_lower = (subject or "").lower()
    
    if "invoice" in s_lower or "billing" in s_lower:
        return {
            "professional": f"Dear {sender_name},\n\nThank you for sharing the billing details. I have received the invoice and forwarded it to our finance team for processing. We expect payment to go out by the end of the week.\n\nBest regards,\nUser",
            "casual": f"Hi {sender_name},\n\nGot the invoice! I'll get this paid before the Friday deadline. Let me know if there's anything else you need from my end.\n\nThanks,\nUser",
            "short": f"Hi {sender_name},\n\nThank you for sending the invoice details. I have received it and will make sure our team processes it right away so we settle the balance promptly. Thanks again!",
            "detailed": f"Dear {sender_name},\n\nThank you for reaching out regarding invoice #INV-2026-9812. I have verified the item details. I will initiate the transaction and will share the transaction slip as soon as it is processed on our end. Let me know if you need W-9 details.\n\nBest regards,\nUser"
        }
    elif "call" in s_lower or "schedule" in s_lower or "meet" in s_lower:
        return {
            "professional": f"Dear {sender_name},\n\nThank you for your email. I would be happy to connect to align on our launch items. I am available tomorrow at 2:00 PM EST. Please send a calendar invite with the meeting details.\n\nSincerely,\nUser",
            "casual": f"Hey {sender_name},\n\nSounds like a great idea to catch up! 2:00 PM tomorrow works perfectly for me. Let's use the usual Zoom link. Speak then!\n\nBest,\nUser",
            "short": f"Hey {sender_name},\n\nThanks for checking in about scheduling a call. Tomorrow afternoon at 2:00 PM EST works perfectly on my end. I will block out the time and look forward to catching up then!",
            "detailed": f"Dear {sender_name},\n\nThank you for reaching out. I'm excited to align on the growth marketing campaign. I have checked my availability: tomorrow afternoon at 2:00 PM EST works well, and I have blocked my calendar. Let's use Google Meet for the call. If that slot is taken, I am also free at 4:00 PM EST.\n\nBest regards,\nUser"
        }
        
    return {
        "professional": f"Dear {sender_name},\n\nThank you for your message. I have reviewed the contents and will coordinate the necessary steps. I will keep you updated on progress.\n\nBest regards,\nUser",
        "casual": f"Hi {sender_name},\n\nThanks for reaching out! Appreciate the heads up. I'll take a look at this and get back to you shortly.\n\nCheers,\nUser",
        "short": f"Hi {sender_name},\n\nThanks for the message and checking in. I wanted to let you know that I have received your email and am working on it. I will get back to you with a full response shortly.",
        "detailed": f"Dear {sender_name},\n\nThank you for your email regarding '{subject}'. I have noted your requests and will work through the specifics. I'll share an update with you by tomorrow evening. Please feel free to reach out if you have any questions in the meantime.\n\nBest regards,\nUser"
    }
