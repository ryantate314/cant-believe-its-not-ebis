import useSWR, { mutate } from "swr";
import { getWorkOrder, type WorkOrderResponse } from "@/lib/api";

/**
 * Hook for fetching and caching a work order by ID.
 * Uses SWR for automatic caching and deduplication.
 *
 * @example
 * const { workOrder, isLoading, error } = useWorkOrder(id);
 *
 * // After updating the work order, invalidate the cache:
 * await updateWorkOrder(id, data);
 * mutateWorkOrder(id);
 */
export function useWorkOrder(id: string) {
  const { data, error, isLoading } = useSWR(
    id ? `work-order:${id}` : null,
    async () => {
      const response = await getWorkOrder(id);
      return response.data;
    }
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
export function mutateWorkOrder(id: string, data?: WorkOrderResponse) {
  return mutate(`work-order:${id}`, data);
}
