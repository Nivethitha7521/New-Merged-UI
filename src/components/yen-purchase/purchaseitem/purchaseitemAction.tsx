'use client';
import React, { useRef, useState } from 'react';
import {
  Grid, IconButton, Box, Switch, Typography,
  Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, Button,
  Backdrop, CircularProgress, List, ListItem, ListItemText, ListItemSecondaryAction,
  Chip, Divider, Alert, Paper
} from '@mui/material';
import { 
  Add as AddIcon, 
  GetApp as GetAppIcon, 
  Upload as UploadIcon, 
  Restore as RestoreIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';

interface BackupInfo {
  backup_id: string;
  created_at: string;
  purchase_count: number;
  master_count: number;
}

interface ImportResult {
  row: number;
  data: Record<string, any>;
  error?: string;
  missingFields?: string[];
}

interface ImportResults {
  successful: ImportResult[];
  updated: ImportResult[];
  failed: ImportResult[];
}

interface PurchaseActionsProps {
  handleDialogOpen: () => void;
  handleDownloadSampleCSV: () => void;
  handleImportCSV: (file: File, mode: 'merge' | 'replace') => Promise<any>;
  handleExportCSV: () => void;
  handleRollback: (backupId: string) => Promise<void>;
  fetchBackups: () => Promise<BackupInfo[]>;
  showDeactivated: boolean;
  setShowDeactivated: (value: boolean) => void;
  loading?: boolean;
  exportStatus?: string;
  canAdd?: boolean;
  handleRefresh?: () => void;
}

const PurchaseActions: React.FC<PurchaseActionsProps> = ({
  handleDialogOpen,
  handleDownloadSampleCSV,
  handleImportCSV,
  handleExportCSV,
  handleRollback,
  fetchBackups,
  showDeactivated,
  setShowDeactivated,
  loading = false,
  exportStatus = 'idle',
  canAdd = true,
  handleRefresh
}) => {
  const inputFileRef = useRef<HTMLInputElement | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [importModeDialogOpen, setImportModeDialogOpen] = useState(false);
  const [confirmationDialogOpen, setConfirmationDialogOpen] = useState(false);
  const [rollbackDialogOpen, setRollbackDialogOpen] = useState(false);
  const [selectedMode, setSelectedMode] = useState<'merge' | 'replace'>('merge');
  const [importLoading, setImportLoading] = useState(false);
  const [backups, setBackups] = useState<BackupInfo[]>([]);
  const [loadingBackups, setLoadingBackups] = useState(false);
  const [selectedBackup, setSelectedBackup] = useState<string | null>(null);
  const [confirmRollbackOpen, setConfirmRollbackOpen] = useState(false);
  
  // Result dialogs
  const [importResultDialogOpen, setImportResultDialogOpen] = useState(false);
  const [importResults, setImportResults] = useState<ImportResults>({
    successful: [],
    updated: [],
    failed: []
  });
  const [rollbackResultDialogOpen, setRollbackResultDialogOpen] = useState(false);
  const [rollbackMessage, setRollbackMessage] = useState<string>('');
  const [rollbackError, setRollbackError] = useState<string | null>(null);

  const handleButtonClick = () => {
    if (inputFileRef.current) {
      inputFileRef.current.click();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
      setImportModeDialogOpen(true);
    }
  };

  const handleImportModeSelect = (mode: 'merge' | 'replace') => {
    setSelectedMode(mode);
    setImportModeDialogOpen(false);
    setConfirmationDialogOpen(true);
  };
const handleConfirmImport = async () => {
  if (!selectedFile) return;

  setImportLoading(true);
  try {
    await handleImportCSV(selectedFile, selectedMode);
    // Don't show dialog here - parent will show ImportErrorDialog
    setConfirmationDialogOpen(false);
    setImportModeDialogOpen(false);
    setSelectedFile(null);
    if (inputFileRef.current) {
      inputFileRef.current.value = '';
    }
  } catch (error: any) {
    console.error('Import error:', error);
    setConfirmationDialogOpen(false);
    setImportModeDialogOpen(false);
  } finally {
    setImportLoading(false);
  }
};
  const handleCancelImport = () => {
    setConfirmationDialogOpen(false);
    setImportModeDialogOpen(false);
    setSelectedFile(null);
    if (inputFileRef.current) {
      inputFileRef.current.value = '';
    }
  };

  const handleRollbackClick = async () => {
    setLoadingBackups(true);
    try {
      const backupList = await fetchBackups();
      setBackups(backupList);
      setRollbackDialogOpen(true);
    } catch (error) {
      console.error('Error fetching backups:', error);
      setRollbackMessage('Failed to fetch backups');
      setRollbackResultDialogOpen(true);
    } finally {
      setLoadingBackups(false);
    }
  };

  const handleSelectBackup = (backupId: string) => {
    setSelectedBackup(backupId);
    setRollbackDialogOpen(false);
    setConfirmRollbackOpen(true);
  };

  const handleConfirmRollback = async () => {
    if (selectedBackup) {
      setImportLoading(true);
      try {
        await handleRollback(selectedBackup);
        setRollbackMessage('Rollback completed successfully!');
        setRollbackError(null);
        setRollbackResultDialogOpen(true);
        setConfirmRollbackOpen(false);
        setSelectedBackup(null);
      } catch (error: any) {
        console.error('Rollback error:', error);
        setRollbackError(error?.message || 'Rollback failed');
        setRollbackMessage('');
        setRollbackResultDialogOpen(true);
        setConfirmRollbackOpen(false);
      } finally {
        setImportLoading(false);
      }
    }
  };

  const getModeDescription = () => {
    switch (selectedMode) {
      case 'merge':
        return 'Merge will add new items and update existing ones.';
      case 'replace':
        return 'Replace will delete all current items and import the new ones. A backup will be created automatically.';
      default:
        return '';
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Unknown';
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const getTotalItems = (backup: BackupInfo) => {
    return backup.purchase_count + backup.master_count;
  };

  const isLoading = loading || importLoading;

  return (
    <>
      <Grid container spacing={2} justifyContent='end' alignItems="center">
        {/* Refresh Button */}
        {handleRefresh && (
          <Grid item>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <IconButton
                color="default"
                onClick={handleRefresh}
                className='icon-button-outline'
                disabled={isLoading}
              >
                <RefreshIcon />
              </IconButton>
              <Typography variant="caption" align="center" sx={{ maxWidth: 80 }}>
                Refresh
              </Typography>
            </Box>
          </Grid>
        )}

        {/* Add Button */}
        <Grid item>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <IconButton
              color="primary"
              onClick={handleDialogOpen}
              className='icon-button-outline'
              disabled={isLoading || !canAdd}
            >
              <AddIcon />
            </IconButton>
            <Typography variant="caption" align="center" sx={{ maxWidth: 80 }}>
              Add Item
            </Typography>
          </Box>
        </Grid>

        {/* Rollback Button */}
        <Grid item>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <IconButton
              color="secondary"
              onClick={handleRollbackClick}
              className='icon-button-outline'
              disabled={isLoading}
            >
              <RestoreIcon />
            </IconButton>
            <Typography variant="caption" align="center" sx={{ maxWidth: 80 }}>
              Rollback
            </Typography>
          </Box>
        </Grid>
        
        {/* Download Sample CSV */}
        <Grid item>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <IconButton
              color="primary"
              onClick={handleDownloadSampleCSV}
              className='icon-button-outline'
              disabled={isLoading}
            >
              <InsertDriveFileIcon />
            </IconButton>
            <Typography variant="caption" align="center" sx={{ maxWidth: 80 }}>
              Sample CSV
            </Typography>
          </Box>
        </Grid>
        
        {/* Import CSV */}
        <Grid item>
          <input
            type="file"
            accept=".csv"
            ref={inputFileRef}
            style={{ display: 'none' }}
            onChange={handleFileChange}
            id="import-csv"
          />
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <IconButton
              color="primary"
              className="icon-button-outline"
              onClick={handleButtonClick}
              disabled={isLoading}
            >
              <GetAppIcon />
            </IconButton>
            <Typography variant="caption" align="center" sx={{ maxWidth: 80 }}>
              Import CSV
            </Typography>
          </Box>
        </Grid>
        
        {/* Export CSV */}
        <Grid item>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <IconButton
              color="primary"
              onClick={handleExportCSV}
              className='icon-button-outline'
              disabled={isLoading || exportStatus === 'loading'}
            >
              <UploadIcon />
            </IconButton>
            <Typography variant="caption" align="center" sx={{ maxWidth: 80 }}>
              Export CSV
            </Typography>
          </Box>
        </Grid>
        
        {/* Show Deactivated Switch */}
        <Grid item>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Typography sx={{ mr: 1 }}>Show Deactivated</Typography>
            <Switch
              checked={showDeactivated}
              onChange={(e) => setShowDeactivated(e.target.checked)}
              disabled={isLoading}
            />
          </Box>
        </Grid>
      </Grid>

      {/* Import Mode Selection Dialog */}
      <Dialog open={importModeDialogOpen} onClose={() => setImportModeDialogOpen(false)} disableEscapeKeyDown={isLoading}>
        <DialogTitle>Select Import Mode</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Choose how you want to import the data:
          </DialogContentText>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <Button
              variant="contained"
              onClick={() => handleImportModeSelect('merge')}
              disabled={isLoading}
            >
              Merge (Add/Update)
            </Button>
            <Button
              variant="contained"
              onClick={() => handleImportModeSelect('replace')}
              color="warning"
              disabled={isLoading}
            >
              Replace (Delete All & Import)
            </Button>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setImportModeDialogOpen(false)} disabled={isLoading}>
            Cancel
          </Button>
        </DialogActions>
      </Dialog>

      {/* Confirmation Dialog for Import */}
      <Dialog open={confirmationDialogOpen} onClose={handleCancelImport} disableEscapeKeyDown={isLoading}>
        <DialogTitle>Confirm Import</DialogTitle>
        <DialogContent>
          <DialogContentText>
            You selected <strong>{selectedMode}</strong> mode. {getModeDescription()}
          </DialogContentText>
          {selectedMode === 'replace' && (
            <Alert severity="warning" sx={{ mt: 2 }}>
              Warning: This will delete all existing items! A backup will be created.
            </Alert>
          )}
          <DialogContentText sx={{ mt: 2 }}>
            Are you sure you want to proceed?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelImport} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            onClick={handleConfirmImport}
            color={selectedMode === 'replace' ? 'warning' : 'primary'}
            disabled={isLoading}
          >
            {isLoading ? 'Processing...' : 'Confirm'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Import Results Dialog */}
      <Dialog 
        open={importResultDialogOpen} 
        onClose={() => setImportResultDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={1}>
            <UploadIcon color="primary" />
            <Typography variant="h6">Import Results</Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          {importResults.successful.length > 0 && (
            <Alert severity="success" sx={{ mb: 2 }}>
              Successfully imported {importResults.successful.length} items
            </Alert>
          )}
          {importResults.updated.length > 0 && (
            <Alert severity="info" sx={{ mb: 2 }}>
              Updated {importResults.updated.length} existing items
            </Alert>
          )}
          {importResults.failed.length > 0 && (
            <Alert severity="error" sx={{ mb: 2 }}>
              Failed to import {importResults.failed.length} items
            </Alert>
          )}
          
          {importResults.failed.length > 0 && (
            <Paper variant="outlined" sx={{ p: 2, mt: 2, maxHeight: 300, overflow: 'auto' }}>
              <Typography variant="subtitle2" gutterBottom>Failed Items:</Typography>
              {importResults.failed.map((fail, idx) => (
                <Box key={idx} sx={{ mb: 1, p: 1, bgcolor: '#ffebee', borderRadius: 1 }}>
                  <Typography variant="body2" color="error">
                    Row {fail.row}: {fail.error}
                  </Typography>
                  {fail.data.itemName && (
                    <Typography variant="caption" color="textSecondary">
                      Item: {fail.data.itemName}
                    </Typography>
                  )}
                </Box>
              ))}
            </Paper>
          )}
          
          {importResults.successful.length > 0 && (
            <Paper variant="outlined" sx={{ p: 2, mt: 2, maxHeight: 200, overflow: 'auto' }}>
              <Typography variant="subtitle2" gutterBottom>Successful Items (first 20):</Typography>
              {importResults.successful.slice(0, 20).map((success, idx) => (
                <Typography key={idx} variant="body2">
                  Row {success.row}: {success.data.itemName} (ID: {success.data.randomId})
                </Typography>
              ))}
              {importResults.successful.length > 20 && (
                <Typography variant="caption">... and {importResults.successful.length - 20} more</Typography>
              )}
            </Paper>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setImportResultDialogOpen(false)} variant="contained">
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Rollback Backup Selection Dialog */}
      <Dialog open={rollbackDialogOpen} onClose={() => setRollbackDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={1}>
            <RestoreIcon color="secondary" />
            <Typography variant="h6">Select Backup to Rollback</Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Alert severity="info" sx={{ mb: 2 }}>
            Select a backup to restore. This will replace BOTH Purchase Items AND Finished Goods (EX) items.
          </Alert>
          
          {loadingBackups ? (
            <Box display="flex" justifyContent="center" p={3}>
              <CircularProgress />
            </Box>
          ) : backups.length === 0 ? (
            <Alert severity="info">No backups available for rollback.</Alert>
          ) : (
            <List>
              {backups.map((backup, index) => (
                <React.Fragment key={backup.backup_id}>
                  {index > 0 && <Divider />}
                  <ListItem sx={{ bgcolor: '#fafafa', '&:hover': { bgcolor: '#f0f0f0' } }}>
                    <ListItemText
                      primary={
                        <Box>
                          <Typography variant="subtitle2" fontWeight="bold">
                            Backup: {backup.backup_id}
                          </Typography>
                          <Box display="flex" gap={1} mt={0.5} flexWrap="wrap">
                            <Chip
                              label={`Purchase: ${backup.purchase_count} items`}
                              size="small"
                              color="primary"
                              variant="outlined"
                            />
                            <Chip
                              label={`Master: ${backup.master_count} items`}
                              size="small"
                              color="secondary"
                              variant="outlined"
                            />
                            <Chip
                              label={`Total: ${getTotalItems(backup)} items`}
                              size="small"
                              color="info"
                            />
                          </Box>
                          <Typography variant="caption" display="block" sx={{ mt: 0.5 }}>
                            Created: {formatDate(backup.created_at)}
                          </Typography>
                        </Box>
                      }
                    />
                    <ListItemSecondaryAction>
                      <Button
                        variant="contained"
                        color="secondary"
                        size="small"
                        onClick={() => handleSelectBackup(backup.backup_id)}
                        startIcon={<RestoreIcon />}
                      >
                        Restore
                      </Button>
                    </ListItemSecondaryAction>
                  </ListItem>
                </React.Fragment>
              ))}
            </List>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRollbackDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Confirm Rollback Dialog */}
      <Dialog open={confirmRollbackOpen} onClose={() => setConfirmRollbackOpen(false)}>
        <DialogTitle>Confirm Rollback</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to restore from this backup?
          </DialogContentText>
          <Alert severity="warning" sx={{ mt: 2 }}>
            This will replace ALL current Purchase Items and Finished Goods (EX) items with the backed up data.
          </Alert>
          <Alert severity="info" sx={{ mt: 1 }}>
            This action cannot be undone unless you have another backup.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmRollbackOpen(false)} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleConfirmRollback} color="secondary" variant="contained" disabled={isLoading}>
            {isLoading ? 'Restoring...' : 'Yes, Restore Now'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Rollback Results Dialog */}
      <Dialog 
        open={rollbackResultDialogOpen} 
        onClose={() => setRollbackResultDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={1}>
            <RestoreIcon color={rollbackError ? 'error' : 'success'} />
            <Typography variant="h6">{rollbackError ? 'Rollback Failed' : 'Rollback Complete'}</Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          {rollbackError ? (
            <Alert severity="error" sx={{ mt: 1 }}>
              {rollbackError}
            </Alert>
          ) : (
            <Alert severity="success" sx={{ mt: 1 }}>
              {rollbackMessage || 'Rollback completed successfully!'}
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => {
              setRollbackResultDialogOpen(false);
              if (!rollbackError && handleRefresh) {
                handleRefresh();
              }
            }} 
            variant="contained"
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Loading Backdrop */}
      <Backdrop
        sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 2 }}
        open={isLoading}
      >
        <Box display="flex" flexDirection="column" alignItems="center" gap={2}>
          <CircularProgress color="inherit" />
          <Typography>Processing, please wait...</Typography>
        </Box>
      </Backdrop>
    </>
  );
};

export default PurchaseActions;