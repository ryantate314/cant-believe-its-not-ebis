export interface Aircraft {
  id: string;
  registration_number: string;
  serial_number: string | null;
  make: string | null;
  model: string | null;
  year_built: number | null;
  meter_profile: string | null;
  primary_city: {
    id: string;
    code: string;
    name: string;
  } | null;
  customer_name: string | null;
  aircraft_class: string | null;
  fuel_code: string | null;
  notes: string | null;
  is_active: boolean;

  // Audit
  created_by: string;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface AircraftListResponse {
  items: Aircraft[];
  total: number;
  page: number;
  page_size: number;
}

export interface AircraftCreateInput {
  registration_number: string;
  created_by: string;
  serial_number?: string;
  make?: string;
  model?: string;
  year_built?: number;
  meter_profile?: string;
  primary_city_id?: string;
  customer_name?: string;
  aircraft_class?: string;
  fuel_code?: string;
  notes?: string;
  is_active?: boolean;
}

export interface AircraftUpdateInput {
  registration_number?: string;
  serial_number?: string;
  make?: string;
  model?: string;
  year_built?: number;
  meter_profile?: string;
  primary_city_id?: string;
  customer_name?: string;
  aircraft_class?: string;
  fuel_code?: string;
  notes?: string;
  is_active?: boolean;
  updated_by?: string;
}
