
'use client';
import React, { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Alert, Snackbar } from '@mui/material';
import { AppDispatch, RootState } from '../../../redux/store';
import MasterAdminMenu from '../page';
import {
  activateMixBox,
  addMixBox,
  deactivateMixBox,
  fetchItems,
  fetchMixBoxes,
  resetMixBoxData,
  resetPagination,
  setDialogOpen,
  setMixBoxData,
  setSearchQuery,
  setShowDeactivated,
  setSnackbarMessage,
  setSnackbarOpen,
  updateMixBox,
} from '../../master-admin/MixBox/Features/mixBoxSlice';
import { Item } from '../MixBox/Models/mixboxModels';
import CloseConfirmationDialog from '../../Components/Dialogs/CloseConfirmationDialog';
import EditConfirmationDialog from '../../Components/Dialogs/EditConfirmationDialog';
import ActivateDeactivateConfirmationDialog from '../../Components/Dialogs/ActivateDeactivateConfirmationDialog';
import MixBoxDialog from '../MixBox/Modules/MixBoxDialog';
import MixBoxTableContainer from '../MixBox/Modules/MixBoxTable';
import { debounce } from 'lodash';

// ─── Types ────────────────────────────────────────────────────────────────────

interface MixBox {
  id: string;
  mixboxName: string;
  totalGrams: string;
  items: Item[];
  status: string;
}

type ActionType = 'deactivate' | 'activate' | null;

interface ValidationErrors {
  mixboxName: string;
  items: string;
  totalGrams: string;
}

const INITIAL_VALIDATION_ERRORS: ValidationErrors = {
  mixboxName: '',
  items: '',
  totalGrams: '',
};

// ─── Component ────────────────────────────────────────────────────────────────

