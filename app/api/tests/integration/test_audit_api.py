"""Integration tests for audit retrieval API endpoint.

These tests require a running PostgreSQL database with migrations applied.
Skip these tests if DATABASE_URL is not configured or database is unavailable.

Note: Tests that require pre-seeded data use the existing audit_capture integration
tests' data where available, or use separate scope to avoid event loop conflicts.
"""

import os
from datetime import datetime, timedelta, timezone
from uuid import uuid4

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient

# Skip all tests in this module if database is not available
pytestmark = [
    pytest.mark.skipif(
        not os.environ.get("DATABASE_URL"),
        reason="DATABASE_URL not set - skipping integration tests",
    ),
    pytest.mark.asyncio,
]


@pytest.fixture(scope="module")
def anyio_backend():
    return "asyncio"


@pytest_asyncio.fixture
async def async_client():
    """Provide an async HTTP client for testing."""
    from main import app

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        yield client


async def test_get_audit_history_empty_for_nonexistent_entity(async_client):
    """GET endpoint returns empty list for non-existent entity."""
    nonexistent_id = uuid4()
    response = await async_client.get(f"/api/v1/audit/work_order/{nonexistent_id}")
    assert response.status_code == 200

    data = response.json()
    assert data["total"] == 0
    assert data["items"] == []
    assert data["has_next"] is False


async def test_invalid_uuid_returns_422(async_client):
    """Invalid UUID format returns 422 Unprocessable Entity."""
    response = await async_client.get("/api/v1/audit/work_order/not-a-valid-uuid")
    assert response.status_code == 422

    data = response.json()
    assert "detail" in data


async def test_page_size_capped_at_100(async_client):
    """Page size > 100 returns 422 error."""
    test_uuid = uuid4()
    response = await async_client.get(
        f"/api/v1/audit/test_entity/{test_uuid}",
        params={"page_size": 150},
    )
    assert response.status_code == 422


async def test_page_less_than_1_returns_422(async_client):
    """Page < 1 returns 422 error."""
    test_uuid = uuid4()
    response = await async_client.get(
        f"/api/v1/audit/test_entity/{test_uuid}",
        params={"page": 0},
    )
    assert response.status_code == 422


async def test_response_structure(async_client):
    """Response has correct structure with pagination metadata."""
    test_uuid = uuid4()
    response = await async_client.get(f"/api/v1/audit/test_entity/{test_uuid}")
    assert response.status_code == 200

    data = response.json()
    # Check all expected pagination fields are present
    assert "total" in data
    assert "items" in data
    assert "page" in data
    assert "page_size" in data
    assert "has_next" in data
    # Check default values
    assert data["page"] == 1
    assert data["page_size"] == 50
    assert isinstance(data["items"], list)


async def test_pagination_defaults(async_client):
    """Pagination uses correct defaults."""
    test_uuid = uuid4()
    response = await async_client.get(f"/api/v1/audit/test_entity/{test_uuid}")
    assert response.status_code == 200

    data = response.json()
    assert data["page"] == 1
    assert data["page_size"] == 50


async def test_custom_pagination_params(async_client):
    """Custom pagination parameters are accepted."""
    test_uuid = uuid4()
    response = await async_client.get(
        f"/api/v1/audit/test_entity/{test_uuid}",
        params={"page": 2, "page_size": 25},
    )
    assert response.status_code == 200

    data = response.json()
    assert data["page"] == 2
    assert data["page_size"] == 25


async def test_filter_params_accepted(async_client):
    """Filter parameters are accepted without error."""
    test_uuid = uuid4()
    from_date = (datetime.now(timezone.utc) - timedelta(days=7)).isoformat()
    to_date = datetime.now(timezone.utc).isoformat()

    response = await async_client.get(
        f"/api/v1/audit/test_entity/{test_uuid}",
        params={
            "from_date": from_date,
            "to_date": to_date,
            "action": "INSERT",
            "user_id": "test-user",
        },
    )
    assert response.status_code == 200


async def test_invalid_action_filter(async_client):
    """Invalid action filter value returns 422."""
    test_uuid = uuid4()
    response = await async_client.get(
        f"/api/v1/audit/test_entity/{test_uuid}",
        params={"action": "INVALID_ACTION"},
    )
    assert response.status_code == 422
