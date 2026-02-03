from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID
from typing import Literal

from core.database import get_db
from core.sorting import SortOrder
from schemas.labor_kit_item import (
    LaborKitItemCreate,
    LaborKitItemUpdate,
    LaborKitItemResponse,
    LaborKitItemListResponse,
)
from crud.labor_kit_item import (
    get_labor_kit_items,
    get_labor_kit_item_by_uuid,
    create_labor_kit_item,
    update_labor_kit_item,
    delete_labor_kit_item,
)
from crud.labor_kit import get_labor_kit_by_uuid

router = APIRouter(prefix="/labor-kits/{kit_id}/items", tags=["labor-kit-items"])


def item_to_response(item, kit_uuid: UUID) -> LaborKitItemResponse:
    """Convert a LaborKitItem model to a response schema."""
    return LaborKitItemResponse(
        id=item.uuid,
        labor_kit_id=kit_uuid,
        item_number=item.item_number,
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


@router.get("", response_model=LaborKitItemListResponse)
async def list_labor_kit_items(
    kit_id: UUID,
    sort_by: Literal["item_number", "category", "hours_estimate"]
    | None = Query(None, description="Column to sort by"),
    sort_order: SortOrder = Query(SortOrder.ASC, description="Sort direction"),
    db: AsyncSession = Depends(get_db),
):
    """List items for a labor kit."""
    # Verify labor kit exists
    labor_kit = await get_labor_kit_by_uuid(db, kit_id)
    if not labor_kit:
        raise HTTPException(status_code=404, detail="Labor kit not found")

    items, total = await get_labor_kit_items(
        db, kit_id, sort_by=sort_by, sort_order=sort_order
    )
    return LaborKitItemListResponse(
        items=[item_to_response(item, kit_id) for item in items],
        total=total,
    )


@router.post("", response_model=LaborKitItemResponse, status_code=201)
async def create_new_labor_kit_item(
    kit_id: UUID,
    item_in: LaborKitItemCreate,
    db: AsyncSession = Depends(get_db),
):
    """Create a new labor kit item."""
    item = await create_labor_kit_item(db, kit_id, item_in)
    if not item:
        raise HTTPException(status_code=404, detail="Labor kit not found")
    return item_to_response(item, kit_id)


@router.get("/{item_id}", response_model=LaborKitItemResponse)
async def get_labor_kit_item(
    kit_id: UUID,
    item_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    """Get a labor kit item by ID."""
    # Verify labor kit exists
    labor_kit = await get_labor_kit_by_uuid(db, kit_id)
    if not labor_kit:
        raise HTTPException(status_code=404, detail="Labor kit not found")

    item = await get_labor_kit_item_by_uuid(db, item_id)
    if not item or item.labor_kit_id != labor_kit.id:
        raise HTTPException(status_code=404, detail="Labor kit item not found")
    return item_to_response(item, kit_id)


@router.put("/{item_id}", response_model=LaborKitItemResponse)
async def update_existing_labor_kit_item(
    kit_id: UUID,
    item_id: UUID,
    item_in: LaborKitItemUpdate,
    db: AsyncSession = Depends(get_db),
):
    """Update a labor kit item."""
    # Verify labor kit exists
    labor_kit = await get_labor_kit_by_uuid(db, kit_id)
    if not labor_kit:
        raise HTTPException(status_code=404, detail="Labor kit not found")

    # Verify item belongs to this labor kit
    existing_item = await get_labor_kit_item_by_uuid(db, item_id)
    if not existing_item or existing_item.labor_kit_id != labor_kit.id:
        raise HTTPException(status_code=404, detail="Labor kit item not found")

    item = await update_labor_kit_item(db, item_id, item_in)
    return item_to_response(item, kit_id)


@router.delete("/{item_id}", status_code=204)
async def delete_existing_labor_kit_item(
    kit_id: UUID,
    item_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    """Delete a labor kit item."""
    # Verify labor kit exists
    labor_kit = await get_labor_kit_by_uuid(db, kit_id)
    if not labor_kit:
        raise HTTPException(status_code=404, detail="Labor kit not found")

    # Verify item belongs to this labor kit
    existing_item = await get_labor_kit_item_by_uuid(db, item_id)
    if not existing_item or existing_item.labor_kit_id != labor_kit.id:
        raise HTTPException(status_code=404, detail="Labor kit item not found")

    deleted = await delete_labor_kit_item(db, item_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Labor kit item not found")
