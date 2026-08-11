import axios from "axios";
// import { RecipeItem, RecipeName } from "@/app/storeKitchen/newRecipe/Models/newrecipeModels";
import { RecipeItem, RecipeMeta } from "../models/versionhistortmodel";
/* GET APIs (already existing) */
//  const HISTORY_BASE_URL = `${process.env.NEXT_PUBLIC_API_BASE_URL}viewrecipehistory`
const HISTORY_BASE_URL = "  https://yenerp.com/recipeapi/viewrecipehistory"
  //"viewrecipehistory";

/* POST API (already exists in backend) */
// const CREATE_RECIPE_URL = `${process.env.NEXT_PUBLIC_API_BASE_URL}storekitchenmaster`
const CREATE_RECIPE_URL = "  https://yenerp.com/recipeapi/storekitchenmaster"
  //"storekitchenmaster/materials/newrecipe";


  export const fetchRecipeFullDetails = (recipeId: string, version: number) =>
  axios.get(`${HISTORY_BASE_URL}/full-details/${recipeId}/${version}`);


/* ======================
   GET METHODS
====================== */
export const fetchLatestVersion = (recipeId: string) =>
  axios.get(` https://yenerp.com/recipeapi/allrecipes/${recipeId}/latest-version`);

export const fetchVersions = (recipeId: string) =>
  axios.get(`${HISTORY_BASE_URL}/${recipeId}/versions`);

export const fetchVersion = (recipeId: string, version: number) =>
  axios.get(`${HISTORY_BASE_URL}/${recipeId}/version/${version}`);

/* ======================
   POST METHOD (NEW)
   Reuses existing backend
====================== */
export const createNewRecipeVersion = (payload: {
  recipeId: string;
  recipeName: string;
  cost: number;
  items: RecipeItem[];
  recipeMeta?: RecipeMeta | null;
}) => {
  return axios.post(CREATE_RECIPE_URL, payload);
};