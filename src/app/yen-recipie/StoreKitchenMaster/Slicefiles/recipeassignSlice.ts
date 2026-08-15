

import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axios, { AxiosError, AxiosResponse } from "axios";
import { RootState } from "@/redux/store";

// ── existing types ──
export interface RecipeItem {
  id: string
  name: string
  code: string
  uom: string
  type: "RM" | "SFG"
  category?: "Raw" | "Packing" | "FG-External" | "Cleaning"
  quantity: number
}

export interface RecipeMeta {
  itemName?: string
  varianceName?: string
  itemCode?: string
  item_Uom?: string
  item_Defaultprice?: number
}

export interface Recipe {
  recipeId: string
  recipeName: string
  version: number
  uom?: string
  cost: number
  status: boolean
}

// ✅ full detail shape returned by /full-details/{recipe_id}/{version_no}
export interface RecipeFullDetail {
  recipeId: string
  recipeName: string
  version: number
  cost: number
  items: RecipeItem[]
  status: boolean
  createdAt: string
  totalItemsCost?: number
  recipeMeta?: RecipeMeta
}

// ✅ NEW: shared shape for export requests — "ALL" means every recipe's latest version
export type ExportTarget = { recipeId: string; version: number } | "ALL"

interface RecipesState {
  items: Recipe[]
  loading: boolean
  successMessage: string | null
  error: string | null
  currentPage: number
  totalPages: number

  // state for the details popup
  viewDetail: RecipeFullDetail | null
  viewLoading: boolean
  viewError: string | null

  // ✅ NEW: PDF export state (single-row Print + Print All share this)
  pdfExportLoading: boolean
  pdfExportError: string | null

  // ✅ NEW: Excel export state (single-row Excel + Export All share this)
  excelExportLoading: boolean
  excelExportError: string | null
}

const initialState: RecipesState = {
  items: [],
  loading: false,
  successMessage: null,
  error: null,
  currentPage: 1,
  totalPages: 1,

  viewDetail: null,
  viewLoading: false,
  viewError: null,

  pdfExportLoading: false,
  pdfExportError: null,

  excelExportLoading: false,
  excelExportError: null,
}

const API_BASE_URL = "https://yenerp.com/purchasetestapi/viewrecipehistory/all-versions";
const FULL_DETAILS_URL = "https://yenerp.com/purchasetestapi/viewrecipehistory/full-details";

// ✅ NEW: PDF export endpoints (existing router, unchanged prefix)
const EXPORT_PDF_URL = "https://yenerp.com/purchasetestapi/viewrecipehistory/export-pdf";
const EXPORT_ALL_PDF_URL = "https://yenerp.com/purchasetestapi/viewrecipehistory/export-all-pdf";

// ✅ NEW: Excel export endpoints — registered in main.py under its own prefix:
// {"module": "skmRecipeExport.excelexportrouter.router", "prefix": "/recipeapi/viewrecipehistory/excel", ...}
const EXPORT_EXCEL_URL = "https://yenerp.com/purchasetestapi/viewrecipehistory/excel/export-excel";
const EXPORT_ALL_EXCEL_URL = "https://yenerp.com/purchasetestapi/viewrecipehistory/excel/export-all-excel";

// ── Response type for fetchRecipes ──
interface FetchRecipesResponse {
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  data: Recipe[];
}

// ── existing fetchRecipes thunk (unchanged) ──
export const fetchRecipes = createAsyncThunk<
  FetchRecipesResponse,
  { searchTerm?: string; page?: number; pageSize?: number },
  { rejectValue: string }
>(
  "recipes/fetch",
  async ({ searchTerm, page = 1, pageSize = 20 }, { rejectWithValue }) => {
    try {
      const params: Record<string, string | number> = { page, pageSize }
      if (searchTerm) params.recipeName = searchTerm

      const response: AxiosResponse<FetchRecipesResponse> = await axios.get(API_BASE_URL, { params })
      return response.data
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        return rejectWithValue(
          error.response?.data?.detail || "Failed to fetch recipes"
        )
      }
      return rejectWithValue("An unknown error occurred")
    }
  }
);

// ── existing fetchRecipeFullDetails thunk (unchanged) ──
export const fetchRecipeFullDetails = createAsyncThunk<
  RecipeFullDetail,
  { recipeId: string; version: number },
  { rejectValue: string }
