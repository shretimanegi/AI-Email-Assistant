import uuid
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import List
from app.database import get_db
from app.auth.service import get_current_user
from app.models.user import User
from app.models.task import Task
from app.schemas.task import TaskCreate, TaskUpdate, TaskResponse

router = APIRouter(prefix="/tasks", tags=["Tasks"])

@router.get("", response_model=List[TaskResponse])
async def list_tasks(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """List all action items (extracted and manual) for the logged-in user."""
    stmt = select(Task).filter(Task.user_id == current_user.id).order_by(Task.created_at.desc())
    res = await db.execute(stmt)
    return res.scalars().all()

@router.post("", response_model=TaskResponse)
async def create_task(
    payload: TaskCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Manually add an action item into the task panel."""
    db_task = Task(
        user_id=current_user.id,
        email_id=payload.email_id,
        title=payload.title,
        description=payload.description,
        status=payload.status or "Pending",
        deadline=payload.deadline,
        priority=payload.priority or "Medium"
    )
    db.add(db_task)
    await db.commit()
    await db.refresh(db_task)
    return db_task

@router.patch("/{id}", response_model=TaskResponse)
async def update_task(
    id: uuid.UUID,
    payload: TaskUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Modify task details, priority levels, or complete statuses."""
    stmt = select(Task).filter(Task.id == id, Task.user_id == current_user.id)
    res = await db.execute(stmt)
    db_task = res.scalars().first()
    
    if not db_task:
        raise HTTPException(status_code=404, detail="Action item not found")

    # Update properties
    update_data = payload.model_dump(exclude_unset=True)
    for key, val in update_data.items():
        setattr(db_task, key, val)
        
    await db.commit()
    await db.refresh(db_task)
    return db_task

@router.delete("/{id}")
async def delete_task(
    id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete an action item."""
    stmt = select(Task).filter(Task.id == id, Task.user_id == current_user.id)
    res = await db.execute(stmt)
    db_task = res.scalars().first()
    
    if not db_task:
        raise HTTPException(status_code=404, detail="Action item not found")

    await db.delete(db_task)
    await db.commit()
    return {"message": "Action item removed successfully."}
