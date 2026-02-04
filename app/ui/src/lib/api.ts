import type {
  City,
  CityListResponse,
  WorkOrder,
  WorkOrderListResponse,
  WorkOrderCreateInput,
  WorkOrderUpdateInput,
} from "@/types/work-order";
import type {
  WorkOrderItem,
  WorkOrderItemListResponse,
  WorkOrderItemCreateInput,
  WorkOrderItemUpdateInput,
} from "@/types/work-order-item";
import type {
  LaborKit,
  LaborKitListResponse,
  LaborKitCreateInput,
  LaborKitUpdateInput,
  LaborKitItem,
  LaborKitItemListResponse,
  LaborKitItemCreateInput,
  LaborKitItemUpdateInput,
  ApplyLaborKitResponse,
} from "@/types/labor-kit";
import type {
  Aircraft,
  AircraftListResponse,
  AircraftCreateInput,
  AircraftUpdateInput,
} from "@/types/aircraft";
import type { SortOrder } from "@/types/sorting";
import type { PaginatedAuditResponse } from "@/types/audit";

const API_BASE = "/api";

class ApiError extends Error {
  constructor(
    public status: number,
    message: string
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function fetchApi<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new ApiError(
      response.status,
      errorData.detail || `API error: ${response.status}`
    );
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json();
}

// Cities API
export const citiesApi = {
  list: (activeOnly = true): Promise<CityListResponse> =>
    fetchApi(`/cities?active_only=${activeOnly}`),

  get: (id: string): Promise<City> => fetchApi(`/cities/${id}`),
};

// Work Orders API
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

// Work Order Items API
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

// Labor Kits API
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

// Labor Kit Items API
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

// Aircraft API
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

// Audit API
export const auditApi = {
  getHistory: (
    entityType: string,
    entityId: string,
    page = 1,
    pageSize = 50
  ): Promise<PaginatedAuditResponse> =>
    fetchApi(`/audit/${entityType}/${entityId}?page=${page}&page_size=${pageSize}`),
};

export { ApiError };
