"""Integration tests for the Tools API endpoints."""

import pytest
from uuid import uuid4
from datetime import date, timedelta

from httpx import AsyncClient

from models.city import City
from models.tool_room import ToolRoom
from models.tool import Tool, ToolType


class TestListTools:
    """Tests for GET /api/v1/tools endpoint."""

    async def test_requires_city_id(self, client: AsyncClient):
        """Test that city_id query param is required."""
        response = await client.get("/api/v1/tools")
        assert response.status_code == 422

    async def test_invalid_city_id_format(self, client: AsyncClient):
        """Test that invalid UUID format returns 422."""
        response = await client.get("/api/v1/tools?city_id=not-a-uuid")
        assert response.status_code == 422

    async def test_empty_results_for_unknown_city(self, client: AsyncClient):
        """Test that unknown city UUID returns empty results with 200."""
        fake_id = uuid4()
        response = await client.get(f"/api/v1/tools?city_id={fake_id}")
        assert response.status_code == 200

        data = response.json()
        assert data["items"] == []
        assert data["total"] == 0

    async def test_list_tools_for_city(
        self,
        client: AsyncClient,
        test_city: City,
        test_tool_certified: Tool,
        test_tool_reference: Tool,
    ):
        """Test listing tools for a city returns the correct tools."""
        response = await client.get(
            f"/api/v1/tools?city_id={test_city.uuid}"
        )
        assert response.status_code == 200

        data = response.json()
        assert data["total"] == 2
        assert len(data["items"]) == 2

        names = {t["name"] for t in data["items"]}
        assert test_tool_certified.name in names
        assert test_tool_reference.name in names

    async def test_response_format(
        self,
        client: AsyncClient,
        test_city: City,
        test_tool_certified: Tool,
    ):
        """Test that tool response has all expected fields."""
        response = await client.get(
            f"/api/v1/tools?city_id={test_city.uuid}"
        )
        assert response.status_code == 200

        tool = response.json()["items"][0]
        expected_fields = {
            "id", "name", "tool_type", "tool_type_code", "description",
            "tool_room", "city", "make", "model", "serial_number",
            "calibration_due_days", "next_calibration_due", "media_count",
            "is_in_kit", "created_at", "updated_at",
        }
        assert expected_fields.issubset(set(tool.keys()))

        # Verify nested objects
        assert "id" in tool["tool_room"]
        assert "code" in tool["tool_room"]
        assert "name" in tool["tool_room"]
        assert "id" in tool["city"]
        assert "code" in tool["city"]
        assert "name" in tool["city"]

    async def test_filter_by_tool_room(
        self,
        client: AsyncClient,
        test_session,
        test_city: City,
        test_tool_room: ToolRoom,
        test_tool_certified: Tool,
    ):
        """Test filtering tools by tool_room_id."""
        # Create a second tool room with a tool
        second_room = ToolRoom(
            uuid=uuid4(),
            city_id=test_city.id,
            code="TR-003",
            name="Second Tool Room",
            is_active=True,
        )
        test_session.add(second_room)
        await test_session.commit()
        await test_session.refresh(second_room)

        other_tool = Tool(
            uuid=uuid4(),
            name="Other Room Tool",
            tool_type=ToolType.REFERENCE,
            tool_room_id=second_room.id,
            media_count=0,
            created_by="test_user",
        )
        test_session.add(other_tool)
        await test_session.commit()

        # Filter by the first tool room
        response = await client.get(
            f"/api/v1/tools?city_id={test_city.uuid}"
            f"&tool_room_id={test_tool_room.uuid}"
        )
        assert response.status_code == 200

        data = response.json()
        assert data["total"] == 1
        assert data["items"][0]["name"] == test_tool_certified.name

    async def test_filter_by_tool_room_unknown(
        self,
        client: AsyncClient,
        test_city: City,
        test_tool_certified: Tool,
    ):
        """Test that unknown tool_room_id returns empty results."""
        fake_room_id = uuid4()
        response = await client.get(
            f"/api/v1/tools?city_id={test_city.uuid}"
            f"&tool_room_id={fake_room_id}"
        )
        assert response.status_code == 200

        data = response.json()
        assert data["items"] == []
        assert data["total"] == 0

    async def test_kit_filter_hide(
        self,
        client: AsyncClient,
        test_city: City,
        test_tool_certified: Tool,
        test_tool_kit: Tool,
        test_tool_in_kit: Tool,
    ):
        """Test kit_filter=hide excludes tools with parent_kit_id."""
        response = await client.get(
            f"/api/v1/tools?city_id={test_city.uuid}&kit_filter=hide"
        )
        assert response.status_code == 200

        data = response.json()
        names = {t["name"] for t in data["items"]}
        assert test_tool_in_kit.name not in names
        assert test_tool_certified.name in names
        assert test_tool_kit.name in names

    async def test_kit_filter_show(
        self,
        client: AsyncClient,
        test_city: City,
        test_tool_certified: Tool,
        test_tool_kit: Tool,
        test_tool_in_kit: Tool,
    ):
        """Test kit_filter=show (default) includes all tools."""
        response = await client.get(
            f"/api/v1/tools?city_id={test_city.uuid}&kit_filter=show"
        )
        assert response.status_code == 200

        data = response.json()
        names = {t["name"] for t in data["items"]}
        assert test_tool_in_kit.name in names
        assert test_tool_certified.name in names
        assert test_tool_kit.name in names

    async def test_calibration_due_filter(
        self,
        test_session,
        test_city: City,
        test_tool_certified: Tool,
        test_tool_reference: Tool,
    ):
        """Test calib_due_days filter returns only certified tools due within N days."""
        from crud.tool import get_tools
        from schemas.tool import KitFilter

        # test_tool_certified has next_calibration_due = today + 45 days
        # With calib_due_days=90, it should be included
        tools, total = await get_tools(
            test_session,
            city_uuid=test_city.uuid,
            calib_due_days=90,
        )
        assert total == 1
        assert tools[0].name == test_tool_certified.name

    async def test_calibration_due_filter_excludes_far_future(
        self,
        test_session,
        test_city: City,
        test_tool_room: ToolRoom,
    ):
        """Test calib_due_days=60 excludes certified tools due beyond 60 days."""
        from crud.tool import get_tools

        # Create a certified tool due in 120 days
        far_tool = Tool(
            uuid=uuid4(),
            name="Far Future Tool",
            tool_type=ToolType.CERTIFIED,
            tool_room_id=test_tool_room.id,
            next_calibration_due=date.today() + timedelta(days=120),
            media_count=0,
            created_by="test_user",
        )
        test_session.add(far_tool)
        await test_session.commit()

        tools, total = await get_tools(
            test_session,
            city_uuid=test_city.uuid,
            calib_due_days=60,
        )
        assert total == 0

    async def test_pagination_defaults(
        self,
        client: AsyncClient,
        test_city: City,
        test_tool_certified: Tool,
    ):
        """Test default pagination values (page=1, page_size=25)."""
        response = await client.get(
            f"/api/v1/tools?city_id={test_city.uuid}"
        )
        assert response.status_code == 200

        data = response.json()
        assert data["page"] == 1
        assert data["page_size"] == 25

    async def test_pagination_custom(
        self,
        test_session,
        test_city: City,
        test_tool_room: ToolRoom,
        test_tool_certified: Tool,
        test_tool_reference: Tool,
    ):
        """Test custom page and page_size params work correctly via CRUD layer."""
        from crud.tool import get_tools

        # Test page_size=1 returns only 1 item but correct total
        tools, total = await get_tools(
            test_session,
            city_uuid=test_city.uuid,
            page=1,
            page_size=1,
        )
        assert total == 2
        assert len(tools) == 1

        # Test page=2 returns the second item
        tools_p2, total_p2 = await get_tools(
            test_session,
            city_uuid=test_city.uuid,
            page=2,
            page_size=1,
        )
        assert total_p2 == 2
        assert len(tools_p2) == 1
        assert tools_p2[0].name != tools[0].name

    async def test_sort_by_name_asc(
        self,
        client: AsyncClient,
        test_city: City,
        test_tool_certified: Tool,
        test_tool_reference: Tool,
    ):
        """Test default sort is by name ascending."""
        response = await client.get(
            f"/api/v1/tools?city_id={test_city.uuid}"
        )
        assert response.status_code == 200

        data = response.json()
        names = [t["name"] for t in data["items"]]
        assert names == sorted(names)

    async def test_sort_by_name_desc(
        self,
        client: AsyncClient,
        test_city: City,
        test_tool_certified: Tool,
        test_tool_reference: Tool,
    ):
        """Test sort_order=desc reverses order."""
        response = await client.get(
            f"/api/v1/tools?city_id={test_city.uuid}"
            "&sort_by=name&sort_order=desc"
        )
        assert response.status_code == 200

        data = response.json()
        names = [t["name"] for t in data["items"]]
        assert names == sorted(names, reverse=True)

    async def test_sort_by_tool_type(
        self,
        client: AsyncClient,
        test_city: City,
        test_tool_certified: Tool,
        test_tool_reference: Tool,
    ):
        """Test sorting by tool_type works."""
        response = await client.get(
            f"/api/v1/tools?city_id={test_city.uuid}&sort_by=tool_type"
        )
        assert response.status_code == 200

        data = response.json()
        types = [t["tool_type"] for t in data["items"]]
        assert types == sorted(types)

    async def test_tool_type_codes(
        self,
        client: AsyncClient,
        test_session,
        test_city: City,
        test_tool_room: ToolRoom,
        test_tool_certified: Tool,
        test_tool_reference: Tool,
        test_tool_kit: Tool,
    ):
        """Test tool type display codes: Certified->Cert, Reference->Ref, etc."""
        # Add a consumable tool
        consumable = Tool(
            uuid=uuid4(),
            name="ZZZ Consumable",
            tool_type=ToolType.CONSUMABLE,
            tool_room_id=test_tool_room.id,
            media_count=0,
            created_by="test_user",
        )
        test_session.add(consumable)
        await test_session.commit()

        response = await client.get(
            f"/api/v1/tools?city_id={test_city.uuid}"
        )
        assert response.status_code == 200

        data = response.json()
        type_code_map = {t["tool_type"]: t["tool_type_code"] for t in data["items"]}
        assert type_code_map["certified"] == "Cert"
        assert type_code_map["reference"] == "Ref"
        assert type_code_map["kit"] == "Kit"
        assert type_code_map["consumable"] == "Cons"

    async def test_calibration_due_days_calculation(
        self,
        client: AsyncClient,
        test_city: City,
        test_tool_certified: Tool,
        test_tool_reference: Tool,
    ):
        """Test calibration_due_days is calculated for certified tools and null for others."""
        response = await client.get(
            f"/api/v1/tools?city_id={test_city.uuid}"
        )
        assert response.status_code == 200

        data = response.json()
        tools_by_type = {t["tool_type"]: t for t in data["items"]}

        # Certified tool should have calibration_due_days calculated
        cert_tool = tools_by_type["certified"]
        assert cert_tool["calibration_due_days"] is not None
        assert cert_tool["calibration_due_days"] == 45  # set to today + 45 days
        assert cert_tool["next_calibration_due"] is not None

        # Reference tool should have null calibration_due_days
        ref_tool = tools_by_type["reference"]
        assert ref_tool["calibration_due_days"] is None
        assert ref_tool["next_calibration_due"] is None

    async def test_is_in_kit_flag(
        self,
        client: AsyncClient,
        test_city: City,
        test_tool_certified: Tool,
        test_tool_kit: Tool,
        test_tool_in_kit: Tool,
    ):
        """Test is_in_kit is true for tools with parent_kit_id, false otherwise."""
        response = await client.get(
            f"/api/v1/tools?city_id={test_city.uuid}"
        )
        assert response.status_code == 200

        data = response.json()
        tools_by_name = {t["name"]: t for t in data["items"]}

        assert tools_by_name[test_tool_in_kit.name]["is_in_kit"] is True
        assert tools_by_name[test_tool_certified.name]["is_in_kit"] is False
        assert tools_by_name[test_tool_kit.name]["is_in_kit"] is False
