"""Integration tests for the Tool Rooms API endpoints."""

import pytest
from uuid import uuid4
from httpx import AsyncClient

from models.city import City
from models.tool_room import ToolRoom


class TestListToolRooms:
    """Tests for GET /api/v1/tool-rooms endpoint."""

    async def test_requires_city_id(self, client: AsyncClient):
        """Test that city_id query param is required."""
        response = await client.get("/api/v1/tool-rooms")
        assert response.status_code == 422

    async def test_list_active_tool_rooms(
        self,
        client: AsyncClient,
        test_city: City,
        test_tool_room: ToolRoom,
        test_tool_room_inactive: ToolRoom,
    ):
        """Test that listing tool rooms returns only active by default."""
        response = await client.get(
            f"/api/v1/tool-rooms?city_id={test_city.uuid}"
        )
        assert response.status_code == 200

        data = response.json()
        assert "items" in data
        assert "total" in data
        assert data["total"] == 1

        room = data["items"][0]
        assert room["code"] == test_tool_room.code
        assert room["is_active"] is True

    async def test_list_all_tool_rooms(
        self,
        client: AsyncClient,
        test_city: City,
        test_tool_room: ToolRoom,
        test_tool_room_inactive: ToolRoom,
    ):
        """Test listing all tool rooms including inactive."""
        response = await client.get(
            f"/api/v1/tool-rooms?city_id={test_city.uuid}&active_only=false"
        )
        assert response.status_code == 200

        data = response.json()
        assert data["total"] == 2

        codes = {room["code"] for room in data["items"]}
        assert test_tool_room.code in codes
        assert test_tool_room_inactive.code in codes

    async def test_empty_results_for_unknown_city(self, client: AsyncClient):
        """Test that unknown city returns empty results."""
        fake_id = uuid4()
        response = await client.get(f"/api/v1/tool-rooms?city_id={fake_id}")
        assert response.status_code == 200

        data = response.json()
        assert data["items"] == []
        assert data["total"] == 0

    async def test_response_format(
        self,
        client: AsyncClient,
        test_city: City,
        test_tool_room: ToolRoom,
    ):
        """Test that tool room response has correct format."""
        response = await client.get(
            f"/api/v1/tool-rooms?city_id={test_city.uuid}"
        )
        assert response.status_code == 200

        room = response.json()["items"][0]
        assert "id" in room
        assert "code" in room
        assert "name" in room
        assert "is_active" in room

    async def test_invalid_city_id_format(self, client: AsyncClient):
        """Test that invalid UUID format returns 422."""
        response = await client.get("/api/v1/tool-rooms?city_id=not-a-uuid")
        assert response.status_code == 422
