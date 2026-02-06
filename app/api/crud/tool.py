from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, asc, desc
from sqlalchemy.orm import selectinload
from uuid import UUID
from datetime import date, timedelta

from models.tool import Tool, ToolType
from models.tool_room import ToolRoom
from models.city import City
from schemas.tool import KitFilter
from core.sorting import SortOrder

# Allowed columns for sorting tools
TOOL_SORT_COLUMNS = {
    "name": Tool.name,
    "tool_type": Tool.tool_type,
    "description": Tool.description,
    "make": Tool.make,
    "model": Tool.model,
    "serial_number": Tool.serial_number,
    "tool_room": ToolRoom.code,
    "calibration_due": Tool.next_calibration_due,
    "created_at": Tool.created_at,
}


async def get_tools(
    db: AsyncSession,
    city_uuid: UUID,
    tool_room_uuid: UUID | None = None,
    page: int = 1,
    page_size: int = 25,
    kit_filter: KitFilter = KitFilter.SHOW,
    calib_due_days: int | None = None,
    sort_by: str | None = None,
    sort_order: SortOrder = SortOrder.ASC,
) -> tuple[list[Tool], int]:
    """Get tools for a city with pagination and filtering."""
    # Get city first
    city_query = select(City).where(City.uuid == city_uuid)
    city_result = await db.execute(city_query)
    city = city_result.scalar_one_or_none()
    if not city:
        return [], 0

    # Build base query with joins
    query = (
        select(Tool)
        .join(ToolRoom, Tool.tool_room_id == ToolRoom.id)
        .options(
            selectinload(Tool.tool_room).selectinload(ToolRoom.city),
        )
        .where(ToolRoom.city_id == city.id)
    )

    # Build count query base
    count_query = (
        select(func.count(Tool.id))
        .join(ToolRoom, Tool.tool_room_id == ToolRoom.id)
        .where(ToolRoom.city_id == city.id)
    )

    # Filter by tool room if specified
    if tool_room_uuid:
        tool_room_subquery = select(ToolRoom.id).where(ToolRoom.uuid == tool_room_uuid)
        query = query.where(Tool.tool_room_id.in_(tool_room_subquery))
        count_query = count_query.where(Tool.tool_room_id.in_(tool_room_subquery))

    # Kit filter - hide tools that are inside kits
    if kit_filter == KitFilter.HIDE:
        query = query.where(Tool.parent_kit_id.is_(None))
        count_query = count_query.where(Tool.parent_kit_id.is_(None))

    # Calibration due filter - only for certified tools
    if calib_due_days is not None:
        due_date = date.today() + timedelta(days=calib_due_days)
        query = query.where(
            Tool.tool_type == ToolType.CERTIFIED,
            Tool.next_calibration_due <= due_date,
        )
        count_query = count_query.where(
            Tool.tool_type == ToolType.CERTIFIED,
            Tool.next_calibration_due <= due_date,
        )

    # Get total count
    count_result = await db.execute(count_query)
    total = count_result.scalar()

    # Apply sorting
    sort_column = TOOL_SORT_COLUMNS.get(sort_by, Tool.name)
    if sort_order == SortOrder.ASC:
        query = query.order_by(asc(sort_column))
    else:
        query = query.order_by(desc(sort_column))

    # Apply pagination
    offset = (page - 1) * page_size
    query = query.offset(offset).limit(page_size)

    result = await db.execute(query)
    tools = result.scalars().all()

    return list(tools), total


async def get_tool_by_uuid(db: AsyncSession, tool_uuid: UUID) -> Tool | None:
    """Get a tool by its UUID with eager-loaded relationships."""
    query = (
        select(Tool)
        .options(
            selectinload(Tool.tool_room).selectinload(ToolRoom.city),
            selectinload(Tool.parent_kit),
            selectinload(Tool.kit_tools),
        )
        .where(Tool.uuid == tool_uuid)
    )
    result = await db.execute(query)
    return result.scalar_one_or_none()
