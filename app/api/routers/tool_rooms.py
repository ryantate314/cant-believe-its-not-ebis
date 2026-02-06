from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID

from core.database import get_db
from schemas.tool_room import ToolRoomResponse, ToolRoomListResponse
from crud.tool_room import get_tool_rooms_by_city

router = APIRouter(prefix="/tool-rooms", tags=["tool-rooms"])


@router.get("", response_model=ToolRoomListResponse)
async def list_tool_rooms(
    city_id: UUID = Query(..., description="City UUID (required)"),
    active_only: bool = Query(True, description="Filter by active status"),
    db: AsyncSession = Depends(get_db),
):
    """List tool rooms for a city."""
    tool_rooms, total = await get_tool_rooms_by_city(
        db, city_uuid=city_id, active_only=active_only
    )
    return ToolRoomListResponse(
        items=[
            ToolRoomResponse(
                id=tr.uuid,
                code=tr.code,
                name=tr.name,
                is_active=tr.is_active,
            )
            for tr in tool_rooms
        ],
        total=total,
    )
