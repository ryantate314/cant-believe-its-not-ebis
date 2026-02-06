# Feature: Customer Relationships API (Phase 2)

## Summary

Create the aircraft-customer many-to-many relationship via a join table, add a customer FK to work orders, and auto-populate the customer on work order creation from the aircraft's primary customer. This phase replaces the denormalized `customer_name` string fields on aircraft and work orders with proper relational links to the Customer entity created in Phase 1. Includes new API endpoints for managing aircraft-customer links, updates to existing work order creation logic, and comprehensive tests.

## User Story

As an MRO service writer
I want customers to be linked to aircraft with a primary designation, and for work orders to automatically inherit the primary customer from the aircraft
So that customer data is consistent across all records and I don't have to manually type customer names

## Problem Statement

Customer data currently exists as denormalized `customer_name` text fields on the `aircraft` and `work_order` tables, plus `customer_po_number` on `work_order`. This means: (1) no referential integrity between customers and aircraft/work orders, (2) customer names can be inconsistent across records, (3) no way to view all aircraft or work orders for a given customer, (4) customer contact details are not accessible from work order context.

## Solution Statement

Introduce an `aircraft_customer` join table (many-to-many with `is_primary` flag), add a `customer_id` FK to `work_order`, drop the denormalized `customer_name`/`customer_po_number` columns, update models/schemas/CRUD/routers for all three entities, and add auto-linking logic to work order creation. Follow existing codebase patterns (SQLAlchemy relationships, nested Brief schemas in responses, delete constraint checks).

## Metadata

| Field            | Value                                              |
| ---------------- | -------------------------------------------------- |
| Type             | NEW_CAPABILITY                                     |
| Complexity       | MEDIUM                                             |
| Systems Affected | Database (Flyway), FastAPI backend (models, schemas, CRUD, routers, tests) |
| Dependencies     | SQLAlchemy 2.0+, FastAPI, Pydantic, asyncpg        |
| Estimated Tasks  | 12                                                 |

---

## UX Design

### Before State

```
+=========================================================================+
|                              BEFORE STATE                               |
+=========================================================================+
|                                                                         |
|   Customer CRUD exists (Phase 1) but is STANDALONE:                     |
|                                                                         |
|   +----------------+         +----------------+         +-----------+   |
|   |   Customer     |         |   Aircraft     |         | WorkOrder |   |
|   |   (table)      |         |   customer_name|         | cust_name |   |
|   |   id, name,    |   NO    |   (free text)  |   NO    | cust_po   |   |
|   |   email, ...   | <-LINK->|   "Acme Corp"  | <-LINK->| "Acme"    |   |
|   +----------------+         +----------------+         +-----------+   |
|                                                                         |
|   USER_FLOW: Staff manually types customer name on aircraft and WO      |
|   PAIN_POINT: No link between Customer records and Aircraft/WOs         |
|   DATA_FLOW: Customer name is copy-pasted text with no integrity        |
|                                                                         |
+=========================================================================+
```

### After State

```
+=========================================================================+
|                               AFTER STATE                               |
+=========================================================================+
|                                                                         |
|   Customer is LINKED to Aircraft and auto-populates on Work Orders:     |
|                                                                         |
|   +----------------+    M:N     +-------------------+                   |
|   |   Customer     |<--------->|   Aircraft        |                   |
|   |   id, name,    |   join:    |   (no cust_name)  |                   |
|   |   email, ...   |  aircraft_ |                   |                   |
|   +-------+--------+  customer  +--------+----------+                   |
|           |          (is_primary)         |                              |
|           |                              |                              |
|           | FK (customer_id)             | FK (aircraft_id)             |
|           v                              v                              |
|   +---------------------------------------------------+                |
|   |   WorkOrder                                        |                |
|   |   customer_id FK  (auto-populated from aircraft    |                |
|   |   primary customer on creation)                    |                |
|   |   (no customer_name, no customer_po_number)        |                |
|   +---------------------------------------------------+                |
|                                                                         |
|   USER_FLOW: Link customer to aircraft -> create WO -> customer auto   |
|   VALUE_ADD: Single source of truth, no manual entry, referential      |
|              integrity, can query all aircraft/WOs for a customer       |
|   DATA_FLOW: Customer --M:N--> Aircraft --auto--> WorkOrder            |
|                                                                         |
+=========================================================================+
```

### Interaction Changes

| Location | Before | After | User Impact |
|----------|--------|-------|-------------|
| `POST /customers/{id}/aircraft/{id}` | Does not exist | Links customer to aircraft | Can associate customers with aircraft |
| `DELETE /customers/{id}/aircraft/{id}` | Does not exist | Unlinks customer from aircraft | Can remove customer-aircraft association |
| `PUT /customers/{id}/aircraft/{id}/primary` | Does not exist | Sets primary customer for aircraft | Can designate which customer auto-populates WOs |
| `GET /customers/{id}/aircraft` | Does not exist | Lists aircraft for a customer | Can see all aircraft linked to a customer |
| `GET /aircraft/{id}` response | `customer_name: string` | `customers: [{id, name, is_primary}]` | Shows linked customer objects |
| `GET /work-orders/{id}` response | `customer_name: string` | `customer: {id, name} \| null` | Shows linked customer object |
| `POST /work-orders` | Manual `customer_name` text | Auto-populates `customer_id` from aircraft primary | No manual customer entry needed |
| `DELETE /customers/{id}` | No constraint check | Checks for linked aircraft/WOs | Cannot delete customer with associations |

---

## Mandatory Reading

