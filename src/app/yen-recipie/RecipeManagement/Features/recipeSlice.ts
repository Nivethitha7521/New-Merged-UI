

import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import axios from "axios";
import { AxiosError } from "axios";
import { RootState } from "../../../../redux/store";
import { Recipe, Consumable, DateTime, BranchwiseItems, POItems, initialState, initialRecipe, FetchRecipeResponse, FetchRecipeArgs, VarianceResponse, FetchRecipe, KitUsingSubkit, RecipeVersionDoc, } from "../Models/recipeModels";


const RECIPE_API_URL = "http://127.0.0.1:8000/purchasetestapi/recipe/";
const VARIANCE_API_URL = "http://127.0.0.1:8000/purchasetestapi/recipe/recipe-variance";
const PURCHASE_ITEM = "http://127.0.0.1:8000/purchasetestapi/recipe/PO/limited";
const CONSUMABLES_API_URL = "http://127.0.0.1:8000/purchasetestapi/consumable/";
const EXPORT_URL = "http://127.0.0.1:8000/purchasetestapi/recipe/export-csv";
const IMPORT_URL = "http://127.0.0.1:8000/purchasetestapi/recipe/import";
const PDF_EXPORT_URL = "http://127.0.0.1:8000/purchasetestapi/recipe/export-pdf";
const DATETIME_URL = "https://yenerp.com/liveapi/datetime";
const PDF_EXPORT_ALL_URL = "http://127.0.0.1:8000/purchasetestapi/recipe/export-all-pdf"

const VARIANCE_NOTIFICATION_URL = "http://127.0.0.1:8000/purchasetestapi/variance";
const SCHEDULER_API_URL = "http://127.0.0.1:8000/purchasetestapi/scheduler";


// Fetch All Consumables
export const fetchConsumables = createAsyncThunk<Consumable[]>(
  "Consumable/fetchAll",
  async () => {
    const response = await axios.get(CONSUMABLES_API_URL);
    return response.data;
  }
);


export const deleteConsumable = createAsyncThunk<Consumable, string>("Consumable/delete", async (name) => {
  const response = await axios.delete(`${CONSUMABLES_API_URL}${name}`);
  return response.data;
});




export const fetchRecipeItem = createAsyncThunk<
  FetchRecipe,
  FetchRecipeArgs | undefined
>(
  "RecipeItem/fetchAll",
  async (args) => {
    const { search = "", page = 1, limit = 20 } = args || {};

    const params = new URLSearchParams();
    if (search) params.append("search", search);
    params.append("page", String(page));
    params.append("limit", String(limit));

    const url = `${RECIPE_API_URL}?${params.toString()}`;
    const response = await axios.get(url);

    return {
      results: response.data.results || [],
      totalPages: response.data.totalPages || 1,
      currentPage: response.data.currentPage || page,
      totalRecipes: response.data.totalRecipes || 0,
      allItemNames: [],  // no longer returned by this endpoint
    };
  }
);


export const fetchRecipe = createAsyncThunk<
  FetchRecipeResponse,
  FetchRecipeArgs | undefined
>(
  "Recipe/fetchAll",
  async (args) => {
    const { search = "", page = 1, limit = 20 } = args || {};

    const params = new URLSearchParams();
    if (search) params.append("search", search);
    params.append("page", String(page));
    params.append("limit", String(limit));

    const url = `${RECIPE_API_URL}?${params.toString()}`;
    const response = await axios.get(url);

    console.log("API Response:", response.data);

    // Backend now returns: { results, currentPage, totalPages, totalRecipes, limit }
    return {
      results: response.data.results || [],
      totalPages: response.data.totalPages || 1,
      currentPage: response.data.currentPage || page,
      totalRecipes: response.data.totalRecipes || 0,
      allItemNames: response.data.allItemNames || [],
    };
  }
);


// ✅ NEW: Lightweight thunk — fetches ONLY allItemNames
export const fetchAllRecipeItemNames = createAsyncThunk<
  string[],  // Returns string[] of item names
  void,      // No args needed
  { state: RootState }
>(
  "Recipe/fetchAllItemNames",
  async (_, { rejectWithValue }) => {
    try {
      // Call the new lightweight endpoint
      const response = await axios.get(`${RECIPE_API_URL}item-names`);

      console.log("✅ Item Names Loaded:", response.data.allItemNames?.length ?? 0);

      return response.data.allItemNames || [];
    }
    catch (error: unknown) {
      const err = error as AxiosError;
      return rejectWithValue(err.response?.data || 'Failed to fetch item names');
    }
  }
);



// Fetch Recipe by ID
export const fetchRecipeById = createAsyncThunk<Recipe, string>(
  "Recipe/fetchById",
  async (recipeId) => {
    const response = await axios.get(
      `http://127.0.0.1:8000/purchasetestapi/recipe/${recipeId}`
    );
    console.log("Fetched recipe by ID: ", response.data);
    return response.data;
  }
);


