
'use client';
import React, { useEffect, useState, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box,
  CircularProgress,
  Alert,
  Snackbar,
} from '@mui/material';
import { OpeningCashDialog } from '../OpeningCash/Modules/OpeningCashDialog';
import { OpeningCashTable } from '../OpeningCash/Modules/OpeningCashTableComponent';
import CashManagementPage from '../page';
import {
  RootState,
  AppDispatch,
} from '../../../../redux/store';
import {
  addOpeningCash,
  fetchOpeningCashs,
  updateOpeningCash,
  deactivateOpeningCash,
  activateOpeningCash,
  setOpeningCashData,
  setDialogOpen,
  setSnackbarMessage,
  setSnackbarOpen,
  setShowDeactivated,
  resetOpeningCashData,
  fetchBranches,
  selectAllBranches,
  applyAllOpeningCash,
} from '../OpeningCash/Feature/openingCashSlice';
import { OpeningCash } from "../OpeningCash/Models/openingcashModels";
import CloseConfirmationDialog from '../../../Components/Dialogs/CloseConfirmationDialog';
import EditConfirmationDialog from '../../../Components/Dialogs/EditConfirmationDialog';
import ActivateDeactivateConfirmationDialog from "../../../Components/Dialogs/ActivateDeactivateConfirmationDialog";
import { AxiosError } from 'axios';

