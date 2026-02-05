# Feature: Customer CRUD API (Phase 1)

## Summary

Create a Customer entity as a first-class backend resource with full CRUD endpoints (list with search/pagination/sorting, create, get, update, delete). This is Phase 1 of customer management — establishing the database table, SQLAlchemy model, Pydantic schemas, CRUD operations, FastAPI router, and comprehensive tests. The implementation mirrors the existing Aircraft entity pattern exactly.

## User Story

As an MRO service writer
I want to create and manage customer records in the system
So that I have a single source of truth for customer information instead of free-text fields

## Problem Statement

Customer data is currently stored as denormalized `customer_name` text fields on aircraft and work order records. There is no single source of truth — the same customer can be spelled differently across records, and there's nowhere to store contact details (email, phone, address).

## Solution Statement

Create a `customer` database table with core contact fields, a SQLAlchemy model, Pydantic schemas, async CRUD operations with pagination/search/sorting, and a FastAPI router at `/api/v1/customers`. Follow the exact patterns established by the Aircraft entity.

## Metadata

| Field            | Value                                              |
| ---------------- | -------------------------------------------------- |
| Type             | NEW_CAPABILITY                                     |
| Complexity       | LOW                                                |
| Systems Affected | Database (Flyway), FastAPI backend (model, schema, CRUD, router, tests) |
| Dependencies     | SQLAlchemy 2.0+, FastAPI, Pydantic, asyncpg        |
| Estimated Tasks  | 9                                                  |

---

## UX Design

### Before State

```
╔═══════════════════════════════════════════════════════════════════════════╗
║                              BEFORE STATE                               ║
╠═══════════════════════════════════════════════════════════════════════════╣
║                                                                         ║
║   No Customer API exists. Customer data is scattered:                   ║
║                                                                         ║
║   ┌──────────────┐         ┌────────────────┐                           ║
║   │   Aircraft   │         │  Work Order    │                           ║
║   │ customer_name│         │ customer_name  │                           ║
║   │  (free text) │         │ customer_po_num│                           ║
║   └──────────────┘         └────────────────┘                           ║
║                                                                         ║
║   DATA_FLOW: User types customer name as free text on each record       ║
║   PAIN_POINT: No searchable customer list, no contact details storage   ║
║                                                                         ║
╚═══════════════════════════════════════════════════════════════════════════╝
```

### After State

```
╔═══════════════════════════════════════════════════════════════════════════╗
║                               AFTER STATE                               ║
╠═══════════════════════════════════════════════════════════════════════════╣
║                                                                         ║
║   Customer is a first-class API resource:                               ║
║                                                                         ║
║   ┌──────────────────────────────────────────────────────────────┐      ║
║   │                  /api/v1/customers                           │      ║
║   │  GET    /              List with search, pagination, sort   │      ║
║   │  POST   /              Create new customer                  │      ║
║   │  GET    /{id}          Get customer detail                  │      ║
║   │  PUT    /{id}          Update customer                      │      ║
║   │  DELETE /{id}          Delete customer                      │      ║
║   └──────────────────────────────────────────────────────────────┘      ║
║                           │                                             ║
║                           ▼                                             ║
║   ┌──────────────────────────────────────────────────────────────┐      ║
║   │  customer table                                              │      ║
║   │  id, uuid, name, email, phone, phone_type, address,         │      ║
║   │  address_2, city, state, zip, country, notes, is_active,    │      ║
║   │  created_by, updated_by, created_at, updated_at             │      ║
║   └──────────────────────────────────────────────────────────────┘      ║
║                                                                         ║
║   DATA_FLOW: API → CRUD → SQLAlchemy model → PostgreSQL table           ║
║   VALUE_ADD: Searchable, paginated customer list with contact info      ║
║                                                                         ║
╚═══════════════════════════════════════════════════════════════════════════╝
```

### Interaction Changes

| Location             | Before            | After                          | User Impact                         |
|----------------------|-------------------|--------------------------------|-------------------------------------|
| `GET /api/v1/customers`    | Does not exist    | Returns paginated customer list | Can search/browse all customers |
| `POST /api/v1/customers`   | Does not exist    | Creates customer record         | Can store customer with contact info |
| `GET /api/v1/customers/{id}` | Does not exist  | Returns full customer detail    | Can view individual customer data |
| `PUT /api/v1/customers/{id}` | Does not exist  | Updates customer record         | Can edit customer information |
| `DELETE /api/v1/customers/{id}` | Does not exist | Deletes customer              | Can remove customers |

