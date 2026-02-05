import useSWR, { mutate } from "swr";
import { listWorkOrderItems, type WorkOrderItemResponse } from "@/lib/api";

/**
 * Hook for fetching and caching all work order items.
 * Uses SWR for automatic caching and deduplication.
 * Items are sorted by item_number ascending by default.
 *
 * @example
 * const { items, isLoading, error } = useWorkOrderItems(workOrderId);
 */
export function useWorkOrderItems(workOrderId: string) {
  const { data, error, isLoading } = useSWR(
    workOrderId ? `work-order-items:${workOrderId}` : null,
    async () => {
      const response = await listWorkOrderItems(workOrderId, {
        sort_by: "item_number",
        sort_order: "asc",
      });
      return response.data.items;
    }
  );

  return {
    items: data ?? [],
    isLoading,
    error,
  };
}

/**
 * Invalidate the cached work order items list, triggering a refetch
 * for all components using useWorkOrderItems with this work order ID.
 */
export function mutateWorkOrderItems(workOrderId: string, data?: WorkOrderItemResponse[]) {
  return mutate(`work-order-items:${workOrderId}`, data);
}
