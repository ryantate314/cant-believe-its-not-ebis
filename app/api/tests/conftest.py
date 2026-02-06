"""
Pytest configuration and shared fixtures for all tests.
"""

import pytest
from typing import AsyncGenerator
from uuid import uuid4

from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.pool import StaticPool

from core.database import Base, get_db
from main import app
from models.city import City
from models.aircraft import Aircraft
from models.work_order import WorkOrder, WorkOrderStatus, PriorityLevel, WorkOrderType
from models.work_order_item import WorkOrderItem, WorkOrderItemStatus
from models.labor_kit import LaborKit
from models.labor_kit_item import LaborKitItem
from models.tool_room import ToolRoom
from models.tool import Tool, ToolType, ToolGroup


# Use in-memory SQLite for tests
TEST_DATABASE_URL = "sqlite+aiosqlite:///:memory:"


@pytest.fixture(scope="function")
async def test_engine():
    """Create a test database engine."""
    engine = create_async_engine(
        TEST_DATABASE_URL,
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    yield engine

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)

    await engine.dispose()


@pytest.fixture(scope="function")
async def test_session(test_engine) -> AsyncGenerator[AsyncSession, None]:
    """Create a test database session."""
    TestSessionLocal = async_sessionmaker(
        test_engine,
        class_=AsyncSession,
        expire_on_commit=False,
    )

    async with TestSessionLocal() as session:
        yield session


@pytest.fixture(scope="function")
async def client(test_session: AsyncSession) -> AsyncGenerator[AsyncClient, None]:
    """Create a test HTTP client with overridden database dependency."""

    async def override_get_db():
        try:
            yield test_session
            await test_session.commit()
        except Exception:
            await test_session.rollback()
            raise

    app.dependency_overrides[get_db] = override_get_db

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        yield client

    app.dependency_overrides.clear()


@pytest.fixture
async def test_city(test_session: AsyncSession) -> City:
    """Create a test city."""
    city = City(
        uuid=uuid4(),
        code="KTYS",
        name="Knoxville McGhee Tyson",
        is_active=True,
    )
    test_session.add(city)
    await test_session.commit()
    await test_session.refresh(city)
    return city


@pytest.fixture
async def test_city_inactive(test_session: AsyncSession) -> City:
    """Create an inactive test city."""
    city = City(
        uuid=uuid4(),
        code="KINC",
        name="Inactive City",
        is_active=False,
    )
    test_session.add(city)
    await test_session.commit()
    await test_session.refresh(city)
    return city


@pytest.fixture
async def test_aircraft(test_session: AsyncSession) -> Aircraft:
    """Create a test aircraft."""
    aircraft = Aircraft(
        uuid=uuid4(),
        registration_number="N12345",
        serial_number="SN12345",
        make="Cessna",
        model="172",
        year_built=2020,
        is_active=True,
        created_by="test_user",
    )
    test_session.add(aircraft)
    await test_session.commit()
    await test_session.refresh(aircraft)
    return aircraft


@pytest.fixture
async def test_work_order(
    test_session: AsyncSession, test_city: City, test_aircraft: Aircraft
) -> WorkOrder:
    """Create a test work order."""
    work_order = WorkOrder(
        uuid=uuid4(),
        work_order_number="KTYS00001-01-2026",
        sequence_number=1,
        city_id=test_city.id,
        aircraft_id=test_aircraft.id,
        work_order_type=WorkOrderType.WORK_ORDER,
        status=WorkOrderStatus.CREATED,
        customer_name="Test Customer",
        customer_po_number="PO-001",
        priority=PriorityLevel.NORMAL,
        created_by="test_user",
    )
    test_session.add(work_order)
    await test_session.commit()
    await test_session.refresh(work_order)
    return work_order


@pytest.fixture
async def test_work_order_item(
    test_session: AsyncSession, test_work_order: WorkOrder
) -> WorkOrderItem:
    """Create a test work order item."""
    item = WorkOrderItem(
        uuid=uuid4(),
        work_order_id=test_work_order.id,
        item_number=1,
        status=WorkOrderItemStatus.OPEN,
        discrepancy="Test discrepancy",
        corrective_action="Test corrective action",
        notes="Test notes",
        category="Maintenance",
        ata_code="32-10",
        hours_estimate=2.5,
        billing_method="hourly",
        department="Avionics",
        created_by="test_user",
    )
    test_session.add(item)
    await test_session.commit()
    await test_session.refresh(item)
    return item


@pytest.fixture
async def test_labor_kit(test_session: AsyncSession) -> LaborKit:
    """Create a test labor kit."""
    kit = LaborKit(
        uuid=uuid4(),
        name="100 Hour Service",
        description="Standard 100 hour inspection for Continental engines",
        category="Engine",
        is_active=True,
        created_by="test_user",
    )
    test_session.add(kit)
    await test_session.commit()
    await test_session.refresh(kit)
    return kit


@pytest.fixture
async def test_labor_kit_inactive(test_session: AsyncSession) -> LaborKit:
    """Create an inactive test labor kit."""
    kit = LaborKit(
        uuid=uuid4(),
        name="Inactive Kit",
        description="An inactive labor kit",
        category="Engine",
        is_active=False,
        created_by="test_user",
    )
    test_session.add(kit)
    await test_session.commit()
    await test_session.refresh(kit)
    return kit


