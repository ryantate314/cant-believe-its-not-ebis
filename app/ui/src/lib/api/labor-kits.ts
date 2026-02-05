import type {
  LaborKit,
  LaborKitListResponse,
  LaborKitCreateInput,
  LaborKitUpdateInput,
  ApplyLaborKitResponse,
} from "@/types/labor-kit";
import type { SortOrder } from "@/types/sorting";
import { fetchApi } from "./base";

export const laborKitsApi = {
  list: (params?: {
    sort_by?: string;
    sort_order?: SortOrder;
    active_only?: boolean;
  }): Promise<LaborKitListResponse> => {
    const searchParams = new URLSearchParams();
    if (params?.sort_by) searchParams.set("sort_by", params.sort_by);
    if (params?.sort_order) searchParams.set("sort_order", params.sort_order);
    if (params?.active_only !== undefined)
      searchParams.set("active_only", String(params.active_only));
    const queryString = searchParams.toString();
    return fetchApi(`/labor-kits${queryString ? `?${queryString}` : ""}`);
  },

  get: (id: string): Promise<LaborKit> => fetchApi(`/labor-kits/${id}`),

  create: (data: LaborKitCreateInput): Promise<LaborKit> =>
    fetchApi("/labor-kits", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  update: (id: string, data: LaborKitUpdateInput): Promise<LaborKit> =>
    fetchApi(`/labor-kits/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  delete: (id: string): Promise<void> =>
    fetchApi(`/labor-kits/${id}`, {
      method: "DELETE",
    }),

  apply: (kitId: string, workOrderId: string, createdBy: string): Promise<ApplyLaborKitResponse> =>
    fetchApi(`/labor-kits/${kitId}/apply/${workOrderId}?created_by=${encodeURIComponent(createdBy)}`, {
      method: "POST",
    }),
};
