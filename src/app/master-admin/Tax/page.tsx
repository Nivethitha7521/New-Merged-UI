

'use client';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Snackbar, Alert } from '@mui/material';

import MasterAdminMenu from '../page';

// ── Tax imports ──
import {
  activatetax, addtax, deactivatetax, fetchtaxs, updatetax,
  settaxData, setDialogOpen, setSnackbarMessage, setSnackbarOpen,
  resettaxData, setShowDeactivated,
} from '../Tax/Features/taxSlice';
import TaxTableContainer from '../Tax/Modules/TaxTable';
import TaxDialog from '../Tax/Modules/TaxDialog';
import { TaxSplit, Tax } from './Models/taxModels';

// ── DineInTax imports ──
import {
  activateDineInTax, addDineInTax, deactivateDineInTax, fetchDineInTaxes,
  updateDineInTax, setDineInTaxData, setDineInDialogOpen,
  setDineInSnackbarMessage, setDineInSnackbarOpen,
  resetDineInTaxData, setDineInShowDeactivated,
} from '../Tax/Features/dineInTaxSlice';
import DineInTaxTableContainer from '../Tax/Modules/Dineintaxtable';
import DineInTaxDialog from '../Tax/Modules/DineInTaxDialog';
import { DineInTaxSplit, DineInTax } from './Models/dineInTaxModels';

// ── Shared dialog imports ──
import CloseConfirmationDialog from '../../Components/Dialogs/CloseConfirmationDialog';
import EditConfirmationDialog from '../../Components/Dialogs/EditConfirmationDialog';
import ActivateDeactivateConfirmationDialog from '../../Components/Dialogs/ActivateDeactivateConfirmationDialog';

import { AppDispatch, RootState } from '@/redux/store';

// ─── Types ────────────────────────────────────────────────────────────────────

type ActionType = 'deactivate' | 'activate' | null;

/** Groups the three booleans that always change together for a confirm dialog. */
interface ConfirmState<T> {
  open: boolean;
  item: T | null;
  actionType: ActionType;
}

const EMPTY_TAX_ERRORS = { taxName: '', taxPercentage: '' };
const EMPTY_DINEIN_ERRORS = { DineInTaxName: '', DineInTaxPercentage: '' };

// ─── Regex (module-level — compiled once) ─────────────────────────────────────
const RE_DECIMAL = /^\d*\.?\d*$/;

// ─── Pure helpers (module-level) ─────────────────────────────────────────────

const parseSplitup = <T extends { taxcodePercentage: number | string }>(
  splitup: T[]
): T[] =>
  splitup.map((code) => ({
    ...code,
    taxcodePercentage: parseFloat(String(code.taxcodePercentage)) || 0,
  }));

const isSplitValid = (
  splitup: { taxcodePercentage: number | string }[],
  mainPct: number
): boolean => {
  if (splitup.length === 0) return true;
  const total = splitup.reduce(
    (sum, c) => sum + (parseFloat(String(c.taxcodePercentage)) || 0),
    0
  );
  return Math.abs(total - mainPct) <= 0.001;
};

const splitErrorMsg = (
  label: string,
  splitup: { taxcodePercentage: number | string }[],
  mainPct: number
): string => {
  const total = splitup.reduce(
    (sum, c) => sum + (parseFloat(String(c.taxcodePercentage)) || 0),
    0
  );
  return `${label} (${mainPct}%) must exactly equal the sum of Tax Codes (${total.toFixed(2)}%)`;
};

const percentValidationError = (value: string): string => {
  const n = parseFloat(value);
  if (value === '' || isNaN(n)) return '';
  if (n < 0) return 'Cannot be negative';
  if (n > 100) return 'Cannot exceed 100';
  return '';
};

// ─── Component ────────────────────────────────────────────────────────────────

