# Audit Infrastructure

Automatic audit logging for SQLAlchemy models, capturing INSERT, UPDATE, and DELETE operations with full context.

## Quick Start (3 Steps)

### Step 1: Add AuditableMixin to Your Model

```python
from core.audit import AuditableMixin
from models.base import Base

class MyEntity(Base, AuditableMixin):
    __tablename__ = "my_entity"

    # Your model must have a `uuid` attribute for audit tracking
    uuid: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), unique=True)

    # ... other fields
```

### Step 2: Register Audit Listeners at Startup

In `models/__init__.py`, add your model to the registration function:

```python
from core.audit import register_audit_listeners

def register_all_audit_listeners() -> None:
    register_audit_listeners(MyEntity)
    # ... other auditable models
```

### Step 3: Ensure UUID Attribute Exists

Your model must have a `uuid` attribute. The audit system uses this as the entity identifier in audit records.

That's it! All INSERT, UPDATE, and DELETE operations on your model will now be automatically logged.

## How It Works

### SQLAlchemy Event Listeners

The audit system uses SQLAlchemy's event system to capture changes:

1. **after_insert**: Captures the full new entity state
2. **after_update**: Captures changed fields with old and new values
3. **after_delete**: Captures the full entity state before deletion

### Request Context

When middleware is configured, the audit system captures:
- `user_id`: From the `X-User-ID` header
- `session_id`: From the `X-Session-ID` header (auto-generated if missing)
- `ip_address`: From the client connection

### Change Detection

For UPDATE operations, only actual changes are logged:
- `changed_fields`: List of field names that changed
- `old_values`: Previous values for changed fields
- `new_values`: Current values for all fields

## API Reference

### Retrieve Audit History

```
GET /api/v1/audit/{entity_type}/{entity_id}
```

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `page` | int | Page number (default: 1) |
| `page_size` | int | Items per page (default: 50, max: 100) |
| `from_date` | datetime | Filter records from this date |
| `to_date` | datetime | Filter records until this date |
| `action` | enum | Filter by action: INSERT, UPDATE, DELETE |
| `user_id` | string | Filter by user ID |

**Response:**
```json
{
  "items": [
    {
      "id": 123,
      "entity_type": "work_order",
      "entity_id": "550e8400-e29b-41d4-a716-446655440000",
      "action": "UPDATE",
      "old_values": {"status": "created"},
      "new_values": {"status": "in_progress"},
      "changed_fields": ["status"],
      "user_id": "user-123",
      "session_id": "session-456",
      "ip_address": "192.168.1.1",
      "created_at": "2024-01-15T10:30:00Z"
    }
  ],
  "total": 15,
  "page": 1,
  "page_size": 50,
  "has_next": false
}
```

## Configuration

### Custom Entity Type

By default, the entity type is taken from `__tablename__`. Override it with:

```python
class MyEntity(Base, AuditableMixin):
    __tablename__ = "my_table"
    __audit_entity_type_override__ = "custom_entity_name"
```

### Request Headers

The middleware extracts context from these headers:
- `X-User-ID`: Identifies the user making the request
- `X-Session-ID`: Session identifier (auto-generated UUID if not provided)

## Database Schema

The `audit_log` table:

```sql
CREATE TABLE audit_log (
    id SERIAL PRIMARY KEY,
    entity_type VARCHAR(100) NOT NULL,
    entity_id UUID NOT NULL,
    action audit_action NOT NULL,  -- 'INSERT', 'UPDATE', 'DELETE'
    old_values JSONB,
    new_values JSONB,
    changed_fields TEXT[],
    user_id VARCHAR(255),
    session_id VARCHAR(255),
    ip_address INET,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Note:** Audit records are immutable by design. DELETE and UPDATE operations on the audit_log table are blocked by database triggers.

## Troubleshooting

### "must have AuditableMixin" Error

Your model class must inherit from `AuditableMixin`:

```python
class MyEntity(Base, AuditableMixin):  # Include AuditableMixin
    ...
```

### Audit Records Not Created

1. **Check listener registration**: Ensure `register_audit_listeners(MyModel)` is called
2. **Verify model has `uuid`**: The audit system requires a `uuid` attribute
3. **Check transaction commit**: Audit records are created in the same transaction

### Context Not Captured

Ensure the request context middleware is registered:

```python
# In main.py
from core.middleware import RequestContextMiddleware

app.add_middleware(RequestContextMiddleware)
```

### No UPDATE Record for Changes

The system skips UPDATE records when no fields actually changed. This prevents noise from "save" operations that don't modify data.

## Examples

### Test Audit Integration

```python
from models.audit_log import AuditLog
from sqlalchemy import select

# After creating/updating an entity
result = await session.execute(
    select(AuditLog).where(
        AuditLog.entity_type == "my_entity",
        AuditLog.entity_id == entity.uuid,
    )
)
audit_records = result.scalars().all()
```

### Query Audit History via API

```bash
# Get all audit records for an entity
curl "http://localhost:8000/api/v1/audit/work_order/550e8400-e29b-41d4-a716-446655440000"

# Filter by action
curl "http://localhost:8000/api/v1/audit/work_order/{uuid}?action=UPDATE"

# Filter by user
curl "http://localhost:8000/api/v1/audit/work_order/{uuid}?user_id=user-123"
```