---

## Mandatory Reading

**CRITICAL: Implementation agent MUST read these files before starting any task:**

| Priority | File | Lines | Why Read This |
|----------|------|-------|---------------|
| P0 | `app/api/models/aircraft.py` | 1-41 | Model pattern to MIRROR exactly |
| P0 | `app/api/schemas/aircraft.py` | 1-92 | Schema pattern (Base/Create/Update/Response/ListResponse) |
| P0 | `app/api/crud/aircraft.py` | 1-193 | CRUD pattern (list/get/create/update/delete with pagination, sorting, search) |
| P0 | `app/api/routers/aircraft.py` | 1-138 | Router pattern (endpoints, conversion function, error handling) |
| P1 | `app/api/core/database.py` | 1-36 | Base class and get_db dependency |
| P1 | `app/api/core/sorting.py` | 1-7 | SortOrder enum |
| P1 | `app/api/models/__init__.py` | 1-8 | Model export pattern |
| P1 | `app/api/schemas/__init__.py` | 1-67 | Schema export pattern |
| P1 | `app/api/crud/__init__.py` | 1-69 | CRUD export pattern |
| P1 | `app/api/routers/__init__.py` | 1-18 | Router export pattern |
| P1 | `app/api/main.py` | 1-50 | Router registration pattern |
| P2 | `app/api/tests/conftest.py` | 1-290 | Test fixture pattern |
| P2 | `database/migrations/V006__create_aircraft_table.sql` | all | Migration SQL pattern |

---

## Patterns to Mirror

**MODEL_PATTERN:**
```python
# SOURCE: app/api/models/aircraft.py:1-41
# COPY THIS PATTERN:
from sqlalchemy import String, Integer, ForeignKey, Boolean, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from datetime import datetime
from uuid import UUID, uuid4

from core.database import Base

class Aircraft(Base):
    __tablename__ = "aircraft"

    id: Mapped[int] = mapped_column(primary_key=True)
    uuid: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True), unique=True, default=uuid4
    )
    # ... fields ...
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

    # Audit
    created_by: Mapped[str] = mapped_column(String(100))
    updated_by: Mapped[str | None] = mapped_column(String(100))
    created_at: Mapped[datetime] = mapped_column(default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        default=datetime.utcnow, onupdate=datetime.utcnow
    )
```

**SCHEMA_PATTERN:**
```python
# SOURCE: app/api/schemas/aircraft.py:1-92
# COPY THIS PATTERN:
# - Base schema: common fields
# - Create schema extends Base, adds created_by: str
# - Update schema extends BaseModel directly, ALL fields optional, adds updated_by
# - Response schema: explicit fields, id: UUID (mapped from model.uuid), Config from_attributes=True
# - ListResponse: items: list[Response], total: int, page: int, page_size: int
```

**CRUD_LIST_PATTERN:**
```python
# SOURCE: app/api/crud/aircraft.py:23-85
# COPY THIS PATTERN:
# - SORT_COLUMNS dict mapping string keys to model columns
# - filters list built conditionally
# - ilike search across multiple columns
# - func.count for total
# - Separate count query with same filters
# - Return tuple[list[Model], int]
```

**CRUD_CREATE_PATTERN:**
```python
# SOURCE: app/api/crud/aircraft.py:99-131
# COPY THIS PATTERN:
# - Construct model instance from schema fields
# - db.add(model)
# - await db.flush()
# - await db.refresh(model)  (no relationship attrs for Customer in Phase 1)
# - return model
```

**CRUD_UPDATE_PATTERN:**
```python
# SOURCE: app/api/crud/aircraft.py:134-163
# COPY THIS PATTERN:
# - Get by UUID first, return None if not found
# - model_dump(exclude_unset=True) for partial updates
# - setattr loop for each field
# - Set updated_at = datetime.utcnow()
# - flush + refresh + return
```

