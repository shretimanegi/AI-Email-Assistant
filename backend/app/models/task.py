import uuid
from datetime import datetime
from sqlalchemy import String, DateTime, ForeignKey, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base

class Task(Base):
    __tablename__ = "tasks"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    email_id: Mapped[str] = mapped_column(ForeignKey("emails.id", ondelete="SET NULL"), nullable=True)
    
    title: Mapped[str] = mapped_column(Text, nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(String(20), default="Pending", nullable=False) # Pending, Completed
    deadline: Mapped[datetime] = mapped_column(DateTime, nullable=True)
    priority: Mapped[str] = mapped_column(String(20), default="Medium", nullable=False) # High, Medium, Low
    
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    user = relationship("User", back_populates="tasks")
    email = relationship("Email", back_populates="tasks")
