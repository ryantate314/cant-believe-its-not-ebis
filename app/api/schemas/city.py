from pydantic import BaseModel
from uuid import UUID
from datetime import datetime


class CityResponse(BaseModel):
    """Response schema for a city."""

    id: UUID
    code: str
    name: str
    is_active: bool

    class Config:
        from_attributes = True


class CityListResponse(BaseModel):
    """Response schema for a list of cities."""

    items: list[CityResponse]
    total: int
