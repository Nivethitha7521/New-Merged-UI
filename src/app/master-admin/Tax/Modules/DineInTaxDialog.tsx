
'use client';
import React, { useEffect, useRef, useMemo, useCallback } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  CircularProgress,
  Tooltip,
  IconButton,Box,Typography,
} from '@mui/material';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import RemoveCircleOutlineIcon from '@mui/icons-material/RemoveCircleOutline';
import { DineInTax, DineInTaxSplit } from '../Models/dineInTaxModels';

// ─── Constants ────────────────────────────────────────────────────────────────

const MAX_NAME_LENGTH      = 30;
const MAX_CODE_NAME_LENGTH = 10;
const MAX_HSN_LENGTH       = 8;
const MAX_PERCENT_LENGTH   = 5;

const RE_TEXT_ALLOWED  = /[^a-zA-Z0-9\s@%\-.,]/g;
const RE_CODE_ALLOWED  = /[^a-zA-Z0-9\s\-.,@#%&]/g;
const RE_HAS_LETTER    = /[a-zA-Z]/;
const RE_CODE_PERCENT  = /^\d{0,2}(\.\d{0,2})?$/;
const RE_DIGITS_ONLY   = /\D/g;
const RE_PASTE_DIGITS  = /^\d+$/;

// ─── Types ────────────────────────────────────────────────────────────────────

/**
 * Narrowed to the two fields TaxCodeRow actually writes,
 * preventing accidental writes to read-only / server-owned fields.
 */
type TaxCodeEditableField = 'taxcodeName' | 'taxcodePercentage';

interface ValidationErrors {
  DineInTaxName: string;
  DineInTaxPercentage: string;
}

interface DineInTaxDialogProps {
  open: boolean;
  handleClose: () => void;
  handleSubmit: () => void;
  /** Generic field change handler driven by `event.target.name`. */
  handleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleTaxCodeChange: (index: number, field: TaxCodeEditableField, value: string) => void;
  handleAddTaxCode: () => void;
  handleRemoveTaxCode: (index: number) => void;
  dineInTaxData: DineInTax;
  mode: 'add' | 'edit';
  isSubmitting: boolean;
  validationErrors: ValidationErrors;
}

interface SplitValidation {
  isValid: boolean;
  message: string;
}

// ─── Pure helpers (module-level — zero allocation cost) ──────────────────────

const filterTextChars = (v: string): string =>
  v.replace(RE_TEXT_ALLOWED, '').slice(0, MAX_NAME_LENGTH);

const filterCodeChars = (v: string): string =>
  v.replace(RE_CODE_ALLOWED, '').slice(0, MAX_CODE_NAME_LENGTH);

const filterHsnChars = (v: string): string =>
  v.replace(RE_DIGITS_ONLY, '').slice(0, MAX_HSN_LENGTH);

const hasCodeNameError = (name: string | undefined): boolean => {
  const trimmed = (name ?? '').trim();
  return !trimmed || !RE_HAS_LETTER.test(trimmed);
};

const getCodeNameHelperText = (name: string): string => {
  const trimmed = name.trim();
  if (!trimmed) return 'Code Name is required';
  if (!RE_HAS_LETTER.test(trimmed)) return 'Must contain at least one letter';
  return ' ';
};

/**
 * Builds a minimal synthetic ChangeEvent that reuses the original target
 * but carries a new filtered value — avoids a full object clone.
 *
 * NOTE: We use Object.defineProperty so the value property is writable
 * only for this one call; the original event object is otherwise untouched.
 * This is safe in React 17+ and React 18 because synthetic events are no
 * longer pooled and event.target is the real DOM node.
 */
const patchEventValue = (
  e: React.ChangeEvent<HTMLInputElement>,
  filtered: string
): React.ChangeEvent<HTMLInputElement> => {
  Object.defineProperty(e.target, 'value', { configurable: true, writable: true, value: filtered });
  return e;
};

// ─── Sub-component: single tax-code row ──────────────────────────────────────

interface TaxCodeRowProps {
  code: DineInTaxSplit;
  index: number;
  isSubmitting: boolean;
  onNameChange: (index: number, value: string) => void;
  onPercentChange: (index: number, value: string) => void;
  onRemove: (index: number) => void;
}

const TaxCodeRow = React.memo<TaxCodeRowProps>(
  ({ code, index, isSubmitting, onNameChange, onPercentChange, onRemove }) => {
    const handleName = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) =>
        onNameChange(index, filterCodeChars(e.target.value)),
      [index, onNameChange]
    );

    const handlePercent = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        if (val === '' || RE_CODE_PERCENT.test(val)) onPercentChange(index, val);
      },
      [index, onPercentChange]
    );

    const handleRemove = useCallback(() => onRemove(index), [index, onRemove]);

    const nameError   = hasCodeNameError(code.taxcodeName);
    const helperText  = getCodeNameHelperText(code.taxcodeName ?? '');
    // Show empty string when percentage is 0 so placeholder is visible
    const percentDisplay = code.taxcodePercentage === 0 ? '' : code.taxcodePercentage;

    return (
      <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start', marginBottom: '12px' }}>
        <TextField
          autoComplete="off"
          label="Code Name"
          value={code.taxcodeName ?? ''}
          onChange={handleName}
          size="small"
          fullWidth
          disabled={isSubmitting}
          className="custom-textfield"
          InputLabelProps={{ className: 'custom-label' }}
          InputProps={{ className: 'custom-input' }}
          inputProps={{ maxLength: MAX_CODE_NAME_LENGTH }}
          error={nameError}
          helperText={helperText}
        />

        <TextField
          autoComplete="off"
          label="Code %"
          value={percentDisplay}
          onChange={handlePercent}
          size="small"
          style={{ width: '120px', flexShrink: 0 }}
          disabled={isSubmitting}
          className="custom-textfield"
          InputLabelProps={{ className: 'custom-label' }}
          InputProps={{ className: 'custom-input' }}
          inputProps={{ inputMode: 'decimal', maxLength: MAX_PERCENT_LENGTH }}
        />

        <Tooltip title="Remove">
          <IconButton
            size="small"
            onClick={handleRemove}
            disabled={isSubmitting}
            color="error"
            style={{ marginTop: '6px' }}
            aria-label={`Remove tax code ${index + 1}`}
          >
            <RemoveCircleOutlineIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </div>
    );
  }
);

