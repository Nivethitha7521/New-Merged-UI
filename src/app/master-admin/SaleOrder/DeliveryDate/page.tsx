

"use client";
import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchDeliveryOrders,
  activateOrder,
  deactivateOrder,
  updateConfigInOrder,
  Config,
} from "../DeliveryDate/Features/deliveryorderslice";
import { AppDispatch, RootState } from "../../../../redux/store";
import {
  Box,
  Grid,
  Typography,
  CircularProgress,
  Snackbar,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
} from "@mui/material";
import MenuPage from "../page";
import DeliveryOrderCard from "../DeliveryDate/Modules/deliveryOrderCard";

type EditData = {
  configures: Config[];
  noOfChangeableDate: string;
};

const DeliveryOrdersPage: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { items, loading, error } = useSelector(
    (state: RootState) => state.deliveryOrder
  );

  const [enabledOrderId, setEnabledOrderId] = useState<string | null>(null);
  const [selectedConfigId, setSelectedConfigId] = useState<string | null>(null);
  const [editData, setEditData] = useState<EditData>({
    configures: [],
    noOfChangeableDate: "",
  });

  const [isDirty, setIsDirty] = useState(false);
  const [showEditConfirm, setShowEditConfirm] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState<"success" | "error">("success");
  const [nextAction, setNextAction] = useState<null | (() => void)>(null);
  //const [pendingOrderId, setPendingOrderId] = useState<string | null>(null);

  useEffect(() => {
    if (items.length === 0) {
      dispatch(fetchDeliveryOrders());
    }
  }, [dispatch, items]);

  useEffect(() => {
    if (items.length > 0 && !enabledOrderId) {
      const enabled = items.find((order) => order.status === "enabled");
      if (enabled) setEnabledOrderId(enabled.deliveryOrderId);
    }
  }, [items, enabledOrderId]);

  const handleRadioChange = useCallback(
    (selectedOrderId: string) => {
      const performSwitch = async () => {
        if (selectedOrderId === enabledOrderId) return;

        try {
          if (enabledOrderId) {
            await dispatch(deactivateOrder(enabledOrderId)).unwrap();
          }
          await dispatch(activateOrder(selectedOrderId)).unwrap();
          setEnabledOrderId(selectedOrderId);
          setSnackbarMessage("Order activated.");
          setSnackbarSeverity("success");
        } catch (error) {
          console.error(error);
          setSnackbarMessage("Failed to change order.");
          setSnackbarSeverity("error");
        } finally {
          setSnackbarOpen(true);
        }
      };

      if (isDirty) {
        setNextAction(() => performSwitch);
        setShowEditConfirm(true);
      } else {
        performSwitch();
      }
    },
    [dispatch, enabledOrderId, isDirty]
  );

  const handleEditClick = (cfg: Config) => {
    setSelectedConfigId(cfg.configId);
    setEditData({
      configures: [],
      noOfChangeableDate: cfg.noOfChangeableDate?.toString() || "0",
    });
    setIsDirty(false);
  };

  const onEditChange =
    (field: string) =>
      (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const value = event.target.value;
        setEditData((prev) => ({
          ...prev,
          [field]: value,
        }));
        setIsDirty(true);
      };

  const handleEditSubmit = (orderId: string) => {
    const submitEdit = async () => {
      if (!selectedConfigId) return;
      const payload = {
        orderId,
        configId: selectedConfigId,
        updatedConfig: {
          noOfChangeableDate: parseInt(editData.noOfChangeableDate, 10),
        },
      };
      try {
        await dispatch(updateConfigInOrder(payload)).unwrap();
        setSnackbarMessage("Configuration updated.");
        setSnackbarSeverity("success");
      } catch (error) {
        console.error(error);
        setSnackbarMessage("Update failed.");
        setSnackbarSeverity("error");
      } finally {
        setSnackbarOpen(true);
        resetEditState();
      }
    };

    if (isDirty) {
      // setPendingOrderId(orderId);
      setNextAction(() => submitEdit);
      setShowEditConfirm(true);
    } else {
      submitEdit();
    }
  };

  const handleEditCancel = () => {
    resetEditState();
    setShowEditConfirm(false);
    setNextAction(null);
  };

  const handleConfirmDialog = () => {
    if (nextAction) {
      nextAction();
    }
    setShowEditConfirm(false);
    setNextAction(null);
  };

  const resetEditState = () => {
    setSelectedConfigId(null);
    setEditData({ configures: [], noOfChangeableDate: "" });
    setIsDirty(false);
  };

  const reversedItems = useMemo(() => [...items].reverse(), [items]);



  return (
    <Box>
      {/* <MenuPage /> */}


 <Box className="item-master-toolbar-shell" sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
        <Box
          className="purchase-reference-toolbar item-master-toolbar"
          sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', gap: 2 }}
        >
          <Typography className="sale-order-toolbar-title">
            Delivery Order Configuration
          </Typography>
        </Box>
      </Box>

     <Grid container spacing={2} mt={0}>
        {reversedItems.map((order) => (
          <Grid item xs={12} key={order.deliveryOrderId}>
            <DeliveryOrderCard
              order={order}
              isActive={order.deliveryOrderId === enabledOrderId}
              onRadioChange={() => handleRadioChange(order.deliveryOrderId)}
              onEditClick={handleEditClick}
              onEditChange={onEditChange}
              onEditSubmit={() => handleEditSubmit(order.deliveryOrderId)}
              onEditCancel={handleEditCancel}
              selectedConfigId={selectedConfigId}
              editData={editData}
              enabledOrderId={enabledOrderId}
            />
          </Grid>
        ))}
      </Grid>


      {/* Confirm Dialog */}
      <Dialog
        open={showEditConfirm}
        onClose={handleEditCancel}
        fullWidth
        PaperProps={{
          className: "dialog-paper-small",
        }}
      >
        <DialogTitle className="dialog-title">Confirm Action</DialogTitle>
        <DialogContent className="dialog-content">
          <label>
            Are you sure you want to save these changes?
          </label>
        </DialogContent>
        <DialogActions className="dialog-actions">
          <button onClick={handleEditCancel} className="btn-secondary">Cancel</button>
          <button onClick={handleConfirmDialog} color="primary" className="btn-primary">
            Confirm
          </button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
      >
        <Alert
          onClose={() => setSnackbarOpen(false)}
          severity={snackbarSeverity}
          sx={{
            width: "100%",
            bgcolor: snackbarSeverity === "success" ? "#1976d2" : "#d32f2f",
            color: "#fff",
          }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default DeliveryOrdersPage;