**CRITICAL: Implementation agent MUST read these files before starting any task:**

| Priority | File | Lines | Why Read This |
|----------|------|-------|---------------|
| P0 | `app/api/models/aircraft.py` | 1-41 | Model to UPDATE — add customers relationship, remove customer_name |
| P0 | `app/api/models/work_order.py` | 1-116 | Model to UPDATE — add customer_id FK, remove denormalized fields |
| P0 | `app/api/models/customer.py` | 1-38 | Model to UPDATE — add aircraft and work_orders relationships |
| P0 | `app/api/crud/work_order.py` | 127-172 | `create_work_order` to UPDATE — add auto-linking logic |
| P0 | `app/api/crud/aircraft.py` | 166-193 | `delete_aircraft` — pattern for FK constraint checking |
| P0 | `app/api/crud/customer.py` | 122-132 | `delete_customer` — needs constraint checking added |
| P1 | `app/api/schemas/aircraft.py` | 1-92 | Schemas to UPDATE — remove customer_name, add customers list |
| P1 | `app/api/schemas/work_order.py` | 1-156 | Schemas to UPDATE — remove denormalized fields, add customer object |
| P1 | `app/api/routers/aircraft.py` | 26-50 | `aircraft_to_response` to UPDATE for new schema |
| P1 | `app/api/routers/work_orders.py` | 27-62 | `work_order_to_response` to UPDATE for new schema |
| P1 | `database/migrations/V007__add_aircraft_id_to_work_order.sql` | 1-33 | Reference migration pattern for denormalized→FK |
| P2 | `app/api/tests/conftest.py` | 1-331 | Test fixtures to UPDATE — add join table fixture |
| P2 | `app/api/tests/integration/test_work_orders_api.py` | 1-369 | Tests to UPDATE — references customer_name |
| P2 | `app/api/tests/integration/test_customers_api.py` | 1-301 | Tests to UPDATE — add delete constraint test |

---

## Patterns to Mirror

**FK_CONSTRAINT_CHECK (delete guard):**
```python
# SOURCE: app/api/crud/aircraft.py:166-193
# COPY THIS PATTERN for delete_customer:
async def delete_aircraft(db: AsyncSession, aircraft_uuid: UUID) -> bool:
    aircraft = await get_aircraft_by_uuid(db, aircraft_uuid)
    if not aircraft:
        return False

    from models.work_order import WorkOrder

    work_order_count_query = select(func.count(WorkOrder.id)).where(
        WorkOrder.aircraft_id == aircraft.id
    )
    count_result = await db.execute(work_order_count_query)
    work_order_count = count_result.scalar()

    if work_order_count > 0:
        raise ValueError(
            f"Cannot delete aircraft {aircraft.registration_number}: "
            f"it has {work_order_count} associated work order(s)"
        )

    await db.delete(aircraft)
    return True
```

**UUID_RESOLUTION (resolve UUID to int FK):**
```python
# SOURCE: app/api/crud/work_order.py:131-143
# COPY THIS PATTERN for resolving customer_id on work order:
city_query = select(City).where(City.uuid == work_order_in.city_id)
city_result = await db.execute(city_query)
city = city_result.scalar_one_or_none()
if not city:
    raise ValueError(f"City not found: {work_order_in.city_id}")
```

**NESTED_BRIEF_SCHEMA (for response objects):**
```python
# SOURCE: app/api/schemas/work_order.py:96-108
# COPY THIS PATTERN for CustomerBrief:
class AircraftBrief(BaseModel):
    """Brief aircraft info for work order response."""

    id: UUID
    registration_number: str
    serial_number: str | None
    make: str | None
    model: str | None
    year_built: int | None

    class Config:
        from_attributes = True
```

**RELATIONSHIP_DEFINITION (one-to-many):**
```python
# SOURCE: app/api/models/work_order.py:110-115
# COPY THIS PATTERN for WorkOrder.customer relationship:
city: Mapped["City"] = relationship("City", back_populates="work_orders")
aircraft: Mapped["Aircraft"] = relationship("Aircraft", back_populates="work_orders")
```

**SELECTINLOAD (eager loading relationships):**
```python
# SOURCE: app/api/crud/work_order.py:59-65
# COPY THIS PATTERN — add selectinload for customer:
query = (
    select(WorkOrder)
    .options(
        selectinload(WorkOrder.city),
        selectinload(WorkOrder.aircraft),
        selectinload(WorkOrder.items),
    )
    .where(WorkOrder.city_id == city.id)
)
```

**ROUTER_TO_RESPONSE (model→schema conversion with nested objects):**
```python
# SOURCE: app/api/routers/work_orders.py:27-62
# COPY THIS PATTERN — add customer brief:
def work_order_to_response(wo) -> WorkOrderResponse:
    return WorkOrderResponse(
        id=wo.uuid,
        # ...
        city=CityBrief(id=wo.city.uuid, code=wo.city.code, name=wo.city.name),
        aircraft=AircraftBrief(id=wo.aircraft.uuid, ...),
        # ...
    )
```

**MIGRATION_DENORM_TO_FK:**
```sql
-- SOURCE: database/migrations/V007__add_aircraft_id_to_work_order.sql
-- COPY THIS PATTERN for adding customer_id to work_order:
-- Step 1: Add nullable column
-- Step 2: Add FK constraint
-- Step 3: Create index
-- Step 4: Drop denormalized columns
```

