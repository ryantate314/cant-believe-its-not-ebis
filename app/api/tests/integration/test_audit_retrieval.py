"""Integration tests for audit retrieval with actual data.

Tests verify the audit retrieval via direct database queries, avoiding
event loop conflicts with API client tests.

These tests require a running PostgreSQL database with migrations applied.
Skip these tests if DATABASE_URL is not configured or database is unavailable.
"""

import os
from datetime import datetime, timedelta, timezone
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
async def cleanup_retrieval_work_orders(db_session):
    """Clean up retrieval test work orders after each test."""
    yield
    # Ensure any failed transaction is rolled back before cleanup
    try:
        await db_session.rollback()
    except Exception:
        pass

    # Delete test work orders
    try:
        await db_session.execute(
            text("DELETE FROM work_order WHERE work_order_number LIKE 'WO-RET-%'")
        )
        await db_session.commit()
    except Exception:
        await db_session.rollback()


async def test_audit_records_created_for_entity(
    db_session, test_city, cleanup_retrieval_work_orders
):
    """Audit records are created and queryable for an entity."""
    from models.audit_log import AuditLog
    from models.work_order import WorkOrder

    # Create a work order (creates INSERT audit record)
    unique_num = f"WO-RET-{uuid4().hex[:8]}"
    work_order = WorkOrder(
        work_order_number=unique_num,
        sequence_number=1,
        city_id=test_city,
        created_by="retrieval-test-user",
    )
    db_session.add(work_order)
    await db_session.commit()
    await db_session.refresh(work_order)

    # Query audit records directly
    result = await db_session.execute(
        select(AuditLog)
        .where(
            AuditLog.entity_type == "work_order",
            AuditLog.entity_id == work_order.uuid,
        )
    )
    records = result.scalars().all()

    assert len(records) >= 1
    assert records[0].action == "INSERT"


async def test_audit_records_ordered_by_created_at_desc(
    db_session, test_city, cleanup_retrieval_work_orders
):
    """Audit records are ordered by created_at DESC when queried."""
    from models.audit_log import AuditLog
    from models.work_order import WorkOrder

    # Create a work order and update it
    unique_num = f"WO-RET-{uuid4().hex[:8]}"
    work_order = WorkOrder(
        work_order_number=unique_num,
        sequence_number=1,
        city_id=test_city,
        created_by="retrieval-test-user",
    )
    db_session.add(work_order)
    await db_session.commit()
    await db_session.refresh(work_order)

    # Update to create UPDATE record
    work_order.status = "in_progress"
    await db_session.commit()

    # Query with ordering
    result = await db_session.execute(
        select(AuditLog)
        .where(
            AuditLog.entity_type == "work_order",
            AuditLog.entity_id == work_order.uuid,
        )
        .order_by(AuditLog.created_at.desc())
    )
    records = result.scalars().all()

    assert len(records) >= 2
    # First record (newest) should be UPDATE
    assert records[0].action == "UPDATE"
    # Second record should be INSERT
    assert records[1].action == "INSERT"


async def test_multiple_updates_create_separate_records(
    db_session, test_city, cleanup_retrieval_work_orders
):
    """Multiple updates create separate audit records."""
    from models.audit_log import AuditLog
    from models.work_order import WorkOrder

    # Create a work order
    unique_num = f"WO-RET-{uuid4().hex[:8]}"
    work_order = WorkOrder(
        work_order_number=unique_num,
        sequence_number=1,
        city_id=test_city,
        created_by="retrieval-test-user",
    )
    db_session.add(work_order)
    await db_session.commit()
    await db_session.refresh(work_order)

    # Multiple updates
    for status in ["scheduled", "open", "in_progress", "completed"]:
        work_order.status = status
        await db_session.commit()
        await db_session.refresh(work_order)

    # Query all records
    result = await db_session.execute(
        select(AuditLog)
        .where(
            AuditLog.entity_type == "work_order",
            AuditLog.entity_id == work_order.uuid,
        )
    )
    records = result.scalars().all()

    # 1 INSERT + 4 UPDATEs = 5 records
    assert len(records) == 5