>(
  "recipes/fetchFullDetails",
  async ({ recipeId, version }, { rejectWithValue }) => {
    try {
      const response: AxiosResponse<RecipeFullDetail> = await axios.get<RecipeFullDetail>(
        `${FULL_DETAILS_URL}/${recipeId}/${version}`
      )
      return response.data
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        return rejectWithValue(
          error.response?.data?.detail || "Failed to load recipe details"
        )
      }
      return rejectWithValue("An unknown error occurred")
    }
  }
);

// ── shared helper: trigger a browser download from a blob response ──
function triggerBlobDownload(data: BlobPart, mimeType: string, disposition: string | undefined, fallbackName: string): void {
  // Try to extract filename from Content-Disposition header
  let filename = fallbackName;
  
  if (disposition) {
    // Handle both quoted and unquoted filenames
    const match = disposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
    if (match && match[1]) {
      filename = match[1].replace(/['"]/g, '').trim();
    }
  }

  const blobUrl = window.URL.createObjectURL(new Blob([data], { type: mimeType }));
  const link = document.createElement("a");
  link.href = blobUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(blobUrl);
}

// ✅ Updated: download PDF for a single recipe+version (per-row Print icon)
export const downloadRecipePdf = createAsyncThunk<
  void,
  { recipeId: string; version: number; includeCost: boolean },
  { rejectValue: string }
>(
  "recipes/downloadRecipePdf",
  async ({ recipeId, version, includeCost }, { rejectWithValue }) => {
    try {
      const response: AxiosResponse<Blob> = await axios.get(`${EXPORT_PDF_URL}/${recipeId}/${version}`, {
        params: { include_cost: includeCost },
        responseType: "blob",
      });
      triggerBlobDownload(
        response.data,
        "application/pdf",
        response.headers["content-disposition"],
        `recipe_${recipeId}_v${version}.pdf` // Generic fallback only
      );
      return;
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        const detail = error.response?.data?.detail;
        return rejectWithValue(detail || "Failed to generate the PDF. Please try again.");
      }
      return rejectWithValue("An unknown error occurred");
    }
  }
);

// ✅ Updated: download PDF for ALL recipes (Print All button)
export const downloadAllRecipesPdf = createAsyncThunk<
  void,
  { includeCost: boolean },
  { rejectValue: string }
>(
  "recipes/downloadAllRecipesPdf",
  async ({ includeCost }, { rejectWithValue }) => {
    try {
      const response: AxiosResponse<Blob> = await axios.get(EXPORT_ALL_PDF_URL, {
        params: { include_cost: includeCost },
        responseType: "blob",
      });
      triggerBlobDownload(
        response.data,
        "application/pdf",
        response.headers["content-disposition"],
        "all_recipes.pdf" // Fallback only
      );
      return;
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        const detail = error.response?.data?.detail;
        return rejectWithValue(detail || "Failed to generate the PDF. Please try again.");
      }
      return rejectWithValue("An unknown error occurred");
    }
  }
);

// ✅ Updated: download Excel for a single recipe+version (per-row Excel icon)
export const downloadRecipeExcel = createAsyncThunk<
  void,
  { recipeId: string; version: number; includeCost: boolean },
  { rejectValue: string }
>(
  "recipes/downloadRecipeExcel",
  async ({ recipeId, version, includeCost }, { rejectWithValue }) => {
    try {
      const response: AxiosResponse<Blob> = await axios.get(`${EXPORT_EXCEL_URL}/${recipeId}/${version}`, {
        params: { include_cost: includeCost },
        responseType: "blob",
      });
      triggerBlobDownload(
        response.data,
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        response.headers["content-disposition"],
        `recipe_${recipeId}_v${version}.xlsx` // Generic fallback only
      );
      return;
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        const detail = error.response?.data?.detail;
        return rejectWithValue(detail || "Failed to generate the Excel file. Please try again.");
      }
      return rejectWithValue("An unknown error occurred");
    }
  }
);

// ✅ Updated: download Excel for ALL recipes (Export All button)
export const downloadAllRecipesExcel = createAsyncThunk<
  void,
  { includeCost: boolean },
  { rejectValue: string }
