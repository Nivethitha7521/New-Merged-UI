'use client';
import React, { useState, useEffect, useMemo, useRef, Suspense, useCallback } from 'react';
import {
  Box,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Snackbar,
  Alert,
  Typography,
  IconButton,
  Grid,
  Autocomplete,
  ListItemText,
  Tooltip,
} from '@mui/material';
import { HistoryOutlined, CancelOutlined } from '@mui/icons-material';
import {
  addRecipe,
  updateRecipe,
  fetchItems,
  fetchPO,
  fetchConsumables,
  addConsumable,
  fetchSFG,
  fetchRecipeById,
  fetchVarianceNotifications,
  checkRecipeVariance,
  fetchAllRecipeItemNames,
  fetchRecipeVersionHistory,
} from '../Features/recipeSlice';

import {
  // PerGramBreakdown,
  VarianceNotification,
  IngredientItem,
  Recipe,
  Consumable,
  POItems,
  IngredientVarianceChange,
  RecipeVersionDoc,
  VersionPreviewSnapshot,
} from '../Models/recipeModels';
import { useDispatch, useSelector } from 'react-redux';
import { useSearchParams, useRouter } from 'next/navigation';
import { AppDispatch, RootState } from '../../../../redux/store';
import EditConfirmationDialog from '@/app/Components/Dialogs/EditConfirmationDialog';
import CloseConfirmationDialog from '@/app/Components/Dialogs/CloseConfirmationDialog';
import RecipeHeaderForm from '../Recipemanagement/headers';
import RecipeTableContainer from '../Recipemanagement/table';
import RecipeDetailsContainer from '../Recipemanagement/calculations';
import StepByStepInstructions from '../Recipemanagement/instructions';
import { debounce } from '@mui/material';
import ConsumablesPage from '../Recipemanagement/consumables';
import FullscreenExitIcon from '@mui/icons-material/FullscreenExit';
import { Add as AddIcon, Visibility as VisibilityIcon } from '@mui/icons-material';
import ActivateDeactivateConfirmationDialog from '@/app/Components/Dialogs/ActivateDeactivateConfirmationDialog';
import SubkitKitUpdateDialog from '../Recipemanagement/SubkitKitUpdateDialog';

// ─── Wrapper ──────────────────────────────────────────────────────────────────
const CreateRecipePageWrapper = () => {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <CreateRecipePage />
    </Suspense>
  );
};

// ─── Types ────────────────────────────────────────────────────────────────────

/** Shape returned by checkRecipeVariance thunk (real-time API) */
interface VarianceApiIngredientChange {
  ingredientId: string;
  ingredientName?: string;
  uom?: string;
  qty?: number;
  batchQty?: number;
  oldPriceVersion?: number;
  newPriceVersion?: number;
  /** stored (old) per-gram cost */
  storedPerGramCost?: number;
  /** current (new) per-gram cost */
  currentPerGramCost?: number;
  /** legacy alias */
  oldPerGramCost?: number;
  /** legacy alias */
  newPerGramCost?: number;
  oldTotalCost?: number;
  newTotalCost?: number;
  currentTotalCost?: number;
  costDifference?: number;
  priceChangePercent?: number;
  costDifferencePercent?: number;
}

interface VarianceApiResponse {
  id?: string;
  recipeId?: string;
  recipeMongoId?: string;
  itemName?: string;
  alertDate?: string;
  variancePercent?: number;
  varianceOn?: string;
  perGramWeightVariance?: number;
  perPieceWeightVariance?: number;
  oldPerGramWeight?: number;
  newPerGramWeight?: number;
  storedTotalCost?: number;
  currentTotalCost?: number;
  ingredientChanges?: VarianceApiIngredientChange[];
  ingredientsChanged?: number;
  totalIngredients?: number;
  message?: string;
  hasVariance?: boolean;
  hasAlerts?: boolean;
  checkedAt?: string;
  dataSource?: string;
  // legacy shape
  thresholdExceeded?: boolean;
  varianceLog?: VarianceApiResponse;
}

/** Internal resolved variance change (all IDs replaced with item names) */
interface ResolvedIngredientChange {
  ingredientId: string;
  ingredientName: string;
  oldPerGramCost: number;
  newPerGramCost: number;
  priceChangePercent: number;
  oldTotalCost: number;
  newTotalCost: number;
  batchQty: number;
}

/** Internal variance log stored in state */
interface CurrentVarianceLog {
  id: string;
  ingredientChanges: ResolvedIngredientChange[];
}

/** Per-entry in the pending variance map (keyed by ingredient display name) */
interface PendingVarianceEntry {
  currentPerGramCost: number;
  currentTotalCost: number;
  currentGST: number;
  oldPerGramCost?: number;
  oldTotalCost?: number;
  priceChangePercent?: number;
  ingredientId: string;
}

/** Per-entry in the inline (post-commit) variance map */
interface InlineVarianceEntry {
  oldPerGramCost: number;
  newPerGramCost: number;
  priceChangePercent: number;
}

interface SellingCostState {
  sellingCostKg: number;
  sellingCostPcs: number;
  totalSellingCost: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const extractWeightFromName = (itemName: string): number | null => {
  if (!itemName) return null;
  const pattern = /(\d+(?:\.\d+)?)\s*(LTRS?|LTR?|KGS?|GMS?|GM|ML|G|L)\b/gi;
  let best: number | null = null;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(itemName)) !== null) {
    const qty = parseFloat(match[1]);
    const unit = match[2].toUpperCase().trim();
    let grams: number;
    if (unit === 'KG' || unit === 'KGS') { grams = qty * 1000; }
    else if (unit === 'LT' || unit === 'LTR' || unit === 'LTRS' || unit === 'L') { grams = qty * 900; }
    else if (unit === 'ML') { grams = qty * 0.9; }
    else { grams = qty; }
    best = grams;
  }
  if (best !== null) return best;
  const numberPattern = /(\d+(?:\.\d+)?)/g;
  let lastNumber: number | null = null;
  let numMatch: RegExpExecArray | null;
  while ((numMatch = numberPattern.exec(itemName)) !== null) {
    lastNumber = parseFloat(numMatch[1]);
  }
  return lastNumber;
};

// export const buildPerGramBreakdown = (ing: IngredientItem): PerGramBreakdown | null => {
//   const itemName = ing.ingredients;
//   if (!itemName) return null;
//   const pattern = /(\d+(?:\.\d+)?)\s*(LTRS?|LTR?|KGS?|GMS?|GM|ML|G|L)\b/gi;
//   let matchedQty: number | null = null;
//   let matchedUnit: string | null = null;
//   let match: RegExpExecArray | null;
//   while ((match = pattern.exec(itemName)) !== null) {
//     matchedQty = parseFloat(match[1]);
//     matchedUnit = match[2].toUpperCase().trim();
//   }
//   if (matchedQty === null) {
//     const numbers = itemName.match(/(\d+(?:\.\d+)?)/g);
//     if (numbers) {
//       matchedQty = parseFloat(numbers[numbers.length - 1]);
//       matchedUnit = 'G';
//     }
//   }
//   if (!matchedQty || !matchedUnit) return null;
//   let totalGrams: number;
//   let gramFormula: string;
//   const unit = matchedUnit.toUpperCase();
//   if (['LT', 'LTR', 'LTRS', 'L'].includes(unit)) {
//     totalGrams = matchedQty * 900;
//     gramFormula = `${matchedQty} LTR × 900 = ${totalGrams}g`;
//   } else if (unit === 'ML') {
//     totalGrams = matchedQty * 0.9;
//     gramFormula = `${matchedQty} ML × 0.9 = ${totalGrams}g`;
//   } else if (['KG', 'KGS'].includes(unit)) {
//     totalGrams = matchedQty * 1000;
//     gramFormula = `${matchedQty} KG × 1000 = ${totalGrams}g`;
//   } else {
//     totalGrams = matchedQty;
//     gramFormula = `${matchedQty} GM = ${totalGrams}g`;
//   }
//   const purchasePrice = parseFloat(((ing.perGramCost as number) * totalGrams).toFixed(2));
//   const perGram = parseFloat((purchasePrice / totalGrams).toFixed(4));
//   return {
//     itemName,
//     valueInName: `${matchedQty} ${matchedUnit}`,
//     totalGrams,
//     gramFormula,
//     totalCost: purchasePrice,
//     perGramCost: perGram,
//     steps: [
//       `1. Item Name      : ${itemName}`,
//       `2. Value in Name  : ${matchedQty} ${matchedUnit}`,
//       `3. Total Grams    : ${gramFormula}`,
//       `4. Per Gram Cost  : ₹${purchasePrice} ÷ ${totalGrams}g = ₹${perGram}`,
//     ],
//   };
// };

// ─── Variance resolution helpers ──────────────────────────────────────────────

/**
 * Resolve ingredient IDs → display names using multiple strategies.
 * Returns a map of { ingredientId → resolvedName }.
 */
async function resolveIngredientNames(
  ingredientChanges: VarianceApiIngredientChange[],
  recipeIngredients: IngredientItem[],
  dispatch: AppDispatch,
): Promise<Record<string, string>> {
  const ids = ingredientChanges.map((c) => c.ingredientId);
  const idToName: Record<string, string> = {};

  // Strategy 1: use ingredientName directly from API when it looks like a real name
  for (const c of ingredientChanges) {
    if (
      c.ingredientName &&
      c.ingredientName !== c.ingredientId &&
      c.ingredientName.length > 3 &&
      !c.ingredientName.startsWith('PI')
    ) {
      idToName[c.ingredientId] = c.ingredientName;
    }
  }

  // Strategy 2: fetch all PO items and match by purchaseitemId / randomId
  const unresolved1 = ids.filter((id) => !idToName[id]);
  if (unresolved1.length > 0) {
    try {
      const poResult = await dispatch(fetchPO({ page: 1, limit: 50, search: '' })).unwrap() as { result?: POItems[] };
      const poList: POItems[] = poResult?.result ?? [];
      for (const iid of unresolved1) {
        const matched = poList.find(
          (p) => p.purchaseitemId === iid || p.randomId === iid,
        );
        if (matched?.itemName) idToName[iid] = matched.itemName;
      }
    } catch { /* skip */ }
  }

  // Strategy 3: direct search per unresolved ID
  const unresolved2 = ids.filter((id) => !idToName[id]);
  for (const iid of unresolved2) {
    try {
      const searchResult = await dispatch(fetchPO({ page: 1, limit: 50, search: iid })).unwrap() as { result?: POItems[] };
      const found = (searchResult?.result ?? []).find(
        (p) => p.purchaseitemId === iid || p.randomId === iid,
      );
      if (found?.itemName) idToName[iid] = found.itemName;
    } catch { /* skip */ }
  }

  // Strategy 4: price matching against recipe ingredients
  const unresolved3 = ids.filter((id) => !idToName[id]);
  for (const iid of unresolved3) {
    const change = ingredientChanges.find((c) => c.ingredientId === iid);
    if (!change) continue;
    const storedCost = change.storedPerGramCost ?? change.oldPerGramCost ?? 0;
    const candidates = recipeIngredients.filter(
      (ing) => Math.abs(ing.perGramCost - storedCost) < 0.001,
    );
    if (candidates.length === 1) {
      idToName[iid] = candidates[0].ingredients;
    } else if (candidates.length > 1) {
      const oldTC = change.oldTotalCost ?? 0;
      const exact = candidates.find((ing) => Math.abs(ing.totalCost - oldTC) < 1);
      idToName[iid] = (exact ?? candidates[0]).ingredients;
    } else {
      idToName[iid] = iid;
    }
  }

  // Strategy 5: partial string match
  const unresolved4 = ids.filter((id) => !idToName[id]);
  for (const iid of unresolved4) {
    const partial = recipeIngredients.find((ing) =>
      ing.ingredients.toUpperCase().includes(iid.toUpperCase()),
    );
    if (partial?.ingredients) idToName[iid] = partial.ingredients;
    else idToName[iid] = iid; // absolute fallback
  }

  return idToName;
}

function buildVarianceMaps(
  rawChanges: VarianceApiIngredientChange[],
  idToName: Record<string, string>,
  recipeIngredients: IngredientItem[],   // ← add this parameter
): {
  pendingMap: Record<string, PendingVarianceEntry>;
  resolvedChanges: ResolvedIngredientChange[];
} {
  const pendingMap: Record<string, PendingVarianceEntry> = {};
  const resolvedChanges: ResolvedIngredientChange[] = [];

  for (const c of rawChanges) {
    const resolvedName = idToName[c.ingredientId] ?? c.ingredientName ?? c.ingredientId;

    const oldPGC = c.storedPerGramCost ?? c.oldPerGramCost ?? 0;
    const newPGC = c.currentPerGramCost ?? c.newPerGramCost ?? 0;
    const oldTC = c.oldTotalCost ?? 0;
    const newTC = c.newTotalCost ?? c.currentTotalCost ?? 0;
    const pct = c.priceChangePercent ?? c.costDifferencePercent ?? 0;
    const bQty = c.batchQty ?? c.qty ?? 0;

    // ── FIX: derive GST from actual stored ingredient GST ratio ──
    const storedIng = recipeIngredients.find((ing) => ing.ingredients === resolvedName);
    let currentGST = 0;
    if (storedIng && storedIng.totalCost > 0 && storedIng.GST > 0) {
      // Use the same GST rate ratio as stored
      const gstRate = storedIng.GST / storedIng.totalCost;
      currentGST = newTC * gstRate;
    }
    // If storedIng.GST === 0, currentGST stays 0 — correct for BUFFALO MILK

    pendingMap[resolvedName] = {
      currentPerGramCost: newPGC,
      currentTotalCost: newTC,
      currentGST,              // ← now correctly 0 for zero-tax ingredients
      oldPerGramCost: oldPGC,
      oldTotalCost: oldTC,
      priceChangePercent: pct,
      ingredientId: c.ingredientId,
    };

    resolvedChanges.push({
      ingredientId: c.ingredientId,
      ingredientName: resolvedName,
      oldPerGramCost: oldPGC,
      newPerGramCost: newPGC,
      priceChangePercent: pct,
      oldTotalCost: oldTC,
      newTotalCost: newTC,
      batchQty: bQty,
    });
  }

  return { pendingMap, resolvedChanges };
}


