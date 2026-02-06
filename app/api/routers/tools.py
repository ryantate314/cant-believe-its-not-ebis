from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID
from typing import Literal
from datetime import date

from core.database import get_db
from core.sorting import SortOrder
from schemas.city import CityBrief
from schemas.tool import (
    ToolResponse,
    ToolListResponse,
    ToolRoomBrief,
    KitFilter,
    ToolType,
)
from crud.tool import get_tools
from models.tool import ToolType as ModelToolType

router = APIRouter(prefix="/tools", tags=["tools"])

# Mapping from tool type to display code
TOOL_TYPE_CODES = {
    ModelToolType.CERTIFIED: "Cert",
    ModelToolType.REFERENCE: "Ref",
    ModelToolType.CONSUMABLE: "Cons",
    ModelToolType.KIT: "Kit",
}


def tool_to_response(tool) -> ToolResponse:
    """Convert a Tool model to a response schema."""
    # Calculate calibration due days for certified tools
    calibration_due_days = None
    if tool.tool_type == ModelToolType.CERTIFIED and tool.next_calibration_due:
        calibration_due_days = (tool.next_calibration_due - date.today()).days

    return ToolResponse(
        id=tool.uuid,
        name=tool.name,
        tool_type=ToolType(tool.tool_type.value),
        tool_type_code=TOOL_TYPE_CODES[tool.tool_type],
        description=tool.description,
        tool_room=ToolRoomBrief(
            id=tool.tool_room.uuid,
            code=tool.tool_room.code,
            name=tool.tool_room.name,
        ),
        city=CityBrief(
            id=tool.tool_room.city.uuid,
            code=tool.tool_room.city.code,
            name=tool.tool_room.city.name,
        ),
        make=tool.make,
        model=tool.model,
        serial_number=tool.serial_number,
        calibration_due_days=calibration_due_days,
        next_calibration_due=tool.next_calibration_due,
        media_count=tool.media_count,
        is_in_kit=tool.parent_kit_id is not None,
        created_at=tool.created_at,
        updated_at=tool.updated_at,
    )


@router.get("", response_model=ToolListResponse)
async def list_tools(
    city_id: UUID = Query(..., description="City UUID (required)"),
    tool_room_id: UUID | None = Query(None, description="Tool Room UUID"),
    page: int = Query(1, ge=1),
    page_size: Literal[25, 50, 100] = Query(25),
    kit_filter: KitFilter = Query(KitFilter.SHOW),
    calib_due_days: Literal[60, 90] | None = Query(
        None, description="Calibration due within N days"
    ),
    sort_by: Literal[
        "name",
        "tool_type",
        "description",
        "make",
        "model",
        "serial_number",
        "tool_room",
        "calibration_due",
        "created_at",
    ]
    | None = Query(None, description="Column to sort by"),
    sort_order: SortOrder = Query(SortOrder.ASC, description="Sort direction"),
    db: AsyncSession = Depends(get_db),
):
    """List tools for a city with filtering, sorting, and pagination."""
    tools, total = await get_tools(
        db,
        city_uuid=city_id,
        tool_room_uuid=tool_room_id,
        page=page,
        page_size=page_size,
        kit_filter=kit_filter,
        calib_due_days=calib_due_days,
        sort_by=sort_by,
        sort_order=sort_order,
    )
    return ToolListResponse(
        items=[tool_to_response(t) for t in tools],
        total=total,
        page=page,
        page_size=page_size,
    )
