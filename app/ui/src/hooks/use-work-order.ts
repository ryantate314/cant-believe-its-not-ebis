import useSWR, { mutate } from "swr";
import { workOrdersApi } from "@/lib/api";
import type { WorkOrder } from "@/types";

/**
 * Hook for fetching and caching a work order by ID.
 * Uses SWR for automatic caching and deduplication.
 *
 * @example
 * const { workOrder, isLoading, error } = useWorkOrder(id);
 *
 * // After updating the work order, invalidate the cache:
 * await workOrdersApi.update(id, data);
 * mutateWorkOrder(id);
 */
export function useWorkOrder(id: string) {
  const { data, error, isLoading } = useSWR<WorkOrder>(
    id ? `work-order:${id}` : null,
    () => workOrdersApi.get(id)
  );

  return {
    workOrder: data,
    isLoading,
    error,
  };
}

/**
 * Invalidate the cached work order, triggering a refetch
 * for all components using useWorkOrder with this ID.
 */
export function mutateWorkOrder(id: string, data?: WorkOrder) {
  return mutate(`work-order:${id}`, data);
}