**TEST_FIXTURE:**
```python
# SOURCE: app/api/tests/conftest.py:293-313
# COPY THIS PATTERN for join table fixture:
@pytest.fixture
async def test_customer(test_session: AsyncSession) -> Customer:
    customer = Customer(uuid=uuid4(), name="Test Customer", ...)
    test_session.add(customer)
    await test_session.commit()
    await test_session.refresh(customer)
    return customer
```

---

## Files to Change

| File | Action | Justification |
|------|--------|---------------|
| `database/migrations/V009__create_aircraft_customer_table.sql` | CREATE | Join table for M:N relationship |
| `database/migrations/V010__add_customer_id_to_work_order.sql` | CREATE | FK + drop denormalized columns |
| `app/api/models/aircraft_customer.py` | CREATE | SQLAlchemy model for join table |
| `app/api/models/customer.py` | UPDATE | Add aircraft and work_orders relationships |
| `app/api/models/aircraft.py` | UPDATE | Remove customer_name, add customers relationship |
| `app/api/models/work_order.py` | UPDATE | Remove customer_name/customer_po_number, add customer_id FK + relationship |
| `app/api/models/__init__.py` | UPDATE | Export AircraftCustomer model |
| `app/api/schemas/aircraft.py` | UPDATE | Remove customer_name, add customers list in response |
| `app/api/schemas/work_order.py` | UPDATE | Remove denormalized fields, add customer object in response |
| `app/api/schemas/customer.py` | UPDATE | Add CustomerBrief schema, AircraftCustomerResponse |
| `app/api/schemas/__init__.py` | UPDATE | Export new schemas |
| `app/api/crud/customer.py` | UPDATE | Add constraint checks to delete, add aircraft link/unlink/list functions |
| `app/api/crud/aircraft.py` | UPDATE | Remove customer_name from sort/search/create/update, add selectinload |
| `app/api/crud/work_order.py` | UPDATE | Auto-link customer on create, update search/sort, add selectinload |
| `app/api/crud/__init__.py` | UPDATE | Export new CRUD functions |
| `app/api/routers/customers.py` | UPDATE | Add aircraft relationship endpoints |
| `app/api/routers/aircraft.py` | UPDATE | Update aircraft_to_response for new schema |
| `app/api/routers/work_orders.py` | UPDATE | Update work_order_to_response for new schema |
| `app/api/tests/conftest.py` | UPDATE | Add aircraft_customer fixture, update test_work_order |
| `app/api/tests/integration/test_customers_api.py` | UPDATE | Add delete constraint test, add relationship endpoint tests |
| `app/api/tests/integration/test_work_orders_api.py` | UPDATE | Update tests referencing customer_name, add auto-link test |
| `app/api/tests/integration/test_aircraft_customers_api.py` | CREATE | Integration tests for relationship endpoints |

---

## NOT Building (Scope Limits)

- **Frontend pages/components** - Phase 3 scope (Customer List & Detail UI)
- **Frontend relationship UI** - Phase 4 scope (Aircraft-customer linking, WO customer display)
- **Customer PO number on work order** - The `customer_po_number` field is dropped in this phase. If PO tracking is needed later, it belongs on the work order itself, not as a customer-level field.
- **Data migration of existing customer_name values** - Per PRD decision, starting fresh (no deduplication of existing text data)
- **Billing profiles, tax overrides, addresses** - Explicitly deferred per PRD
- **Customer search from aircraft or work order context** - Phase 4 (relationship UI)

---

## Step-by-Step Tasks

Execute in order. Each task is atomic and independently verifiable.

### Task 1: CREATE `database/migrations/V009__create_aircraft_customer_table.sql`

- **ACTION**: Create Flyway migration for aircraft-customer join table
- **IMPLEMENT**:
  ```sql
  -- V009: Aircraft-Customer join table (many-to-many with primary designation)

  CREATE TABLE aircraft_customer (
      id SERIAL PRIMARY KEY,
      aircraft_id INTEGER NOT NULL REFERENCES aircraft(id) ON DELETE CASCADE,
      customer_id INTEGER NOT NULL REFERENCES customer(id) ON DELETE RESTRICT,
      is_primary BOOLEAN NOT NULL DEFAULT FALSE,

      -- Audit
      created_by VARCHAR(100) NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW(),

      -- Ensure unique pairing
      CONSTRAINT uq_aircraft_customer UNIQUE (aircraft_id, customer_id)
  );

  CREATE INDEX idx_aircraft_customer_aircraft_id ON aircraft_customer(aircraft_id);
  CREATE INDEX idx_aircraft_customer_customer_id ON aircraft_customer(customer_id);
  ```
- **MIRROR**: `database/migrations/V008__create_customer_table.sql` for DDL style
- **GOTCHA**: `ON DELETE CASCADE` for aircraft (if aircraft deleted, links are removed). `ON DELETE RESTRICT` for customer (prevent deleting customer with linked aircraft — enforce in CRUD too).
- **GOTCHA**: `is_primary` defaults to FALSE. Only one customer per aircraft should be primary — enforced in CRUD logic, not DB constraint (allows flexibility).
- **VALIDATE**: `make db-validate`

### Task 2: CREATE `database/migrations/V010__add_customer_id_to_work_order.sql`

