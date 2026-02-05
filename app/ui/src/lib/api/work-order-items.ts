import type {
  WorkOrderItem,
  WorkOrderItemListResponse,
  WorkOrderItemCreateInput,
  WorkOrderItemUpdateInput,
} from "@/types/work-order-item";
import type { SortOrder } from "@/types/sorting";
import { fetchApi } from "./base";

export const workOrderItemsApi = {
  list: (
    workOrderId: string,
    params?: { sort_by?: string; sort_order?: SortOrder }
  ): Promise<WorkOrderItemListResponse> => {
    const searchParams = new URLSearchParams();
    if (params?.sort_by) searchParams.set("sort_by", params.sort_by);
    if (params?.sort_order) searchParams.set("sort_order", params.sort_order);
    const queryString = searchParams.toString();
    return fetchApi(
      `/work-orders/${workOrderId}/items${queryString ? `?${queryString}` : ""}`
    );
  },

  get: (workOrderId: string, itemId: string): Promise<WorkOrderItem> =>
    fetchApi(`/work-orders/${workOrderId}/items/${itemId}`),

  create: (
    workOrderId: string,
    data: WorkOrderItemCreateInput
  ): Promise<WorkOrderItem> =>
    fetchApi(`/work-orders/${workOrderId}/items`, {
      method: "POST",
      body: JSON.stringify(data),
    }),

  update: (
    workOrderId: string,
    itemId: string,
    data: WorkOrderItemUpdateInput
  ): Promise<WorkOrderItem> =>
    fetchApi(`/work-orders/${workOrderId}/items/${itemId}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  delete: (workOrderId: string, itemId: string): Promise<void> =>
    fetchApi(`/work-orders/${workOrderId}/items/${itemId}`, {
      method: "DELETE",
    }),
};
