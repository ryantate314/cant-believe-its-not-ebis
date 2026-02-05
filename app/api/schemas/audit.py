"""Pydantic schemas for audit API request/response models."""

from datetime import datetime
from enum import Enum
from typing import Any
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class AuditAction(str, Enum):
    """Audit action types."""

    INSERT = "INSERT"
    UPDATE = "UPDATE"
    DELETE = "DELETE"


class AuditRecordResponse(BaseModel):
    """Response model for a single audit record."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    entity_type: str
    entity_id: UUID
    action: AuditAction
    old_values: dict[str, Any] | None
    new_values: dict[str, Any] | None
    changed_fields: list[str] | None
    user_id: str | None
    session_id: str | None
    ip_address: str | None
    created_at: datetime
    # Optional context for work order items
    item_number: int | None = None


class PaginatedAuditResponse(BaseModel):
    """Paginated response for audit records."""

    items: list[AuditRecordResponse]
    total: int
    page: int = Field(ge=1)
    page_size: int = Field(ge=1, le=100)
    has_next: bool
