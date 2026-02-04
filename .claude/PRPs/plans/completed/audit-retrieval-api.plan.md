# Feature: Audit Retrieval API

## Summary

Implement a FastAPI endpoint `GET /api/v1/audit/{entity_type}/{entity_id}` that retrieves the complete change history for any audited entity, with support for filtering by date range, action type, and user, plus cursor-based pagination. This enables compliance officers and future UI components to access immutable audit trails programmatically.

## User Story

As a compliance officer preparing for an FAA/EASA audit
I want to retrieve the complete change history for any entity via API
So that I can demonstrate full maintenance traceability and investigate discrepancies

## Problem Statement

Phases 1-3 established the audit infrastructure: immutable storage (Phase 1), request context capture (Phase 2), and automatic change logging (Phase 3). However, there is no way to retrieve this audit data. Without an API endpoint, the audit log is write-only and provides no value for compliance demonstrations or investigations.

## Solution Statement

Create a FastAPI router with a single endpoint that queries the `audit_log` table filtered by `entity_type` and `entity_id`, with optional filtering by date range, action type, and user. Implement offset-based pagination with configurable page size. Return Pydantic-validated responses with proper datetime serialization and JSONB handling.

## Metadata

| Field            | Value                                             |
| ---------------- | ------------------------------------------------- |
| Type             | NEW_CAPABILITY                                    |
| Complexity       | MEDIUM                                            |
| Systems Affected | FastAPI routes, database queries, response models |
| Dependencies     | fastapi>=0.128.0, sqlalchemy>=2.0.0 (already installed), pydantic (bundled with fastapi) |
| Estimated Tasks  | 8                                                 |

---

## UX Design

### Before State

```
╔═══════════════════════════════════════════════════════════════════════════════╗
║                              BEFORE STATE                                      ║
╠═══════════════════════════════════════════════════════════════════════════════╣
║                                                                               ║
║   ┌─────────────┐         ┌─────────────┐         ┌─────────────┐            ║
║   │   Client    │ ──────► │   FastAPI   │ ──────► │   ???       │            ║
║   │  (wants     │         │  (no audit  │         │  No access  │            ║
║   │   history)  │         │   endpoint) │         │  to data    │            ║
║   └─────────────┘         └─────────────┘         └─────────────┘            ║
║                                                                               ║
║                           ┌─────────────┐                                     ║
║                           │ audit_log   │  ◄── Data exists but inaccessible  ║
║                           │ (write-only)│                                     ║
║                           └─────────────┘                                     ║
║                                                                               ║
║   USER_FLOW: Client needs audit data → No API exists → Cannot retrieve       ║
║   PAIN_POINT: Audit infrastructure captures data but provides no read access ║
║   DATA_FLOW: INSERT from change capture → audit_log → dead end               ║
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
║   │   Client    │ ──► │   FastAPI   │ ──► │   Audit     │ ──► │  JSON     │  ║
║   │  GET /api/  │     │   Router    │     │   Query     │     │  Response │  ║
║   │  v1/audit/  │     │             │     │             │     │           │  ║
║   │  {type}/    │     │ Validates:  │     │ Filters:    │     │ Returns:  │  ║
║   │  {id}       │     │ - params    │     │ - entity    │     │ - items[] │  ║
║   │  ?filters   │     │ - pagination│     │ - date      │     │ - total   │  ║
║   │             │     │ - dates     │     │ - action    │     │ - page    │  ║
║   └─────────────┘     └─────────────┘     │ - user      │     │ - has_next│  ║
║                                           └─────────────┘     └───────────┘  ║
║                              │                   │                            ║
║                              ▼                   ▼                            ║
║                       ┌─────────────┐     ┌─────────────┐                    ║
║                       │  Pydantic   │     │  audit_log  │                    ║
║                       │  Schemas    │     │   table     │                    ║
║                       └─────────────┘     └─────────────┘                    ║
║                                                                               ║
║   USER_FLOW: GET request → Validate → Query → Paginate → Return JSON        ║
║   VALUE_ADD: Full audit history accessible via standard REST API             ║
║   DATA_FLOW: Query params → SQLAlchemy → audit_log → Pydantic → JSON        ║
║                                                                               ║
╚═══════════════════════════════════════════════════════════════════════════════╝
```

