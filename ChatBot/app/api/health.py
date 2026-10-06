import httpx
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from app.db.database import get_db
from app.core.config import settings

router = APIRouter(tags=["Health"])


@router.get("/health")
async def health_check():
    """Liveness probe endpoint."""
    return {
        "status": "ok",
        "service": "ai-commerce-agent",
        "environment": settings.AI_AGENT_ENV,
        "version": "1.0.0"
    }


@router.get("/health/dependencies")
async def dependencies_check(db: AsyncSession = Depends(get_db)):
    """Deep readiness probe checking Spring Boot and database connections."""
    results = {
        "database": "unknown",
        "spring_boot": "unknown",
        "llm_provider": settings.AI_PROVIDER
    }

    # 1. Database check
    try:
        await db.execute(text("SELECT 1"))
        results["database"] = "healthy"
    except Exception as e:
        results["database"] = f"unhealthy: {str(e)}"

    # 2. Spring Boot check
    try:
        async with httpx.AsyncClient(timeout=3) as client:
            res = await client.get(f"{settings.SPRING_BOOT_BASE_URL}/api/products?page=0&size=1")
            results["spring_boot"] = "healthy" if res.status_code in [200, 401, 403] else f"status_{res.status_code}"
    except Exception as e:
        results["spring_boot"] = f"unreachable: {str(e)}"

    return {
        "status": "ok" if results["database"] == "healthy" else "degraded",
        "dependencies": results
    }
