"""Integration tests for the Labor Kits API endpoints."""

import pytest
from uuid import uuid4
from httpx import AsyncClient

from models.labor_kit import LaborKit
from models.labor_kit_item import LaborKitItem


class TestListLaborKits:
    """Tests for GET /api/v1/labor-kits endpoint."""

    async def test_list_labor_kits(
        self, client: AsyncClient, test_labor_kit: LaborKit
    ):
        """Test listing all labor kits."""
        response = await client.get("/api/v1/labor-kits")
        assert response.status_code == 200

        data = response.json()
        assert "items" in data
        assert "total" in data
        assert data["total"] >= 1

        kit = data["items"][0]
        assert kit["name"] == test_labor_kit.name

    async def test_list_labor_kits_empty(self, client: AsyncClient):
        """Test listing kits when none exist."""
        response = await client.get("/api/v1/labor-kits")
        assert response.status_code == 200

        data = response.json()
        assert data["items"] == []
        assert data["total"] == 0

    async def test_list_labor_kits_active_only(
        self, client: AsyncClient, test_labor_kit: LaborKit, test_labor_kit_inactive: LaborKit
    ):
        """Test listing only active labor kits."""
        response = await client.get("/api/v1/labor-kits?active_only=true")
        assert response.status_code == 200

        data = response.json()
        # Only active kit should be returned
        assert data["total"] == 1
        assert data["items"][0]["name"] == test_labor_kit.name
        assert data["items"][0]["is_active"] is True

    async def test_list_labor_kits_sorted(
        self, client: AsyncClient, test_labor_kit: LaborKit
    ):
        """Test listing labor kits with sorting."""
        response = await client.get("/api/v1/labor-kits?sort_by=name&sort_order=desc")
        assert response.status_code == 200

        data = response.json()
        assert len(data["items"]) >= 1


class TestCreateLaborKit:
    """Tests for POST /api/v1/labor-kits endpoint."""

    async def test_create_labor_kit_minimal(self, client: AsyncClient):
        """Test creating a labor kit with minimal fields."""
        payload = {
            "name": "Basic Inspection",
            "created_by": "test_user",
        }
        response = await client.post("/api/v1/labor-kits", json=payload)
        assert response.status_code == 201

        data = response.json()
        assert data["name"] == "Basic Inspection"
        assert data["is_active"] is True
        assert data["created_by"] == "test_user"

    async def test_create_labor_kit_full(self, client: AsyncClient):
        """Test creating a labor kit with all fields."""
        payload = {
            "name": "Annual Inspection",
            "description": "Complete annual inspection for single-engine aircraft",
            "category": "Airframe",
            "is_active": True,
            "created_by": "admin_user",
        }
        response = await client.post("/api/v1/labor-kits", json=payload)
        assert response.status_code == 201

        data = response.json()
        assert data["name"] == "Annual Inspection"
        assert data["description"] == "Complete annual inspection for single-engine aircraft"
        assert data["category"] == "Airframe"
        assert data["is_active"] is True

    async def test_create_labor_kit_inactive(self, client: AsyncClient):
        """Test creating an inactive labor kit."""
        payload = {
            "name": "Legacy Kit",
            "is_active": False,
            "created_by": "test_user",
        }
        response = await client.post("/api/v1/labor-kits", json=payload)
        assert response.status_code == 201

        data = response.json()
        assert data["is_active"] is False


class TestGetLaborKit:
    """Tests for GET /api/v1/labor-kits/{kit_id} endpoint."""

    async def test_get_labor_kit(self, client: AsyncClient, test_labor_kit: LaborKit):
        """Test getting a specific labor kit by ID."""
        response = await client.get(f"/api/v1/labor-kits/{test_labor_kit.uuid}")
        assert response.status_code == 200

        data = response.json()
        assert data["name"] == test_labor_kit.name
        assert data["description"] == test_labor_kit.description
        assert data["category"] == test_labor_kit.category

    async def test_get_labor_kit_not_found(self, client: AsyncClient):
        """Test getting non-existent labor kit returns 404."""
        fake_id = uuid4()
        response = await client.get(f"/api/v1/labor-kits/{fake_id}")
        assert response.status_code == 404
        assert response.json()["detail"] == "Labor kit not found"

    async def test_get_labor_kit_response_format(
        self, client: AsyncClient, test_labor_kit: LaborKit
    ):
        """Test that labor kit response has all expected fields."""
        response = await client.get(f"/api/v1/labor-kits/{test_labor_kit.uuid}")
        data = response.json()

        expected_fields = [
            "id",
            "name",
            "description",
            "category",
            "is_active",
            "created_by",
            "updated_by",
            "created_at",
            "updated_at",
        ]
        for field in expected_fields:
            assert field in data, f"Missing field: {field}"


