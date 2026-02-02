"""HTTP middleware for request context extraction."""

import uuid

from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware

from .context import RequestContext, set_current_context


class ContextMiddleware(BaseHTTPMiddleware):
    """Middleware to extract and store request context."""

    async def dispatch(self, request: Request, call_next):
        # Extract user_id from header (None if not provided)
        user_id = request.headers.get("X-User-ID")

        # Extract or generate session_id
        session_id = request.headers.get("X-Session-ID")
        if not session_id:
            session_id = str(uuid.uuid4())

        # Extract client IP
        ip_address = None
        if request.client:
            ip_address = request.client.host

        # Create context
        context = RequestContext(
            user_id=user_id,
            session_id=session_id,
            ip_address=ip_address,
        )

        # Store in request state for dependency injection
        request.state.context = context

        # Store in context var for non-request code paths
        set_current_context(context)

        response = await call_next(request)
        return response
