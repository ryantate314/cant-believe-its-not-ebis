from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID
from typing import Literal

from core.database import get_db
from core.sorting import SortOrder
from schemas.customer import (
    CustomerCreate,
    CustomerUpdate,
    CustomerResponse,
    CustomerListResponse,
)
from crud.customer import (
    get_customers,
    get_customer_by_uuid,
    create_customer,
    update_customer,
    delete_customer,
)

router = APIRouter(prefix="/customers", tags=["customers"])


def customer_to_response(customer) -> CustomerResponse:
    """Convert a Customer model to a response schema."""
    return CustomerResponse(
        id=customer.uuid,
        name=customer.name,
        email=customer.email,
        phone=customer.phone,
        phone_type=customer.phone_type,
        address=customer.address,
        address_2=customer.address_2,
        city=customer.city,
        state=customer.state,
        zip=customer.zip,
        country=customer.country,
        notes=customer.notes,
        is_active=customer.is_active,
        created_by=customer.created_by,
        updated_by=customer.updated_by,
        created_at=customer.created_at,
        updated_at=customer.updated_at,
    )


@router.get("", response_model=CustomerListResponse)
async def list_customers(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: str | None = None,
    active_only: bool = Query(True, description="Only show active customers"),
    sort_by: Literal["name", "email", "created_at"] | None = Query(
        None, description="Column to sort by"
    ),
    sort_order: SortOrder = Query(SortOrder.DESC, description="Sort direction"),
    db: AsyncSession = Depends(get_db),
):
    """List customers with pagination and filtering."""
    customer_list, total = await get_customers(
        db,
        page=page,
        page_size=page_size,
        search=search,
        active_only=active_only,
        sort_by=sort_by,
        sort_order=sort_order,
    )
    return CustomerListResponse(
        items=[customer_to_response(c) for c in customer_list],
        total=total,
        page=page,
        page_size=page_size,
    )


@router.post("", response_model=CustomerResponse, status_code=201)
async def create_new_customer(
    customer_in: CustomerCreate,
    db: AsyncSession = Depends(get_db),
):
    """Create a new customer."""
    try:
        customer = await create_customer(db, customer_in)
        return customer_to_response(customer)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/{customer_id}", response_model=CustomerResponse)
async def get_customer(
    customer_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    """Get a customer by ID."""
    customer = await get_customer_by_uuid(db, customer_id)
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    return customer_to_response(customer)


@router.put("/{customer_id}", response_model=CustomerResponse)
async def update_existing_customer(
    customer_id: UUID,
    customer_in: CustomerUpdate,
    db: AsyncSession = Depends(get_db),
):
    """Update a customer."""
    try:
        customer = await update_customer(db, customer_id, customer_in)
        if not customer:
            raise HTTPException(status_code=404, detail="Customer not found")
        return customer_to_response(customer)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.delete("/{customer_id}", status_code=204)
async def delete_existing_customer(
    customer_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    """Delete a customer."""
    try:
        deleted = await delete_customer(db, customer_id)
        if not deleted:
            raise HTTPException(status_code=404, detail="Customer not found")
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
