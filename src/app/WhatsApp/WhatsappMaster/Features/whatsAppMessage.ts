import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import axios from "axios";
import { RootState } from "../../../../redux/store";
import { WhatsApp, WhatsappMessage, PostWhatsappMessagePayload, initialState } from "../Models/whatsappModels";
import { AxiosError } from "axios";
import { API_BASE_URL } from "../../../../../API_URL";

const WHATSAPPROLE_API_URL = `${API_BASE_URL}/whatsappadmin`;
const WHATSAPPMESSAGE_API_URL = `${API_BASE_URL}/whatsappmessage`;

const handleError = (error: AxiosError): string => {
  if (error.response?.data) {
    const data = error.response.data as any;
    if (data.detail) return typeof data.detail === 'string' ? data.detail : JSON.stringify(data.detail);
  }
  return error.message || "Error";
};

export const fetchWhatsAppRoles = createAsyncThunk<WhatsApp[]>("whatsAppRoles/fetch", async (_, { rejectWithValue }) => {
  try { return (await axios.get(WHATSAPPROLE_API_URL)).data; } 
  catch (e: unknown) { return rejectWithValue(handleError(e as AxiosError)); }
});

export const fetchWhatsappMessages = createAsyncThunk<WhatsappMessage[]>("whatsappMessages/fetch", async (_, { rejectWithValue }) => {
  try { return (await axios.get(WHATSAPPMESSAGE_API_URL)).data; } 
  catch (e: unknown) { return rejectWithValue(handleError(e as AxiosError)); }
});

// Updated: Removed adminId from payload creation
export const createSubModuleRow = createAsyncThunk<WhatsappMessage, { module: string; subModule: string }>(
  "whatsappMessages/create",
  async (payload, { rejectWithValue }) => {
    try { 
      // We only send module and subModule. Backend handles adminId as []
      return (await axios.put(WHATSAPPMESSAGE_API_URL, payload)).data; 
    } 
    catch (e: unknown) { return rejectWithValue(handleError(e as AxiosError)); }
  }
);

// This is used for Assigning (Linking) Admins
export const postWhatsappMessage = createAsyncThunk<void, PostWhatsappMessagePayload>(
  "whatsappMessage/post",
  async (payload, { rejectWithValue }) => {
    try { await axios.post(WHATSAPPMESSAGE_API_URL, payload); } 
    catch (e: unknown) { return rejectWithValue(handleError(e as AxiosError)); }
  }
);

export const removeAdminFromMessage = createAsyncThunk<void, { module: string; subModule: string; adminName: string }>(
  "whatsappMessage/removeAdmin",
  async (params, { rejectWithValue }) => {
    try { await axios.patch(`${WHATSAPPMESSAGE_API_URL}/remove-admin`, null, { params }); } 
    catch (e: unknown) { return rejectWithValue(handleError(e as AxiosError)); }
  }
);

const whatsappMessageSlice = createSlice({
  name: "WhatsappMessages",
  initialState,
  reducers: {
    setSnackbarOpen: (state, action: PayloadAction<boolean>) => { state.snackbarOpen = action.payload; },
    setSnackbarMessage: (state, action: PayloadAction<string>) => { state.snackbarMessage = action.payload; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchWhatsAppRoles.fulfilled, (state, action) => { state.roles = action.payload; })
      .addCase(fetchWhatsappMessages.fulfilled, (state, action) => { state.messages = action.payload; })
      .addCase(createSubModuleRow.pending, (state) => { state.posting = true; })
      .addCase(createSubModuleRow.fulfilled, (state, action) => {
        state.posting = false;
        state.messages.push(action.payload);
        state.snackbarMessage = "SubModule created!";
        state.snackbarOpen = true;
      })
      .addCase(postWhatsappMessage.fulfilled, (state) => { state.snackbarMessage = "Admin linked!"; state.snackbarOpen = true; })
      .addCase(removeAdminFromMessage.fulfilled, (state) => { state.snackbarMessage = "Admin unlinked!"; state.snackbarOpen = true; });
  },
});

export const { setSnackbarOpen, setSnackbarMessage } = whatsappMessageSlice.actions;
export const selectWhatsappMessages = (state: RootState) => state.WhatsappMessage;
export default whatsappMessageSlice.reducer;