// ─── Main Component ───────────────────────────────────────────────────────────
const CreateRecipePage: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const recipeId = searchParams?.get('recipeId') ?? null;

  const {
    recipes,
    currentRecipe,
    product,
    poItems,
    currentPage,
    isFetchingItems,
    hasMoreItems,
    loading,
    dateTime,
    sfgRecipes,
    variance,
    varianceLoading,
  } = useSelector((state: RootState) => state.recipe);

  // ─── State ────────────────────────────────────────────────────────────────
  const [isEditing] = useState(!!recipeId);
  const [itemType, setItemType] = useState<string>('');
  const [itemName, setItemName] = useState<string>('');
  const [kitPrepare, setKitPrepare] = useState<number>(1);
  const [isLoading, setIsLoading] = useState(true);
  const [uom, setUom] = useState<string>('');
  const [sellingCost, setSellingCost] = useState<SellingCostState>({
    sellingCostKg: 0, sellingCostPcs: 0, totalSellingCost: 0,
  });
  const [totalServings, setTotalServings] = useState<number>(0);
  const [gramsOrPcs, setGramsOrPcs] = useState<number>(0);
  const [ingredient, setIngredient] = useState<string>('');
  const [kitQty, setKitQty] = useState<number>(0);
  const [bakingWeightLoss, setBakingWeightLoss] = useState<number>(0);
  const [TotalServKitQty, setTotalServeKitQty] = useState<number>(0);
  const [ingredients, setIngredients] = useState<IngredientItem[]>([]);
  const [nutritionInfo, setNutritionInfo] = useState<string[]>([]);
  const [cuisine, setCuisine] = useState<string>('');
  const [dietaryRestriction, setDietaryRestriction] = useState<string>('');
  const [storageInstruction, setStorageInstruction] = useState<string>('');
  const [, setPreparationTime] = useState<string>('');
  const [, setCookingTime] = useState<string>('');
  const [, setTotalTime] = useState<string>('');
  const [steps, setSteps] = useState<{ content: string; isEditing: boolean }[]>([]);
  const [remark, setRemark] = useState<string>('');
  const [, setPcs] = useState<number>(0);
  const [wastage, setWastage] = useState<number>(0);
  const [others, setOthers] = useState<number>(0);
  const [allConsumables, setAllConsumables] = useState<string[]>([]);
  const [consumablesSelected, setConsumablesSelected] = useState<string[]>([]);
  const [consumableValues, setConsumableValues] = useState<{ [key: string]: { percentage: number } }>({});
  const [openDialog, setOpenDialog] = useState<boolean>(false);
  const [openSubKitDialog, setOpenSubKitDialog] = useState<boolean>(false);
  const [selectedSubKit, setSelectedSubKit] = useState<Recipe | null>(null);
  const [requiredQty, setRequiredQty] = useState<number>(0);
  const [subKitIndex, setSubKitIndex] = useState<number>(-1);
  const [openConsumableDialog, setOpenConsumableDialog] = useState<boolean>(false);
  const [openValidationDialog, setOpenValidationDialog] = useState<boolean>(false);
  const [openIngredientValidationDialog, setOpenIngredientValidationDialog] = useState<boolean>(false);
  const [newConsumableName, setNewConsumableName] = useState<string>('');
  const [consumableError, setConsumableError] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [ingredientSearchQuery, setIngredientSearchQuery] = useState<string>('');
  const [totalCostValue, setTotalCostValue] = useState<number>(0);
  const [profitValue, setProfitValue] = useState<number>(0);
  const [profitPercentage, setProfitPercentage] = useState<number>(0);
  const [consumablePrice, setConsumablePrice] = useState<number>(0);
  const [GSTPrice, setGstPrice] = useState<number>(0);
  const [category, setCategory] = useState<string>('');
  const [subCategory, setSubCategory] = useState<string>('');
  const [editConfirmationDialogOpen, setEditConfirmationDialogOpen] = useState(false);
  const [closeConfirmationDialogOpen, setCloseConfirmationDialogOpen] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [calculatedIngredients, setCalculatedIngredients] = useState<IngredientItem[]>([]);
  const [totalQty, setTotalQty] = useState<number>(0);
  const [totalEstimateQty, setTotalEstimateQty] = useState<number>(0);
  const [afterBakingOutput, setAfterBakingOutput] = useState<number>(0);
  const [totalCost, setTotalCost] = useState<number>(0);
  const [GST, setTotalGST] = useState<number>(0);
  const [perGramWeight, setPerGramWeight] = useState<number>(0);
  const [perPcsValue, setPerPcsValue] = useState<number>(0);
  const [perPieceWeight, setPerPieceWeight] = useState<number>(0);
  const [tempQtyValues, setTempQtyValues] = useState<{ [index: number]: string }>({});
  const [tempStepValues, setTempStepValues] = useState<{ [index: number]: string }>({});
  const [validationErrors, setValidationErrors] = useState({
    itemType: '', itemName: '', consumables: '', totalServings: '',
  });

  // ─── Variance state ───────────────────────────────────────────────────────
  const [hasCommitted, setHasCommitted] = useState(false);
  const [preCommitIngredients, setPreCommitIngredients] = useState<IngredientItem[]>([]);
  const [committedVarianceId, setCommittedVarianceId] = useState<string | null>(null);
  const [inlineVarianceMap, setInlineVarianceMap] = useState<Record<string, InlineVarianceEntry>>({});
  const [deleteConfirmationDialogOpen, setDeleteConfirmationDialogOpen] = useState(false);
  const [varianceDialogOpen, setVarianceDialogOpen] = useState(false);
  const [selectedVariance, setSelectedVariance] = useState<VarianceNotification | null>(null);
  const [deleteIngredientIndex, setDeleteIngredientIndex] = useState<number>(-1);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const fullScreenContainerRef = useRef<HTMLDivElement | null>(null);

  // Old-value snapshots (captured before commit, cleared after revert)
  const [oldPerGramWeight, setOldPerGramWeight] = useState<number | null>(null);
  const [oldPerPcsValue, setOldPerPcsValue] = useState<number | null>(null);
  const [oldProfitValue, setOldProfitValue] = useState<number | null>(null);
  const [oldProfitPercentage, setOldProfitPercentage] = useState<number | null>(null);

  // pendingVarianceMap: keyed by ingredient display name → new-price data
  const [pendingVarianceMap, setPendingVarianceMap] = useState<Record<string, PendingVarianceEntry>>({});

  // currentVarianceLog: resolved log for this recipe (drives Commit button)
  const [currentVarianceLog, setCurrentVarianceLog] = useState<CurrentVarianceLog | null>(null);

  // ─── Version preview state ────────────────────────────────────────────────
  const [versionDialogOpen, setVersionDialogOpen] = useState(false);
  const [versionPreviewActive, setVersionPreviewActive] = useState(false);
  const [previewIngredients, setPreviewIngredients] = useState<IngredientItem[]>([]);
  const [previewSourceVersion, setPreviewSourceVersion] = useState<RecipeVersionDoc | null>(null);
  const [versionSnapshot, setVersionSnapshot] = useState<VersionPreviewSnapshot | null>(null);
  const versionHistory = useSelector((state: RootState) => state.recipe.versionHistory);

  const [subkitKitDialogOpen, setSubkitKitDialogOpen] = useState(false);
  const [pendingSubkitPayload, setPendingSubkitPayload] = useState<Recipe | null>(null);

  const [updateSuccess, setUpdateSuccess] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // ─── Debounced search ─────────────────────────────────────────────────────
  const debouncedItemSearch = useMemo(
    () => debounce((query: string) => { dispatch(fetchItems({ page: 1, limit: 50, search: query })); }, 200),
    [dispatch],
  );
  const debouncedIngredientSearch = useMemo(
    () => debounce((query: string) => { dispatch(fetchPO({ page: 1, limit: 50, search: query })); }, 200),
    [dispatch],
  );

  // ─── Mount effect ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isEditing) { dispatch(fetchSFG()); }
  }, [dispatch, isEditing]);

  // ─── Core data-fetch effect ───────────────────────────────────────────────
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);

      // Reset all variance state before fetch
      setCurrentVarianceLog(null);
      setPendingVarianceMap({});
      setInlineVarianceMap({});
      setHasCommitted(false);
      setCommittedVarianceId(null);
      setPreCommitIngredients([]);

      try {
        if (recipeId && isEditing) {
          // Step 1: fetch recipe
          const recipe = await dispatch(fetchRecipeById(recipeId)).unwrap() as Recipe;
          if (recipe.itemType !== 'SUBKIT') { dispatch(fetchSFG()); }

          const RECIPEID = recipe.RECIPEID;

          // Step 2: check real-time variance
          const varianceResult = await dispatch(checkRecipeVariance(RECIPEID)).unwrap() as VarianceApiResponse;

          const rawChanges: VarianceApiIngredientChange[] =
            varianceResult?.ingredientChanges ?? [];

          const showsVariance =
            (varianceResult?.hasVariance === true ||
              varianceResult?.hasAlerts === true) &&
            rawChanges.length > 0;

          if (showsVariance) {
            const recipeIngredients: IngredientItem[] =
              recipe.ingredients?.addedIngrediant ?? [];

            // Resolve IDs → names
            const idToName = await resolveIngredientNames(
              rawChanges,
              recipeIngredients,
              dispatch,
            );

            // Build maps
            const { pendingMap, resolvedChanges } = buildVarianceMaps(rawChanges, idToName, recipeIngredients);

            setCurrentVarianceLog({
              id: varianceResult.id ?? recipeId,
              ingredientChanges: resolvedChanges,
            });
            setPendingVarianceMap(pendingMap);
          }

          // dispatch(fetchVarianceNotifications());
        }

        // Consumables
        const consumablesResult = await dispatch(fetchConsumables()).unwrap() as Consumable[];
        if (consumablesResult) {
          const names = consumablesResult.map((item) => item.name);
          setAllConsumables(names);
          if (!isEditing) {
            setConsumablesSelected(names);
            setConsumableValues(
              names.reduce<Record<string, { percentage: number }>>(
                (acc, name) => ({ ...acc, [name]: { percentage: 0 } }),
                {},
              ),
            );
          }
        }

        if (!isEditing) { dispatch(fetchItems({ page: 1, limit: 50, search: '' })); }
        dispatch(fetchPO({ page: 1, limit: 50, search: '' }));


        if (!isEditing) {
          try {
            await dispatch(fetchAllRecipeItemNames()).unwrap();
          } catch (error: unknown) {
            console.warn('⚠️ Could not fetch all item names for duplicate detection:', error);
          }
        }

      } catch (error: unknown) {
        console.error('❌ Error fetching data:', error);
      } finally {
        setTimeout(() => { setIsLoading(false); }, 100);
      }
    };

    fetchData();

    return () => {
      debouncedItemSearch.clear();
      debouncedIngredientSearch.clear();
    };
  }, [dispatch, recipeId, isEditing, debouncedItemSearch, debouncedIngredientSearch]);

  // ─── SubKit structure processing ──────────────────────────────────────────
  const processSubkitStructure = useCallback(
    (ings: IngredientItem[], isSubkitRecipe = false): IngredientItem[] => {
      if (isSubkitRecipe) return ings;
      if (isEditing) {
        return ings.map((ing) => {
          const matchingSubkitRecipe = sfgRecipes.find(
            (r) => r.itemType === 'SUBKIT' && r.createRecipe?.itemName === ing.ingredients,
          );
          if (matchingSubkitRecipe) return { ...ing, isSubKitHeader: true, isSubKitSelection: false };
          return ing;
        });
      }
      const processedIngredients: IngredientItem[] = [];
      const subkitIngredients = new Map<string, IngredientItem[]>();
      const regularIngredients: IngredientItem[] = [];
      ings.forEach((ing) => {
        if (ing.isSubKitHeader) {
          processedIngredients.push(ing);
        } else if (ing.isSubKitSelection) {
          return;
        } else {
          const matchingRecipe = sfgRecipes.find(
            (r) =>
              r.itemType === 'SUBKIT' &&
              r.ingredients?.addedIngrediant?.some((sub) => sub.ingredients === ing.ingredients),
          );
          if (matchingRecipe) {
            const subkitName = matchingRecipe.createRecipe?.itemName ?? '';
            if (!subkitIngredients.has(subkitName)) subkitIngredients.set(subkitName, []);
            subkitIngredients.get(subkitName)?.push(ing);
          } else {
            regularIngredients.push(ing);
          }
        }
      });
      processedIngredients.push(...regularIngredients);
      subkitIngredients.forEach((subIngs, subkitName) => {
        const subkitHeader: IngredientItem = {
          ingredients: subkitName, kitQty: 0, uom: '', batchQty: 0,
          perGramCost: 0, totalCost: 0, haveIt: true, GST: 0, isSubKitHeader: true,
        };
        processedIngredients.push(subkitHeader, ...subIngs);
      });
      return processedIngredients;
    },
    [isEditing, sfgRecipes],
  );

  // ─── Load recipe into form on edit ───────────────────────────────────────
  useEffect(() => {
    if (!isLoading && isEditing && currentRecipe) {
      setItemType(currentRecipe.itemType ?? '');
      setItemName(currentRecipe.createRecipe?.itemName ?? '');
      setKitPrepare(currentRecipe.createRecipe?.kitPrepare ?? 1);
      setUom(currentRecipe.createRecipe?.UOM ?? '');
      setTotalServings(currentRecipe.createRecipe?.totalServings ?? 0);
      setGramsOrPcs(currentRecipe.createRecipe?.gramsOrPcs ?? 0);
      const processedIngredients = currentRecipe.ingredients?.addedIngrediant ?? [];
      const ingredientsWithSubkitStructure = processSubkitStructure(
        processedIngredients,
        currentRecipe.itemType === 'SUBKIT',
      );
      setIngredients(ingredientsWithSubkitStructure);
      setNutritionInfo(currentRecipe.assignFields?.nutritionInfo ?? []);
      setCuisine(currentRecipe.assignFields?.cuisine ?? '');
      setDietaryRestriction(currentRecipe.assignFields?.dietaryRestriction ?? '');
      setStorageInstruction(currentRecipe.assignFields?.storageInstruction ?? '');
      setPreparationTime(currentRecipe.timing?.preparationTime ?? '');
      setCookingTime(currentRecipe.timing?.cookingTime ?? '');
      setTotalTime(currentRecipe.timing?.totalTime ?? '');
      setSteps(
        currentRecipe.instruction?.stepByStepInstructions
          ? currentRecipe.instruction.stepByStepInstructions.split('\n').map((step, index) => ({
            content: step.replace(`Step ${index + 1}: `, ''), isEditing: false,
          }))
          : [],
      );
      setRemark(currentRecipe.remark ?? '');
      setPcs(currentRecipe.afterBaking?.bakingOutputPcs ?? 0);
      setBakingWeightLoss(currentRecipe.timing?.bakingWeightLoss ?? 0);
      setSellingCost({
        sellingCostKg: currentRecipe.sellingCost?.sellingCostKg ?? 0,
        sellingCostPcs: currentRecipe.sellingCost?.sellingCostPcs ?? 0,
        totalSellingCost: currentRecipe.sellingCost?.totalSellingCost ?? 0,
      });
      setWastage(currentRecipe.rawMaterial?.wastage ?? 0);
      setOthers(currentRecipe.rawMaterial?.others ?? 0);
      setTotalGST(currentRecipe.rawMaterial?.GST ?? 0);
      setTotalQty(currentRecipe.totals?.totalQty ?? 0);
      setTotalEstimateQty(currentRecipe.productOutput?.productOutputGrams ?? 0);
      setPerGramWeight(currentRecipe.perPieceWeight?.perGramWeight ?? 0);
      setPerPcsValue(currentRecipe.perPieceWeight?.perPieceWeight ?? 0);
      setPerPieceWeight(currentRecipe.perPieceWeight?.PcsWeight ?? 0);
      setProfitValue(currentRecipe.profit?.profit ?? 0);
      const totalSellingCost = currentRecipe.sellingCost?.totalSellingCost ?? 0;
      setProfitPercentage(
        totalSellingCost ? ((currentRecipe.profit?.profit ?? 0) / totalSellingCost) * 100 : 0,
      );
      setCategory(currentRecipe.fields?.category ?? '');
      setSubCategory(currentRecipe.fields?.subCategory ?? '');
      if (currentRecipe.rawMaterial?.consumables?.items) {
        const validItems = currentRecipe.rawMaterial.consumables.items.filter(
          (item) => item.name && item.name.trim() !== '',
        );
        setConsumablesSelected(validItems.map((item) => item.name));
        setConsumableValues(
          validItems.reduce<Record<string, { percentage: number }>>(
            (acc, item) => ({ ...acc, [item.name]: { percentage: item.percentage ?? 0 } }),
            {},
          ),
        );
      }
    }
  }, [isLoading, isEditing, currentRecipe, processSubkitStructure]);

  // ─── Selling cost effect ──────────────────────────────────────────────────
  useEffect(() => {
    if (isEditing) {
      if (!uom) return;
      const uomLower = uom.toLowerCase();
      if (uomLower === 'kgs' || uomLower === 'kg') {
        const totalSellingCost = (sellingCost.sellingCostKg ?? 0) * (afterBakingOutput / 1000);
        const estimatedTotalPcs = gramsOrPcs ? (afterBakingOutput / gramsOrPcs) : 0;
        const sellingCostForPcs = estimatedTotalPcs ? (totalSellingCost / estimatedTotalPcs) : 0;
        setSellingCost({
          sellingCostKg: sellingCost.sellingCostKg ?? 0,
          sellingCostPcs: Number(sellingCostForPcs.toFixed(2)),
          totalSellingCost: Number(totalSellingCost.toFixed(2)),
        });
      } else if (uomLower === 'pcs') {
        const sellingCostPcs = sellingCost.sellingCostPcs ?? 0;
        const sellingCostKg = afterBakingOutput
          ? ((sellingCostPcs * TotalServKitQty) / afterBakingOutput) * 1000 : 0;
        const totalSellingCost = sellingCostPcs * TotalServKitQty;
        setSellingCost({
          sellingCostKg: Number(sellingCostKg.toFixed(2)),
          sellingCostPcs,
          totalSellingCost: Number(totalSellingCost.toFixed(2)),
        });
      }
      return;
    }
    if (itemName) {
      const selectedItem = product.find((item) => item.varianceName === itemName);
      if (selectedItem) {
        const uomLower = selectedItem.variance_Uom?.toLowerCase();
        if (uomLower === 'kgs' || uomLower === 'kg') {
          const totalSellingCost = (selectedItem.variance_Defaultprice ?? 0) * (afterBakingOutput / 1000);
          const estimatedTotalPcs = gramsOrPcs ? (afterBakingOutput / gramsOrPcs) : 0;
          const sellingCostForPcs = estimatedTotalPcs ? (totalSellingCost / estimatedTotalPcs) : 0;
          setSellingCost({
            sellingCostKg: selectedItem.variance_Defaultprice ?? 0,
            sellingCostPcs: Number(sellingCostForPcs.toFixed(2)),
            totalSellingCost: Number(totalSellingCost.toFixed(2)),
          });
        } else if (uomLower === 'pcs') {
          const sellingCostPcs = selectedItem.variance_Defaultprice ?? 0;
          const sellingCostKg = afterBakingOutput
            ? ((sellingCostPcs * TotalServKitQty) / afterBakingOutput) * 1000 : 0;
          const totalSellingCost = sellingCostPcs * TotalServKitQty;
          setSellingCost({
            sellingCostKg: Number(sellingCostKg.toFixed(2)),
            sellingCostPcs,
            totalSellingCost: Number(totalSellingCost.toFixed(2)),
          });
        }
        setUom(selectedItem.variance_Uom);
        setValidationErrors((prev) => ({
          ...prev, gst: Number(selectedItem.tax) > 0 ? '' : 'Required',
        }));
      } else {
        setSellingCost({ sellingCostKg: 0, sellingCostPcs: 0, totalSellingCost: 0 });
        setUom('');
        setValidationErrors((prev) => ({ ...prev, gst: 'Required' }));
      }
    } else {
      setSellingCost({ sellingCostKg: 0, sellingCostPcs: 0, totalSellingCost: 0 });
      setUom('');
      setValidationErrors((prev) => ({ ...prev, gst: 'Required' }));
    }
  }, [
    itemName, product, totalServings, afterBakingOutput, totalEstimateQty,
    gramsOrPcs, TotalServKitQty, isEditing, uom,
    sellingCost.sellingCostKg, sellingCost.sellingCostPcs,
  ]);

  const totalConsumablePercentage = consumablesSelected.reduce(
    (acc, curr) => acc + (consumableValues[curr]?.percentage ?? 0), 0,
  );

  // ─── Ingredient calculation effect ───────────────────────────────────────
  useEffect(() => {
    const updatedIngredients = ingredients.map((ing) => {
      const selectedPOItem = poItems.find((item) => item.itemName === ing.ingredients);
      const kQty = ing.kitQty ?? 0;
      //  const purchasePrice = selectedPOItem?.purchasePrice ?? ing.perGramCost * 1000 ?? 0;
      const purchasePrice = selectedPOItem?.purchasePrice ?? (ing.perGramCost * 1000);
      const batchQty = kQty * kitPrepare;
      const perGramCost = selectedPOItem
        ? computePerGramCost(purchasePrice, selectedPOItem.uom, selectedPOItem.itemName)
        : ing.perGramCost;
      const totalCost = perGramCost * batchQty;
      let gst = 0;
      if (selectedPOItem && selectedPOItem.purchasetaxName > 0) {
        gst = totalCost * (selectedPOItem.purchasetaxName / 100);
      } else if (!selectedPOItem && ing.GST > 0 && ing.totalCost > 0 && totalCost > 0) {
        // Only carry over GST ratio if no PO item found (i.e., using stored data)
        gst = (ing.GST / ing.totalCost) * totalCost;
      }

      return {
        ...ing,
        uom: selectedPOItem?.uom ?? ing.uom ?? '',
        kitQty: kQty, batchQty, perGramCost, totalCost, GST: gst,
      };
    });
    setCalculatedIngredients(updatedIngredients);

    const totalQtyCalc = updatedIngredients.reduce((sum, ing) => sum + (ing.haveIt ? ing.kitQty : 0), 0);
    const totalEstimateQtyCalc = updatedIngredients.reduce((sum, ing) => sum + (ing.haveIt ? ing.batchQty : 0), 0);
    setTotalQty(totalQtyCalc);
    setTotalEstimateQty(totalEstimateQtyCalc);
    const TotalKToutput = totalServings * kitPrepare;
    setTotalServeKitQty(TotalKToutput);
    const afterBakingOutputCalc = uom.toLowerCase() === 'pcs'
      ? totalEstimateQtyCalc - bakingWeightLoss
      : TotalServKitQty - bakingWeightLoss;
    setAfterBakingOutput(afterBakingOutputCalc);
    const totalCostCalc = updatedIngredients.reduce((sum, ing) => sum + (ing.haveIt ? ing.totalCost : 0), 0);
    setTotalCost(totalCostCalc);
    const totalGSTCalc = updatedIngredients.reduce((sum, ing) => sum + (ing.haveIt ? ing.GST : 0), 0);
    setTotalGST(totalGSTCalc);
    setPerGramWeight(afterBakingOutputCalc ? (totalCostCalc / afterBakingOutputCalc) * 1000 : 0);
    setPerPcsValue(
      uom.toLowerCase() === 'pcs'
        ? (TotalServKitQty ? totalCostCalc / TotalServKitQty : 0)
        : (totalCostCalc ? totalCostCalc / (afterBakingOutputCalc / gramsOrPcs) : 0),
    );
    setPerPieceWeight(afterBakingOutputCalc ? afterBakingOutputCalc / gramsOrPcs : 0);
    const consumablePriceCalc = (totalCostCalc * totalConsumablePercentage) / 100;
    setConsumablePrice(consumablePriceCalc);
    const GSTPrice = GST;
    setGstPrice(GSTPrice);
    const totalSellingCost = sellingCost.sellingCostPcs * TotalServKitQty;
    const totalSellingCostKg = (sellingCost.sellingCostKg * afterBakingOutputCalc) / 1000;
    const totalSellingcost = uom.toLowerCase() === 'pcs' ? totalSellingCost : totalSellingCostKg;
    setTotalCostValue(Number(totalSellingcost.toFixed(2)));
    const totalCostWithExtras =
      totalCostCalc +
      consumablePriceCalc +
      (totalCostCalc * wastage / 100) +
      (totalCostCalc * others / 100) +
      GSTPrice;
    const profitCalc = uom.toLowerCase() === 'pcs'
      ? totalSellingCost - totalCostWithExtras
      : totalSellingCostKg - totalCostWithExtras;
    const sellingCostForPercentage = uom.toLowerCase() === 'pcs' ? totalSellingCost : totalSellingCostKg;
    setProfitValue(Number(profitCalc.toFixed(2)));
    setProfitPercentage(
      sellingCostForPercentage
        ? Number(((profitCalc / sellingCostForPercentage) * 100).toFixed(2))
        : 0,
    );
  }, [
    TotalServKitQty, ingredients, kitPrepare, bakingWeightLoss,
    totalServings, poItems, consumablesSelected, consumableValues,
    wastage, others, GST, sellingCost, uom, gramsOrPcs, totalConsumablePercentage,
  ]);

  // ─── Per-gram cost computation ────────────────────────────────────────────
  const computePerGramCost = (purchasePrice: number, itemUom: string, iName: string): number => {
    const uomUpper = itemUom.toUpperCase();
    if (['PCS', 'PIECE', 'PIECES', 'PC', 'PKT', 'PKTS', 'NOS', 'NO'].includes(uomUpper)) {
      const weightGrams = extractWeightFromName(iName);
      if (weightGrams && weightGrams > 0) return purchasePrice / weightGrams;
      return purchasePrice;
    }
    return purchasePrice / 1000;
  };

  // ─── Search handlers ──────────────────────────────────────────────────────
  const handleSearchItems = (query: string) => { setSearchQuery(query); debouncedItemSearch(query); };
  const handleSearchIngredients = (query: string) => { setIngredientSearchQuery(query); debouncedIngredientSearch(query); };
  const handleClearSearch = (type: 'items' | 'ingredients') => {
    if (type === 'items') { setSearchQuery(''); dispatch(fetchItems({ page: 1, limit: 50, search: '' })); }
    else { setIngredientSearchQuery(''); dispatch(fetchPO({ page: 1, limit: 50, search: '' })); }
  };
  const handleLoadMoreItems = (type: 'items' | 'ingredients') => {
    if (hasMoreItems && !isFetchingItems) {
      if (type === 'items') { dispatch(fetchItems({ page: currentPage + 1, limit: 50, search: searchQuery })); }
      else { dispatch(fetchPO({ page: currentPage + 1, limit: 50, search: ingredientSearchQuery })); }
    }
  };

  // ─── Validation ───────────────────────────────────────────────────────────
  const validateFields = () => {
    const errors = { itemName: '', consumables: '', totalServings: '', itemType: '' };
    let isValid = true;
    if (!itemName.trim()) { errors.itemName = 'Item name is required'; isValid = false; }
    if (consumablesSelected.length === 0) { errors.consumables = 'Required'; isValid = false; }
    if (totalServings <= 0) { errors.totalServings = 'Required'; isValid = false; }
    if (!itemType.trim()) { errors.itemType = 'Item Type is Required'; isValid = false; }
    setValidationErrors(errors);
    return isValid;
  };

  const validateIngredients = () => {
    const emptyIngredientIndex = ingredients.findIndex(
      (ing) => !ing.isSubKitHeader && !ing.isSubKitSelection && (!ing.ingredients || ing.ingredients.trim() === ''),
    );
    if (emptyIngredientIndex !== -1) {
      setOpenIngredientValidationDialog(true);
      setSnackbarMessage('Please select an ingredient before adding a new one.');
      setSnackbarOpen(true);
      return false;
    }
    return true;
  };

  // ─── Ingredient handlers ──────────────────────────────────────────────────
  const handleAddIngredient = () => {
    setHasUnsavedChanges(true);
    if (!itemName.trim()) { setOpenIngredientValidationDialog(true); return; }
    if (!validateIngredients()) return;
    const selectedPOItem = poItems.find((item) => item.itemName === ingredient);
    const purchasePrice = selectedPOItem?.purchasePrice ?? 0;
    const batchQty = kitQty * kitPrepare;
    const perGramCost = selectedPOItem
      ? computePerGramCost(purchasePrice, selectedPOItem.uom, selectedPOItem.itemName) : 0;
    const totalCost = perGramCost * batchQty;
    // const gst = selectedPOItem?.purchasetaxName ? (totalCost * (selectedPOItem.purchasetaxName / 100)) : 0;

    // AFTER (already correct, but make explicit):
    const gst = (selectedPOItem && selectedPOItem.purchasetaxName > 0)
      ? (totalCost * (selectedPOItem.purchasetaxName / 100))
      : 0;

    const newIngredient: IngredientItem = {
      ingredients: ingredient, kitQty, uom: selectedPOItem?.uom ?? '',
      batchQty, perGramCost, totalCost, haveIt: true, GST: gst,
    };
    setIngredients((prev) => {
      const firstSubKitHeaderIndex = prev.findIndex((ing) => ing.isSubKitHeader);
      if (firstSubKitHeaderIndex === -1) return [...prev, newIngredient];
      const newList = [...prev];
      newList.splice(firstSubKitHeaderIndex, 0, newIngredient);
      return newList;
    });
    setIngredient('');
    setKitQty(0);
  };

  const handleIngredientChange = (
    index: number,
    field: keyof IngredientItem,
    value: string | number | boolean,
  ) => {
    if (updateSuccess) setUpdateSuccess(false); // ← ADD THIS
    const newIngredients = [...ingredients];
    if (field === 'ingredients') {
      const selectedPOItem = poItems.find((item) => item.itemName === value);
      const kQty = newIngredients[index].kitQty ?? 0;
      // const purchasePrice = selectedPOItem?.purchasePrice ?? newIngredients[index].perGramCost * 1000 ?? 0;
      const purchasePrice = selectedPOItem?.purchasePrice ?? (newIngredients[index].perGramCost * 1000);
      const batchQty = kQty * kitPrepare;
      const perGramCost = selectedPOItem
        ? computePerGramCost(purchasePrice, selectedPOItem.uom, selectedPOItem.itemName)
        : purchasePrice / 1000;
      const totalCost = perGramCost * batchQty;
      // AFTER:
      const gst = (selectedPOItem && selectedPOItem.purchasetaxName > 0)
        ? (totalCost * (selectedPOItem.purchasetaxName / 100))
        : 0;


      newIngredients[index] = {
        ...newIngredients[index],
        ingredients: value as string,
        uom: selectedPOItem?.uom ?? newIngredients[index].uom ?? '',
        kitQty: kQty, perGramCost, totalCost, GST: gst,
      };
      // REPLACE WITH:
    } else if (field === 'kitQty') {
      const parsedValue = value === '' ? 0 : parseFloat(value as string);
      if (!isNaN(parsedValue)) {
        const selectedPOItem = poItems.find((item) => item.itemName === newIngredients[index].ingredients);
        const purchasePrice = selectedPOItem?.purchasePrice ?? (newIngredients[index].perGramCost * 1000);
        const batchQty = parsedValue * kitPrepare;
        const perGramCost = selectedPOItem
          ? computePerGramCost(purchasePrice, selectedPOItem.uom, selectedPOItem.itemName)
          : newIngredients[index].perGramCost;
        const totalCost = perGramCost * batchQty;

        let gst = 0;
        if (selectedPOItem && selectedPOItem.purchasetaxName > 0) {
          // Live PO item has tax rate — use it
          gst = totalCost * (selectedPOItem.purchasetaxName / 100);
        } else if (newIngredients[index].totalCost > 0 && newIngredients[index].GST > 0) {
          // FIX: No PO item found (or tax=0 on PO), but ingredient had a GST ratio stored.
          // Preserve that ratio scaled to the new total cost.
          const gstRate = newIngredients[index].GST / newIngredients[index].totalCost;
          gst = totalCost * gstRate;
        }

        newIngredients[index] = { ...newIngredients[index], [field]: parsedValue, batchQty, perGramCost, totalCost, GST: gst };
      }

    } else {
      newIngredients[index] = { ...newIngredients[index], [field]: value };
    }
    setIngredients(newIngredients);
  };

  const handleDeleteIngredient = (index: number) => { setHasUnsavedChanges(true); setDeleteIngredientIndex(index); setDeleteConfirmationDialogOpen(true); };

  const handleConfirmDeleteIngredient = () => {
    const index = deleteIngredientIndex;
    if (index < 0) return;
    const newIngredients = [...ingredients];
    const ingredientToDelete = newIngredients[index];
    if (ingredientToDelete.isSubKitHeader) {
      let deleteCount = 1;
      for (let i = index + 1; i < newIngredients.length; i++) {
        if (newIngredients[i].isSubKitHeader || newIngredients[i].isSubKitSelection) break;
        deleteCount++;
      }
      newIngredients.splice(index, deleteCount);
    } else {
      newIngredients.splice(index, 1);
    }
    setIngredients(newIngredients);
    setDeleteConfirmationDialogOpen(false);
    setDeleteIngredientIndex(-1);
  };

  const handleAddSubKit = () => {
    if (!itemName.trim()) { setOpenIngredientValidationDialog(true); return; }
    if (!validateIngredients()) return;
    setIngredients((prev) => [
      ...prev,
      { ingredients: '', kitQty: 0, uom: '', batchQty: 0, perGramCost: 0, totalCost: 0, haveIt: false, GST: 0, isSubKitSelection: true },
    ]);
    setOpenSubKitDialog(true);
    setSubKitIndex(ingredients.length);
  };

  const handleSubKitChange = (recipe: Recipe | null) => { setSelectedSubKit(recipe); setRequiredQty(0); };

  const handleCloseSubKitDialog = () => {
    setOpenSubKitDialog(false);
    setSelectedSubKit(null);
    setRequiredQty(0);
    setSubKitIndex(-1);
    if (subKitIndex >= 0) { setIngredients((prev) => prev.filter((_, i) => i !== subKitIndex)); }
  };

  const handleConfirmSubKit = () => {
    if (!selectedSubKit || subKitIndex < 0) return;
    const subIngs = selectedSubKit.ingredients?.addedIngrediant ?? [];
    const subKitName = selectedSubKit.createRecipe?.itemName ?? '';
    const scalingFactor = requiredQty / (selectedSubKit.createRecipe?.totalServings ?? 1);
    const subKitHeader: IngredientItem = {
      ingredients: subKitName, kitQty: 0, uom: selectedSubKit.createRecipe?.UOM ?? '',
      batchQty: 0, perGramCost: 0, totalCost: 0, haveIt: true, GST: 0,
      isSubKitHeader: true, totalRequiredSubkitQty: requiredQty,
    };
    const newItems = subIngs.map((subIng) => {
      const scaledKitQty = subIng.kitQty * scalingFactor;
      const scaledBatchQty = scaledKitQty * kitPrepare;
      const selectedPOItem = poItems.find((item) => item.itemName === subIng.ingredients);
      //const purchasePrice = selectedPOItem?.purchasePrice ?? subIng.perGramCost * 1000 ?? 0;
      const purchasePrice = selectedPOItem?.purchasePrice ?? (subIng.perGramCost * 1000);
      const perGramCost = selectedPOItem
        ? computePerGramCost(purchasePrice, selectedPOItem.uom, selectedPOItem.itemName)
        : subIng.perGramCost;
      const updatedTotalCost = perGramCost * scaledBatchQty;
      let gst = 0;
      if (selectedPOItem?.purchasetaxName) { gst = updatedTotalCost * (selectedPOItem.purchasetaxName / 100); }
      else if (subIng.GST > 0 && subIng.totalCost > 0) { gst = (subIng.GST / subIng.totalCost) * updatedTotalCost; }
      return {
        ingredients: subIng.ingredients, kitQty: scaledKitQty, uom: subIng.uom,
        batchQty: scaledBatchQty, perGramCost, totalCost: updatedTotalCost, haveIt: subIng.haveIt, GST: gst,
      };
    });
    setIngredients((prev) => {
      const newList = [...prev];
      newList.splice(subKitIndex, 1, subKitHeader, ...newItems);
      return newList;
    });
    setOpenSubKitDialog(false);
    setSelectedSubKit(null);
    setRequiredQty(0);
    setSubKitIndex(-1);
  };

  const handleSelectSubKit = (index: number, selectedRecipe: Recipe) => {
    const subIngs = selectedRecipe.ingredients?.addedIngrediant ?? [];
    const subKitName = selectedRecipe.createRecipe?.itemName ?? '';
    const subKitHeader: IngredientItem = {
      ingredients: subKitName, kitQty: 0, uom: selectedRecipe.createRecipe?.UOM ?? '',
      batchQty: 0, perGramCost: 0, totalCost: 0, haveIt: true, GST: 0,
      isSubKitHeader: true, totalRequiredSubkitQty: selectedRecipe.createRecipe?.totalServings ?? 0,
    };
    const newItems = subIngs.map((subIng) => ({
      ingredients: subIng.ingredients, kitQty: subIng.kitQty, uom: subIng.uom,
      batchQty: subIng.batchQty, perGramCost: subIng.perGramCost,
      totalCost: subIng.totalCost, haveIt: subIng.haveIt, GST: subIng.GST,
    }));
    setIngredients((prev) => {
      const newList = [...prev];
      newList.splice(index, 1, subKitHeader, ...newItems);
      return newList;
    });
  };

  // ─── Consumable handlers ──────────────────────────────────────────────────
  const handleAddConsumable = () => {
    const newName = newConsumableName.trim();
    if (!newName) { setConsumableError('Consumable name cannot be empty'); return; }
    const normalizedNew = newName.toLowerCase().replace(/\s+/g, '');
    const normalizedAll = allConsumables.map((n) => n.toLowerCase().replace(/\s+/g, ''));
    if (normalizedAll.includes(normalizedNew)) { setConsumableError('Consumable already exists'); return; }
    dispatch(addConsumable(newName)).then((result) => {
      if (addConsumable.fulfilled.match(result)) {
        const updated = [...allConsumables, newName];
        setAllConsumables(updated);
        setConsumablesSelected([...consumablesSelected, newName]);
        setConsumableValues({ ...consumableValues, [newName]: { percentage: 0 } });
        setNewConsumableName('');
        setConsumableError('');
        setOpenConsumableDialog(false);
        setValidationErrors((prev) => ({ ...prev, consumables: updated.length > 0 ? '' : 'Required' }));
        dispatch(fetchConsumables());
      } else {
        const errorMessage =
          result.error?.message ??
          (typeof result.payload === 'string' ? result.payload : 'Failed to add consumable');
        setConsumableError(errorMessage);
      }
    }).catch(() => { setConsumableError('Unexpected error occurred while adding consumable'); });
  };

  // ─── Apply new prices from variance changes to ingredient list ─────────────
  const applyVariancePricesToIngredients = (
    prev: IngredientItem[],
    priceChanges: ResolvedIngredientChange[],
    map: Record<string, PendingVarianceEntry>,
  ): IngredientItem[] =>
    prev.map((ing) => {
      const match = priceChanges.find(
        (c) =>
          c.ingredientName === ing.ingredients ||
          c.ingredientId === ing.ingredients ||
          ing.ingredients in map,
      );
      if (!match) return ing;
      const pending = map[ing.ingredients];
      const newPerGramCost = pending?.currentPerGramCost ?? match.newPerGramCost;
      const newTotalCost = newPerGramCost * ing.batchQty;
      const gstRatio = ing.totalCost > 0 ? ing.GST / ing.totalCost : 0;
      return { ...ing, perGramCost: newPerGramCost, totalCost: newTotalCost, GST: newTotalCost * gstRatio };
    });

  // ─── Build inlineVarianceMap from resolved changes ─────────────────────────
  const buildInlineMap = (
    priceChanges: ResolvedIngredientChange[],
    map: Record<string, PendingVarianceEntry>,
  ): Record<string, InlineVarianceEntry> => {
    const newMap: Record<string, InlineVarianceEntry> = {};
    priceChanges.forEach((c) => {
      // Collect all keys that point to this change
      const keys: string[] = [
        c.ingredientName,
        c.ingredientId,
        ...Object.keys(map).filter((k) => map[k]?.currentPerGramCost === c.newPerGramCost),
      ].filter(Boolean);

      keys.forEach((key) => {
        newMap[key] = {
          oldPerGramCost: c.oldPerGramCost,
          newPerGramCost: c.newPerGramCost,
          priceChangePercent: c.priceChangePercent,
        };
      });
    });
    return newMap;
  };

  // ─── COMMIT (direct, from header button) ─────────────────────────────────
  const handleCommitVariance_Direct = async () => {
    if (!currentVarianceLog) return;

    // Snapshot old values before commit
    setOldPerGramWeight(perGramWeight);
    setOldPerPcsValue(perPcsValue);
    setOldProfitValue(profitValue);
    setOldProfitPercentage(profitPercentage);
    setPreCommitIngredients([...ingredients]);
    setCommittedVarianceId(currentVarianceLog.id);

    //await dispatch(commitVariance({ varianceLogId: currentVarianceLog.id }));

    const priceChanges = currentVarianceLog.ingredientChanges;
    if (priceChanges.length > 0) {
      setIngredients((prev) =>
        applyVariancePricesToIngredients(prev, priceChanges, pendingVarianceMap),
      );
      setInlineVarianceMap(buildInlineMap(priceChanges, pendingVarianceMap));
    }

    //  setPendingVarianceMap({});
    setHasCommitted(true);
    setCurrentVarianceLog(null);
    //  dispatch(fetchVarianceNotifications());
  };

  // ─── COMMIT (from dialog) ─────────────────────────────────────────────────
  const handleCommitVariance = async () => {
    if (!selectedVariance) return;

    setPreCommitIngredients([...ingredients]);
    setCommittedVarianceId(selectedVariance.id);

    //  await dispatch(commitVariance({ varianceLogId: selectedVariance.id }));

    const priceChanges: IngredientVarianceChange[] = selectedVariance.ingredientChanges ?? [];
    if (priceChanges.length > 0) {
      setIngredients((prev) =>
        prev.map((ing) => {
          const match = priceChanges.find(
            (c) =>
              c.ingredientId === ing.ingredients ||
              Math.abs(c.oldPerGramCost - ing.perGramCost) < 0.0001,
          );
          if (!match) return ing;
          const newTotalCost = match.newPerGramCost * ing.batchQty;
          const gstRatio = ing.totalCost > 0 ? ing.GST / ing.totalCost : 0;
          return { ...ing, perGramCost: match.newPerGramCost, totalCost: newTotalCost, GST: newTotalCost * gstRatio };
        }),
      );

      const newMap: Record<string, InlineVarianceEntry> = {};
      priceChanges.forEach((c) => {
        const key = c.ingredientName || c.ingredientId;
        newMap[key] = {
          oldPerGramCost: c.oldPerGramCost,
          newPerGramCost: c.newPerGramCost,
          priceChangePercent: c.priceChangePercent,
        };
      });
      setInlineVarianceMap(newMap);
    }

    setHasCommitted(true);
    setVarianceDialogOpen(false);
    setSelectedVariance(null);
    //    dispatch(fetchVarianceNotifications());
  };

  // ─── REVERT ───────────────────────────────────────────────────────────────

  const handleRevertVariance = async () => {
    if (!committedVarianceId || !recipeId) return;

    // ✅ IMMEDIATE UI restore — show Commit button right away
    setIngredients(preCommitIngredients);
    setHasCommitted(false);
    setCommittedVarianceId(null);
    setInlineVarianceMap({});
    setOldPerGramWeight(null);
    setOldPerPcsValue(null);
    setOldProfitValue(null);
    setOldProfitPercentage(null);

    // ✅ Restore currentVarianceLog immediately from preCommitIngredients
    // so the Commit button appears without waiting for the API
    if (currentVarianceLog === null && pendingVarianceMap && Object.keys(pendingVarianceMap).length > 0) {
      // pendingVarianceMap still has the variance data — rebuild a minimal log
      const restoredChanges: ResolvedIngredientChange[] = Object.entries(pendingVarianceMap).map(
        ([name, entry]) => ({
          ingredientId: entry.ingredientId,
          ingredientName: name,
          oldPerGramCost: entry.oldPerGramCost ?? 0,
          newPerGramCost: entry.currentPerGramCost,
          priceChangePercent: entry.priceChangePercent ?? 0,
          oldTotalCost: entry.oldTotalCost ?? 0,
          newTotalCost: entry.currentTotalCost,
          batchQty: 0,
        })
      );
      setCurrentVarianceLog({
        id: committedVarianceId,
        ingredientChanges: restoredChanges,
      });
    }

    // ✅ Background re-fetch to get fresh variance data (non-blocking)
    try {
      const freshRecipe = await dispatch(fetchRecipeById(recipeId)).unwrap() as Recipe;
      const RECIPEID = freshRecipe.RECIPEID;

      const varianceResult = await dispatch(checkRecipeVariance(RECIPEID)).unwrap() as VarianceApiResponse;
      const rawChanges: VarianceApiIngredientChange[] = varianceResult?.ingredientChanges ?? [];

      const stillHasVariance =
        (varianceResult?.hasVariance === true || varianceResult?.hasAlerts === true) &&
        rawChanges.length > 0;

      if (stillHasVariance) {
        const idToName = await resolveIngredientNames(rawChanges, preCommitIngredients, dispatch);
        const { pendingMap, resolvedChanges } = buildVarianceMaps(rawChanges, idToName, preCommitIngredients);

        // Overwrite with fresh data from API
        setPendingVarianceMap(pendingMap);
        setCurrentVarianceLog({
          id: varianceResult.id ?? RECIPEID,
          ingredientChanges: resolvedChanges,
        });
      } else {
        setPendingVarianceMap({});
        setCurrentVarianceLog(null);
      }
    } catch (error: unknown) {
      console.error('❌ Error re-checking variance after revert:', error);
      // UI already restored above — no need to do anything else
    } finally {
      setPreCommitIngredients([]);
    }
  };

  // ─── VERSION PREVIEW HANDLERS ─────────────────────────────────────────────

  const handleOpenVersionDialog = () => {
    if (currentRecipe?.RECIPEID) {
      dispatch(fetchRecipeVersionHistory({ recipeId: currentRecipe.RECIPEID, page: 1, limit: 20 }));
    }
    setVersionDialogOpen(true);
  };


  const handleApplyVersion = (version: RecipeVersionDoc) => {
    const mapped: IngredientItem[] = (version.ingredients || []).map((ing) => ({
      ingredients: ing.ingredientName || ing.ingredientId,
      kitQty: ing.qty ?? 0,
      uom: ing.uom ?? '',
      batchQty: ing.batchQty ?? 0,
      perGramCost: ing.perGramCost ?? 0,
      totalCost: ing.totalCost ?? 0,
      haveIt: ing.haveIt ?? true,
      GST: ing.GST ?? 0,
      isSubkit: false,
    }));

    const vTotalCost = version.totals?.totalIngCost ?? 0;
    const vTotalGST = version.totals?.totalGST ?? 0;
    const vTotalQty = version.totals?.totalKitQty ?? 0;
    const vBatchQty = version.totals?.totalBatchQty ?? 0;
    const vKitPrepare = version.createRecipe?.kitPrepare ?? 1;
    const vTotalServings = version.createRecipe?.totalServings ?? 0;
    const vBakingLoss = version.timing?.bakingWeightLoss ?? 0;       // ← no any
    const vUom = version.createRecipe?.UOM ?? '';
    const vGramsOrPcs = version.createRecipe?.gramsOrPcs ?? 0;

    const vTotalServKitQty = vTotalServings * vKitPrepare;
    const vAfterBaking = vBatchQty - vBakingLoss;
    const vIsPcs = vUom.toLowerCase() === 'pcs';

    const vPerGramWeight = vAfterBaking > 0 ? (vTotalCost / vAfterBaking) * 1000 : 0;
    const vPerPcsValue = vIsPcs
      ? (vTotalServKitQty > 0 ? vTotalCost / vTotalServKitQty : 0)
      : (vTotalCost > 0 && vAfterBaking > 0 && vGramsOrPcs > 0
        ? vTotalCost / (vAfterBaking / vGramsOrPcs) : 0);
    const vPerPieceWeight = vAfterBaking > 0 && vGramsOrPcs > 0
      ? vAfterBaking / vGramsOrPcs : 0;

    const vSellingCostKg = version.sellingCost?.sellingCostKg ?? 0;
    const vSellingCostPcs = version.sellingCost?.sellingCostPcs ?? 0;
    const vTotalSelling = version.sellingCost?.totalSellingCost ?? 0;

    // ── Calculate consumable price from version consumables ──────────────
    const vConsumableItems = version.rawMaterial?.consumables?.items ?? [];  // ← no any
    const vConsumablePct = vConsumableItems.reduce(
      (sum: number, item: { name?: string; percentage?: number }) =>
        sum + (item.percentage ?? 0),
      0
    );
    const vConsumablePrice = (vTotalCost * vConsumablePct) / 100;

    const vGSTPrice = vTotalGST;
    const vProfit = version.profit?.profit ?? 0;
    const vProfitPct = version.profit?.profitPercentage ?? 0;

    setVersionSnapshot({
      totalCost: vTotalCost,
      totalGST: vTotalGST,
      totalQty: vTotalQty,
      totalEstimateQty: vBatchQty,
      TotalServKitQty: vTotalServKitQty,
      afterBakingOutput: vAfterBaking,
      perGramWeight: vPerGramWeight,
      perPcsValue: vPerPcsValue,
      perPieceWeight: vPerPieceWeight,
      profitValue: vProfit,
      profitPercentage: vProfitPct,
      consumablePrice: vConsumablePrice,
      GSTPrice: vGSTPrice,
      totalCostValue: vTotalSelling,
      sellingCostKg: vSellingCostKg,
      sellingCostPcs: vSellingCostPcs,
      totalSellingCost: vTotalSelling,
      bakingWeightLoss: vBakingLoss,
    });

    setPreviewIngredients(mapped);
    setPreviewSourceVersion(version);
    setVersionPreviewActive(true);
    setVersionDialogOpen(false);
  };

  const handleCancelVersionPreview = () => {
    setVersionPreviewActive(false);
    setPreviewIngredients([]);
    setPreviewSourceVersion(null);
    setVersionSnapshot(null);
  };


  // Extracted so both handleAddRecipe and createOrUpdateRecipe can use it
  const buildRecipePayload = (): Recipe => {
    const validIngredients = calculatedIngredients.filter(
      (ing) => (ing.ingredients && ing.ingredients.trim() !== '' && !ing.isSubKitSelection) || ing.isSubKitHeader,
    );
    // const consumableItems = consumablesSelected
    //   .filter((name) => name && name.trim() !== '')
    //   .map((name) => ({ name, percentage: consumableValues[name]?.percentage ?? 0 }));

    const consumableItems = consumablesSelected
      .filter((name) => name && name.trim() !== '')
      .map((name) => {
        const pct = consumableValues[name]?.percentage ?? 0;
        return {
          name,
          percentage: pct,
          price: Number(((totalCost * pct) / 100).toFixed(2)),   // ← NEW
        };
      });


    const estimatedTotalPcs = gramsOrPcs ? (totalEstimateQty / gramsOrPcs) : 0;
    const currentDateTime = dateTime.length > 0 ? dateTime[0] : { current_date: null, current_time: null };
    const formattedDateTime = currentDateTime.current_date && currentDateTime.current_time
      ? `${currentDateTime.current_date}T${currentDateTime.current_time}Z`
      : new Date().toISOString();
    const existingRecipe = isEditing ? recipes.find((r) => r.recipeId === recipeId) : null;

    return {
      recipeId: isEditing ? recipeId ?? Date.now().toString() : Date.now().toString(),
      RECIPEID: isEditing ? (existingRecipe?.RECIPEID ?? '') : '',
      itemType,
      fields: { category, subCategory },
      createRecipe: { itemName, kitPrepare, UOM: uom, totalServings, gramsOrPcs },
      ingredients: { addedIngrediant: validIngredients },
      totals: { totalQty, totalKitQty: totalEstimateQty, totalBatchQty: totalEstimateQty, totalIngCost: totalCost, totalGST: GST },
      instruction: { stepByStepInstructions: steps.map((step, i) => `Step ${i + 1}: ${step.content}`).join('\n') },
      timing: { preparationTime: null, cookingTime: null, totalTime: null, bakingWeightLoss },
      productOutput: { productOutputGrams: totalEstimateQty, productOutputPcs: estimatedTotalPcs },
      afterBaking: { bakingOutputGrams: afterBakingOutput, bakingOutputPcs: totalServings },
      perPieceWeight: { perGramWeight, perPieceWeight: perPcsValue, PcsWeight: perPieceWeight },
      sellingCost: { sellingCostKg: sellingCost.sellingCostKg, sellingCostPcs: sellingCost.sellingCostPcs, totalSellingCost: sellingCost.totalSellingCost },
      //    rawMaterial: { rmcTotalCost: totalCost, consumables: { items: consumableItems }, wastage, others, GST },
      rawMaterial: {
        rmcTotalCost: totalCost,
        consumables: { items: consumableItems },
        wastage,
        wastagePrice: Number(((totalCost * wastage) / 100).toFixed(2)),   // ← NEW
        others,
        othersPrice: Number(((totalCost * others) / 100).toFixed(2)),     // ← NEW
        GST,
      },
      profit: { profit: profitValue, consumablePrice, gstPrice: GSTPrice, profitPercentage },
      assignFields: { nutritionInfo, cuisine, dietaryRestriction, storageInstruction },
      createdDate: isEditing ? (existingRecipe?.createdDate ?? formattedDateTime) : formattedDateTime,
      updatedDate: isEditing ? formattedDateTime : null,
      remark,
      status: 'active',
    };
  };




  // ─── Detect if anything changed vs stored recipe ──────────────────────────
  const hasRecipeChanged = (): boolean => {
    if (!currentRecipe) return false;

    // Check qty changes in ingredients
    const storedIngs = currentRecipe.ingredients?.addedIngrediant ?? [];
    const currentIngs = calculatedIngredients.filter(
      (ing) => (ing.ingredients && ing.ingredients.trim() !== '' && !ing.isSubKitSelection) || ing.isSubKitHeader,
    );
    if (storedIngs.length !== currentIngs.length) return true;
    for (let i = 0; i < storedIngs.length; i++) {
      if (storedIngs[i].kitQty !== currentIngs[i]?.kitQty) return true;
      if (storedIngs[i].ingredients !== currentIngs[i]?.ingredients) return true;
    }

    // Check consumables
    const storedConsumables = currentRecipe.rawMaterial?.consumables?.items ?? [];
    if (storedConsumables.length !== consumablesSelected.length) return true;
    for (const name of consumablesSelected) {
      const stored = storedConsumables.find((c) => c.name === name);
      if (!stored) return true;
      if (stored.percentage !== (consumableValues[name]?.percentage ?? 0)) return true;
    }

    // Check wastage/others
    if (currentRecipe.rawMaterial?.wastage !== wastage) return true;
    if (currentRecipe.rawMaterial?.others !== others) return true;

    // Check kitPrepare, totalServings, gramsOrPcs, bakingWeightLoss
    if (currentRecipe.createRecipe?.kitPrepare !== kitPrepare) return true;
    if (currentRecipe.createRecipe?.totalServings !== totalServings) return true;
    if (currentRecipe.createRecipe?.gramsOrPcs !== gramsOrPcs) return true;
    if (currentRecipe.timing?.bakingWeightLoss !== bakingWeightLoss) return true;

    return false;
  };



  const handleAddRecipe = () => {
    if (!validateFields()) { setOpenValidationDialog(true); return; }
    if (isEditing) {
      if (itemType === 'SUBKIT' && hasCommitted) {
        // Committed price changes → show subkit dialog with price changes
        const payload = buildRecipePayload();
        setPendingSubkitPayload(payload);
        setSubkitKitDialogOpen(true);
      } else {
        // No commit (with or without other changes) → normal edit confirmation
        setEditConfirmationDialogOpen(true);
      }
    } else {
      createOrUpdateRecipe();
    }
  };


  const createOrUpdateRecipe = () => {
    const newRecipe = buildRecipePayload();

    if (isEditing) {
      // Determine if a new version should be created
      const changed = hasRecipeChanged();
      const priceCommitted = hasCommitted;
      const shouldCreateVersion = changed || priceCommitted;
      const snapshotType = priceCommitted ? 'price_commit' : changed ? 'manual' : 'no_change';

      dispatch(updateRecipe({
        recipeId: recipeId!,
        recipe: newRecipe,
        snapshotType,
        createVersion: shouldCreateVersion,
      })).then((result) => {
        if (updateRecipe.fulfilled.match(result)) {
          setHasCommitted(false);
          setCommittedVarianceId(null);
          setPreCommitIngredients([]);
          setInlineVarianceMap({});
          setPendingVarianceMap({});
          setCurrentVarianceLog(null);
          setUpdateSuccess(true); // ← ADD THIS
          setHasUnsavedChanges(false);
          setSnackbarMessage(
            shouldCreateVersion
              ? 'Recipe updated successfully! New version created.'
              : 'Recipe updated successfully!'
          );
          setSnackbarOpen(true);
          if (recipeId) {
            dispatch(fetchRecipeById(recipeId));
          }
          //  router.push('/yen-recipie/RecipeManagement');
        } else {
          setSnackbarMessage('Failed to update recipe.');
          setSnackbarOpen(true);
        }
      });
    } else {
      dispatch(addRecipe(newRecipe)).then((result) => {
        if (addRecipe.fulfilled.match(result)) {
          setSnackbarMessage('Recipe created successfully!');
          setSnackbarOpen(true);
          router.push('/yen-recipie/RecipeManagement');
        } else {
          setSnackbarMessage('Failed to create recipe.');
          setSnackbarOpen(true);
        }
      });
    }
  };


  // ─── Dialog handlers ──────────────────────────────────────────────────────
  const handleEditConfirmationClose = () => { setEditConfirmationDialogOpen(false); };
  const handleEditConfirmation = () => { setEditConfirmationDialogOpen(false); createOrUpdateRecipe(); };
  const handleCancelClose = () => { setCloseConfirmationDialogOpen(false); };
  const handleConfirmClose = () => { setCloseConfirmationDialogOpen(false); router.push('/yen-recipie/RecipeManagement'); };
  // const handleBackClick = () => { setCloseConfirmationDialogOpen(true); };
  const handleBackClick = () => {
    if (updateSuccess) {
      router.push('/yen-recipie/RecipeManagement');
    } else {
      setCloseConfirmationDialogOpen(true);
    }
  };

  const handleOpenConsumableDialog = () => { setOpenConsumableDialog(true); };
  const handleOpenDialog = () => { setOpenDialog(true); };
  const handleCloseDialog = () => { setOpenDialog(false); };
  const handleCloseConsumableDialog = () => {
    setOpenConsumableDialog(false); setNewConsumableName(''); setConsumableError(''); setCloseConfirmationDialogOpen(false);
  };
  const handleCloseValidationDialog = () => { setOpenValidationDialog(false); };
  const handleCloseIngredientValidationDialog = () => { setOpenIngredientValidationDialog(false); };

  // ─── Step handlers ────────────────────────────────────────────────────────
  const handleAddStep = () => {
    const newIndex = steps.length;
    setSteps([...steps, { content: '', isEditing: true }]);
    setTempStepValues((prev) => ({ ...prev, [newIndex]: '' }));
  };
  const handleStepChange = (index: number, value: string) => {
    setTempStepValues((prev) => ({ ...prev, [index]: value }));
  };
  const handleEditStep = (index: number) => {
    const newSteps = [...steps];
    newSteps[index].isEditing = true;
    setSteps(newSteps);
    setTempStepValues((prev) => ({ ...prev, [index]: steps[index].content }));
  };
  const handleConfirmEdit = (index: number) => {
    const newSteps = [...steps];
    newSteps[index].content = tempStepValues[index] ?? '';
    newSteps[index].isEditing = false;
    setSteps(newSteps);
    setTempStepValues((prev) => { const nv = { ...prev }; delete nv[index]; return nv; });
  };
  const handleRemoveStep = (index: number) => {
    const newSteps = [...steps];
    newSteps.splice(index, 1);
    setSteps(newSteps);
    setTempStepValues((prev) => {
      const newValues = { ...prev };
      delete newValues[index];
      return Object.keys(newValues).reduce<{ [idx: number]: string }>((acc, key) => {
        const numKey = Number(key);
        if (numKey > index) acc[numKey - 1] = newValues[numKey];
        else if (numKey < index) acc[numKey] = newValues[numKey];
        return acc;
      }, {});
    });
  };

  const toggleFullScreen = () => { setIsFullScreen((prev) => !prev); };

  // ─── Loading screen ───────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100vh', width: '100%', gap: 2 }}>
        <Typography variant="body2" sx={{ color: 'var(--erp-accent, #155eef)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
          {isEditing ? 'Loading recipe data' : 'Preparing recipe Page'}
          <CircularProgress size={10} thickness={3} />
        </Typography>
       {isEditing && <Typography variant="body2" sx={{ color: 'var(--erp-muted, #667085)' }}>Please wait while we fetch</Typography>}
      </Box>
    );
  }

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
   <Box
  ref={fullScreenContainerRef}
  className={
    isFullScreen
      ? "recipe-editor-fullscreen"
      : "recipe-editor-page"
  }
  sx={
    isFullScreen
      ? {
          position: "fixed",
          inset: 0,
          zIndex: 2000,
          width: "100vw",
          height: "100vh",
          p: 2,
          overflow: "auto",
          backgroundColor: "var(--erp-bg, #f3f6fa)",
          display: "flex",
          flexDirection: "column",
        }
      : {
          width: "100%",
          minWidth: 0,
          minHeight: "100%",
          p: 0,
          overflow: "visible",
        }
  }
