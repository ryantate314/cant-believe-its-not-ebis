from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID
from typing import Literal

from core.database import get_db
from core.sorting import SortOrder
from core.auth import get_current_user, User
from schemas.work_order_item import (
    WorkOrderItemCreate,
    WorkOrderItemUpdate,
    WorkOrderItemResponse,
    WorkOrderItemListResponse,
)
from crud.work_order_item import (
    get_work_order_items,
    get_work_order_item_by_uuid,
    create_work_order_item,
    update_work_order_item,
    delete_work_order_item,
)
from crud.work_order import get_work_order_by_uuid

router = APIRouter(prefix="/work-orders/{work_order_id}/items", tags=["work-order-items"])


def item_to_response(item, work_order_uuid: UUID) -> WorkOrderItemResponse:
    """Convert a WorkOrderItem model to a response schema."""
    return WorkOrderItemResponse(
        id=item.uuid,
        work_order_id=work_order_uuid,
        item_number=item.item_number,
        status=item.status,
        discrepancy=item.discrepancy,
        corrective_action=item.corrective_action,
        notes=item.notes,
        category=item.category,
        sub_category=item.sub_category,
        ata_code=item.ata_code,
        hours_estimate=item.hours_estimate,
        billing_method=item.billing_method,
        flat_rate=item.flat_rate,
        department=item.department,
        do_not_bill=item.do_not_bill,
        enable_rii=item.enable_rii,
        created_by=item.created_by,
        updated_by=item.updated_by,
        created_at=item.created_at,
        updated_at=item.updated_at,
    )


@router.get("", response_model=WorkOrderItemListResponse)
async def list_work_order_items(
    work_order_id: UUID,
    sort_by: Literal["item_number", "status", "category", "hours_estimate"]
    | None = Query(None, description="Column to sort by"),
    sort_order: SortOrder = Query(SortOrder.ASC, description="Sort direction"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List items for a work order."""
    # Verify work order exists
    work_order = await get_work_order_by_uuid(db, work_order_id)
    if not work_order:
        raise HTTPException(status_code=404, detail="Work order not found")

    items, total = await get_work_order_items(
        db, work_order_id, sort_by=sort_by, sort_order=sort_order
    )
    return WorkOrderItemListResponse(
        items=[item_to_response(item, work_order_id) for item in items],
        total=total,
    )


@router.post("", response_model=WorkOrderItemResponse, status_code=201)
async def create_new_work_order_item(
    work_order_id: UUID,
    item_in: WorkOrderItemCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create a new work order item."""
    # Set created_by from authenticated user
    item_in.created_by = current_user.email
    item = await create_work_order_item(db, work_order_id, item_in)
    if not item:
        raise HTTPException(status_code=404, detail="Work order not found")
    return item_to_response(item, work_order_id)


@router.get("/{item_id}", response_model=WorkOrderItemResponse)
async def get_work_order_item(
    work_order_id: UUID,
    item_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get a work order item by ID."""
    # Verify work order exists
    work_order = await get_work_order_by_uuid(db, work_order_id)
    if not work_order:
        raise HTTPException(status_code=404, detail="Work order not found")

    item = await get_work_order_item_by_uuid(db, item_id)
    if not item or item.work_order_id != work_order.id:
        raise HTTPException(status_code=404, detail="Work order item not found")
    return item_to_response(item, work_order_id)


@router.put("/{item_id}", response_model=WorkOrderItemResponse)
async def update_existing_work_order_item(
    work_order_id: UUID,
    item_id: UUID,
    item_in: WorkOrderItemUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update a work order item."""
    # Verify work order exists
    work_order = await get_work_order_by_uuid(db, work_order_id)
    if not work_order:
        raise HTTPException(status_code=404, detail="Work order not found")

    # Verify item belongs to this work order
    existing_item = await get_work_order_item_by_uuid(db, item_id)
    if not existing_item or existing_item.work_order_id != work_order.id:
        raise HTTPException(status_code=404, detail="Work order item not found")

    # Set updated_by from authenticated user
    item_in.updated_by = current_user.email
    item = await update_work_order_item(db, item_id, item_in)
    return item_to_response(item, work_order_id)


@router.delete("/{item_id}", status_code=204)
async def delete_existing_work_order_item(
    work_order_id: UUID,
    item_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Delete a work order item."""
    # Verify work order exists
    work_order = await get_work_order_by_uuid(db, work_order_id)
    if not work_order:
        raise HTTPException(status_code=404, detail="Work order not found")

    # Verify item belongs to this work order
    existing_item = await get_work_order_item_by_uuid(db, item_id)
    if not existing_item or existing_item.work_order_id != work_order.id:
        raise HTTPException(status_code=404, detail="Work order item not found")

    deleted = await delete_work_order_item(db, item_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Work order item not found")
