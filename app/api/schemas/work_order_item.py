from pydantic import BaseModel
from uuid import UUID
from datetime import datetime
from decimal import Decimal
from enum import Enum


class WorkOrderItemStatus(str, Enum):
    OPEN = "open"
    WAITING_FOR_PARTS = "waiting_for_parts"
    IN_PROGRESS = "in_progress"
    TECH_REVIEW = "tech_review"
    ADMIN_REVIEW = "admin_review"
    FINISHED = "finished"


class WorkOrderItemBase(BaseModel):
    """Base schema for work order item fields."""

    status: WorkOrderItemStatus = WorkOrderItemStatus.OPEN
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


class WorkOrderItemCreate(WorkOrderItemBase):
    """Schema for creating a work order item."""

    created_by: str


class WorkOrderItemUpdate(BaseModel):
    """Schema for updating a work order item."""

    status: WorkOrderItemStatus | None = None
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


class WorkOrderItemResponse(BaseModel):
    """Response schema for a work order item."""

    id: UUID
    work_order_id: UUID
    item_number: int
    status: WorkOrderItemStatus
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


class WorkOrderItemListResponse(BaseModel):
    """Response schema for a list of work order items."""

    items: list[WorkOrderItemResponse]
    total: int
