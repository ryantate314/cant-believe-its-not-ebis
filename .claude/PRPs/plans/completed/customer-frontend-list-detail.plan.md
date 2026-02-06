# Feature: Customer List & Detail Frontend (Phase 3)

## Summary

Build the frontend Customer List and Detail pages following the exact patterns established by the Aircraft entity. This includes TypeScript types, an API client module, Next.js proxy routes, four pages (list, detail, create/edit), three feature components, navigation link, mock data, MSW handlers, and Vitest integration tests. The implementation mirrors the Aircraft feature 1:1 — same file structure, same component patterns, same testing approach.

## User Story

As an MRO service writer
I want to view, create, edit, and delete customers from the UI
So that I can manage customer records without needing direct database access

## Problem Statement

Customer CRUD API endpoints exist (Phase 1) but there is no frontend UI. Staff cannot view, search, create, edit, or delete customers through the application. All customer management requires direct API calls.

## Solution Statement

Create a complete Customer frontend module following the Aircraft entity pattern: TypeScript types in `types/customer.ts`, API client in `lib/api/customers.ts`, Next.js proxy routes at `app/api/customers/`, four App Router pages under `app/(user)/customers/`, three feature components (list, detail, form), navigation link in sidebar, and integration tests with MSW mocks. Customers are global (no city scoping) which makes the list page simpler than aircraft (no city filter dropdown needed).

## Metadata

| Field            | Value                                              |
| ---------------- | -------------------------------------------------- |
| Type             | NEW_CAPABILITY                                     |
| Complexity       | MEDIUM                                             |
| Systems Affected | Next.js frontend (types, API client, proxy routes, pages, components, tests) |
| Dependencies     | Next.js 16, React 19, shadcn/ui, MSW 2, Vitest    |
| Estimated Tasks  | 12                                                 |

---

## UX Design

### Before State

```
╔═══════════════════════════════════════════════════════════════════════════╗
║                              BEFORE STATE                               ║
╠═══════════════════════════════════════════════════════════════════════════╣
║                                                                         ║
║   Sidebar Navigation:                                                   ║
║   ┌────────────────┐                                                    ║
║   │  Dashboard     │                                                    ║
║   │  Work Orders   │                                                    ║
║   │  Aircraft      │                                                    ║
║   └────────────────┘                                                    ║
║                                                                         ║
║   Customer API exists at /api/v1/customers but NO UI to access it.      ║
║   Staff must use API tools (curl, Swagger) to manage customers.         ║
║                                                                         ║
║   USER_FLOW: Staff cannot manage customers from the browser             ║
║   PAIN_POINT: No customer list, no create/edit forms, no UI at all      ║
║   DATA_FLOW: FastAPI endpoints exist but are inaccessible from UI       ║
║                                                                         ║
╚═══════════════════════════════════════════════════════════════════════════╝
```

### After State

```
╔═══════════════════════════════════════════════════════════════════════════╗
║                               AFTER STATE                               ║
╠═══════════════════════════════════════════════════════════════════════════╣
║                                                                         ║
║   Sidebar Navigation:                                                   ║
║   ┌────────────────┐                                                    ║
║   │  Dashboard     │                                                    ║
║   │  Work Orders   │                                                    ║
║   │  Aircraft      │                                                    ║
║   │  Customers  ←──┤  NEW nav item                                      ║
║   └────────────────┘                                                    ║
║                                                                         ║
║   /customers (List Page):                                               ║
║   ┌──────────────────────────────────────────────────────────────┐      ║
║   │  Customers                           [New Customer]          │      ║
║   │  [Search...________________________]                         │      ║
║   │                                                              │      ║
║   │  Name ▼        | Email       | Phone      | Status | Created│      ║
║   │  ───────────────────────────────────────────────────────────│      ║
║   │  Acme Corp     | acme@ex.com | 555-0100   | Active | 01/15  │      ║
║   │  Beta LLC      | beta@ex.com | 555-0200   | Active | 01/14  │      ║
║   │                                                              │      ║
║   │  Showing 2 of 2 customers    [Previous] [Next]              │      ║
║   └──────────────────────────────────────────────────────────────┘      ║
║                                                                         ║
║   /customers/[id] (Detail Page):                                        ║
║   ┌──────────────────────────────────────────────────────────────┐      ║
║   │  Acme Corp  [Active]                      [Edit] [Delete]   │      ║
║   │                                                              │      ║
║   │  ┌─ Contact Information ──────────────────────────────────┐ │      ║
║   │  │  Email: acme@example.com    Phone: 555-0100            │ │      ║
║   │  │  Address: 123 Main St, Springfield, IL 62701           │ │      ║
║   │  └────────────────────────────────────────────────────────┘ │      ║
║   │                                                              │      ║
║   │  ┌─ Notes ────────────────────────────────────────────────┐ │      ║
║   │  │  Preferred customer, net 30 terms.                     │ │      ║
║   │  └────────────────────────────────────────────────────────┘ │      ║
║   │                                                              │      ║
║   │  ┌─ Audit Information ────────────────────────────────────┐ │      ║
║   │  │  Created By: system    Created At: 01/15/2026          │ │      ║
║   │  └────────────────────────────────────────────────────────┘ │      ║
║   └──────────────────────────────────────────────────────────────┘      ║
║                                                                         ║
║   /customers/new & /customers/[id]/edit (Form Page):                    ║
║   ┌──────────────────────────────────────────────────────────────┐      ║
║   │  ┌─ Customer Details ─────────────────────────────────────┐ │      ║
║   │  │  Name*: [____________]    Email: [____________]        │ │      ║
║   │  │  Phone: [____________]    Phone Type: [__________]     │ │      ║
║   │  └────────────────────────────────────────────────────────┘ │      ║
║   │  ┌─ Address ──────────────────────────────────────────────┐ │      ║
║   │  │  Address: [____________]  Address 2: [____________]    │ │      ║
║   │  │  City: [____________]     State: [____________]        │ │      ║
║   │  │  Zip: [____________]      Country: [____________]      │ │      ║
║   │  └────────────────────────────────────────────────────────┘ │      ║
║   │  ┌─ Additional Info ──────────────────────────────────────┐ │      ║
║   │  │  Notes: [___________________________]                  │ │      ║
║   │  │  Status: [Active ▼]                                    │ │      ║
║   │  └────────────────────────────────────────────────────────┘ │      ║
║   │  [Create Customer] [Cancel]                                  │      ║
║   └──────────────────────────────────────────────────────────────┘      ║
║                                                                         ║
║   USER_FLOW: Navigate to Customers -> browse/search -> click row        ║
║              -> view detail -> edit or delete                            ║
║   VALUE_ADD: Full CRUD workflow accessible from browser                 ║
║   DATA_FLOW: UI -> Next.js proxy -> FastAPI -> PostgreSQL               ║
║                                                                         ║
╚═══════════════════════════════════════════════════════════════════════════╝
```

