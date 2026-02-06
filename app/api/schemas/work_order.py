from pydantic import BaseModel, Field
from uuid import UUID
from datetime import datetime, date
from decimal import Decimal
from enum import Enum

from schemas.city import CityBrief


class WorkOrderStatus(str, Enum):
    CREATED = "created"
    SCHEDULED = "scheduled"
    OPEN = "open"
    IN_PROGRESS = "in_progress"
    TRACKING = "tracking"
    PENDING = "pending"
    IN_REVIEW = "in_review"
    COMPLETED = "completed"
    VOID = "void"


class PriorityLevel(str, Enum):
    LOW = "low"
    NORMAL = "normal"
    HIGH = "high"
    URGENT = "urgent"


class WorkOrderType(str, Enum):
    WORK_ORDER = "work_order"
    QUOTE = "quote"


class WorkOrderBase(BaseModel):
    """Base schema for work order fields."""

    work_order_type: WorkOrderType = WorkOrderType.WORK_ORDER
    status: WorkOrderStatus = WorkOrderStatus.CREATED
    status_notes: str | None = None

    # Customer
    customer_name: str | None = None
    customer_po_number: str | None = None

    # Dates
    due_date: date | None = None

    # Assignment
    lead_technician: str | None = None
    sales_person: str | None = None
    priority: PriorityLevel = PriorityLevel.NORMAL


class WorkOrderCreate(WorkOrderBase):
    """Schema for creating a work order."""

    city_id: UUID
    aircraft_id: UUID
    created_by: str


class WorkOrderUpdate(BaseModel):
    """Schema for updating a work order."""

    work_order_type: WorkOrderType | None = None
    status: WorkOrderStatus | None = None
    status_notes: str | None = None

    # Aircraft
    aircraft_id: UUID | None = None

    # Customer
    customer_name: str | None = None
    customer_po_number: str | None = None

    # Dates
    due_date: date | None = None

    # Assignment
    lead_technician: str | None = None
    sales_person: str | None = None
    priority: PriorityLevel | None = None

    updated_by: str | None = None


class AircraftBrief(BaseModel):
    """Brief aircraft info for work order response."""

    id: UUID
    registration_number: str
    serial_number: str | None
    make: str | None
    model: str | None
    year_built: int | None

    class Config:
        from_attributes = True


class WorkOrderResponse(BaseModel):
    """Response schema for a work order."""

    id: UUID
    work_order_number: str
    sequence_number: int
    city: CityBrief
    aircraft: AircraftBrief
    work_order_type: WorkOrderType
    status: WorkOrderStatus
    status_notes: str | None

    # Customer
    customer_name: str | None
    customer_po_number: str | None

    # Dates
    due_date: date | None
    created_date: datetime
    completed_date: datetime | None

    # Assignment
    lead_technician: str | None
    sales_person: str | None
    priority: PriorityLevel

    # Audit
    created_by: str
    updated_by: str | None
    created_at: datetime
    updated_at: datetime

    # Item count
    item_count: int = 0

    class Config:
        from_attributes = True


class WorkOrderListResponse(BaseModel):
    """Response schema for a list of work orders."""

    items: list[WorkOrderResponse]
    total: int
    page: int
    page_size: int
