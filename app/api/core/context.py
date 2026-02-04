"""Request context management for audit logging."""

from contextvars import ContextVar
from dataclasses import dataclass

from fastapi import Request


@dataclass
class RequestContext:
    """Context information extracted from HTTP requests for audit logging."""

    user_id: str | None
    session_id: str
    ip_address: str | None


_request_context: ContextVar[RequestContext | None] = ContextVar(
    "request_context", default=None
)


def get_request_context(request: Request) -> RequestContext:
    """FastAPI dependency to get request context."""
    context = getattr(request.state, "context", None)
    if context is None:
        raise RuntimeError("Request context not initialized. Is middleware registered?")
    return context


def get_current_context() -> RequestContext | None:
    """Get current request context from context var (for non-request code paths)."""
    return _request_context.get()


def set_current_context(context: RequestContext) -> None:
    """Set current request context (called by middleware)."""
    _request_context.set(context)
