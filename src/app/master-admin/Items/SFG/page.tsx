





'use client';
import React, { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Snackbar, Alert, SelectChangeEvent, debounce } from '@mui/material';

import MasterAdminMenu from '../page';
import {
  activateSfg,
  addSfg,
  deactivateSfg,
  fetchSfg,
  updateSfg,
  setSfgData,
  setDialogOpen,
  setSnackbarMessage,
  setSnackbarOpen,
  resetSfgData,
  setShowDeactivated,
  fetchUoms
} from '../../Items/SFG/Features/sfgSlice';
import CloseConfirmationDialog from '../../../Components/Dialogs/CloseConfirmationDialog';
import EditConfirmationDialog from '../../../Components/Dialogs/EditConfirmationDialog';
import ActivateDeactivateConfirmationDialog from "../../../Components/Dialogs/ActivateDeactivateConfirmationDialog";
import SfgDialog from '../SFG/Modules/sfgDialog';
import SfgTableContainer from '../SFG/Modules/sfgTable';
import { AppDispatch, RootState } from '@/redux/store';

interface SFG {
  id: string;
  sfgName: string;
  price: number;
  uom: string;
  sfgCode: string;
  shelfLife: number;
  status: string;
  createdDate: Date | null;
  updatedDate: Date | null;
}

