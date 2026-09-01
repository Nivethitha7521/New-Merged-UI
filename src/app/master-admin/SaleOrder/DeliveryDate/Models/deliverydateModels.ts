


// Define interfaces for delivery order and state
export interface DeliveryOrderItem {
  deliveryOrderId: string;
  configId: string;
  configures: Config[];
  configName: string;
  noOfDates: number;
  createdDate: string;
  updatedDate: string;
  noOfChangeableDates: string;
  remarks: string;
  status: 'enabled' | 'disabled';
}


export interface Config {
  description: string;
  configId: string;
  configName:string
  noOfChangeableDate: number;
  createdDate: string;
  updatedDate: string;
  status: 'enabled' | 'disabled';
}

export interface DeliveryOrderState {
  items: DeliveryOrderItem[];
  loading: boolean;
  error: string | null;
  enabledOrderId: string | null; // Changed from configId to be more descriptive
}

// Initial state
export const initialState: DeliveryOrderState = {
  items: [],
  loading: false,
  error: null,
  enabledOrderId: null,
};