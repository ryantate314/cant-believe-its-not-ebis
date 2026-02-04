# Feature: Audit Infrastructure Testing & Documentation

## Summary

Complete the audit infrastructure implementation by adding comprehensive integration tests for the full audit capture flow (INSERT/UPDATE/DELETE operations via API), the audit retrieval endpoint, and creating developer documentation for adding auditing to new entities. This phase ensures reliability and enables developer adoption of the auditing system.

## User Story

As a developer implementing new entities in Cirrus MRO
I want comprehensive tests demonstrating audit behavior and clear documentation
So that I can confidently add auditing to new entities and trust the system's reliability

## Problem Statement

The audit infrastructure (database schema, request context middleware, change capture, and retrieval API) is implemented but lacks:
1. End-to-end integration tests that verify the full flow from API request to audit record creation
2. Tests verifying audit record retrieval with actual data
3. Developer documentation explaining how to add auditing to new entities
4. Edge case coverage for error scenarios

## Solution Statement

Add comprehensive integration tests that verify the complete audit flow and create a developer guide for the audit infrastructure. Tests will use the existing pytest-asyncio pattern with database fixtures. Documentation will be added as in-code docstrings and a dedicated README for the audit module.

## Metadata

| Field            | Value                                             |
| ---------------- | ------------------------------------------------- |
| Type             | ENHANCEMENT                                       |
| Complexity       | MEDIUM                                            |
| Systems Affected | app/api/tests, app/api/core, app/api/docs         |
| Dependencies     | pytest>=9.0.0, pytest-asyncio>=1.0.0, httpx       |
| Estimated Tasks  | 7                                                 |

---

## UX Design

### Before State

```
╔═══════════════════════════════════════════════════════════════════════════════╗
║                              BEFORE STATE                                      ║
╠═══════════════════════════════════════════════════════════════════════════════╣
║                                                                               ║
║   ┌─────────────┐         ┌─────────────┐         ┌─────────────┐            ║
║   │  Developer  │ ──────► │ Audit Code  │ ──────► │   No Docs   │            ║
║   │  Wants to   │         │  Exists     │         │  on How to  │            ║
║   │  Add Audit  │         │             │         │  Use It     │            ║
║   └─────────────┘         └─────────────┘         └─────────────┘            ║
║                                                                               ║
║   USER_FLOW: Developer reads code → Reverse-engineers usage → Trial & error  ║
║   PAIN_POINT: No documentation, unclear patterns, no test examples            ║
║   DATA_FLOW: Code exists but adoption path unclear                            ║
║                                                                               ║
║   TEST COVERAGE: Unit tests exist, limited integration coverage               ║
║   - test_audit.py: Serialization tests ✓                                      ║
║   - test_audit_schemas.py: Pydantic schema tests ✓                           ║
║   - test_context.py: Middleware extraction tests ✓                            ║
║   - test_audit_capture.py: Basic INSERT/UPDATE/DELETE tests ✓                ║
║   - test_audit_api.py: API validation tests ✓                                 ║
║   MISSING: E2E tests, retrieval with real data, edge cases                   ║
║                                                                               ║
╚═══════════════════════════════════════════════════════════════════════════════╝
```

### After State

```
╔═══════════════════════════════════════════════════════════════════════════════╗
║                               AFTER STATE                                      ║
╠═══════════════════════════════════════════════════════════════════════════════╣
║                                                                               ║
║   ┌─────────────┐         ┌─────────────┐         ┌─────────────┐            ║
║   │  Developer  │ ──────► │ README.md   │ ──────► │   Success   │            ║
║   │  Wants to   │         │ Step-by-step│         │  in 5 mins  │            ║
║   │  Add Audit  │         │   Guide     │         │             │            ║
║   └─────────────┘         └─────────────┘         └─────────────┘            ║
║                                   │                                           ║
║                                   ▼                                           ║
║                          ┌─────────────┐                                      ║
║                          │ Test Suite  │  ◄── Reference implementation        ║
║                          │ as Examples │                                      ║
║                          └─────────────┘                                      ║
║                                                                               ║
║   USER_FLOW: Read README → Follow 3-step guide → Working audit in 5 mins     ║
║   VALUE_ADD: Clear docs, test examples, confidence in system reliability     ║
║   DATA_FLOW: Documentation → Implementation → Verification via tests         ║
║                                                                               ║
║   TEST COVERAGE: Comprehensive unit + integration tests                       ║
║   - All existing tests ✓                                                      ║
║   - E2E API flow tests (create → audit → retrieve) ✓                         ║
║   - Retrieval with actual data ✓                                             ║
║   - Filter validation ✓                                                       ║
║   - Edge cases (empty results, pagination boundaries) ✓                       ║
║                                                                               ║
╚═══════════════════════════════════════════════════════════════════════════════╝
```

