from sqlalchemy import String, Integer, ForeignKey, Date, Enum
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from datetime import datetime, date
from decimal import Decimal
from uuid import UUID, uuid4
import enum

from core.database import Base


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


class WorkOrder(Base):
    __tablename__ = "work_order"

    id: Mapped[int] = mapped_column(primary_key=True)
    uuid: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True), unique=True, default=uuid4
    )
    work_order_number: Mapped[str] = mapped_column(String(20), unique=True)
    sequence_number: Mapped[int] = mapped_column(Integer)
    city_id: Mapped[int] = mapped_column(ForeignKey("city.id"))
    work_order_type: Mapped[WorkOrderType] = mapped_column(
        Enum(
            WorkOrderType,
            name="work_order_type",
            create_type=False,
            values_callable=lambda e: [x.value for x in e],
        ),
        default=WorkOrderType.WORK_ORDER,
    )
    status: Mapped[WorkOrderStatus] = mapped_column(
        Enum(
            WorkOrderStatus,
            name="work_order_status",
            create_type=False,
            values_callable=lambda e: [x.value for x in e],
        ),
        default=WorkOrderStatus.CREATED,
    )
    status_notes: Mapped[str | None] = mapped_column(String(255))

    # Aircraft (denormalized for POC)
    aircraft_registration: Mapped[str | None] = mapped_column(String(20))
    aircraft_serial: Mapped[str | None] = mapped_column(String(50))
    aircraft_make: Mapped[str | None] = mapped_column(String(50))
    aircraft_model: Mapped[str | None] = mapped_column(String(50))
    aircraft_year: Mapped[int | None] = mapped_column(Integer)

    # Customer (denormalized for POC)
    customer_name: Mapped[str | None] = mapped_column(String(200))
    customer_po_number: Mapped[str | None] = mapped_column(String(50))

    # Dates
    due_date: Mapped[date | None] = mapped_column(Date)
    created_date: Mapped[datetime] = mapped_column(default=datetime.utcnow)
    completed_date: Mapped[datetime | None] = mapped_column()

    # Assignment
    lead_technician: Mapped[str | None] = mapped_column(String(100))
    sales_person: Mapped[str | None] = mapped_column(String(100))
    priority: Mapped[PriorityLevel] = mapped_column(
        Enum(
            PriorityLevel,
            name="priority_level",
            create_type=False,
            values_callable=lambda e: [x.value for x in e],
        ),
        default=PriorityLevel.NORMAL,
    )

    # Audit
    created_by: Mapped[str] = mapped_column(String(100))
    updated_by: Mapped[str | None] = mapped_column(String(100))
    created_at: Mapped[datetime] = mapped_column(default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        default=datetime.utcnow, onupdate=datetime.utcnow
    )

    # Relationships
    city: Mapped["City"] = relationship("City", back_populates="work_orders")
    items: Mapped[list["WorkOrderItem"]] = relationship(
        "WorkOrderItem", back_populates="work_order", cascade="all, delete-orphan"
    )
