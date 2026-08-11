

"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import axios from "axios";

import { RootState, AppDispatch } from "@/redux/store";

// import Navbar from "../../Components/NavBar";
// import SideMenu from "../../Components/SideMenu";

import CustomKeyboard from "./components/CustomKeyboard";
import { useCustomKeyboard } from "./hooks/useCustomKeyboard";
import { Trash2 } from "lucide-react";
import {
  fetchSFGMaterials,
  fetchRawMaterials,
  createRecipe,
  fetchRecipeNames,
  calculateGramPrice,
  clearNewRecipeDraft,
  fetchPackingMaterials,
  setNewRecipeDraft,
} from "../newRecipe/Features/newrecipeSlice";
import {
  RecipeName,
  SFGMaterial,
  RawMaterial,
  DraftRecipeItem,
  BackendRecipeItemPayload,
} from "../newRecipe/Models/newrecipeModels";
import styles from "../skm.module.css";
export interface RecipeItem {
  frontendKey: string;
  realCode: string;
  name: string;
  code: string;
  uom: string;
  type: "SFG" | "RM";
  category?: "Raw" | "Packing" | "FG-External" | "Cleaning";
  quantity: string;
  placeholder: string;
  status: "assigned";
  defaultPrice?: number;
  takeAway?: boolean;
  dineIn?: boolean;
  isNonKgGramEntry?: boolean;
  totalKgForPrice?: number;
  pricePerGram?: number;
  randomId?: string;
}

interface LatestVersionApiItem {
  id?: string;
  name: string;
  code: string;
  uom: string;
  type: "RM" | "SFG";
  category?: string | null;
  randomId?: string | null;
  quantity?: number;
  quantityInGrams?: number | null;
  unitPrice?: number;
  totalPrice?: number;
  takeAway?: boolean | null;
  dineIn?: boolean | null;
  isGramBased?: boolean | null;
  totalKgForPrice?: number | null;
}

interface LatestVersionApiResponse {
  itemName?: string;
  recipeName?: string;
  varianceName?: string;
  version: number;
  cost?: number;
  totalItemsCost?: number;
  recipeMeta?: {
    item_Defaultprice?: number;
    varianceName?: string;
    itemName?: string;
  };
  items: LatestVersionApiItem[];
}

const isKgUom = (uom?: string): boolean => {
  if (!uom) return false;
  const lower = uom.toLowerCase().trim();
  return (
    lower === "kg" || lower === "kgs" || lower === "kilo" ||
    lower.includes("kilogram") || lower.includes("kg ") ||
    lower === "ltr" || lower === "liter" || lower === "litre" ||
    lower.includes("ltr") || lower.includes("liter")
  );
};

// Strips letters/special characters, keeps digits only, capped at 6 digits.
const sanitizeDigits = (value: string, maxLen = 6): string =>
  value.replace(/\D/g, "").slice(0, maxLen);

const calcDisplayPrice = (item: RecipeItem): string | null => {
  const qty = Number(item.quantity);
  if (!item.quantity || isNaN(qty) || qty <= 0) return null;

  if (item.isNonKgGramEntry && item.pricePerGram != null) {
    return parseFloat((item.pricePerGram * qty).toPrecision(10)).toFixed(2);
  }
  if (isKgUom(item.uom) && item.defaultPrice != null) {
    return parseFloat((item.defaultPrice * (qty / 1000)).toPrecision(10)).toFixed(2);
  }
  if (!item.isNonKgGramEntry && item.defaultPrice !== undefined) {
    return parseFloat((item.defaultPrice * qty).toPrecision(10)).toFixed(2);
  }
  return null;
};

const getRMCategory = (
  purchasecategoryName?: string | null,
  category?: string | null
): "Raw" | "Packing" | "FG-External" | "Cleaning" => {
  const name = (purchasecategoryName || category || "").toLowerCase();
  if (name.includes("packing") || name.includes("pack")) return "Packing";
  if (name.includes("raw") || name.includes("material")) return "Raw";
  if (name.includes("fg-external") || name.includes("external")) return "FG-External";
  if (name.includes("cleaning")) return "Cleaning";
  return "Raw";
};

// Compact row height so roughly 10 rows are visible by default without scrolling.
const ROW_HEIGHT_REM = 2.1; // matches the tightened py-1.5 row padding below

