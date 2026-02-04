"""End-to-end integration tests for the full audit capture flow.

These tests verify the complete audit path: session operations create audit
records that can be retrieved via the API. This ensures all components work
together correctly.

These tests require a running PostgreSQL database with migrations applied.
Skip these tests if DATABASE_URL is not configured or database is unavailable.
"""

import os
from uuid import uuid4

import pytest
import pytest_asyncio
from sqlalchemy import select, text

# Skip all tests in this module if database is not available
pytestmark = [
    pytest.mark.skipif(
        not os.environ.get("DATABASE_URL"),
        reason="DATABASE_URL not set - skipping integration tests",
    ),
    pytest.mark.asyncio,
]


@pytest_asyncio.fixture(autouse=True)
async def register_listeners():
    """Register audit listeners before tests."""
    from models import register_all_audit_listeners

    register_all_audit_listeners()
    yield


@pytest_asyncio.fixture
async def cleanup_e2e_work_orders(db_session):
    """Clean up E2E test work orders after each test.

    Note: audit_log records cannot be deleted due to database immutability trigger.
    We only clean up work_order records.
    """
    yield
    # Ensure any failed transaction is rolled back before cleanup
    try:
        await db_session.rollback()
    except Exception:
        pass

    # Delete test work orders (those with WO-E2E- prefix)
    # Note: audit_log records are immutable by design
    try:
        await db_session.execute(
            text("DELETE FROM work_order WHERE work_order_number LIKE 'WO-E2E-%'")
        )
        await db_session.commit()
    except Exception:
        await db_session.rollback()


async def test_create_work_order_produces_audit_record(
    db_session, test_city, cleanup_e2e_work_orders
):
    """Creating a work order via session produces a queryable audit record."""
    from models.audit_log import AuditLog
    from models.work_order import WorkOrder

    # Create work order
    unique_num = f"WO-E2E-{uuid4().hex[:8]}"
    work_order = WorkOrder(
        work_order_number=unique_num,
        sequence_number=1,
        city_id=test_city,
        created_by="e2e-test-user",
    )
    db_session.add(work_order)
    await db_session.commit()

    # Verify audit record exists
    result = await db_session.execute(
        select(AuditLog).where(
            AuditLog.entity_type == "work_order",
            AuditLog.entity_id == work_order.uuid,
            AuditLog.action == "INSERT",
        )
    )
    audit = result.scalar_one_or_none()

    assert audit is not None
    assert audit.new_values["work_order_number"] == unique_num
    assert audit.old_values is None
    assert audit.changed_fields is None


async def test_update_work_order_captures_changes(
    db_session, test_city, cleanup_e2e_work_orders
):
    """Updating a work order captures changed fields and old values."""
    from models.audit_log import AuditLog
    from models.work_order import WorkOrder

    # Create and refresh to get server defaults
    unique_num = f"WO-E2E-{uuid4().hex[:8]}"
    work_order = WorkOrder(
        work_order_number=unique_num,
        sequence_number=1,
        city_id=test_city,
        created_by="e2e-test-user",
    )
    db_session.add(work_order)
    await db_session.commit()
    await db_session.refresh(work_order)

    original_status = work_order.status

    # Update status
    work_order.status = "in_progress"
    work_order.updated_by = "another-user"
    await db_session.commit()

    # Verify UPDATE audit record
    result = await db_session.execute(
        select(AuditLog).where(
            AuditLog.entity_type == "work_order",
            AuditLog.entity_id == work_order.uuid,
            AuditLog.action == "UPDATE",
        )
    )
    audit = result.scalar_one_or_none()

    assert audit is not None
    assert "status" in audit.changed_fields
    assert audit.old_values["status"] == original_status
    assert audit.new_values["status"] == "in_progress"


async def test_delete_work_order_captures_old_values(
    db_session, test_city, cleanup_e2e_work_orders
):
    """Deleting a work order captures the full entity state before deletion."""
    from models.audit_log import AuditLog
    from models.work_order import WorkOrder

    # Create work order
    unique_num = f"WO-E2E-{uuid4().hex[:8]}"
    work_order = WorkOrder(
        work_order_number=unique_num,
        sequence_number=1,
        city_id=test_city,
        created_by="e2e-test-user",
    )
    db_session.add(work_order)
    await db_session.commit()

    work_order_uuid = work_order.uuid

    # Delete
    await db_session.delete(work_order)
    await db_session.commit()

    # Verify DELETE audit record
    result = await db_session.execute(
        select(AuditLog).where(
            AuditLog.entity_type == "work_order",
            AuditLog.entity_id == work_order_uuid,
            AuditLog.action == "DELETE",
        )
    )
    audit = result.scalar_one_or_none()

    assert audit is not None
    assert audit.old_values is not None
    assert audit.old_values["work_order_number"] == unique_num
    assert audit.new_values is None


