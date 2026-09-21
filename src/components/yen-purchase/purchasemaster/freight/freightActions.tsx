'use client';
import React, { useRef, useState } from 'react';
import {
  Box,
  TextField,
  Typography,
  Switch,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  CircularProgress,
} from '@mui/material';
import {
  Add as AddIcon,
  DescriptionOutlined as SampleIcon,
  FileUploadOutlined as ImportIcon,
  FileDownloadOutlined as ExportIcon,
  SearchRounded as SearchIcon,
} from '@mui/icons-material';
interface FreightActionsProps {
  searchQuery: string;
  onSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onDialogOpen: () => void;
  onSampleCSV: () => void;
  onImportCSV: (file: File) => Promise<any>;
  onExportCSV: () => void;
  showDeactivated: boolean;
  onToggleShowDeactivated: () => void;
  importing?: boolean;
  exporting?: boolean;
  canAdd: boolean;
}

const FreightActions: React.FC<FreightActionsProps> = ({
  searchQuery,
  onSearchChange,
  onDialogOpen,
  onSampleCSV,
  onImportCSV,
  onExportCSV,
  showDeactivated,
  onToggleShowDeactivated,
  importing = false,
  exporting = false,
  canAdd, 
}) => {
  const [confirmationDialogOpen, setConfirmationDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
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

  const handleConfirmImport = async () => {
    if (selectedFile) {
      setConfirmationDialogOpen(false);
      try {
        await onImportCSV(selectedFile);
      } catch (error) {
        // Errors handled by FreightPage
      } finally {
        setSelectedFile(null);
      }
    }
  };

  const handleCancelImport = () => {
    setConfirmationDialogOpen(false);
    setSelectedFile(null);
  };

  return (
<Box className="purchase-reference-toolbar">
  <TextField
    autoComplete="off"
    placeholder="Search by freight name or ID..."
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
      disabled={!canAdd}
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
      id="import-csv-file-freight"
      type="file"
      accept=".csv"
      hidden
      onChange={handleFileChange}
      disabled={importing}
      ref={fileInputRef}
    />

    <Button
      type="button"
      variant="outlined"
      startIcon={
        importing
          ? <CircularProgress size={15} />
          : <ImportIcon />
      }
      onClick={handleImportClick}
      disabled={importing}
      className="purchase-reference-action-button"
    >
      Import
    </Button>

    <Button
      type="button"
      variant="outlined"
      startIcon={
        exporting
          ? <CircularProgress size={15} />
          : <ExportIcon />
      }
      onClick={onExportCSV}
      disabled={exporting}
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
        name="showDeactivated"
        size="small"
        disabled={importing || exporting}
      />
    </Box>
  </Box>

      <Dialog
        open={confirmationDialogOpen}
        onClose={handleCancelImport}
        aria-labelledby="import-confirmation-dialog-title"
        aria-describedby="import-confirmation-dialog-description"
      >
        <DialogTitle id="import-confirmation-dialog-title">Confirm Import</DialogTitle>
        <DialogContent>
          <DialogContentText id="import-confirmation-dialog-description">
            Are you sure you want to import {selectedFile?.name}? This action may overwrite existing freight data.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelImport} color="primary">
            Cancel
          </Button>
          <Button onClick={handleConfirmImport} color="primary" variant="contained" autoFocus disabled={importing}>
            Confirm
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default FreightActions;