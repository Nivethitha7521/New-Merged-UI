

'use client';

import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  CircularProgress,
} from '@mui/material';
import { Sections } from '../Models/sectionsModels';

// ─── Types ────────────────────────────────────────────────────────────────────

interface SectionsDialogProps {
  open: boolean;
  handleClose: () => void;
  handleSubmit: () => void;
  sectionsData: Sections;
  handleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  mode: 'add' | 'edit';
  loading: boolean;
  validationErrors: {
    sectionsName: string;
    aliasName: string;
    location: string;
    address: string;
    code: string;
  };
}

// ─── Validation helpers ───────────────────────────────────────────────────────

const HAS_LETTER_RE = /[a-zA-Z]/;
const STRIP_SPECIAL_CHARS_RE = /[^a-zA-Z0-9\s\-.,]/g;
const MAX_TEXT_LENGTH = 30;

/**
 * Returns "Must contain at least one letter" if the value is non-empty but
 * contains no letter; otherwise falls back to the parent validation error.
 */
const getHelperText = (value: string | undefined, parentError: string): string =>
  value && !HAS_LETTER_RE.test(value) ? 'Must contain at least one letter' : parentError;

/**
 * Returns true when the field has a value but no letter —
 * used for error highlight on the TextField.
 */
const hasLetterError = (value: string | undefined): boolean =>
  !!value && !HAS_LETTER_RE.test(value);

/**
 * Builds an onChange handler that strips disallowed special chars,
 * caps at 30 chars, then forwards a synthetic event to the parent handler.
 * Memoised outside the component so the reference is stable.
 */
const createTextHandler =
  (handleChange: (e: React.ChangeEvent<HTMLInputElement>) => void) =>
  (e: React.ChangeEvent<HTMLInputElement>) => {
    const filtered = e.target.value
      .replace(STRIP_SPECIAL_CHARS_RE, '')
      .slice(0, MAX_TEXT_LENGTH);

    handleChange({
      ...e,
      target: { ...e.target, value: filtered, name: e.target.name },
    } as React.ChangeEvent<HTMLInputElement>);
  };

// ─── Shared TextField props ───────────────────────────────────────────────────

const SHARED_TEXT_FIELD_PROPS = {
  autoComplete: 'off',
  margin: 'normal' as const,
  fullWidth: true,
  className: 'custom-textfield',
  InputLabelProps: { className: 'custom-label' },
  InputProps: { className: 'custom-input' },
};

// ─── Component ────────────────────────────────────────────────────────────────

const SectionsDialog: React.FC<SectionsDialogProps> = ({
  open,
  handleClose,
  handleSubmit,
  sectionsData,
  handleChange,
  validationErrors,
  mode,
  loading,
}) => {
  // Filtered handler — only used for sectionsName and aliasName
  const handleTextChange = createTextHandler(handleChange);

  const isSubmitDisabled =
    loading ||
    !sectionsData.sectionsName ||
    !sectionsData.aliasName;

  return (
<Dialog
  open={open}
  onClose={handleClose}
  maxWidth="md"
  fullWidth
  className="section-form-dialog"
  PaperProps={{
    className: 'dialog-paper-medium section-dialog-paper',
  }}
>
      <DialogTitle className="dialog-title">
        {mode === 'edit' ? 'Edit Section' : 'Add Section'}
      </DialogTitle>

      <DialogContent className="dialog-content">
        {/* ── Row 1: Section Name · Alias Name · Code ── */}
      <div className="form-section section-dialog-primary-fields">
  <div className="form-grid">

            {/* Section Name — no special chars, max 30, min 1 letter */}
            <div className="form-field">
              <TextField
                {...SHARED_TEXT_FIELD_PROPS}
                label="Section Name"
                name="sectionsName"
                value={sectionsData.sectionsName || ''}
                onChange={handleTextChange}
                inputProps={{ maxLength: MAX_TEXT_LENGTH }}
                required
                error={!!validationErrors.sectionsName || hasLetterError(sectionsData.sectionsName)}
                helperText={getHelperText(sectionsData.sectionsName, validationErrors.sectionsName)}
                disabled={loading}
             
              />
            </div>

            {/* Alias Name — no special chars, max 30, min 1 letter */}
            <div className="form-field">
              <TextField
                {...SHARED_TEXT_FIELD_PROPS}
                label="Alias Name"
                name="aliasName"
                value={sectionsData.aliasName || ''}
                onChange={handleTextChange}
                inputProps={{ maxLength: MAX_TEXT_LENGTH }}
                required
                error={!!validationErrors.aliasName || hasLetterError(sectionsData.aliasName)}
                helperText={getHelperText(sectionsData.aliasName, validationErrors.aliasName)}
                disabled={loading}
              
              />
            </div>

            {/* Code — unchanged except min 1 letter check */}
            <div className="form-field">
              <TextField
                {...SHARED_TEXT_FIELD_PROPS}
                label="Code"
                name="code"
                value={sectionsData.code || ''}
                onChange={handleChange}
                error={!!validationErrors.code || hasLetterError(sectionsData.code)}
                helperText={getHelperText(sectionsData.code, validationErrors.code)}
                disabled={loading}
               
              />
            </div>
          </div>
        </div>

        {/* ── Row 2: Location · Address ── */}
      <div className="form-section section-dialog-secondary-fields">
  <div className="form-grid">
            {/* Location */}
            <div className="form-field">
              <TextField
                {...SHARED_TEXT_FIELD_PROPS}
                label="Location"
                name="location"
                value={sectionsData.location || ''}
                onChange={handleChange}
                error={!!validationErrors.location || hasLetterError(sectionsData.location)}
                helperText={getHelperText(sectionsData.location, validationErrors.location)}
                disabled={loading}
              
              />
            </div>

            {/* Address */}
          <div className="form-field">
              <TextField
                {...SHARED_TEXT_FIELD_PROPS}
                label="Address"
                name="address"
                value={sectionsData.address || ''}
                onChange={handleChange}
                error={!!validationErrors.address || hasLetterError(sectionsData.address)}
                helperText={getHelperText(sectionsData.address, validationErrors.address)}
                disabled={loading}
             
              />
            </div>
          </div>
        </div>
      </DialogContent>

      <DialogActions className="dialog-actions">
        <button
          onClick={handleClose}
          disabled={loading}
          className="btn-secondary"
        >
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          className="btn-primary"
          disabled={isSubmitDisabled}
        >
          {loading ? (
            <CircularProgress size={24} />
          ) : mode === 'edit' ? (
            'Update'
          ) : (
            'Create'
          )}
        </button>
      </DialogActions>
    </Dialog>
  );
};

export default SectionsDialog;