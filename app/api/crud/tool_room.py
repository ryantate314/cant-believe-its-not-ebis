from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from uuid import UUID

from models.tool_room import ToolRoom
from models.city import City


async def get_tool_rooms_by_city(
    db: AsyncSession, city_uuid: UUID, active_only: bool = True
) -> tuple[list[ToolRoom], int]:
    """Get tool rooms for a city, optionally filtering by active status."""
    # Get city first
    city_query = select(City).where(City.uuid == city_uuid)
    city_result = await db.execute(city_query)
    city = city_result.scalar_one_or_none()
    if not city:
        return [], 0

    query = select(ToolRoom).where(ToolRoom.city_id == city.id)
    count_query = select(func.count(ToolRoom.id)).where(ToolRoom.city_id == city.id)

    if active_only:
        query = query.where(ToolRoom.is_active == True)
        count_query = count_query.where(ToolRoom.is_active == True)

    query = query.order_by(ToolRoom.name)

    result = await db.execute(query)
    tool_rooms = result.scalars().all()

    count_result = await db.execute(count_query)
    total = count_result.scalar()

    return list(tool_rooms), total
