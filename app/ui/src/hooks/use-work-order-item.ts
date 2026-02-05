import useSWR, { mutate } from "swr";
import { workOrderItemsApi } from "@/lib/api";
import type { WorkOrderItem } from "@/types";

/**
 * Hook for fetching and caching a work order item by ID.
 * Uses SWR for automatic caching and deduplication.
 *
 * @example
 * const { item, isLoading, error, mutate } = useWorkOrderItem(workOrderId, itemId);
 *
 * // After updating the item, invalidate the cache:
 * await workOrderItemsApi.update(workOrderId, itemId, data);
 * mutateWorkOrderItem(workOrderId, itemId);
 */
export function useWorkOrderItem(workOrderId: string, itemId: string) {
  const { data, error, isLoading, mutate: swrMutate } = useSWR<WorkOrderItem>(
    workOrderId && itemId ? `work-order-item:${workOrderId}:${itemId}` : null,
    () => workOrderItemsApi.get(workOrderId, itemId)
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
  data?: WorkOrderItem
) {
  return mutate(`work-order-item:${workOrderId}:${itemId}`, data);
}
