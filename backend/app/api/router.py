from fastapi import APIRouter

from app.api.routes import alerts, coins, dashboard, health, influence, models, replay, social

api_router = APIRouter()
api_router.include_router(health.router, tags=["health"])
api_router.include_router(dashboard.router, prefix="/dashboard", tags=["dashboard"])
api_router.include_router(coins.router, prefix="/coins", tags=["coins"])
api_router.include_router(alerts.router, prefix="/alerts", tags=["alerts"])
api_router.include_router(influence.router, prefix="/influence", tags=["influence"])
api_router.include_router(social.router, prefix="/social", tags=["social"])
api_router.include_router(models.router, prefix="/models", tags=["models"])
api_router.include_router(replay.router, prefix="/replay", tags=["replay"])
