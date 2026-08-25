
'use client';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
import { Category } from '../Models/categoryModels';

interface Subcategory {
  subCategoryName: string;
}

interface CategoryDialogProps {
  open: boolean;
  onClose: (reason: 'backdropClick' | 'escapeKeyDown') => void;
  onSubmit: () => void;
  categoryData: Category;
  onFieldChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSubcategoryChange: (event: React.SyntheticEvent, subCategoryNames: string[]) => void;
  mode: 'add' | 'edit';
  isSubmitting: boolean;
  validationErrors: {
    categoryName: string;
    subCategory: string;
  };
  allSubcategories: Subcategory[];
  hasMore: boolean;
  isFetching: boolean;
  onLoadMore: () => void;
  onSearch: (query: string) => void;
  onOpen: () => void;
  onClearSearch: () => void;
}

// ─── Validation helpers (outside component — created once, never recreated) ───

const hasLetter = /[a-zA-Z\s\-.,&/]/;
const ALLOWED_CHARS_RE = /[^a-zA-Z\s\-.,&/]/g;
const TEXT_MAX_LENGTH = 30;

const getHelperText = (value: string, parentError: string): string => {
  if (value && !hasLetter.test(value)) return 'Must contain at least one letter';
  return parentError;
};

const hasLetterError = (value: string): boolean =>
  !!value && !hasLetter.test(value);

const sanitizeCategoryName = (value: string): string =>
  value.replace(ALLOWED_CHARS_RE, '').slice(0, TEXT_MAX_LENGTH);

// ─────────────────────────────────────────────────────────────────────────────

