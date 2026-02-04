"""WorkOrder model with audit tracking."""

from datetime import date, datetime
from uuid import UUID, uuid4
import enum

from sqlalchemy import Date, DateTime, Enum, ForeignKey, Integer, String, func
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from core.audit import AuditableMixin
from models.base import Base


class WorkOrderStatus(str, enum.Enum):
    CREATED = "created"
    SCHEDULED = "scheduled"
    OPEN = "open"
    IN_PROGRESS = "in_progress"
    TRACKING = "tracking"
    PENDING = "pending"
    IN_REVIEW = "in_review"
    COMPLETED = "completed"
    VOID = "void"


class PriorityLevel(str, enum.Enum):
    LOW = "low"
    NORMAL = "normal"
    HIGH = "high"
    URGENT = "urgent"


class WorkOrderType(str, enum.Enum):
    WORK_ORDER = "work_order"
    QUOTE = "quote"


class WorkOrder(Base, AuditableMixin):
    """Work order entity model with audit tracking."""

    __tablename__ = "work_order"

    # Primary key
    id: Mapped[int] = mapped_column(Integer, primary_key=True)

    # UUID for API identification
    uuid: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        unique=True,
        server_default=func.gen_random_uuid(),
        default=uuid4,
        nullable=False,
    )

    # Work order identification
    work_order_number: Mapped[str] = mapped_column(String(20), unique=True, nullable=False)
    sequence_number: Mapped[int] = mapped_column(Integer, nullable=False)

    # Foreign keys
    city_id: Mapped[int] = mapped_column(ForeignKey("city.id"), nullable=False)
    aircraft_id: Mapped[int] = mapped_column(ForeignKey("aircraft.id"), nullable=False)

    # Work order type and status
    work_order_type: Mapped[WorkOrderType] = mapped_column(
        Enum(
            WorkOrderType,
            name="work_order_type",
            create_type=False,
            values_callable=lambda e: [x.value for x in e],
        ),
        server_default="work_order",
        default=WorkOrderType.WORK_ORDER,
    )
    status: Mapped[WorkOrderStatus] = mapped_column(
        Enum(
            WorkOrderStatus,
            name="work_order_status",
            create_type=False,
            values_callable=lambda e: [x.value for x in e],
        ),
        server_default="created",
        default=WorkOrderStatus.CREATED,
    )
    status_notes: Mapped[str | None] = mapped_column(String(255), nullable=True)

    # Customer (denormalized for POC)
    customer_name: Mapped[str | None] = mapped_column(String(200), nullable=True)
    customer_po_number: Mapped[str | None] = mapped_column(String(50), nullable=True)

    # Dates
    due_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    created_date: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        default=datetime.utcnow,
    )
    completed_date: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    # Assignment
    lead_technician: Mapped[str | None] = mapped_column(String(100), nullable=True)
    sales_person: Mapped[str | None] = mapped_column(String(100), nullable=True)
    priority: Mapped[PriorityLevel] = mapped_column(
        Enum(
            PriorityLevel,
            name="priority_level",
            create_type=False,
            values_callable=lambda e: [x.value for x in e],
        ),
        server_default="normal",
        default=PriorityLevel.NORMAL,
    )

    # Audit fields
    created_by: Mapped[str] = mapped_column(String(100), nullable=False)
    updated_by: Mapped[str | None] = mapped_column(String(100), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        default=datetime.utcnow,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        default=datetime.utcnow,
        onupdate=func.now(),
    )

    # Relationships
    city: Mapped["City"] = relationship("City", back_populates="work_orders")
    aircraft: Mapped["Aircraft"] = relationship("Aircraft", back_populates="work_orders")
    items: Mapped[list["WorkOrderItem"]] = relationship(
        "WorkOrderItem", back_populates="work_order", cascade="all, delete-orphan"
    )
