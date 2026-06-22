from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel

class EmailBase(BaseModel):
    id: str
    thread_id: str
    subject: Optional[str] = None
    sender: str
    recipient: Optional[str] = None
    body_text: Optional[str] = None
    body_html: Optional[str] = None
    received_at: datetime
    category: str
    priority: str
    is_read: bool
    summary: Optional[str] = None
    sentiment: str

class EmailResponse(EmailBase):
    created_at: datetime

    class Config:
        from_attributes = True

class EmailListResponse(BaseModel):
    emails: List[EmailResponse]
    unread_count: int

class EmailReplyRequest(BaseModel):
    body_text: str

class EmailActionResponse(BaseModel):
    success: bool
    message: str
    details: Optional[Dict[str, Any]] = None