const OpeningCashPage: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const {
    items: openingCashs,
    deactivatedItems,
    loading,
    error,
    openingCashData,
    snackbarOpen,
    snackbarMessage,
    dialogOpen,
    showDeactivated,
    allBranches,
  } = useSelector((state: RootState) => ({
    ...state.OpeningCash,
    allBranches: selectAllBranches(state),
  }));

  const [confirmationDialogOpen, setConfirmationDialogOpen] = useState(false);
  const [editConfirmationDialogOpen, setEditConfirmationDialogOpen] = useState(false);
  const [selectedOpeningCash, setSelectedOpeningCash] = useState<OpeningCash | null>(null);
  const [actionType, setActionType] = useState<"deactivate" | "activate" | null>(null);
  const [closeConfirmationDialogOpen, setCloseConfirmationDialogOpen] = useState(false);
  const [applyingAll, setApplyingAll] = useState(false);
  const [unsavedChanges, setUnsavedChanges] = useState(false);
  const [validationErrors, setValidationErrors] = useState({
    systemOpenCash: "",
    branchName: "",
  });

  useEffect(() => {
    dispatch(fetchOpeningCashs());
    dispatch(fetchBranches());
  }, [dispatch]);


  const tableRows = useMemo(() => {
    const activeMap = new Map(openingCashs.map(c => [c.branches, c]));

    return allBranches.map(branchName => {
      const existing = activeMap.get(branchName);
      if (existing) return existing;

      return {
        systemOpenCashId: '',
        systemOpenCash: '0',
        branches: branchName,
        status: 'active' as const,
        createdDate: null,
        updatedDate: null,
      } satisfies OpeningCash;
    });
  }, [allBranches, openingCashs]);


  const handleClose = () => {
    if (unsavedChanges) {
      setCloseConfirmationDialogOpen(true);
    } else {
      resetDialog();
    }
  };

  const resetDialog = () => {
    dispatch(setDialogOpen("none"));
    dispatch(resetOpeningCashData());
    setValidationErrors({ systemOpenCash: "", branchName: "" });
    setUnsavedChanges(false);
  };

  const handleConfirmClose = () => {
    resetDialog();
    setCloseConfirmationDialogOpen(false);
  };

  const handleCancelClose = () => {
    setCloseConfirmationDialogOpen(false);
  };



  const handleApplyAll = async (value: string) => {
  if (!/^\d*\.?\d*$/.test(value)) {
    dispatch(setSnackbarMessage('Invalid number'));
    dispatch(setSnackbarOpen(true));
    return;
  }

  setApplyingAll(true);
  try {
    await dispatch(applyAllOpeningCash(value)).unwrap();
    dispatch(setSnackbarMessage(`Applied ${value} to all branches instantly!`));
    dispatch(setSnackbarOpen(true));
    dispatch(fetchOpeningCashs());
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
  if (name === "systemOpenCash") {
    // Allow only digits and max 4 length
    if (!/^\d{0,4}$/.test(value)) {
      return; // block invalid input
    }
  }

  dispatch(setOpeningCashData({ ...openingCashData, [name]: updatedValue }));
  setValidationErrors({ ...validationErrors, [name]: "" });
  setUnsavedChanges(true);
};



  const validateFields = () => {
    const errors = { systemOpenCash: "", branchName: "" };
    if (!openingCashData.systemOpenCash.trim()) {
      errors.systemOpenCash = "Opening Cash amount is required";
    } else if (!/^\d*\.?\d+$/.test(openingCashData.systemOpenCash.trim())) {
      errors.systemOpenCash = "Only numbers are allowed";
    }
    setValidationErrors(errors);
    return Object.values(errors).every(err => err === "");
  };

  const handleSubmit = async () => {
    if (!validateFields()) return;

    const isDuplicate = openingCashs.some(
      (cash) =>
        cash.branches.toLowerCase() === openingCashData.branches.toLowerCase() &&
        cash.systemOpenCashId !== openingCashData.systemOpenCashId
    );
    if (isDuplicate) {
      dispatch(setSnackbarMessage('Opening Cash for this branch already exists.'));
      dispatch(setSnackbarOpen(true));
      return;
    }

    if (openingCashData.systemOpenCashId) {
      setEditConfirmationDialogOpen(true);
    } else {
      try {
        await dispatch(addOpeningCash(openingCashData));
        dispatch(setSnackbarMessage('Opening Cash added successfully!'));
        resetDialog();
        dispatch(fetchOpeningCashs());
      } catch (error) {
        const err = error as AxiosError;
        dispatch(setSnackbarMessage(err.message || 'An error occurred'));
        dispatch(setSnackbarOpen(true));
      }
    }
  };

  const handleEditConfirmation = async () => {
    if (!validateFields()) return;
    try {
     // await dispatch(addOpeningCash(openingCashData));
      await dispatch(updateOpeningCash(openingCashData));
      dispatch(setSnackbarMessage('Opening Cash updated successfully!'));
      dispatch(fetchOpeningCashs());
    } catch (error) {
      const err = error as AxiosError;
      dispatch(setSnackbarMessage(err.message || 'An error occurred'));
      dispatch(setSnackbarOpen(true));
    }
    setEditConfirmationDialogOpen(false);
    resetDialog();
  };

  const handleEditConfirmationClose = () => {
    setEditConfirmationDialogOpen(false);
  };

  const handleEdit = (openingCash: OpeningCash) => {
    dispatch(setOpeningCashData(openingCash));
    dispatch(setDialogOpen(openingCash.systemOpenCashId ? "edit" : "add"));
    setUnsavedChanges(false);
  };

  const handleDeactivate = (openingCash: OpeningCash) => {
    setSelectedOpeningCash(openingCash);
    setActionType("deactivate");
    setConfirmationDialogOpen(true);
  };

  const handleActivate = (openingCash: OpeningCash) => {
    setSelectedOpeningCash(openingCash);
    setActionType("activate");
    setConfirmationDialogOpen(true);
  };

  const handleConfirmationDialogClose = () => {
    setConfirmationDialogOpen(false);
    setSelectedOpeningCash(null);
    setActionType(null);
  };

  const handleConfirmationDialogConfirm = async () => {
    if (selectedOpeningCash && actionType) {
      try {
        if (actionType === "deactivate") {
          await dispatch(deactivateOpeningCash(selectedOpeningCash.systemOpenCashId));
        } else {
          await dispatch(activateOpeningCash(selectedOpeningCash.systemOpenCashId));
        }
        dispatch(setSnackbarMessage(`Opening Cash ${actionType}d!`));
        dispatch(fetchOpeningCashs());
        dispatch(setSnackbarOpen(true));
      } catch (error) {
        const err = error as AxiosError;
        dispatch(setSnackbarMessage(err.message || 'An error occurred'));
        dispatch(setSnackbarOpen(true));
      }
    }
    handleConfirmationDialogClose();
  };

  const toggleShowDeactivated = () => {
    dispatch(setShowDeactivated(!showDeactivated));
  };

  const handleDialogClose = (_event: React.SyntheticEvent, reason: "backdropClick" | "escapeKeyDown") => {
    if (reason === "backdropClick" && unsavedChanges) {
      setCloseConfirmationDialogOpen(true);
    } else {
      handleClose();
    }
  };

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
            {showDeactivated ? 'Deactivated OpeningCash' : 'OpeningCash'}
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
        <OpeningCashTable
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

      <OpeningCashDialog
        open={dialogOpen !== "none"}
        onClose={handleDialogClose}
        onSubmit={handleSubmit}
        onChange={handleChange}
        openingCashData={openingCashData}
        validationErrors={validationErrors}
        loading={loading}
        isEditMode={!!openingCashData.systemOpenCashId}
        unsavedChanges={unsavedChanges}
        handleClose={handleClose}
      />

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

export default OpeningCashPage;