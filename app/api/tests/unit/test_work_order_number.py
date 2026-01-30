"""Unit tests for work order number generation logic."""

import pytest
from datetime import datetime
from unittest.mock import patch

from crud.work_order import generate_work_order_number


class TestGenerateWorkOrderNumber:
    """Tests for the work order number generation function."""

    def test_basic_format(self):
        """Test that work order number follows expected format."""
        with patch("crud.work_order.datetime") as mock_datetime:
            mock_datetime.utcnow.return_value = datetime(2026, 1, 15)

            result = generate_work_order_number("KTYS", 1)
            assert result == "KTYS00001-01-2026"

    def test_sequence_padding(self):
        """Test that sequence number is zero-padded to 5 digits."""
        with patch("crud.work_order.datetime") as mock_datetime:
            mock_datetime.utcnow.return_value = datetime(2026, 1, 15)

            # Single digit
            assert generate_work_order_number("KTYS", 1) == "KTYS00001-01-2026"

            # Two digits
            assert generate_work_order_number("KTYS", 12) == "KTYS00012-01-2026"

            # Three digits
            assert generate_work_order_number("KTYS", 123) == "KTYS00123-01-2026"

            # Four digits
            assert generate_work_order_number("KTYS", 1234) == "KTYS01234-01-2026"

            # Five digits
            assert generate_work_order_number("KTYS", 12345) == "KTYS12345-01-2026"

    def test_month_padding(self):
        """Test that month is zero-padded to 2 digits."""
        with patch("crud.work_order.datetime") as mock_datetime:
            # Single digit month
            mock_datetime.utcnow.return_value = datetime(2026, 1, 15)
            assert generate_work_order_number("KTYS", 1) == "KTYS00001-01-2026"

            # Double digit month
            mock_datetime.utcnow.return_value = datetime(2026, 12, 15)
            assert generate_work_order_number("KTYS", 1) == "KTYS00001-12-2026"

    def test_different_city_codes(self):
        """Test with various city codes."""
        with patch("crud.work_order.datetime") as mock_datetime:
            mock_datetime.utcnow.return_value = datetime(2026, 6, 15)

            assert generate_work_order_number("KTYS", 1) == "KTYS00001-06-2026"
            assert generate_work_order_number("KBNA", 1) == "KBNA00001-06-2026"
            assert generate_work_order_number("ABC", 1) == "ABC00001-06-2026"

    def test_year_in_format(self):
        """Test that year is included correctly."""
        with patch("crud.work_order.datetime") as mock_datetime:
            mock_datetime.utcnow.return_value = datetime(2027, 3, 10)

            result = generate_work_order_number("KTYS", 42)
            assert result == "KTYS00042-03-2027"

    def test_large_sequence_number(self):
        """Test with sequence numbers exceeding 5 digits."""
        with patch("crud.work_order.datetime") as mock_datetime:
            mock_datetime.utcnow.return_value = datetime(2026, 1, 15)

            # Exceeds padding - will extend beyond 5 digits
            result = generate_work_order_number("KTYS", 123456)
            assert result == "KTYS123456-01-2026"

    def test_uniqueness_components(self):
        """Test that different inputs produce different outputs."""
        with patch("crud.work_order.datetime") as mock_datetime:
            mock_datetime.utcnow.return_value = datetime(2026, 5, 15)

            wo1 = generate_work_order_number("KTYS", 1)
            wo2 = generate_work_order_number("KTYS", 2)
            wo3 = generate_work_order_number("KBNA", 1)

            # Different sequences for same city
            assert wo1 != wo2

            # Same sequence for different cities
            assert wo1 != wo3

            # All should be unique
            assert len({wo1, wo2, wo3}) == 3
