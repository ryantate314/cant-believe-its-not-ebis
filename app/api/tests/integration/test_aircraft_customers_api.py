"""Integration tests for Aircraft-Customer relationship endpoints."""

import pytest
from uuid import uuid4
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from models.city import City
from models.aircraft import Aircraft
from models.customer import Customer
from models.aircraft_customer import AircraftCustomer
from models.work_order import WorkOrder


class TestLinkCustomerToAircraft:
    """Tests for POST /api/v1/customers/{customer_id}/aircraft/{aircraft_id}."""

    async def test_link_customer_to_aircraft(
        self, client: AsyncClient, test_customer: Customer, test_aircraft: Aircraft
    ):
        """First link becomes primary."""
        response = await client.post(
            f"/api/v1/customers/{test_customer.uuid}/aircraft/{test_aircraft.uuid}?created_by=test_user"
        )
        assert response.status_code == 201
        data = response.json()
        assert data["is_primary"] is True

    async def test_link_second_customer_not_primary(
        self,
        client: AsyncClient,
        test_session: AsyncSession,
        test_customer: Customer,
        test_aircraft: Aircraft,
        test_aircraft_customer_link: AircraftCustomer,
    ):
        """Second link should not be primary."""
        # Create a second customer
        second_customer = Customer(
            uuid=uuid4(),
            name="Second Customer",
            email="second@example.com",
            is_active=True,
            created_by="test_user",
        )
        test_session.add(second_customer)
        await test_session.commit()
        await test_session.refresh(second_customer)

        response = await client.post(
            f"/api/v1/customers/{second_customer.uuid}/aircraft/{test_aircraft.uuid}?created_by=test_user"
        )
        assert response.status_code == 201
        data = response.json()
        assert data["is_primary"] is False

    async def test_link_customer_not_found(
        self, client: AsyncClient, test_aircraft: Aircraft
    ):
        """404 for non-existent customer."""
        fake_id = uuid4()
        response = await client.post(
            f"/api/v1/customers/{fake_id}/aircraft/{test_aircraft.uuid}?created_by=test_user"
        )
        assert response.status_code == 404

    async def test_link_aircraft_not_found(
        self, client: AsyncClient, test_customer: Customer
    ):
        """404 for non-existent aircraft."""
        fake_id = uuid4()
        response = await client.post(
            f"/api/v1/customers/{test_customer.uuid}/aircraft/{fake_id}?created_by=test_user"
        )
        assert response.status_code == 404

    async def test_link_duplicate(
        self,
        client: AsyncClient,
        test_customer: Customer,
        test_aircraft: Aircraft,
        test_aircraft_customer_link: AircraftCustomer,
    ):
        """400 for already linked."""
        response = await client.post(
            f"/api/v1/customers/{test_customer.uuid}/aircraft/{test_aircraft.uuid}?created_by=test_user"
        )
        assert response.status_code == 400
        assert "already linked" in response.json()["detail"].lower()


class TestUnlinkCustomerFromAircraft:
    """Tests for DELETE /api/v1/customers/{customer_id}/aircraft/{aircraft_id}."""

    async def test_unlink_customer(
        self,
        client: AsyncClient,
        test_customer: Customer,
        test_aircraft: Aircraft,
        test_aircraft_customer_link: AircraftCustomer,
    ):
        """Unlink returns 204."""
        response = await client.delete(
            f"/api/v1/customers/{test_customer.uuid}/aircraft/{test_aircraft.uuid}"
        )
        assert response.status_code == 204

    async def test_unlink_not_linked(
        self, client: AsyncClient, test_customer: Customer, test_aircraft: Aircraft
    ):
        """404 when not linked."""
        response = await client.delete(
            f"/api/v1/customers/{test_customer.uuid}/aircraft/{test_aircraft.uuid}"
        )
        assert response.status_code == 404


class TestSetPrimaryCustomer:
    """Tests for PUT /api/v1/customers/{customer_id}/aircraft/{aircraft_id}/primary."""

    async def test_set_primary(
        self,
        client: AsyncClient,
        test_customer: Customer,
        test_aircraft: Aircraft,
        test_aircraft_customer_link: AircraftCustomer,
    ):
        """Set primary returns 200."""
        response = await client.put(
            f"/api/v1/customers/{test_customer.uuid}/aircraft/{test_aircraft.uuid}/primary"
        )
        assert response.status_code == 200

    async def test_set_primary_not_linked(
        self, client: AsyncClient, test_customer: Customer, test_aircraft: Aircraft
    ):
        """404 when not linked."""
        response = await client.put(
            f"/api/v1/customers/{test_customer.uuid}/aircraft/{test_aircraft.uuid}/primary"
        )
        assert response.status_code == 404