class TestUpdateLaborKit:
    """Tests for PUT /api/v1/labor-kits/{kit_id} endpoint."""

    async def test_update_labor_kit_name(
        self, client: AsyncClient, test_labor_kit: LaborKit
    ):
        """Test updating labor kit name."""
        payload = {"name": "Updated Kit Name"}
        response = await client.put(
            f"/api/v1/labor-kits/{test_labor_kit.uuid}", json=payload
        )
        assert response.status_code == 200

        data = response.json()
        assert data["name"] == "Updated Kit Name"

    async def test_update_labor_kit_multiple_fields(
        self, client: AsyncClient, test_labor_kit: LaborKit
    ):
        """Test updating multiple labor kit fields."""
        payload = {
            "name": "Comprehensive Service",
            "description": "Updated description",
            "category": "Avionics",
            "is_active": False,
            "updated_by": "admin_user",
        }
        response = await client.put(
            f"/api/v1/labor-kits/{test_labor_kit.uuid}", json=payload
        )
        assert response.status_code == 200

        data = response.json()
        assert data["name"] == "Comprehensive Service"
        assert data["description"] == "Updated description"
        assert data["category"] == "Avionics"
        assert data["is_active"] is False
        assert data["updated_by"] == "admin_user"

    async def test_update_labor_kit_not_found(self, client: AsyncClient):
        """Test updating non-existent labor kit returns 404."""
        fake_id = uuid4()
        payload = {"name": "New Name"}
        response = await client.put(f"/api/v1/labor-kits/{fake_id}", json=payload)
        assert response.status_code == 404
        assert response.json()["detail"] == "Labor kit not found"


class TestDeleteLaborKit:
    """Tests for DELETE /api/v1/labor-kits/{kit_id} endpoint."""

    async def test_delete_labor_kit(self, client: AsyncClient):
        """Test deleting a labor kit."""
        # First create a kit
        payload = {"name": "To Be Deleted", "created_by": "test_user"}
        create_response = await client.post("/api/v1/labor-kits", json=payload)
        kit_id = create_response.json()["id"]

        # Now delete it
        delete_response = await client.delete(f"/api/v1/labor-kits/{kit_id}")
        assert delete_response.status_code == 204

        # Verify it's deleted
        get_response = await client.get(f"/api/v1/labor-kits/{kit_id}")
        assert get_response.status_code == 404

    async def test_delete_labor_kit_not_found(self, client: AsyncClient):
        """Test deleting non-existent labor kit returns 404."""
        fake_id = uuid4()
        response = await client.delete(f"/api/v1/labor-kits/{fake_id}")
        assert response.status_code == 404
        assert response.json()["detail"] == "Labor kit not found"


class TestListLaborKitItems:
    """Tests for GET /api/v1/labor-kits/{kit_id}/items endpoint."""

    async def test_list_labor_kit_items(
        self, client: AsyncClient, test_labor_kit: LaborKit, test_labor_kit_item: LaborKitItem
    ):
        """Test listing items for a labor kit."""
        response = await client.get(f"/api/v1/labor-kits/{test_labor_kit.uuid}/items")
        assert response.status_code == 200

        data = response.json()
        assert "items" in data
        assert "total" in data
        assert data["total"] == 1

        item = data["items"][0]
        assert item["item_number"] == test_labor_kit_item.item_number
        assert item["discrepancy"] == test_labor_kit_item.discrepancy

    async def test_list_labor_kit_items_empty(
        self, client: AsyncClient, test_labor_kit: LaborKit
    ):
        """Test listing items when none exist."""
        response = await client.get(f"/api/v1/labor-kits/{test_labor_kit.uuid}/items")
        assert response.status_code == 200

        data = response.json()
        assert data["items"] == []
        assert data["total"] == 0

    async def test_list_labor_kit_items_kit_not_found(self, client: AsyncClient):
        """Test listing items for non-existent labor kit returns 404."""
        fake_id = uuid4()
        response = await client.get(f"/api/v1/labor-kits/{fake_id}/items")
        assert response.status_code == 404
        assert response.json()["detail"] == "Labor kit not found"


