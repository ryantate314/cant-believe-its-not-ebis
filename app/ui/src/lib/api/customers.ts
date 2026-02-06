import type {
  Customer,
  CustomerListResponse,
  CustomerCreateInput,
  CustomerUpdateInput,
} from "@/types/customer";
import type { SortOrder } from "@/types/sorting";
import { fetchApi } from "./base";

export const customersApi = {
  list: (params?: {
    page?: number;
    page_size?: number;
    search?: string;
    active_only?: boolean;
    sort_by?: string;
    sort_order?: SortOrder;
  }): Promise<CustomerListResponse> => {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set("page", String(params.page));
    if (params?.page_size)
      searchParams.set("page_size", String(params.page_size));
    if (params?.search) searchParams.set("search", params.search);
    if (params?.active_only !== undefined)
      searchParams.set("active_only", String(params.active_only));
    if (params?.sort_by) searchParams.set("sort_by", params.sort_by);
    if (params?.sort_order) searchParams.set("sort_order", params.sort_order);
    const queryString = searchParams.toString();
    return fetchApi(`/customers${queryString ? `?${queryString}` : ""}`);
  },

  get: (id: string): Promise<Customer> => fetchApi(`/customers/${id}`),

  create: (data: CustomerCreateInput): Promise<Customer> =>
    fetchApi("/customers", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  update: (id: string, data: CustomerUpdateInput): Promise<Customer> =>
    fetchApi(`/customers/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  delete: (id: string): Promise<void> =>
    fetchApi(`/customers/${id}`, {
      method: "DELETE",
    }),
};
