from datetime import datetime
from typing import Optional, Dict, Any
from pydantic import BaseModel

class UserMemoryBase(BaseModel):
    tone_preference: str
    preferred_meeting_times: Dict[str, Any]
    learned_contacts_memory: Dict[str, Any]

class UserMemoryResponse(UserMemoryBase):
    updated_at: datetime

    class Config:
        from_attributes = True

class SettingsUpdateRequest(BaseModel):
    tone_preference: Optional[str] = None
    preferred_meeting_times: Optional[Dict[str, Any]] = None
    api_keys_encrypted: Optional[Dict[str, Any]] = None
    learned_contacts_memory: Optional[Dict[str, Any]] = None
