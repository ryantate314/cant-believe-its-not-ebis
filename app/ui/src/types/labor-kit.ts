export interface LaborKit {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  is_active: boolean;

  // Audit
  created_by: string;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface LaborKitListResponse {
  items: LaborKit[];
  total: number;
}

export interface LaborKitCreateInput {
  name: string;
  description?: string;
  category?: string;
  is_active?: boolean;
  created_by: string;
}

export interface LaborKitUpdateInput {
  name?: string;
  description?: string;
  category?: string;
  is_active?: boolean;
  updated_by?: string;
}

export interface LaborKitItem {
  id: string;
  labor_kit_id: string;
  item_number: number;
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

export interface LaborKitItemListResponse {
  items: LaborKitItem[];
  total: number;
}

export interface LaborKitItemCreateInput {
  created_by: string;
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

export interface LaborKitItemUpdateInput {
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

export interface ApplyLaborKitResponse {
  items_created: number;
  work_order_id: string;
  labor_kit_id: string;
}

// Category options for labor kits
export const LABOR_KIT_CATEGORIES = [
  "Engine",
  "Airframe",
  "Avionics",
  "Interior",
  "Exterior",
  "Propeller",
  "Landing Gear",
  "Fuel System",
  "Electrical",
  "General",
] as const;
