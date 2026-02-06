"""Integration tests for the Work Orders API endpoints."""

import pytest
from uuid import uuid4
from httpx import AsyncClient

from models.city import City
from models.aircraft import Aircraft
from models.work_order import WorkOrder, WorkOrderStatus, PriorityLevel


class TestListWorkOrders:
    """Tests for GET /api/v1/work-orders endpoint."""

    async def test_list_work_orders_for_city(
        self, client: AsyncClient, test_city: City, test_work_order: WorkOrder
    ):
        """Test listing work orders for a specific city."""
        response = await client.get(
            f"/api/v1/work-orders?city_id={test_city.uuid}"
        )
        assert response.status_code == 200

        data = response.json()
        assert "items" in data
        assert "total" in data
        assert "page" in data
        assert "page_size" in data

        assert data["total"] == 1
        assert len(data["items"]) == 1

        wo = data["items"][0]
        assert wo["work_order_number"] == test_work_order.work_order_number
        assert wo["city"]["code"] == test_city.code

    async def test_list_work_orders_missing_city_id(self, client: AsyncClient):
        """Test that city_id is required."""
        response = await client.get("/api/v1/work-orders")
        assert response.status_code == 422

    async def test_list_work_orders_invalid_city(self, client: AsyncClient):
        """Test listing work orders for non-existent city returns empty list."""
        fake_id = uuid4()
        response = await client.get(f"/api/v1/work-orders?city_id={fake_id}")
        assert response.status_code == 200

        data = response.json()
        assert data["items"] == []
        assert data["total"] == 0

    async def test_list_work_orders_pagination(
        self, client: AsyncClient, test_city: City, test_work_order: WorkOrder
    ):
        """Test pagination parameters."""
        response = await client.get(
            f"/api/v1/work-orders?city_id={test_city.uuid}&page=1&page_size=10"
        )
        assert response.status_code == 200

        data = response.json()
        assert data["page"] == 1
        assert data["page_size"] == 10

    async def test_list_work_orders_search(
        self, client: AsyncClient, test_city: City, test_work_order: WorkOrder
    ):
        """Test search by work order number."""
        response = await client.get(
            f"/api/v1/work-orders?city_id={test_city.uuid}&search=KTYS"
        )
        assert response.status_code == 200

        data = response.json()
        assert data["total"] == 1

    async def test_list_work_orders_search_no_results(
        self, client: AsyncClient, test_city: City, test_work_order: WorkOrder
    ):
        """Test search with no matching results."""
        response = await client.get(
            f"/api/v1/work-orders?city_id={test_city.uuid}&search=NONEXISTENT"
        )
        assert response.status_code == 200

        data = response.json()
        assert data["total"] == 0

    async def test_list_work_orders_status_filter(
        self, client: AsyncClient, test_city: City, test_work_order: WorkOrder
    ):
        """Test filtering by status."""
        response = await client.get(
            f"/api/v1/work-orders?city_id={test_city.uuid}&status=created"
        )
        assert response.status_code == 200

        data = response.json()
        assert data["total"] == 1


class TestCreateWorkOrder:
    """Tests for POST /api/v1/work-orders endpoint."""

    async def test_create_work_order_minimal(
        self, client: AsyncClient, test_city: City, test_aircraft: Aircraft
    ):
        """Test creating a work order with minimal required fields."""
        payload = {
            "city_id": str(test_city.uuid),
            "aircraft_id": str(test_aircraft.uuid),
            "created_by": "test_user",
        }
        response = await client.post("/api/v1/work-orders", json=payload)
        assert response.status_code == 201

        data = response.json()
        assert "work_order_number" in data
        assert data["work_order_number"].startswith(test_city.code)
        assert data["city"]["code"] == test_city.code
        assert data["aircraft"]["registration_number"] == test_aircraft.registration_number
        assert data["status"] == "created"
        assert data["priority"] == "normal"
        assert data["created_by"] == "test_user"
        assert data["item_count"] == 0

    async def test_create_work_order_full(
        self, client: AsyncClient, test_city: City, test_aircraft: Aircraft
    ):
        """Test creating a work order with all fields."""
        payload = {
            "city_id": str(test_city.uuid),
            "aircraft_id": str(test_aircraft.uuid),
            "created_by": "admin_user",
            "work_order_type": "quote",
            "status": "open",
            "status_notes": "Ready for review",
            "due_date": "2026-12-31",
            "lead_technician": "John Smith",
            "sales_person": "Jane Doe",
            "priority": "high",
        }
        response = await client.post("/api/v1/work-orders", json=payload)
        assert response.status_code == 201

        data = response.json()
        assert data["work_order_type"] == "quote"
        assert data["status"] == "open"
        assert data["aircraft"]["registration_number"] == test_aircraft.registration_number
        assert data["customer"] is None
        assert data["priority"] == "high"

    async def test_create_work_order_invalid_city(
        self, client: AsyncClient, test_aircraft: Aircraft
    ):
        """Test creating a work order with non-existent city returns error."""
        fake_id = uuid4()
        payload = {
            "city_id": str(fake_id),
            "aircraft_id": str(test_aircraft.uuid),
            "created_by": "test_user",
        }
        response = await client.post("/api/v1/work-orders", json=payload)
        assert response.status_code == 400
        assert "not found" in response.json()["detail"].lower()

    async def test_create_work_order_invalid_aircraft(
        self, client: AsyncClient, test_city: City
    ):
        """Test creating a work order with non-existent aircraft returns error."""
        fake_id = uuid4()
        payload = {
            "city_id": str(test_city.uuid),
            "aircraft_id": str(fake_id),
            "created_by": "test_user",
        }
        response = await client.post("/api/v1/work-orders", json=payload)
        assert response.status_code == 400
        assert "not found" in response.json()["detail"].lower()

    async def test_create_work_order_sequence_increments(
        self, client: AsyncClient, test_city: City, test_aircraft: Aircraft
    ):
        """Test that work order sequence increments for same city."""
        payload = {
            "city_id": str(test_city.uuid),
            "aircraft_id": str(test_aircraft.uuid),
            "created_by": "test_user",
        }

        # Create first work order
        response1 = await client.post("/api/v1/work-orders", json=payload)
        assert response1.status_code == 201
        seq1 = response1.json()["sequence_number"]

        # Create second work order
        response2 = await client.post("/api/v1/work-orders", json=payload)
        assert response2.status_code == 201
        seq2 = response2.json()["sequence_number"]

        assert seq2 == seq1 + 1


