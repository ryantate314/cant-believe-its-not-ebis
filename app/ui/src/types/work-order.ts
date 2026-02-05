// Re-export generated types
export type {
  WorkOrderResponse as WorkOrder,
  WorkOrderCreate as WorkOrderCreateInput,
  WorkOrderUpdate as WorkOrderUpdateInput,
  WorkOrderListResponse,
  WorkOrderStatus,
  WorkOrderType,
  PriorityLevel,
  CityBrief as City,
  CityListResponse,
  AircraftBrief,
} from "@/lib/api";

// Import for display helper types
import type { WorkOrderStatus, PriorityLevel, WorkOrderType } from "@/lib/api";

// Status display helpers (not generated - UI-specific)
export const WORK_ORDER_STATUS_LABELS: Record<WorkOrderStatus, string> = {
  created: "Created",
  scheduled: "Scheduled",
  open: "Open",
  in_progress: "In Progress",
  tracking: "Tracking",
  pending: "Pending",
  in_review: "In Review",
  completed: "Completed",
  void: "Void",
};

export const PRIORITY_LABELS: Record<PriorityLevel, string> = {
  low: "Low",
  normal: "Normal",
  high: "High",
  urgent: "Urgent",
};

export const WORK_ORDER_TYPE_LABELS: Record<WorkOrderType, string> = {
  work_order: "Work Order",
  quote: "Quote",
};
