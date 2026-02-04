"""Unit tests for AuditableMixin behavior.

Tests verify the mixin's entity type resolution, override behavior,
and validation in register_audit_listeners.
"""

import pytest

from core.audit import AuditableMixin, register_audit_listeners


class TestAuditableMixinEntityType:
    """Tests for __audit_entity_type__ method behavior."""

    def test_default_entity_type_uses_tablename(self):
        """Entity type defaults to __tablename__ when no override specified."""

        class MockModel(AuditableMixin):
            __tablename__ = "test_table"

        assert MockModel.__audit_entity_type__() == "test_table"

    def test_custom_entity_type_override(self):
        """Entity type uses __audit_entity_type_override__ when specified."""

        class MockModel(AuditableMixin):
            __tablename__ = "original_name"
            __audit_entity_type_override__ = "custom_entity"

        assert MockModel.__audit_entity_type__() == "custom_entity"

    def test_override_takes_precedence(self):
        """Override always takes precedence over tablename."""

        class MockModel(AuditableMixin):
            __tablename__ = "should_not_use"
            __audit_entity_type_override__ = "use_this_instead"

        assert MockModel.__audit_entity_type__() == "use_this_instead"
        assert MockModel.__audit_entity_type__() != MockModel.__tablename__

    def test_method_is_classmethod(self):
        """__audit_entity_type__ can be called on class, not just instance."""

        class MockModel(AuditableMixin):
            __tablename__ = "test_entity"

        # Call on class directly (no instance)
        result = MockModel.__audit_entity_type__()
        assert result == "test_entity"

    def test_empty_string_override_is_used(self):
        """Empty string override is used (edge case)."""

        class MockModel(AuditableMixin):
            __tablename__ = "real_table"
            __audit_entity_type_override__ = ""

        # Empty string is falsy but getattr returns it since attribute exists
        assert MockModel.__audit_entity_type__() == ""


class TestRegisterAuditListeners:
    """Tests for register_audit_listeners validation."""

    def test_raises_without_mixin(self):
        """register_audit_listeners raises ValueError for class without mixin."""

        class NotAuditableModel:
            __tablename__ = "some_table"

        with pytest.raises(ValueError, match="must have AuditableMixin"):
            register_audit_listeners(NotAuditableModel)

    def test_error_message_includes_class_name(self):
        """Error message includes the class name for debugging."""

        class MyBrokenModel:
            __tablename__ = "broken"

        with pytest.raises(ValueError, match="MyBrokenModel"):
            register_audit_listeners(MyBrokenModel)

    def test_accepts_class_with_mixin(self):
        """register_audit_listeners accepts class with AuditableMixin.

        Note: This test verifies acceptance but doesn't actually register
        listeners since we don't have a full SQLAlchemy mapper context.
        """
        from unittest.mock import patch

        class ValidModel(AuditableMixin):
            __tablename__ = "valid_entity"

        # Mock event.listen to avoid SQLAlchemy mapper requirements
        with patch("core.audit.event.listen"):
            # Should not raise - validation passes
            register_audit_listeners(ValidModel)


class TestAuditableMixinInheritance:
    """Tests for mixin inheritance behavior."""

    def test_subclass_inherits_method(self):
        """Subclass inherits __audit_entity_type__ method."""

        class BaseModel(AuditableMixin):
            __tablename__ = "base"

        class ChildModel(BaseModel):
            __tablename__ = "child"

        # Child uses its own tablename
        assert ChildModel.__audit_entity_type__() == "child"

    def test_subclass_can_add_override(self):
        """Subclass can add override even if parent doesn't have one."""

        class BaseModel(AuditableMixin):
            __tablename__ = "base"

        class ChildModel(BaseModel):
            __tablename__ = "child"
            __audit_entity_type_override__ = "custom_child"

        assert ChildModel.__audit_entity_type__() == "custom_child"
        # Parent is unaffected
        assert BaseModel.__audit_entity_type__() == "base"

    def test_subclass_override_does_not_affect_parent(self):
        """Child override doesn't change parent behavior."""

        class BaseModel(AuditableMixin):
            __tablename__ = "parent_table"
            __audit_entity_type_override__ = "parent_override"

        class ChildModel(BaseModel):
            __tablename__ = "child_table"
            __audit_entity_type_override__ = "child_override"

        assert BaseModel.__audit_entity_type__() == "parent_override"
        assert ChildModel.__audit_entity_type__() == "child_override"
