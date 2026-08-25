
'use client';
import React, { useEffect, useRef } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Autocomplete,
  Typography,
  CircularProgress,
  Checkbox,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Grid,
} from '@mui/material';
import { Item } from '../Models/mixboxModels';

// ─── Types ────────────────────────────────────────────────────────────────────

interface MixBox {
  id: string;
  mixboxName: string;
  totalGrams: string;
  items: Item[];
  status: string;
}

interface BranchwiseItems {
  varianceName: string;
  variance_Uom: string;
}

interface MixBoxDialogProps {
  open: boolean;
  handleClose: (reason: 'backdropClick' | 'escapeKeyDown') => void;
  handleSubmit: () => void;
  mixBoxData: MixBox;
  handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  onVarianceChange: (event: any, newValue: string[]) => void;
  validationErrors: {
    mixboxName: string;
    items: string;
    totalGrams: string;
  };
  gramsError: string;
  setGramsError: (error: string) => void;
  items: Item[];
  setItems: (items: Item[]) => void;
  product: BranchwiseItems[];
  mode: 'add' | 'edit';
  isSubmitting: boolean;
  hasMoreItems: boolean;
  isFetchingItems: boolean;
  onLoadMoreItems: () => void;
  onSearchItems: (query: string) => void;
  onOpen: () => void;
  onClearSearch: () => void;
  varianceSearchQuery: string;
  setVarianceSearchQuery: (query: string) => void;
  handleItemChange: (index: number, field: keyof Item, value: string) => void;
}

// ─── Validation helpers ───────────────────────────────────────────────────────

const HAS_LETTER_RE = /[a-zA-Z]/;
const ALLOWED_CHARS_RE = /[^a-zA-Z0-9\s\-.,]/g;
const TOTAL_GRAMS_RE = /^[0-9]{0,4}$/;
const ITEM_GRAMS_RE = /^\d{0,4}$/;

/** Returns an error message if the value has no letter, otherwise falls back to the parent error. */
const getHelperText = (value: string, parentError: string): string =>
  value && !HAS_LETTER_RE.test(value) ? 'Must contain at least one letter' : parentError;

/** Returns true if field has a value but contains no letter — used for error highlight & submit guard. */
const hasLetterError = (value: string): boolean => !!value && !HAS_LETTER_RE.test(value);

/** Strips disallowed special chars, caps at 30 chars, then forwards a synthetic event to the parent handler. */
const createTextHandler =
  (handleChange: (e: React.ChangeEvent<HTMLInputElement>) => void) =>
  (e: React.ChangeEvent<HTMLInputElement>) => {
    const filtered = e.target.value.replace(ALLOWED_CHARS_RE, '').slice(0, 30);
    handleChange({
      ...e,
      target: { ...e.target, value: filtered, name: e.target.name },
    } as React.ChangeEvent<HTMLInputElement>);
  };

// ─── Shared sx presets ────────────────────────────────────────────────────────

const noSpinnerSx = {
  '& input[type=number]::-webkit-outer-spin-button, & input[type=number]::-webkit-inner-spin-button': {
    WebkitAppearance: 'none',
    margin: 0,
  },
  '& input[type=number]': { MozAppearance: 'textfield' },
} as const;

const tableHeaderCellSx = {
  backgroundColor: '#f5f5f5',
  fontWeight: 'bold',
  fontFamily: "'Poppins', sans-serif",
} as const;

const tableBodyCellSx = { fontFamily: "'Poppins', sans-serif" } as const;

const optionTypographySx = {
  fontSize: '12px',
  minHeight: '16px',
  paddingY: '8px',
  fontFamily: "'Poppins', sans-serif",
} as const;

const checkboxSx = {
  '& .MuiSvgIcon-root': { fontSize: 28 },
  transform: 'scale(0.8)',
  padding: '8px',
} as const;

// ─── Component ────────────────────────────────────────────────────────────────