export default function NewRecipePage() {
  const router = useRouter();
  const pathname = usePathname();
  const dispatch = useDispatch<AppDispatch>();
  const keyboard = useCustomKeyboard();
  const searchParams = useSearchParams();
 const recipeIdFromUrl = searchParams?.get("recipeId") ?? null;
  const {
    packingList, sfgList, rawList,
    recipeNamesLoading, recipeNames,
    sfgLoading, rawLoading, packingLoading,
    draftRecipe,
    gramPriceLoading,
  } = useSelector((state: RootState) => state.newrecipe);

  const { versions } = useSelector((state: RootState) => state.recipehistory);

  const [recipeName, setRecipeName] = useState<string>("");
  const [cost, setCost] = useState<string>("");
  const [recipeItems, setRecipeItems] = useState<RecipeItem[]>([]);
  const [recipeSearch, setRecipeSearch] = useState<string>("");
  const [sfgSearch, setSfgSearch] = useState<string>("");
  const [rawSearch, setRawSearch] = useState<string>("");
  const [packingSearch, setPackingSearch] = useState<string>("");
  const [showSubmitConfirm, setShowSubmitConfirm] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [showClearConfirm, setShowClearConfirm] = useState<boolean>(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState<boolean>(false);
  const [showRecipePopup, setShowRecipePopup] = useState<boolean>(false);
  const [selectedRecipeObj, setSelectedRecipeObj] = useState<RecipeName | null>(null);
  // holds the linked itemName shown in the extra read-only field
  const [selectedItemName, setSelectedItemName] = useState<string>("");
  const [snackbar, setSnackbar] = useState<{
    open: boolean; message: string; type: "success" | "error" | "info";
  }>({ open: false, message: "", type: "info" });

  const [packingPopup, setPackingPopup] = useState<{
    show: boolean; pendingItem: RawMaterial | null; takeAway: boolean; dineIn: boolean;
  }>({ show: false, pendingItem: null, takeAway: false, dineIn: false });

  const [kgPopup, setKgPopup] = useState<{
    show: boolean;
    pendingItem: RawMaterial | null;
    totalGramsInput: string;
    error: string;
  }>({ show: false, pendingItem: null, totalGramsInput: "", error: "" });

  const [deleteConfirm, setDeleteConfirm] = useState<{
    show: boolean;
    frontendKey: string | null;
    name: string;
  }>({ show: false, frontendKey: null, name: "" });

  // Collapsed by default — clicking a group header shows only that group's rows.
  const [expandedGroups, setExpandedGroups] = useState<{
    SFG: boolean; Raw: boolean; Packing: boolean;
  }>({ SFG: true, Raw: true, Packing: true });

  const toggleGroup = (group: "SFG" | "Raw" | "Packing") =>
    setExpandedGroups((prev) => ({ ...prev, [group]: !prev[group] }));

  const recipeRef = useRef<HTMLDivElement>(null);
  const draftRecipeIdRef = useRef<string | undefined>(undefined);
  const prevSfgSearchRef = useRef<string>("");
  const prevRawSearchRef = useRef<string>("");
  const prevPackingSearchRef = useRef<string>("");
  const fetchedForRecipeRef = useRef<string | null>(null);

  const NEXT_PUBLIC_API_BASE_URL = " https://yenerp.com/recipeapi/"

  const isEditingExisting = Boolean(recipeIdFromUrl || draftRecipe?.recipeId);

  const handleLogout = () => {
    router.push('/');
  };

  const handleMenuClick = useCallback((menuItem: { path: string }) => {
    router.push(menuItem.path);
  }, [router]);

  useEffect(() => {
    if (!recipeIdFromUrl) return;
    if (fetchedForRecipeRef.current === recipeIdFromUrl) return;
    fetchedForRecipeRef.current = recipeIdFromUrl;

    axios
      .get<LatestVersionApiResponse>(`${NEXT_PUBLIC_API_BASE_URL}allrecipes/${recipeIdFromUrl}/latest-version`)
      .then((res) => {
        const latest = res.data;
        const normalizedItems: DraftRecipeItem[] = latest.items
          .filter((item) => item.type === "RM" || item.type === "SFG")
          .map((item) => ({
            id: item.id,
            name: item.name,
            code: item.randomId || item.code,
            uom: item.uom,
            type: item.type,
            category: item.category ?? undefined,
            randomId: item.randomId ?? undefined,
            quantity: item.isGramBased && item.quantityInGrams != null
              ? item.quantityInGrams
              : (item.quantity ?? 0),
            unitPrice: item.unitPrice ?? undefined,
            totalPrice: item.totalPrice ?? undefined,
            takeAway: item.takeAway ?? undefined,
            dineIn: item.dineIn ?? undefined,
            isGramBased: item.isGramBased ?? undefined,
            quantityInGrams: item.quantityInGrams ?? undefined,
            totalKgForPrice: item.totalKgForPrice ?? undefined,
          }));

        dispatch(
          setNewRecipeDraft({
            recipeId: recipeIdFromUrl,
            recipeName: latest.itemName || latest.recipeName || "", // recipeName is required (string), not string | undefined
            items: normalizedItems,
            fromVersion: latest.version,
            totalItemsCost: latest.totalItemsCost,
            // ✅ FIX — was reading latest.recipeMeta?.item_Defaultprice, which the backend
            // no longer sends. Cost now comes back as a top-level `cost` field.
            item_Defaultprice: latest.cost ?? latest.recipeMeta?.item_Defaultprice,
          })
        );

        // ✅ changed — Item Name field now gets varianceName
        // setSelectedItemName(
        //   latest.recipeMeta?.varianceName || ""
        // );

        // // populate the read-only Item Name field when editing an existing recipe
        // setSelectedItemName(
        //   latest.recipeMeta?.itemName || latest.itemName || ""
        // );

        // populate the read-only Recipe Name field when editing an existing recipe
        setSelectedItemName(
          latest.recipeMeta?.itemName ||
          latest.recipeMeta?.varianceName ||
          latest.itemName ||
          ""
        );

      })
      .catch((err) => {
        console.error("Failed to reload recipe draft on refresh:", err);
        showSnackbar("Failed to reload recipe data", "error");
        fetchedForRecipeRef.current = null;
      });
  }, [recipeIdFromUrl, dispatch]);

  useEffect(() => {
    if (!keyboard.activeInputId) return;
    const value = keyboard.inputValue;

    if (keyboard.activeInputId === "recipeName") {
      setRecipeName(value);
      setShowRecipePopup(true);
    } else if (keyboard.activeInputId === "sfgSearch") {
      setSfgSearch(value);
    } else if (keyboard.activeInputId === "rawSearch") {
      setRawSearch(value);
    } else if (keyboard.activeInputId === "packingSearch") {
      setPackingSearch(value);
    } else if (keyboard.activeInputId.startsWith("quantity-")) {
      const frontendKey = keyboard.activeInputId.replace("quantity-", "");
      if (value !== "") {
        updateItemQuantity(frontendKey, value);
      }
    }
  }, [keyboard.inputValue, keyboard.activeInputId]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (recipeRef.current && !recipeRef.current.contains(e.target as Node))
        setShowRecipePopup(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      if (sfgSearch.trim().length >= 2) dispatch(fetchSFGMaterials(sfgSearch));
      prevSfgSearchRef.current = sfgSearch;
    }, 300);
    return () => clearTimeout(t);
  }, [sfgSearch, dispatch]);

  useEffect(() => {
    const t = setTimeout(() => {
      if (rawSearch.trim().length >= 2) dispatch(fetchRawMaterials(rawSearch));
      prevRawSearchRef.current = rawSearch;
    }, 300);
    return () => clearTimeout(t);
  }, [rawSearch, dispatch]);

  useEffect(() => {
    const t = setTimeout(() => {
      if (packingSearch.trim().length >= 2) dispatch(fetchPackingMaterials(packingSearch));
      prevPackingSearchRef.current = packingSearch;
    }, 300);
    return () => clearTimeout(t);
  }, [packingSearch, dispatch]);

  useEffect(() => {
    if (!showRecipePopup) return;
    const t = setTimeout(() => {
      if (recipeName.trim().length >= 2) dispatch(fetchRecipeNames(recipeName));
    }, 300);
    return () => clearTimeout(t);
  }, [recipeName, showRecipePopup, dispatch]);

  useEffect(() => {
    if (!draftRecipe) {
      setRecipeName(""); setCost(""); setRecipeItems([]); setSelectedRecipeObj(null);
      setSelectedItemName(""); // reset when draft is cleared
      return;
    }
    draftRecipeIdRef.current = draftRecipe.recipeId;
    setRecipeName(draftRecipe.recipeName);
    if (draftRecipe.item_Defaultprice !== undefined)
      setCost(draftRecipe.item_Defaultprice.toString());
    setRecipeItems(
      draftRecipe.items.map((item) => {
        const isNonKg = item.isGramBased && !isKgUom(item.uom);

        return {
          frontendKey: `${item.type}-${item.randomId || item.code || item.id || "unknown"}`,
          realCode: item.randomId || item.code || item.id || "unknown",
          name: item.name,
          code: item.randomId || item.code || item.id || "unknown",
          uom: item.uom,
          type: item.type === "SFG" ? "SFG" : "RM",
          category: item.type !== "SFG" ? getRMCategory(item.category ?? undefined) : undefined,
          quantity: item.quantity.toString(),
          placeholder: isKgUom(item.uom) ? "Enter grams (e.g. 500 = 0.5 Kg)" : "Enter grams",
          status: "assigned" as const,
          defaultPrice: item.unitPrice ?? undefined,
          takeAway: item.takeAway ?? false,
          dineIn: item.dineIn ?? false,
          randomId: item.randomId ?? undefined,
          isNonKgGramEntry: isNonKg ? true : undefined,
          pricePerGram: isNonKg ? (item.unitPrice ?? undefined) : undefined,
          totalKgForPrice: item.totalKgForPrice ?? undefined,
        };
      })
    );
  }, [draftRecipe]);

  // const filtered = recipeItems.filter(
  //   (item) =>
  //     (item.name ?? "").toLowerCase().includes(recipeSearch.toLowerCase()) ||
  //     (item.code ?? "").toLowerCase().includes(recipeSearch.toLowerCase()) ||
  //     (item.type ?? "").toLowerCase().includes(recipeSearch.toLowerCase())
  // );
  // const sfgItems = filtered.filter((i) => i.type === "SFG");
  // const rawItems = filtered.filter((i) => i.type === "RM" && i.category !== "Packing");
  // const packingItems = filtered.filter((i) => i.type === "RM" && i.category === "Packing");

  // const isItemSelected = (frontendKey: string) =>
  //   recipeItems.some((item) => item.frontendKey === frontendKey);


  const filtered = recipeItems.filter(
    (item) =>
      (item.name ?? "").toLowerCase().includes(recipeSearch.toLowerCase()) ||
      (item.code ?? "").toLowerCase().includes(recipeSearch.toLowerCase()) ||
      (item.type ?? "").toLowerCase().includes(recipeSearch.toLowerCase())
  );
  const sfgItems = filtered.filter((i) => i.type === "SFG");
  const rawItems = filtered.filter((i) => i.type === "RM" && i.category !== "Packing");
  const packingItems = filtered.filter((i) => i.type === "RM" && i.category === "Packing");

  // 👇 paste it here
  const totalItemsCost = useMemo(() => {
    return recipeItems.reduce((sum, item) => {
      const price = calcDisplayPrice(item);
      return sum + (price ? parseFloat(price) : 0);
    }, 0);
  }, [recipeItems]);

  const isItemSelected = (frontendKey: string) =>
    recipeItems.some((item) => item.frontendKey === frontendKey);


  const showSnackbar = (
    message: string,
    type: "success" | "error" | "info" = "info",
    duration = 3000
  ) => {
    setSnackbar({ open: true, message, type });
    setTimeout(() => setSnackbar((prev) => ({ ...prev, open: false })), duration);
  };

  const updateItemQuantity = (frontendKey: string, inputValue: string) => {
    setRecipeItems((prev) =>
      prev.map((item) =>
        item.frontendKey === frontendKey ? { ...item, quantity: inputValue } : item
      )
    );
  };

  const handleRemoveFromRecipe = (frontendKey?: string) => {
    if (frontendKey) {
      const item = recipeItems.find((i) => i.frontendKey === frontendKey);
      setDeleteConfirm({ show: true, frontendKey, name: item?.name || "this item" });
    } else {
      setRecipeItems([]);
      setShowClearConfirm(false);
    }
  };

  const confirmDeleteItem = () => {
    if (deleteConfirm.frontendKey) {
      setRecipeItems((prev) => prev.filter((item) => item.frontendKey !== deleteConfirm.frontendKey));
    }
    setDeleteConfirm({ show: false, frontendKey: null, name: "" });
  };

  const toggleItemSelection = (item: SFGMaterial | RawMaterial, type: "SFG" | "RM") => {
    const sfg = item as SFGMaterial;
    const rm = item as RawMaterial;

    const realCode = type === "SFG"
      ? sfg.itemCode
      : rm.randomId || rm.itemCode || rm.purchaseitemId || rm.itemName || "NO-CODE";

    const frontendKey = `${type}-${realCode}`;
    const uom = type === "SFG" ? sfg.variance_Uom : rm.uom;

    if (recipeItems.find((r) => r.frontendKey === frontendKey)) {
      setRecipeItems((prev) => prev.filter((r) => r.frontendKey !== frontendKey));
      return;
    }

    if (type === "RM" && !isKgUom(uom)) {
      setKgPopup({ show: true, pendingItem: rm, totalGramsInput: "", error: "" });
      return;
    }

    const name = type === "SFG" ? sfg.varianceName : rm.itemName;
    const category = type === "RM"
      ? getRMCategory(rm.purchasecategoryName, undefined)
      : undefined;
    const defaultPrice: number | undefined =
      type === "SFG"
        ? (sfg.variance_Defaultprice ?? 0)
        : rm.purchasePrice != null ? rm.purchasePrice : undefined;

    setRecipeItems((prev) => [
      ...prev,
      {
        frontendKey,
        realCode,
        name,
        code: realCode,
        ...(type === "RM" && { randomId: rm.randomId ?? undefined }),
        uom,
        type,
        category,
        quantity: "",
        placeholder: isKgUom(uom) ? "Enter grams (e.g. 500 = 0.5 Kg)" : "Enter quantity",
        status: "assigned",
        defaultPrice,
      },
    ]);
    if (type === "SFG") setSfgSearch("");
    else { setRawSearch(""); setPackingSearch(""); }
  };

  const confirmKgItem = async () => {
    const item = kgPopup.pendingItem;
    if (!item) return;

    const totalGrams = parseFloat(kgPopup.totalGramsInput);
    if (!kgPopup.totalGramsInput.trim() || isNaN(totalGrams) || totalGrams <= 0) {
      setKgPopup((prev) => ({ ...prev, error: "Please enter a valid gram value (e.g. 500)" }));
      return;
    }

    const totalKg = totalGrams / 1000;
    const itemId = item.randomId || item.itemCode || "";
    if (!itemId) {
      setKgPopup((prev) => ({ ...prev, error: "Item has no ID — cannot calculate price" }));
      return;
    }

    const result = await dispatch(calculateGramPrice({ itemId, totalKg }));

    if (calculateGramPrice.rejected.match(result)) {
      setKgPopup((prev) => ({
        ...prev,
        error: (result.payload as string) || "Backend error. Try again.",
      }));
      return;
    }

    const { pricePerGram, totalKg: confirmedKg } = result.payload as {
      pricePerGram: number;
      totalKg: number;
    };

    const itemIdentifier = item.randomId || item.itemCode || item.purchaseitemId || item.itemName || "NO-ID";
    const frontendKey = `RM-${itemIdentifier}`;
    const category = getRMCategory(item.purchasecategoryName, undefined);

    setRecipeItems((prev) => [
      ...prev,
      {
        frontendKey,
        realCode: itemIdentifier,
        name: item.itemName,
        code: itemIdentifier,
        randomId: item.randomId ?? undefined,
        uom: item.uom,
        type: "RM",
        category,
        quantity: "",
        placeholder: "Enter grams",
        status: "assigned",
        defaultPrice: item.purchasePrice ?? undefined,
        isNonKgGramEntry: true,
        totalKgForPrice: confirmedKg,
        pricePerGram,
      },
    ]);

    setRawSearch("");
    setKgPopup({ show: false, pendingItem: null, totalGramsInput: "", error: "" });
  };

  const handlePackingItemClick = (item: RawMaterial) => {
    const realCode = item.randomId || item.itemCode || item.purchaseitemId || item.itemName || "NO-CODE";
    const frontendKey = `RM-${realCode}`;
    if (recipeItems.find((r) => r.frontendKey === frontendKey)) {
      setRecipeItems((prev) => prev.filter((r) => r.frontendKey !== frontendKey));
    } else {
      setPackingPopup({ show: true, pendingItem: item, takeAway: false, dineIn: false });
    }
  };

  const confirmPackingItem = () => {
    const item = packingPopup.pendingItem;
    if (!item) return;
    const realCode = item.randomId || item.itemCode || item.purchaseitemId || item.itemName || "NO-CODE";
    const frontendKey = `RM-${realCode}`;
    const uom = item.uom;
    setRecipeItems((prev) => [
      ...prev,
      {
        frontendKey,
        realCode,
        name: item.itemName,
        code: realCode,
        randomId: item.randomId ?? undefined,
        uom,
        type: "RM",
        category: getRMCategory(item.purchasecategoryName, undefined),
        quantity: "",
        placeholder: isKgUom(uom) ? "Enter grams (e.g. 500 = 0.5 Kg)" : "Enter quantity",
        status: "assigned",
        defaultPrice: item.purchasePrice != null ? item.purchasePrice : undefined,
        takeAway: packingPopup.takeAway,
        dineIn: packingPopup.dineIn,
      },
    ]);
    setPackingSearch("");
    setPackingPopup({ show: false, pendingItem: null, takeAway: false, dineIn: false });
  };

  const handleSubmitClick = () => {
    if (!recipeName.trim()) { showSnackbar("Please enter recipe name"); return; }
    const costNum = Number(cost);
    if (!cost.trim() || isNaN(costNum) || costNum <= 0) {
      showSnackbar("Please enter a valid positive cost"); return;
    }
    if (recipeItems.length === 0) {
      showSnackbar("Please add at least one item to the recipe"); return;
    }
    const invalidItems = recipeItems.filter((item) => {
      const q = item.quantity?.trim();
      return !q || isNaN(Number(q)) || Number(q) <= 0;
    });
    if (invalidItems.length > 0) {
      showSnackbar(`Please enter valid quantity for: ${invalidItems.map((i) => i.name).join(", ")}`);
      return;
    }
    setShowSubmitConfirm(true);
  };

  const handleSave = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      const itemsForBackend: BackendRecipeItemPayload[] = recipeItems.map((item) => {
        let finalQuantity: number;
        let quantityInGrams: number | undefined;
        let unitPrice: number;
        let totalPrice: number;

        if (item.isNonKgGramEntry && item.pricePerGram != null) {
          quantityInGrams = Math.round(Number(item.quantity));
          finalQuantity = parseFloat((quantityInGrams / 1000).toFixed(3));
          unitPrice = item.pricePerGram;
          totalPrice = parseFloat((unitPrice * quantityInGrams).toFixed(2));
        } else if (isKgUom(item.uom)) {
          quantityInGrams = parseInt(item.quantity, 10);
          finalQuantity = parseFloat((quantityInGrams / 1000).toFixed(3));
          unitPrice = item.defaultPrice ?? 0;
          totalPrice = parseFloat((unitPrice * finalQuantity).toFixed(2));
        } else {
          finalQuantity = Math.round(Number(item.quantity));
          unitPrice = item.defaultPrice ?? 0;
          totalPrice = parseFloat((unitPrice * finalQuantity).toFixed(2));
        }

        return {
          id: item.type === "RM" ? (item.randomId || item.code) : item.code,
          name: item.name,
          code: item.type === "RM" ? (item.randomId || item.code) : item.code,
          uom: item.uom,
          type: item.type,
          ...(item.type === "RM" && {
            randomId: item.randomId || item.code,
            category: item.category
          }),
          ...(item.type === "SFG" && {
            itemCode: item.code
          }),
          quantity: finalQuantity,
          unitPrice: parseFloat(unitPrice.toFixed(6)),
          totalPrice,
          ...((item.isNonKgGramEntry || isKgUom(item.uom)) && {
            quantityInGrams,
            isGramBased: true,
          }),
          ...(item.isNonKgGramEntry && {
            totalKgForPrice: item.totalKgForPrice,
          }),
          takeAway: item.category === "Packing" ? (item.takeAway ?? false) : null,
          dineIn: item.category === "Packing" ? (item.dineIn ?? false) : null,
        };
      });

      await dispatch(
        createRecipe({
          recipeId: draftRecipeIdRef.current,
          recipeName,
          cost: Number(cost),
          totalItemsCost,
          recipeMeta: draftRecipeIdRef.current ? null : selectedRecipeObj,
          items: itemsForBackend,
        })
      ).unwrap();

      dispatch(clearNewRecipeDraft());
      draftRecipeIdRef.current = undefined;
      showSnackbar("Recipe Version created successfully!", "success", 2000);
      setTimeout(() => router.push("/yen-recipie/StoreKitchenMaster"), 2000);
    } catch (error: unknown) {
      const msg = axios.isAxiosError(error)
        ? error.response?.data?.detail ?? error.message
        : error instanceof Error
          ? error.message
          : "Failed to create recipe. Please try again.";
      showSnackbar(msg, "error");
    } finally {
      setIsSubmitting(false);
      setShowSubmitConfirm(false);
    }
  };

  const renderItemRow = (item: RecipeItem) => {
    const displayPrice = calcDisplayPrice(item);
    const isGramEntry = item.isNonKgGramEntry || isKgUom(item.uom);

    return (
      <div
        key={item.frontendKey}
        style={{ minHeight: `${ROW_HEIGHT_REM}rem` }}
        className="grid grid-cols-12 gap-2 items-center py-1.5 border-b last:border-b-0 px-3 hover:bg-gray-50 transition-colors"
      >
        <div className="col-span-4 min-w-0">
          <div className="font-medium text-sm break-words">{item.name}</div>
          {item.category === "Packing" && (
            <div className="flex gap-1 mt-0.5">
              <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${item.takeAway ? "bg-amber-100 text-amber-700" : "bg-gray-100 text-gray-400 line-through"}`}>TA</span>
              <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${item.dineIn ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-400 line-through"}`}>DI</span>
            </div>
          )}
        </div>

        <div className="col-span-2">
          <span className={`px-2 py-1 text-xs font-medium rounded-full ${item.type === "SFG" ? "bg-green-100 text-green-800" :
            item.category === "Packing" ? "bg-purple-100 text-purple-800" :
              item.category === "Raw" ? "bg-blue-100 text-blue-800" :
                "bg-gray-100 text-gray-700"
            }`}>
            {item.type === "SFG" ? "SFG" : item.category || "RM"}
          </span>
        </div>

        <div className="col-span-2">
          {displayPrice != null ? (
            <span className="text-sm font-semibold text-green-700">₹{displayPrice}</span>
          ) : (
            <span className="text-xs text-gray-400">
              {isGramEntry ? "Enter grams" : "—"}
            </span>
          )}
        </div>

        <div className="col-span-2">
          <input
            type="text"
            inputMode="numeric"
            maxLength={6}
            {...keyboard.getInputProps(
              `quantity-${item.frontendKey}`,
              item.quantity,
              (val) => updateItemQuantity(item.frontendKey, sanitizeDigits(val)),
              "number"
            )}
            placeholder={item.placeholder}
            className={`w-full border rounded px-3 py-1 text-sm focus:ring-2 ${isGramEntry ? "focus:ring-orange-400" : "focus:ring-blue-500"}`}
          />
        </div>

        <div className="col-span-1 text-sm text-gray-600">
          {isGramEntry ? "g" : item.uom}
        </div>

        <div className="col-span-1 flex justify-center">
          <button
            onClick={() => handleRemoveFromRecipe(item.frontendKey)}
            className="text-red-600 hover:text-red-800"
          >
            <Trash2 size={18} />
          </button>
        </div>
      </div>
    );
  };

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
   <div className="flex flex-col h-full min-h-0 overflow-hidden">
      {/* <Navbar moduleName="CREATE NEW RECIPE" onLogout={handleLogout} /> */}

      <div className="flex flex-1 overflow-hidden">
        {/* <SideMenu onMenuClick={handleMenuClick} activePath={pathname || '/'} /> */}

        <div className="flex flex-col flex-1 overflow-hidden bg-gray-50">
          <div className="flex flex-col flex-1 overflow-hidden bg-white m-2 rounded-xl shadow-lg">

            {/* Top row: split to mirror the left/right columns below.
                LEFT = Item Name + Recipe Name + Cost, RIGHT = Assign Items heading + Cancel/Submit */}
           <div
  className={`${styles.newRecipeSplitGrid} gap-4 border-b px-4 py-2 flex-shrink-0`}
