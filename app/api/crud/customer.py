from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, asc, desc
from uuid import UUID
from datetime import datetime

from models.customer import Customer
from models.aircraft import Aircraft
from models.aircraft_customer import AircraftCustomer
from schemas.customer import CustomerCreate, CustomerUpdate
from core.sorting import SortOrder

# Allowed columns for sorting customers
CUSTOMER_SORT_COLUMNS = {
    "name": Customer.name,
    "email": Customer.email,
    "created_at": Customer.created_at,
}


async def get_customers(
    db: AsyncSession,
    page: int = 1,
    page_size: int = 20,
    search: str | None = None,
    active_only: bool = True,
    sort_by: str | None = None,
    sort_order: SortOrder = SortOrder.DESC,
) -> tuple[list[Customer], int]:
    """Get customers with pagination and filtering."""
    query = select(Customer)

    # Apply filters
    filters = []

    if active_only:
        filters.append(Customer.is_active == True)

    if search:
        search_filter = f"%{search}%"
        filters.append(
            Customer.name.ilike(search_filter)
            | Customer.email.ilike(search_filter)
            | Customer.phone.ilike(search_filter)
        )

    if filters:
        query = query.where(*filters)

    # Get total count
    count_query = select(func.count(Customer.id))
    if filters:
        count_query = count_query.where(*filters)
    count_result = await db.execute(count_query)
    total = count_result.scalar()

    # Apply sorting
    sort_column = CUSTOMER_SORT_COLUMNS.get(sort_by, Customer.created_at)
    if sort_order == SortOrder.ASC:
        query = query.order_by(asc(sort_column))
    else:
        query = query.order_by(desc(sort_column))

    # Apply pagination
    offset = (page - 1) * page_size
    query = query.offset(offset).limit(page_size)

    result = await db.execute(query)
    customers = result.scalars().all()

    return list(customers), total


async def get_customer_by_uuid(db: AsyncSession, customer_uuid: UUID) -> Customer | None:
    """Get a customer by its UUID."""
    query = select(Customer).where(Customer.uuid == customer_uuid)
    result = await db.execute(query)
    return result.scalar_one_or_none()


async def create_customer(db: AsyncSession, customer_in: CustomerCreate) -> Customer:
    """Create a new customer."""
    customer = Customer(
        name=customer_in.name,
        email=customer_in.email,
        phone=customer_in.phone,
        phone_type=customer_in.phone_type,
        address=customer_in.address,
        address_2=customer_in.address_2,
        city=customer_in.city,
        state=customer_in.state,
        zip=customer_in.zip,
        country=customer_in.country,
        notes=customer_in.notes,
        is_active=customer_in.is_active,
        created_by=customer_in.created_by,
    )

    db.add(customer)
    await db.flush()
    await db.refresh(customer)
    return customer


async def update_customer(
    db: AsyncSession, customer_uuid: UUID, customer_in: CustomerUpdate
) -> Customer | None:
    """Update a customer."""
    customer = await get_customer_by_uuid(db, customer_uuid)
    if not customer:
        return None

    update_data = customer_in.model_dump(exclude_unset=True)

    # Update fields
    for field, value in update_data.items():
        setattr(customer, field, value)

    customer.updated_at = datetime.utcnow()
    await db.flush()
    await db.refresh(customer)
    return customer


async def delete_customer(db: AsyncSession, customer_uuid: UUID) -> bool:
    """Delete a customer.

    Raises:
        ValueError: If customer has linked aircraft or work orders.
    """
    customer = await get_customer_by_uuid(db, customer_uuid)
    if not customer:
        return False

    # Check for linked aircraft
    link_count_query = select(func.count(AircraftCustomer.id)).where(
        AircraftCustomer.customer_id == customer.id
    )
    count_result = await db.execute(link_count_query)
    link_count = count_result.scalar()
    if link_count > 0:
        raise ValueError(
            f"Cannot delete customer {customer.name}: "
            f"it is linked to {link_count} aircraft"
        )

    # Check for linked work orders
    from models.work_order import WorkOrder

    wo_count_query = select(func.count(WorkOrder.id)).where(
        WorkOrder.customer_id == customer.id
    )
    wo_result = await db.execute(wo_count_query)
    wo_count = wo_result.scalar()
    if wo_count > 0:
        raise ValueError(
            f"Cannot delete customer {customer.name}: "
            f"it has {wo_count} associated work order(s)"
        )

    await db.delete(customer)
    return True


async def get_customer_aircraft(
    db: AsyncSession, customer_uuid: UUID
) -> list[tuple[Aircraft, bool]]:
    """Get all aircraft linked to a customer, with is_primary flag."""
    customer = await get_customer_by_uuid(db, customer_uuid)
    if not customer:
        return []

    query = (
        select(Aircraft, AircraftCustomer.is_primary)
        .join(AircraftCustomer, AircraftCustomer.aircraft_id == Aircraft.id)
        .where(AircraftCustomer.customer_id == customer.id)
    )
    result = await db.execute(query)
    return list(result.all())


