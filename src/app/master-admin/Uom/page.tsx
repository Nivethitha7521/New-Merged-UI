

'use client';

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box,
  IconButton,
  FormControlLabel,
  Switch,
  Snackbar,
  Alert,
  Typography,
  SelectChangeEvent,
} from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';

import YenbirthdaycakeappPage from '../page';
import ActivateDeactivateConfirmationDialog from '@/app/Components/Dialogs/ActivateDeactivateConfirmationDialog';
import EditConfirmationDialog from '@/app/Components/Dialogs/EditConfirmationDialog';
import CloseConfirmationDialog from '@/app/Components/Dialogs/CloseConfirmationDialog';
import UomDialog from '../Uom/Modules/UomDialog';
import UomTable from '../Uom/Modules/UomTable';

import {
  fetchUoms,
  fetchAllMeasures,
  addUom,
  updateUom,
  deactivateUom,
  activateUom,
  setUomData,
  setDialogOpen,
  setSnackbarOpen,
  setSnackbarMessage,
  setShowDeactivated,
  resetUomData,
} from '../Uom/Features/uomSlice';
import { AppDispatch, RootState } from '@/redux/store';
import {
  ValidationErrors,
  ActionType,
  buildDisplayFormat,
} from '../Uom/Modules/Uomtypes';

// ─── Constants ────────────────────────────────────────────────────────────────

const INITIAL_VALIDATION: ValidationErrors = {
  measurementType: '',
  uom: '',
  precision: '',
};

const SNACKBAR_ANCHOR = { vertical: 'bottom', horizontal: 'left' } as const;

const ALERT_SX = {
  width: '100%',
  backgroundColor: '#1976d2',
  color: 'white',
} as const;

const LABEL_SX = {
  fontFamily: "'Poppins', sans-serif",
  fontWeight: 750,
  margin: 0,
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  maxWidth: '100%',
} as const;

const SWITCH_LABEL_SX = {
  marginLeft: 1,
  marginRight: 1,
  '& .MuiFormControlLabel-label': {
    fontSize: '0.75rem',
    fontFamily: "'Poppins', sans-serif",
  },
} as const;

// ─── Component ────────────────────────────────────────────────────────────────

