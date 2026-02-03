from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID
from typing import Literal

from core.database import get_db
from core.sorting import SortOrder
from core.auth import get_current_user, User
from schemas.work_order import (
    WorkOrderCreate,
    WorkOrderUpdate,
    WorkOrderResponse,
    WorkOrderListResponse,
    CityBrief,
    AircraftBrief,
)
from crud.work_order import (
    get_work_orders,
    get_work_order_by_uuid,
    create_work_order,
    update_work_order,
    delete_work_order,
)

router = APIRouter(prefix="/work-orders", tags=["work-orders"])


def work_order_to_response(wo) -> WorkOrderResponse:
    """Convert a WorkOrder model to a response schema."""
    return WorkOrderResponse(
        id=wo.uuid,
        work_order_number=wo.work_order_number,
        sequence_number=wo.sequence_number,
        city=CityBrief(
            id=wo.city.uuid,
            code=wo.city.code,
            name=wo.city.name,
        ),
        aircraft=AircraftBrief(
            id=wo.aircraft.uuid,
            registration_number=wo.aircraft.registration_number,
            serial_number=wo.aircraft.serial_number,
            make=wo.aircraft.make,
            model=wo.aircraft.model,
            year_built=wo.aircraft.year_built,
        ),
        work_order_type=wo.work_order_type,
        status=wo.status,
        status_notes=wo.status_notes,
        customer_name=wo.customer_name,
        customer_po_number=wo.customer_po_number,
        due_date=wo.due_date,
        created_date=wo.created_date,
        completed_date=wo.completed_date,
        lead_technician=wo.lead_technician,
        sales_person=wo.sales_person,
        priority=wo.priority,
        created_by=wo.created_by,
        updated_by=wo.updated_by,
        created_at=wo.created_at,
        updated_at=wo.updated_at,
        item_count=len(wo.items) if wo.items else 0,
    )


@router.get("", response_model=WorkOrderListResponse)
async def list_work_orders(
    city_id: UUID = Query(..., description="City UUID to filter by"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: str | None = None,
    status: str | None = None,
    sort_by: Literal[
        "work_order_number", "customer_name", "status", "priority", "created_at"
    ] | None = Query(None, description="Column to sort by"),
    sort_order: SortOrder = Query(SortOrder.DESC, description="Sort direction"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List work orders for a city."""
    work_orders, total = await get_work_orders(
        db,
        city_uuid=city_id,
        page=page,
        page_size=page_size,
        search=search,
        status=status,
        sort_by=sort_by,
        sort_order=sort_order,
    )
    return WorkOrderListResponse(
        items=[work_order_to_response(wo) for wo in work_orders],
        total=total,
        page=page,
        page_size=page_size,
    )


@router.post("", response_model=WorkOrderResponse, status_code=201)
async def create_new_work_order(
    work_order_in: WorkOrderCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create a new work order."""
    # Set created_by from authenticated user
    work_order_in.created_by = current_user.email
    try:
        work_order = await create_work_order(db, work_order_in)
        return work_order_to_response(work_order)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/{work_order_id}", response_model=WorkOrderResponse)
async def get_work_order(
    work_order_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get a work order by ID."""
    work_order = await get_work_order_by_uuid(db, work_order_id)
    if not work_order:
        raise HTTPException(status_code=404, detail="Work order not found")
    return work_order_to_response(work_order)


@router.put("/{work_order_id}", response_model=WorkOrderResponse)
async def update_existing_work_order(
    work_order_id: UUID,
    work_order_in: WorkOrderUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update a work order."""
    # Set updated_by from authenticated user
    work_order_in.updated_by = current_user.email
    work_order = await update_work_order(db, work_order_id, work_order_in)
    if not work_order:
        raise HTTPException(status_code=404, detail="Work order not found")
    return work_order_to_response(work_order)


@router.delete("/{work_order_id}", status_code=204)
async def delete_existing_work_order(
    work_order_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Delete a work order."""
    deleted = await delete_work_order(db, work_order_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Work order not found")
