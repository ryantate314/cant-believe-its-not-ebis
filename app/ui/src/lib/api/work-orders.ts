import type {
  WorkOrder,
  WorkOrderListResponse,
  WorkOrderCreateInput,
  WorkOrderUpdateInput,
} from "@/types/work-order";
import type { SortOrder } from "@/types/sorting";
import { fetchApi } from "./base";

export const workOrdersApi = {
  list: (params: {
    city_id: string;
    page?: number;
    page_size?: number;
    search?: string;
    status?: string;
    sort_by?: string;
    sort_order?: SortOrder;
  }): Promise<WorkOrderListResponse> => {
    const searchParams = new URLSearchParams({
      city_id: params.city_id,
      page: String(params.page ?? 1),
      page_size: String(params.page_size ?? 20),
    });
    if (params.search) searchParams.set("search", params.search);
    if (params.status) searchParams.set("status", params.status);
    if (params.sort_by) searchParams.set("sort_by", params.sort_by);
    if (params.sort_order) searchParams.set("sort_order", params.sort_order);
    return fetchApi(`/work-orders?${searchParams}`);
  },

  get: (id: string): Promise<WorkOrder> => fetchApi(`/work-orders/${id}`),

  create: (data: WorkOrderCreateInput): Promise<WorkOrder> =>
    fetchApi("/work-orders", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  update: (id: string, data: WorkOrderUpdateInput): Promise<WorkOrder> =>
    fetchApi(`/work-orders/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  delete: (id: string): Promise<void> =>
    fetchApi(`/work-orders/${id}`, {
      method: "DELETE",
    }),
};
