
"use client";

import React, {
  useEffect,
  useState,
  useCallback,
  useMemo,
  ChangeEvent,
  useRef,
} from "react";
import {
  Box,
  Typography,
  IconButton,
  FormControlLabel,
  Switch,
  Alert,
  CircularProgress,
  TextField,
  SelectChangeEvent,
  InputAdornment,
} from "@mui/material";
import {
  Add as AddIcon,
  Search as SearchIcon,
  Clear as ClearIcon,
} from "@mui/icons-material";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "../../../redux/store";

import {
  fetchDevices,
  addDevice,
  updateDevice,
  deactivateDevice,
  activateDevice,
  fetchBranchAliases,
  setDeviceData,
  setEditIndex,
  setDialogOpen,
  setSnackbarOpen,
  setSnackbarMessage,
  setSearchQuery,
  setShowDeactivated,
  resetDeviceData,
  selectDevice,
  generateDeviceCode,
  fetchNextTillId,
  checkServerConflict,
  setServerConflict,
  toggleDcStatus,
} from "../POSDevicePage/Feature/posDeviceSlice";

import POSDeviceTable from "../POSDevicePage/Modules/POSDeviceTable";
import POSDeviceDialog from "../POSDevicePage/Modules/POSDeviceDialog";
import POSDeviceSnackbar from "../POSDevicePage/Modules/POSDeviceSnackbar";
import CloseConfirmationDialog from "../../Components/Dialogs/CloseConfirmationDialog";
import EditConfirmationDialog from "../../Components/Dialogs/EditConfirmationDialog";
import ActivateDeactivateConfirmationDialog from "../../Components/Dialogs/ActivateDeactivateConfirmationDialog";
import { Device } from "../POSDevicePage/Models/PosDeviceModel";
import { AxiosError } from "axios";

// Debounce Hook
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
}

// Validation Errors Interface
interface ValidationErrors {
  deviceName: string;
  branchName: string;
  companyName: string;
}