async def test_filter_audit_by_action(
    db_session, test_city, cleanup_retrieval_work_orders
):
    """Can filter audit records by action type."""
    from models.audit_log import AuditLog
    from models.work_order import WorkOrder

    # Create and update work order
    unique_num = f"WO-RET-{uuid4().hex[:8]}"
    work_order = WorkOrder(
        work_order_number=unique_num,
        sequence_number=1,
        city_id=test_city,
        created_by="retrieval-test-user",
    )
    db_session.add(work_order)
    await db_session.commit()
    await db_session.refresh(work_order)

    work_order.status = "in_progress"
    await db_session.commit()

    # Filter by INSERT only
    result = await db_session.execute(
        select(AuditLog)
        .where(
            AuditLog.entity_type == "work_order",
            AuditLog.entity_id == work_order.uuid,
            AuditLog.action == "INSERT",
        )
    )
    insert_records = result.scalars().all()

    assert len(insert_records) == 1
    assert insert_records[0].action == "INSERT"


async def test_filter_audit_by_user_id(
    db_session, test_city, cleanup_retrieval_work_orders
):
    """Can filter audit records by user_id."""
    from core.context import RequestContext, set_current_context
    from models.audit_log import AuditLog
    from models.work_order import WorkOrder

    # Set a specific user context
    test_user = f"test-user-{uuid4().hex[:8]}"
    context = RequestContext(
        user_id=test_user,
        session_id="session-filter-test",
        ip_address="10.0.0.1",
    )
    set_current_context(context)

    # Create work order with this user
    unique_num = f"WO-RET-{uuid4().hex[:8]}"
    work_order = WorkOrder(
        work_order_number=unique_num,
        sequence_number=1,
        city_id=test_city,
        created_by="retrieval-test-user",
    )
    db_session.add(work_order)
    await db_session.commit()
    await db_session.refresh(work_order)

    # Filter by user_id
    result = await db_session.execute(
        select(AuditLog)
        .where(
            AuditLog.entity_type == "work_order",
            AuditLog.entity_id == work_order.uuid,
            AuditLog.user_id == test_user,
        )
    )
    records = result.scalars().all()

    assert len(records) >= 1
    assert records[0].user_id == test_user


async def test_filter_audit_by_date_range(
    db_session, test_city, cleanup_retrieval_work_orders
):
    """Can filter audit records by date range."""
    from models.audit_log import AuditLog
    from models.work_order import WorkOrder

    # Create work order
    unique_num = f"WO-RET-{uuid4().hex[:8]}"
    work_order = WorkOrder(
        work_order_number=unique_num,
        sequence_number=1,
        city_id=test_city,
        created_by="retrieval-test-user",
    )
    db_session.add(work_order)
    await db_session.commit()
    await db_session.refresh(work_order)

    # Query with date range including today
    from_date = datetime.now(timezone.utc) - timedelta(days=1)
    to_date = datetime.now(timezone.utc) + timedelta(days=1)

    result = await db_session.execute(
        select(AuditLog)
        .where(
            AuditLog.entity_type == "work_order",
            AuditLog.entity_id == work_order.uuid,
            AuditLog.created_at >= from_date,
            AuditLog.created_at <= to_date,
        )
    )
    records = result.scalars().all()

    assert len(records) >= 1


async def test_combined_filters(
    db_session, test_city, cleanup_retrieval_work_orders
):
    """Multiple filters can be combined."""
    from core.context import RequestContext, set_current_context
    from models.audit_log import AuditLog
    from models.work_order import WorkOrder

    # Set user context
    test_user = f"combo-user-{uuid4().hex[:8]}"
    context = RequestContext(
        user_id=test_user,
        session_id="session-combo-test",
        ip_address="10.0.0.1",
    )
    set_current_context(context)

    # Create work order
    unique_num = f"WO-RET-{uuid4().hex[:8]}"
    work_order = WorkOrder(
        work_order_number=unique_num,
        sequence_number=1,
        city_id=test_city,
        created_by="retrieval-test-user",
    )
    db_session.add(work_order)
    await db_session.commit()
    await db_session.refresh(work_order)

    # Filter by both action and user_id
    result = await db_session.execute(
        select(AuditLog)
        .where(
            AuditLog.entity_type == "work_order",
            AuditLog.entity_id == work_order.uuid,
            AuditLog.action == "INSERT",
            AuditLog.user_id == test_user,
        )
    )
    records = result.scalars().all()

    assert len(records) >= 1
    assert records[0].action == "INSERT"
    assert records[0].user_id == test_user


