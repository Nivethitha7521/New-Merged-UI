import { createSlice , PayloadAction } from "@reduxjs/toolkit";
import { RootState } from "@/redux/store";

export const selectActiveSection = (state:RootState) => state.recipesection.activeSection;

interface RecipeSectionState {
    activeSection:string | null;
}

const initialState : RecipeSectionState = {
    activeSection: null,
}

const recipeSlice = createSlice({
    name:'recipesection',
    initialState,
  reducers: {
    setActiveSection(state, action: PayloadAction<string>) {
      state.activeSection = action.payload;
    },
    },
});

export const {setActiveSection} = recipeSlice.actions
export default recipeSlice.reducer