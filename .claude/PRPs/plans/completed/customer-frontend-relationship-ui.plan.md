# Feature: Customer Frontend Relationship UI (Phase 4)

## Summary

Build the frontend UI for managing customer-aircraft relationships and displaying customer information on work orders. This includes replacing the denormalized `customer_name` text fields on aircraft and work order frontends with proper relationship-based UI: a customer linking section on aircraft detail/form pages, auto-populated customer display on work orders, and updated TypeScript types to match the backend API's normalized response schemas.

## User Story

As an MRO service writer
I want to link customers to aircraft and see customer info auto-populated on work orders
So that I have a single source of truth for customer data across all records without manual entry

## Problem Statement

The frontend still uses denormalized `customer_name` string fields on Aircraft and WorkOrder types, even though the backend (Phase 2) now returns normalized customer objects via relationships. Aircraft detail/form pages show a plain text customer name field, work order forms allow manual customer name entry, and work order lists display `customer_name` from the old denormalized field. This means the frontend doesn't reflect the actual data model and users can't manage customer-aircraft relationships from the UI.

## Solution Statement

Update frontend types to match the backend's normalized response schemas (aircraft with `customers[]` array, work orders with `customer` object). Replace the aircraft detail/form customer section with a relationship management UI (list linked customers, add/remove, set primary). Replace work order form customer fields with a readonly display of the auto-populated customer. Update work order list to display customer name from the normalized `customer` object.

## Metadata

| Field            | Value                                                    |
| ---------------- | -------------------------------------------------------- |
| Type             | ENHANCEMENT                                              |
| Complexity       | MEDIUM                                                   |
| Systems Affected | Frontend types, aircraft components, work order components, API client, proxy routes, mock data, test handlers |
| Dependencies     | Phase 2 (relationship API) ✅, Phase 3 (customer frontend) ✅ |
| Estimated Tasks  | 12                                                       |

---

## UX Design

### Before State

```
╔═══════════════════════════════════════════════════════════════════╗
║                    AIRCRAFT DETAIL PAGE                          ║
╠═══════════════════════════════════════════════════════════════════╣
║                                                                  ║
║  Aircraft Details  │  Customer Information                       ║
║  ──────────────── │  ───────────────────                        ║
║  Reg: N12345      │  Customer Name: "Test Customer" (text)      ║
║  Make: Cessna     │                                              ║
║  Model: 172       │  (No way to manage multiple customers)       ║
║                   │  (No primary designation)                    ║
║                                                                  ║
╠═══════════════════════════════════════════════════════════════════╣
║                    AIRCRAFT FORM (EDIT)                           ║
╠═══════════════════════════════════════════════════════════════════╣
║  Customer Name: [_______________] (free text input)              ║
║  (No relationship management)                                    ║
║                                                                  ║
╠═══════════════════════════════════════════════════════════════════╣
║                    WORK ORDER FORM                                ║
╠═══════════════════════════════════════════════════════════════════╣
║  Customer Name: [_______________] (editable text)                ║
║  PO Number:     [_______________] (editable text)                ║
║  (Manual entry, not linked to aircraft customer)                 ║
║                                                                  ║
╠═══════════════════════════════════════════════════════════════════╣
║                    WORK ORDER LIST                                ║
╠═══════════════════════════════════════════════════════════════════╣
║  WO #          │ Customer      │ Aircraft │ Status               ║
║  KTYS00001     │ Test Customer │ N12345   │ Created              ║
║  (uses wo.customer_name string)                                  ║
╚═══════════════════════════════════════════════════════════════════╝
```

### After State

