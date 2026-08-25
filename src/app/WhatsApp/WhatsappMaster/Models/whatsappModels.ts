export interface WhatsApp {
  whatsAppId: string;
  adminId: string;       
  whatsAppRollName: string;
  mobileNumber: string;
  status: string;
}

export interface WhatsappMessage {
  whatsappMessageId: string;
  module:            string;
  subModule:         string;
  adminId:           string[]; // Must be array
  status:            string;
  createdDate:       string | null;
  updatedDate:       string | null;
}

export interface PostWhatsappMessagePayload {
  module:      string;
  subModule:   string;
  adminId:     string; 
  enable:      boolean;
  status:      string;
}

export interface WhatsappMessageState {
  roles:           WhatsApp[];
  messages:        WhatsappMessage[]; 
  loading:         boolean;
  posting:         boolean;
  error:           string | null;
  snackbarOpen:    boolean;
  snackbarMessage: string;
}

export const initialState: WhatsappMessageState = {
  roles:           [],
  messages:        [],
  loading:         false,
  posting:         false,
  error:           null,
  snackbarOpen:    false,
  snackbarMessage: "",
};