**CRUD_DELETE_PATTERN:**
```python
# SOURCE: app/api/crud/aircraft.py:166-192
# COPY THIS PATTERN:
# - Get by UUID first, return False if not found
# - Check for dependent records (future: aircraft_customer, work_orders with customer_id)
# - For Phase 1: no constraints to check yet (relationships come in Phase 2)
# - await db.delete(model), return True
```

**ROUTER_PATTERN:**
```python
# SOURCE: app/api/routers/aircraft.py:1-138
# COPY THIS PATTERN:
# - APIRouter(prefix="/customers", tags=["customers"])
# - customer_to_response() conversion function
# - GET "" → list (page, page_size, search, sort_by Literal, sort_order)
# - POST "" → create (status_code=201)
# - GET "/{customer_id}" → get
# - PUT "/{customer_id}" → update
# - DELETE "/{customer_id}" → delete (status_code=204)
# - ValueError → HTTPException(400)
# - Not found → HTTPException(404)
```

**TEST_FIXTURE_PATTERN:**
```python
# SOURCE: app/api/tests/conftest.py:111-127
# COPY THIS PATTERN:
@pytest.fixture
async def test_customer(test_session: AsyncSession) -> Customer:
    """Create a test customer."""
    customer = Customer(
        uuid=uuid4(),
        name="Test Customer",
        # ... fields ...
        created_by="test_user",
    )
    test_session.add(customer)
    await test_session.commit()
    await test_session.refresh(customer)
    return customer
```

---

## Files to Change

| File                                              | Action | Justification                           |
| ------------------------------------------------- | ------ | --------------------------------------- |
| `database/migrations/V008__create_customer_table.sql` | CREATE | Customer table DDL                  |
| `app/api/models/customer.py`                      | CREATE | SQLAlchemy model for Customer           |
| `app/api/models/__init__.py`                      | UPDATE | Export Customer model                   |
| `app/api/schemas/customer.py`                     | CREATE | Pydantic schemas (Base/Create/Update/Response/ListResponse) |
| `app/api/schemas/__init__.py`                     | UPDATE | Export Customer schemas                 |
| `app/api/crud/customer.py`                        | CREATE | Async CRUD operations                   |
| `app/api/crud/__init__.py`                        | UPDATE | Export Customer CRUD functions           |
| `app/api/routers/customers.py`                    | CREATE | FastAPI router for `/customers`         |
| `app/api/routers/__init__.py`                     | UPDATE | Export customers_router                 |
| `app/api/main.py`                                 | UPDATE | Register customers_router               |
| `app/api/tests/conftest.py`                       | UPDATE | Add test_customer fixture               |
| `app/api/tests/integration/test_customers_api.py` | CREATE | Integration tests for all endpoints     |

---

## NOT Building (Scope Limits)

- **Aircraft-customer join table** — Phase 2 scope; customer is standalone in Phase 1
- **Work order customer_id FK** — Phase 2 scope; requires join table first
- **Dropping customer_name from aircraft/work_order** — Phase 2 scope; remove denormalized fields when FK is added
- **Frontend pages** — Phase 3 scope
- **Billing profiles, tax overrides, addresses** — explicitly deferred per PRD
- **Advanced search with multiple filters** — basic name search sufficient for v1

---

## Step-by-Step Tasks

Execute in order. Each task is atomic and independently verifiable.

### Task 1: CREATE `database/migrations/V008__create_customer_table.sql`

- **ACTION**: Create Flyway migration for customer table
- **IMPLEMENT**:
  ```sql
  CREATE TABLE customer (
      id SERIAL PRIMARY KEY,
      uuid UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
      name VARCHAR(200) NOT NULL,
      email VARCHAR(200),
      phone VARCHAR(30),
      phone_type VARCHAR(20),
      address VARCHAR(200),
      address_2 VARCHAR(200),
      city VARCHAR(100),
      state VARCHAR(50),
      zip VARCHAR(20),
      country VARCHAR(100),
      notes TEXT,
      is_active BOOLEAN DEFAULT TRUE,

      -- Audit
      created_by VARCHAR(100) NOT NULL,
      updated_by VARCHAR(100),
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
  );

  CREATE INDEX idx_customer_uuid ON customer(uuid);
  CREATE INDEX idx_customer_name ON customer(name);
  CREATE INDEX idx_customer_created_at ON customer(created_at);
  ```