```
╔═══════════════════════════════════════════════════════════════════╗
║                    AIRCRAFT DETAIL PAGE                          ║
╠═══════════════════════════════════════════════════════════════════╣
║                                                                  ║
║  Aircraft Details  │  Customers                                  ║
║  ──────────────── │  ─────────                                  ║
║  Reg: N12345      │  ⭐ Acme Corp (acme@example.com)  [✕]      ║
║  Make: Cessna     │     Beta Aviation  [Set Primary] [✕]        ║
║  Model: 172       │                                              ║
║                   │  [+ Add Customer]                            ║
║                   │  (search modal to link existing customer)    ║
║                                                                  ║
╠═══════════════════════════════════════════════════════════════════╣
║                    AIRCRAFT FORM (EDIT)                           ║
╠═══════════════════════════════════════════════════════════════════╣
║  (customer_name field REMOVED from form)                         ║
║  (relationships managed on detail page, not form)                ║
║                                                                  ║
╠═══════════════════════════════════════════════════════════════════╣
║                    WORK ORDER FORM                                ║
╠═══════════════════════════════════════════════════════════════════╣
║  Customer: Acme Corp (readonly, auto-populated from aircraft)    ║
║  (customer_name and customer_po_number fields REMOVED)           ║
║  (customer auto-set by backend from aircraft primary customer)   ║
║                                                                  ║
╠═══════════════════════════════════════════════════════════════════╣
║                    WORK ORDER LIST                                ║
╠═══════════════════════════════════════════════════════════════════╣
║  WO #          │ Customer      │ Aircraft │ Status               ║
║  KTYS00001     │ Acme Corp     │ N12345   │ Created              ║
║  (uses wo.customer?.name from normalized object)                 ║
╚═══════════════════════════════════════════════════════════════════╝
```

### Interaction Changes

| Location | Before | After | User Impact |
|----------|--------|-------|-------------|
| Aircraft detail | Shows `customer_name` text | Shows linked customers list with primary badge, add/remove/set-primary actions | Can manage multi-customer relationships |
| Aircraft form | Free text `customer_name` input | Customer section removed (relationships managed on detail page) | Cleaner form, proper relationship management |
| Work order form | Editable `customer_name` + `customer_po_number` inputs | Readonly customer display (auto-populated from aircraft) | No manual entry; consistent data |
| Work order list | `wo.customer_name` string | `wo.customer?.name` from object | Displays normalized customer data |
| Work order header | `workOrder.customer_name` string | `workOrder.customer?.name` from object | Displays normalized customer data |

---

## Mandatory Reading

**CRITICAL: Implementation agent MUST read these files before starting any task:**

| Priority | File | Lines | Why Read This |
|----------|------|-------|---------------|
| P0 | `app/ui/src/types/aircraft.ts` | all | Types to UPDATE - remove `customer_name`, add `customers[]` |
| P0 | `app/ui/src/types/work-order.ts` | all | Types to UPDATE - replace `customer_name`/`customer_po_number` with `customer` object |
| P0 | `app/ui/src/components/features/aircraft/aircraft-detail.tsx` | all | Component to UPDATE - replace customer section |
| P0 | `app/ui/src/components/features/aircraft/aircraft-form.tsx` | all | Component to UPDATE - remove customer_name field |
| P0 | `app/ui/src/components/features/work-orders/work-order-form.tsx` | all | Component to UPDATE - replace customer fields |
| P0 | `app/ui/src/components/features/work-orders/work-order-list.tsx` | 263-290 | Component to UPDATE - customer column |
| P0 | `app/ui/src/components/features/work-orders/work-order-header.tsx` | 77-80 | Component to UPDATE - customer display |
| P1 | `app/ui/src/lib/api/aircraft.ts` | all | API client - may need relationship methods |
| P1 | `app/ui/src/lib/api/customers.ts` | all | API client - may need relationship methods |
| P1 | `app/ui/__tests__/mocks/data/index.ts` | all | Mock data to UPDATE |
| P1 | `app/ui/__tests__/mocks/handlers.ts` | all | MSW handlers to UPDATE |
| P2 | `app/ui/__tests__/integration/components/features/work-order-form.test.tsx` | all | Tests to UPDATE |

---

## Patterns to Mirror

**API_CLIENT_PATTERN:**
```typescript
// SOURCE: app/ui/src/lib/api/customers.ts:10-50
// COPY THIS PATTERN for new relationship methods:
export const customersApi = {
  // ...existing methods...
  linkAircraft: (customerId: string, aircraftId: string): Promise<{ is_primary: boolean }> =>
    fetchApi(`/customers/${customerId}/aircraft/${aircraftId}?created_by=system`, {
      method: "POST",
    }),
  // etc.
};
```

**PROXY_ROUTE_PATTERN:**
```typescript
// SOURCE: app/ui/src/app/api/customers/[id]/route.ts:1-40
// COPY THIS PATTERN for new proxy routes:
const API_URL = process.env.API_URL || "http://localhost:8000";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  // Forward to FastAPI...
}
```