class TestListCustomerAircraft:
    """Tests for GET /api/v1/customers/{customer_id}/aircraft."""

    async def test_list_aircraft_for_customer(
        self,
        client: AsyncClient,
        test_customer: Customer,
        test_aircraft: Aircraft,
        test_aircraft_customer_link: AircraftCustomer,
    ):
        """Returns list of aircraft with is_primary flag."""
        response = await client.get(
            f"/api/v1/customers/{test_customer.uuid}/aircraft"
        )
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        assert data[0]["registration_number"] == test_aircraft.registration_number
        assert data[0]["is_primary"] is True

    async def test_list_aircraft_empty(
        self, client: AsyncClient, test_customer: Customer
    ):
        """Returns empty list when no aircraft linked."""
        response = await client.get(
            f"/api/v1/customers/{test_customer.uuid}/aircraft"
        )
        assert response.status_code == 200
        data = response.json()
        assert data == []

    async def test_list_aircraft_customer_not_found(self, client: AsyncClient):
        """Returns 404 for non-existent customer."""
        fake_id = uuid4()
        response = await client.get(f"/api/v1/customers/{fake_id}/aircraft")
        assert response.status_code == 404


class TestWorkOrderAutoLink:
    """Tests for work order auto-linking customer from aircraft."""

    async def test_create_work_order_auto_links_customer(
        self,
        client: AsyncClient,
        test_city: City,
        test_aircraft: Aircraft,
        test_customer: Customer,
        test_aircraft_customer_link: AircraftCustomer,
    ):
        """Creating WO for aircraft with primary customer auto-populates."""
        payload = {
            "city_id": str(test_city.uuid),
            "aircraft_id": str(test_aircraft.uuid),
            "created_by": "test_user",
        }
        response = await client.post("/api/v1/work-orders", json=payload)
        assert response.status_code == 201

        data = response.json()
        assert data["customer"] is not None
        assert data["customer"]["name"] == test_customer.name
        assert data["customer"]["email"] == test_customer.email

    async def test_create_work_order_no_primary_customer(
        self, client: AsyncClient, test_city: City, test_aircraft: Aircraft
    ):
        """Creating WO for aircraft with no customers sets customer to null."""
        payload = {
            "city_id": str(test_city.uuid),
            "aircraft_id": str(test_aircraft.uuid),
            "created_by": "test_user",
        }
        response = await client.post("/api/v1/work-orders", json=payload)
        assert response.status_code == 201

        data = response.json()
        assert data["customer"] is None


class TestAircraftResponseIncludesCustomers:
    """Tests for aircraft response including customers."""

    async def test_get_aircraft_shows_customers(
        self,
        client: AsyncClient,
        test_aircraft: Aircraft,
        test_customer: Customer,
        test_aircraft_customer_link: AircraftCustomer,
    ):
        """Aircraft GET response includes customers list."""
        response = await client.get(f"/api/v1/aircraft/{test_aircraft.uuid}")
        assert response.status_code == 200

        data = response.json()
        assert "customers" in data
        assert len(data["customers"]) == 1
        assert data["customers"][0]["name"] == test_customer.name
        assert data["customers"][0]["is_primary"] is True

    async def test_get_aircraft_no_customers(
        self, client: AsyncClient, test_aircraft: Aircraft
    ):
        """Aircraft GET response has empty customers list."""
        response = await client.get(f"/api/v1/aircraft/{test_aircraft.uuid}")
        assert response.status_code == 200

        data = response.json()
        assert data["customers"] == []

    async def test_list_aircraft_shows_customers(
        self,
        client: AsyncClient,
        test_aircraft: Aircraft,
        test_customer: Customer,
        test_aircraft_customer_link: AircraftCustomer,
    ):
        """Aircraft list response includes customers."""
        response = await client.get("/api/v1/aircraft")
        assert response.status_code == 200

        data = response.json()
        assert data["total"] >= 1
        aircraft = data["items"][0]
        assert "customers" in aircraft
        assert len(aircraft["customers"]) == 1
