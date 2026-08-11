


import React, { useEffect, useMemo, useState } from 'react';
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
import { OrderType } from '../Models/ordertypeModels';
interface OrderTypeTableProps {
  handleOpen: () => void;
  handleEdit: (orderType: OrderType) => void;
  handleActivate: (orderType: OrderType) => void;
  handleDeactivate: (orderType: OrderType) => void;
  showDeactivated: boolean;
  setShowDeactivated: (value: boolean) => void;
}
const PAGE_SIZE = 15;
const OrderTypeTable: React.FC<OrderTypeTableProps> = ({
  handleOpen,
  handleEdit,
  handleActivate,
  handleDeactivate,
  showDeactivated,
  setShowDeactivated,
}) => {
  const {
    items: orderTypes,
    deactivatedItems,
    loading,
    error,
  } = useSelector((state: RootState) => state.orderType);
const [searchValue, setSearchValue] = useState('');
  const [page, setPage] = useState(1);

   const displayedOrderTypes = showDeactivated ? deactivatedItems : orderTypes;
 
  const filteredOrderTypes = useMemo(() => {
    const query = searchValue.trim().toLowerCase();
    if (!query) return displayedOrderTypes;

    return displayedOrderTypes.filter((orderType) =>
      orderType.orderTypeName?.toLowerCase().includes(query) ||
      orderType.orderTypeId?.toLowerCase().includes(query)
    );
  }, [displayedOrderTypes, searchValue]);

  const totalPages = Math.max(1, Math.ceil(filteredOrderTypes.length / PAGE_SIZE));

  const paginatedOrderTypes = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filteredOrderTypes.slice(start, start + PAGE_SIZE);
  }, [filteredOrderTypes, page]);

  useEffect(() => {
    setPage(1);
  }, [searchValue, showDeactivated]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const label = showDeactivated ? 'Show Activated' : 'Show Deactivated';

  return (
    <>
      <Box className="item-master-toolbar-shell" sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
        <Box
          // display="flex"
          // alignItems="center"
          // gap={4}
          // sx={{ whiteSpace: "nowrap" }}
           className="purchase-reference-toolbar item-master-toolbar"
          sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', gap: 2 }}
        >
 <Box className="item-master-toolbar-spacer" sx={{ flex: 1 }} />

          <Box className="item-master-search-slot" sx={{ flex: '0 0 auto', display: 'flex', justifyContent: 'center' }}>
            <TextField
              size="small"
              variant="outlined"
              autoComplete="off"
              placeholder="Search Order Type..."
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


 <div className="item-master-table-container">
      <table className="item-master-table item-master-lookup-table item-master-lookup-table--4">
          <thead>
            <tr>
              <th>S.NO</th>
              <th>Order Type Id</th>
              <th>Order Type Name</th>
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
                 {paginatedOrderTypes.map((orderType, index) => (
                  <tr key={orderType.id} className="item-master-data-row">
                    <td style={{ textAlign: 'center' }}>{(page - 1) * PAGE_SIZE + index + 1}</td>
                    <td style={{ textAlign: 'center' }}>{orderType.orderTypeId}</td>
 <td style={{ textAlign: 'center' }}>{orderType.orderTypeName}</td>
                    <td className="item-master-actions-cell">
                      <div className="flex justify-center gap-1">
                        {showDeactivated ? (
                          <IconButton
                            onClick={() => handleActivate(orderType)}
                            className="purchase-master-action-button is-activate"
                            title="Activate"
                            size="small"
                          >
                           <RefreshIcon />
                          </IconButton>
                        ) : (
                          <>
                            {!orderType.editStatus === false && (
                              <IconButton
                                onClick={() => handleEdit(orderType)}
                                className="purchase-master-action-button is-edit"
                                title="Edit"
                                size="small"
                              >
                             <EditIcon />
                              </IconButton>
                            )}

                            {!orderType.editStatus === false && (
                              <IconButton
                                onClick={() => handleDeactivate(orderType)}
                               className="purchase-master-action-button is-delete"
                                title="Deactivate"
                                size="small"
                              >
                                <DeleteIcon />
                              </IconButton>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredOrderTypes.length === 0 && (
                  <tr>
                   <td colSpan={4} className="empty-state">
                      <h2>
                        {showDeactivated ? 'No deactivated order types found' : 'No active order types found'}
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

export default OrderTypeTable;