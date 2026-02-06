export type ToolType = "certified" | "reference" | "consumable" | "kit";

export type ToolGroup =
  | "in_service"
  | "out_of_service"
  | "lost"
  | "retired";

export type KitFilter = "show" | "hide";

export type CalibDueDays = 60 | 90;

export interface ToolRoomBrief {
  id: string;
  code: string;
  name: string;
}

export interface CityBrief {
  id: string;
  code: string;
  name: string;
}

export interface Tool {
  id: string;
  name: string;
  tool_type: ToolType;
  tool_type_code: string;
  description: string | null;
  tool_room: ToolRoomBrief;
  city: CityBrief;
  make: string | null;
  model: string | null;
  serial_number: string | null;
  calibration_due_days: number | null;
  next_calibration_due: string | null;
  media_count: number;
  is_in_kit: boolean;
  created_at: string;
  updated_at: string;
}

export interface ToolListResponse {
  items: Tool[];
  total: number;
  page: number;
  page_size: number;
}

export interface ToolBrief {
  id: string;
  name: string;
  tool_type: ToolType;
  tool_type_code: string;
}

export interface ToolDetail {
  id: string;
  name: string;
  tool_type: ToolType;
  tool_type_code: string;
  description: string | null;
  details: string | null;
  tool_group: ToolGroup;
  tool_room: ToolRoomBrief;
  city: CityBrief;
  make: string | null;
  model: string | null;
  serial_number: string | null;
  location: string | null;
  location_notes: string | null;
  tool_cost: number | null;
  purchase_date: string | null;
  date_labeled: string | null;
  vendor_name: string | null;
  calibration_days: number | null;
  calibration_notes: string | null;
  calibration_cost: number | null;
  last_calibration_date: string | null;
  calibration_due_days: number | null;
  next_calibration_due: string | null;
  media_count: number;
  is_in_kit: boolean;
  parent_kit: ToolBrief | null;
  kit_tools: ToolBrief[];
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface ToolRoom {
  id: string;
  code: string;
  name: string;
  is_active: boolean;
}

export interface ToolRoomListResponse {
  items: ToolRoom[];
  total: number;
}
