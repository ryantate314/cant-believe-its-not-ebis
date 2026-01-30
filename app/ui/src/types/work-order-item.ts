export type WorkOrderItemStatus =
  | "open"
  | "waiting_for_parts"
  | "in_progress"
  | "tech_review"
  | "admin_review"
  | "finished";

export interface WorkOrderItem {
  id: string;
  work_order_id: string;
  item_number: number;
  status: WorkOrderItemStatus;
  discrepancy: string | null;
  corrective_action: string | null;
  notes: string | null;
  category: string | null;
  sub_category: string | null;
  ata_code: string | null;
  hours_estimate: number | null;
  billing_method: string;
  flat_rate: number | null;
  department: string | null;
  do_not_bill: boolean;
  enable_rii: boolean;

  // Audit
  created_by: string;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface WorkOrderItemListResponse {
  items: WorkOrderItem[];
  total: number;
}

export interface WorkOrderItemCreateInput {
  created_by: string;
  status?: WorkOrderItemStatus;
  discrepancy?: string;
  corrective_action?: string;
  notes?: string;
  category?: string;
  sub_category?: string;
  ata_code?: string;
  hours_estimate?: number;
  billing_method?: string;
  flat_rate?: number;
  department?: string;
  do_not_bill?: boolean;
  enable_rii?: boolean;
}

export interface WorkOrderItemUpdateInput {
  status?: WorkOrderItemStatus;
  discrepancy?: string;
  corrective_action?: string;
  notes?: string;
  category?: string;
  sub_category?: string;
  ata_code?: string;
  hours_estimate?: number;
  billing_method?: string;
  flat_rate?: number;
  department?: string;
  do_not_bill?: boolean;
  enable_rii?: boolean;
  updated_by?: string;
}

// Status display helpers
export const WORK_ORDER_ITEM_STATUS_LABELS: Record<WorkOrderItemStatus, string> = {
  open: "Open",
  waiting_for_parts: "Waiting for Parts",
  in_progress: "In Progress",
  tech_review: "Tech Review",
  admin_review: "Admin Review",
  finished: "Finished",
};