async def test_no_records_for_nonexistent_entity(db_session):
    """Return no records for entity that doesn't exist."""
    from models.audit_log import AuditLog

    nonexistent_id = uuid4()
    result = await db_session.execute(
        select(AuditLog)
        .where(
            AuditLog.entity_type == "work_order",
            AuditLog.entity_id == nonexistent_id,
        )
    )
    records = result.scalars().all()

    assert len(records) == 0


async def test_audit_record_structure(
    db_session, test_city, cleanup_retrieval_work_orders
):
    """Audit records have expected structure."""
    from models.audit_log import AuditLog
    from models.work_order import WorkOrder

    # Create work order
    unique_num = f"WO-RET-{uuid4().hex[:8]}"
    work_order = WorkOrder(
        work_order_number=unique_num,
        sequence_number=1,
        city_id=test_city,
        created_by="retrieval-test-user",
    )
    db_session.add(work_order)
    await db_session.commit()
    await db_session.refresh(work_order)

    # Query audit record
    result = await db_session.execute(
        select(AuditLog)
        .where(AuditLog.entity_id == work_order.uuid)
    )
    record = result.scalar_one()

    # Verify expected fields
    assert record.id is not None
    assert record.entity_type == "work_order"
    assert record.entity_id == work_order.uuid
    assert record.action == "INSERT"
    assert record.created_at is not None
    assert record.new_values is not None


async def test_no_results_with_filter_mismatch(
    db_session, test_city, cleanup_retrieval_work_orders
):
    """Filters that don't match return no results."""
    from models.audit_log import AuditLog
    from models.work_order import WorkOrder

    # Create work order (INSERT only)
    unique_num = f"WO-RET-{uuid4().hex[:8]}"
    work_order = WorkOrder(
        work_order_number=unique_num,
        sequence_number=1,
        city_id=test_city,
        created_by="retrieval-test-user",
    )
    db_session.add(work_order)
    await db_session.commit()
    await db_session.refresh(work_order)

    # Filter by UPDATE (which doesn't exist for this entity)
    result = await db_session.execute(
        select(AuditLog)
        .where(
            AuditLog.entity_type == "work_order",
            AuditLog.entity_id == work_order.uuid,
            AuditLog.action == "UPDATE",
        )
    )
    records = result.scalars().all()

    assert len(records) == 0


async def test_pagination_with_limit_offset(
    db_session, test_city, cleanup_retrieval_work_orders
):
    """Pagination using limit/offset works correctly."""
    from models.audit_log import AuditLog
    from models.work_order import WorkOrder

    # Create work order with multiple updates
    unique_num = f"WO-RET-{uuid4().hex[:8]}"
    work_order = WorkOrder(
        work_order_number=unique_num,
        sequence_number=1,
        city_id=test_city,
        created_by="retrieval-test-user",
    )
    db_session.add(work_order)
    await db_session.commit()
    await db_session.refresh(work_order)

    for status in ["scheduled", "open", "in_progress"]:
        work_order.status = status
        await db_session.commit()
        await db_session.refresh(work_order)

    # Page 1 (first 2 records)
    result1 = await db_session.execute(
        select(AuditLog)
        .where(
            AuditLog.entity_type == "work_order",
            AuditLog.entity_id == work_order.uuid,
        )
        .order_by(AuditLog.created_at.desc())
        .limit(2)
        .offset(0)
    )
    page1 = result1.scalars().all()

    # Page 2 (next 2 records)
    result2 = await db_session.execute(
        select(AuditLog)
        .where(
            AuditLog.entity_type == "work_order",
            AuditLog.entity_id == work_order.uuid,
        )
        .order_by(AuditLog.created_at.desc())
        .limit(2)
        .offset(2)
    )
    page2 = result2.scalars().all()

    assert len(page1) == 2
    assert len(page2) == 2
    # Pages should have different records
    page1_ids = {r.id for r in page1}
    page2_ids = {r.id for r in page2}
    assert page1_ids.isdisjoint(page2_ids)


