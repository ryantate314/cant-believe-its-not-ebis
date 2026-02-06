from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, asc, desc
from sqlalchemy.orm import selectinload
from uuid import UUID
from datetime import datetime

from models.aircraft import Aircraft
from models.city import City
from schemas.aircraft import AircraftCreate, AircraftUpdate
from core.sorting import SortOrder

# Allowed columns for sorting aircraft
AIRCRAFT_SORT_COLUMNS = {
    "registration_number": Aircraft.registration_number,
    "make": Aircraft.make,
    "model": Aircraft.model,
    "year_built": Aircraft.year_built,
    "created_at": Aircraft.created_at,
}


async def get_aircraft_list(
    db: AsyncSession,
    page: int = 1,
    page_size: int = 20,
    search: str | None = None,
    city_id: UUID | None = None,
    active_only: bool = True,
    sort_by: str | None = None,
    sort_order: SortOrder = SortOrder.DESC,
) -> tuple[list[Aircraft], int]:
    """Get aircraft with pagination and filtering."""
    # Build query
    query = select(Aircraft).options(selectinload(Aircraft.primary_city))

    # Apply filters
    filters = []

    if active_only:
        filters.append(Aircraft.is_active == True)

    if city_id:
        # Get city first
        city_query = select(City).where(City.uuid == city_id)
        city_result = await db.execute(city_query)
        city = city_result.scalar_one_or_none()
        if city:
            filters.append(Aircraft.primary_city_id == city.id)

    if search:
        search_filter = f"%{search}%"
        filters.append(
            Aircraft.registration_number.ilike(search_filter)
            | Aircraft.serial_number.ilike(search_filter)
            | Aircraft.make.ilike(search_filter)
            | Aircraft.model.ilike(search_filter)
        )

    if filters:
        query = query.where(*filters)

    # Get total count
    count_query = select(func.count(Aircraft.id))
    if filters:
        count_query = count_query.where(*filters)
    count_result = await db.execute(count_query)
    total = count_result.scalar()

    # Apply sorting
    sort_column = AIRCRAFT_SORT_COLUMNS.get(sort_by, Aircraft.created_at)
    if sort_order == SortOrder.ASC:
        query = query.order_by(asc(sort_column))
    else:
        query = query.order_by(desc(sort_column))

    # Apply pagination
    offset = (page - 1) * page_size
    query = query.offset(offset).limit(page_size)

    result = await db.execute(query)
    aircraft = result.scalars().all()

    return list(aircraft), total


async def get_aircraft_by_uuid(db: AsyncSession, aircraft_uuid: UUID) -> Aircraft | None:
    """Get an aircraft by its UUID."""
    query = (
        select(Aircraft)
        .options(selectinload(Aircraft.primary_city))
        .where(Aircraft.uuid == aircraft_uuid)
    )
    result = await db.execute(query)
    return result.scalar_one_or_none()


async def create_aircraft(db: AsyncSession, aircraft_in: AircraftCreate) -> Aircraft:
    """Create a new aircraft."""
    # Get city if provided
    city_id = None
    if aircraft_in.primary_city_id:
        city_query = select(City).where(City.uuid == aircraft_in.primary_city_id)
        city_result = await db.execute(city_query)
        city = city_result.scalar_one_or_none()
        if not city:
            raise ValueError(f"City not found: {aircraft_in.primary_city_id}")
        city_id = city.id

    # Create aircraft
    aircraft = Aircraft(
        registration_number=aircraft_in.registration_number,
        serial_number=aircraft_in.serial_number,
        make=aircraft_in.make,
        model=aircraft_in.model,
        year_built=aircraft_in.year_built,
        meter_profile=aircraft_in.meter_profile,
        primary_city_id=city_id,
        aircraft_class=aircraft_in.aircraft_class,
        fuel_code=aircraft_in.fuel_code,
        notes=aircraft_in.notes,
        is_active=aircraft_in.is_active,
        created_by=aircraft_in.created_by,
    )

    db.add(aircraft)
    await db.flush()
    await db.refresh(aircraft, ["primary_city"])
    return aircraft


async def update_aircraft(
    db: AsyncSession, aircraft_uuid: UUID, aircraft_in: AircraftUpdate
) -> Aircraft | None:
    """Update an aircraft."""
    aircraft = await get_aircraft_by_uuid(db, aircraft_uuid)
    if not aircraft:
        return None

    # Handle city update if provided
    update_data = aircraft_in.model_dump(exclude_unset=True)
    if "primary_city_id" in update_data:
        city_uuid = update_data.pop("primary_city_id")
        if city_uuid:
            city_query = select(City).where(City.uuid == city_uuid)
            city_result = await db.execute(city_query)
            city = city_result.scalar_one_or_none()
            if not city:
                raise ValueError(f"City not found: {city_uuid}")
            update_data["primary_city_id"] = city.id
        else:
            update_data["primary_city_id"] = None

    # Update fields
    for field, value in update_data.items():
        setattr(aircraft, field, value)

    aircraft.updated_at = datetime.utcnow()
    await db.flush()
    await db.refresh(aircraft, ["primary_city"])
    return aircraft


async def delete_aircraft(db: AsyncSession, aircraft_uuid: UUID) -> bool:
    """Delete an aircraft.

    Raises:
        ValueError: If aircraft has associated work orders.
    """
    aircraft = await get_aircraft_by_uuid(db, aircraft_uuid)
    if not aircraft:
        return False

    # Check for associated work orders
    from models.work_order import WorkOrder

    work_order_count_query = select(func.count(WorkOrder.id)).where(
        WorkOrder.aircraft_id == aircraft.id
    )
    count_result = await db.execute(work_order_count_query)
    work_order_count = count_result.scalar()

    if work_order_count > 0:
        raise ValueError(
            f"Cannot delete aircraft {aircraft.registration_number}: "
            f"it has {work_order_count} associated work order(s)"
        )

    await db.delete(aircraft)
    return True
