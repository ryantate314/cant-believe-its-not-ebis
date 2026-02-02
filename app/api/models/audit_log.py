"""AuditLog model for querying audit records."""

from datetime import datetime
from typing import Any
from uuid import UUID

from sqlalchemy import BigInteger, DateTime, Enum as SQLEnum, String, Text, func
from sqlalchemy.dialects.postgresql import ARRAY, INET, JSONB, UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column

from models.base import Base


class AuditLog(Base):
    """Read-only model for audit_log table.

    This model is for querying audit records only.
    Audit records are inserted via event listeners, not this model.
    """

    __tablename__ = "audit_log"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    entity_type: Mapped[str] = mapped_column(String(100), nullable=False)
    entity_id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), nullable=False)
    action: Mapped[str] = mapped_column(
        SQLEnum("INSERT", "UPDATE", "DELETE", name="audit_action", create_type=False),
        nullable=False,
    )
    old_values: Mapped[dict[str, Any] | None] = mapped_column(JSONB, nullable=True)
    new_values: Mapped[dict[str, Any] | None] = mapped_column(JSONB, nullable=True)
    changed_fields: Mapped[list[str] | None] = mapped_column(ARRAY(Text), nullable=True)
    user_id: Mapped[str | None] = mapped_column(String(100), nullable=True)
    session_id: Mapped[str | None] = mapped_column(String(100), nullable=True)
    ip_address: Mapped[str | None] = mapped_column(INET, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )
