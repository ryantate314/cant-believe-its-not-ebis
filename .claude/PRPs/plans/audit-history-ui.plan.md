# Feature: Audit History UI Integration

## Summary

Add an Audit History panel to the Work Order detail view that displays a timeline of all changes. This feature creates a reusable `AuditHistory` component that fetches data from the existing audit API endpoint (`/api/v1/audit/{entity_type}/{entity_id}`) and presents changes in a human-readable format with timestamps, users, and field-level diffs.

## User Story

As an aircraft maintenance technician or compliance officer
I want to view the complete history of changes made to work orders
So that I can verify compliance and investigate discrepancies

## Problem Statement

The auditing infrastructure captures all changes in the backend, but there's no UI to view this history. Users cannot verify who made changes or what was modified, which is required for FAA/EASA compliance.

## Solution Statement

Create a Next.js proxy route for the audit API, a reusable `AuditHistory` component with timeline UI and pagination, and integrate it into the Work Order detail view via a new "History" tab in the sidebar.

## Metadata

| Field            | Value                                             |
| ---------------- | ------------------------------------------------- |
| Type             | NEW_CAPABILITY                                    |
| Complexity       | MEDIUM                                            |
| Systems Affected | UI (Next.js), API proxy                           |
| Dependencies     | SWR (existing), shadcn/ui (existing)              |
| Estimated Tasks  | 7                                                 |

---

## UX Design

### Before State
```
╔═══════════════════════════════════════════════════════════════════════════════╗
║                         WORK ORDER DETAIL VIEW                                 ║
╠═══════════════════════════════════════════════════════════════════════════════╣
║                                                                               ║
║   ┌──────────┐         ┌─────────────────────────────────────────────┐       ║
║   │ Sidebar  │         │  Main Content                               │       ║
║   │          │         │                                             │       ║
║   │ • Items  │         │  [Work Order Details]                       │       ║
║   │ • Config │         │  [Status, Customer, Dates...]               │       ║
║   │          │         │                                             │       ║
║   │          │         │  NO HISTORY VISIBLE                         │       ║
║   └──────────┘         └─────────────────────────────────────────────┘       ║
║                                                                               ║
║   USER_FLOW: User can see current state but NOT who changed what or when     ║
║   PAIN_POINT: No audit trail visible - cannot verify compliance              ║
║   DATA_FLOW: Work Order → Display (no history access)                        ║
║                                                                               ║
╚═══════════════════════════════════════════════════════════════════════════════╝
```

### After State
```
╔═══════════════════════════════════════════════════════════════════════════════╗
║                         WORK ORDER DETAIL VIEW                                 ║
╠═══════════════════════════════════════════════════════════════════════════════╣
║                                                                               ║
║   ┌──────────┐         ┌─────────────────────────────────────────────┐       ║
║   │ Sidebar  │         │  Audit History                              │       ║
║   │          │         │                                             │       ║
║   │ • Items  │         │  ┌─────────────────────────────────────┐   │       ║
║   │ • Config │         │  │ 📝 UPDATE - Jan 15, 2026 10:30 AM   │   │       ║
║   │ • History│ ◄───    │  │ By: john.smith                      │   │       ║
║   │          │         │  │ • status: "open" → "in_progress"    │   │       ║
║   │          │         │  │ • lead_technician: null → "J.Doe"   │   │       ║
║   │          │         │  └─────────────────────────────────────┘   │       ║
║   └──────────┘         │                                             │       ║
║                        │  ┌─────────────────────────────────────┐   │       ║
║                        │  │ ➕ INSERT - Jan 14, 2026 9:00 AM    │   │       ║
║                        │  │ By: jane.doe                        │   │       ║
║                        │  │ Work order created                  │   │       ║
║                        │  └─────────────────────────────────────┘   │       ║
║                        │                                             │       ║
║                        │  [Previous] [Next]  Page 1 of 3            │       ║
║                        └─────────────────────────────────────────────┘       ║
║                                                                               ║
║   USER_FLOW: Items → Config → History tab shows all changes                  ║
║   VALUE_ADD: Complete audit trail for compliance verification                ║
║   DATA_FLOW: Work Order ID → Audit API → Timeline UI                         ║
║                                                                               ║
╚═══════════════════════════════════════════════════════════════════════════════╝
```

