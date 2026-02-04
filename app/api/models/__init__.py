"""SQLAlchemy models package."""

from core.audit import register_audit_listeners
from models.audit_log import AuditLog
from models.base import Base, TimestampMixin, UUIDMixin
from models.city import City
from models.work_order import WorkOrder


def register_all_audit_listeners() -> None:
    """Register audit event listeners for all auditable models.

    Call this function once at application startup.
    """
    register_audit_listeners(WorkOrder)
    # Add more models here as they are created


__all__ = [
    "Base",
    "TimestampMixin",
    "UUIDMixin",
    "AuditLog",
    "City",
    "WorkOrder",
    "register_all_audit_listeners",
]
