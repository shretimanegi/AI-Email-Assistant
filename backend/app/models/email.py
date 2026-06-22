import uuid
from datetime import datetime
from sqlalchemy import String, DateTime, ForeignKey, Boolean, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base

class Email(Base):
    __tablename__ = "emails"

    # Gmail ID is unique string format
    id: Mapped[str] = mapped_column(String(255), primary_key=True)
    thread_id: Mapped[str] = mapped_column(String(255), index=True, nullable=False)
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    
    subject: Mapped[str] = mapped_column(Text, nullable=True)
    sender: Mapped[str] = mapped_column(String(255), nullable=False)
    recipient: Mapped[str] = mapped_column(Text, nullable=True)
    body_text: Mapped[str] = mapped_column(Text, nullable=True)
    body_html: Mapped[str] = mapped_column(Text, nullable=True)
    
    received_at: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    category: Mapped[str] = mapped_column(String(50), default="Personal", nullable=False) # AI Category
    priority: Mapped[str] = mapped_column(String(20), default="Medium", nullable=False)   # High, Medium, Low
    is_read: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    summary: Mapped[str] = mapped_column(Text, nullable=True)                              # AI summary
    sentiment: Mapped[str] = mapped_column(String(20), default="Neutral", nullable=False) # AI sentiment
    
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    user = relationship("User", back_populates="emails")
    tasks = relationship("Task", back_populates="email")
