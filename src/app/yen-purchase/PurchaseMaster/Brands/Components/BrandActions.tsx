'use client';
import React, { useRef, useState } from 'react';
import {
  Box,
  TextField,
  IconButton,
  Typography,
  Switch,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  CircularProgress,
  Tooltip,
} from '@mui/material';
import { Add as AddIcon, InsertDriveFile as InsertDriveFileIcon, GetApp as GetAppIcon, Upload as UploadIcon } from '@mui/icons-material';

interface BrandActionsProps {
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
  permissions?: {
    canAdd: boolean;
    canEdit: boolean;
    canDelete: boolean;
  };
}

const BrandActions: React.FC<BrandActionsProps> = ({
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
  permissions = { canAdd: true, canEdit: true, canDelete: true },
}) => {
  const [confirmationDialogOpen, setConfirmationDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { canAdd } = permissions;

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
      } catch (error: any) {
        console.error('Import error:', error);
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
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
        <TextField
          autoComplete="off"
          label="Search"
          className='some'
          variant="outlined"
          value={searchQuery}
          onChange={onSearchChange}
          sx={{ flex: 1 }}
        />
        <Box display="flex" alignItems="center" gap={1}>
          {/* Add Button */}
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <Tooltip title={!canAdd ? "No permission to add" : "Add Brand"}>
              <span>
                <IconButton
                  color="primary"
                  onClick={onDialogOpen}
                  className="icon-button-outline"
                  size="small"
                  sx={{ 
                    p: 0.3,
                    opacity: canAdd ? 1 : 0.5,
                  }}
                  disabled={!canAdd}
                >
                  <AddIcon />
                </IconButton>
              </span>
            </Tooltip>
            <Typography variant="caption" sx={{ maxWidth: 40, lineHeight: 1.1, mt: 0.2 }}>
              Add
            </Typography>
          </Box>

          {/* Sample CSV Button */}
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <IconButton
              color="primary"
              onClick={onSampleCSV}
              className="icon-button-outline"
              size="small"
              sx={{ p: 0.3 }}
            >
              <InsertDriveFileIcon />
            </IconButton>
            <Typography variant="caption" sx={{ maxWidth: 40, lineHeight: 1.1, mt: 0.2 }}>
              Sample
            </Typography>
          </Box>

          {/* Import Button */}
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <input
              type="file"
              accept=".csv"
              style={{ display: 'none' }}
              onChange={handleFileChange}
              disabled={importing}
              ref={fileInputRef}
            />
            <IconButton
              color="primary"
              className="icon-button-outline"
              sx={{ p: 0.3 }}
              size="small"
              disabled={importing}
              onClick={handleImportClick}
            >
              {importing ? <CircularProgress size={16} /> : <GetAppIcon />}
            </IconButton>
            <Typography variant="caption" sx={{ maxWidth: 40, lineHeight: 1.1, mt: 0.2 }}>
              Import
            </Typography>
          </Box>

          {/* Export Button */}
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <IconButton
              color="primary"
              onClick={onExportCSV}
              className="icon-button-outline"
              sx={{ p: 0.3 }}
              size="small"
              disabled={exporting}
            >
              {exporting ? <CircularProgress size={16} /> : <UploadIcon />}
            </IconButton>
            <Typography variant="caption" sx={{ maxWidth: 40, lineHeight: 1.1, mt: 0.2 }}>
              Export
            </Typography>
          </Box>

          {/* Show Deactivated Switch */}
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <Typography variant="caption" sx={{ maxWidth: 60, lineHeight: 1.1, mt: 0.2 }}>
              {showDeactivated ? 'Deactivated' : 'Activated'}
            </Typography>
            <Switch
              checked={showDeactivated}
              onChange={onToggleShowDeactivated}
              name="showDeactivated"
              size="small"
              sx={{ height: 24 }}
            />
          </Box>
        </Box>
      </Box>

      {/* Import Confirmation Dialog */}
      <Dialog open={confirmationDialogOpen} onClose={handleCancelImport}>
        <DialogTitle>Confirm Import</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to import {selectedFile?.name}? This action may overwrite existing data.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelImport} color="primary">Cancel</Button>
          <Button onClick={handleConfirmImport} color="primary" variant="contained" autoFocus disabled={importing}>
            Confirm
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default BrandActions;