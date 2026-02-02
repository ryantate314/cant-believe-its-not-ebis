# Feature: Request Context Middleware

## Summary

Implement FastAPI middleware that automatically captures user identity (user_id), client IP address, and session ID from incoming requests, making this context available to downstream route handlers and the audit logging infrastructure. This establishes the foundation for non-repudiation in the audit trail.

## User Story

As a developer implementing audited entities in Cirrus MRO
I want request context (user_id, IP, session_id) automatically captured for every request
So that audit log entries have complete attribution without manual context passing

## Problem Statement

The audit logging infrastructure (Phase 1) has fields for `user_id`, `session_id`, and `ip_address`, but no mechanism exists to capture these values from incoming HTTP requests. Without automatic context capture, developers would need to manually extract and pass user context through every function call, leading to inconsistent attribution and potential compliance gaps.

## Solution Statement

Create a FastAPI middleware that intercepts all HTTP requests, extracts user context from headers and connection metadata, and stores it in `request.state` for downstream access. Provide a dependency injection function for route handlers and a context accessor for the change capture mechanism (Phase 3).

## Metadata

| Field            | Value                                                      |
| ---------------- | ---------------------------------------------------------- |
| Type             | NEW_CAPABILITY                                             |
| Complexity       | LOW                                                        |
| Systems Affected | FastAPI application startup, request lifecycle             |
| Dependencies     | fastapi>=0.128.0 (already installed)                       |
| Estimated Tasks  | 6                                                          |

---

## UX Design

### Before State

```
╔═══════════════════════════════════════════════════════════════════════════════╗
║                              BEFORE STATE                                      ║
╠═══════════════════════════════════════════════════════════════════════════════╣
║                                                                               ║
║   ┌─────────────┐         ┌─────────────┐         ┌─────────────┐            ║
║   │   HTTP      │ ──────► │   FastAPI   │ ──────► │   Route     │            ║
║   │   Request   │         │   (no MW)   │         │   Handler   │            ║
║   └─────────────┘         └─────────────┘         └─────────────┘            ║
║                                                          │                    ║
║                                                          ▼                    ║
║                                                   ┌─────────────┐            ║
║                                                   │ Audit Log   │            ║
║                                                   │ user_id=?   │            ║
║                                                   │ session=?   │            ║
║                                                   │ ip=?        │            ║
║                                                   └─────────────┘            ║
║                                                                               ║
║   USER_FLOW: Request arrives → Handler executes → Audit log has NULL context ║
║   PAIN_POINT: No automatic extraction of user identity from request           ║
║   DATA_FLOW: User context in headers is ignored; audit fields remain empty    ║
║                                                                               ║
╚═══════════════════════════════════════════════════════════════════════════════╝
```

### After State

```
╔═══════════════════════════════════════════════════════════════════════════════╗
║                               AFTER STATE                                      ║
╠═══════════════════════════════════════════════════════════════════════════════╣
║                                                                               ║
║   ┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌───────────┐  ║
║   │   HTTP      │ ──► │  Context    │ ──► │   Route     │ ──► │  Audit    │  ║
║   │   Request   │     │  Middleware │     │   Handler   │     │  Log      │  ║
║   │             │     │             │     │             │     │           │  ║
║   │ Headers:    │     │ Extracts:   │     │ Accesses:   │     │ Records:  │  ║
║   │ X-User-ID   │     │ user_id     │     │ via Depends │     │ user_id   │  ║
║   │ X-Session   │     │ session_id  │     │ or state    │     │ session   │  ║
║   │ Client IP   │     │ ip_address  │     │             │     │ ip_addr   │  ║
║   └─────────────┘     └─────────────┘     └─────────────┘     └───────────┘  ║
║                              │                                                ║
║                              ▼                                                ║
║                       ┌─────────────┐                                         ║
║                       │request.state│  ◄── Context stored per-request        ║
║                       │  .context   │                                         ║
║                       └─────────────┘                                         ║
║                                                                               ║
║   USER_FLOW: Request → Middleware extracts context → Handler uses it          ║
║   VALUE_ADD: Automatic, consistent user attribution for all audit entries     ║
║   DATA_FLOW: Headers → request.state.context → audit_log columns              ║
║                                                                               ║
╚═══════════════════════════════════════════════════════════════════════════════╝
```

