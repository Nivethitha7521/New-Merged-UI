'use client';
import React, { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { RootState, AppDispatch } from "../../../../redux/store";
import {
  fetchWhatsApps,
  setWhatsAppData,
  setDialogOpen,
  updateWhatsApp,
  setSnackbarMessage,
  setSnackbarOpen,
} from "../Features/whatsAppSlice";
import { WhatsApp as WhatsAppType } from "../Models/whatsappAdminModels";
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  IconButton,
  FormControlLabel,
  Switch,
  Typography,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from '@mui/icons-material/Delete';
import RefreshIcon from '@mui/icons-material/Refresh';
import ActivateDeactivateConfirmationDialog from "../../../Components/Dialogs/ActivateDeactivateConfirmationDialog";

interface WhatsAppTableComponentProps {
  viewDeactivated: boolean;
  setViewDeactivated: (value: boolean) => void;
  handleOpen: () => void;
}

const WhatsAppTableComponent: React.FC<WhatsAppTableComponentProps> = ({
  viewDeactivated,
  setViewDeactivated,
  handleOpen,
}) => {
  const dispatch = useDispatch<AppDispatch>();
  const { items, deactivatedItems, loading } = useSelector((state: RootState) => state.WhatsApp);

  const [confirmationDialogOpen, setConfirmationDialogOpen] = useState(false);
  const [selectedWhatsApp, setSelectedWhatsApp] = useState<WhatsAppType | null>(null);
  const [actionType, setActionType] = useState<"deactivate" | "activate" | null>(null);

  useEffect(() => {
    dispatch(fetchWhatsApps());
  }, [dispatch]);

  const handleEdit = (whatsApp: WhatsAppType) => {
    setSelectedWhatsApp(whatsApp);
    dispatch(setWhatsAppData(whatsApp));
    dispatch(setDialogOpen("edit"));
  };

  const handleDeactivate = (whatsApp: WhatsAppType) => {
    setSelectedWhatsApp(whatsApp);
    setActionType("deactivate");
    setConfirmationDialogOpen(true);
  };

  const handleActivate = (whatsApp: WhatsAppType) => {
    setSelectedWhatsApp(whatsApp);
    setActionType("activate");
    setConfirmationDialogOpen(true);
  };

  const handleConfirmationDialogClose = () => {
    setConfirmationDialogOpen(false);
    setSelectedWhatsApp(null);
    setActionType(null);
  };

  const handleConfirmationDialogConfirm = async () => {
    if (selectedWhatsApp && actionType) {
      if (actionType === "deactivate") {
        await dispatch(updateWhatsApp({ ...selectedWhatsApp, status: "deactivated" }));
        dispatch(setSnackbarMessage("WhatsApp role deactivated!"));
      } else if (actionType === "activate") {
        await dispatch(updateWhatsApp({ ...selectedWhatsApp, status: "active" }));
        dispatch(setSnackbarMessage("WhatsApp role activated!"));
      }
      dispatch(fetchWhatsApps());
      dispatch(setSnackbarOpen(true));
    }
    handleConfirmationDialogClose();
  };

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
          {viewDeactivated ? "Deactivated Whatsapp Roles" : "Active Whatsapp Roles"}
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

      <div className="table-container my-1" style={{ maxHeight: 'calc(90.5vh - 170px)' }}>
        <table className="custom-table">
          <thead>
            <tr>
              <th>S.NO</th>
              <th>WhatsApp Role Name</th>
              <th>Mobile Number</th>
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
                {(viewDeactivated ? deactivatedItems : items).map((whatsApp, index) => (
                  <tr key={whatsApp.moduleAdminId}>
                    <td style={{ textAlign: 'center' }}>{index + 1}</td>
                    <td style={{ textAlign: 'center' }}>{whatsApp.whatsAppRollName}</td>
                    <td style={{ textAlign: 'center' }}>{whatsApp.mobileNumber}</td>
                    <td style={{ textAlign: 'center' }}>
                      {viewDeactivated ? (
                        <button
                          color="primary"
                          onClick={() => handleActivate(whatsApp)}
                          className="activate-btn"
                          title="Activate"
                        >
                          <RefreshIcon />
                        </button>
                      ) : (
                        <>
                          <button onClick={() => handleEdit(whatsApp)}
                            className="edit-btn"
                            title="Edit"
                          >
                            <EditIcon />
                          </button>
                          <button
                            onClick={() => handleDeactivate(whatsApp)}
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
                {(viewDeactivated ? deactivatedItems : items).length === 0 && (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center' }}>
                      <h2 >
                        {viewDeactivated ? 'No deactivated WhatsApp Role found' : 'No active WhatsApp Role found'}
                      </h2>
                    </td>
                  </tr>
                )}
              </>
            )}
          </tbody>
        </table>
      </div>

      <ActivateDeactivateConfirmationDialog
        open={confirmationDialogOpen}
        actionType={actionType}
        onClose={handleConfirmationDialogClose}
        onConfirm={handleConfirmationDialogConfirm}
      />
    </>
  );
};

export default WhatsAppTableComponent;