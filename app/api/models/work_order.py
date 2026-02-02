"""WorkOrder model with audit tracking."""

from datetime import date, datetime
from uuid import UUID

from sqlalchemy import Date, DateTime, Enum as SQLEnum, ForeignKey, Integer, String, func
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column

from core.audit import AuditableMixin
from models.base import Base


class WorkOrder(Base, AuditableMixin):
    """Work order entity model."""

    __tablename__ = "work_order"

    # Primary key
    id: Mapped[int] = mapped_column(Integer, primary_key=True)

    # UUID for API identification
    uuid: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        unique=True,
        server_default=func.gen_random_uuid(),
        nullable=False,
    )

    # Work order identification
    work_order_number: Mapped[str] = mapped_column(String(20), unique=True, nullable=False)
    sequence_number: Mapped[int] = mapped_column(Integer, nullable=False)

    # Foreign keys
    city_id: Mapped[int] = mapped_column(ForeignKey("city.id"), nullable=False)

    # Work order type and status (enums defined in V001 migration)
    work_order_type: Mapped[str] = mapped_column(
        SQLEnum("work_order", "warranty_claim", name="work_order_type", create_type=False),
        server_default="work_order",
    )
    status: Mapped[str] = mapped_column(
        SQLEnum(
            "created",
            "scheduled",
            "in_progress",
            "on_hold",
            "completed",
            "cancelled",
            "invoiced",
            name="work_order_status",
            create_type=False,
        ),
        server_default="created",
    )
    status_notes: Mapped[str | None] = mapped_column(String(255), nullable=True)

    # Aircraft (denormalized for POC)
    aircraft_registration: Mapped[str | None] = mapped_column(String(20), nullable=True)
    aircraft_serial: Mapped[str | None] = mapped_column(String(50), nullable=True)
    aircraft_make: Mapped[str | None] = mapped_column(String(50), nullable=True)
    aircraft_model: Mapped[str | None] = mapped_column(String(50), nullable=True)
    aircraft_year: Mapped[int | None] = mapped_column(Integer, nullable=True)

    # Customer (denormalized for POC)
    customer_name: Mapped[str | None] = mapped_column(String(200), nullable=True)
    customer_po_number: Mapped[str | None] = mapped_column(String(50), nullable=True)

    # Dates
    due_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    created_date: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
    )
    completed_date: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    # Assignment
    lead_technician: Mapped[str | None] = mapped_column(String(100), nullable=True)
    sales_person: Mapped[str | None] = mapped_column(String(100), nullable=True)
    priority: Mapped[str] = mapped_column(
        SQLEnum("low", "normal", "high", "urgent", name="priority_level", create_type=False),
        server_default="normal",
    )

    # Audit fields (from existing schema)
    created_by: Mapped[str] = mapped_column(String(100), nullable=False)
    updated_by: Mapped[str | None] = mapped_column(String(100), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
    )
