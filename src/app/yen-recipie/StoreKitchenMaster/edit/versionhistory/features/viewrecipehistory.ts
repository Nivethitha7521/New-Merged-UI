import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { RootState } from "@/redux/store";
import {
  fetchVersions,
  fetchVersion,
  createNewRecipeVersion,
} from "./recipeApi";
import { VersionSummary, VersionDetail, RecipeItem, RecipeHistoryState } from "../models/versionhistortmodel";

/* =======================
   TYPES
======================= */

export const getVersions = createAsyncThunk<
  {
    recipeId: string;
    versionHistory: VersionSummary[];
  },
  string
>("recipe/getVersions", async (recipeId) => {
  const res = await fetchVersions(recipeId);
  return res.data;
});   


export const getVersionDetail = createAsyncThunk<
  VersionDetail,
  { recipeId: string; version: number }
>("recipe/getVersionDetail", async ({ recipeId, version }) => {
  const res = await fetchVersion(recipeId, version);
  return res.data;
});

export const addNewVersion = createAsyncThunk<
  void,
  {
    recipeId: string;
    recipeName: string;
    cost: number;
    items: RecipeItem[];
  },
  { state: RootState }
>("recipe/addNewVersion", async (payload, { dispatch }) => {
  await createNewRecipeVersion(payload);
  dispatch(getVersions(payload.recipeId));
});


/* =======================
   STATE
======================= */

const initialState: RecipeHistoryState = {
  recipeId: "",
  versions: [],
  selectedVersion: null,
};

/* =======================
   SLICE
======================= */

const recipeHistorySlice = createSlice({
  name: "recipehistory",
  initialState,
  reducers: {
    setRecipeId(state, action: PayloadAction<string>) {
      state.recipeId = action.payload;
      state.versions = [];
      state.selectedVersion = null;
    },
    clearRecipe(state) {
      state.recipeId = "";
      state.versions = [];
      state.selectedVersion = null;
    },
  },
  extraReducers: (builder) => {
    builder
     .addCase(getVersions.fulfilled, (state, action) => {
    state.versions = action.payload.versionHistory;
})
      .addCase(getVersionDetail.fulfilled, (state, action) => {
        state.selectedVersion = action.payload;
      });
  },
});

export const { setRecipeId, clearRecipe } = recipeHistorySlice.actions;
export const selectRecipeHistory = (state: RootState) =>
  state.recipehistory;

export default recipeHistorySlice.reducer;