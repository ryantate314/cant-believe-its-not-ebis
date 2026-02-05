"""Integration tests for the Customers API endpoints."""

import pytest
from uuid import uuid4
from httpx import AsyncClient

from models.customer import Customer


class TestListCustomers:
    """Tests for GET /api/v1/customers endpoint."""

    async def test_list_customers_returns_active_by_default(
        self, client: AsyncClient, test_customer: Customer, test_customer_inactive: Customer
    ):
        """Test that listing customers returns only active customers by default."""
        response = await client.get("/api/v1/customers")
        assert response.status_code == 200

        data = response.json()
        assert "items" in data
        assert "total" in data
        assert data["total"] == 1

        customer = data["items"][0]
        assert customer["name"] == "Test Customer"
        assert customer["is_active"] is True

    async def test_list_customers_empty(self, client: AsyncClient):
        """Test listing customers when none exist."""
        response = await client.get("/api/v1/customers")
        assert response.status_code == 200

        data = response.json()
        assert data["items"] == []
        assert data["total"] == 0

    async def test_list_customers_search(
        self, client: AsyncClient, test_customer: Customer
    ):
        """Test that search filters customers by name."""
        response = await client.get("/api/v1/customers?search=Test")
        assert response.status_code == 200

        data = response.json()
        assert data["total"] == 1
        assert data["items"][0]["name"] == "Test Customer"

    async def test_list_customers_search_no_match(
        self, client: AsyncClient, test_customer: Customer
    ):
        """Test that search with no match returns empty."""
        response = await client.get("/api/v1/customers?search=Nonexistent")
        assert response.status_code == 200

        data = response.json()
        assert data["total"] == 0
        assert data["items"] == []

    async def test_list_customers_search_by_email(
        self, client: AsyncClient, test_customer: Customer
    ):
        """Test that search matches on email."""
        response = await client.get("/api/v1/customers?search=test@example")
        assert response.status_code == 200

        data = response.json()
        assert data["total"] == 1

    async def test_list_customers_search_by_phone(
        self, client: AsyncClient, test_customer: Customer
    ):
        """Test that search matches on phone."""
        response = await client.get("/api/v1/customers?search=555-0100")
        assert response.status_code == 200

        data = response.json()
        assert data["total"] == 1

    async def test_list_customers_pagination(
        self, client: AsyncClient, test_customer: Customer, test_customer_inactive: Customer
    ):
        """Test pagination with page and page_size."""
        response = await client.get("/api/v1/customers?active_only=false&page=1&page_size=1")
        assert response.status_code == 200

        data = response.json()
        assert data["total"] == 2
        assert len(data["items"]) == 1
        assert data["page"] == 1
        assert data["page_size"] == 1

    async def test_list_customers_pagination_beyond_data(
        self, client: AsyncClient, test_customer: Customer
    ):
        """Test that requesting a page beyond available data returns empty items."""
        response = await client.get("/api/v1/customers?page=99")
        assert response.status_code == 200

        data = response.json()
        assert data["total"] == 1
        assert data["items"] == []

    async def test_list_customers_sorting(
        self, client: AsyncClient, test_customer: Customer, test_customer_inactive: Customer
    ):
        """Test sorting by name ascending."""
        response = await client.get(
            "/api/v1/customers?active_only=false&sort_by=name&sort_order=asc"
        )
        assert response.status_code == 200

        data = response.json()
        names = [c["name"] for c in data["items"]]
        assert names == sorted(names)

    async def test_list_customers_include_inactive(
        self, client: AsyncClient, test_customer: Customer, test_customer_inactive: Customer
    ):
        """Test that active_only=false returns all customers."""
        response = await client.get("/api/v1/customers?active_only=false")
        assert response.status_code == 200

        data = response.json()
        assert data["total"] == 2


class TestGetCustomer:
    """Tests for GET /api/v1/customers/{customer_id} endpoint."""

    async def test_get_customer_by_id(
        self, client: AsyncClient, test_customer: Customer
    ):
        """Test getting a specific customer by ID."""
        response = await client.get(f"/api/v1/customers/{test_customer.uuid}")
        assert response.status_code == 200

        data = response.json()
        assert data["name"] == "Test Customer"
        assert data["email"] == "test@example.com"
        assert data["phone"] == "555-0100"
        assert data["phone_type"] == "office"
        assert data["address"] == "123 Main St"
        assert data["city"] == "Knoxville"
        assert data["state"] == "TN"
        assert data["zip"] == "37901"
        assert data["country"] == "US"
        assert data["is_active"] is True
        assert data["created_by"] == "test_user"
        assert "id" in data
        assert "created_at" in data
        assert "updated_at" in data

    async def test_get_customer_not_found(self, client: AsyncClient):
        """Test getting a non-existent customer returns 404."""
        fake_id = uuid4()
        response = await client.get(f"/api/v1/customers/{fake_id}")
        assert response.status_code == 404
        assert response.json()["detail"] == "Customer not found"

    async def test_get_customer_invalid_uuid(self, client: AsyncClient):
        """Test getting a customer with invalid UUID format returns 422."""
        response = await client.get("/api/v1/customers/not-a-uuid")
        assert response.status_code == 422


