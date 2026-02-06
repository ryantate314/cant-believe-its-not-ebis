export type WorkOrderStatus =
  | "created"
  | "scheduled"
  | "open"
  | "in_progress"
  | "tracking"
  | "pending"
  | "in_review"
  | "completed"
  | "void";

export type PriorityLevel = "low" | "normal" | "high" | "urgent";

export type WorkOrderType = "work_order" | "quote";

export interface City {
  id: string;
  code: string;
  name: string;
  is_active: boolean;
}

export interface CityListResponse {
  items: City[];
  total: number;
}

export interface AircraftBrief {
  id: string;
  registration_number: string;
  serial_number: string | null;
  make: string | null;
  model: string | null;
  year_built: number | null;
}

export interface CustomerBrief {
  id: string;
  name: string;
  email: string | null;
}

export interface WorkOrder {
  id: string;
  work_order_number: string;
  sequence_number: number;
  city: {
    id: string;
    code: string;
    name: string;
  };
  aircraft: AircraftBrief;
  work_order_type: WorkOrderType;
  status: WorkOrderStatus;
  status_notes: string | null;

  // Customer
  customer: CustomerBrief | null;

  // Dates
  due_date: string | null;
  created_date: string;
  completed_date: string | null;

  // Assignment
  lead_technician: string | null;
  sales_person: string | null;
  priority: PriorityLevel;

  // Audit
  created_by: string;
  updated_by: string | null;
  created_at: string;
  updated_at: string;

  // Item count
  item_count: number;
}

export interface WorkOrderListResponse {
  items: WorkOrder[];
  total: number;
  page: number;
  page_size: number;
}

export interface WorkOrderCreateInput {
  city_id: string;
  aircraft_id: string;
  created_by: string;
  work_order_type?: WorkOrderType;
  status?: WorkOrderStatus;
  status_notes?: string;
  due_date?: string;
  lead_technician?: string;
  sales_person?: string;
  priority?: PriorityLevel;
}

export interface WorkOrderUpdateInput {
  work_order_type?: WorkOrderType;
  status?: WorkOrderStatus;
  status_notes?: string;
  aircraft_id?: string;
  due_date?: string;
  lead_technician?: string;
  sales_person?: string;
  priority?: PriorityLevel;
  updated_by?: string;
}

// Status display helpers
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