**COMPONENT_PATTERN (detail with data fetching):**
```typescript
// SOURCE: app/ui/src/components/features/aircraft/aircraft-detail.tsx:16-29
// State + useEffect fetch pattern:
const [aircraft, setAircraft] = useState<Aircraft | null>(null);
const [loading, setLoading] = useState(true);
const [error, setError] = useState<string | null>(null);

useEffect(() => {
  aircraftApi
    .get(aircraftId)
    .then(setAircraft)
    .catch((err) => setError(err.message))
    .finally(() => setLoading(false));
}, [aircraftId]);
```

**DIALOG/COMMAND SEARCH PATTERN (aircraft selector):**
```typescript
// SOURCE: app/ui/src/components/features/work-orders/work-order-form.tsx:298-342
// COPY THIS PATTERN for customer search modal:
<Dialog open={modalOpen} onOpenChange={setModalOpen}>
  <DialogContent className="sm:max-w-[500px]">
    <DialogHeader>
      <DialogTitle>Select Customer</DialogTitle>
      <DialogDescription>Search for a customer by name or email.</DialogDescription>
    </DialogHeader>
    <Command className="rounded-lg border">
      <CommandInput placeholder="Search customers..." />
      <CommandList className="max-h-[300px]">
        <CommandEmpty>No customers found.</CommandEmpty>
        <CommandGroup>
          {customerList.map((customer) => (
            <CommandItem key={customer.id} ...>...</CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </Command>
  </DialogContent>
</Dialog>
```

**MSW_HANDLER_PATTERN:**
```typescript
// SOURCE: app/ui/__tests__/mocks/handlers.ts:382-404
// COPY THIS PATTERN for relationship handlers:
http.post("/api/customers/:customerId/aircraft/:aircraftId", async ({ params }) => {
  return HttpResponse.json({ is_primary: true }, { status: 201 });
}),
```

**TEST_PATTERN:**
```typescript
// SOURCE: app/ui/__tests__/integration/components/features/work-order-form.test.tsx:1-20
// COPY THIS PATTERN for test structure:
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const mockPush = vi.fn();
const mockBack = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush, back: mockBack }),
}));
```

---

## Files to Change

| File | Action | Justification |
|------|--------|---------------|
| `app/ui/src/types/aircraft.ts` | UPDATE | Replace `customer_name` with `customers: AircraftCustomer[]`, add `AircraftCustomer` interface |
| `app/ui/src/types/work-order.ts` | UPDATE | Replace `customer_name`/`customer_po_number` with `customer: CustomerBrief \| null`, add `CustomerBrief` interface, remove from create/update inputs |
| `app/ui/src/lib/api/customers.ts` | UPDATE | Add relationship methods: `linkAircraft`, `unlinkAircraft`, `setPrimaryAircraft`, `listAircraft` |
| `app/ui/src/app/api/customers/[id]/aircraft/[aircraftId]/route.ts` | CREATE | Proxy route for link/unlink customer-aircraft |
| `app/ui/src/app/api/customers/[id]/aircraft/[aircraftId]/primary/route.ts` | CREATE | Proxy route for set primary customer |
| `app/ui/src/app/api/customers/[id]/aircraft/route.ts` | CREATE | Proxy route for list customer aircraft |
| `app/ui/src/components/features/aircraft/aircraft-customer-section.tsx` | CREATE | New component for customer relationship management on aircraft detail page |
| `app/ui/src/components/features/aircraft/aircraft-detail.tsx` | UPDATE | Replace customer name display with `AircraftCustomerSection` component |
| `app/ui/src/components/features/aircraft/aircraft-form.tsx` | UPDATE | Remove `customer_name` field from form |
| `app/ui/src/components/features/work-orders/work-order-form.tsx` | UPDATE | Replace customer inputs with readonly auto-populated display |
| `app/ui/src/components/features/work-orders/work-order-list.tsx` | UPDATE | Use `wo.customer?.name` instead of `wo.customer_name` |
| `app/ui/src/components/features/work-orders/work-order-header.tsx` | UPDATE | Use `workOrder.customer?.name` instead of `workOrder.customer_name` |
| `app/ui/__tests__/mocks/data/index.ts` | UPDATE | Update mock data to match new types |
| `app/ui/__tests__/mocks/handlers.ts` | UPDATE | Add relationship handlers, update existing aircraft/WO handlers |
| `app/ui/__tests__/integration/components/features/aircraft-detail.test.tsx` | CREATE | Tests for aircraft detail with customer section |
| `app/ui/__tests__/integration/components/features/aircraft-customer-section.test.tsx` | CREATE | Tests for customer linking UI |
| `app/ui/__tests__/integration/components/features/work-order-form.test.tsx` | UPDATE | Update tests for new customer display |
| `app/ui/__tests__/integration/components/features/work-order-list.test.tsx` | UPDATE | Update tests for new customer column |

