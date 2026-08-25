import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import axios from "axios";
import { RootState } from "@/redux/store";
import { RawMaterial, SFGMaterial, EditRecipeItem, initialState } from "../models/editmodel";


  type ToggleableItem = SFGMaterial | RawMaterial;

const MATERIALS_BASE_URL = " http://127.0.0.1:8000/purchasetestapi/storekitchenmaster/materials";
const SUMMA_URL = " http://127.0.0.1:8000/purchasetestapi/"

// Thunks
export const fetchSFGMaterials = createAsyncThunk<
  SFGMaterial[],
  string
>("editRecipe/fetchSFG", async (search) => {
  const res = await axios.get<SFGMaterial[]>(
    `${MATERIALS_BASE_URL}/sfg`,
    { params: { search } }
  );
  return res.data;
});

export const fetchRawMaterials = createAsyncThunk<
  RawMaterial[],
  string
>("editRecipe/fetchRaw", async (search) => {
  const res = await axios.get<RawMaterial[]>(
    `${MATERIALS_BASE_URL}/raw`,
    { params: { search } }
  );
  return res.data;
});

export const fetchRecipeById = createAsyncThunk<
  {
    recipeId: string;
    recipeName: string;
    version: number;
    cost: string;
    items: EditRecipeItem[];
    status: boolean;
  },
  { recipeId: string; version: number }
>(
  "editRecipe/fetchById",
  async ({ recipeId, version }, { rejectWithValue }) => {
    try {
      const res = await axios.get(
        `${SUMMA_URL}allrecipes/${recipeId}/version/${version}`
      );



      interface RecipeApiItem {
        type: "SFG" | "RM";
        code: string;
        name: string;
        uom: string;
        quantity: number;
      }

      interface RecipeApiResponse {
        recipeName: string;
        version: number;
        cost: number;
        status: boolean;
        items: RecipeApiItem[];
      }

      // inside the thunk:
      const data = res.data as RecipeApiResponse;

      const transformedItems: EditRecipeItem[] = data.items.map((item: RecipeApiItem) => ({
        id: `${item.type}-${item.code}`,
        name: item.name,
        code: item.code,
        uom: item.uom,
        type: item.type,
        quantity: item.quantity.toString(),
        placeholder: "Enter quantity",
        status: "assigned",
        isExisting: true,
      }));

      return {
        recipeId,
        recipeName: data.recipeName,
        version: data.version,
        cost: data.cost.toString(),
        items: transformedItems,
        status: data.status,
      };
   } catch (err: unknown) {
  if (axios.isAxiosError(err)) {
    return rejectWithValue(err.response?.data?.message ?? "Failed to load recipe version");
  }
  return rejectWithValue("Failed to load recipe version");
}
  }
);


export const updateRecipe = createAsyncThunk<
  void,
  {
    recipeId: string;
    version: number;
    cost: string;
    items: EditRecipeItem[];
  }