### Interaction Changes

| Location | Before | After | User Impact |
|----------|--------|-------|-------------|
| Sidebar navigation | No Customers link | "Customers" with Users icon | Direct access to customer management |
| `/customers` | 404 | Paginated, searchable, sortable customer list | Browse and search customers |
| `/customers/new` | 404 | Customer create form | Create new customer records |
| `/customers/[id]` | 404 | Customer detail page with edit/delete | View customer info at a glance |
| `/customers/[id]/edit` | 404 | Customer edit form pre-filled | Modify existing customer data |

---

## Mandatory Reading

**CRITICAL: Implementation agent MUST read these files before starting any task:**

| Priority | File | Lines | Why Read This |
|----------|------|-------|---------------|
| P0 | `app/ui/src/types/aircraft.ts` | 1-64 | Type definition pattern to MIRROR exactly |
| P0 | `app/ui/src/lib/api/aircraft.ts` | 1-51 | API client pattern to MIRROR exactly |
| P0 | `app/ui/src/app/api/aircraft/route.ts` | 1-34 | Proxy route (list/create) pattern |
| P0 | `app/ui/src/app/api/aircraft/[id]/route.ts` | 1-72 | Proxy route (get/update/delete) pattern |
| P0 | `app/ui/src/components/features/aircraft/aircraft-list.tsx` | 1-268 | List component pattern (fetch, search, sort, pagination) |
| P0 | `app/ui/src/components/features/aircraft/aircraft-detail.tsx` | 1-232 | Detail component pattern (Card sections, dl/dt/dd, delete) |
| P0 | `app/ui/src/components/features/aircraft/aircraft-form.tsx` | 1-312 | Form component pattern (controlled inputs, submit, Card sections) |
| P1 | `app/ui/src/app/(user)/aircraft/page.tsx` | 1-28 | List page pattern (Suspense + Skeleton) |
| P1 | `app/ui/src/app/(user)/aircraft/[id]/page.tsx` | 1-27 | Detail page pattern (async params) |
| P1 | `app/ui/src/app/(user)/aircraft/[id]/edit/page.tsx` | 1-55 | Edit page pattern (useParams, load then form) |
| P1 | `app/ui/src/app/(user)/aircraft/new/page.tsx` | 1-21 | Create page pattern (Suspense wrapper) |
| P1 | `app/ui/src/app/(user)/layout.tsx` | 1-35 | Navigation items array |
| P2 | `app/ui/__tests__/mocks/handlers.ts` | 1-335 | MSW handler patterns |
| P2 | `app/ui/__tests__/mocks/data/index.ts` | 1-155 | Mock data patterns |
| P2 | `app/ui/__tests__/integration/components/features/work-order-list.test.tsx` | 1-226 | Test structure pattern |

**External Documentation:**

| Source | Section | Why Needed |
|--------|---------|------------|
| shadcn/ui Table | Usage | Already installed; follow existing usage patterns in aircraft-list.tsx |
| lucide-react Icons | Users icon | Import `Users` for sidebar nav item |

---

## Patterns to Mirror

**TYPE_DEFINITION:**
```typescript
// SOURCE: app/ui/src/types/aircraft.ts:1-64
// COPY THIS PATTERN:
export interface Aircraft {
  id: string;               // UUID from backend
  registration_number: string;
  // ... nullable fields use: string | null
  is_active: boolean;
  // Audit
  created_by: string;
  updated_by: string | null;
  created_at: string;       // ISO 8601 string
  updated_at: string;
}

export interface AircraftListResponse {
  items: Aircraft[];
  total: number;
  page: number;
  page_size: number;
}

export interface AircraftCreateInput {
  registration_number: string;  // required fields
  created_by: string;
  serial_number?: string;       // optional fields
}

export interface AircraftUpdateInput {
  registration_number?: string;  // ALL fields optional
  updated_by?: string;
}
```

