"""City model for foreign key references."""

from datetime import datetime

from sqlalchemy import Boolean, Integer, String, func
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.types import DateTime

from models.base import Base


class City(Base):
    """City entity model (minimal definition for FK references)."""

    __tablename__ = "city"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    uuid: Mapped[str] = mapped_column(
        PG_UUID(as_uuid=True),
        unique=True,
        server_default=func.gen_random_uuid(),
        nullable=False,
    )
    code: Mapped[str] = mapped_column(String(10), unique=True, nullable=False)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, server_default="true")
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
