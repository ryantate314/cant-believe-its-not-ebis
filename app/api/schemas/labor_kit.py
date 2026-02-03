from pydantic import BaseModel
from uuid import UUID
from datetime import datetime


class LaborKitBase(BaseModel):
    """Base schema for labor kit fields."""

    name: str
    description: str | None = None
    category: str | None = None
    is_active: bool = True


class LaborKitCreate(LaborKitBase):
    """Schema for creating a labor kit."""

    created_by: str | None = None  # Set by backend from auth token


class LaborKitUpdate(BaseModel):
    """Schema for updating a labor kit."""

    name: str | None = None
    description: str | None = None
    category: str | None = None
    is_active: bool | None = None
    updated_by: str | None = None


class LaborKitResponse(BaseModel):
    """Response schema for a labor kit."""

    id: UUID
    name: str
    description: str | None
    category: str | None
    is_active: bool

    # Audit
    created_by: str
    updated_by: str | None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class LaborKitListResponse(BaseModel):
    """Response schema for a list of labor kits."""

    items: list[LaborKitResponse]
    total: int


class ApplyLaborKitResponse(BaseModel):
    """Response schema for applying a labor kit to a work order."""

    items_created: int
    work_order_id: UUID
    labor_kit_id: UUID
