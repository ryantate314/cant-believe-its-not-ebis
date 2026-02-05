from pydantic import BaseModel
from uuid import UUID
from datetime import datetime


class CustomerBase(BaseModel):
    """Base schema for customer fields."""

    name: str
    email: str | None = None
    phone: str | None = None
    phone_type: str | None = None
    address: str | None = None
    address_2: str | None = None
    city: str | None = None
    state: str | None = None
    zip: str | None = None
    country: str | None = None
    notes: str | None = None
    is_active: bool = True


class CustomerCreate(CustomerBase):
    """Schema for creating a customer."""

    created_by: str


class CustomerUpdate(BaseModel):
    """Schema for updating a customer."""

    name: str | None = None
    email: str | None = None
    phone: str | None = None
    phone_type: str | None = None
    address: str | None = None
    address_2: str | None = None
    city: str | None = None
    state: str | None = None
    zip: str | None = None
    country: str | None = None
    notes: str | None = None
    is_active: bool | None = None
    updated_by: str | None = None


class CustomerResponse(BaseModel):
    """Response schema for a customer."""

    id: UUID
    name: str
    email: str | None
    phone: str | None
    phone_type: str | None
    address: str | None
    address_2: str | None
    city: str | None
    state: str | None
    zip: str | None
    country: str | None
    notes: str | None
    is_active: bool

    # Audit
    created_by: str
    updated_by: str | None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class CustomerListResponse(BaseModel):
    """Response schema for a list of customers."""

    items: list[CustomerResponse]
    total: int
    page: int
    page_size: int