class TestGetWorkOrder:
    """Tests for GET /api/v1/work-orders/{work_order_id} endpoint."""

    async def test_get_work_order_by_id(
        self, client: AsyncClient, test_work_order: WorkOrder, test_aircraft: Aircraft
    ):
        """Test getting a specific work order by ID."""
        response = await client.get(
            f"/api/v1/work-orders/{test_work_order.uuid}"
        )
        assert response.status_code == 200

        data = response.json()
        assert data["work_order_number"] == test_work_order.work_order_number
        assert data["aircraft"]["registration_number"] == test_aircraft.registration_number

    async def test_get_work_order_not_found(self, client: AsyncClient):
        """Test getting a non-existent work order returns 404."""
        fake_id = uuid4()
        response = await client.get(f"/api/v1/work-orders/{fake_id}")
        assert response.status_code == 404
        assert response.json()["detail"] == "Work order not found"

    async def test_get_work_order_response_format(
        self, client: AsyncClient, test_work_order: WorkOrder
    ):
        """Test that work order response has all expected fields."""
        response = await client.get(
            f"/api/v1/work-orders/{test_work_order.uuid}"
        )
        data = response.json()

        expected_fields = [
            "id",
            "work_order_number",
            "sequence_number",
            "city",
            "aircraft",
            "work_order_type",
            "status",
            "status_notes",
            "customer",
            "due_date",
            "created_date",
            "completed_date",
            "lead_technician",
            "sales_person",
            "priority",
            "created_by",
            "updated_by",
            "created_at",
            "updated_at",
            "item_count",
        ]
        for field in expected_fields:
            assert field in data, f"Missing field: {field}"

        # Check aircraft object has expected fields
        aircraft_fields = [
            "id",
            "registration_number",
            "serial_number",
            "make",
            "model",
            "year_built",
        ]
        for field in aircraft_fields:
            assert field in data["aircraft"], f"Missing aircraft field: {field}"


class TestUpdateWorkOrder:
    """Tests for PUT /api/v1/work-orders/{work_order_id} endpoint."""

    async def test_update_work_order_status(
        self, client: AsyncClient, test_work_order: WorkOrder
    ):
        """Test updating work order status."""
        payload = {"status": "in_progress"}
        response = await client.put(
            f"/api/v1/work-orders/{test_work_order.uuid}", json=payload
        )
        assert response.status_code == 200

        data = response.json()
        assert data["status"] == "in_progress"

    async def test_update_work_order_multiple_fields(
        self, client: AsyncClient, test_work_order: WorkOrder
    ):
        """Test updating multiple work order fields."""
        payload = {
            "status": "open",
            "priority": "urgent",
            "updated_by": "updater_user",
        }
        response = await client.put(
            f"/api/v1/work-orders/{test_work_order.uuid}", json=payload
        )
        assert response.status_code == 200

        data = response.json()
        assert data["status"] == "open"
        assert data["priority"] == "urgent"
        assert data["updated_by"] == "updater_user"

    async def test_update_work_order_not_found(self, client: AsyncClient):
        """Test updating a non-existent work order returns 404."""
        fake_id = uuid4()
        payload = {"status": "in_progress"}
        response = await client.put(
            f"/api/v1/work-orders/{fake_id}", json=payload
        )
        assert response.status_code == 404

    async def test_update_work_order_partial(
        self, client: AsyncClient, test_work_order: WorkOrder
    ):
        """Test that partial updates don't affect unset fields."""
        payload = {"status": "open"}
        response = await client.put(
            f"/api/v1/work-orders/{test_work_order.uuid}", json=payload
        )
        assert response.status_code == 200

        data = response.json()
        assert data["status"] == "open"
        assert data["priority"] == "normal"


class TestDeleteWorkOrder:
    """Tests for DELETE /api/v1/work-orders/{work_order_id} endpoint."""

    async def test_delete_work_order(
        self, client: AsyncClient, test_city: City, test_aircraft: Aircraft
    ):
        """Test deleting a work order."""
        # First create a work order
        payload = {
            "city_id": str(test_city.uuid),
            "aircraft_id": str(test_aircraft.uuid),
            "created_by": "test_user",
        }
        create_response = await client.post("/api/v1/work-orders", json=payload)
        wo_id = create_response.json()["id"]

        # Now delete it
        delete_response = await client.delete(f"/api/v1/work-orders/{wo_id}")
        assert delete_response.status_code == 204

        # Verify it's deleted
        get_response = await client.get(f"/api/v1/work-orders/{wo_id}")
        assert get_response.status_code == 404

    async def test_delete_work_order_not_found(self, client: AsyncClient):
        """Test deleting a non-existent work order returns 404."""
        fake_id = uuid4()
        response = await client.delete(f"/api/v1/work-orders/{fake_id}")
        assert response.status_code == 404