async def link_customer_to_aircraft(
    db: AsyncSession, customer_uuid: UUID, aircraft_uuid: UUID, created_by: str
) -> AircraftCustomer:
    """Link a customer to an aircraft. First link becomes primary."""
    customer = await get_customer_by_uuid(db, customer_uuid)
    if not customer:
        raise ValueError(f"Customer not found: {customer_uuid}")

    aircraft_query = select(Aircraft).where(Aircraft.uuid == aircraft_uuid)
    aircraft_result = await db.execute(aircraft_query)
    aircraft = aircraft_result.scalar_one_or_none()
    if not aircraft:
        raise ValueError(f"Aircraft not found: {aircraft_uuid}")

    # Check if already linked
    existing_query = select(AircraftCustomer).where(
        AircraftCustomer.aircraft_id == aircraft.id,
        AircraftCustomer.customer_id == customer.id,
    )
    existing_result = await db.execute(existing_query)
    if existing_result.scalar_one_or_none():
        raise ValueError("Customer is already linked to this aircraft")

    # Check if any customer is already linked to this aircraft (first link becomes primary)
    count_query = select(func.count(AircraftCustomer.id)).where(
        AircraftCustomer.aircraft_id == aircraft.id
    )
    count_result = await db.execute(count_query)
    existing_count = count_result.scalar()

    link = AircraftCustomer(
        aircraft_id=aircraft.id,
        customer_id=customer.id,
        is_primary=existing_count == 0,
        created_by=created_by,
    )
    db.add(link)
    await db.flush()
    await db.refresh(link)
    return link


async def unlink_customer_from_aircraft(
    db: AsyncSession, customer_uuid: UUID, aircraft_uuid: UUID
) -> bool:
    """Unlink a customer from an aircraft. If primary is removed, promote next."""
    customer = await get_customer_by_uuid(db, customer_uuid)
    if not customer:
        return False

    aircraft_query = select(Aircraft).where(Aircraft.uuid == aircraft_uuid)
    aircraft_result = await db.execute(aircraft_query)
    aircraft = aircraft_result.scalar_one_or_none()
    if not aircraft:
        return False

    link_query = select(AircraftCustomer).where(
        AircraftCustomer.aircraft_id == aircraft.id,
        AircraftCustomer.customer_id == customer.id,
    )
    link_result = await db.execute(link_query)
    link = link_result.scalar_one_or_none()
    if not link:
        return False

    was_primary = link.is_primary
    await db.delete(link)
    await db.flush()

    # If we removed the primary, promote the next one
    if was_primary:
        next_link_query = (
            select(AircraftCustomer)
            .where(AircraftCustomer.aircraft_id == aircraft.id)
            .order_by(AircraftCustomer.created_at)
            .limit(1)
        )
        next_result = await db.execute(next_link_query)
        next_link = next_result.scalar_one_or_none()
        if next_link:
            next_link.is_primary = True
            await db.flush()

    return True


async def set_primary_customer(
    db: AsyncSession, customer_uuid: UUID, aircraft_uuid: UUID
) -> bool:
    """Set a customer as the primary customer for an aircraft."""
    customer = await get_customer_by_uuid(db, customer_uuid)
    if not customer:
        return False

    aircraft_query = select(Aircraft).where(Aircraft.uuid == aircraft_uuid)
    aircraft_result = await db.execute(aircraft_query)
    aircraft = aircraft_result.scalar_one_or_none()
    if not aircraft:
        return False

    # Find the link
    link_query = select(AircraftCustomer).where(
        AircraftCustomer.aircraft_id == aircraft.id,
        AircraftCustomer.customer_id == customer.id,
    )
    link_result = await db.execute(link_query)
    link = link_result.scalar_one_or_none()
    if not link:
        return False

    # Unset all other primaries for this aircraft
    all_links_query = select(AircraftCustomer).where(
        AircraftCustomer.aircraft_id == aircraft.id,
        AircraftCustomer.is_primary == True,
    )
    all_links_result = await db.execute(all_links_query)
    for other_link in all_links_result.scalars().all():
        other_link.is_primary = False

    # Set this one as primary
    link.is_primary = True
    await db.flush()
    return True


async def get_aircraft_primary_customer(
    db: AsyncSession, aircraft_id: int
) -> Customer | None:
    """Get the primary customer for an aircraft (by internal ID)."""
    query = (
        select(Customer)
        .join(AircraftCustomer, AircraftCustomer.customer_id == Customer.id)
        .where(
            AircraftCustomer.aircraft_id == aircraft_id,
            AircraftCustomer.is_primary == True,
        )
    )
    result = await db.execute(query)
    return result.scalar_one_or_none()


async def get_customers_for_aircraft(
    db: AsyncSession, aircraft_id: int
) -> list[tuple[Customer, bool]]:
    """Get all customers linked to an aircraft with is_primary flag."""
    query = (
        select(Customer, AircraftCustomer.is_primary)
        .join(AircraftCustomer, AircraftCustomer.customer_id == Customer.id)
        .where(AircraftCustomer.aircraft_id == aircraft_id)
    )
    result = await db.execute(query)
    return list(result.all())


async def get_customers_for_aircraft_batch(
    db: AsyncSession, aircraft_ids: list[int]
) -> dict[int, list[tuple[Customer, bool]]]:
    """Get customers for multiple aircraft in a single query."""
    if not aircraft_ids:
        return {}

    query = (
        select(AircraftCustomer.aircraft_id, Customer, AircraftCustomer.is_primary)
        .join(AircraftCustomer, AircraftCustomer.customer_id == Customer.id)
        .where(AircraftCustomer.aircraft_id.in_(aircraft_ids))
    )
    result = await db.execute(query)

    customers_by_aircraft: dict[int, list[tuple[Customer, bool]]] = {}
    for aircraft_id, customer, is_primary in result.all():
        if aircraft_id not in customers_by_aircraft:
            customers_by_aircraft[aircraft_id] = []
        customers_by_aircraft[aircraft_id].append((customer, is_primary))

    return customers_by_aircraft
