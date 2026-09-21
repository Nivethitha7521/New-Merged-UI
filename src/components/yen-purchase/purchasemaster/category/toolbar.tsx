'use client';
import { useDispatch, useSelector } from 'react-redux';
import {
  TextField,
  Typography,
  Switch,
  Backdrop,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  Box,
} from '@mui/material';
import {
  Add as AddIcon,
  FileUploadOutlined as ImportIcon,
  FileDownloadOutlined as ExportIcon,
  SearchRounded as SearchIcon,
  ListAltOutlined as CategoryIcon,
  AccountTreeOutlined as SubcategoryIcon,
  CheckCircleOutlineRounded as ActiveIcon,
} from '@mui/icons-material';
import {
  fetchCategories,
  fetchSubcategories,
  setDialogOpen,
  setSearchQuery,
  toggleShowDeactivated,
  exportPurchaseCategoriesCSV,
  importPurchaseCategoriesCSV,
  setShowImportResultDialog,
  resetImportResult,
  setSnackbarOpen,
  setSnackbarMessage,
} from '../../../../features/yen-purchase/PurchaseMaster/PurchaseCategorySlice';
import { AppDispatch, RootState } from '@/redux/store';
import { useRef, useState } from 'react';
import CommonImportResultDialog from '../../CommonImportDialog';

// ✅ UPDATED INTERFACE
interface SearchToolbarProps {
  onAddClick?: () => void;
  showAddButton: boolean;
  permissions?: {
    add?: boolean;
    edit?: boolean;
    delete?: boolean;
  };
}

