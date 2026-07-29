
'use client';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Snackbar, Alert } from '@mui/material';
// import MasterAdminMenu from '../page';

import {
  activateDiscount,
  addDiscount,
  deactivateDiscount,
  fetchDiscounts,
  updateDiscount,
  setDiscountData,
  setDialogOpen,
  setSnackbarMessage,
  setSnackbarOpen,
  resetDiscountData,
  setShowDeactivated,
} from '../Discount/Features/discountSlice';
import CloseConfirmationDialog from '../../Components/Dialogs/CloseConfirmationDialog';
import EditConfirmationDialog from '../../Components/Dialogs/EditConfirmationDialog';
import ActivateDeactivateConfirmationDialog from '../../Components/Dialogs/ActivateDeactivateConfirmationDialog';
import DiscountDialog from "../Discount/Modules/DiscountDialog";
import DiscountTableContainer from '../Discount/Modules/DiscountTable';
import { AppDispatch, RootState } from '@/redux/store';
import { validateMaxLength, validateLettersOnly } from "../../Components/validation";

interface Discount {
  id: string;
  discountName: string;
  discountId: string;
  discountPercentage: string;
  saleTypeDiscount: string;
  status: string;
}

// ─── Typed error payload (replaces `as any`) ──────────────────────────────────
interface ApiErrorPayload {
  detail?: string;
}

const extractApiError = (payload: unknown): string => {
  if (!payload) return 'An error occurred';
  const p = payload as ApiErrorPayload;
  return p.detail ?? String(payload);
};

// ─── Constants ────────────────────────────────────────────────────────────────
const EMPTY_ERRORS = {
  discountName: '',
  discountPercentage: '',
  saleTypeDiscount: '',
};

const PERCENTAGE_RE = /^[1-9][0-9]?$/;

// ─────────────────────────────────────────────────────────────────────────────

