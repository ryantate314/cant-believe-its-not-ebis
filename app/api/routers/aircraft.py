from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID
from typing import Literal

from core.database import get_db
from core.sorting import SortOrder
from schemas.aircraft import (
    AircraftCreate,
    AircraftUpdate,
    AircraftResponse,
    AircraftListResponse,
    CityBrief,
)
from schemas.customer import AircraftCustomerResponse
from crud.aircraft import (
    get_aircraft_list,
    get_aircraft_by_uuid,
    create_aircraft,
    update_aircraft,
    delete_aircraft,
)
from crud.customer import get_customers_for_aircraft, get_customers_for_aircraft_batch

router = APIRouter(prefix="/aircraft", tags=["aircraft"])


def aircraft_to_response(
    aircraft, customers: list[tuple] | None = None
) -> AircraftResponse:
    """Convert an Aircraft model to a response schema.

    Args:
        aircraft: Aircraft model instance.
        customers: List of (Customer, is_primary) tuples, or None for empty list.
    """
    customer_responses = []
    if customers:
        for customer, is_primary in customers:
            customer_responses.append(
                AircraftCustomerResponse(
                    id=customer.uuid,
                    name=customer.name,
                    email=customer.email,
                    is_primary=is_primary,
                )
            )

    return AircraftResponse(
        id=aircraft.uuid,
        registration_number=aircraft.registration_number,
        serial_number=aircraft.serial_number,
        make=aircraft.make,
        model=aircraft.model,
        year_built=aircraft.year_built,
        meter_profile=aircraft.meter_profile,
        primary_city=CityBrief(
            id=aircraft.primary_city.uuid,
            code=aircraft.primary_city.code,
            name=aircraft.primary_city.name,
        ) if aircraft.primary_city else None,
        customers=customer_responses,
        aircraft_class=aircraft.aircraft_class,
        fuel_code=aircraft.fuel_code,
        notes=aircraft.notes,
        is_active=aircraft.is_active,
        created_by=aircraft.created_by,
        updated_by=aircraft.updated_by,
        created_at=aircraft.created_at,
        updated_at=aircraft.updated_at,
    )


@router.get("", response_model=AircraftListResponse)
async def list_aircraft(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: str | None = None,
    city_id: UUID | None = Query(None, description="Filter by primary city UUID"),
    active_only: bool = Query(True, description="Only show active aircraft"),
    sort_by: Literal[
        "registration_number", "make", "model", "year_built", "created_at"
    ] | None = Query(None, description="Column to sort by"),
    sort_order: SortOrder = Query(SortOrder.DESC, description="Sort direction"),
    db: AsyncSession = Depends(get_db),
):
    """List aircraft with pagination and filtering."""
    aircraft_list, total = await get_aircraft_list(
        db,
        page=page,
        page_size=page_size,
        search=search,
        city_id=city_id,
        active_only=active_only,
        sort_by=sort_by,
        sort_order=sort_order,
    )

    # Batch-query customers for all aircraft
    aircraft_ids = [a.id for a in aircraft_list]
    customers_by_aircraft = await get_customers_for_aircraft_batch(db, aircraft_ids)

    return AircraftListResponse(
        items=[
            aircraft_to_response(a, customers_by_aircraft.get(a.id, []))
            for a in aircraft_list
        ],
        total=total,
        page=page,
        page_size=page_size,
    )


@router.post("", response_model=AircraftResponse, status_code=201)
async def create_new_aircraft(
    aircraft_in: AircraftCreate,
    db: AsyncSession = Depends(get_db),
):
    """Create a new aircraft."""
    try:
        aircraft = await create_aircraft(db, aircraft_in)
        return aircraft_to_response(aircraft, [])
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/{aircraft_id}", response_model=AircraftResponse)
async def get_aircraft(
    aircraft_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    """Get an aircraft by ID."""
    aircraft = await get_aircraft_by_uuid(db, aircraft_id)
    if not aircraft:
        raise HTTPException(status_code=404, detail="Aircraft not found")
    customers = await get_customers_for_aircraft(db, aircraft.id)
    return aircraft_to_response(aircraft, customers)


@router.put("/{aircraft_id}", response_model=AircraftResponse)
async def update_existing_aircraft(
    aircraft_id: UUID,
    aircraft_in: AircraftUpdate,
    db: AsyncSession = Depends(get_db),
):
    """Update an aircraft."""
    try:
        aircraft = await update_aircraft(db, aircraft_id, aircraft_in)
        if not aircraft:
            raise HTTPException(status_code=404, detail="Aircraft not found")
        customers = await get_customers_for_aircraft(db, aircraft.id)
        return aircraft_to_response(aircraft, customers)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.delete("/{aircraft_id}", status_code=204)
async def delete_existing_aircraft(
    aircraft_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    """Delete an aircraft."""
    try:
        deleted = await delete_aircraft(db, aircraft_id)
        if not deleted:
            raise HTTPException(status_code=404, detail="Aircraft not found")
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
