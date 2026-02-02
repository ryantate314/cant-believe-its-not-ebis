# Auditing & Changelog Infrastructure

## Problem Statement

Aircraft maintenance organizations must maintain complete, tamper-evident records of all maintenance activities to meet FAA 14 CFR Part 43 and EASA Part-145 requirements. Without a systematic audit trail, MROs face regulatory penalties, cannot prove compliance during audits, and lack the ability to investigate discrepancies or reconstruct maintenance history.

## Evidence

- FAA Advisory Circular 43-9C mandates maintenance records include description of work, date, person performing work, and signature
- 14 CFR § 91.417 requires retention of maintenance records (major repairs: 2+ years, routine: 1+ year; industry standard: 7+ years)
- Current Cirrus MRO codebase only captures `created_by`, `updated_by`, `created_at`, `updated_at` - no change history or diffs
- Assumption - needs validation: Specific customer/regulatory audit failures driving this need

## Proposed Solution

Build an infrastructure layer that automatically captures all changes (INSERT, UPDATE, DELETE) to registered entities, storing old/new values with computed diffs in an immutable audit table. Provide a FastAPI endpoint to retrieve entity change history with filtering and pagination. This approach uses PostgreSQL's JSONB columns for flexible value storage and database triggers or application-level hooks for reliable change capture.

## Key Hypothesis

We believe an automatic, immutable audit logging infrastructure will enable compliance officers to demonstrate complete maintenance traceability during FAA/EASA audits.
We'll know we're right when any entity's complete change history can be retrieved via API with user attribution and timestamps.

## What We're NOT Building

- UI components - infrastructure only, UI consumes this later
- Specific entity implementations - framework/registration mechanism only
- Real-time audit notifications - batch retrieval only
- Audit log export/reporting tools - raw API access only
- SELECT query auditing - only captures data mutations

## Success Metrics

| Metric | Target | How Measured |
|--------|--------|--------------|
| Audit coverage | 100% of registered entity mutations captured | Integration tests verify all INSERT/UPDATE/DELETE logged |
| Retrieval performance | < 500ms for entity history (1000 records) | Load testing with pagination |
| Data completeness | Old value, new value, diff, user, timestamp on every record | Schema validation |
| Immutability | Zero audit record modifications possible via application | Attempted UPDATE/DELETE returns error |

## Open Questions

- [ ] Database triggers vs application-level hooks? (Triggers more reliable but less portable)
- [ ] Hash chain implementation for tamper detection - required for MVP or future phase?
- [ ] Retention policy enforcement - automatic purging or manual?
- [ ] How will user identity be provided? (JWT claims, API key, header?)
- [ ] Session ID format and source?
- [ ] Should audit records be partitioned by entity type, date, or both?

---

## Users & Context

**Primary User**
- **Who**: Developer implementing new entities in Cirrus MRO
- **Current behavior**: Manually adds created_by/updated_by fields, no history tracking
- **Trigger**: Adding a new entity that requires audit trail for compliance
- **Success state**: Register entity for auditing with one line, automatic capture works

**Secondary User**
- **Who**: Compliance officer / operations manager
- **Current behavior**: Cannot retrieve change history programmatically
- **Trigger**: Preparing for FAA audit, investigating discrepancy
- **Success state**: API returns complete, filterable change history for any entity

**Job to Be Done**
When a regulated entity is modified, I want changes automatically captured with full context, so I can prove compliance and investigate issues without manual logging.

**Non-Users**
- End users viewing audit logs (no UI in this phase)
- External auditors directly (they work through compliance officers)
- Real-time monitoring systems (no streaming/webhooks)

---

## Solution Detail

### Core Capabilities (MoSCoW)

| Priority | Capability | Rationale |
|----------|------------|-----------|
| Must | Audit table schema with JSONB old/new values | Foundation for all audit storage |
| Must | Entity registration mechanism | Developers need clear way to opt-in entities |
| Must | Automatic change capture (INSERT/UPDATE/DELETE) | Core requirement - no manual logging |
| Must | User context capture (user_id, timestamp) | Non-repudiation for compliance |
| Must | API endpoint to retrieve entity changelog | Enables consumption by future UI |
| Should | Request metadata (IP address, session_id) | Enhanced traceability |
| Should | Filtering by date range, user, action type | Practical for audit investigations |
| Should | Pagination for large histories | Performance for long-lived entities |
| Could | Computed human-readable diffs | Better developer experience |
| Could | Checksum/hash for tamper detection | Enhanced integrity verification |
| Won't | UI components | Explicitly out of scope for this phase |
| Won't | Real-time notifications | Future enhancement |
| Won't | Automatic retention purging | Future enhancement |

### MVP Scope

1. Audit table migration with appropriate indexes
2. Mechanism to register entities for auditing (decorator, mixin, or config)
3. Change capture for registered entities (trigger or application hook)
4. Single API endpoint: `GET /api/v1/audit/{entity_type}/{entity_id}` returning paginated history
5. Request context middleware capturing user_id from request
6. Unit and integration tests

### User Flow

