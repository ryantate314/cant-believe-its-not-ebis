"""Unit tests for audit Pydantic schemas."""

from datetime import datetime, timezone
from uuid import uuid4

import pytest
from pydantic import ValidationError

from schemas.audit import AuditAction, AuditRecordResponse, PaginatedAuditResponse


class TestAuditAction:
    """Tests for AuditAction enum."""

    def test_enum_values(self):
        """AuditAction has INSERT, UPDATE, DELETE values."""
        assert AuditAction.INSERT.value == "INSERT"
        assert AuditAction.UPDATE.value == "UPDATE"
        assert AuditAction.DELETE.value == "DELETE"

    def test_enum_from_string(self):
        """AuditAction can be created from string."""
        assert AuditAction("INSERT") == AuditAction.INSERT
        assert AuditAction("UPDATE") == AuditAction.UPDATE
        assert AuditAction("DELETE") == AuditAction.DELETE


class TestAuditRecordResponse:
    """Tests for AuditRecordResponse model."""

    def test_valid_insert_record(self):
        """INSERT record with all fields validates correctly."""
        record = AuditRecordResponse(
            id=1,
            entity_type="work_order",
            entity_id=uuid4(),
            action=AuditAction.INSERT,
            old_values=None,
            new_values={"work_order_number": "WO-001", "status": "created"},
            changed_fields=None,
            user_id="user-123",
            session_id="session-456",
            ip_address="192.168.1.100",
            created_at=datetime.now(timezone.utc),
        )
        assert record.action == AuditAction.INSERT
        assert record.old_values is None
        assert record.new_values is not None

    def test_valid_update_record(self):
        """UPDATE record with changed_fields validates correctly."""
        record = AuditRecordResponse(
            id=2,
            entity_type="work_order",
            entity_id=uuid4(),
            action=AuditAction.UPDATE,
            old_values={"status": "created"},
            new_values={"status": "in_progress"},
            changed_fields=["status"],
            user_id="user-123",
            session_id="session-456",
            ip_address="192.168.1.100",
            created_at=datetime.now(timezone.utc),
        )
        assert record.action == AuditAction.UPDATE
        assert "status" in record.changed_fields

    def test_valid_delete_record(self):
        """DELETE record with old_values only validates correctly."""
        record = AuditRecordResponse(
            id=3,
            entity_type="work_order",
            entity_id=uuid4(),
            action=AuditAction.DELETE,
            old_values={"work_order_number": "WO-001", "status": "created"},
            new_values=None,
            changed_fields=None,
            user_id="user-123",
            session_id="session-456",
            ip_address="192.168.1.100",
            created_at=datetime.now(timezone.utc),
        )
        assert record.action == AuditAction.DELETE
        assert record.new_values is None
        assert record.old_values is not None

    def test_optional_fields_can_be_none(self):
        """Optional fields (user_id, session_id, ip_address, etc.) can be None."""
        record = AuditRecordResponse(
            id=4,
            entity_type="work_order",
            entity_id=uuid4(),
            action=AuditAction.INSERT,
            old_values=None,
            new_values={"work_order_number": "WO-001"},
            changed_fields=None,
            user_id=None,
            session_id=None,
            ip_address=None,
            created_at=datetime.now(timezone.utc),
        )
        assert record.user_id is None
        assert record.session_id is None
        assert record.ip_address is None

    def test_nested_jsonb_values(self):
        """JSONB fields can contain nested objects."""
        nested_data = {
            "metadata": {
                "source": "api",
                "version": 2,
                "tags": ["urgent", "maintenance"],
            },
            "parts": [
                {"id": 1, "name": "Part A"},
                {"id": 2, "name": "Part B"},
            ],
        }
        record = AuditRecordResponse(
            id=5,
            entity_type="work_order",
            entity_id=uuid4(),
            action=AuditAction.INSERT,
            old_values=None,
            new_values=nested_data,
            changed_fields=None,
            user_id="user-123",
            session_id="session-456",
            ip_address="10.0.0.1",
            created_at=datetime.now(timezone.utc),
        )
        assert record.new_values["metadata"]["source"] == "api"
        assert len(record.new_values["parts"]) == 2


class TestPaginatedAuditResponse:
    """Tests for PaginatedAuditResponse model."""

    def test_empty_items(self):
        """Pagination with empty items list validates correctly."""
        response = PaginatedAuditResponse(
            items=[],
            total=0,
            page=1,
            page_size=50,
            has_next=False,
        )
        assert response.total == 0
        assert len(response.items) == 0
        assert response.has_next is False

    def test_with_multiple_items(self):
        """Pagination with multiple items validates correctly."""
        items = [
            AuditRecordResponse(
                id=i,
                entity_type="work_order",
                entity_id=uuid4(),
                action=AuditAction.INSERT,
                old_values=None,
                new_values={"seq": i},
                changed_fields=None,
                user_id="user-123",
                session_id="session-456",
                ip_address=None,
                created_at=datetime.now(timezone.utc),
            )
            for i in range(3)
        ]
        response = PaginatedAuditResponse(
            items=items,
            total=10,
            page=1,
            page_size=3,
            has_next=True,
        )
        assert len(response.items) == 3
        assert response.total == 10
        assert response.has_next is True

    def test_page_must_be_positive(self):
        """Page number must be >= 1."""
        with pytest.raises(ValidationError) as exc_info:
            PaginatedAuditResponse(
                items=[],
                total=0,
                page=0,
                page_size=50,
                has_next=False,
            )
        assert "page" in str(exc_info.value)

    def test_page_size_must_be_positive(self):
        """Page size must be >= 1."""
        with pytest.raises(ValidationError) as exc_info:
            PaginatedAuditResponse(
                items=[],
                total=0,
                page=1,
                page_size=0,
                has_next=False,
            )
        assert "page_size" in str(exc_info.value)

    def test_page_size_max_100(self):
        """Page size must be <= 100."""
        with pytest.raises(ValidationError) as exc_info:
            PaginatedAuditResponse(
                items=[],
                total=0,
                page=1,
                page_size=101,
                has_next=False,
            )
        assert "page_size" in str(exc_info.value)

    def test_page_size_at_maximum(self):
        """Page size of exactly 100 is valid."""
        response = PaginatedAuditResponse(
            items=[],
            total=0,
            page=1,
            page_size=100,
            has_next=False,
        )
        assert response.page_size == 100