**API_CLIENT:**
```typescript
// SOURCE: app/ui/src/lib/api/aircraft.ts:1-51
// COPY THIS PATTERN:
import type { Customer, CustomerListResponse, CustomerCreateInput, CustomerUpdateInput } from "@/types/customer";
import type { SortOrder } from "@/types/sorting";
import { fetchApi } from "./base";

export const customersApi = {
  list: (params?: { ... }): Promise<CustomerListResponse> => {
    const searchParams = new URLSearchParams();
    // ... build query string
    return fetchApi(`/customers${queryString ? `?${queryString}` : ""}`);
  },
  get: (id: string): Promise<Customer> => fetchApi(`/customers/${id}`),
  create: (data: CustomerCreateInput): Promise<Customer> =>
    fetchApi("/customers", { method: "POST", body: JSON.stringify(data) }),
  update: (id: string, data: CustomerUpdateInput): Promise<Customer> =>
    fetchApi(`/customers/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  delete: (id: string): Promise<void> =>
    fetchApi(`/customers/${id}`, { method: "DELETE" }),
};
```

**PROXY_ROUTE_LIST:**
```typescript
// SOURCE: app/ui/src/app/api/aircraft/route.ts:1-34
// COPY THIS PATTERN:
import { NextRequest, NextResponse } from "next/server";
const API_URL = process.env.API_URL || "http://localhost:8000";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const response = await fetch(`${API_URL}/api/v1/customers?${searchParams.toString()}`, {
    headers: { "Content-Type": "application/json" },
  });
  const data = await response.json();
  return NextResponse.json(data, { status: response.status });
}
```

**PROXY_ROUTE_DETAIL:**
```typescript
// SOURCE: app/ui/src/app/api/aircraft/[id]/route.ts:1-72
// COPY THIS PATTERN:
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  // ... fetch, 404 handling, return
}
```

**LIST_COMPONENT:**
```typescript
// SOURCE: app/ui/src/components/features/aircraft/aircraft-list.tsx:28-96
// COPY THIS PATTERN:
// - FetchState type with data, total, fetchKey
// - Derive loading from fetchKey mismatch
// - useSearchParams for filters
// - useSortParams hook for sorting
// - useEffect with cancellation for data fetching
// - updateParams helper for URL parameter management
// - SortableTableHead for sortable columns
// - Pagination buttons (Previous/Next)
```

**DETAIL_COMPONENT:**
```typescript
// SOURCE: app/ui/src/components/features/aircraft/aircraft-detail.tsx:1-232
// COPY THIS PATTERN:
// - Load entity on mount via API
// - Loading skeleton, error state, entity display
// - Card sections with CardHeader/CardTitle/CardContent
// - dl/dt/dd grid for data display
// - Edit button -> router.push(`/customers/${id}/edit`)
// - Delete button with window.confirm
// - Badge for active/inactive status
```

**FORM_COMPONENT:**
```typescript
// SOURCE: app/ui/src/components/features/aircraft/aircraft-form.tsx:1-312
// COPY THIS PATTERN:
// - Props: { customer?: Customer; onSuccess?: (customer: Customer) => void }
// - Controlled form state with useState
// - handleChange for Input/Textarea
// - handleSelectChange for Select
// - handleSubmit: validate, build data, call create or update API
// - Card sections grouping related fields
// - Error display at top
// - Submit + Cancel buttons
```

**PAGE_LIST:**
```typescript
// SOURCE: app/ui/src/app/(user)/aircraft/page.tsx:1-28
// COPY THIS PATTERN:
import { Suspense } from "react";
import { CustomerList } from "@/components/features/customers";
import { Skeleton } from "@/components/ui/skeleton";