class TestCreateLaborKitItem:
    """Tests for POST /api/v1/labor-kits/{kit_id}/items endpoint."""

    async def test_create_labor_kit_item_minimal(
        self, client: AsyncClient, test_labor_kit: LaborKit
    ):
        """Test creating an item with minimal required fields."""
        payload = {"created_by": "test_user"}
        response = await client.post(
            f"/api/v1/labor-kits/{test_labor_kit.uuid}/items", json=payload
        )
        assert response.status_code == 201

        data = response.json()
        assert data["item_number"] == 1
        assert data["billing_method"] == "hourly"
        assert data["do_not_bill"] is False
        assert data["created_by"] == "test_user"

    async def test_create_labor_kit_item_full(
        self, client: AsyncClient, test_labor_kit: LaborKit
    ):
        """Test creating an item with all fields."""
        payload = {
            "created_by": "tech_user",
            "discrepancy": "Check oil pressure",
            "corrective_action": "Verify oil pressure within limits",
            "notes": "Standard procedure",
            "category": "Powerplant",
            "sub_category": "Oil System",
            "ata_code": "79-10",
            "hours_estimate": "1.5",
            "billing_method": "flat_rate",
            "flat_rate": "250.00",
            "department": "Engine Shop",
            "do_not_bill": False,
            "enable_rii": True,
        }
        response = await client.post(
            f"/api/v1/labor-kits/{test_labor_kit.uuid}/items", json=payload
        )
        assert response.status_code == 201

        data = response.json()
        assert data["discrepancy"] == "Check oil pressure"
        assert data["ata_code"] == "79-10"
        assert float(data["hours_estimate"]) == 1.5
        assert data["enable_rii"] is True

    async def test_create_labor_kit_item_kit_not_found(self, client: AsyncClient):
        """Test creating item for non-existent labor kit returns 404."""
        fake_id = uuid4()
        payload = {"created_by": "test_user"}
        response = await client.post(
            f"/api/v1/labor-kits/{fake_id}/items", json=payload
        )
        assert response.status_code == 404

    async def test_create_labor_kit_item_sequence_increments(
        self, client: AsyncClient, test_labor_kit: LaborKit
    ):
        """Test that item numbers increment for same labor kit."""
        payload = {"created_by": "test_user"}

        # Create first item
        response1 = await client.post(
            f"/api/v1/labor-kits/{test_labor_kit.uuid}/items", json=payload
        )
        assert response1.status_code == 201
        num1 = response1.json()["item_number"]

        # Create second item
        response2 = await client.post(
            f"/api/v1/labor-kits/{test_labor_kit.uuid}/items", json=payload
        )
        assert response2.status_code == 201
        num2 = response2.json()["item_number"]

        assert num2 == num1 + 1


class TestGetLaborKitItem:
    """Tests for GET /api/v1/labor-kits/{kit_id}/items/{item_id} endpoint."""

    async def test_get_labor_kit_item(
        self, client: AsyncClient, test_labor_kit: LaborKit, test_labor_kit_item: LaborKitItem
    ):
        """Test getting a specific item by ID."""
        response = await client.get(
            f"/api/v1/labor-kits/{test_labor_kit.uuid}/items/{test_labor_kit_item.uuid}"
        )
        assert response.status_code == 200

        data = response.json()
        assert data["item_number"] == test_labor_kit_item.item_number
        assert data["discrepancy"] == test_labor_kit_item.discrepancy
        assert data["labor_kit_id"] == str(test_labor_kit.uuid)

    async def test_get_labor_kit_item_kit_not_found(
        self, client: AsyncClient, test_labor_kit_item: LaborKitItem
    ):
        """Test getting item with non-existent labor kit returns 404."""
        fake_kit_id = uuid4()
        response = await client.get(
            f"/api/v1/labor-kits/{fake_kit_id}/items/{test_labor_kit_item.uuid}"
        )
        assert response.status_code == 404
        assert response.json()["detail"] == "Labor kit not found"

    async def test_get_labor_kit_item_not_found(
        self, client: AsyncClient, test_labor_kit: LaborKit
    ):
        """Test getting non-existent item returns 404."""
        fake_item_id = uuid4()
        response = await client.get(
            f"/api/v1/labor-kits/{test_labor_kit.uuid}/items/{fake_item_id}"
        )
        assert response.status_code == 404
        assert response.json()["detail"] == "Labor kit item not found"


