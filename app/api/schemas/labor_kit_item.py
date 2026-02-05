from pydantic import BaseModel
from uuid import UUID
from datetime import datetime
from decimal import Decimal


class LaborKitItemBase(BaseModel):
    """Base schema for labor kit item fields."""

    discrepancy: str | None = None
    corrective_action: str | None = None
    notes: str | None = None
    category: str | None = None
    sub_category: str | None = None
    ata_code: str | None = None
    hours_estimate: Decimal | None = None
    billing_method: str = "hourly"
    flat_rate: Decimal | None = None
    department: str | None = None
    do_not_bill: bool = False
    enable_rii: bool = False


class LaborKitItemCreate(LaborKitItemBase):
    """Schema for creating a labor kit item."""

    created_by: str


class LaborKitItemUpdate(BaseModel):
    """Schema for updating a labor kit item."""

    discrepancy: str | None = None
    corrective_action: str | None = None
    notes: str | None = None
    category: str | None = None
    sub_category: str | None = None
    ata_code: str | None = None
    hours_estimate: Decimal | None = None
    billing_method: str | None = None
    flat_rate: Decimal | None = None
    department: str | None = None
    do_not_bill: bool | None = None
    enable_rii: bool | None = None
    updated_by: str | None = None


class LaborKitItemResponse(BaseModel):
    """Response schema for a labor kit item."""

    id: UUID
    labor_kit_id: UUID
    item_number: int
    discrepancy: str | None
    corrective_action: str | None
    notes: str | None
    category: str | None
    sub_category: str | None
    ata_code: str | None
    hours_estimate: Decimal | None
    billing_method: str
    flat_rate: Decimal | None
    department: str | None
    do_not_bill: bool
    enable_rii: bool

    # Audit
    created_by: str
    updated_by: str | None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class LaborKitItemListResponse(BaseModel):
    """Response schema for a list of labor kit items."""

    items: list[LaborKitItemResponse]
    total: int
