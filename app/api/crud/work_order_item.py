from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from uuid import UUID
from datetime import datetime

from models.work_order import WorkOrder
from models.work_order_item import WorkOrderItem
from schemas.work_order_item import WorkOrderItemCreate, WorkOrderItemUpdate


async def get_next_item_number(db: AsyncSession, work_order_id: int) -> int:
    """Get the next item number for a work order."""
    query = select(
        func.coalesce(func.max(WorkOrderItem.item_number), 0) + 1
    ).where(WorkOrderItem.work_order_id == work_order_id)
    result = await db.execute(query)
    return result.scalar()


async def get_work_order_items(
    db: AsyncSession, wo_uuid: UUID
) -> tuple[list[WorkOrderItem], int]:
    """Get all items for a work order."""
    # Get work order first
    wo_query = select(WorkOrder).where(WorkOrder.uuid == wo_uuid)
    wo_result = await db.execute(wo_query)
    work_order = wo_result.scalar_one_or_none()
    if not work_order:
        return [], 0

    # Get items
    query = (
        select(WorkOrderItem)
        .where(WorkOrderItem.work_order_id == work_order.id)
        .order_by(WorkOrderItem.item_number)
    )
    result = await db.execute(query)
    items = result.scalars().all()

    # Get count
    count_query = select(func.count(WorkOrderItem.id)).where(
        WorkOrderItem.work_order_id == work_order.id
    )
    count_result = await db.execute(count_query)
    total = count_result.scalar()

    return list(items), total


async def get_work_order_item_by_uuid(
    db: AsyncSession, item_uuid: UUID
) -> WorkOrderItem | None:
    """Get a work order item by its UUID."""
    query = select(WorkOrderItem).where(WorkOrderItem.uuid == item_uuid)
    result = await db.execute(query)
    return result.scalar_one_or_none()


async def create_work_order_item(
    db: AsyncSession, wo_uuid: UUID, item_in: WorkOrderItemCreate
) -> WorkOrderItem | None:
    """Create a new work order item."""
    # Get work order
    wo_query = select(WorkOrder).where(WorkOrder.uuid == wo_uuid)
    wo_result = await db.execute(wo_query)
    work_order = wo_result.scalar_one_or_none()
    if not work_order:
        return None

    # Get next item number
    item_number = await get_next_item_number(db, work_order.id)

    # Create item
    item = WorkOrderItem(
        work_order_id=work_order.id,
        item_number=item_number,
        status=item_in.status,
        discrepancy=item_in.discrepancy,
        corrective_action=item_in.corrective_action,
        notes=item_in.notes,
        category=item_in.category,
        sub_category=item_in.sub_category,
        ata_code=item_in.ata_code,
        hours_estimate=item_in.hours_estimate,
        billing_method=item_in.billing_method,
        flat_rate=item_in.flat_rate,
        department=item_in.department,
        do_not_bill=item_in.do_not_bill,
        enable_rii=item_in.enable_rii,
        created_by=item_in.created_by,
    )

    db.add(item)
    await db.flush()
    await db.refresh(item)
    return item


async def update_work_order_item(
    db: AsyncSession, item_uuid: UUID, item_in: WorkOrderItemUpdate
) -> WorkOrderItem | None:
    """Update a work order item."""
    item = await get_work_order_item_by_uuid(db, item_uuid)
    if not item:
        return None

    # Update fields
    update_data = item_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(item, field, value)

    item.updated_at = datetime.utcnow()
    await db.flush()
    await db.refresh(item)
    return item


async def delete_work_order_item(db: AsyncSession, item_uuid: UUID) -> bool:
    """Delete a work order item."""
    item = await get_work_order_item_by_uuid(db, item_uuid)
    if not item:
        return False

    await db.delete(item)
    return True
