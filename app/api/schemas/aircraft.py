from pydantic import BaseModel
from uuid import UUID
from datetime import datetime


class AircraftBase(BaseModel):
    """Base schema for aircraft fields."""

    registration_number: str
    serial_number: str | None = None
    make: str | None = None
    model: str | None = None
    year_built: int | None = None
    meter_profile: str | None = None
    customer_name: str | None = None
    aircraft_class: str | None = None
    fuel_code: str | None = None
    notes: str | None = None
    is_active: bool = True


class AircraftCreate(AircraftBase):
    """Schema for creating an aircraft."""

    primary_city_id: UUID | None = None
    created_by: str | None = None  # Set by backend from auth token


class AircraftUpdate(BaseModel):
    """Schema for updating an aircraft."""

    registration_number: str | None = None
    serial_number: str | None = None
    make: str | None = None
    model: str | None = None
    year_built: int | None = None
    meter_profile: str | None = None
    primary_city_id: UUID | None = None
    customer_name: str | None = None
    aircraft_class: str | None = None
    fuel_code: str | None = None
    notes: str | None = None
    is_active: bool | None = None
    updated_by: str | None = None


class CityBrief(BaseModel):
    """Brief city info for aircraft response."""

    id: UUID
    code: str
    name: str

    class Config:
        from_attributes = True


class AircraftResponse(BaseModel):
    """Response schema for an aircraft."""

    id: UUID
    registration_number: str
    serial_number: str | None
    make: str | None
    model: str | None
    year_built: int | None
    meter_profile: str | None
    primary_city: CityBrief | None
    customer_name: str | None
    aircraft_class: str | None
    fuel_code: str | None
    notes: str | None
    is_active: bool

    # Audit
    created_by: str
    updated_by: str | None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class AircraftListResponse(BaseModel):
    """Response schema for a list of aircraft."""

    items: list[AircraftResponse]
    total: int
    page: int
    page_size: int