>
              {/* LEFT: Item Name (first) + Recipe Name (second) + Cost */}
             <div
  className={`${styles.newRecipeHeaderFields} ${
    selectedRecipeObj || isEditingExisting
      ? styles.withRecipeName
      : styles.withoutRecipeName
  }`}
>
                {/* Item Name — now the SEARCH box (was Recipe Name before) */}

<div
  ref={recipeRef}
  className={`relative ${styles.newRecipeItemField}`}
>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Item Name *</label>
                  <input
                    value={recipeName}
                    readOnly={keyboard.isAndroid || isEditingExisting}
                    disabled={isEditingExisting}
                    onFocus={(e) => {
                      if (isEditingExisting) return;
                      if (keyboard.isAndroid) {
                        e.target.blur();
                        keyboard.openKeyboard("recipeName", recipeName, "text");
                      }
                      setShowRecipePopup(true);
                    }}
                    onChange={(e) => {
                      if (!keyboard.isAndroid && !isEditingExisting) setRecipeName(e.target.value);
                    }}
                    placeholder="Search item name..."
                    className={`w-full border border-gray-300 rounded-lg p-2 text-sm ${isEditingExisting ? "bg-gray-100 cursor-not-allowed" : ""}`}
                  />
                  {showRecipePopup && !isEditingExisting && (
                    <div
                      className="absolute top-full left-0 mt-2 bg-white border rounded-xl shadow-lg z-50"
                      style={{ width: "480px", maxWidth: "90vw" }}
                    >
                      <div className="p-4">
                        <h3 className="text-sm font-semibold mb-3">Select Item</h3>
                        <div className="max-h-40 overflow-y-auto">
                          {recipeName.trim().length < 2 ? (
                            <div className="text-center py-4 text-gray-500">Type at least 2 characters to search</div>
                          ) : recipeNamesLoading ? (
                            <div className="flex items-center justify-center py-6 gap-2 text-gray-500">
                              <svg className="animate-spin h-4 w-4 text-blue-500" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                              </svg>
                              <span className="text-sm">Searching items...</span>
                            </div>
                          ) : recipeNames.length === 0 ? (
                            <div className="text-center py-6 text-gray-500">No items found</div>
                          ) : (
                            recipeNames.map((r: RecipeName, idx: number) => {
                              const isUsed = !!r.isUsed;

                              return (
                                <div
                                  key={idx}
                                  onClick={() => {
                                    if (isUsed) return;
                                    setRecipeName(r.itemName || r.varianceName || "");
                                    setCost(r.item_Defaultprice?.toString() || "");
                                    setSelectedRecipeObj(r);
                                    setSelectedItemName(r.varianceName || r.itemName || "");
                                    setShowRecipePopup(false);
                                    keyboard.closeKeyboard();
                                  }}
                                  className={`flex items-center justify-between gap-2 px-3 py-2.5 border-b last:border-b-0 transition-colors ${isUsed ? "bg-gray-100 opacity-60 cursor-not-allowed" : "cursor-pointer hover:bg-blue-50"
                                    }`}
                                >
                                  <div className="min-w-0">
                                    <div className="text-sm font-medium text-gray-800 truncate">
                                      {r.itemName ? `${r.itemName} / ${r.varianceName}` : r.varianceName}
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2 flex-shrink-0">
                                    {r.item_Uom && (
                                      <span className="text-[10px] text-gray-400">{r.item_Uom}</span>
                                    )}
                                    {isUsed && (
                                      <span className="text-xs bg-gray-400 text-white px-2 py-0.5 rounded-full">
                                        Already Used
                                      </span>
                                    )}
                                  </div>
                                </div>
                              );
                            })
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>


                {/* Recipe Name — read-only, shows after an item is selected, or always in edit screen */}
                {(selectedRecipeObj || isEditingExisting) && (
                <div className={styles.newRecipeNameField}>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Recipe Name</label>
                    <input
                      value={selectedItemName}
                      readOnly
                      disabled
                      placeholder="Recipe name"
                      className="w-full border border-gray-300 rounded-lg p-2 text-sm bg-gray-100 cursor-not-allowed"
                    />
                  </div>
                )}

             <div className={styles.newRecipeCostField}>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Cost *</label>
                  <input
                    value={cost}
                    onChange={(e) => setCost(sanitizeDigits(e.target.value))}
                    placeholder="Cost"
                    type="text"
                    readOnly
                    inputMode="numeric"
                    maxLength={6}
                    className="w-full border border-gray-300 rounded-lg p-2 text-sm"
                  />
                </div>

                {/* NEW — Total Items Cost, read-only, live-updating */}
              <div className={styles.newRecipeTotalField}>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Total Items Cost</label>
                  <input
                    value={`₹${totalItemsCost.toFixed(2)}`}
                    readOnly
                    disabled
                    className="w-full border border-gray-300 rounded-lg p-2 text-sm bg-gray-100 cursor-not-allowed font-semibold text-green-700"
                  />
                </div>

                {draftRecipe?.recipeId && versions.length > 0 && (
                  <p className="text-xs text-blue-600 whitespace-nowrap pb-2">v{versions.length + 1}</p>
                )}
              </div>

              {/* RIGHT: Assign Items heading + Cancel/Submit, aligned above the table */}
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-800">Assign Items ({recipeItems.length})</h2>
                <div className="flex items-center gap-3">
                  <button onClick={() => setShowCancelConfirm(true)} className="btn-secondary">Cancel</button>
                  <button onClick={handleSubmitClick} disabled={recipeItems.length === 0} className="btn-primary">Submit Recipe</button>
                </div>
              </div>
            </div>

            {/* Main area: LEFT = 3 stacked dropdowns (vertical, gapped, non-shifting), RIGHT = table (full half, capped at 15 rows) */}
        <div
  className={`${styles.newRecipeSplitGrid} gap-4 flex-1 min-h-0 px-4 py-3 overflow-hidden`}
>
              {/* LEFT column: dropdowns stacked vertically with gaps.
                  Each block is only as tall as its label+input; the results panel is
                  absolutely positioned so opening one dropdown never moves the others. */}
              <div className="flex flex-col gap-6 min-h-0 overflow-y-auto pr-1">

                {/* SFG */}
                <div className="relative flex-shrink-0" style={{ zIndex: 30 }}>
                  <label className="block text-xs font-medium text-gray-700 mb-1">SFG Materials</label>
                  <input
                    {...keyboard.getInputProps("sfgSearch", sfgSearch, setSfgSearch, "text")}
                    placeholder="Search SFG... (min 2 chars)"
                    className="w-full border px-3 py-2 rounded text-sm"
                  />
                  {sfgSearch.trim().length >= 2 && (
                    <div className="absolute top-full left-0 mt-1 w-full bg-white border rounded-lg shadow-lg max-h-56 overflow-y-auto z-30">
                      {sfgLoading ? (
                        <div className="flex items-center justify-center py-4 gap-2 text-gray-500">
                          <svg className="animate-spin h-4 w-4 text-blue-500" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                          </svg>
                          <span className="text-sm">Loading...</span>
                        </div>
                      ) : sfgList.length === 0 ? (
                        <div className="text-center py-3 text-sm text-gray-500">No SFG materials found</div>
                      ) : (
                        sfgList.map((item: SFGMaterial, index: number) => {
                          const frontendKey = `SFG-${item.itemCode}`;
                          const isSelected = isItemSelected(frontendKey);
                          return (
                            <div
                              key={`sfg-${item.itemCode}-${index}`}
                              onClick={() => { toggleItemSelection(item, "SFG"); keyboard.closeKeyboard(); }}
                              className={`flex items-center justify-between gap-2 px-3 py-2.5 border-b last:border-b-0 cursor-pointer transition-colors ${isSelected ? "bg-blue-50" : "hover:bg-gray-50"}`}
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <span className="w-1.5 h-1.5 rounded-full bg-green-400 flex-shrink-0" />
                                <span className="text-sm font-medium text-gray-800 truncate">{item.varianceName}</span>
                                <span className="text-[10px] text-gray-400 flex-shrink-0">{item.variance_Uom}</span>
                              </div>
                              {isSelected && <span className="text-xs bg-blue-500 text-white px-2 py-0.5 rounded-full flex-shrink-0">Added</span>}
                            </div>
                          );
                        })
                      )}
                    </div>
                  )}
                </div>

                {/* Raw Materials */}
                <div className="relative flex-shrink-0" style={{ zIndex: 20 }}>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Raw Materials</label>
                  <input
                    {...keyboard.getInputProps("rawSearch", rawSearch, setRawSearch, "text")}
                    placeholder="Search Raw Material... (min 2 chars)"
                    className="w-full border px-3 py-2 rounded text-sm"
                  />
                  {rawSearch.trim().length >= 2 && (
                    <div className="absolute top-full left-0 mt-1 w-full bg-white border rounded-lg shadow-lg max-h-56 overflow-y-auto z-20">
                      {rawLoading ? (
                        <div className="flex items-center justify-center py-4 gap-2 text-gray-500">
                          <svg className="animate-spin h-4 w-4 text-blue-500" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                          </svg>
                          <span className="text-sm">Loading...</span>
                        </div>
                      ) : rawList.length === 0 ? (
                        <div className="text-center py-3 text-sm text-gray-500">No raw materials found</div>
                      ) : (
                        rawList.map((item: RawMaterial, index: number) => {
                          const identifier = item.randomId || item.itemCode || item.purchaseitemId || item.itemName;
                          const frontendKey = `RM-${identifier}`;
                          const isSelected = isItemSelected(frontendKey);
                          return (
                            <div
                              key={`raw-${identifier}-${index}`}
                              onClick={() => { toggleItemSelection(item, "RM"); keyboard.closeKeyboard(); }}
                              className={`flex items-center justify-between gap-2 px-3 py-2.5 border-b last:border-b-0 cursor-pointer transition-colors ${isSelected ? "bg-blue-50" : "hover:bg-gray-50"}`}
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <span className="w-1.5 h-1.5 rounded-full bg-blue-400 flex-shrink-0" />
                                <span className="text-sm font-medium text-gray-800 truncate">{item.itemName}</span>
                                <span className="text-[10px] text-gray-400 flex-shrink-0">{item.uom}</span>
                              </div>
                              {isSelected && <span className="text-xs bg-blue-500 text-white px-2 py-0.5 rounded-full flex-shrink-0">Added</span>}
                            </div>
                          );
                        })
                      )}
                    </div>
                  )}
                </div>

                {/* Packing Materials */}
                <div className="relative flex-shrink-0" style={{ zIndex: 10 }}>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Packing Materials</label>
                  <input
                    {...keyboard.getInputProps("packingSearch", packingSearch, setPackingSearch, "text")}
                    placeholder="Search Packing Material... (min 2 chars)"
                    className="w-full border px-3 py-2 rounded text-sm"
                  />
                  {packingSearch.trim().length >= 2 && (
                    <div className="absolute top-full left-0 mt-1 w-full bg-white border rounded-lg shadow-lg max-h-56 overflow-y-auto z-10">
                      {packingLoading ? (
                        <div className="flex items-center justify-center py-4 gap-2 text-gray-500">
                          <svg className="animate-spin h-4 w-4 text-blue-500" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                          </svg>
                          <span className="text-sm">Loading...</span>
                        </div>
                      ) : packingList.length === 0 ? (
                        <div className="text-center py-3 text-sm text-gray-500">No packing materials found</div>
                      ) : (
                        packingList.map((item: RawMaterial, index: number) => {
                          const identifier = item.randomId || item.itemCode || item.purchaseitemId || item.itemName;
                          const frontendKey = `RM-${identifier}`;
                          const isSelected = isItemSelected(frontendKey);
                          return (
                            <div
                              key={`packing-${identifier}-${index}`}
                              onClick={() => { handlePackingItemClick(item); keyboard.closeKeyboard(); }}
                              className={`flex items-center justify-between gap-2 px-3 py-2.5 border-b last:border-b-0 cursor-pointer transition-colors ${isSelected ? "bg-purple-50" : "hover:bg-gray-50"}`}
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <span className="w-1.5 h-1.5 rounded-full bg-purple-400 flex-shrink-0" />
                                <span className="text-sm font-medium text-gray-800 truncate">{item.itemName}</span>
                                <span className="text-[10px] text-gray-400 flex-shrink-0">{item.uom}</span>
                              </div>
                              {isSelected && <span className="text-xs bg-purple-500 text-white px-2 py-0.5 rounded-full flex-shrink-0">Added</span>}
                            </div>
                          );
                        })
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* RIGHT: Recipe Items table — fills the full half-height/width; capped to 15 rows, then scrolls */}
              <div className="border border-gray-200 rounded-lg overflow-hidden flex flex-col h-full min-h-0">
                <div className="flex-1 min-h-0 overflow-y-auto">
                  {recipeItems.length === 0 ? (
                    <div className="text-center py-10 text-gray-500">
                      <div className="text-3xl mb-2">📦</div>
                      <p className="mb-1 font-medium text-sm">No items in recipe</p>
                      <p className="text-xs">Select items from the left panel</p>
                    </div>
                  ) : filtered.length === 0 ? (
                    <div className="text-center py-6 text-gray-500"><p className="text-sm">No items match your search</p></div>
                  ) : (
                    <div>
                      <div className="grid grid-cols-12 gap-2 text-xs font-medium text-gray-600 py-2 border-b px-3 bg-gray-50 sticky top-0 z-10">
                        <div className="col-span-4">Item Name</div>
                        <div className="col-span-2">Type</div>
                        <div className="col-span-2">Price</div>
                        <div className="col-span-2">Quantity</div>
                        <div className="col-span-1">UOM</div>
                        <div className="col-span-1 text-center">Actions</div>
                      </div>

                      {sfgItems.length > 0 && (
                        <div>
                          <button
                            type="button"
                            onClick={() => toggleGroup("SFG")}
                            className="w-full flex items-center gap-2 px-3 py-1.5 bg-green-50 border-y border-green-100 hover:bg-green-100 transition-colors"
                          >
                            <span className={`text-green-600 text-xs transition-transform ${expandedGroups.SFG ? "rotate-90" : ""}`}>▶</span>
                            <span className="text-xs font-bold text-green-700 uppercase tracking-wide">SFG</span>
                            <span className="text-xs text-green-500 font-medium">({sfgItems.length})</span>
                          </button>
                          {expandedGroups.SFG && sfgItems.map(renderItemRow)}
                        </div>
                      )}

                      {rawItems.length > 0 && (
                        <div>
                          <button
                            type="button"
                            onClick={() => toggleGroup("Raw")}
                            className="w-full flex items-center gap-2 px-3 py-1.5 bg-blue-50 border-y border-blue-100 hover:bg-blue-100 transition-colors"
                          >
                            <span className={`text-blue-600 text-xs transition-transform ${expandedGroups.Raw ? "rotate-90" : ""}`}>▶</span>
                            <span className="text-xs font-bold text-blue-700 uppercase tracking-wide">Raw Materials</span>
                            <span className="text-xs text-blue-500 font-medium">({rawItems.length})</span>
                          </button>
                          {expandedGroups.Raw && rawItems.map(renderItemRow)}
                        </div>
                      )}

                      {packingItems.length > 0 && (
                        <div>
                          <button
                            type="button"
                            onClick={() => toggleGroup("Packing")}
                            className="w-full flex items-center gap-2 px-3 py-1.5 bg-purple-50 border-y border-purple-100 hover:bg-purple-100 transition-colors"
                          >
                            <span className={`text-purple-600 text-xs transition-transform ${expandedGroups.Packing ? "rotate-90" : ""}`}>▶</span>
                            <span className="text-xs font-bold text-purple-700 uppercase tracking-wide">Packing Materials</span>
                            <span className="text-xs text-purple-500 font-medium">({packingItems.length})</span>
                          </button>
                          {expandedGroups.Packing && packingItems.map(renderItemRow)}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Custom Keyboard ──────────────────────────────────────────────── */}
      {keyboard.isAndroid && (
        <CustomKeyboard
          isOpen={keyboard.isKeyboardOpen}
          onClose={keyboard.closeKeyboard}
          onKeyPress={keyboard.handleKeyPress}
          onDelete={keyboard.handleDelete}
          onClear={keyboard.handleClear}
          value={keyboard.inputValue}
          type={keyboard.inputType}
        />
      )}

      {/* ── Snackbar ─────────────────────────────────────────────────────── */}
      {snackbar.open && (
        <div className={`fixed bottom-6 right-6 text-white px-6 py-3 rounded-lg shadow-lg text-sm z-50 ${snackbar.type === "success" ? "bg-green-600" : snackbar.type === "error" ? "bg-red-600" : "bg-blue-600"}`}>
          {snackbar.message}
        </div>
      )}

      {/* ── Cancel confirm ───────────────────────────────────────────────── */}
      {showCancelConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 overflow-hidden">
            <div className="h-1 w-full bg-gradient-to-r from-orange-400 to-red-500" />
            <div className="p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center shrink-0">
                  <svg className="w-5 h-5 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-base font-semibold text-gray-800">Discard Changes?</h3>
                  <p className="text-xs text-gray-500 mt-0.5">This action cannot be undone</p>
                </div>
              </div>
              <p className="text-sm text-gray-600 bg-gray-50 rounded-lg px-4 py-3 border border-gray-100">You have unsaved recipe data. Going back will discard all your current progress.</p>
              <div className="flex gap-3 mt-5">
                <button onClick={() => setShowCancelConfirm(false)} className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">Keep Editing</button>
                <button onClick={() => { setShowCancelConfirm(false); router.back(); }} className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-red-500 rounded-lg hover:bg-red-600 transition-colors">Yes, Discard</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Submit confirm ───────────────────────────────────────────────── */}
      {showSubmitConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 overflow-hidden">
            <div className="h-1 w-full bg-gradient-to-r from-green-400 to-blue-500" />
            <div className="p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                  <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-base font-semibold text-gray-800">Submit Recipe?</h3>
                  <p className="text-xs text-gray-500 mt-0.5">Please review before confirming</p>
                </div>
              </div>
              <div className="bg-gray-50 rounded-lg px-4 py-3 border border-gray-100 space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-gray-500">Recipe Name</span><span className="font-medium text-gray-800 text-right max-w-[60%] truncate">{recipeName}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Cost</span><span className="font-medium text-gray-800">₹{cost}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Total Items</span><span className="font-medium text-gray-800">{recipeItems.length}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Total Items Cost</span><span className="font-medium text-green-700">₹{totalItemsCost.toFixed(2)}</span></div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Items without qty</span>
                  <span className={`font-medium ${recipeItems.filter((i) => !i.quantity || Number(i.quantity) === 0).length > 0 ? "text-red-600" : "text-green-600"}`}>
                    {recipeItems.filter((i) => !i.quantity || Number(i.quantity) === 0).length === 0
                      ? "✓ All filled"
                      : `${recipeItems.filter((i) => !i.quantity || Number(i.quantity) === 0).length} missing`}
                  </span>
                </div>
              </div>
              <div className="flex gap-3 mt-5">
                <button onClick={() => setShowSubmitConfirm(false)} className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">Cancel</button>
                <button
                  onClick={handleSave}
                  disabled={isSubmitting}
                  className={`flex-1 px-4 py-2.5 text-sm font-medium text-white rounded-lg transition-colors ${isSubmitting ? "bg-gray-400 cursor-not-allowed" : "bg-green-500 hover:bg-green-600"}`}
                >
                  {isSubmitting ? "Submitting..." : "Confirm Submit"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Packing order-type popup ─────────────────────────────────────── */}
      {packingPopup.show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 overflow-hidden">
            <div className="h-1 w-full bg-gradient-to-r from-purple-400 to-purple-600" />
            <div className="p-6">
              <div className="flex items-center gap-3 mb-1">
                <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center shrink-0">
                  <svg className="w-5 h-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-base font-semibold text-gray-800">Select Order Type</h3>
                  <p className="text-xs text-gray-500 mt-0.5 max-w-[200px] truncate">{packingPopup.pendingItem?.itemName}</p>
                </div>
              </div>
              <p className="text-xs text-gray-400 mb-4 ml-1">Select which order types this packing item applies to</p>
              <div className="space-y-3">
                <label className={`flex items-center gap-3 p-3 border-2 rounded-xl cursor-pointer transition-all ${packingPopup.takeAway ? "border-amber-400 bg-amber-50" : "border-gray-200 hover:border-amber-200 hover:bg-amber-50/50"}`}>
                  <input type="checkbox" checked={packingPopup.takeAway} onChange={(e) => setPackingPopup((prev) => ({ ...prev, takeAway: e.target.checked }))} className="w-4 h-4 accent-amber-500 rounded" />
                  <div className="flex items-center gap-2 flex-1"><span className="text-lg">🥡</span><span className="text-sm font-semibold text-gray-700">Take Away</span></div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${packingPopup.takeAway ? "bg-amber-500 text-white" : "bg-gray-100 text-gray-400"}`}>TA</span>
                </label>
                <label className={`flex items-center gap-3 p-3 border-2 rounded-xl cursor-pointer transition-all ${packingPopup.dineIn ? "border-blue-400 bg-blue-50" : "border-gray-200 hover:border-blue-200 hover:bg-blue-50/50"}`}>
                  <input type="checkbox" checked={packingPopup.dineIn} onChange={(e) => setPackingPopup((prev) => ({ ...prev, dineIn: e.target.checked }))} className="w-4 h-4 accent-blue-500 rounded" />
                  <div className="flex items-center gap-2 flex-1"><span className="text-lg">🍽️</span><span className="text-sm font-semibold text-gray-700">Dine In</span></div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${packingPopup.dineIn ? "bg-blue-500 text-white" : "bg-gray-100 text-gray-400"}`}>DI</span>
                </label>
              </div>
              <div className="flex gap-3 mt-5">
                <button onClick={() => setPackingPopup({ show: false, pendingItem: null, takeAway: false, dineIn: false })} className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">Cancel</button>
                <button onClick={confirmPackingItem} className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-purple-500 rounded-lg hover:bg-purple-600 transition-colors">Add Item</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── kgPopup ──────────────────────────────────────────────────────── */}
      {kgPopup.show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 overflow-hidden">
            <div className="h-1 w-full" />
            <div className="p-5">
              <div className="flex items-center gap-3 mb-1">
                <div className="w-9 h-9 rounded-full bg-orange-100 flex items-center justify-center shrink-0">
                  <svg className="w-4 h-4 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-800">Enter Purchase Weight (Grams)</h3>
                  <p className="text-xs text-gray-500 truncate max-w-[220px]">{kgPopup.pendingItem?.itemName}</p>
                </div>
              </div>

              <div className="flex gap-3 mb-2 ml-1 mt-1">
                <span className="text-xs text-gray-500">Price: <strong className="text-gray-700">₹{kgPopup.pendingItem?.purchasePrice ?? "—"}</strong></span>
                <span className="text-xs text-gray-500">UOM: <strong className="text-gray-700">{kgPopup.pendingItem?.uom}</strong></span>
              </div>
              <p className="text-xs text-gray-400 mb-3 ml-1">
                How many grams  does this purchase cover?<br />
                Backend will calculate exact price per gram.
              </p>

              <div className={`flex items-center border-2 rounded-xl overflow-hidden mb-1 ${kgPopup.error ? "border-red-400" : "border-gray-300"}`}>
                <span className="px-3 py-3 text-sm font-bold text-gray-500 border-r border-gray-100 bg-gray-50 select-none">g</span>
                <span className={`flex-1 px-3 py-3 text-lg font-mono font-semibold ${kgPopup.totalGramsInput ? "text-gray-800" : "text-gray-300"}`}>
                  {kgPopup.totalGramsInput || "0"}
                </span>
              </div>
              {kgPopup.error && (
                <p className="text-xs text-red-500 mb-2 ml-1">{kgPopup.error}</p>
              )}
              <div className="grid grid-cols-3 gap-2 mb-3">
                {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((k) => (
                  <button
                    key={k}
                    onClick={() => setKgPopup((prev) => ({ ...prev, totalGramsInput: prev.totalGramsInput + k, error: "" }))}
                    className="h-11 rounded-xl bg-gray-100 hover:bg-gray-200 active:bg-gray-300 text-gray-800 font-semibold text-base transition-colors"
                  >
                    {k}
                  </button>
                ))}
                <button
                  onClick={() => setKgPopup((prev) => ({
                    ...prev,
                    totalGramsInput: prev.totalGramsInput.includes(".") ? prev.totalGramsInput : prev.totalGramsInput + ".",
                    error: "",
                  }))}
                  className="h-11 rounded-xl bg-gray-100 hover:bg-gray-200 active:bg-gray-300 text-gray-800 font-semibold text-base transition-colors"
                >
                  .
                </button>
                <button
                  onClick={() => setKgPopup((prev) => ({ ...prev, totalGramsInput: prev.totalGramsInput + "0", error: "" }))}
                  className="h-11 rounded-xl bg-gray-100 hover:bg-gray-200 active:bg-gray-300 text-gray-800 font-semibold text-base transition-colors"
                >
                  0
                </button>
                <button
                  onClick={() => setKgPopup((prev) => ({ ...prev, totalGramsInput: prev.totalGramsInput.slice(0, -1), error: "" }))}
                  className="h-11 rounded-xl bg-gray-50 hover:bg-gray-100 active:bg-gray-200 text-gray-500 font-semibold text-base transition-colors flex items-center justify-center"
                >
                  ⌫
                </button>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setKgPopup({ show: false, pendingItem: null, totalGramsInput: "", error: "" })}
                  disabled={gramPriceLoading}
                  className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmKgItem}
                  disabled={gramPriceLoading}
                  className={`flex-1 px-4 py-2.5 text-sm font-medium text-white rounded-xl transition-colors ${gramPriceLoading
                    ? "bg-gray-300 cursor-not-allowed"
                    : "bg-gray-500 hover:bg-gray-600"
                    }`}
                >
                  {gramPriceLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                      </svg>
                      Calculating...
                    </span>
                  ) : "Calculate & Add"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete item confirmation ─────────────────────────────────────── */}
      {deleteConfirm.show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 overflow-hidden">
            <div className="h-1 w-full bg-gradient-to-r from-red-400 to-red-600" />
            <div className="p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                  <Trash2 className="w-5 h-5 text-red-500" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-gray-800">Remove Item?</h3>
                  <p className="text-xs text-gray-500 mt-0.5 truncate max-w-[220px]">{deleteConfirm.name}</p>
                </div>
              </div>
              <p className="text-sm text-gray-600 bg-gray-50 rounded-lg px-4 py-3 border border-gray-100">
                This will remove the item from the recipe. This action cannot be undone.
              </p>
              <div className="flex gap-3 mt-5">
                <button
                  onClick={() => setDeleteConfirm({ show: false, frontendKey: null, name: "" })}
                  className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDeleteItem}
                  className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-red-500 rounded-lg hover:bg-red-600 transition-colors"
                >
                  Remove
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}