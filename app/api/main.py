from contextlib import asynccontextmanager

from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware

from core.config import get_settings
from core.context import RequestContext, get_request_context
from core.middleware import ContextMiddleware
from models import register_all_audit_listeners
from routers import (
    cities_router,
    work_orders_router,
    work_order_items_router,
    labor_kits_router,
    labor_kit_items_router,
    aircraft_router,
)
from routers.audit import router as audit_router

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan handler for startup/shutdown tasks."""
    # Startup: register audit event listeners
    register_all_audit_listeners()
    yield
    # Shutdown: cleanup if needed


app = FastAPI(
    title="Cirrus MRO API",
    description="Work Order Management System API",
    version="0.1.0",
    lifespan=lifespan,
)

# CORS middleware for development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register context middleware for audit tracking
app.add_middleware(ContextMiddleware)

# Register routers
app.include_router(audit_router)
app.include_router(cities_router, prefix=settings.api_v1_prefix)
app.include_router(work_orders_router, prefix=settings.api_v1_prefix)
app.include_router(work_order_items_router, prefix=settings.api_v1_prefix)
app.include_router(labor_kits_router, prefix=settings.api_v1_prefix)
app.include_router(labor_kit_items_router, prefix=settings.api_v1_prefix)
app.include_router(aircraft_router, prefix=settings.api_v1_prefix)


@app.get("/")
def root():
    return {"message": "Cirrus MRO API", "version": "0.1.0"}


@app.get("/health")
def health(context: RequestContext = Depends(get_request_context)):
    """Health check endpoint that demonstrates context access."""
    return {
        "status": "healthy",
        "context": {
            "user_id": context.user_id,
            "session_id": context.session_id,
            "ip_address": context.ip_address,
        },
    }