const MixBoxComponent: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();

  const {
    items: mixBoxes,
    mixBoxData,
    snackbarOpen,
    snackbarMessage,
    dialogOpen,
    showDeactivated,
    searchQuery,
    product,
    currentPage,
    totalPages,
    hasMoreItems,
    isFetchingItems,
  } = useSelector((state: RootState) => state.mixBox);

  // ── Local state ───────────────────────────────────────────────────────────

  const [confirmationDialogOpen, setConfirmationDialogOpen] = useState(false);
  const [editConfirmationDialogOpen, setEditConfirmationDialogOpen] = useState(false);
  const [closeConfirmationDialogOpen, setCloseConfirmationDialogOpen] = useState(false);

  const [selectedMixBox, setSelectedMixBox] = useState<MixBox | null>(null);
  const [actionType, setActionType] = useState<ActionType>(null);

  const [unsavedChanges, setUnsavedChanges] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [items, setItems] = useState<Item[]>([]);
  const [gramsError, setGramsError] = useState('');
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>(INITIAL_VALIDATION_ERRORS);
  const [varianceSearchQuery, setVarianceSearchQuery] = useState('');

  // ── Bootstrap ─────────────────────────────────────────────────────────────

  useEffect(() => {
    dispatch(fetchMixBoxes());
    dispatch(fetchItems({ page: 1, limit: 50, search: '' }));
  }, [dispatch]);

  // ── Debounced search ──────────────────────────────────────────────────────

  const debouncedSearch = useMemo(
    () =>
      debounce((query: string) => {
        const normalizedQuery = query.toLowerCase();
        dispatch(resetPagination());
        setVarianceSearchQuery(normalizedQuery);
        dispatch(fetchItems({ page: 1, limit: 50, search: normalizedQuery }));
      }, 500),
    [dispatch]
  );

  useEffect(() => () => debouncedSearch.cancel(), [debouncedSearch]);

  // ── Dialog helpers ────────────────────────────────────────────────────────

  const resetDialog = () => {
    dispatch(setDialogOpen('none'));
    dispatch(resetMixBoxData());
    setItems([]);
    setValidationErrors(INITIAL_VALIDATION_ERRORS);
    setGramsError('');
    setVarianceSearchQuery('');
    setUnsavedChanges(false);
  };

  const handleOpen = () => {
    dispatch(resetMixBoxData());
    setItems([]);
    setValidationErrors(INITIAL_VALIDATION_ERRORS);
    setGramsError('');
    setVarianceSearchQuery('');
    dispatch(setDialogOpen('add'));
    dispatch(resetPagination());
    setUnsavedChanges(false);
  };

  const handleClose = (reason: 'backdropClick' | 'escapeKeyDown') => {
    if (unsavedChanges && reason !== 'escapeKeyDown') {
      setCloseConfirmationDialogOpen(true);
    } else {
      resetDialog();
    }
  };

  const handleConfirmClose = () => {
    resetDialog();
    setCloseConfirmationDialogOpen(false);
  };

  const handleCancelClose = () => setCloseConfirmationDialogOpen(false);

  // ── Field change handlers ─────────────────────────────────────────────────

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    dispatch(setMixBoxData({ ...mixBoxData, [name]: value }));
    setValidationErrors((prev) => ({ ...prev, [name]: '' }));
    setGramsError('');
    setUnsavedChanges(true);
  };

  const handleVarianceChange = (_event: any, newValue: string[]) => {
    const newItems = newValue.map((varianceName) => {
      const existing = items.find((item) => item.item_name === varianceName);
      const variance = product.find((v) => v.varianceName === varianceName);
      return existing ?? { item_name: varianceName, uom: variance?.variance_Uom ?? '', grams: 0 };
    });
    setItems(newItems);
    setValidationErrors((prev) => ({ ...prev, items: '' }));
    setGramsError('');
    setUnsavedChanges(true);
  };

  const handleItemChange = (index: number, field: keyof Item, value: string) => {
    setItems((prev) =>
      prev.map((item, idx) =>
        idx === index ? { ...item, [field]: field === 'grams' ? Number(value) : value } : item
      )
    );
    setGramsError('');
    setUnsavedChanges(true);
  };

  // ── Search / pagination ───────────────────────────────────────────────────

  const handleSearchItems = (query: string) => debouncedSearch(query);

  const handleClearSearch = () => {
    dispatch(resetPagination({ clearCacheSearch: varianceSearchQuery } as any));
    setVarianceSearchQuery('');
    dispatch(resetPagination());
    dispatch(fetchItems({ page: 1, limit: 50, search: '' }));
    debouncedSearch.cancel();
  };

  const handleLoadMoreItems = () => {
    if (currentPage < totalPages && !isFetchingItems) {
      dispatch(fetchItems({ page: currentPage + 1, limit: 50, search: varianceSearchQuery }));
    }
  };

  const handleItemsFieldOpen = () => {
    // Only fetch if the product list is empty; cache will serve if already loaded
    if (product.length === 0) {
      dispatch(fetchItems({ page: 1, limit: 50, search: varianceSearchQuery }));
    }
  };

  // ── Validation ────────────────────────────────────────────────────────────

  const validateFields = (): boolean => {
    const errors = { ...INITIAL_VALIDATION_ERRORS };
    let isValid = true;

    if (!mixBoxData.mixboxName.trim()) {
      errors.mixboxName = 'Mix box name is required';
      isValid = false;
    } else if (!/^[A-Za-z0-9\s]+$/.test(mixBoxData.mixboxName)) {
      errors.mixboxName = 'Mix box name can only contain letters, numbers & spaces';
      isValid = false;
    }

    if (!mixBoxData.totalGrams) {
      errors.totalGrams = 'Total Grams is required';
      isValid = false;
    } else if (!/^[0-9]{1,4}$/.test(mixBoxData.totalGrams)) {
      errors.totalGrams = 'Total Grams must be a number and cannot exceed 4 digits';
      isValid = false;
    }

    if (items.length === 0) {
      errors.items = 'At least one item is required';
      isValid = false;
    }

    const totalGrams = Number(mixBoxData.totalGrams);
    const sumGrams = items.reduce((sum, item) => sum + Number(item.grams), 0);

    if (sumGrams !== totalGrams) {
      setGramsError(`Sum of item grams (${sumGrams}) must equal total grams (${totalGrams})`);
      isValid = false;
    }

    setValidationErrors(errors);
    return isValid;
  };

  // ── Submit ────────────────────────────────────────────────────────────────

  const handleSubmit = async () => {
    if (!validateFields()) return;

    const isDuplicate = mixBoxes.some(
      (item) =>
        item.mixboxName.toLowerCase() === mixBoxData.mixboxName.toLowerCase() &&
        item.id !== mixBoxData.id
    );

    if (isDuplicate) {
      dispatch(setSnackbarMessage('Mix box with this name already exists.'));
      dispatch(setSnackbarOpen(true));
      return;
    }

    if (mixBoxData.id) {
      setEditConfirmationDialogOpen(true);
      return;
    }

    try {
      setIsSubmitting(true);
      await dispatch(addMixBox({ ...mixBoxData, items }));
      dispatch(setSnackbarMessage('Mix box created successfully!'));
      resetDialog();
      dispatch(fetchMixBoxes());
    } catch (error: unknown) {
      dispatch(setSnackbarMessage(error instanceof Error ? error.message : 'An error occurred'));
      dispatch(setSnackbarOpen(true));
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Edit confirmation ─────────────────────────────────────────────────────

  const handleEditConfirmation = async () => {
    try {
      setIsSubmitting(true);
      await dispatch(updateMixBox({ ...mixBoxData, items }));
      dispatch(setSnackbarMessage('Mix box updated successfully!'));
      dispatch(fetchMixBoxes());
      resetDialog();
    } catch (error: unknown) {
      dispatch(setSnackbarMessage(error instanceof Error ? error.message : 'An error occurred'));
      dispatch(setSnackbarOpen(true));
    } finally {
      setIsSubmitting(false);
      setEditConfirmationDialogOpen(false);
    }
  };

  const handleEditConfirmationClose = () => setEditConfirmationDialogOpen(false);

  // ── Edit row ──────────────────────────────────────────────────────────────

  const handleEdit = (mixBox: MixBox) => {
    dispatch(setMixBoxData(mixBox));
    setItems(mixBox.items);
    dispatch(setDialogOpen('edit'));
    setUnsavedChanges(false);
    setGramsError('');
    setVarianceSearchQuery('');
    dispatch(resetPagination());
    dispatch(fetchItems({ page: 1, limit: 50, search: '' }));
  };

  // ── Activate / Deactivate ─────────────────────────────────────────────────

  const handleDeactivate = (mixBox: MixBox) => {
    setSelectedMixBox(mixBox);
    setActionType('deactivate');
    setConfirmationDialogOpen(true);
  };

  const handleActivate = (mixBox: MixBox) => {
    setSelectedMixBox(mixBox);
    setActionType('activate');
    setConfirmationDialogOpen(true);
  };

  const handleConfirmationDialogClose = () => {
    setConfirmationDialogOpen(false);
    setSelectedMixBox(null);
    setActionType(null);
  };

  const handleConfirmationDialogConfirm = async () => {
    if (selectedMixBox && actionType) {
      try {
        if (actionType === 'deactivate') {
          await dispatch(deactivateMixBox(selectedMixBox.id));
        } else {
          await dispatch(activateMixBox(selectedMixBox.id));
        }
        dispatch(setSnackbarMessage(`Mix Box ${actionType}d successfully!`));
        dispatch(fetchMixBoxes());
      } catch (error: unknown) {
        dispatch(setSnackbarMessage(error instanceof Error ? error.message : 'An error occurred'));
        dispatch(setSnackbarOpen(true));
      }
      dispatch(setSnackbarOpen(true));
    }
    handleConfirmationDialogClose();
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <>
      <MasterAdminMenu />

      <MixBoxTableContainer
        handleEdit={handleEdit}
        handleDeactivate={handleDeactivate}
        handleActivate={handleActivate}
        handleOpen={handleOpen}
        showDeactivated={showDeactivated}
        setShowDeactivated={(value) => dispatch(setShowDeactivated(value))}
        searchQuery={searchQuery}
      />

      <MixBoxDialog
        open={dialogOpen !== 'none'}
        handleClose={handleClose}
        handleSubmit={handleSubmit}
        mixBoxData={mixBoxData}
        handleChange={handleChange}
        onVarianceChange={handleVarianceChange}
        validationErrors={validationErrors}
        gramsError={gramsError}
        setGramsError={setGramsError}
        items={items}
        setItems={setItems}
        product={product}
        mode={dialogOpen === 'edit' ? 'edit' : 'add'}
        isSubmitting={isSubmitting}
        hasMoreItems={hasMoreItems}
        isFetchingItems={isFetchingItems}
        onLoadMoreItems={handleLoadMoreItems}
        onSearchItems={handleSearchItems}
        onOpen={handleItemsFieldOpen}
        onClearSearch={handleClearSearch}
        varianceSearchQuery={varianceSearchQuery}
        setVarianceSearchQuery={setVarianceSearchQuery}
        handleItemChange={handleItemChange}
      />

      <ActivateDeactivateConfirmationDialog
        open={confirmationDialogOpen}
        actionType={actionType}
        itemName={selectedMixBox?.mixboxName}
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

export default MixBoxComponent;