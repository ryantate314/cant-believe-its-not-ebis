export interface Customer {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  phone_type: string | null;
  address: string | null;
  address_2: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  country: string | null;
  notes: string | null;
  is_active: boolean;

  // Audit
  created_by: string;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface CustomerListResponse {
  items: Customer[];
  total: number;
  page: number;
  page_size: number;
}

export interface CustomerCreateInput {
  name: string;
  created_by: string;
  email?: string;
  phone?: string;
  phone_type?: string;
  address?: string;
  address_2?: string;
  city?: string;
  state?: string;
  zip?: string;
  country?: string;
  notes?: string;
  is_active?: boolean;
}

export interface CustomerUpdateInput {
  name?: string;
  email?: string;
  phone?: string;
  phone_type?: string;
  address?: string;
  address_2?: string;
  city?: string;
  state?: string;
  zip?: string;
  country?: string;
  notes?: string;
  is_active?: boolean;
  updated_by?: string;
}
