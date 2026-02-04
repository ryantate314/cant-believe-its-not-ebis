import useSWR from "swr";
import { auditApi } from "@/lib/api";
import type { PaginatedAuditResponse } from "@/types/audit";

export function useAuditHistory(
  entityType: string,
  entityId: string,
  page = 1,
  pageSize = 50
) {
  const { data, error, isLoading, mutate } = useSWR<PaginatedAuditResponse>(
    entityId ? `audit:${entityType}:${entityId}:${page}` : null,
    () => auditApi.getHistory(entityType, entityId, page, pageSize)
  );

  return {
    auditHistory: data,
    isLoading,
    error,
    mutate,
  };
}
