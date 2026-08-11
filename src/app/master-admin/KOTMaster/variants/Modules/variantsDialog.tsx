
'use client';
import React, { useEffect, useRef, useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Autocomplete,
  Typography,
  CircularProgress,
  Checkbox,
  IconButton,
  Box,
  List,
  ListItemButton,
  ListItemText,
  Paper,
} from '@mui/material';
import {
  Clear as ClearIcon,
  ArrowBack as ArrowBackIcon,
  DeleteSweep as DeleteSweepIcon,
} from '@mui/icons-material';
import { BranchwiseItems } from '../Models/variantModel';

interface Variant {
  id: string;
  variant: string;
  status: string;
  variantId: string;
  variantItems: string[];
}

interface VariantDialogProps {
  open: boolean;
  handleClose: (reason: 'backdropClick' | 'escapeKeyDown') => void;
  handleSubmit: () => void;
  variantData: Variant;
  handleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onVariancesChange: (event: React.SyntheticEvent, newValue: string[]) => void;
  validationErrors: {
    variant: string;
    variantItems: string;
  };
  product: BranchwiseItems[];
  mode: 'add' | 'edit';
  isSubmitting: boolean;
  hasMoreVariances: boolean;
  isFetchingVariances: boolean;
  onLoadMoreVariances: () => void;
  onSearchVariances: (query: string) => void;
  onOpen: () => void;
  onClearSearch: () => void;
  selectedVarianceNames: string[];
}



// ─── Validation helpers ───────────────────────────────────────────────────────

// At least one letter required
const hasLetter = /[a-zA-Z]/;

// Shows "Must contain at least one letter" if value has no letter,
// otherwise returns the parent validation error
const getHelperText = (value: string, parentError: string): string => {
  if (value && !hasLetter.test(value)) return 'Must contain at least one letter';
  return parentError;
};

// Returns true if field has a value but no letter — used for error highlight + submit block
const hasLetterError = (value: string): boolean =>
  !!value && !hasLetter.test(value);

// Strips all special chars (keeps letters, digits, spaces, - . ,) and caps at 30,
// then forwards a synthetic event to the parent handler
const createTextHandler = (
  handleChange: (e: React.ChangeEvent<HTMLInputElement>) => void
) => (e: React.ChangeEvent<HTMLInputElement>) => {
  const filtered = e.target.value
    .replace(/[^a-zA-Z0-9\s\-.,]/g, '')
    .slice(0, 30);
  const syntheticEvent = {
    ...e,
    target: { ...e.target, value: filtered, name: e.target.name },
  } as React.ChangeEvent<HTMLInputElement>;
  handleChange(syntheticEvent);
};