- **ACTION**: Create Flyway migration to add customer FK and drop denormalized columns
- **IMPLEMENT**:
  ```sql
  -- V010: Add customer_id FK to work_order, drop denormalized customer fields

  -- Step 1: Add nullable customer_id column
  ALTER TABLE work_order ADD COLUMN customer_id INTEGER;

  -- Step 2: Add FK constraint (nullable — not all WOs have a customer)
  ALTER TABLE work_order ADD CONSTRAINT fk_work_order_customer
      FOREIGN KEY (customer_id) REFERENCES customer(id) ON DELETE SET NULL;

  -- Step 3: Create index
  CREATE INDEX idx_work_order_customer_id ON work_order(customer_id);

  -- Step 4: Drop denormalized customer fields
  ALTER TABLE work_order DROP COLUMN customer_name;
  ALTER TABLE work_order DROP COLUMN customer_po_number;

  -- Step 5: Drop denormalized customer_name from aircraft
  ALTER TABLE aircraft DROP COLUMN customer_name;
  ```
- **MIRROR**: `database/migrations/V007__add_aircraft_id_to_work_order.sql` for pattern
- **GOTCHA**: `customer_id` is NULLABLE (not all work orders have a customer). Use `ON DELETE SET NULL` (if customer is deleted somehow, WO keeps existing but loses customer link).
- **GOTCHA**: No data migration — per PRD, starting fresh. Existing customer_name values are simply dropped.
- **VALIDATE**: `make db-validate`

### Task 3: CREATE `app/api/models/aircraft_customer.py`

- **ACTION**: Create SQLAlchemy model for join table
- **IMPLEMENT**:
  ```python
  from sqlalchemy import Integer, ForeignKey, Boolean, String
  from sqlalchemy.orm import Mapped, mapped_column
  from datetime import datetime

  from core.database import Base


  class AircraftCustomer(Base):
      __tablename__ = "aircraft_customer"

      id: Mapped[int] = mapped_column(primary_key=True)
      aircraft_id: Mapped[int] = mapped_column(ForeignKey("aircraft.id"))
      customer_id: Mapped[int] = mapped_column(ForeignKey("customer.id"))
      is_primary: Mapped[bool] = mapped_column(Boolean, default=False)

      # Audit
      created_by: Mapped[str] = mapped_column(String(100))
      created_at: Mapped[datetime] = mapped_column(default=datetime.utcnow)
  ```
- **MIRROR**: `app/api/models/customer.py:1-38` for imports and structure
- **GOTCHA**: No UUID on join table — it's an internal-only record, never exposed via API as a standalone resource. Links are managed via customer/aircraft UUIDs.
- **GOTCHA**: No `updated_by`/`updated_at` — join records are created/deleted, not updated (is_primary is set via a dedicated endpoint).
- **VALIDATE**: `cd app/api && python -c "from models.aircraft_customer import AircraftCustomer"`

### Task 4: UPDATE `app/api/models/__init__.py`

- **ACTION**: Add AircraftCustomer import
- **IMPLEMENT**: Add `from models.aircraft_customer import AircraftCustomer` and `"AircraftCustomer"` to `__all__`
- **MIRROR**: Existing pattern in file (line 7: `from models.customer import Customer`)
- **VALIDATE**: `cd app/api && python -c "from models import AircraftCustomer"`

### Task 5: UPDATE `app/api/models/customer.py`

- **ACTION**: Add relationships to Aircraft (via join table) and WorkOrder
- **IMPLEMENT**: Add at bottom of class, after audit fields:
  ```python
  # Relationships
  work_orders: Mapped[list["WorkOrder"]] = relationship("WorkOrder", back_populates="customer")
  ```
- **IMPORTS**: Add `from sqlalchemy.orm import relationship` (already has `mapped_column`, add `relationship`)
- **GOTCHA**: Do NOT add a direct `aircraft` relationship via `secondary="aircraft_customer"`. The M:N is managed explicitly through CRUD functions that query the join table directly — this avoids SQLAlchemy's automatic secondary table management and gives us control over `is_primary`.
- **VALIDATE**: `cd app/api && python -c "from models.customer import Customer"`

### Task 6: UPDATE `app/api/models/aircraft.py`

