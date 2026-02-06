import type { City, WorkOrder, AircraftBrief } from "@/types/work-order";
import type { WorkOrderItem } from "@/types/work-order-item";
import type { Aircraft } from "@/types/aircraft";
import type { Tool, ToolRoom } from "@/types/tool";

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

export const mockAircraftBrief: AircraftBrief = {
  id: "aircraft-uuid-1",
  registration_number: "N12345",
  serial_number: "SN12345",
  make: "Cessna",
  model: "172",
  year_built: 2020,
};

export const mockAircraft: Aircraft[] = [
  {
    id: "aircraft-uuid-1",
    registration_number: "N12345",
    serial_number: "SN12345",
    make: "Cessna",
    model: "172",
    year_built: 2020,
    meter_profile: null,
    primary_city: {
      id: "city-uuid-1",
      code: "KTYS",
      name: "Knoxville McGhee Tyson",
    },
    customer_name: "Test Customer",
    aircraft_class: null,
    fuel_code: null,
    notes: null,
    is_active: true,
    created_by: "test_user",
    updated_by: null,
    created_at: "2026-01-15T10:00:00Z",
    updated_at: "2026-01-15T10:00:00Z",
  },
  {
    id: "aircraft-uuid-2",
    registration_number: "N67890",
    serial_number: "SN67890",
    make: "Piper",
    model: "Cherokee",
    year_built: 2018,
    meter_profile: null,
    primary_city: {
      id: "city-uuid-1",
      code: "KTYS",
      name: "Knoxville McGhee Tyson",
    },
    customer_name: "Another Customer",
    aircraft_class: null,
    fuel_code: null,
    notes: null,
    is_active: true,
    created_by: "test_user",
    updated_by: null,
    created_at: "2026-01-15T10:00:00Z",
    updated_at: "2026-01-15T10:00:00Z",
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
  aircraft: mockAircraftBrief,
  work_order_type: "work_order",
  status: "created",
  status_notes: null,
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

export const mockToolRooms: ToolRoom[] = [
  {
    id: "tr-uuid-1",
    code: "TR-001",
    name: "Main Tool Room",
    is_active: true,
  },
  {
    id: "tr-uuid-2",
    code: "TR-002",
    name: "Secondary Tool Room",
    is_active: true,
  },
];

export const mockTools: Tool[] = [
  {
    id: "tool-uuid-1",
    name: "Torque Wrench 50ft-lb",
    tool_type: "certified",
    tool_type_code: "Cert",
    description: "Calibrated torque wrench",
    tool_room: { id: "tr-uuid-1", code: "TR-001", name: "Main Tool Room" },
    city: { id: "city-uuid-1", code: "KTYS", name: "Knoxville McGhee Tyson" },
    make: "Snap-On",
    model: "TW-50",
    serial_number: "SN-001",
    calibration_due_days: 45,
    next_calibration_due: "2026-03-22",
    media_count: 0,
    is_in_kit: false,
    created_at: "2026-01-15T10:00:00Z",
    updated_at: "2026-01-15T10:00:00Z",
  },
  {
    id: "tool-uuid-2",
    name: "Digital Multimeter",
    tool_type: "reference",
    tool_type_code: "Ref",
    description: "Standard reference meter",
    tool_room: { id: "tr-uuid-1", code: "TR-001", name: "Main Tool Room" },
    city: { id: "city-uuid-1", code: "KTYS", name: "Knoxville McGhee Tyson" },
    make: "Fluke",
    model: "87V",
    serial_number: "SN-002",
    calibration_due_days: null,
    next_calibration_due: null,
    media_count: 1,
    is_in_kit: false,
    created_at: "2026-01-15T10:00:00Z",
    updated_at: "2026-01-15T10:00:00Z",
  },
];