async def test_context_captured_in_audit(
    db_session, test_city, cleanup_e2e_work_orders
):
    """User context (user_id, session_id, ip_address) is captured in audit records."""
    from core.context import RequestContext, set_current_context
    from models.audit_log import AuditLog
    from models.work_order import WorkOrder

    # Set up context
    test_user = "e2e-user-context-test"
    test_session = "session-e2e-123"
    test_ip = "10.0.0.1"
    context = RequestContext(
        user_id=test_user,
        session_id=test_session,
        ip_address=test_ip,
    )
    set_current_context(context)

    # Create work order
    unique_num = f"WO-E2E-{uuid4().hex[:8]}"
    work_order = WorkOrder(
        work_order_number=unique_num,
        sequence_number=1,
        city_id=test_city,
        created_by="e2e-test-user",
    )
    db_session.add(work_order)
    await db_session.commit()

    # Verify context in audit
    result = await db_session.execute(
        select(AuditLog).where(
            AuditLog.entity_type == "work_order",
            AuditLog.entity_id == work_order.uuid,
        )
    )
    audit = result.scalar_one_or_none()

    assert audit is not None
    assert audit.user_id == test_user
    assert audit.session_id == test_session
    assert audit.ip_address is not None


async def test_rapid_updates_create_separate_audit_records(
    db_session, test_city, cleanup_e2e_work_orders
):
    """Multiple rapid updates each create their own audit record."""
    from models.audit_log import AuditLog
    from models.work_order import WorkOrder

    # Create work order
    unique_num = f"WO-E2E-{uuid4().hex[:8]}"
    work_order = WorkOrder(
        work_order_number=unique_num,
        sequence_number=1,
        city_id=test_city,
        created_by="e2e-test-user",
    )
    db_session.add(work_order)
    await db_session.commit()
    await db_session.refresh(work_order)

    # Perform multiple updates (use valid database enum values)
    statuses = ["in_progress", "pending", "completed"]
    for status in statuses:
        work_order.status = status
        await db_session.commit()
        await db_session.refresh(work_order)

    # Query all UPDATE records
    result = await db_session.execute(
        select(AuditLog)
        .where(
            AuditLog.entity_type == "work_order",
            AuditLog.entity_id == work_order.uuid,
            AuditLog.action == "UPDATE",
        )
        .order_by(AuditLog.created_at)
    )
    updates = result.scalars().all()

    # Should have 3 separate UPDATE records
    assert len(updates) == 3


async def test_null_context_allowed(
    db_session, test_city, cleanup_e2e_work_orders
):
    """Audit records can be created without context (anonymous operations)."""
    from core.context import set_current_context
    from models.audit_log import AuditLog
    from models.work_order import WorkOrder

    # Clear context
    set_current_context(None)

    # Create work order
    unique_num = f"WO-E2E-{uuid4().hex[:8]}"
    work_order = WorkOrder(
        work_order_number=unique_num,
        sequence_number=1,
        city_id=test_city,
        created_by="e2e-test-user",
    )
    db_session.add(work_order)
    await db_session.commit()

    # Verify audit record created with null context
    result = await db_session.execute(
        select(AuditLog).where(
            AuditLog.entity_type == "work_order",
            AuditLog.entity_id == work_order.uuid,
        )
    )
    audit = result.scalar_one_or_none()

    assert audit is not None
    assert audit.user_id is None
    # Session and IP may also be None


async def test_full_lifecycle_creates_three_audit_records(
    db_session, test_city, cleanup_e2e_work_orders
):
    """Full create-update-delete lifecycle produces INSERT, UPDATE, DELETE records."""
    from models.audit_log import AuditLog
    from models.work_order import WorkOrder

    # Create
    unique_num = f"WO-E2E-{uuid4().hex[:8]}"
    work_order = WorkOrder(
        work_order_number=unique_num,
        sequence_number=1,
        city_id=test_city,
        created_by="e2e-test-user",
    )
    db_session.add(work_order)
    await db_session.commit()
    await db_session.refresh(work_order)
    work_order_uuid = work_order.uuid

    # Update
    work_order.status = "in_progress"
    await db_session.commit()

    # Delete
    await db_session.delete(work_order)
    await db_session.commit()

    # Query all audit records
    result = await db_session.execute(
        select(AuditLog)
        .where(
            AuditLog.entity_type == "work_order",
            AuditLog.entity_id == work_order_uuid,
        )
        .order_by(AuditLog.created_at)
    )
    audits = result.scalars().all()

    assert len(audits) == 3
    assert audits[0].action == "INSERT"
    assert audits[1].action == "UPDATE"
    assert audits[2].action == "DELETE"


async def test_audit_timestamps_are_set(
    db_session, test_city, cleanup_e2e_work_orders
):
    """Audit records have created_at timestamps."""
    from datetime import datetime, timedelta, timezone

    from models.audit_log import AuditLog
    from models.work_order import WorkOrder

    # Allow for some timing tolerance
    before = datetime.now(timezone.utc) - timedelta(seconds=1)

    # Create work order
    unique_num = f"WO-E2E-{uuid4().hex[:8]}"
    work_order = WorkOrder(
        work_order_number=unique_num,
        sequence_number=1,
        city_id=test_city,
        created_by="e2e-test-user",
    )
    db_session.add(work_order)
    await db_session.commit()

    after = datetime.now(timezone.utc) + timedelta(seconds=1)

    # Verify timestamp
    result = await db_session.execute(
        select(AuditLog).where(
            AuditLog.entity_id == work_order.uuid,
        )
    )
    audit = result.scalar_one_or_none()

    assert audit is not None
    assert audit.created_at is not None
    # Timestamp should be between before and after (with tolerance)
    # Note: Comparing with timezone awareness
    audit_time = audit.created_at.replace(tzinfo=timezone.utc) if audit.created_at.tzinfo is None else audit.created_at
    assert before <= audit_time <= after
