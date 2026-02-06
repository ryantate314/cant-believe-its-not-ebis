"""Unit tests for Pydantic schemas."""

import pytest
from uuid import uuid4
from datetime import date, datetime
from decimal import Decimal

from schemas.city import CityResponse, CityListResponse, CityBrief
from schemas.work_order import (
    WorkOrderBase,
    WorkOrderCreate,
    WorkOrderUpdate,
    WorkOrderResponse,
    WorkOrderListResponse,
    WorkOrderStatus,
    PriorityLevel,
    WorkOrderType,
    AircraftBrief,
)
from schemas.work_order_item import (
    WorkOrderItemBase,
    WorkOrderItemCreate,
    WorkOrderItemUpdate,
    WorkOrderItemResponse,
    WorkOrderItemListResponse,
    WorkOrderItemStatus,
)


class TestCitySchemas:
    """Tests for City schemas."""

    def test_city_response_valid(self):
        """Test CityResponse with valid data."""
        data = {
            "id": uuid4(),
            "code": "KTYS",
            "name": "Knoxville McGhee Tyson",
            "is_active": True,
        }
        response = CityResponse(**data)
        assert response.code == "KTYS"
        assert response.name == "Knoxville McGhee Tyson"
        assert response.is_active is True

    def test_city_list_response(self):
        """Test CityListResponse with multiple cities."""
        cities = [
            {"id": uuid4(), "code": "KTYS", "name": "Knoxville", "is_active": True},
            {"id": uuid4(), "code": "KBNA", "name": "Nashville", "is_active": True},
        ]
        response = CityListResponse(items=cities, total=2)
        assert response.total == 2
        assert len(response.items) == 2
        assert response.items[0].code == "KTYS"


class TestWorkOrderSchemas:
    """Tests for WorkOrder schemas."""

    def test_work_order_base_defaults(self):
        """Test WorkOrderBase default values."""
        wo = WorkOrderBase()
        assert wo.work_order_type == WorkOrderType.WORK_ORDER
        assert wo.status == WorkOrderStatus.CREATED
        assert wo.priority == PriorityLevel.NORMAL
        assert wo.customer_name is None

    def test_work_order_create_required_fields(self):
        """Test WorkOrderCreate with required fields."""
        city_id = uuid4()
        aircraft_id = uuid4()
        wo = WorkOrderCreate(city_id=city_id, aircraft_id=aircraft_id, created_by="test_user")
        assert wo.city_id == city_id
        assert wo.aircraft_id == aircraft_id
        assert wo.created_by == "test_user"
        assert wo.status == WorkOrderStatus.CREATED

    def test_work_order_create_with_all_fields(self):
        """Test WorkOrderCreate with all optional fields."""
        city_id = uuid4()
        aircraft_id = uuid4()
        wo = WorkOrderCreate(
            city_id=city_id,
            aircraft_id=aircraft_id,
            created_by="test_user",
            work_order_type=WorkOrderType.QUOTE,
            status=WorkOrderStatus.OPEN,
            customer_name="Test Customer",
            customer_po_number="PO-001",
            due_date=date(2026, 12, 31),
            lead_technician="John Doe",
            sales_person="Jane Doe",
            priority=PriorityLevel.HIGH,
        )
        assert wo.work_order_type == WorkOrderType.QUOTE
        assert wo.aircraft_id == aircraft_id
        assert wo.priority == PriorityLevel.HIGH

    def test_work_order_update_partial(self):
        """Test WorkOrderUpdate with partial data."""
        wo = WorkOrderUpdate(status=WorkOrderStatus.IN_PROGRESS)
        assert wo.status == WorkOrderStatus.IN_PROGRESS
        assert wo.aircraft_id is None
        assert wo.updated_by is None

    def test_work_order_update_with_aircraft(self):
        """Test WorkOrderUpdate with aircraft_id."""
        aircraft_id = uuid4()
        wo = WorkOrderUpdate(aircraft_id=aircraft_id, updated_by="admin")
        assert wo.aircraft_id == aircraft_id
        assert wo.updated_by == "admin"

    def test_work_order_response_complete(self):
        """Test WorkOrderResponse with complete data."""
        city_id = uuid4()
        aircraft_id = uuid4()
        wo_id = uuid4()
        now = datetime.utcnow()

        response = WorkOrderResponse(
            id=wo_id,
            work_order_number="KTYS00001-01-2026",
            sequence_number=1,
            city=CityBrief(id=city_id, code="KTYS", name="Knoxville"),
            aircraft=AircraftBrief(
                id=aircraft_id,
                registration_number="N12345",
                serial_number="SN12345",
                make="Cessna",
                model="172",
                year_built=2020,
            ),
            work_order_type=WorkOrderType.WORK_ORDER,
            status=WorkOrderStatus.CREATED,
            status_notes=None,
            customer_name="Test Customer",
            customer_po_number="PO-001",
            due_date=date(2026, 12, 31),
            created_date=now,
            completed_date=None,
            lead_technician="John Doe",
            sales_person="Jane Doe",
            priority=PriorityLevel.NORMAL,
            created_by="test_user",
            updated_by=None,
            created_at=now,
            updated_at=now,
            item_count=0,
        )
        assert response.work_order_number == "KTYS00001-01-2026"
        assert response.city.code == "KTYS"
        assert response.aircraft.registration_number == "N12345"
        assert response.item_count == 0

    def test_work_order_list_response(self):
        """Test WorkOrderListResponse structure."""
        response = WorkOrderListResponse(items=[], total=0, page=1, page_size=20)
        assert response.items == []
        assert response.total == 0
        assert response.page == 1
        assert response.page_size == 20


