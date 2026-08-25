'use client';
import React, { useRef } from 'react';
import {
  Box,
  TextField,
  Typography,
  Switch,
  Backdrop,
  CircularProgress,
  Button,
} from '@mui/material';
import {
  Add as AddIcon,
  DescriptionOutlined as SampleIcon,
  FileUploadOutlined as ImportIcon,
  FileDownloadOutlined as ExportIcon,
  SearchRounded as SearchIcon,
} from '@mui/icons-material';
import { ConfirmationDialog } from '../tax/confirmationDialog';

interface StorageLocationActionsProps {
  searchQuery: string;
  onSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onDialogOpen: () => void;
  onSampleCSV: () => void;
  onImportCSV: (file: File | null) => void;
  onExportCSV: () => void;
  showDeactivated: boolean;
  onToggleShowDeactivated: () => void;
  importStatus: 'idle' | 'loading' | 'succeeded' | 'failed';
  exportStatus: 'idle' | 'loading' | 'succeeded' | 'failed';
  showAddButton: boolean; // ✅ ADD PERMISSION PROP
}

const StorageLocationActions: React.FC<StorageLocationActionsProps> = ({
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
  showAddButton, 
}) => {
  const [confirmationDialogOpen, setConfirmationDialogOpen] = React.useState(false);
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setConfirmationDialogOpen(true);
      e.target.value = '';
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleConfirmImport = () => {
    if (selectedFile) {
      onImportCSV(selectedFile);
    }
    setConfirmationDialogOpen(false);
    setSelectedFile(null);
  };

  return (
    <Box>
      <Box className="purchase-reference-toolbar">
  <TextField
    autoComplete="off"
    placeholder="Search by storage location name or ID..."
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
      disabled={!showAddButton}
      className="purchase-reference-action-button"
    >
      Add New
    </Button>

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
      id="import-csv-file-location"
      type="file"
      accept=".csv"
      hidden
      onChange={handleFileChange}
      ref={fileInputRef}
      disabled={importStatus === 'loading'}
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
        size="small"
        disabled={
          importStatus === 'loading' ||
          exportStatus === 'loading'
        }
      />
    </Box>
  </Box>
</Box>
      

      <Backdrop
        sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}
        open={importStatus === 'loading' || exportStatus === 'loading'}
      >
        <Box display="flex" flexDirection="column" alignItems="center" gap={2}>
          <CircularProgress color="inherit" />
          <Typography>
            {importStatus === 'loading' ? 'Import is in progress, please wait...' : 'Export is in progress, please wait...'}
          </Typography>
        </Box>
      </Backdrop>
      <ConfirmationDialog
        open={confirmationDialogOpen}
        title="Confirm Import"
        message="Are you sure you want to import this CSV file? All new storage locations will be added with active status."
        onConfirm={handleConfirmImport}
        onCancel={() => {
          setConfirmationDialogOpen(false);
          setSelectedFile(null);
        }}
      />
    </Box>
  );
};

export default StorageLocationActions;