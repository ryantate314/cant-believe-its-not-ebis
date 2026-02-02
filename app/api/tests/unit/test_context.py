"""Unit tests for request context middleware."""

from fastapi.testclient import TestClient

from main import app


def test_context_extracts_user_id():
    """User ID is extracted from X-User-ID header."""
    client = TestClient(app)
    response = client.get("/health", headers={"X-User-ID": "test-user"})
    assert response.status_code == 200
    data = response.json()
    assert data["context"]["user_id"] == "test-user"


def test_context_extracts_session_id():
    """Session ID is extracted from X-Session-ID header."""
    client = TestClient(app)
    response = client.get("/health", headers={"X-Session-ID": "test-session-123"})
    assert response.status_code == 200
    data = response.json()
    assert data["context"]["session_id"] == "test-session-123"


def test_context_generates_session_id_when_missing():
    """Session ID is generated as UUID when header is missing."""
    client = TestClient(app)
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    session_id = data["context"]["session_id"]
    # Verify it's a valid UUID format (36 chars with hyphens)
    assert len(session_id) == 36
    assert session_id.count("-") == 4


def test_context_captures_ip_address():
    """IP address is captured from client connection."""
    client = TestClient(app)
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    # TestClient uses testclient as host
    assert data["context"]["ip_address"] == "testclient"


def test_context_allows_anonymous_user():
    """Anonymous requests have user_id as None."""
    client = TestClient(app)
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["context"]["user_id"] is None


def test_context_full_headers():
    """All context fields are properly extracted when all headers present."""
    client = TestClient(app)
    response = client.get(
        "/health",
        headers={
            "X-User-ID": "user-456",
            "X-Session-ID": "session-789",
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert data["context"]["user_id"] == "user-456"
    assert data["context"]["session_id"] == "session-789"
