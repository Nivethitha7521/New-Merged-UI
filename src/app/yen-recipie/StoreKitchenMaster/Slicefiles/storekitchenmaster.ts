
import { createSlice, PayloadAction } from "@reduxjs/toolkit";

// Shape of a row selected from the recipe list table (see storeKitchenMaster page)
export interface SelectedRecipeItem {
  recipeId: string;
  recipeName: string;
  version: number;
  uom?: string;
  cost: number;
  status: boolean;
}

interface StoreKitchenState {
  selectedItem: SelectedRecipeItem | null;
}

const initialState: StoreKitchenState = {
  selectedItem: null,
};

const storeKitchenSlice = createSlice({
  name: "storeKitchenItem",
  initialState,
  reducers: {
    setSelectedItem: (state, action: PayloadAction<SelectedRecipeItem>) => {
      state.selectedItem = action.payload;
    },
  },
});

export const { setSelectedItem } = storeKitchenSlice.actions;
export default storeKitchenSlice.reducer;
