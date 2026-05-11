'use client';
import React, { useRef, useState } from 'react';
import {
  Grid, TextField, IconButton, Box, Typography, Switch,
  Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, Button,
  Backdrop, CircularProgress, Table, TableBody, TableCell, TableHead, TableRow, Snackbar, Alert, List, ListItem, ListItemText, ListItemSecondaryAction, Chip, Divider
} from '@mui/material';
import { Add as AddIcon, GetApp as GetAppIcon, Upload as UploadIcon, Refresh as RefreshIcon, Restore as RestoreIcon } from '@mui/icons-material';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import FilterAltIcon from '@mui/icons-material/FilterAlt';
import ClearIcon from '@mui/icons-material/Clear';

interface BackupInfo {
  backup_id: string;
  created_at: string;
  purchase_count: number;
  master_count: number;
}

interface PurchaseItemData {
  itemName: string;
  purchasecategoryName: string;
  purchasesubcategoryName: string;
  itemgroupName: string;
  uom: string;
  stockQuantity: number;
  supplier: string;
  purchasePrice: number;
  purchasetaxName: number;
  reorderLevel: number;
  itemType: string;
  hsnCode: string;
  shelfLife: string;
  vendorTag: string;
  locationName: string;
  barcode: string;
  description: string;
  createdDate: string;
  lastUpdatedDate: string;
  status: string;
}

interface ImportResults {
  successful: Array<{ row: number; data: Record<string, string> }>;
  updated: Array<{ row: number; data: Record<string, string>; error?: string }>;
  failed: Array<{ row: number; data: Record<string, string>; error: string; missingFields: string[] }>;
}

interface PurchaseControlsProps {
  itemName: string;
  category: string;
  subcategory: string;
  setItemName: (value: string) => void;
  setCategory: (value: string) => void;
  setSubcategory: (value: string) => void;
  handleFilter: () => void;
  handleClearFilters: () => void;
  handleDialogOpen?: () => void;
  handleDownloadSampleCSV: () => void;
  handleImportCSV: (file: File, mode: 'merge' | 'replace') => Promise<any>;
  handleExportCSV: () => void;
  handleRollback: (backupId: string) => Promise<void>;
  fetchBackups: () => Promise<BackupInfo[]>;
  showDeactivated: boolean;
  setShowDeactivated: (value: boolean) => void;
  loading: boolean;
  exportStatus: 'idle' | 'loading' | 'succeeded' | 'failed';
  canAdd: boolean;
  handleRefresh?: () => void;
}

const HEADER_MAPPING: { [key: string]: string } = {
  randomId: "Item Code",
  itemName: "Item Name",
  purchasecategoryName: "Category",
  purchasesubcategoryName: "Subcategory",
  itemgroupName: "Item Group",
  uom: "Unit of Measure",
  stockQuantity: "Stock Quantity",
  supplier: "Supplier",
  purchasePrice: "Purchase Price",
  purchasetaxName: "Tax Rate",
  reorderLevel: "Reorder Level",
  itemType: "Item Type",
  hsnCode: "HSN Code",
  shelfLife: "Shelf Life",
  vendorTag: "Vendor Tags",
  locationName: "Location",
  barcode: "Barcode",
  description: "Description",
  createdDate: "Created Date",
  lastUpdatedDate: "Last Updated Date",
  status: "Status"
};

const REQUIRED_FIELDS = ['itemName', 'purchasecategoryName', 'purchasesubcategoryName', 'itemgroupName', 'purchasePrice', 'uom', 'purchasetaxName'];