TaxCodeRow.displayName = 'TaxCodeRow';

// ─── HSN field — extracted to avoid inlining three handlers in JSX ───────────

interface HsnFieldProps {
  value: string | number;
  isSubmitting: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const HsnField = React.memo<HsnFieldProps>(({ value, isSubmitting, onChange }) => {
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) =>
      onChange(patchEventValue(e, filterHsnChars(e.target.value))),
    [onChange]
  );

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    const allowedKeys = ['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab'];
    if (!/^\d$/.test(e.key) && !allowedKeys.includes(e.key)) e.preventDefault();
  }, []);

  const handlePaste = useCallback((e: React.ClipboardEvent<HTMLInputElement>) => {
    if (!RE_PASTE_DIGITS.test(e.clipboardData.getData('text'))) e.preventDefault();
  }, []);

  return (
    <TextField
      autoComplete="off"
      label="DineIn HSN Code"
      name="DineInhsnCode"
      type="text"
      margin="normal"
      value={value === 0 ? '' : value}
      onChange={handleChange}
      onKeyDown={handleKeyDown}
      onPaste={handlePaste}
      fullWidth
      required
      disabled={isSubmitting}
      className="custom-textfield"
      InputLabelProps={{ className: 'custom-label' }}
      InputProps={{ className: 'custom-input' }}
      inputProps={{ inputMode: 'numeric', maxLength: MAX_HSN_LENGTH }}
    />
  );
});

HsnField.displayName = 'HsnField';

