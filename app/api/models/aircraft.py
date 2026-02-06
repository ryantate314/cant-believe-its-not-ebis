from sqlalchemy import String, Integer, ForeignKey, Boolean, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from datetime import datetime
from uuid import UUID, uuid4

from core.database import Base


class Aircraft(Base):
    __tablename__ = "aircraft"

    id: Mapped[int] = mapped_column(primary_key=True)
    uuid: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True), unique=True, default=uuid4
    )
    registration_number: Mapped[str] = mapped_column(String(20), unique=True)
    serial_number: Mapped[str | None] = mapped_column(String(50))
    make: Mapped[str | None] = mapped_column(String(50))
    model: Mapped[str | None] = mapped_column(String(50))
    year_built: Mapped[int | None] = mapped_column(Integer)
    meter_profile: Mapped[str | None] = mapped_column(Text)
    primary_city_id: Mapped[int | None] = mapped_column(ForeignKey("city.id"))
    aircraft_class: Mapped[str | None] = mapped_column(String(50))
    fuel_code: Mapped[str | None] = mapped_column(String(20))
    notes: Mapped[str | None] = mapped_column(Text)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

    # Audit
    created_by: Mapped[str] = mapped_column(String(100))
    updated_by: Mapped[str | None] = mapped_column(String(100))
    created_at: Mapped[datetime] = mapped_column(default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        default=datetime.utcnow, onupdate=datetime.utcnow
    )

    # Relationships
    primary_city: Mapped["City"] = relationship("City", back_populates="aircraft")
    work_orders: Mapped[list["WorkOrder"]] = relationship("WorkOrder", back_populates="aircraft")