const Uom: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();

  const {
    items: activeUoms,
    deactivatedItems: deactivatedUoms,
    uomData,
    measurementTypes,
    dialogOpen,
    snackbarOpen,
    snackbarMessage,
    showDeactivated,
    loading,
  } = useSelector((state: RootState) => state.uoms);

  // Local UI state
  const [confirmationDialogOpen, setConfirmationDialogOpen] = useState(false);
  const [editConfirmationDialogOpen, setEditConfirmationDialogOpen] = useState(false);
  const [closeConfirmationDialogOpen, setCloseConfirmationDialogOpen] = useState(false);
  const [selectedid, setSelectedid] = useState<string | null>(null);
  const [actionType, setActionType] = useState<ActionType>(null);
  const [unsavedChanges, setUnsavedChanges] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>(INITIAL_VALIDATION);

  // Fetch on mount only
  useEffect(() => {
    dispatch(fetchUoms());
    dispatch(fetchAllMeasures());
  }, [dispatch]);

  // Memoised derived list — avoids recompute on unrelated renders
  const displayedUoms = useMemo(
    () => (showDeactivated ? deactivatedUoms : activeUoms),
    [showDeactivated, activeUoms, deactivatedUoms],
  );

  // Memoised combined list for duplicate-check — avoids concat on every submit
  const allUoms = useMemo(
    () => [...activeUoms, ...deactivatedUoms],
    [activeUoms, deactivatedUoms],
  );

  // ─── Dialog helpers ─────────────────────────────────────────────────────────

  const resetDialog = useCallback(() => {
    dispatch(setDialogOpen('none'));
    dispatch(resetUomData());
    setValidationErrors(INITIAL_VALIDATION);
    setUnsavedChanges(false);
  }, [dispatch]);

  const handleOpenAdd = useCallback(() => {
    dispatch(resetUomData());
    setValidationErrors(INITIAL_VALIDATION);
    dispatch(setDialogOpen('add'));
    setUnsavedChanges(false);
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

  // ─── Field change handlers ──────────────────────────────────────────────────

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const { name, value } = e.target;

      if (name === 'precision' && !/^[0-3]?$/.test(value)) return;

      dispatch(setUomData({ ...uomData, [name]: value || null }));
      setUnsavedChanges(true);
      setValidationErrors((prev) => ({ ...prev, [name]: '' }));
    },
    [dispatch, uomData],
  );

  const handleSelectChange = useCallback(
    (e: SelectChangeEvent<string>) => {
      dispatch(setUomData({ ...uomData, measurementType: e.target.value }));
      setUnsavedChanges(true);
      setValidationErrors((prev) => ({ ...prev, measurementType: '' }));
    },
    [dispatch, uomData],
  );

  // ─── Validation ─────────────────────────────────────────────────────────────

  const validateForm = useCallback((): boolean => {
    const errors: ValidationErrors = { measurementType: '', uom: '', precision: '' };
    let valid = true;

    if (!uomData.measurementType?.trim()) {
      errors.measurementType = 'Measurement Type is required';
      valid = false;
    }
    if (!uomData.uom?.trim()) {
      errors.uom = 'UOM is required';
      valid = false;
    }
    if (uomData.precision === undefined || uomData.precision === null) {
      errors.precision = 'Precision is required';
      valid = false;
    } else if (uomData.precision < 0) {
      errors.precision = 'Precision must be ≥ 0';
      valid = false;
    }

    setValidationErrors(errors);
    return valid;
  }, [uomData]);

  // ─── Submit ─────────────────────────────────────────────────────────────────

  /** Builds the full payload with precision as float + auto-generated displayFormat. */
  const buildPayload = useCallback(
    (data: typeof uomData) => {
      const precisionFloat = Number(data.precision);
      return {
        ...data,                                      // preserves createdAt, updatedAt, all fields
        precision: precisionFloat,
        displayFormat: buildDisplayFormat(precisionFloat),
      };
    },
    [],
  );

  const handleSubmit = useCallback(async () => {
    if (!validateForm()) return;

    const isDuplicate = allUoms.some(
      (item) =>
        item.uom?.toLowerCase() === uomData.uom?.toLowerCase() &&
        item.id !== uomData.id,
    );

    if (isDuplicate) {
      dispatch(setSnackbarMessage('UOM with this name already exists.'));
      dispatch(setSnackbarOpen(true));
      return;
    }

    const payload = buildPayload(uomData);

    if (uomData.id) {
      // Store the computed payload then show edit confirmation
      dispatch(setUomData(payload));
      setEditConfirmationDialogOpen(true);
    } else {
      setIsSubmitting(true);
      await dispatch(addUom(payload));
      dispatch(fetchUoms());
      resetDialog();
      setIsSubmitting(false);
    }
  }, [validateForm, allUoms, uomData, buildPayload, dispatch, resetDialog]);

  const handleEditConfirmation = useCallback(async () => {
    // uomData already holds the computed payload from handleSubmit
    const payload = buildPayload(uomData);
    setIsSubmitting(true);
    await dispatch(updateUom(payload));
    dispatch(fetchUoms());
    setEditConfirmationDialogOpen(false);
    resetDialog();
    setIsSubmitting(false);
  }, [buildPayload, uomData, dispatch, resetDialog]);

  // ─── Edit / Activate / Deactivate ───────────────────────────────────────────

  const handleEdit = useCallback(
    (id: string) => {
      const uom = allUoms.find((u) => u.id === id);
      if (!uom) return;
      dispatch(setUomData(uom));
      dispatch(setDialogOpen('edit'));
      setValidationErrors(INITIAL_VALIDATION);
      setUnsavedChanges(false);
    },
    [allUoms, dispatch],
  );

  const openActivationDialog = useCallback(
    (id: string, type: 'activate' | 'deactivate') => {
      setSelectedid(id);
      setActionType(type);
      setConfirmationDialogOpen(true);
    },
    [],
  );

  const handleDeactivate = useCallback(
    (id: string) => openActivationDialog(id, 'deactivate'),
    [openActivationDialog],
  );

  const handleActivate = useCallback(
    (id: string) => openActivationDialog(id, 'activate'),
    [openActivationDialog],
  );

  const handleConfirmationConfirm = useCallback(async () => {
    if (!selectedid || !actionType) return;

    if (actionType === 'deactivate') {
      await dispatch(deactivateUom(selectedid));
    } else {
      await dispatch(activateUom(selectedid));
    }
    dispatch(fetchUoms());
    setConfirmationDialogOpen(false);
    setSelectedid(null);
    setActionType(null);
  }, [selectedid, actionType, dispatch]);

  const handleConfirmationClose = useCallback(() => {
    setConfirmationDialogOpen(false);
    setSelectedid(null);
    setActionType(null);
  }, []);

  const handleToggleDeactivated = useCallback(
    () => dispatch(setShowDeactivated(!showDeactivated)),
    [dispatch, showDeactivated],
  );

  const handleCloseSnackbar = useCallback(
    () => dispatch(setSnackbarOpen(false)),
    [dispatch],
  );

  // ─── Derived display values ──────────────────────────────────────────────────

  const toggleLabel = showDeactivated ? 'Show Activated' : 'Show Deactivated';
  const tableTitle = showDeactivated ? 'Deactivated UOMs' : 'Active UOMs';

  // editid is properly derived from dialog state — not hardcoded to null
  const editid = dialogOpen === 'edit' ? uomData.id : null;

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <Box sx={{ position: 'relative', height: '100vh', overflow: 'hidden' }}>
      <YenbirthdaycakeappPage />

      {/* Toolbar */}
      <Box
        display="flex"
        flexDirection={{ xs: 'column', sm: 'row' }}
        alignItems={{ xs: 'flex-start', sm: 'center' }}
        justifyContent="space-between"
        gap={0}
        my={1}
        ml={1}
        px={{ xs: 2, sm: 3 }}
        sx={{ width: '99%', boxSizing: 'border-box', mt: 2 }}
      >
        <Typography className="icon-action-label" sx={LABEL_SX}>
          {tableTitle}
        </Typography>

        <div className="flex items-center gap-4">
          {!showDeactivated && (
            <div className="icon-action-wrapper">
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
            control={
              <Switch
                checked={showDeactivated}
                onChange={handleToggleDeactivated}
                color="primary"
                size="small"
              />
            }
            label={toggleLabel}
            sx={SWITCH_LABEL_SX}
          />
        </div>
      </Box>

      {/* Table */}
      <UomTable
        displayedUoms={displayedUoms}
        showDeactivated={showDeactivated}
        isSubmitting={isSubmitting}
        handleEdit={handleEdit}
        handleDeactivate={handleDeactivate}
        handleActivate={handleActivate}
      />

      {/* Dialogs */}
      <UomDialog
        open={dialogOpen !== 'none'}
        onClose={handleClose}
        uomData={uomData}
        editid={editid}
        measurementTypes={measurementTypes}
        validationErrors={validationErrors}
        handleTextFieldChange={handleChange}
        handleSelectChange={handleSelectChange}
        handleAddOrUpdate={handleSubmit}
        isSubmitting={loading || isSubmitting}
      />

      <ActivateDeactivateConfirmationDialog
        open={confirmationDialogOpen}
        actionType={actionType}
        onClose={handleConfirmationClose}
        onConfirm={handleConfirmationConfirm}
      />

      <EditConfirmationDialog
        open={editConfirmationDialogOpen}
        onClose={() => setEditConfirmationDialogOpen(false)}
        onConfirm={handleEditConfirmation}
      />

      <CloseConfirmationDialog
        open={closeConfirmationDialogOpen}
        onClose={handleCancelClose}
        onConfirm={handleConfirmClose}
      />

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={4000}
        onClose={handleCloseSnackbar}
        anchorOrigin={SNACKBAR_ANCHOR}
      >
        <Alert onClose={handleCloseSnackbar} severity="info" sx={ALERT_SX}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Uom;