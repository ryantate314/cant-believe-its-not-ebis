import useSWR, { mutate } from "swr";
import { getWorkOrderCountsByCity, type CityWorkOrderCount } from "@/lib/api";

export function useWorkOrderCountsByCity() {
  const { data, error, isLoading } = useSWR(
    "dashboard:work-order-counts-by-city",
    async () => {
      const response = await getWorkOrderCountsByCity();
      return response.data.items;
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