export default function CustomersListPage() {
  return (
    <div className="container mx-auto py-6">
      <Suspense fallback={<SkeletonFallback />}>
        <CustomerList />
      </Suspense>
    </div>
  );
}
```

**PAGE_DETAIL:**
```typescript
// SOURCE: app/ui/src/app/(user)/aircraft/[id]/page.tsx:1-27
// COPY THIS PATTERN:
interface CustomerPageProps {
  params: Promise<{ id: string }>;
}
export default async function CustomerPage({ params }: CustomerPageProps) {
  const { id } = await params;
  return (<Suspense ...><CustomerDetail customerId={id} /></Suspense>);
}
```

**PAGE_EDIT:**
```typescript
// SOURCE: app/ui/src/app/(user)/aircraft/[id]/edit/page.tsx:1-55
// COPY THIS PATTERN:
"use client";
// - useParams().id to get customer ID
// - Load customer via API
// - Loading/error states
// - Render CustomerForm with customer prop
```

**PAGE_NEW:**
```typescript
// SOURCE: app/ui/src/app/(user)/aircraft/new/page.tsx:1-21
// COPY THIS PATTERN:
"use client";
// - Suspense wrapper
// - Render CustomerForm without customer prop
```

**NAV_ITEM:**
```typescript
// SOURCE: app/ui/src/app/(user)/layout.tsx:6-21
// ADD to userNavItems array:
{
  label: "Customers",
  href: "/customers",
  icon: Users,  // from lucide-react
}
```

**TEST_STRUCTURE:**
```typescript
// SOURCE: app/ui/__tests__/integration/components/features/work-order-list.test.tsx:1-30
// COPY THIS PATTERN:
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const mockSearchParams = new URLSearchParams();
const mockPush = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
  useSearchParams: () => mockSearchParams,
  usePathname: () => "/customers",
}));
```

**MSW_HANDLER:**
```typescript
// SOURCE: app/ui/__tests__/mocks/handlers.ts:302-335
// COPY THIS PATTERN for customers:
http.get("/api/customers", ({ request }) => {
  const url = new URL(request.url);
  // ... filter, search, paginate mockCustomers
  return HttpResponse.json({ items, total, page, page_size });
}),
```

**MOCK_DATA:**
```typescript
// SOURCE: app/ui/__tests__/mocks/data/index.ts:29-76
// COPY THIS PATTERN:
export const mockCustomers: Customer[] = [
  {
    id: "customer-uuid-1",
    name: "Acme Corp",
    email: "acme@example.com",
    // ... all fields
  },
];
```

---

## Files to Change

| File | Action | Justification |
|------|--------|---------------|
| `app/ui/src/types/customer.ts` | CREATE | TypeScript types for Customer entity |
| `app/ui/src/types/index.ts` | UPDATE | Export customer types |
| `app/ui/src/lib/api/customers.ts` | CREATE | API client module for customer CRUD |
| `app/ui/src/lib/api/index.ts` | UPDATE | Export customersApi |
| `app/ui/src/app/api/customers/route.ts` | CREATE | Next.js proxy route (GET list, POST create) |
| `app/ui/src/app/api/customers/[id]/route.ts` | CREATE | Next.js proxy route (GET, PUT, DELETE by ID) |
| `app/ui/src/components/features/customers/customer-list.tsx` | CREATE | Customer list component with search, sort, pagination |
| `app/ui/src/components/features/customers/customer-detail.tsx` | CREATE | Customer detail component with Card sections |
| `app/ui/src/components/features/customers/customer-form.tsx` | CREATE | Customer create/edit form component |
| `app/ui/src/components/features/customers/index.ts` | CREATE | Barrel export for customer components |
| `app/ui/src/app/(user)/customers/page.tsx` | CREATE | Customer list page (Suspense wrapper) |
| `app/ui/src/app/(user)/customers/[id]/page.tsx` | CREATE | Customer detail page |
| `app/ui/src/app/(user)/customers/[id]/edit/page.tsx` | CREATE | Customer edit page |
| `app/ui/src/app/(user)/customers/new/page.tsx` | CREATE | Customer create page |
| `app/ui/src/app/(user)/layout.tsx` | UPDATE | Add Customers nav item |
| `app/ui/__tests__/mocks/data/index.ts` | UPDATE | Add mockCustomers data |
| `app/ui/__tests__/mocks/handlers.ts` | UPDATE | Add customer API handlers |
| `app/ui/__tests__/integration/components/features/customer-list.test.tsx` | CREATE | Integration tests for customer list |
| `app/ui/__tests__/integration/components/features/customer-form.test.tsx` | CREATE | Integration tests for customer form |

---

## NOT Building (Scope Limits)

- **Aircraft-customer linking UI** - Phase 4 scope; this phase is standalone customer CRUD only
- **Customer display on work orders** - Phase 4 scope; requires relationship UI
- **Customer selector on aircraft form** - Phase 4 scope
- **Advanced search filters** - Basic name/email/phone search via single search input only
- **Billing profiles, tax overrides, addresses** - Deferred per PRD
- **E2E (Playwright) tests** - Integration tests only for this phase; E2E can be added later
- **Unit tests for API client** - Existing `api.test.ts` tests the base `fetchApi` function; customer-specific API client is tested indirectly through integration tests (same pattern as existing entities)

---

## Step-by-Step Tasks

Execute in order. Each task is atomic and independently verifiable.

### Task 1: CREATE `app/ui/src/types/customer.ts`

- **ACTION**: Create TypeScript type definitions for Customer
- **IMPLEMENT**:
  ```typescript
  export interface Customer {
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
    phone_type: string | null;
    address: string | null;
    address_2: string | null;
    city: string | null;
    state: string | null;
    zip: string | null;
    country: string | null;
    notes: string | null;
    is_active: boolean;

    // Audit
    created_by: string;
    updated_by: string | null;
    created_at: string;
    updated_at: string;
  }

  export interface CustomerListResponse {
    items: Customer[];
    total: number;
    page: number;
    page_size: number;
  }

  export interface CustomerCreateInput {
    name: string;
    created_by: string;
    email?: string;
    phone?: string;
    phone_type?: string;
    address?: string;
    address_2?: string;
    city?: string;
    state?: string;
    zip?: string;
    country?: string;
    notes?: string;
    is_active?: boolean;
  }

  export interface CustomerUpdateInput {
    name?: string;
    email?: string;
    phone?: string;
    phone_type?: string;
    address?: string;
    address_2?: string;
    city?: string;
    state?: string;
    zip?: string;
    country?: string;
    notes?: string;
    is_active?: boolean;
    updated_by?: string;
  }
  ```
- **MIRROR**: `app/ui/src/types/aircraft.ts:1-64`
- **GOTCHA**: Customer `city`, `state`, `zip`, `country` are string fields for mailing address — NOT related to the MRO `City` entity. Use `string | null` type, NOT a `City` reference.
- **GOTCHA**: The `id` field is `string` (UUID serialized as string from backend). All datetime fields are ISO 8601 `string`.
- **VALIDATE**: `cd app/ui && npx tsc --noEmit`

### Task 2: UPDATE `app/ui/src/types/index.ts`

- **ACTION**: Export customer types from barrel file
- **IMPLEMENT**: Add `export * from "./customer";`
- **MIRROR**: `app/ui/src/types/index.ts:5` — follow existing export pattern
- **VALIDATE**: `cd app/ui && npx tsc --noEmit`

### Task 3: CREATE `app/ui/src/lib/api/customers.ts`

- **ACTION**: Create API client module for customer CRUD
- **IMPLEMENT**:
  ```typescript
  import type {
    Customer,
    CustomerListResponse,
    CustomerCreateInput,
    CustomerUpdateInput,
  } from "@/types/customer";
  import type { SortOrder } from "@/types/sorting";
  import { fetchApi } from "./base";

  export const customersApi = {
    list: (params?: {
      page?: number;
      page_size?: number;
      search?: string;
      active_only?: boolean;
      sort_by?: string;
      sort_order?: SortOrder;
    }): Promise<CustomerListResponse> => {
      const searchParams = new URLSearchParams();
      if (params?.page) searchParams.set("page", String(params.page));
      if (params?.page_size)
        searchParams.set("page_size", String(params.page_size));
      if (params?.search) searchParams.set("search", params.search);
      if (params?.active_only !== undefined)
        searchParams.set("active_only", String(params.active_only));
      if (params?.sort_by) searchParams.set("sort_by", params.sort_by);
      if (params?.sort_order) searchParams.set("sort_order", params.sort_order);
      const queryString = searchParams.toString();
      return fetchApi(`/customers${queryString ? `?${queryString}` : ""}`);
    },

    get: (id: string): Promise<Customer> => fetchApi(`/customers/${id}`),

    create: (data: CustomerCreateInput): Promise<Customer> =>
      fetchApi("/customers", {
        method: "POST",
        body: JSON.stringify(data),
      }),

    update: (id: string, data: CustomerUpdateInput): Promise<Customer> =>
      fetchApi(`/customers/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),

    delete: (id: string): Promise<void> =>
      fetchApi(`/customers/${id}`, {
        method: "DELETE",
      }),
  };
  ```
- **MIRROR**: `app/ui/src/lib/api/aircraft.ts:1-51`
- **GOTCHA**: No `city_id` parameter (customers are global, no city scoping). This is the key difference from aircraft API.
- **VALIDATE**: `cd app/ui && npx tsc --noEmit`

### Task 4: UPDATE `app/ui/src/lib/api/index.ts`

- **ACTION**: Export customersApi from barrel file
- **IMPLEMENT**: Add `export { customersApi } from "./customers";`
- **MIRROR**: `app/ui/src/lib/api/index.ts:7` — follow existing export pattern
- **VALIDATE**: `cd app/ui && npx tsc --noEmit`

### Task 5: CREATE Next.js proxy routes

- **ACTION**: Create proxy routes at `app/api/customers/route.ts` and `app/api/customers/[id]/route.ts`
- **IMPLEMENT**:

  **`app/ui/src/app/api/customers/route.ts`** (GET list + POST create):
  ```typescript
  import { NextRequest, NextResponse } from "next/server";

  const API_URL = process.env.API_URL || "http://localhost:8000";

  export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;

    const response = await fetch(
      `${API_URL}/api/v1/customers?${searchParams.toString()}`,
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  }

  export async function POST(request: NextRequest) {
    const body = await request.json();

    const response = await fetch(`${API_URL}/api/v1/customers`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  }
  ```

  **`app/ui/src/app/api/customers/[id]/route.ts`** (GET, PUT, DELETE by ID):
  ```typescript
  import { NextRequest, NextResponse } from "next/server";

  const API_URL = process.env.API_URL || "http://localhost:8000";

  export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
  ) {
    const { id } = await params;

    const response = await fetch(`${API_URL}/api/v1/customers/${id}`, {
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (response.status === 404) {
      return NextResponse.json(
        { detail: "Customer not found" },
        { status: 404 }
      );
    }

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  }

  export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
  ) {
    const { id } = await params;
    const body = await request.json();

    const response = await fetch(`${API_URL}/api/v1/customers/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (response.status === 404) {
      return NextResponse.json(
        { detail: "Customer not found" },
        { status: 404 }
      );
    }

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  }

  export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
  ) {
    const { id } = await params;

    const response = await fetch(`${API_URL}/api/v1/customers/${id}`, {
      method: "DELETE",
    });

    if (response.status === 404) {
      return NextResponse.json(
        { detail: "Customer not found" },
        { status: 404 }
      );
    }

    return new NextResponse(null, { status: 204 });
  }
  ```

- **MIRROR**: `app/ui/src/app/api/aircraft/route.ts:1-34` and `app/ui/src/app/api/aircraft/[id]/route.ts:1-72`
- **GOTCHA**: Proxy routes use `API_URL` env var (defaults to `http://localhost:8000`). Backend endpoint is `/api/v1/customers` (note the `/api/v1/` prefix).
- **GOTCHA**: `params` is `Promise<{ id: string }>` in Next.js 15+ — must `await params`.
- **VALIDATE**: `cd app/ui && npx tsc --noEmit`