/// SFG Item Fetch
export const fetchSFG = createAsyncThunk<Recipe[]>("Recipes/fetchSFG", async () => {
  const response = await axios.get(`${RECIPE_API_URL}by-type?item_type=SUBKIT`);
  return response.data;
});



// Fetch The Data And Time
export const fetchDateTime = createAsyncThunk<DateTime[]>("DateTime/fetch", async () => {
  const response = await axios.get(DATETIME_URL);
  return response.data;
});



// Add New Recipe
export const addRecipe = createAsyncThunk<Recipe, Recipe>("Recipe/add", async (recipe) => {
  const response = await axios.post(RECIPE_API_URL, recipe);
  return response.data;
});

// Update Recipe
// export const updateRecipe = createAsyncThunk<
//   { message: string },
//   { recipeId: string; recipe: Recipe }
// >("Recipe/update", async ({ recipeId, recipe }) => {
//   const response = await axios.patch(`${RECIPE_API_URL}${recipeId}`, recipe);
//   console.log("update: ", response);
//   return response.data;
// });


export const updateRecipe = createAsyncThunk<
  { message: string },
  { recipeId: string; recipe: Recipe; snapshotType?: string; createVersion?: boolean }
>("Recipe/update", async ({ recipeId, recipe, snapshotType = 'manual', createVersion = false }) => {
  const response = await axios.patch(`${RECIPE_API_URL}${recipeId}`, {
    ...recipe,
    snapshotType,
    createVersion,
  });
//  console.log("update: ", response);
  return response.data;
});







// // Export Recipe as CSV
// Accept an object with both recipeId and itemName

export const ExportRecipe = createAsyncThunk<void, { recipeId: string; itemName: string }, { rejectValue: string }>(
  "Recipe/export",
  async ({ recipeId, itemName }, { rejectWithValue }) => {
    try {
      // Make the API call to the backend export endpoint
      const response = await axios.get(`${EXPORT_URL}/${recipeId}`,
        { responseType: 'blob' });

      // Create a Blob with the correct MIME type for Excel
      const blob = new Blob([response.data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });

      // Create a URL for the Blob and trigger the download
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      // Sanitize itemName to avoid invalid characters in the filename
      const sanitizedItemName = itemName.replace(/[^a-zA-Z0-9-_]/g, '_');
      a.download = `${sanitizedItemName}.xlsx`; // Use itemName with .xlsx extension
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error exporting recipe:', err);
      return rejectWithValue('Failed to export recipe');
    }
  }
);






export const ImportRecipe = createAsyncThunk<
  string,
  File,
  { rejectValue: string }
