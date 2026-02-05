from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from models.work_order import WorkOrder, WorkOrderStatus
from models.city import City
from schemas.dashboard import CityWorkOrderCount


async def get_open_work_order_counts_by_city(
    db: AsyncSession,
) -> list[CityWorkOrderCount]:
    """Get count of open work orders grouped by city."""
    query = (
        select(
            City.uuid.label("city_id"),
            City.code.label("city_code"),
            City.name.label("city_name"),
            func.count(WorkOrder.id).label("open_count"),
        )
        .join(WorkOrder, WorkOrder.city_id == City.id)
        .where(WorkOrder.status.not_in(WorkOrderStatus.terminal_statuses()))
        .group_by(City.uuid, City.code, City.name)
        .order_by(func.count(WorkOrder.id).desc())
    )

    result = await db.execute(query)
    rows = result.all()

    return [
        CityWorkOrderCount(
            city_id=row.city_id,
            city_code=row.city_code,
            city_name=row.city_name,
            open_count=row.open_count,
        )
        for row in rows
    ]
