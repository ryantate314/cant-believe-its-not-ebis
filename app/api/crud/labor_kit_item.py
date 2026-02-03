from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, asc, desc
from uuid import UUID
from datetime import datetime

from models.labor_kit import LaborKit
from models.labor_kit_item import LaborKitItem
from schemas.labor_kit_item import LaborKitItemCreate, LaborKitItemUpdate
from core.sorting import SortOrder

# Allowed columns for sorting labor kit items
LABOR_KIT_ITEM_SORT_COLUMNS = {
    "item_number": LaborKitItem.item_number,
    "category": LaborKitItem.category,
    "hours_estimate": LaborKitItem.hours_estimate,
}


async def get_next_item_number(db: AsyncSession, labor_kit_id: int) -> int:
    """Get the next item number for a labor kit."""
    query = select(
        func.coalesce(func.max(LaborKitItem.item_number), 0) + 1
    ).where(LaborKitItem.labor_kit_id == labor_kit_id)
    result = await db.execute(query)
    return result.scalar()


async def get_labor_kit_items(
    db: AsyncSession,
    kit_uuid: UUID,
    sort_by: str | None = None,
    sort_order: SortOrder = SortOrder.ASC,
) -> tuple[list[LaborKitItem], int]:
    """Get all items for a labor kit."""
    # Get labor kit first
    kit_query = select(LaborKit).where(LaborKit.uuid == kit_uuid)
    kit_result = await db.execute(kit_query)
    labor_kit = kit_result.scalar_one_or_none()
    if not labor_kit:
        return [], 0

    # Get items
    query = select(LaborKitItem).where(LaborKitItem.labor_kit_id == labor_kit.id)

    # Apply sorting
    sort_column = LABOR_KIT_ITEM_SORT_COLUMNS.get(sort_by, LaborKitItem.item_number)
    if sort_order == SortOrder.ASC:
        query = query.order_by(asc(sort_column))
    else:
        query = query.order_by(desc(sort_column))

    result = await db.execute(query)
    items = result.scalars().all()

    # Get count
    count_query = select(func.count(LaborKitItem.id)).where(
        LaborKitItem.labor_kit_id == labor_kit.id
    )
    count_result = await db.execute(count_query)
    total = count_result.scalar()

    return list(items), total


async def get_labor_kit_item_by_uuid(
    db: AsyncSession, item_uuid: UUID
) -> LaborKitItem | None:
    """Get a labor kit item by its UUID."""
    query = select(LaborKitItem).where(LaborKitItem.uuid == item_uuid)
    result = await db.execute(query)
    return result.scalar_one_or_none()


async def create_labor_kit_item(
    db: AsyncSession, kit_uuid: UUID, item_in: LaborKitItemCreate
) -> LaborKitItem | None:
    """Create a new labor kit item."""
    # Get labor kit
    kit_query = select(LaborKit).where(LaborKit.uuid == kit_uuid)
    kit_result = await db.execute(kit_query)
    labor_kit = kit_result.scalar_one_or_none()
    if not labor_kit:
        return None

    # Get next item number
    item_number = await get_next_item_number(db, labor_kit.id)

    # Create item
    item = LaborKitItem(
        labor_kit_id=labor_kit.id,
        item_number=item_number,
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


async def update_labor_kit_item(
    db: AsyncSession, item_uuid: UUID, item_in: LaborKitItemUpdate
) -> LaborKitItem | None:
    """Update a labor kit item."""
    item = await get_labor_kit_item_by_uuid(db, item_uuid)
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


async def delete_labor_kit_item(db: AsyncSession, item_uuid: UUID) -> bool:
    """Delete a labor kit item."""
    item = await get_labor_kit_item_by_uuid(db, item_uuid)
    if not item:
        return False

    await db.delete(item)
    return True
