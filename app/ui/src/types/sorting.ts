// Re-export generated type
export type { SortOrder } from "@/lib/api";

// Local interface for sort state (not generated - UI-specific)
export interface SortState {
  sortBy: string | null;
  sortOrder: "asc" | "desc";
}
