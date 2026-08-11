

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { RootState } from '../../../../../redux/store';
import { useSelector } from 'react-redux';
import {
  Box,
  FormControlLabel,
  IconButton,
  Switch,
  Typography,Pagination,TextField,
} from "@mui/material";
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/EditOutlined';
import DeleteIcon from '@mui/icons-material/DeleteOutlineRounded';
import RefreshIcon from '@mui/icons-material/RestoreRounded';
import SearchIcon from '@mui/icons-material/Search';
import { Inventory } from '../Models/inventoryTypeModels';
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
const PAGE_SIZE = 15;
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
    <tr className="item-master-data-row">
      <td style={{ textAlign: 'center' }}>{rowNumber}</td>
      <td style={{ textAlign: 'center' }}>{inventory.inventoryId}</td>
 <td style={{ textAlign: 'center' }}>{inventory.inventoryType}</td>
      <td style={{ textAlign: 'center' }}>
        <Switch
          checked={inventory.directSale}
          onChange={handleToggle}
          color="primary"
          size="small"
          title="Toggle Direct Sale"
        />
      </td>
  <td className="item-master-actions-cell">
        <div className="flex justify-center gap-1">
          {showDeactivated ? (
           <IconButton
              onClick={handleActivateClick}
              className="purchase-master-action-button is-activate"
              title="Activate"
              size="small"
            >
              <RefreshIcon />
            </IconButton>
         ) : (
            <>
             <IconButton
                onClick={handleEditClick}
                className="purchase-master-action-button is-edit"
                title="Edit"
                size="small"
              >
                <EditIcon />
              </IconButton>
              <IconButton
                onClick={handleDeactivateClick}
                className="purchase-master-action-button is-delete"
                title="Deactivate"
                size="small"
              >
                <DeleteIcon />
              </IconButton>
            </>
          )}
        </div>
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
const [searchValue, setSearchValue] = useState('');
  const [page, setPage] = useState(1);
  const displayedInventories = showDeactivated ? deactivatedItems : inventories;
const filteredInventories = useMemo(() => {
    const query = searchValue.trim().toLowerCase();
    if (!query) return displayedInventories;

    return displayedInventories.filter((inventory) =>
      inventory.inventoryType?.toLowerCase().includes(query) ||
      inventory.inventoryId?.toLowerCase().includes(query)
    );
  }, [displayedInventories, searchValue]);

  const totalPages = Math.max(1, Math.ceil(filteredInventories.length / PAGE_SIZE));

  const paginatedInventories = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filteredInventories.slice(start, start + PAGE_SIZE);
  }, [filteredInventories, page]);

  useEffect(() => {
    setPage(1);
  }, [searchValue, showDeactivated]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);
  const label = showDeactivated ? 'Show Activated' : 'Show Deactivated';

  const handleToggleShowDeactivated = useCallback(() => {
    setShowDeactivated(!showDeactivated);
  }, [setShowDeactivated, showDeactivated]);

  return (
    <>
       <Box className="item-master-toolbar-shell" sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
        <Box
           className="purchase-reference-toolbar item-master-toolbar"
          sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', gap: 2 }}
        >
        <Box className="item-master-toolbar-spacer" sx={{ flex: 1 }} />

          <Box className="item-master-search-slot" sx={{ flex: '0 0 auto', display: 'flex', justifyContent: 'center' }}>
            <TextField
              size="small"
              variant="outlined"
              autoComplete="off"
              placeholder="Search Inventory Type..."
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              className="custom-textfield purchase-reference-search item-master-search"
              sx={{ width: '300px' }}
              InputProps={{ startAdornment: <SearchIcon className="purchase-reference-search-icon" /> }}
            />
          </Box>
 
          <Box
            className="purchase-reference-actions item-master-actions"
            sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 1.5 }}
          >
            {!showDeactivated && (
              <div className="icon-action-wrapper purchase-reference-action-button item-master-action">
                <IconButton color="primary" onClick={handleOpen} className="icon-action-button" title="Add">
                  <AddIcon className="icon-action-svg" />
                </IconButton>
                <Typography className="icon-action-label">Add</Typography>
              </div>
            )}
 
            <FormControlLabel
              className="purchase-reference-active-toggle item-master-active-toggle"
              control={
                <Switch
                  checked={showDeactivated}
                  onChange={handleToggleShowDeactivated}
                  color="primary"
                  size="small"
                />
              }
              label={label}
            />
          </Box>
        </Box>
      </Box>



      <div className="item-master-table-container">
        <table className="item-master-table item-master-lookup-table item-master-lookup-table--5">
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
               {paginatedInventories.map((inventory, index) => (
                  <InventoryRow
                    key={inventory.inventoryId || inventory.id}
                    inventory={inventory}
                     rowNumber={(page - 1) * PAGE_SIZE + index + 1}
                    showDeactivated={showDeactivated}
                    onEdit={handleEdit}
                    onActivate={handleActivate}
                    onDeactivate={handleDeactivate}
                    onToggleDirectSale={handleToggleDirectSale}
                  />
                ))}
               {filteredInventories.length === 0 && (
                  <tr>
                    <td colSpan={5} className="empty-state">
                      <h2>
                        {showDeactivated ? 'No deactivated inventory types found' : 'No active inventory types found'}
                      </h2>
                    </td>
                  </tr>
                )}
              </>
            )}
          </tbody>
        </table>
      </div>
            {totalPages > 1 && (
        <Box display="flex" justifyContent="center" mt={0.5}>
          <Pagination
            count={totalPages}
            page={page}
            color="primary"
            onChange={(_event, value) => setPage(value)}
            className="item-master-pagination"
          />
        </Box>
      )}
    </>
  );
};

export default InventoryTable;