// Interface for WhatsApp Type
export interface WhatsApp {
    moduleAdminId: string; // Changed from whatsAppId
    whatsAppRollName: string;
    mobileNumber: string | number; 
    status: string; // "active" or "deactivated"
}

// Interface for WhatsApp Slice State
export interface WhatsAppState {
  items: WhatsApp[];
  deactivatedItems: WhatsApp[];
  loading: boolean;
  successMessage: string | null;
  error: string | null;
  searchQuery: string;
  snackbarOpen: boolean;
  snackbarMessage: string;
  whatsAppData: WhatsApp;
  editModuleAdminId: string | null; // Changed from editWhatsAppId
  editIndex: number | null;
  dialogOpen: "none" | "edit" | "deactivated" | "add";
  showDeactivated: boolean;
}

// Initial State
export const initialWhatsAppState: WhatsApp = {
  moduleAdminId: "", // Changed
  whatsAppRollName: "",
  mobileNumber: "", 
  status: "active",
};

export const initialState: WhatsAppState = {
  items: [],
  deactivatedItems: [],
  loading: false,
  successMessage: null,
  error: null,
  searchQuery: "",
  whatsAppData: initialWhatsAppState,
  editIndex: null,
  editModuleAdminId: null, // Changed
  dialogOpen: "none",
  snackbarOpen: false,
  snackbarMessage: "",
  showDeactivated: false,
};