>
      {isFullScreen ? (
        <>
          <Grid container alignItems="center" justifyContent="space-between" spacing={1} sx={{ p: 1, borderBottom: '1px solid #e0e0e0' }}>
            <Grid item xs={12} sm="auto">
              <label className="form-section-title">Recipe Table</label>
            </Grid>
            <Grid item xs={12} sm="auto" sx={{ display: 'flex', justifyContent: { xs: 'flex-start', sm: 'flex-end' }, gap: 1 }}>
              <IconButton onClick={handleOpenDialog} className="icon-action-button" sx={{ '& svg': { fontSize: '1.05rem' }, '&:hover': { backgroundColor: 'var(--erp-accent-soft, #e8efff)' } }}>
                <VisibilityIcon className="icon-action-svg" />
              </IconButton>
              <button
                onClick={handleAddIngredient}
                disabled={versionPreviewActive}
                className="btn-primary"
                style={versionPreviewActive ? { opacity: 0.45, cursor: 'not-allowed', pointerEvents: 'none', boxShadow: 'none', transform: 'none' } : {}}
              >
                <AddIcon style={{ marginRight: 6 }} />Add Ingredient
              </button>
              <button
                onClick={handleAddSubKit}
                disabled={versionPreviewActive}
                className="btn-primary"
                 style={versionPreviewActive ? { opacity: 0.45, cursor: 'not-allowed', pointerEvents: 'none', boxShadow: 'none', transform: 'none' } : {}}
              >
                <AddIcon style={{ marginRight: 6 }} />Add SubKit
              </button>
               <IconButton onClick={toggleFullScreen} className="icon-action-button" sx={{ '& svg': { fontSize: '1.05rem' }, '&:hover': { backgroundColor: 'var(--erp-accent-soft, #e8efff)' } }}>
                <FullscreenExitIcon className="icon-action-svg" />
              </IconButton>
            </Grid>
          </Grid>
          <Box>
            <RecipeTableContainer
              //  calculatedIngredients={calculatedIngredients}
              totalQty={totalQty} totalEstimateQty={totalEstimateQty}
              totalCost={totalCost} GST={GST}
              handleIngredientChange={handleIngredientChange}
              handleDeleteIngredient={handleDeleteIngredient}
              handleAddIngredient={handleAddIngredient}
              handleSearchIngredients={handleSearchIngredients}
              handleClearSearch={handleClearSearch}
              handleLoadMoreItems={handleLoadMoreItems}
              ingredientOpenDialog={openDialog}
              handleOpenDialog={handleOpenDialog}
              handleCloseDialog={handleCloseDialog}
              tempQtyValues={tempQtyValues}
              setTempQtyValues={setTempQtyValues}
              handleSelectSubKit={handleSelectSubKit}
              recipes={recipes}
              inlineVarianceMap={isEditing ? inlineVarianceMap : {}}
              //  pendingVarianceMap={isEditing ? pendingVarianceMap : {}}
              // hasCommitted={isEditing ? hasCommitted : false}


              calculatedIngredients={versionPreviewActive ? previewIngredients : calculatedIngredients}
              pendingVarianceMap={versionPreviewActive ? {} : (isEditing ? pendingVarianceMap : {})}
              hasCommitted={versionPreviewActive ? false : (isEditing ? hasCommitted : false)}
              isVersionPreview={versionPreviewActive}
              currentIngredients={calculatedIngredients}


            />
          </Box>
        </>
      ) : (
        <>
          <Box
  className="recipe-editor-command-bar"
  sx={{
    position: "sticky",
    top: 0,
    zIndex: 20,
    width: "100%",
    boxSizing: "border-box",
    backgroundColor: "var(--erp-surface, #ffffff)",
    padding: "8px 16px",
    borderBottom: "1px solid var(--erp-border, #e5e7eb)",
    boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 2,
  }}
>
            {/* Left — Title */}
            <Box sx={{ flexShrink: 0 }}>
              <label className="form-section-title" style={{ margin: 0 }}>
                {isEditing ? 'Edit Recipe' : 'Create New Recipe'}
              </label>
            </Box>

            {/* Right — All buttons together */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>

              {/* Version History Eye / Cancel Icon */}
              {isEditing && (
                versionPreviewActive ? (
                  <Box
                  className="recipe-command-chip recipe-command-chip--danger"
                    onClick={handleCancelVersionPreview}
                    sx={{
                      display: 'flex', alignItems: 'center', gap: 0.5,
                      cursor: 'pointer',
                      background: '#fee2e2', border: '1px solid #f87171',
                      borderRadius: '20px', px: 1.5, py: 0.75,
                      transition: 'all 0.2s ease',
                      '&:hover': { background: '#fecaca', transform: 'scale(1.02)' },
                    }}
                  >
                    <CancelOutlined sx={{ fontSize: 14, color: '#dc2626' }} />
                    <Typography sx={{ fontSize: '12px', fontWeight: 700, color: '#dc2626', fontFamily: 'var(--erp-font-family, Inter, Arial, sans-serif)', whiteSpace: 'nowrap', userSelect: 'none' }}>
                      {previewSourceVersion ? `v${previewSourceVersion.version}` : 'Cancel'}
                    </Typography>
                  </Box>
                ) : (
                  <Box
                  className="recipe-command-chip recipe-command-chip--accent"
                    onClick={handleOpenVersionDialog}
                    sx={{
                      display: 'flex', alignItems: 'center', gap: 0.5,
                      cursor: 'pointer',
                      background: 'var(--erp-accent-soft, #e8efff)', border: '1px solid var(--erp-accent-border, #9bb7f7)',
                      borderRadius: '20px', px: 1.5, py: 0.75,
                      transition: 'all 0.2s ease',
                     '&:hover': { background: 'var(--erp-accent-soft, #e8efff)', transform: 'scale(1.02)' },
                    }}
                  >
                   <HistoryOutlined sx={{ fontSize: 14, color: 'var(--erp-accent, #155eef)' }} />
                    <Typography sx={{ fontSize: '12px', fontWeight: 700, color: 'var(--erp-accent, #155eef)', fontFamily: 'var(--erp-font-family, Inter, Arial, sans-serif)', whiteSpace: 'nowrap', userSelect: 'none' }}>
                      Versions
                    </Typography>
                  </Box>
                )
              )}

              {/* Commit */}
              {isEditing && !hasCommitted && currentVarianceLog && (
                <Tooltip
                  title="To Click the button to see the real changes on your UI."
                  arrow
                  placement="top"
                >
                  <Box
                  className="recipe-command-chip recipe-command-chip--success"
                    onClick={!varianceLoading ? handleCommitVariance_Direct : undefined}
                    sx={{
                      display: 'flex', alignItems: 'center', gap: 0.5,
                      cursor: varianceLoading ? 'not-allowed' : 'pointer',
                      background: '#8afdb6ff', border: '2px solid #8afdb6ff',
                      borderRadius: '20px', px: 1.5, py: 0.75,
                      transition: 'all 0.2s ease',
                      animation: 'pulse 2s infinite',
                      '@keyframes pulse': {
                        '0%': { boxShadow: '0 0 0 0 rgba(245,158,11,0.6)' },
                        '70%': { boxShadow: '0 0 0 10px rgba(245,158,11,0)' },
                        '100%': { boxShadow: '0 0 0 0 rgba(245,158,11,0)' },
                      },
                      '&:hover': { background: '#fdf18aff', transform: 'scale(1.02)' },
                    }}
                  >
                    {varianceLoading
                      ? <CircularProgress size={14} sx={{ color: '#f59e0b' }} />
                      : <span style={{ fontSize: '14px' }}>✓</span>}
                    <Typography sx={{ fontSize: '12px', fontWeight: 700, color: '#000000ff', fontFamily: 'var(--erp-font-family, Inter, Arial, sans-serif)', whiteSpace: 'nowrap', userSelect: 'none' }}>
                      Commit
                    </Typography>
                  </Box>
                </Tooltip>
              )}

              {/* Revert */}
              {isEditing && hasCommitted && (
                <Box
                className="recipe-command-chip recipe-command-chip--danger"
                  onClick={!varianceLoading ? handleRevertVariance : undefined}
                  sx={{
                    display: 'flex', alignItems: 'center', gap: 0.5,
                    cursor: varianceLoading ? 'not-allowed' : 'pointer',
                    background: '#fee2e2', border: '1px solid #f87171',
                    borderRadius: '20px', px: 1.5, py: 0.75,
                    transition: 'all 0.2s ease',
                    '&:hover': { background: '#fecaca', transform: 'scale(1.02)' },
                  }}
                >
                  {varianceLoading
                    ? <CircularProgress size={14} sx={{ color: '#dc2626' }} />
                    : <span style={{ fontSize: '14px' }}>↩️</span>}
                  <Typography sx={{ fontSize: '12px', fontWeight: 700, color: '#dc2626', fontFamily: 'var(--erp-font-family, Inter, Arial, sans-serif)', whiteSpace: 'nowrap', userSelect: 'none' }}>
                    Revert
                  </Typography>
                </Box>
              )}

              {/* <button className="btn-secondary" onClick={handleBackClick}>Back</button> */}
              <button
                className="btn-secondary"
                onClick={handleBackClick}
                style={updateSuccess ? {
background: 'var(--erp-success, #0b7a42)',
                  color: 'var(--erp-accent-contrast, #ffffff)',
                 border: '1px solid var(--erp-success, #0b7a42)',
                } : {}}
              >
                {updateSuccess ? '← Go to Main Page' : 'Back'}
              </button>
              {/* <button className="btn-primary" onClick={handleAddRecipe} disabled={loading}>
                {loading ? <CircularProgress size={20} /> : isEditing ? 'Update' : 'Create'}
              </button> */}

              <button
                className="btn-primary"
                onClick={handleAddRecipe}
                disabled={loading || (isEditing && updateSuccess && !hasUnsavedChanges)}
                style={(isEditing && updateSuccess && !hasUnsavedChanges) ? {
                  opacity: 0.5,
                  cursor: 'not-allowed',
                  pointerEvents: 'none',
                } : {}}
              >
                {loading ? <CircularProgress size={20} /> : isEditing ? 'Update' : 'Create'}
              </button>

            </Box>

          </Box>

          {/* ─── Form Sections ─── */}
          <Box className="recipe-editor-content">
          <RecipeHeaderForm
            itemType={itemType} itemName={itemName} kitPrepare={kitPrepare} uom={uom}
            totalServings={totalServings} category={category} subCategory={subCategory}
            gramsOrPcs={gramsOrPcs} product={product} isFetchingItems={isFetchingItems}
            validationErrors={validationErrors} recipes={recipes}
            setItemType={setItemType} setItemName={setItemName} setKitPrepare={setKitPrepare}
            setUom={setUom} setTotalServings={setTotalServings} setCategory={setCategory}
            setSubCategory={setSubCategory} setgramsOrPcs={setGramsOrPcs}
            setValidationErrors={setValidationErrors} handleSearchItems={handleSearchItems}
            handleClearSearch={handleClearSearch} handleLoadMoreItems={handleLoadMoreItems}
            hasMoreItems={hasMoreItems} handleOpenDialog={handleOpenDialog}
            handleAddIngredient={handleAddIngredient} toggleFullScreen={toggleFullScreen}
            handleAddSubKit={handleAddSubKit} isEditMode={isEditing}
            isVersionPreviewActive={versionPreviewActive}
          />

          <RecipeTableContainer
            // calculatedIngredients={calculatedIngredients}
            totalQty={totalQty} totalEstimateQty={totalEstimateQty}
            totalCost={totalCost} GST={GST}
            handleIngredientChange={handleIngredientChange}
            handleDeleteIngredient={handleDeleteIngredient}
            handleAddIngredient={handleAddIngredient}
            handleSearchIngredients={handleSearchIngredients}
            handleClearSearch={handleClearSearch} handleLoadMoreItems={handleLoadMoreItems}
            ingredientOpenDialog={openDialog} handleOpenDialog={handleOpenDialog}
            handleCloseDialog={handleCloseDialog} tempQtyValues={tempQtyValues}
            setTempQtyValues={setTempQtyValues} handleSelectSubKit={handleSelectSubKit}
            recipes={recipes}
            inlineVarianceMap={isEditing ? inlineVarianceMap : {}}
            // pendingVarianceMap={isEditing ? pendingVarianceMap : {}}
            // hasCommitted={isEditing ? hasCommitted : false}

            calculatedIngredients={versionPreviewActive ? previewIngredients : calculatedIngredients}
            pendingVarianceMap={versionPreviewActive ? {} : (isEditing ? pendingVarianceMap : {})}
            hasCommitted={versionPreviewActive ? false : (isEditing ? hasCommitted : false)}
            isVersionPreview={versionPreviewActive}
            currentIngredients={calculatedIngredients}
          />

          <RecipeDetailsContainer
            key={bakingWeightLoss}
            totalEstimateQty={totalEstimateQty}
            TotalServKitQty={TotalServKitQty}
            afterBakingOutput={afterBakingOutput}
            perPieceWeight={perPieceWeight}
            perGramWeight={perGramWeight}
            perPcsValue={perPcsValue}
            gramsOrPcs={gramsOrPcs}
            sellingCost={sellingCost}
            uom={uom}
            bakingWeightLoss={bakingWeightLoss}
            setbakingWeightLoss={setBakingWeightLoss}
            hasVarianceCommitted={isEditing ? hasCommitted : false}
            oldPerGramWeight={isEditing ? oldPerGramWeight : null}
            oldPerPcsValue={isEditing ? oldPerPcsValue : null}
            versionPreviewActive={versionPreviewActive}
            versionSnapshot={versionSnapshot}
          />

          <ConsumablesPage
            consumablesSelected={consumablesSelected}
            setConsumablesSelected={setConsumablesSelected}
            consumableValues={consumableValues}
            setConsumableValues={setConsumableValues}
            allConsumables={allConsumables}
            setAllConsumables={setAllConsumables}
            totalCost={totalCost}
            totalConsumablePercentage={totalConsumablePercentage}
            wastage={wastage}
            setWastage={setWastage}
            others={others}
            setOthers={setOthers}
            gst={GST}
            validationErrors={validationErrors}
            setValidationErrors={setValidationErrors}
            handleOpenConsumableDialog={handleOpenConsumableDialog}
            profitValue={profitValue}
            profitPercentage={profitPercentage}
            totalCostValue={totalCostValue}
            consumablePrice={consumablePrice}
            GSTPrice={GSTPrice}
            hasVarianceCommitted={isEditing ? hasCommitted : false}
            oldPerGramWeight={isEditing ? oldPerGramWeight : null}
            oldPerPcsValue={isEditing ? oldPerPcsValue : null}
            oldProfitValue={isEditing ? oldProfitValue : null}
            oldProfitPercentage={isEditing ? oldProfitPercentage : null}
            pendingVarianceMap={isEditing ? pendingVarianceMap : {}}
            versionPreviewActive={versionPreviewActive}
            versionSnapshot={versionSnapshot}
          />

          <StepByStepInstructions
            steps={steps} tempStepValues={tempStepValues}
            setSteps={setSteps} setTempStepValues={setTempStepValues}
            handleAddStep={handleAddStep} handleStepChange={handleStepChange}
            handleEditStep={handleEditStep} handleConfirmEdit={handleConfirmEdit}
            handleRemoveStep={handleRemoveStep}
          />
          </Box>
        </>
      )}

      {/* ─── Variance Notification Dialog ─── */}
      <Dialog open={varianceDialogOpen} onClose={() => setVarianceDialogOpen(false)} fullWidth maxWidth="md" classes={{ paper: 'dialog-paper-big' }}>
        <DialogTitle className="dialog-title" sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>⚠️ Ingredient Price Change Alert</span>
          {variance.unreadCount > 1 && (
            <span style={{ fontSize: '11px', color: '#6b7280', fontWeight: 400 }}>{variance.unreadCount} pending alerts</span>
          )}
        </DialogTitle>
        <DialogContent className="dialog-content">
          {selectedVariance && (
            <Box>
              <Box sx={{ background: '#fef3c7', border: '1px solid #fcd34d', borderRadius: '8px', p: 2, mb: 2 }}>
                <Typography sx={{ fontSize: '12px', fontWeight: 700, color: '#92400e', mb: 1 }}>
                  Recipe: {selectedVariance.recipeId}
                </Typography>
                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 0.5 }}>
                  <Box>
                    <Typography sx={{ fontSize: '10px', color: '#78716c' }}>Per Gram Weight Change</Typography>
                    <Typography sx={{ fontSize: '13px', fontWeight: 700, color: Math.abs(selectedVariance.perGramWeightVariance) >= 10 ? '#dc2626' : '#16a34a' }}>
                      {selectedVariance.perGramWeightVariance > 0 ? '+' : ''}{selectedVariance.perGramWeightVariance.toFixed(2)}%
                    </Typography>
                  </Box>
                  <Box>
                    <Typography sx={{ fontSize: '10px', color: '#78716c' }}>Old RM Per Item Cost</Typography>
                    <Typography sx={{ fontSize: '13px', fontWeight: 700, color: '#374151' }}>₹{selectedVariance.oldPerGramWeight.toFixed(2)}</Typography>
                  </Box>
                  <Box>
                    <Typography sx={{ fontSize: '10px', color: '#78716c' }}>New RM Per Item Cost</Typography>
                    <Typography sx={{ fontSize: '13px', fontWeight: 700, color: '#dc2626' }}>₹{selectedVariance.newPerGramWeight.toFixed(2)}</Typography>
                  </Box>
                  <Box>
                    <Typography sx={{ fontSize: '10px', color: '#78716c' }}>Old Total Cost</Typography>
                    <Typography sx={{ fontSize: '13px', fontWeight: 700, color: '#374151' }}>₹{selectedVariance.oldTotalCost.toFixed(2)}</Typography>
                  </Box>
                  <Box>
                    <Typography sx={{ fontSize: '10px', color: '#78716c' }}>New Total Cost</Typography>
                    <Typography sx={{ fontSize: '13px', fontWeight: 700, color: '#dc2626' }}>₹{selectedVariance.newTotalCost.toFixed(2)}</Typography>
                  </Box>
                </Box>
              </Box>

              {selectedVariance.ingredientChanges && selectedVariance.ingredientChanges.length > 0 && (
                <Box>
                  <Typography sx={{ fontSize: '11px', fontWeight: 700, color: '#374151', mb: 1 }}>
                    Changed Ingredients ({selectedVariance.ingredientChanges.length})
                  </Typography>
                  <div className="table-container">
                    <table className="custom-tables">
                      <thead>
                        <tr>
                          <th>Ingredient</th><th>Old Price/g</th><th>New Price/g</th>
                          <th>Change %</th><th>Old Cost</th><th>New Cost</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedVariance.ingredientChanges.map((change, idx) => (
                          <tr key={idx}>
                            <td>{change.ingredientName || change.ingredientId}</td>
                            <td align="right">₹{change.oldPerGramCost.toFixed(4)}</td>
                            <td align="right">₹{change.newPerGramCost.toFixed(4)}</td>
                            <td align="center" style={{ color: change.priceChangePercent > 0 ? '#dc2626' : '#16a34a', fontWeight: 700 }}>
                              {change.priceChangePercent > 0 ? '+' : ''}{change.priceChangePercent.toFixed(2)}%
                            </td>
                            <td align="right">₹{change.oldTotalCost.toFixed(2)}</td>
                            <td align="right" style={{ color: '#dc2626', fontWeight: 700 }}>₹{change.newTotalCost.toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions className="dialog-actions">
          <button onClick={() => setVarianceDialogOpen(false)} className="btn-secondary">Close</button>
          <button onClick={handleCommitVariance} className="btn-primary" disabled={varianceLoading}>
            {varianceLoading ? <CircularProgress size={16} /> : '✓ Commit Price Changes'}
          </button>
        </DialogActions>
      </Dialog>


      {/* ─── Version History Dialog ─── */}
      <Dialog
        open={versionDialogOpen}
        onClose={() => setVersionDialogOpen(false)}
        fullWidth
        maxWidth="md"
        classes={{ paper: 'dialog-paper-big' }}
      >
        <DialogTitle className="dialog-title" sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>📋 Version History</span>
          <Typography sx={{ fontSize: '11px', color: '#6b7280', fontWeight: 400 }}>
            {versionHistory.totalVersions} previous version{versionHistory.totalVersions !== 1 ? 's' : ''}
          </Typography>
        </DialogTitle>
        <DialogContent className="dialog-content" sx={{ p: 0 }}>
          {versionHistory.loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress size={24} />
            </Box>
          ) : versionHistory.versions.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography sx={{ fontSize: '12px', color: '#9ca3af' }}>No previous versions found</Typography>
            </Box>
          ) : (
            <div className="table-container">
              <table className="custom-tables" style={{ width: '100%' }}>
                <thead>
                  <tr>
                    <th style={{ textAlign: 'center' }}>S.No</th>
                    <th style={{ textAlign: 'left' }}>Item Name</th>
                    <th style={{ textAlign: 'center' }}>Version</th>
                    <th style={{ textAlign: 'center' }}>Type</th>
                    <th style={{ textAlign: 'center' }}>Date</th>
                    <th style={{ textAlign: 'right' }}>Total Cost</th>
                    <th style={{ textAlign: 'right' }}>Profit %</th>
                  </tr>
                </thead>
                <tbody>
                  {versionHistory.versions.map((ver, idx) => (
                    <tr
                      key={ver._id}
                      onClick={() => handleApplyVersion(ver)}
                      style={{
                        cursor: 'pointer',
                        background: previewSourceVersion?._id === ver._id ? 'var(--erp-accent-soft, #e8efff)' : idx % 2 === 0 ? 'var(--erp-surface, #ffffff)' : 'var(--erp-surface-2, #f8fafc)',
                        borderLeft: previewSourceVersion?._id === ver._id ? '3px solid #3b82f6' : '3px solid transparent',
                        transition: 'background 0.15s',
                      }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = '#f0f9ff'; }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLElement).style.background =
                          previewSourceVersion?._id === ver._id ? 'var(--erp-accent-soft, #e8efff)' : idx % 2 === 0 ? 'var(--erp-surface, #ffffff)' : 'var(--erp-surface-2, #f8fafc)';
                      }}
                    >
                     <td style={{ textAlign: 'center', fontSize: '11px', fontFamily: 'var(--erp-font-family, Inter, Arial, sans-serif)' }}>{idx + 1}</td>
                      <td style={{ textAlign: 'left', fontSize: '11px', fontFamily: 'var(--erp-font-family, Inter, Arial, sans-serif)', fontWeight: 600 }}>
                        {ver.createRecipe?.itemName || ver.RECIPEID}
                      </td>
                      <td style={{ textAlign: 'center', fontSize: '11px', fontFamily: 'var(--erp-font-family, Inter, Arial, sans-serif)' }}>
                        <Box sx={{
                          display: 'inline-block', px: 1, py: 0.2,
                          borderRadius: '10px', background: 'var(--erp-accent-soft, #e8efff)',
                          color: '#1e40af', fontWeight: 700, fontSize: '10px',
                        }}>
                          v{ver.version}
                        </Box>
                      </td>
                      <td style={{ textAlign: 'center', fontSize: '10px', fontFamily: 'var(--erp-font-family, Inter, Arial, sans-serif)', color: '#6b7280' }}>
                        {ver.snapshotType}
                      </td>
                      <td style={{ textAlign: 'center', fontSize: '10px', fontFamily: 'var(--erp-font-family, Inter, Arial, sans-serif)', color: '#374151' }}>
                        {ver.createdAt ? (
                          `${new Date(ver.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })} | 
                          ${new Date(ver.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}`
                        ) : '—'}
                      </td>
                     <td style={{ textAlign: 'right', fontSize: '11px', fontFamily: 'var(--erp-font-family, Inter, Arial, sans-serif)', color: '#166534', fontWeight: 600 }}>
                        ₹{(ver.totals?.totalIngCost ?? 0).toFixed(2)}
                      </td>
                      <td style={{ textAlign: 'right', fontSize: '11px', fontFamily: 'var(--erp-font-family, Inter, Arial, sans-serif)', color: '#16a34a', fontWeight: 700 }}>
                        {(ver.profit?.profitPercentage ?? 0).toFixed(2)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </DialogContent>
        <DialogActions className="dialog-actions">
          <button onClick={() => setVersionDialogOpen(false)} className="btn-secondary">Close</button>
        </DialogActions>
      </Dialog>


      {/* ─── Add Consumable Dialog ─── */}
      <Dialog open={openConsumableDialog} onClose={handleCloseConsumableDialog} classes={{ paper: 'dialog-paper' }}>
        <DialogTitle className="dialog-title">Add New Consumable</DialogTitle>
        <DialogContent className="dialog-content">
          <TextField
            autoFocus margin="dense" label="Consumable Name" autoComplete="off" fullWidth
            value={newConsumableName} onChange={(e) => setNewConsumableName(e.target.value)}
            error={!!consumableError} helperText={consumableError}
            className="custom-textfield" InputLabelProps={{ className: 'custom-label' }}
            InputProps={{ className: 'custom-input', sx: { fontSize: '12px' } }}
          />
        </DialogContent>
        <DialogActions className="dialog-actions">
          <button onClick={handleCloseConsumableDialog} className="btn-secondary">Cancel</button>
          <button onClick={handleAddConsumable} className="btn-primary" disabled={loading}>
            {loading ? <CircularProgress size={24} /> : 'Add'}
          </button>
        </DialogActions>
      </Dialog>

      {/* ─── SubKit Dialog ─── */}
<Dialog
        open={openSubKitDialog}
        onClose={handleCloseSubKitDialog}
        fullWidth
       maxWidth="lg"
       classes={{ paper: 'dialog-paper-big subkit-dialog-paper' }}
      >
        <DialogTitle className="dialog-title subkit-dialog-title">Select SubKit Recipe</DialogTitle>
        <DialogContent className="dialog-content subkit-dialog-content">
          <Box className="subkit-dialog-form">
            <Box className="subkit-dialog-field subkit-dialog-field--recipe">
              <Autocomplete
                id="subkit-recipe-select"
                options={sfgRecipes.filter((r) => r.itemType === 'SUBKIT' && r.createRecipe?.itemName)}
                getOptionLabel={(option) => option.createRecipe?.itemName ?? ''}
                value={selectedSubKit}
                onChange={(_event, newValue) => handleSubKitChange(newValue)}
                renderInput={(params) => (
                  <TextField
                                      {...params}
                    label="Select SUBKIT Recipe"
                    placeholder="Search SubKit recipes"
                    fullWidth
                    margin="none"
                    className="custom-textfield"
                    InputLabelProps={{ className: 'custom-label', shrink: true }}
                    InputProps={{ ...params.InputProps, className: 'custom-input' }}
                  />
                )}
                renderOption={(props, option) => {
                  const isSelected = ingredients.some((ing) => ing.isSubKitHeader && ing.ingredients === option.createRecipe?.itemName);
                  return (
                    <li {...props} style={{ ...(isSelected ? { opacity: 0.5, cursor: 'not-allowed' } : {}) }}>
                      <ListItemText
                        primary={option.createRecipe?.itemName}
                        secondary={isSelected ? 'Already selected' : undefined}
                       primaryTypographyProps={{ fontSize: '0.75rem', fontFamily: 'var(--erp-font-family, Inter, Arial, sans-serif)' }}
                        secondaryTypographyProps={{ fontSize: '0.7rem', fontFamily: 'var(--erp-font-family, Inter, Arial, sans-serif)' }}
                      />
                    </li>
                  );
                }}
                filterOptions={(options, { inputValue }) =>
                  options.filter((o) => o.createRecipe?.itemName.toLowerCase().includes(inputValue.toLowerCase()))
                }
                getOptionDisabled={(option) =>
                  ingredients.some((ing) => ing.isSubKitHeader && ing.ingredients === option.createRecipe?.itemName)
                }
                noOptionsText={sfgRecipes.length === 0 ? 'No SUBKIT recipes available' : 'No matching SUBKIT recipes found'}
                disableCloseOnSelect={false}
                fullWidth
              />
            
          </Box>
           <Box className="subkit-dialog-field">
              <TextField
                label="Required Qty (Grams)" autoComplete="off"
                value={requiredQty === 0 ? '' : requiredQty}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value === '' || (/^\d*\.?\d*$/.test(value) && Number(value) >= 0)) { setRequiredQty(Number(value)); }
                }}
              fullWidth margin="none" className="custom-textfield"
                InputLabelProps={{ className: 'custom-label', shrink: true }}
                InputProps={{ className: 'custom-input' }}
              />
           </Box>
           <Box className="subkit-dialog-field">
              <TextField
               label="Total Qty of The Item (Grams)" autoComplete="off" type="number"
                value={(selectedSubKit?.createRecipe?.totalServings ?? 0)}
              fullWidth margin="none" className="custom-textfield"
                InputLabelProps={{ className: 'custom-label', shrink: true }}
                InputProps={{ readOnly: true, className: 'custom-input' }}
              />
            </Box>
          </Box>

          {selectedSubKit && (
           <div className="table-container my-1 subkit-dialog-table-container">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>S.No</th><th>Ingredient</th><th>Kit Qty</th><th>UOM</th>
                    <th>Batch Qty</th><th>Per Gram Cost</th><th>Total Cost</th><th>GST %</th><th>Have It</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedSubKit.ingredients?.addedIngrediant && selectedSubKit.ingredients.addedIngrediant.length > 0 ? (
                    selectedSubKit.ingredients.addedIngrediant.map((ing, index) => {
                      const scalingFactor = requiredQty / (selectedSubKit.createRecipe?.totalServings ?? 1);
                      return (
                        <tr key={index}>
                          <td align="center">{index + 1}</td>
                          <td align="center">{ing.ingredients}</td>
                          <td align="center">{(ing.kitQty * scalingFactor).toFixed(2)}</td>
                          <td align="center">{ing.uom}</td>
                          <td align="center">{((ing.kitQty * scalingFactor) * kitPrepare).toFixed(2)}</td>
                          <td align="center">{(ing.perGramCost ?? 0).toFixed(3)}</td>
                          <td align="center">{(ing.totalCost * scalingFactor).toFixed(2)}</td>
                          <td align="center">{((ing.GST ?? 0) * scalingFactor).toFixed(2)}</td>
                          <td align="center">{ing.haveIt ? 'Yes' : 'No'}</td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={9} align="center" className="empty-state">
                        <Typography>No ingredients found for this SubKit</Typography>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </DialogContent>
       <DialogActions className="dialog-actions subkit-dialog-actions">
          <button onClick={handleCloseSubKitDialog} className="btn-secondary subkit-dialog-button">Cancel</button>
          <button onClick={handleConfirmSubKit} className="btn-primary subkit-dialog-button" disabled={!selectedSubKit || requiredQty <= 0}>Apply</button>
        </DialogActions>
      </Dialog>

      {/* ─── Validation Dialog ─── */}
      <Dialog open={openValidationDialog} onClose={handleCloseValidationDialog} classes={{ paper: 'dialog-paper-small' }}>
        <DialogTitle className="dialog-title">Validation Errors</DialogTitle>
        <DialogContent className="dialog-content">
          <Typography className="form-section-subtitle" style={{ marginTop: -4 }}>Please correct the following errors:</Typography>
          <ul style={{ paddingLeft: '20px', margin: 0 }}>
            {Object.entries(validationErrors).map(([field, error]) => error ? (
              <li key={field} style={{ fontSize: '0.75rem', marginBottom: '4px' }}>
                <strong>{field.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase())}:</strong> {error}
              </li>
            ) : null)}
          </ul>
        </DialogContent>
        <DialogActions className="dialog-actions">
          <button onClick={handleCloseValidationDialog} className="btn-primary">OK</button>
        </DialogActions>
      </Dialog>

      {/* ─── Ingredient Validation Dialog ─── */}
      <Dialog open={openIngredientValidationDialog} onClose={handleCloseIngredientValidationDialog} classes={{ paper: 'dialog-paper-small' }}>
        <DialogTitle className="dialog-title">Validation Error</DialogTitle>
        <DialogContent className="dialog-content">
          {itemName.trim() === '' ? (
            <Typography sx={{ fontSize: '0.75rem' }}>Please select an ITEM in the SELECT ITEMS field before adding an ingredient.</Typography>
          ) : (
            <Typography sx={{ fontSize: '0.75rem' }}>Please remove or fill the empty INGREDIENT data in the table.</Typography>
          )}
        </DialogContent>
        <DialogActions className="dialog-actions">
          <button onClick={handleCloseIngredientValidationDialog} className="btn-primary">OK</button>
        </DialogActions>
      </Dialog>

      {/* ─── SubKit KIT Update Dialog ─── */}
      {itemType === 'SUBKIT' && pendingSubkitPayload && (
        <SubkitKitUpdateDialog
          open={subkitKitDialogOpen}
          subkitName={itemName}
          subkitRecipeId={recipeId!}
          pendingVarianceMap={pendingVarianceMap}
          subkitPayload={pendingSubkitPayload}
          onClose={() => {
            setSubkitKitDialogOpen(false);
            setPendingSubkitPayload(null);
          }}
          onAllDone={() => {
            setSubkitKitDialogOpen(false);
            setPendingSubkitPayload(null);
            setHasCommitted(false);
            setCommittedVarianceId(null);
            setPreCommitIngredients([]);
            setInlineVarianceMap({});
            router.push('/yen-recipie/RecipeManagement');
          }}
        />
      )}


      <EditConfirmationDialog open={editConfirmationDialogOpen} onClose={handleEditConfirmationClose} onConfirm={handleEditConfirmation} />
      <CloseConfirmationDialog open={closeConfirmationDialogOpen} onClose={handleCancelClose} onConfirm={handleConfirmClose} />
      <ActivateDeactivateConfirmationDialog
        open={deleteConfirmationDialogOpen} actionType="delete"
        onClose={() => { setDeleteConfirmationDialogOpen(false); setDeleteIngredientIndex(-1); }}
        onConfirm={handleConfirmDeleteIngredient}
      />

      <Snackbar open={snackbarOpen} autoHideDuration={3000} onClose={() => setSnackbarOpen(false)} anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}>
        <Alert onClose={() => setSnackbarOpen(false)} severity="info" sx={{ width: '100%', backgroundColor: 'var(--erp-accent, #155eef)', color: 'white', fontFamily: 'var(--erp-font-family, Inter, Arial, sans-serif)', fontSize: '0.75rem' }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default CreateRecipePageWrapper;