# Audit History UI Integration

## Problem Statement

Aircraft maintenance technicians and compliance officers need to view the complete history of changes made to work orders to meet FAA/EASA record-keeping requirements and support audits. Currently, the auditing infrastructure captures all changes in the backend, but there's no UI to view this history, making it inaccessible to users who need it for compliance verification.

## Evidence

- FAA 14 CFR Part 43 requires complete record-keeping of maintenance activities
- EASA Part-145 documentation standards mandate traceability
- Auditing backend is complete and capturing changes (merged from `auditing` branch)
- Work Order UI exists but has no history view (merged from `feature/work-order-poc` branch)

## Proposed Solution

Add an Audit History panel to the Work Order detail view that displays a timeline of all changes. This component will be reusable for future entities. It fetches data from the existing audit API endpoint and presents changes in a human-readable format with timestamps, users, and field-level diffs.

## Key Hypothesis

We believe displaying audit history in the Work Order UI will enable compliance verification for maintenance technicians.
We'll know we're right when users can view who made changes to a work order and what was modified.

## What We're NOT Building

- Audit history for Aircraft entities (can use the same component later)
- Real-time updates via websockets/polling - manual refresh is sufficient
- Export/print functionality - future enhancement
- Filtering by date range or action type - stretch goal only

## Success Metrics

| Metric | Target | How Measured |
|--------|--------|--------------|
| Audit history visible | 100% of work order detail pages | Manual verification |
| Changes displayed correctly | All CRUD operations appear | E2E test |
| Mobile responsive | Works on 320px+ screens | Manual testing |

## Open Questions

- [ ] Should history be in a tab, collapsible panel, or always visible?
- [ ] How many records to show per page (default: 50 from API)?

---

## Users & Context

**Primary User**
- **Who**: Aircraft maintenance technicians and compliance officers
- **Current behavior**: Cannot view change history in the system
- **Trigger**: Need to verify who changed a work order or investigate an issue
- **Success state**: Can see complete history with timestamps, users, and what changed

**Job to Be Done**
When investigating a work order discrepancy, I want to see who made changes and when, so I can verify compliance and identify the source of errors.

**Non-Users**
Read-only viewers who don't need audit trails - they only need current state.

---

## Solution Detail

### Core Capabilities (MoSCoW)

| Priority | Capability | Rationale |
|----------|------------|-----------|
| Must | Display audit timeline | Core requirement for compliance |
| Must | Show timestamp, user, action type | Essential audit information |
| Must | Show field-level diffs | Users need to see what changed |
| Must | Pagination | Work orders may have many changes |
| Should | Mobile-responsive layout | Field technicians use tablets |
| Could | Filter by action type | Easier to find specific changes |
| Won't | Real-time updates | Manual refresh acceptable for now |

### MVP Scope

1. Next.js API proxy route for audit endpoint
2. Reusable `<AuditHistory>` component with timeline UI
3. Integration into Work Order detail page
4. Pagination support

### User Flow

1. User navigates to Work Order detail page
2. Audit History panel/tab is visible
3. Panel shows most recent changes first (newest at top)
4. Each entry shows: timestamp, user, action (CREATE/UPDATE/DELETE), fields changed
5. For UPDATE actions, shows old value → new value for each field
6. User can paginate to view older changes

---

## Technical Approach

**Feasibility**: HIGH

**Architecture Notes**
- Audit API exists at `GET /api/v1/audit/{entity_type}/{entity_id}`
- Response includes `old_values`, `new_values`, `changed_fields`
- Create proxy route at `app/ui/src/app/api/audit/[entityType]/[entityId]/route.ts`
- Use SWR for data fetching (consistent with existing patterns)
- Component in `app/ui/src/components/features/audit/`

**Technical Risks**

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Large number of audit records | Low | Pagination (50 per page) |
| Complex diff display | Medium | Start with simple key-value pairs |

---

## Implementation Phases

| # | Phase | Description | Status | Parallel | Depends | PRP Plan |
|---|-------|-------------|--------|----------|---------|----------|
| 1 | Full Implementation | All phases combined (API, Component, Integration, Testing) | complete | - | - | [audit-history-ui.plan.md](../plans/audit-history-ui.plan.md) |

### Phase Details

**Phase 1: API Proxy**
- **Goal**: Enable frontend to fetch audit data
- **Scope**: Proxy route that forwards to FastAPI audit endpoint
- **Success signal**: Can fetch audit records from frontend

**Phase 2: Audit Component**
- **Goal**: Reusable UI for displaying audit history
- **Scope**: Timeline component with pagination, diff display
- **Success signal**: Component renders sample data correctly

**Phase 3: Integration**
- **Goal**: Audit history visible in Work Order UI
- **Scope**: Add component to work order detail page
- **Success signal**: Users can see audit history for any work order

**Phase 4: Testing**
- **Goal**: Verify complete E2E flow
- **Scope**: Create work order, update it, verify changes appear in history
- **Success signal**: All changes captured and displayed correctly

### Parallelism Notes

All phases are sequential as each depends on the previous. Phase 2 depends on Phase 1 for API access, Phase 3 depends on Phase 2 for the component.

---

## Decisions Log

| Decision | Choice | Alternatives | Rationale |
|----------|--------|--------------|-----------|
| Data fetching | SWR | React Query, fetch | Consistent with existing codebase |
| Component location | Tab on detail page | Collapsible panel, separate page | Keeps history accessible but not overwhelming |
| Diff display | Simple key: old → new | Side-by-side, inline markup | Simpler to implement and understand |

---

## Research Summary

**Market Context**
Aviation MRO systems require comprehensive audit trails for regulatory compliance. Common patterns include timeline views with expandable details.

**Technical Context**
- Audit API fully functional at `/api/v1/audit/{entity_type}/{entity_id}`
- Returns `AuditRecordResponse` with `old_values`, `new_values`, `changed_fields`
- Pagination built-in (page, page_size, has_next)
- SWR already used for work order data fetching

---

*Generated: 2026-02-03*
*Status: DRAFT - ready for implementation*
