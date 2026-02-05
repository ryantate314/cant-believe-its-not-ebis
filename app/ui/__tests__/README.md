# Frontend Testing Guide

This directory contains all tests for the UI application. Tests are organized by type and purpose.

## Directory Structure

```
__tests__/
├── unit/                    # Unit tests for isolated modules
│   └── lib/                 # API client, utilities
├── integration/             # Component integration tests
│   └── components/features/ # Feature component tests
├── e2e/                     # End-to-end Playwright tests
├── mocks/                   # MSW mock handlers and data
│   ├── handlers.ts          # API request interceptors
│   ├── server.ts            # MSW server setup
│   └── data/                # Mock data fixtures
└── setup.tsx                # Test environment configuration
```

## Test Types

### Unit Tests (`unit/`)

**What's mocked:** API calls via MSW
**What's real:** The code under test (API client, utilities)

Unit tests verify isolated modules work correctly. The API client tests make HTTP requests that are intercepted by MSW handlers returning mock data.

```bash
yarn test __tests__/unit
```

### Integration Tests (`integration/`)

**What's mocked:**
- API calls via MSW
- Next.js navigation (`useRouter`, `useSearchParams`, etc.)
- `next/image` component

**What's real:** React components, user interactions, DOM rendering

Integration tests render components using React Testing Library and simulate user interactions. Components make real fetch calls that are intercepted by MSW, allowing us to test the full component behavior without a running backend.

```bash
yarn test __tests__/integration
```

### E2E Tests (`e2e/`)

**What's mocked:** Nothing
**What's real:** Everything—full browser, real Next.js server, real API calls

E2E tests use Playwright to run in a real browser against the running application. These tests require:

1. The Next.js dev server running (`yarn dev`)
2. The FastAPI backend running (`make api-run`)
3. A database with test data

```bash
yarn test:e2e
```

> **Note:** Some E2E tests gracefully skip when the backend is unavailable.

## API Mocking with MSW

[Mock Service Worker (MSW)](https://mswjs.io/) intercepts HTTP requests at the network level, providing realistic API simulation for unit and integration tests.

### How It Works

1. **`setup.tsx`** starts the MSW server before all tests
2. **`handlers.ts`** defines mock API endpoints that mirror the real FastAPI routes
3. **`data/index.ts`** contains fixture data returned by mock handlers

### Key Behaviors

- Requests to unmocked endpoints throw errors (`onUnhandledRequest: "error"`)
- Handlers are reset after each test to prevent state leakage
- Tests can override handlers for specific scenarios:

```typescript
import { server } from "../../mocks/server";
import { http, HttpResponse } from "msw";

it("should handle network errors", async () => {
  server.use(
    http.get("/api/cities", () => {
      return HttpResponse.error();
    })
  );

  await expect(citiesApi.list()).rejects.toThrow();
});
```

### Mock Data

Mock data in `mocks/data/index.ts` provides:

- `mockCities` - City/location fixtures
- `mockAircraft` - Aircraft fixtures
- `mockWorkOrders` - Work order fixtures
- `mockWorkOrderItems` - Work order item fixtures

These fixtures use TypeScript types to ensure they match the real API response shapes.

## Running Tests

```bash
# Run all unit and integration tests
yarn test

# Run with coverage report
yarn test:cov

# Run tests in watch mode
yarn test --watch

# Run E2E tests (requires running dev servers)
yarn test:e2e

# Run E2E tests with UI
yarn test:e2e --ui
```

## Coverage

Coverage is enforced at 80% for statements, branches, functions, and lines. The following are excluded:

- `src/components/ui/**` - shadcn/ui primitives (third-party)
- `src/app/layout.tsx` - Root layout
- `src/app/page.tsx` - Root page
- Type definition files (`*.d.ts`)

## Writing New Tests

### Unit Test Example

```typescript
import { describe, it, expect } from "vitest";
import { citiesApi } from "@/lib/api";

describe("citiesApi", () => {
  it("should fetch cities", async () => {
    const result = await citiesApi.list();
    expect(result.items).toHaveLength(2);
  });
});
```

### Integration Test Example

```typescript
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MyComponent } from "@/components/features/my-component";

describe("MyComponent", () => {
  it("should handle user interaction", async () => {
    const user = userEvent.setup();
    render(<MyComponent />);

    await user.click(screen.getByRole("button"));

    await waitFor(() => {
      expect(screen.getByText("Success")).toBeInTheDocument();
    });
  });
});
```

### E2E Test Example

```typescript
import { test, expect } from "@playwright/test";

test("should complete workflow", async ({ page }) => {
  await page.goto("/workorder");
  await expect(page.getByText("Work Orders")).toBeVisible();
});
```

## Troubleshooting

**Tests fail with "unhandled request" errors**
Add a handler in `mocks/handlers.ts` for the missing endpoint.

**Component tests fail with navigation errors**
Ensure `next/navigation` is mocked in `setup.tsx` or your test file.

**E2E tests time out or fail**
Verify both dev servers are running and accessible.
