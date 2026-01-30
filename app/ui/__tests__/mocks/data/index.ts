import type { City, WorkOrder } from "@/types/work-order";
import type { WorkOrderItem } from "@/types/work-order-item";

export const mockCities: City[] = [
  {
    id: "city-uuid-1",
    code: "KTYS",
    name: "Knoxville McGhee Tyson",
    is_active: true,
  },
  {
    id: "city-uuid-2",
    code: "KBNA",
    name: "Nashville International",
    is_active: true,
  },
];

export const mockWorkOrder: WorkOrder = {
  id: "wo-uuid-1",
  work_order_number: "KTYS00001-01-2026",
  sequence_number: 1,
  city: {
    id: "city-uuid-1",
    code: "KTYS",
    name: "Knoxville McGhee Tyson",
  },
  work_order_type: "work_order",
  status: "created",
  status_notes: null,
  aircraft_registration: "N12345",
  aircraft_serial: "SN12345",
  aircraft_make: "Cessna",
  aircraft_model: "172",
  aircraft_year: 2020,
  customer_name: "Test Customer",
  customer_po_number: "PO-001",
  due_date: "2026-12-31",
  created_date: "2026-01-15T10:00:00Z",
  completed_date: null,
  lead_technician: "John Doe",
  sales_person: "Jane Doe",
  priority: "normal",
  created_by: "test_user",
  updated_by: null,
  created_at: "2026-01-15T10:00:00Z",
  updated_at: "2026-01-15T10:00:00Z",
  item_count: 2,
};

export const mockWorkOrders: WorkOrder[] = [
  mockWorkOrder,
  {
    ...mockWorkOrder,
    id: "wo-uuid-2",
    work_order_number: "KTYS00002-01-2026",
    sequence_number: 2,
    customer_name: "Another Customer",
    status: "open",
    item_count: 0,
  },
];

export const mockWorkOrderItem: WorkOrderItem = {
  id: "item-uuid-1",
  work_order_id: "wo-uuid-1",
  item_number: 1,
  status: "open",
  discrepancy: "Engine vibration detected",
  corrective_action: "Replaced engine mounts",
  notes: "Completed successfully",
  category: "Powerplant",
  sub_category: "Engine",
  ata_code: "71-10",
  hours_estimate: 4.5,
  billing_method: "hourly",
  flat_rate: null,
  department: "Engine Shop",
  do_not_bill: false,
  enable_rii: false,
  created_by: "tech_user",
  updated_by: null,
  created_at: "2026-01-15T11:00:00Z",
  updated_at: "2026-01-15T11:00:00Z",
};

export const mockWorkOrderItems: WorkOrderItem[] = [
  mockWorkOrderItem,
  {
    ...mockWorkOrderItem,
    id: "item-uuid-2",
    item_number: 2,
    discrepancy: "Radio intermittent",
    corrective_action: "Replaced antenna connector",
    category: "Avionics",
    ata_code: "23-10",
    hours_estimate: 2.0,
    department: "Avionics",
  },
];
