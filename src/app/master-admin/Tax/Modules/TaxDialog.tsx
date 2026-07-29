

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
  IconButton,Box,
} from '@mui/material';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import RemoveCircleOutlineIcon from '@mui/icons-material/RemoveCircleOutline';
import { Tax, TaxSplit } from '../Models/taxModels';

// ─── Constants ────────────────────────────────────────────────────────────────

const MAX_NAME_LENGTH      = 30;
const MAX_CODE_NAME_LENGTH = 10;
const MAX_PERCENT_LENGTH   = 5;

// ─── Regex (module-level — compiled once, never recreated) ────────────────────

const RE_TEXT_ALLOWED = /[^a-zA-Z0-9\s@%\-.,]/g;
const RE_CODE_ALLOWED = /[^a-zA-Z0-9\s\-.,@#%&]/g;
const RE_HAS_LETTER   = /[a-zA-Z]/;
const RE_CODE_PERCENT = /^\d{0,2}(\.\d{0,2})?$/;

// ─── Types ────────────────────────────────────────────────────────────────────

/**
 * Narrowed union prevents callers from accidentally writing
 * to server-owned or read-only fields on TaxSplit.
 */
type TaxCodeEditableField = 'taxcodeName' | 'taxcodePercentage';

interface ValidationErrors {
  taxName: string;
  taxPercentage: string;
}

interface TaxDialogProps {
  open: boolean;
  handleClose: () => void;
  handleSubmit: () => void;
  /** Generic field change handler driven by `event.target.name`. */
  handleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleTaxCodeChange: (index: number, field: TaxCodeEditableField, value: string) => void;
  handleAddTaxCode: () => void;
  handleRemoveTaxCode: (index: number) => void;
  taxData: Tax;
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

const hasCodeNameError = (name: string | undefined): boolean => {
  const trimmed = (name ?? '').trim();
  return !trimmed || !RE_HAS_LETTER.test(trimmed);
};

const getCodeNameHelperText = (name: string): string => {
  const trimmed = name.trim();
  if (!trimmed)                     return 'Code Name is required';
  if (!RE_HAS_LETTER.test(trimmed)) return 'Must contain at least one letter';
  return ' ';
};

/**
 * Patches `event.target.value` in-place with a filtered string,
 * avoiding a full synthetic-event clone.
 * Safe in React 17+ (events are no longer pooled; target is a real DOM node).
 * `configurable: true` ensures the property can be redefined on a second call
 * without throwing in strict mode.
 */
const patchEventValue = (
  e: React.ChangeEvent<HTMLInputElement>,
  filtered: string
): React.ChangeEvent<HTMLInputElement> => {
  Object.defineProperty(e.target, 'value', {
    configurable: true,
    writable: true,
    value: filtered,
  });
  return e;
};

// ─── Pure split-percentage validator (module-level — independently testable) ──

const validateSplit = (
  splits: TaxSplit[],
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
      : `Tax Percentage (${mainPct}%) must equal sum of Tax Codes (${totalSplit.toFixed(2)}%)`,
  };
};

// ─── Sub-component: split validation error banner ─────────────────────────────
// Memoized so it skips re-render when the message string hasn't changed.

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

// ─── Sub-component: single tax-code row ──────────────────────────────────────
// Extracted + memoized so React skips re-rendering unchanged rows entirely.

interface TaxCodeRowProps {
  code: TaxSplit;
  index: number;
  isSubmitting: boolean;
  onNameChange:    (index: number, value: string) => void;
  onPercentChange: (index: number, value: string) => void;
  onRemove:        (index: number) => void;
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

    // Derived once per render — not recalculated inside JSX attributes
    const nameError      = hasCodeNameError(code.taxcodeName);
    const helperText     = getCodeNameHelperText(code.taxcodeName ?? '');
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

// ─── Main component ───────────────────────────────────────────────────────────

const TaxDialog: React.FC<TaxDialogProps> = ({
  open,
  handleClose,
  handleSubmit,
  handleChange,
  taxData,
  mode,
  isSubmitting,
  validationErrors,
  handleTaxCodeChange,
  handleAddTaxCode,
  handleRemoveTaxCode,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const isEditMode = mode === 'edit';

  // ─── Auto-focus on open; auto-select text in edit mode ───────────────────
  useEffect(() => {
    if (!open) return;
    const id = setTimeout(() => {
      inputRef.current?.focus();
      if (taxData.id) inputRef.current?.select();
    }, 100);
    return () => clearTimeout(id);
  }, [open, taxData.id]);

  // ─── Filtered change handler for Tax Name ────────────────────────────────
  const handleTaxNameChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) =>
      handleChange(patchEventValue(e, filterTextChars(e.target.value))),
    [handleChange]
  );

  // ─── Stable callbacks for TaxCodeRow — prevents child re-renders ─────────
  const handleCodeNameChange = useCallback(
    (index: number, value: string) => handleTaxCodeChange(index, 'taxcodeName', value),
    [handleTaxCodeChange]
  );

  const handleCodePercentChange = useCallback(
    (index: number, value: string) => handleTaxCodeChange(index, 'taxcodePercentage', value),
    [handleTaxCodeChange]
  );

  // ─── Derived validation — single useMemo, no intermediate useState ───────
  const splitValidation = useMemo(
    () => validateSplit(taxData.taxSplitup ?? [], taxData.taxPercentage),
    [taxData.taxPercentage, taxData.taxSplitup]
  );

  // Letter-presence check applies in both modes (no mode guard — intentional)
  const hasTaxNameLetterError =
    !!taxData.taxName && !RE_HAS_LETTER.test(taxData.taxName);

  const hasAnyCodeNameError = useMemo(
    () => (taxData.taxSplitup ?? []).some((c) => hasCodeNameError(c.taxcodeName)),
    [taxData.taxSplitup]
  );

  // ─── Submit guard — all blocking conditions in one place ─────────────────
  const isSubmitDisabled =
    isSubmitting          ||
    !!validationErrors.taxName ||
    hasTaxNameLetterError ||
    hasAnyCodeNameError   ||
    !splitValidation.isValid;

  // ─── Derived field props — computed before JSX, not inside attributes ─────
  const taxNameError      = !!validationErrors.taxName || hasTaxNameLetterError;
  const taxNameHelperText = hasTaxNameLetterError
    ? 'Must contain at least one letter'
    : validationErrors.taxName || ' ';

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <Dialog
  open={open}
  onClose={handleClose}
  maxWidth="sm"
  fullWidth
  className="master-admin-form-dialog tax-form-dialog"
  PaperProps={{
    className:
      "dialog-paper-small master-admin-form-dialog-paper tax-dialog-paper",
  }}
>
      <DialogTitle className="dialog-title">
        {isEditMode ? 'Edit' : 'Add'} Tax
      </DialogTitle>

<DialogContent className="dialog-content master-admin-form-content">
  <div className="form-section tax-form-section">

          {/* Tax Name — editable in both add and edit modes */}
          <TextField
            autoComplete="off"
            margin="normal"
            label="Tax Name"
            name="taxName"
            value={taxData.taxName}
            onChange={handleTaxNameChange}
            inputProps={{ maxLength: MAX_NAME_LENGTH }}
            fullWidth
            required
            inputRef={inputRef}
            error={taxNameError}
            helperText={taxNameHelperText}
            disabled={isSubmitting}
            className="custom-textfield"
            InputLabelProps={{ className: 'custom-label' }}
            InputProps={{ className: 'custom-input' }}
          />

          {/* Tax Percentage */}
          <TextField
            autoComplete="off"
            label="Tax Percentage"
            name="taxPercentage"
            type="text"
            margin="normal"
            value={taxData.taxPercentage}
            onChange={handleChange}
            fullWidth
            required
            error={!!validationErrors.taxPercentage}
            helperText={validationErrors.taxPercentage || ' '}
            disabled={isSubmitting}
            className="custom-textfield"
            InputLabelProps={{ className: 'custom-label' }}
            InputProps={{ className: 'custom-input' }}
            inputProps={{ inputMode: 'decimal', maxLength: MAX_PERCENT_LENGTH }}
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

          {/* Tax code rows — stable key prevents wrong DOM reuse on remove */}
          {(taxData.taxSplitup ?? []).map((code, index) => (
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

          {/* Split mismatch error — memoized, skips render when message is '' */}
          <SplitValidationBanner message={splitValidation.message} />

        </div>
      </DialogContent>

<DialogActions className="dialog-actions master-admin-form-actions">
  <button
    type="button"
    className="btn-secondary master-admin-dialog-button is-secondary"
    onClick={handleClose}
    disabled={isSubmitting}
  >
    Cancel
  </button>

  <button
    type="button"
    className="btn-primary master-admin-dialog-button is-primary"
    onClick={handleSubmit}
    disabled={isSubmitDisabled}
    aria-busy={isSubmitting}
  >
          {isSubmitting ? (
            <CircularProgress size={24} color="inherit" />
          ) : isEditMode ? (
            'Update'
          ) : (
            'Create'
          )}
        </button>
      </DialogActions>
    </Dialog>
  );
};

export default TaxDialog;