- **ACTION**: Remove `customer_name` field (it's been dropped from DB in V010)
- **IMPLEMENT**:
  - Remove line 24: `customer_name: Mapped[str | None] = mapped_column(String(200))`
  - No relationship added — aircraft-customer links are queried via join table in CRUD
- **GOTCHA**: Removing `customer_name` will break existing CRUD/schema/router/test code that references it — those will be fixed in subsequent tasks.
- **VALIDATE**: `cd app/api && python -c "from models.aircraft import Aircraft; assert not hasattr(Aircraft, 'customer_name')"`

### Task 7: UPDATE `app/api/models/work_order.py`

- **ACTION**: Replace denormalized customer fields with customer_id FK and relationship
- **IMPLEMENT**:
  - Remove lines 80-82 (customer_name, customer_po_number)
  - Add after `aircraft_id` line (59):
    ```python
    customer_id: Mapped[int | None] = mapped_column(ForeignKey("customer.id"), nullable=True)
    ```
  - Add to relationships section (after line 112):
    ```python
    customer: Mapped["Customer | None"] = relationship("Customer", back_populates="work_orders")
    ```
- **IMPORTS**: No new imports needed (ForeignKey already imported)
- **GOTCHA**: `customer_id` is nullable — not all work orders have a customer assigned
- **GOTCHA**: The `Mapped["Customer | None"]` type hint handles the nullable relationship
- **VALIDATE**: `cd app/api && python -c "from models.work_order import WorkOrder; assert hasattr(WorkOrder, 'customer_id')"`

### Task 8: UPDATE schemas — `aircraft.py`, `work_order.py`, `customer.py`, `__init__.py`

- **ACTION**: Update all Pydantic schemas for the new relationship model
- **IMPLEMENT**:

  **`app/api/schemas/customer.py`** — Add CustomerBrief and AircraftCustomerResponse:
  ```python
  class CustomerBrief(BaseModel):
      """Brief customer info for aircraft/work order responses."""
      id: UUID
      name: str
      email: str | None

      class Config:
          from_attributes = True

  class AircraftCustomerResponse(BaseModel):
      """Customer linked to an aircraft with primary flag."""
      id: UUID
      name: str
      email: str | None
      is_primary: bool

      class Config:
          from_attributes = True
  ```

  **`app/api/schemas/aircraft.py`** — Remove customer_name, add customers list:
  - Remove `customer_name` from `AircraftBase` (line 15), `AircraftUpdate` (line 39), and `AircraftResponse` (line 69)
  - Add to `AircraftResponse`: `customers: list` (will use a forward ref or import)
  - Actually, import `AircraftCustomerResponse` from schemas.customer:
    ```python
    from schemas.customer import AircraftCustomerResponse
    ```
  - In `AircraftResponse`: replace `customer_name: str | None` with:
    ```python
    customers: list[AircraftCustomerResponse] = []
    ```

  **`app/api/schemas/work_order.py`** — Remove denormalized fields, add customer object:
  - Remove `customer_name` and `customer_po_number` from `WorkOrderBase` (lines 39-41)
  - Remove `customer_name` and `customer_po_number` from `WorkOrderUpdate` (lines 71-72)
  - Remove `customer_name` and `customer_po_number` from `WorkOrderResponse` (lines 122-124)
  - Add to `WorkOrderResponse`:
    ```python
    customer: CustomerBrief | None = None
    ```
  - Import: `from schemas.customer import CustomerBrief`
  - Remove `customer_name` from WORK_ORDER_SORT_COLUMNS keys (handled in CRUD task)

  **`app/api/schemas/__init__.py`** — Add new schema exports:
  - Add to imports from `schemas.customer`:
    ```python
    CustomerBrief,
    AircraftCustomerResponse,
    ```
  - Add to `__all__`: `"CustomerBrief"`, `"AircraftCustomerResponse"`

- **MIRROR**: `app/api/schemas/work_order.py:96-108` for Brief schema pattern
- **GOTCHA**: Circular import risk — `aircraft.py` imports from `customer.py` and vice versa. Use forward references or ensure one-directional imports. Since `AircraftCustomerResponse` lives in `customer.py` and is imported into `aircraft.py`, this is a clean one-directional dependency.
- **VALIDATE**: `cd app/api && python -c "from schemas.customer import CustomerBrief, AircraftCustomerResponse; from schemas.aircraft import AircraftResponse; from schemas.work_order import WorkOrderResponse"`

### Task 9: UPDATE CRUD — `customer.py`, `aircraft.py`, `work_order.py`, `__init__.py`

- **ACTION**: Update all CRUD modules for the relationship model
- **IMPLEMENT**:

  **`app/api/crud/customer.py`** — Add aircraft link/unlink/list functions and delete constraints:

  New functions to add:
  ```python
  async def get_customer_aircraft(
      db: AsyncSession, customer_uuid: UUID
  ) -> list[tuple[Aircraft, bool]]:
      """Get all aircraft linked to a customer, with is_primary flag."""

  async def link_customer_to_aircraft(
      db: AsyncSession, customer_uuid: UUID, aircraft_uuid: UUID, created_by: str
  ) -> AircraftCustomer:
      """Link a customer to an aircraft. First link becomes primary."""

  async def unlink_customer_from_aircraft(
      db: AsyncSession, customer_uuid: UUID, aircraft_uuid: UUID
  ) -> bool:
      """Unlink a customer from an aircraft."""

  async def set_primary_customer(
      db: AsyncSession, customer_uuid: UUID, aircraft_uuid: UUID
  ) -> bool:
      """Set a customer as the primary customer for an aircraft."""

  async def get_aircraft_primary_customer(
      db: AsyncSession, aircraft_id: int
  ) -> Customer | None:
      """Get the primary customer for an aircraft (by internal ID)."""
  ```

  Update `delete_customer` to add constraint checks:
  ```python
  async def delete_customer(db: AsyncSession, customer_uuid: UUID) -> bool:
      customer = await get_customer_by_uuid(db, customer_uuid)
      if not customer:
          return False

      # Check for linked aircraft
      from models.aircraft_customer import AircraftCustomer
      link_count_query = select(func.count(AircraftCustomer.id)).where(
          AircraftCustomer.customer_id == customer.id
      )
      count_result = await db.execute(link_count_query)
      link_count = count_result.scalar()
      if link_count > 0:
          raise ValueError(
              f"Cannot delete customer {customer.name}: "
              f"it is linked to {link_count} aircraft"
          )

      # Check for linked work orders
      from models.work_order import WorkOrder
      wo_count_query = select(func.count(WorkOrder.id)).where(
          WorkOrder.customer_id == customer.id
      )
      wo_result = await db.execute(wo_count_query)
      wo_count = wo_result.scalar()
      if wo_count > 0:
          raise ValueError(
              f"Cannot delete customer {customer.name}: "
              f"it has {wo_count} associated work order(s)"
          )

      await db.delete(customer)
      return True
  ```

  **`app/api/crud/aircraft.py`** — Remove customer_name references, add selectinload:
  - Remove `"customer_name": Aircraft.customer_name` from `AIRCRAFT_SORT_COLUMNS` (line 18)
  - Remove `Aircraft.customer_name.ilike(search_filter)` from search filter (line 58)
  - Remove `customer_name=aircraft_in.customer_name` from `create_aircraft` (line 120)
  - Remove `customer_name` handling from `update_aircraft` (handled by model_dump, but customer_name no longer exists on model so it won't appear)
  - In `get_aircraft_list` and `get_aircraft_by_uuid`: no changes needed for selectinload — aircraft-customer links will be queried separately in router

  **`app/api/crud/work_order.py`** — Auto-link customer, update search/sort, add selectinload:
  - Remove `"customer_name": WorkOrder.customer_name` from `WORK_ORDER_SORT_COLUMNS` (line 16)
  - Remove `WorkOrder.customer_name.ilike(search_filter)` from search filters (lines 74, 87)
  - Add `selectinload(WorkOrder.customer)` to query options in `get_work_orders` and `get_work_order_by_uuid`
  - Update `create_work_order` to auto-link primary customer:
    ```python
    # After resolving aircraft, get primary customer
    from crud.customer import get_aircraft_primary_customer
    primary_customer = await get_aircraft_primary_customer(db, aircraft.id)

    work_order = WorkOrder(
        # ... existing fields ...
        customer_id=primary_customer.id if primary_customer else None,
        # Remove: customer_name=work_order_in.customer_name,
        # Remove: customer_po_number=work_order_in.customer_po_number,
    )
    ```
  - Add `"customer"` to refresh attribute lists
  - Remove `customer_name` and `customer_po_number` from `update_work_order` setattr handling (they no longer exist on model)

  **`app/api/crud/__init__.py`** — Export new functions:
  - Add imports: `get_customer_aircraft`, `link_customer_to_aircraft`, `unlink_customer_from_aircraft`, `set_primary_customer`, `get_aircraft_primary_customer`
  - Add to `__all__`

- **MIRROR**: `app/api/crud/aircraft.py:166-193` for delete constraint pattern
- **GOTCHA**: The `get_aircraft_primary_customer` function takes `aircraft_id: int` (internal ID, not UUID) because it's called from within `create_work_order` which already has the resolved Aircraft model.
- **GOTCHA**: When linking the first customer to an aircraft, auto-set `is_primary=True`. For subsequent links, default to `is_primary=False`.
- **GOTCHA**: When unlinking a primary customer, if other customers remain linked, promote the next one to primary.
- **VALIDATE**: `make api-test` (will have failures from router/test changes not yet made — that's expected)

### Task 10: UPDATE routers — `customers.py`, `aircraft.py`, `work_orders.py`

- **ACTION**: Update router conversion functions and add relationship endpoints
- **IMPLEMENT**:

  **`app/api/routers/customers.py`** — Add aircraft relationship endpoints:
  ```python
  @router.get("/{customer_id}/aircraft")
  async def list_customer_aircraft(customer_id: UUID, db: AsyncSession = Depends(get_db)):
      """List aircraft linked to a customer."""

  @router.post("/{customer_id}/aircraft/{aircraft_id}", status_code=201)
  async def link_aircraft(
      customer_id: UUID, aircraft_id: UUID, created_by: str = Query(...), db: ...
  ):
      """Link a customer to an aircraft."""

  @router.delete("/{customer_id}/aircraft/{aircraft_id}", status_code=204)
  async def unlink_aircraft(customer_id: UUID, aircraft_id: UUID, db: ...):
      """Unlink a customer from an aircraft."""

  @router.put("/{customer_id}/aircraft/{aircraft_id}/primary", status_code=200)
  async def set_primary(customer_id: UUID, aircraft_id: UUID, db: ...):
      """Set this customer as the primary for the aircraft."""
  ```

  **`app/api/routers/aircraft.py`** — Update `aircraft_to_response`:
  - Remove `customer_name=aircraft.customer_name` (line 41)
  - The `customers` list will be populated by querying the join table:
    ```python
    # Need to query aircraft_customer for this aircraft
    from crud.customer import get_aircraft_customers_for_aircraft
    ```
    Actually, better approach: eager-load in CRUD or pass customers separately. Since the join table doesn't have a SQLAlchemy relationship on Aircraft, we'll query it in the router or pass it.

    **Recommended approach**: Add a helper function in `crud/customer.py` that takes aircraft IDs and returns a dict of `{aircraft_id: list[AircraftCustomerResponse]}`. Then in the router's list endpoint, batch-query all customers for the returned aircraft.

    For single aircraft (get endpoint), query directly.

  - Update sort_by Literal to remove `"customer_name"` option (line 61)
  - Remove `customer_name` from `AircraftCreate` and `AircraftUpdate` handling

  **`app/api/routers/work_orders.py`** — Update `work_order_to_response`:
  - Remove `customer_name=wo.customer_name` and `customer_po_number=wo.customer_po_number` (lines 49-50)
  - Add:
    ```python
    customer=CustomerBrief(
        id=wo.customer.uuid,
        name=wo.customer.name,
        email=wo.customer.email,
    ) if wo.customer else None,
    ```
  - Import `CustomerBrief` from schemas.customer
  - Remove `"customer_name"` from sort_by Literal (line 73)

- **MIRROR**: `app/api/routers/work_orders.py:33-45` for nested Brief construction
- **GOTCHA**: `aircraft_to_response` needs customers data but Aircraft model doesn't have a direct relationship. Options: (a) query join table in router, (b) add it as a parameter. Option (a) is simpler — query in router endpoint functions and pass to conversion.
- **VALIDATE**: `cd app/api && python -c "from routers.customers import router; from routers.aircraft import router; from routers.work_orders import router"`

### Task 11: UPDATE tests — `conftest.py`, `test_customers_api.py`, `test_work_orders_api.py`

- **ACTION**: Update test fixtures and existing tests for the new schema
- **IMPLEMENT**:

  **`app/api/tests/conftest.py`**:
  - Import `AircraftCustomer` from models
  - Add fixture `test_aircraft_customer_link`:
    ```python
    @pytest.fixture
    async def test_aircraft_customer_link(
        test_session: AsyncSession, test_aircraft: Aircraft, test_customer: Customer
    ) -> AircraftCustomer:
        """Link test customer to test aircraft as primary."""
        link = AircraftCustomer(
            aircraft_id=test_aircraft.id,
            customer_id=test_customer.id,
            is_primary=True,
            created_by="test_user",
        )
        test_session.add(link)
        await test_session.commit()
        await test_session.refresh(link)
        return link
    ```
  - Update `test_work_order` fixture: remove `customer_name` and `customer_po_number` fields, optionally add `customer_id` if a customer fixture is available (or leave as None for most tests)

  **`app/api/tests/integration/test_work_orders_api.py`**:
  - Remove all references to `customer_name` and `customer_po_number` in payloads and assertions
  - Add test for auto-linking: create aircraft, link customer as primary, create WO for that aircraft, verify WO response has `customer.name`
  - Update `test_get_work_order_response_format`: replace `"customer_name"` and `"customer_po_number"` with `"customer"` in expected_fields
  - Update `test_update_work_order_multiple_fields`: remove `customer_name` from payload and assertions
  - Update `test_update_work_order_partial`: remove `original_customer` check

  **`app/api/tests/integration/test_customers_api.py`**:
  - Add test for delete with linked aircraft (should return 400):
    ```python
    async def test_delete_customer_with_linked_aircraft(
        self, client, test_customer, test_aircraft, test_aircraft_customer_link
    ):
        response = await client.delete(f"/api/v1/customers/{test_customer.uuid}")
        assert response.status_code == 400
        assert "linked to" in response.json()["detail"]
    ```

- **MIRROR**: `app/api/tests/conftest.py:112-128` for fixture pattern
- **GOTCHA**: SQLite (used in tests) doesn't enforce FK constraints by default. The constraint checking is done in CRUD code (not DB level), so tests will work correctly.
- **VALIDATE**: `make api-test` (should have some failures until Task 12 is complete)

### Task 12: CREATE `app/api/tests/integration/test_aircraft_customers_api.py`

- **ACTION**: Create integration tests for aircraft-customer relationship endpoints
- **IMPLEMENT**:

  ```python
  class TestLinkCustomerToAircraft:
      async def test_link_customer_to_aircraft(self, client, test_customer, test_aircraft):
          """First link becomes primary."""
      async def test_link_customer_not_found(self, client, test_aircraft):
          """404 for non-existent customer."""
      async def test_link_aircraft_not_found(self, client, test_customer):
          """404 for non-existent aircraft."""
      async def test_link_duplicate(self, client, test_customer, test_aircraft, test_aircraft_customer_link):
          """400 for already linked."""

  class TestUnlinkCustomerFromAircraft:
      async def test_unlink_customer(self, client, test_customer, test_aircraft, test_aircraft_customer_link):
          """Unlink returns 204."""
      async def test_unlink_not_linked(self, client, test_customer, test_aircraft):
          """404 when not linked."""

  class TestSetPrimaryCustomer:
      async def test_set_primary(self, client, test_customer, test_aircraft, test_aircraft_customer_link):
          """Set primary returns 200."""
      async def test_set_primary_not_linked(self, client, test_customer, test_aircraft):
          """404 when not linked."""

  class TestListCustomerAircraft:
      async def test_list_aircraft_for_customer(self, client, test_customer, test_aircraft, test_aircraft_customer_link):
          """Returns list of aircraft with is_primary flag."""
      async def test_list_aircraft_empty(self, client, test_customer):
          """Returns empty list when no aircraft linked."""

  class TestWorkOrderAutoLink:
      async def test_create_work_order_auto_links_customer(
          self, client, test_city, test_aircraft, test_customer, test_aircraft_customer_link
      ):
          """Creating WO for aircraft with primary customer auto-populates."""
      async def test_create_work_order_no_primary_customer(
          self, client, test_city, test_aircraft
      ):
          """Creating WO for aircraft with no customers sets customer to null."""

  class TestAircraftResponseIncludesCustomers:
      async def test_get_aircraft_shows_customers(
          self, client, test_aircraft, test_customer, test_aircraft_customer_link
      ):
          """Aircraft GET response includes customers list."""
      async def test_get_aircraft_no_customers(self, client, test_aircraft):
          """Aircraft GET response has empty customers list."""
  ```

- **MIRROR**: `app/api/tests/integration/test_customers_api.py` for test class structure
- **VALIDATE**: `make api-test` — all tests pass; `make api-test-cov` — coverage >= 80% for new code

---

## Testing Strategy

### Integration Tests to Write

| Test File | Test Cases | Validates |
|-----------|-----------|-----------|
| `tests/integration/test_aircraft_customers_api.py` | link, unlink, set primary, list, auto-link WO, aircraft response with customers | All relationship endpoints |
| `tests/integration/test_customers_api.py` (update) | delete with linked aircraft (400) | Delete constraint |
| `tests/integration/test_work_orders_api.py` (update) | auto-link customer, response format without customer_name | WO-customer integration |

### Edge Cases Checklist

- [ ] Link customer to aircraft when already linked (should return 400)
- [ ] Unlink customer when not linked (should return 404)
- [ ] Set primary when only one customer linked (should succeed)
- [ ] Set primary when customer not linked to aircraft (should return 404)
- [ ] Unlink primary customer with other customers (should promote next to primary)
- [ ] Delete customer with linked aircraft (should return 400 with count)
- [ ] Delete customer with linked work orders (should return 400 with count)
- [ ] Create work order for aircraft with no customers (customer_id should be null)
- [ ] Create work order for aircraft with primary customer (customer_id should be auto-set)
- [ ] Aircraft list response includes empty customers array when no links exist
- [ ] Aircraft detail response includes customers with is_primary flags

---

## Validation Commands

### Level 1: STATIC_ANALYSIS

```bash
cd app/api && python -c "from models import AircraftCustomer; from models.customer import Customer; from models.aircraft import Aircraft; from models.work_order import WorkOrder; from schemas.customer import CustomerBrief, AircraftCustomerResponse; from schemas.aircraft import AircraftResponse; from schemas.work_order import WorkOrderResponse; print('All imports OK')"
```

**EXPECT**: Exit 0, "All imports OK"

### Level 2: UNIT_TESTS

```bash
make api-test
```

**EXPECT**: All tests pass including updated and new tests

### Level 3: COVERAGE

```bash
make api-test-cov
```

**EXPECT**: Coverage >= 80% for new code

### Level 4: DATABASE_VALIDATION

```bash
make db-validate
```

**EXPECT**: Flyway validates V009 and V010 migrations successfully

### Level 5: MANUAL_VALIDATION

1. Start API server: `make api-run`
2. Open Swagger docs: `http://localhost:8000/docs`
3. Create a customer via POST /api/v1/customers
4. Create an aircraft via POST /api/v1/aircraft
5. Link customer to aircraft: POST /api/v1/customers/{id}/aircraft/{id}
6. Verify aircraft GET shows customers list with is_primary=true
7. Create work order for that aircraft: POST /api/v1/work-orders
8. Verify work order response has customer object auto-populated
9. Attempt to delete customer: DELETE /api/v1/customers/{id} — should return 400
10. Unlink customer from aircraft: DELETE /api/v1/customers/{id}/aircraft/{id}
11. Delete customer: DELETE /api/v1/customers/{id} — should succeed (assuming no WOs)

---

## Acceptance Criteria

- [ ] V009 migration creates `aircraft_customer` table with correct columns, constraints, and indexes
- [ ] V010 migration adds `customer_id` FK to `work_order`, drops `customer_name` and `customer_po_number` from `work_order`, drops `customer_name` from `aircraft`
- [ ] Aircraft-customer link/unlink/set-primary/list endpoints functional
- [ ] First customer linked to aircraft is auto-set as primary
- [ ] Aircraft GET response includes `customers` list with `is_primary` flag
- [ ] Work order GET response includes `customer` object (or null) instead of string fields
- [ ] Creating a work order for aircraft with primary customer auto-populates `customer_id`
- [ ] Creating a work order for aircraft with no customers sets `customer` to null
- [ ] Deleting a customer with linked aircraft returns 400 with descriptive error
- [ ] Deleting a customer with linked work orders returns 400 with descriptive error
- [ ] All existing tests updated to work without `customer_name`/`customer_po_number`
- [ ] All new integration tests pass
- [ ] Code coverage >= 80% for new code
- [ ] No regressions in existing tests

---

## Completion Checklist

- [ ] All 12 tasks completed in dependency order
- [ ] Each task validated immediately after completion
- [ ] Level 1: Import check passes
- [ ] Level 2: All tests pass (`make api-test`)
- [ ] Level 3: Coverage >= 80% (`make api-test-cov`)
- [ ] Level 4: Flyway validates migrations (`make db-validate`)
- [ ] All acceptance criteria met

---

## Risks and Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Breaking existing tests that reference customer_name | High | Medium | Tasks 11 updates all existing tests in same batch; run tests after each file change |
| SQLite test compatibility with join table | Low | Medium | Join table uses standard types (INTEGER, BOOLEAN); no PostgreSQL-specific features |
| Circular import between customer and aircraft models | Medium | Low | Use forward string references in relationship() — already the pattern in codebase |
| Batch querying customers for aircraft list endpoint | Low | Medium | Use a helper that takes list of aircraft IDs and returns customers in one query to avoid N+1 |
| Work order creation failing when aircraft has no primary customer | Low | High | customer_id is nullable; auto-link sets None if no primary customer exists |

---

## Notes

- The `aircraft_customer` join table uses `ON DELETE CASCADE` for aircraft_id (if aircraft is deleted, links are cleaned up) but `ON DELETE RESTRICT` for customer_id (force explicit unlinking before customer deletion). This is supplemented by CRUD-level checks for better error messages.
- The `is_primary` flag is enforced at the CRUD level, not DB level. This allows the CRUD logic to auto-promote the next customer when a primary is unlinked, and to auto-set the first linked customer as primary.
- `customer_po_number` is dropped entirely. If PO tracking is needed in the future, it would be a work-order-level field (not customer-level), and would require a new column on `work_order`.
- The aircraft response now includes a `customers` array instead of a single `customer_name` string. This supports the many-to-many relationship and shows the `is_primary` flag for each linked customer.
- Work order search currently searches across `customer_name` — this will need to be updated to search across the joined customer's name field, or removed from search for now (simpler). The plan removes it from search; Phase 4 can add it back with a proper join.
