# Feature: Audit Log Database Schema

## Summary

Create an immutable audit logging table in PostgreSQL using JSONB for flexible storage of old/new values. This migration establishes the foundation for the auditing infrastructure by creating the `audit_log` table with appropriate indexes, constraints, and immutability protections via trigger-based enforcement.

## User Story

As a **developer implementing new entities in Cirrus MRO**
I want a **database table that reliably stores all entity changes with old/new values**
So that **future phases can automatically capture mutations and the retrieval API can query complete change history**

## Problem Statement

The Cirrus MRO database currently only captures basic `created_by`, `updated_by`, `created_at`, `updated_at` fields on entities. There is no mechanism to store change history, diffs, or reconstruct the state of an entity at any point in time. FAA Part 43 and EASA Part-145 require complete, tamper-evident records of maintenance activities.

## Solution Statement

Create a Flyway migration (V005) that:
1. Creates an `audit_log` table with JSONB columns for `old_values` and `new_values`
2. Adds composite and individual indexes for efficient querying by entity, user, and time
3. Implements immutability protection via a trigger that prevents UPDATE/DELETE on audit records
4. Follows existing migration patterns from V001-V004

## Metadata

| Field            | Value |
|------------------|-------|
| Type             | NEW_CAPABILITY |
| Complexity       | LOW |
| Systems Affected | database |
| Dependencies     | PostgreSQL 14+, Flyway 11 |
| Estimated Tasks  | 3 |

---

## UX Design

### Before State
```
╔═══════════════════════════════════════════════════════════════════════════════╗
║                              BEFORE STATE                                      ║
╠═══════════════════════════════════════════════════════════════════════════════╣
║                                                                               ║
║   ┌─────────────────────┐                                                     ║
║   │    work_order       │                                                     ║
║   │   (or any entity)   │                                                     ║
║   └──────────┬──────────┘                                                     ║
║              │                                                                ║
║              │ UPDATE status = 'completed'                                    ║
║              ▼                                                                ║
║   ┌─────────────────────┐                                                     ║
║   │    work_order       │                                                     ║
║   │   updated_at = NOW  │  ◄── ONLY timestamp is updated                      ║
║   │   updated_by = user │      NO RECORD of what changed                      ║
║   └─────────────────────┘      NO OLD VALUE preserved                         ║
║                                                                               ║
║   DATA_FLOW: Entity mutated → updated_at/updated_by set → history LOST        ║
║   PAIN_POINT: Cannot reconstruct entity state, prove compliance, investigate  ║
║                                                                               ║
╚═══════════════════════════════════════════════════════════════════════════════╝
```

### After State
```
╔═══════════════════════════════════════════════════════════════════════════════╗
║                               AFTER STATE                                      ║
╠═══════════════════════════════════════════════════════════════════════════════╣
║                                                                               ║
║   ┌─────────────────────┐                                                     ║
║   │    work_order       │                                                     ║
║   │   (or any entity)   │                                                     ║
║   └──────────┬──────────┘                                                     ║
║              │                                                                ║
║              │ UPDATE status = 'completed'                                    ║
║              ▼                                                                ║
║   ┌─────────────────────┐         ┌─────────────────────────────┐            ║
║   │    work_order       │         │        audit_log            │            ║
║   │   status=completed  │────────►│  entity_type: work_order    │            ║
║   │   updated_at = NOW  │         │  entity_id: uuid            │            ║
║   │   updated_by = user │         │  action: UPDATE             │            ║
║   └─────────────────────┘         │  old_values: {status:"open"}│            ║
║                                   │  new_values: {status:"done"}│            ║
║                                   │  user_id: "user@example"    │            ║
║                                   │  created_at: timestamp      │            ║
║                                   │  [IMMUTABLE - no edits]     │            ║
║                                   └─────────────────────────────┘            ║
║                                                                               ║
║   DATA_FLOW: Entity mutated → audit record created → history PRESERVED        ║
║   VALUE_ADD: Complete change history queryable by entity, user, time          ║
║                                                                               ║
╚═══════════════════════════════════════════════════════════════════════════════╝
```

### Interaction Changes

| Location | Before | After | User Impact |
|----------|--------|-------|-------------|
| Database | No audit table exists | `audit_log` table with indexes | Foundation for change capture |
| SQL operations | UPDATE/DELETE modify only entity | Audit records can be written | Phase 3 can insert audit records |
| Audit records | N/A | Immutable (trigger protection) | Tamper-proof audit trail |

