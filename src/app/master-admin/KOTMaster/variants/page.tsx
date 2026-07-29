'use client';
import React, { useEffect, useState, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Snackbar, Alert } from '@mui/material';
import { AppDispatch, RootState } from '../../../../redux/store';
// import MasterAdminMenu from '../page';
import {
  activatevariant,
  addvariant,
  deactivatevariant,
  fetchvariants,
  updatevariant,
  resetvariantData,
  fetchItems,
  resetPagination,
  incrementPage,
} from '../../KOTMaster/variants/Features/variantsSlice';
import CloseConfirmationDialog from '../../../Components/Dialogs/CloseConfirmationDialog';
import EditConfirmationDialog from '../../../Components/Dialogs/EditConfirmationDialog';
import ActivateDeactivateConfirmationDialog from '../../../Components/Dialogs/ActivateDeactivateConfirmationDialog';
import VariantDialog from '../../KOTMaster/variants/Modules/variantsDialog';
import VariantTableContainer from '../../KOTMaster/variants/Modules/variantsTable';
import { debounce } from 'lodash';

interface Variant {
  id: string;
  variant: string;
  status: string;
  variantId: string;
  variantItems: string[];
}

const initialVariantState: Variant = {
  id: '',
  variant: '',
  status: 'active',
  variantId: '',
  variantItems: [],
};

