"""Integration tests for the Work Order Items API endpoints."""

import pytest
from uuid import uuid4
from decimal import Decimal
from httpx import AsyncClient

from models.work_order import WorkOrder
from models.work_order_item import WorkOrderItem, WorkOrderItemStatus


class TestListWorkOrderItems:
    """Tests for GET /api/v1/work-orders/{work_order_id}/items endpoint."""

    async def test_list_work_order_items(
        self,
        client: AsyncClient,
        test_work_order: WorkOrder,
        test_work_order_item: WorkOrderItem,
    ):
        """Test listing items for a work order."""
        response = await client.get(
            f"/api/v1/work-orders/{test_work_order.uuid}/items"
        )
        assert response.status_code == 200

        data = response.json()
        assert "items" in data
        assert "total" in data
        assert data["total"] == 1

        item = data["items"][0]
        assert item["item_number"] == test_work_order_item.item_number
        assert item["discrepancy"] == test_work_order_item.discrepancy

    async def test_list_work_order_items_empty(
        self, client: AsyncClient, test_work_order: WorkOrder
    ):
        """Test listing items when none exist."""
        response = await client.get(
            f"/api/v1/work-orders/{test_work_order.uuid}/items"
        )
        assert response.status_code == 200

        data = response.json()
        assert data["items"] == []
        assert data["total"] == 0

    async def test_list_work_order_items_not_found(self, client: AsyncClient):
        """Test listing items for non-existent work order returns 404."""
        fake_id = uuid4()
        response = await client.get(f"/api/v1/work-orders/{fake_id}/items")
        assert response.status_code == 404
        assert response.json()["detail"] == "Work order not found"


class TestCreateWorkOrderItem:
    """Tests for POST /api/v1/work-orders/{work_order_id}/items endpoint."""

    async def test_create_work_order_item_minimal(
        self, client: AsyncClient, test_work_order: WorkOrder
    ):
        """Test creating an item with minimal required fields."""
        payload = {"created_by": "test_user"}
        response = await client.post(
            f"/api/v1/work-orders/{test_work_order.uuid}/items", json=payload
        )
        assert response.status_code == 201

        data = response.json()
        assert data["item_number"] == 1
        assert data["status"] == "open"
        assert data["billing_method"] == "hourly"
        assert data["do_not_bill"] is False
        assert data["created_by"] == "test_user"

    async def test_create_work_order_item_full(
        self, client: AsyncClient, test_work_order: WorkOrder
    ):
        """Test creating an item with all fields."""
        payload = {
            "created_by": "tech_user",
            "status": "in_progress",
            "discrepancy": "Engine vibration detected",
            "corrective_action": "Replaced engine mounts",
            "notes": "Parts ordered from supplier",
            "category": "Powerplant",
            "sub_category": "Engine",
            "ata_code": "71-10",
            "hours_estimate": "5.5",
            "billing_method": "flat_rate",
            "flat_rate": "750.00",
            "department": "Engine Shop",
            "do_not_bill": False,
            "enable_rii": True,
        }
        response = await client.post(
            f"/api/v1/work-orders/{test_work_order.uuid}/items", json=payload
        )
        assert response.status_code == 201

        data = response.json()
        assert data["discrepancy"] == "Engine vibration detected"
        assert data["corrective_action"] == "Replaced engine mounts"
        assert data["ata_code"] == "71-10"
        assert float(data["hours_estimate"]) == 5.5
        assert data["enable_rii"] is True

    async def test_create_work_order_item_not_found(self, client: AsyncClient):
        """Test creating item for non-existent work order returns 404."""
        fake_id = uuid4()
        payload = {"created_by": "test_user"}
        response = await client.post(
            f"/api/v1/work-orders/{fake_id}/items", json=payload
        )
        assert response.status_code == 404

    async def test_create_work_order_item_sequence_increments(
        self, client: AsyncClient, test_work_order: WorkOrder
    ):
        """Test that item numbers increment for same work order."""
        payload = {"created_by": "test_user"}

        # Create first item
        response1 = await client.post(
            f"/api/v1/work-orders/{test_work_order.uuid}/items", json=payload
        )
        assert response1.status_code == 201
        num1 = response1.json()["item_number"]

        # Create second item
        response2 = await client.post(
            f"/api/v1/work-orders/{test_work_order.uuid}/items", json=payload
        )
        assert response2.status_code == 201
        num2 = response2.json()["item_number"]

        assert num2 == num1 + 1


