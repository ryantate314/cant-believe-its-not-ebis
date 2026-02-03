from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID
from typing import Literal

from core.database import get_db
from core.sorting import SortOrder
from core.auth import get_current_user, User
from schemas.labor_kit import (
    LaborKitCreate,
    LaborKitUpdate,
    LaborKitResponse,
    LaborKitListResponse,
    ApplyLaborKitResponse,
)
from crud.labor_kit import (
    get_labor_kits,
    get_labor_kit_by_uuid,
    create_labor_kit,
    update_labor_kit,
    delete_labor_kit,
    apply_labor_kit_to_work_order,
)

router = APIRouter(prefix="/labor-kits", tags=["labor-kits"])


def kit_to_response(kit) -> LaborKitResponse:
    """Convert a LaborKit model to a response schema."""
    return LaborKitResponse(
        id=kit.uuid,
        name=kit.name,
        description=kit.description,
        category=kit.category,
        is_active=kit.is_active,
        created_by=kit.created_by,
        updated_by=kit.updated_by,
        created_at=kit.created_at,
        updated_at=kit.updated_at,
    )


@router.get("", response_model=LaborKitListResponse)
async def list_labor_kits(
    sort_by: Literal["name", "category", "is_active", "created_at"]
    | None = Query(None, description="Column to sort by"),
    sort_order: SortOrder = Query(SortOrder.ASC, description="Sort direction"),
    active_only: bool = Query(False, description="Only return active kits"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List all labor kits."""
    kits, total = await get_labor_kits(
        db, sort_by=sort_by, sort_order=sort_order, active_only=active_only
    )
    return LaborKitListResponse(
        items=[kit_to_response(kit) for kit in kits],
        total=total,
    )


@router.post("", response_model=LaborKitResponse, status_code=201)
async def create_new_labor_kit(
    kit_in: LaborKitCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create a new labor kit."""
    # Set created_by from authenticated user
    kit_in.created_by = current_user.email
    kit = await create_labor_kit(db, kit_in)
    return kit_to_response(kit)


@router.get("/{kit_id}", response_model=LaborKitResponse)
async def get_labor_kit(
    kit_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get a labor kit by ID."""
    kit = await get_labor_kit_by_uuid(db, kit_id)
    if not kit:
        raise HTTPException(status_code=404, detail="Labor kit not found")
    return kit_to_response(kit)


@router.put("/{kit_id}", response_model=LaborKitResponse)
async def update_existing_labor_kit(
    kit_id: UUID,
    kit_in: LaborKitUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update a labor kit."""
    # Set updated_by from authenticated user
    kit_in.updated_by = current_user.email
    kit = await update_labor_kit(db, kit_id, kit_in)
    if not kit:
        raise HTTPException(status_code=404, detail="Labor kit not found")
    return kit_to_response(kit)


@router.delete("/{kit_id}", status_code=204)
async def delete_existing_labor_kit(
    kit_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Delete a labor kit."""
    deleted = await delete_labor_kit(db, kit_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Labor kit not found")


@router.post("/{kit_id}/apply/{work_order_id}", response_model=ApplyLaborKitResponse)
async def apply_kit_to_work_order(
    kit_id: UUID,
    work_order_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Apply a labor kit to a work order, creating work order items from the kit's items."""
    # Use authenticated user's email as created_by
    items_created, error = await apply_labor_kit_to_work_order(
        db, kit_id, work_order_id, current_user.email
    )
    if error:
        raise HTTPException(status_code=400, detail=error)

    return ApplyLaborKitResponse(
        items_created=items_created,
        work_order_id=work_order_id,
        labor_kit_id=kit_id,
    )
