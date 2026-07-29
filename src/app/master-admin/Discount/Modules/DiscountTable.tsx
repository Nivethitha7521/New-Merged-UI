
'use client';
import React, { useCallback, useMemo, useRef } from 'react';
import {
  Alert,
  Box,
  Button,
  IconButton,
  Snackbar,
  Switch,
  Tooltip,
  Typography,
} from "@mui/material";

import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/EditOutlined";
import DeleteIcon from "@mui/icons-material/DeleteOutlineRounded";
import RefreshIcon from "@mui/icons-material/RestoreRounded";
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../../../../redux/store';
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


  return (
    <>

  {/* Toolbar */}
  <Box className="discount-master-toolbar">
    <Typography className="discount-master-toolbar-title">
      {showDeactivated
        ? "Deactivated Discounts"
        : "Active Discounts"}
    </Typography>

    <Box className="discount-master-toolbar-actions">
      {!showDeactivated && (
        <Button
          type="button"
          variant="outlined"
          startIcon={<AddIcon />}
          onClick={handleOpen}
          className="purchase-reference-action-button"
        >
          Add New
        </Button>
      )}

      <Box className="purchase-reference-active-toggle">
        <Typography component="span">
          Show Active Only
        </Typography>

        <Switch
          checked={!showDeactivated}
          onChange={handleToggle}
          color="primary"
          size="small"
          inputProps={{
            "aria-label": "Show active discounts only",
          }}
        />
      </Box>
    </Box>
  </Box>

  {/* Existing import input is preserved */}
  <input
    accept=".csv"
    style={{ display: "none" }}
    id="import-file"
    type="file"
    ref={fileInputRef}
    onChange={handleFileChange}
  />

  {/* Discount table */}
  <Box className="purchase-master-table-shell">
    <div className="purchase-native-table-wrapper">
      <table className="purchase-native-table discount-native-table">
        <thead>
          <tr>
            <th className="discount-column-sno">
              S.NO
            </th>

            <th className="discount-column-id">
              Discount ID
            </th>

            <th className="discount-column-sale-type">
              SaleType Discount Name
            </th>

            <th className="discount-column-name">
              Discount Name
            </th>

            <th className="discount-column-percentage">
              Discount Percentage
            </th>

            <th className="discount-column-actions">
              Actions
            </th>
          </tr>
        </thead>

        <tbody>
          {loading ? (
            <tr>
              <td
                colSpan={6}
                className="empty-state"
              >
                Loading...
              </td>
            </tr>
          ) : displayedDiscounts.length === 0 ? (
            <tr>
              <td
                colSpan={6}
                className="empty-state"
              >
                {showDeactivated
                  ? "No deactivated discounts found"
                  : "No active discounts found"}
              </td>
            </tr>
          ) : (
            displayedDiscounts.map(
              (discount, index) => (
                <tr key={discount.id || index}>
                  {/* Serial number */}
                  <td className="discount-column-sno">
                    {index + 1}
                  </td>

                  {/* Discount ID */}
                  <td className="discount-column-id">
                    <span className="purchase-master-id-pill">
                      {discount.discountId}
                    </span>
                  </td>

                  {/* Sale type discount */}
                  <td className="discount-column-sale-type">
                    <span className="purchase-master-value-pill">
                      {discount.saleTypeDiscount}
                    </span>
                  </td>

                  {/* Discount name */}
                  <td className="discount-column-name">
                    <Box className="purchase-master-name-cell">
                      <span className="purchase-master-avatar">
                        {(discount.discountName || "?")
                          .charAt(0)
                          .toUpperCase()}
                      </span>

                      <span>
                        {discount.discountName}
                      </span>
                    </Box>
                  </td>

                  {/* Percentage */}
                  <td className="discount-column-percentage">
                    <span className="purchase-master-value-pill">
                      {`${discount.discountPercentage}%`}
                    </span>
                  </td>

                  {/* Actions */}
                  <td className="discount-column-actions">
                    <Box className="purchase-master-actions">
                      {showDeactivated ? (
                        <Tooltip
                          title="Activate discount"
                          arrow
                        >
                          <IconButton
                            type="button"
                            onClick={() =>
                              handleActivate(discount)
                            }
                            className="purchase-master-action-button is-activate"
                            aria-label={`Activate ${discount.discountName}`}
                          >
                            <RefreshIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      ) : (
                        <>
                          <Tooltip
                            title="Edit discount"
                            arrow
                          >
                            <IconButton
                              type="button"
                              onClick={() =>
                                handleEdit(discount)
                              }
                              className="purchase-master-action-button is-edit"
                              aria-label={`Edit ${discount.discountName}`}
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>

                          <Tooltip
                            title="Deactivate discount"
                            arrow
                          >
                            <IconButton
                              type="button"
                              onClick={() =>
                                handleDeactivate(discount)
                              }
                              className="purchase-master-action-button is-delete"
                              aria-label={`Deactivate ${discount.discountName}`}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </>
                      )}
                    </Box>
                  </td>
                </tr>
              ),
            )
          )}
        </tbody>
      </table>
    </div>
  </Box>



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