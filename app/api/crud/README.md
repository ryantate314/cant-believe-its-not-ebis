# CRUD Layer (Data Access Layer)

This directory contains the data access layer for the API, implementing CRUD (Create, Read, Update, Delete) operations for each domain entity.

## Pattern

This follows a **function-based repository pattern** common in FastAPI applications. Rather than class-based repositories, each module exports standalone async functions that:

1. Accept an `AsyncSession` as the first parameter (injected via FastAPI dependencies)
2. Encapsulate all SQLAlchemy queries and database logic
3. Return domain models or simple results

```python
# Example usage in a router
from crud import get_work_orders, create_work_order

@router.get("/work-orders")
async def list_work_orders(db: AsyncSession = Depends(get_db)):
    work_orders, total = await get_work_orders(db, city_uuid=...)
    return work_orders
```

## Why This Pattern?

### Separation of Concerns

Routers handle HTTP concerns (request/response, validation, status codes). CRUD functions handle data access. This keeps routers thin and focused.

```
Router (HTTP layer)
    ↓
CRUD functions (Data access layer)
    ↓
SQLAlchemy Models (ORM layer)
    ↓
PostgreSQL (Database)
```

### Testability

- **Unit tests**: Mock CRUD functions to test router logic in isolation
- **Integration tests**: Use a test database with real CRUD functions to verify queries

```python
# Unit test - mock the CRUD function
@patch("routers.work_orders.get_work_orders")
async def test_list_work_orders(mock_get):
    mock_get.return_value = ([], 0)
    response = await client.get("/work-orders")
    assert response.status_code == 200

# Integration test - use real database
async def test_create_work_order_integration(db_session):
    work_order = await create_work_order(db_session, WorkOrderCreate(...))
    assert work_order.id is not None
```

### Reusability

CRUD functions can be composed and reused across multiple routers or background tasks:

```python
# Used by work order router AND labor kit application
work_order = await get_work_order_by_uuid(db, wo_uuid)
```

## Module Structure

Each file corresponds to a domain entity:

| File | Entity | Operations |
|------|--------|------------|
| `city.py` | City/Location | Read-only (seeded data) |
| `work_order.py` | Work Order | Full CRUD + filtering/pagination |
| `work_order_item.py` | Work Order Line Items | Full CRUD |
| `labor_kit.py` | Labor Kit Templates | Full CRUD + apply to work order |
| `labor_kit_item.py` | Labor Kit Line Items | Full CRUD |
| `aircraft.py` | Aircraft Registry | Full CRUD |
| `dashboard.py` | Dashboard Aggregations | Read-only queries |

## Conventions

### Function Naming

- `get_{entity}s` - List with pagination/filtering
- `get_{entity}_by_uuid` - Single lookup by UUID
- `create_{entity}` - Create new record
- `update_{entity}` - Update existing record
- `delete_{entity}` - Delete record

### Return Types

- List operations return `tuple[list[Model], int]` (items + total count for pagination)
- Single lookups return `Model | None`
- Create/Update return the model instance
- Delete returns `bool` (success/failure)

### UUID vs Internal ID

- External APIs use UUIDs for security (non-enumerable)
- Internal operations resolve UUIDs to integer IDs for foreign keys
- CRUD functions handle this translation

## Exports

All public functions are re-exported from `__init__.py` for clean imports:

```python
# Preferred
from crud import get_work_orders, create_work_order

# Also works
from crud.work_order import get_work_orders
```
