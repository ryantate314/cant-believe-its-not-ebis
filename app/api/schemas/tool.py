from pydantic import BaseModel
from uuid import UUID
from datetime import datetime, date
from decimal import Decimal
from enum import Enum

from schemas.city import CityBrief


class ToolType(str, Enum):
    CERTIFIED = "certified"
    REFERENCE = "reference"
    CONSUMABLE = "consumable"
    KIT = "kit"


class ToolGroup(str, Enum):
    IN_SERVICE = "in_service"
    OUT_OF_SERVICE = "out_of_service"
    LOST = "lost"
    RETIRED = "retired"


class KitFilter(str, Enum):
    HIDE = "hide"  # Hide tools in kits
    SHOW = "show"  # Show tools in kits


# Brief schemas for nested responses
class ToolRoomBrief(BaseModel):
    id: UUID
    code: str
    name: str

    class Config:
        from_attributes = True


# Response schemas
class ToolResponse(BaseModel):
    id: UUID
    name: str
    tool_type: ToolType
    tool_type_code: str  # "Cert", "Ref", "Cons", "Kit"
    description: str | None
    tool_room: ToolRoomBrief
    city: CityBrief
    make: str | None
    model: str | None
    serial_number: str | None
    calibration_due_days: int | None  # Days until due (negative = overdue)
    next_calibration_due: date | None
    media_count: int
    is_in_kit: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ToolBrief(BaseModel):
    id: UUID
    name: str
    tool_type: ToolType
    tool_type_code: str

    class Config:
        from_attributes = True


class ToolDetailResponse(BaseModel):
    id: UUID
    name: str
    tool_type: ToolType
    tool_type_code: str
    description: str | None
    details: str | None
    tool_group: ToolGroup
    tool_room: ToolRoomBrief
    city: CityBrief
    make: str | None
    model: str | None
    serial_number: str | None
    location: str | None
    location_notes: str | None
    tool_cost: Decimal | None
    purchase_date: date | None
    date_labeled: date | None
    vendor_name: str | None
    calibration_days: int | None
    calibration_notes: str | None
    calibration_cost: Decimal | None
    last_calibration_date: date | None
    calibration_due_days: int | None
    next_calibration_due: date | None
    media_count: int
    is_in_kit: bool
    parent_kit: ToolBrief | None
    kit_tools: list[ToolBrief]
    created_by: str | None
    updated_by: str | None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ToolCreate(BaseModel):
    name: str
    tool_type: ToolType
    tool_room_id: UUID
    description: str | None = None
    created_by: str


class ToolListResponse(BaseModel):
    items: list[ToolResponse]
    total: int
    page: int
    page_size: int
