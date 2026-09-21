



// Interfaces 
export interface WareHouse {
  id?: string;
  warehouseId?: string;
  warehouseName: string;
  aliasName: string;
  type: string; // "main" or "sub"
  parentLocationId?: string;
  subWarehouseName: string;
  status: string;
  address: string;
  country: string; // Backend expects string
  state: string; // Backend expects string
  city: string; // Backend expects string
  postalCode: number;
  phoneNumber: string;
  email: string;
  latitude: number;
  longitude: number;
  description: string;
  managerName: string;
  managerContact: string;
  openingHours: string | null; // ISO datetime string
  closingHours: string | null; // ISO datetime string
  createdDate: string | null; // Backend generates
  lastUpdatedDate: string | null; // Backend generates
  createdBy: string;

}

export interface LocationData {
  branchId: string;
  branchName: string;
  address: string;
  country: string;
  state: string;
  city: string;
  latitude: number;
  longitude: number;
  postalCode: number;
}

export interface PostOffice {
  Name: string;
  District: string;
  State: string;
  Country: string;
  Pincode: string;
  [key: string]: any;
}


export interface PostalApiResponse {
  Message: string;
  Status: string;
  PostOffice: PostOffice[] | null;
}

export interface CityResponse {
  POSTAL_CODE: number;
  LATITUDE: number;
  LONGITUDE: number;
}

export // Add this interface
  interface LocationApiResponse {
  id: string;
  warehouseName: string;
  address: string;
  country: string;
  state: string;
  city: string;
  postalCode: number;
}

export interface WarehouseState {
  wareHouse: WareHouse[];
  locationdropdown: LocationData[];
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
  countryData: PostalApiResponse[];
  snackbarOpen: boolean;
  snackbarMessage: string;
}

// Initial State
export const initialState: WarehouseState = {
  wareHouse: [],
  locationdropdown: [],
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
  countryData: [],
  snackbarOpen: false,
  snackbarMessage: '',
};
