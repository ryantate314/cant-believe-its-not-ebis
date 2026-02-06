from pydantic import BaseModel
from uuid import UUID
from datetime import datetime, date
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


class ToolListResponse(BaseModel):
    items: list[ToolResponse]
    total: int
    page: int
    page_size: int