const DiscountComponent: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const {
    items: discounts,
    discountData,
    snackbarOpen,
    snackbarMessage,
    dialogOpen,
    showDeactivated,
  } = useSelector((state: RootState) => state.Discounts);

  const [confirmationDialogOpen, setConfirmationDialogOpen] = useState(false);
  const [editConfirmationDialogOpen, setEditConfirmationDialogOpen] = useState(false);
  const [selectedDiscount, setSelectedDiscount] = useState<Discount | null>(null);
  const [actionType, setActionType] = useState<'deactivate' | 'activate' | null>(null);
  const [closeConfirmationDialogOpen, setCloseConfirmationDialogOpen] = useState(false);
  const [unsavedChanges, setUnsavedChanges] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [validationErrors, setValidationErrors] = useState(EMPTY_ERRORS);

  useEffect(() => {
    dispatch(fetchDiscounts());
  }, [dispatch, showDeactivated]);

  // ── Dialog helpers ──────────────────────────────────────────────────────────
  const resetDialog = useCallback(() => {
    dispatch(setDialogOpen('none'));
    dispatch(resetDiscountData());
    setValidationErrors(EMPTY_ERRORS);
    setUnsavedChanges(false);
  }, [dispatch]);

  const handleOpen = useCallback(() => {
    dispatch(resetDiscountData());
    setValidationErrors(EMPTY_ERRORS);
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

  const handleCancelClose = useCallback(() => {
    setCloseConfirmationDialogOpen(false);
  }, []);

  // ── Field change handler ────────────────────────────────────────────────────
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const { name, value } = e.target;

      if (name === 'discountPercentage') {
        if (value === '' || PERCENTAGE_RE.test(value)) {
          dispatch(setDiscountData({ ...discountData, [name]: value }));
          setUnsavedChanges(true);
          setValidationErrors(prev => ({ ...prev, discountPercentage: '' }));
        }
        return;
      }

      if (name === 'discountName') {
        if (value.length <= 30) {
          dispatch(setDiscountData({ ...discountData, [name]: value }));
          setUnsavedChanges(true);
          setValidationErrors(prev => ({ ...prev, discountName: '' }));
        }
        return;
      }

      if (name === 'saleTypeDiscount') {
        if (value.length <= 30) {
          dispatch(setDiscountData({ ...discountData, [name]: value }));
          setUnsavedChanges(true);
          setValidationErrors(prev => ({ ...prev, saleTypeDiscount: '' }));
        }
        return;
      }

      dispatch(setDiscountData({ ...discountData, [name]: value }));
      setUnsavedChanges(true);
    },
    [dispatch, discountData]
  );

  // ── Validation — now checks ALL three fields ────────────────────────────────
  const validateFields = useCallback((): boolean => {
    const errors = { ...EMPTY_ERRORS };
    let isValid = true;

    // discountName
    const nameError = validateMaxLength(discountData.discountName, 'Discount Name', 30)
      || validateLettersOnly(discountData.discountName, 'Discount Name');
    if (nameError) { errors.discountName = nameError; isValid = false; }

    // saleTypeDiscount
    const saleError = validateMaxLength(discountData.saleTypeDiscount, 'Sales Type Discount Name', 30)
      || validateLettersOnly(discountData.saleTypeDiscount, 'Sales Type Discount Name');
    if (!discountData.saleTypeDiscount.trim()) {
      errors.saleTypeDiscount = 'Sales Type Discount Name is required';
      isValid = false;
    } else if (saleError) {
      errors.saleTypeDiscount = saleError;
      isValid = false;
    }

    // discountPercentage
    if (!discountData.discountPercentage.trim()) {
      errors.discountPercentage = 'Discount Percentage is required';
      isValid = false;
    } else if (!PERCENTAGE_RE.test(discountData.discountPercentage)) {
      errors.discountPercentage = 'Enter a valid percentage (1–99)';
      isValid = false;
    }

    setValidationErrors(errors);
    return isValid;
  }, [discountData]);

  // ── Duplicate check (memoized) ──────────────────────────────────────────────
  const isDuplicate = useMemo(
    () =>
      discounts.some(
        (item) =>
          item.discountName.toLowerCase() === discountData.discountName.toLowerCase() &&
          item.id !== discountData.id
      ),
    [discounts, discountData.discountName, discountData.id]
  );

  const handleSnackbarClose = useCallback(() => {
    dispatch(setSnackbarOpen(false));
  }, [dispatch]);

  // ── Submit ──────────────────────────────────────────────────────────────────
  const handleSubmit = useCallback(async () => {
    if (!validateFields()) return;

    if (isDuplicate) {
      dispatch(setSnackbarMessage('Discount with this name already exists.'));
      dispatch(setSnackbarOpen(true));
      return;
    }

    if (discountData.id) {
      setEditConfirmationDialogOpen(true);
    } else {
      try {
        setIsSubmitting(true);
        const resultAction = await dispatch(addDiscount(discountData));

        if (addDiscount.rejected.match(resultAction)) {
          throw new Error(extractApiError(resultAction.payload));
        }

        dispatch(setSnackbarMessage('Discount created successfully!'));
        resetDialog();
        dispatch(fetchDiscounts());
      } catch (error: unknown) {
        dispatch(setSnackbarMessage(error instanceof Error ? error.message : 'An error occurred'));
        dispatch(setSnackbarOpen(true));
      } finally {
        setIsSubmitting(false);
      }
    }
  }, [validateFields, isDuplicate, discountData, dispatch, resetDialog]);

  // ── Edit confirmation ───────────────────────────────────────────────────────
  const handleEditConfirmation = useCallback(async () => {
    try {
      setIsSubmitting(true);
      const resultAction = await dispatch(updateDiscount(discountData));

      if (updateDiscount.rejected.match(resultAction)) {
        throw new Error(extractApiError(resultAction.payload));
      }

      dispatch(setSnackbarMessage('Discount updated successfully!'));
      dispatch(fetchDiscounts());
      resetDialog();
    } catch (error: unknown) {
      dispatch(setSnackbarMessage(error instanceof Error ? error.message : 'An error occurred'));
      dispatch(setSnackbarOpen(true));
    } finally {
      setIsSubmitting(false);
      setEditConfirmationDialogOpen(false);
    }
  }, [discountData, dispatch, resetDialog]);

  const handleEditConfirmationClose = useCallback(() => {
    setEditConfirmationDialogOpen(false);
  }, []);

  // ── Edit / Deactivate / Activate ────────────────────────────────────────────
  const handleEdit = useCallback(
    (discount: Discount) => {
      dispatch(setDiscountData(discount));
      dispatch(setDialogOpen('edit'));
      setUnsavedChanges(false);
    },
    [dispatch]
  );

  const handleDeactivate = useCallback((discount: Discount) => {
    setSelectedDiscount(discount);
    setActionType('deactivate');
    setConfirmationDialogOpen(true);
  }, []);

  const handleActivate = useCallback((discount: Discount) => {
    setSelectedDiscount(discount);
    setActionType('activate');
    setConfirmationDialogOpen(true);
  }, []);

  const handleConfirmationDialogClose = useCallback(() => {
    setConfirmationDialogOpen(false);
    setSelectedDiscount(null);
    setActionType(null);
  }, []);

  const handleConfirmationDialogConfirm = useCallback(async () => {
    if (selectedDiscount && actionType) {
      try {
        if (actionType === 'deactivate') {
          await dispatch(deactivateDiscount(selectedDiscount.id));
        } else {
          await dispatch(activateDiscount(selectedDiscount.id));
        }
        dispatch(setSnackbarMessage(
          `Discount ${actionType === 'deactivate' ? 'deactivated' : 'activated'}!`
        ));
        dispatch(fetchDiscounts());
      } catch (error: unknown) {
        dispatch(setSnackbarMessage(error instanceof Error ? error.message : 'An error occurred'));
        dispatch(setSnackbarOpen(true));
      }
    }
    handleConfirmationDialogClose();
  }, [selectedDiscount, actionType, dispatch, handleConfirmationDialogClose]);

  const handleSetShowDeactivated = useCallback(
    (value: boolean) => dispatch(setShowDeactivated(value)),
    [dispatch]
  );

  return (
    <>
      {/* <MasterAdminMenu /> */}

      <DiscountTableContainer
        handleEdit={handleEdit}
        handleDeactivate={handleDeactivate}
        handleActivate={handleActivate}
        handleOpen={handleOpen}
        showDeactivated={showDeactivated}
        setShowDeactivated={handleSetShowDeactivated}
      />

      <DiscountDialog
        open={dialogOpen !== 'none'}
        handleClose={handleClose}
        handleSubmit={handleSubmit}
        discountData={discountData}
        handleChange={handleChange}
        validationErrors={validationErrors}
        mode={dialogOpen as 'add' | 'edit'}
        loading={isSubmitting}
      />

      <ActivateDeactivateConfirmationDialog
        open={confirmationDialogOpen}
        actionType={actionType}
        itemName={selectedDiscount?.discountName}
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
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      >
        <Alert
          onClose={handleSnackbarClose}
          severity="info"
          sx={{ width: '100%', backgroundColor: '#1976d2', color: 'white' }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </>
  );
};

export default DiscountComponent;