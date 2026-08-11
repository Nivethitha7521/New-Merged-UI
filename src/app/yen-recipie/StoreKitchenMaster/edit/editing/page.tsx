
"use client";

import { useRouter } from "next/navigation";
import { useSelector, useDispatch } from "react-redux";
import { RootState, AppDispatch } from "@/redux/store";
import { useEffect, useState, useRef } from "react";
//import Button from "@/components/ui/Button";

import styles from "../../skm.module.css";
import RecipeItemsTable from "./modules/Recipeitemstable";
import AssignItemsDialog from "./modules/Assignitemsdialog ";

// Import all edit slice actions and thunks
import {
  fetchSFGMaterials,
  fetchRawMaterials,
  fetchRecipeById,
  updateRecipe,
  setRecipeName,
  setCost,
  toggleItemSelection,
  updateItemQuantity,
  handleAddToRecipe,
  handleRemoveFromRecipe,
  handleEditItem,
  clearSearchResults,
  clearAll,
  selectEditRecipe,
  toggleRecipeVersionStatus,
  showSnackbarWithTimeout,
} from "./features/editRecipeSlice";
import { RawMaterial, SFGMaterial } from "./models/editmodel";
type ToggleableItem = SFGMaterial | RawMaterial;
export default function EditRecipePage() {
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();

  const selectedRecipe = useSelector(
    (state: RootState) => state.storeKitchenItem.selectedItem
  );

  const {
    recipeName,
    cost,
    sfgList,
    rawList,
    recipeItems,
    recipeStatus,
    loading,
    snackbar,
    version,
  } = useSelector(selectEditRecipe);

  const [sfgSearch, setSfgSearch] = useState("");
  const [rawSearch, setRawSearch] = useState("");
  const [recipeSearch, setRecipeSearch] = useState("");
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);

  const prevSfgSearchRef = useRef("");
  const prevRawSearchRef = useRef("");

  const selectedItems = recipeItems.filter((item) => item.status === "selected");
  const assignedItems = recipeItems.filter((item) => item.status === "assigned");

  const itemsToDisplay =
    selectedItems.length > 0
      ? selectedItems.filter(
        (item) =>
          item.name.toLowerCase().includes(recipeSearch.toLowerCase()) ||
          item.code.toLowerCase().includes(recipeSearch.toLowerCase()) ||
          item.type.toLowerCase().includes(recipeSearch.toLowerCase())
      )
      : recipeItems.filter(
        (item) =>
          item.name.toLowerCase().includes(recipeSearch.toLowerCase()) ||
          item.code.toLowerCase().includes(recipeSearch.toLowerCase()) ||
          item.type.toLowerCase().includes(recipeSearch.toLowerCase())
      );

  useEffect(() => {
    if (selectedRecipe?.recipeId) {
      dispatch(
        fetchRecipeById({
          recipeId: selectedRecipe.recipeId,
          version: selectedRecipe.version ?? 1,
        })
      )
        .unwrap()
        .then((data) => {
          console.log("Recipe data loaded successfully:", data);
        })
        .catch(() => {
          dispatch(showSnackbarWithTimeout({ message: "❌ Failed to load recipe" }));
        });
    } else {
      console.log("No recipe ID found, redirecting...");
      router.push("/yen-recipie/StoreKitchenMaster");
    }
  }, [selectedRecipe, dispatch, router]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (sfgSearch.trim().length >= 2) {
        dispatch(fetchSFGMaterials(sfgSearch));
      } else if (prevSfgSearchRef.current.length >= 2 && sfgSearch.trim().length < 2) {
        dispatch(clearSearchResults());
      }
      prevSfgSearchRef.current = sfgSearch;
    }, 300);

    return () => clearTimeout(timer);
  }, [sfgSearch, dispatch]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (rawSearch.trim().length >= 2) {
        dispatch(fetchRawMaterials(rawSearch));
      } else if (prevRawSearchRef.current.length >= 2 && rawSearch.trim().length < 2) {
        dispatch(clearSearchResults());
      }
      prevRawSearchRef.current = rawSearch;
    }, 300);

    return () => clearTimeout(timer);
  }, [rawSearch, dispatch]);

  const isItemSelected = (id: string) => {
    return recipeItems.some((item) => item.id === id);
  };

  const handleToggleItemSelection = (item: ToggleableItem, type: "SFG" | "RM") => {
    dispatch(toggleItemSelection({ item, type }));
  };
  const handleUpdateQuantity = (id: string, quantity: string) => {
    dispatch(updateItemQuantity({ id, quantity }));
  };

  const handleBulkAddToRecipe = () => {
    if (selectedItems.length === 0) {
      dispatch(showSnackbarWithTimeout({ message: "No items selected to add" }));
      return;
    }

    const itemsWithoutQuantity = selectedItems.filter((item) => !item.quantity.trim());
    if (itemsWithoutQuantity.length > 0) {
      dispatch(
        showSnackbarWithTimeout({
          message: `Please enter quantity for: ${itemsWithoutQuantity
            .map((i) => i.name)
            .join(", ")}`,
        })
      );
      return;
    }

    const invalidItems = selectedItems.filter((item) => {
      const num = Number(item.quantity);
      return isNaN(num) || num <= 0;
    });

    if (invalidItems.length > 0) {
      dispatch(
        showSnackbarWithTimeout({
          message: `Please enter valid positive numbers for: ${invalidItems
            .map((i) => i.name)
            .join(", ")}`,
        })
      );
      return;
    }

    dispatch(handleAddToRecipe());
    setSfgSearch("");
    setRawSearch("");
    dispatch(
      showSnackbarWithTimeout({ message: `✅ ${selectedItems.length} items added to recipe!` })
    );
  };

  const handleRemoveItem = (id?: string) => {
    dispatch(handleRemoveFromRecipe(id));
  };

  const handleEditSingleItem = (id: string) => {
    dispatch(handleEditItem(id));
  };

  const getInputStep = (uom: string) => {
    const uomLower = uom.toLowerCase();
    if (uomLower.includes("pcs") || uomLower.includes("piece") || uomLower.includes("unit")) {
      return "1";
    }
    return "0.01";
  };

  const handleUpdate = async () => {
    if (!recipeName.trim()) {
      dispatch(showSnackbarWithTimeout({ message: "Recipe name is required" }));
      return;
    }

    if (!cost.trim() || Number(cost) <= 0) {
      dispatch(showSnackbarWithTimeout({ message: "Please enter valid cost" }));
      return;
    }

    if (assignedItems.length === 0) {
      dispatch(
        showSnackbarWithTimeout({ message: "Recipe must have at least one assigned item" })
      );
      return;
    }

    const invalidAssignedItems = assignedItems.filter((item) => {
      const qty = Number(item.quantity);
      return !item.quantity || isNaN(qty) || qty <= 0;
    });

    if (invalidAssignedItems.length > 0) {
      dispatch(
        showSnackbarWithTimeout({
          message: `Please enter valid quantity for: ${invalidAssignedItems
            .map((i) => i.name)
            .join(", ")}`,
        })
      );
      return;
    }

    try {
      const updatePayload = {
        recipeName,
        cost: Number(cost),
        items: assignedItems.map((item) => ({
          id: item.id,
          name: item.name,
          code: item.code,
          uom: item.uom,
          type: item.type,
          quantity: Number(item.quantity),
        })),
      };

      console.log("Sending update payload:", updatePayload);

      if (!selectedRecipe) {
        dispatch(showSnackbarWithTimeout({ message: "No recipe selected" }));
        return;
      }

      await dispatch(
        updateRecipe({
          recipeId: selectedRecipe.recipeId,
          version,
          cost,
          items: recipeItems,
        })
      ).unwrap();

      dispatch(
        showSnackbarWithTimeout({ message: "✅ Recipe updated successfully!", duration: 1500 })
      );

      setTimeout(() => {
        router.push("/storekitchenmaster");
      }, 1500);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to update recipe";
      dispatch(showSnackbarWithTimeout({ message: `❌ ${message}` }));
    }
  };

  const handleCancel = () => {
    dispatch(clearAll());
    router.back();
  };

  if (loading && !recipeName) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading recipe...</div>
      </div>
    );
  }

  return (
    <div className={styles.pageWrapper}>
      <div className={styles.pageInner}>
        <div className={styles.card}>
          {/* Header */}
          <div className={styles.headerBar}>
            <div className={styles.headerRow}>
              <h1 className={styles.headerTitle}>Edit Recipe</h1>

              <div className={styles.statusGroup}>
                <span
                  className={`${styles.statusText} ${recipeStatus ? styles.statusActive : styles.statusInactive
                    }`}
                >
                  {recipeStatus ? "Active" : "Inactive"}
                </span>

                <button
                  onClick={() => {
                    if (!selectedRecipe) return;
                    dispatch(toggleRecipeVersionStatus({ recipeId: selectedRecipe.recipeId, version }));
                  }}
                  disabled={loading || !selectedRecipe}
                  className={`${styles.toggleSwitch} ${recipeStatus ? styles.toggleOn : styles.toggleOff
                    }`}
                  aria-pressed={recipeStatus}
                >
                  <span
                    className={`${styles.toggleThumb} ${recipeStatus ? styles.toggleThumbOn : styles.toggleThumbOff
                      }`}
                  />
                </button>
              </div>
            </div>
          </div>

          <div className={styles.cardBody}>
            {/* Basic Info */}
            <div className={styles.formSection}>
              <div className={styles.formGrid}>
                <div>
                  <label className={styles.label}>Recipe Name *</label>
                  <input
                    value={recipeName}
                    readOnly
                    onChange={(e) => dispatch(setRecipeName(e.target.value))}
                    placeholder="Enter recipe name"
                    className={styles.inputField}
                  />
                </div>
                <div>
                  <label className={styles.label}>Cost *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={cost}
                    onChange={(e) => dispatch(setCost(e.target.value))}
                    placeholder="Enter cost"
                    className={styles.inputField}
                  />
                </div>
              </div>
            </div>

            {/* Recipe Items */}
            <div className={styles.formSection}>
              <h2 className={styles.sectionTitle}>Recipe Items</h2>

              <RecipeItemsTable
                recipeItems={recipeItems}
                selectedItems={selectedItems}
                itemsToDisplay={itemsToDisplay}
                recipeSearch={recipeSearch}
                setRecipeSearch={setRecipeSearch}
                onOpenAssignDialog={() => setIsAssignDialogOpen(true)}
                handleUpdateQuantity={handleUpdateQuantity}
                handleRemoveItem={handleRemoveItem}
                handleEditSingleItem={handleEditSingleItem}
                handleBulkAddToRecipe={handleBulkAddToRecipe}
                getInputStep={getInputStep}
              />
            </div>

            {/* Action Buttons */}
            <div className={styles.footerActions}>
              <button onClick={handleCancel} className="px-8 py-3 border border-gray-300 hover:bg-gray-400">
                Cancel
              </button>
              <button
                // variant="primary"
                onClick={handleUpdate}
                disabled={assignedItems.length === 0 || loading}
                className="px-8 py-3 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Updating..." : "Update Recipe"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Assign Items Dialog */}
      <AssignItemsDialog
        isOpen={isAssignDialogOpen}
        onClose={() => setIsAssignDialogOpen(false)}
        sfgSearch={sfgSearch}
        setSfgSearch={setSfgSearch}
        rawSearch={rawSearch}
        setRawSearch={setRawSearch}
        sfgList={sfgList}
        rawList={rawList}
        isItemSelected={isItemSelected}
        handleToggleItemSelection={handleToggleItemSelection}
        selectedItems={selectedItems}
        handleBulkAddToRecipe={handleBulkAddToRecipe}
      />

      {/* Snackbar */}
      {snackbar.open && (
        <div
          className={`${styles.snackbar} ${snackbar.message.includes("Failed") ? styles.snackbarError : styles.snackbarSuccess
            }`}
        >
          {snackbar.message}
        </div>
      )}
    </div>
  );
}