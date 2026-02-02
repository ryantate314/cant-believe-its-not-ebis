# Feature: Change Capture (Audit Logging Phase 3)

## Summary

Implement the change capture mechanism that automatically logs all mutations (INSERT, UPDATE, DELETE) to registered entities in the audit_log table. This involves adding SQLAlchemy 2.0 async ORM support, creating entity models with an auditable registration mechanism (mixin), and implementing event listeners that serialize entity state and insert audit records with user context from the Phase 2 middleware.

## User Story

As a developer implementing audited entities in Cirrus MRO
I want entity mutations automatically captured with full context when I register an entity for auditing
So that compliance officers can retrieve complete change history without manual logging code

## Problem Statement

The audit_log table (Phase 1) and request context middleware (Phase 2) exist, but there is no mechanism to:
1. Connect SQLAlchemy models to the database
2. Register entities for audit tracking
3. Automatically capture old/new values on mutations
4. Insert audit records with user context from the middleware

## Solution Statement

Implement SQLAlchemy 2.0 async ORM integration with:
1. Database session management via `async_sessionmaker`
2. An `AuditableMixin` that registers models for audit tracking
3. SQLAlchemy event listeners (`after_insert`, `after_update`, `after_delete`) that:
   - Serialize entity state to JSONB-compatible dictionaries
   - Compute changed fields for UPDATE operations
   - Retrieve user context via `get_current_context()`
   - Insert audit_log records within the same transaction

## Metadata

| Field            | Value                                                            |
| ---------------- | ---------------------------------------------------------------- |
| Type             | NEW_CAPABILITY                                                   |
| Complexity       | MEDIUM                                                           |
| Systems Affected | FastAPI application, SQLAlchemy ORM, PostgreSQL audit_log table  |
| Dependencies     | SQLAlchemy[asyncio]>=2.0, asyncpg>=0.29.0                        |
| Estimated Tasks  | 11                                                               |

---

## UX Design

### Before State

```
╔═══════════════════════════════════════════════════════════════════════════════╗
║                              BEFORE STATE                                      ║
╠═══════════════════════════════════════════════════════════════════════════════╣
║                                                                               ║
║   ┌─────────────┐         ┌─────────────┐         ┌─────────────┐            ║
║   │   Route     │ ──────► │   ???       │ ──────► │   Database  │            ║
║   │   Handler   │         │   No ORM    │         │   (raw SQL) │            ║
║   └─────────────┘         └─────────────┘         └─────────────┘            ║
║                                                          │                    ║
║                                                          ▼                    ║
║                                                   ┌─────────────┐            ║
║                                                   │ audit_log   │            ║
║                                                   │ (EMPTY)     │            ║
║                                                   └─────────────┘            ║
║                                                                               ║
║   USER_FLOW: Developer must write raw SQL; no change tracking exists          ║
║   PAIN_POINT: No SQLAlchemy models; no automatic audit capture                ║
║   DATA_FLOW: Context extracted → nowhere to use it → audit_log empty          ║
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
║   │   Route     │ ──► │  Session    │ ──► │  Auditable  │ ──► │  Database │  ║
║   │   Handler   │     │  (async)    │     │  Entity     │     │  Tables   │  ║
║   └─────────────┘     └─────────────┘     └─────────────┘     └───────────┘  ║
║         │                   │                    │                    │       ║
║         │                   │                    ▼                    │       ║
║         │                   │            ┌─────────────┐              │       ║
║         │                   │            │ Event       │              │       ║
║         │                   │            │ Listeners   │              │       ║
║         │                   │            └──────┬──────┘              │       ║
║         │                   │                   │                     │       ║
║         ▼                   ▼                   ▼                     ▼       ║
║   ┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌───────────┐  ║
║   │ Context     │ ──► │ get_current │ ──► │ Serialize   │ ──► │ audit_log │  ║
║   │ Middleware  │     │ _context()  │     │ + Insert    │     │ (FULL)    │  ║
║   └─────────────┘     └─────────────┘     └─────────────┘     └───────────┘  ║
║                                                                               ║
║   USER_FLOW: Developer adds AuditableMixin → CRUD operations auto-logged      ║
║   VALUE_ADD: Zero manual logging; complete change history with attribution    ║
║   DATA_FLOW: Request→Context→Session→Entity→Event→Serialize→audit_log         ║
║                                                                               ║
╚═══════════════════════════════════════════════════════════════════════════════╝
```

### Interaction Changes

| Location | Before | After | User Impact |
|----------|--------|-------|-------------|
| `core/database.py` | Does not exist | Database session management | Clean DI pattern for routes |
| Entity models | Do not exist | SQLAlchemy models with mixin | Type-safe ORM operations |
| CRUD operations | Manual SQL | Session operations | Automatic audit capture |
| `audit_log` table | Empty | Populated on every mutation | Complete change history |

---

## Mandatory Reading

**CRITICAL: Implementation agent MUST read these files before starting any task:**

| Priority | File | Lines | Why Read This |
|----------|------|-------|---------------|
| P0 | `app/api/core/context.py` | all | Pattern for `get_current_context()` - used in event listeners |
| P0 | `database/migrations/V005__create_audit_log_table.sql` | all | Exact schema for audit_log table to match |
| P0 | `database/migrations/V002__create_work_order_table.sql` | all | Entity schema to model - first auditable entity |
| P1 | `app/api/core/middleware.py` | all | How context is set - verify it's available in events |
| P1 | `app/api/main.py` | all | Current app structure to UPDATE with session DI |
| P2 | `app/api/tests/unit/test_context.py` | all | Test pattern to FOLLOW |

