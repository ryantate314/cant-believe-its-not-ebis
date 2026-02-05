from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, asc, desc
from uuid import UUID
from datetime import datetime

from models.customer import Customer
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

    Phase 1: No constraint checks (relationships added in Phase 2).
    """
    customer = await get_customer_by_uuid(db, customer_uuid)
    if not customer:
        return False

    await db.delete(customer)
    return True
