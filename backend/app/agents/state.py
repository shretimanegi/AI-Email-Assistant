from typing import TypedDict, List, Dict, Any

class AgentState(TypedDict):
    # Inputs
    user_id: str
    email_id: str
    thread_id: str
    subject: str
    sender: str
    body: str
    
    # State fields processed/set by agents
    category: str              # Important, Meeting Requests, Personal, Promotions, Newsletters, Finance, Spam
    priority: str              # High, Medium, Low
    summary: str               # One-click thread/email summary
    sentiment: str             # Positive, Neutral, Negative
    action_items: List[Dict[str, Any]] # Extracted tasks, deadlines, follow-ups
    suggested_replies: Dict[str, str]  # Tone options (e.g., Professional, Casual, Friendly, Short, Detailed)
    
    calendar_actions: Dict[str, Any] # Booking slots suggestions, invitation status
    
    # User memory & constraints context
    user_preferences: Dict[str, Any]  # Default tones, working hours
    frequent_contacts: List[str]      # Top sender lists for priority weights