class TestGetWorkOrderItem:
    """Tests for GET /api/v1/work-orders/{work_order_id}/items/{item_id} endpoint."""

    async def test_get_work_order_item(
        self,
        client: AsyncClient,
        test_work_order: WorkOrder,
        test_work_order_item: WorkOrderItem,
    ):
        """Test getting a specific item by ID."""
        response = await client.get(
            f"/api/v1/work-orders/{test_work_order.uuid}/items/{test_work_order_item.uuid}"
        )
        assert response.status_code == 200

        data = response.json()
        assert data["item_number"] == test_work_order_item.item_number
        assert data["discrepancy"] == test_work_order_item.discrepancy
        assert data["work_order_id"] == str(test_work_order.uuid)

    async def test_get_work_order_item_work_order_not_found(
        self, client: AsyncClient, test_work_order_item: WorkOrderItem
    ):
        """Test getting item with non-existent work order returns 404."""
        fake_wo_id = uuid4()
        response = await client.get(
            f"/api/v1/work-orders/{fake_wo_id}/items/{test_work_order_item.uuid}"
        )
        assert response.status_code == 404
        assert response.json()["detail"] == "Work order not found"

    async def test_get_work_order_item_not_found(
        self, client: AsyncClient, test_work_order: WorkOrder
    ):
        """Test getting non-existent item returns 404."""
        fake_item_id = uuid4()
        response = await client.get(
            f"/api/v1/work-orders/{test_work_order.uuid}/items/{fake_item_id}"
        )
        assert response.status_code == 404
        assert response.json()["detail"] == "Work order item not found"

    async def test_get_work_order_item_response_format(
        self,
        client: AsyncClient,
        test_work_order: WorkOrder,
        test_work_order_item: WorkOrderItem,
    ):
        """Test that item response has all expected fields."""
        response = await client.get(
            f"/api/v1/work-orders/{test_work_order.uuid}/items/{test_work_order_item.uuid}"
        )
        data = response.json()

        expected_fields = [
            "id",
            "work_order_id",
            "item_number",
            "status",
            "discrepancy",
            "corrective_action",
            "notes",
            "category",
            "sub_category",
            "ata_code",
            "hours_estimate",
            "billing_method",
            "flat_rate",
            "department",
            "do_not_bill",
            "enable_rii",
            "created_by",
            "updated_by",
            "created_at",
            "updated_at",
        ]
        for field in expected_fields:
            assert field in data, f"Missing field: {field}"


class TestUpdateWorkOrderItem:
    """Tests for PUT /api/v1/work-orders/{work_order_id}/items/{item_id} endpoint."""

    async def test_update_work_order_item_status(
        self,
        client: AsyncClient,
        test_work_order: WorkOrder,
        test_work_order_item: WorkOrderItem,
    ):
        """Test updating item status."""
        payload = {"status": "in_progress"}
        response = await client.put(
            f"/api/v1/work-orders/{test_work_order.uuid}/items/{test_work_order_item.uuid}",
            json=payload,
        )
        assert response.status_code == 200

        data = response.json()
        assert data["status"] == "in_progress"

    async def test_update_work_order_item_multiple_fields(
        self,
        client: AsyncClient,
        test_work_order: WorkOrder,
        test_work_order_item: WorkOrderItem,
    ):
        """Test updating multiple item fields."""
        payload = {
            "status": "finished",
            "corrective_action": "Updated corrective action",
            "hours_estimate": "4.0",
            "updated_by": "admin_user",
        }
        response = await client.put(
            f"/api/v1/work-orders/{test_work_order.uuid}/items/{test_work_order_item.uuid}",
            json=payload,
        )
        assert response.status_code == 200

        data = response.json()
        assert data["status"] == "finished"
        assert data["corrective_action"] == "Updated corrective action"
        assert float(data["hours_estimate"]) == 4.0
        assert data["updated_by"] == "admin_user"

    async def test_update_work_order_item_work_order_not_found(
        self, client: AsyncClient, test_work_order_item: WorkOrderItem
    ):
        """Test updating item with non-existent work order returns 404."""
        fake_wo_id = uuid4()
        payload = {"status": "in_progress"}
        response = await client.put(
            f"/api/v1/work-orders/{fake_wo_id}/items/{test_work_order_item.uuid}",
            json=payload,
        )
        assert response.status_code == 404
        assert response.json()["detail"] == "Work order not found"

    async def test_update_work_order_item_not_found(
        self, client: AsyncClient, test_work_order: WorkOrder
    ):
        """Test updating non-existent item returns 404."""
        fake_item_id = uuid4()
        payload = {"status": "in_progress"}
        response = await client.put(
            f"/api/v1/work-orders/{test_work_order.uuid}/items/{fake_item_id}",
            json=payload,
        )
        assert response.status_code == 404


class TestDeleteWorkOrderItem:
    """Tests for DELETE /api/v1/work-orders/{work_order_id}/items/{item_id} endpoint."""

    async def test_delete_work_order_item(
        self, client: AsyncClient, test_work_order: WorkOrder
    ):
        """Test deleting an item."""
        # First create an item
        payload = {"created_by": "test_user"}
        create_response = await client.post(
            f"/api/v1/work-orders/{test_work_order.uuid}/items", json=payload
        )
        item_id = create_response.json()["id"]

        # Now delete it
        delete_response = await client.delete(
            f"/api/v1/work-orders/{test_work_order.uuid}/items/{item_id}"
        )
        assert delete_response.status_code == 204

        # Verify it's deleted
        get_response = await client.get(
            f"/api/v1/work-orders/{test_work_order.uuid}/items/{item_id}"
        )
        assert get_response.status_code == 404

    async def test_delete_work_order_item_work_order_not_found(
        self, client: AsyncClient, test_work_order_item: WorkOrderItem
    ):
        """Test deleting item with non-existent work order returns 404."""
        fake_wo_id = uuid4()
        response = await client.delete(
            f"/api/v1/work-orders/{fake_wo_id}/items/{test_work_order_item.uuid}"
        )
        assert response.status_code == 404
        assert response.json()["detail"] == "Work order not found"

    async def test_delete_work_order_item_not_found(
        self, client: AsyncClient, test_work_order: WorkOrder
    ):
        """Test deleting non-existent item returns 404."""
        fake_item_id = uuid4()
        response = await client.delete(
            f"/api/v1/work-orders/{test_work_order.uuid}/items/{fake_item_id}"
        )
        assert response.status_code == 404
