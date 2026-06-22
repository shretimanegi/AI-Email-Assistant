import uuid
from datetime import datetime, date
from sqlalchemy import DateTime, ForeignKey, Integer, Float, Date
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base

class Analytics(Base):
    __tablename__ = "analytics"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    
    date: Mapped[date] = mapped_column(Date, default=date.today, nullable=False)
    emails_processed_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    average_response_time_seconds: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    meeting_slots_booked_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    user = relationship("User", back_populates="analytics")