### Interaction Changes

| Location | Before | After | User Impact |
|----------|--------|-------|-------------|
| `/api/v1/audit/{type}/{id}` | 404 Not Found | Returns paginated audit history | Compliance officers can retrieve data |
| Query parameters | N/A | `from_date`, `to_date`, `action`, `user_id`, `page`, `page_size` | Flexible filtering for investigations |
| Response format | N/A | Structured JSON with pagination metadata | Easy integration with UI components |

---

## Mandatory Reading

**CRITICAL: Implementation agent MUST read these files before starting any task:**

| Priority | File | Lines | Why Read This |
|----------|------|-------|---------------|
| P0 | `app/api/main.py` | all | App structure, middleware registration, pattern to EXTEND |
| P0 | `app/api/models/audit_log.py` | all | AuditLog model - exact field types to map |
| P0 | `app/api/core/database.py` | 34-43 | `get_session` dependency pattern to USE |
| P1 | `database/migrations/V005__create_audit_log_table.sql` | 45-55 | Index names for query optimization |
| P1 | `app/api/tests/integration/test_audit_capture.py` | 91-98 | SQLAlchemy query pattern to MIRROR |
| P2 | `app/api/core/context.py` | all | RequestContext pattern for reference |

**External Documentation:**

| Source | Section | Why Needed |
|--------|---------|------------|
| [FastAPI Query Parameters](https://fastapi.tiangolo.com/tutorial/query-params/) | Query parameter validation | Optional filter parameters |
| [FastAPI Response Model](https://fastapi.tiangolo.com/tutorial/response-model/) | response_model parameter | Typed API responses |
| [Pydantic model_config](https://docs.pydantic.dev/latest/api/config/#pydantic.config.ConfigDict.from_attributes) | from_attributes | SQLAlchemy model conversion |
| [SQLAlchemy 2.0 Select](https://docs.sqlalchemy.org/en/20/orm/queryguide/select.html) | Offset/limit patterns | Pagination queries |

---

## Patterns to Mirror

**ROUTE_DEFINITION_PATTERN:**
```python
# SOURCE: app/api/main.py:30-40
# COPY THIS PATTERN:
@app.get("/health")
def health(context: RequestContext = Depends(get_request_context)):
    """Health check endpoint that demonstrates context access."""
    return {
        "status": "healthy",
        "context": {...},
    }
```

**DATABASE_SESSION_PATTERN:**
```python
# SOURCE: app/api/core/database.py:34-43
# USE THIS DEPENDENCY:
async def get_session() -> AsyncGenerator[AsyncSession, None]:
    """FastAPI dependency that provides a database session."""
    async with async_session_factory() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
```

**SQLALCHEMY_QUERY_PATTERN:**
```python
# SOURCE: app/api/tests/integration/test_audit_capture.py:91-98
# COPY THIS PATTERN:
result = await db_session.execute(
    select(AuditLog).where(
        AuditLog.entity_type == "work_order",
        AuditLog.entity_id == work_order.uuid,
        AuditLog.action == "INSERT",
    )
)
audit_record = result.scalar_one_or_none()
```

**PYDANTIC_MODEL_PATTERN:**
```python
# SOURCE: FastAPI/Pydantic conventions
# COPY THIS PATTERN:
from pydantic import BaseModel, ConfigDict

class AuditRecordResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    entity_type: str
    # ... fields match AuditLog model
```

**AUDIT_LOG_MODEL_FIELDS:**
```python
# SOURCE: app/api/models/audit_log.py:14-40
# THESE ARE THE FIELDS TO EXPOSE:
id: Mapped[int]                                    # BigInteger primary key
entity_type: Mapped[str]                           # String(100)
entity_id: Mapped[UUID]                            # UUID
action: Mapped[str]                                # Enum: INSERT, UPDATE, DELETE
old_values: Mapped[dict[str, Any] | None]          # JSONB
new_values: Mapped[dict[str, Any] | None]          # JSONB
changed_fields: Mapped[list[str] | None]           # ARRAY(Text)
user_id: Mapped[str | None]                        # String(100)
session_id: Mapped[str | None]                     # String(100)
ip_address: Mapped[str | None]                     # INET (stored as string)
created_at: Mapped[datetime]                       # DateTime with timezone
```

---

## Files to Change

| File                                     | Action | Justification                                  |
| ---------------------------------------- | ------ | ---------------------------------------------- |
| `app/api/schemas/__init__.py`            | CREATE | Package init for schemas module                |
| `app/api/schemas/audit.py`               | CREATE | Pydantic models for audit API request/response |
| `app/api/routers/__init__.py`            | CREATE | Package init for routers module                |
| `app/api/routers/audit.py`               | CREATE | Audit history retrieval endpoint               |
| `app/api/main.py`                        | UPDATE | Register audit router                          |
| `app/api/tests/unit/test_audit_schemas.py` | CREATE | Unit tests for Pydantic schemas              |
| `app/api/tests/integration/test_audit_api.py` | CREATE | Integration tests for audit endpoint       |

---

## NOT Building (Scope Limits)

Explicit exclusions to prevent scope creep:

- **UI components** - This is API infrastructure only; UI will consume this endpoint in a future phase
- **Write operations** - Audit log is immutable; no POST/PUT/DELETE endpoints
- **Bulk export** - No CSV/Excel export; raw JSON API only
- **Real-time streaming** - No WebSocket or SSE for live updates
- **Authentication/authorization** - Headers are trusted as-is; future phase adds auth middleware
- **Caching** - Queries hit database directly; caching is a future optimization
- **Rate limiting** - Not implemented in this phase

---

## Step-by-Step Tasks

Execute in order. Each task is atomic and independently verifiable.

### Task 1: CREATE `app/api/schemas/__init__.py`

- **ACTION**: CREATE empty package init file
- **IMPLEMENT**: Create `__init__.py` with module docstring
- **CONTENT**:
```python
"""Pydantic schemas for API request/response models."""
```
- **VALIDATE**: `python -c "from schemas import *"` (from app/api directory)

### Task 2: CREATE `app/api/schemas/audit.py`

- **ACTION**: CREATE Pydantic models for audit API
- **IMPLEMENT**:
  - `AuditAction` - Enum for INSERT, UPDATE, DELETE
  - `AuditRecordResponse` - Single audit record (mirrors AuditLog model)
  - `PaginatedAuditResponse` - Paginated list with metadata
  - `AuditQueryParams` - Optional filter parameters
- **MIRROR**: Field types from `app/api/models/audit_log.py:14-40`
- **IMPORTS**:
```python
from datetime import datetime
from enum import Enum
from typing import Any
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field
```
- **MODEL_CONFIG**: Use `model_config = ConfigDict(from_attributes=True)` for SQLAlchemy compatibility
- **PAGINATION_DEFAULTS**: page=1, page_size=50, max page_size=100
- **GOTCHA**: `ip_address` is INET in PostgreSQL but should be `str | None` in Pydantic
- **VALIDATE**: `cd /home/ibrahimaslam/repos/cirrus/cant-believe-its-not-ebis/app/api && python -c "from schemas.audit import AuditRecordResponse, PaginatedAuditResponse"`

### Task 3: CREATE `app/api/routers/__init__.py`

- **ACTION**: CREATE empty package init file
- **IMPLEMENT**: Create `__init__.py` with module docstring
- **CONTENT**:
```python
"""FastAPI routers for API endpoints."""
```
- **VALIDATE**: `python -c "from routers import *"` (from app/api directory)

### Task 4: CREATE `app/api/routers/audit.py`

- **ACTION**: CREATE FastAPI router with audit history endpoint
- **IMPLEMENT**:
  - Create `APIRouter` with prefix `/api/v1/audit` and tags `["audit"]`
  - GET `/{entity_type}/{entity_id}` endpoint
  - Accept query parameters: `from_date`, `to_date`, `action`, `user_id`, `page`, `page_size`
  - Build SQLAlchemy query with dynamic filters
  - Execute count query for total
  - Execute paginated data query with `.offset().limit().order_by()`
  - Return `PaginatedAuditResponse`
- **MIRROR**: Query pattern from `app/api/tests/integration/test_audit_capture.py:91-98`
- **IMPORTS**:
```python
from datetime import datetime
from uuid import UUID

from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import get_session
from models.audit_log import AuditLog
from schemas.audit import AuditAction, AuditRecordResponse, PaginatedAuditResponse
```
- **QUERY_ORDER**: `order_by(AuditLog.created_at.desc())` - newest first (uses `idx_audit_log_created_at` index)
- **GOTCHA**: Use `UUID` type hint for `entity_id` path parameter - FastAPI will validate UUID format
- **GOTCHA**: Use async endpoint (`async def`) with `await session.execute()`
- **GOTCHA**: IP address is stored as INET, but SQLAlchemy returns it as `IPv4Address` or `IPv6Address` object - convert with `str()` before returning
- **VALIDATE**: `cd /home/ibrahimaslam/repos/cirrus/cant-believe-its-not-ebis/app/api && python -c "from routers.audit import router; print(router.routes)"`

### Task 5: UPDATE `app/api/main.py`

- **ACTION**: UPDATE to register audit router
- **IMPLEMENT**:
  - Import audit router
  - Include router with `app.include_router()`
- **ADD IMPORT**:
```python
from routers.audit import router as audit_router
```
- **ADD REGISTRATION** (after middleware registration):
```python
# Register routers
app.include_router(audit_router)
```
- **MIRROR**: Standard FastAPI router registration pattern
- **VALIDATE**: `cd /home/ibrahimaslam/repos/cirrus/cant-believe-its-not-ebis/app/api && python -c "from main import app; print([r.path for r in app.routes])"`

### Task 6: CREATE `app/api/tests/unit/test_audit_schemas.py`

- **ACTION**: CREATE unit tests for Pydantic schemas
- **IMPLEMENT**:
  - Test `AuditRecordResponse` with valid data
  - Test `AuditRecordResponse` with None optional fields
  - Test `PaginatedAuditResponse` structure
  - Test `AuditAction` enum values
  - Test pagination defaults and limits
- **MIRROR**: Test structure from `app/api/tests/unit/test_audit.py`
- **IMPORTS**:
```python
from datetime import datetime, timezone
from uuid import uuid4

import pytest

from schemas.audit import AuditAction, AuditRecordResponse, PaginatedAuditResponse
```
- **TEST_CASES**:
  - Valid INSERT record with all fields
  - Valid UPDATE record with changed_fields
  - Valid DELETE record with old_values only
  - Pagination response with empty items
  - Pagination response with multiple items
- **VALIDATE**: `cd /home/ibrahimaslam/repos/cirrus/cant-believe-its-not-ebis/app/api && python -m pytest tests/unit/test_audit_schemas.py -v`

### Task 7: CREATE `app/api/tests/integration/test_audit_api.py`

- **ACTION**: CREATE integration tests for audit API endpoint
- **IMPLEMENT**:
  - Test endpoint returns 200 for valid entity
  - Test endpoint returns empty list for non-existent entity
  - Test pagination (page, page_size, has_next)
  - Test date range filtering
  - Test action type filtering
  - Test user_id filtering
  - Test invalid UUID returns 422
- **MIRROR**: Fixture pattern from `app/api/tests/integration/test_audit_capture.py`
- **IMPORTS**:
```python
import os
from datetime import datetime, timedelta, timezone

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import text

pytestmark = pytest.mark.skipif(
    not os.environ.get("DATABASE_URL"),
    reason="DATABASE_URL not set - skipping integration tests",
)
```
- **USE**: `TestClient` from FastAPI for synchronous test execution
- **SETUP**: Create test audit records directly via SQL (bypass immutability trigger for test data)
- **CLEANUP**: Delete test records after each test
- **GOTCHA**: Integration tests require DATABASE_URL environment variable
- **VALIDATE**: `cd /home/ibrahimaslam/repos/cirrus/cant-believe-its-not-ebis/app/api && DATABASE_URL="postgresql+asyncpg://..." python -m pytest tests/integration/test_audit_api.py -v`

### Task 8: VERIFY full integration

- **ACTION**: VERIFY end-to-end functionality
- **IMPLEMENT**:
  - Run all unit tests
  - Run all integration tests (if database available)
  - Verify API documentation generated at `/docs`
  - Manual test with curl/httpie
- **VALIDATE**:
```bash
# Unit tests
cd /home/ibrahimaslam/repos/cirrus/cant-believe-its-not-ebis/app/api && python -m pytest tests/unit/ -v

# Integration tests (requires database)
cd /home/ibrahimaslam/repos/cirrus/cant-believe-its-not-ebis/app/api && python -m pytest tests/integration/ -v

# Start server and check OpenAPI docs
cd /home/ibrahimaslam/repos/cirrus/cant-believe-its-not-ebis && make api-run &
curl http://localhost:8000/docs
curl http://localhost:8000/api/v1/audit/work_order/00000000-0000-0000-0000-000000000001
```

---

## Testing Strategy

### Unit Tests to Write

| Test File | Test Cases | Validates |
| --------- | ---------- | --------- |
| `tests/unit/test_audit_schemas.py` | AuditRecordResponse validation, PaginatedAuditResponse structure, AuditAction enum | Pydantic models |

### Integration Tests to Write

| Test File | Test Cases | Validates |
| --------- | ---------- | --------- |
| `tests/integration/test_audit_api.py` | GET endpoint, pagination, filtering, error handling | Full API flow |

### Edge Cases Checklist

- [ ] Empty result set (entity exists but no audit records)
- [ ] Non-existent entity (valid UUID format, no data)
- [ ] Invalid UUID format (should return 422)
- [ ] Invalid action filter value
- [ ] Invalid date format in filters
- [ ] page_size > 100 (should cap at 100)
- [ ] page < 1 (should default to 1 or return 422)
- [ ] from_date > to_date (should return empty or 400)
- [ ] Large result set pagination (many pages)
- [ ] Null optional fields (user_id, session_id, ip_address, old_values, changed_fields)
- [ ] JSONB with nested objects in old_values/new_values

---

## Validation Commands

### Level 1: STATIC_ANALYSIS

```bash
cd /home/ibrahimaslam/repos/cirrus/cant-believe-its-not-ebis/app/api
python -c "from schemas.audit import *; from routers.audit import *; from main import app; print('Imports OK')"
```

**EXPECT**: Exit 0, prints "Imports OK"

### Level 2: UNIT_TESTS

```bash
cd /home/ibrahimaslam/repos/cirrus/cant-believe-its-not-ebis/app/api
python -m pytest tests/unit/test_audit_schemas.py -v
```

**EXPECT**: All tests pass

### Level 3: FULL_SUITE

```bash
cd /home/ibrahimaslam/repos/cirrus/cant-believe-its-not-ebis/app/api
python -m pytest tests/ -v
```

**EXPECT**: All tests pass (integration tests may skip if no DATABASE_URL)

### Level 4: DATABASE_VALIDATION

With DATABASE_URL set:
```bash
cd /home/ibrahimaslam/repos/cirrus/cant-believe-its-not-ebis/app/api
python -m pytest tests/integration/test_audit_api.py -v
```

**EXPECT**: All integration tests pass

### Level 5: MANUAL_VALIDATION

1. Start the API server:
```bash
cd /home/ibrahimaslam/repos/cirrus/cant-believe-its-not-ebis && make api-run
```

2. Check OpenAPI documentation renders:
```bash
curl -s http://localhost:8000/openapi.json | python -c "import json,sys; d=json.load(sys.stdin); print('/api/v1/audit/{entity_type}/{entity_id}' in str(d))"
```

3. Test endpoint with valid UUID:
```bash
curl -s "http://localhost:8000/api/v1/audit/work_order/00000000-0000-0000-0000-000000000001" | python -c "import json,sys; d=json.load(sys.stdin); print('total' in d and 'items' in d)"
```

4. Test invalid UUID returns 422:
```bash
curl -s "http://localhost:8000/api/v1/audit/work_order/not-a-uuid" | python -c "import json,sys; d=json.load(sys.stdin); print(d.get('detail', [])[0].get('type', '') == 'uuid_parsing')"
```

---

## Acceptance Criteria

- [ ] `GET /api/v1/audit/{entity_type}/{entity_id}` endpoint responds with 200
- [ ] Response follows `PaginatedAuditResponse` schema with `total`, `page`, `page_size`, `items`, `has_next`
- [ ] Each item in `items` follows `AuditRecordResponse` schema
- [ ] Filtering works for: `from_date`, `to_date`, `action`, `user_id`
- [ ] Pagination works with `page` and `page_size` parameters
- [ ] Invalid UUID returns 422 Unprocessable Entity
- [ ] Empty result set returns 200 with `total: 0` and `items: []`
- [ ] All fields from audit_log are returned (including JSONB and array fields)
- [ ] Results ordered by `created_at DESC` (newest first)
- [ ] OpenAPI documentation generated at `/docs` shows endpoint

---

## Completion Checklist

- [ ] Task 1: schemas/__init__.py created
- [ ] Task 2: schemas/audit.py created with Pydantic models
- [ ] Task 3: routers/__init__.py created
- [ ] Task 4: routers/audit.py created with GET endpoint
- [ ] Task 5: main.py updated to include router
- [ ] Task 6: Unit tests created and passing
- [ ] Task 7: Integration tests created
- [ ] Task 8: End-to-end verification complete
- [ ] Level 1: Static analysis passes
- [ ] Level 2: Unit tests pass
- [ ] Level 3: Full test suite passes
- [ ] Level 5: Manual validation confirms API works

---

## Risks and Mitigations

| Risk | Likelihood | Impact | Mitigation |
| ---- | ---------- | ------ | ---------- |
| Large result sets cause slow queries | MEDIUM | MEDIUM | Pagination enforced with max page_size=100; indexes exist on entity_type+entity_id and created_at |
| JSONB serialization issues | LOW | MEDIUM | Pydantic handles dict[str, Any] natively; test with nested objects |
| IP address type conversion | MEDIUM | LOW | Explicitly convert INET to str in response mapping |
| Missing test coverage | LOW | MEDIUM | Write unit and integration tests as explicit tasks |

---

## Notes

### API Design Decisions

1. **Path structure**: `/api/v1/audit/{entity_type}/{entity_id}` - RESTful, versioned, entity-centric
2. **Pagination**: Offset-based (page/page_size) rather than cursor-based - simpler for UI integration, indexes support efficient offset queries
3. **Filtering**: Optional query parameters rather than POST body - follows REST conventions, cacheable
4. **Response structure**: Flat paginated response rather than HAL/HATEOAS - simpler, sufficient for current needs

### Future Considerations

- Authentication middleware will validate request headers before audit access
- Rate limiting may be needed for high-traffic deployments
- Caching layer (Redis) could reduce database load for frequently-accessed entities
- Bulk export (CSV/Excel) endpoint for compliance reporting
- WebSocket endpoint for real-time audit streaming

### Index Usage

The query will leverage these indexes from V005 migration:
- `idx_audit_log_entity (entity_type, entity_id)` - Primary filter
- `idx_audit_log_created_at (created_at DESC)` - Ordering and pagination
- `idx_audit_log_user_id (user_id)` - User filter (when specified)