- **MIRROR**: `database/migrations/V006__create_aircraft_table.sql` — same DDL pattern
- **GOTCHA**: Customer `city`/`state`/`zip` are plain string fields, NOT a FK to the `city` table (which is for MRO service center locations). Customer address fields are freeform contact info.
- **GOTCHA**: Use `VARCHAR(200)` for name to match existing `customer_name` field sizing.
- **VALIDATE**: `make db-validate` (Flyway validates migration syntax)

### Task 2: CREATE `app/api/models/customer.py`

- **ACTION**: Create SQLAlchemy model for Customer
- **IMPLEMENT**: Customer class inheriting from Base with all table columns
- **MIRROR**: `app/api/models/aircraft.py:1-41`
- **IMPORTS**: `from core.database import Base`
- **FIELDS**: id, uuid, name, email, phone, phone_type, address, address_2, city, state, zip, country, notes, is_active, audit fields
- **GOTCHA**: `city` is a plain `String(100)` column (customer address city), not a FK to `city` table. Use descriptive field name `city` to match the migration.
- **GOTCHA**: `zip` is a Python builtin, but `mapped_column` name is fine since it's a column attribute, not a local variable
- **VALIDATE**: Import the model in a Python shell — `python -c "from models.customer import Customer"`

### Task 3: UPDATE `app/api/models/__init__.py`

- **ACTION**: Add Customer import and export
- **IMPLEMENT**: Add `from models.customer import Customer` and include in `__all__`
- **MIRROR**: `app/api/models/__init__.py:1-8` — follow existing import/export pattern
- **VALIDATE**: `python -c "from models import Customer"`

### Task 4: CREATE `app/api/schemas/customer.py`

- **ACTION**: Create Pydantic schemas for Customer
- **IMPLEMENT**:
  - `CustomerBase(BaseModel)`: name (required str), email, phone, phone_type, address, address_2, city, state, zip, country, notes (all `str | None = None`), is_active (bool = True)
  - `CustomerCreate(CustomerBase)`: adds `created_by: str`
  - `CustomerUpdate(BaseModel)`: all fields optional including `name: str | None = None`, `updated_by: str | None = None`, `is_active: bool | None = None`
  - `CustomerResponse(BaseModel)`: explicit fields, `id: UUID` (from model.uuid), audit fields, `Config: from_attributes = True`
  - `CustomerListResponse(BaseModel)`: `items: list[CustomerResponse]`, `total: int`, `page: int`, `page_size: int`
- **MIRROR**: `app/api/schemas/aircraft.py:1-92`
- **GOTCHA**: Response schema `id` maps from model `uuid` (done in router conversion function). No nested relationship schemas needed for Phase 1.
- **VALIDATE**: `python -c "from schemas.customer import CustomerCreate, CustomerResponse, CustomerListResponse"`

### Task 5: UPDATE `app/api/schemas/__init__.py`

- **ACTION**: Add Customer schema imports and exports
- **IMPLEMENT**: Import `CustomerCreate`, `CustomerUpdate`, `CustomerResponse`, `CustomerListResponse` from `schemas.customer`; add to `__all__`
- **MIRROR**: `app/api/schemas/__init__.py:31-36` — follow aircraft import pattern
- **VALIDATE**: `python -c "from schemas import CustomerCreate, CustomerResponse"`

### Task 6: CREATE `app/api/crud/customer.py`

- **ACTION**: Create async CRUD operations for Customer
- **IMPLEMENT**:
  - `CUSTOMER_SORT_COLUMNS` dict: `name`, `email`, `created_at`
  - `get_customers()`: pagination, search (ilike on name, email, phone), active_only filter, sorting. Return `tuple[list[Customer], int]`
  - `get_customer_by_uuid()`: lookup by UUID, return `Customer | None`
  - `create_customer()`: construct from schema, flush + refresh, return Customer
  - `update_customer()`: get by UUID, `model_dump(exclude_unset=True)`, setattr loop, update timestamp, flush + refresh
  - `delete_customer()`: get by UUID, delete (no constraint checks in Phase 1 — relationships added in Phase 2)