>("editRecipe/update", async ({ recipeId, version, cost, items }, { rejectWithValue }) => {
  try {
    const assignedItems = items.filter(i => i.status === "assigned");

    const payload = {
      cost: Number(cost),
      items: assignedItems.map(item => ({
        id: item.id,
        name: item.name,
        code: item.code,
        uom: item.uom,
        type: item.type,
        quantity: Number(item.quantity),
      })),
    };

    await axios.put(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}allrecipes/editrecipe/${recipeId}/version/${version}`,
      payload
    );
 } catch (err: unknown) {
  if (axios.isAxiosError(err)) {
    return rejectWithValue(err.response?.data?.message ?? "Failed to update recipe version");
  }
  return rejectWithValue("Failed to update recipe version");
}
});

// for version status change funtion
export const toggleRecipeVersionStatus = createAsyncThunk<
  { status: boolean },
  { recipeId: string; version: number }
>(
  "editRecipe/toggleStatus",
  async ({ recipeId, version }, { rejectWithValue }) => {
    try {
      const res = await axios.patch(
        `${SUMMA_URL}allrecipes/${recipeId}/version/${version}/toggle-status`
      );
      return res.data; // { message, status }
   } catch (err: unknown) {
  if (axios.isAxiosError(err)) {
    return rejectWithValue(err.response?.data?.message ?? "Failed to toggle recipe status");
  }
  return rejectWithValue("Failed to toggle recipe status");
}
  }
);
// for snack bar to close 
export const showSnackbarWithTimeout = createAsyncThunk<
  void,
  { message: string; duration?: number }
>("editRecipe/showSnackbarWithTimeout", async ({ message, duration = 3000 }, { dispatch }) => {
  dispatch(setSnackbar({ open: true, message }));

  setTimeout(() => {
    dispatch(clearSnackbar());
  }, duration);
});


const editRecipeSlice = createSlice({
  name: "editRecipe",
  initialState,
  reducers: {
    setRecipeName: (state, action: PayloadAction<string>) => {
      state.recipeName = action.payload;
    },
    setCost: (state, action: PayloadAction<string>) => {
      state.cost = action.payload;
    },
    setRecipeItems: (state, action: PayloadAction<EditRecipeItem[]>) => {
      state.recipeItems = action.payload;
    },
 
toggleItemSelection: (
  state,
  action: PayloadAction<{ item: ToggleableItem; type: 'SFG' | 'RM' }>
) => {
  const { item, type } = action.payload;

  const id = type === 'SFG'
    ? `SFG-${(item as SFGMaterial).sfgCode}`
    : `RM-${(item as RawMaterial).itemCode || (item as RawMaterial).purchaseitemId || (item as RawMaterial).itemName}`;

  const name = type === 'SFG' ? (item as SFGMaterial).sfgName : (item as RawMaterial).itemName;
  const code = type === 'SFG' ? (item as SFGMaterial).sfgCode : ((item as RawMaterial).itemCode || "No code");
  const uom = item.uom;

      const existingItem = state.recipeItems.find(recipeItem => recipeItem.id === id);

      if (existingItem) {
        state.recipeItems = state.recipeItems.filter(item => item.id !== id);
      } else {
        const placeholder = type === 'SFG' ? 'Enter quantity' : 'Enter quantity';
        const newItem: EditRecipeItem = {
          id,
          name,
          code,
          uom,
          type,
          quantity: "",
          placeholder,
          status: 'selected'
        };
        state.recipeItems.push(newItem);
      }
    },
    updateItemQuantity: (state, action: PayloadAction<{ id: string; quantity: string }>) => {
      const { id, quantity } = action.payload;
      const item = state.recipeItems.find(item => item.id === id);
      if (item) {
        item.quantity = quantity;
      }
    },
    handleAddToRecipe: (state) => {
      // Move selected items to assigned
      state.recipeItems = state.recipeItems.map(item =>
        item.status === 'selected' ? { ...item, status: 'assigned' } : item
      );
    },
    handleRemoveFromRecipe: (state, action: PayloadAction<string | undefined>) => {
      if (action.payload) {
        state.recipeItems = state.recipeItems.filter(item => item.id !== action.payload);
      } else {
        state.recipeItems = [];
      }
    },
    handleEditItem: (state, action: PayloadAction<string>) => {
      const id = action.payload;
      state.recipeItems = state.recipeItems.map(item =>
        item.id === id ? { ...item, status: 'selected' } : item
      );
    },
    setSnackbar: (state, action: PayloadAction<{ open: boolean; message: string }>) => {
      state.snackbar = action.payload;
    },
    clearSnackbar: (state) => {
      state.snackbar = { open: false, message: "" };
    },
    clearSearchResults: (state) => {
      state.sfgList = [];
      state.rawList = [];
    },
    clearAll: (state) => {
      state.recipeItems = [];
      state.sfgList = [];
      state.rawList = [];
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchSFGMaterials.pending, (state) => {
        state.loading = true;
      })
      .addCase(
        fetchSFGMaterials.fulfilled,
        (state, action: PayloadAction<SFGMaterial[]>) => {
          state.sfgList = action.payload;
          state.loading = false;
        }
      )
      .addCase(fetchSFGMaterials.rejected, (state) => {
        state.loading = false;
        state.sfgList = [];
      })
      .addCase(fetchRawMaterials.pending, (state) => {
        state.loading = true;
      })
      .addCase(
        fetchRawMaterials.fulfilled,
        (state, action: PayloadAction<RawMaterial[]>) => {
          state.rawList = action.payload;
          state.loading = false;
        }
      )
      .addCase(fetchRawMaterials.rejected, (state) => {
        state.loading = false;
        state.rawList = [];
      })
      .addCase(fetchRecipeById.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchRecipeById.fulfilled, (state, action) => {
        state.recipeId = action.payload.recipeId;
        state.version = action.payload.version;
        state.recipeName = action.payload.recipeName;
        state.cost = action.payload.cost;
        state.recipeItems = action.payload.items;
        state.recipeStatus = action.payload.status;
        state.loading = false;
      })
      .addCase(fetchRecipeById.rejected, (state, action) => {
        state.loading = false;
        state.snackbar = { open: true, message: "Failed to load recipe" };
        console.error("fetchRecipeById failed:", action.payload);
      })
      .addCase(updateRecipe.pending, (state) => {
        state.loading = true;
      })
      .addCase(updateRecipe.fulfilled, (state) => {
        state.loading = false;
        //state.snackbar = { open: true, message: "Recipe updated successfully" };
      })
      .addCase(updateRecipe.rejected, (state) => {
        state.loading = false;
        // state.snackbar = { open: true, message: "Failed to update recipe" };
      })
      // for version status change 
      .addCase(toggleRecipeVersionStatus.pending, (state) => {
        state.loading = true;
      })
      .addCase(toggleRecipeVersionStatus.fulfilled, (state, action) => {
        state.loading = false;
        state.recipeStatus = action.payload.status;
      })
      .addCase(toggleRecipeVersionStatus.rejected, (state) => {
        state.loading = false;
        state.snackbar = {
          open: true,
          message: "Failed to update status"
        };
      })


  },
});

export const {
  setRecipeName,
  setCost,
  setRecipeItems,
  toggleItemSelection,
  updateItemQuantity,
  handleAddToRecipe,
  handleRemoveFromRecipe,
  handleEditItem,
  setSnackbar,
  clearSnackbar,
  clearSearchResults,
  clearAll,
} = editRecipeSlice.actions;

export const selectEditRecipe = (state: RootState) => state.editRecipe;
export default editRecipeSlice.reducer;