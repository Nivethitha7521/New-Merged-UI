


'use client';
import React, { useEffect, useState, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Snackbar, Alert } from '@mui/material';
import { AppDispatch, RootState } from '../../../../redux/store';
// import MasterAdminMenu from '../page';
import {
  activateaddOn,
  addaddOn,
  deactivateaddOn,
  fetchaddOns,
  updateaddOn,
  setAddOnData,
  setDialogOpen,
  setSnackbarMessage,
  setSnackbarOpen,
  resetAddOnData,
  fetchItems,
  resetPagination,
  incrementPage,
} from '../../KOTMaster/addOn/Features/addOnSlice';
import CloseConfirmationDialog from '../../../Components/Dialogs/CloseConfirmationDialog';
import EditConfirmationDialog from '../../../Components/Dialogs/EditConfirmationDialog';
import ActivateDeactivateConfirmationDialog from '../../../Components/Dialogs/ActivateDeactivateConfirmationDialog';
import AddOnDialog from "../addOn/Modules/addOnDialog";
import AddOnTableContainer from "../addOn/Modules/addOnTable";
import { debounce } from 'lodash';

interface AddOn {
  id: string;
  addOn: string;
  value: number;
  status: string;
  addOnId: string;
  addOnItems: string[];
}

const AddOnComponent: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const {
    items: addOns,
    addOnData,
    snackbarOpen,
    snackbarMessage,
    dialogOpen,
    product,
    currentPage,
    totalPages,
    isFetchingItems,
    hasMoreItems,
  } = useSelector((state: RootState) => state.addOn);

  const [showDeactivated, setShowDeactivated] = useState(false);
  const [confirmationDialogOpen, setConfirmationDialogOpen] = useState(false);
  const [editConfirmationDialogOpen, setEditConfirmationDialogOpen] = useState(false);
  const [selectedAddOn, setSelectedAddOn] = useState<AddOn | null>(null);
  const [actionType, setActionType] = useState<'deactivate' | 'activate' | null>(null);
  const [closeConfirmationDialogOpen, setCloseConfirmationDialogOpen] = useState(false);
  const [unsavedChanges, setUnsavedChanges] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [varianceSearchQuery, setVarianceSearchQuery] = useState('');

  const [validationErrors, setValidationErrors] = useState({
    addOn: '',
    value: '',
    addOnItems: '',
  });

  useEffect(() => {
    dispatch(fetchaddOns());
    dispatch(fetchItems({ page: 1, limit: 50, search: '' }));
  }, [dispatch]);

  const debouncedSearch = useMemo(
    () =>
      debounce((query: string) => {
        setVarianceSearchQuery(query);
        dispatch(resetPagination());
        dispatch(fetchItems({ page: 1, limit: 50, search: query }));
      }, 500),
    [dispatch]
  );

  useEffect(() => {
    return () => {
      debouncedSearch.cancel(); // Cleanup debounce on unmount
    };
  }, [debouncedSearch]);

  const handleOpen = () => {
    dispatch(resetAddOnData());
    dispatch(resetPagination());
    dispatch(fetchItems({ page: 1, limit: 50, search: '' }));
    setValidationErrors({ addOn: '', value: '', addOnItems: '' });
    setVarianceSearchQuery('');
    dispatch(setDialogOpen('add'));
    setUnsavedChanges(false);
  };

  const handleClose = (reason: 'backdropClick' | 'escapeKeyDown') => {
    if (unsavedChanges && reason !== 'escapeKeyDown') {
      setCloseConfirmationDialogOpen(true);
    } else {
      resetDialog();
    }
  };

  const resetDialog = () => {
    dispatch(setDialogOpen('none'));
    dispatch(resetAddOnData());
    setValidationErrors({ addOn: '', value: '', addOnItems: '' });
    setUnsavedChanges(false);
    setVarianceSearchQuery('');
  };

  const handleConfirmClose = () => {
    resetDialog();
    setCloseConfirmationDialogOpen(false);
  };

  const handleCancelClose = () => {
    setCloseConfirmationDialogOpen(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    // dispatch(setAddOnData({ ...addOnData, [name]: value }));
    dispatch(
      setAddOnData({
        ...addOnData,
        [name]: name === 'value' ? Number(value) : value, // stays number
      })
    );

    setValidationErrors({ ...validationErrors, [name]: '' });
    setUnsavedChanges(true);
  };

  const validateFields = () => {
    const errors = { addOn: '', value: '', addOnItems: '' };
    let isValid = true;

    // Validate AddOn name - only letters and spaces allowed
    if (!addOnData.addOn.trim()) {
      errors.addOn = 'AddOn name is required';
      isValid = false;
    } else if (!/^[a-zA-Z\s]+$/.test(addOnData.addOn.trim())) {
      errors.addOn = 'AddOn name should contain only letters and spaces';
      isValid = false;
    }

    // // Validate Value - only numbers allowed
    // if (!addOnData.value) {
    //   errors.value = 'Value is required';
    //   isValid = false;
    // } else if (!/^\d+$/.test(addOnData.value)) {
    //   errors.value = 'Value should contain only numbers';
    //   isValid = false;
    // }

    if (addOnData.value === null || isNaN(addOnData.value)) {
      errors.value = 'Value is required';
      isValid = false;
    } else if (addOnData.value < 0) {
      errors.value = 'Value must be a positive number';
      isValid = false;
    }


    if (addOnData.addOnItems.length === 0) {
      errors.addOnItems = 'At least one variance must be selected';
      isValid = false;
    }

    setValidationErrors(errors);
    return isValid;
  };

  const handleSubmit = async () => {
    if (!validateFields()) return;

    const isDuplicate = addOns.some(
      (item) =>
        item.addOn.toLowerCase() === addOnData.addOn.toLowerCase() &&
        item.id !== addOnData.id
    );

    if (isDuplicate) {
      dispatch(setSnackbarMessage('AddOn with this name already exists.'));
      dispatch(setSnackbarOpen(true));
      return;
    }

    if (addOnData.id) {
      setEditConfirmationDialogOpen(true);
    } else {
      try {
        setIsSubmitting(true);
        await dispatch(addaddOn(addOnData)).unwrap();
        dispatch(setSnackbarMessage('AddOn created successfully!'));
        resetDialog();
        dispatch(fetchaddOns());
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
      const updatedAddOn = {
        ...addOnData,
        addOnItems: [...addOnData.addOnItems],
      };
      await dispatch(updateaddOn(updatedAddOn)).unwrap();
      dispatch(setSnackbarMessage('AddOn updated successfully!'));
      dispatch(fetchaddOns());
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

  const handleEdit = (addOn: AddOn) => {
    dispatch(
      setAddOnData({
        ...addOn,
        value: addOn.value || 0,
      })
    );
    dispatch(setDialogOpen('edit'));
    setUnsavedChanges(false);
    setVarianceSearchQuery('');
  };


  const handleDeactivate = (addOn: AddOn) => {
    setSelectedAddOn(addOn);
    setActionType('deactivate');
    setConfirmationDialogOpen(true);
  };

  const handleActivate = (addOn: AddOn) => {
    setSelectedAddOn(addOn);
    setActionType('activate');
    setConfirmationDialogOpen(true);
  };

  const handleConfirmationDialogClose = () => {
    setConfirmationDialogOpen(false);
    setSelectedAddOn(null);
    setActionType(null);
  };

  const handleConfirmationDialogConfirm = async () => {
    if (selectedAddOn && actionType) {
      try {
        if (actionType === 'deactivate') {
          await dispatch(deactivateaddOn(selectedAddOn.id)).unwrap();
        } else {
          await dispatch(activateaddOn(selectedAddOn.id)).unwrap();
        }
        dispatch(
          setSnackbarMessage(
            `AddOn ${actionType === 'deactivate' ? 'deactivated' : 'activated'}!`
          )
        );
        dispatch(fetchaddOns());
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

  const handleVarianceChange = (_event: React.SyntheticEvent, newValue: string[]) => {
    dispatch(
      setAddOnData({
        ...addOnData,
        addOnItems: newValue,
      })
    );
    setValidationErrors({ ...validationErrors, addOnItems: '' });
    setUnsavedChanges(true);
  };

  const handleLoadMoreVariances = () => {
    dispatch(incrementPage());
    dispatch(fetchItems({ page: currentPage + 1, limit: 50, search: varianceSearchQuery }));
  };

  const handleItemsFieldOpen = () => {
    dispatch(resetPagination());
    dispatch(fetchItems({ page: 1, limit: 50, search: varianceSearchQuery }));
    setVarianceSearchQuery('');
  };

  const handleSearchVariances = (query: string) => {
    debouncedSearch(query);
  };

  const handleClearSearch = () => {
    setVarianceSearchQuery('');
    dispatch(resetPagination());
    dispatch(fetchItems({ page: 1, limit: 50, search: '' }));
  };

  return (
    <>
      {/* <MasterAdminMenu /> */}

      <AddOnTableContainer
        handleEdit={handleEdit}
        handleDeactivate={handleDeactivate}
        handleActivate={handleActivate}
        handleOpen={handleOpen}
        showDeactivated={showDeactivated}
        setShowDeactivated={setShowDeactivated}
      />
      <AddOnDialog
        open={dialogOpen !== 'none'}
        handleClose={handleClose}
        handleSubmit={handleSubmit}
        addOnData={addOnData}
        handleChange={handleChange}
        onVariancesChange={handleVarianceChange}
        validationErrors={validationErrors}
        product={product}
        mode={dialogOpen === 'edit' ? 'edit' : 'add'}
        isSubmitting={isSubmitting}
        hasMoreVariances={hasMoreItems}
        isFetchingVariances={isFetchingItems}
        onLoadMoreVariances={handleLoadMoreVariances}
        onSearchVariances={handleSearchVariances}
        onOpen={handleItemsFieldOpen}
        onClearSearch={handleClearSearch}
      />
      <ActivateDeactivateConfirmationDialog
        open={confirmationDialogOpen}
        actionType={actionType}
        itemName={selectedAddOn?.addOn}
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

export default AddOnComponent;