- **MIRROR**: `app/api/crud/aircraft.py:1-193`
- **GOTCHA**: No FK lookups needed (customer has no FKs in Phase 1), so create/update are simpler than aircraft
- **GOTCHA**: No `selectinload` needed (no relationships to eager-load in Phase 1)
- **VALIDATE**: `make api-test` (unit imports work)

### Task 7: UPDATE `app/api/crud/__init__.py`

- **ACTION**: Add Customer CRUD function imports and exports
- **IMPLEMENT**: Import `get_customers`, `get_customer_by_uuid`, `create_customer`, `update_customer`, `delete_customer` from `crud.customer`; add to `__all__`
- **MIRROR**: `app/api/crud/__init__.py:31-37` — follow aircraft import pattern
- **VALIDATE**: `python -c "from crud import get_customers, create_customer"`

### Task 8: CREATE `app/api/routers/customers.py`

- **ACTION**: Create FastAPI router for Customer endpoints
- **IMPLEMENT**:
  - `router = APIRouter(prefix="/customers", tags=["customers"])`
  - `customer_to_response()`: maps model to `CustomerResponse` (model.uuid → response.id)
  - `GET ""`: list customers with `page`, `page_size`, `search`, `active_only`, `sort_by` (Literal["name", "email", "created_at"]), `sort_order`
  - `POST ""`: create customer (status_code=201)
  - `GET "/{customer_id}"`: get by UUID (404 if not found)
  - `PUT "/{customer_id}"`: update (404 if not found, 400 on ValueError)
  - `DELETE "/{customer_id}"`: delete (204, 404 if not found)
- **MIRROR**: `app/api/routers/aircraft.py:1-138`
- **GOTCHA**: No city filter parameter (customers are global, not scoped to city)
- **VALIDATE**: Start dev server and hit endpoints with curl

### Task 8b: UPDATE `app/api/routers/__init__.py` and `app/api/main.py`

- **ACTION**: Register the customers router
- **IMPLEMENT**:
  - `routers/__init__.py`: Add `from routers.customers import router as customers_router` and include in `__all__`
  - `main.py`: Import `customers_router` and add `app.include_router(customers_router, prefix=settings.api_v1_prefix)`
- **MIRROR**: `app/api/routers/__init__.py:6` and `app/api/main.py:38` — follow aircraft registration pattern
- **VALIDATE**: `make api-run` — server starts without error, `/docs` shows customer endpoints

### Task 9: CREATE tests — UPDATE `conftest.py` + CREATE `test_customers_api.py`

- **ACTION**: Add test fixtures and integration tests
- **IMPLEMENT**:

  **conftest.py additions:**
  - Import `Customer` model
  - `test_customer` fixture: Customer with name="Test Customer", email="test@example.com", phone="555-0100", is_active=True
  - `test_customer_inactive` fixture: Customer with is_active=False

  **test_customers_api.py test classes:**
  - `TestListCustomers`:
    - `test_list_customers_returns_active_by_default` — verify only active customers returned
    - `test_list_customers_empty` — verify empty list response
    - `test_list_customers_search` — verify search filters by name
    - `test_list_customers_pagination` — verify page/page_size work
    - `test_list_customers_sorting` — verify sort_by and sort_order
    - `test_list_customers_include_inactive` — verify active_only=false
  - `TestGetCustomer`:
    - `test_get_customer_by_id` — verify full response
    - `test_get_customer_not_found` — verify 404
  - `TestCreateCustomer`:
    - `test_create_customer_minimal` — name + created_by only
    - `test_create_customer_full` — all fields populated
    - `test_create_customer_missing_name` — verify 422 validation error
  - `TestUpdateCustomer`:
    - `test_update_customer_partial` — update single field
    - `test_update_customer_not_found` — verify 404
  - `TestDeleteCustomer`:
    - `test_delete_customer` — verify 204
    - `test_delete_customer_not_found` — verify 404

- **MIRROR**: `app/api/tests/conftest.py:111-127` for fixtures; `app/api/tests/integration/test_cities_api.py` for test structure
- **GOTCHA**: Tests use in-memory SQLite — ensure Customer model is compatible (no PostgreSQL-specific column types in model besides UUID which is handled by Base.metadata.create_all)
- **VALIDATE**: `make api-test` — all tests pass; `make api-test-cov` — coverage >= 80%