### Task 6: CREATE customer feature components

- **ACTION**: Create `customer-list.tsx`, `customer-detail.tsx`, `customer-form.tsx`, and `index.ts`
- **IMPLEMENT**:

  **`app/ui/src/components/features/customers/customer-list.tsx`**:
  - Client component (`"use client"`)
  - FetchState pattern with fetchKey for derived loading
  - useSearchParams for `search` and `page` URL parameters
  - useSortParams with `defaultSortBy: "name"`, `defaultSortOrder: "asc"`
  - useEffect with cancellation for data fetching from `customersApi.list()`
  - No city filter (customers are global — this is simpler than aircraft)
  - Search input for name/email/phone filtering
  - SortableTableHead columns: Name (sortable, `name`), Email (sortable, `email`), Phone, Status (Badge), Created (sortable, `created_at`)
  - Table rows: clickable, navigate to `/customers/{id}`
  - "New Customer" button navigates to `/customers/new`
  - Pagination: Previous/Next buttons, "Showing X of Y customers" text
  - Empty state: "No customers found"
  - **KEY DIFFERENCE from aircraft**: No city filter dropdown, no city dependency. Customer list loads immediately.

  **`app/ui/src/components/features/customers/customer-detail.tsx`**:
  - Client component (`"use client"`)
  - Load customer on mount via `customersApi.get(customerId)`
  - Loading skeleton, error state, not found state
  - Header: customer name + Active/Inactive Badge + Edit/Delete buttons
  - Card 1 "Contact Information": name, email, phone, phone_type (dl/dt/dd grid)
  - Card 2 "Address": address, address_2, city, state, zip, country (dl/dt/dd grid)
  - Card 3 "Notes": conditionally rendered if notes exist
  - Card 4 "Audit Information": created_by, created_at, updated_by, updated_at
  - Delete with window.confirm, redirect to `/customers` on success

  **`app/ui/src/components/features/customers/customer-form.tsx`**:
  - Client component (`"use client"`)
  - Props: `{ customer?: Customer; onSuccess?: (customer: Customer) => void }`
  - Controlled form state initialized from `customer` prop (edit) or defaults (create)
  - Card 1 "Customer Details": name* (required), email, phone, phone_type
  - Card 2 "Address": address, address_2, city, state, zip, country
  - Card 3 "Additional Information": notes (Textarea), is_active (Select)
  - Validation: name is required (throw Error if empty)
  - Submit: call `customersApi.create()` or `customersApi.update()` based on mode
  - created_by/updated_by hardcoded to `"system"` (same as aircraft pattern)
  - On success: navigate to `/customers/{result.id}`
  - Submit + Cancel buttons at bottom

  **`app/ui/src/components/features/customers/index.ts`**:
  ```typescript
  export { CustomerList } from "./customer-list";
  export { CustomerForm } from "./customer-form";
  export { CustomerDetail } from "./customer-detail";
  ```

