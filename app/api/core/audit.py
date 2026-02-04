"""Audit logging infrastructure with SQLAlchemy event listeners."""

import json
from datetime import date, datetime
from decimal import Decimal
from typing import Any
from uuid import UUID

from sqlalchemy import event, text
from sqlalchemy.engine import Connection
from sqlalchemy.orm import Mapper
from sqlalchemy.orm.attributes import History, get_history

from core.context import get_current_context


def _json_serializer(obj: Any) -> Any:
    """Convert non-JSON-serializable types to serializable equivalents."""
    if isinstance(obj, datetime):
        return obj.isoformat()
    if isinstance(obj, date):
        return obj.isoformat()
    if isinstance(obj, UUID):
        return str(obj)
    if isinstance(obj, Decimal):
        return float(obj)
    if isinstance(obj, bytes):
        return obj.decode("utf-8", errors="replace")
    raise TypeError(f"Object of type {type(obj).__name__} is not JSON serializable")


def serialize_for_audit(
    instance: Any,
    exclude_fields: set[str] | None = None,
) -> dict[str, Any]:
    """Serialize a SQLAlchemy model instance to a JSONB-compatible dict."""
    exclude = exclude_fields or set()
    result = {}

    for column in instance.__table__.columns:
        if column.name in exclude:
            continue
        value = getattr(instance, column.name, None)
        if value is not None:
            try:
                # Ensure the value is JSON serializable
                json.dumps(value, default=_json_serializer)
                result[column.name] = (
                    value
                    if not isinstance(value, (datetime, date, UUID, Decimal))
                    else _json_serializer(value)
                )
            except (TypeError, ValueError):
                result[column.name] = str(value)
        else:
            result[column.name] = None

    return result


def get_changed_fields(instance: Any) -> list[str]:
    """Get list of field names that changed during an UPDATE."""
    changed = []
    for column in instance.__table__.columns:
        history: History = get_history(instance, column.name)
        if history.has_changes():
            changed.append(column.name)
    return changed


def get_old_values(instance: Any) -> dict[str, Any]:
    """Get the old values for fields that changed during an UPDATE."""
    old_values = {}
    for column in instance.__table__.columns:
        history: History = get_history(instance, column.name)
        if history.has_changes() and history.deleted:
            value = history.deleted[0]
            if value is not None:
                try:
                    json.dumps(value, default=_json_serializer)
                    old_values[column.name] = (
                        value
                        if not isinstance(value, (datetime, date, UUID, Decimal))
                        else _json_serializer(value)
                    )
                except (TypeError, ValueError):
                    old_values[column.name] = str(value)
            else:
                old_values[column.name] = None
    return old_values


class AuditableMixin:
    """Mixin that enables automatic audit logging for a model.

    Usage:
        class WorkOrder(Base, AuditableMixin):
            __tablename__ = "work_order"
            __audit_entity_type__ = "work_order"  # Optional, defaults to __tablename__
    """

    @classmethod
    def __audit_entity_type__(cls) -> str:
        """Return the entity type for audit logging."""
        return getattr(cls, "__audit_entity_type_override__", cls.__tablename__)


def _insert_audit_record(
    connection: Connection,
    entity_type: str,
    entity_id: UUID,
    action: str,
    old_values: dict[str, Any] | None,
    new_values: dict[str, Any] | None,
    changed_fields: list[str] | None,
) -> None:
    """Insert an audit log record using the provided connection."""
    context = get_current_context()

    connection.execute(
        text("""
            INSERT INTO audit_log
                (entity_type, entity_id, action, old_values, new_values,
                 changed_fields, user_id, session_id, ip_address)
            VALUES
                (:entity_type, :entity_id, CAST(:action AS audit_action),
                 CAST(:old_values AS jsonb), CAST(:new_values AS jsonb), :changed_fields,
                 :user_id, :session_id, CAST(:ip_address AS inet))
        """),
        {
            "entity_type": entity_type,
            "entity_id": entity_id,
            "action": action,
            "old_values": json.dumps(old_values, default=_json_serializer)
            if old_values
            else None,
            "new_values": json.dumps(new_values, default=_json_serializer)
            if new_values
            else None,
            "changed_fields": changed_fields,
            "user_id": context.user_id if context else None,
            "session_id": context.session_id if context else None,
            "ip_address": context.ip_address if context else None,
        },
    )


def _handle_after_insert(mapper: Mapper, connection: Connection, target: Any) -> None:
    """Handle after_insert event for auditable entities."""
    entity_type = target.__audit_entity_type__()
    entity_id = target.uuid
    new_values = serialize_for_audit(target)

    _insert_audit_record(
        connection=connection,
        entity_type=entity_type,
        entity_id=entity_id,
        action="INSERT",
        old_values=None,
        new_values=new_values,
        changed_fields=None,
    )


def _handle_after_update(mapper: Mapper, connection: Connection, target: Any) -> None:
    """Handle after_update event for auditable entities."""
    changed_fields = get_changed_fields(target)

    # Only log if there were actual changes
    if not changed_fields:
        return

    entity_type = target.__audit_entity_type__()
    entity_id = target.uuid
    old_values = get_old_values(target)
    new_values = serialize_for_audit(target)

    _insert_audit_record(
        connection=connection,
        entity_type=entity_type,
        entity_id=entity_id,
        action="UPDATE",
        old_values=old_values,
        new_values=new_values,
        changed_fields=changed_fields,
    )


def _handle_after_delete(mapper: Mapper, connection: Connection, target: Any) -> None:
    """Handle after_delete event for auditable entities."""
    entity_type = target.__audit_entity_type__()
    entity_id = target.uuid
    old_values = serialize_for_audit(target)

    _insert_audit_record(
        connection=connection,
        entity_type=entity_type,
        entity_id=entity_id,
        action="DELETE",
        old_values=old_values,
        new_values=None,
        changed_fields=None,
    )


def register_audit_listeners(model_class: type) -> None:
    """Register audit event listeners for a model class.

    Call this function for each model that uses AuditableMixin.
    """
    if not hasattr(model_class, "__audit_entity_type__"):
        raise ValueError(f"{model_class.__name__} must have AuditableMixin")

    event.listen(model_class, "after_insert", _handle_after_insert)
    event.listen(model_class, "after_update", _handle_after_update)
    event.listen(model_class, "after_delete", _handle_after_delete)
