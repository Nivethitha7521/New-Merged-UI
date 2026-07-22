

'use client';

import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../../redux/store';
import {
  fetchVehicle,
  addVehicle,
  updateVehicle,
  deactivateVehicle,
  activateVehicle,
  setVehicleData,
  setDialogOpen,
  setSnackbarOpen,
  setSnackbarMessage,
  setShowDeactivated,
  fetchBranches,
} from '../Vehicle/Features/vehicleSlice';
import CloseConfirmationDialog from '../../Components/Dialogs/CloseConfirmationDialog';
import EditConfirmationDialog from '../../Components/Dialogs/EditConfirmationDialog';
import ActivateDeactivateConfirmationDialog from '../../Components/Dialogs/ActivateDeactivateConfirmationDialog';
import VehicleDialog from '../Vehicle/Modules/VehicleDialog';
import VehicleTableContainer from '../Vehicle/Modules/VehicleTable';
import { Alert, Snackbar, SelectChangeEvent, debounce } from '@mui/material';
import MenuPage from '../page';
import { validateLettersOnly, validateMaxLength } from '@/app/Components/validation';
import { Vehicle } from '../Vehicle/Models/vehicleModel';

// ─── Types ────────────────────────────────────────────────────────────────────

type ActionType = 'deactivate' | 'activate' | null;

interface VehicleValidationErrors {
  vehicleName: string;
  vehicleModel: string;
  vehicleNo: string;
  branchName: string;
}

// ─── Module-level constants ───────────────────────────────────────────────────

// Single source of truth — used for initialisation, handleOpen, and resetDialog
const INITIAL_VEHICLE: Vehicle = {
  id:           '',
  vehicleId:    '',
  vehicleName:  '',
  vehicleModel: '',
  vehicleNo:    '',
  fuelType:     '',
  branchName:   '',
  status:       'active',
};

const INITIAL_VALIDATION: VehicleValidationErrors = {
  vehicleName:  '',
  vehicleModel: '',
  vehicleNo:    '',
  branchName:   '',
};

// Regexes compiled once at module load — never recreated on render or validation call
const VEHICLE_NO_ALPHANUM_RE = /^[A-Z0-9]+$/;
const VEHICLE_NO_FORMAT_RE   = /^[A-Z]{2}[0-9]{2}[A-Z]{1,2}[0-9]{4}$/;
const NORMALIZE_RE           = /[^A-Z0-9]/gi;

// Stable MUI prop objects
const SNACKBAR_ANCHOR = { vertical: 'bottom', horizontal: 'left' } as const;
const ALERT_SX        = { width: '100%', backgroundColor: '#1976d2', color: 'white' } as const;

// ─── Pure helpers (no React dependency) ───────────────────────────────────────

const normalizeVehicleNo = (val: string): string =>
  val.replace(NORMALIZE_RE, '').toUpperCase();

// ─── Component ────────────────────────────────────────────────────────────────