---

## NOT Building (Scope Limits)

- **Customer search/autocomplete on aircraft form** — Relationship management happens on the detail page, not the create/edit form. This keeps the form simple and avoids needing to create a customer before creating an aircraft.
- **Customer editing from aircraft context** — Users click through to the customer detail page to edit customer info. No inline editing on aircraft page.
- **Work order customer override** — The customer on a work order is auto-populated from the aircraft's primary customer by the backend. No manual override in the UI. Users change the aircraft's primary customer if they need a different customer on new work orders.
- **Bulk customer assignment** — Only one customer can be linked at a time via the search modal.
- **Aircraft-scoped customer search endpoint** — We use the existing customer list endpoint for the search modal, not a special aircraft-scoped one.

---

## Step-by-Step Tasks

Execute in order. Each task is atomic and independently verifiable.

### Task 1: UPDATE `app/ui/src/types/aircraft.ts`

- **ACTION**: Replace `customer_name` field with `customers` array, add `AircraftCustomer` interface
- **IMPLEMENT**:
  ```typescript
  export interface AircraftCustomer {
    id: string;
    name: string;
    email: string | null;
    is_primary: boolean;
  }

  export interface Aircraft {
    // ... existing fields ...
    customers: AircraftCustomer[];  // REPLACES customer_name
    // ... rest of fields ...
  }
  ```
- **REMOVE**: `customer_name` from `Aircraft`, `AircraftCreateInput`, `AircraftUpdateInput`
- **MIRROR**: Backend `AircraftCustomerResponse` schema (id, name, email, is_primary)
- **VALIDATE**: `cd app/ui && npx tsc --noEmit` (will show errors in files that still reference `customer_name` — expected, fixed in later tasks)

### Task 2: UPDATE `app/ui/src/types/work-order.ts`

- **ACTION**: Replace `customer_name`/`customer_po_number` with `customer` object
- **IMPLEMENT**:
  ```typescript
  export interface CustomerBrief {
    id: string;
    name: string;
    email: string | null;
  }

  export interface WorkOrder {
    // ... existing fields ...
    customer: CustomerBrief | null;  // REPLACES customer_name + customer_po_number
    // ... rest of fields ...
  }
  ```
- **REMOVE**: `customer_name` and `customer_po_number` from `WorkOrder`, `WorkOrderCreateInput`, `WorkOrderUpdateInput`
- **MIRROR**: Backend `CustomerBrief` and `WorkOrderResponse` schemas
- **VALIDATE**: `cd app/ui && npx tsc --noEmit` (will show errors — expected)

### Task 3: UPDATE `app/ui/src/lib/api/customers.ts`

- **ACTION**: Add aircraft relationship methods to customers API client
- **IMPLEMENT**:
  ```typescript
  // Add to customersApi object:
  listAircraft: (customerId: string): Promise<AircraftCustomer[]> =>
    fetchApi(`/customers/${customerId}/aircraft`),

  linkAircraft: (customerId: string, aircraftId: string): Promise<{ is_primary: boolean }> =>
    fetchApi(`/customers/${customerId}/aircraft/${aircraftId}?created_by=system`, {
      method: "POST",
    }),

  unlinkAircraft: (customerId: string, aircraftId: string): Promise<void> =>
    fetchApi(`/customers/${customerId}/aircraft/${aircraftId}`, {
      method: "DELETE",
    }),

  setPrimaryAircraft: (customerId: string, aircraftId: string): Promise<{ status: string }> =>
    fetchApi(`/customers/${customerId}/aircraft/${aircraftId}/primary`, {
      method: "PUT",
    }),
  ```
- **IMPORTS**: Will need the `AircraftCustomer` type from aircraft types (for `listAircraft` return type — or define inline)
- **NOTE**: The `created_by=system` is passed as query param for link endpoint, matching backend API signature
- **VALIDATE**: `cd app/ui && npx tsc --noEmit`

### Task 4: CREATE proxy routes for customer-aircraft relationship endpoints

