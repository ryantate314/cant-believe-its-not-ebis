import type { City, CityListResponse } from "@/types/work-order";
import { fetchApi } from "./base";

export const citiesApi = {
  list: (activeOnly = true): Promise<CityListResponse> =>
    fetchApi(`/cities?active_only=${activeOnly}`),

  get: (id: string): Promise<City> => fetchApi(`/cities/${id}`),
};
