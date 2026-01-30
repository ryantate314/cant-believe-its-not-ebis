# Testing Guide

This document describes the testing infrastructure, methodologies, and best practices for the Cirrus MRO application.

## Overview

The testing strategy follows a **testing pyramid** approach:

```
        /\
       /  \      E2E Tests (few)
      /----\     - Critical user workflows
     /      \    - Real browser testing
    /--------\
   /          \  Integration Tests (moderate)
  /   Tests    \ - Component + API interaction
 /--------------\- MSW for API mocking
/                \
/------------------\  Unit Tests (many)
    Foundation      - Pure functions
                    - Isolated components
```

## Quick Reference

| Command | Description |
|---------|-------------|
| `make test` | Run all tests (backend + frontend) |
| `make api-test` | Run backend tests |
| `make api-test-cov` | Backend tests with coverage report |
| `make ui-test` | Frontend unit/integration tests |
| `make ui-test-cov` | Frontend tests with coverage |
| `make ui-test-e2e` | Playwright E2E tests |

---

## Frontend Testing

### Tech Stack

- **Test Runner:** [Vitest](https://vitest.dev/) - Fast, native ESM support
- **Component Testing:** [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- **User Interactions:** [@testing-library/user-event](https://testing-library.com/docs/user-event/intro)
- **API Mocking:** [MSW (Mock Service Worker)](https://mswjs.io/)
- **E2E Testing:** [Playwright](https://playwright.dev/)
- **Assertions:** Vitest built-in + [@testing-library/jest-dom](https://github.com/testing-library/jest-dom)

### Directory Structure

```
app/ui/__tests__/
├── setup.tsx              # Global test setup (MSW, mocks)
├── mocks/
│   ├── handlers.ts        # MSW request handlers
│   ├── server.ts          # MSW server instance
│   └── data/
│       └── index.ts       # Mock data fixtures
├── unit/
│   └── lib/
│       └── api.test.ts    # API client tests
├── integration/
│   └── components/
│       └── features/
│           ├── work-order-form.test.tsx
│           ├── work-order-list.test.tsx
│           └── work-order-item-list.test.tsx
└── e2e/
    └── work-orders.spec.ts
```

---

### UI Unit Tests

**Location:** `__tests__/unit/`

**Purpose:** Test individual functions and modules in isolation, without rendering components or making network requests.

**What We Test:**
- API client functions (`lib/api.ts`)
- Utility functions (`lib/utils.ts`)
- Type transformations and helpers
- Error handling logic

**Methodology:**
1. **Isolate the unit** - Import only the function/module under test
2. **Mock external dependencies** - Use MSW for API calls
3. **Test all code paths** - Happy path, error cases, edge cases

**Example: API Client Test**

```typescript
// __tests__/unit/lib/api.test.ts
import { describe, it, expect } from "vitest";
import { citiesApi, ApiError } from "@/lib/api";

describe("citiesApi", () => {
  describe("list", () => {
    it("should fetch active cities by default", async () => {
      const result = await citiesApi.list();

      expect(result.items).toHaveLength(2);
      expect(result.total).toBe(2);
    });

    it("should throw ApiError when request fails", async () => {
      await expect(citiesApi.get("nonexistent-id"))
        .rejects.toThrow(ApiError);
    });
  });
});
```

**What Gets Mocked:**
- **Network requests:** MSW intercepts all `fetch()` calls
- **No component rendering** - These are pure function tests

---

### UI Integration Tests

**Location:** `__tests__/integration/`

**Purpose:** Test React components with their interactions, state management, and API calls (mocked via MSW).

**What We Test:**
- Component rendering with various props
- User interactions (clicks, typing, form submissions)
- State updates and conditional rendering
- Navigation behavior
- Loading and error states
- Data display and formatting

**Methodology:**
1. **Render the component** using React Testing Library
2. **Simulate user actions** with `userEvent`
3. **Assert on DOM changes** - What the user sees
4. **Verify API calls** - MSW handles responses automatically

**Example: Component Integration Test**

```typescript
// __tests__/integration/components/features/work-order-form.test.tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { WorkOrderForm } from "@/components/features/work-orders/work-order-form";

describe("WorkOrderForm", () => {
  it("should submit form and create work order", async () => {
    const user = userEvent.setup();
    render(<WorkOrderForm cityId="city-uuid-1" />);

    // Fill in form fields
    await user.type(screen.getByLabelText("Registration"), "N99999");
    await user.type(screen.getByLabelText("Customer Name"), "New Customer");

    // Submit the form
    await user.click(screen.getByRole("button", { name: "Create Work Order" }));

    // Verify navigation occurred (MSW returns success)
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalled();
    });
  });

  it("should populate form with existing data in edit mode", () => {
    render(<WorkOrderForm cityId="city-uuid-1" workOrder={mockWorkOrder} />);

    expect(screen.getByLabelText("Registration")).toHaveValue("N12345");
    expect(screen.getByLabelText("Customer Name")).toHaveValue("Test Customer");
  });
});
```

**What Gets Mocked:**

| Dependency | How It's Mocked | Location |
|------------|-----------------|----------|
| API calls (`fetch`) | MSW handlers | `__tests__/mocks/handlers.ts` |
| `next/navigation` | Vitest mock | `__tests__/setup.tsx` |
| `next/image` | Simple img element | `__tests__/setup.tsx` |

**MSW Handler Example:**

```typescript
// __tests__/mocks/handlers.ts
import { http, HttpResponse } from "msw";

export const handlers = [
  // GET /api/work-orders
  http.get("/api/work-orders", ({ request }) => {
    const url = new URL(request.url);
    const cityId = url.searchParams.get("city_id");

    const filtered = mockWorkOrders.filter(wo => wo.city.id === cityId);

    return HttpResponse.json({
      items: filtered,
      total: filtered.length,
      page: 1,
      page_size: 20,
    });
  }),

  // POST /api/work-orders
  http.post("/api/work-orders", async ({ request }) => {
    const body = await request.json();
    const newWorkOrder = createWorkOrder(body);
    return HttpResponse.json(newWorkOrder, { status: 201 });
  }),
];
```

**Testing Patterns:**

```typescript
// Wait for async data to load
await waitFor(() => {
  expect(screen.getByText("Expected Text")).toBeInTheDocument();
});

// Query elements that might not exist
expect(screen.queryByText("Loading...")).not.toBeInTheDocument();

// Find within a specific container
const dialog = screen.getByRole("dialog");
expect(within(dialog).getByText("Title")).toBeInTheDocument();

// Test user interactions
const user = userEvent.setup();
await user.click(button);
await user.type(input, "text");
await user.clear(input);
```

---

### UI E2E Tests

**Location:** `__tests__/e2e/`

**Purpose:** Test complete user workflows in a real browser against a running application.

**What We Test:**
- Critical user journeys
- Page navigation
- Form submissions end-to-end
- Cross-page state persistence
- Accessibility (keyboard navigation, screen readers)
- Responsive design

**Methodology:**
1. **Start the dev server** - Playwright handles this automatically
2. **Navigate to pages** - Use real URLs
3. **Interact like a user** - Click, type, navigate
4. **Assert on visible outcomes** - Page content, URLs, error messages

**Example: E2E Test**

```typescript
// __tests__/e2e/work-orders.spec.ts
import { test, expect } from "@playwright/test";

test.describe("Work Orders E2E", () => {
  test("should display work orders page", async ({ page }) => {
    await page.goto("/workorder");

    await expect(page.getByText("Work Orders")).toBeVisible();
    await expect(page.getByText("Please select a city")).toBeVisible();
  });

  test("should navigate to new work order form", async ({ page }) => {
    await page.goto("/workorder?city=test-city-id");

    await page.getByRole("link", { name: "New Work Order" }).click();

    await expect(page).toHaveURL(/\/workorder\/new/);
    await expect(page.getByText("Work Order Details")).toBeVisible();
  });

  test("form should be keyboard accessible", async ({ page }) => {
    await page.goto("/workorder/new?city=test-city-id");

    // Tab through form elements
    await page.keyboard.press("Tab");

    // Verify focus management
    const focusedElement = page.locator(":focus");
    await expect(focusedElement).toBeVisible();
  });
});
```

**Configuration:**

```typescript
// playwright.config.ts
export default defineConfig({
  testDir: "./__tests__/e2e",
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  webServer: {
    command: "yarn dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
  },
});
```

**When to Write E2E Tests:**
- User signup/login flows
- Checkout or payment processes
- Multi-step wizards
- Features requiring multiple page interactions
- Accessibility compliance verification

**When NOT to Write E2E Tests:**
- Testing individual component states (use integration tests)
- API response handling (use unit tests)
- Edge cases and error conditions (use unit/integration)

---

## Backend Testing

### Tech Stack

- **Test Runner:** [pytest](https://pytest.org/)
- **Async Support:** [pytest-asyncio](https://pytest-asyncio.readthedocs.io/)
- **HTTP Client:** [httpx](https://www.python-httpx.org/) (ASGI transport)
- **Test Data:** [factory-boy](https://factoryboy.readthedocs.io/)
- **Coverage:** [pytest-cov](https://pytest-cov.readthedocs.io/)
- **Test Database:** SQLite in-memory (via aiosqlite)

### Directory Structure

```
app/api/tests/
├── conftest.py              # Shared fixtures
├── factories/
│   ├── __init__.py
│   ├── city.py              # City factory
│   ├── work_order.py        # WorkOrder factory
│   └── work_order_item.py   # WorkOrderItem factory
├── unit/
│   ├── __init__.py
│   ├── test_schemas.py      # Pydantic schema tests
│   └── test_work_order_number.py  # Business logic tests
└── integration/
    ├── __init__.py
    ├── test_cities_api.py
    ├── test_work_orders_api.py
    └── test_work_order_items_api.py
```

---

### Backend Unit Tests

**Location:** `tests/unit/`

**Purpose:** Test pure Python functions, Pydantic schemas, and business logic without database or HTTP.

**What We Test:**
- Pydantic schema validation and defaults
- Business logic functions (e.g., work order number generation)
- Enum values and type definitions
- Data transformations

**Example: Schema Unit Test**

```python
# tests/unit/test_schemas.py
from schemas.work_order import WorkOrderCreate, WorkOrderStatus

class TestWorkOrderSchemas:
    def test_work_order_create_required_fields(self):
        """Test WorkOrderCreate with required fields."""
        wo = WorkOrderCreate(city_id=uuid4(), created_by="test_user")

        assert wo.created_by == "test_user"
        assert wo.status == WorkOrderStatus.CREATED  # default
        assert wo.priority == PriorityLevel.NORMAL   # default

    def test_work_order_base_defaults(self):
        """Test WorkOrderBase default values."""
        wo = WorkOrderBase()

        assert wo.work_order_type == WorkOrderType.WORK_ORDER
        assert wo.aircraft_registration is None
```

**Example: Business Logic Unit Test**

```python
# tests/unit/test_work_order_number.py
from unittest.mock import patch
from datetime import datetime
from crud.work_order import generate_work_order_number

class TestGenerateWorkOrderNumber:
    def test_basic_format(self):
        """Test that work order number follows expected format."""
        with patch("crud.work_order.datetime") as mock_datetime:
            mock_datetime.utcnow.return_value = datetime(2026, 1, 15)

            result = generate_work_order_number("KTYS", 1)

            assert result == "KTYS00001-01-2026"

    def test_sequence_padding(self):
        """Test that sequence number is zero-padded to 5 digits."""
        with patch("crud.work_order.datetime") as mock_datetime:
            mock_datetime.utcnow.return_value = datetime(2026, 1, 15)

            assert generate_work_order_number("KTYS", 1) == "KTYS00001-01-2026"
            assert generate_work_order_number("KTYS", 12345) == "KTYS12345-01-2026"
```

---

### Backend Integration Tests

**Location:** `tests/integration/`

**Purpose:** Test API endpoints with a real (but isolated) database, verifying the full request/response cycle.

**What We Test:**
- HTTP request handling
- Request validation
- Database operations (CRUD)
- Response formatting
- Error handling (404, 400, etc.)
- Pagination and filtering

**Test Database Strategy:**

We use an **in-memory SQLite database** for tests:
- Fast (no disk I/O)
- Isolated (each test gets fresh database)
- No cleanup required

```python
# tests/conftest.py
TEST_DATABASE_URL = "sqlite+aiosqlite:///:memory:"

@pytest.fixture(scope="function")
async def test_engine():
    engine = create_async_engine(
        TEST_DATABASE_URL,
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    yield engine

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
```

**Test Client Setup:**

```python
@pytest.fixture
async def client(test_session: AsyncSession):
    """Create a test HTTP client with overridden database."""

    async def override_get_db():
        yield test_session
        await test_session.commit()

    app.dependency_overrides[get_db] = override_get_db

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        yield client

    app.dependency_overrides.clear()
```

**Example: API Integration Test**

```python
# tests/integration/test_work_orders_api.py
class TestCreateWorkOrder:
    async def test_create_work_order_minimal(
        self, client: AsyncClient, test_city: City
    ):
        """Test creating a work order with minimal required fields."""
        payload = {
            "city_id": str(test_city.uuid),
            "created_by": "test_user",
        }

        response = await client.post("/api/v1/work-orders", json=payload)

        assert response.status_code == 201
        data = response.json()
        assert data["work_order_number"].startswith(test_city.code)
        assert data["status"] == "created"
        assert data["item_count"] == 0

    async def test_create_work_order_invalid_city(self, client: AsyncClient):
        """Test creating a work order with non-existent city."""
        payload = {
            "city_id": str(uuid4()),
            "created_by": "test_user",
        }

        response = await client.post("/api/v1/work-orders", json=payload)

        assert response.status_code == 400
        assert "not found" in response.json()["detail"].lower()
```

**Using Fixtures for Test Data:**

```python
# tests/conftest.py
@pytest.fixture
async def test_city(test_session: AsyncSession) -> City:
    """Create a test city."""
    city = City(
        uuid=uuid4(),
        code="KTYS",
        name="Knoxville McGhee Tyson",
        is_active=True,
    )
    test_session.add(city)
    await test_session.commit()
    return city

@pytest.fixture
async def test_work_order(
    test_session: AsyncSession,
    test_city: City
) -> WorkOrder:
    """Create a test work order (depends on test_city)."""
    work_order = WorkOrder(
        uuid=uuid4(),
        work_order_number="KTYS00001-01-2026",
        city_id=test_city.id,
        created_by="test_user",
        # ... other fields
    )
    test_session.add(work_order)
    await test_session.commit()
    return work_order
```

**Using Factories (Alternative):**

```python
# tests/factories/work_order.py
class WorkOrderFactory(factory.Factory):
    class Meta:
        model = WorkOrder

    id = factory.Sequence(lambda n: n + 1)
    uuid = factory.LazyFunction(uuid4)
    work_order_number = factory.Sequence(lambda n: f"TEST{n:05d}-01-2026")
    status = WorkOrderStatus.CREATED
    created_by = "test_user"
```

---

## Coverage Requirements

| Layer | Minimum Coverage |
|-------|-----------------|
| Backend overall | 70% |
| Frontend overall | 80% |
| API client (`lib/api.ts`) | 90%+ |
| Feature components | 85%+ |

**Checking Coverage:**

```bash
# Backend
make api-test-cov

# Frontend
make ui-test-cov
```

**Excluded from Coverage:**
- `components/ui/` - shadcn/ui primitives (externally tested)
- `app/layout.tsx`, `app/page.tsx` - Next.js boilerplate
- Type definitions (`.d.ts` files)

---

## Best Practices

### General

1. **Test behavior, not implementation** - Focus on what the user sees/experiences
2. **One assertion concept per test** - Tests should have a single reason to fail
3. **Use descriptive test names** - `should display error when form is invalid`
4. **Arrange-Act-Assert pattern** - Setup, execute, verify

### Frontend

1. **Query by accessibility** - Prefer `getByRole`, `getByLabelText` over `getByTestId`
2. **Use `userEvent` over `fireEvent`** - More realistic user simulation
3. **Await async operations** - Use `waitFor` for loading states
4. **Don't test shadcn/ui internals** - Focus on your feature components

### Backend

1. **Use fixtures for shared setup** - Keep tests DRY
2. **Each test should be independent** - No shared state between tests
3. **Test error cases** - 404s, validation errors, edge cases
4. **Use factories for complex objects** - Cleaner than manual construction

---

## Troubleshooting

### Frontend Tests Failing

**"Cannot find module"**
```bash
# Ensure dependencies are installed
cd app/ui && yarn install
```

**"Element not found"**
- Check if element is async (wrap in `waitFor`)
- Verify MSW handlers return expected data
- Use `screen.debug()` to see rendered output

**Flaky tests**
- Avoid testing loading states (timing-dependent)
- Use `waitFor` for any async state changes
- Don't rely on specific timing

### Backend Tests Failing

**"Database locked" (SQLite)**
- Ensure using `StaticPool` poolclass
- Check `check_same_thread=False` is set

**"Session closed"**
- Verify fixture scope matches usage
- Don't share sessions between tests

**Async issues**
- Ensure `pytest-asyncio` is installed
- Check `asyncio_mode = "auto"` in pyproject.toml

---

## Adding New Tests

### Frontend Component Test

1. Create file: `__tests__/integration/components/features/my-component.test.tsx`
2. Import component and testing utilities
3. Add MSW handlers if component makes API calls
4. Write tests following existing patterns

### Backend API Test

1. Create file: `tests/integration/test_my_endpoint.py`
2. Add fixtures to `conftest.py` if needed
3. Use `client` fixture to make requests
4. Assert on response status and body

### E2E Test

1. Create file: `__tests__/e2e/my-feature.spec.ts`
2. Use Playwright's `test` and `expect`
3. Navigate to pages and interact
4. Run with `make ui-test-e2e`
