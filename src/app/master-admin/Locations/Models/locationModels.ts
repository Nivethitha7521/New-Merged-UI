





// Types for Import Response
export interface ImportResponse {
  message: string;
  inserted_count: number;
  updated_count: number;
  errorCount: number;
  successful: Array<{
    row: number;
    branchName: string;
    locationId: string;
    assignedId: string;
  }>;
  updated: Array<{
    row: number;
    branchName: string;
    locationId: string;
    updatedFields: string[];
    changes: Record<string, any>;
  }>;
  failed: Array<{
    row: number;
    error: string;
    data: Record<string, any>;
  }>;
  duplicates: string[];
  max_id_number: number;
}

export interface ImportPayload {
  file: File;
  mode: 'import' | 'merge' | 'replace';
}


export interface OrderType {
  orderTypeId: string;
  orderTypeName: string;
}


export interface Location {
  branchId?: string;
  locationId?: string;
  type: string;
  branchName: string;
  aliasName: string;
  status: string;
  address: string;
  country: string;
  state: string;
  city: string;
  postalCode: number;
  phoneNumber: number;
  email: string;
  latitude: number;
  longitude: number;
  description: string;
  code: string;
  managerName: string;
  managerContact: number;
  openingHours?: string | null;
  closingHours?: string | null;
  createdDate?: string | null;
  lastUpdatedDate?: string | null;
  salesTypes: string[];
  createdBy: string;
}

export interface CityResponse {
  POSTAL_CODE: number;
  LATITUDE: number;
  LONGITUDE: number;
}

export interface LocationState {
  locations: Location[];
  orderType: OrderType[];
  status: "idle" | "loading" | "succeeded" | "failed";
  error: string | null;
  loading: boolean;
  selectedCountry: string | null;
  selectedState: string | null;
  selectedCity: string | null;
  postalCode: string | null;
  countries: string[];
  states: string[];
  cities: string[];
  postal: CityResponse[];
  snackbarOpen: boolean;
  snackbarMessage: string;


  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export const initialState: LocationState = {
  locations: [],
  orderType: [],
  status: "idle",
  error: null,
  loading: false,
  selectedCountry: null,
  selectedState: null,
  selectedCity: null,
  postalCode: null,
  countries: [],
  states: [],
  cities: [],
  postal: [],
  snackbarOpen: false,
  snackbarMessage: "",

  total: 0,
  page: 1,
  limit: 15,
  totalPages: 0,
};