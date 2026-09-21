

"use client";

import styles from "../../../skm.module.css";
import { RecipeItem } from "../models/editmodel";

interface RecipeItemsTableProps {
  recipeItems: RecipeItem[];
  selectedItems: RecipeItem[];
  itemsToDisplay: RecipeItem[];
  recipeSearch: string;
  setRecipeSearch: (value: string) => void;
  onOpenAssignDialog: () => void;
  handleUpdateQuantity: (id: string, quantity: string) => void;
  handleRemoveItem: (id?: string) => void;
  handleEditSingleItem: (id: string) => void;
  handleBulkAddToRecipe: () => void;
  getInputStep: (uom: string) => string;
}

export default function RecipeItemsTable({
  recipeItems,
  selectedItems,
  itemsToDisplay,
  recipeSearch,
  setRecipeSearch,
  onOpenAssignDialog,
  handleUpdateQuantity,
  handleRemoveItem,
  handleEditSingleItem,
  handleBulkAddToRecipe,
  getInputStep,
}: RecipeItemsTableProps) {
  const assignedCount = recipeItems.filter((i) => i.status === "assigned").length;

  return (
    <div className={styles.tableCard}>
      {/* Header */}
      <div className={styles.tableHeaderBar}>
        <div className={styles.tableHeaderRow}>
          <div>
            <h3 className={styles.tableTitle}>Recipe Items ({recipeItems.length})</h3>
            <div className={styles.legendRow}>
              <span className={styles.legendItem}>
                <span className={`${styles.legendDot} ${styles.legendDotBlue}`}></span>
                Selected: {selectedItems.length}
              </span>
              <span>
                <span className={`${styles.legendDot} ${styles.legendDotGreen}`}></span>
                Assigned: {assignedCount}
              </span>
            </div>
          </div>
          <div className={styles.tableActions}>
            <input
              value={recipeSearch}
              onChange={(e) => setRecipeSearch(e.target.value)}
              placeholder="Search in recipe"
              className={styles.searchInput}
            />
            <button onClick={onOpenAssignDialog} className={styles.btnAssign}>
              + Assign Items
            </button>
            {recipeItems.length > 0 && (
              <button onClick={() => handleRemoveItem()} className={styles.btnClearAll}>
                Clear All
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Body */}
      <div className={styles.tableBody}>
        {recipeItems.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>📦</div>
            <p className="mb-1 font-medium">No items in recipe</p>
            <p className="text-sm">Click &quot;Assign Items&quot; to search and add items</p>
          </div>
        ) : itemsToDisplay.length === 0 ? (
          <div className={styles.emptyStateSmall}>
            <p>No items match your search</p>
          </div>
        ) : (
          <div className={styles.rowsWrapper}>
            {/* Table Header */}
            <div className={styles.columnHeader}>
              <div className={styles.colName}>Item Name</div>
              <div className={styles.colType}>Type</div>
              <div className={styles.colQty}>Quantity</div>
              <div className={styles.colActions}>Actions</div>
            </div>

            {selectedItems.length > 0 ? (
              <>
                {itemsToDisplay.map((item) => (
                  <div
                    key={item.id}
                    className={`${styles.itemRow} ${styles.itemRowSelected}`}
                  >
                    <div className={styles.colName}>
                      <div className={styles.itemName}>{item.name}</div>
                      <div className={styles.itemCode}>{item.code}</div>
                    </div>
                    <div className={styles.colType}>
                      <span
                        className={`${styles.badge} ${item.type === "SFG" ? styles.badgeSFG : styles.badgeRM
                          }`}
                      >
                        {item.type}
                      </span>
                    </div>
                    <div className={styles.colQty}>
                      <div className={styles.qtyRow}>
                        <input
                          type="number"
                          step={getInputStep(item.uom)}
                          min="0.01"
                          value={item.quantity}
                          onChange={(e) => handleUpdateQuantity(item.id, e.target.value)}
                          placeholder={item.placeholder}
                          className={styles.qtyInput}
                        />
                        <span className={styles.uomLabel}>{item.uom}</span>
                      </div>
                    </div>
                    <div className={styles.colActions}>
                      <button onClick={() => handleRemoveItem(item.id)} className={styles.removeBtn}>
                        Remove
                      </button>
                    </div>
                  </div>
                ))}

                <div className={styles.addToRecipeBar}>
                  <div className={styles.addToRecipeInner}>
                    <p className={styles.addToRecipeHint}>
                      Enter quantities for all items above, then add to recipe
                    </p>
                    <button onClick={handleBulkAddToRecipe} className={styles.addToRecipeBtn}>
                      <span>Add to Recipe</span>
                      <span className={styles.addToRecipeCount}>{selectedItems.length}</span>
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <>
                {itemsToDisplay.map((item) => (
                  <div key={item.id} className={styles.itemRow}>
                    <div className={styles.colName}>
                      <div className={styles.itemName}>{item.name}</div>
                      <div className={styles.itemCode}>{item.code}</div>
                    </div>
                    <div className={styles.colType}>
                      <span
                        className={`${styles.badge} ${item.type === "SFG" ? styles.badgeSFG : styles.badgeRM
                          }`}
                      >
                        {item.type}
                      </span>
                    </div>
                    <div className={styles.colQty}>
                      <div className={styles.qtyRow}>
                        {item.status === "assigned" ? (
                          <>
                            <div className={styles.qtyReadonly}>{item.quantity}</div>
                            <span className={styles.uomLabel}>{item.uom}</span>
                          </>
                        ) : (
                          <>
                            <input
                              type="number"
                              step={getInputStep(item.uom)}
                              min="0.01"
                              value={item.quantity}
                              onChange={(e) => handleUpdateQuantity(item.id, e.target.value)}
                              className={styles.qtyInput}
                            />
                            <span className={styles.uomLabel}>{item.uom}</span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className={styles.colActions}>
                      <div className={styles.rowActions}>
                        {item.status === "assigned" && (
                          <button
                            onClick={() => handleEditSingleItem(item.id)}
                            className={styles.editBtn}
                          >
                            Edit
                          </button>
                        )}
                        <button onClick={() => handleRemoveItem(item.id)} className={styles.removeBtn}>
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}