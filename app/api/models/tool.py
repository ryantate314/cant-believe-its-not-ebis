from typing import TYPE_CHECKING

from sqlalchemy import String, Integer, ForeignKey, Date, Enum, Numeric
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from datetime import datetime, date
from decimal import Decimal
from uuid import UUID, uuid4
import enum

from core.database import Base

if TYPE_CHECKING:
    from models.tool_room import ToolRoom


class ToolType(str, enum.Enum):
    CERTIFIED = "certified"
    REFERENCE = "reference"
    CONSUMABLE = "consumable"
    KIT = "kit"


class ToolGroup(str, enum.Enum):
    IN_SERVICE = "in_service"
    OUT_OF_SERVICE = "out_of_service"
    LOST = "lost"
    RETIRED = "retired"


class Tool(Base):
    __tablename__ = "tool"

    id: Mapped[int] = mapped_column(primary_key=True)
    uuid: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True), unique=True, default=uuid4
    )
    name: Mapped[str] = mapped_column(String(200))
    tool_type: Mapped[ToolType] = mapped_column(
        Enum(
            ToolType,
            name="tool_type",
            create_type=False,
            values_callable=lambda e: [x.value for x in e],
        )
    )
    description: Mapped[str | None] = mapped_column(String(255))
    details: Mapped[str | None] = mapped_column(String(255))
    tool_room_id: Mapped[int] = mapped_column(ForeignKey("tool_room.id"))
    tool_group: Mapped[ToolGroup] = mapped_column(
        Enum(
            ToolGroup,
            name="tool_group",
            create_type=False,
            values_callable=lambda e: [x.value for x in e],
        ),
        default=ToolGroup.IN_SERVICE,
    )
    parent_kit_id: Mapped[int | None] = mapped_column(ForeignKey("tool.id"))
    make: Mapped[str | None] = mapped_column(String(100))
    model: Mapped[str | None] = mapped_column(String(100))
    serial_number: Mapped[str | None] = mapped_column(String(100))
    location: Mapped[str | None] = mapped_column(String(100))
    location_notes: Mapped[str | None] = mapped_column(String(255))
    tool_cost: Mapped[Decimal | None] = mapped_column(Numeric(10, 2))
    purchase_date: Mapped[date | None] = mapped_column(Date)
    date_labeled: Mapped[date | None] = mapped_column(Date)
    calibration_days: Mapped[int | None] = mapped_column(Integer)
    calibration_notes: Mapped[str | None] = mapped_column(String(4000))
    calibration_cost: Mapped[Decimal | None] = mapped_column(Numeric(10, 2))
    last_calibration_date: Mapped[date | None] = mapped_column(Date)
    next_calibration_due: Mapped[date | None] = mapped_column(Date)
    vendor_name: Mapped[str | None] = mapped_column(String(200))
    media_count: Mapped[int] = mapped_column(Integer, default=0)
    created_by: Mapped[str | None] = mapped_column(String(100))
    updated_by: Mapped[str | None] = mapped_column(String(100))
    created_at: Mapped[datetime] = mapped_column(default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        default=datetime.utcnow, onupdate=datetime.utcnow
    )

    # Relationships
    tool_room: Mapped["ToolRoom"] = relationship("ToolRoom", back_populates="tools")
    parent_kit: Mapped["Tool | None"] = relationship(
        "Tool", remote_side="Tool.id", back_populates="kit_tools"
    )
    kit_tools: Mapped[list["Tool"]] = relationship(
        "Tool", back_populates="parent_kit"
    )
