import uuid
from datetime import datetime, timedelta, timezone
from typing import Optional, Dict, Any
import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.config import settings
from app.database import get_db
from app.models.user import User
from app.models.memory import UserMemory
import httpx

oauth2_scheme = OAuth2PasswordBearer(tokenUrl=f"{settings.API_V1_STR}/auth/token", auto_error=False)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp": int(expire.timestamp())})
    encoded_jwt = jwt.encode(to_encode, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)
    return encoded_jwt

async def get_current_user(
    token: Optional[str] = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db)
) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    # Fallback/Auto-login for local development if token is not sent
    if not token:
        # Check if we have a default user, otherwise create one
        result = await db.execute(select(User).filter(User.email == "demo@mailmind.ai"))
        user = result.scalars().first()
        if not user:
            user = User(
                id=uuid.UUID("d07bf122-bcda-4a57-8ff7-16d791244ab9"),
                email="demo@mailmind.ai",
                full_name="Demo User",
                avatar_url="https://api.dicebear.com/7.x/avataaars/svg?seed=demo",
                google_refresh_token="mock-refresh-token"
            )
            db.add(user)
            await db.flush()
            
            memory = UserMemory(
                user_id=user.id,
                tone_preference="Detailed",
                preferred_meeting_times={"start": "09:00", "end": "17:00", "days": [1,2,3,4,5]},
                learned_contacts_memory={}
            )
            db.add(memory)
            await db.commit()
            await db.refresh(user)
        return user

    try:
        payload = jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])
        user_id_str: str = payload.get("sub")
        if user_id_str is None:
            raise credentials_exception
        user_uuid = uuid.UUID(user_id_str)
    except (jwt.PyJWTError, ValueError):
        raise credentials_exception
        
    result = await db.execute(select(User).filter(User.id == user_uuid))
    user = result.scalars().first()
    if user is None:
        raise credentials_exception
        
    return user

class GoogleOAuthService:
    @staticmethod
    def get_login_url() -> str:
        # If client ID is mock, return a mock success callback route
        if settings.GOOGLE_CLIENT_ID == "mock-client-id.apps.googleusercontent.com":
            return f"http://localhost:8000{settings.API_V1_STR}/auth/callback?code=mock-code-123"

        base_url = "https://accounts.google.com/o/oauth2/v2/auth"
        params = {
            "client_id": settings.GOOGLE_CLIENT_ID,
            "redirect_uri": settings.GOOGLE_REDIRECT_URI,
            "response_type": "code",
            "scope": "openid email profile https://www.googleapis.com/auth/gmail.modify https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/contacts.readonly",
            "access_type": "offline",
            "prompt": "consent"
        }
        query_string = "&".join(f"{k}={v}" for k, v in params.items())
        return f"{base_url}?{query_string}"

    @staticmethod
    async def exchange_code_for_tokens(code: str) -> Dict[str, Any]:
        if code == "mock-code-123" or settings.GOOGLE_CLIENT_ID == "mock-client-id.apps.googleusercontent.com":
            return {
                "access_token": "mock-access-token",
                "refresh_token": "mock-refresh-token",
                "id_token": "mock-id-token",
                "user_info": {
                    "email": "demo@mailmind.ai",
                    "name": "Demo User",
                    "picture": "https://api.dicebear.com/7.x/avataaars/svg?seed=demo"
                }
            }

        token_url = "https://oauth2.googleapis.com/token"
        data = {
            "code": code,
            "client_id": settings.GOOGLE_CLIENT_ID,
            "client_secret": settings.GOOGLE_CLIENT_SECRET,
            "redirect_uri": settings.GOOGLE_REDIRECT_URI,
            "grant_type": "authorization_code"
        }
        
        async with httpx.AsyncClient() as client:
            res = await client.post(token_url, data=data)
            if res.status_code != 200:
                raise HTTPException(status_code=400, detail="Failed to exchange Google OAuth code")
            
            tokens = res.json()
            
            # Fetch user info
            userinfo_url = "https://www.googleapis.com/oauth2/v3/userinfo"
            headers = {"Authorization": f"Bearer {tokens['access_token']}"}
            userinfo_res = await client.get(userinfo_url, headers=headers)
            
            if userinfo_res.status_code != 200:
                raise HTTPException(status_code=400, detail="Failed to fetch user profile info")
                
            tokens["user_info"] = userinfo_res.json()
            return tokens