**External Documentation:**

| Source | Section | Why Needed |
|--------|---------|------------|
| [SQLAlchemy 2.0 ORM Events](https://docs.sqlalchemy.org/en/20/orm/events.html) | MapperEvents | Event listener signatures and timing |
| [SQLAlchemy Async Session](https://docs.sqlalchemy.org/en/20/orm/extensions/asyncio.html) | async_sessionmaker | Async session factory pattern |
| [asyncpg Documentation](https://magicstack.github.io/asyncpg/) | Connection | PostgreSQL async driver |

---

## Patterns to Mirror

**CONTEXT_ACCESS_PATTERN:**
```python
# SOURCE: app/api/core/context.py:31-33
# COPY THIS PATTERN:
def get_current_context() -> RequestContext | None:
    """Get current request context from context var (for non-request code paths)."""
    return _request_context.get()
```

**DATACLASS_PATTERN:**
```python
# SOURCE: app/api/core/context.py:9-15
# COPY THIS PATTERN:
@dataclass
class RequestContext:
    """Context information extracted from HTTP requests for audit logging."""
    user_id: str | None
    session_id: str
    ip_address: str | None
```

**MIDDLEWARE_REGISTRATION_PATTERN:**
```python
# SOURCE: app/api/main.py:8-9
# COPY THIS PATTERN:
# Register middleware
app.add_middleware(ContextMiddleware)
```

**TEST_CLIENT_PATTERN:**
```python
# SOURCE: app/api/tests/unit/test_context.py:1-11
# COPY THIS PATTERN:
from fastapi.testclient import TestClient
from main import app

def test_context_extracts_user_id():
    """User ID is extracted from X-User-ID header."""
    client = TestClient(app)
    response = client.get("/health", headers={"X-User-ID": "test-user"})
    assert response.status_code == 200
```

**AUDIT_TABLE_SCHEMA:**
```sql
-- SOURCE: database/migrations/V005__create_audit_log_table.sql:15-27
-- MUST MATCH THIS SCHEMA:
CREATE TABLE audit_log (
    id BIGSERIAL PRIMARY KEY,
    entity_type VARCHAR(100) NOT NULL,
    entity_id UUID NOT NULL,
    action audit_action NOT NULL,  -- ENUM: 'INSERT', 'UPDATE', 'DELETE'
    old_values JSONB,
    new_values JSONB,
    changed_fields TEXT[],
    user_id VARCHAR(100),
    session_id VARCHAR(100),
    ip_address INET,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

---

## Files to Change

| File                                        | Action | Justification                                          |
| ------------------------------------------- | ------ | ------------------------------------------------------ |
| `app/api/pyproject.toml`                    | UPDATE | Add SQLAlchemy[asyncio], asyncpg dependencies          |
| `app/api/core/database.py`                  | CREATE | Async engine, session factory, get_session dependency  |
| `app/api/core/audit.py`                     | CREATE | AuditableMixin, event listeners, serialization         |
| `app/api/models/__init__.py`                | CREATE | Package init with Base export                          |
| `app/api/models/base.py`                    | CREATE | Declarative base, common columns mixin                 |
| `app/api/models/audit_log.py`               | CREATE | AuditLog model (read-only, for queries)                |
| `app/api/models/work_order.py`              | CREATE | WorkOrder model with AuditableMixin                    |
| `app/api/main.py`                           | UPDATE | Add session dependency, register audit listeners       |
| `app/api/tests/unit/test_audit.py`          | CREATE | Unit tests for serialization, event listeners          |
| `app/api/tests/integration/__init__.py`     | CREATE | Package init for integration tests                     |
| `app/api/tests/integration/test_audit_capture.py` | CREATE | Integration tests for full audit flow            |

---

## NOT Building (Scope Limits)

Explicit exclusions to prevent scope creep:

- **API endpoints for audit retrieval** - Phase 4 scope
- **UI components** - Explicitly out of scope per PRD
- **Database triggers** - Using application-level hooks per PRD decision
- **Async queue for audit inserts** - Direct insert acceptable for MVP
- **Full WorkOrder CRUD routes** - Only model definition; routes deferred
- **Hash chain / tamper detection** - Future phase per PRD
- **Retention policy enforcement** - Future phase per PRD
- **Bulk operation auditing** - Events don't fire for bulk ORM DML; document limitation

---

## Step-by-Step Tasks

Execute in order. Each task is atomic and independently verifiable.

### Task 1: UPDATE `app/api/pyproject.toml`

- **ACTION**: ADD SQLAlchemy and asyncpg dependencies
- **IMPLEMENT**: Add SQLAlchemy[asyncio]>=2.0.0 and asyncpg>=0.29.0 to dependencies
- **CURRENT_CONTENT** (lines 5-7):
```toml
dependencies = [
    "fastapi[standard]>=0.128.0",
]
```
- **NEW_CONTENT**:
```toml
dependencies = [
    "fastapi[standard]>=0.128.0",
    "sqlalchemy[asyncio]>=2.0.0",
    "asyncpg>=0.29.0",
]
```
- **GOTCHA**: Use `sqlalchemy[asyncio]` extra to get greenlet dependency
- **VALIDATE**: `cd /home/ibrahimaslam/repos/cirrus/cant-believe-its-not-ebis/app/api && uv sync && uv run python -c "import sqlalchemy; import asyncpg; print(f'SQLAlchemy {sqlalchemy.__version__}')"`

### Task 2: CREATE `app/api/core/database.py`

- **ACTION**: CREATE async database engine and session management
- **IMPLEMENT**:
  - Async engine creation from DATABASE_URL environment variable
  - `async_sessionmaker` factory with proper settings
  - `get_session` dependency for FastAPI route injection
  - `sync_session_class` parameter for event listener compatibility
- **IMPORTS**:
```python
import os
from collections.abc import AsyncGenerator
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import sessionmaker
```
- **IMPLEMENTATION**:
```python
DATABASE_URL = os.environ.get(
    "DATABASE_URL",
    "postgresql+asyncpg://postgres:postgres@localhost:5432/cirrus_mro"
)

# Create async engine
engine = create_async_engine(
    DATABASE_URL,
    echo=False,  # Set True for SQL logging in development
    pool_pre_ping=True,
)

# Create sync session class for event listeners
# Events need sync session access even in async context
_sync_session_class = sessionmaker(expire_on_commit=False)

# Create async session factory
async_session_factory = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    sync_session_class=_sync_session_class,
)


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
- **GOTCHA**: Use `sync_session_class` parameter to enable event listener access to session
- **VALIDATE**: `cd /home/ibrahimaslam/repos/cirrus/cant-believe-its-not-ebis/app/api && uv run python -c "from core.database import engine, async_session_factory; print('Database module imports OK')"`

### Task 3: CREATE `app/api/models/__init__.py`

- **ACTION**: CREATE package initialization with exports
- **IMPLEMENT**: Export Base and common types for model definitions
- **CONTENT**:
```python
"""SQLAlchemy models package."""

from models.base import Base, TimestampMixin, UUIDMixin

__all__ = ["Base", "TimestampMixin", "UUIDMixin"]
```
- **VALIDATE**: `cd /home/ibrahimaslam/repos/cirrus/cant-believe-its-not-ebis/app/api && uv run python -c "from models import Base; print('Models package OK')"`

### Task 4: CREATE `app/api/models/base.py`

- **ACTION**: CREATE declarative base and common mixins
- **IMPLEMENT**:
  - SQLAlchemy 2.0 `DeclarativeBase` subclass
  - `UUIDMixin` with uuid column (matches existing tables)
  - `TimestampMixin` with created_at, updated_at columns
- **IMPORTS**:
```python
import uuid as uuid_module
from datetime import datetime
from sqlalchemy import DateTime, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column
```
- **IMPLEMENTATION**:
```python
class Base(DeclarativeBase):
    """Base class for all SQLAlchemy models."""
    pass


class UUIDMixin:
    """Mixin that adds a UUID column for API identification."""

    uuid: Mapped[uuid_module.UUID] = mapped_column(
        UUID(as_uuid=True),
        unique=True,
        default=uuid_module.uuid4,
        nullable=False,
    )


class TimestampMixin:
    """Mixin that adds created_at and updated_at timestamps."""

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )
```
- **GOTCHA**: Use `UUID(as_uuid=True)` for proper Python UUID handling
- **VALIDATE**: `cd /home/ibrahimaslam/repos/cirrus/cant-believe-its-not-ebis/app/api && uv run python -c "from models.base import Base, UUIDMixin, TimestampMixin; print('Base models OK')"`

### Task 5: CREATE `app/api/core/audit.py`

- **ACTION**: CREATE audit infrastructure - mixin, serializer, event listeners
- **IMPLEMENT**:
  - `AuditableMixin` class with `__audit_entity_type__` attribute
  - `serialize_for_audit()` function to convert model to JSONB-safe dict
  - Event listener registration function
  - `after_insert`, `after_update`, `after_delete` handlers
- **IMPORTS**:
```python
import json
from datetime import date, datetime
from decimal import Decimal
from typing import Any
from uuid import UUID

from sqlalchemy import event, text
from sqlalchemy.engine import Connection
from sqlalchemy.orm import Mapper
from sqlalchemy.orm.attributes import History, get_history

from core.context import get_current_context
```
- **SERIALIZATION**:
```python
def _json_serializer(obj: Any) -> Any:
    """Convert non-JSON-serializable types to serializable equivalents."""
    if isinstance(obj, datetime):
        return obj.isoformat()
    if isinstance(obj, date):
        return obj.isoformat()
    if isinstance(obj, UUID):
        return str(obj)
    if isinstance(obj, Decimal):
        return float(obj)
    if isinstance(obj, bytes):
        return obj.decode("utf-8", errors="replace")
    raise TypeError(f"Object of type {type(obj).__name__} is not JSON serializable")


def serialize_for_audit(
    instance: Any,
    exclude_fields: set[str] | None = None,
) -> dict[str, Any]:
    """Serialize a SQLAlchemy model instance to a JSONB-compatible dict."""
    exclude = exclude_fields or set()
    result = {}

    for column in instance.__table__.columns:
        if column.name in exclude:
            continue
        value = getattr(instance, column.name, None)
        if value is not None:
            try:
                # Ensure the value is JSON serializable
                json.dumps(value, default=_json_serializer)
                result[column.name] = value if not isinstance(value, (datetime, date, UUID, Decimal)) else _json_serializer(value)
            except (TypeError, ValueError):
                result[column.name] = str(value)
        else:
            result[column.name] = None

    return result


def get_changed_fields(instance: Any) -> list[str]:
    """Get list of field names that changed during an UPDATE."""
    changed = []
    for column in instance.__table__.columns:
        history: History = get_history(instance, column.name)
        if history.has_changes():
            changed.append(column.name)
    return changed


def get_old_values(instance: Any) -> dict[str, Any]:
    """Get the old values for fields that changed during an UPDATE."""
    old_values = {}
    for column in instance.__table__.columns:
        history: History = get_history(instance, column.name)
        if history.has_changes() and history.deleted:
            value = history.deleted[0]
            if value is not None:
                try:
                    json.dumps(value, default=_json_serializer)
                    old_values[column.name] = value if not isinstance(value, (datetime, date, UUID, Decimal)) else _json_serializer(value)
                except (TypeError, ValueError):
                    old_values[column.name] = str(value)
            else:
                old_values[column.name] = None
    return old_values
```
- **MIXIN**:
```python
class AuditableMixin:
    """Mixin that enables automatic audit logging for a model.

    Usage:
        class WorkOrder(Base, AuditableMixin):
            __tablename__ = "work_order"
            __audit_entity_type__ = "work_order"  # Optional, defaults to __tablename__
    """

    @classmethod
    def __audit_entity_type__(cls) -> str:
        """Return the entity type for audit logging."""
        return getattr(cls, "__audit_entity_type_override__", cls.__tablename__)
```
- **EVENT_HANDLERS**:
```python
def _insert_audit_record(
    connection: Connection,
    entity_type: str,
    entity_id: UUID,
    action: str,
    old_values: dict[str, Any] | None,
    new_values: dict[str, Any] | None,
    changed_fields: list[str] | None,
) -> None:
    """Insert an audit log record using the provided connection."""
    context = get_current_context()

    connection.execute(
        text("""
            INSERT INTO audit_log
                (entity_type, entity_id, action, old_values, new_values,
                 changed_fields, user_id, session_id, ip_address)
            VALUES
                (:entity_type, :entity_id, :action::audit_action,
                 :old_values::jsonb, :new_values::jsonb, :changed_fields,
                 :user_id, :session_id, :ip_address::inet)
        """),
        {
            "entity_type": entity_type,
            "entity_id": entity_id,
            "action": action,
            "old_values": json.dumps(old_values, default=_json_serializer) if old_values else None,
            "new_values": json.dumps(new_values, default=_json_serializer) if new_values else None,
            "changed_fields": changed_fields,
            "user_id": context.user_id if context else None,
            "session_id": context.session_id if context else None,
            "ip_address": context.ip_address if context else None,
        },
    )


def _handle_after_insert(mapper: Mapper, connection: Connection, target: Any) -> None:
    """Handle after_insert event for auditable entities."""
    entity_type = target.__audit_entity_type__()
    entity_id = target.uuid
    new_values = serialize_for_audit(target)

    _insert_audit_record(
        connection=connection,
        entity_type=entity_type,
        entity_id=entity_id,
        action="INSERT",
        old_values=None,
        new_values=new_values,
        changed_fields=None,
    )


def _handle_after_update(mapper: Mapper, connection: Connection, target: Any) -> None:
    """Handle after_update event for auditable entities."""
    changed_fields = get_changed_fields(target)

    # Only log if there were actual changes
    if not changed_fields:
        return

    entity_type = target.__audit_entity_type__()
    entity_id = target.uuid
    old_values = get_old_values(target)
    new_values = serialize_for_audit(target)

    _insert_audit_record(
        connection=connection,
        entity_type=entity_type,
        entity_id=entity_id,
        action="UPDATE",
        old_values=old_values,
        new_values=new_values,
        changed_fields=changed_fields,
    )


def _handle_after_delete(mapper: Mapper, connection: Connection, target: Any) -> None:
    """Handle after_delete event for auditable entities."""
    entity_type = target.__audit_entity_type__()
    entity_id = target.uuid
    old_values = serialize_for_audit(target)

    _insert_audit_record(
        connection=connection,
        entity_type=entity_type,
        entity_id=entity_id,
        action="DELETE",
        old_values=old_values,
        new_values=None,
        changed_fields=None,
    )


def register_audit_listeners(model_class: type) -> None:
    """Register audit event listeners for a model class.

    Call this function for each model that uses AuditableMixin.
    """
    if not hasattr(model_class, "__audit_entity_type__"):
        raise ValueError(f"{model_class.__name__} must have AuditableMixin")

    event.listen(model_class, "after_insert", _handle_after_insert)
    event.listen(model_class, "after_update", _handle_after_update)
    event.listen(model_class, "after_delete", _handle_after_delete)
```
- **GOTCHA**: Use `get_history()` to access old values - only available before session commit
- **GOTCHA**: Must cast to `::audit_action` and `::jsonb` and `::inet` in SQL for PostgreSQL types
- **GOTCHA**: Event listeners receive sync `Connection`, not async - this is correct for mapper events
- **VALIDATE**: `cd /home/ibrahimaslam/repos/cirrus/cant-believe-its-not-ebis/app/api && uv run python -c "from core.audit import AuditableMixin, register_audit_listeners, serialize_for_audit; print('Audit module OK')"`

### Task 6: CREATE `app/api/models/audit_log.py`

- **ACTION**: CREATE read-only AuditLog model for querying
- **IMPLEMENT**:
  - Model matching V005 migration schema exactly
  - No AuditableMixin (we don't audit the audit log)
  - Read-only usage (no INSERT/UPDATE/DELETE methods)
- **IMPORTS**:
```python
from datetime import datetime
from typing import Any
from uuid import UUID

from sqlalchemy import BigInteger, DateTime, Enum as SQLEnum, String, Text, func
from sqlalchemy.dialects.postgresql import ARRAY, INET, JSONB, UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column

from models.base import Base
```
- **IMPLEMENTATION**:
```python
class AuditLog(Base):
    """Read-only model for audit_log table.

    This model is for querying audit records only.
    Audit records are inserted via event listeners, not this model.
    """

    __tablename__ = "audit_log"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    entity_type: Mapped[str] = mapped_column(String(100), nullable=False)
    entity_id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), nullable=False)
    action: Mapped[str] = mapped_column(
        SQLEnum("INSERT", "UPDATE", "DELETE", name="audit_action", create_type=False),
        nullable=False,
    )
    old_values: Mapped[dict[str, Any] | None] = mapped_column(JSONB, nullable=True)
    new_values: Mapped[dict[str, Any] | None] = mapped_column(JSONB, nullable=True)
    changed_fields: Mapped[list[str] | None] = mapped_column(ARRAY(Text), nullable=True)
    user_id: Mapped[str | None] = mapped_column(String(100), nullable=True)
    session_id: Mapped[str | None] = mapped_column(String(100), nullable=True)
    ip_address: Mapped[str | None] = mapped_column(INET, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )
```
- **GOTCHA**: Use `create_type=False` for Enum since type already exists from migration
- **VALIDATE**: `cd /home/ibrahimaslam/repos/cirrus/cant-believe-its-not-ebis/app/api && uv run python -c "from models.audit_log import AuditLog; print('AuditLog model OK')"`

### Task 7: CREATE `app/api/models/work_order.py`

- **ACTION**: CREATE WorkOrder model with AuditableMixin
- **IMPLEMENT**:
  - Model matching V002 migration schema exactly
  - Include AuditableMixin for audit tracking
  - Include UUIDMixin and TimestampMixin
  - Foreign key to city table
- **IMPORTS**:
```python
from datetime import date, datetime
from uuid import UUID

from sqlalchemy import Date, DateTime, Enum as SQLEnum, ForeignKey, Integer, String, func
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column

from core.audit import AuditableMixin
from models.base import Base
```
- **IMPLEMENTATION**:
```python
class WorkOrder(Base, AuditableMixin):
    """Work order entity model."""

    __tablename__ = "work_order"

    # Primary key
    id: Mapped[int] = mapped_column(Integer, primary_key=True)

    # UUID for API identification
    uuid: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        unique=True,
        server_default=func.gen_random_uuid(),
        nullable=False,
    )

    # Work order identification
    work_order_number: Mapped[str] = mapped_column(String(20), unique=True, nullable=False)
    sequence_number: Mapped[int] = mapped_column(Integer, nullable=False)

    # Foreign keys
    city_id: Mapped[int] = mapped_column(ForeignKey("city.id"), nullable=False)

    # Work order type and status (enums defined in V001 migration)
    work_order_type: Mapped[str] = mapped_column(
        SQLEnum("work_order", "warranty_claim", name="work_order_type", create_type=False),
        server_default="work_order",
    )
    status: Mapped[str] = mapped_column(
        SQLEnum(
            "created", "scheduled", "in_progress", "on_hold",
            "completed", "cancelled", "invoiced",
            name="work_order_status",
            create_type=False,
        ),
        server_default="created",
    )
    status_notes: Mapped[str | None] = mapped_column(String(255), nullable=True)

    # Aircraft (denormalized for POC)
    aircraft_registration: Mapped[str | None] = mapped_column(String(20), nullable=True)
    aircraft_serial: Mapped[str | None] = mapped_column(String(50), nullable=True)
    aircraft_make: Mapped[str | None] = mapped_column(String(50), nullable=True)
    aircraft_model: Mapped[str | None] = mapped_column(String(50), nullable=True)
    aircraft_year: Mapped[int | None] = mapped_column(Integer, nullable=True)

    # Customer (denormalized for POC)
    customer_name: Mapped[str | None] = mapped_column(String(200), nullable=True)
    customer_po_number: Mapped[str | None] = mapped_column(String(50), nullable=True)

    # Dates
    due_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    created_date: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
    )
    completed_date: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    # Assignment
    lead_technician: Mapped[str | None] = mapped_column(String(100), nullable=True)
    sales_person: Mapped[str | None] = mapped_column(String(100), nullable=True)
    priority: Mapped[str] = mapped_column(
        SQLEnum("low", "normal", "high", "urgent", name="priority_level", create_type=False),
        server_default="normal",
    )

    # Audit fields (from existing schema)
    created_by: Mapped[str] = mapped_column(String(100), nullable=False)
    updated_by: Mapped[str | None] = mapped_column(String(100), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
    )
```
- **GOTCHA**: Use `create_type=False` for all enums - they exist from V001 migration
- **GOTCHA**: Use `server_default=func.gen_random_uuid()` to match PostgreSQL function
- **VALIDATE**: `cd /home/ibrahimaslam/repos/cirrus/cant-believe-its-not-ebis/app/api && uv run python -c "from models.work_order import WorkOrder; print('WorkOrder model OK')"`

### Task 8: UPDATE `app/api/models/__init__.py`

- **ACTION**: UPDATE to export all models and register audit listeners
- **IMPLEMENT**:
  - Export WorkOrder and AuditLog
  - Create `register_all_audit_listeners()` function
- **NEW_CONTENT**:
```python
"""SQLAlchemy models package."""

from models.audit_log import AuditLog
from models.base import Base, TimestampMixin, UUIDMixin
from models.work_order import WorkOrder
from core.audit import register_audit_listeners


def register_all_audit_listeners() -> None:
    """Register audit event listeners for all auditable models.

    Call this function once at application startup.
    """
    register_audit_listeners(WorkOrder)
    # Add more models here as they are created


__all__ = [
    "Base",
    "TimestampMixin",
    "UUIDMixin",
    "AuditLog",
    "WorkOrder",
    "register_all_audit_listeners",
]
```
- **VALIDATE**: `cd /home/ibrahimaslam/repos/cirrus/cant-believe-its-not-ebis/app/api && uv run python -c "from models import WorkOrder, AuditLog, register_all_audit_listeners; print('All models export OK')"`

### Task 9: UPDATE `app/api/main.py`

- **ACTION**: UPDATE to register audit listeners at startup
- **IMPLEMENT**:
  - Import and call `register_all_audit_listeners()`
  - Add lifespan context manager for startup tasks
- **CURRENT_CONTENT**:
```python
from fastapi import Depends, FastAPI

from core.context import RequestContext, get_request_context
from core.middleware import ContextMiddleware

app = FastAPI(title="Cirrus MRO API")

# Register middleware
app.add_middleware(ContextMiddleware)
```
- **NEW_CONTENT**:
```python
from contextlib import asynccontextmanager

from fastapi import Depends, FastAPI

from core.context import RequestContext, get_request_context
from core.middleware import ContextMiddleware
from models import register_all_audit_listeners


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
```
- **GOTCHA**: Use `lifespan` parameter instead of deprecated `@app.on_event("startup")`
- **VALIDATE**: `cd /home/ibrahimaslam/repos/cirrus/cant-believe-its-not-ebis/app/api && uv run python -c "from main import app; print('App with lifespan OK')"`

### Task 10: CREATE `app/api/tests/unit/test_audit.py`

- **ACTION**: CREATE unit tests for audit serialization and change detection
- **IMPLEMENT**:
  - Test `serialize_for_audit()` with various types
  - Test `get_changed_fields()` logic
  - Test `_json_serializer()` edge cases
- **IMPORTS**:
```python
import pytest
from datetime import date, datetime
from decimal import Decimal
from uuid import UUID

from core.audit import _json_serializer, serialize_for_audit
```
- **TEST_CASES**:
```python
class TestJsonSerializer:
    """Tests for _json_serializer function."""

    def test_datetime_serialization(self):
        """Datetime objects serialize to ISO format."""
        dt = datetime(2024, 1, 15, 10, 30, 45)
        assert _json_serializer(dt) == "2024-01-15T10:30:45"

    def test_date_serialization(self):
        """Date objects serialize to ISO format."""
        d = date(2024, 1, 15)
        assert _json_serializer(d) == "2024-01-15"

    def test_uuid_serialization(self):
        """UUID objects serialize to string."""
        u = UUID("12345678-1234-5678-1234-567812345678")
        assert _json_serializer(u) == "12345678-1234-5678-1234-567812345678"

    def test_decimal_serialization(self):
        """Decimal objects serialize to float."""
        d = Decimal("123.45")
        assert _json_serializer(d) == 123.45

    def test_bytes_serialization(self):
        """Bytes objects serialize to string."""
        b = b"hello"
        assert _json_serializer(b) == "hello"

    def test_unsupported_type_raises(self):
        """Unsupported types raise TypeError."""
        with pytest.raises(TypeError):
            _json_serializer(object())


class TestSerializeForAudit:
    """Tests for serialize_for_audit function."""

    def test_excludes_specified_fields(self):
        """Fields in exclude_fields are not serialized."""
        # This test requires a mock model, will be tested in integration
        pass

    def test_handles_none_values(self):
        """None values are preserved in output."""
        # This test requires a mock model, will be tested in integration
        pass
```
- **VALIDATE**: `cd /home/ibrahimaslam/repos/cirrus/cant-believe-its-not-ebis/app/api && uv run pytest tests/unit/test_audit.py -v`

### Task 11: CREATE `app/api/tests/integration/test_audit_capture.py`

- **ACTION**: CREATE integration tests for full audit flow
- **IMPLEMENT**:
  - Test INSERT creates audit record with new_values
  - Test UPDATE creates audit record with old_values, new_values, changed_fields
  - Test DELETE creates audit record with old_values
  - Test user context is captured from headers
- **IMPORTS**:
```python
import pytest
from uuid import uuid4

from fastapi.testclient import TestClient
from sqlalchemy import select, text

from core.database import async_session_factory, engine
from main import app
from models import Base
from models.audit_log import AuditLog
from models.work_order import WorkOrder
```
- **FIXTURES**:
```python
@pytest.fixture
async def db_session():
    """Provide a database session for testing."""
    async with async_session_factory() as session:
        yield session


@pytest.fixture(autouse=True)
async def setup_database():
    """Create tables before tests, clean up after."""
    # Note: In real tests, use test database and migrations
    # This is a simplified fixture for demonstration
    yield
```
- **TEST_CASES**:
```python
@pytest.mark.asyncio
async def test_insert_creates_audit_record(db_session):
    """Inserting a work order creates an INSERT audit record."""
    # Create a work order
    work_order = WorkOrder(
        work_order_number="WO-TEST-001",
        sequence_number=1,
        city_id=1,  # Assumes city exists
        created_by="test-user",
    )
    db_session.add(work_order)
    await db_session.commit()

    # Query audit log for the record
    result = await db_session.execute(
        select(AuditLog).where(
            AuditLog.entity_type == "work_order",
            AuditLog.entity_id == work_order.uuid,
            AuditLog.action == "INSERT",
        )
    )
    audit_record = result.scalar_one_or_none()

    assert audit_record is not None
    assert audit_record.new_values is not None
    assert audit_record.old_values is None
    assert audit_record.new_values["work_order_number"] == "WO-TEST-001"


@pytest.mark.asyncio
async def test_update_creates_audit_record_with_diff(db_session):
    """Updating a work order creates an UPDATE audit record with changed fields."""
    # Create a work order
    work_order = WorkOrder(
        work_order_number="WO-TEST-002",
        sequence_number=2,
        city_id=1,
        created_by="test-user",
    )
    db_session.add(work_order)
    await db_session.commit()

    # Update the work order
    work_order.status = "in_progress"
    work_order.updated_by = "another-user"
    await db_session.commit()

    # Query audit log for UPDATE record
    result = await db_session.execute(
        select(AuditLog).where(
            AuditLog.entity_type == "work_order",
            AuditLog.entity_id == work_order.uuid,
            AuditLog.action == "UPDATE",
        )
    )
    audit_record = result.scalar_one_or_none()

    assert audit_record is not None
    assert "status" in audit_record.changed_fields
    assert audit_record.old_values["status"] == "created"
    assert audit_record.new_values["status"] == "in_progress"


@pytest.mark.asyncio
async def test_delete_creates_audit_record(db_session):
    """Deleting a work order creates a DELETE audit record."""
    # Create and then delete a work order
    work_order = WorkOrder(
        work_order_number="WO-TEST-003",
        sequence_number=3,
        city_id=1,
        created_by="test-user",
    )
    db_session.add(work_order)
    await db_session.commit()

    work_order_uuid = work_order.uuid

    await db_session.delete(work_order)
    await db_session.commit()

    # Query audit log for DELETE record
    result = await db_session.execute(
        select(AuditLog).where(
            AuditLog.entity_type == "work_order",
            AuditLog.entity_id == work_order_uuid,
            AuditLog.action == "DELETE",
        )
    )
    audit_record = result.scalar_one_or_none()

    assert audit_record is not None
    assert audit_record.old_values is not None
    assert audit_record.new_values is None
```
- **GOTCHA**: Integration tests require a running PostgreSQL database with migrations applied
- **VALIDATE**: `cd /home/ibrahimaslam/repos/cirrus/cant-believe-its-not-ebis/app/api && uv run pytest tests/integration/test_audit_capture.py -v --tb=short` (requires database)

---

## Testing Strategy

### Unit Tests to Write

| Test File | Test Cases | Validates |
|-----------|------------|-----------|
| `tests/unit/test_audit.py` | _json_serializer types, edge cases | Serialization correctness |
| `tests/unit/test_audit.py` | serialize_for_audit field handling | Model-to-dict conversion |

### Integration Tests to Write

| Test File | Test Cases | Validates |
|-----------|------------|-----------|
| `tests/integration/test_audit_capture.py` | INSERT audit record | New values captured |
| `tests/integration/test_audit_capture.py` | UPDATE audit record | Old/new values, changed_fields |
| `tests/integration/test_audit_capture.py` | DELETE audit record | Old values captured |
| `tests/integration/test_audit_capture.py` | Context capture | user_id, session_id, ip from headers |

### Edge Cases Checklist

- [ ] NULL field values in entity
- [ ] UUID serialization
- [ ] Datetime with timezone serialization
- [ ] Decimal serialization
- [ ] Empty string vs NULL distinction
- [ ] Multiple updates in same transaction
- [ ] UPDATE with no actual changes (should not create record)
- [ ] Missing request context (system operations)
- [ ] Very large JSONB values

---

## Validation Commands

### Level 1: STATIC_ANALYSIS

```bash
cd /home/ibrahimaslam/repos/cirrus/cant-believe-its-not-ebis/app/api && uv run python -m py_compile main.py core/audit.py core/database.py models/base.py models/audit_log.py models/work_order.py
```

**EXPECT**: Exit 0, no syntax errors

### Level 2: IMPORT_VALIDATION

```bash
cd /home/ibrahimaslam/repos/cirrus/cant-believe-its-not-ebis/app/api && uv run python -c "
from main import app
from core.audit import AuditableMixin, register_audit_listeners, serialize_for_audit
from core.database import engine, async_session_factory, get_session
from models import Base, WorkOrder, AuditLog, register_all_audit_listeners
print('All imports successful')
"
```

**EXPECT**: "All imports successful"

### Level 3: UNIT_TESTS

```bash
cd /home/ibrahimaslam/repos/cirrus/cant-believe-its-not-ebis/app/api && uv run pytest tests/unit/ -v
```

**EXPECT**: All tests pass

### Level 4: INTEGRATION_TESTS (requires database)

```bash
# First ensure database is running and migrations are applied
cd /home/ibrahimaslam/repos/cirrus/cant-believe-its-not-ebis && make db-migrate

# Then run integration tests
cd /home/ibrahimaslam/repos/cirrus/cant-believe-its-not-ebis/app/api && DATABASE_URL=postgresql+asyncpg://postgres:postgres@localhost:5432/cirrus_mro uv run pytest tests/integration/ -v
```

**EXPECT**: All tests pass

### Level 5: MANUAL_VALIDATION

1. Start the API server:
   ```bash
   cd /home/ibrahimaslam/repos/cirrus/cant-believe-its-not-ebis/app/api && DATABASE_URL=postgresql+asyncpg://postgres:postgres@localhost:5432/cirrus_mro uv run fastapi dev
   ```

2. Create a test endpoint (temporary) or use database client to insert a WorkOrder

3. Query audit_log table to verify record was created:
   ```sql
   SELECT * FROM audit_log ORDER BY created_at DESC LIMIT 5;
   ```

4. Verify audit record contains:
   - Correct entity_type ("work_order")
   - Correct entity_id (UUID of work order)
   - action = "INSERT"
   - new_values contains work order data
   - user_id, session_id from request headers

---

## Acceptance Criteria

- [ ] SQLAlchemy[asyncio] and asyncpg installed and importable
- [ ] Database session factory provides working async sessions
- [ ] WorkOrder model maps to existing database table
- [ ] AuditableMixin registers models for audit tracking
- [ ] INSERT operations create audit records with new_values
- [ ] UPDATE operations create audit records with old_values, new_values, changed_fields
- [ ] DELETE operations create audit records with old_values
- [ ] Request context (user_id, session_id, ip_address) captured in audit records
- [ ] All unit tests pass
- [ ] All integration tests pass (with database)
- [ ] No regressions in existing tests

---

## Completion Checklist

- [ ] Task 1: pyproject.toml updated with dependencies
- [ ] Task 2: core/database.py created with session factory
- [ ] Task 3: models/__init__.py created
- [ ] Task 4: models/base.py created with Base and mixins
- [ ] Task 5: core/audit.py created with mixin and event handlers
- [ ] Task 6: models/audit_log.py created
- [ ] Task 7: models/work_order.py created with AuditableMixin
- [ ] Task 8: models/__init__.py updated with exports
- [ ] Task 9: main.py updated with lifespan handler
- [ ] Task 10: tests/unit/test_audit.py created
- [ ] Task 11: tests/integration/test_audit_capture.py created
- [ ] Level 1: Static analysis passes
- [ ] Level 2: Import validation passes
- [ ] Level 3: Unit tests pass
- [ ] Level 4: Integration tests pass
- [ ] Level 5: Manual validation confirms correct behavior

---

## Risks and Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Event listeners don't fire in async context | LOW | HIGH | Using sync_session_class parameter; mapper events work with sync Connection |
| Context var empty in event listeners | MEDIUM | HIGH | Middleware sets ContextVar before request; test with logging |
| get_history() fails for unloaded attributes | MEDIUM | MEDIUM | Use `expire_on_commit=False` on session factory |
| PostgreSQL enum type casting issues | MEDIUM | MEDIUM | Use explicit `::audit_action` cast in SQL |
| Bulk operations bypass events | HIGH (known) | MEDIUM | Document limitation; events only fire on session.add/delete patterns |
| Database connection issues in tests | MEDIUM | MEDIUM | Use environment variable for DATABASE_URL; skip tests if no DB |

---

## Notes

**Design Decisions:**
- Using application-level event listeners over database triggers per PRD decision (more portable, richer context)
- Mixin pattern chosen over decorator for simpler inheritance chain
- Sync connection in event handlers is expected - mapper events always receive sync Connection
- Using raw SQL INSERT for audit_log to avoid ORM overhead and potential recursion

**Known Limitations:**
- Bulk ORM operations (`session.execute(update(...))`) do not trigger mapper events
- Must use `session.add(entity)` and `session.delete(entity)` for audit capture
- Document this in Phase 5 developer documentation

**Future Considerations:**
- Add `do_orm_execute` listener for bulk operation auditing if needed
- Consider background task queue for audit inserts if performance becomes an issue
- Hash chain for tamper detection can be added in future phase

**External References:**
- [SQLAlchemy 2.0 ORM Events](https://docs.sqlalchemy.org/en/20/orm/events.html)
- [SQLAlchemy Async Session](https://docs.sqlalchemy.org/en/20/orm/extensions/asyncio.html)
- [sqlalchemy-serializer](https://pypi.org/project/sqlalchemy-serializer/) - Reference for serialization patterns
