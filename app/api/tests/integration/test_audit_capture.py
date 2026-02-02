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


@pytest.fixture(autouse=True)
async def register_listeners():
    """Register audit listeners before tests."""
    from models import register_all_audit_listeners

    register_all_audit_listeners()
    yield


@pytest.fixture
async def test_city(db_session):
    """Ensure a test city exists for foreign key constraints."""
    # Check if city with id=1 exists, create if not
    result = await db_session.execute(text("SELECT id FROM city WHERE id = 1"))
    if not result.scalar_one_or_none():
        await db_session.execute(
            text(
                "INSERT INTO city (id, code, name, timezone) VALUES (1, 'TST', 'Test City', 'UTC')"
            )
        )
        await db_session.commit()
    yield 1


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
    assert audit_record.old_values is None
    assert audit_record.new_values["work_order_number"] == "WO-TEST-001"


@pytest.mark.asyncio
async def test_update_creates_audit_record_with_diff(db_session, test_city, cleanup_work_orders):
    """Updating a work order creates an UPDATE audit record with changed fields."""
    from models.audit_log import AuditLog
    from models.work_order import WorkOrder

    # Create a work order
    work_order = WorkOrder(
        work_order_number="WO-TEST-002",
        sequence_number=2,
        city_id=test_city,
        created_by="test-user",
    )
    db_session.add(work_order)
    await db_session.commit()

    # Refresh to get server defaults
    await db_session.refresh(work_order)

    # Update the work order
    work_order.status = "in_progress"
    work_order.updated_by = "another-user"
    await db_session.commit()

    # Query audit log for UPDATE record
    result = await db_session.execute(
        select(AuditLog).where(
            AuditLog.entity_type == "work_order",
            AuditLog.entity_id == work_order.uuid,
            AuditLog.action == "UPDATE",
        )
    )
    audit_record = result.scalar_one_or_none()

    assert audit_record is not None
    assert "status" in audit_record.changed_fields
    assert audit_record.old_values["status"] == "created"
    assert audit_record.new_values["status"] == "in_progress"


@pytest.mark.asyncio
async def test_delete_creates_audit_record(db_session, test_city, cleanup_work_orders):
    """Deleting a work order creates a DELETE audit record."""
    from models.audit_log import AuditLog
    from models.work_order import WorkOrder

    # Create and then delete a work order
    work_order = WorkOrder(
        work_order_number="WO-TEST-003",
        sequence_number=3,
        city_id=test_city,
        created_by="test-user",
    )
    db_session.add(work_order)
    await db_session.commit()

    work_order_uuid = work_order.uuid

    await db_session.delete(work_order)
    await db_session.commit()

    # Query audit log for DELETE record
    result = await db_session.execute(
        select(AuditLog).where(
            AuditLog.entity_type == "work_order",
            AuditLog.entity_id == work_order_uuid,
            AuditLog.action == "DELETE",
        )
    )
    audit_record = result.scalar_one_or_none()

    assert audit_record is not None
    assert audit_record.old_values is not None
    assert audit_record.new_values is None


@pytest.mark.asyncio
async def test_no_audit_record_when_no_changes(db_session, test_city, cleanup_work_orders):
    """No UPDATE audit record is created when no fields actually change."""
    from models.audit_log import AuditLog
    from models.work_order import WorkOrder

    # Create a work order
    work_order = WorkOrder(
        work_order_number="WO-TEST-004",
        sequence_number=4,
        city_id=test_city,
        created_by="test-user",
    )
    db_session.add(work_order)
    await db_session.commit()

    # Count existing UPDATE records for this entity
    result = await db_session.execute(
        select(AuditLog).where(
            AuditLog.entity_type == "work_order",
            AuditLog.entity_id == work_order.uuid,
            AuditLog.action == "UPDATE",
        )
    )
    initial_count = len(result.all())

    # "Update" without changing anything - just commit again
    await db_session.commit()

    # Count UPDATE records again
    result = await db_session.execute(
        select(AuditLog).where(
            AuditLog.entity_type == "work_order",
            AuditLog.entity_id == work_order.uuid,
            AuditLog.action == "UPDATE",
        )
    )
    final_count = len(result.all())

    # No new UPDATE records should be created
    assert final_count == initial_count


@pytest.mark.asyncio
async def test_context_captured_in_audit_record(db_session, test_city, cleanup_work_orders):
    """User context is captured in audit records when available."""
    from core.context import RequestContext, set_current_context
    from models.audit_log import AuditLog
    from models.work_order import WorkOrder

    # Set up context (simulating middleware)
    context = RequestContext(
        user_id="test-user-123",
        session_id="session-456",
        ip_address="192.168.1.100",
    )
    set_current_context(context)

    # Create a work order
    work_order = WorkOrder(
        work_order_number="WO-TEST-005",
        sequence_number=5,
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
    assert audit_record.user_id == "test-user-123"
    assert audit_record.session_id == "session-456"
    # IP address may be stored differently, just verify it's captured
    assert audit_record.ip_address is not None
