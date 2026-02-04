"""City model for foreign key references."""

from datetime import datetime
from uuid import UUID, uuid4

from sqlalchemy import Boolean, Integer, String, func
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.types import DateTime

from models.base import Base


class City(Base):
    """City entity model."""

    __tablename__ = "city"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    uuid: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        unique=True,
        server_default=func.gen_random_uuid(),
        default=uuid4,
        nullable=False,
    )
    code: Mapped[str] = mapped_column(String(10), unique=True, nullable=False)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, server_default="true", default=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), default=datetime.utcnow
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), default=datetime.utcnow, onupdate=datetime.utcnow
    )

    # Relationships
    work_orders: Mapped[list["WorkOrder"]] = relationship(
        "WorkOrder", back_populates="city"
    )
    aircraft: Mapped[list["Aircraft"]] = relationship(
        "Aircraft", back_populates="primary_city"
    )