class TestWorkOrderStatusEnum:
    """Tests for WorkOrderStatus enum."""

    def test_all_statuses(self):
        """Test all valid status values."""
        expected = [
            "created",
            "scheduled",
            "open",
            "in_progress",
            "tracking",
            "pending",
            "in_review",
            "completed",
            "void",
        ]
        actual = [s.value for s in WorkOrderStatus]
        assert actual == expected

    def test_status_string_value(self):
        """Test that status enum has correct string values."""
        assert WorkOrderStatus.CREATED.value == "created"
        assert WorkOrderStatus.IN_PROGRESS.value == "in_progress"
        assert WorkOrderStatus.COMPLETED.value == "completed"


class TestPriorityLevelEnum:
    """Tests for PriorityLevel enum."""

    def test_all_priorities(self):
        """Test all valid priority values."""
        expected = ["low", "normal", "high", "urgent"]
        actual = [p.value for p in PriorityLevel]
        assert actual == expected


class TestWorkOrderTypeEnum:
    """Tests for WorkOrderType enum."""

    def test_all_types(self):
        """Test all valid work order types."""
        expected = ["work_order", "quote"]
        actual = [t.value for t in WorkOrderType]
        assert actual == expected


class TestWorkOrderItemSchemas:
    """Tests for WorkOrderItem schemas."""

    def test_work_order_item_base_defaults(self):
        """Test WorkOrderItemBase default values."""
        item = WorkOrderItemBase()
        assert item.status == WorkOrderItemStatus.OPEN
        assert item.billing_method == "hourly"
        assert item.do_not_bill is False
        assert item.enable_rii is False
        assert item.discrepancy is None

    def test_work_order_item_create_required_fields(self):
        """Test WorkOrderItemCreate with required fields."""
        item = WorkOrderItemCreate(created_by="test_user")
        assert item.created_by == "test_user"
        assert item.status == WorkOrderItemStatus.OPEN

    def test_work_order_item_create_with_all_fields(self):
        """Test WorkOrderItemCreate with all optional fields."""
        item = WorkOrderItemCreate(
            created_by="test_user",
            status=WorkOrderItemStatus.IN_PROGRESS,
            discrepancy="Engine running rough",
            corrective_action="Replaced spark plugs",
            notes="Completed successfully",
            category="Powerplant",
            sub_category="Ignition",
            ata_code="74-10",
            hours_estimate=Decimal("4.5"),
            billing_method="flat_rate",
            flat_rate=Decimal("500.00"),
            department="Engine Shop",
            do_not_bill=False,
            enable_rii=True,
        )
        assert item.discrepancy == "Engine running rough"
        assert item.hours_estimate == Decimal("4.5")
        assert item.enable_rii is True

    def test_work_order_item_update_partial(self):
        """Test WorkOrderItemUpdate with partial data."""
        item = WorkOrderItemUpdate(
            status=WorkOrderItemStatus.FINISHED, updated_by="admin"
        )
        assert item.status == WorkOrderItemStatus.FINISHED
        assert item.updated_by == "admin"
        assert item.discrepancy is None

    def test_work_order_item_response_complete(self):
        """Test WorkOrderItemResponse with complete data."""
        item_id = uuid4()
        wo_id = uuid4()
        now = datetime.utcnow()

        response = WorkOrderItemResponse(
            id=item_id,
            work_order_id=wo_id,
            item_number=1,
            status=WorkOrderItemStatus.OPEN,
            discrepancy="Test discrepancy",
            corrective_action="Test action",
            notes="Test notes",
            category="Maintenance",
            sub_category="Routine",
            ata_code="32-10",
            hours_estimate=Decimal("2.5"),
            billing_method="hourly",
            flat_rate=None,
            department="Avionics",
            do_not_bill=False,
            enable_rii=False,
            created_by="test_user",
            updated_by=None,
            created_at=now,
            updated_at=now,
        )
        assert response.item_number == 1
        assert response.hours_estimate == Decimal("2.5")

    def test_work_order_item_list_response(self):
        """Test WorkOrderItemListResponse structure."""
        response = WorkOrderItemListResponse(items=[], total=0)
        assert response.items == []
        assert response.total == 0


class TestWorkOrderItemStatusEnum:
    """Tests for WorkOrderItemStatus enum."""

    def test_all_item_statuses(self):
        """Test all valid item status values."""
        expected = [
            "open",
            "waiting_for_parts",
            "in_progress",
            "tech_review",
            "admin_review",
            "finished",
        ]
        actual = [s.value for s in WorkOrderItemStatus]
        assert actual == expected
