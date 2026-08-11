

'use client';
import React, { useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { RootState } from "../../../../../redux/store";
import { PaymentType } from "../../PaymentType/Models/paymenttypeModels";
import {
  Box,
  IconButton,
  Switch,
  Typography,
  FormControlLabel,TextField,
  // Alert,
} from "@mui/material";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import AddIcon from "@mui/icons-material/Add";
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import RestoreRoundedIcon from '@mui/icons-material/RestoreRounded';
import SearchIcon from '@mui/icons-material/Search';


interface PaymentTableContainerProps {
  handleEdit: (payment: PaymentType) => void;
  handleDeactivate: (payment: PaymentType) => void;
  handleActivate: (payment: PaymentType) => void;
  handleOpen: () => void;
  viewDeactivated: boolean;
  setViewDeactivated: (value: boolean) => void;
}

const PaymentTable: React.FC<PaymentTableContainerProps> = ({
  handleEdit,
  handleDeactivate,
  handleActivate,
  handleOpen,
  viewDeactivated,
  setViewDeactivated,
}) => {
  const { items, deactivatedItems, loading, } = useSelector((state: RootState) => state.maPaymentType);
  const [searchValue, setSearchValue] = useState('');

  const label = viewDeactivated ? 'Show Activated' : 'Show Deactivated';
  const displayedPayments = viewDeactivated ? deactivatedItems : items;

  const filteredPayments = useMemo(() => {
    const query = searchValue.trim().toLowerCase();
    if (!query) return displayedPayments;

    return displayedPayments.filter((payment) =>
      payment.paymentType?.toLowerCase().includes(query) ||
      payment.description?.toLowerCase().includes(query)
    );
  }, [displayedPayments, searchValue]);
  return (
    <>
 <Box className="item-master-toolbar-shell" sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
        <Box
          className="purchase-reference-toolbar item-master-toolbar"
          sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', gap: 2 }}
        >
 <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography className="sale-order-toolbar-title">
              {viewDeactivated ? "Deactivated Payments" : "Active Payments"}
            </Typography>
          </Box>

          <Box className="item-master-search-slot" sx={{ flex: '0 0 auto', display: 'flex', justifyContent: 'center' }}>
            <TextField
              size="small"
              variant="outlined"
              autoComplete="off"
              placeholder="Search Payment Type..."
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
            {!viewDeactivated && (
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
                  checked={viewDeactivated}
                  onChange={() => setViewDeactivated(!viewDeactivated)}
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
        <table className="item-master-table item-master-lookup-table sale-order-lookup-table--4">
          <thead>
            <tr>
              <th style={{ textAlign: "center" }}>S.NO</th>
              <th style={{ textAlign: "center" }}>Payment Type</th>
              <th style={{ textAlign: "center" }}>Description</th>
              <th style={{ textAlign: "center" }}>Actions</th>
            </tr>
          </thead>

          <tbody>
            {/* {loading ? (
              <tr>
                <td colSpan={4} style={{ textAlign: "center" }}>
                  <h3 style={{ fontWeight: "bold" }}>Loading...</h3>
                </td>
              </tr>
            ) : ( */}
              <>
               {filteredPayments.map((payment, index) => (
                  <tr key={payment.paymentTypeId} className="item-master-data-row">
                    <td style={{ textAlign: "center" }}>{index + 1}</td>
                    <td style={{ textAlign: "center" }}>{payment.paymentType || "-"}</td>
                    <td style={{ textAlign: "center" }}>{payment.description || "-"}</td>
  <td className="item-master-actions-cell">
                      <div>
                        {viewDeactivated ? (
                          <IconButton
                            onClick={() => handleActivate(payment)}
                            className="purchase-master-action-button is-activate"
                            title="Activate"
                            size="small"
                          >
                          <RestoreRoundedIcon />
                          </IconButton>
                        ) : (
                          <>
                            {!payment.editStatus === false && (
                              <IconButton
                                onClick={() => handleEdit(payment)}
                                className="purchase-master-action-button is-edit"
                                title="Edit"
                                size="small"
                              >
                                <EditOutlinedIcon />
                              </IconButton>
                            )}

                            {!payment.editStatus === false && (
                              <IconButton
                                onClick={() => handleDeactivate(payment)}
                                className="purchase-master-action-button is-delete"
                                title="Deactivate"
                                size="small"
                              >
                                <DeleteOutlineRoundedIcon />
                              </IconButton>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}

                 {filteredPayments.length === 0 && (
                  <tr>
                   <td colSpan={4} className="empty-state">
                      <h2>No data found</h2>
                    </td>
                  </tr>
                )}
              </>
            {/* )} */}
          </tbody>
        </table>
      </div>
    </>
  );

}

export default PaymentTable;