>("Recipe/import", async (file, { rejectWithValue }) => {
  try {
    if (!file.name.endsWith(".csv")) {
      return rejectWithValue("File must be a CSV");
    }

    const formData = new FormData();
    formData.append("file", file);

    const response = await axios.post(IMPORT_URL, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    return response.data; // Expecting recipeId as a string
  } catch (error: unknown) {
    const err = error as AxiosError<{ detail?: string }>;
    return rejectWithValue(err.response?.data?.detail || "Failed to import recipe");
  }
});




// Export Recipe as PDF
export const ExportRecipePDF = createAsyncThunk<
  void,
  { recipeId: string; itemName: string; recipePrint: boolean; costingPrint: boolean },
  { rejectValue: string }
>(
  "Recipe/exportPDF",
  async ({ recipeId, itemName, recipePrint, costingPrint }, { rejectWithValue }) => {
    try {
      const params = new URLSearchParams();
      params.append("recipe_print", String(recipePrint));
      params.append("costing_print", String(costingPrint));

      const response = await axios.get(
        `${PDF_EXPORT_URL}?recipeId=${recipeId}&${params.toString()}`,
        { responseType: "blob" }
      );
      const blob = new Blob([response.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const tag = recipePrint && costingPrint ? "full" : recipePrint ? "recipe" : "costing";
      const sanitizedName = itemName.replace(/[^a-zA-Z0-9-_]/g, "_");
      a.download = `${sanitizedName}_${tag}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Error exporting recipe PDF:", err);
      return rejectWithValue("Failed to export recipe PDF");
    }
  }
);





// Add this thunk after ExportRecipePDF
export const ExportAllRecipesPDF = createAsyncThunk<
  void,
  { recipePrint: boolean; costingPrint: boolean },
  { rejectValue: string }
>(
  "Recipe/exportAllPDF",
  async ({ recipePrint, costingPrint }, { rejectWithValue }) => {
    try {
      const params = new URLSearchParams();
      params.append("recipe_print", String(recipePrint));
      params.append("costing_print", String(costingPrint));

      const response = await axios.get(
        `${PDF_EXPORT_ALL_URL}?${params.toString()}`,
        { responseType: "blob" }
      );

      const blob = new Blob([response.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const tag = recipePrint && costingPrint ? "full" : recipePrint ? "recipe" : "costing";
      a.download = `all_recipes_${tag}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Error exporting all recipes PDF:", err);
      return rejectWithValue("Failed to export all recipes PDF");
    }
  }
);



export const Exportheader = createAsyncThunk<void, void>(
  "ExportRecipeheader/fetch",
  async (_, { dispatch }) => {
    try {
      const response = await axios.get('http://127.0.0.1:8000/purchasetestapi/recipe/export-csv-template', {
        responseType: "blob",
      });

      const fileName = `Recipe_Header_Export.csv`;
      const fileType = "text/csv;charset=utf-8;";

      const blob = new Blob([response.data], { type: fileType });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");

      link.href = url;
      link.setAttribute("download", fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();

      window.URL.revokeObjectURL(url);

      dispatch(setSnackbarOpen(true));
      dispatch(setSnackbarMessage("Recipe Header exported successfully"));
    } catch (error: unknown) {
      const err = error as AxiosError;
      dispatch(setSnackbarOpen(true));
      dispatch(setSnackbarMessage("Failed to export Recipe Header"));
      throw err;
    }
  }
);


// Add New Consumable
export const addConsumable = createAsyncThunk<Consumable, string>("Consumable/post", async (name: string) => {
  const response = await axios.post(CONSUMABLES_API_URL, { name });
  return response.data;
});



// Fetch All Items
interface FetchItemsArgs {
  page?: number;
  limit?: number;
  search?: string;
}

interface FetchItemsResponse {
  results: BranchwiseItems[];
  totalPages: number;
  currentPage: number;
}

export const fetchItems = createAsyncThunk<FetchItemsResponse, FetchItemsArgs>(
  "BranchwiseItemVariance/fetchAll",
  async ({ page = 1, limit = 50, search = "" }) => {
    const url = `${VARIANCE_API_URL}?page=${page}&limit=${limit}&search=${search}`;
    const response = await axios.get(url);
    const { results, pages, page: currentPage } = response.data;

    if (Array.isArray(results)) {
      return {
        results: results.map((item: BranchwiseItems) => ({
          varianceName: item.varianceName,
          subCategory: item.subCategory,
          category: item.category,
          variance_Defaultprice: item.variance_Defaultprice || 0,
          variance_Uom: item.variance_Uom,
          tax: item.tax,
        })),
        totalPages: pages,
        currentPage,
      };
    } else {
      return {
        results: [],
        totalPages: 0,
        currentPage: 1,
      };
    }
  }
);



// Fetch All PO Items
interface FetchIngrediantResponse {
  searchQuery: string;
  result: POItems[];
  totalPages: number;
  currentPage: number;
}

interface FetchPOArgs {
  page?: number;
  limit?: number;
  search?: string;
}

export const fetchPO = createAsyncThunk<FetchIngrediantResponse, FetchPOArgs>(
  "POItems/fetchAll",
  async ({ page = 1, limit = 50, search = "" }) => {
    const url = search

      ? `${PURCHASE_ITEM}?search=${encodeURIComponent(search)}&page=${page}&limit=${limit}&similarity_threshold=0`
      : `${PURCHASE_ITEM}?page=${page}&limit=${limit}`;

    const response = await axios.get(url);
    const { items, totalItems } = response.data;
    console.log("HELLO PO: ", response.data);

    if (Array.isArray(items)) {
      return {
        result: items.map((item: POItems) => ({
          purchaseitemId: item.purchaseitemId || "",
          itemName: item.itemName || "",
          uom: item.uom || "",
          purchasePrice: item.purchasePrice || 0,
          purchasetaxName: item.purchasetaxName || 0,
        })),
        totalPages: Math.ceil(totalItems / limit),
        currentPage: page,
        searchQuery: search,
      };
    } else {
      return {
        result: [],
        totalPages: 0,
        currentPage: 1,
        searchQuery: search,
      };
    }
  }
);




// Export CSV
export const ExportCSV = createAsyncThunk<void, void>(
  "Exportall/fetch",
  async (_, { dispatch }) => {
    try {
      // get date & time
      const { data: dateTime } = await axios.get(
        "https://yenerp.com/liveapi/datetime"
      );

      const date = dateTime.current_date; // 23-01-2026
      const time = dateTime.current_time.replace(/[: ]/g, "-"); // 10-48-AM

      const fileName = `Recipe_Export_${date}_${time}.csv`;

      const response = await axios.get(`${RECIPE_API_URL}export-csv`, {
        responseType: "blob",
      });

      const blob = new Blob([response.data], {
        type: "text/csv;charset=utf-8;",
      });

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");

      link.href = url;
      link.setAttribute("download", fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();

      window.URL.revokeObjectURL(url);

      dispatch(setSnackbarOpen(true));
      dispatch(setSnackbarMessage("Recipe data exported successfully"));
    } catch (error: unknown) {
      const err = error as AxiosError;
      dispatch(setSnackbarOpen(true));
      dispatch(setSnackbarMessage("Failed to export Redipe data"));
      throw err;
    }
  }
);


// Deactivate Recipe
export const deactivateRecipe = createAsyncThunk<Recipe, string>(
  'recipe/deactivate',
  async (id, { rejectWithValue }) => {
    try {
      const response = await axios.patch(`${RECIPE_API_URL}${id}/deactivate`, { status: 'deactivated' });
      return response.data;
    } catch (error: unknown) {
      const err = error as AxiosError;
      return rejectWithValue(err.response?.data || 'Error deactivate Recipe');
    }
  }
);

// Activate Recipe
export const activateRecipe = createAsyncThunk<Recipe, string>(
  'recipe/activate',
  async (id, { rejectWithValue }) => {
    try {
      const response = await axios.patch(`${RECIPE_API_URL}${id}/activate`, { status: 'active' });
      return response.data;
    } catch (error: unknown) {
      const err = error as AxiosError;
      return rejectWithValue(err.response?.data || 'Error activate Recipe');
    }
  }
);



// Fetch Variance Notifications
export const fetchVarianceNotifications = createAsyncThunk(
  "Recipe/fetchVarianceNotifications",
  async () => {
    const response = await axios.get(`${VARIANCE_NOTIFICATION_URL}/notifications`);
    return response.data;
  }
);



// Fetch Variance Notifications ✅ UPDATED ENDPOINT → /scheduler/notifications with PAGINATION
export const fetchVarianceAllNotifications = createAsyncThunk(
  "Recipe/fetchVarianceAllNotifications",
  async (params?: { page?: number; limit?: number }) => {
    const page = params?.page || 1;
    const limit = params?.limit || 50;

    const response = await axios.get(
      `${SCHEDULER_API_URL}/notifications?page=${page}&limit=${limit}`
    );
    return response.data;
  }
);

// Commit Variance
export const commitVariance = createAsyncThunk<
  { message: string },
  { varianceLogId: string; committedBy?: string }
>(
  "Recipe/commitVariance",
  async ({ varianceLogId, committedBy = "user" }) => {
    const response = await axios.post(`${VARIANCE_NOTIFICATION_URL}/commit`, {
      varianceLogId,
      committedBy,
    });
    return response.data;
  }
);

// Ignore Variance
export const ignoreVariance = createAsyncThunk<
  { message: string },
  string
>(
  "Recipe/ignoreVariance",
  async (varianceLogId) => {
    const response = await axios.post(
      `${VARIANCE_NOTIFICATION_URL}/ignore/${varianceLogId}`
    );
    return response.data;
  }
);




// In recipeSlice.ts — make sure this stays AS-IS (no extra wrapping)
export const checkRecipeVariance = createAsyncThunk(
  "Recipe/checkVariance",
  async (recipeId: string) => {
    const response = await axios.get(
      `${VARIANCE_NOTIFICATION_URL}/notifications/${recipeId}` // ✅ Use /notifications/ not /check/
    );
    console.log('📥 Raw checkRecipeVariance response:', response.data);
    return response.data; // ✅ Return FULL response as-is
  }
);


// Revert committed variance
export const revertVariance = createAsyncThunk<
  { message: string },
  string
>(
  "Recipe/revertVariance",
  async (varianceLogId) => {
    const response = await axios.post(
      `${VARIANCE_NOTIFICATION_URL}/revert-commit/${varianceLogId}`
    );
    return response.data;
  }
);




export const fetchKitsUsingSubkit = createAsyncThunk<
  KitUsingSubkit[],
  string
>(
  "Recipe/fetchKitsUsingSubkit",
  async (subkitName) => {
    const encoded = encodeURIComponent(subkitName);
    const response = await axios.get(
      `${RECIPE_API_URL}kits-using-subkit/${encoded}`
    );
    return response.data;
  }
);


// Fetch Recipe Version History (excludes latest version)
export const fetchRecipeVersionHistory = createAsyncThunk<
  {
    RECIPEID: string;
    recipeId: string;
    totalVersions: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
    versions: RecipeVersionDoc[];
  },
  { recipeId: string; page?: number; limit?: number }
>(
  "Recipe/fetchVersionHistory",
  async ({ recipeId, page = 1, limit = 20 }) => {
    const response = await axios.get(
      `${SCHEDULER_API_URL}/versions/${recipeId}?page=${page}&limit=${limit}`
    );
    return response.data;
  }
);



const recipeSlice = createSlice({
  name: "Recipe",
  initialState,
  reducers: {
    setRecipeData: (state, action: PayloadAction<Recipe>) => {
      state.recipeData = action.payload;
    },
    setEditIndex: (state, action: PayloadAction<number | null>) => {
      state.editIndex = action.payload;
    },
    setDialogOpen: (state, action: PayloadAction<"none" | "edit" | "add">) => {
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
      state.currentRecipePage = 1;
    },
    setShowDeactivated: (state, action: PayloadAction<boolean>) => {
      state.showDeactivated = action.payload;
    },
    resetRecipeData: (state) => {
      state.recipeData = initialRecipe;
    },
    clearCurrentRecipe: (state) => { // Add this new action
      state.currentRecipe = null;
    },

    // Add these to your reducers object
    setRecipePage: (state, action: PayloadAction<number>) => {
      state.currentRecipePage = action.payload;
    },
    setRecipesPerPage: (state, action: PayloadAction<number>) => {
      state.recipesPerPage = action.payload;
      state.currentRecipePage = 1; // Reset to first page when changing items per page
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Consumables
      .addCase(fetchConsumables.pending, (state) => {
        state.loading = false;
        state.error = null;
      })
      .addCase(fetchConsumables.fulfilled, (state, action) => {
        state.loading = false;
        state.consumables = action.payload;
      })
      .addCase(fetchConsumables.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message ?? "Failed to fetch consumables";
        state.snackbarMessage = "Failed to fetch consumables";
        state.snackbarOpen = true;
      })





      .addCase(fetchDateTime.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDateTime.fulfilled, (state, action) => {
        state.loading = false;
        state.dateTime = action.payload;
      })
      .addCase(fetchDateTime.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message ?? "Failed to fetch dateTime";
        state.snackbarMessage = "Failed to fetch dateTime";
        state.snackbarOpen = true;
      })




      // Delete Consumable
      .addCase(deleteConsumable.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteConsumable.fulfilled, (state, action) => {
        state.loading = false;
        const deletedId = action.payload.consumableId;
        state.consumables = state.consumables.filter(item => item.consumableId !== deletedId);
        state.snackbarMessage = "Consumable deleted successfully";
        state.snackbarOpen = true;
      })
      .addCase(deleteConsumable.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message ?? "Failed to delete consumable";
        state.snackbarMessage = "Failed to delete consumable";
        state.snackbarOpen = true;
      })

      // Replace your existing fetchRecipe cases with these
      .addCase(fetchRecipe.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchRecipe.fulfilled, (state, action) => {
        state.loading = false;
        const allResults = action.payload.results || [];
        state.recipes = allResults.filter(r => r.status?.toLowerCase() === 'active');
        state.deactivatedRecipes = allResults.filter(r => r.status?.toLowerCase() === 'deactivated');
        state.currentRecipePage = action.payload.currentPage;
        state.totalRecipePages = action.payload.totalPages;
        state.totalRecipes = action.payload.totalRecipes;
        state.allRecipeItemNames = action.payload.allItemNames || [];
        console.log("fetch fulfilled:", action.payload);
      })
      .addCase(fetchRecipe.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message ?? "Failed to fetch recipes";
        state.snackbarMessage = "Failed to fetch recipes";
        state.snackbarOpen = true;
      })


      // In your extraReducers or builder case:
      .addCase(fetchAllRecipeItemNames.fulfilled, (state, action) => {
        state.allRecipeItemNames = action.payload;  // string[]
        console.log("✅ allRecipeItemNames updated:", action.payload.length, "items");
      })
      .addCase(fetchAllRecipeItemNames.rejected, (state, action) => {
        console.error("❌ Failed to load item names:", action.payload);
        state.allRecipeItemNames = [];  // Fallback to empty
      })


      .addCase(fetchRecipeItem.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchRecipeItem.fulfilled, (state, action) => {
        state.loading = false;
        // Backend already filters by status at the DB level
        // No need to split here — deactivated endpoint is separate

        const allResults = action.payload.results || [];
        state.getRecipe = allResults.filter(r => r.status?.toLowerCase() === 'active');
        state.deactivatedGetRecipe = allResults.filter(r => r.status?.toLowerCase() === 'deactivated');
        state.currentRecipePage = action.payload.currentPage;
        state.totalRecipePages = action.payload.totalPages;
        state.totalRecipes = action.payload.totalRecipes;
        state.allRecipeItemNames = action.payload.allItemNames || [];
      })
      .addCase(fetchRecipeItem.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message ?? "Failed to fetch recipes";
        state.snackbarMessage = "Failed to fetch recipes";
        state.snackbarOpen = true;
      })


      // Fetch Recipe by ID
      .addCase(fetchRecipeById.pending, (state) => {
        state.loading = false;
        state.error = null;
        state.currentRecipe = null;
      })
      .addCase(fetchRecipeById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentRecipe = action.payload;
        state.recipeData = action.payload;
        console.log("Fetch by ID fulfilled: ", action.payload);
      })
      .addCase(fetchRecipeById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message ?? "Failed to fetch recipe by ID";
        state.snackbarMessage = "Failed to fetch recipe by ID";
        state.snackbarOpen = true;
        state.currentRecipe = null;
      })

      // ✅ REPLACE the existing fetchSFG cases with this:
      .addCase(fetchSFG.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSFG.fulfilled, (state, action) => {
        state.loading = false;
        // ✅ CHANGED: Store in sfgRecipes instead of recipes
        state.sfgRecipes = action.payload.filter((item) => item.status?.toLowerCase() === "active");
        console.log("Fetched SUBKIT recipes: ", action.payload);
      })
      .addCase(fetchSFG.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message ?? "Failed to fetch SUBKIT recipes";
        state.snackbarMessage = "Failed to fetch SUBKIT recipes";
        state.snackbarOpen = true;
      })

      // Add Recipe
      .addCase(addRecipe.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addRecipe.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload.status === "active") {
          state.recipes.push(action.payload);
        }
        state.snackbarMessage = "Recipe added successfully";
        state.snackbarOpen = true;
        state.dialogOpen = "none";
        console.log("POST : ", action.payload);
      })
      .addCase(addRecipe.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message ?? "Failed to add recipe";
        state.snackbarMessage = "Failed to add recipe";
        state.snackbarOpen = true;
      })

      // Update Recipe
      .addCase(updateRecipe.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateRecipe.fulfilled, (state, action) => {
        state.loading = false;
        state.snackbarMessage = action.payload.message;
        state.snackbarOpen = true;
        state.dialogOpen = "none";
        console.log("update fullfilled: ", action.payload);
      })
      .addCase(updateRecipe.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message ?? "Failed to update recipe";
        state.snackbarMessage = "Failed to update recipe";
        state.snackbarOpen = true;
      })



      // Export Recipe
      .addCase(ExportRecipe.pending, (state) => {
        state.exportLoading = true;
        state.exportError = null;
      })
      .addCase(ExportRecipe.fulfilled, (state) => {
        state.exportLoading = false;
        state.snackbarMessage = "Recipe exported successfully";
        state.snackbarOpen = true;
      })
      .addCase(ExportRecipe.rejected, (state, action) => {
        state.exportLoading = false;
        state.exportError = action.payload ?? "Failed to export recipe";
        state.snackbarMessage = action.payload ?? "Failed to export recipe";
        state.snackbarOpen = true;
      })



      .addCase(ImportRecipe.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(ImportRecipe.fulfilled, (state) => {
        state.loading = false;
        state.snackbarMessage = "Recipe imported successfully";
        state.snackbarOpen = true;
        // Optionally fetch recipes again to refresh the list
        // This assumes the backend returns the new recipeId
      })
      .addCase(ImportRecipe.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? "Failed to import recipe";
        state.snackbarMessage = action.payload ?? "Failed to import recipe";
        state.snackbarOpen = true;
      })


      // Export Recipe PDF
      .addCase(ExportRecipePDF.pending, (state) => {
        state.exportLoading = true;
        state.exportError = null;
      })
      .addCase(ExportRecipePDF.fulfilled, (state) => {
        state.exportLoading = false;
        state.snackbarMessage = "PDF exported successfully";
        state.snackbarOpen = true;
      })
      .addCase(ExportRecipePDF.rejected, (state, action) => {
        state.exportLoading = false;
        state.exportError = action.payload ?? "Failed to export PDF";
        state.snackbarMessage = action.payload ?? "Failed to export PDF";
        state.snackbarOpen = true;
      })



      // Export All Recipes PDF
      .addCase(ExportAllRecipesPDF.pending, (state) => {
        state.exportLoading = true;
        state.exportError = null;
      })
      .addCase(ExportAllRecipesPDF.fulfilled, (state) => {
        state.exportLoading = false;
        state.snackbarMessage = "All recipes PDF exported successfully";
        state.snackbarOpen = true;
      })
      .addCase(ExportAllRecipesPDF.rejected, (state, action) => {
        state.exportLoading = false;
        state.exportError = action.payload ?? "Failed to export all recipes PDF";
        state.snackbarMessage = action.payload ?? "Failed to export all recipes PDF";
        state.snackbarOpen = true;
      })


      // Add Consumable
      .addCase(addConsumable.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addConsumable.fulfilled, (state, action) => {
        state.loading = false;
        state.consumables.push(action.payload);
        state.snackbarMessage = `Consumable "${action.payload.name}" added successfully`;
        state.snackbarOpen = true;
      })
      .addCase(addConsumable.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message ?? "Failed to add consumable";
        state.snackbarMessage = action.error.message ?? "Failed to add consumable";
        state.snackbarOpen = true;
      })

      // Fetch Items
      .addCase(fetchItems.pending, (state) => {
        state.isFetchingItems = false;
        state.error = null;
      })
      .addCase(fetchItems.fulfilled, (state, action) => {
        state.isFetchingItems = false;
        state.product =
          action.payload.currentPage === 1
            ? action.payload.results
            : [...state.product, ...action.payload.results];
        state.currentPage = action.payload.currentPage;
        state.totalPages = action.payload.totalPages;
        state.hasMoreItems = state.currentPage < state.totalPages;
      })
      .addCase(fetchItems.rejected, (state, action) => {
        state.isFetchingItems = false;
        state.error = action.error.message ?? "Failed to fetch items";
        state.snackbarMessage = "Failed to fetch items";
        state.snackbarOpen = true;
        state.hasMoreItems = false;
      })

      // Fetch PO Items
      .addCase(fetchPO.pending, (state) => {
        state.isFetchingItems = false;
        state.error = null;
      })
      .addCase(fetchPO.fulfilled, (state, action) => {
        state.isFetchingItems = false;
        if (
          action.payload.currentPage === 1 ||
          state.currentSearchQuery !== action.payload.searchQuery
        ) {
          state.poItems = action.payload.result;
        } else {
          const existingIds = new Set(state.poItems.map((item) => item.purchaseitemId));
          const newItems = action.payload.result.filter(
            (item) => !existingIds.has(item.purchaseitemId)
          );
          state.poItems = [...state.poItems, ...newItems];
        }
        state.currentPage = action.payload.currentPage;
        state.totalPages = action.payload.totalPages;
        state.hasMoreItems = state.currentPage < state.totalPages;
        state.currentSearchQuery = action.payload.searchQuery;
      })
      .addCase(fetchPO.rejected, (state, action) => {
        state.isFetchingItems = false;
        state.error = action.error.message ?? "Failed to fetch PO items";
        state.snackbarMessage = "Failed to fetch PO items";
        state.snackbarOpen = true;
        state.hasMoreItems = false;
      })

      // Export CSV
      .addCase(ExportCSV.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(ExportCSV.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(ExportCSV.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message ?? "Failed to export Recipe data";
      })


      // Deactivate Recipe
      .addCase(deactivateRecipe.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deactivateRecipe.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.recipes.findIndex(p => p.recipeId === action.payload.recipeId);
        if (index !== -1) {
          const [deactivated] = state.recipes.splice(index, 1);
          state.deactivatedRecipes.push(deactivated);
        }
        state.snackbarMessage = 'Recipe deactivated successfully';
        state.snackbarOpen = true;
      })
      .addCase(deactivateRecipe.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message ?? 'Failed to deactivate Recipe';
        state.snackbarMessage = 'Failed to deactivate Recipe';
        state.snackbarOpen = true;
      })

      // Activate SubCategory
      .addCase(activateRecipe.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(activateRecipe.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.deactivatedRecipes.findIndex(p => p.recipeId === action.payload.recipeId);
        if (index !== -1) {
          const [activated] = state.deactivatedRecipes.splice(index, 1);
          state.recipes.push(activated);
        }
        state.snackbarMessage = 'Recipe activated successfully';
        state.snackbarOpen = true;
      })
      .addCase(activateRecipe.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message ?? 'Failed to activate Recipe';
        state.snackbarMessage = 'Failed to activate Recipe';
        state.snackbarOpen = true;
      })

      // Fetch Variance Notifications
      .addCase(fetchVarianceNotifications.pending, (state) => {
        state.varianceLoading = true;
      })

      .addCase(fetchVarianceNotifications.fulfilled, (state, action) => {
        state.varianceLoading = false;

        const payload = action.payload as VarianceResponse;

        state.variance = {
          unreadCount: payload.unreadCount || payload.totalAlerts || 0,
          notifications: payload.notifications || [],
          allCachedNotifications: payload.notifications || [], // ✅ added
          hasAlerts: payload.hasAlerts,
          lastCheckedAt: payload.lastCheckedAt,
          totalAlerts: payload.totalAlerts || 0,              // ✅ added
          hasNextPage: payload.hasNextPage || false,           // ✅ added
          currentPage: payload.page || 1,                     // ✅ added
        };
      })

      .addCase(fetchVarianceNotifications.rejected, (state) => {
        state.varianceLoading = false;
      })

      // ✅ NEW: Fetch Variance All Notifications (Scheduler endpoint with pagination)
      .addCase(fetchVarianceAllNotifications.pending, (state) => {
        state.varianceLoading = true;
      })
      .addCase(fetchVarianceAllNotifications.fulfilled, (state, action) => {
        state.varianceLoading = false;

        const payload = action.payload as VarianceResponse;
        const requestPage = action.meta.arg?.page || 1;
        const isFirstPage = requestPage === 1;

        // ✅ If first page or refresh, replace everything
        if (isFirstPage) {
          state.variance = {
            unreadCount: payload.unreadCount || payload.totalAlerts || 0,
            notifications: payload.notifications || [],
            allCachedNotifications: payload.notifications || [],
            hasAlerts: payload.hasAlerts,
            lastCheckedAt: payload.lastCheckedAt,
            totalAlerts: payload.totalAlerts || 0,
            totalCount: payload.totalCount || payload.totalAlerts || 0,
            hasNextPage: payload.hasNextPage || false,
            currentPage: payload.page || 1,
          };
        } else {
          // ✅ If subsequent pages, APPEND to existing data
          const existingNotifications = state.variance.notifications || [];
          const newNotifications = payload.notifications || [];

          // ✅ Deduplicate based on recipeId to avoid duplicates
          const existingIds = new Set(
            existingNotifications.map(n => n.recipeId).filter(id => id !== undefined && id !== null)
          );

          const uniqueNewNotifications = newNotifications.filter(
            n => n.recipeId && !existingIds.has(n.recipeId)
          );

          state.variance = {
            ...state.variance,
            notifications: [
              ...existingNotifications,
              ...uniqueNewNotifications
            ],
            allCachedNotifications: [
              ...(state.variance.allCachedNotifications || []),
              ...uniqueNewNotifications
            ],
            hasNextPage: payload.hasNextPage || false,
            currentPage: payload.page || requestPage,
            totalAlerts: payload.totalAlerts || state.variance.totalAlerts || 0,
            totalCount: payload.totalCount || payload.totalAlerts || state.variance.totalCount || 0,
          };
        }

        console.log("✅ Scheduler notifications loaded:",
          `Page ${state.variance.currentPage}, Total: ${state.variance.notifications.length}/${state.variance.totalCount}`
        );
      })
      .addCase(fetchVarianceAllNotifications.rejected, (state) => {
        state.varianceLoading = false;
        console.error("❌ Failed to fetch scheduler notifications");
      })


      // Commit Variance
      .addCase(commitVariance.pending, (state) => {
        state.varianceLoading = true;
      })
      .addCase(commitVariance.fulfilled, (state, action) => {
        state.varianceLoading = false;
        state.snackbarMessage = action.payload.message;
        state.snackbarOpen = true;
      })
      .addCase(commitVariance.rejected, (state) => {
        state.varianceLoading = false;
        state.snackbarMessage = "Failed to commit price changes";
        state.snackbarOpen = true;
      })

      // Ignore Variance
      .addCase(ignoreVariance.pending, (state) => {
        state.varianceLoading = true;
      })
      .addCase(ignoreVariance.fulfilled, (state, action) => {
        state.varianceLoading = false;
        state.snackbarMessage = action.payload.message;
        state.snackbarOpen = true;
      })
      .addCase(ignoreVariance.rejected, (state) => {
        state.varianceLoading = false;
        state.snackbarMessage = "Failed to ignore price changes";
        state.snackbarOpen = true;
      })




      // Check Recipe Variance
      .addCase(checkRecipeVariance.pending, (state) => {
        state.varianceLoading = true;
      })
      .addCase(checkRecipeVariance.fulfilled, (state) => {
        state.varianceLoading = false;
      })
      .addCase(checkRecipeVariance.rejected, (state) => {
        state.varianceLoading = false;
      })

      // Revert Variance
      .addCase(revertVariance.pending, (state) => {
        state.varianceLoading = true;
      })
      .addCase(revertVariance.fulfilled, (state, action) => {
        state.varianceLoading = false;
        state.snackbarMessage = action.payload.message;
        state.snackbarOpen = true;
      })
      .addCase(revertVariance.rejected, (state) => {
        state.varianceLoading = false;
        state.snackbarMessage = "Failed to revert price changes";
        state.snackbarOpen = true;
      })


      // Fetch Recipe Version History
      .addCase(fetchRecipeVersionHistory.pending, (state) => {
        state.versionHistory.loading = true;
      })
      .addCase(fetchRecipeVersionHistory.fulfilled, (state, action) => {
        state.versionHistory.loading = false;
        state.versionHistory.versions = action.payload.versions;
        state.versionHistory.totalVersions = action.payload.totalVersions;
        state.versionHistory.totalPages = action.payload.totalPages;
        state.versionHistory.currentPage = action.payload.page;
      })
      .addCase(fetchRecipeVersionHistory.rejected, (state) => {
        state.versionHistory.loading = false;
      });

  },
});

export const {
  setRecipeData,
  setEditIndex,
  setDialogOpen,
  setSnackbarOpen,
  setSnackbarMessage,
  setSearchQuery,
  setShowDeactivated,
  resetRecipeData,
  clearCurrentRecipe,

  setRecipePage,          // Add this
  setRecipesPerPage,
} = recipeSlice.actions;

export const selectRecipe = (state: RootState) => state.recipe;
export const selectAllRecipeItemNames = (state: RootState) => state.recipe.allRecipeItemNames;

export default recipeSlice.reducer;
