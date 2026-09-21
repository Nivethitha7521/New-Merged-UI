export interface EditRecipeItem {
  id: string;
  name: string;
  code: string;
  uom: string;
  type: 'SFG' | 'RM';
  quantity: string;
  placeholder: string;
  status: 'selected' | 'assigned';
  isExisting?: boolean;
}

export interface SFGMaterial {
  status: string;
  uom: string;
  sfgName: string;
  sfgCode: string;
}

export interface RawMaterial {
  itemName: string;
  uom: string;
  purchaseitemId: string | null;
  itemCode: string | null;
}

export interface EditRecipeState {
  recipeId?: string;
  version: number;
  recipeName: string;
  cost: string;
  recipeStatus: boolean;
  sfgList: SFGMaterial[];
  rawList: RawMaterial[];
  recipeItems: EditRecipeItem[];
  loading: boolean;
  snackbar: {
    open: boolean;
    message: string;
  };
}


export const initialState: EditRecipeState = {
  recipeId: undefined,
  version: 1,
  recipeName: "",
  cost: "",
  sfgList: [],
  rawList: [],
  recipeItems: [],
  recipeStatus: false,
  loading: false,
  snackbar: { open: false, message: "" }
};



// types.ts
// Shared types for the Edit Recipe page components

export interface RecipeItem {
  id: string;
  name: string;
  code: string;
  type: "SFG" | "RM";
  uom: string;
  quantity: string;
  placeholder?: string;
  status: "selected" | "assigned";
}

export interface SFGMaterial {
  sfgCode: string;
  sfgName: string;
  uom: string;
}
