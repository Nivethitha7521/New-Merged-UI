"use client";
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchDeliveryTypes,
  updateDeliveryType,
  createDeliveryType,
  deactivateDeliveryType,
  activateDeliveryType,
} from "../DeliveryType/Features/deliveryTypeslice";
import { DeliveryType } from "../DeliveryType/Models/deliverytypeModels";
import {
  Box,
  Typography,
  IconButton,
  FormControlLabel,
  Switch,
  Popover,
  Checkbox,
  Tooltip,TextField,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import { AppDispatch, RootState } from "../../../../redux/store";
import AddIcon from "@mui/icons-material/Add";
import FilterListIcon from "@mui/icons-material/FilterList";
import DeliveryTypeTableComponent from "../DeliveryType/Modules/deliveryTypeTable";
import DeliveryDialogs from "../DeliveryType/Modules/deliveryDialog";
import DeliveryTypeSnackbar from "../DeliveryType/Modules/snakbar";
import { ConfirmationAction } from "../DeliveryType/Modules/type";
import MenuPage from "../page";

const DeliveryTypePage: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { types } = useSelector(
    (state: RootState) => state.deliveryTypes || {}
  );

  const [open, setOpen] = useState(false);
  const [editData, setEditData] = useState<DeliveryType | null>(null);
  const [formData, setFormData] = useState<Omit<DeliveryType, "deliveryTypeId">>({
    deliveryType: "",
    user: "",
    remarks: "",
    status: "active",
  });

  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [confirmationOpen, setConfirmationOpen] = useState(false);
  const [confirmationAction, setConfirmationAction] = useState<ConfirmationAction | null>(null);
  const [discardChangesOpen, setDiscardChangesOpen] = useState(false);
  const [errors, setErrors] = useState({ deliveryType: "", remarks: "" });
  const [showDeactivatedTable, setShowDeactivatedTable] = useState(false);
  const [formModified, setFormModified] = useState(false);
const [searchValue, setSearchValue] = useState('');
  // State for FilterListIcon and Popover
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [visibleColumns, setVisibleColumns] = useState({
    sNo: true,
    type: true,
    remarks: true,
    //  status: true,
    actions: true,
  });

  const toggleColumn = (key: keyof typeof visibleColumns) => {
    setVisibleColumns((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleFilterClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleCloseFilter = () => {
    setAnchorEl(null);
  };

  const openPopover = Boolean(anchorEl);
  const id = openPopover ? "column-filter-popover" : undefined;

  useEffect(() => {
    dispatch(fetchDeliveryTypes());
  }, [dispatch]);

  const handleOpenEdit = (data: DeliveryType) => {
    setEditData(data);
    setFormData({
      deliveryType: data.deliveryType,
      user: data.user || "",
      remarks: data.remarks || "",
      status: data.status,
    });
    setOpen(true);
    setFormModified(false);
  };

  const handleAddNew = () => {
    setEditData(null);
    setFormData({
      deliveryType: "",
      user: "",
      remarks: "",
      status: "active",
    });
    setOpen(true);
    setFormModified(false);
  };

  const handleClose = () => {
    if (formModified) {
      setDiscardChangesOpen(true);
    } else {
      setOpen(false);
      setEditData(null);
    }
  };

  const handleChange = (field: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setFormModified(true);
  };

  const validateForm = () => {
    const newErrors = { deliveryType: "", remarks: "" };

    if (!formData.deliveryType.trim()) {
      newErrors.deliveryType = "Delivery Type is required!";
    } else if (!/^[A-Za-z\s]+$/.test(formData.deliveryType)) {
      newErrors.deliveryType = "Only letters are allowed!";
    }

    setErrors(newErrors);
    return Object.values(newErrors).every((error) => !error);
  };

  const handleSubmit = () => {
    if (!validateForm()) return;
    setConfirmationAction(editData ? ConfirmationAction.UPDATE : ConfirmationAction.ADD);
    setConfirmationOpen(true);
  };

  const handleToggleStatus = (type: DeliveryType) => {
    setEditData(type);
    setConfirmationAction(ConfirmationAction.TOGGLE_STATUS);
    setConfirmationOpen(true);
  };

  const confirmAction = () => {
    if (!confirmationAction) return;

    switch (confirmationAction) {
      case ConfirmationAction.ADD:
        dispatch(createDeliveryType(formData))
          .unwrap()
          .then(() => {
            setSnackbarMessage("Delivery Type created successfully");
            setSnackbarOpen(true);
            setOpen(false);
            dispatch(fetchDeliveryTypes());
          })
          .catch((error) => {
            setSnackbarMessage(error.message || "Failed to create delivery type");
            setSnackbarOpen(true);
          });
        break;

      case ConfirmationAction.UPDATE:
        if (!editData) return;
        dispatch(updateDeliveryType({ deliveryTypeId: editData.deliveryTypeId, updates: formData }))
          .unwrap()
          .then(() => {
            setSnackbarMessage("Delivery Type updated successfully");
            setSnackbarOpen(true);
            setOpen(false);
            dispatch(fetchDeliveryTypes());
          })
          .catch((error) => {
            setSnackbarMessage(error.message || "Failed to update delivery type");
            setSnackbarOpen(true);
          });
        break;

      case ConfirmationAction.TOGGLE_STATUS:
        if (!editData) return;
        const action =
          editData.status === "active"
            ? deactivateDeliveryType(editData.deliveryTypeId)
            : activateDeliveryType(editData.deliveryTypeId);

        dispatch(action)
          .unwrap()
          .then(() => {
            setSnackbarMessage(
              `Delivery Type ${editData.status === "active" ? "deactivated" : "activated"} successfully`
            );
            setSnackbarOpen(true);
            dispatch(fetchDeliveryTypes());
          })
          .catch((error) => {
            setSnackbarMessage(error.message || "Failed to toggle status");
            setSnackbarOpen(true);
          });
        break;

      default:
        break;
    }

    setConfirmationOpen(false);
    setFormModified(false);
  };

  // const getConfirmationMessage = () => {
  //   switch (confirmationAction) {
  //     case ConfirmationAction.ADD:
  //       return "Are you sure you want to add this delivery type?";
  //     case ConfirmationAction.UPDATE:
  //       return "Are you sure you want to update this delivery type?";
  //     case ConfirmationAction.TOGGLE_STATUS:
  //       return editData?.status === "active"
  //         ? `Are you sure you want to deactivate this delivery type?`
  //         : "Are you sure you want to activate this delivery type?";
  //     default:
  //       return "Confirm action?";
  //   }
  // };

  const getConfirmationMessage = () => {
  const name = editData?.deliveryType ? `"${editData.deliveryType}"` : "";

  switch (confirmationAction) {
    case ConfirmationAction.ADD:
      return `Are you sure you want to add this ${name}?`;

    case ConfirmationAction.UPDATE:
      return `Are you sure you want to update this ${name}?`;

    case ConfirmationAction.TOGGLE_STATUS:
      return editData?.status === "active"
        ? `Are you sure you want to deactivate this ${name}?`
        : `Are you sure you want to activate this ${name}?`;

    default:
      return "Confirm action?";
  }
};

  const handleDiscardChanges = () => {
    setOpen(false);
    setDiscardChangesOpen(false);
    setFormModified(false);
  };

  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };

  const filteredTypes = Array.isArray(types)
    ? types.filter((type) => {
      const matchesStatus =
        type?.status === (showDeactivatedTable ? "deactivate" : "active");
      const query = searchValue.trim().toLowerCase();

      if (!matchesStatus) return false;
      if (!query) return true;

      return (
        type.deliveryType?.toLowerCase().includes(query) ||
        type.remarks?.toLowerCase().includes(query)
      );
    })
    : [];


  const label = showDeactivatedTable ? 'Show Activated' : 'Show Deactivated';

  return (
    <div>
      {/* <MenuPage /> */}

 <Box className="item-master-toolbar-shell" sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
        <Box
          className="purchase-reference-toolbar item-master-toolbar"
          sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', gap: 2 }}
        >
 <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography className="sale-order-toolbar-title">
              {showDeactivatedTable ? "Deactivated Delivery Types" : "Active Delivery Types"}
            </Typography>
          </Box>

          <Box className="item-master-search-slot" sx={{ flex: '0 0 auto', display: 'flex', justifyContent: 'center' }}>
            <TextField
              size="small"
              variant="outlined"
              autoComplete="off"
              placeholder="Search Delivery Type..."
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
            {!showDeactivatedTable && (
              <div className="icon-action-wrapper purchase-reference-action-button item-master-action">
                <IconButton color="primary" onClick={handleAddNew} className="icon-action-button" title="Add">
                  <AddIcon className="icon-action-svg" />
                </IconButton>
                <Typography className="icon-action-label">Add</Typography>
              </div>
            )}
            <FormControlLabel
              className="purchase-reference-active-toggle item-master-active-toggle"
              control={
                <Switch
                  checked={showDeactivatedTable}
                  onChange={() => setShowDeactivatedTable(!showDeactivatedTable)}
                  color="primary"
                  size="small"
                />
              }
              label={label}
            />
          </Box>
        </Box>
      </Box>

      {/* <Popover
          id={id}
          open={openPopover}
          anchorEl={anchorEl}
          onClose={handleCloseFilter}
          anchorOrigin={{
            vertical: "bottom",
            horizontal: "right",
          }}
          transformOrigin={{
            vertical: "top",
            horizontal: "right",
          }}
        >
          <Box p={2} display="flex" flexDirection="column">
            <Typography variant="subtitle1" gutterBottom>
              Select Columns
            </Typography>
            {Object.entries(visibleColumns).map(([key, value]) => (
              <FormControlLabel
                key={key}
                control={
                  <Checkbox
                    checked={value}
                    onChange={() => toggleColumn(key as keyof typeof visibleColumns)}
                  />
                }
                label={key
                  .replace("sNo", "S.No")
                  .replace("type", "Type")
                  .replace("remarks", "Remarks")
                  .replace("status", "Status")
                  .replace("actions", "Actions")}
              />
            ))}
          </Box>
        </Popover> */}

      <DeliveryTypeTableComponent
        filteredTypes={filteredTypes}
        showDeactivatedTable={showDeactivatedTable}
        onOpenEdit={handleOpenEdit}
        onDeactivate={handleToggleStatus}
        onActivate={handleToggleStatus}
        visibleColumns={visibleColumns}
      />

      <DeliveryDialogs
        open={open}
        editData={editData}
        isEditMode={!!editData}
        handleChange={handleChange}
        handleClose={handleClose}
        handleSubmit={handleSubmit}
        discardChangesOpen={discardChangesOpen}
        setDiscardChangesOpen={setDiscardChangesOpen}
        handleDiscardChanges={handleDiscardChanges}
        confirmationOpen={confirmationOpen}
        confirmationMessage={getConfirmationMessage()}
        setConfirmationOpen={setConfirmationOpen}
        confirmAction={confirmAction}
        formData={formData}
        errors={errors}
        setErrors={setErrors}
      />

      <DeliveryTypeSnackbar
        snackbarOpen={snackbarOpen}
        handleSnackbarClose={handleSnackbarClose}
        snackbarMessage={snackbarMessage}
      />
    </div>
  );
};

export default DeliveryTypePage;