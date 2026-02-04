import useSWR, { mutate } from "swr";
import { dashboardApi } from "@/lib/api";
import type { CityWorkOrderCount } from "@/types/dashboard";

export function useWorkOrderCountsByCity() {
  const { data, error, isLoading } = useSWR<CityWorkOrderCount[]>(
    "dashboard:work-order-counts-by-city",
    async () => {
      const response = await dashboardApi.getWorkOrderCountsByCity();
      return response.items;
    }
  );

  return {
    counts: data ?? [],
    isLoading,
    error,
  };
}

export function mutateWorkOrderCountsByCity(data?: CityWorkOrderCount[]) {
  return mutate("dashboard:work-order-counts-by-city", data);
}