const POSDevicePage = () => {
  const dispatch = useDispatch<AppDispatch>();
  const {
    devices,
    deactivatedDevices,
    branches,
    loading,
    error,
    deviceData,
    dialogOpen,
    snackbarOpen,
    snackbarMessage,
    showDeactivated: showDeactivatedSlice,
    page,
    totalPages,
    serverConflict,
  } = useSelector(selectDevice);

  // Local UI state
  const [localShowDeactivated, setLocalShowDeactivated] = useState(false);
  const [searchDeviceName, setSearchDeviceName] = useState("");
  const [searchBranchName, setSearchBranchName] = useState("");
  const [currentDeviceId, setCurrentDeviceId] = useState<string | null>(null);
  const [confirmationOpen, setConfirmationOpen] = useState(false);
  const [editConfirmOpen, setEditConfirmOpen] = useState(false);
  const [closeConfirmOpen, setCloseConfirmOpen] = useState(false);
  const [actionType, setActionType] = useState<"deactivate" | "activate" | null>(null);
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const [unsavedChanges, setUnsavedChanges] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Validation state
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({
    deviceName: "",
    branchName: "",
    companyName: "",
  });

  const showDeactivated = localShowDeactivated;

  // Debounced search values
  const debouncedDeviceName = useDebounce(searchDeviceName, 500);
  const debouncedBranchName = useDebounce(searchBranchName, 500);

  // Initial load + search on debounced change
  useEffect(() => {
    dispatch(fetchBranchAliases());
  }, [dispatch]);

  useEffect(() => {
    dispatch(
      fetchDevices({
        deviceName: debouncedDeviceName.trim(),
        branchName: debouncedBranchName.trim(),
      })
    );
  }, [debouncedDeviceName, debouncedBranchName, dispatch]);

  const handleGenerateCode = useCallback(() => {
    const payload = currentDeviceId ? { id: currentDeviceId } : {};
    dispatch(generateDeviceCode(payload));
  }, [currentDeviceId, dispatch]);

  // === VALIDATION ===
  const validateFields = useCallback(() => {
    const errors: ValidationErrors = {
      deviceName: "",
      branchName: "",
      companyName: "",
    };
    let isValid = true;

    if (!deviceData.deviceName?.trim()) {
      errors.deviceName = "Device name is required";
      isValid = false;
    }

    if (!deviceData.branchName) {
      errors.branchName = "Branch name is required";
      isValid = false;
    }

    if (!deviceData.companyName?.trim()) {
      errors.companyName = "Company Name is required";
      isValid = false;
    }

    setValidationErrors(errors);
    return isValid;
  }, [deviceData]);

  // === DUPLICATE CHECKS ===
  const checkDuplicateDeviceName = useCallback(() => {
    const allDevices = showDeactivated
      ? [...devices, ...deactivatedDevices]
      : devices;
    return allDevices.some(
      (d) =>
        d.deviceName.toLowerCase() === deviceData.deviceName?.trim().toLowerCase() &&
        d.id !== currentDeviceId
    );
  }, [devices, deactivatedDevices, deviceData.deviceName, currentDeviceId, showDeactivated]);

  // Search handlers
  const handleSearchDeviceNameChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      setSearchDeviceName(e.target.value);
    },
    []
  );

  const handleSearchBranchNameChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      setSearchBranchName(e.target.value);
    },
    []
  );

  // === RESET DIALOG ===
  const resetDialog = useCallback(() => {
    dispatch(setDialogOpen("none"));
    dispatch(resetDeviceData());
    setCurrentDeviceId(null);
    setUnsavedChanges(false);
    setValidationErrors({ deviceName: "", branchName: "", companyName: "" });
  }, [dispatch]);

  // === SUBMIT DEVICE (core submit logic) ===
  const submitDevice = useCallback(async () => {
    setIsSubmitting(true);
    try {
      if (currentDeviceId) {
        setEditConfirmOpen(true);
      } else {
        const payload: Device = { ...deviceData, status: "active" };
        await dispatch(addDevice(payload)).unwrap();
        dispatch(setSnackbarMessage("Device Created successfully"));
        dispatch(setSnackbarOpen(true));
        dispatch(
          fetchDevices({
            deviceName: debouncedDeviceName.trim(),
            branchName: debouncedBranchName.trim(),
            page: 1,
            limit: 15,
          })
        );
        resetDialog();
      }
    } catch (e) {
      const err = e as AxiosError;
      dispatch(setSnackbarMessage(err.message ?? "Failed to add device"));
      dispatch(setSnackbarOpen(true));
    } finally {
      setIsSubmitting(false);
    }
  }, [
    currentDeviceId,
    deviceData,
    dispatch,
    debouncedDeviceName,
    debouncedBranchName,
    resetDialog,
  ]);

  // Direct submit for server conflict confirm — skips edit confirmation dialog
  const submitDeviceDirect = useCallback(async () => {
    setIsSubmitting(true);
    try {
      const payload: Device = { ...deviceData, id: currentDeviceId! };
      await dispatch(updateDevice(payload)).unwrap();
      dispatch(setSnackbarMessage("Device updated successfully"));
      dispatch(setSnackbarOpen(true));
      dispatch(
        fetchDevices({
          deviceName: debouncedDeviceName.trim(),
          branchName: debouncedBranchName.trim(),
          page,
          limit: 15,
        })
      );
      resetDialog();
    } catch (e) {
      const err = e as AxiosError;
      dispatch(setSnackbarMessage(err.message ?? "Failed to update device"));
      dispatch(setSnackbarOpen(true));
    } finally {
      setIsSubmitting(false);
    }
  }, [
    currentDeviceId,
    deviceData,
    dispatch,
    debouncedDeviceName,
    debouncedBranchName,
    page,
    resetDialog,
  ]);


  // === MAIN SUBMIT HANDLER ===
  const handleCreateOrUpdate = useCallback(async () => {
    if (!validateFields()) return;

    // if (checkDuplicateDeviceName()) {
    //   dispatch(setSnackbarMessage("A device with this name already exists."));
    //   dispatch(setSnackbarOpen(true));
    //   return;
    // }

    // Only check server conflict when isServer is being turned ON
    if (deviceData.isServer) {
      try {
        const existing = await dispatch(
          checkServerConflict(deviceData.aliasName)
        ).unwrap();

        if (existing && existing.id !== deviceData.id) {
          dispatch(
            setServerConflict({ existingDevice: existing, pendingSubmit: null })
          );
          return; // Wait for user confirmation
        }
      } catch {
        // If check fails, proceed normally
      }
    }

    await submitDevice();
  }, [
    validateFields,
    checkDuplicateDeviceName,
    deviceData,
    dispatch,
    submitDevice,
  ]);

  // // === SERVER CONFLICT HANDLERS ===
