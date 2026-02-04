"""Audit history retrieval endpoint."""

from datetime import datetime
from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import get_session
from models.audit_log import AuditLog
from schemas.audit import AuditAction, AuditRecordResponse, PaginatedAuditResponse

router = APIRouter(prefix="/api/v1/audit", tags=["audit"])


@router.get(
    "/{entity_type}/{entity_id}",
    response_model=PaginatedAuditResponse,
)
async def get_audit_history(
    entity_type: str,
    entity_id: UUID,
    from_date: datetime | None = Query(None, description="Filter records from this date"),
    to_date: datetime | None = Query(None, description="Filter records until this date"),
    action: AuditAction | None = Query(None, description="Filter by action type"),
    user_id: str | None = Query(None, description="Filter by user ID"),
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(50, ge=1, le=100, description="Items per page"),
    session: AsyncSession = Depends(get_session),
) -> PaginatedAuditResponse:
    """Retrieve audit history for a specific entity.

    Returns paginated audit records with optional filtering by date range,
    action type, and user.
    """
    # Build base query filters
    filters = [
        AuditLog.entity_type == entity_type,
        AuditLog.entity_id == entity_id,
    ]

    # Apply optional filters
    if from_date:
        filters.append(AuditLog.created_at >= from_date)
    if to_date:
        filters.append(AuditLog.created_at <= to_date)
    if action:
        filters.append(AuditLog.action == action.value)
    if user_id:
        filters.append(AuditLog.user_id == user_id)

    # Count total records
    count_query = select(func.count()).select_from(AuditLog).where(*filters)
    total_result = await session.execute(count_query)
    total = total_result.scalar_one()

    # Calculate pagination
    offset = (page - 1) * page_size

    # Fetch paginated records
    data_query = (
        select(AuditLog)
        .where(*filters)
        .order_by(AuditLog.created_at.desc())
        .offset(offset)
        .limit(page_size)
    )
    result = await session.execute(data_query)
    records = result.scalars().all()

    # Convert records to response models, handling IP address conversion
    items = []
    for record in records:
        # Convert IP address to string if present
        ip_address = str(record.ip_address) if record.ip_address else None
        items.append(
            AuditRecordResponse(
                id=record.id,
                entity_type=record.entity_type,
                entity_id=record.entity_id,
                action=AuditAction(record.action),
                old_values=record.old_values,
                new_values=record.new_values,
                changed_fields=record.changed_fields,
                user_id=record.user_id,
                session_id=record.session_id,
                ip_address=ip_address,
                created_at=record.created_at,
            )
        )

    has_next = offset + len(records) < total

    return PaginatedAuditResponse(
        items=items,
        total=total,
        page=page,
        page_size=page_size,
        has_next=has_next,
    )
