from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, asc, desc
from sqlalchemy.orm import selectinload
from uuid import UUID
from datetime import date, timedelta

from models.tool import Tool, ToolType, ToolGroup
from models.tool_room import ToolRoom
from models.city import City
from schemas.tool import KitFilter, ToolCreate
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


async def create_tool(db: AsyncSession, tool_in: ToolCreate) -> Tool:
    """Create a new tool."""
    # Resolve tool_room UUID to the ToolRoom row
    query = select(ToolRoom).where(ToolRoom.uuid == tool_in.tool_room_id)
    result = await db.execute(query)
    tool_room = result.scalar_one_or_none()
    if not tool_room:
        raise ValueError(f"Tool room not found: {tool_in.tool_room_id}")

    # Map schema enum to model enum
    model_tool_type = ToolType(tool_in.tool_type.value)

    tool = Tool(
        name=tool_in.name,
        tool_type=model_tool_type,
        tool_room_id=tool_room.id,
        tool_group=ToolGroup.IN_SERVICE,
        description=tool_in.description,
        media_count=0,
        created_by=tool_in.created_by,
    )
    db.add(tool)
    await db.flush()
    await db.refresh(
        tool,
        attribute_names=["tool_room", "parent_kit", "kit_tools"],
    )
    # Eager-load city through tool_room
    await db.refresh(tool.tool_room, attribute_names=["city"])
    return tool