- **MIRROR**: `app/ui/src/components/features/aircraft/*.tsx` for all components
- **GOTCHA**: Customer has NO city filter (unlike aircraft). The list page is simpler — just search + sort + pagination.
- **GOTCHA**: Customer `city` field is a plain string (mailing address), not a City entity reference. Use a plain Input, NOT a Select/dropdown.
- **GOTCHA**: `phone_type` is a plain text field. Could use a Select with common values ("mobile", "office", "fax", "home") but a plain Input keeps it simple and consistent with Phase 1 API (no enum validation). Use Input.
- **VALIDATE**: `cd app/ui && npx tsc --noEmit`

### Task 7: CREATE customer pages

- **ACTION**: Create four App Router pages for customer CRUD
- **IMPLEMENT**:

  **`app/ui/src/app/(user)/customers/page.tsx`** (List):
  ```typescript
  import { Suspense } from "react";
  import { CustomerList } from "@/components/features/customers";
  import { Skeleton } from "@/components/ui/skeleton";

  export default function CustomersListPage() {
    return (
      <div className="container mx-auto py-6">
        <Suspense
          fallback={
            <div className="space-y-4">
              <Skeleton className="h-10 w-48" />
              <div className="flex gap-4">
                <Skeleton className="h-10 w-[300px]" />
              </div>
              <div className="space-y-2">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            </div>
          }
        >
          <CustomerList />
        </Suspense>
      </div>
    );
  }
  ```

  **`app/ui/src/app/(user)/customers/[id]/page.tsx`** (Detail):
  ```typescript
  import { Suspense } from "react";
  import { CustomerDetail } from "@/components/features/customers";
  import { Skeleton } from "@/components/ui/skeleton";

  interface CustomerPageProps {
    params: Promise<{ id: string }>;
  }

  export default async function CustomerPage({ params }: CustomerPageProps) {
    const { id } = await params;

    return (
      <div className="container mx-auto max-w-4xl py-6">
        <Suspense
          fallback={
            <div className="space-y-4">
              <Skeleton className="h-10 w-64" />
              <Skeleton className="h-48 w-full" />
              <Skeleton className="h-32 w-full" />
            </div>
          }
        >
          <CustomerDetail customerId={id} />
        </Suspense>
      </div>
    );
  }
  ```

  **`app/ui/src/app/(user)/customers/[id]/edit/page.tsx`** (Edit):
  - `"use client"` — uses useParams hook
  - Load customer, show loading/error, render CustomerForm with `customer` prop

  **`app/ui/src/app/(user)/customers/new/page.tsx`** (Create):
  - `"use client"` — renders CustomerForm without customer prop
  - Suspense wrapper

- **MIRROR**: `app/ui/src/app/(user)/aircraft/page.tsx`, `[id]/page.tsx`, `[id]/edit/page.tsx`, `new/page.tsx`
- **GOTCHA**: Detail page is async server component (uses `await params`). Edit page is client component (uses `useParams`). New page is client component. List page is server component wrapping client `CustomerList`.
- **VALIDATE**: `cd app/ui && npx tsc --noEmit`

### Task 8: UPDATE `app/ui/src/app/(user)/layout.tsx`

- **ACTION**: Add Customers navigation item to sidebar
- **IMPLEMENT**:
  - Add `Users` to lucide-react import
  - Add nav item to `userNavItems` array (after Aircraft):
    ```typescript
    {
      label: "Customers",
      href: "/customers",
      icon: Users,
    },
    ```
- **MIRROR**: `app/ui/src/app/(user)/layout.tsx:17-21` — follow Aircraft nav item pattern
- **GOTCHA**: Import `Users` (plural) not `User` from lucide-react
- **VALIDATE**: `cd app/ui && npx tsc --noEmit`

### Task 9: UPDATE mock data — `__tests__/mocks/data/index.ts`

- **ACTION**: Add mockCustomers data for tests
- **IMPLEMENT**:
  ```typescript
  import type { Customer } from "@/types/customer";

  export const mockCustomers: Customer[] = [
    {
      id: "customer-uuid-1",
      name: "Acme Corp",
      email: "acme@example.com",
      phone: "555-0100",
      phone_type: "office",
      address: "123 Main St",
      address_2: "Suite 100",
      city: "Springfield",
      state: "IL",
      zip: "62701",
      country: "US",
      notes: "Preferred customer",
      is_active: true,
      created_by: "test_user",
      updated_by: null,
      created_at: "2026-01-15T10:00:00Z",
      updated_at: "2026-01-15T10:00:00Z",
    },
    {
      id: "customer-uuid-2",
      name: "Beta Aviation LLC",
      email: "beta@example.com",
      phone: "555-0200",
      phone_type: "mobile",
      address: "456 Oak Ave",
      address_2: null,
      city: "Nashville",
      state: "TN",
      zip: "37201",
      country: "US",
      notes: null,
      is_active: true,
      created_by: "test_user",
      updated_by: null,
      created_at: "2026-01-14T10:00:00Z",
      updated_at: "2026-01-14T10:00:00Z",
    },
    {
      id: "customer-uuid-3",
      name: "Inactive Airways",
      email: null,
      phone: null,
      phone_type: null,
      address: null,
      address_2: null,
      city: null,
      state: null,
      zip: null,
      country: null,
      notes: null,
      is_active: false,
      created_by: "test_user",
      updated_by: null,
      created_at: "2026-01-10T10:00:00Z",
      updated_at: "2026-01-10T10:00:00Z",
    },
  ];
  ```
