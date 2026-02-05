"""Audit history retrieval endpoint."""

from datetime import datetime
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from core.database import get_session
from models.audit_log import AuditLog
from models.work_order import WorkOrder
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


@router.get(
    "/work-order/{work_order_id}/combined",
    response_model=PaginatedAuditResponse,
)
async def get_work_order_combined_audit_history(
    work_order_id: UUID,
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(50, ge=1, le=100, description="Items per page"),
    session: AsyncSession = Depends(get_session),
) -> PaginatedAuditResponse:
    """Retrieve combined audit history for a work order and all its items.

    Returns paginated audit records including changes to the work order itself
    and all work order items (added, modified, or deleted), including items
    that have been deleted.
    """
    # Get work order to verify it exists and get its integer ID
    work_order_query = (
        select(WorkOrder)
        .options(selectinload(WorkOrder.items))
        .where(WorkOrder.uuid == work_order_id)
    )
    result = await session.execute(work_order_query)
    work_order = result.scalar_one_or_none()

    if not work_order:
        raise HTTPException(status_code=404, detail="Work order not found")

    # Build mapping of item UUID -> item_number for current items
    item_uuid_to_number: dict[UUID, int] = {
        item.uuid: item.item_number for item in work_order.items
    }

    # Build query filters:
    # 1. Work order audit records (by UUID)
    # 2. Work order item audit records where work_order_id in JSONB matches
    #    This captures ALL items including deleted ones
    work_order_int_id = work_order.id

    # Query for work_order_item records that belong to this work order
    # Check both new_values and old_values (old_values for DELETE records)
    # Use SQLAlchemy's contains() method for JSONB @> operator
    work_order_id_filter = {"work_order_id": work_order_int_id}

    combined_filter = or_(
        # Work order itself
        (AuditLog.entity_type == "work_order") & (AuditLog.entity_id == work_order_id),
        # Work order items - check new_values for INSERT/UPDATE
        (AuditLog.entity_type == "work_order_item")
        & (AuditLog.new_values.contains(work_order_id_filter)),
        # Work order items - check old_values for DELETE (and UPDATE for completeness)
        (AuditLog.entity_type == "work_order_item")
        & (AuditLog.old_values.contains(work_order_id_filter)),
    )

    # Count total records
    count_query = select(func.count()).select_from(AuditLog).where(combined_filter)
    total_result = await session.execute(count_query)
    total = total_result.scalar_one()

    # Calculate pagination
    offset = (page - 1) * page_size

    # Fetch paginated records
    data_query = (
        select(AuditLog)
        .where(combined_filter)
        .order_by(AuditLog.created_at.desc())
        .offset(offset)
        .limit(page_size)
    )
    result = await session.execute(data_query)
    records = result.scalars().all()

    # Convert records to response models with item context
    items = []
    for record in records:
        ip_address = str(record.ip_address) if record.ip_address else None

        # Determine item_number for work order items
        item_number = None
        if record.entity_type == "work_order_item":
            # Try current items first
            item_number = item_uuid_to_number.get(record.entity_id)
            # If not found (deleted item), try to get from audit values
            if item_number is None:
                if record.new_values and "item_number" in record.new_values:
                    item_number = record.new_values["item_number"]
                elif record.old_values and "item_number" in record.old_values:
                    item_number = record.old_values["item_number"]

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
                item_number=item_number,
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
