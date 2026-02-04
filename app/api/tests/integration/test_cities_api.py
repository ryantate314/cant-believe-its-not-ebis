"""Integration tests for the Cities API endpoints."""

import pytest
from uuid import uuid4
from httpx import AsyncClient

from models.city import City


class TestListCities:
    """Tests for GET /api/v1/cities endpoint."""

    async def test_list_cities_returns_active_by_default(
        self, client: AsyncClient, test_city: City, test_city_inactive: City
    ):
        """Test that listing cities returns only active cities by default."""
        response = await client.get("/api/v1/cities")
        assert response.status_code == 200

        data = response.json()
        assert "items" in data
        assert "total" in data
        assert data["total"] == 1

        city = data["items"][0]
        assert city["code"] == test_city.code
        assert city["is_active"] is True

    async def test_list_cities_with_active_only_false(
        self, client: AsyncClient, test_city: City, test_city_inactive: City
    ):
        """Test that listing cities with active_only=false returns all cities."""
        response = await client.get("/api/v1/cities?active_only=false")
        assert response.status_code == 200

        data = response.json()
        assert data["total"] == 2

        codes = {city["code"] for city in data["items"]}
        assert test_city.code in codes
        assert test_city_inactive.code in codes

    async def test_list_cities_empty(self, client: AsyncClient):
        """Test listing cities when none exist."""
        response = await client.get("/api/v1/cities")
        assert response.status_code == 200

        data = response.json()
        assert data["items"] == []
        assert data["total"] == 0

    async def test_list_cities_response_format(
        self, client: AsyncClient, test_city: City
    ):
        """Test that city response has correct format."""
        response = await client.get("/api/v1/cities")
        assert response.status_code == 200

        city = response.json()["items"][0]
        assert "id" in city
        assert "code" in city
        assert "name" in city
        assert "is_active" in city


class TestGetCity:
    """Tests for GET /api/v1/cities/{city_id} endpoint."""

    async def test_get_city_by_id(self, client: AsyncClient, test_city: City):
        """Test getting a specific city by ID."""
        response = await client.get(f"/api/v1/cities/{test_city.uuid}")
        assert response.status_code == 200

        data = response.json()
        assert data["code"] == test_city.code
        assert data["name"] == test_city.name
        assert data["is_active"] == test_city.is_active

    async def test_get_city_not_found(self, client: AsyncClient):
        """Test getting a non-existent city returns 404."""
        fake_id = uuid4()
        response = await client.get(f"/api/v1/cities/{fake_id}")
        assert response.status_code == 404
        assert response.json()["detail"] == "City not found"

    async def test_get_city_invalid_uuid(self, client: AsyncClient):
        """Test getting a city with invalid UUID format returns 422."""
        response = await client.get("/api/v1/cities/not-a-uuid")
        assert response.status_code == 422
