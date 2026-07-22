
'use client';
import React, { useCallback, useMemo, useRef } from 'react';
import {
  IconButton,
  Switch,
  FormControlLabel,
  Alert,
  Box,
  Typography,
  Snackbar,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
} from '@mui/icons-material';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../../../../redux/store';
import DeleteIcon from '@mui/icons-material/Delete';
import RefreshIcon from '@mui/icons-material/Refresh';
import { discountImport, setSnackbarOpen } from '../Features/discountSlice';

interface Discount {
  id: string;
  discountName: string;
  discountId: string;
  discountPercentage: string;
  saleTypeDiscount: string;
  status: string;
}

interface DiscountTableContainerProps {
  handleEdit: (discount: Discount) => void;
  handleDeactivate: (discount: Discount) => void;
  handleActivate: (discount: Discount) => void;
  handleOpen: () => void;
  showDeactivated: boolean;
  setShowDeactivated: (value: boolean) => void;
}

const DiscountTableContainer: React.FC<DiscountTableContainerProps> = ({
  handleEdit,
  handleDeactivate,
  handleActivate,
  handleOpen,
  showDeactivated,
  setShowDeactivated
}) => {
  const dispatch = useDispatch<AppDispatch>();
  const {
    items: discounts,
    deactivatedItems,
    loading,
    snackbarOpen,
    snackbarMessage
  } = useSelector((state: RootState) => state.Discounts);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Memoized — only recalculates when the source list or toggle changes
  const displayedDiscounts = useMemo(
    () => (showDeactivated ? deactivatedItems : discounts),
    [showDeactivated, discounts, deactivatedItems]
  );

  // Stable callbacks — prevents unnecessary re-renders of child buttons
  const handleFileChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (file) {
        dispatch(discountImport(file));
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    },
    [dispatch]
  );

  const handleSnackbarClose = useCallback(() => {
    dispatch(setSnackbarOpen(false));
  }, [dispatch]);

  const handleToggle = useCallback(() => {
    setShowDeactivated(!showDeactivated);
  }, [showDeactivated, setShowDeactivated]);

  const label = showDeactivated ? 'Show Activated' : 'Show Deactivated';

  return (
    <>
      <Box
        display="flex"
        flexDirection={{ xs: "column", sm: "row" }}
        alignItems={{ xs: "flex-start", sm: "center" }}
        justifyContent="space-between"
        gap={0}
        my={1}
        ml={1}
        px={{ xs: 2, sm: 3 }}
        sx={{ width: "99%", boxSizing: "border-box", mt: 2 }}
      >
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
          {showDeactivated ? "Deactivated Discounts" : "Active Discounts"}
        </Typography>

        <div className="flex items-center gap-4">
          {!showDeactivated && (
            <>
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

              <input
                accept=".csv"
                style={{ display: 'none' }}
                id="import-file"
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
              />
            </>
          )}
          <FormControlLabel
            control={
              <Switch
                checked={showDeactivated}
                onChange={handleToggle}
                color="primary"
                size="small"
              />
            }
            label={label}
            sx={{
              marginLeft: 1,
              marginRight: 1,
              "& .MuiFormControlLabel-label": {
                fontSize: "0.75rem",
                fontFamily: "'Poppins', sans-serif",
              },
            }}
          />
        </div>
      </Box>

      <div className="table-container my-1" style={{ maxHeight: 'calc(90.5vh - 170px)' }}>
        <table className="custom-table">
          <thead>
            <tr>
              <th>S.NO</th>
              <th>Discount Id</th>
              <th>SaleType Discount name</th>
              <th>Discount Name</th>
              <th>Discount Percentage</th>
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
                {displayedDiscounts.map((discount, index) => (
                  <tr key={discount.id || index}>
                    <td style={{ textAlign: 'center' }}>{index + 1}</td>
                    <td style={{ textAlign: 'center' }}>{discount.discountId}</td>
                    <td style={{ textAlign: 'center' }}>{discount.saleTypeDiscount}</td>
                    <td style={{ textAlign: 'center' }}>{discount.discountName}</td>
                    <td style={{ textAlign: 'center' }}>{`${discount.discountPercentage}%`}</td>
                    <td style={{ textAlign: 'center' }}>
                      {showDeactivated ? (
                        <button
                          color="primary"
                          onClick={() => handleActivate(discount)}
                          className="activate-btn"
                          title="Activate"
                        >
                          <RefreshIcon />
                        </button>
                      ) : (
                        <>
                          <button
                            onClick={() => handleEdit(discount)}
                            className="edit-btn"
                            title="Edit"
                          >
                            <EditIcon />
                          </button>
                          <button
                            onClick={() => handleDeactivate(discount)}
                            className="deactivate-btn"
                            title="Deactivate"
                          >
                            <DeleteIcon />
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
                {displayedDiscounts.length === 0 && (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center' }}>
                      <h2>
                        {showDeactivated ? 'No deactivated discounts found' : 'No active discounts found'}
                      </h2>
                    </td>
                  </tr>
                )}
              </>
            )}
          </tbody>
        </table>
      </div>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      >
        <Alert
          onClose={handleSnackbarClose}
          severity="info"
          sx={{ width: '100%', backgroundColor: '#1976d2', color: 'white' }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </>
  );
};

export default DiscountTableContainer;