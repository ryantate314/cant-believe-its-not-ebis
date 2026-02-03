from sqlalchemy import String, Integer, ForeignKey, Boolean, Numeric
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from datetime import datetime
from decimal import Decimal
from uuid import UUID, uuid4

from core.database import Base


class LaborKitItem(Base):
    __tablename__ = "labor_kit_item"

    id: Mapped[int] = mapped_column(primary_key=True)
    uuid: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True), unique=True, default=uuid4
    )
    labor_kit_id: Mapped[int] = mapped_column(ForeignKey("labor_kit.id", ondelete="CASCADE"))
    item_number: Mapped[int] = mapped_column(Integer)
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
    labor_kit: Mapped["LaborKit"] = relationship("LaborKit", back_populates="items")
