// Re-export generated types
export type {
  WorkOrderItemResponse as WorkOrderItem,
  WorkOrderItemCreate as WorkOrderItemCreateInput,
  WorkOrderItemUpdate as WorkOrderItemUpdateInput,
  WorkOrderItemListResponse,
  WorkOrderItemStatus,
} from "@/lib/api";

// Import for display helper types
import type { WorkOrderItemStatus } from "@/lib/api";

// Status display helpers (not generated - UI-specific)
export const WORK_ORDER_ITEM_STATUS_LABELS: Record<WorkOrderItemStatus, string> = {
  open: "Open",
  waiting_for_parts: "Waiting for Parts",
  in_progress: "In Progress",
  tech_review: "Tech Review",
  admin_review: "Admin Review",
  finished: "Finished",
};