const MixBoxDialog: React.FC<MixBoxDialogProps> = ({
  open,
  handleClose,
  handleSubmit,
  mixBoxData,
  handleChange,
  onVarianceChange,
  validationErrors,
  gramsError,
  items,
  product,
  mode,
  isSubmitting,
  hasMoreItems,
  isFetchingItems,
  onLoadMoreItems,
  onSearchItems,
  onOpen,
  onClearSearch,
  varianceSearchQuery,
  setVarianceSearchQuery,
  handleItemChange,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const handleTextChange = createTextHandler(handleChange);

  // Auto-focus / select on open
  useEffect(() => {
    if (!open) return;
    const timer = setTimeout(() => {
      inputRef.current?.focus();
      if (mixBoxData.id) inputRef.current?.select();
    }, 100);
    return () => clearTimeout(timer);
  }, [open, mixBoxData.id]);

  // Only show variances matching the current search query
  const filteredVariances = product
    .filter((v) => v.varianceName?.toLowerCase().includes(varianceSearchQuery.toLowerCase()))
    .map((v) => v.varianceName);

  const isSubmitDisabled =
    isSubmitting ||
    !mixBoxData.mixboxName.trim() ||
    !mixBoxData.totalGrams ||
    hasLetterError(mixBoxData.mixboxName);

  return (
<Dialog
  open={open}
  onClose={handleClose}
  maxWidth="lg"
  fullWidth
  className="mixbox-form-dialog"
  PaperProps={{
    className: 'dialog-paper-medium mixbox-dialog-paper',
  }}
      TransitionProps={{
        onEntered: () => {
          inputRef.current?.focus();
          if (mixBoxData.id) inputRef.current?.select();
        },
      }}
    >
      <DialogTitle className="dialog-title">
        {mode === 'edit' ? 'Edit Mix Box' : 'Add Mix Box'}
      </DialogTitle>

      <DialogContent dividers className="dialog-content">
        {/* ── Row 1: Mix Box Name · Total Grams · Select Items ── */}
<div className="form-section mixbox-dialog-fields-section">
  <Grid container spacing={2} alignItems="flex-start">
            {/* Mix Box Name */}
            <Grid item xs={12} sm={4}>
              <div className="form-field">
                <TextField
                  name="mixboxName"
                  label="Mix Box Name *"
                  autoComplete="off"
                  fullWidth
                  size="small"
                  value={mixBoxData.mixboxName}
                  onChange={handleTextChange}
                  inputProps={{ maxLength: 30 }}
                  inputRef={inputRef}
                  error={!!validationErrors.mixboxName || hasLetterError(mixBoxData.mixboxName)}
                  helperText={getHelperText(mixBoxData.mixboxName, validationErrors.mixboxName)}
                  disabled={isSubmitting}
                  className="custom-textfield"
                  InputLabelProps={{ className: 'custom-label' }}
                  InputProps={{ className: 'custom-input' }}
                />
              </div>
            </Grid>

            {/* Total Grams */}
            <Grid item xs={12} sm={3}>
              <div className="form-field">
                <TextField
                  name="totalGrams"
                  label="Total Grams *"
                  type="number"
                  autoComplete="off"
                  fullWidth
                  size="small"
                  value={mixBoxData.totalGrams}
                  onChange={(e) => {
                    const { value } = e.target;
                    if (value === '' || TOTAL_GRAMS_RE.test(value)) handleChange(e);
                  }}
                  error={!!validationErrors.totalGrams}
                  helperText={validationErrors.totalGrams}
                  disabled={isSubmitting}
                  className="custom-textfield"
                  InputLabelProps={{ className: 'custom-label' }}
                  InputProps={{ className: 'custom-input' }}
                  sx={noSpinnerSx}
                />
              </div>
            </Grid>

            {/* Select Items */}
            <Grid item xs={12} sm={5}>
              <div className="form-field">
                <Autocomplete
                  multiple
                  disableCloseOnSelect
                  id="variance-autocomplete"
                  options={filteredVariances}
                  value={items.map((item) => item.item_name)}
                  onChange={onVarianceChange}
                  onInputChange={(_, newInputValue, reason) => {
                    if (reason !== 'input') return;
                    if (newInputValue) {
                      setVarianceSearchQuery(newInputValue);
                      onSearchItems(newInputValue);
                    } else {
                      setVarianceSearchQuery('');
                      onClearSearch();
                    }
                  }}
                  inputValue={varianceSearchQuery}
                  onOpen={onOpen}
                  loading={isFetchingItems}
                  disabled={isSubmitting}
                  getOptionLabel={(option) => option ?? ''}
                  renderTags={(value) => (
                    <Typography variant="body2" sx={optionTypographySx}>
                      {value.length}&nbsp;selected
                    </Typography>
                  )}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Select Items *"
                      placeholder={items.length === 0 ? 'Search items...' : ''}
                      size="small"
                      error={!!validationErrors.items}
                      helperText={validationErrors.items}
                      className="custom-textfield"
                      InputLabelProps={{ className: 'custom-label' }}
                      onKeyDown={(e) => {
                        if (e.key === 'Backspace') e.stopPropagation();
                      }}
                      InputProps={{
                        ...params.InputProps,
                        className: 'custom-input',
                        endAdornment: (
                          <>
                            {isFetchingItems && <CircularProgress size={20} />}
                            {params.InputProps.endAdornment}
                          </>
                        ),
                      }}
                    />
                  )}
                  renderOption={(props, option, { selected }) => (
                    <li {...props} key={option}>
                      <Checkbox checked={selected} size="small" sx={checkboxSx} />
                      <Typography variant="body2" sx={optionTypographySx}>
                        {option}
                      </Typography>
                    </li>
                  )}
                  ListboxProps={{
                    onScroll: (event: React.SyntheticEvent) => {
                      const node = event.currentTarget;
                      if (
                        node.scrollTop + node.clientHeight >= node.scrollHeight - 50 &&
                        hasMoreItems &&
                        !isFetchingItems
                      ) {
                        onLoadMoreItems();
                      }
                    },
                    style: { maxHeight: 220 },
                  }}
                />
              </div>
            </Grid>
          </Grid>
        </div>

        {/* ── Row 2: Items & Grams Table ── */}
       <div className="form-section mixbox-dialog-items-section">
          <Typography variant="subtitle2" className="form-section-title">
            Items &amp; Grams
          </Typography>

          {gramsError && (
            <Typography color="error" variant="body2" sx={{ mb: 1, ml: 1 }}>
              {gramsError}
            </Typography>
          )}

         <TableContainer
  className="mixbox-dialog-items-table"
  sx={{
              maxHeight: 280,
              border: '1px solid #e5e7eb',
              borderRadius: '0.375rem',
              overflow: 'auto',
            }}
          >
            <Table stickyHeader size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={tableHeaderCellSx}>Item Name</TableCell>
                  <TableCell sx={tableHeaderCellSx}>UOM</TableCell>
                  <TableCell sx={{ ...tableHeaderCellSx, textAlign: 'center' }}>Grams</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {items.length > 0 ? (
                  items.map((item, index) => (
                    <TableRow key={index} hover>
                      <TableCell sx={tableBodyCellSx}>{item.item_name}</TableCell>
                      <TableCell sx={tableBodyCellSx}>{item.uom || '-'}</TableCell>
                      <TableCell>
                        <TextField
                          type="text"
                          autoComplete="off"
                          inputMode="numeric"
                          value={item.grams || ''}
                          onChange={(e) => {
                            if (ITEM_GRAMS_RE.test(e.target.value)) {
                              handleItemChange(index, 'grams', e.target.value);
                            }
                          }}
                          onWheel={(e) => (e.target as HTMLInputElement).blur()}
                          size="small"
                          fullWidth
                          disabled={isSubmitting}
                          className="custom-textfield"
                          InputProps={{ className: 'custom-input' }}
                          sx={{
                            '& input': { textAlign: 'center', fontSize: '0.875rem' },
                            '& input::-webkit-outer-spin-button, & input::-webkit-inner-spin-button': {
                              WebkitAppearance: 'none',
                            },
                            '& input[type=number]': { MozAppearance: 'textfield' },
                          }}
                        />
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={3} align="center" sx={{ py: 4 }}>
                      <Typography variant="body2" color="textSecondary">
                        No items selected yet
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </div>
      </DialogContent>

      <DialogActions className="dialog-actions">
        <button
          type="button"
          onClick={() => handleClose('escapeKeyDown')}
          className="btn-secondary"
          disabled={isSubmitting}
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          className="btn-primary"
          disabled={isSubmitDisabled}
        >
          {isSubmitting ? (
            <CircularProgress size={20} />
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

export default MixBoxDialog;