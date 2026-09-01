


// Interface for Payment Type
export interface Event {
    eventId: string;
    eventname: string;  
    // user: string;
    createdDate: Date | null;
    updatedDate: Date | null;
    remarks: string;
    status: string; // "active" or "inactive"
}

// Interface for Event Slice State
export interface EventState {
  items: Event[];
  deactivatedItems: Event[];
  loading: boolean;
  successMessage: string | null;
  error: string | null;
  searchQuery: string;
  snackbarOpen: boolean;
  snackbarMessage: string;
  eventData: Event;
  description:string;
  editeventId: string | null;
  editIndex: number | null;
  dialogOpen: "none" | "edit" | "deactivated" | "add";
  showDeactivated: boolean;
}

// Initial State
export const initialEventState: Event = {
  eventId: "",
  eventname: "",
  // user: "",
  createdDate: null,
  updatedDate: null,
  remarks:"",
  status: "active",
};

export const initialState: EventState = {
  items: [],
  deactivatedItems: [],
  loading: false,
  successMessage: null,
  error: null,
  searchQuery: "",
  eventData: initialEventState,
  description:"",
  editIndex: null,
  editeventId: null,
  dialogOpen: "none",
  snackbarOpen: false,
  snackbarMessage: "",
  showDeactivated: false,
};
