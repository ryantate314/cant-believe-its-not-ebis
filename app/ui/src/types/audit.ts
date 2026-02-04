export type AuditAction = "INSERT" | "UPDATE" | "DELETE";

export interface AuditRecord {
  id: number;
  entity_type: string;
  entity_id: string;
  action: AuditAction;
  old_values: Record<string, unknown> | null;
  new_values: Record<string, unknown> | null;
  changed_fields: string[] | null;
  user_id: string | null;
  session_id: string | null;
  ip_address: string | null;
  created_at: string;
}

export interface PaginatedAuditResponse {
  items: AuditRecord[];
  total: number;
  page: number;
  page_size: number;
  has_next: boolean;
}
