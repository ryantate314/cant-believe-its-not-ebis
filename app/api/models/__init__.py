"""SQLAlchemy models package."""

from core.audit import register_audit_listeners
from models.audit_log import AuditLog
from models.base import Base, TimestampMixin, UUIDMixin
from models.city import City
from models.work_order import WorkOrder
from models.work_order_item import WorkOrderItem
from models.labor_kit import LaborKit
from models.labor_kit_item import LaborKitItem
from models.aircraft import Aircraft


def register_all_audit_listeners() -> None:
    """Register audit event listeners for all auditable models.

    Call this function once at application startup.
    """
    register_audit_listeners(WorkOrder)
    register_audit_listeners(WorkOrderItem)


__all__ = [
    "Base",
    "TimestampMixin",
    "UUIDMixin",
    "AuditLog",
    "City",
    "WorkOrder",
    "WorkOrderItem",
    "LaborKit",
    "LaborKitItem",
    "Aircraft",
    "register_all_audit_listeners",
]