class TestCreateCustomer:
    """Tests for POST /api/v1/customers endpoint."""

    async def test_create_customer_minimal(self, client: AsyncClient):
        """Test creating a customer with only required fields."""
        payload = {
            "name": "Minimal Customer",
            "created_by": "test_user",
        }
        response = await client.post("/api/v1/customers", json=payload)
        assert response.status_code == 201

        data = response.json()
        assert data["name"] == "Minimal Customer"
        assert data["email"] is None
        assert data["phone"] is None
        assert data["is_active"] is True
        assert data["created_by"] == "test_user"
        assert "id" in data

    async def test_create_customer_full(self, client: AsyncClient):
        """Test creating a customer with all fields populated."""
        payload = {
            "name": "Full Customer",
            "email": "full@example.com",
            "phone": "555-9999",
            "phone_type": "mobile",
            "address": "456 Oak Ave",
            "address_2": "Suite 100",
            "city": "Nashville",
            "state": "TN",
            "zip": "37201",
            "country": "US",
            "notes": "VIP customer",
            "is_active": True,
            "created_by": "test_user",
        }
        response = await client.post("/api/v1/customers", json=payload)
        assert response.status_code == 201

        data = response.json()
        assert data["name"] == "Full Customer"
        assert data["email"] == "full@example.com"
        assert data["phone"] == "555-9999"
        assert data["phone_type"] == "mobile"
        assert data["address"] == "456 Oak Ave"
        assert data["address_2"] == "Suite 100"
        assert data["city"] == "Nashville"
        assert data["state"] == "TN"
        assert data["zip"] == "37201"
        assert data["country"] == "US"
        assert data["notes"] == "VIP customer"

    async def test_create_customer_missing_name(self, client: AsyncClient):
        """Test that creating a customer without a name returns 422."""
        payload = {
            "created_by": "test_user",
        }
        response = await client.post("/api/v1/customers", json=payload)
        assert response.status_code == 422

    async def test_create_customer_missing_created_by(self, client: AsyncClient):
        """Test that creating a customer without created_by returns 422."""
        payload = {
            "name": "No Author Customer",
        }
        response = await client.post("/api/v1/customers", json=payload)
        assert response.status_code == 422


class TestUpdateCustomer:
    """Tests for PUT /api/v1/customers/{customer_id} endpoint."""

    async def test_update_customer_partial(
        self, client: AsyncClient, test_customer: Customer
    ):
        """Test updating a single field on a customer."""
        payload = {
            "name": "Updated Customer Name",
            "updated_by": "editor_user",
        }
        response = await client.put(
            f"/api/v1/customers/{test_customer.uuid}", json=payload
        )
        assert response.status_code == 200

        data = response.json()
        assert data["name"] == "Updated Customer Name"
        assert data["updated_by"] == "editor_user"
        # Unchanged fields should remain
        assert data["email"] == "test@example.com"
        assert data["phone"] == "555-0100"

    async def test_update_customer_empty_body(
        self, client: AsyncClient, test_customer: Customer
    ):
        """Test updating with empty body is a no-op."""
        response = await client.put(
            f"/api/v1/customers/{test_customer.uuid}", json={}
        )
        assert response.status_code == 200

        data = response.json()
        assert data["name"] == "Test Customer"

    async def test_update_customer_not_found(self, client: AsyncClient):
        """Test updating a non-existent customer returns 404."""
        fake_id = uuid4()
        payload = {"name": "Ghost"}
        response = await client.put(f"/api/v1/customers/{fake_id}", json=payload)
        assert response.status_code == 404
        assert response.json()["detail"] == "Customer not found"


class TestDeleteCustomer:
    """Tests for DELETE /api/v1/customers/{customer_id} endpoint."""

    async def test_delete_customer(
        self, client: AsyncClient, test_customer: Customer
    ):
        """Test deleting a customer returns 204."""
        response = await client.delete(f"/api/v1/customers/{test_customer.uuid}")
        assert response.status_code == 204

        # Verify it's gone
        get_response = await client.get(f"/api/v1/customers/{test_customer.uuid}")
        assert get_response.status_code == 404

    async def test_delete_customer_not_found(self, client: AsyncClient):
        """Test deleting a non-existent customer returns 404."""
        fake_id = uuid4()
        response = await client.delete(f"/api/v1/customers/{fake_id}")
        assert response.status_code == 404
        assert response.json()["detail"] == "Customer not found"
