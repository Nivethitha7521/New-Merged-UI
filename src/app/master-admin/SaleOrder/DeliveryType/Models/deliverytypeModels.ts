


// ✅ Define the interface for DeliveryType
 export interface DeliveryType {
  deliveryTypeId: string;
  deliveryType: string;
  user?: string;
  createdDate?: string;
  updatedDate?: string;
  remarks?: string;
  status: "active" | "deactivate";
}

// ✅ Define the initial state interface  
export interface DeliveryTypeState {
  types: DeliveryType[];
  status: "idle" | "loading" | "succeeded" | "failed";
  error: string | null;
}

// ✅ Initial state
export const initialState: DeliveryTypeState = {
  types: [],
  status: "idle",
  error: null,
};