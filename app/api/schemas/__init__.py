"""Pydantic schemas for API request/response models."""

from schemas.audit import AuditAction, AuditRecordResponse, PaginatedAuditResponse
from schemas.city import CityResponse, CityListResponse
from schemas.work_order import (
    WorkOrderCreate,
    WorkOrderUpdate,
    WorkOrderResponse,
    WorkOrderListResponse,
    WorkOrderStatus,
    PriorityLevel,
    WorkOrderType,
)
from schemas.work_order_item import (
    WorkOrderItemCreate,
    WorkOrderItemUpdate,
    WorkOrderItemResponse,
    WorkOrderItemListResponse,
    WorkOrderItemStatus,
)
from schemas.labor_kit import (
    LaborKitCreate,
    LaborKitUpdate,
    LaborKitResponse,
    LaborKitListResponse,
    ApplyLaborKitResponse,
)
from schemas.labor_kit_item import (
    LaborKitItemCreate,
    LaborKitItemUpdate,
    LaborKitItemResponse,
    LaborKitItemListResponse,
)
from schemas.aircraft import (
    AircraftCreate,
    AircraftUpdate,
    AircraftResponse,
    AircraftListResponse,
)

__all__ = [
    # Audit
    "AuditAction",
    "AuditRecordResponse",
    "PaginatedAuditResponse",
    # City
    "CityResponse",
    "CityListResponse",
    # Work Order
    "WorkOrderCreate",
    "WorkOrderUpdate",
    "WorkOrderResponse",
    "WorkOrderListResponse",
    "WorkOrderStatus",
    "PriorityLevel",
    "WorkOrderType",
    # Work Order Item
    "WorkOrderItemCreate",
    "WorkOrderItemUpdate",
    "WorkOrderItemResponse",
    "WorkOrderItemListResponse",
    "WorkOrderItemStatus",
    # Labor Kit
    "LaborKitCreate",
    "LaborKitUpdate",
    "LaborKitResponse",
    "LaborKitListResponse",
    "ApplyLaborKitResponse",
    # Labor Kit Item
    "LaborKitItemCreate",
    "LaborKitItemUpdate",
    "LaborKitItemResponse",
    "LaborKitItemListResponse",
    # Aircraft
    "AircraftCreate",
    "AircraftUpdate",
    "AircraftResponse",
    "AircraftListResponse",
]