- **MIRROR**: `app/ui/__tests__/mocks/data/index.ts:29-76` — follow mockAircraft pattern
- **GOTCHA**: Include one inactive customer for testing active_only filtering
- **VALIDATE**: `cd app/ui && npx tsc --noEmit`

### Task 10: UPDATE MSW handlers — `__tests__/mocks/handlers.ts`

- **ACTION**: Add customer API mock handlers
- **IMPLEMENT**: Add handlers for all customer CRUD endpoints:
  ```typescript
  // Import mockCustomers from data
  import { mockCustomers } from "./data";
  import type { Customer } from "@/types/customer";

  // Add to handlers array:

  // Customers API
  http.get("/api/customers", ({ request }) => {
    const url = new URL(request.url);
    const activeOnly = url.searchParams.get("active_only") !== "false";
    const search = url.searchParams.get("search");
    const page = parseInt(url.searchParams.get("page") || "1");
    const pageSize = parseInt(url.searchParams.get("page_size") || "20");

    let filtered = activeOnly
      ? mockCustomers.filter((c) => c.is_active)
      : mockCustomers;

    if (search) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(
        (c) =>
          c.name.toLowerCase().includes(searchLower) ||
          c.email?.toLowerCase().includes(searchLower) ||
          c.phone?.toLowerCase().includes(searchLower)
      );
    }

    const start = (page - 1) * pageSize;
    const paged = filtered.slice(start, start + pageSize);

    return HttpResponse.json({
      items: paged,
      total: filtered.length,
      page,
      page_size: pageSize,
    });
  }),

  http.get("/api/customers/:id", ({ params }) => {
    const customer = mockCustomers.find((c) => c.id === params.id);
    if (!customer) {
      return HttpResponse.json(
        { detail: "Customer not found" },
        { status: 404 }
      );
    }
    return HttpResponse.json(customer);
  }),

  http.post("/api/customers", async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    const now = new Date().toISOString();
    const newCustomer: Customer = {
      id: `customer-uuid-${Date.now()}`,
      name: body.name as string,
      email: (body.email as string) || null,
      phone: (body.phone as string) || null,
      phone_type: (body.phone_type as string) || null,
      address: (body.address as string) || null,
      address_2: (body.address_2 as string) || null,
      city: (body.city as string) || null,
      state: (body.state as string) || null,
      zip: (body.zip as string) || null,
      country: (body.country as string) || null,
      notes: (body.notes as string) || null,
      is_active: (body.is_active as boolean) ?? true,
      created_by: body.created_by as string,
      updated_by: null,
      created_at: now,
      updated_at: now,
    };
    return HttpResponse.json(newCustomer, { status: 201 });
  }),

  http.put("/api/customers/:id", async ({ params, request }) => {
    const customer = mockCustomers.find((c) => c.id === params.id);
    if (!customer) {
      return HttpResponse.json(
        { detail: "Customer not found" },
        { status: 404 }
      );
    }
    const body = (await request.json()) as Record<string, unknown>;
    const updated: Customer = {
      ...customer,
      ...body,
      updated_at: new Date().toISOString(),
    };
    return HttpResponse.json(updated);
  }),

  http.delete("/api/customers/:id", ({ params }) => {
    const customer = mockCustomers.find((c) => c.id === params.id);
    if (!customer) {
      return HttpResponse.json(
        { detail: "Customer not found" },
        { status: 404 }
      );
    }
    return new HttpResponse(null, { status: 204 });
  }),
  ```
- **MIRROR**: `app/ui/__tests__/mocks/handlers.ts:302-335` (aircraft handlers)
- **GOTCHA**: Search filters on name, email, and phone (matching backend CRUD behavior). No city_id filter.
- **GOTCHA**: active_only defaults to true (same as backend). `active_only !== "false"` logic matches aircraft handler.
- **VALIDATE**: `cd app/ui && npx tsc --noEmit`

### Task 11: CREATE `__tests__/integration/components/features/customer-list.test.tsx`

- **ACTION**: Create integration tests for customer list component
- **IMPLEMENT**:
  ```
  TestCustomerList:
    describe("initial state"):
      - should render the page title "Customers"
      - should render "New Customer" button
      - should have search input

    describe("data display"):
      - should display customers in a table
      - should show customer name, email, phone columns
      - should show status badge (Active/Inactive)
      - should show total count "Showing X of Y customers"
      - should have sortable table headers

    describe("navigation"):
      - should navigate to customer detail when row is clicked
      - should link to new customer page

    describe("search"):
      - should have search input placeholder "Search..."
      - should filter customers by search term (if testing with MSW)

    describe("empty state"):
      - should show "No customers found" when no results

    describe("pagination"):
      - should have Previous button disabled on first page
      - should have Next button (disabled when results < page_size)
  ```
- **MIRROR**: `app/ui/__tests__/integration/components/features/work-order-list.test.tsx:1-226`
- **GOTCHA**: Mock `useSearchParams` to return a fresh URLSearchParams for each test. Mock `useRouter` with `push: vi.fn()`. Mock `usePathname` to return `"/customers"`.
- **GOTCHA**: Customer list does NOT require a city selection (unlike work orders). Tests should verify data loads immediately on mount.
- **VALIDATE**: `cd app/ui && make ui-test`

### Task 12: CREATE `__tests__/integration/components/features/customer-form.test.tsx`

