import type {
  Aircraft,
  AircraftListResponse,
  AircraftCreateInput,
  AircraftUpdateInput,
} from "@/types/aircraft";
import type { SortOrder } from "@/types/sorting";
import { fetchApi } from "./base";

export const aircraftApi = {
  list: (params?: {
    page?: number;
    page_size?: number;
    search?: string;
    city_id?: string;
    active_only?: boolean;
    sort_by?: string;
    sort_order?: SortOrder;
  }): Promise<AircraftListResponse> => {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set("page", String(params.page));
    if (params?.page_size) searchParams.set("page_size", String(params.page_size));
    if (params?.search) searchParams.set("search", params.search);
    if (params?.city_id) searchParams.set("city_id", params.city_id);
    if (params?.active_only !== undefined)
      searchParams.set("active_only", String(params.active_only));
    if (params?.sort_by) searchParams.set("sort_by", params.sort_by);
    if (params?.sort_order) searchParams.set("sort_order", params.sort_order);
    const queryString = searchParams.toString();
    return fetchApi(`/aircraft${queryString ? `?${queryString}` : ""}`);
  },

  get: (id: string): Promise<Aircraft> => fetchApi(`/aircraft/${id}`),

  create: (data: AircraftCreateInput): Promise<Aircraft> =>
    fetchApi("/aircraft", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  update: (id: string, data: AircraftUpdateInput): Promise<Aircraft> =>
    fetchApi(`/aircraft/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  delete: (id: string): Promise<void> =>
    fetchApi(`/aircraft/${id}`, {
      method: "DELETE",
    }),
};
