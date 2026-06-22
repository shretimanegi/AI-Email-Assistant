from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import RedirectResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.database import get_db
from app.auth.service import GoogleOAuthService, create_access_token, get_current_user
from app.models.user import User
from app.models.memory import UserMemory
from app.schemas.auth import UserResponse
import urllib.parse

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.get("/login")
def login():
    """Redirects to Google OAuth authorization page."""
    login_url = GoogleOAuthService.get_login_url()
    return {"url": login_url}

@router.get("/callback")
async def callback(code: str = Query(...), db: AsyncSession = Depends(get_db)):
    """Handles OAuth redirect. Exchanged code, upserts User, and redirects to frontend."""
    try:
        token_data = await GoogleOAuthService.exchange_code_for_tokens(code)
        user_info = token_data["user_info"]
        email = user_info["email"]
        name = user_info.get("name", "User")
        picture = user_info.get("picture", "")
        refresh_token = token_data.get("refresh_token")

        # Find or create user
        result = await db.execute(select(User).filter(User.email == email))
        user = result.scalars().first()

        if not user:
            user = User(
                email=email,
                full_name=name,
                avatar_url=picture,
                google_refresh_token=refresh_token
            )
            db.add(user)
            await db.flush() # Flush to get UUID
            
            # Setup initial user memory preferences
            memory = UserMemory(
                user_id=user.id,
                tone_preference="Detailed",
                preferred_meeting_times={"start": "09:00", "end": "17:00", "days": [1,2,3,4,5]},
                learned_contacts_memory={}
            )
            db.add(memory)
        else:
            # Update values
            user.full_name = name
            user.avatar_url = picture
            if refresh_token:
                user.google_refresh_token = refresh_token
        
        await db.commit()
        await db.refresh(user)

        # Create JWT access token
        access_token = create_access_token(data={"sub": str(user.id), "email": user.email})
        
        # Redirect back to frontend dashboard with JWT
        # In a real environment, you'd send this to the frontend URL
        # For local dev, frontend runs on port 3000
        frontend_url = "http://localhost:3000/dashboard"
        redirect_url = f"{frontend_url}?token={urllib.parse.quote(access_token)}"
        return RedirectResponse(url=redirect_url)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"OAuth callback failed: {str(e)}")

@router.get("/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_user)):
    """Retrieve logged-in user profile details."""
    return current_user
