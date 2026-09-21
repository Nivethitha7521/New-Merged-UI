'use client';
import React, { useRef, useState } from 'react';
import {
  Box,
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
} from '@mui/material';
import {
  Add as AddIcon,
  DescriptionOutlined as SampleIcon,
  FileUploadOutlined as ImportIcon,
  FileDownloadOutlined as ExportIcon,
  SearchRounded as SearchIcon,
} from '@mui/icons-material';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '@/redux/store';
import { setShowImportResultDialog } from '../../../../features/yen-purchase/PurchaseMaster/itemTypeSlice';
import { ImportResult } from '@/Models/importResult';


interface ItemTypeActionsProps {
  searchQuery: string;
  onSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onDialogOpen: () => void;
  onSampleCSV: () => void;
  onImportCSV: (file: File) => Promise<ImportResult>;
  onExportCSV: () => void;
  showDeactivated: boolean;
  onToggleShowDeactivated: () => void;
  importStatus: 'idle' | 'loading' | 'succeeded' | 'failed';
  exportStatus: 'idle' | 'loading' | 'succeeded' | 'failed';
  canAdd: boolean;
}

const ItemTypeActions: React.FC<ItemTypeActionsProps> = ({
  searchQuery,
  onSearchChange,
  onDialogOpen,
  onSampleCSV,
  onImportCSV,
  onExportCSV,
  showDeactivated,
  onToggleShowDeactivated,
  importStatus,
  exportStatus,
  canAdd, 
}) => {
  const dispatch = useDispatch<AppDispatch>();
  const [confirmationDialogOpen, setConfirmationDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingType, setLoadingType] = useState<'import' | 'export' | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setConfirmationDialogOpen(true);
      e.target.value = ''; // Reset the input
    }
  };

  const handleConfirmImport = async () => {
    if (selectedFile) {
      setIsLoading(true);
      setLoadingType('import');
      setConfirmationDialogOpen(false);
      try {
        const result = await onImportCSV(selectedFile);
        dispatch(setShowImportResultDialog(true)); // Show dialog via Redux
        setSelectedFile(null);
      } catch (error) {
        // Error is handled in ItemTypePage's handleImportCSV
        setSelectedFile(null);
      } finally {
        setIsLoading(false);
        setLoadingType(null);
      }
    }
  };

  const handleCancelImport = () => {
    setConfirmationDialogOpen(false);
    setSelectedFile(null);
  };

  const handleExportCSV = async () => {
    setIsLoading(true);
    setLoadingType('export');
    try {
      await onExportCSV();
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setIsLoading(false);
      setLoadingType(null);
    }
  };

  return (
   <Box className="purchase-reference-toolbar-section">
  <Box className="purchase-reference-toolbar">
    <TextField
      autoComplete="off"
      placeholder="Search by item type name or ID..."
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
      <Button
        type="button"
        variant="outlined"
        startIcon={<AddIcon />}
        onClick={onDialogOpen}
        disabled={isLoading || !canAdd}
        className="purchase-reference-action-button"
      >
        Add New
      </Button>

      <Button
        type="button"
        variant="outlined"
        startIcon={<SampleIcon />}
        onClick={onSampleCSV}
        disabled={isLoading}
        className="purchase-reference-action-button"
      >
        Sample
      </Button>

      <input
        id="import-csv-file-itemtype"
        type="file"
        accept=".csv"
        hidden
        onChange={handleFileChange}
        disabled={isLoading}
        ref={fileInputRef}
      />

      <Button
        type="button"
        variant="outlined"
        startIcon={
          isLoading && loadingType === 'import'
            ? <CircularProgress size={15} />
            : <ImportIcon />
        }
        onClick={() => fileInputRef.current?.click()}
        disabled={isLoading}
        className="purchase-reference-action-button"
      >
        Import
      </Button>

      <Button
        type="button"
        variant="outlined"
        startIcon={
          isLoading && loadingType === 'export'
            ? <CircularProgress size={15} />
            : <ExportIcon />
        }
        onClick={handleExportCSV}
        disabled={isLoading}
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
          disabled={isLoading}
          size="small"
        />
      </Box>
    </Box>
  </Box>

  

      <Backdrop
        sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}
        open={isLoading}
      >
        <Box display="flex" flexDirection="column" alignItems="center" gap={2}>
          <CircularProgress color="inherit" />
          <Typography>
            {loadingType === 'import' ? 'Import is in progress, please wait...' : 'Export is in progress, please wait...'}
          </Typography>
        </Box>
      </Backdrop>

      <Dialog open={confirmationDialogOpen} onClose={handleCancelImport}>
        <DialogTitle>Confirm CSV Import</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to import the file &quot;{selectedFile?.name}&quot;? This action will process the CSV file and may add or update item types.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelImport} color="secondary">
            Cancel
          </Button>
          <Button onClick={handleConfirmImport} color="primary" variant="contained">
            Import
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ItemTypeActions;