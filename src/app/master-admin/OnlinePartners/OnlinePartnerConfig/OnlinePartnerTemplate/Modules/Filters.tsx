


import React, { useMemo, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box, Button, TextField, FormControl, InputLabel, Select, MenuItem, Checkbox,
  ListItemText, Autocomplete, IconButton, Typography, CircularProgress, SelectChangeEvent,
  ListSubheader, Dialog, DialogTitle, DialogContent, Table, TableCell, TableHead,
  TableRow, TableBody, DialogActions
} from '@mui/material';
import DescriptionIcon from "@mui/icons-material/Description";
import { Delete as DeleteIcon, GetApp as GetAppIcon, Upload as UploadIcon } from '@mui/icons-material';
import { AppDispatch, RootState } from '../../../../../../redux/store';
import {
  fetchSubcategoriesBy, fetchItem, fetchItems, resetItemsPagination, incrementItemsPage,
  setSearchQuery, addImportData, addDynamicImportData, fetchExportData, fetchDynamicPartnerData,
  setSnackbarMessage, setSnackbarOpen, fetchDynamicData, resetPagination, fetchTemplates, rollbackTemplates,
  Exportheader
} from '../Features/OnlineParnerTemplateSlice';
import { ImportResponse } from '../Models/templateModels';
import { SelectedItem } from '../Modules/OnlinePartnerTemplateComponent';
import { Divider } from '@mui/material';
import UndoIcon from '@mui/icons-material/Undo';

interface FilterActionBarProps {
  selectedType: 'template' | 'dynamic';
  partnerName: string;
  formData: { category: string[]; subCategory: string[]; varianceName: string[]; applyPercentage: string };
  setFormData: React.Dispatch<React.SetStateAction<{ category: string[]; subCategory: string[]; varianceName: string[]; applyPercentage: string }>>;
  validationErrors: { percentage: string; category: string; subCategory: string; varianceName: string; applyPercentage: string };
  setValidationErrors: React.Dispatch<React.SetStateAction<{ percentage: string; category: string; subCategory: string; varianceName: string; applyPercentage: string }>>;
  temporaryItems: SelectedItem[];
  setTemporaryItems: React.Dispatch<React.SetStateAction<SelectedItem[]>>;
  selectedRows: string[];
  buttonLabel: string;
  hasOpenedCreateDialog: boolean;
  isFormValid: boolean;
  handleSubmit: () => void;
  handleCommonDeactivate: () => void;
  setAssignDialogOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setItemSearchQuery: React.Dispatch<React.SetStateAction<string>>;
  selectionOrder: string[];
  setSelectionOrder: React.Dispatch<React.SetStateAction<string[]>>;
  handleCreateTemplate: () => void;
  createTemplateDisabled: boolean;
}

