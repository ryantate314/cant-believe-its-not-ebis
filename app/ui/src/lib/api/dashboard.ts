import type { WorkOrderCountsByCityResponse } from "@/types/dashboard";
import { fetchApi } from "./base";

export const dashboardApi = {
  getWorkOrderCountsByCity: (): Promise<WorkOrderCountsByCityResponse> =>
    fetchApi("/dashboard/work-order-counts-by-city"),
};