const PurchaseControls: React.FC<PurchaseControlsProps> = ({
  itemName,
  category,
  subcategory,
  setItemName,
  setCategory,
  setSubcategory,
  handleFilter,
  handleClearFilters,
  handleDialogOpen,
  canAdd,
  handleDownloadSampleCSV,
  handleImportCSV,
  handleExportCSV,
  handleRollback,
  fetchBackups,
  showDeactivated,
  setShowDeactivated,
  loading,
  exportStatus,
  handleRefresh 
}) => {
  const inputFileRef = useRef<HTMLInputElement | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [importModeDialogOpen, setImportModeDialogOpen] = useState(false);
  const [confirmationDialogOpen, setConfirmationDialogOpen] = useState(false);
  const [formatDialogOpen, setFormatDialogOpen] = useState(false);
  const [viewSampleOpen, setViewSampleOpen] = useState(false);
  const [importResultsDialogOpen, setImportResultsDialogOpen] = useState(false);
  const [rollbackDialogOpen, setRollbackDialogOpen] = useState(false);
  const [confirmRollbackOpen, setConfirmRollbackOpen] = useState(false);
  const [selectedMode, setSelectedMode] = useState<'merge' | 'replace'>('merge');
  const [importLoading, setImportLoading] = useState(false);
  const [backups, setBackups] = useState<BackupInfo[]>([]);
  const [loadingBackups, setLoadingBackups] = useState(false);
  const [selectedBackup, setSelectedBackup] = useState<string | null>(null);
  const [importResults, setImportResults] = useState<ImportResults>({
    successful: [],
    updated: [],
    failed: []
  });
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  const handleButtonClick = () => {
    setFormatDialogOpen(true);
  };

  const handleFormatDialogConfirm = () => {
    setFormatDialogOpen(false);
    if (inputFileRef.current) {
      inputFileRef.current.click();
    }
  };

  const handleFormatDialogCancel = () => {
    setFormatDialogOpen(false);
  };

  const handleViewSample = () => {
    setViewSampleOpen(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (!file.name.endsWith('.csv')) {
        setSnackbarMessage('Please upload a valid CSV file');
        setSnackbarOpen(true);
        return;
      }
      const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
      if (file.size > MAX_FILE_SIZE) {
        setSnackbarMessage('File size exceeds 5MB limit');
        setSnackbarOpen(true);
        return;
      }
      setSelectedFile(file);
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
      const result = await handleImportCSV(selectedFile, selectedMode);
      setImportResults({
        successful: result.successful || [],
        updated: result.updated || [],
        failed: result.failed || []
      });
      setImportResultsDialogOpen(true);
      setSnackbarMessage(`Imported ${result.inserted_count} items, updated ${result.updated_count}`);
      setSnackbarOpen(true);
    } catch (error: any) {
      setSnackbarMessage(`CSV import failed: ${error.message || error}`);
      setSnackbarOpen(true);
    } finally {
      setImportLoading(false);
      setConfirmationDialogOpen(false);
      setImportModeDialogOpen(false);
      setSelectedFile(null);
      if (inputFileRef.current) {
        inputFileRef.current.value = '';
      }
    }
  };

  const handleCancelImport = () => {
    setConfirmationDialogOpen(false);
    setImportModeDialogOpen(false);
    setFormatDialogOpen(false);
    setSelectedFile(null);
    if (inputFileRef.current) {
      inputFileRef.current.value = '';
    }
  };

  // Rollback handlers
  const handleRollbackClick = async () => {
    setLoadingBackups(true);
    try {
      const backupList = await fetchBackups();
      setBackups(backupList);
      setRollbackDialogOpen(true);
    } catch (error) {
      console.error('Error fetching backups:', error);
      setSnackbarMessage('Failed to fetch backups');
      setSnackbarOpen(true);
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
        setSnackbarMessage('Rollback completed successfully');
        setSnackbarOpen(true);
        setConfirmRollbackOpen(false);
        setSelectedBackup(null);
      } catch (error: any) {
        setSnackbarMessage(`Rollback failed: ${error.message || error}`);
        setSnackbarOpen(true);
      } finally {
        setImportLoading(false);
      }
    }
  };

  const handleClear = () => {
    setItemName('');
    setCategory('');
    setSubcategory('');
    handleClearFilters();
  };

  const handleCloseImportResultsDialog = () => {
    setImportResultsDialogOpen(false);
    setImportResults({ successful: [], updated: [], failed: [] });
  };

  const handleCloseSnackbar = () => {
    setSnackbarOpen(false);
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

  const handleDownloadSampleCSVInternal = () => {
    const sampleData: Partial<PurchaseItemData>[] = [
      {
        itemName: "Sample Item",
        purchasecategoryName: "Sample Category",
        purchasesubcategoryName: "Sample Subcategory",
        itemgroupName: "Sample Group",
        uom: "Unit",
        stockQuantity: 100,
        supplier: "Sample Supplier",
        purchasePrice: 50.00,
        purchasetaxName: 18,
        reorderLevel: 10,
        itemType: "Sample Type",
        hsnCode: "123456",
        shelfLife: "12 months",
        vendorTag: "Tag1,Tag2",
        locationName: "Warehouse 1",
        barcode: "123456789",
        description: "Sample description",
        createdDate: "09/06/2025",
        lastUpdatedDate: "",
        status: "active"
      }
    ];

    const headers = Object.keys(HEADER_MAPPING)
      .filter(field => field !== 'purchaseitemId')
      .map(field => HEADER_MAPPING[field]);
    let csvContent = headers.join(',') + '\n';
    sampleData.forEach(row => {
      const values = Object.keys(HEADER_MAPPING)
        .filter(field => field !== 'purchaseitemId')
        .map(field => {
          const value = row[field as keyof PurchaseItemData] ?? '';
          const escaped = ('' + value).replace(/"/g, '""');
          return `"${escaped}"`;
        });
      csvContent += values.join(',') + '\n';
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'sample_purchase_item.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const isLoading = loading || importLoading || exportStatus === 'loading';

  return (
    <Box sx={{ px: 1 }}>
      <Grid container spacing={1} alignItems="center" wrap="nowrap">
        {/* Search Fields and Filter/Clear Buttons */}
        <Grid item xs={6} sx={{ display: 'flex', alignItems: 'center' }}>
          <Grid container spacing={0.5} alignItems="center">
            <Grid item xs={3.5}>
              <TextField
                autoComplete="off"
                label="Item Name"
                variant="outlined"
                fullWidth
                value={itemName}
                onChange={(e) => setItemName(e.target.value)}
                disabled={isLoading}
                size="small"
              />
            </Grid>
            <Grid item xs={3.5}>
              <TextField
                autoComplete="off"
                label="Category"
                variant="outlined"
                fullWidth
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                disabled={isLoading}
                size="small"
              />
            </Grid>
            <Grid item xs={3.5}>
              <TextField
                label="Subcategory"
                variant="outlined"
                fullWidth
                value={subcategory}
                onChange={(e) => setSubcategory(e.target.value)}
                disabled={isLoading}
                size="small"
              />
            </Grid>
            <Grid item xs={0.75}>
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <IconButton
                  color="primary"
                  className="icon-button-outline"
                  onClick={handleFilter}
                  disabled={isLoading}
                  size="small"
                  sx={{ p: 0.2 }}
                >
                  <FilterAltIcon fontSize="small" />
                </IconButton>
                <Typography variant="caption" align="center" sx={{ maxWidth: 30, lineHeight: 1.1, mt: 0.1 }}>
                  Filter
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={0.75}>
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <IconButton
                  className="icon-button-outline"
                  color="primary"
                  onClick={handleClear}
                  disabled={isLoading}
                  size="small"
                  sx={{ p: 0.2 }}
                >
                  <ClearIcon fontSize="small" />
                </IconButton>
                <Typography variant="caption" align="center" sx={{ maxWidth: 30, lineHeight: 1.1, mt: 0.1 }}>
                  Clear
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </Grid>

        {/* Action Buttons and Toggle */}
        <Grid item xs={6} sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
          <Grid container spacing={1} alignItems="center" justifyContent="flex-end" wrap="nowrap">
            {/* Add Button */}
            <Grid item>
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <IconButton
                  color="primary"
                  onClick={handleDialogOpen}
                  className="icon-button-outline"
                  disabled={!canAdd || isLoading}
                  size="small"
                  sx={{ p: 0.3, opacity: canAdd ? 1 : 0.5 }}
                >
                  <AddIcon fontSize="small" />
                </IconButton>
                <Typography variant="caption" align="center" sx={{ maxWidth: 40, lineHeight: 1.1, mt: 0.2, color: canAdd ? 'text.primary' : 'grey.500', opacity: canAdd ? 1 : 0.7 }}>
                  Add
                </Typography>
              </Box>
            </Grid>

            {/* Rollback Button */}
            <Grid item>
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <IconButton
                  color="secondary"
                  onClick={handleRollbackClick}
                  className="icon-button-outline"
                  disabled={isLoading}
                  size="small"
                  sx={{ p: 0.3 }}
                >
                  <RestoreIcon fontSize="small" />
                </IconButton>
                <Typography variant="caption" align="center" sx={{ maxWidth: 45, lineHeight: 1.1, mt: 0.2 }}>
                  Rollback
                </Typography>
              </Box>
            </Grid>

            {/* Refresh Button */}
            <Grid item>
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <IconButton
                  color="primary"
                  onClick={handleRefresh}
                  className="icon-button-outline"
                  disabled={isLoading}
                  size="small"
                  sx={{ p: 0.3 }}
                >
                  <RefreshIcon fontSize="small" />
                </IconButton>
                <Typography variant="caption" align="center" sx={{ maxWidth: 45, lineHeight: 1.1, mt: 0.2 }}>
                  Refresh
                </Typography>
              </Box>
            </Grid>

            {/* Sample Button */}
            <Grid item>
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <IconButton
                  color="primary"
                  onClick={handleDownloadSampleCSVInternal}
                  className="icon-button-outline"
                  disabled={isLoading}
                  size="small"
                  sx={{ p: 0.3 }}
                >
                  <InsertDriveFileIcon fontSize="small" />
                </IconButton>
                <Typography variant="caption" align="center" sx={{ maxWidth: 45, lineHeight: 1.1, mt: 0.2 }}>
                  Sample
                </Typography>
              </Box>
            </Grid>

            {/* Import Button */}
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
                  size="small"
                  sx={{ p: 0.3 }}
                >
                  <GetAppIcon fontSize="small" />
                </IconButton>
                <Typography variant="caption" align="center" sx={{ maxWidth: 45, lineHeight: 1.1, mt: 0.2 }}>
                  Import
                </Typography>
              </Box>
            </Grid>

            {/* Export Button */}
            <Grid item>
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <IconButton
                  color="primary"
                  onClick={handleExportCSV}
                  className="icon-button-outline"
                  disabled={isLoading}
                  size="small"
                  sx={{ p: 0.3 }}
                >
                  <UploadIcon fontSize="small" />
                </IconButton>
                <Typography variant="caption" align="center" sx={{ maxWidth: 45, lineHeight: 1.1, mt: 0.2 }}>
                  Export
                </Typography>
              </Box>
            </Grid>

            {/* Show Deactivated Switch */}
            <Grid item>
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <Typography variant="caption" align="center" sx={{ maxWidth: 60, lineHeight: 1.1, mt: 0.2 }}>
                  {showDeactivated ? 'Deactivated' : 'Activated'}
                </Typography>
                <Switch
                  checked={showDeactivated}
                  onChange={(e) => setShowDeactivated(e.target.checked)}
                  disabled={isLoading}
                  size="small"
                  sx={{ height: 24 }}
                />
              </Box>
            </Grid>
          </Grid>
        </Grid>
      </Grid>

      {/* Format Requirement Dialog */}
      <Dialog open={formatDialogOpen} onClose={handleFormatDialogCancel} disableEscapeKeyDown={importLoading}>
        <DialogTitle>CSV Format Requirement</DialogTitle>
        <DialogContent>
          <DialogContentText>
            To ensure a successful import, your CSV file must follow the required format.
            Please review the sample format before proceeding.
          </DialogContentText>
          <Button variant="contained" color="primary" onClick={handleViewSample} sx={{ mt: 2 }}>
            View Sample CSV
          </Button>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleFormatDialogCancel} disabled={importLoading}>Cancel</Button>
          <Button onClick={handleFormatDialogConfirm} disabled={importLoading}>OK</Button>
        </DialogActions>
      </Dialog>

      {/* View Sample Dialog */}
      <Dialog open={viewSampleOpen} onClose={() => setViewSampleOpen(false)} disableEscapeKeyDown={importLoading}>
        <DialogTitle>Sample CSV Format</DialogTitle>
        <DialogContent>
          <DialogContentText>
            The CSV file must include the following required fields:
          </DialogContentText>
          <Box component="ul" sx={{ mt: 2, mb: 1 }}>
            {REQUIRED_FIELDS.map(field => (
              <Typography key={field} component="li" sx={{ mb: 0.5 }}>
                {HEADER_MAPPING[field]}
              </Typography>
            ))}
          </Box>
          <DialogContentText>
            Optional fields: {Object.keys(HEADER_MAPPING)
              .filter(field => !REQUIRED_FIELDS.includes(field) && field !== 'purchaseitemId')
              .map(field => HEADER_MAPPING[field])
              .join(', ')}.
          </DialogContentText>
          <Button variant="contained" color="primary" onClick={handleDownloadSampleCSVInternal} sx={{ mt: 2 }}>
            Download Sample CSV
          </Button>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewSampleOpen(false)} disabled={importLoading}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Import Mode Dialog - Only Merge and Replace */}
      <Dialog open={importModeDialogOpen} onClose={() => setImportModeDialogOpen(false)} disableEscapeKeyDown={importLoading}>
        <DialogTitle>Select Import Mode</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Choose how you want to import the data:
          </DialogContentText>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <Button
              variant="contained"
              onClick={() => handleImportModeSelect('merge')}
              disabled={importLoading}
            >
              Merge (Add/Update)
            </Button>
            <Button
              variant="contained"
              onClick={() => handleImportModeSelect('replace')}
              color="warning"
              disabled={importLoading}
            >
              Replace (Delete All & Import)
            </Button>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setImportModeDialogOpen(false)} disabled={importLoading}>
            Cancel
          </Button>
        </DialogActions>
      </Dialog>

      {/* Confirmation Dialog for Import */}
      <Dialog open={confirmationDialogOpen} onClose={() => setConfirmationDialogOpen(false)} disableEscapeKeyDown={importLoading}>
        <DialogTitle>Confirm Import</DialogTitle>
        <DialogContent>
          <DialogContentText>
            You selected <strong>{selectedMode}</strong> mode. {getModeDescription()}
          </DialogContentText>
          {selectedMode === 'replace' && (
            <DialogContentText color="warning.main" sx={{ mt: 1 }}>
              Warning: This will delete all existing items!
            </DialogContentText>
          )}
          <DialogContentText sx={{ mt: 2 }}>
            Are you sure you want to proceed?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelImport} disabled={importLoading}>
            Cancel
          </Button>
          <Button
            onClick={handleConfirmImport}
            color={selectedMode === 'replace' ? 'warning' : 'primary'}
            disabled={importLoading}
          >
            {importLoading ? 'Processing...' : 'Confirm'}
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
                          <Box display="flex" gap={1} mt={0.5}>
                            <Chip label={`Purchase: ${backup.purchase_count} items`} size="small" color="primary" variant="outlined" />
                            <Chip label={`Master: ${backup.master_count} items`} size="small" color="secondary" variant="outlined" />
                            <Chip label={`Total: ${getTotalItems(backup)} items`} size="small" color="info" />
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
          <Button onClick={() => setConfirmRollbackOpen(false)} disabled={importLoading}>Cancel</Button>
          <Button onClick={handleConfirmRollback} color="secondary" variant="contained" disabled={importLoading}>
            {importLoading ? 'Restoring...' : 'Yes, Restore Now'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Import Results Dialog */}
      <Dialog open={importResultsDialogOpen} onClose={handleCloseImportResultsDialog} maxWidth="md" fullWidth>
        <DialogTitle>CSV Import Results</DialogTitle>
        <DialogContent>
          {importResults.successful.length > 0 && (
            <>
              <Typography variant="subtitle1" gutterBottom>Successfully Inserted Rows</Typography>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Row</TableCell>
                    <TableCell>Item Name</TableCell>
                    <TableCell>Category</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {importResults.successful.map((entry, idx) => (
                    <TableRow key={idx} sx={{ backgroundColor: '#e6ffe6' }}>
                      <TableCell>{entry.row}</TableCell>
                      <TableCell>{entry.data.itemName}</TableCell>
                      <TableCell>{entry.data.purchasecategoryName}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </>
          )}
          {importResults.updated.length > 0 && (
            <>
              <Typography variant="subtitle1" sx={{ mt: 2, color: '#d4a017' }} gutterBottom>Updated Rows (Duplicates)</Typography>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Row</TableCell>
                    <TableCell>Item Name</TableCell>
                    <TableCell>Category</TableCell>
                    <TableCell>Reason</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {importResults.updated.map((entry, idx) => (
                    <TableRow key={idx} sx={{ backgroundColor: '#fff9e6' }}>
                      <TableCell>{entry.row}</TableCell>
                      <TableCell>{entry.data.itemName}</TableCell>
                      <TableCell>{entry.data.purchasecategoryName}</TableCell>
                      <TableCell>{entry.error || 'Duplicate item'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </>
          )}
          {importResults.failed.length > 0 && (
            <>
              <Typography variant="subtitle1" color="error" gutterBottom sx={{ mt: 2 }}>Failed Rows</Typography>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Row</TableCell>
                    <TableCell>Item Name</TableCell>
                    <TableCell>Category</TableCell>
                    <TableCell>Error</TableCell>
                    <TableCell>Missing Fields</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {importResults.failed.map((entry, idx) => (
                    <TableRow key={idx} sx={{ backgroundColor: '#ffe6e6' }}>
                      <TableCell>{entry.row}</TableCell>
                      <TableCell>{entry.data.itemName || '-'}</TableCell>
                      <TableCell>{entry.data.purchasecategoryName || '-'}</TableCell>
                      <TableCell>{entry.error}</TableCell>
                      <TableCell>{entry.missingFields.join(', ')}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </>
          )}
          {importResults.successful.length === 0 && importResults.updated.length === 0 && importResults.failed.length === 0 && (
            <Typography variant="body1">No results to display.</Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseImportResultsDialog} color="primary">Close</Button>
        </DialogActions>
      </Dialog>

      {/* Loading Backdrop */}
      <Backdrop sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 2 }} open={importLoading || exportStatus === 'loading'}>
        <Box display="flex" flexDirection="column" alignItems="center" gap={2}>
          <CircularProgress color="inherit" />
          <Typography>{importLoading ? 'Import is in progress, please wait...' : 'Export is in progress, please wait...'}</Typography>
        </Box>
      </Backdrop>

      {/* Snackbar for Feedback */}
      <Snackbar open={snackbarOpen} autoHideDuration={6000} onClose={handleCloseSnackbar}>
        <Alert onClose={handleCloseSnackbar} severity={snackbarMessage.includes('failed') ? 'error' : 'success'} sx={{ width: '100%' }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default PurchaseControls;