// ─── Split validation error banner ───────────────────────────────────────────

const SplitValidationBanner = React.memo<{ message: string }>(({ message }) =>
  message ? (
    <div
      role="alert"
      style={{
        color: 'var(--color-text-danger)',
        fontSize: '0.85rem',
        marginTop: '12px',
        padding: '10px',
        backgroundColor: 'var(--color-background-danger)',
        borderRadius: '6px',
        border: '1px solid var(--color-border-danger)',
      }}
    >
      {message}
    </div>
  ) : null
);

SplitValidationBanner.displayName = 'SplitValidationBanner';

// ─── Pure split-percentage validator ─────────────────────────────────────────

const validateSplit = (
  splits: DineInTaxSplit[],
  mainPercentage: number | string
): SplitValidation => {
  if (!splits.length) return { isValid: true, message: '' };

  const totalSplit = splits.reduce(
    (sum, c) => sum + (parseFloat(String(c.taxcodePercentage)) || 0),
    0
  );
  const mainPct = parseFloat(String(mainPercentage)) || 0;
  const isValid = Math.abs(totalSplit - mainPct) < 0.001;

  return {
    isValid,
    message: isValid
      ? ''
      : `DineIn Tax Percentage (${mainPct}%) must equal sum of Tax Codes (${totalSplit.toFixed(2)}%)`,
  };
};

// ─── Main component ───────────────────────────────────────────────────────────

const DineInTaxDialog: React.FC<DineInTaxDialogProps> = ({
  open,
  handleClose,
  handleSubmit,
  handleChange,
  dineInTaxData,
  mode,
  isSubmitting,
  validationErrors,
  handleTaxCodeChange,
  handleAddTaxCode,
  handleRemoveTaxCode,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const isAddMode = mode === 'add';

  // ─── Auto-focus first field on open (add mode only) ──────────────────────
  useEffect(() => {
    if (!open || !isAddMode) return;
    const id = setTimeout(() => inputRef.current?.focus(), 100);
    return () => clearTimeout(id);
  }, [open, isAddMode]);

  // ─── Filtered change handler for Tax Name ────────────────────────────────
  const handleTaxNameChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) =>
      handleChange(patchEventValue(e, filterTextChars(e.target.value))),
    [handleChange]
  );

  // ─── Stable callbacks passed down to TaxCodeRow ──────────────────────────
  const handleCodeNameChange = useCallback(
    (index: number, value: string) => handleTaxCodeChange(index, 'taxcodeName', value),
    [handleTaxCodeChange]
  );

  const handleCodePercentChange = useCallback(
    (index: number, value: string) => handleTaxCodeChange(index, 'taxcodePercentage', value),
    [handleTaxCodeChange]
  );

  // ─── Derived validation (single memo, no intermediate state) ─────────────
  const splitValidation = useMemo(
    () => validateSplit(dineInTaxData.taxSplitup ?? [], dineInTaxData.DineInTaxPercentage),
    [dineInTaxData.DineInTaxPercentage, dineInTaxData.taxSplitup]
  );

  const hasTaxNameLetterError =
    isAddMode && !!dineInTaxData.DineInTaxName && !RE_HAS_LETTER.test(dineInTaxData.DineInTaxName);

  const hasAnyCodeNameError = useMemo(
    () => (dineInTaxData.taxSplitup ?? []).some((c) => hasCodeNameError(c.taxcodeName)),
    [dineInTaxData.taxSplitup]
  );

  const isSubmitDisabled =
    isSubmitting ||
    !!validationErrors.DineInTaxName ||
    hasTaxNameLetterError ||
    hasAnyCodeNameError ||
    !splitValidation.isValid;

  // ─── Tax Name field helper text (derived, not stored) ────────────────────
  const taxNameHelperText = isAddMode
    ? hasTaxNameLetterError
      ? 'Must contain at least one letter'
      : validationErrors.DineInTaxName || ' '
    : ' ';

  const taxNameError = isAddMode && (!!validationErrors.DineInTaxName || hasTaxNameLetterError);

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
<Dialog
  open={open}
  onClose={handleClose}
  maxWidth="sm"
  fullWidth
  className="master-admin-form-dialog tax-form-dialog dinein-tax-form-dialog"
  PaperProps={{
    className:
      "dialog-paper-small master-admin-form-dialog-paper tax-dialog-paper",
  }}
