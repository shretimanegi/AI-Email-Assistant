import uuid
from datetime import datetime
from sqlalchemy import DateTime, ForeignKey, JSON, String
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base

class UserMemory(Base):
    __tablename__ = "user_memories"

    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    
    # Custom writing preferences (e.g., Professional, Casual, Friendly, Short, Detailed)
    tone_preference: Mapped[str] = mapped_column(String(50), default="Detailed", nullable=False)
    
    # JSON containing structured configurations like {"start": "09:00", "end": "17:00", "days": [1,2,3,4,5]}
    preferred_meeting_times: Mapped[dict] = mapped_column(JSON, default=lambda: {"start": "09:00", "end": "17:00", "days": [1,2,3,4,5]}, nullable=False)
    
    # Encrypted third party API credentials if user provides their own keys
    api_keys_encrypted: Mapped[dict] = mapped_column(JSON, default=dict, nullable=False)
    
    # Store contact details, nicknames, relation rules, e.g. {"sender@domain.com": {"nickname": "Client A", "importance_offset": 1}}
    learned_contacts_memory: Mapped[dict] = mapped_column(JSON, default=dict, nullable=False)
    
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    user = relationship("User", back_populates="memory")
