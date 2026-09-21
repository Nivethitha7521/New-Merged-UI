
"use client";

import styles from "../../../skm.module.css";
import { RecipeItem, SFGMaterial, RawMaterial } from "../models/editmodel";



type ToggleableItem = SFGMaterial | RawMaterial;

interface AssignItemsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  sfgSearch: string;
  setSfgSearch: (value: string) => void;
  rawSearch: string;
  setRawSearch: (value: string) => void;
  sfgList: SFGMaterial[];
  rawList: RawMaterial[];
  isItemSelected: (id: string) => boolean;
  handleToggleItemSelection: (item: ToggleableItem, type: "SFG" | "RM") => void;
  selectedItems: RecipeItem[];
  handleBulkAddToRecipe: () => void;
}

export default function AssignItemsDialog({
  isOpen,
  onClose,
  sfgSearch,
  setSfgSearch,
  rawSearch,
  setRawSearch,
  sfgList,
  rawList,
  isItemSelected,
  handleToggleItemSelection,
  selectedItems,
  handleBulkAddToRecipe,
}: AssignItemsDialogProps) {
  if (!isOpen) return null;

  const onAddClick = () => {
    handleBulkAddToRecipe();
    onClose();
  };

  return (
    <div className={styles.dialogOverlay}>
      <div className={styles.dialogBox}>
        {/* Dialog Header */}
        <div className={styles.dialogHeader}>
          <h2 className={styles.dialogTitle}>Assign Items</h2>
          <button onClick={onClose} className={styles.dialogCloseBtn} aria-label="Close">
            &times;
          </button>
        </div>

        {/* Dialog Body */}
        <div className={styles.dialogBody}>
          {/* SFG Materials Search */}
          <div className={styles.searchPanel}>
            <h3 className={styles.panelTitle}>SFG Materials</h3>
            <input
              value={sfgSearch}
              onChange={(e) => setSfgSearch(e.target.value)}
              placeholder="Search SFG... (min 2 chars)"
              className={`${styles.searchInput} w-full mb-3`}
            />

            {sfgSearch.trim().length === 0 ? (
              <div className={styles.emptyStateSmall}>Type at least 2 characters to search</div>
            ) : sfgSearch.trim().length === 1 ? (
              <div className={styles.emptyStateSmall}>Type more characters to search...</div>
            ) : sfgList.length === 0 ? (
              <div className={styles.emptyStateSmall}>No SFG materials found</div>
            ) : (
              <div className={styles.resultsList}>
                {sfgList.map((item, index) => {
                  const id = `SFG-${item.sfgCode}`;
                  const isSelected = isItemSelected(id);

                  return (
                    <div
                      key={`sfg-${item.sfgCode}-${index}`}
                      onClick={() => handleToggleItemSelection(item, "SFG")}
                      className={`${styles.resultItem} ${
                        isSelected ? styles.resultItemSelected : ""
                      }`}
                    >
                      <div className={styles.resultRow}>
                        <div>
                          <div className={styles.resultName}>{item.sfgName}</div>
                          <div className={styles.resultMeta}>
                            {item.sfgCode} • {item.uom}
                          </div>
                        </div>
                        {isSelected && <span className={styles.selectedBadge}>Selected</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Raw Materials Search */}
          <div className={styles.searchPanel}>
            <h3 className={styles.panelTitle}>Raw Materials</h3>
            <input
              value={rawSearch}
              onChange={(e) => setRawSearch(e.target.value)}
              placeholder="Search Raw Material... (min 2 chars)"
              className={`${styles.searchInput} w-full mb-3`}
            />

            {rawSearch.trim().length === 0 ? (
              <div className={styles.emptyStateSmall}>Type at least 2 characters to search</div>
            ) : rawSearch.trim().length === 1 ? (
              <div className={styles.emptyStateSmall}>Type more characters to search...</div>
            ) : rawList.length === 0 ? (
              <div className={styles.emptyStateSmall}>No raw materials found</div>
            ) : (
              <div className={styles.resultsList}>
                {rawList.map((item, index) => {
                  const id = `RM-${item.itemCode || item.purchaseitemId || item.itemName}`;
                  const isSelected = isItemSelected(id);

                  return (
                    <div
                      key={`raw-${item.itemCode || item.itemName}-${index}`}
                      onClick={() => handleToggleItemSelection(item, "RM")}
                      className={`${styles.resultItem} ${
                        isSelected ? styles.resultItemSelected : ""
                      }`}
                    >
                      <div className={styles.resultRow}>
                        <div>
                          <div className={styles.resultName}>{item.itemName}</div>
                          <div className={styles.resultMeta}>
                            {item.itemCode || "No code"} • {item.uom}
                          </div>
                        </div>
                        {isSelected && <span className={styles.selectedBadge}>Selected</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Dialog Footer */}
        <div className={styles.dialogFooter}>
          <button onClick={onClose} className={styles.btnOutline}>
            Cancel
          </button>
          <button
            onClick={onAddClick}
            disabled={selectedItems.length === 0}
            className={styles.btnConfirm}
          >
            Add to Recipe
            {selectedItems.length > 0 && (
              <span className={styles.btnConfirmCount}>{selectedItems.length}</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}