- **ACTION**: Create integration tests for customer form component
- **IMPLEMENT**:
  ```
  TestCustomerForm:
    describe("create mode"):
      - should render "Create Customer" submit button when no customer prop
      - should render empty form fields
      - should show required indicator on Name field
      - should show error when submitting with empty name
      - should successfully create customer with valid data
      - should navigate to customer detail after creation

    describe("edit mode"):
      - should render "Update Customer" submit button when customer prop provided
      - should pre-fill form fields from customer prop
      - should successfully update customer

    describe("form fields"):
      - should have all expected fields (name, email, phone, phone_type, address, etc.)
      - should have status select (Active/Inactive)
      - should have notes textarea
      - should have Cancel button

    describe("error handling"):
      - should display error message on API failure
  ```
- **MIRROR**: `app/ui/__tests__/integration/components/features/work-order-form.test.tsx` for test structure
- **GOTCHA**: Customer form does NOT load cities (unlike aircraft form). No useEffect for dependent data.
- **GOTCHA**: For edit mode tests, pass a mock customer as the `customer` prop.
- **VALIDATE**: `cd app/ui && make ui-test`

---

## Testing Strategy

### Integration Tests to Write

| Test File | Test Cases | Validates |
|-----------|-----------|-----------|
| `__tests__/integration/components/features/customer-list.test.tsx` | initial state, data display, navigation, search, empty state, pagination | List component |
| `__tests__/integration/components/features/customer-form.test.tsx` | create mode, edit mode, form fields, validation, error handling | Form component |

### Edge Cases Checklist

- [ ] Empty search results ("No customers found" message)
- [ ] Customer with all null optional fields (should display "-" for each)
- [ ] Inactive customer display (should show "Inactive" badge)
- [ ] Form submission with only required field (name + created_by)
- [ ] Form submission with all fields populated
- [ ] API error on create (display error message)
- [ ] API error on delete (display error message)
- [ ] Pagination when results < page_size (Next disabled)
- [ ] Delete confirmation dialog (window.confirm)

---

## Validation Commands

### Level 1: STATIC_ANALYSIS

```bash
cd app/ui && npx tsc --noEmit
```

**EXPECT**: Exit 0, no type errors

### Level 2: LINT

```bash
cd app/ui && yarn lint
```

**EXPECT**: Exit 0, no lint errors

### Level 3: UNIT_TESTS

```bash
make ui-test
```

**EXPECT**: All tests pass including new customer tests

### Level 4: COVERAGE

```bash
make ui-test-cov
```

**EXPECT**: Coverage >= 80% for new customer code

### Level 5: BUILD

```bash
cd app/ui && yarn build
```

**EXPECT**: Build succeeds without errors

### Level 6: MANUAL_VALIDATION

1. Start API server: `make api-run`
2. Start UI server: `make ui-run`
3. Verify "Customers" appears in sidebar navigation
4. Click "Customers" → list page loads with data
5. Type in search → list filters
6. Click column header → list sorts
7. Click "New Customer" → create form loads
8. Fill name + submit → redirects to detail page
9. Click "Edit" on detail page → edit form pre-filled
10. Update a field + submit → changes saved
11. Click "Delete" on detail page → confirm → redirected to list
12. Verify pagination buttons work (create enough customers)

---

## Acceptance Criteria

- [ ] TypeScript types match backend CustomerResponse/CustomerCreate/CustomerUpdate schemas exactly
- [ ] API client module supports all 5 CRUD operations
- [ ] Next.js proxy routes forward to FastAPI backend correctly
- [ ] Customer list page displays paginated, searchable, sortable table
- [ ] Customer detail page shows all contact info with Card sections
- [ ] Customer create form validates name is required
- [ ] Customer edit form pre-fills from existing data
- [ ] Delete with confirmation works from detail page
- [ ] "Customers" appears in sidebar navigation with Users icon
- [ ] All integration tests pass
- [ ] Code coverage >= 80% for new customer code
- [ ] No regressions in existing tests
- [ ] `yarn build` succeeds

---

## Completion Checklist

- [ ] All 12 tasks completed in dependency order
- [ ] Each task validated immediately after completion
- [ ] Level 1: TypeScript compiles (`npx tsc --noEmit`)
- [ ] Level 2: Lint passes (`yarn lint`)
- [ ] Level 3: All tests pass (`make ui-test`)
- [ ] Level 4: Coverage >= 80% (`make ui-test-cov`)
- [ ] Level 5: Build succeeds (`yarn build`)
- [ ] All acceptance criteria met

---

## Risks and Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Coverage threshold not met for new code | Medium | Medium | Customer has many fields; form and detail components are large. Write thorough tests that render and interact with all sections. |
| MSW handler not matching actual API response shape | Low | Medium | Customer types defined from actual backend schemas; mock data mirrors real response structure. |
| shadcn/ui components not yet installed (Table, Card, etc.) | Low | Low | These are already used by Aircraft feature — confirmed present in the codebase. |
| Next.js 16 params Promise pattern | Low | Medium | Already handled correctly in aircraft proxy routes — copy exact pattern. |
| Customer `city` field confusion with City entity | Low | Medium | Document clearly: customer `city` is a plain string Input for mailing address, NOT a Select dropdown referencing the City entity. |

---

## Notes

- Customer `city`, `state`, `zip`, `country` are plain text Input fields for mailing address. They are NOT related to the MRO `City` entity (which represents service center locations). This is a critical distinction that affects the form component — use Input, not Select.
- `phone_type` is a plain text Input field. While it could be a Select with common values, keeping it as Input matches the backend (no enum validation) and avoids unnecessary complexity.
- `created_by` and `updated_by` are hardcoded to `"system"` in the form component, matching the existing aircraft form pattern. When authentication is added later, these will be populated from the auth context.
- The customer list is simpler than aircraft (no city filter required) and simpler than work orders (no city dependency, no status filter). This makes the list component the most straightforward of the three.
- Phase 4 will extend these components: the detail page may get a "Linked Aircraft" tab, and the aircraft form will get a customer selector. The components should be built cleanly to support these future additions.
