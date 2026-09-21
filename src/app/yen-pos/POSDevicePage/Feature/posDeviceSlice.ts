


import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import axios, { AxiosError } from 'axios';
import { RootState } from '../../../../redux/store';
import { API_BASE_URL } from "../../../../../API_URL";
import { Device, Aliases, initialdevice, initialState, PaginatedDeviceResponse } from '../Models/PosDeviceModel';



// API Base URL
const API_URL = `${API_BASE_URL}/devicecode/master`;
const APIS_BASE_URL = `${API_BASE_URL}/devicecode/`;
const BRANCH_API_URL = `${API_BASE_URL}/devicecode/device-location/`;



// // Fetch Branches
export const fetchBranchAliases = createAsyncThunk<Aliases[]>("table/fetchallBranch", async () => {
  const response = await axios.get(BRANCH_API_URL);
  return response.data;
});



/// Device Code Generate & Regenerate

export const generateDeviceCode = createAsyncThunk<
  { deviceCode: string },                     // fulfilled payload
  { id?: string },                  // argument (optional id for edit)
  { rejectValue: string }
>(
  'device/generateCode',
  async ({ id }, { rejectWithValue }) => {
    try {
      const url = id
        ? `${APIS_BASE_URL}generate/${id}`   // edit → PATCH
        : `${APIS_BASE_URL}generate/`;                // add  → POST

      const response = await axios.post(url, {});     // body not needed
      return { deviceCode: response.data.deviceCode };
    } catch (error) {
      const err = error as AxiosError;
      return rejectWithValue(`Failed to fetch assets: ${err.message}`);
    }
  }
);



//Fetch All Devices
export const fetchDevices = createAsyncThunk<
  PaginatedDeviceResponse,                // ✅ return paginated response
  {
    deviceName?: string;
    branchName?: string;
    page?: number;
    limit?: number;
  },
  { rejectValue: string }
>(
  'device/fetch',
  async (
    { deviceName, branchName, page = 1, limit = 15 },
    { rejectWithValue }
  ) => {
    try {
      const response = await axios.get(API_URL, {
        params: {
          ...(deviceName ? { device_name: deviceName } : {}),
          ...(branchName ? { branch_name: branchName } : {}),
          page,
          limit,
        },
      });

      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.detail || 'Failed to fetch devices'
      );
    }
  }
);

//Add New Tax
export const addDevice = createAsyncThunk<Device, Device>("device/add", async (device) => {
  const response = await axios.post(APIS_BASE_URL, device);
  return response.data;
});

//Update the Tax
export const updateDevice = createAsyncThunk<Device, Device>("device/update", async (device) => {
  const response = await axios.patch(`${APIS_BASE_URL}${device.id}`, device);
  return response.data;
})


//Deactivate Tax
export const deactivateDevice = createAsyncThunk<Device, string>("device/deactivate", async (id) => {
  const response = await axios.patch(`${APIS_BASE_URL}${id}`, { status: "deactivated" });
  return response.data;
})

//Activate Tax
export const activateDevice = createAsyncThunk<Device, string>("device/activate", async (id) => {
  const response = await axios.patch(`${APIS_BASE_URL}${id}`, { status: "active" });
  return response.data;
});


//Toggle DC Status
export const toggleDcStatus = createAsyncThunk<Device, string>(
  "device/toggleDcStatus",
  async (id) => {
    const response = await axios.patch(`${APIS_BASE_URL}${id}/dc-status`);
    return response.data;
  }
);



/// Fetch The Previous code to Generate Next code