const SFGComponent: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const {
    items: sfgItems,
    sfgData,
    snackbarOpen,
    snackbarMessage,
    dialogOpen,
    showDeactivated,
    page
  } = useSelector((state: RootState) => state.sfg);

  const [searchValue, setSearchValue] = useState<string>('');
  const [confirmationDialogOpen, setConfirmationDialogOpen] = useState(false);
  const [editConfirmationDialogOpen, setEditConfirmationDialogOpen] = useState(false);
  const [selectedSfg, setSelectedSfg] = useState<SFG | null>(null);
  const [actionType, setActionType] = useState<'deactivate' | 'activate' | null>(null);
  const [closeConfirmationDialogOpen, setCloseConfirmationDialogOpen] = useState(false);
  const [unsavedChanges, setUnsavedChanges] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [validationErrors, setValidationErrors] = useState({
    sfgName: "",
    price: "",
    uom: "",
    shelfLife: ""
  });

  // useEffect(() => {
  //   dispatch(fetchSfg({ search: searchValue, page }));
  //   dispatch(fetchUoms());
  // }, [dispatch, showDeactivated]);

  const debouncedFetch = useMemo(
    () =>
      debounce((value: string) => {
        dispatch(fetchSfg({ search: value, page: 1 }));
        dispatch(fetchUoms());
      }, 600),
    [dispatch]
  );

  useEffect(() => {
    debouncedFetch(searchValue);

    return () => {
      debouncedFetch.clear();   // ✅ IMPORTANT
    };
  }, [searchValue, debouncedFetch]);

  const handleOpen = () => {
    dispatch(resetSfgData());
    setValidationErrors({
      sfgName: "",
      price: "",
      uom: "",
      shelfLife: ""
    });
    dispatch(setDialogOpen("add"));
  };

  const handleClose = () => {
    if (unsavedChanges) {
      setCloseConfirmationDialogOpen(true);
    } else {
      resetDialog();
    }
  };

  const resetDialog = () => {
    dispatch(setDialogOpen("none"));
    dispatch(resetSfgData());
    setValidationErrors({
      sfgName: "",
      price: "",
      uom: "",
      shelfLife: ""
    });
    setUnsavedChanges(false);
  };

  const handleConfirmClose = () => {
    resetDialog();
    setCloseConfirmationDialogOpen(false);
  };

  const handleCancelClose = () => {
    setCloseConfirmationDialogOpen(false);
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | SelectChangeEvent
  ) => {
    const { name, value } = e.target;

    dispatch(setSfgData({ ...sfgData, [name as string]: value }));
    setValidationErrors({ ...validationErrors, [name as string]: "" });
    setUnsavedChanges(true);
  };


  const validateFields = () => {
    const errors = {
      sfgName: "",
      price: "",
      uom: "",
      shelfLife: ""
    };
    let isValid = true;

    if (!sfgData.sfgName.trim()) {
      errors.sfgName = "SFG name is required";
      isValid = false;
    }

    if (!sfgData.price || sfgData.price <= 0) {
      errors.price = "Price must be greater than 0";
      isValid = false;
    }

    if (!sfgData.uom.trim()) {
      errors.uom = "Unit of Measure is required";
      isValid = false;
    }

    if (!sfgData.shelfLife || sfgData.shelfLife <= 0) {
      errors.shelfLife = "Shelf life must be greater than 0";
      isValid = false;
    }

    setValidationErrors(errors);
    return isValid;
  };

  const handleSubmit = async () => {
    if (!validateFields()) return;

    const isDuplicate = sfgItems.some(
      (item) =>
        item.sfgName.toLowerCase() === sfgData.sfgName.toLowerCase() &&
        item.id !== sfgData.id
    );

    if (isDuplicate) {
      dispatch(setSnackbarMessage('SFG with this name already exists.'));
      dispatch(setSnackbarOpen(true));
      return;
    }

    if (sfgData.id) {
      setEditConfirmationDialogOpen(true);
    } else {
      try {
        setIsSubmitting(true);
        await dispatch(addSfg(sfgData));
        dispatch(setSnackbarMessage('SFG created successfully!'));
        resetDialog();
        dispatch(fetchSfg({ search: searchValue, page }));
      } catch (error: unknown) {
        let errorMessage = 'An error occurred';
        if (error instanceof Error) {
          errorMessage = error.message;
        }
        dispatch(setSnackbarMessage(errorMessage));
        dispatch(setSnackbarOpen(true));
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const handleEditConfirmation = async () => {
    try {
      setIsSubmitting(true);
      await dispatch(updateSfg(sfgData));
      dispatch(setSnackbarMessage('SFG updated successfully!'));
      dispatch(fetchSfg({ search: searchValue, page }));
      resetDialog();
    } catch (error: unknown) {
      let errorMessage = 'An error occurred';
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      dispatch(setSnackbarMessage(errorMessage));
      dispatch(setSnackbarOpen(true));
    } finally {
      setIsSubmitting(false);
      setEditConfirmationDialogOpen(false);
    }
  };

  const handleEditConfirmationClose = () => {
    setEditConfirmationDialogOpen(false);
  };

  const handleEdit = (sfg: SFG) => {
    dispatch(setSfgData(sfg));
    dispatch(setDialogOpen("edit"));
    setUnsavedChanges(false);
  };

  const handleDeactivate = (sfg: SFG) => {
    setSelectedSfg(sfg);
    setActionType("deactivate");
    setConfirmationDialogOpen(true);
  };

  const handleActivate = (sfg: SFG) => {
    setSelectedSfg(sfg);
    setActionType("activate");
    setConfirmationDialogOpen(true);
  };

  const handleConfirmationDialogClose = () => {
    setConfirmationDialogOpen(false);
    setSelectedSfg(null);
    setActionType(null);
  };

  const handleConfirmationDialogConfirm = async () => {
    if (selectedSfg && actionType) {
      try {
        if (actionType === "deactivate") {
          await dispatch(deactivateSfg(selectedSfg.id));
        } else {
          await dispatch(activateSfg(selectedSfg.id));
        }
        dispatch(setSnackbarMessage(`SFG ${actionType === "deactivate" ? "deactivated" : "activated"}!`));
        dispatch(fetchSfg({ search: searchValue, page }));
      } catch (error: unknown) {
        let errorMessage = 'An error occurred';
        if (error instanceof Error) {
          errorMessage = error.message;
        }
        dispatch(setSnackbarMessage(errorMessage));
        dispatch(setSnackbarOpen(true));
      }
    }
    handleConfirmationDialogClose();
  };

  return (
    <>
      <MasterAdminMenu />

      <SfgTableContainer
        handleEdit={handleEdit}
        handleDeactivate={handleDeactivate}
        handleActivate={handleActivate}
        handleOpen={handleOpen}
        showDeactivated={showDeactivated}
        setShowDeactivated={(value: boolean) => dispatch(setShowDeactivated(value))}
        searchValue={searchValue}                  // ADD
        setSearchValue={setSearchValue}
      />

      <SfgDialog
        open={dialogOpen !== 'none'}
        handleClose={handleClose}
        handleSubmit={handleSubmit}
        sfgData={sfgData}
        handleChange={handleChange}
        validationErrors={validationErrors}
        mode={dialogOpen as 'add' | 'edit'}
        loading={isSubmitting}
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

export default SFGComponent;