>(
  "recipes/downloadAllRecipesExcel",
  async ({ includeCost }, { rejectWithValue }) => {
    try {
      const response: AxiosResponse<Blob> = await axios.get(EXPORT_ALL_EXCEL_URL, {
        params: { include_cost: includeCost },
        responseType: "blob",
      });
      triggerBlobDownload(
        response.data,
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        response.headers["content-disposition"],
        "all_recipes.xlsx" // Fallback only
      );
      return;
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        const detail = error.response?.data?.detail;
        return rejectWithValue(detail || "Failed to generate the Excel file. Please try again.");
      }
      return rejectWithValue("An unknown error occurred");
    }
  }
);

const recipesSlice = createSlice({
  name: "recipes",
  initialState,
  reducers: {
    clearSuccessMessage: (state) => {
      state.successMessage = null
    },
    clearError: (state) => {
      state.error = null
    },
    resetPagination: (state) => {
      state.currentPage = 1
    },
    // close the modal / clear its state
    clearViewDetail: (state) => {
      state.viewDetail = null
      state.viewError = null
      state.viewLoading = false
    },
    // ✅ NEW: clear PDF export error (e.g. when popup opens/closes)
    clearPdfExportError: (state) => {
      state.pdfExportError = null
    },
    // ✅ NEW: clear Excel export error (e.g. when popup opens/closes)
    clearExcelExportError: (state) => {
      state.excelExportError = null
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchRecipes.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchRecipes.fulfilled, (state, action) => {
        state.loading = false
        state.items = action.payload.data
        state.currentPage = action.payload.page
        state.totalPages = action.payload.totalPages
        state.successMessage = "Recipes loaded successfully"
        state.error = null
      })
      .addCase(fetchRecipes.rejected, (state, action) => {
        state.loading = false
        state.error = (action.payload as string) || "Failed to fetch recipes"
      })

      // full details lifecycle
      .addCase(fetchRecipeFullDetails.pending, (state) => {
        state.viewLoading = true
        state.viewError = null
      })
      .addCase(fetchRecipeFullDetails.fulfilled, (state, action) => {
        state.viewLoading = false
        state.viewDetail = action.payload
      })
      .addCase(fetchRecipeFullDetails.rejected, (state, action) => {
        state.viewLoading = false
        state.viewError = action.payload || "Failed to load recipe details"
        state.viewDetail = null
      })

      // ✅ PDF export lifecycle (single-row + all share the same flags)
      .addCase(downloadRecipePdf.pending, (state) => {
        state.pdfExportLoading = true
        state.pdfExportError = null
      })
      .addCase(downloadRecipePdf.fulfilled, (state) => {
        state.pdfExportLoading = false
      })
      .addCase(downloadRecipePdf.rejected, (state, action) => {
        state.pdfExportLoading = false
        state.pdfExportError = action.payload || "Failed to generate the PDF. Please try again."
      })
      .addCase(downloadAllRecipesPdf.pending, (state) => {
        state.pdfExportLoading = true
        state.pdfExportError = null
      })
      .addCase(downloadAllRecipesPdf.fulfilled, (state) => {
        state.pdfExportLoading = false
      })
      .addCase(downloadAllRecipesPdf.rejected, (state, action) => {
        state.pdfExportLoading = false
        state.pdfExportError = action.payload || "Failed to generate the PDF. Please try again."
      })

      // ✅ Excel export lifecycle (single-row + all share the same flags)
      .addCase(downloadRecipeExcel.pending, (state) => {
        state.excelExportLoading = true
        state.excelExportError = null
      })
      .addCase(downloadRecipeExcel.fulfilled, (state) => {
        state.excelExportLoading = false
      })
      .addCase(downloadRecipeExcel.rejected, (state, action) => {
        state.excelExportLoading = false
        state.excelExportError = action.payload || "Failed to generate the Excel file. Please try again."
      })
      .addCase(downloadAllRecipesExcel.pending, (state) => {
        state.excelExportLoading = true
        state.excelExportError = null
      })
      .addCase(downloadAllRecipesExcel.fulfilled, (state) => {
        state.excelExportLoading = false
      })
      .addCase(downloadAllRecipesExcel.rejected, (state, action) => {
        state.excelExportLoading = false
        state.excelExportError = action.payload || "Failed to generate the Excel file. Please try again."
      })
  }
})

export const {
  clearSuccessMessage,
  clearError,
  resetPagination,
  clearViewDetail,
  clearPdfExportError,
  clearExcelExportError,
} = recipesSlice.actions

export const selectRecipes = (state: RootState) => state.recipes

export default recipesSlice.reducer