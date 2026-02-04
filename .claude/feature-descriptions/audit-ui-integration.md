# Feature Description: Audit History UI Integration

## Overview

Integrate the completed auditing infrastructure into the Work Order management UI. This will add a visible changelog/history panel to Work Order detail views, allowing users to see who made what changes and when—meeting aviation compliance requirements for transparent record-keeping.

## Background

Two features have been developed in parallel:
1. **Auditing Infrastructure** (`auditing` branch): Complete backend with automatic change capture, audit log storage, and retrieval API (`/api/v1/audit/{entity_type}/{entity_id}`)
2. **Work Order UI** (`feature/work-order-poc` branch): CRUD interfaces for Work Orders and Aircraft with sidebar navigation

These need to be merged and connected so that audit history is visible in the UI.

## Goals

1. **Merge branches**: Combine `auditing` and `feature/work-order-poc` into a new integration branch, resolving any conflicts
2. **Add Audit History UI Component**: Create a reusable `<AuditHistory>` component that displays the changelog for any auditable entity
3. **Integrate into Work Order Detail View**: Add the audit history panel to Work Order detail pages
4. **Verify end-to-end functionality**: Create/update a work order and confirm the change appears in the audit history UI

## Functional Requirements

- **Audit History Panel**: Shows a timeline of changes with:
  - Timestamp
  - User who made the change
  - Action type (CREATE, UPDATE, DELETE)
  - Field-level diff (what changed from → to)
- **Pagination**: Support paginated loading for entities with many changes
- **Filtering** (optional/stretch): Filter by date range or action type
- **Mobile-responsive**: History panel should work on mobile devices

## Technical Considerations

- The audit API already exists at `GET /api/v1/audit/{entity_type}/{entity_id}`
- Create a Next.js API proxy route to forward requests to FastAPI
- Use SWR for data fetching (already in use for work orders)
- The `AuditRecordResponse` schema includes `old_values`, `new_values`, and `changes` (diff)

## Out of Scope

- Adding audit UI to Aircraft (can be done later with the same component)
- Real-time updates (polling/websockets)
- Export/print functionality

## Acceptance Criteria

- [ ] New branch created with both feature branches merged cleanly
- [ ] Audit history component renders changes in a readable timeline format
- [ ] Work Order detail page shows audit history
- [ ] Creating/updating a work order shows the change in audit history
- [ ] Tests pass for both auditing backend and work order UI
- [ ] Mobile-friendly layout
