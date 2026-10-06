from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.core.config import settings
from app.core.logging import logger
from app.core.exceptions import AICommerceBaseException
from app.db.database import init_db
from app.api.chat import router as chat_router
from app.api.health import router as health_router
from app.api.admin import router as admin_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup actions
    logger.info("Initializing AI Commerce Agent microservice...")
    await init_db()
    yield
    # Shutdown actions
    logger.info("Shutting down AI Commerce Agent microservice.")


app = FastAPI(
    title="Nova AI Commerce Agent API",
    description="Intelligent 24/7 digital personal shopper and customer concierge for Nova.",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list or ["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(AICommerceBaseException)
async def custom_exception_handler(request: Request, exc: AICommerceBaseException):
    """Converts internal structured exceptions to safe, human-readable JSON responses."""
    logger.warning(f"Handled application exception: {exc.code} - {exc.message}")
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": {
                "code": exc.code,
                "message": exc.message,
                "details": exc.details
            }
        }
    )


@app.exception_handler(Exception)
async def generic_exception_handler(request: Request, exc: Exception):
    """Masks unexpected exceptions from leaking to the customer (AGENTS.md Section 43)."""
    logger.error(f"Unhandled system error on {request.url.path}: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={
            "error": {
                "code": "INTERNAL_ERROR",
                "message": "I couldn't complete that request right now. Please try again."
            }
        }
    )


# Register API Routers
app.include_router(chat_router)
app.include_router(health_router)
app.include_router(admin_router)


@app.get("/", tags=["Root"])
async def root():
    return {
        "service": "Nova AI Commerce Agent Microservice",
        "status": "RUNNING",
        "version": "1.0.0",
        "docs_url": "http://localhost:8001/docs",
        "health_url": "http://localhost:8001/health",
        "description": "24/7 digital personal shopper and customer concierge for Nova."
    }