### Interaction Changes

| Location | Before | After | User Impact |
|----------|--------|-------|-------------|
| `app/api/core/audit/README.md` | Does not exist | Step-by-step guide | Developer can add auditing to new entity in 5 minutes |
| `tests/integration/test_audit_e2e.py` | Does not exist | E2E API flow tests | Confidence in full system behavior |
| Test coverage | ~60% audit code coverage | >90% audit code coverage | Reliability guarantee |

---

## Mandatory Reading

**CRITICAL: Implementation agent MUST read these files before starting any task:**

| Priority | File | Lines | Why Read This |
|----------|------|-------|---------------|
| P0 | `app/api/core/audit.py` | 1-217 | Complete audit implementation to document |
| P0 | `app/api/tests/integration/test_audit_capture.py` | 1-265 | Test pattern to MIRROR exactly |
| P0 | `app/api/tests/integration/test_audit_api.py` | 1-154 | API test pattern to MIRROR |
| P1 | `app/api/core/context.py` | 1-39 | Context management to document |
| P1 | `app/api/core/middleware.py` | 1-43 | Middleware to document |
| P1 | `app/api/models/work_order.py` | 1-100 | Example auditable model |
| P2 | `app/api/tests/unit/test_audit.py` | 1-98 | Unit test pattern reference |
| P2 | `app/api/tests/unit/test_context.py` | 1-71 | Context test pattern reference |

**External Documentation:**

