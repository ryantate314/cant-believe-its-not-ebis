from typing import TYPE_CHECKING

from sqlalchemy import String, Boolean, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from datetime import datetime
from uuid import UUID, uuid4

from core.database import Base

if TYPE_CHECKING:
    from models.city import City
    from models.tool import Tool


class ToolRoom(Base):
    __tablename__ = "tool_room"

    id: Mapped[int] = mapped_column(primary_key=True)
    uuid: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True), unique=True, default=uuid4
    )
    city_id: Mapped[int] = mapped_column(ForeignKey("city.id"))
    code: Mapped[str] = mapped_column(String(20))
    name: Mapped[str] = mapped_column(String(100))
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        default=datetime.utcnow, onupdate=datetime.utcnow
    )

    # Relationships
    city: Mapped["City"] = relationship("City", back_populates="tool_rooms")
    tools: Mapped[list["Tool"]] = relationship("Tool", back_populates="tool_room")
