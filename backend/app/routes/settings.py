from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.database import get_db
from app.auth.service import get_current_user
from app.models.user import User
from app.models.memory import UserMemory
from app.schemas.settings import UserMemoryResponse, SettingsUpdateRequest

router = APIRouter(prefix="/settings", tags=["Settings"])

@router.get("", response_model=UserMemoryResponse)
async def get_settings(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Fetch user settings, tone preferences, and calendar booking constraints."""
    stmt = select(UserMemory).filter(UserMemory.user_id == current_user.id)
    res = await db.execute(stmt)
    memory = res.scalars().first()
    
    if not memory:
        # Create memory entry if missing
        memory = UserMemory(
            user_id=current_user.id,
            tone_preference="Detailed",
            preferred_meeting_times={"start": "09:00", "end": "17:00", "days": [1,2,3,4,5]},
            learned_contacts_memory={}
        )
        db.add(memory)
        await db.commit()
        await db.refresh(memory)
        
    return memory

@router.put("", response_model=UserMemoryResponse)
async def update_settings(
    payload: SettingsUpdateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Modify user preferences and agent personalization variables."""
    stmt = select(UserMemory).filter(UserMemory.user_id == current_user.id)
    res = await db.execute(stmt)
    memory = res.scalars().first()
    
    if not memory:
        raise HTTPException(status_code=404, detail="Settings memory not found")

    update_data = payload.model_dump(exclude_unset=True)
    for key, val in update_data.items():
        setattr(memory, key, val)
        
    await db.commit()
    await db.refresh(memory)
    return memory