>
      <DialogTitle className="dialog-title">
        {isAddMode ? 'Add' : 'Edit'} DineIn Tax
      </DialogTitle>

    <DialogContent className="dialog-content master-admin-form-content">
  <div className="form-section tax-form-section">
          {/* Tax Name */}
          <TextField
            autoComplete="off"
            margin="normal"
            label="DineIn Tax Name"
            name="DineInTaxName"
            value={dineInTaxData.DineInTaxName}
            onChange={handleTaxNameChange}
            inputProps={{ maxLength: MAX_NAME_LENGTH }}
            fullWidth
            required
            inputRef={inputRef}
            error={taxNameError}
            helperText={taxNameHelperText}
            disabled={isSubmitting || !isAddMode}
            className="custom-textfield"
            InputLabelProps={{ className: 'custom-label' }}
            InputProps={{ className: 'custom-input' }}
          />

          {/* Tax Percentage */}
          <TextField
            autoComplete="off"
            label="DineIn Tax Percentage"
            name="DineInTaxPercentage"
            type="text"
            margin="normal"
            value={dineInTaxData.DineInTaxPercentage === 0 ? '' : dineInTaxData.DineInTaxPercentage}
            onChange={handleChange}
            fullWidth
            required
            error={!!validationErrors.DineInTaxPercentage}
            helperText={validationErrors.DineInTaxPercentage || ' '}
            disabled={isSubmitting}
            className="custom-textfield"
            InputLabelProps={{ className: 'custom-label' }}
            InputProps={{ className: 'custom-input' }}
            inputProps={{ inputMode: 'decimal', maxLength: MAX_PERCENT_LENGTH }}
          />

          {/* HSN Code — extracted to its own memoized component */}
          <HsnField
            value={dineInTaxData.DineInhsnCode}
            isSubmitting={isSubmitting}
            onChange={handleChange}
          />

          {/* Tax Codes section header */}
          <div style={{ display: 'flex', alignItems: 'center', margin: '24px 0 8px' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', flex: 1 }}>
              Tax Codes <span style={{ color: 'var(--color-text-danger)' }}>*</span>
            </span>
            <Tooltip title="Add tax code">
              <IconButton
                size="small"
                onClick={handleAddTaxCode}
                disabled={isSubmitting}
                color="primary"
                aria-label="Add tax code"
              >
                <AddCircleOutlineIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </div>

          {/* Tax code rows — stable key prevents DOM reuse on remove */}
          {(dineInTaxData.taxSplitup ?? []).map((code, index) => (
            <TaxCodeRow
              key={code.id ?? index}
              code={code}
              index={index}
              isSubmitting={isSubmitting}
              onNameChange={handleCodeNameChange}
              onPercentChange={handleCodePercentChange}
              onRemove={handleRemoveTaxCode}
            />
          ))}

          {/* Split mismatch error */}
          <SplitValidationBanner message={splitValidation.message} />

        </div>
      </DialogContent>

      <DialogActions className="dialog-actions">
        <button className="btn-secondary" onClick={handleClose} disabled={isSubmitting}>
          Cancel
        </button>
        <button
          className="btn-primary"
          onClick={handleSubmit}
          disabled={isSubmitDisabled}
          aria-busy={isSubmitting}
        >
          {isSubmitting ? (
            <CircularProgress size={24} color="inherit" />
          ) : isAddMode ? (
            'Create'
          ) : (
            'Update'
          )}
        </button>
      </DialogActions>
    </Dialog>
  );
};

export default DineInTaxDialog;