const handleServerConflictConfirm = useCallback(async () => {
  dispatch(setServerConflict(null));
  if (currentDeviceId) {
    await submitDeviceDirect(); // edit mode — skip edit confirm dialog
  } else {
    await submitDevice();       // add mode — normal flow
  }
}, [dispatch, currentDeviceId, submitDeviceDirect, submitDevice]);



  const handleServerConflictCancel = useCallback(() => {
    dispatch(setServerConflict(null));
    dispatch(setDeviceData({ ...deviceData, isServer: false }));
  }, [dispatch, deviceData]);

  // === EDIT CONFIRM ===
  const handleEditConfirm = useCallback(async () => {
    setIsSubmitting(true);
    try {
      const payload: Device = {
        ...deviceData,
        id: currentDeviceId!,
      };
      await dispatch(updateDevice(payload)).unwrap();
      dispatch(setSnackbarMessage("Device updated successfully"));
      dispatch(setSnackbarOpen(true));
      dispatch(
        fetchDevices({
          deviceName: debouncedDeviceName.trim(),
          branchName: debouncedBranchName.trim(),
          page,
          limit: 15,
        })
      );
      resetDialog();
    } catch (e) {
      const err = e as AxiosError;
      dispatch(setSnackbarMessage(err.message ?? "Failed to update device"));
      dispatch(setSnackbarOpen(true));
    } finally {
      setIsSubmitting(false);
      setEditConfirmOpen(false);
    }
  }, [currentDeviceId, deviceData, dispatch, debouncedDeviceName, debouncedBranchName, page, resetDialog]);

  const handleEdit = useCallback(
    (device: Device) => {
      dispatch(setDeviceData(device));
      setCurrentDeviceId(device.id);
      setValidationErrors({ deviceName: "", branchName: "", companyName: "" });
      dispatch(setDialogOpen("edit"));
      setUnsavedChanges(false);
    },
    [dispatch]
  );

  const handleDeactivate = useCallback((device: Device) => {
    setSelectedDevice(device);
    setActionType("deactivate");
    setConfirmationOpen(true);
  }, []);

  const handleActivate = useCallback((device: Device) => {
    setSelectedDevice(device);
    setActionType("activate");
    setConfirmationOpen(true);
  }, []);


  const handleToggleDcStatus = useCallback(
    async (device: Device) => {
      try {
        await dispatch(toggleDcStatus(device.id)).unwrap();
        dispatch(
          fetchDevices({
            deviceName: debouncedDeviceName.trim(),
            branchName: debouncedBranchName.trim(),
            page,
            limit: 15,
          })
        );
      } catch (e) {
        const err = e as AxiosError;
        dispatch(setSnackbarMessage(err.message ?? "Failed to update DC status"));
        dispatch(setSnackbarOpen(true));
      }
    },
    [dispatch, debouncedDeviceName, debouncedBranchName, page]
  );


  const handleConfirmation = useCallback(async () => {
    if (!selectedDevice || !actionType) return;

    try {
      if (actionType === "deactivate") {
        await dispatch(deactivateDevice(selectedDevice.id)).unwrap();
      } else {
        await dispatch(activateDevice(selectedDevice.id)).unwrap();
      }
      dispatch(
        setSnackbarMessage(
          `Device ${actionType === "deactivate" ? "deactivated" : "activated"} successfully`
        )
      );
      dispatch(setSnackbarOpen(true));
      dispatch(
        fetchDevices({
          deviceName: debouncedDeviceName.trim(),
          branchName: debouncedBranchName.trim(),
          page,
          limit: 15,
        })
      );
    } catch (e) {
      const err = e as AxiosError;
      dispatch(
        setSnackbarMessage(err.message ?? `Failed to ${actionType} device`)
      );
      dispatch(setSnackbarOpen(true));
    } finally {
      setConfirmationOpen(false);
      setSelectedDevice(null);
      setActionType(null);
    }
  }, [selectedDevice, actionType, dispatch, debouncedDeviceName, debouncedBranchName, page]);

  const handleOpenAdd = useCallback(() => {
    dispatch(resetDeviceData());
    setCurrentDeviceId(null);
    setUnsavedChanges(false);
    setValidationErrors({ deviceName: "", branchName: "", companyName: "" });
    dispatch(setDialogOpen("add"));
  }, [dispatch]);

  const handleClose = useCallback(() => {
    if (unsavedChanges) {
      setCloseConfirmOpen(true);
    } else {
      resetDialog();
    }
  }, [unsavedChanges, resetDialog]);

  const handleConfirmClose = useCallback(() => {
    resetDialog();
    setCloseConfirmOpen(false);
  }, [resetDialog]);

  const handleCancelClose = useCallback(() => {
    setCloseConfirmOpen(false);
  }, []);

  const handleChange = useCallback(
    async (
      event:
        | ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
        | SelectChangeEvent
    ) => {
      const { name, value } = event.target;
      if (!name) return;

      if (validationErrors[name as keyof ValidationErrors]) {
        setValidationErrors((prev) => ({ ...prev, [name]: "" }));
      }

      if (name === "branchName") {
        const selectedBranch = branches.find(
          (branch) => branch.branchName === value
        );
        const newAliasName = selectedBranch?.aliasName || "";

        dispatch(
          setDeviceData({
            ...deviceData,
            branchName: value as string,
            aliasName: newAliasName,
          })
        );

        if (newAliasName && !currentDeviceId) {
          try {
            await dispatch(fetchNextTillId(newAliasName)).unwrap();
          } catch (error) {
            console.error("Failed to fetch next Till ID:", error);
          }
        }
      } else if (name === "aliasName") {
        dispatch(
          setDeviceData({
            ...deviceData,
            [name]: value,
          })
        );

        if (value && !currentDeviceId) {
          try {
            await dispatch(fetchNextTillId(value as string)).unwrap();
          } catch (error) {
            console.error("Failed to fetch next Till ID:", error);
          }
        }
      } else {
        dispatch(
          setDeviceData({
            ...deviceData,
            [name]: value,
          })
        );
      }
      setUnsavedChanges(true);
    },
    [deviceData, branches, dispatch, currentDeviceId, validationErrors]
  );

  // Displayed devices
  const displayedDevices = useMemo(() => {
    return showDeactivated ? deactivatedDevices : devices;
  }, [devices, deactivatedDevices, showDeactivated]);

  const branchOptions = useMemo(() => {
    return branches.map((a) => ({
      value: a.branchName,
      label: a.branchName,
      alias: a.aliasName,
    }));
  }, [branches]);

  const label = showDeactivated ? "Show Active" : "Show Deactivated";

  return (
    <>
      <Box className="item-master-toolbar-shell">
        <Box className="purchase-reference-toolbar item-master-toolbar yen-pos-device-toolbar">
          <Box sx={{ flex: '0 0 auto', minWidth: 0 }}>
            <Typography className="yen-pos-toolbar-title">
              {showDeactivated ? 'Deactivated POS Devices' : 'Active POS Devices'}
            </Typography>
          </Box>

          <Box className="yen-pos-device-searches">
            <TextField
              size="small"
              autoComplete="off"
              placeholder="Search Device Name"
              value={searchDeviceName}
              onChange={handleSearchDeviceNameChange}
                            className="custom-textfield purchase-reference-search item-master-search yen-pos-device-search"

              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                   <SearchIcon className="purchase-reference-search-icon" />
                  </InputAdornment>
                ),
                endAdornment: searchDeviceName ? (
                  <InputAdornment position="end">
                    <IconButton
                      size="small"
                     onClick={() => setSearchDeviceName('')}
                      title="Clear device search"
                    >
                      <ClearIcon fontSize="small" />
                    </IconButton>
                  </InputAdornment>
              
               ) : undefined,
              }}
            />

            <TextField
              size="small"
              autoComplete="off"
              placeholder="Search Branch Name"
              value={searchBranchName}
              onChange={handleSearchBranchNameChange}
               className="custom-textfield purchase-reference-search item-master-search yen-pos-device-search"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                  <SearchIcon className="purchase-reference-search-icon" />
                  </InputAdornment>
                ),
                 endAdornment: searchBranchName ? (
                  <InputAdornment position="end">
                    <IconButton
                      size="small"
                     onClick={() => setSearchBranchName('')}
                      title="Clear branch search"
                    >
                      <ClearIcon fontSize="small" />
                    </IconButton>
                  </InputAdornment>
              
              ) : undefined,
               }}
            />
          </Box>

        <Box className="purchase-reference-actions item-master-actions">
            {!showDeactivated && (
              <div className="icon-action-wrapper purchase-reference-action-button item-master-action">
                <IconButton
                  color="primary"
                  onClick={handleOpenAdd}
                  className="icon-action-button"
                  title="Add"
                >
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
                  onChange={() => setLocalShowDeactivated((value) => !value)}
                  color="primary"
                  size="small"
                />
              }
              label={label}
            
            />
          </Box>
        </Box>
      </Box>

      {/* Loading / Error / Table */}
      {loading ? (
        <Box display="flex" justifyContent="center" mt={4}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Alert severity="error" sx={{ m: 2 }}>
          {error}
        </Alert>
      ) : (
        <POSDeviceTable
          displayedDevices={displayedDevices}
          showDeactivated={showDeactivated}
          handleEditDevice={handleEdit}
          handleDeactivate={handleDeactivate}
          handleActivate={handleActivate}
          page={page}
          totalPages={totalPages}
          onPageChange={(value) =>
            dispatch(
              fetchDevices({
                deviceName: debouncedDeviceName.trim(),
                branchName: debouncedBranchName.trim(),
                page: value,
                limit: 15,
              })
            )
          }
          handleToggleDcStatus={handleToggleDcStatus}
        />
      )}

      {/* Dialogs */}
      <POSDeviceDialog
        key={currentDeviceId ?? "new"}
        isOpen={dialogOpen !== "none"}
        mode={dialogOpen as "add" | "edit"}
        branchOptions={branchOptions}
        isSubmitting={isSubmitting}
        handleClose={handleClose}
        handleChange={handleChange}
        handleGenerateCode={handleGenerateCode}
        handleSubmit={handleCreateOrUpdate}
        deviceData={deviceData}
        validationErrors={validationErrors}
        open={false}
        serverConflict={serverConflict}
        onServerConflictConfirm={handleServerConflictConfirm}
        onServerConflictCancel={handleServerConflictCancel}
      />

      <POSDeviceSnackbar
        open={snackbarOpen}
        message={snackbarMessage}
        onClose={() => dispatch(setSnackbarOpen(false))}
      />

      <CloseConfirmationDialog
        open={closeConfirmOpen}
        onConfirm={handleConfirmClose}
        onClose={handleCancelClose}
      />
      <EditConfirmationDialog
        open={editConfirmOpen}
        onConfirm={handleEditConfirm}
        onClose={() => setEditConfirmOpen(false)}
      />
      <ActivateDeactivateConfirmationDialog
        open={confirmationOpen}
        onConfirm={handleConfirmation}
        onClose={() => setConfirmationOpen(false)}
        actionType={actionType}
      />
    </>
  );
};

export default POSDevicePage;