class TestUpdateLaborKitItem:
    """Tests for PUT /api/v1/labor-kits/{kit_id}/items/{item_id} endpoint."""

    async def test_update_labor_kit_item(
        self, client: AsyncClient, test_labor_kit: LaborKit, test_labor_kit_item: LaborKitItem
    ):
        """Test updating labor kit item."""
        payload = {
            "discrepancy": "Updated discrepancy",
            "hours_estimate": "3.0",
            "updated_by": "admin_user",
        }
        response = await client.put(
            f"/api/v1/labor-kits/{test_labor_kit.uuid}/items/{test_labor_kit_item.uuid}",
            json=payload,
        )
        assert response.status_code == 200

        data = response.json()
        assert data["discrepancy"] == "Updated discrepancy"
        assert float(data["hours_estimate"]) == 3.0
        assert data["updated_by"] == "admin_user"

    async def test_update_labor_kit_item_kit_not_found(
        self, client: AsyncClient, test_labor_kit_item: LaborKitItem
    ):
        """Test updating item with non-existent labor kit returns 404."""
        fake_kit_id = uuid4()
        payload = {"discrepancy": "New discrepancy"}
        response = await client.put(
            f"/api/v1/labor-kits/{fake_kit_id}/items/{test_labor_kit_item.uuid}",
            json=payload,
        )
        assert response.status_code == 404
        assert response.json()["detail"] == "Labor kit not found"

    async def test_update_labor_kit_item_not_found(
        self, client: AsyncClient, test_labor_kit: LaborKit
    ):
        """Test updating non-existent item returns 404."""
        fake_item_id = uuid4()
        payload = {"discrepancy": "New discrepancy"}
        response = await client.put(
            f"/api/v1/labor-kits/{test_labor_kit.uuid}/items/{fake_item_id}",
            json=payload,
        )
        assert response.status_code == 404


class TestDeleteLaborKitItem:
    """Tests for DELETE /api/v1/labor-kits/{kit_id}/items/{item_id} endpoint."""

    async def test_delete_labor_kit_item(
        self, client: AsyncClient, test_labor_kit: LaborKit
    ):
        """Test deleting a labor kit item."""
        # First create an item
        payload = {"created_by": "test_user"}
        create_response = await client.post(
            f"/api/v1/labor-kits/{test_labor_kit.uuid}/items", json=payload
        )
        item_id = create_response.json()["id"]

        # Now delete it
        delete_response = await client.delete(
            f"/api/v1/labor-kits/{test_labor_kit.uuid}/items/{item_id}"
        )
        assert delete_response.status_code == 204

        # Verify it's deleted
        get_response = await client.get(
            f"/api/v1/labor-kits/{test_labor_kit.uuid}/items/{item_id}"
        )
        assert get_response.status_code == 404

    async def test_delete_labor_kit_item_kit_not_found(
        self, client: AsyncClient, test_labor_kit_item: LaborKitItem
    ):
        """Test deleting item with non-existent labor kit returns 404."""
        fake_kit_id = uuid4()
        response = await client.delete(
            f"/api/v1/labor-kits/{fake_kit_id}/items/{test_labor_kit_item.uuid}"
        )
        assert response.status_code == 404
        assert response.json()["detail"] == "Labor kit not found"

    async def test_delete_labor_kit_item_not_found(
        self, client: AsyncClient, test_labor_kit: LaborKit
    ):
        """Test deleting non-existent item returns 404."""
        fake_item_id = uuid4()
        response = await client.delete(
            f"/api/v1/labor-kits/{test_labor_kit.uuid}/items/{fake_item_id}"
        )
        assert response.status_code == 404
