// Re-export generated types
export type {
  LaborKitResponse as LaborKit,
  LaborKitCreate as LaborKitCreateInput,
  LaborKitUpdate as LaborKitUpdateInput,
  LaborKitListResponse,
  LaborKitItemResponse as LaborKitItem,
  LaborKitItemCreate as LaborKitItemCreateInput,
  LaborKitItemUpdate as LaborKitItemUpdateInput,
  LaborKitItemListResponse,
  ApplyLaborKitResponse,
} from "@/lib/api";

// Category options for labor kits (not generated - UI-specific)
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
