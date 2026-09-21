

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import axios, { AxiosError } from 'axios';
import { RootState } from '../../../../../redux/store';

import { TableData, TableState, initialState, initialCurrentTable, Branch } from '../Models/tableModels';
import { API_BASE_URL } from '../../../../../../API_URL';

// API Base URL

const TABLE_API_URL = `${API_BASE_URL}/tables/`;
const BRANCH_API_URL = `${API_BASE_URL}/locations/table-location/`;

// ✅ Fetch all Tables - WITH POSITION SUPPORT
export const fetchTableData = createAsyncThunk<TableData[]>(
  'table/fetchTableData',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get(TABLE_API_URL);
      const data = response.data.map((item: any) => ({
        _id: item._id,
        totalTableCount: item.totalTableCount,
        totalTable: item.totalTable.map((area: any) => ({
          areaName: area.areaName || '',
          tables: (area.tables || []).map((table: any) => ({
            tableNumber: table.tableNumber || null,
            seats: table.seats || 4,
            tableName: table.tableName || null,
            position: table.position || null, // ✅ PRESERVE POSITION
          })),
          tableCount: area.tableCount || 0,
        })),
        type: item.type || 'unknown',
        location: item.location || 'unknown',
        customTableName: item.customTableName || null,
        status: item.status || 'active',
      }));
      return data;
    } catch (error: unknown) {
      const err = error as AxiosError;
      return rejectWithValue(err.response?.data || 'Error Fetching Table data');
    }
  }
);


// // Fetch Branches
export const fetchallBranch = createAsyncThunk<Branch[]>("table/fetchallBranch", async () => {
  const response = await axios.get(BRANCH_API_URL);
  return response.data;
});



// ✅ Add a new Table - WITH POSITION SUPPORT
export const postTableData = createAsyncThunk<TableState, TableState['currentTable']>(
  'table/postTableData',
  async (tableData, { rejectWithValue }) => {
    let globalTableNumber = 1;

    const totalTable = tableData.areas.map((area) => {
      if (tableData.type === 'manual') {
        const tables = Array.from({ length: area.count }, () => ({
          tableNumber: `${tableData.customTableName} ${globalTableNumber++}`,
          seats: 4,
          position: null, // ✅ NEW TABLES HAVE NO POSITION
        }));

        return {
          areaName: area.name,
          tableCount: area.count,
          tables,
          customTableName: tableData.customTableName,
        };
      } else {
        const tables = Array.from({ length: area.count }, () => ({
          tableNumber: `Table ${globalTableNumber++}`,
          seats: 4,
          position: null, // ✅ NEW TABLES HAVE NO POSITION
        }));

        return {
          areaName: area.name,
          tableCount: area.count,
          tables,
        };
      }
    });

    const data = {
      totalTableCount: tableData.tableCount,
      totalTable,
      type: tableData.type,
      location: tableData.locationName,
      ...(tableData.type === 'manual' && { customTableName: tableData.customTableName }),
      status: 'active',
    };

    try {
      const response = await axios.post(TABLE_API_URL, data);
      return response.data;
    } catch (error: unknown) {
      const err = error as AxiosError;
      return rejectWithValue(err.response?.data || 'Error Posting Table data');
    }
  }
);