| Source | Section | Why Needed |
|--------|---------|------------|
| [pytest-asyncio docs](https://pytest-asyncio.readthedocs.io/) | fixtures | Async fixture patterns |
| [httpx docs](https://www.python-httpx.org/async/) | AsyncClient | API testing patterns |
| [SQLAlchemy 2.0 Events](https://docs.sqlalchemy.org/en/20/orm/events.html) | after_insert/update/delete | Event listener reference |

---

## Patterns to Mirror

**TEST_FILE_STRUCTURE:**
```python
# SOURCE: app/api/tests/integration/test_audit_capture.py:1-16
# COPY THIS PATTERN:
"""Integration tests for full audit capture flow.

These tests require a running PostgreSQL database with migrations applied.
Skip these tests if DATABASE_URL is not configured or database is unavailable.
"""

import os

import pytest
from sqlalchemy import select, text

# Skip all tests in this module if database is not available
pytestmark = pytest.mark.skipif(
    not os.environ.get("DATABASE_URL"),
    reason="DATABASE_URL not set - skipping integration tests",
)
```

**ASYNC_FIXTURE_PATTERN:**
```python
# SOURCE: app/api/tests/integration/test_audit_capture.py:19-34
# COPY THIS PATTERN:
@pytest.fixture(scope="module")
def anyio_backend():
    """Use asyncio for all async tests."""
    return "asyncio"


@pytest.fixture
async def db_session():
    """Provide a database session for testing."""
    from core.database import async_session_factory

    async with async_session_factory() as session:
        yield session
        # Rollback any uncommitted changes
        await session.rollback()
```

**ASYNC_CLIENT_FIXTURE:**
```python
# SOURCE: app/api/tests/integration/test_audit_api.py:33-40
# COPY THIS PATTERN:
@pytest_asyncio.fixture
async def async_client():
    """Provide an async HTTP client for testing."""
    from main import app

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        yield client
```

**CLEANUP_FIXTURE_PATTERN:**
```python
# SOURCE: app/api/tests/integration/test_audit_capture.py:60-71
# COPY THIS PATTERN:
@pytest.fixture
async def cleanup_work_orders(db_session):
    """Clean up test work orders after each test."""
    yield
    # Delete test work orders (those with WO-TEST- prefix)
    await db_session.execute(
        text("DELETE FROM audit_log WHERE entity_type = 'work_order' AND entity_id IN (SELECT uuid FROM work_order WHERE work_order_number LIKE 'WO-TEST-%')")
    )
    await db_session.execute(
        text("DELETE FROM work_order WHERE work_order_number LIKE 'WO-TEST-%'")
    )
    await db_session.commit()
```

**INTEGRATION_TEST_PATTERN:**
```python
# SOURCE: app/api/tests/integration/test_audit_capture.py:74-103
# COPY THIS PATTERN:
@pytest.mark.asyncio
async def test_insert_creates_audit_record(db_session, test_city, cleanup_work_orders):
    """Inserting a work order creates an INSERT audit record."""
    from models.audit_log import AuditLog
    from models.work_order import WorkOrder

    # Create a work order
    work_order = WorkOrder(
        work_order_number="WO-TEST-001",
        sequence_number=1,
        city_id=test_city,
        created_by="test-user",
    )
    db_session.add(work_order)
    await db_session.commit()

    # Query audit log for the record
    result = await db_session.execute(
        select(AuditLog).where(
            AuditLog.entity_type == "work_order",
            AuditLog.entity_id == work_order.uuid,
            AuditLog.action == "INSERT",
        )
    )
    audit_record = result.scalar_one_or_none()

    assert audit_record is not None
    assert audit_record.new_values is not None
```

**API_TEST_PATTERN:**
```python
# SOURCE: app/api/tests/integration/test_audit_api.py:43-52
# COPY THIS PATTERN:
async def test_get_audit_history_empty_for_nonexistent_entity(async_client):
    """GET endpoint returns empty list for non-existent entity."""
    nonexistent_id = uuid4()
    response = await async_client.get(f"/api/v1/audit/work_order/{nonexistent_id}")
    assert response.status_code == 200

    data = response.json()
    assert data["total"] == 0
    assert data["items"] == []
    assert data["has_next"] is False
```

**DOCSTRING_PATTERN:**
```python
# SOURCE: app/api/core/audit.py:93-106
# COPY THIS PATTERN:
class AuditableMixin:
    """Mixin that enables automatic audit logging for a model.

    Usage:
        class WorkOrder(Base, AuditableMixin):
            __tablename__ = "work_order"
            __audit_entity_type__ = "work_order"  # Optional, defaults to __tablename__
    """
```

---

## Files to Change

| File                                           | Action | Justification                                          |
| ---------------------------------------------- | ------ | ------------------------------------------------------ |
| `app/api/tests/integration/test_audit_e2e.py`  | CREATE | E2E tests for full API flow                            |
| `app/api/tests/integration/test_audit_retrieval.py` | CREATE | Tests for retrieval with actual data and filters  |
| `app/api/tests/unit/test_audit_mixin.py`       | CREATE | Unit tests for AuditableMixin behavior                 |
| `app/api/core/audit/README.md`                 | CREATE | Developer documentation for adding auditing            |
| `app/api/conftest.py`                          | UPDATE | Add shared pytest fixtures                             |

---

## NOT Building (Scope Limits)

Explicit exclusions to prevent scope creep:

- **UI components** - This is infrastructure only, no frontend tests
- **Performance benchmarks** - Not required for MVP
- **Load testing** - Out of scope for this phase
- **Test coverage tooling** - Use existing pytest-cov if available, don't add new
- **API documentation (OpenAPI)** - FastAPI generates this automatically
- **Changelog/release notes** - Out of scope

---

## Step-by-Step Tasks

Execute in order. Each task is atomic and independently verifiable.

### Task 1: UPDATE `app/api/conftest.py` - Add Shared Fixtures

- **ACTION**: Update conftest.py to add shared test fixtures used across modules
- **IMPLEMENT**: Add shared fixtures for db_session, async_client, test_city, cleanup_work_orders
- **MIRROR**: `app/api/tests/integration/test_audit_capture.py:19-71`
- **IMPORTS**:
  ```python
  import os
  import pytest
  import pytest_asyncio
  from httpx import ASGITransport, AsyncClient
  from sqlalchemy import text
  ```
- **GOTCHA**: Keep existing conftest.py content (sys.path setup) and add fixtures below
- **VALIDATE**: `cd app/api && uv run pytest tests/unit/test_context.py -v` (existing tests still pass)

### Task 2: CREATE `app/api/tests/unit/test_audit_mixin.py`

- **ACTION**: CREATE unit tests for AuditableMixin class
- **IMPLEMENT**: Test __audit_entity_type__ method, override behavior, edge cases
- **MIRROR**: `app/api/tests/unit/test_audit.py:1-98` for structure
- **TEST CASES**:
  - Test default entity type from __tablename__
  - Test custom entity type override via __audit_entity_type_override__
  - Test register_audit_listeners raises ValueError without mixin
- **VALIDATE**: `cd app/api && uv run pytest tests/unit/test_audit_mixin.py -v`

### Task 3: CREATE `app/api/tests/integration/test_audit_e2e.py`

- **ACTION**: CREATE end-to-end integration tests for full API flow
- **IMPLEMENT**: Tests that create/update/delete via API and verify audit records
- **MIRROR**: `app/api/tests/integration/test_audit_api.py:1-154` for structure
- **TEST CASES**:
  - Create work order via session → verify audit record created
  - Update work order → verify audit record with changed_fields
  - Delete work order → verify audit record with old_values
  - Context captured (user_id, session_id, ip_address) in audit
  - Multiple rapid updates create separate audit records
- **GOTCHA**: Use cleanup fixtures to avoid test pollution; set context before operations
- **VALIDATE**: `cd app/api && DATABASE_URL=$DATABASE_URL uv run pytest tests/integration/test_audit_e2e.py -v`

### Task 4: CREATE `app/api/tests/integration/test_audit_retrieval.py`

- **ACTION**: CREATE integration tests for audit retrieval with actual data
- **IMPLEMENT**: Tests that seed audit data and verify retrieval behavior
- **MIRROR**: `app/api/tests/integration/test_audit_api.py:33-40` for async_client fixture
- **TEST CASES**:
  - Create entity, retrieve audit history via API, verify record structure
  - Pagination works correctly (page, page_size, has_next)
  - Filter by date range (from_date, to_date)
  - Filter by action type (INSERT, UPDATE, DELETE)
  - Filter by user_id
  - Combined filters work together
  - Empty results for non-existent entity
  - Results ordered by created_at DESC
- **GOTCHA**: Create data in test, then query API - don't rely on existing data
- **VALIDATE**: `cd app/api && DATABASE_URL=$DATABASE_URL uv run pytest tests/integration/test_audit_retrieval.py -v`

### Task 5: CREATE `app/api/core/audit/README.md`

- **ACTION**: CREATE developer documentation for audit infrastructure
- **IMPLEMENT**: Step-by-step guide for adding auditing to new entities
- **SECTIONS**:
  1. Overview - What the audit system does
  2. Quick Start - 3 steps to add auditing
  3. How It Works - Technical explanation
  4. API Reference - Endpoint documentation
  5. Configuration - Headers, context extraction
  6. Troubleshooting - Common issues
- **MIRROR**: Docstrings in `app/api/core/audit.py:93-106` for usage examples
- **CONTENT**:
  ```markdown
  # Audit Infrastructure

  ## Quick Start (3 Steps)

  1. Add AuditableMixin to your model
  2. Register listeners at startup
  3. Ensure model has `uuid` attribute

  ## How It Works

  [Explain SQLAlchemy event listeners, context propagation, etc.]
  ```
- **VALIDATE**: Manual review - documentation is clear and complete

### Task 6: Run Full Test Suite and Verify Coverage

- **ACTION**: Run all audit-related tests and verify coverage
- **IMPLEMENT**: Execute test commands and document results
- **COMMANDS**:
  ```bash
  # Unit tests (no database required)
  cd app/api && uv run pytest tests/unit/ -v

  # Integration tests (database required)
  cd app/api && DATABASE_URL=$DATABASE_URL uv run pytest tests/integration/ -v

  # All tests
  cd app/api && DATABASE_URL=$DATABASE_URL uv run pytest tests/ -v
  ```
- **VALIDATE**: All tests pass; no failures or errors

### Task 7: Final Validation and Documentation Review

- **ACTION**: Final review of all deliverables
- **IMPLEMENT**:
  - Verify all test files have proper docstrings
  - Verify README is complete and accurate
  - Verify no console.log or debug code left in tests
  - Check imports are properly organized
- **VALIDATE**: Manual review of all created/updated files

---

## Testing Strategy

### Unit Tests to Write

| Test File                                | Test Cases                 | Validates      |
| ---------------------------------------- | -------------------------- | -------------- |
| `tests/unit/test_audit_mixin.py`         | entity type, override, validation | AuditableMixin |

### Integration Tests to Write

| Test File                                | Test Cases                 | Validates      |
| ---------------------------------------- | -------------------------- | -------------- |
| `tests/integration/test_audit_e2e.py`    | create/update/delete flow, context | Full audit flow |
| `tests/integration/test_audit_retrieval.py` | pagination, filters, ordering | API retrieval |

### Edge Cases Checklist

- [ ] Empty audit history for non-existent entity
- [ ] Pagination with exactly page_size records
- [ ] Pagination with fewer than page_size records
- [ ] Date range filter with no matching records
- [ ] User filter with no matching records
- [ ] Action filter with no matching records
- [ ] Combined filters with no matching records
- [ ] Multiple rapid operations create separate audit records
- [ ] Null user_id (anonymous requests)
- [ ] Custom entity type override

---

## Validation Commands

### Level 1: STATIC_ANALYSIS

```bash
cd app/api && uv run python -m py_compile tests/unit/test_audit_mixin.py tests/integration/test_audit_e2e.py tests/integration/test_audit_retrieval.py
```

**EXPECT**: Exit 0, no syntax errors

### Level 2: UNIT_TESTS

```bash
cd app/api && uv run pytest tests/unit/ -v
```

**EXPECT**: All tests pass

### Level 3: INTEGRATION_TESTS

```bash
cd app/api && DATABASE_URL=$DATABASE_URL uv run pytest tests/integration/ -v
```

**EXPECT**: All tests pass (requires database)

### Level 4: FULL_SUITE

```bash
cd app/api && DATABASE_URL=$DATABASE_URL uv run pytest tests/ -v
```

**EXPECT**: All tests pass

### Level 5: DOCUMENTATION_VALIDATION

Manual review of `app/api/core/audit/README.md`:
- [ ] Quick Start section is actionable
- [ ] Code examples are correct
- [ ] All steps are numbered
- [ ] No broken links

---

## Acceptance Criteria

- [ ] All unit tests pass without database
- [ ] All integration tests pass with database
- [ ] E2E tests verify full audit flow (create→audit→retrieve)
- [ ] Retrieval tests verify all filter combinations
- [ ] README provides 3-step guide for adding auditing
- [ ] Test docstrings describe what is being tested
- [ ] No test pollution (cleanup fixtures work correctly)

---

## Completion Checklist

- [ ] Task 1: conftest.py updated with shared fixtures
- [ ] Task 2: test_audit_mixin.py created and passing
- [ ] Task 3: test_audit_e2e.py created and passing
- [ ] Task 4: test_audit_retrieval.py created and passing
- [ ] Task 5: README.md created with complete documentation
- [ ] Task 6: Full test suite passes
- [ ] Task 7: Final review completed
- [ ] Level 1-4 validation commands pass
- [ ] All acceptance criteria met

---

## Risks and Mitigations

| Risk               | Likelihood   | Impact       | Mitigation                              |
| ------------------ | ------------ | ------------ | --------------------------------------- |
| Test database not available | MEDIUM | HIGH | Use skipif markers for integration tests |
| Test pollution between tests | LOW | MEDIUM | Use cleanup fixtures with yield pattern |
| Async test issues | LOW | MEDIUM | Use proven pytest-asyncio patterns |
| Documentation becomes stale | MEDIUM | LOW | Keep docs close to code, reference tests |

---

## Notes

### Design Decisions

1. **Shared fixtures in conftest.py** - Centralize common test setup to reduce duplication and ensure consistency across test modules.

2. **Separate E2E and retrieval test files** - E2E tests focus on the capture flow, retrieval tests focus on the API query behavior. This separation makes tests easier to understand and maintain.

3. **README in core/audit/** - Place documentation near the code it documents. This follows the principle of keeping related things together.

4. **No coverage tooling addition** - Coverage reports are helpful but adding pytest-cov is out of scope. Developers can add it if needed.

### Test Data Strategy

- Use `WO-TEST-*` prefix for test work orders to enable easy cleanup
- Each test creates its own data rather than relying on shared seed data
- Cleanup fixtures run after each test to prevent pollution
- Context is explicitly set in tests that verify context capture

### Future Considerations

- When adding new auditable models, add corresponding tests
- Consider adding pytest-cov for coverage reporting in CI
- Consider adding performance benchmarks if audit volume becomes a concern