```
Developer registers entity →
Entity mutation occurs (create/update/delete) →
Middleware extracts user context →
Change captured to audit table with old/new values →
API consumer retrieves history via GET endpoint
```

---

## Technical Approach

**Feasibility**: HIGH

**Architecture Notes**
- Audit table uses JSONB for `old_values` and `new_values` - no schema changes when entity columns change
- PostgreSQL trigger approach preferred for reliability (fires regardless of how data modified)
- Application-level hook as fallback/supplement for portability and richer context
- Indexes on: entity_type, entity_id, created_at, user_id for common query patterns
- Async processing not required for MVP - direct insert acceptable for initial scale

**Schema Design**
```sql
CREATE TABLE audit_log (
    id BIGSERIAL PRIMARY KEY,
    entity_type VARCHAR(100) NOT NULL,
    entity_id UUID NOT NULL,
    action VARCHAR(10) NOT NULL,  -- INSERT, UPDATE, DELETE
    old_values JSONB,
    new_values JSONB,
    changed_fields TEXT[],
    user_id VARCHAR(100),
    session_id VARCHAR(100),
    ip_address INET,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for common queries
CREATE INDEX idx_audit_entity ON audit_log(entity_type, entity_id);
CREATE INDEX idx_audit_created_at ON audit_log(created_at);
CREATE INDEX idx_audit_user ON audit_log(user_id);
```

**Technical Risks**

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Trigger bypass by superuser | Low | Application-level logging as backup; restrict superuser access |
| Performance impact on writes | Medium | Efficient indexes; async processing if needed later |
| JSONB storage bloat | Medium | Partitioning by date; retention policies |
| User context not available | Medium | Fallback to "system" user; require auth middleware |

---

## Implementation Phases

| # | Phase | Description | Status | Parallel | Depends | PRP Plan |
|---|-------|-------------|--------|----------|---------|----------|
| 1 | Database Schema | Audit table migration, indexes, constraints | in-progress | - | - | [audit-log-database-schema.plan.md](../plans/audit-log-database-schema.plan.md) |
| 2 | Request Context | Middleware to capture user_id, IP, session from request | pending | with 1 | - | - |
| 3 | Change Capture | Registration mechanism and audit logging hooks | pending | - | 1, 2 | - |
| 4 | Retrieval API | GET endpoint with filtering and pagination | pending | - | 1, 3 | - |
| 5 | Testing & Docs | Integration tests, developer documentation | pending | - | 3, 4 | - |

### Phase Details

**Phase 1: Database Schema**
- **Goal**: Create immutable audit table with proper indexes
- **Scope**: Flyway migration V005, audit_log table, indexes, constraints preventing UPDATE/DELETE
- **Success signal**: Migration runs successfully; table exists with correct schema

**Phase 2: Request Context**
- **Goal**: Capture user identity and request metadata automatically
- **Scope**: FastAPI middleware or dependency that extracts user_id, IP, session_id from request
- **Success signal**: Context available in request state for downstream use

**Phase 3: Change Capture**
- **Goal**: Automatically log all mutations to registered entities
- **Scope**: Registration mechanism (decorator/mixin), INSERT/UPDATE/DELETE hooks, old/new value serialization
- **Success signal**: CRUD operations on registered entities create audit records without explicit logging code

**Phase 4: Retrieval API**
- **Goal**: Enable programmatic access to entity change history
- **Scope**: `GET /api/v1/audit/{entity_type}/{entity_id}` endpoint, pagination, filtering
- **Success signal**: API returns correct history with proper filtering

**Phase 5: Testing & Docs**
- **Goal**: Ensure reliability and enable developer adoption
- **Scope**: Unit tests for capture logic, integration tests for full flow, README for adding auditing to new entities
- **Success signal**: >90% coverage on audit code; docs reviewed and usable

### Parallelism Notes

Phases 1 and 2 can run in parallel as they touch different domains (database schema vs middleware). Phase 3 depends on both. Phase 4 depends on 1 and 3. Phase 5 runs after 3 and 4 are complete.

---

## Decisions Log

| Decision | Choice | Alternatives | Rationale |
|----------|--------|--------------|-----------|
| Value storage format | JSONB | Separate columns, TEXT blob | Flexible, queryable, no schema changes needed |
| Primary capture mechanism | Application hooks | Database triggers, CDC | More portable, richer context available |
| Immutability enforcement | Application-level + DB constraints | Triggers only | Defense in depth |
| User context source | Request middleware | Explicit parameter passing | Automatic, less error-prone |

---

## Research Summary

**Market Context**
- PostgreSQL trigger-based auditing is industry standard for reliable change capture
- JSONB storage pattern widely adopted for flexible audit schemas
- Aviation MRO software requires time-stamped, user-linked entries per FAA Part 43
- Electronic records require proper controls to meet § 43.9 requirements

**Technical Context**
- Codebase uses SQLAlchemy 2.0 async with Flyway migrations - well-suited for audit infrastructure
- Existing models have basic `created_by`/`updated_by` but no history tracking
- FastAPI dependency injection enables clean middleware integration
- No current authentication - user context will need to be provided via headers initially

---

*Generated: 2026-02-01*
*Status: DRAFT - needs validation*