const VariantComponent: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const {
    items: variants,
    product,
    currentPage,
    totalPages,
    isFetchingItems,
    hasMoreItems,
  } = useSelector((state: RootState) => state.variants);

  const [showDeactivated, setShowDeactivated] = useState(false);
  const [confirmationDialogOpen, setConfirmationDialogOpen] = useState(false);
  const [editConfirmationDialogOpen, setEditConfirmationDialogOpen] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState<Variant | null>(null);
  const [actionType, setActionType] = useState<'deactivate' | 'activate' | null>(null);
  const [closeConfirmationDialogOpen, setCloseConfirmationDialogOpen] = useState(false);
  const [unsavedChanges, setUnsavedChanges] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dialogOpen, setDialogOpen] = useState<'none' | 'add' | 'edit'>('none');
  const [variantData, setVariantData] = useState<Variant>(initialVariantState);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [selectedVarianceNames, setSelectedVarianceNames] = useState<string[]>([]);
  const [varianceSearchQuery, setVarianceSearchQuery] = useState('');

  const [validationErrors, setValidationErrors] = useState({
    variant: '',
    variantItems: '',
  });

  useEffect(() => {
    dispatch(fetchvariants());
    dispatch(fetchItems({ page: 1, limit: 50, search: "" }));
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
      debouncedSearch.cancel();
    };
  }, [debouncedSearch]);

  const handleOpen = () => {
    dispatch(resetvariantData());
    dispatch(resetPagination());
    dispatch(fetchItems({ page: 1, limit: 50, search: "" }));
    setVariantData(initialVariantState);
    setSelectedVarianceNames([]);
    setValidationErrors({ variant: '', variantItems: '' });
    setVarianceSearchQuery('');
    setDialogOpen('add');
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
    setDialogOpen('none');
    setVariantData(initialVariantState);
    setSelectedVarianceNames([]);
    setValidationErrors({ variant: '', variantItems: '' });
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
    setVariantData((prev) => ({ ...prev, [name]: value }));
    setValidationErrors((prev) => ({ ...prev, [name]: '' }));
    setUnsavedChanges(true);
  };

  const validateFields = () => {
    const errors = { variant: '', variantItems: '' };
    let isValid = true;

    if (!variantData.variant.trim()) {
      errors.variant = 'Variant name is required';
      isValid = false;
    }

    if (selectedVarianceNames.length === 0) {
      errors.variantItems = 'At least one variance must be selected';
      isValid = false;
    }

    setValidationErrors(errors);
    return isValid;
  };

  const handleSubmit = async () => {
    if (!validateFields()) return;

    const isDuplicate = variants.some(
      (item) =>
        item.variant.toLowerCase() === variantData.variant.toLowerCase() &&
        item.id !== variantData.id
    );

    if (isDuplicate) {
      setSnackbarMessage('Variant with this name already exists.');
      setSnackbarOpen(true);
      return;
    }

    if (variantData.id) {
      setEditConfirmationDialogOpen(true);
    } else {
      try {
        setIsSubmitting(true);
        await dispatch(
          addvariant({
            ...variantData,
            variantItems: selectedVarianceNames,
          })
        );
        setSnackbarMessage('Variant created successfully!');
        resetDialog();
        dispatch(fetchvariants());
      } 


      catch (error: unknown) {
              let errorMessage = 'An error occurred';
              if (error instanceof Error) {
                errorMessage = error.message;
              }
              setSnackbarMessage(errorMessage || 'An error occurred');
             setSnackbarOpen(true);
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const handleEditConfirmation = async () => {
    try {
      setIsSubmitting(true);
      await dispatch(
        updatevariant({
          id: variantData.id,
          variant: variantData.variant,
          variantItems: selectedVarianceNames,
          status: variantData.status,
          variantId: variantData.variantId,
        })
      );
      setSnackbarMessage('Variant updated successfully!');
      dispatch(fetchvariants());
      resetDialog();
    } 
      catch (error: unknown) {
              let errorMessage = 'An error occurred';
              if (error instanceof Error) {
                errorMessage = error.message;
              }
              setSnackbarMessage(errorMessage || 'An error occurred');
             setSnackbarOpen(true);
    } finally {
      setIsSubmitting(false);
      setEditConfirmationDialogOpen(false);
    }
  };

  const handleEditConfirmationClose = () => {
    setEditConfirmationDialogOpen(false);
  };

  const handleEdit = (variant: Variant) => {
    setVariantData(variant);
    setSelectedVarianceNames(variant.variantItems || []);
    setDialogOpen('edit');
    setUnsavedChanges(false);
    setVarianceSearchQuery('');
  };

  const handleDeactivate = (variant: Variant) => {
    setSelectedVariant(variant);
    setActionType('deactivate');
    setConfirmationDialogOpen(true);
  };

  const handleActivate = (variant: Variant) => {
    setSelectedVariant(variant);
    setActionType('activate');
    setConfirmationDialogOpen(true);
  };

  const handleConfirmationDialogClose = () => {
    setConfirmationDialogOpen(false);
    setSelectedVariant(null);
    setActionType(null);
  };

  const handleConfirmationDialogConfirm = async () => {
    if (selectedVariant && actionType) {
      try {
        if (actionType === 'deactivate') {
          await dispatch(deactivatevariant(selectedVariant.id));
        } else {
          await dispatch(activatevariant(selectedVariant.id));
        }
        setSnackbarMessage(
          `Variant ${actionType === 'deactivate' ? 'deactivated' : 'activated'} successfully!`
        );
        dispatch(fetchvariants());
      } 
       catch (error: unknown) {
              let errorMessage = 'An error occurred';
              if (error instanceof Error) {
                errorMessage = error.message;
              }
              setSnackbarMessage(errorMessage || 'An error occurred');
             setSnackbarOpen(true);
      }
      setSnackbarOpen(true);
    }
    handleConfirmationDialogClose();
  };

  const handleVarianceChange = (_event: React.SyntheticEvent, newValue: string[]) => {
    setSelectedVarianceNames(newValue);
    setValidationErrors((prev) => ({ ...prev, variantItems: '' }));
    setUnsavedChanges(true);
  };

  const handleLoadMoreVariances = () => {
    dispatch(incrementPage());
    dispatch(fetchItems({ page: currentPage + 1, limit: 50, search: varianceSearchQuery }));
  };

  const handleItemsFieldOpen = () => {
    dispatch(resetPagination());
    dispatch(fetchItems({ page: 1, limit: 50, search: varianceSearchQuery }));
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
      <VariantTableContainer
        handleEdit={handleEdit}
        handleDeactivate={handleDeactivate}
        handleActivate={handleActivate}
        handleOpen={handleOpen}
        showDeactivated={showDeactivated}
        setShowDeactivated={setShowDeactivated}
      />
      <VariantDialog
        open={dialogOpen !== 'none'}
        handleClose={handleClose}
        handleSubmit={handleSubmit}
        variantData={variantData}
        handleChange={handleChange}
        onVariancesChange={handleVarianceChange}
        validationErrors={validationErrors}
        product={product.map((item: any) => ({
          ...item,
          itemId: item.itemId ?? '',
          itemName: item.itemName ?? '',
        }))}
        mode={dialogOpen === 'edit' ? 'edit' : 'add'}
        isSubmitting={isSubmitting}
        hasMoreVariances={hasMoreItems}
        isFetchingVariances={isFetchingItems}
        onLoadMoreVariances={handleLoadMoreVariances}
        onSearchVariances={handleSearchVariances}
        onOpen={handleItemsFieldOpen}
        onClearSearch={handleClearSearch}
        selectedVarianceNames={selectedVarianceNames}
      />
      <ActivateDeactivateConfirmationDialog
        open={confirmationDialogOpen}
        actionType={actionType}
        itemName={selectedVariant?.variant}
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
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      >
        <Alert
          onClose={() => setSnackbarOpen(false)}
          severity="info"
          sx={{ width: '100%', backgroundColor: '#1976d2', color: 'white' }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </>
  );
};

export default VariantComponent;
