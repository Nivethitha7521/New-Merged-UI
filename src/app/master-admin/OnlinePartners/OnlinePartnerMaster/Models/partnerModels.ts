

// Interface for Online Partner
export interface OnlinePartner {
    onlinePartnersId: string;
    partnerName: string;
    createdDate: Date | null;
    updatedDate: Date | null;
    status: string; 
}

// Interface for Online Partners Slice State
export interface OnlinePartnersState {
    items: OnlinePartner[];
    deactivatedItems: OnlinePartner[];
    loading: boolean;
    successMessage: string | null;
    error: string | null;
    searchQuery: string;
    snackbarOpen: boolean;
    snackbarMessage: string;
    partnerData: OnlinePartner;
    description: string;
    editPartnerId: string | null;
    editIndex: number | null;
    dialogOpen: "none" | "edit" | "deactivated" | "add";
    showDeactivated: boolean;
}

// Initial State for Online Partner
export const initialOnlinePartnerState: OnlinePartner = {
    onlinePartnersId: "",
    partnerName: "",
    createdDate: null,
    updatedDate: null,
    status: "active",
};

// Initial State for Slice
export const initialState: OnlinePartnersState = {
    items: [],
    deactivatedItems: [],
    loading: false,
    successMessage: null,
    error: null,
    searchQuery: "",
    partnerData: initialOnlinePartnerState,
    description: "",
    editIndex: null,
    editPartnerId: null,
    dialogOpen: "none",
    snackbarOpen: false,
    snackbarMessage: "",
    showDeactivated: false,
};