- **ACTION**: Create Next.js API proxy routes for the 3 relationship endpoints
- **CREATE FILES**:
  1. `app/ui/src/app/api/customers/[id]/aircraft/route.ts` — GET (list aircraft for customer)
  2. `app/ui/src/app/api/customers/[id]/aircraft/[aircraftId]/route.ts` — POST (link), DELETE (unlink)
  3. `app/ui/src/app/api/customers/[id]/aircraft/[aircraftId]/primary/route.ts` — PUT (set primary)
- **MIRROR**: `app/ui/src/app/api/customers/[id]/route.ts` for proxy pattern
- **PATTERN**: Forward to `${API_URL}/api/v1/customers/{id}/aircraft/...`
- **GOTCHA**: `params` is `Promise<{ id: string; aircraftId: string }>` — must `await params`
- **GOTCHA**: For POST link, forward `created_by` query parameter from request URL
- **VALIDATE**: `cd app/ui && npx tsc --noEmit`

### Task 5: UPDATE `app/ui/__tests__/mocks/data/index.ts`

- **ACTION**: Update mock data to match new types
- **CHANGES**:
  1. Update `mockAircraft` items: replace `customer_name: "Test Customer"` with `customers: [{ id: "customer-uuid-1", name: "Acme Corp", email: "acme@example.com", is_primary: true }]`
  2. Update `mockWorkOrder`: replace `customer_name: "Test Customer"` and `customer_po_number: "PO-001"` with `customer: { id: "customer-uuid-1", name: "Acme Corp", email: "acme@example.com" }`
  3. Update `mockWorkOrders[1]`: replace `customer_name: "Another Customer"` with `customer: { id: "customer-uuid-2", name: "Beta Aviation LLC", email: "beta@example.com" }`
- **VALIDATE**: `cd app/ui && npx tsc --noEmit`

### Task 6: UPDATE `app/ui/__tests__/mocks/handlers.ts`

