from fastapi import APIRouter
from app.routes.auth import router as auth_router
from app.routes.emails import router as emails_router
from app.routes.tasks import router as tasks_router
from app.routes.calendar import router as calendar_router
from app.routes.analytics import router as analytics_router
from app.routes.settings import router as settings_router

api_router = APIRouter()
api_router.include_router(auth_router)
api_router.include_router(emails_router)
api_router.include_router(tasks_router)
api_router.include_router(calendar_router)
api_router.include_router(analytics_router)
api_router.include_router(settings_router)
