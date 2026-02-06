from pydantic import BaseModel
from uuid import UUID


class ToolRoomResponse(BaseModel):
    """Response schema for a tool room."""

    id: UUID
    code: str
    name: str
    is_active: bool

    class Config:
        from_attributes = True


class ToolRoomListResponse(BaseModel):
    """Response schema for a list of tool rooms."""

    items: list[ToolRoomResponse]
    total: int
