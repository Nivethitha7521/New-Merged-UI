


import React from "react";
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
import { OrderType } from "../Models/ordertypeModels";

interface OrderTypeTableProps {
  handleOpen: () => void;
  handleEdit: (orderType: OrderType) => void;
  handleActivate: (orderType: OrderType) => void;
  handleDeactivate: (orderType: OrderType) => void;
  showDeactivated: boolean;
  setShowDeactivated: (value: boolean) => void;
}

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

  const displayedOrderTypes = showDeactivated ? deactivatedItems : orderTypes;

  const label = showDeactivated ? 'Show Activated' : 'Show Deactivated';

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
          {showDeactivated ? "Deactivated Order Types" : "Active Order Types"}
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
                onChange={() => setShowDeactivated(!showDeactivated)}
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
        <table className="custom-tables">
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
                {displayedOrderTypes.map((orderType, index) => (
                  <tr key={orderType.id}>
                    <td style={{ textAlign: "center" }}>{index + 1}</td>
                    <td style={{ textAlign: 'center' }}>{orderType.orderTypeId}</td>
                    <td style={{ textAlign: "center" }}>{orderType.orderTypeName}</td>
                    <td style={{ textAlign: "center" }}>
                      {showDeactivated ? (
                        <button
                          color="primary"
                          onClick={() => handleActivate(orderType)}
                          className="activate-btn"
                          title="Activate"
                        >
                          <RefreshIcon />
                        </button>
                      ) : (
                        <>
                          {!orderType.editStatus === false && (
                            <button
                              onClick={() => handleEdit(orderType)}
                              className="edit-btn"
                              title="Edit"
                            >
                              <EditIcon />
                            </button>
                          )}

                          {!orderType.editStatus === false && (
                            <button
                              onClick={() => handleDeactivate(orderType)}
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
                {displayedOrderTypes.length === 0 && (
                  <tr>
                    <td colSpan={4} style={{ textAlign: "center" }}>
                      <h2 >
                        {showDeactivated ? "No deactivated order types found" : "No active order types found"}
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

export default OrderTypeTable;