### Interaction Changes

| Location | Before | After | User Impact |
|----------|--------|-------|-------------|
| `main.py` | No middleware | Context middleware registered | All requests get context extraction |
| Route handlers | No context access | `Depends(get_request_context)` available | Easy access to user context |
| Audit logging | NULL user fields | Populated from context | Complete attribution for compliance |

---

## Mandatory Reading

**CRITICAL: Implementation agent MUST read these files before starting any task:**

| Priority | File | Lines | Why Read This |
|----------|------|-------|---------------|
| P0 | `app/api/main.py` | all | Current app structure to UPDATE |
| P0 | `database/migrations/V005__create_audit_log_table.sql` | 22-25 | Fields we're populating: user_id, session_id, ip_address |
| P1 | `database/migrations/V002__create_work_order_table.sql` | 34-35 | Existing created_by pattern (VARCHAR(100)) |
| P1 | `app/api/.env` | all | Database connection pattern for reference |

**External Documentation:**

| Source | Section | Why Needed |
|--------|---------|------------|
| [FastAPI Middleware](https://fastapi.tiangolo.com/tutorial/middleware/) | Creating middleware | Official middleware pattern |
| [FastAPI Request.state](https://mikehuls.com/adding-context-to-each-fastapi-request-using-request-state/) | Request state pattern | How to store per-request context |
| [FastAPI Dependencies](https://fastapi.tiangolo.com/tutorial/dependencies/) | Depends pattern | For route-level access to context |

---

## Patterns to Mirror

**MIDDLEWARE_PATTERN (FastAPI standard):**
```python
# SOURCE: FastAPI documentation
# COPY THIS PATTERN:
@app.middleware("http")
async def middleware_function(request: Request, call_next):
    # Pre-processing
    response = await call_next(request)
    # Post-processing
    return response
```

**REQUEST_STATE_PATTERN:**
```python
# SOURCE: FastAPI request state pattern
# COPY THIS PATTERN:
request.state.context = ContextObject()
# Access later via: request.state.context
```

**DEPENDENCY_INJECTION_PATTERN:**
```python
# SOURCE: FastAPI Depends pattern
# COPY THIS PATTERN:
async def get_dependency(request: Request) -> SomeType:
    return request.state.some_value

@app.get("/endpoint")
async def handler(dep: SomeType = Depends(get_dependency)):
    pass
```

**DATACLASS_PATTERN (existing Python standard):**
```python
# SOURCE: Python dataclasses
# COPY THIS PATTERN:
from dataclasses import dataclass

@dataclass
class DataHolder:
    field1: str
    field2: str | None = None
```

---

## Files to Change

| File                                  | Action | Justification                                      |
| ------------------------------------- | ------ | -------------------------------------------------- |
| `app/api/core/__init__.py`            | CREATE | Package initialization for core module             |
| `app/api/core/context.py`             | CREATE | RequestContext dataclass and accessor functions    |
| `app/api/core/middleware.py`          | CREATE | HTTP middleware for context extraction             |
| `app/api/main.py`                     | UPDATE | Register middleware with FastAPI app               |
| `app/api/tests/unit/__init__.py`      | CREATE | Package initialization for unit tests              |
| `app/api/tests/unit/test_context.py`  | CREATE | Unit tests for context extraction                  |

---

## NOT Building (Scope Limits)

Explicit exclusions to prevent scope creep:

- **JWT token parsing/validation** - user_id comes from header, auth is separate concern
- **Database user lookup** - user_id is a string, no foreign key relationship
- **Rate limiting** - separate middleware concern
- **Request logging/tracing** - could use context but not implementing logger integration
- **Forwarded IP chain parsing** - use simple client IP, X-Forwarded-For handling deferred
- **Authentication enforcement** - anonymous users allowed (user_id can be null/anonymous)

---

## Step-by-Step Tasks

Execute in order. Each task is atomic and independently verifiable.

### Task 1: CREATE `app/api/core/__init__.py`

- **ACTION**: CREATE package initialization file
- **IMPLEMENT**: Empty `__init__.py` to make `core` a proper Python package
- **CONTENT**:
```python
"""Core module for shared infrastructure components."""
```
- **VALIDATE**: `cd /home/ibrahimaslam/repos/cirrus/cant-believe-its-not-ebis/app/api && python -c "import core"`

### Task 2: CREATE `app/api/core/context.py`

- **ACTION**: CREATE request context dataclass and accessor functions
- **IMPLEMENT**:
  - `RequestContext` dataclass with fields: `user_id`, `session_id`, `ip_address`
  - `get_request_context(request: Request) -> RequestContext` dependency function
  - `get_current_context() -> RequestContext | None` accessor for non-request contexts
- **IMPORTS**:
```python
from dataclasses import dataclass
from contextvars import ContextVar
from fastapi import Request
```
- **DATACLASS**:
```python
@dataclass
class RequestContext:
    user_id: str | None
    session_id: str
    ip_address: str | None
```
- **CONTEXT_VAR**:
```python
_request_context: ContextVar[RequestContext | None] = ContextVar("request_context", default=None)
```
- **DEPENDENCY**:
```python
def get_request_context(request: Request) -> RequestContext:
    """FastAPI dependency to get request context."""
    context = getattr(request.state, "context", None)
    if context is None:
        raise RuntimeError("Request context not initialized. Is middleware registered?")
    return context
```
- **ACCESSOR**:
```python
def get_current_context() -> RequestContext | None:
    """Get current request context from context var (for non-request code paths)."""
    return _request_context.get()

def set_current_context(context: RequestContext) -> None:
    """Set current request context (called by middleware)."""
    _request_context.set(context)
```
- **GOTCHA**: Use `str | None` union syntax (Python 3.12+), not `Optional[str]`
- **VALIDATE**: `cd /home/ibrahimaslam/repos/cirrus/cant-believe-its-not-ebis/app/api && python -c "from core.context import RequestContext, get_request_context"`

### Task 3: CREATE `app/api/core/middleware.py`

- **ACTION**: CREATE HTTP middleware for context extraction
- **IMPLEMENT**:
  - `ContextMiddleware` class or `context_middleware` function
  - Extract `X-User-ID` header (default: None for anonymous)
  - Extract `X-Session-ID` header or generate UUID if missing
  - Extract client IP from `request.client.host`
  - Store `RequestContext` in `request.state.context`
  - Also set context var for non-request code paths
- **IMPORTS**:
```python
import uuid
from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.types import ASGIApp
from .context import RequestContext, set_current_context
```
- **IMPLEMENTATION**:
```python
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
```
- **GOTCHA**: Use `BaseHTTPMiddleware` from starlette, not raw ASGI - simpler and sufficient for this use case
- **VALIDATE**: `cd /home/ibrahimaslam/repos/cirrus/cant-believe-its-not-ebis/app/api && python -c "from core.middleware import ContextMiddleware"`

### Task 4: UPDATE `app/api/main.py`

- **ACTION**: UPDATE to register middleware and demonstrate context access
- **IMPLEMENT**:
  - Import `ContextMiddleware` from `core.middleware`
  - Register middleware with `app.add_middleware()`
  - Update existing route to demonstrate context access (optional but useful for testing)
- **CURRENT_CONTENT** (main.py lines 1-6):
```python
from fastapi import FastAPI
app = FastAPI()

@app.get("/")
def main():
    return {"message": "Hello World"}
```
- **NEW_CONTENT**:
```python
from fastapi import FastAPI, Request, Depends

from core.middleware import ContextMiddleware
from core.context import RequestContext, get_request_context

app = FastAPI(title="Cirrus MRO API")

# Register middleware
app.add_middleware(ContextMiddleware)


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
        }
    }
```
- **GOTCHA**: Middleware order matters - add_middleware adds to the TOP of the stack (first added = executed last)
- **VALIDATE**: `cd /home/ibrahimaslam/repos/cirrus/cant-believe-its-not-ebis/app/api && uv run python -c "from main import app; print(app.middleware_stack)"`

### Task 5: CREATE `app/api/tests/unit/__init__.py`

- **ACTION**: CREATE package initialization for unit tests
- **IMPLEMENT**: Empty `__init__.py`
- **CONTENT**:
```python
"""Unit tests for API components."""
```
- **VALIDATE**: `ls /home/ibrahimaslam/repos/cirrus/cant-believe-its-not-ebis/app/api/tests/unit/__init__.py`

### Task 6: CREATE `app/api/tests/unit/test_context.py`

- **ACTION**: CREATE unit tests for context middleware
- **IMPLEMENT**:
  - Test middleware extracts user_id from header
  - Test middleware extracts session_id from header
  - Test middleware generates session_id when missing
  - Test middleware extracts IP address
  - Test anonymous request (no X-User-ID header)
  - Test dependency function returns context
- **IMPORTS**:
```python
import pytest
from fastapi.testclient import TestClient
from main import app
```
- **TEST_CASES**:
```python
def test_context_extracts_user_id():
    """User ID is extracted from X-User-ID header."""
    client = TestClient(app)
    response = client.get("/health", headers={"X-User-ID": "test-user"})
    assert response.status_code == 200
    data = response.json()
    assert data["context"]["user_id"] == "test-user"


def test_context_extracts_session_id():
    """Session ID is extracted from X-Session-ID header."""
    client = TestClient(app)
    response = client.get("/health", headers={"X-Session-ID": "test-session-123"})
    assert response.status_code == 200
    data = response.json()
    assert data["context"]["session_id"] == "test-session-123"


def test_context_generates_session_id_when_missing():
    """Session ID is generated as UUID when header is missing."""
    client = TestClient(app)
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    session_id = data["context"]["session_id"]
    # Verify it's a valid UUID format (36 chars with hyphens)
    assert len(session_id) == 36
    assert session_id.count("-") == 4


def test_context_captures_ip_address():
    """IP address is captured from client connection."""
    client = TestClient(app)
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    # TestClient uses testclient as host
    assert data["context"]["ip_address"] == "testclient"


def test_context_allows_anonymous_user():
    """Anonymous requests have user_id as None."""
    client = TestClient(app)
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["context"]["user_id"] is None


def test_context_full_headers():
    """All context fields are properly extracted when all headers present."""
    client = TestClient(app)
    response = client.get(
        "/health",
        headers={
            "X-User-ID": "user-456",
            "X-Session-ID": "session-789",
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert data["context"]["user_id"] == "user-456"
    assert data["context"]["session_id"] == "session-789"
```
- **VALIDATE**: `cd /home/ibrahimaslam/repos/cirrus/cant-believe-its-not-ebis/app/api && uv run pytest tests/unit/test_context.py -v`

---

## Testing Strategy

### Unit Tests to Write

| Test File | Test Cases | Validates |
|-----------|------------|-----------|
| `tests/unit/test_context.py` | 6 tests (see Task 6) | Middleware extraction, generation, dependency |

### Edge Cases Checklist

- [x] Missing X-User-ID header → user_id is None (anonymous)
- [x] Missing X-Session-ID header → UUID generated
- [x] Empty string headers → treated as provided (not None)
- [x] Very long user_id (>100 chars) → passed through (validation at audit insert)
- [x] No client IP available → ip_address is None

### Integration Test (Manual)

After implementation, verify with curl:
```bash
# Start server
cd app/api && uv run fastapi dev

# Test with headers
curl -H "X-User-ID: test-user" -H "X-Session-ID: sess-123" http://localhost:8000/health

# Test anonymous
curl http://localhost:8000/health
```

---

## Validation Commands

### Level 1: STATIC_ANALYSIS

```bash
cd /home/ibrahimaslam/repos/cirrus/cant-believe-its-not-ebis/app/api && uv run python -m py_compile main.py core/context.py core/middleware.py
```

**EXPECT**: Exit 0, no syntax errors

### Level 2: IMPORT_VALIDATION

```bash
cd /home/ibrahimaslam/repos/cirrus/cant-believe-its-not-ebis/app/api && uv run python -c "from main import app; from core.context import RequestContext, get_request_context; from core.middleware import ContextMiddleware; print('All imports successful')"
```

**EXPECT**: "All imports successful"

### Level 3: UNIT_TESTS

```bash
cd /home/ibrahimaslam/repos/cirrus/cant-believe-its-not-ebis/app/api && uv run pytest tests/unit/test_context.py -v
```

**EXPECT**: All 6 tests pass

### Level 4: SERVER_STARTUP

```bash
cd /home/ibrahimaslam/repos/cirrus/cant-believe-its-not-ebis/app/api && timeout 5 uv run fastapi dev --host 127.0.0.1 --port 8000 || true
```

**EXPECT**: Server starts without errors (will timeout after 5s which is expected)

### Level 5: MANUAL_VALIDATION

1. Start server: `cd app/api && uv run fastapi dev`
2. Test health endpoint with headers:
   ```bash
   curl -s http://localhost:8000/health | python -m json.tool
   ```
3. Test with user context:
   ```bash
   curl -s -H "X-User-ID: manual-test" -H "X-Session-ID: manual-session" http://localhost:8000/health | python -m json.tool
   ```
4. Verify response contains correct context values

---

## Acceptance Criteria

- [x] Middleware registered and executes on every request
- [x] user_id extracted from X-User-ID header (None if missing)
- [x] session_id extracted from X-Session-ID header (UUID generated if missing)
- [x] ip_address extracted from request.client.host
- [x] RequestContext available via `Depends(get_request_context)` in route handlers
- [x] RequestContext available via `get_current_context()` for non-request code
- [x] All unit tests pass
- [x] Server starts and responds correctly

---

## Completion Checklist

- [ ] Task 1: core/__init__.py created
- [ ] Task 2: core/context.py created with RequestContext dataclass
- [ ] Task 3: core/middleware.py created with ContextMiddleware
- [ ] Task 4: main.py updated with middleware registration
- [ ] Task 5: tests/unit/__init__.py created
- [ ] Task 6: tests/unit/test_context.py created with all tests
- [ ] Level 1: Static analysis passes
- [ ] Level 2: Import validation passes
- [ ] Level 3: Unit tests pass
- [ ] Level 4: Server starts successfully
- [ ] Level 5: Manual validation confirms correct behavior

---

## Risks and Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| TestClient IP differs from real clients | LOW | LOW | Test uses "testclient" string; real clients use actual IP |
| Context var not reset between requests | LOW | MEDIUM | BaseHTTPMiddleware handles request isolation |
| Missing pytest dependency | LOW | MEDIUM | Add pytest to dev dependencies if needed |

---

## Notes

**Header Convention Decisions:**
- `X-User-ID`: Custom header for user identity. Frontend/API gateway must set this.
- `X-Session-ID`: Optional request correlation ID. Useful for tracing related requests.
- Future consideration: Support `Authorization: Bearer <token>` with JWT parsing.

**Integration with Phase 3:**
The `get_current_context()` function is designed for use in the change capture mechanism (Phase 3). When SQLAlchemy event listeners fire, they can call `get_current_context()` to get the user context without having access to the FastAPI Request object.

**Future Enhancements (out of scope):**
- Parse `X-Forwarded-For` header for reverse proxy scenarios
- JWT token validation and claims extraction
- Rate limiting based on user_id
- Request logging with correlation ID
