"""Unit tests for audit serialization and change detection."""

from datetime import date, datetime
from decimal import Decimal
from uuid import UUID

import pytest

from core.audit import _json_serializer, serialize_for_audit


class TestJsonSerializer:
    """Tests for _json_serializer function."""

    def test_datetime_serialization(self):
        """Datetime objects serialize to ISO format."""
        dt = datetime(2024, 1, 15, 10, 30, 45)
        assert _json_serializer(dt) == "2024-01-15T10:30:45"

    def test_datetime_with_timezone_serialization(self):
        """Datetime objects with timezone serialize to ISO format with offset."""
        from datetime import timezone

        dt = datetime(2024, 1, 15, 10, 30, 45, tzinfo=timezone.utc)
        result = _json_serializer(dt)
        assert result.startswith("2024-01-15T10:30:45")
        assert "+00:00" in result or "Z" in result

    def test_date_serialization(self):
        """Date objects serialize to ISO format."""
        d = date(2024, 1, 15)
        assert _json_serializer(d) == "2024-01-15"

    def test_uuid_serialization(self):
        """UUID objects serialize to string."""
        u = UUID("12345678-1234-5678-1234-567812345678")
        assert _json_serializer(u) == "12345678-1234-5678-1234-567812345678"

    def test_decimal_serialization(self):
        """Decimal objects serialize to float."""
        d = Decimal("123.45")
        assert _json_serializer(d) == 123.45

    def test_decimal_large_precision(self):
        """Decimal with large precision serializes correctly."""
        d = Decimal("123.456789012345")
        result = _json_serializer(d)
        assert isinstance(result, float)
        assert abs(result - 123.456789012345) < 0.0001

    def test_bytes_serialization(self):
        """Bytes objects serialize to string."""
        b = b"hello"
        assert _json_serializer(b) == "hello"

    def test_bytes_with_special_chars(self):
        """Bytes with special characters decode with replacement."""
        b = b"hello\x80world"
        result = _json_serializer(b)
        assert "hello" in result
        assert "world" in result

    def test_unsupported_type_raises(self):
        """Unsupported types raise TypeError."""
        with pytest.raises(TypeError, match="not JSON serializable"):
            _json_serializer(object())

    def test_unsupported_type_error_message(self):
        """TypeError message includes the type name."""

        class CustomClass:
            pass

        with pytest.raises(TypeError, match="CustomClass"):
            _json_serializer(CustomClass())


class TestSerializeForAudit:
    """Tests for serialize_for_audit function.

    Note: Full testing requires SQLAlchemy models and is covered in integration tests.
    These tests verify the function signature and basic behavior.
    """

    def test_function_exists(self):
        """serialize_for_audit function is importable."""
        assert callable(serialize_for_audit)

    def test_accepts_exclude_fields(self):
        """Function accepts exclude_fields parameter."""
        # This verifies the signature without needing a real model
        import inspect

        sig = inspect.signature(serialize_for_audit)
        params = sig.parameters
        assert "exclude_fields" in params
        assert params["exclude_fields"].default is None