---

## Testing Strategy

### Integration Tests to Write

| Test File | Test Cases | Validates |
|-----------|-----------|-----------|
| `tests/integration/test_customers_api.py` | list (active/inactive/empty/search/pagination/sorting), get (found/not found), create (minimal/full/validation), update (partial/not found), delete (success/not found) | All CRUD endpoints |

### Edge Cases Checklist

- [ ] Empty string name on create (should fail validation — name is required)
- [ ] Missing `created_by` on create (should fail validation)
- [ ] Very long name (200 chars — should work; 201 should be handled by DB constraint)
- [ ] Search with special characters (%, _)
- [ ] Update with empty body (should be no-op, return unchanged customer)
- [ ] Delete non-existent customer (should return 404)
- [ ] List with page beyond available data (should return empty items, correct total)
- [ ] Sort by invalid column (should fall back to created_at default)

---

## Validation Commands

### Level 1: STATIC_ANALYSIS

```bash
cd app/api && python -c "from models.customer import Customer; from schemas.customer import CustomerCreate, CustomerResponse; from crud.customer import get_customers; from routers.customers import router; print('All imports OK')"
```

**EXPECT**: Exit 0, "All imports OK"

### Level 2: UNIT_TESTS

```bash
make api-test
```

**EXPECT**: All tests pass including new customer tests

### Level 3: COVERAGE

```bash
make api-test-cov
```

**EXPECT**: Coverage >= 80% (project threshold is 70%, PRD requires 80%)

### Level 4: DATABASE_VALIDATION

```bash
make db-validate
```

**EXPECT**: Flyway validates V008 migration successfully

### Level 5: MANUAL_VALIDATION

1. Start API server: `make api-run`
2. Open Swagger docs: `http://localhost:8000/docs`
3. Verify `/api/v1/customers` endpoints appear
4. Create a customer via POST
5. List customers via GET
6. Get customer by ID
7. Update customer via PUT
8. Delete customer via DELETE
9. Verify search and pagination work

---

## Acceptance Criteria

- [ ] V008 migration creates `customer` table with all specified columns and indexes
- [ ] Customer model follows exact same pattern as Aircraft model
- [ ] All 5 CRUD endpoints functional (`GET /`, `POST /`, `GET /{id}`, `PUT /{id}`, `DELETE /{id}`)
- [ ] List endpoint supports search, pagination, sorting, active_only filter
- [ ] Search matches across name, email, and phone fields
- [ ] All integration tests pass
- [ ] Code coverage >= 80% for new customer code
- [ ] No regressions in existing tests
- [ ] API docs show customer endpoints at `/docs`

---

## Completion Checklist

- [ ] All 9 tasks completed in dependency order
- [ ] Each task validated immediately after completion
- [ ] Level 1: Import check passes
- [ ] Level 2: All tests pass (`make api-test`)
- [ ] Level 3: Coverage >= 80% (`make api-test-cov`)
- [ ] Level 4: Flyway validates migration (`make db-validate`)
- [ ] All acceptance criteria met

---

## Risks and Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| SQLite test compatibility with UUID column type | Low | Medium | Existing models use same PG_UUID pattern and tests pass with SQLite — proven approach |
| Customer `city` field confusion with `city` table | Low | Medium | Customer `city` is a plain varchar for mailing address; document clearly in model comments |
| Migration version conflict if other PRs merge first | Low | Low | Check latest migration number before creating; Flyway catches conflicts |

---

## Notes

- Customer `city`, `state`, `zip`, `country` are freeform address fields for customer contact info — NOT related to the MRO `city` table (service center locations)
- `phone_type` field allows categorizing phone numbers (e.g., "mobile", "office", "fax") — simple varchar, not an enum
- The `name` field is the only required field besides `created_by` (matching the minimal data needed to create a useful customer record)
- Phase 2 will add `aircraft_customer` join table and `customer_id` FK on `work_order`, requiring model relationship additions to Customer — plan the model to be extensible
- No `customer_po_number` field on Customer — PO numbers are per-work-order, not per-customer (Phase 2 will handle this)
