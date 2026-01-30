from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from uuid import UUID

from models.city import City


async def get_cities(db: AsyncSession, active_only: bool = True) -> tuple[list[City], int]:
    """Get all cities, optionally filtering by active status."""
    query = select(City)
    if active_only:
        query = query.where(City.is_active == True)
    query = query.order_by(City.name)

    result = await db.execute(query)
    cities = result.scalars().all()

    # Get total count
    count_query = select(func.count(City.id))
    if active_only:
        count_query = count_query.where(City.is_active == True)
    count_result = await db.execute(count_query)
    total = count_result.scalar()

    return list(cities), total


async def get_city_by_uuid(db: AsyncSession, city_uuid: UUID) -> City | None:
    """Get a city by its UUID."""
    query = select(City).where(City.uuid == city_uuid)
    result = await db.execute(query)
    return result.scalar_one_or_none()