---

## Mandatory Reading

**CRITICAL: Implementation agent MUST read these files before starting any task:**

| Priority | File | Lines | Why Read This |
|----------|------|-------|---------------|
| P0 | `feature/work-order-poc:database/migrations/V001__create_reference_tables.sql` | all | Pattern for table creation, indexes, enums |
| P0 | `feature/work-order-poc:database/migrations/V002__create_work_order_table.sql` | all | Pattern for column definitions, audit fields |
| P1 | `/home/ibrahimaslam/repos/cirrus/cant-believe-its-not-ebis/Makefile` | 1-36 | Flyway commands for running migrations |
| P1 | `/home/ibrahimaslam/repos/cirrus/cant-believe-its-not-ebis/database/.env` | all | Database connection for validation |

**External Documentation:**

| Source | Section | Why Needed |
|--------|---------|------------|
| [PostgreSQL JSONB Docs](https://www.postgresql.org/docs/current/datatype-json.html) | JSONB type | Understand indexing and storage |
| [PostgreSQL Trigger-Based Audit](https://medium.com/@sehban.alam/lets-build-production-ready-audit-logs-in-postgresql-7125481713d8) | Immutability trigger | Pattern for protecting audit records |
| [Flyway Migrations](https://documentation.red-gate.com/fd/migrations-184127470.html) | Versioned migrations | Naming and execution order |

---

## Patterns to Mirror

**TABLE_CREATION_PATTERN:**
```sql
-- SOURCE: feature/work-order-poc:database/migrations/V001__create_reference_tables.sql
-- COPY THIS PATTERN:
CREATE TABLE city (
    id SERIAL PRIMARY KEY,
    uuid UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
    code VARCHAR(10) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**INDEX_PATTERN:**
```sql
-- SOURCE: feature/work-order-poc:database/migrations/V002__create_work_order_table.sql
-- COPY THIS PATTERN:
CREATE INDEX idx_work_order_uuid ON work_order(uuid);
CREATE INDEX idx_work_order_city_id ON work_order(city_id);
CREATE INDEX idx_work_order_status ON work_order(status);
```

**ENUM_PATTERN:**
```sql
-- SOURCE: feature/work-order-poc:database/migrations/V001__create_reference_tables.sql
-- COPY THIS PATTERN for action type:
CREATE TYPE work_order_status AS ENUM (
    'created',
    'scheduled',
    ...
);
```

**COLUMN_NAMING:**
- snake_case for all columns
- `id` for serial primary key
- `uuid` for UUID identifier
- `created_at` with TIMESTAMPTZ DEFAULT NOW()
- VARCHAR(N) for bounded strings

---

## Files to Change

| File | Action | Justification |
|------|--------|---------------|
| `database/migrations/V005__create_audit_log_table.sql` | CREATE | Audit table, indexes, immutability trigger |

---

## NOT Building (Scope Limits)

Explicit exclusions to prevent scope creep:

- **Database triggers on entities** - That's Phase 3 (Change Capture)
- **SQLAlchemy model for audit_log** - Will be added in Phase 3
- **API endpoint for retrieval** - That's Phase 4
- **Hash chain / checksum columns** - Marked as "Could" in PRD, future enhancement
- **Partitioning** - Future optimization, not MVP
- **Automatic retention/purging** - Explicitly "Won't" in PRD

---

## Step-by-Step Tasks

Execute in order. Each task is atomic and independently verifiable.

### Task 1: CREATE `database/migrations/V005__create_audit_log_table.sql`

- **ACTION**: Create Flyway migration file with audit_log table definition
- **IMPLEMENT**:
  ```sql
  -- V005: Audit log table for immutable change tracking

  -- Audit action type enum
  CREATE TYPE audit_action AS ENUM ('INSERT', 'UPDATE', 'DELETE');

  -- Audit log table
  CREATE TABLE audit_log (
      id BIGSERIAL PRIMARY KEY,
      entity_type VARCHAR(100) NOT NULL,
      entity_id UUID NOT NULL,
      action audit_action NOT NULL,
      old_values JSONB,
      new_values JSONB,
      changed_fields TEXT[],
      user_id VARCHAR(100),
      session_id VARCHAR(100),
      ip_address INET,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );

  -- Comments for documentation
  COMMENT ON TABLE audit_log IS 'Immutable audit trail for entity changes';
  COMMENT ON COLUMN audit_log.entity_type IS 'Table/entity name (e.g., work_order)';
  COMMENT ON COLUMN audit_log.entity_id IS 'UUID of the entity being audited';
  COMMENT ON COLUMN audit_log.action IS 'Type of mutation: INSERT, UPDATE, DELETE';
  COMMENT ON COLUMN audit_log.old_values IS 'JSONB snapshot before mutation (NULL for INSERT)';
  COMMENT ON COLUMN audit_log.new_values IS 'JSONB snapshot after mutation (NULL for DELETE)';
  COMMENT ON COLUMN audit_log.changed_fields IS 'Array of field names that changed (UPDATE only)';
  COMMENT ON COLUMN audit_log.user_id IS 'User who performed the action';
  COMMENT ON COLUMN audit_log.session_id IS 'Session/request identifier';
  COMMENT ON COLUMN audit_log.ip_address IS 'Client IP address';
  ```
- **MIRROR**: `V001__create_reference_tables.sql` - enum and table patterns
- **GOTCHA**: Use BIGSERIAL (not SERIAL) for id - audit tables grow large
- **GOTCHA**: Use TIMESTAMPTZ (not TIMESTAMP) for timezone awareness
- **VALIDATE**: `make db-validate` - Flyway validates SQL syntax

### Task 2: ADD indexes to `database/migrations/V005__create_audit_log_table.sql`

- **ACTION**: Add indexes for common query patterns
- **IMPLEMENT**:
  ```sql
  -- Composite index for entity history lookups (most common query)
  CREATE INDEX idx_audit_log_entity ON audit_log(entity_type, entity_id);

  -- Index for time-based queries and pagination
  CREATE INDEX idx_audit_log_created_at ON audit_log(created_at DESC);

  -- Index for user-based filtering
  CREATE INDEX idx_audit_log_user_id ON audit_log(user_id) WHERE user_id IS NOT NULL;

  -- GIN index for JSONB queries (if needed for field-level searches)
  CREATE INDEX idx_audit_log_new_values ON audit_log USING GIN (new_values);
  ```
- **MIRROR**: `V002__create_work_order_table.sql:37-50` - index naming pattern
- **GOTCHA**: DESC on created_at for efficient "most recent first" queries
- **GOTCHA**: Partial index on user_id excludes NULL values for efficiency
- **VALIDATE**: `make db-validate`

### Task 3: ADD immutability protection trigger to `database/migrations/V005__create_audit_log_table.sql`

- **ACTION**: Add trigger function and trigger to prevent UPDATE/DELETE on audit records
- **IMPLEMENT**:
  ```sql
  -- Function to prevent modifications to audit records
  CREATE OR REPLACE FUNCTION audit_log_protect()
  RETURNS TRIGGER AS $$
  BEGIN
      RAISE EXCEPTION 'Audit log records cannot be modified or deleted';
  END;
  $$ LANGUAGE plpgsql;

  -- Trigger to enforce immutability
  CREATE TRIGGER audit_log_immutable
      BEFORE UPDATE OR DELETE ON audit_log
      FOR EACH ROW
      EXECUTE FUNCTION audit_log_protect();

  -- Revoke DELETE privilege from application role (defense in depth)
  -- Note: Adjust role name as needed for your environment
  -- REVOKE DELETE ON audit_log FROM app_user;
  ```
- **MIRROR**: PostgreSQL trigger pattern from research
- **PATTERN**: BEFORE trigger returns exception to abort the operation
- **GOTCHA**: Comment out REVOKE if no specific app_user role exists yet
- **VALIDATE**: `make db-migrate` then test:
  ```sql
  INSERT INTO audit_log (entity_type, entity_id, action) VALUES ('test', gen_random_uuid(), 'INSERT');
  UPDATE audit_log SET user_id = 'hacker' WHERE id = 1; -- Should fail
  DELETE FROM audit_log WHERE id = 1; -- Should fail
  ```

---

## Testing Strategy

### Manual Tests to Run

| Test | Command | Expected Result |
|------|---------|-----------------|
| Migration syntax | `make db-validate` | Exit 0, no errors |
| Migration runs | `make db-migrate` | Migrates to version 5 |
| Table exists | `psql -c "\d audit_log"` | Shows table structure |
| Indexes exist | `psql -c "\di *audit*"` | Shows all audit indexes |
| INSERT works | `INSERT INTO audit_log (entity_type, entity_id, action) VALUES ('test', gen_random_uuid(), 'INSERT');` | Row created |
| UPDATE blocked | `UPDATE audit_log SET user_id = 'test' WHERE id = 1;` | Exception raised |
| DELETE blocked | `DELETE FROM audit_log WHERE id = 1;` | Exception raised |

### Edge Cases Checklist

- [x] NULL old_values for INSERT action
- [x] NULL new_values for DELETE action
- [x] NULL user_id (system actions allowed)
- [x] NULL session_id (optional field)
- [x] NULL ip_address (optional field)
- [x] Large JSONB payloads (no size limit in schema)
- [x] Special characters in entity_type

---

## Validation Commands

### Level 1: STATIC_ANALYSIS

```bash
make db-validate
```

**EXPECT**: Exit 0, "Successfully validated 5 migrations"

### Level 2: MIGRATION_EXECUTION

```bash
make db-migrate
```

**EXPECT**: Exit 0, "Successfully applied 1 migration to schema"

### Level 3: SCHEMA_VERIFICATION

```bash
# Connect to database and verify
docker run --rm -it --network host postgres:16 psql "postgresql://postgres:cirrusmro@localhost:5432/cirrusmro" -c "
  SELECT column_name, data_type, is_nullable
  FROM information_schema.columns
  WHERE table_name = 'audit_log'
  ORDER BY ordinal_position;
"
```

**EXPECT**: All columns listed with correct types

### Level 4: IMMUTABILITY_VERIFICATION

```bash
docker run --rm -it --network host postgres:16 psql "postgresql://postgres:cirrusmro@localhost:5432/cirrusmro" -c "
  INSERT INTO audit_log (entity_type, entity_id, action, new_values)
  VALUES ('test', gen_random_uuid(), 'INSERT', '{\"test\": true}');

  UPDATE audit_log SET user_id = 'hacker' WHERE entity_type = 'test';
"
```

**EXPECT**: INSERT succeeds, UPDATE raises "Audit log records cannot be modified or deleted"

---

## Acceptance Criteria

- [x] `audit_log` table created with all specified columns
- [x] `audit_action` enum type created with INSERT, UPDATE, DELETE values
- [x] BIGSERIAL primary key for scalability
- [x] JSONB columns for old_values and new_values
- [x] TEXT[] array for changed_fields
- [x] TIMESTAMPTZ for created_at with default NOW()
- [x] Composite index on (entity_type, entity_id) for entity history queries
- [x] Index on created_at DESC for time-based pagination
- [x] Partial index on user_id for user filtering
- [x] GIN index on new_values for JSONB queries
- [x] Immutability trigger prevents UPDATE operations
- [x] Immutability trigger prevents DELETE operations
- [x] INSERT operations work normally
- [x] Migration follows Flyway V00N naming convention
- [x] Comments added for documentation

---

## Completion Checklist

- [ ] Task 1 completed: Table and enum created
- [ ] Task 2 completed: All indexes created
- [ ] Task 3 completed: Immutability trigger created
- [ ] Level 1: `make db-validate` passes
- [ ] Level 2: `make db-migrate` succeeds
- [ ] Level 3: Schema verification shows correct structure
- [ ] Level 4: Immutability test confirms UPDATE/DELETE blocked
- [ ] All acceptance criteria met

---

## Risks and Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| JSONB storage bloat over time | Medium | Medium | Future: Add partitioning by date; monitor table size |
| GIN index slows inserts | Low | Low | GIN on new_values is optional; remove if write perf issues |
| Trigger bypassed by superuser | Low | High | Defense in depth: Also add RLS or REVOKE when auth roles defined |
| Migration conflicts with concurrent work | Low | Medium | Coordinate with team; V005 follows existing V001-V004 |

---

## Notes

- This migration establishes the **foundation** for the auditing infrastructure
- **No SQLAlchemy model** is created in this phase - that comes in Phase 3
- The `changed_fields` TEXT[] column is populated by application code in Phase 3, not database triggers
- Consider **table partitioning** by month if audit volume exceeds 10M+ rows (future optimization)
- The **GIN index** on new_values enables queries like "find all records where new_values->>'status' = 'completed'" - useful for Phase 4 filtering
- User context (user_id, session_id, ip_address) will be populated by the **request context middleware** in Phase 2