const VehiclePage: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();

  const {
    items: vehicles,
    vehicleData,
    snackbarOpen,
    snackbarMessage,
    dialogOpen,
    showDeactivated,
    branchOptions,
  } = useSelector((state: RootState) => state.vehicles);

  // ── Local state ────────────────────────────────────────────────────────────
  const [searchValue,                setSearchValue               ] = useState('');
  const [confirmationDialogOpen,     setConfirmationDialogOpen    ] = useState(false);
  const [editConfirmationDialogOpen, setEditConfirmationDialogOpen] = useState(false);
  const [selectedVehicle,            setSelectedVehicle           ] = useState<Vehicle | null>(null);
  const [actionType,                 setActionType                ] = useState<ActionType>(null);
  const [closeConfirmationDialogOpen,setCloseConfirmationDialogOpen] = useState(false);
  const [unsavedChanges,             setUnsavedChanges            ] = useState(false);
  const [isSubmitting,               setIsSubmitting              ] = useState(false);
  const [validationErrors,           setValidationErrors          ] = useState<VehicleValidationErrors>(INITIAL_VALIDATION);

  // ── Debounced search ───────────────────────────────────────────────────────

  const debouncedFetch = useMemo(
    () =>
      debounce((value: string) => {
        dispatch(fetchVehicle({ search: value, page: 1 }));
      }, 600),
    [dispatch],
  );

  useEffect(() => {
    dispatch(fetchBranches());
  }, [dispatch]);

  useEffect(() => {
    debouncedFetch(searchValue);
    return () => { debouncedFetch.clear(); };
  }, [searchValue, debouncedFetch]);

  // ── Dialog helpers ─────────────────────────────────────────────────────────

  const resetDialog = useCallback(() => {
    dispatch(setDialogOpen('none'));
    dispatch(setVehicleData(INITIAL_VEHICLE));
    setValidationErrors(INITIAL_VALIDATION);
    setUnsavedChanges(false);
  }, [dispatch]);

  const handleOpen = useCallback(() => {
    dispatch(setVehicleData(INITIAL_VEHICLE));
    setValidationErrors(INITIAL_VALIDATION);
    dispatch(setDialogOpen('add'));
  }, [dispatch]);

  const handleClose = useCallback(() => {
    if (unsavedChanges) {
      setCloseConfirmationDialogOpen(true);
    } else {
      resetDialog();
    }
  }, [unsavedChanges, resetDialog]);

  const handleConfirmClose = useCallback(() => {
    resetDialog();
    setCloseConfirmationDialogOpen(false);
  }, [resetDialog]);

  const handleCancelClose = useCallback(
    () => setCloseConfirmationDialogOpen(false),
    [],
  );

  const handleEditConfirmationClose = useCallback(
    () => setEditConfirmationDialogOpen(false),
    [],
  );

  // ── Field change handlers ──────────────────────────────────────────────────

  const handleTextChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const { name, value } = e.target;
      dispatch(setVehicleData({ ...vehicleData, [name]: value }));
      setValidationErrors((prev) => ({ ...prev, [name]: '' }));
      setUnsavedChanges(true);
    },
    [dispatch, vehicleData],
  );

  const handleSelectChange = useCallback(
    (e: SelectChangeEvent<string | string[]>) => {
      const { name, value } = e.target;
      dispatch(setVehicleData({ ...vehicleData, [name]: value as string }));
      setValidationErrors((prev) => ({ ...prev, [name]: '' }));
      setUnsavedChanges(true);
    },
    [dispatch, vehicleData],
  );

  // ── Validation ─────────────────────────────────────────────────────────────

  const validateFields = useCallback((): boolean => {
    const errors: VehicleValidationErrors = { ...INITIAL_VALIDATION };
    let isValid = true;

    // Vehicle Name
    const nameMaxErr = validateMaxLength(vehicleData.vehicleName, 'Vehicle Name', 30);
    if (nameMaxErr) {
      errors.vehicleName = nameMaxErr;
      isValid = false;
    } else {
      const nameLetterErr = validateLettersOnly(vehicleData.vehicleName, 'Vehicle Name');
      if (nameLetterErr) { errors.vehicleName = nameLetterErr; isValid = false; }
    }

    // Vehicle Model
    const modelMaxErr = validateMaxLength(vehicleData.vehicleModel, 'Vehicle Model', 30);
    if (modelMaxErr) {
      errors.vehicleModel = modelMaxErr;
      isValid = false;
    } else {
      const modelLetterErr = validateLettersOnly(vehicleData.vehicleModel, 'Vehicle Model');
      if (modelLetterErr) { errors.vehicleModel = modelLetterErr; isValid = false; }
    }

    // Vehicle Number
    const rawNo = vehicleData.vehicleNo.trim();
    if (!rawNo) {
      errors.vehicleNo = 'Vehicle number is required';
      isValid = false;
    } else if (!VEHICLE_NO_ALPHANUM_RE.test(rawNo)) {
      errors.vehicleNo = 'Vehicle number can only contain capital letters and numbers';
      isValid = false;
    } else if (!VEHICLE_NO_FORMAT_RE.test(rawNo)) {
      errors.vehicleNo =
        'Invalid format. Expected: TN65AQ1233 (2 letters + 2 digits + 1-2 letters + 4 digits)';
      isValid = false;
    }

    // Branch Name
    if (!vehicleData.branchName?.trim()) {
      errors.branchName = 'Branch must be selected';
      isValid = false;
    }

    setValidationErrors(errors);
    return isValid;
  }, [vehicleData]);

  const checkDuplicateVehicleNo = useCallback((): boolean => {
    const normalized = normalizeVehicleNo(vehicleData.vehicleNo);
    return vehicles.some(
      (item) =>
        normalizeVehicleNo(item.vehicleNo) === normalized && item.id !== vehicleData.id,
    );
  }, [vehicles, vehicleData.vehicleNo, vehicleData.id]);

  // ── Submit / Edit ──────────────────────────────────────────────────────────

  const handleSubmit = useCallback(async () => {
    if (!validateFields()) return;

    if (checkDuplicateVehicleNo()) {
      setValidationErrors((prev) => ({
        ...prev,
        vehicleNo: 'Vehicle with this number already exists',
      }));
      return;
    }

    if (vehicleData.id) {
      setEditConfirmationDialogOpen(true);
    } else {
      try {
        setIsSubmitting(true);
        await dispatch(addVehicle(vehicleData)).unwrap();
        dispatch(setSnackbarMessage('Vehicle added successfully!'));
        dispatch(setSnackbarOpen(true));
        resetDialog();
        dispatch(fetchVehicle({ search: '', page: 1 }));
      } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : 'Vehicle Number Is Already There!';
        dispatch(setSnackbarMessage(msg));
        dispatch(setSnackbarOpen(true));
      } finally {
        setIsSubmitting(false);
      }
    }
  }, [validateFields, checkDuplicateVehicleNo, vehicleData, dispatch, resetDialog]);

  const handleEditConfirmation = useCallback(async () => {
    try {
      setIsSubmitting(true);
      await dispatch(updateVehicle(vehicleData)).unwrap();
      dispatch(setSnackbarMessage('Vehicle updated successfully!'));
      dispatch(setSnackbarOpen(true));
      dispatch(fetchVehicle({ search: '', page: 1 }));
      resetDialog();
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Vehicle Number Is Already There!';
      dispatch(setSnackbarMessage(msg));
      dispatch(setSnackbarOpen(true));
    } finally {
      setIsSubmitting(false);
      setEditConfirmationDialogOpen(false);
    }
  }, [dispatch, vehicleData, resetDialog]);

  // ── Activate / Deactivate ──────────────────────────────────────────────────

  const handleEdit = useCallback(
    (vehicle: Vehicle) => {
      dispatch(setVehicleData(vehicle));
      dispatch(setDialogOpen('edit'));
      setUnsavedChanges(false);
    },
    [dispatch],
  );

  const handleDeactivate = useCallback((vehicle: Vehicle) => {
    setSelectedVehicle(vehicle);
    setActionType('deactivate');
    setConfirmationDialogOpen(true);
  }, []);

  const handleActivate = useCallback((vehicle: Vehicle) => {
    setSelectedVehicle(vehicle);
    setActionType('activate');
    setConfirmationDialogOpen(true);
  }, []);

  const handleConfirmationDialogClose = useCallback(() => {
    setConfirmationDialogOpen(false);
    setSelectedVehicle(null);
    setActionType(null);
  }, []);

  const handleConfirmationDialogConfirm = useCallback(async () => {
    if (selectedVehicle && actionType) {
      try {
        if (actionType === 'deactivate') {
          await dispatch(deactivateVehicle(selectedVehicle.id)).unwrap();
        } else {
          await dispatch(activateVehicle(selectedVehicle.id)).unwrap();
        }
        const label = actionType === 'deactivate' ? 'deactivated' : 'activated';
        dispatch(setSnackbarMessage(`Vehicle ${label} successfully!`));
        dispatch(setSnackbarOpen(true));
        dispatch(fetchVehicle({ search: '', page: 1 }));
      } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : 'An error occurred';
        dispatch(setSnackbarMessage(msg));
        dispatch(setSnackbarOpen(true));
      }
    }
    handleConfirmationDialogClose();
  }, [selectedVehicle, actionType, dispatch, handleConfirmationDialogClose]);

  // ── Stable prop callbacks for child components ─────────────────────────────

  const handleSetShowDeactivated = useCallback(
    (value: boolean) => dispatch(setShowDeactivated(value)),
    [dispatch],
  );

  const handleCloseSnackbar = useCallback(
    () => dispatch(setSnackbarOpen(false)),
    [dispatch],
  );

  // Safe dialog mode — never passes an invalid string to VehicleDialog
  const dialogMode = dialogOpen === 'edit' ? 'edit' : 'add';

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <>
      <MenuPage />

      <VehicleTableContainer
        handleEdit={handleEdit}
        handleDeactivate={handleDeactivate}
        handleActivate={handleActivate}
        handleOpen={handleOpen}
        showDeactivated={showDeactivated}
        setShowDeactivated={handleSetShowDeactivated}
        searchValue={searchValue}
        setSearchValue={setSearchValue}
      />

      <VehicleDialog
        open={dialogOpen !== 'none'}
        onClose={handleClose}
        onSubmit={handleSubmit}
        vehicleData={vehicleData}
        onTextFieldChange={handleTextChange}
        onSelectChange={handleSelectChange}
        validationErrors={validationErrors}
        mode={dialogMode}
        loading={isSubmitting}
        branchOptions={branchOptions}
      />

      <ActivateDeactivateConfirmationDialog
        open={confirmationDialogOpen}
        actionType={actionType}
        itemName={selectedVehicle?.vehicleName}
        onClose={handleConfirmationDialogClose}
        onConfirm={handleConfirmationDialogConfirm}
      />

      <EditConfirmationDialog
        open={editConfirmationDialogOpen}
        onClose={handleEditConfirmationClose}
        onConfirm={handleEditConfirmation}
      />

      <CloseConfirmationDialog
        open={closeConfirmationDialogOpen}
        onClose={handleCancelClose}
        onConfirm={handleConfirmClose}
      />

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={handleCloseSnackbar}
        anchorOrigin={SNACKBAR_ANCHOR}
      >
        <Alert onClose={handleCloseSnackbar} severity="info" sx={ALERT_SX}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </>
  );
};

export default VehiclePage;