- **ACTION**: Update MSW handlers for new types and add relationship endpoints
- **CHANGES**:
  1. Update work order search handler: change `wo.customer_name?.toLowerCase()` to `wo.customer?.name?.toLowerCase()`
  2. Update work order create handler: set `customer` object instead of `customer_name`/`customer_po_number` (simulate auto-population from aircraft's primary customer)
  3. Add aircraft mock handlers to include `customers` array in responses
  4. Add relationship handlers:
     - `POST /api/customers/:customerId/aircraft/:aircraftId` — link (return `{ is_primary: boolean }`)
     - `DELETE /api/customers/:customerId/aircraft/:aircraftId` — unlink (return 204)
     - `PUT /api/customers/:customerId/aircraft/:aircraftId/primary` — set primary (return `{ status: "ok" }`)
     - `GET /api/customers/:customerId/aircraft` — list aircraft for customer
- **VALIDATE**: `cd app/ui && npx tsc --noEmit`

### Task 7: UPDATE `app/ui/src/components/features/work-orders/work-order-list.tsx`

- **ACTION**: Update customer column to use normalized customer object
- **CHANGE**: Line 273: `{wo.customer_name || "-"}` → `{wo.customer?.name || "-"}`
- **NOTE**: The column header and sort key `customer_name` should also be updated. However, since sorting is handled by the backend and the backend may still use `customer_name` as the sort key, check if the backend sort works with the new field. If the backend's sort_by parameter accepts `customer_name` for backward compat, keep it. Otherwise update to match.
- **VALIDATE**: `cd app/ui && npx tsc --noEmit`

### Task 8: UPDATE `app/ui/src/components/features/work-orders/work-order-header.tsx`

- **ACTION**: Update customer display to use normalized customer object
- **CHANGE**: Line 78-80:
  ```typescript
  // BEFORE:
  {workOrder.customer_name && (
    <span>Customer: {workOrder.customer_name}</span>
  )}
  // AFTER:
  {workOrder.customer && (
    <span>Customer: {workOrder.customer.name}</span>
  )}
  ```
- **VALIDATE**: `cd app/ui && npx tsc --noEmit`

### Task 9: UPDATE `app/ui/src/components/features/work-orders/work-order-form.tsx`

- **ACTION**: Replace editable customer fields with readonly auto-populated display
- **CHANGES**:
  1. Remove `customer_name` and `customer_po_number` from `formData` state
  2. Remove customer input fields from JSX
  3. Replace the "Customer Information" Card section with a readonly display:
     ```tsx
     <Card>
       <CardHeader>
         <CardTitle>Customer Information</CardTitle>
       </CardHeader>
       <CardContent>
         {selectedAircraft?.customers?.find(c => c.is_primary) ? (
           <div className="rounded-md bg-muted p-4 text-sm">
             <span className="font-medium">
               {selectedAircraft.customers.find(c => c.is_primary)?.name}
             </span>
             <p className="text-muted-foreground mt-1">
               Auto-populated from aircraft&apos;s primary customer
             </p>
           </div>
         ) : selectedAircraft ? (
           <p className="text-sm text-muted-foreground">
             No primary customer linked to this aircraft
           </p>
         ) : (
           <p className="text-sm text-muted-foreground">
             Select an aircraft to see customer information
           </p>
         )}
       </CardContent>
     </Card>
     ```
  4. Remove `customer_name` and `customer_po_number` from the submit data sent to the API
  5. Update the aircraft selection modal to show customer info from `aircraft.customers` instead of `aircraft.customer_name`
- **GOTCHA**: In edit mode, display `workOrder.customer?.name` for existing WOs (the customer comes from the WO response, not the aircraft)
- **VALIDATE**: `cd app/ui && npx tsc --noEmit`

### Task 10: UPDATE `app/ui/src/components/features/aircraft/aircraft-form.tsx`

- **ACTION**: Remove the customer_name text input from the form
- **CHANGES**:
  1. Remove `customer_name` from `formData` state
  2. Remove the entire "Customer Information" Card section (lines 240-255)
  3. Remove `customer_name` from the submit data object
- **VALIDATE**: `cd app/ui && npx tsc --noEmit`

### Task 11: CREATE `app/ui/src/components/features/aircraft/aircraft-customer-section.tsx` and UPDATE `aircraft-detail.tsx`

- **ACTION**: Create a new component for managing customer-aircraft relationships and wire it into the aircraft detail page
- **IMPLEMENT** `AircraftCustomerSection`:
  - Props: `aircraftId: string`, `customers: AircraftCustomer[]`, `onUpdate: () => void`
  - Shows list of linked customers with:
    - Primary customer marked with star/badge
    - "Set Primary" button for non-primary customers
    - "Remove" (X) button for each customer
  - "Add Customer" button opens a Command search dialog (mirror aircraft selector pattern from work-order-form)
  - Calls `customersApi.linkAircraft()`, `customersApi.unlinkAircraft()`, `customersApi.setPrimaryAircraft()`
  - After any mutation, calls `onUpdate()` to refresh parent data
- **UPDATE** `aircraft-detail.tsx`:
  - Replace the "Customer Information" Card (lines 162-176) with `<AircraftCustomerSection>`
  - Pass `aircraft.customers` and a refresh callback
  - Import the new component
- **MIRROR**: Dialog/Command pattern from `work-order-form.tsx:298-342`
- **VALIDATE**: `cd app/ui && npx tsc --noEmit`

### Task 12: UPDATE and CREATE tests

- **ACTION**: Update existing tests and create new tests for the relationship UI
- **UPDATE** `work-order-form.test.tsx`:
  - Fix mock data references (`customer_name` → `customer`)
  - Update edit mode test that checks customer field value
  - Update or remove test for typing in customer name input
  - Add test: customer info displays as readonly when aircraft selected
- **UPDATE** `work-order-list.test.tsx`:
  - Verify customer column renders `customer.name` from mock data
- **CREATE** `aircraft-detail.test.tsx`:
  - Test: renders aircraft details correctly
  - Test: renders linked customers list
  - Test: shows primary customer with badge
  - Test: renders "Add Customer" button
  - Test: handles aircraft not found
- **CREATE** `aircraft-customer-section.test.tsx`:
  - Test: renders customer list with primary badge
  - Test: opens add customer dialog
  - Test: shows empty state when no customers linked
  - Test: set primary button calls API
  - Test: remove button calls API
- **MIRROR**: Test patterns from `work-order-form.test.tsx` and `customer-form.test.tsx`
- **VALIDATE**: `cd app/ui && make ui-test`

---

## Testing Strategy

### Unit Tests to Write

| Test File | Test Cases | Validates |
|-----------|------------|-----------|
| `__tests__/integration/components/features/aircraft-detail.test.tsx` | Renders details, shows customers, primary badge, add button, not found | Aircraft detail with customer relationships |
| `__tests__/integration/components/features/aircraft-customer-section.test.tsx` | Customer list, add dialog, set primary, remove, empty state | Customer relationship management UI |
| `__tests__/integration/components/features/work-order-form.test.tsx` (update) | Readonly customer display, auto-populate from aircraft, no manual input | Work order form customer changes |
| `__tests__/integration/components/features/work-order-list.test.tsx` (update) | Customer column from normalized object | Work order list customer column |

### Edge Cases Checklist

- [ ] Aircraft with no linked customers (empty state)
- [ ] Aircraft with one customer (automatically primary, no "set primary" button needed)
- [ ] Aircraft with multiple customers (one primary, others have "set primary" option)
- [ ] Work order with no customer (aircraft has no primary customer)
- [ ] Work order in edit mode displaying existing customer from WO response
- [ ] Creating work order when selected aircraft has primary customer (readonly display shows customer)
- [ ] Adding a customer to aircraft that already has that customer linked (error handling)
- [ ] Removing primary customer (next customer auto-promotes — handled by backend)

---

## Validation Commands

### Level 1: STATIC_ANALYSIS

```bash
cd app/ui && npx tsc --noEmit && yarn lint
```

**EXPECT**: Exit 0, no errors or warnings

### Level 2: UNIT_TESTS

```bash
make ui-test
```

**EXPECT**: All tests pass, coverage >= 80%

### Level 3: FULL_SUITE

```bash
make ui-test && cd app/ui && yarn build
```

**EXPECT**: All tests pass, build succeeds

### Level 6: MANUAL_VALIDATION

1. Navigate to Aircraft detail page → verify linked customers display with primary badge
2. Click "Add Customer" → search modal opens → select customer → customer appears in list
3. Click "Set Primary" on non-primary customer → badge moves
4. Click remove (X) on customer → customer removed from list
5. Navigate to Work Order form → select an aircraft with primary customer → customer info shows as readonly
6. Create a new work order → verify customer auto-populated
7. Navigate to Work Order list → verify customer column shows normalized name

---

## Acceptance Criteria

- [ ] Aircraft detail page shows linked customers with primary designation
- [ ] Users can add/remove customers from aircraft via search modal
- [ ] Users can set primary customer on aircraft
- [ ] Work order form displays customer as readonly (auto-populated from aircraft)
- [ ] Work order list shows customer name from normalized source
- [ ] Work order header shows customer name from normalized source
- [ ] Aircraft form no longer has customer_name text field
- [ ] All TypeScript types match backend API response schemas
- [ ] Level 1-3 validation commands pass
- [ ] Unit tests cover >= 80% of new/changed code
- [ ] No regressions in existing tests

---

## Completion Checklist

- [ ] All tasks completed in dependency order (1→12)
- [ ] Each task validated immediately after completion
- [ ] Level 1: Static analysis (tsc + lint) passes
- [ ] Level 2: Unit tests pass with coverage
- [ ] Level 3: Full test suite + build succeeds
- [ ] All acceptance criteria met

---

## Risks and Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Type changes break many files at once | Medium | Medium | Update types first (Tasks 1-2), then fix consumers file-by-file. TypeScript compiler errors guide the fixes. |
| Work order form customer field removal breaks existing tests | High | Low | Update tests immediately after component changes (Task 12). Mock data updates (Task 5) must happen first. |
| cmdk Command component rendering in jsdom tests | Low | Medium | Already works in existing work-order-form tests that use the same Dialog/Command pattern. |
| Backend sort_by "customer_name" no longer valid | Low | Low | Check backend sort_by parameter. The backend may accept it for backward compat since it sorts by customer relationship name. If not, update sort key. |

---

## Notes

- The backend already returns `customers[]` on Aircraft responses and `customer` on WorkOrder responses (Phase 2 complete). The frontend types currently don't match — this is the primary gap being closed.
- The `customer_name` field was removed from the backend Aircraft model/schema in Phase 2's migration. The frontend type still has it, which means the field is currently `null` or missing in API responses.
- The `customer_po_number` field was removed from the backend WorkOrder model/schema in Phase 2's migration. This field should be completely removed from frontend types and UI.
- The `created_by` parameter for the link endpoint is passed as a query parameter, not in the request body. The proxy route must forward query params.
- Customer relationship management is intentionally placed on the aircraft **detail** page rather than the form. This separates the concerns: the form handles aircraft properties, the detail page handles relationships.