const TaxComponent: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();

  // ── Redux selectors ───────────────────────────────────────────────────────
  const {
    items: taxs,
    taxData,
    snackbarOpen,
    snackbarMessage,
    dialogOpen,
    showDeactivated,
  } = useSelector((state: RootState) => state.taxes);

  const {
    items: dineInTaxes,
    dineInTaxData,
    snackbarOpen: dineInSnackbarOpen,
    snackbarMessage: dineInSnackbarMessage,
    dialogOpen: dineInDialogOpen,
    showDeactivated: dineInShowDeactivated,
  } = useSelector((state: RootState) => state.dineInTaxes);

  // ── Tax local state (collapsed into fewer atoms) ──────────────────────────
  const [taxConfirm, setTaxConfirm] = useState<ConfirmState<Tax>>({
    open: false, item: null, actionType: null,
  });
  const [taxEditConfirmOpen, setTaxEditConfirmOpen] = useState(false);
  const [taxCloseConfirmOpen, setTaxCloseConfirmOpen] = useState(false);
  const [taxUnsaved, setTaxUnsaved] = useState(false);
  const [taxSubmitting, setTaxSubmitting] = useState(false);
  const [taxErrors, setTaxErrors] = useState(EMPTY_TAX_ERRORS);

  // ── DineIn local state ────────────────────────────────────────────────────
  const [dineInConfirm, setDineInConfirm] = useState<ConfirmState<DineInTax>>({
    open: false, item: null, actionType: null,
  });
  const [dineInEditConfirmOpen, setDineInEditConfirmOpen] = useState(false);
  const [dineInCloseConfirmOpen, setDineInCloseConfirmOpen] = useState(false);
  const [dineInUnsaved, setDineInUnsaved] = useState(false);
  const [dineInSubmitting, setDineInSubmitting] = useState(false);
  const [dineInErrors, setDineInErrors] = useState(EMPTY_DINEIN_ERRORS);

  // ── Fetch on mount / toggle ───────────────────────────────────────────────
  useEffect(() => { dispatch(fetchtaxs()); }, [dispatch, showDeactivated]);
  useEffect(() => { dispatch(fetchDineInTaxes()); }, [dispatch, dineInShowDeactivated]);

  // ═══════════════════════════════════════════════════════════════════════════
  // TAX HANDLERS
  // ═══════════════════════════════════════════════════════════════════════════

  const resetTaxDialog = useCallback(() => {
    dispatch(setDialogOpen('none'));
    dispatch(resettaxData());
    setTaxErrors(EMPTY_TAX_ERRORS);
    setTaxUnsaved(false);
  }, [dispatch]);

  const handleTaxOpen = useCallback(() => {
    dispatch(resettaxData());
    setTaxErrors(EMPTY_TAX_ERRORS);
    dispatch(setDialogOpen('add'));
  }, [dispatch]);

  const handleTaxClose = useCallback(() => {
    if (taxUnsaved) setTaxCloseConfirmOpen(true);
    else resetTaxDialog();
  }, [taxUnsaved, resetTaxDialog]);

  const handleTaxConfirmClose = useCallback(() => {
    resetTaxDialog();
    setTaxCloseConfirmOpen(false);
  }, [resetTaxDialog]);

  const handleTaxCancelClose = useCallback(
    () => setTaxCloseConfirmOpen(false), []
  );

  const handleTaxChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const { name, value } = e.target;
      if (name === 'taxPercentage' && value !== '' && !RE_DECIMAL.test(value)) return;
      dispatch(settaxData({ ...taxData, [name]: value }));
      setTaxUnsaved(true);
      if (name === 'taxPercentage') {
        setTaxErrors((prev) => ({
          ...prev,
          taxPercentage: percentValidationError(value),
        }));
      }
    },
    [dispatch, taxData]
  );

  const handleTaxAddTaxCode = useCallback(() => {
    dispatch(settaxData({
      ...taxData,
      taxSplitup: [...(taxData.taxSplitup || []), { taxcodeName: '', taxcodePercentage: 0 }],
    }));
    setTaxUnsaved(true);
  }, [dispatch, taxData]);

  const handleTaxRemoveTaxCode = useCallback(
    (index: number) => {
      dispatch(settaxData({
        ...taxData,
        taxSplitup: (taxData.taxSplitup || []).filter((_, i) => i !== index),
      }));
      setTaxUnsaved(true);
    },
    [dispatch, taxData]
  );

  const handleTaxCodeChange = useCallback(
    (index: number, field: keyof TaxSplit, value: string) => {
      dispatch(settaxData({
        ...taxData,
        taxSplitup: (taxData.taxSplitup || []).map((code, i) =>
          i === index
            ? { ...code, [field]: field === 'taxcodePercentage' ? (value === '' ? 0 : value) : value }
            : code
        ),
      }));
      setTaxUnsaved(true);
    },
    [dispatch, taxData]
  );

  const validateTaxFields = useCallback((): boolean => {
    const errors = { ...EMPTY_TAX_ERRORS };
    let valid = true;
    if (!taxData.taxName.trim()) { errors.taxName = 'Tax name is required'; valid = false; }
    setTaxErrors(errors);
    return valid;
  }, [taxData.taxName]);

  // Returns false and fires snackbar if split is invalid
  const checkTaxSplit = useCallback((): boolean => {
    const mainPct = parseFloat(String(taxData.taxPercentage)) || 0;
    if (isSplitValid(taxData.taxSplitup || [], mainPct)) return true;
    dispatch(setSnackbarMessage(splitErrorMsg('Tax Percentage', taxData.taxSplitup || [], mainPct)));
    dispatch(setSnackbarOpen(true));
    return false;
  }, [dispatch, taxData.taxPercentage, taxData.taxSplitup]);

  const handleTaxSubmit = useCallback(async () => {
    if (!validateTaxFields() || !checkTaxSplit()) return;

    const parsed = { ...taxData, taxSplitup: parseSplitup(taxData.taxSplitup || []) };

    const isDuplicate = taxs.some(
      (item) =>
        item.taxName.toLowerCase() === parsed.taxName.toLowerCase() && item.id !== parsed.id
    );
    if (isDuplicate) {
      dispatch(setSnackbarMessage('Tax with this name already exists.'));
      dispatch(setSnackbarOpen(true));
      return;
    }

    if (parsed.id) { setTaxEditConfirmOpen(true); return; }

    try {
      setTaxSubmitting(true);
      const result = await dispatch(addtax(parsed));
      if (addtax.rejected.match(result)) {
        throw new Error((result.payload as any)?.detail || result.payload || 'Failed to create tax');
      }
      dispatch(setSnackbarMessage('Tax created successfully!'));
      resetTaxDialog();
      dispatch(fetchtaxs());
    } catch (err: unknown) {
      dispatch(setSnackbarMessage(err instanceof Error ? err.message : 'An error occurred'));
      dispatch(setSnackbarOpen(true));
    } finally {
      setTaxSubmitting(false);
    }
  }, [validateTaxFields, checkTaxSplit, taxData, taxs, dispatch, resetTaxDialog]);

  const handleTaxEditConfirmation = useCallback(async () => {
    if (!checkTaxSplit()) { setTaxEditConfirmOpen(false); return; }
    const parsed = { ...taxData, taxSplitup: parseSplitup(taxData.taxSplitup || []) };
    try {
      setTaxSubmitting(true);
      const result = await dispatch(updatetax(parsed));
      if (updatetax.rejected.match(result)) {
        throw new Error((result.payload as any)?.detail || result.payload || 'Failed to update tax');
      }
      dispatch(setSnackbarMessage('Tax updated successfully!'));
      dispatch(fetchtaxs());
      resetTaxDialog();
    } catch (err: unknown) {
      dispatch(setSnackbarMessage(err instanceof Error ? err.message : 'An error occurred'));
      dispatch(setSnackbarOpen(true));
    } finally {
      setTaxSubmitting(false);
      setTaxEditConfirmOpen(false);
    }
  }, [checkTaxSplit, taxData, dispatch, resetTaxDialog]);

  const handleTaxEdit = useCallback(
    (tax: Tax) => {
      dispatch(settaxData(tax));
      dispatch(setDialogOpen('edit'));
      setTaxUnsaved(false);
    },
    [dispatch]
  );

  const handleTaxDeactivate = useCallback(
    (tax: Tax) => setTaxConfirm({ open: true, item: tax, actionType: 'deactivate' }),
    []
  );
  const handleTaxActivate = useCallback(
    (tax: Tax) => setTaxConfirm({ open: true, item: tax, actionType: 'activate' }),
    []
  );
  const handleTaxConfirmationClose = useCallback(
    () => setTaxConfirm({ open: false, item: null, actionType: null }),
    []
  );

  const handleTaxConfirmationConfirm = useCallback(async () => {
    const { item, actionType } = taxConfirm;
    if (item && actionType) {
      try {
        await dispatch(actionType === 'deactivate' ? deactivatetax(item.id) : activatetax(item.id));
        dispatch(setSnackbarMessage(
          `Tax ${actionType === 'deactivate' ? 'deactivated' : 'activated'} successfully!`
        ));
        dispatch(fetchtaxs());
      } catch (err: unknown) {
        dispatch(setSnackbarMessage(err instanceof Error ? err.message : 'An error occurred'));
        dispatch(setSnackbarOpen(true));
      }
    }
    handleTaxConfirmationClose();
  }, [taxConfirm, dispatch, handleTaxConfirmationClose]);

  // ── Stable snackbar close ─────────────────────────────────────────────────
  const handleTaxSnackbarClose = useCallback(
    () => dispatch(setSnackbarOpen(false)), [dispatch]
  );
  const handleTaxShowDeactivated = useCallback(
    (v: boolean) => dispatch(setShowDeactivated(v)), [dispatch]
  );

  // ═══════════════════════════════════════════════════════════════════════════
  // DINEIN TAX HANDLERS
  // ═══════════════════════════════════════════════════════════════════════════

  const resetDineInDialog = useCallback(() => {
    dispatch(setDineInDialogOpen('none'));
    dispatch(resetDineInTaxData());
    setDineInErrors(EMPTY_DINEIN_ERRORS);
    setDineInUnsaved(false);
  }, [dispatch]);

  const handleDineInOpen = useCallback(() => {
    dispatch(resetDineInTaxData());
    setDineInErrors(EMPTY_DINEIN_ERRORS);
    dispatch(setDineInDialogOpen('add'));
  }, [dispatch]);

  const handleDineInClose = useCallback(() => {
    if (dineInUnsaved) setDineInCloseConfirmOpen(true);
    else resetDineInDialog();
  }, [dineInUnsaved, resetDineInDialog]);

  const handleDineInConfirmClose = useCallback(() => {
    resetDineInDialog();
    setDineInCloseConfirmOpen(false);
  }, [resetDineInDialog]);

  const handleDineInCancelClose = useCallback(
    () => setDineInCloseConfirmOpen(false), []
  );

  const handleDineInChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const { name, value } = e.target;
      if (name === 'DineInTaxPercentage' && value !== '' && !RE_DECIMAL.test(value)) return;
      dispatch(setDineInTaxData({ ...dineInTaxData, [name]: value }));
      setDineInUnsaved(true);
      if (name === 'DineInTaxPercentage') {
        setDineInErrors((prev) => ({
          ...prev,
          DineInTaxPercentage: percentValidationError(value),
        }));
      }
    },
    [dispatch, dineInTaxData]
  );

  const handleDineInAddTaxCode = useCallback(() => {
    dispatch(setDineInTaxData({
      ...dineInTaxData,
      taxSplitup: [...(dineInTaxData.taxSplitup || []), { taxcodeName: '', taxcodePercentage: 0 }],
    }));
    setDineInUnsaved(true);
  }, [dispatch, dineInTaxData]);

  const handleDineInRemoveTaxCode = useCallback(
    (index: number) => {
      dispatch(setDineInTaxData({
        ...dineInTaxData,
        taxSplitup: (dineInTaxData.taxSplitup || []).filter((_, i) => i !== index),
      }));
      setDineInUnsaved(true);
    },
    [dispatch, dineInTaxData]
  );

  const handleDineInTaxCodeChange = useCallback(
    (index: number, field: keyof DineInTaxSplit, value: string) => {
      dispatch(setDineInTaxData({
        ...dineInTaxData,
        taxSplitup: (dineInTaxData.taxSplitup || []).map((code, i) =>
          i === index
            ? { ...code, [field]: field === 'taxcodePercentage' ? (value === '' ? 0 : value) : value }
            : code
        ),
      }));
      setDineInUnsaved(true);
    },
    [dispatch, dineInTaxData]
  );

  const validateDineInFields = useCallback((): boolean => {
    const errors = { ...EMPTY_DINEIN_ERRORS };
    let valid = true;
    if (!dineInTaxData.DineInTaxName.trim()) {
      errors.DineInTaxName = 'DineIn Tax name is required';
      valid = false;
    }
    setDineInErrors(errors);
    return valid;
  }, [dineInTaxData.DineInTaxName]);

  const checkDineInSplit = useCallback((): boolean => {
    const mainPct = parseFloat(String(dineInTaxData.DineInTaxPercentage)) || 0;
    if (isSplitValid(dineInTaxData.taxSplitup || [], mainPct)) return true;
    dispatch(setDineInSnackbarMessage(
      splitErrorMsg('DineIn Tax Percentage', dineInTaxData.taxSplitup || [], mainPct)
    ));
    dispatch(setDineInSnackbarOpen(true));
    return false;
  }, [dispatch, dineInTaxData.DineInTaxPercentage, dineInTaxData.taxSplitup]);

  const handleDineInSubmit = useCallback(async () => {
    if (!validateDineInFields() || !checkDineInSplit()) return;

    const parsed = { ...dineInTaxData, taxSplitup: parseSplitup(dineInTaxData.taxSplitup || []) };

    const isDuplicate = dineInTaxes.some(
      (item) =>
        item.DineInTaxName.toLowerCase() === parsed.DineInTaxName.toLowerCase() &&
        item.id !== parsed.id
    );
    if (isDuplicate) {
      dispatch(setDineInSnackbarMessage('DineIn Tax with this name already exists.'));
      dispatch(setDineInSnackbarOpen(true));
      return;
    }

    if (parsed.id) { setDineInEditConfirmOpen(true); return; }

    try {
      setDineInSubmitting(true);
      const result = await dispatch(addDineInTax(parsed));
      if (addDineInTax.rejected.match(result)) {
        throw new Error(
          (result.payload as any)?.detail || result.payload || 'Failed to create DineIn tax'
        );
      }
      dispatch(setDineInSnackbarMessage('DineIn Tax created successfully!'));
      resetDineInDialog();
      dispatch(fetchDineInTaxes());
    } catch (err: unknown) {
      dispatch(setDineInSnackbarMessage(err instanceof Error ? err.message : 'An error occurred'));
      dispatch(setDineInSnackbarOpen(true));
    } finally {
      setDineInSubmitting(false);
    }
  }, [validateDineInFields, checkDineInSplit, dineInTaxData, dineInTaxes, dispatch, resetDineInDialog]);

  const handleDineInEditConfirmation = useCallback(async () => {
    if (!checkDineInSplit()) { setDineInEditConfirmOpen(false); return; }
    const parsed = { ...dineInTaxData, taxSplitup: parseSplitup(dineInTaxData.taxSplitup || []) };
    try {
      setDineInSubmitting(true);
      const result = await dispatch(updateDineInTax(parsed));
      if (updateDineInTax.rejected.match(result)) {
        throw new Error(
          (result.payload as any)?.detail || result.payload || 'Failed to update DineIn tax'
        );
      }
      dispatch(setDineInSnackbarMessage('DineIn Tax updated successfully!'));
      dispatch(fetchDineInTaxes());
      resetDineInDialog();
    } catch (err: unknown) {
      dispatch(setDineInSnackbarMessage(err instanceof Error ? err.message : 'An error occurred'));
      dispatch(setDineInSnackbarOpen(true));
    } finally {
      setDineInSubmitting(false);
      setDineInEditConfirmOpen(false);
    }
  }, [checkDineInSplit, dineInTaxData, dispatch, resetDineInDialog]);

  const handleDineInEdit = useCallback(
    (tax: DineInTax) => {
      dispatch(setDineInTaxData(tax));
      dispatch(setDineInDialogOpen('edit'));
      setDineInUnsaved(false);
    },
    [dispatch]
  );

  const handleDineInDeactivate = useCallback(
    (tax: DineInTax) => setDineInConfirm({ open: true, item: tax, actionType: 'deactivate' }),
    []
  );
  const handleDineInActivate = useCallback(
    (tax: DineInTax) => setDineInConfirm({ open: true, item: tax, actionType: 'activate' }),
    []
  );
  const handleDineInConfirmationClose = useCallback(
    () => setDineInConfirm({ open: false, item: null, actionType: null }),
    []
  );

  const handleDineInConfirmationConfirm = useCallback(async () => {
    const { item, actionType } = dineInConfirm;
    if (item && actionType) {
      try {
        await dispatch(
          actionType === 'deactivate'
            ? deactivateDineInTax(item.id)
            : activateDineInTax(item.id)
        );
        dispatch(setDineInSnackbarMessage(
          `DineIn Tax ${actionType === 'deactivate' ? 'deactivated' : 'activated'} successfully!`
        ));
        dispatch(fetchDineInTaxes());
      } catch (err: unknown) {
        dispatch(setDineInSnackbarMessage(err instanceof Error ? err.message : 'An error occurred'));
        dispatch(setDineInSnackbarOpen(true));
      }
    }
    handleDineInConfirmationClose();
  }, [dineInConfirm, dispatch, handleDineInConfirmationClose]);

  const handleDineInSnackbarClose = useCallback(
    () => dispatch(setDineInSnackbarOpen(false)), [dispatch]
  );
  const handleDineInShowDeactivated = useCallback(
    (v: boolean) => dispatch(setDineInShowDeactivated(v)), [dispatch]
  );

  // ── Stable close callbacks for inline dialogs ─────────────────────────────
  const closeTaxEditConfirm = useCallback(() => setTaxEditConfirmOpen(false), []);
  const closeDineInEditConfirm = useCallback(() => setDineInEditConfirmOpen(false), []);

  // ─────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────
  return (
    <>
      <MasterAdminMenu />

      <TaxTableContainer
        handleOpen={handleTaxOpen}
        handleEdit={handleTaxEdit}
        handleActivate={handleTaxActivate}
        handleDeactivate={handleTaxDeactivate}
        showDeactivated={showDeactivated}
        setShowDeactivated={handleTaxShowDeactivated}
      />

      <DineInTaxTableContainer
        handleOpen={handleDineInOpen}
        handleEdit={handleDineInEdit}
        handleActivate={handleDineInActivate}
        handleDeactivate={handleDineInDeactivate}
        showDeactivated={dineInShowDeactivated}
        setShowDeactivated={handleDineInShowDeactivated}
      />

      {/* ── Tax Dialog ── */}
      <TaxDialog
        open={dialogOpen !== 'none'}
        handleClose={handleTaxClose}
        handleSubmit={handleTaxSubmit}
        handleChange={handleTaxChange}
        taxData={taxData}
        validationErrors={taxErrors}
        mode={dialogOpen as 'add' | 'edit'}
        isSubmitting={taxSubmitting}
        handleTaxCodeChange={handleTaxCodeChange}
        handleAddTaxCode={handleTaxAddTaxCode}
        handleRemoveTaxCode={handleTaxRemoveTaxCode}
      />

      {/* ── DineIn Tax Dialog ── */}
      <DineInTaxDialog
        open={dineInDialogOpen !== 'none'}
        handleClose={handleDineInClose}
        handleSubmit={handleDineInSubmit}
        handleChange={handleDineInChange}
        dineInTaxData={dineInTaxData}
        validationErrors={dineInErrors}
        mode={dineInDialogOpen as 'add' | 'edit'}
        isSubmitting={dineInSubmitting}
        handleTaxCodeChange={handleDineInTaxCodeChange}
        handleAddTaxCode={handleDineInAddTaxCode}
        handleRemoveTaxCode={handleDineInRemoveTaxCode}
      />

      {/* ── Tax confirmation dialogs ── */}
      <ActivateDeactivateConfirmationDialog
        open={taxConfirm.open}
        actionType={taxConfirm.actionType}
        itemName={taxConfirm.item?.taxName}
        onClose={handleTaxConfirmationClose}
        onConfirm={handleTaxConfirmationConfirm}
      />
      <EditConfirmationDialog
        open={taxEditConfirmOpen}
        onClose={closeTaxEditConfirm}
        onConfirm={handleTaxEditConfirmation}
      />
      <CloseConfirmationDialog
        open={taxCloseConfirmOpen}
        onClose={handleTaxCancelClose}
        onConfirm={handleTaxConfirmClose}
      />

      {/* ── DineIn confirmation dialogs ── */}
      <ActivateDeactivateConfirmationDialog
        open={dineInConfirm.open}
        actionType={dineInConfirm.actionType}
        itemName={dineInConfirm.item?.DineInTaxName}
        onClose={handleDineInConfirmationClose}
        onConfirm={handleDineInConfirmationConfirm}
      />
      <EditConfirmationDialog
        open={dineInEditConfirmOpen}
        onClose={closeDineInEditConfirm}
        onConfirm={handleDineInEditConfirmation}
      />
      <CloseConfirmationDialog
        open={dineInCloseConfirmOpen}
        onClose={handleDineInCancelClose}
        onConfirm={handleDineInConfirmClose}
      />

      {/* ══ TAX SNACKBAR ══ */}
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

      {/* ══ DINEIN TAX SNACKBAR ══ */}
      <Snackbar
        open={dineInSnackbarOpen}
        autoHideDuration={3000}
        onClose={() => dispatch(setDineInSnackbarOpen(false))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      >
        <Alert
          onClose={() => dispatch(setDineInSnackbarOpen(false))}
          severity="info"
          sx={{ width: '100%', backgroundColor: '#1976d2', color: 'white' }}
        >
          {dineInSnackbarMessage}
        </Alert>
      </Snackbar>
    </>
  );
};

export default TaxComponent;