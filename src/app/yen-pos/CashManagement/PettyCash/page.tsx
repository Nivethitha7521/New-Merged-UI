

'use client';
import React, { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box,
  FormControlLabel,
  Switch,
  CircularProgress,
  Alert,
  Snackbar,
  Grid,
  Typography,
} from '@mui/material';
import { RootState, AppDispatch } from '../../../../redux/store';
import {
  addPettyCash,
  fetchPettyCashs,
  updatePettyCash,
  deactivatePettyCash,
  activatePettyCash,
  setPettyCashData,
  setDialogOpen,
  setSnackbarMessage,
  setSnackbarOpen,
  setShowDeactivated,
  resetPettyCashData,
  fetchBranches,
  selectAllBranches,
  applyAllPettyCash,
} from './Feature/PettyCashSlice';               // adjust path
import { PettyCash } from '../PettyCash/Models/pettycashModels';   // adjust path

import { PettyCashDialog } from '../PettyCash/Modules/PettyCashDialog';   // <-- new
import { PettyCashTable } from '../PettyCash/Modules/PettyCashTableContainer';     // <-- new

import CashManagementPage from '../page';
import CloseConfirmationDialog from '../../../Components/Dialogs/CloseConfirmationDialog';
import EditConfirmationDialog from '../../../Components/Dialogs/EditConfirmationDialog';
import ActivateDeactivateConfirmationDialog from '../../../Components/Dialogs/ActivateDeactivateConfirmationDialog';
import { AxiosError } from 'axios';

