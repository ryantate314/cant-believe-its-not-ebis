from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, asc, desc
from uuid import UUID
from datetime import datetime

from models.labor_kit import LaborKit
from models.labor_kit_item import LaborKitItem
from models.work_order import WorkOrder
from models.work_order_item import WorkOrderItem, WorkOrderItemStatus
from schemas.labor_kit import LaborKitCreate, LaborKitUpdate
from core.sorting import SortOrder

# Allowed columns for sorting labor kits
LABOR_KIT_SORT_COLUMNS = {
    "name": LaborKit.name,
    "category": LaborKit.category,
    "is_active": LaborKit.is_active,
    "created_at": LaborKit.created_at,
}


async def get_labor_kits(
    db: AsyncSession,
    sort_by: str | None = None,
    sort_order: SortOrder = SortOrder.ASC,
    active_only: bool = False,
) -> tuple[list[LaborKit], int]:
    """Get all labor kits."""
    query = select(LaborKit)

    if active_only:
        query = query.where(LaborKit.is_active == True)

    # Apply sorting
    sort_column = LABOR_KIT_SORT_COLUMNS.get(sort_by, LaborKit.name)
    if sort_order == SortOrder.ASC:
        query = query.order_by(asc(sort_column))
    else:
        query = query.order_by(desc(sort_column))

    result = await db.execute(query)
    items = result.scalars().all()

    # Get count
    count_query = select(func.count(LaborKit.id))
    if active_only:
        count_query = count_query.where(LaborKit.is_active == True)
    count_result = await db.execute(count_query)
    total = count_result.scalar()

    return list(items), total


async def get_labor_kit_by_uuid(db: AsyncSession, kit_uuid: UUID) -> LaborKit | None:
    """Get a labor kit by its UUID."""
    query = select(LaborKit).where(LaborKit.uuid == kit_uuid)
    result = await db.execute(query)
    return result.scalar_one_or_none()


async def create_labor_kit(db: AsyncSession, kit_in: LaborKitCreate) -> LaborKit:
    """Create a new labor kit."""
    kit = LaborKit(
        name=kit_in.name,
        description=kit_in.description,
        category=kit_in.category,
        is_active=kit_in.is_active,
        created_by=kit_in.created_by,
    )

    db.add(kit)
    await db.flush()
    await db.refresh(kit)
    return kit


async def update_labor_kit(
    db: AsyncSession, kit_uuid: UUID, kit_in: LaborKitUpdate
) -> LaborKit | None:
    """Update a labor kit."""
    kit = await get_labor_kit_by_uuid(db, kit_uuid)
    if not kit:
        return None

    # Update fields
    update_data = kit_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(kit, field, value)

    kit.updated_at = datetime.utcnow()
    await db.flush()
    await db.refresh(kit)
    return kit


async def delete_labor_kit(db: AsyncSession, kit_uuid: UUID) -> bool:
    """Delete a labor kit."""
    kit = await get_labor_kit_by_uuid(db, kit_uuid)
    if not kit:
        return False

    await db.delete(kit)
    return True


async def apply_labor_kit_to_work_order(
    db: AsyncSession, kit_uuid: UUID, work_order_uuid: UUID, created_by: str
) -> tuple[int, str | None]:
    """
    Apply a labor kit to a work order, creating work order items from kit items.

    Returns:
        Tuple of (items_created, error_message)
        If error_message is not None, items_created will be 0
    """
    # Get the labor kit
    kit = await get_labor_kit_by_uuid(db, kit_uuid)
    if not kit:
        return 0, "Labor kit not found"

    if not kit.is_active:
        return 0, "Labor kit is not active"

    # Get the work order
    wo_query = select(WorkOrder).where(WorkOrder.uuid == work_order_uuid)
    wo_result = await db.execute(wo_query)
    work_order = wo_result.scalar_one_or_none()
    if not work_order:
        return 0, "Work order not found"

    # Get kit items ordered by item_number
    kit_items_query = (
        select(LaborKitItem)
        .where(LaborKitItem.labor_kit_id == kit.id)
        .order_by(asc(LaborKitItem.item_number))
    )
    kit_items_result = await db.execute(kit_items_query)
    kit_items = kit_items_result.scalars().all()

    if not kit_items:
        return 0, None  # No items to create, but not an error

    # Get the current max item number for the work order
    max_item_query = select(func.coalesce(func.max(WorkOrderItem.item_number), 0)).where(
        WorkOrderItem.work_order_id == work_order.id
    )
    max_result = await db.execute(max_item_query)
    next_item_number = max_result.scalar() + 1

    # Create work order items from kit items
    items_created = 0
    for kit_item in kit_items:
        wo_item = WorkOrderItem(
            work_order_id=work_order.id,
            item_number=next_item_number,
            status=WorkOrderItemStatus.OPEN,
            discrepancy=kit_item.discrepancy,
            corrective_action=kit_item.corrective_action,
            notes=kit_item.notes,
            category=kit_item.category,
            sub_category=kit_item.sub_category,
            ata_code=kit_item.ata_code,
            hours_estimate=kit_item.hours_estimate,
            billing_method=kit_item.billing_method,
            flat_rate=kit_item.flat_rate,
            department=kit_item.department,
            do_not_bill=kit_item.do_not_bill,
            enable_rii=kit_item.enable_rii,
            created_by=created_by,
        )
        db.add(wo_item)
        next_item_number += 1
        items_created += 1

    await db.flush()
    return items_created, None
