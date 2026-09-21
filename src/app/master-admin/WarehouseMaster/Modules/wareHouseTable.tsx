

"use client";
import React, { useMemo } from "react";
import {
  Box,
  IconButton,
  Tooltip,
} from "@mui/material";
import EditIcon from "@mui/icons-material/EditOutlined";
import DeleteIcon from "@mui/icons-material/DeleteOutlineRounded";
import RefreshIcon from "@mui/icons-material/RestoreRounded";
import { WareHouse } from "../Models/warehouseModels";
import PermissionIconButton from '@/components/Permissions/PermissionIconButton';
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
      className={`purchase-master-status-pill ${
        value === STATUS.ACTIVE
          ? "is-active"
          : "is-inactive"
      }`}
    >
      {value === STATUS.ACTIVE
        ? "Active"
        : "Inactive"}
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
   <Box className="purchase-master-table-shell">
  <div className="purchase-native-table-wrapper">
    <table className="purchase-native-table">
        {/* ── Head ── */}
<thead>
  <tr>
    {visibleColumns.sNo && (
      <th>{columnLabels["sNo"] || "S.NO"}</th>
    )}

    {visibleDataColumns.map((key) => (
      <th key={key}>
        {columnLabels[key] || formatLabel(String(key))}
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
               {visibleDataColumns.map((key) => {
  if (key === "warehouseId") {
    return (
      <td key={key}>
        <span className="purchase-master-id-pill">
          {row.warehouseId || "-"}
        </span>
      </td>
    );
  }

  if (key === "warehouseName") {
    return (
      <td key={key}>
        <Box className="purchase-master-name-cell">
          <span className="purchase-master-avatar">
            {(row.warehouseName || "?")
              .charAt(0)
              .toUpperCase()}
          </span>

          <span>{row.warehouseName || "-"}</span>
        </Box>
      </td>
    );
  }

  return (
    <td key={key}>
      {renderCellValue(row, key)}
    </td>
  );
})}

                {/* Action buttons */}
<td>
  <Box className="purchase-master-actions">
    {!showDeactivatedTable &&
      row.status === STATUS.ACTIVE && (
        <>
<PermissionIconButton
            app="masteradmin"
            module="warehousemaster"
            action="edit"
            tooltip="Edit warehouse"
            onClick={() => onOpenEdit(row)}
            icon={<EditIcon fontSize="small" />}
            className="purchase-master-action-button is-edit"
            ariaLabel="Edit warehouse"
          />

          <PermissionIconButton
            app="masteradmin"
            module="warehousemaster"
            action="delete"
            tooltip="Deactivate warehouse"
            onClick={() => onDeactivate(row)}
            icon={<DeleteIcon fontSize="small" />}
            className="purchase-master-action-button is-delete"
            ariaLabel="Deactivate warehouse"
          />
        </>
      )}

    {showDeactivatedTable &&
      row.status === STATUS.INACTIVE && (
<PermissionIconButton
          app="masteradmin"
          module="warehousemaster"
          action="edit"
          rollback
          tooltip="Activate warehouse"
          onClick={() => onActivate(row)}
          icon={<RefreshIcon fontSize="small" />}
          className="purchase-master-action-button is-activate"
          ariaLabel="Activate warehouse"
        />
      )}
  </Box>
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
    </Box>
  );
};

export default WareHouseTableComponent;