const CategoryDialog: React.FC<CategoryDialogProps> = ({
  open,
  onClose,
  onSubmit,
  categoryData,
  onFieldChange,
  onSubcategoryChange,
  validationErrors,
  mode,
  isSubmitting,
  allSubcategories,
  hasMore,
  isFetching,
  onLoadMore,
  onSearch,
  onOpen,
  onClearSearch,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [highlightedSelected, setHighlightedSelected] = useState<string[]>([]);

  // Focus category name field on open
  useEffect(() => {
    if (open && inputRef.current) {
      const timer = setTimeout(() => {
        inputRef.current?.focus();
        if (mode === 'edit') {
          inputRef.current?.select();
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [open, mode]);

  // Sync selected subcategories when dialog opens or data changes
  useEffect(() => {
    if (open) {
      setSelectedItems(categoryData.subCategory || []);
      setHighlightedSelected([]);
    }
  }, [open, categoryData.subCategory]);

  // Memoized — only recalculates when allSubcategories changes
  const options = useMemo(
    () => allSubcategories.map((s) => s.subCategoryName),
    [allSubcategories]
  );

  // Stable sanitized field change handler
  const handleCategoryNameChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const filtered = sanitizeCategoryName(e.target.value);
      const syntheticEvent = {
        ...e,
        target: { ...e.target, value: filtered, name: e.target.name },
      } as React.ChangeEvent<HTMLInputElement>;
      onFieldChange(syntheticEvent);
    },
    [onFieldChange]
  );

  const handleAutocompleteChange = useCallback(
    (event: React.SyntheticEvent, newValue: string[]) => {
      setSelectedItems(newValue);
      setHighlightedSelected([]);
      onSubcategoryChange(event, newValue);
    },
    [onSubcategoryChange]
  );

  const handleToggleSelected = useCallback((item: string) => {
    setHighlightedSelected((prev) =>
      prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item]
    );
  }, []);

  const handleRemoveItems = useCallback(() => {
    if (highlightedSelected.length === 0) return;
    const newSelected = selectedItems.filter((i) => !highlightedSelected.includes(i));
    setSelectedItems(newSelected);
    setHighlightedSelected([]);
    onSubcategoryChange({} as React.SyntheticEvent, newSelected);
  }, [highlightedSelected, selectedItems, onSubcategoryChange]);

  const handleRemoveAll = useCallback(() => {
    setSelectedItems([]);
    setHighlightedSelected([]);
    onSubcategoryChange({} as React.SyntheticEvent, []);
  }, [onSubcategoryChange]);

  const handleInputChange = useCallback(
    (_: any, newInputValue: string, reason: string) => {
      if (reason === 'input') {
        setSearchQuery(newInputValue);
        if (newInputValue) onSearch(newInputValue);
        else onClearSearch();
      } else if (reason === 'reset' || reason === 'clear') {
        setSearchQuery('');
        onClearSearch();
      }
    },
    [onSearch, onClearSearch]
  );

  const handleClearSearch = useCallback(() => {
    setSearchQuery('');
    onClearSearch();
  }, [onClearSearch]);

  // Memoized submit disabled guard
  const isSubmitDisabled = useMemo(
    () => isSubmitting || !categoryData.categoryName.trim() || hasLetterError(categoryData.categoryName),
    [isSubmitting, categoryData.categoryName]
  );

  // Memoized scroll handler to avoid recreating on every render
  const handleListboxScroll = useCallback(
    (event: React.SyntheticEvent) => {
      const listbox = event.currentTarget;
      if (
        listbox.scrollTop + listbox.clientHeight >= listbox.scrollHeight - 50 &&
        hasMore &&
        !isFetching
      ) {
        onLoadMore();
      }
    },
    [hasMore, isFetching, onLoadMore]
  );

  // Stable ListboxProps object — prevents Autocomplete re-render on every parent render
  const listboxProps = useMemo(
    () => ({
      onScroll: handleListboxScroll,
      style: { maxHeight: 300, overflow: 'auto' } as React.CSSProperties,
    }),
    [handleListboxScroll]
  );

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      className="category-form-dialog"
      PaperProps={{
        className: "dialog-paper-big"
      }}
    >
      <DialogTitle className='dialog-title'>
        {mode === 'edit' ? 'Edit Category' : 'Add Category'}
      </DialogTitle>

      <DialogContent className='dialog-content'>
        <Box className="category-dialog-layout" sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>

          {/* Category Name — no special chars, max 30, min 1 letter */}
         <Box className="category-name-column" sx={{ flex: '0 0 250px' }}>
            <TextField
              autoFocus
              autoComplete='off'
              margin="dense"
              label="Category Name"
              name="categoryName"
              value={categoryData.categoryName}
              onChange={handleCategoryNameChange}
              fullWidth
              required
              inputRef={inputRef}
              inputProps={{ maxLength: 30 }}
              error={!!validationErrors.categoryName || hasLetterError(categoryData.categoryName)}
              helperText={getHelperText(categoryData.categoryName, validationErrors.categoryName)}
              disabled={isSubmitting}
              className="custom-textfield"
              InputLabelProps={{ className: "custom-label" }}
              InputProps={{ className: "custom-input" }}
            />
          </Box>

          {/* Select Subcategories — unchanged */}
         <Box className="category-select-column" sx={{ flex: '0 0 320px', display: 'flex', flexDirection: 'column' }}>
            <Paper
              variant="outlined"
               className="category-select-panel"
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
                options={options}
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
                    label="Select Subcategories"
                    placeholder={selectedItems.length === 0 ? "Search and select subcategories" : ""}
                    margin="none"
                    fullWidth
                    error={!!validationErrors.subCategory}
                    helperText={validationErrors.subCategory}
                    className="custom-textfield"
                    InputLabelProps={{
                      className: "custom-label",
                      shrink: true
                    }}
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
                          {isFetching && <CircularProgress size={20} sx={{ mr: 1 }} />}
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
                        height: "45px",
                        alignItems: "center",
                      },
                      "& .MuiOutlinedInput-input": {
                        height: "auto !important",
                      },
                      "& .MuiOutlinedInput-input::placeholder": {
                        opacity: 0.7,
                      },
                      "& .MuiFormHelperText-root": {
                        position: "absolute",
                        bottom: "-20px",
                        margin: 0,
                      }
                    }}
                  />
                )}
                renderTags={(value) => (
                  <Typography
                    sx={{
                      fontSize: '12px',
                      minHeight: '16px',
                      height: '16px',
                      paddingY: 0,
                      lineHeight: '16px',
                      fontFamily: "'Poppins', sans-serif",
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {value.length} selected
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
                ListboxProps={listboxProps}
                sx={{
                  "& .MuiAutocomplete-popupIndicator": {
                    transform: "none !important",
                  },
                }}
              />
            </Paper>
          </Box>

          {/* Action Buttons — unchanged */}
        <Box className="category-transfer-actions" sx={{ flex: '0 0 auto', display: 'flex', flexDirection: 'column', gap: 1, pt: 1, alignSelf: 'center' }}>
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

          {/* Selected Items List — unchanged */}
         <Box className="category-selected-column" sx={{ flex: '0 0 280px' }}>
            <Typography
              variant="subtitle2"
              gutterBottom
              sx={{
                fontSize: '0.813rem',
                fontWeight: 600,
                color: 'rgb(55, 65, 81)',
                mb: 0,
                mt: 0,
                height: '20px',
              }}
            >
              Selected Subcategories ({selectedItems.length})
            </Typography>
            <Paper
              variant="outlined"
               className="category-selected-panel"
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
                      primary="No subcategories selected"
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
          onClick={() => onClose('escapeKeyDown')}
          disabled={isSubmitting}
          className='btn-secondary'
        >
          Cancel
        </button>
        <button
          onClick={onSubmit}
          disabled={isSubmitDisabled}
          className='btn-primary'
        >
          {isSubmitting ? <CircularProgress size={20} sx={{ color: 'white' }} /> : mode === 'edit' ? 'Update' : 'Create'}
        </button>
      </DialogActions>
    </Dialog>
  );
};

export default CategoryDialog;
