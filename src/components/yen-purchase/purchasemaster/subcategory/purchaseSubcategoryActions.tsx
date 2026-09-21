'use client';
import React, { useRef, useState } from 'react';
import {
  Box,
  TextField,
  Switch,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  CircularProgress,
  Backdrop,
  Typography,
} from '@mui/material';
import {
  Add as AddIcon,
  DescriptionOutlined as SampleIcon,
  FileUploadOutlined as ImportIcon,
  FileDownloadOutlined as ExportIcon,
  SearchRounded as SearchIcon,
} from '@mui/icons-material';

interface PurchaseSubcategoryActionsProps {
  searchQuery: string;
  onSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
   onDialogOpen: (action?: 'add' | 'edit') => void; // ✅ ADD PARAMETER
  onSampleCSV: () => void;
  onImportCSV: (file: File) => Promise<any>;
  onExportCSV: () => void;
  showDeactivated: boolean;
  onToggleShowDeactivated: () => void;
  importStatus: 'idle' | 'loading' | 'succeeded' | 'failed';
  exportStatus: 'idle' | 'loading' | 'succeeded' | 'failed';
   permissions?: { // ✅ ADD PERMISSIONS PROP
    add?: boolean;
    edit?: boolean;
    delete?: boolean;
  };
}

const PurchaseSubcategoryActions: React.FC<PurchaseSubcategoryActionsProps> = ({
  searchQuery, onSearchChange, onDialogOpen, onSampleCSV, onImportCSV, onExportCSV,
  showDeactivated, onToggleShowDeactivated, importStatus, exportStatus, permissions = { add: true, edit: true, delete: true } // ✅ DEFAULT PERMISSIONS
}) => {
  const { add = true } = permissions; // ✅ DESTRUCTURE PERMISSIONS
  const [confirmationDialogOpen, setConfirmationDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [importResult, setImportResult] = useState<any>(null);
  const [resultDialogOpen, setResultDialogOpen] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error' | 'info' | 'warning'>('info');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
        setSnackbarMessage('Please select a CSV file');
        setSnackbarSeverity('error');
        setSnackbarOpen(true);
        return;
      }

      setSelectedFile(file);
      setConfirmationDialogOpen(true);
      e.target.value = '';
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleConfirmImport = async () => {
    if (selectedFile) {
      setConfirmationDialogOpen(false); // Close dialog immediately
      try {
        const result = await onImportCSV(selectedFile);
        setImportResult(result);
        setResultDialogOpen(true);
        setSnackbarMessage(
          `Import completed: ${result.new_count} new, ${result.updated_count} updated, ${result.duplicate_in_csv_count || 0} duplicates skipped`
        );
        setSnackbarSeverity('success');
        setSnackbarOpen(true);
      } catch (error: any) {
        console.error('Import failed:', error);
        setSnackbarMessage(error.message || 'Import failed. Please check file format and try again.');
        setSnackbarSeverity('error');
        setSnackbarOpen(true);
      } finally {
        setSelectedFile(null);
      }
    } else {
      setConfirmationDialogOpen(false);
    }
  };

  const handleCancelImport = () => {
    setConfirmationDialogOpen(false);
    setSelectedFile(null);
  };

  const handleCloseResultDialog = () => {
    setResultDialogOpen(false);
  };

  const handleCloseSnackbar = () => {
    setSnackbarOpen(false);
  };

  return (
<Box className="purchase-reference-toolbar-section">
  <Box className="purchase-reference-toolbar">
    <TextField
      autoComplete="off"
      placeholder="Search by subcategory name or ID..."
      variant="outlined"
      value={searchQuery}
      onChange={onSearchChange}
      className="purchase-reference-search"
      InputProps={{
        startAdornment: (
          <SearchIcon className="purchase-reference-search-icon" />
        ),
      }}
    />

    <Box className="purchase-reference-actions">
      {add && (
        <Button
          type="button"
          variant="outlined"
          startIcon={<AddIcon />}
          onClick={() => onDialogOpen('add')}
          className="purchase-reference-action-button"
        >
          Add New
        </Button>
      )}

      <Button
        type="button"
        variant="outlined"
        startIcon={<SampleIcon />}
        onClick={onSampleCSV}
        className="purchase-reference-action-button"
      >
        Sample
      </Button>

      <input
        id="import-subcategory-csv-file"
        type="file"
        accept=".csv"
        hidden
        onChange={handleFileChange}
        disabled={importStatus === 'loading'}
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
        onClick={handleImportClick}
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
        onClick={onExportCSV}
        disabled={exportStatus === 'loading'}
        className="purchase-reference-action-button"
      >
        Export
      </Button>

      <Box className="purchase-reference-active-toggle">
        <Typography component="span">
          Show Active Only
        </Typography>

        <Switch
          checked={!showDeactivated}
          onChange={onToggleShowDeactivated}
          disabled={
            importStatus === 'loading' ||
            exportStatus === 'loading'
          }
          size="small"
        />
      </Box>
    </Box>
  </Box>

 

      <Backdrop
        sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.modal + 1 }}
        open={importStatus === 'loading'}
      >
        <Box display="flex" flexDirection="column" alignItems="center" gap={2}>
          <CircularProgress color="inherit" />
          <Typography>Import is in progress, please wait...</Typography>
        </Box>
      </Backdrop>

      <Dialog
        open={confirmationDialogOpen}
        onClose={handleCancelImport}
        aria-labelledby="import-confirmation-dialog-title"
        aria-describedby="import-confirmation-dialog-description"
      >
        <DialogTitle id="import-confirmation-dialog-title">
          Confirm Import
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="import-confirmation-dialog-description">
            Are you sure you want to import {selectedFile?.name}? This action may overwrite existing data.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelImport} color="primary">
            Cancel
          </Button>
          <Button
            onClick={handleConfirmImport}
            color="primary"
            variant="contained"
            autoFocus
            disabled={importStatus === 'loading'}
          >
            Confirm
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PurchaseSubcategoryActions;