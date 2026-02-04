export interface CityWorkOrderCount {
  city_id: string;
  city_code: string;
  city_name: string;
  open_count: number;
}

export interface WorkOrderCountsByCityResponse {
  items: CityWorkOrderCount[];
}
