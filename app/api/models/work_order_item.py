from sqlalchemy import String, Integer, ForeignKey, Boolean, Numeric, Enum
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from datetime import datetime
from decimal import Decimal
from uuid import UUID, uuid4
import enum

from core.database import Base


class WorkOrderItemStatus(str, enum.Enum):
    OPEN = "open"
    WAITING_FOR_PARTS = "waiting_for_parts"
    IN_PROGRESS = "in_progress"
    TECH_REVIEW = "tech_review"
    ADMIN_REVIEW = "admin_review"
    FINISHED = "finished"


class WorkOrderItem(Base):
    __tablename__ = "work_order_item"

    id: Mapped[int] = mapped_column(primary_key=True)
    uuid: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True), unique=True, default=uuid4
    )
    work_order_id: Mapped[int] = mapped_column(ForeignKey("work_order.id", ondelete="CASCADE"))
    item_number: Mapped[int] = mapped_column(Integer)
    status: Mapped[WorkOrderItemStatus] = mapped_column(
        Enum(WorkOrderItemStatus, name="work_order_item_status", create_type=False),
        default=WorkOrderItemStatus.OPEN,
    )
    discrepancy: Mapped[str | None] = mapped_column(String(4000))
    corrective_action: Mapped[str | None] = mapped_column(String(8000))
    notes: Mapped[str | None] = mapped_column(String(4000))
    category: Mapped[str | None] = mapped_column(String(100))
    sub_category: Mapped[str | None] = mapped_column(String(100))
    ata_code: Mapped[str | None] = mapped_column(String(20))
    hours_estimate: Mapped[Decimal | None] = mapped_column(Numeric(8, 2))
    billing_method: Mapped[str] = mapped_column(String(20), default="hourly")
    flat_rate: Mapped[Decimal | None] = mapped_column(Numeric(10, 2))
    department: Mapped[str | None] = mapped_column(String(50))
    do_not_bill: Mapped[bool] = mapped_column(Boolean, default=False)
    enable_rii: Mapped[bool] = mapped_column(Boolean, default=False)

    # Audit
    created_by: Mapped[str] = mapped_column(String(100))
    updated_by: Mapped[str | None] = mapped_column(String(100))
    created_at: Mapped[datetime] = mapped_column(default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        default=datetime.utcnow, onupdate=datetime.utcnow
    )

    # Relationships
    work_order: Mapped["WorkOrder"] = relationship("WorkOrder", back_populates="items")
