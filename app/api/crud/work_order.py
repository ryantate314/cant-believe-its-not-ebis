from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, asc, desc
from sqlalchemy.orm import selectinload
from uuid import UUID
from datetime import datetime

from models.work_order import WorkOrder
from models.city import City
from models.aircraft import Aircraft
from schemas.work_order import WorkOrderCreate, WorkOrderUpdate
from core.sorting import SortOrder

# Allowed columns for sorting work orders
WORK_ORDER_SORT_COLUMNS = {
    "work_order_number": WorkOrder.work_order_number,
    "customer_name": WorkOrder.customer_name,
    "status": WorkOrder.status,
    "priority": WorkOrder.priority,
    "created_at": WorkOrder.created_at,
}


async def get_next_sequence_number(db: AsyncSession, city_id: int) -> int:
    """Get the next sequence number for a city."""
    query = select(func.coalesce(func.max(WorkOrder.sequence_number), 0) + 1).where(
        WorkOrder.city_id == city_id
    )
    result = await db.execute(query)
    return result.scalar()


def generate_work_order_number(city_code: str, sequence: int) -> str:
    """Generate a work order number in format: KTYS00001-01-2026."""
    now = datetime.utcnow()
    month = now.month
    year = now.year
    return f"{city_code}{sequence:05d}-{month:02d}-{year}"


async def get_work_orders(
    db: AsyncSession,
    city_uuid: UUID,
    page: int = 1,
    page_size: int = 20,
    search: str | None = None,
    status: str | None = None,
    sort_by: str | None = None,
    sort_order: SortOrder = SortOrder.DESC,
) -> tuple[list[WorkOrder], int]:
    """Get work orders for a city with pagination and filtering."""
    # Get city first
    city_query = select(City).where(City.uuid == city_uuid)
    city_result = await db.execute(city_query)
    city = city_result.scalar_one_or_none()
    if not city:
        return [], 0

    # Build query
    query = (
        select(WorkOrder)
        .options(
            selectinload(WorkOrder.city),
            selectinload(WorkOrder.aircraft),
            selectinload(WorkOrder.items),
        )
        .where(WorkOrder.city_id == city.id)
    )

    # Apply filters
    if search:
        search_filter = f"%{search}%"
        query = query.join(Aircraft).where(
            WorkOrder.work_order_number.ilike(search_filter)
            | WorkOrder.customer_name.ilike(search_filter)
            | Aircraft.registration_number.ilike(search_filter)
        )

    if status:
        query = query.where(WorkOrder.status == status)

    # Get total count
    count_query = select(func.count(WorkOrder.id)).where(WorkOrder.city_id == city.id)
    if search:
        search_filter = f"%{search}%"
        count_query = count_query.join(Aircraft).where(
            WorkOrder.work_order_number.ilike(search_filter)
            | WorkOrder.customer_name.ilike(search_filter)
            | Aircraft.registration_number.ilike(search_filter)
        )
    if status:
        count_query = count_query.where(WorkOrder.status == status)
    count_result = await db.execute(count_query)
    total = count_result.scalar()

    # Apply sorting
    sort_column = WORK_ORDER_SORT_COLUMNS.get(sort_by, WorkOrder.created_at)
    if sort_order == SortOrder.ASC:
        query = query.order_by(asc(sort_column))
    else:
        query = query.order_by(desc(sort_column))

    # Apply pagination
    offset = (page - 1) * page_size
    query = query.offset(offset).limit(page_size)

    result = await db.execute(query)
    work_orders = result.scalars().all()

    return list(work_orders), total


async def get_work_order_by_uuid(db: AsyncSession, wo_uuid: UUID) -> WorkOrder | None:
    """Get a work order by its UUID."""
    query = (
        select(WorkOrder)
        .options(
            selectinload(WorkOrder.city),
            selectinload(WorkOrder.aircraft),
            selectinload(WorkOrder.items),
        )
        .where(WorkOrder.uuid == wo_uuid)
    )
    result = await db.execute(query)
    return result.scalar_one_or_none()


async def create_work_order(
    db: AsyncSession, work_order_in: WorkOrderCreate
) -> WorkOrder:
    """Create a new work order."""
    # Get city
    city_query = select(City).where(City.uuid == work_order_in.city_id)
    city_result = await db.execute(city_query)
    city = city_result.scalar_one_or_none()
    if not city:
        raise ValueError(f"City not found: {work_order_in.city_id}")

    # Get aircraft
    aircraft_query = select(Aircraft).where(Aircraft.uuid == work_order_in.aircraft_id)
    aircraft_result = await db.execute(aircraft_query)
    aircraft = aircraft_result.scalar_one_or_none()
    if not aircraft:
        raise ValueError(f"Aircraft not found: {work_order_in.aircraft_id}")

    # Get next sequence number
    sequence = await get_next_sequence_number(db, city.id)

    # Generate work order number
    wo_number = generate_work_order_number(city.code, sequence)

    # Create work order
    work_order = WorkOrder(
        work_order_number=wo_number,
        sequence_number=sequence,
        city_id=city.id,
        aircraft_id=aircraft.id,
        work_order_type=work_order_in.work_order_type,
        status=work_order_in.status,
        status_notes=work_order_in.status_notes,
        customer_name=work_order_in.customer_name,
        customer_po_number=work_order_in.customer_po_number,
        due_date=work_order_in.due_date,
        lead_technician=work_order_in.lead_technician,
        sales_person=work_order_in.sales_person,
        priority=work_order_in.priority,
        created_by=work_order_in.created_by,
    )

    db.add(work_order)
    await db.flush()
    await db.refresh(work_order, ["city", "aircraft", "items"])
    return work_order


async def update_work_order(
    db: AsyncSession, wo_uuid: UUID, work_order_in: WorkOrderUpdate
) -> WorkOrder | None:
    """Update a work order."""
    work_order = await get_work_order_by_uuid(db, wo_uuid)
    if not work_order:
        return None

    # Update fields
    update_data = work_order_in.model_dump(exclude_unset=True)

    # Handle aircraft_id UUID resolution
    if "aircraft_id" in update_data:
        aircraft_uuid = update_data.pop("aircraft_id")
        if aircraft_uuid:
            aircraft_query = select(Aircraft).where(Aircraft.uuid == aircraft_uuid)
            aircraft_result = await db.execute(aircraft_query)
            aircraft = aircraft_result.scalar_one_or_none()
            if not aircraft:
                raise ValueError(f"Aircraft not found: {aircraft_uuid}")
            update_data["aircraft_id"] = aircraft.id

    for field, value in update_data.items():
        setattr(work_order, field, value)

    work_order.updated_at = datetime.utcnow()
    await db.flush()
    await db.refresh(work_order, ["city", "aircraft", "items"])
    return work_order


async def delete_work_order(db: AsyncSession, wo_uuid: UUID) -> bool:
    """Delete a work order."""
    work_order = await get_work_order_by_uuid(db, wo_uuid)
    if not work_order:
        return False

    await db.delete(work_order)
    return True
