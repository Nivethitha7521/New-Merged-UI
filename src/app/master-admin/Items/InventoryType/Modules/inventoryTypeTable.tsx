

import React, { useCallback } from "react";
import { RootState } from "../../../../../redux/store";
import { useSelector } from "react-redux";
import {
  Box,
  FormControlLabel,
  IconButton,
  Switch,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from '@mui/icons-material/Delete';
import RefreshIcon from '@mui/icons-material/Refresh';
import { Inventory } from "../Models/inventoryTypeModels";

interface InventoryTableProps {
  handleOpen: () => void;
  handleEdit: (inventory: Inventory) => void;
  handleActivate: (inventory: Inventory) => void;
  handleDeactivate: (inventory: Inventory) => void;
  handleToggleDirectSale: (inventory: Inventory) => void;
  showDeactivated: boolean;
  setShowDeactivated: (value: boolean) => void;
}

// ─── Memoized row ──────────────────────────────────────────────────────────
// Extracted so React can skip re-rendering rows whose own props haven't
// changed, instead of recreating every row's inline onClick closures on
// every parent render (e.g. toggling a single switch no longer forces a
// re-render pass over every other row).
interface InventoryRowProps {
  inventory: Inventory;
  rowNumber: number;
  showDeactivated: boolean;
  onEdit: (inventory: Inventory) => void;
  onActivate: (inventory: Inventory) => void;
  onDeactivate: (inventory: Inventory) => void;
  onToggleDirectSale: (inventory: Inventory) => void;
}

const InventoryRow = React.memo(function InventoryRow({
  inventory,
  rowNumber,
  showDeactivated,
  onEdit,
  onActivate,
  onDeactivate,
  onToggleDirectSale,
}: InventoryRowProps) {
  const handleToggle = useCallback(() => {
    onToggleDirectSale(inventory);
  }, [onToggleDirectSale, inventory]);

  const handleEditClick = useCallback(() => {
    onEdit(inventory);
  }, [onEdit, inventory]);

  const handleActivateClick = useCallback(() => {
    onActivate(inventory);
  }, [onActivate, inventory]);

  const handleDeactivateClick = useCallback(() => {
    onDeactivate(inventory);
  }, [onDeactivate, inventory]);

  return (
    <tr>
      <td style={{ textAlign: "center" }}>{rowNumber}</td>
      <td style={{ textAlign: 'center' }}>{inventory.inventoryId}</td>
      <td style={{ textAlign: "center" }}>{inventory.inventoryType}</td>
      <td style={{ textAlign: "center" }}>
        <Switch
          checked={inventory.directSale}
          onChange={handleToggle}
          color="primary"
          size="small"
          title="Toggle Direct Sale"
        />
      </td>
      <td style={{ textAlign: "center" }}>
        {showDeactivated ? (
          <button
            color="primary"
            onClick={handleActivateClick}
            className="activate-btn"
            title="Activate"
          >
            <RefreshIcon />
          </button>
        ) : (
          <>
            <button
              color="primary"
              onClick={handleEditClick}
              className="edit-btn"
              title="Edit"
            >
              <EditIcon />
            </button>
            <button
              color="primary"
              onClick={handleDeactivateClick}
              style={{ marginLeft: "10px" }}
              className="deactivate-btn"
              title="Deactivate"
            >
              <DeleteIcon />
            </button>
          </>
        )}
      </td>
    </tr>
  );
});

const InventoryTable: React.FC<InventoryTableProps> = ({
  handleOpen,
  handleEdit,
  handleActivate,
  handleDeactivate,
  handleToggleDirectSale,
  showDeactivated,
  setShowDeactivated,
}) => {
  const {
    items: inventories,
    deactivatedItems,
    loading,
  } = useSelector((state: RootState) => state.inventoryType);

  const displayedInventories = showDeactivated ? deactivatedItems : inventories;

  const label = showDeactivated ? 'Show Activated' : 'Show Deactivated';

  const handleToggleShowDeactivated = useCallback(() => {
    setShowDeactivated(!showDeactivated);
  }, [setShowDeactivated, showDeactivated]);

  return (
    <>
      <Box
        display="flex"
        flexDirection="row"
        alignItems="center"
        justifyContent="space-between"
        my={1}
        ml={1}
        px={{ xs: 2, sm: 3 }}
        sx={{ width: "99%", boxSizing: "border-box", mt: -2 }}
      >

        {/* LEFT SIDE — TITLE */}
        <Typography className='icon-action-label'
          sx={{
            fontFamily: "'Poppins', sans-serif",
            fontWeight: 750,
            margin: 0,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            maxWidth: "100%",
          }}
        >
          {showDeactivated ? "Deactivated Inventory Types" : "Active Inventory Types"}
        </Typography>

        {/* RIGHT SIDE — ALL ACTIONS */}
        <Box
          display="flex"
          alignItems="center"
          gap={4}
          sx={{ whiteSpace: "nowrap" }}
        >
          {/* ADD BUTTON (only when active mode) */}
          {!showDeactivated && (
            <div className="icon-action-wrapper">
              <IconButton
                color="primary"
                onClick={handleOpen}
                className="icon-action-button"
                title="Add"
              >
                <AddIcon className="icon-action-svg" />
              </IconButton>
              <Typography className="icon-action-label">Add</Typography>
            </div>
          )}

          {/* SWITCH + LABEL */}
          <FormControlLabel
            control={
              <Switch
                checked={showDeactivated}
                onChange={handleToggleShowDeactivated}
                color="primary"
                size="small"
              />
            }
            label={label}
            sx={{
              "& .MuiFormControlLabel-label": {
                fontSize: "0.75rem",
                fontFamily: "'Poppins', sans-serif",
              },
            }}
          />
        </Box>
      </Box>



      <div className="table-container" style={{ maxHeight: 'calc(86.5vh - 170px)' }}>
        <table className="custom-table">
          <thead>
            <tr>
              <th>S.NO</th>
              <th>Inventory Type Id</th>
              <th>Inventory Type Name</th>
              <th>Direct Sale [ po ]</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center' }}>
                  <h3 style={{ fontWeight: 'bold' }}>Loading...</h3>
                </td>
              </tr>
            ) : (
              <>
                {displayedInventories.map((inventory, index) => (
                  <InventoryRow
                    key={inventory.inventoryId || inventory.id}
                    inventory={inventory}
                    rowNumber={index + 1}
                    showDeactivated={showDeactivated}
                    onEdit={handleEdit}
                    onActivate={handleActivate}
                    onDeactivate={handleDeactivate}
                    onToggleDirectSale={handleToggleDirectSale}
                  />
                ))}
                {displayedInventories.length === 0 && (
                  <tr>
                    <td colSpan={5} style={{ textAlign: "center" }}>
                      <h2 >
                        {showDeactivated ? "No deactivated inventory types found" : "No active inventory types found"}
                      </h2>
                    </td>
                  </tr>
                )}
              </>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
};

export default InventoryTable;