@pytest.fixture
async def test_labor_kit_item(
    test_session: AsyncSession, test_labor_kit: LaborKit
) -> LaborKitItem:
    """Create a test labor kit item."""
    item = LaborKitItem(
        uuid=uuid4(),
        labor_kit_id=test_labor_kit.id,
        item_number=1,
        discrepancy="Oil filter replacement",
        corrective_action="Replace oil filter per manufacturer specifications",
        notes="Use approved oil filter part",
        category="Maintenance",
        sub_category="Routine",
        ata_code="72-00",
        hours_estimate=1.0,
        billing_method="hourly",
        department="Engine",
        do_not_bill=False,
        enable_rii=False,
        created_by="test_user",
    )
    test_session.add(item)
    await test_session.commit()
    await test_session.refresh(item)
    return item


@pytest.fixture
async def test_labor_kit_with_items(
    test_session: AsyncSession, test_labor_kit: LaborKit
) -> LaborKit:
    """Create a test labor kit with multiple items."""
    items = [
        LaborKitItem(
            uuid=uuid4(),
            labor_kit_id=test_labor_kit.id,
            item_number=1,
            discrepancy="Oil filter replacement",
            corrective_action="Replace oil filter",
            category="Maintenance",
            hours_estimate=1.0,
            billing_method="hourly",
            department="Engine",
            created_by="test_user",
        ),
        LaborKitItem(
            uuid=uuid4(),
            labor_kit_id=test_labor_kit.id,
            item_number=2,
            discrepancy="Spark plug inspection",
            corrective_action="Inspect and clean spark plugs",
            category="Maintenance",
            hours_estimate=2.0,
            billing_method="hourly",
            department="Engine",
            created_by="test_user",
        ),
        LaborKitItem(
            uuid=uuid4(),
            labor_kit_id=test_labor_kit.id,
            item_number=3,
            discrepancy="Oil change",
            corrective_action="Drain and refill oil",
            category="Maintenance",
            hours_estimate=0.5,
            billing_method="hourly",
            department="Engine",
            created_by="test_user",
        ),
    ]
    for item in items:
        test_session.add(item)
    await test_session.commit()
    await test_session.refresh(test_labor_kit)
    return test_labor_kit


@pytest.fixture
async def test_tool_room(test_session: AsyncSession, test_city: City) -> ToolRoom:
    """Create a test tool room."""
    tool_room = ToolRoom(
        uuid=uuid4(),
        city_id=test_city.id,
        code="TR-001",
        name="Main Tool Room",
        is_active=True,
    )
    test_session.add(tool_room)
    await test_session.commit()
    await test_session.refresh(tool_room)
    return tool_room


@pytest.fixture
async def test_tool_room_inactive(
    test_session: AsyncSession, test_city: City
) -> ToolRoom:
    """Create an inactive test tool room."""
    tool_room = ToolRoom(
        uuid=uuid4(),
        city_id=test_city.id,
        code="TR-002",
        name="Inactive Tool Room",
        is_active=False,
    )
    test_session.add(tool_room)
    await test_session.commit()
    await test_session.refresh(tool_room)
    return tool_room


@pytest.fixture
async def test_tool_certified(
    test_session: AsyncSession, test_tool_room: ToolRoom
) -> Tool:
    """Create a certified tool with calibration due date."""
    from datetime import date, timedelta

    tool = Tool(
        uuid=uuid4(),
        name="Torque Wrench 50ft-lb",
        tool_type=ToolType.CERTIFIED,
        tool_group=ToolGroup.IN_SERVICE,
        tool_room_id=test_tool_room.id,
        description="Calibrated torque wrench",
        make="Snap-On",
        model="TW-50",
        serial_number="SN-CERT-001",
        next_calibration_due=date.today() + timedelta(days=45),
        calibration_days=365,
        media_count=0,
        created_by="test_user",
    )
    test_session.add(tool)
    await test_session.commit()
    await test_session.refresh(tool)
    return tool


@pytest.fixture
async def test_tool_reference(
    test_session: AsyncSession, test_tool_room: ToolRoom
) -> Tool:
    """Create a reference tool (no calibration)."""
    tool = Tool(
        uuid=uuid4(),
        name="Digital Multimeter",
        tool_type=ToolType.REFERENCE,
        tool_group=ToolGroup.IN_SERVICE,
        tool_room_id=test_tool_room.id,
        description="Standard reference meter",
        make="Fluke",
        model="87V",
        serial_number="SN-REF-001",
        media_count=1,
        created_by="test_user",
    )
    test_session.add(tool)
    await test_session.commit()
    await test_session.refresh(tool)
    return tool


@pytest.fixture
async def test_tool_kit(
    test_session: AsyncSession, test_tool_room: ToolRoom
) -> Tool:
    """Create a kit-type tool (parent kit)."""
    tool = Tool(
        uuid=uuid4(),
        name="Avionics Tool Kit",
        tool_type=ToolType.KIT,
        tool_group=ToolGroup.IN_SERVICE,
        tool_room_id=test_tool_room.id,
        description="Kit containing avionics tools",
        media_count=0,
        created_by="test_user",
    )
    test_session.add(tool)
    await test_session.commit()
    await test_session.refresh(tool)
    return tool


@pytest.fixture
async def test_tool_in_kit(
    test_session: AsyncSession, test_tool_room: ToolRoom, test_tool_kit: Tool
) -> Tool:
    """Create a tool that belongs to a kit."""
    tool = Tool(
        uuid=uuid4(),
        name="Wire Stripper",
        tool_type=ToolType.CONSUMABLE,
        tool_group=ToolGroup.IN_SERVICE,
        tool_room_id=test_tool_room.id,
        description="Wire stripping tool",
        parent_kit_id=test_tool_kit.id,
        media_count=0,
        created_by="test_user",
    )
    test_session.add(tool)
    await test_session.commit()
    await test_session.refresh(tool)
    return tool