const SearchToolbar: React.FC<SearchToolbarProps> = ({ 
  onAddClick, 
  showAddButton = true,
  permissions = {
    add: true,
    edit: true,
    delete: true
  }
}) => {
  const dispatch = useDispatch<AppDispatch>();
  const {
    categories,
    searchQuery,
    showDeactivated,
    importStatus,
    exportStatus,
    importResult,
    showImportResultDialog,
  } = useSelector((state: RootState) => state.purchaseCategory);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [confirmationDialogOpen, setConfirmationDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // ✅ DEFAULT PERMISSIONS IF NOT PROVIDED
  const {
    add = true,
    edit = true,
    delete: deletePerm = true
  } = permissions || {};

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    dispatch(setSearchQuery(e.target.value));
  };

  const handleExportCSV = () => {
    dispatch(exportPurchaseCategoriesCSV());
  };


  const handleImportCSV = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;
    if (!file) {
      return;
    }
    if (!file.name.endsWith('.csv')) {
      dispatch(setSnackbarMessage('Please select a CSV file'));
      dispatch(setSnackbarOpen(true));
      return;
    }
    setSelectedFile(file);
    setConfirmationDialogOpen(true);
    if (event.target) {
      event.target.value = '';
    }
  };

  const handleConfirmImport = () => {
    if (selectedFile) {
      dispatch(importPurchaseCategoriesCSV(selectedFile))
        .unwrap()
        .then(() => {
          dispatch(fetchCategories());
          dispatch(fetchSubcategories());
          dispatch(setShowImportResultDialog(true));
          dispatch(setSnackbarMessage('CSV import completed'));
          dispatch(setSnackbarOpen(true));
        })
        .catch((error) => {
          dispatch(setShowImportResultDialog(true));
          dispatch(setSnackbarMessage(`Import failed: ${error.message || 'Unknown error'}`));
          dispatch(setSnackbarOpen(true));
        })
        .finally(() => {
          setConfirmationDialogOpen(false);
          setSelectedFile(null);
        });
    }
  };

  const handleCancelImport = () => {
    setConfirmationDialogOpen(false);
    setSelectedFile(null);
  };

  const handleImportResultsClose = () => {
    dispatch(setShowImportResultDialog(false));
    dispatch(resetImportResult());
  };

  const totalSubcategories = categories.reduce((total, category) => {
    return total + (Array.isArray(category.subcategories) ? category.subcategories.length : 0);
  }, 0);

  const activeCategories = categories.filter(
    (category) => (category.status || '').toLowerCase() === 'active',
  ).length;

  return (
    <Box className="purchase-reference-toolbar-section">
      <Box className="purchase-reference-toolbar">
        <TextField
          autoComplete="off"
          placeholder="Search by category name or ID..."
          variant="outlined"
          value={searchQuery}
          onChange={handleSearch}
          className="purchase-reference-search"
          InputProps={{
            startAdornment: <SearchIcon className="purchase-reference-search-icon" />,
          }}
        />

        <Box className="purchase-reference-actions">
          {showAddButton && add && (
            <Button
              type="button"
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={onAddClick}
              className="purchase-reference-action-button"
            >
              Add New
            </Button>
          )}

          <input
            id="import-csv-file"
            type="file"
            accept=".csv"
            hidden
            onChange={handleImportCSV}
            ref={fileInputRef}
          />

          <Button
            type="button"
            variant="outlined"
            startIcon={
              importStatus === 'loading'
                ? <CircularProgress size={15} />
                : <ImportIcon />
            }
            onClick={() => fileInputRef.current?.click()}
            disabled={importStatus === 'loading'}
            className="purchase-reference-action-button"
          >
            Import
          </Button>

          <Button
            type="button"
            variant="outlined"
            startIcon={
              exportStatus === 'loading'
                ? <CircularProgress size={15} />
                : <ExportIcon />
            }
            onClick={handleExportCSV}
            disabled={exportStatus === 'loading'}
            className="purchase-reference-action-button"
          >
            Export
          </Button>

          <Box className="purchase-reference-active-toggle">
            <Typography component="span">Show Active Only</Typography>
            <Switch
              checked={!showDeactivated}
              onChange={() => dispatch(toggleShowDeactivated())}
              size="small"
            />
          </Box>
        </Box>
      </Box>

      <Box className="purchase-reference-summary-grid">
        <Box className="purchase-reference-summary-card">
          <Box>
            <Typography className="purchase-reference-summary-label">
              Total Categories
            </Typography>
            <Typography className="purchase-reference-summary-value">
              {categories.length}
            </Typography>
          </Box>
          <Box className="purchase-reference-summary-icon">
            <CategoryIcon />
          </Box>
        </Box>

        <Box className="purchase-reference-summary-card">
          <Box>
            <Typography className="purchase-reference-summary-label">
              Total Subcategories
            </Typography>
            <Typography className="purchase-reference-summary-value">
              {totalSubcategories}
            </Typography>
          </Box>
          <Box className="purchase-reference-summary-icon">
            <SubcategoryIcon />
          </Box>
        </Box>

        <Box className="purchase-reference-summary-card">
          <Box>
            <Typography className="purchase-reference-summary-label">
              Active Items
            </Typography>
            <Typography className="purchase-reference-summary-value is-success">
              {activeCategories}
            </Typography>
          </Box>
          <Box className="purchase-reference-summary-icon is-success">
            <ActiveIcon />
          </Box>
        </Box>
      </Box>

      {/* DIALOGS */}
      <Dialog
        open={confirmationDialogOpen}
        onClose={handleCancelImport}
        aria-labelledby="import-confirmation-dialog-title"
      >
        <DialogTitle id="import-confirmation-dialog-title">Confirm Import</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to import {selectedFile?.name}? This action may overwrite existing data.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelImport} color="primary" disabled={importStatus === 'loading'}>
            Cancel
          </Button>
          <Button
            onClick={handleConfirmImport}
            color="primary"
            variant="contained"
            autoFocus
            disabled={importStatus === 'loading'}
          >
            {importStatus === 'loading' ? <CircularProgress size={24} /> : 'Confirm'}
          </Button>
        </DialogActions>
      </Dialog>
      
      <CommonImportResultDialog
        open={showImportResultDialog}
        onClose={handleImportResultsClose}
        importResult={importResult}
        module="category"
      />
    </Box>
  );
};

export default SearchToolbar;