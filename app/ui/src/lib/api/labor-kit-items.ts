import type {
  LaborKitItem,
  LaborKitItemListResponse,
  LaborKitItemCreateInput,
  LaborKitItemUpdateInput,
} from "@/types/labor-kit";
import type { SortOrder } from "@/types/sorting";
import { fetchApi } from "./base";

export const laborKitItemsApi = {
  list: (
    kitId: string,
    params?: { sort_by?: string; sort_order?: SortOrder }
  ): Promise<LaborKitItemListResponse> => {
    const searchParams = new URLSearchParams();
    if (params?.sort_by) searchParams.set("sort_by", params.sort_by);
    if (params?.sort_order) searchParams.set("sort_order", params.sort_order);
    const queryString = searchParams.toString();
    return fetchApi(
      `/labor-kits/${kitId}/items${queryString ? `?${queryString}` : ""}`
    );
  },

  get: (kitId: string, itemId: string): Promise<LaborKitItem> =>
    fetchApi(`/labor-kits/${kitId}/items/${itemId}`),

  create: (kitId: string, data: LaborKitItemCreateInput): Promise<LaborKitItem> =>
    fetchApi(`/labor-kits/${kitId}/items`, {
      method: "POST",
      body: JSON.stringify(data),
    }),

  update: (
    kitId: string,
    itemId: string,
    data: LaborKitItemUpdateInput
  ): Promise<LaborKitItem> =>
    fetchApi(`/labor-kits/${kitId}/items/${itemId}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  delete: (kitId: string, itemId: string): Promise<void> =>
    fetchApi(`/labor-kits/${kitId}/items/${itemId}`, {
      method: "DELETE",
    }),
};
