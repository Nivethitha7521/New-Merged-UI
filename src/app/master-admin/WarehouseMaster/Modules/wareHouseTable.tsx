

"use client";
import React, { useMemo } from "react";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import RefreshIcon from "@mui/icons-material/Refresh";
import { WareHouse } from "../Models/warehouseModels";

// ── Constants ────────────────────────────────────────────────────────────────
const STATUS = {
  ACTIVE: "active",
  INACTIVE: "inactive",
} as const;

// Columns that hold array values and need join-rendering
const ARRAY_COLUMNS = new Set(["country", "state", "city"]);

// Ordered list of all data columns (matches WareHouse fields)
const DATA_COLUMN_KEYS: (keyof WareHouse)[] = [
  "warehouseId",
  "warehouseName",
  "aliasName",
  "type",
  "status",
  "address",
  "country",
  "state",
  "city",
  "postalCode",
  "phoneNumber",
  "email",
  "latitude",
  "longitude",
  "description",
  "openingHours",
  "closingHours",
  "managerName",
  "managerContact",
  "createdDate",
  "lastUpdatedDate",
  "createdBy",
];

// ── Types ────────────────────────────────────────────────────────────────────
interface WareHouseTableProps {
  filteredTypes: WareHouse[];
  showDeactivatedTable: boolean;
  onAddNew: () => void;
  onOpenEdit: (type: WareHouse) => void;
  onDeactivate: (type: WareHouse) => void;
  onActivate: (type: WareHouse) => void;
  visibleColumns: Record<string, boolean>;
  columnLabels: Record<string, string>;
  resultDialogOpen: boolean;
  onCloseResultDialog: () => void;
}

// ── Helpers ──────────────────────────────────────────────────────────────────
function formatLabel(key: string): string {
  return key.replace(/([A-Z])/g, " $1").trim().toUpperCase();
}

function renderCellValue(
  row: WareHouse,
  key: keyof WareHouse
): React.ReactNode {
  const value = row[key];

  if (key === "status") {
    return (
      <span
        className={
          value === STATUS.ACTIVE ? "status-active" : "status-inactive"
        }
      >
        {value === STATUS.ACTIVE ? "Active" : "Inactive"}
      </span>
    );
  }

  if (ARRAY_COLUMNS.has(key) && Array.isArray(value)) {
    return value.join(", ") || "-";
  }

  return (value as string) || "-";
}

// ── Component ────────────────────────────────────────────────────────────────
const WareHouseTableComponent: React.FC<WareHouseTableProps> = ({
  filteredTypes,
  showDeactivatedTable,
  onOpenEdit,
  onDeactivate,
  onActivate,
  visibleColumns,
  columnLabels,
}) => {
  // Filter rows by active/inactive status
  const displayedData = useMemo(
    () =>
      filteredTypes.filter((row) =>
        showDeactivatedTable
          ? row.status === STATUS.INACTIVE
          : row.status === STATUS.ACTIVE
      ),
    [filteredTypes, showDeactivatedTable]
  );

  // Resolve which columns are visible (sNo handled separately)
  const visibleDataColumns = useMemo(
    () => DATA_COLUMN_KEYS.filter((key) => visibleColumns[key]),
    [visibleColumns]
  );

  // Total visible column count used for colSpan (sNo + data cols + actions)
  const totalColumns =
    (visibleColumns.sNo ? 1 : 0) + visibleDataColumns.length + 1;

  const emptyLabel = showDeactivatedTable ? "Deactivated" : "Active";

  return (
    <div className="table-container" style={{ maxHeight: "calc(96vh - 170px)" }}>
      <table className="custom-table">
        {/* ── Head ── */}
        <thead>
          <tr>
            {visibleColumns.sNo && (
              <th>{columnLabels["sNo"] || "S.NO"}</th>
            )}
            {visibleDataColumns.map((key) => (
              <th key={key}>
                {columnLabels[key] || formatLabel(key)}
              </th>
            ))}
            <th className="text-center">Actions</th>
          </tr>
        </thead>

        {/* ── Body ── */}
        <tbody>
          {displayedData.length > 0 ? (
            displayedData.map((row, index) => (
              <tr key={row.id}>
                {/* Serial number */}
                {visibleColumns.sNo && <td style={{ textAlign: "center" }}>{index + 1}</td>}

                {/* Dynamic data columns */}
                {visibleDataColumns.map((key) => (
                  <td style={{ textAlign: "center" }} key={key}>{renderCellValue(row, key)}</td>
                ))}

                {/* Action buttons */}
                <td>
                  <div className="flex justify-center gap-4">
                    {!showDeactivatedTable && row.status === STATUS.ACTIVE && (
                      <>
                        <button
                          onClick={() => onOpenEdit(row)}
                          className="edit-btn"
                          title="Edit"
                        >
                          <EditIcon fontSize="small" />
                        </button>
                        <button
                          onClick={() => onDeactivate(row)}
                          className="deactivate-btn"
                          title="Deactivate"
                        >
                          <DeleteIcon fontSize="small" />
                        </button>
                      </>
                    )}

                    {showDeactivatedTable && row.status === STATUS.INACTIVE && (
                      <button
                        onClick={() => onActivate(row)}
                        className="activate-btn"
                      >
                        <RefreshIcon fontSize="small" />
                        <span>Activate</span>
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={totalColumns} className="empty-state">
                No {emptyLabel} Warehouses Found
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default WareHouseTableComponent;