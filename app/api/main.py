from contextlib import asynccontextmanager

from fastapi import Depends, FastAPI

from core.context import RequestContext, get_request_context
from core.middleware import ContextMiddleware
from models import register_all_audit_listeners
from routers.audit import router as audit_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan handler for startup/shutdown tasks."""
    # Startup: register audit event listeners
    register_all_audit_listeners()
    yield
    # Shutdown: cleanup if needed


app = FastAPI(title="Cirrus MRO API", lifespan=lifespan)

# Register middleware
app.add_middleware(ContextMiddleware)

# Register routers
app.include_router(audit_router)


@app.get("/")
def main():
    return {"message": "Hello World"}


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