async def test_delete_captures_old_values(
    db_session, test_city, cleanup_retrieval_work_orders
):
    """Delete operation captures old values in audit record."""
    from models.audit_log import AuditLog
    from models.work_order import WorkOrder

    # Create work order
    unique_num = f"WO-RET-{uuid4().hex[:8]}"
    work_order = WorkOrder(
        work_order_number=unique_num,
        sequence_number=1,
        city_id=test_city,
        created_by="retrieval-test-user",
    )
    db_session.add(work_order)
    await db_session.commit()
    work_order_uuid = work_order.uuid

    # Delete
    await db_session.delete(work_order)
    await db_session.commit()

    # Query DELETE audit record
    result = await db_session.execute(
        select(AuditLog)
        .where(
            AuditLog.entity_type == "work_order",
            AuditLog.entity_id == work_order_uuid,
            AuditLog.action == "DELETE",
        )
    )
    record = result.scalar_one_or_none()

    assert record is not None
    assert record.old_values is not None
    assert record.old_values["work_order_number"] == unique_num
    assert record.new_values is None


# =============================================================================
# Combined Audit Endpoint Tests (WorkOrder + WorkOrderItem)
# =============================================================================


@pytest_asyncio.fixture
async def test_work_order_for_combined(db_session, test_city, cleanup_retrieval_work_orders):
    """Create a work order for combined audit tests."""
    from models.work_order import WorkOrder

    unique_num = f"WO-RET-{uuid4().hex[:8]}"
    work_order = WorkOrder(
        work_order_number=unique_num,
        sequence_number=1,
        city_id=test_city,
        created_by="retrieval-test-user",
    )
    db_session.add(work_order)
    await db_session.commit()
    await db_session.refresh(work_order)
    return work_order


async def test_combined_audit_returns_work_order_item_insert(
    db_session, test_work_order_for_combined, cleanup_retrieval_work_orders
):
    """Combined audit endpoint returns INSERT records for work order items."""
    import json
    from sqlalchemy import cast, or_
    from sqlalchemy.dialects.postgresql import JSONB

    from models.audit_log import AuditLog
    from models.work_order_item import WorkOrderItem

    work_order = test_work_order_for_combined

    # Create a work order item
    item = WorkOrderItem(
        work_order_id=work_order.id,
        item_number=1,
        discrepancy="Test discrepancy for combined",
        corrective_action="Test corrective action",
        created_by="retrieval-test-user",
    )
    db_session.add(item)
    await db_session.commit()
    await db_session.refresh(item)

    # Query using the same logic as the combined audit endpoint
    work_order_id_json = cast(
        json.dumps({"work_order_id": work_order.id}), JSONB
    )

    combined_filter = or_(
        # Work order itself
        (AuditLog.entity_type == "work_order") & (AuditLog.entity_id == work_order.uuid),
        # Work order items - check new_values for INSERT/UPDATE
        (AuditLog.entity_type == "work_order_item")
        & (AuditLog.new_values.op("@>")(work_order_id_json)),
        # Work order items - check old_values for DELETE
        (AuditLog.entity_type == "work_order_item")
        & (AuditLog.old_values.op("@>")(work_order_id_json)),
    )

    result = await db_session.execute(
        select(AuditLog)
        .where(combined_filter)
        .order_by(AuditLog.created_at.desc())
    )
    records = result.scalars().all()

    # Should have at least: 1 work order INSERT + 1 item INSERT
    assert len(records) >= 2

    # Find the work order item INSERT record
    item_inserts = [
        r for r in records
        if r.entity_type == "work_order_item" and r.action == "INSERT"
    ]
    assert len(item_inserts) >= 1
    assert item_inserts[0].new_values["item_number"] == 1
    assert item_inserts[0].new_values["work_order_id"] == work_order.id