// ✅ Update an existing Table - PRESERVES POSITIONS
export const patchTableData = createAsyncThunk<any, any>(
  'table/patchTableData',
  async (updatedTable, { rejectWithValue }) => {
    try {
      const { _id, areas, type, tableData, customTableName, ...data } = updatedTable;

      let globalTableIndex = 1;

      const transformedData = {
        ...data,
        ...(type === 'manual' && { customTableName }),
        totalTable: areas.map((area: any) => {
          const targetTableCount = area.tableCount || 0;
          const existingTables = area.tables?.slice(0, targetTableCount) || [];
          const currentTableCount = existingTables.length;

          // ✅ Update existing tables - PRESERVE POSITIONS
          const updatedTables = existingTables.map((table: any) => {
            const tableName =
              type === 'predefined'
                ? `Table ${globalTableIndex}`
                : `${customTableName || tableData?.customTableName} ${globalTableIndex}`;
            const newTable = {
              seats: table.seats || 4,
              tableNumber: tableName,
              position: table.position || null, // ✅ PRESERVE POSITION
            };
            globalTableIndex++;
            return newTable;
          });

          // ✅ Generate new tables if tableCount increased
          const additionalTables = [];
          if (currentTableCount < targetTableCount) {
            for (let i = 0; i < targetTableCount - currentTableCount; i++) {
              const newTableName =
                type === 'predefined'
                  ? `Table ${globalTableIndex}`
                  : `${customTableName || area.areaName} ${globalTableIndex}`;
              additionalTables.push({
                seats: 4,
                tableNumber: newTableName,
                position: null, // ✅ NEW TABLES HAVE NO POSITION
              });
              globalTableIndex++;
            }
          }

          const allTables = [...updatedTables, ...additionalTables];

          return {
            areaName: area.areaName || '',
            tableCount: targetTableCount,
            tables: allTables,
          };
        }),
      };

      const response = await axios.patch(`${TABLE_API_URL}${_id}`, transformedData);
      return response.data;
    } catch (error: unknown) {
      const err = error as AxiosError;
      return rejectWithValue(err.response?.data || 'Error Updating Table Data');
    }
  }
);

// ✅ NEW: Update Layout Positions - SEPARATE ENDPOINT
export const updateLayoutPositions = createAsyncThunk<any, any>(
  'table/updateLayoutPositions',
  async ({ branchId, areaName, tables }, { rejectWithValue }) => {
    try {
      const response = await axios.patch(`${TABLE_API_URL}layout/${branchId}`, {
        areaName,
        tables: tables.map((table: any) => ({
          tableNumber: table.tableNumber,
          seats: table.seats,
          position: table.position, // ✅ SEND ONLY POSITIONS
        })),
      });
      return response.data;
    } catch (error: unknown) {
      const err = error as AxiosError;
      return rejectWithValue(err.response?.data || 'Error Updating Layout');
    }
  }
);

// Update Table Seats
export const updateSeats = createAsyncThunk<TableData, TableData>(
  "TableData/updateSeats",
  async (TableData) => {
    const response = await axios.patch(`${TABLE_API_URL}table/${TableData._id}`, TableData);
    return response.data;
  }
);

// Activate Table
export const activateTable = createAsyncThunk<Branch, string>(
  "Branch/activateTable",
  async (branchId) => {
    const response = await axios.patch(`${TABLE_API_URL}${branchId}`, { status: "active" });
    return response.data;
  }
);

// Deactivate Table
export const deactivateTable = createAsyncThunk<Branch, string>(
  "Branch/deactivateTable",
  async (branchId) => {
    const response = await axios.patch(`${TABLE_API_URL}${branchId}`, { status: "deactivated" });
    return response.data;
  }
);