### Interaction Changes
| Location | Before | After | User Impact |
|----------|--------|-------|-------------|
| Sidebar | 2 nav items | 3 nav items with "History" | New navigation option |
| History page | Does not exist | Timeline of changes | Can view audit trail |
| Timeline entries | N/A | Expandable change details | See field-level diffs |

---

## Mandatory Reading

**CRITICAL: Implementation agent MUST read these files before starting any task:**

| Priority | File | Lines | Why Read This |
|----------|------|-------|---------------|
| P0 | `app/ui/src/app/api/work-orders/[id]/route.ts` | all | Pattern to MIRROR for proxy route |
| P0 | `app/api/schemas/audit.py` | all | API response schema to match |
| P1 | `app/ui/src/components/features/work-orders/work-order-sidebar.tsx` | all | Where to add History nav |
| P1 | `app/ui/src/components/features/work-orders/work-order-item-list.tsx` | all | List component pattern |
| P1 | `app/ui/src/app/(user)/workorder/[id]/config/page.tsx` | all | Page structure to follow |
| P2 | `app/ui/src/hooks/use-work-order.ts` | all | SWR hook pattern |
| P2 | `app/ui/src/lib/api.ts` | all | API client pattern |

**External Documentation:**
| Source | Section | Why Needed |
|--------|---------|------------|
| [SWR Docs](https://swr.vercel.app/docs/pagination) | Pagination | SWR pagination pattern |

---

## Patterns to Mirror

**API_PROXY_ROUTE:**
```typescript
// SOURCE: app/ui/src/app/api/work-orders/[id]/route.ts:1-26
// COPY THIS PATTERN:
const API_URL = process.env.API_URL || "http://localhost:8000";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const response = await fetch(`${API_URL}/api/v1/work-orders/${id}`, {
    headers: { "Content-Type": "application/json" },
  });

  const data = await response.json();
  return NextResponse.json(data, { status: response.status });
}
```

**SWR_HOOK_PATTERN:**
```typescript
// SOURCE: app/ui/src/hooks/use-work-order.ts:16-35
// COPY THIS PATTERN:
export function useWorkOrder(id: string) {
  const { data, error, isLoading } = useSWR<WorkOrder>(
    id ? `work-order:${id}` : null,
    () => workOrdersApi.get(id)
  );

  return {
    workOrder: data,
    isLoading,
    error,
  };
}
```

**PAGE_STRUCTURE:**
```typescript
// SOURCE: app/ui/src/app/(user)/workorder/[id]/config/page.tsx
// COPY THIS PATTERN:
export default function ConfigPage({ params }: ConfigPageProps) {
  const { id } = use(params);
  const { workOrder, isLoading, error } = useWorkOrder(id);

  if (isLoading) return <LoadingSkeletons />;
  if (!workOrder) return null;

  return (
    <div>
      <h2 className="mb-6 text-xl font-semibold">Title</h2>
      <ComponentHere />
    </div>
  );
}
```

**SIDEBAR_NAV:**
```typescript
// SOURCE: app/ui/src/components/features/work-orders/work-order-sidebar.tsx:11-14
// COPY THIS PATTERN:
const navItems = [
  { label: "Items", href: "item" },
  { label: "Configuration", href: "config" },
];
```

**CARD_COMPONENT:**
```typescript
// SOURCE: app/ui/src/components/features/aircraft/aircraft-detail.tsx:189-229
// COPY THIS PATTERN:
<Card>
  <CardHeader>
    <CardTitle>Title</CardTitle>
  </CardHeader>
  <CardContent>
    <dl className="grid gap-4 md:grid-cols-2">
      <div>
        <dt className="text-sm font-medium text-muted-foreground">Label</dt>
        <dd className="mt-1">{value}</dd>
      </div>
    </dl>
  </CardContent>
</Card>
```

**PAGINATION_UI:**
```typescript
// SOURCE: app/ui/src/components/features/work-orders/work-order-list.tsx:262-284
// COPY THIS PATTERN:
<div className="flex items-center justify-between">
  <p className="text-sm text-muted-foreground">
    Showing {items.length} of {total} records
  </p>
  <div className="flex gap-2">
    <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>
      Previous
    </Button>
    <Button variant="outline" size="sm" disabled={!hasNext} onClick={() => setPage(page + 1)}>
      Next
    </Button>
  </div>
</div>
```

---

## Files to Change

| File                                                           | Action | Justification                            |
| -------------------------------------------------------------- | ------ | ---------------------------------------- |
| `app/ui/src/types/audit.ts`                                    | CREATE | Type definitions for audit API response  |
| `app/ui/src/app/api/audit/[entityType]/[entityId]/route.ts`    | CREATE | API proxy for audit endpoint             |
| `app/ui/src/lib/api.ts`                                        | UPDATE | Add audit API client methods             |
| `app/ui/src/hooks/use-audit-history.ts`                        | CREATE | SWR hook for audit data fetching         |
| `app/ui/src/components/features/audit/audit-history.tsx`       | CREATE | Reusable audit history component         |
| `app/ui/src/components/features/audit/index.ts`                | CREATE | Export audit components                  |
| `app/ui/src/app/(user)/workorder/[id]/history/page.tsx`        | CREATE | History page for work orders             |
| `app/ui/src/components/features/work-orders/work-order-sidebar.tsx` | UPDATE | Add History nav item                |

---

## NOT Building (Scope Limits)

Explicit exclusions to prevent scope creep:

- Audit UI for Aircraft entities (can reuse component later)
- Real-time updates via websockets/polling
- Export/print functionality
- Filtering by date range or action type (stretch goal only)
- Undo/revert functionality

---

## Step-by-Step Tasks

Execute in order. Each task is atomic and independently verifiable.

### Task 1: CREATE `app/ui/src/types/audit.ts`

- **ACTION**: CREATE type definitions file
- **IMPLEMENT**:
  ```typescript
  export type AuditAction = "INSERT" | "UPDATE" | "DELETE";

  export interface AuditRecord {
    id: number;
    entity_type: string;
    entity_id: string;
    action: AuditAction;
    old_values: Record<string, unknown> | null;
    new_values: Record<string, unknown> | null;
    changed_fields: string[] | null;
    user_id: string | null;
    session_id: string | null;
    ip_address: string | null;
    created_at: string;
  }

  export interface PaginatedAuditResponse {
    items: AuditRecord[];
    total: number;
    page: number;
    page_size: number;
    has_next: boolean;
  }
  ```
- **MIRROR**: `app/api/schemas/audit.py` - match exact field names
- **VALIDATE**: `cd app/ui && yarn build` - types must compile

### Task 2: CREATE `app/ui/src/app/api/audit/[entityType]/[entityId]/route.ts`

- **ACTION**: CREATE API proxy route
- **IMPLEMENT**: Proxy GET requests to FastAPI audit endpoint with query params
- **MIRROR**: `app/ui/src/app/api/work-orders/[id]/route.ts`
- **PATTERN**:
  ```typescript
  const API_URL = process.env.API_URL || "http://localhost:8000";

  export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ entityType: string; entityId: string }> }
  ) {
    const { entityType, entityId } = await params;
    const searchParams = request.nextUrl.searchParams;
    const page = searchParams.get("page") || "1";
    const pageSize = searchParams.get("page_size") || "50";

    const response = await fetch(
      `${API_URL}/api/v1/audit/${entityType}/${entityId}?page=${page}&page_size=${pageSize}`,
      { headers: { "Content-Type": "application/json" } }
    );

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  }
  ```
- **VALIDATE**: Start dev servers and test: `curl http://localhost:3000/api/audit/work_order/{uuid}`

### Task 3: UPDATE `app/ui/src/lib/api.ts`

- **ACTION**: ADD audit API client methods
- **IMPLEMENT**: Add `auditApi` object with `getHistory` method
- **MIRROR**: Existing `workOrdersApi` pattern
- **ADD**:
  ```typescript
  export const auditApi = {
    getHistory: (entityType: string, entityId: string, page = 1, pageSize = 50) =>
      fetchApi<PaginatedAuditResponse>(
        `/audit/${entityType}/${entityId}?page=${page}&page_size=${pageSize}`
      ),
  };
  ```
- **IMPORTS**: Add `PaginatedAuditResponse` from types
- **VALIDATE**: `cd app/ui && yarn build`

### Task 4: CREATE `app/ui/src/hooks/use-audit-history.ts`

- **ACTION**: CREATE SWR hook for audit data
- **IMPLEMENT**:
  ```typescript
  import useSWR from "swr";
  import { auditApi } from "@/lib/api";
  import type { PaginatedAuditResponse } from "@/types/audit";

  export function useAuditHistory(
    entityType: string,
    entityId: string,
    page = 1,
    pageSize = 50
  ) {
    const { data, error, isLoading, mutate } = useSWR<PaginatedAuditResponse>(
      entityId ? `audit:${entityType}:${entityId}:${page}` : null,
      () => auditApi.getHistory(entityType, entityId, page, pageSize)
    );

    return {
      auditHistory: data,
      isLoading,
      error,
      mutate,
    };
  }
  ```
- **MIRROR**: `app/ui/src/hooks/use-work-order.ts`
- **VALIDATE**: `cd app/ui && yarn build`

### Task 5: CREATE `app/ui/src/components/features/audit/audit-history.tsx`

- **ACTION**: CREATE reusable audit history component
- **IMPLEMENT**: Timeline UI with:
  - Loading skeleton
  - Empty state
  - List of audit entries with timestamp, user, action, changes
  - Field-level diff display (old → new)
  - Pagination controls
- **MIRROR**: Card pattern from `aircraft-detail.tsx`, pagination from `work-order-list.tsx`
- **PATTERN**:
  ```typescript
  interface AuditHistoryProps {
    entityType: string;
    entityId: string;
  }

  export function AuditHistory({ entityType, entityId }: AuditHistoryProps) {
    const [page, setPage] = useState(1);
    const { auditHistory, isLoading } = useAuditHistory(entityType, entityId, page);

    // Render timeline of changes
  }
  ```
- **UI COMPONENTS**: Use Card, Badge, Button from shadcn/ui
- **ACTION BADGES**:
  - INSERT: green badge "Created"
  - UPDATE: blue badge "Updated"
  - DELETE: red badge "Deleted"
- **VALIDATE**: `cd app/ui && yarn build`

### Task 6: CREATE `app/ui/src/components/features/audit/index.ts`

- **ACTION**: CREATE export file
- **IMPLEMENT**: `export { AuditHistory } from "./audit-history";`
- **VALIDATE**: `cd app/ui && yarn build`

### Task 7: UPDATE `app/ui/src/components/features/work-orders/work-order-sidebar.tsx`

- **ACTION**: ADD History nav item
- **IMPLEMENT**: Add `{ label: "History", href: "history" }` to navItems array
- **VALIDATE**: `cd app/ui && yarn dev` - verify History appears in sidebar

### Task 8: CREATE `app/ui/src/app/(user)/workorder/[id]/history/page.tsx`

- **ACTION**: CREATE history page
- **IMPLEMENT**:
  ```typescript
  "use client";

  import { use } from "react";
  import { AuditHistory } from "@/components/features/audit";

  interface HistoryPageProps {
    params: Promise<{ id: string }>;
  }

  export default function HistoryPage({ params }: HistoryPageProps) {
    const { id } = use(params);

    return (
      <div>
        <h2 className="mb-6 text-xl font-semibold">Change History</h2>
        <AuditHistory entityType="work_order" entityId={id} />
      </div>
    );
  }
  ```
- **MIRROR**: `app/ui/src/app/(user)/workorder/[id]/config/page.tsx`
- **VALIDATE**: Navigate to /workorder/{id}/history - should display audit entries

---

## Testing Strategy

### Unit Tests to Write

| Test File                                | Test Cases                 | Validates      |
| ---------------------------------------- | -------------------------- | -------------- |
| `__tests__/unit/hooks/use-audit-history.test.ts` | SWR fetching, pagination | Hook behavior |
| `__tests__/integration/components/features/audit-history.test.tsx` | render, empty state, loading, pagination | Component UI |

### Edge Cases Checklist

- [ ] No audit records (empty state)
- [ ] Loading state displays skeleton
- [ ] Pagination at first page (Previous disabled)
- [ ] Pagination at last page (Next disabled)
- [ ] INSERT action (only new_values, no old_values)
- [ ] DELETE action (only old_values, no new_values)
- [ ] UPDATE action (both old and new values, changed_fields)
- [ ] Null user_id (display "System" or "Unknown")
- [ ] Mobile responsive layout

---

## Validation Commands

### Level 1: STATIC_ANALYSIS

```bash
cd app/ui && yarn build
```

**EXPECT**: Exit 0, no TypeScript errors

### Level 2: UNIT_TESTS

```bash
cd app/ui && yarn test
```

**EXPECT**: All tests pass

### Level 3: FULL_SUITE

```bash
make test
```

**EXPECT**: All backend and frontend tests pass

### Level 4: MANUAL_VALIDATION

1. Start API server: `make api-run`
2. Start UI server: `cd app/ui && yarn dev`
3. Navigate to a work order detail page
4. Click "History" in sidebar
5. Verify audit entries display with:
   - Timestamp formatted correctly
   - User name shown
   - Action badge (Created/Updated/Deleted)
   - Field changes visible for UPDATE actions
6. Test pagination if multiple records exist
7. Test on mobile viewport (320px width)

---

## Acceptance Criteria

- [ ] All specified functionality implemented per user story
- [ ] Level 1-3 validation commands pass with exit 0
- [ ] Audit history component renders in Work Order detail view
- [ ] Timeline shows timestamp, user, action type, and field changes
- [ ] Pagination works correctly
- [ ] Mobile responsive design
- [ ] No regressions in existing tests

---

## Completion Checklist

- [ ] All tasks completed in dependency order
- [ ] Each task validated immediately after completion
- [ ] Level 1: Static analysis (yarn build) passes
- [ ] Level 2: Unit tests pass
- [ ] Level 3: Full test suite passes
- [ ] Manual validation completed successfully
- [ ] All acceptance criteria met

---

## Risks and Mitigations

| Risk               | Likelihood   | Impact       | Mitigation                              |
| ------------------ | ------------ | ------------ | --------------------------------------- |
| Large audit history | Low | Low | Pagination (50 per page default) |
| Complex diff display | Medium | Low | Start with simple key-value pairs |
| API not returning expected format | Low | Medium | Types match backend schema exactly |

---

## Notes

- The `entity_type` for work orders is `work_order` (snake_case) per backend model
- Component is designed to be reusable for other entities (Aircraft, etc.) by changing entityType prop
- Badge colors: INSERT=green, UPDATE=blue, DELETE=red (matches common conventions)
- Timestamps should use `toLocaleString()` for user's local timezone
