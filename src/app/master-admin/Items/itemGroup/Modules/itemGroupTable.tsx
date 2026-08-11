

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { RootState, AppDispatch } from '../../../../../redux/store';
import { useSelector, useDispatch } from 'react-redux';
import {
  Alert,
  Box,
  CircularProgress,
  FormControlLabel,
  IconButton,
  Paper,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,Pagination,TextField,
} from "@mui/material";
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/EditOutlined';
import DeleteIcon from '@mui/icons-material/DeleteOutlineRounded';
import RefreshIcon from '@mui/icons-material/RestoreRounded';
import SearchIcon from '@mui/icons-material/Search';
import { Importitemgroup } from '../Features/itemgroupSlice';

interface itemGroup {
  id: string;
  itemGroupName: string;
  status: string;
  itemGroupId: string;
}

interface ItemGroupTableProbs {
  handleOpen: () => void;
  handleEdit: (itemgroup: itemGroup) => void;
  handleActivate: (itemgroup: itemGroup) => void;
  handleDeactivate: (itemgroup: itemGroup) => void;
  showDeactivated: boolean;
  setShowDeactivated: (value: boolean) => void;
}
const PAGE_SIZE = 15;
const ItemGroupTable: React.FC<ItemGroupTableProbs> = ({
  handleOpen,
  handleEdit,
  handleActivate,
  handleDeactivate,
  showDeactivated,
  setShowDeactivated,
}) => {
  const {
    items: itemGroups,
    deactivatedItems,
    loading,
    error
  } = useSelector((state: RootState) => state.itemGroup);

const dispatch = useDispatch<AppDispatch>();
const fileInputRef = useRef<HTMLInputElement>(null);
const [searchValue, setSearchValue] = useState('');
const [page, setPage] = useState(1);
 const displayedItemGroups = showDeactivated ? deactivatedItems : itemGroups;

  const filteredItemGroups = useMemo(() => {
    const query = searchValue.trim().toLowerCase();
    if (!query) return displayedItemGroups;

    return displayedItemGroups.filter((itemGroup) =>
      itemGroup.itemGroupName?.toLowerCase().includes(query) ||
      itemGroup.itemGroupId?.toLowerCase().includes(query)
    );
  }, [displayedItemGroups, searchValue]);

  const totalPages = Math.max(1, Math.ceil(filteredItemGroups.length / PAGE_SIZE));

  const paginatedItemGroups = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filteredItemGroups.slice(start, start + PAGE_SIZE);
  }, [filteredItemGroups, page]);

  useEffect(() => {
    setPage(1);
  }, [searchValue, showDeactivated]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

 const handleImportCSV = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      dispatch(Importitemgroup(file));
      if (fileInputRef.current) {
       fileInputRef.current.value = '';
      }
    }
  };


  const label = showDeactivated ? 'Show Activated' : 'Show Deactivated';

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
              placeholder="Search Item Group..."
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
                  onChange={() => setShowDeactivated(!showDeactivated)}
                  color="primary"
                     size="small"
                />
              }
              label={label}
            />
          </Box>
        </Box>
      </Box>


      <input
        accept=".csv"
        style={{ display: 'none' }}
        id="import-file"
        type="file"
        ref={fileInputRef}
        onChange={handleImportCSV}
      />

      <div className="item-master-table-container">
       <table className="item-master-table item-master-lookup-table item-master-lookup-table--4">
          <thead>
            <tr>
              <th>S.NO</th>
              <th>ItemGroup Id</th>
              <th>Item Group Name</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={4} style={{ textAlign: 'center' }}>
                  <h3 style={{ fontWeight: 'bold' }}>Loading...</h3>
                </td>
              </tr>
            ) : (
              <>
  {paginatedItemGroups.map((itemGroup, index) => (
                  <tr key={itemGroup.itemGroupId || index} className="item-master-data-row">
                    <td style={{ textAlign: 'center' }}>{(page - 1) * PAGE_SIZE + index + 1}</td>
                    <td style={{ textAlign: 'center' }}>{itemGroup.itemGroupId}</td>
                    <td style={{ textAlign: 'center' }}>{itemGroup.itemGroupName}</td>
                    <td className="item-master-actions-cell">
                      <div className="flex justify-center gap-1">
                        {showDeactivated ? (
                          <IconButton
                            onClick={() => handleActivate(itemGroup)}
                           className="purchase-master-action-button is-activate"
                            title="Activate"
                          >
                           <RefreshIcon />
                          </IconButton>
                        ) : (
                          <>
                            <IconButton
                              onClick={() => handleEdit(itemGroup)}
                              className="purchase-master-action-button is-edit"
                              title="Edit"
                              size="small"
                            >
                               <EditIcon />
                            </IconButton>
                            <IconButton
                              onClick={() => handleDeactivate(itemGroup)}
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
                ))}

                {filteredItemGroups.length === 0 && (
                  <tr>
                    <td colSpan={4} className="empty-state">
                      <h2>
                        {showDeactivated ? 'No deactivated item groups found' : 'No active item groups found'}
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

export default ItemGroupTable;