export const fetchNextTillId = createAsyncThunk(
  'posDevice/fetchNextTillId',
  async (aliasName: string, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${APIS_BASE_URL}next-till-id/${aliasName}`);
      return response.data; // Returns the full tillId like "BM-AR-Till-03"
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch next Till ID');
    }
  }
);



export const checkServerConflict = createAsyncThunk<
  Device | null,
  string,             // aliasName / branchId
  { rejectValue: string }
>(
  'device/checkServerConflict',
  async (branchIdentifier, { rejectWithValue }) => {
    try {
      const response = await axios.get(
        `${APIS_BASE_URL}branch-server/${branchIdentifier}`
      );
      return response.data ?? null;
    } catch (error: any) {
      if (error.response?.status === 404) return null;
      return rejectWithValue('Failed to check branch server');
    }
  }
);




const deviceSlice = createSlice({
  name: 'device',
  initialState,
  reducers: {
    setDeviceData: (state, action: PayloadAction<Device>) => {
      state.deviceData = action.payload;
    },
    setEditIndex: (state, action: PayloadAction<number | null>) => {
      state.editIndex = action.payload;
    },
    setDialogOpen: (state, action: PayloadAction<'none' | 'edit' | 'add'>) => {
      state.dialogOpen = action.payload;
    },
    setSnackbarOpen: (state, action: PayloadAction<boolean>) => {
      state.snackbarOpen = action.payload;
    },
    setSnackbarMessage: (state, action: PayloadAction<string>) => {
      state.snackbarMessage = action.payload;
    },
    setSearchQuery: (state, action: PayloadAction<string>) => {
      state.searchQuery = action.payload;
    },
    setShowDeactivated: (state, action: PayloadAction<boolean>) => {
      state.showDeactivated = action.payload;
    },
    resetDeviceData: (state) => {
      state.deviceData = initialdevice;
    },
    setServerConflict: (
      state,
      action: PayloadAction<{ existingDevice: Device; pendingSubmit: null } | null>
    ) => {
      state.serverConflict = action.payload;
    },
  },


  extraReducers: (builder) => {
    builder

      //////branchname
      .addCase(fetchBranchAliases.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchBranchAliases.fulfilled, (state, action: PayloadAction<Aliases[]>) => {
        state.loading = false;
        state.branches = action.payload;
      })
      .addCase(fetchBranchAliases.rejected, (state, action) => {
        state.loading = false;
        // state.error = action.payload || 'Failed to fetch Branches';
      })


      /////   Device code generation  
      .addCase(generateDeviceCode.pending, (state) => {
        state.loading = false;
      })
      .addCase(generateDeviceCode.fulfilled, (state, action) => {
        state.loading = false;
        state.deviceData.deviceCode = action.payload.deviceCode;
      })
      .addCase(generateDeviceCode.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? 'Failed to generate code';
      })


      // Fetch Devices
      .addCase(fetchDevices.pending, (state) => {
        state.loading = false;
        state.error = null;
      })
      // .addCase(fetchDevices.fulfilled, (state, action) => {
      //   state.loading = false;
      //   state.devices = action.payload.filter(item => item.status === 'active');
      //   state.deactivatedDevices = action.payload.filter(item => item.status === 'deactivated');
      // })


      .addCase(fetchDevices.fulfilled, (state, action) => {
        state.loading = false;

        const { data, total, page, limit, total_pages } = action.payload;

        state.total = total;
        state.page = page;
        state.limit = limit;
        state.totalPages = total_pages;

        state.devices = data.filter(item => item.status === 'active');
        state.deactivatedDevices = data.filter(item => item.status === 'deactivated');
      })
      .addCase(fetchDevices.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message ?? 'Failed to fetch taxs';
      })


      //Add Devices
      .addCase(addDevice.fulfilled, (state, action) => {
        if (action.payload.status === "active") {
          state.devices.push(action.payload);
        } else {
          state.deactivatedDevices.push(action.payload);
          state.snackbarMessage = "Device Created successfully";
          state.snackbarOpen = true;
        }
      })


      //Update Devices
      .addCase(updateDevice.fulfilled, (state, action) => {
        const index = state.devices.findIndex((p) => p.id === action.payload.id);
        if (index !== -1) {
          state.devices[index] = action.payload;
        }
        state.snackbarMessage = "Device updated successfully";
        state.snackbarOpen = true;
      })

      //Deactivate Devices
      .addCase(deactivateDevice.fulfilled, (state, action) => {
        const index = state.devices.findIndex((p) => p.id === action.payload.id);
        if (index != -1) {
          const [deactivatedDevice] = state.devices.splice(index, 1);
          state.deactivatedDevices.push(deactivatedDevice);
        }
        state.snackbarMessage = "Device deactivated successfully";
        state.snackbarOpen = true;
      })

      //Activate Devices
      .addCase(activateDevice.fulfilled, (state, action) => {
        const index = state.devices.findIndex((p) => p.id === action.payload.id);
        if (index != -1) {
          const [activatedDevice] = state.devices.splice(index, 1);
          state.devices.push(activatedDevice);
        }
        state.snackbarMessage = "Device activated successfully";
        state.snackbarOpen = true;
      })


      //// Fetch the Previous Till ID
      .addCase(fetchNextTillId.fulfilled, (state, action) => {
        state.deviceData.tillId = action.payload;
      })
      .addCase(fetchNextTillId.rejected, (state, action) => {
        state.error = action.payload as string;
      })


      //Toggle DC Status
      .addCase(toggleDcStatus.fulfilled, (state, action) => {
        const updateInList = (list: Device[]) => {
          const index = list.findIndex((d) => d.id === action.payload.id);
          if (index !== -1) {
            list[index] = action.payload;
          }
        };
        updateInList(state.devices);
        updateInList(state.deactivatedDevices);

        state.snackbarMessage = "Device DC status updated successfully";
        state.snackbarOpen = true;
      })
      .addCase(toggleDcStatus.rejected, (state, action) => {
        state.snackbarMessage = action.error.message ?? "Failed to update DC status";
        state.snackbarOpen = true;
      });


  },
});

export const {
  setDeviceData,
  setEditIndex,
  setDialogOpen,
  setSnackbarOpen,
  setSnackbarMessage,
  setSearchQuery,
  setShowDeactivated,
  resetDeviceData,
  setServerConflict,
} = deviceSlice.actions;




export const selectDevice = (state: RootState) => state.posDevice;

export default deviceSlice.reducer;