const PettyCashPage: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const {
    items: pettyCashs,
    deactivatedItems,
    loading,
    error,
    pettyCashData,
    snackbarOpen,
    snackbarMessage,
    dialogOpen,
    showDeactivated,
    allBranches,
  } = useSelector((state: RootState) => state.PettyCash);

  // ---------- local UI state ----------
  const [confirmationDialogOpen, setConfirmationDialogOpen] = useState(false);
  const [editConfirmationDialogOpen, setEditConfirmationDialogOpen] = useState(false);
  const [selectedPettyCash, setSelectedPettyCash] = useState<PettyCash | null>(null);
  const [actionType, setActionType] = useState<'deactivate' | 'activate' | null>(null);
  const [closeConfirmationDialogOpen, setCloseConfirmationDialogOpen] = useState(false);
  const [unsavedChanges, setUnsavedChanges] = useState(false);
  const [applyingAll, setApplyingAll] = useState(false);
  const [validationErrors, setValidationErrors] = useState({
    pettyCash: '',
    branches: '',
  });

  // ---------- fetch ----------
  useEffect(() => {
    dispatch(fetchPettyCashs());
    dispatch(fetchBranches());
  }, [dispatch]);


  const tableRows = useMemo(() => {
    const activeMap = new Map(pettyCashs.map(c => [c.branches, c]));

    return allBranches.map(branchName => {
      const existing = activeMap.get(branchName);
      if (existing) return existing;

      return {
        pettyCashId: '',
        pettyCash: '0',
        branches: branchName,
        status: 'active' as const,
        createdDate: null,
        updatedDate: null,
      } satisfies PettyCash;
    });
  }, [allBranches, pettyCashs]);


  // ---------- dialog helpers ----------
  const handleClose = () => {
    if (unsavedChanges) {
      setCloseConfirmationDialogOpen(true);
    } else {
      resetDialog();
    }
  };

  const resetDialog = () => {
    dispatch(setDialogOpen('none'));
    dispatch(resetPettyCashData());
    setValidationErrors({ pettyCash: '', branches: '' });
    setUnsavedChanges(false);
  };

  const handleConfirmClose = () => {
    resetDialog();
    setCloseConfirmationDialogOpen(false);
  };

  const handleCancelClose = () => setCloseConfirmationDialogOpen(false);


  const handleApplyAll = async (value: string) => {
    if (!/^\d*\.?\d*$/.test(value)) {
      dispatch(setSnackbarMessage('Invalid number'));
      dispatch(setSnackbarOpen(true));
      return;
    }

    setApplyingAll(true);
    try {
      await dispatch(applyAllPettyCash(value)).unwrap();
      dispatch(setSnackbarMessage(`Applied ${value} to all branches instantly!`));
      dispatch(setSnackbarOpen(true));
      dispatch(fetchPettyCashs());
    } catch {
      dispatch(setSnackbarMessage('Failed to apply to all branches'));
      dispatch(setSnackbarOpen(true));
    } finally {
      setApplyingAll(false);
    }
  };


    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
  
    let updatedValue = value;
  
    // Apply validation only for Opening Cash field
    if (name === "pettyCash") {
      // Allow only digits and max 4 length
      if (!/^\d{0,4}$/.test(value)) {
        return; // block invalid input
      }
    }
  
    dispatch(setPettyCashData({ ...pettyCashData, [name]: updatedValue }));
    setValidationErrors({ ...validationErrors, [name]: "" });
    setUnsavedChanges(true);
  };

  const validateFields = () => {
    const errors = { pettyCash: '', branches: '' };
    const amount = pettyCashData.pettyCash.trim();

    if (!amount) {
      errors.pettyCash = 'Petty Cash amount is required';
    } else if (!/^\d*\.?\d+$/.test(amount)) {
      errors.pettyCash = 'Only numbers are allowed';
    }

    setValidationErrors(errors);
    return Object.values(errors).every((e) => e === '');
  };

  const handleSubmit = async () => {
    if (!validateFields()) return;

    // duplicate check (branch must be unique)
    const isDuplicate = pettyCashs.some(
      (c) =>
        c.branches.toLowerCase() === pettyCashData.branches.toLowerCase() &&
        c.pettyCashId !== pettyCashData.pettyCashId
    );

    if (isDuplicate) {
      dispatch(setSnackbarMessage('Petty Cash for this branch already exists.'));
      dispatch(setSnackbarOpen(true));
      return;
    }

    if (pettyCashData.pettyCashId) {
      setEditConfirmationDialogOpen(true);
    } else {
      try {
        await dispatch(addPettyCash(pettyCashData));
        dispatch(setSnackbarMessage('Petty Cash added successfully!'));
        resetDialog();
        dispatch(fetchPettyCashs());
      } catch (err) {
        const e = err as AxiosError;
        dispatch(setSnackbarMessage(e.message || 'An error occurred'));
        dispatch(setSnackbarOpen(true));
      }
    }
  };

  const handleEditConfirmation = async () => {
    if (!validateFields()) return;
    try {
      await dispatch(updatePettyCash(pettyCashData));
      dispatch(setSnackbarMessage('Petty Cash updated successfully!'));
      dispatch(fetchPettyCashs());
    } catch (err) {
      const e = err as AxiosError;
      dispatch(setSnackbarMessage(e.message || 'An error occurred'));
      dispatch(setSnackbarOpen(true));
    }
    setEditConfirmationDialogOpen(false);
    resetDialog();
  };

  const handleEditConfirmationClose = () => setEditConfirmationDialogOpen(false);

  // ---------- table actions ----------
  const handleEdit = (cash: PettyCash) => {
    dispatch(setPettyCashData(cash));
    dispatch(setDialogOpen(cash.pettyCashId ? "edit" : "add"));
    setUnsavedChanges(false);
  };

  const handleDeactivate = (cash: PettyCash) => {
    setSelectedPettyCash(cash);
    setActionType('deactivate');
    setConfirmationDialogOpen(true);
  };

  const handleActivate = (cash: PettyCash) => {
    setSelectedPettyCash(cash);
    setActionType('activate');
    setConfirmationDialogOpen(true);
  };

  const handleConfirmationDialogClose = () => {
    setConfirmationDialogOpen(false);
    setSelectedPettyCash(null);
    setActionType(null);
  };

  const handleConfirmationDialogConfirm = async () => {
    if (!selectedPettyCash || !actionType) return;

    try {
      if (actionType === 'deactivate') {
        await dispatch(deactivatePettyCash(selectedPettyCash.pettyCashId));
      } else {
        await dispatch(activatePettyCash(selectedPettyCash.pettyCashId));
      }
      dispatch(
        setSnackbarMessage(
          `Petty Cash ${actionType === 'deactivate' ? 'deactivated' : 'activated'}!`
        )
      );
      dispatch(fetchPettyCashs());
      dispatch(setSnackbarOpen(true));
    } catch (err) {
      const e = err as AxiosError;
      dispatch(setSnackbarMessage(e.message || 'An error occurred'));
      dispatch(setSnackbarOpen(true));
    }
    handleConfirmationDialogClose();
  };

  const toggleShowDeactivated = () => dispatch(setShowDeactivated(!showDeactivated));

  const handleDialogClose = (
    _event: React.SyntheticEvent,
    reason: 'backdropClick' | 'escapeKeyDown'
  ) => {
    if (reason === 'backdropClick' && unsavedChanges) {
      setCloseConfirmationDialogOpen(true);
    } else {
      handleClose();
    }
  };

  // ---------- render ----------
  return (
    <>
      <CashManagementPage />

      {/* <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          margin: '20px',
          gap: '20px',
        }}
      >

        <Box>
          <h2
            style={{
              fontWeight: 'bold',
              margin: 15,
            }}
          >
            {showDeactivated ? 'Deactivated PettyCash' : 'Active PettyCash'}
          </h2>
        </Box>


        <FormControlLabel
          control={
            <Switch
              checked={showDeactivated}
              onChange={toggleShowDeactivated}
              color="primary"
            />
          }
          label="Show Deactivated"
        />
      </Box> */}


      {loading ? (
        <Box display="flex" justifyContent="center" alignItems="center" height="200px">
          <CircularProgress />
        </Box>
      ) : error ? (
        <Alert severity="error">{error}</Alert>
      ) : (
        <PettyCashTable
          data={showDeactivated ? deactivatedItems : tableRows}
          isDeactivatedView={showDeactivated}
          onEdit={handleEdit}
          onDeactivate={handleDeactivate}
          onActivate={handleActivate}
          onApplyAll={handleApplyAll}
          applyingAll={applyingAll}
          allBranches={allBranches}
        />
      )}

      {/* ----- Dialog ----- */}
      <PettyCashDialog
        open={dialogOpen !== 'none'}
        onClose={handleDialogClose}
        onSubmit={handleSubmit}
        onChange={handleChange}
        pettyCashData={pettyCashData}
        validationErrors={validationErrors}
        loading={loading}
        isEditMode={!!pettyCashData.pettyCashId}
        handleClose={handleClose}
      />

      {/* ----- Confirmation dialogs ----- */}
      <ActivateDeactivateConfirmationDialog
        open={confirmationDialogOpen}
        actionType={actionType}
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

      {/* ----- Snackbar ----- */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={() => dispatch(setSnackbarOpen(false))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      >
        <Alert
          onClose={() => dispatch(setSnackbarOpen(false))}
          severity="info"
          sx={{ width: '100%', backgroundColor: '#1976d2', color: 'white' }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </>
  );
};

export default PettyCashPage;