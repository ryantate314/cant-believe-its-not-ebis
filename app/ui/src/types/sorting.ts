export type SortOrder = "asc" | "desc";

export interface SortState {
  sortBy: string | null;
  sortOrder: SortOrder;
}
