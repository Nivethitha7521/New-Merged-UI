

'use client';
import React from "react";
import { useSelector } from "react-redux";
import { RootState } from "../../../../../redux/store";
import { PaymentType } from "../../PaymentType/Models/paymenttypeModels";
import {
  Box,
  IconButton,
  Switch,
  Typography,
  FormControlLabel,
  // Alert,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from '@mui/icons-material/Delete';
import RefreshIcon from '@mui/icons-material/Refresh';


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

  const label = viewDeactivated ? 'Show Activated' : 'Show Deactivated';

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
        sx={{ width: "99%", boxSizing: "border-box", mt: 1 }}
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
          {viewDeactivated ? "Deactivated Payments" : "Active Payments"}
        </Typography>

        <div className="flex items-center gap-4">
          {!viewDeactivated && (
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
            </>
          )}
          <FormControlLabel
            control={
              <Switch
                checked={viewDeactivated}
                onChange={() => setViewDeactivated(!viewDeactivated)}
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

      <div className="table-container my-1" style={{ maxHeight: 'calc(90vh - 170px)' }}>
        <table className="custom-tables">
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
                {(viewDeactivated ? deactivatedItems : items).map((payment, index) => (
                  <tr key={payment.paymentTypeId}>
                    <td style={{ textAlign: "center" }}>{index + 1}</td>
                    <td style={{ textAlign: "center" }}>{payment.paymentType || "-"}</td>
                    <td style={{ textAlign: "center" }}>{payment.description || "-"}</td>
                    <td style={{ textAlign: "center" }}>
                      {viewDeactivated ? (
                        <button
                          color="primary"
                          onClick={() => handleActivate(payment)}
                          className="activate-btn"
                          title="Activate"
                        >
                          <RefreshIcon />
                        </button>
                      ) : (
                        <>
                          {!payment.editStatus === false && (
                            <button
                              color="primary"
                              onClick={() => handleEdit(payment)}
                              className="edit-btn"
                              title="Edit"
                            >
                              <EditIcon />
                            </button>
                          )}

                          {!payment.editStatus === false && (
                          <button
                            color="primary"
                            onClick={() => handleDeactivate(payment)}
                            className="deactivate-btns"
                            title="Deactivate"
                          >
                            <DeleteIcon />
                          </button>
                          )}
                        </>
                      )}
                    </td>
                  </tr>
                ))}

                {(viewDeactivated ? deactivatedItems.length === 0 : items.length === 0) && (
                  <tr>
                    <td colSpan={4} style={{ textAlign: "center" }}>
                      <h2 >No data found</h2>
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
