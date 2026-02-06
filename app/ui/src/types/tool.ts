export type ToolType = "certified" | "reference" | "consumable" | "kit";

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