const VariantDialog: React.FC<VariantDialogProps> = ({
  open,
  handleClose,
  handleSubmit,
  variantData,
  handleChange,
  onVariancesChange,
  validationErrors,
  product,
  mode,
  isSubmitting,
  hasMoreVariances,
  isFetchingVariances,
  onLoadMoreVariances,
  onSearchVariances,
  onOpen,
  onClearSearch,
  selectedVarianceNames,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleTextChange = createTextHandler(handleChange);


  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [highlightedSelected, setHighlightedSelected] = useState<string[]>([]);

  // Focus variant name field on open
  useEffect(() => {
    if (open && inputRef.current) {
      const timer = setTimeout(() => {
        inputRef.current?.focus();
        if (variantData.id) inputRef.current?.select();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [open, variantData.id]);

  // Sync selected items when dialog opens / selectedVarianceNames change
  useEffect(() => {
    if (open) {
      setSelectedItems(selectedVarianceNames || []);
      setHighlightedSelected([]);
    }
  }, [open, selectedVarianceNames]);

  const filteredVariances = product
    .filter((v) => v.varianceName != null)
    .map((v) => v.varianceName!);

  const handleAutocompleteChange = (event: React.SyntheticEvent, newValue: string[]) => {
    setSelectedItems(newValue);
    setHighlightedSelected([]);
    onVariancesChange(event, newValue);
  };

  const handleToggleSelected = (item: string) => {
    setHighlightedSelected((prev) =>
      prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item]
    );
  };

  const handleRemoveItems = () => {
    if (highlightedSelected.length === 0) return;
    const newSelected = selectedItems.filter((i) => !highlightedSelected.includes(i));
    setSelectedItems(newSelected);
    setHighlightedSelected([]);
    onVariancesChange({} as React.SyntheticEvent, newSelected);
  };

  const handleRemoveAll = () => {
    setSelectedItems([]);
    setHighlightedSelected([]);
    onVariancesChange({} as React.SyntheticEvent, []);
  };

  const handleInputChange = (event: any, newInputValue: string, reason: string) => {
    if (reason === 'input') {
      setSearchQuery(newInputValue);
      if (newInputValue) onSearchVariances(newInputValue);
      else onClearSearch();
    }
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    onClearSearch();
  };

  return (
    <Dialog
    className="kot-master-dialog"
      open={open}
      onClose={handleClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        className: "dialog-paper-big"
      }}
    >
      <DialogTitle className='dialog-title'>
        {mode === 'edit' ? 'Edit' : 'Add'} Variant
      </DialogTitle>

      <DialogContent className='dialog-content'>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
          {/* Variant Name */}
          <Box sx={{ flex: '0 0 180px' }}>
            <TextField
              autoFocus
              autoComplete='off'
              margin="dense"
              label="Variant Name"
              name="variant"
              value={variantData.variant}
              onChange={handleTextChange}
              inputProps={{ maxLength: 30 }}
              fullWidth
              required
              inputRef={inputRef}
              error={!!validationErrors.variant || hasLetterError(variantData.variant)}
              helperText={ getHelperText(variantData.variant, validationErrors.variant)}
              disabled={isSubmitting}
              className="custom-textfield"
              InputLabelProps={{ className: "custom-label" }}
              InputProps={{ className: "custom-input" }}
            />
          </Box>

          {/* Select Variances with Paper Box */}
          <Box sx={{ minWidth: '290px', display: 'flex', flexDirection: 'column' }}>
            <Paper
              variant="outlined"
              sx={{
                height: 380,
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                borderRadius: '0.375rem',
                borderColor: 'rgb(209, 213, 219)',
                p: 1.5,
              }}
            >
              <Autocomplete
                multiple
                options={filteredVariances}
                getOptionLabel={(option) => option}
                value={selectedItems}
                onChange={handleAutocompleteChange}
                onInputChange={handleInputChange}
                onOpen={onOpen}
                disableCloseOnSelect
                disabled={isSubmitting}
                filterOptions={(x) => x}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Select Variances"
                    placeholder={selectedItems.length === 0 ? "Search and select variances" : ""}
                    margin="none"
                    fullWidth
                    error={!!validationErrors.variantItems}
                    helperText={validationErrors.variantItems}
                    className="custom-textfield"
                    InputLabelProps={{ className: "custom-label" }}
                    onKeyDown={(e) => {
                      if (e.key === 'Backspace') {
                        e.stopPropagation();
                      }
                    }}
                    InputProps={{
                      ...params.InputProps,
                      className: "custom-input",
                      endAdornment: (
                        <>
                          {isFetchingVariances && <CircularProgress size={20} sx={{ mr: 1 }} />}
                          {/* {searchQuery && (
                            <IconButton size="small" onClick={handleClearSearch} sx={{ mr: 1 }}>
                              <ClearIcon />
                            </IconButton>
                          )} */}
                          {params.InputProps.endAdornment}
                        </>
                      ),
                    }}
                    inputProps={{
                      ...params.inputProps,
                      style: {
                        ...params.inputProps?.style,
                        paddingTop: 0,
                        paddingBottom: 0,
                        lineHeight: "normal",
                      },
                    }}
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        minHeight: "45px",
                        alignItems: "center",
                      },
                      "& .MuiOutlinedInput-input::placeholder": {
                        opacity: 0.7,
                      },
                    }}
                  />
                )}
                renderTags={(value) => (
                  <Typography
                    sx={{
                      fontSize: '12px',
                      minHeight: '16px',
                      paddingY: '8px',
                      fontFamily: "'Poppins', sans-serif",
                    }}
                    >
                    {value.length}selected
                  </Typography>
                )}
                renderOption={(props, option, { selected }) => (
                  <li {...props}>
                    <Checkbox
                      checked={selected}
                      sx={{
                        "& .MuiSvgIcon-root": { fontSize: 20 },
                        padding: "6px",
                      }}
                    />
                    <Typography variant="body2"
                      sx={{
                        fontSize: '12px',
                        minHeight: '16px',
                        paddingY: '8px',
                        fontFamily: "'Poppins', sans-serif",
                      }}
                    >
                      {option}
                    </Typography>
                  </li>
                )}
                ListboxProps={{
                  onScroll: (event: React.SyntheticEvent) => {
                    const listbox = event.currentTarget;
                    if (
                      listbox.scrollTop + listbox.clientHeight >= listbox.scrollHeight - 50 &&
                      hasMoreVariances &&
                      !isFetchingVariances
                    ) {
                      onLoadMoreVariances();
                    }
                  },
                  style: {
                    maxHeight: 300,
                    overflow: 'auto',
                  },
                }}
                sx={{
                  '& .MuiAutocomplete-popper': {
                    marginTop: '4px !important',
                  }
                }}
              />
            </Paper>
          </Box>

          {/* Action Buttons */}
          <Box sx={{ flex: '0 0 auto', display: 'flex', flexDirection: 'column', gap: 1, pt: 1, alignSelf: 'center' }}>
            <button
              onClick={handleRemoveItems}
              disabled={highlightedSelected.length === 0 || isSubmitting}
              className='btn-primary'
              style={{ fontSize: '0.75rem', padding: '0.4rem 0.8rem', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <ArrowBackIcon sx={{ fontSize: '1rem', mr: 0.5 }} />
              Remove
            </button>
            <button
              onClick={handleRemoveAll}
              disabled={selectedItems.length === 0 || isSubmitting}
              className='btn-primary-delete'
              style={{ fontSize: '0.75rem', padding: '0.4rem 0.8rem', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <DeleteSweepIcon sx={{ fontSize: '1rem', mr: 0.5 }} />
              Remove All
            </button>
          </Box>

          {/* Selected Items List */}
          <Box sx={{ flex: '0 0 280px' }}>
            <Typography
              variant="subtitle2"
              gutterBottom
              sx={{
                fontSize: '0.813rem',
                fontWeight: 600,
                color: 'rgb(55, 65, 81)',
                mb: 0,
                mt: 0,
              }}
            >
              Selected Items ({selectedItems.length})
            </Typography>
            <Paper
              variant="outlined"
              sx={{
                height: 360,
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                borderRadius: '0.375rem',
                borderColor: 'rgb(209, 213, 219)',
              }}
            >
              <List
                dense
                disablePadding
                sx={{
                  overflowY: 'auto',
                  overflowX: 'hidden',
                  scrollbarWidth: 'thin',
                  '&::-webkit-scrollbar': { width: '6px' },
                  '&::-webkit-scrollbar-thumb': {
                    background: 'rgba(0,0,0,0.3)',
                    borderRadius: '3px',
                  },
                }}
              >
                {selectedItems.length === 0 ? (
                  <ListItemButton disabled>
                    <ListItemText
                      primary="No items selected"
                      primaryTypographyProps={{
                        color: 'text.secondary',
                        fontSize: '0.813rem',
                      }}
                      sx={{ textAlign: 'center', my: 2 }}
                    />
                  </ListItemButton>
                ) : (
                  selectedItems.map((item) => (
                    <ListItemButton
                      key={item}
                      selected={highlightedSelected.includes(item)}
                      onClick={() => handleToggleSelected(item)}
                      disabled={isSubmitting}
                      sx={{
                        py: 0.75,
                        minHeight: 42,
                        transition: 'background-color 0.2s',
                        '&:hover': {
                          backgroundColor: 'rgb(249, 250, 251)',
                        },
                      }}
                    >
                      <Checkbox
                        edge="start"
                        checked={highlightedSelected.includes(item)}
                        tabIndex={-1}
                        disableRipple
                        sx={{
                          "& .MuiSvgIcon-root": { fontSize: 20 },
                          padding: "6px",
                        }}
                      />
                      <ListItemText
                        primary={item}
                        primaryTypographyProps={{
                          variant: 'body2',
                          noWrap: true,
                          fontSize: '0.713rem',
                          fontFamily: "'Poppins', sans-serif",
                        }}
                      />
                    </ListItemButton>
                  ))
                )}
              </List>
            </Paper>
          </Box>
        </Box>
      </DialogContent>

      <DialogActions className='dialog-actions'>
        <button
          onClick={() => handleClose('escapeKeyDown')}
          disabled={isSubmitting}
          className='btn-secondary'
        >
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          disabled={isSubmitting || !variantData.variant.trim() || hasLetterError(variantData.variant)}
          className='btn-primary'
        >
          {isSubmitting ? <CircularProgress size={20} sx={{ color: 'white' }} /> : mode === 'edit' ? 'Update' : 'Create'}
        </button>
      </DialogActions>
    </Dialog>
  );
};

export default VariantDialog;