const FilterActionBar: React.FC<FilterActionBarProps> = ({
  selectedType,
  partnerName,
  formData,
  setFormData,
  validationErrors,
  setValidationErrors,
  temporaryItems,
  setTemporaryItems,
  selectedRows,
  buttonLabel,
  isFormValid,
  handleSubmit,
  handleCommonDeactivate,
  setAssignDialogOpen,
  setItemSearchQuery,
  setSelectionOrder,
  handleCreateTemplate,
  createTemplateDisabled,
}) => {
  const dispatch = useDispatch<AppDispatch>();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importResultDialogOpen, setImportResultDialogOpen] = useState<boolean>(false);

  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [importMode, setImportMode] = useState<'add' | 'merge' | 'replace'>('add');
  const fileInputRef = useRef<HTMLInputElement>(null);



  const [importResults, setImportResults] = useState<{
    successful: Array<{ row: number; data: Record<string, string> }>;
    updated: Array<{ row: number; data: Record<string, string>; error?: string }>;
    failed: Array<{ row: number; column: string; value: string; error: string; severity: string }>;
    duplicates?: string[];
    message?: string;
    success?: boolean;
    imported_count?: number;
    errors_count?: number;
    error_summary?: {
      total_errors: number;
      total_warnings: number;
    };
  }>({
    successful: [],
    updated: [],
    failed: [],
    duplicates: [],
  });

  const {
    category, subCategory, filteredSubCategories, product, searchQuery,
    itemsPage, itemsTotalPages, isFetchingItems, hasMoreItems
  } = useSelector((state: RootState) => state.onlinePartnerTemplate);

  const currentItems = useSelector((state: RootState) =>
    selectedType === 'template'
      ? state.onlinePartnerTemplate.items
      : state.onlinePartnerTemplate.dynamic
  );
  const showDeactivated = useSelector((state: RootState) => state.onlinePartnerTemplate.showDeactivated);

  const usedItemNames = useMemo(() =>
    currentItems.map((item) => item.itemName.toLowerCase()),
    [currentItems]
  );

  // === HANDLE CATEGORY CHANGE ===
  const handleCategoryChange = (event: SelectChangeEvent<string[]>) => {
    const selectedCategories = event.target.value as string[];
    setFormData((prev) => ({ ...prev, category: selectedCategories, subCategory: [] }));
    dispatch(resetItemsPagination());
    if (selectedCategories.length > 0) {
      dispatch(fetchSubcategoriesBy(selectedCategories));
      dispatch(fetchItem({ category: selectedCategories }));
    } else {
      dispatch(fetchItems({ page: 1, limit: 50, search: '' }));
    }
  };

  // === HANDLE SUBCATEGORY CHANGE ===
  const handleSubCategoryChange = (event: SelectChangeEvent<string[]>) => {
    const selectedSubcategories = event.target.value as string[];
    setFormData((prev) => ({ ...prev, subCategory: selectedSubcategories }));
    if (selectedSubcategories.length > 0) {
      dispatch(fetchItem({ subcategory: selectedSubcategories }));
    }
  };

  // === HANDLE ITEM SELECTION ===
  const handleItemChange = (_event: React.SyntheticEvent, newValue: string[]) => {
    const percentage = parseFloat(formData.applyPercentage) || 0;
    if (percentage < 0 || percentage > 100) {
      setValidationErrors((prev) => ({
        ...prev,
        applyPercentage: 'Percentage must be between 0 and 100',
      }));
      return;
    }

    const newItems = newValue.filter((varianceName) => !temporaryItems.some((item) => item.itemName === varianceName));
    const newTemporaryItems = newItems.map((varianceName) => {
      const item = product.find((v) => v.varianceName === varianceName);
      const currentPrice = item?.variance_Defaultprice || 0;
      return {
        itemName: varianceName,
        currentPrice,
        percentage,
        partnerPrice: Math.round(currentPrice * (1 + percentage / 100)),
        assignedPartners: [],
        deactivateAssignedPartners: [],
        isTemporary: true,
      };
    });

    const updatedTemporaryItems = temporaryItems.filter((item) => newValue.includes(item.itemName));
    setTemporaryItems([...newTemporaryItems, ...updatedTemporaryItems]);
    setFormData((prev) => ({ ...prev, varianceName: newValue }));
    setValidationErrors({ ...validationErrors, varianceName: '' });

    setSelectionOrder((prev) => {
      const existingItems = prev.filter((name) => newValue.includes(name));
      return [...newItems.reverse(), ...existingItems];
    });
  };

  // === HANDLE PERCENTAGE CHANGE ===
  const handleApplyPercentage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const percentage = parseFloat(value) || 0;

    setFormData((prev) => ({ ...prev, applyPercentage: value }));

    if (value === '' || (percentage >= 0 && percentage <= 100)) {
      setValidationErrors((prev) => ({ ...prev, applyPercentage: '' }));
    } else {
      setValidationErrors((prev) => ({ ...prev, applyPercentage: 'Below 100 only' }));
      return;
    }

    const updatedItems = temporaryItems.map((item) => ({
      ...item,
      percentage,
      partnerPrice: Math.round(item.currentPrice * (1 + percentage / 100)),
    }));
    setTemporaryItems(updatedItems);
  };

  // === AUTOCOMPLETE OPEN / SEARCH / LOAD MORE ===
  const handleItemsFieldOpen = () => {
    if (formData.category.length === 0 && formData.subCategory.length === 0) {
      dispatch(resetItemsPagination());
      dispatch(fetchItems({ page: 1, limit: 50, search: '' }));
    }
  };

  const handleSearchInputChange = (_event: React.SyntheticEvent, newInputValue: string, reason: string) => {
    if (reason === 'input' || reason === 'clear') {
      setItemSearchQuery(newInputValue);
      dispatch(fetchItems({ page: 1, limit: 50, search: newInputValue }));
    }
  };

  const handleLoadMoreItems = () => {
    if (itemsPage < itemsTotalPages && !isFetchingItems) {
      const listbox = document.querySelector('.MuiAutocomplete-listbox');
      const scrollTop = listbox?.scrollTop || 0;

      dispatch(incrementItemsPage());
      dispatch(fetchItems({ page: itemsPage + 1, limit: 50, search: '' })).then(() => {
        if (listbox) {
          setTimeout(() => {
            listbox.scrollTop = scrollTop;
          }, 0);
        }
      });
    }
  };



  // 2. REPLACE THE handleFileChange FUNCTION (around line 200)
  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const validExtensions = ['.csv', '.json'];
      const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));

      if (!validExtensions.includes(fileExtension)) {
        dispatch(setSnackbarMessage("Please upload a valid CSV or JSON file"));
        dispatch(setSnackbarOpen(true));
        return;
      }

      setSelectedFile(file);
      setImportMode('add'); // Default mode
      setImportDialogOpen(true);
    }

    // Reset input
    if (event.target) {
      event.target.value = '';
    }
  };



  const handleImportSubmit = async () => {
    if (!selectedFile) return;

    setIsSubmitting(true);
    setImportDialogOpen(false);

    try {
      const response: ImportResponse = selectedType === "template"
        ? await dispatch(addImportData({ file: selectedFile, mode: importMode })).unwrap()
        : await dispatch(addDynamicImportData({ file: selectedFile, partnerName })).unwrap();

      // Map the response to match the new structure
      setImportResults({
        successful: response.successful || [],
        updated: response.updated || [],
        failed: response.errors || [],
        duplicates: response.duplicates || [],
        message: response.message,
        success: response.success,
        imported_count: response.imported_count,
        errors_count: response.errors_count,
        error_summary: response.error_summary,
      });
      setImportResultDialogOpen(true);

      if (response.success) {
        let message = `${response.imported_count || 0} records imported successfully.`;
        if (response.duplicates?.length) {
          message += ` ${response.duplicates.length} duplicates skipped.`;
        }
        dispatch(setSnackbarMessage(message));
        dispatch(setSnackbarOpen(true));

        dispatch(resetPagination());
        if (selectedType === "template") {
          dispatch(fetchTemplates({ search: searchQuery }));
        } else {
          dispatch(fetchDynamicData({ partnerName, search: searchQuery }));
        }
      } else {
        dispatch(setSnackbarMessage(response.message || 'Import failed'));
        dispatch(setSnackbarOpen(true));
      }
    } catch (error: any) {
      const errorMessage = error?.message || 'Import failed';
      dispatch(setSnackbarMessage(errorMessage));
      dispatch(setSnackbarOpen(true));

      setImportResults({
        successful: [],
        updated: [],
        failed: [{
          row: 0,
          column: 'general',
          value: '',
          error: errorMessage,
          severity: 'error'
        }],
        duplicates: [],
        message: errorMessage,
        success: false,
        imported_count: 0,
        errors_count: 1,
      });
      setImportResultDialogOpen(true);
    } finally {
      setIsSubmitting(false);
      setSelectedFile(null);
    }
  };

  const handleImportDialogClose = () => {
    setImportDialogOpen(false);
    setSelectedFile(null);
  };




  const handleRollback = async () => {
    // Show confirmation dialog first
    const confirmRollback = window.confirm(
      "Are you sure you want to rollback to the previous data? This will undo the last replace operation."
    );

    if (!confirmRollback) return;

    setIsSubmitting(true);
    try {
      if (selectedType === 'template') {
        await dispatch(rollbackTemplates()).unwrap();
        dispatch(fetchTemplates({ search: searchQuery }));
      } else {
        //   await dispatch(rollbackDynamicData(partnerName)).unwrap();
        dispatch(fetchDynamicData({ partnerName, search: searchQuery }));
      }
      dispatch(setSnackbarMessage('Rollback successful!'));
      dispatch(setSnackbarOpen(true));
    } catch (error: any) {
      dispatch(setSnackbarMessage(error?.message || 'Rollback failed'));
      dispatch(setSnackbarOpen(true));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCloseImportResultDialog = () => {
    setImportResultDialogOpen(false);
    setImportResults({ successful: [], updated: [], failed: [], duplicates: [] });
  };

  const handleExportCSV = async () => {
    try {
      if (selectedType === 'template') {
        await dispatch(fetchExportData()).unwrap();
      } else {
        await dispatch(fetchDynamicPartnerData(partnerName)).unwrap();
      }
      dispatch(setSnackbarMessage('Data exported successfully!'));
      dispatch(setSnackbarOpen(true));
    } catch (error: any) {
      dispatch(setSnackbarMessage(error?.message || 'Export failed'));
      dispatch(setSnackbarOpen(true));
    }
  };


  const handleDownloadSampleCSV = async () => {
    setIsImporting(true);
    try {
      await dispatch(Exportheader());
      setSnackbarMessage('Sample CSV downloaded successfully');
      setSnackbarOpen(true);
    } catch (error) {
      setSnackbarMessage('Failed to download sample CSV');
      setSnackbarOpen(true);
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div style={{ marginTop: '20px', padding: '0 16px' }}>
      {/* First Row - All Fields and Action Buttons */}
      <div style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: '10px',
        marginBottom: '16px',
        flexWrap: 'wrap'
      }}>
        {/* Category */}
        <div style={{ minWidth: '180px', flex: '1 1 180px', maxWidth: '220px' }}>
          <FormControl fullWidth variant="outlined" size="small" className="custom-textfield">
            <InputLabel className="custom-label" sx={{ fontSize: '0.75rem' }}>Category</InputLabel>
            <Select
              multiple
              value={formData.category}
              onChange={handleCategoryChange}
              label="Category"
              className="custom-input"
              sx={{ fontSize: '0.75rem', height: '38px' }}
              renderValue={(selected) => `${selected.length} selected`}
              MenuProps={{ PaperProps: { style: { maxHeight: 300 } } }}
            >
              {category.length > 0 ? (
                category.map((cat) => (
                  <MenuItem key={cat.category} value={cat.category}>
                    <Checkbox
                      checked={formData.category.includes(cat.category)}
                      sx={{ '& .MuiSvgIcon-root': { fontSize: 18 } }}
                    />
                    <ListItemText primary={cat.category} sx={{ '& .MuiTypography-root': { fontSize: '0.75rem' } }} />
                  </MenuItem>
                ))
              ) : (
                <MenuItem disabled>No categories available</MenuItem>
              )}
            </Select>
          </FormControl>
        </div>

        {/* Subcategory */}
        <div style={{ minWidth: '180px', flex: '1 1 180px', maxWidth: '220px' }}>
          <FormControl fullWidth variant="outlined" size="small" className="custom-textfield">
            <InputLabel className="custom-label" sx={{ fontSize: '0.75rem' }}>Subcategory</InputLabel>
            <Select
              multiple
              value={formData.subCategory}
              onChange={handleSubCategoryChange}
              label="Subcategory"
              className="custom-input"
              sx={{ fontSize: '0.75rem', height: '38px' }}
              renderValue={(selected) => `${selected.length} selected`}
              MenuProps={{ PaperProps: { style: { maxHeight: 300 } } }}
            >
              {formData.category.length > 0 && filteredSubCategories.length > 0 ? (
                formData.category.map((cat) => {
                  const subsForCategory = filteredSubCategories.filter((sub) => sub.category === cat);
                  if (subsForCategory.length === 0) return null;
                  return [
                    <ListSubheader key={`header-${cat}`}>{cat}</ListSubheader>,
                    ...subsForCategory.map((sub) => (
                      <MenuItem key={`${cat}-${sub.subcat}`} value={sub.subcat}>
                        <Checkbox
                          checked={formData.subCategory.includes(sub.subcat)}
                          sx={{ '& .MuiSvgIcon-root': { fontSize: 18 } }}
                        />
                        <ListItemText primary={sub.subcat} sx={{ '& .MuiTypography-root': { fontSize: '0.75rem' } }} />
                      </MenuItem>
                    )),
                  ];
                })
              ) : subCategory.length > 0 ? (
                subCategory.map((sub) => (
                  <MenuItem key={sub.subcategory} value={sub.subcategory}>
                    <Checkbox
                      checked={formData.subCategory.includes(sub.subcategory)}
                      sx={{ '& .MuiSvgIcon-root': { fontSize: 18 } }}
                    />
                    <ListItemText primary={sub.subcategory} sx={{ '& .MuiTypography-root': { fontSize: '0.75rem' } }} />
                  </MenuItem>
                ))
              ) : (
                <MenuItem disabled>No subcategories available</MenuItem>
              )}
            </Select>
          </FormControl>
        </div>

        {/* Items Autocomplete */}
        <div style={{ minWidth: '180px', flex: '1 1 180px', maxWidth: '220px' }}>
          <Autocomplete
            multiple
            disableCloseOnSelect
            size="small"
            options={product.map((item) => item.varianceName)}
            value={formData.varianceName}
            onChange={handleItemChange}
            onInputChange={handleSearchInputChange}
            onOpen={handleItemsFieldOpen}
            loading={isFetchingItems}
            getOptionLabel={(option) => option}
            getOptionDisabled={(option) => usedItemNames.includes(option.toLowerCase())}
            groupBy={(option) => {
              const item = product.find((p) => p.varianceName === option);
              return item ? item.category || 'Uncategorized' : 'Uncategorized';
            }}
            renderTags={() => null}
            renderOption={(props, option, { selected }) => {
              const isDisabled = usedItemNames.includes(option.toLowerCase());
              return (
                <li {...props} key={option} style={{ display: 'flex', alignItems: 'center' }}>
                  <Checkbox
                    checked={selected}
                    disabled={isDisabled}
                    sx={{ '& .MuiSvgIcon-root': { fontSize: 18 } }}
                  />
                  <Typography variant="body2" sx={{ fontSize: '0.75rem' }}>{option}</Typography>
                  {isDisabled && (
                    <Typography variant="caption" color="error" sx={{ ml: 1, fontSize: '0.65rem' }}>
                      (Already selected)
                    </Typography>
                  )}
                </li>
              );
            }}
            renderGroup={(params) => (
              <li key={params.key}>
                <ListSubheader sx={{ fontWeight: 'bold', color: 'primary.main', fontSize: '0.75rem' }}>
                  {params.group}
                </ListSubheader>
                {params.children}
              </li>
            )}
            ListboxProps={{
              className: 'MuiAutocomplete-listbox',
              onScroll: (event: React.UIEvent<HTMLElement>) => {
                const listbox = event.currentTarget;
                if (listbox.scrollTop + listbox.clientHeight >= listbox.scrollHeight - 50 && hasMoreItems && !isFetchingItems) {
                  handleLoadMoreItems();
                }
              },
              style: { maxHeight: 300, overflowY: 'auto' },
            }}
            renderInput={(params) => (
              <TextField
                {...params}
                label={`Items (${formData.varianceName.length})`}
                error={!!validationErrors.varianceName}
                helperText={validationErrors.varianceName}
                onKeyDown={(e) => {
                  if (e.key === 'Backspace') {
                    e.stopPropagation();
                  }
                }}
                className="custom-textfield"
                sx={{
                  '& .MuiInputBase-root': { height: '38px', fontSize: '0.75rem' },
                  '& .MuiInputLabel-root': { fontSize: '0.75rem' }
                }}
                InputProps={{
                  ...params.InputProps,
                  endAdornment: (
                    <>
                      {isFetchingItems ? <CircularProgress size={16} sx={{ mr: 1 }} /> : null}
                      {params.InputProps.endAdornment}
                    </>
                  ),
                }}
              />
            )}
            filterOptions={(options, { inputValue }) => {
              const normalizedInput = inputValue.toLowerCase();
              return options.filter((option) => {
                const item = product.find((p) => p.varianceName === option);
                const matchesSearch = option?.toLowerCase().includes(normalizedInput);
                const matchesCategory = formData.category.length === 0 || (item && formData.category.includes(item.category));
                const matchesSubCategory = formData.subCategory.length === 0 || (item && item.subCategory && formData.subCategory.includes(item.subCategory));
                const isSelected = formData.varianceName.includes(option);
                return (matchesSearch && matchesCategory && matchesSubCategory) || isSelected;
              });
            }}
          />
        </div>

        {/* Apply Percentage */}
        <div style={{ minWidth: '120px', flex: '0 0 120px' }}>
          <TextField
            fullWidth
            size="small"
            label="Percentage"
            name="applyPercentage"
            value={formData.applyPercentage}
            onChange={handleApplyPercentage}
            variant="outlined"
            error={!!validationErrors.applyPercentage}
            helperText={validationErrors.applyPercentage || ' '}
            disabled={isSubmitting}
             inputProps={{
              inputMode: 'decimal',
              pattern: '[0-9]*\\.?[0-9]*',
              maxLength: 2, // Optional: limit input length
            }}
            className="custom-textfield"
            sx={{
              '& .MuiInputBase-root': { height: '38px', fontSize: '0.75rem' },
              '& .MuiInputLabel-root': { fontSize: '0.75rem' },
              '& .MuiFormHelperText-root': { fontSize: '0.65rem', marginTop: '2px' }
            }}
          />
        </div>

        {/* Action Buttons Group */}
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap', marginTop: -6 }}>
          <button
            className='btn-primary'
            style={{ padding: '7px 14px', fontSize: '0.75rem', height: '36px', whiteSpace: 'nowrap' }}
            onClick={handleSubmit}
            disabled={
              isSubmitting ||
              (buttonLabel === 'Assign' && formData.varianceName.length === 0) ||
              (buttonLabel === 'Apply Changes' && isFormValid)
            }
          >
            {buttonLabel}
          </button>

          {/* {selectedType === 'template' && (
            <button
              className='btn-primary'
              style={{ padding: '7px 14px', fontSize: '0.75rem', height: '38px', whiteSpace: 'nowrap' }}
              onClick={handleCreateTemplate}
              disabled={createTemplateDisabled || isSubmitting}
            >
              Create Template
            </button>
          )} */}

          {/* Bulk Delete */}
          <div className="icon-action-wrapper">
            <IconButton
              color="error"
              onClick={handleCommonDeactivate}
              disabled={selectedRows.length === 0 || isSubmitting}
              className="icon-action-button"
            //  sx={{ borderColor: 'error.main !important', width: '34px !important', height: '34px !important' }}
            >
              <DeleteIcon className="icon-action-svg" />
            </IconButton>
            <Typography className="icon-action-label">Delete</Typography>
          </div>

          {/* Import */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            accept=".csv,.json"
            style={{ display: "none" }}
          />

          {/* Import */}
          <div className="icon-action-wrapper">
            <IconButton
              color="primary"
              onClick={handleImportClick}
              className="icon-action-button"
              size="small"
              disabled={isImporting}
            >
              {isImporting ? (
                <CircularProgress size={20} className="icon-action-svg" />
              ) : (
                <GetAppIcon className="icon-action-svg" />
              )}
            </IconButton>
            <Typography className="icon-action-label">
              {isImporting ? "Importing..." : "Import"}
            </Typography>
          </div>

          {/* Export */}
          <div className="icon-action-wrapper">
            <IconButton
              color="primary"
              onClick={handleExportCSV}
              className="icon-action-button"
              size="small"
              disabled={isImporting}
            >
              <UploadIcon className="icon-action-svg" />
            </IconButton>
            <Typography className="icon-action-label">Export</Typography>
          </div>



          <div className="icon-action-wrapper">
            <IconButton
              color="primary"
              onClick={handleDownloadSampleCSV}
              disabled={isImporting}
              className="icon-action-button"
            >
              <DescriptionIcon className="icon-action-svg" />
            </IconButton>
            <Typography className="icon-action-label">Sample</Typography>
          </div>


          {/* Rollback */}
          <div className="icon-action-wrapper">
            <IconButton
              color="secondary"
              onClick={handleRollback}
              className="icon-action-button"
              size="small"
              disabled={isImporting}
            >
              <UndoIcon className="icon-action-svg" />
            </IconButton>
            <Typography className="icon-action-label">Rollback</Typography>
          </div>

        </div>
      </div>

      {/* Second Row - Search (Left) and Assign Partners (Right) */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '5px',
        marginBottom: '12px'
      }}>
        {/* Search Query - Left Side */}
        <div style={{ flex: '0 0 auto', width: '100%', maxWidth: '400px',  }}>
          <TextField
            fullWidth
            size="small"
            variant="outlined"
            autoComplete="off"
            placeholder="Search Template Items..."
            value={searchQuery}
            onChange={(e) => dispatch(setSearchQuery(e.target.value))}
            className="custom-textfield"
            sx={{
              '& .MuiInputBase-root': { height: '38px', fontSize: '0.75rem' }
            }}
          />
        </div>

        {/* Assign Partners Button - Right Side */}
        <div style={{ flex: '0 0 auto' }}>
          {selectedType === 'template' && !showDeactivated && (
            <button
              className='btn-primary'
              onClick={() => setAssignDialogOpen(true)}
              disabled={isSubmitting || selectedRows.length === 0}
              style={{
                textTransform: 'none',
                fontWeight: 600,
                fontSize: '0.75rem',
                height: '38px',
                whiteSpace: 'nowrap',
              }}
            >
              Assign Partners
            </button>
          )}
        </div>
      </div>

      {/* IMPORT RESULTS DIALOG */}
      <Dialog
        open={importResultDialogOpen}
        onClose={handleCloseImportResultDialog}
        maxWidth="md"
        fullWidth
        PaperProps={{ className: 'dialog-paper' }}
      >
        <DialogTitle className="dialog-title">CSV Import Results</DialogTitle>
        <DialogContent className="dialog-content">
          {/* Show overall message */}
          {importResults.message && (
            <div className={importResults.success ? "success-message" : "error-message"}>
              <Typography variant="body1" sx={{ fontWeight: 600, fontSize: '0.875rem', mb: 1 }}>
                {importResults.message}
              </Typography>
            </div>
          )}

          {/* Show summary */}
          {importResults.imported_count !== undefined && importResults.imported_count > 0 && (
            <div className="success-message">
              <Typography variant="subtitle1" sx={{ fontWeight: 600, fontSize: '0.875rem' }}>
                Successfully Imported
              </Typography>
              <Typography variant="body2" sx={{ fontSize: '0.75rem' }}>
                {importResults.imported_count} record(s) imported successfully
              </Typography>
            </div>
          )}

          {importResults.duplicates && importResults.duplicates.length > 0 && (
            <div className="warning-message">
              <Typography variant="subtitle1" sx={{ fontWeight: 600, fontSize: '0.875rem' }}>
                Duplicates Skipped
              </Typography>
              <Typography variant="body2" sx={{ fontSize: '0.75rem' }}>
                {importResults.duplicates.length} duplicate(s) skipped: {importResults.duplicates.join(", ")}
              </Typography>
            </div>
          )}

          {/* Show errors and warnings */}
          {importResults.failed && importResults.failed.length > 0 && (
            <div className="error-message" style={{ marginTop: '16px' }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, fontSize: '0.875rem', mb: 1 }}>
                Errors Found
              </Typography>
              {importResults.error_summary && (
                <Typography variant="body2" sx={{ fontSize: '0.75rem', mb: 2 }}>
                  Total Errors: {importResults.error_summary.total_errors} |
                  Total Warnings: {importResults.error_summary.total_warnings}
                </Typography>
              )}
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem' }}>Row</TableCell>
                    <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem' }}>Column</TableCell>
                    <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem' }}>Value</TableCell>
                    <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem' }}>Error Description</TableCell>
                    <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem' }}>Severity</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {importResults.failed.map((error, idx) => (
                    <TableRow
                      key={idx}
                      sx={{
                        backgroundColor: error.severity === 'error' ? '#ffe6e6' : '#fff3cd'
                      }}
                    >
                      <TableCell sx={{ fontSize: '0.75rem', fontWeight: 600 }}>
                        {error.row}
                      </TableCell>
                      <TableCell sx={{ fontSize: '0.75rem', fontWeight: 600 }}>
                        {error.column}
                      </TableCell>
                      <TableCell sx={{ fontSize: '0.75rem' }}>
                        {error.value || '-'}
                      </TableCell>
                      <TableCell sx={{ fontSize: '0.75rem' }}>
                        {error.error}
                      </TableCell>
                      <TableCell sx={{ fontSize: '0.75rem' }}>
                        <span
                          style={{
                            padding: '2px 8px',
                            borderRadius: '4px',
                            backgroundColor: error.severity === 'error' ? '#dc3545' : '#ffc107',
                            color: 'white',
                            fontSize: '0.7rem',
                            fontWeight: 600,
                            textTransform: 'uppercase'
                          }}
                        >
                          {error.severity}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {importResults.successful.length === 0 &&
            importResults.updated.length === 0 &&
            importResults.failed.length === 0 &&
            (!importResults.duplicates || importResults.duplicates.length === 0) && (
              <Typography className="info-message" sx={{ fontSize: '0.75rem' }}>
                No issues found during import.
              </Typography>
            )}
        </DialogContent>
        <DialogActions className="dialog-actions">
          <button
            onClick={handleCloseImportResultDialog}
            className="btn-primary"
            style={{ fontSize: '0.75rem' }}
          >
            Close
          </button>
        </DialogActions>
      </Dialog>




      <Dialog
        open={importDialogOpen}
        onClose={handleImportDialogClose}
        PaperProps={{
          className: "dialog-paper-small",
        }}
      >
        <DialogTitle
          className="dialog-title"
          sx={{ fontFamily: "'Poppins', sans-serif", fontWeight: 400 }}
        >
          Select Import Mode
        </DialogTitle>

        <DialogContent className="dialog-content">
          <Box sx={{ pt: 1 }}>
            <Typography
              variant="body2"
              sx={{ mb: 1, fontFamily: "'Poppins', sans-serif", fontSize: "0.7rem" }}
            >
              Selected file: <strong>{selectedFile?.name}</strong>
            </Typography>

            <Divider sx={{ my: 2 }} />

            <Typography
              sx={{ fontFamily: "'Poppins', sans-serif", fontWeight: 500, mb: 2, fontSize: "0.8rem" }}
            >
              Choose import mode:
            </Typography>

            <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5, alignItems: "center" }}>
              {/* ADD MODE */}
              <Button
                variant={importMode === "add" ? "contained" : "outlined"}
                color="primary"
                onClick={() => setImportMode("add")}
                sx={{ width: 200 }}
              >
                <Box>
                  <Typography fontWeight={500} sx={{ fontSize: '0.85rem' }}>Add Only</Typography>
                  <Typography variant="caption" sx={{ fontSize: '0.65rem' }}>
                    Skip duplicates
                  </Typography>
                </Box>
              </Button>

              {/* MERGE MODE */}
              <Button
                variant={importMode === "merge" ? "contained" : "outlined"}
                color="secondary"
                onClick={() => setImportMode("merge")}
                sx={{ width: 200 }}
              >
                <Box>
                  <Typography fontWeight={500} sx={{ fontSize: '0.85rem' }}>Merge</Typography>
                  <Typography variant="caption" sx={{ fontSize: '0.65rem' }}>
                    Add new & update existing
                  </Typography>
                </Box>
              </Button>

              {/* REPLACE MODE */}
              <Button
                variant={importMode === "replace" ? "contained" : "outlined"}
                color="error"
                onClick={() => setImportMode("replace")}
                sx={{ width: 200 }}
              >
                <Box>
                  <Typography fontWeight={500} sx={{ fontSize: '0.85rem' }}>Replace All</Typography>
                  <Typography variant="caption" sx={{ fontSize: '0.65rem' }}>
                    Clear & import new
                  </Typography>
                </Box>
              </Button>
            </Box>
          </Box>
        </DialogContent>

        <DialogActions className="dialog-actions" sx={{ px: 3, pb: 2 }}>
          <button className="btn-secondary" onClick={handleImportDialogClose}>
            Cancel
          </button>
          <button className="btn-primary" onClick={handleImportSubmit}>
            Confirm Import
          </button>
        </DialogActions>
      </Dialog>

    </div>
  );
};

export default FilterActionBar;