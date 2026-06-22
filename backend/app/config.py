import os
from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field

class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

    # Project Metadata
    PROJECT_NAME: str = "MailMind AI Backend"
    API_V1_STR: str = "/api/v1"
    
    # Security & Encryption
    # In production, these must be set via environment variables.
    SECRET_KEY: str = Field(default="supersecretkeyfor-mailmind-ai-encryption-2026", validation_alias="SECRET_KEY")
    JWT_SECRET: str = Field(default="jwtsecretkeyfor-mailmind-ai-authentication-jwt", validation_alias="JWT_SECRET")
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days

    # Databases
    DATABASE_URL: str = Field(default="sqlite+aiosqlite:///./mailmind.db", validation_alias="DATABASE_URL")
    REDIS_URL: str = Field(default="redis://localhost:6379/0", validation_alias="REDIS_URL")
    
    # Gemini API Key
    GEMINI_API_KEY: str = Field(default="", validation_alias="GEMINI_API_KEY")

    # Google OAuth 2.0 Credentials
    GOOGLE_CLIENT_ID: str = Field(default="mock-client-id.apps.googleusercontent.com", validation_alias="GOOGLE_CLIENT_ID")
    GOOGLE_CLIENT_SECRET: str = Field(default="mock-client-secret", validation_alias="GOOGLE_CLIENT_SECRET")
    GOOGLE_REDIRECT_URI: str = Field(default="http://localhost:8000/api/v1/auth/callback", validation_alias="GOOGLE_REDIRECT_URI")

    # CORS Origins (comma separated in env)
    BACKEND_CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3001",
        "https://mailmind-ai.vercel.app",  # Production frontend URL example
    ]

settings = Settings()