const tableSlice = createSlice({
  name: 'table',
  initialState,
  reducers: {
    addTable(state, action: PayloadAction<TableData[]>) {
      state.tables.push(...action.payload);
    },
    setCurrentTableField(state, action: PayloadAction<{ field: string; value: any }>) {
      state.currentTable = {
        ...state.currentTable,
        [action.payload.field]: action.payload.value,
      };
    },
    addArea(state, action: PayloadAction<{ name: string; count: number }>) {
      state.currentTable.areas.push(action.payload);
    },
    resetCurrentTable(state) {
      state.currentTable = initialCurrentTable;
    },
    updateTableSeat(
      state,
      action: PayloadAction<{ _id: string; seats: number; seatDetails: string[] }>
    ) {
      const table = state.tables.find((table) => table._id === action.payload._id);
      if (table) {
        table.seats = action.payload.seats;
        table.seatDetails = action.payload.seatDetails;
      }
    },
    setSelectedTableField(
      state,
      action: PayloadAction<{ id: string; field: keyof TableData; value: any }>
    ) {
      const table = state.tables.find((table) => table._id === action.payload.id);
      if (table) {
        (table[action.payload.field] as any) = action.payload.value;
      }
    },
    setDialogOpen(state, action: PayloadAction<'none' | 'edit' | 'add'>) {
      state.dialogOpen = action.payload;
    },
    setSnackbarOpen(state, action: PayloadAction<boolean>) {
      state.snackbarOpen = action.payload;
    },
    setSnackbarMessage(state, action: PayloadAction<string>) {
      state.snackbarMessage = action.payload;
    },
    setShowDeactivated(state, action: PayloadAction<boolean>) {
      state.showDeactivated = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Tables
      .addCase(fetchTableData.pending, (state) => {
        state.loading = false;
        state.error = null;
      })
      .addCase(fetchTableData.fulfilled, (state, action) => {
        state.loading = false;
        state.tables = action.payload.filter((item) => item.status === 'active');
        state.deactivatedTables = action.payload.filter((item) => item.status === 'deactivated');
      })
      .addCase(fetchTableData.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message ?? 'Failed to fetch tables';
      })

      // Fetch Branch Names
      .addCase(fetchallBranch.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchallBranch.fulfilled, (state, action) => {
        state.loading = false;
        state.allBranch = action.payload;
      })
      .addCase(fetchallBranch.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message ?? 'Failed to fetch branch names';
      })

      // Add Table
      .addCase(postTableData.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(postTableData.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload.status === 'active') {
          state.tables.push(action.payload);
        } else {
          state.deactivatedTables.push(action.payload);
        }
        state.snackbarMessage = 'Table added successfully';
        state.snackbarOpen = true;
        state.dialogOpen = 'none';
      })
      .addCase(postTableData.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message ?? 'Failed to add table';
        state.snackbarMessage = 'Failed to add table';
        state.snackbarOpen = true;
      })

      // Update Table
      .addCase(patchTableData.pending, (state) => {
        state.loading = false;
        state.error = null;
      })
      .addCase(patchTableData.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.tables.findIndex((table) => table._id === action.payload._id);
        if (index !== -1) {
          state.tables[index] = action.payload;
        }
        state.snackbarMessage = 'Table updated successfully';
        state.snackbarOpen = true;
        state.dialogOpen = 'none';
      })
      .addCase(patchTableData.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message ?? 'Failed to update table';
        state.snackbarMessage = 'Failed to update table';
        state.snackbarOpen = true;
      })

      // ✅ NEW: Update Layout Positions
      .addCase(updateLayoutPositions.pending, (state) => {
        state.loading = false;
        state.error = null;
      })
      .addCase(updateLayoutPositions.fulfilled, (state, action) => {
        state.loading = false;
        state.snackbarMessage = 'Layout updated successfully';
        state.snackbarOpen = true;
      })
      .addCase(updateLayoutPositions.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message ?? 'Failed to update layout';
        state.snackbarMessage = 'Failed to update layout';
        state.snackbarOpen = true;
      })

      // Update Seats
      .addCase(updateSeats.pending, (state) => {
        state.loading = false;
        state.error = null;
      })
      .addCase(updateSeats.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.tables.findIndex((table) => table._id === action.payload._id);
        if (index !== -1) {
          state.tables[index] = action.payload;
        }
        state.snackbarMessage = 'Seats updated successfully';
        state.snackbarOpen = true;
      })
      .addCase(updateSeats.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message ?? 'Failed to update seats';
        state.snackbarMessage = 'Failed to update seats';
        state.snackbarOpen = true;
      })

      // Activate Table
      .addCase(activateTable.fulfilled, (state, action) => {
        const index = state.allBranch.findIndex((p) => p.branchName === action.payload.branchName);
        if (index != -1) {
          const [activatedTable] = state.allBranch.splice(index, 1);
          state.allBranch.push(activatedTable);
        }
      })

      // Deactivate Table
      .addCase(deactivateTable.fulfilled, (state, action) => {
        const index = state.allBranch.findIndex((p) => p.branchName === action.payload.branchName);
        if (index != -1) {
          const [deactivatedTables] = state.allBranch.splice(index, 1);
          state.deactivatedBranch.push(deactivatedTables);
        }
      });
  },
});

export const {
  addTable,
  setCurrentTableField,
  addArea,
  resetCurrentTable,
  updateTableSeat,
  setSelectedTableField,
  setDialogOpen,
  setSnackbarOpen,
  setSnackbarMessage,
  setShowDeactivated,
} = tableSlice.actions;

export const selectTable = (state: RootState) => state.table;

export default tableSlice.reducer;