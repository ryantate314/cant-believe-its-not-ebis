from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import get_db
from schemas.dashboard import WorkOrderCountsByCityResponse
from crud.dashboard import get_open_work_order_counts_by_city

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get(
    "/work-order-counts-by-city",
    response_model=WorkOrderCountsByCityResponse,
    operation_id="getWorkOrderCountsByCity",
)
async def get_work_order_counts_by_city(
    db: AsyncSession = Depends(get_db),
):
    """Get count of open work orders grouped by city."""
    counts = await get_open_work_order_counts_by_city(db)
    return WorkOrderCountsByCityResponse(items=counts)
