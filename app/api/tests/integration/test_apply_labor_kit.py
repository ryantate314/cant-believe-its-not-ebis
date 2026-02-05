"""Integration tests for the Apply Labor Kit to Work Order functionality."""

import pytest
from uuid import uuid4
from httpx import AsyncClient

from models.labor_kit import LaborKit
from models.work_order import WorkOrder


class TestApplyLaborKit:
    """Tests for POST /api/v1/labor-kits/{kit_id}/apply/{work_order_id} endpoint."""

    async def test_apply_labor_kit_to_work_order(
        self,
        client: AsyncClient,
        test_labor_kit_with_items: LaborKit,
        test_work_order: WorkOrder,
    ):
        """Test applying a labor kit to a work order creates items."""
        response = await client.post(
            f"/api/v1/labor-kits/{test_labor_kit_with_items.uuid}/apply/{test_work_order.uuid}?created_by=test_user"
        )
        assert response.status_code == 200

        data = response.json()
        assert data["items_created"] == 3
        assert data["work_order_id"] == str(test_work_order.uuid)
        assert data["labor_kit_id"] == str(test_labor_kit_with_items.uuid)

        # Verify items were created on the work order
        items_response = await client.get(
            f"/api/v1/work-orders/{test_work_order.uuid}/items"
        )
        items_data = items_response.json()
        assert items_data["total"] == 3

        # Verify item numbers are sequential
        item_numbers = [item["item_number"] for item in items_data["items"]]
        assert sorted(item_numbers) == [1, 2, 3]

        # Verify first item content was copied
        first_item = next(i for i in items_data["items"] if i["item_number"] == 1)
        assert first_item["discrepancy"] == "Oil filter replacement"
        assert first_item["status"] == "open"

    async def test_apply_labor_kit_adds_to_existing_items(
        self,
        client: AsyncClient,
        test_labor_kit_with_items: LaborKit,
        test_work_order: WorkOrder,
    ):
        """Test applying a labor kit adds items after existing ones."""
        # First create an existing item on the work order
        create_response = await client.post(
            f"/api/v1/work-orders/{test_work_order.uuid}/items",
            json={"created_by": "test_user", "discrepancy": "Existing item"},
        )
        assert create_response.status_code == 201
        assert create_response.json()["item_number"] == 1

        # Now apply the labor kit
        response = await client.post(
            f"/api/v1/labor-kits/{test_labor_kit_with_items.uuid}/apply/{test_work_order.uuid}?created_by=test_user"
        )
        assert response.status_code == 200
        assert response.json()["items_created"] == 3

        # Verify total items count
        items_response = await client.get(
            f"/api/v1/work-orders/{test_work_order.uuid}/items"
        )
        items_data = items_response.json()
        assert items_data["total"] == 4  # 1 existing + 3 from kit

        # Verify kit items have correct item numbers (starting after existing)
        item_numbers = sorted([item["item_number"] for item in items_data["items"]])
        assert item_numbers == [1, 2, 3, 4]

    async def test_apply_labor_kit_empty_kit(
        self,
        client: AsyncClient,
        test_labor_kit: LaborKit,
        test_work_order: WorkOrder,
    ):
        """Test applying an empty labor kit returns 0 items created."""
        response = await client.post(
            f"/api/v1/labor-kits/{test_labor_kit.uuid}/apply/{test_work_order.uuid}?created_by=test_user"
        )
        assert response.status_code == 200

        data = response.json()
        assert data["items_created"] == 0

    async def test_apply_labor_kit_not_found(
        self, client: AsyncClient, test_work_order: WorkOrder
    ):
        """Test applying non-existent labor kit returns 400."""
        fake_kit_id = uuid4()
        response = await client.post(
            f"/api/v1/labor-kits/{fake_kit_id}/apply/{test_work_order.uuid}?created_by=test_user"
        )
        assert response.status_code == 400
        assert response.json()["detail"] == "Labor kit not found"

    async def test_apply_labor_kit_work_order_not_found(
        self, client: AsyncClient, test_labor_kit: LaborKit
    ):
        """Test applying labor kit to non-existent work order returns 400."""
        fake_wo_id = uuid4()
        response = await client.post(
            f"/api/v1/labor-kits/{test_labor_kit.uuid}/apply/{fake_wo_id}?created_by=test_user"
        )
        assert response.status_code == 400
        assert response.json()["detail"] == "Work order not found"

    async def test_apply_inactive_labor_kit(
        self,
        client: AsyncClient,
        test_labor_kit_inactive: LaborKit,
        test_work_order: WorkOrder,
    ):
        """Test applying an inactive labor kit returns 400."""
        response = await client.post(
            f"/api/v1/labor-kits/{test_labor_kit_inactive.uuid}/apply/{test_work_order.uuid}?created_by=test_user"
        )
        assert response.status_code == 400
        assert response.json()["detail"] == "Labor kit is not active"

    async def test_apply_labor_kit_preserves_fields(
        self,
        client: AsyncClient,
        test_labor_kit_with_items: LaborKit,
        test_work_order: WorkOrder,
    ):
        """Test that all fields are properly copied from kit items to work order items."""
        response = await client.post(
            f"/api/v1/labor-kits/{test_labor_kit_with_items.uuid}/apply/{test_work_order.uuid}?created_by=test_user"
        )
        assert response.status_code == 200

        # Get the created work order items
        items_response = await client.get(
            f"/api/v1/work-orders/{test_work_order.uuid}/items"
        )
        items = items_response.json()["items"]

        # Check the first item has expected fields
        first_item = next(i for i in items if i["item_number"] == 1)
        assert first_item["discrepancy"] == "Oil filter replacement"
        assert first_item["corrective_action"] == "Replace oil filter"
        assert first_item["category"] == "Maintenance"
        assert float(first_item["hours_estimate"]) == 1.0
        assert first_item["billing_method"] == "hourly"
        assert first_item["department"] == "Engine"
        assert first_item["status"] == "open"  # Always starts as open
        assert first_item["created_by"] == "test_user"  # From the request param

    async def test_apply_labor_kit_multiple_times(
        self,
        client: AsyncClient,
        test_labor_kit_with_items: LaborKit,
        test_work_order: WorkOrder,
    ):
        """Test applying the same labor kit multiple times."""
        # Apply first time
        response1 = await client.post(
            f"/api/v1/labor-kits/{test_labor_kit_with_items.uuid}/apply/{test_work_order.uuid}?created_by=user1"
        )
        assert response1.status_code == 200
        assert response1.json()["items_created"] == 3

        # Apply second time
        response2 = await client.post(
            f"/api/v1/labor-kits/{test_labor_kit_with_items.uuid}/apply/{test_work_order.uuid}?created_by=user2"
        )
        assert response2.status_code == 200
        assert response2.json()["items_created"] == 3

        # Verify total items
        items_response = await client.get(
            f"/api/v1/work-orders/{test_work_order.uuid}/items"
        )
        items_data = items_response.json()
        assert items_data["total"] == 6

        # Verify item numbers are all unique and sequential
        item_numbers = sorted([item["item_number"] for item in items_data["items"]])
        assert item_numbers == [1, 2, 3, 4, 5, 6]
