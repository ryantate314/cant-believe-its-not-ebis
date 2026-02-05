import useSWR, { mutate } from "swr";
import { getWorkOrderItem, type WorkOrderItemResponse } from "@/lib/api";

/**
 * Hook for fetching and caching a work order item by ID.
 * Uses SWR for automatic caching and deduplication.
 *
 * @example
 * const { item, isLoading, error, mutate } = useWorkOrderItem(workOrderId, itemId);
 *
 * // After updating the item, invalidate the cache:
 * await updateWorkOrderItem(workOrderId, itemId, data);
 * mutateWorkOrderItem(workOrderId, itemId);
 */
export function useWorkOrderItem(workOrderId: string, itemId: string) {
  const { data, error, isLoading, mutate: swrMutate } = useSWR(
    workOrderId && itemId ? `work-order-item:${workOrderId}:${itemId}` : null,
    async () => {
      const response = await getWorkOrderItem(workOrderId, itemId);
      return response.data;
    }
  );

  return {
    item: data,
    isLoading,
    error,
    mutate: swrMutate,
  };
}

/**
 * Invalidate the cached work order item, triggering a refetch
 * for all components using useWorkOrderItem with this ID.
 */
export function mutateWorkOrderItem(
  workOrderId: string,
  itemId: string,
  data?: WorkOrderItemResponse
) {
  return mutate(`work-order-item:${workOrderId}:${itemId}`, data);
}
