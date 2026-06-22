import uuid
from datetime import datetime
from typing import Optional
from pydantic import BaseModel

class TaskBase(BaseModel):
    title: str
    description: Optional[str] = None
    status: Optional[str] = "Pending"  # Pending, Completed
    deadline: Optional[datetime] = None
    priority: Optional[str] = "Medium"  # High, Medium, Low
    email_id: Optional[str] = None

class TaskCreate(TaskBase):
    pass

class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None
    deadline: Optional[datetime] = None
    priority: Optional[str] = None

class TaskResponse(TaskBase):
    id: uuid.UUID
    user_id: uuid.UUID
    created_at: datetime

    class Config:
        from_attributes = True