async def test_combined_audit_returns_work_order_item_update(
    db_session, test_work_order_for_combined, cleanup_retrieval_work_orders
):
    """Combined audit endpoint returns UPDATE records for work order items."""
    import json
    from sqlalchemy import cast, or_
    from sqlalchemy.dialects.postgresql import JSONB

    from models.audit_log import AuditLog
    from models.work_order_item import WorkOrderItem, WorkOrderItemStatus

    work_order = test_work_order_for_combined

    # Create and then update a work order item
    item = WorkOrderItem(
        work_order_id=work_order.id,
        item_number=1,
        status=WorkOrderItemStatus.OPEN,
        discrepancy="Original discrepancy",
        corrective_action="Original action",
        created_by="retrieval-test-user",
    )
    db_session.add(item)
    await db_session.commit()
    await db_session.refresh(item)

    # Update the item
    item.status = WorkOrderItemStatus.IN_PROGRESS
    item.discrepancy = "Updated discrepancy"
    await db_session.commit()

    # Query using combined logic
    work_order_id_json = cast(
        json.dumps({"work_order_id": work_order.id}), JSONB
    )

    combined_filter = or_(
        (AuditLog.entity_type == "work_order") & (AuditLog.entity_id == work_order.uuid),
        (AuditLog.entity_type == "work_order_item")
        & (AuditLog.new_values.op("@>")(work_order_id_json)),
        (AuditLog.entity_type == "work_order_item")
        & (AuditLog.old_values.op("@>")(work_order_id_json)),
    )

    result = await db_session.execute(
        select(AuditLog)
        .where(combined_filter)
        .order_by(AuditLog.created_at.desc())
    )
    records = result.scalars().all()

    # Find the work order item UPDATE record
    item_updates = [
        r for r in records
        if r.entity_type == "work_order_item" and r.action == "UPDATE"
    ]
    assert len(item_updates) >= 1
    assert "status" in item_updates[0].changed_fields
    assert item_updates[0].old_values["status"] == "open"
    assert item_updates[0].new_values["status"] == "in_progress"


async def test_combined_audit_returns_deleted_item_changes(
    db_session, test_work_order_for_combined, cleanup_retrieval_work_orders
):
    """Combined audit endpoint returns DELETE records for work order items."""
    import json
    from sqlalchemy import cast, or_
    from sqlalchemy.dialects.postgresql import JSONB

    from models.audit_log import AuditLog
    from models.work_order_item import WorkOrderItem

    work_order = test_work_order_for_combined

    # Create and then delete a work order item
    item = WorkOrderItem(
        work_order_id=work_order.id,
        item_number=1,
        discrepancy="Item to be deleted",
        corrective_action="Will be deleted",
        created_by="retrieval-test-user",
    )
    db_session.add(item)
    await db_session.commit()
    await db_session.refresh(item)

    item_uuid = item.uuid

    # Delete the item
    await db_session.delete(item)
    await db_session.commit()

    # Query using combined logic
    work_order_id_json = cast(
        json.dumps({"work_order_id": work_order.id}), JSONB
    )

    combined_filter = or_(
        (AuditLog.entity_type == "work_order") & (AuditLog.entity_id == work_order.uuid),
        (AuditLog.entity_type == "work_order_item")
        & (AuditLog.new_values.op("@>")(work_order_id_json)),
        (AuditLog.entity_type == "work_order_item")
        & (AuditLog.old_values.op("@>")(work_order_id_json)),
    )

    result = await db_session.execute(
        select(AuditLog)
        .where(combined_filter)
        .order_by(AuditLog.created_at.desc())
    )
    records = result.scalars().all()

    # Find the work order item DELETE record
    item_deletes = [
        r for r in records
        if r.entity_type == "work_order_item" and r.action == "DELETE"
    ]
    assert len(item_deletes) >= 1
    assert item_deletes[0].entity_id == item_uuid
    assert item_deletes[0].old_values is not None
    assert item_deletes[0].old_values["discrepancy"] == "Item to be deleted"
    assert item_deletes[0].old_values["work_order_id"] == work_order.id
    assert item_deletes[0].new_values is None
