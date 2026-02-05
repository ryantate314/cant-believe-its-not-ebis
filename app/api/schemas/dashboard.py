from pydantic import BaseModel
from uuid import UUID


class CityWorkOrderCount(BaseModel):
    """Work order count for a specific city."""

    city_id: UUID
    city_code: str
    city_name: str
    open_count: int


class WorkOrderCountsByCityResponse(BaseModel):
    """Response schema for work order counts by city."""

    items: list[CityWorkOrderCount]
