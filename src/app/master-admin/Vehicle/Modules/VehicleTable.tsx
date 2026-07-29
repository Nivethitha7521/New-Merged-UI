


'use client';

import React, { useRef, useState, useCallback, useMemo, memo } from 'react';
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  InputAdornment,
  Pagination,
  Switch,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';

import {
  Add as AddIcon,
  Description as DescriptionIcon,
  GetApp as GetAppIcon,
  Search as SearchIcon,
  Undo as UndoIcon,
  Upload as UploadIcon,
} from '@mui/icons-material';

import EditIcon from '@mui/icons-material/EditOutlined';
import DeleteIcon from '@mui/icons-material/DeleteOutlineRounded';
import RefreshIcon from '@mui/icons-material/RestoreRounded';
import { useSelector } from 'react-redux';
import { RootState, useAppDispatch } from '../../../../redux/store';
import {
  Exportheader,
  ExportVehicles,
  fetchVehicle,
  ImportVehicles,
  rollbackVehilce,
  setSnackbarMessage,
  setSnackbarOpen,
} from '../Features/vehicleSlice';
import ImportResultDialog, { ImportResultData } from '@/app/Components/ImportResultDialog';
import { Vehicle } from '../Models/vehicleModel';

// ─── Types ────────────────────────────────────────────────────────────────────

type ImportMode = 'import' | 'merge' | 'replace';

interface VehicleTableContainerProps {
  handleEdit: (vehicle: Vehicle) => void;
  handleDeactivate: (vehicle: Vehicle) => void;
  handleActivate: (vehicle: Vehicle) => void;
  handleOpen: () => void;
  showDeactivated: boolean;
  setShowDeactivated: (value: boolean) => void;
  searchValue: string;
  setSearchValue: (value: string) => void;
}

// ─── Constants (stable module-level references — never recreated on render) ───

const VALID_EXTENSIONS = ['.csv', '.xlsx', '.xls'] as const;

const IMPORT_MODES: { mode: ImportMode; label: string; color: 'primary' | 'secondary' | 'error' }[] = [
  { mode: 'import',  label: 'Import',  color: 'primary'   },
  { mode: 'merge',   label: 'Merge',   color: 'secondary' },
  { mode: 'replace', label: 'Replace', color: 'error'     },
];

const DIALOG_PAPER_SMALL  = { className: 'dialog-paper-small'  } as const;
const DIALOG_PAPER_MEDIUM = { className: 'dialog-paper-medium' } as const;

const TOOLBAR_BOX_SX = {
  width: '99%',
  boxSizing: 'border-box',
  mt: 2,
} as const;

const TITLE_TYPOGRAPHY_SX = {
  fontFamily: "'Poppins', sans-serif",
  fontWeight: 750,
  margin: 0,
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  maxWidth: '100%',
} as const;

const SEARCH_ICON_SX = {
  position: 'absolute',
  top: '50%',
  left: '10px',
  transform: 'translateY(-50%)',
  color: 'text.secondary',
  fontSize: '1.2rem',
  pointerEvents: 'none',
} as const;

const SEARCH_BOX_SX = { position: 'relative', width: '280px' } as const;

const SEARCH_INPUT_STYLE: React.CSSProperties = {
  padding: '6px 10px 6px 38px',
  fontSize: '0.8rem',
  borderRadius: '6px',
  border: '1px solid #ccc',
  fontFamily: 'Poppins, sans-serif',
  width: '280px',
} as const;

const SWITCH_LABEL_SX = {
  marginLeft: 1,
  marginRight: 1,
  '& .MuiFormControlLabel-label': {
    fontSize: '0.75rem',
    fontFamily: "'Poppins', sans-serif",
  },
} as const;

const IMPORT_DIALOG_TITLE_SX = {
  fontFamily: "'Poppins', sans-serif",
  fontWeight: 400,
} as const;

const FILE_NAME_BODY_SX = {
  mb: 1,
  fontFamily: "'Poppins', sans-serif",
  fontSize: '0.7rem',
} as const;

const IMPORT_MODE_LABEL_SX = {
  fontFamily: "'Poppins', sans-serif",
  fontWeight: 500,
  mb: 2,
  fontSize: '0.8rem',
} as const;

const IMPORT_MODE_BOX_SX = {
  display: 'flex',
  flexDirection: 'column',
  gap: 1.5,
  alignItems: 'center',
} as const;

const IMPORT_BUTTON_SX = { width: 180 } as const;

const DIVIDER_SX = { my: 2 } as const;

const DIALOG_ACTIONS_SX = { px: 3, pb: 2 } as const;

const ERROR_DIALOG_TITLE_SX = {
  fontFamily: "'Poppins', sans-serif",
  fontWeight: 600,
  color: 'error.main',
  display: 'flex',
  alignItems: 'center',
  gap: 1,
} as const;

const ERROR_ICON_BOX_SX = {
  backgroundColor: 'error.light',
  borderRadius: '50%',
  width: 32,
  height: 32,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: 'white',
} as const;

const ERROR_COUNT_SX = {
  mb: 2,
  fontFamily: "'Poppins', sans-serif",
  fontWeight: 500,
  fontSize: '0.7rem',
} as const;

const ERROR_LIST_BOX_SX = {
  maxHeight: '400px',
  overflowY: 'auto',
  backgroundColor: '#f5f5f5',
  borderRadius: 1,
  p: 2,
} as const;

const ERROR_ITEM_SX = {
  mb: 1.5,
  p: 1.5,
  backgroundColor: 'white',
  borderLeft: '3px solid',
  borderColor: 'error.main',
  borderRadius: 1,
  fontFamily: "'Poppins', sans-serif",
} as const;

const ERROR_TEXT_SX = {
  fontFamily: "'Courier New', monospace",
  fontSize: '0.85rem',
  fontWeight: 600,
  color: 'text.primary',
} as const;

const ERROR_CAPTION_SX = {
  mt: 2,
  display: 'block',
  fontFamily: "'Poppins', sans-serif",
  color: 'text.secondary',
} as const;

const CONFIRM_TITLE_SX = {
  fontFamily: "'Poppins', sans-serif",
  fontWeight: 500,
} as const;

const CONFIRM_BODY_SX = {
  fontFamily: "'Poppins', sans-serif",
  fontSize: '0.9rem',
} as const;

const PAGINATION_BOX_SX = { display: 'flex', justifyContent: 'center', mt: 0.5 } as const;

const TABLE_CONTAINER_STYLE: React.CSSProperties = { maxHeight: 'calc(92vh - 170px)' } as const;

const TH_STYLE: React.CSSProperties = { textAlign: 'center' } as const;
const TD_STYLE: React.CSSProperties = { textAlign: 'center' } as const;

const FILE_INPUT_STYLE: React.CSSProperties = { display: 'none' } as const;

// ─── Component ────────────────────────────────────────────────────────────────

const VehicleTableContainer: React.FC<VehicleTableContainerProps> = ({
  handleEdit,
  handleDeactivate,
  handleActivate,
  handleOpen,
  showDeactivated,
  setShowDeactivated,
  searchValue,
  setSearchValue,
}) => {
  const dispatch = useAppDispatch();

  const {
    items: vehicles,
    deactivatedItems,
    loading,
    totalPages,
    page,
    limit,
  } = useSelector((state: RootState) => state.vehicles);

  // ── Local state ────────────────────────────────────────────────────────────
  const [isImporting,            setIsImporting           ] = useState(false);
  const [importDialogOpen,       setImportDialogOpen      ] = useState(false);
  const [selectedFile,           setSelectedFile          ] = useState<File | null>(null);
  const [importMode,             setImportMode            ] = useState<ImportMode>('import');
  const [errorDialogOpen,        setErrorDialogOpen       ] = useState(false);
  const [validationErrors,       setValidationErrors      ] = useState<string[]>([]);
  const [confirmDialogOpen,      setConfirmDialogOpen     ] = useState(false);
  const [confirmationMessage,    setConfirmationMessage   ] = useState('');
  const [importResultDialogOpen, setImportResultDialogOpen] = useState(false);
  const [importResult,           setImportResult          ] = useState<ImportResultData | null>(null);

  // Stored as a ref instead of state — avoids the React "function as lazy
  // initialiser" anti-pattern and eliminates the unnecessary re-render on set.
  const confirmationActionRef = useRef<() => Promise<void>>(() => Promise.resolve());

  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Derived values (memoised) ──────────────────────────────────────────────

  const displayedVehicles = useMemo(
    () => (showDeactivated ? deactivatedItems : vehicles),
    [showDeactivated, deactivatedItems, vehicles],
  );

  const toggleLabel = showDeactivated ? 'Show Activated' : 'Show Deactivated';
  const tableTitle  = showDeactivated ? 'Deactivated Vehicles' : 'Active Vehicles';

  // ── Stable handlers ────────────────────────────────────────────────────────

  const handleExportCSV = useCallback(async () => {
    try {
      await dispatch(ExportVehicles()).unwrap();
    } catch (error) {
      console.error('Export error:', error);
    }
  }, [dispatch]);

  const handleImportClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileSelect = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (file) {
        const ext = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
        if (!VALID_EXTENSIONS.includes(ext as typeof VALID_EXTENSIONS[number])) {
          dispatch(setSnackbarMessage('Please upload a valid CSV or Excel file'));
          dispatch(setSnackbarOpen(true));
          return;
        }
        setSelectedFile(file);
        setImportMode('import');
        setImportDialogOpen(true);
      }
      // Reset so the same file can be re-selected
      if (event.target) event.target.value = '';
    },
    [dispatch],
  );

  const handleImportDialogClose = useCallback(() => {
    setImportDialogOpen(false);
    setSelectedFile(null);
  }, []);

  const handleImportSubmit = useCallback(async () => {
    if (!selectedFile) return;

    setIsImporting(true);
    setImportDialogOpen(false);

    try {
      const result = await dispatch(
        ImportVehicles({ file: selectedFile, mode: importMode }),
      ).unwrap();

      dispatch(fetchVehicle({ search: searchValue, page: 1 }));
      setValidationErrors([]);
      setImportResult(result as unknown as ImportResultData);
      setImportResultDialogOpen(true);
    } catch (error: unknown) {
      console.error('Import error:', error);

      if (error && typeof error === 'object') {
        const err = error as Record<string, unknown>;
        if (Array.isArray(err.errors) && err.errors.length > 0) {
          setValidationErrors(err.errors as string[]);
          setErrorDialogOpen(true);
        } else if (typeof err.message === 'string') {
          dispatch(setSnackbarMessage(err.message));
          dispatch(setSnackbarOpen(true));
        }
      } else if (typeof error === 'string') {
        dispatch(setSnackbarMessage(error));
        dispatch(setSnackbarOpen(true));
      } else {
        dispatch(setSnackbarMessage('Failed to import Vehicle data'));
        dispatch(setSnackbarOpen(true));
      }
    } finally {
      setIsImporting(false);
      setSelectedFile(null);
    }
  }, [dispatch, importMode, searchValue, selectedFile]);

  const handleRollback = useCallback(() => {
    setConfirmationMessage(
      'Are you sure you want to rollback to the previous data? This will undo the last replace operation.',
    );
    confirmationActionRef.current = async () => {
      try {
        await dispatch(rollbackVehilce()).unwrap();
        dispatch(fetchVehicle({ search: '', page: 1 }));
      } catch (error) {
        console.error('Rollback error:', error);
      } finally {
        setConfirmDialogOpen(false);
      }
    };
    setConfirmDialogOpen(true);
  }, [dispatch]);

  const handleDownloadSampleCSV = useCallback(async () => {
    setIsImporting(true);
    try {
      await dispatch(Exportheader()).unwrap();
      dispatch(setSnackbarMessage('Sample CSV downloaded successfully'));
      dispatch(setSnackbarOpen(true));
    } catch {
      dispatch(setSnackbarMessage('Failed to download sample CSV'));
      dispatch(setSnackbarOpen(true));
    } finally {
      setIsImporting(false);
    }
  }, [dispatch]);

  const handleToggleDeactivated = useCallback(
    () => setShowDeactivated(!showDeactivated),
    [setShowDeactivated, showDeactivated],
  );

  const handleCloseErrorDialog = useCallback(() => setErrorDialogOpen(false), []);

  const handleCloseConfirmDialog = useCallback(() => setConfirmDialogOpen(false), []);

  const handleConfirmAction = useCallback(() => {
    confirmationActionRef.current();
  }, []);

  const handlePaginationChange = useCallback(
    (_event: React.ChangeEvent<unknown>, value: number) => {
      dispatch(fetchVehicle({ search: searchValue, page: value }));
    },
    [dispatch, searchValue],
  );

  const handleCloseImportResult = useCallback(() => {
    setImportResultDialogOpen(false);
    setImportResult(null);
  }, []);

  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => setSearchValue(e.target.value),
    [setSearchValue],
  );

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <>
<Box className="location-master-toolbar vehicle-master-toolbar"> 
   <Typography className="location-master-toolbar-title">
    {tableTitle}
  </Typography>

  <TextField
    type="search"
    value={searchValue}
    onChange={handleSearchChange}
    placeholder="Search Vehicles..."
className="purchase-reference-search location-master-search vehicle-master-search"
    inputProps={{
      'aria-label': 'Search vehicles',
    }}
    InputProps={{
      startAdornment: (
        <InputAdornment position="start">
          <SearchIcon className="purchase-reference-search-icon" />
        </InputAdornment>
      ),
    }}
  />

<Box className="purchase-reference-actions location-master-actions vehicle-master-actions">
      {!showDeactivated && (
      <>
        <Button
          type="button"
          variant="outlined"
          startIcon={<AddIcon />}
          onClick={handleOpen}
          disabled={isImporting}
          className="purchase-reference-action-button"
        >
          Add New
        </Button>

        <Button
          type="button"
          variant="outlined"
          startIcon={
            isImporting
              ? <CircularProgress size={16} />
              : <GetAppIcon />
          }
          onClick={handleImportClick}
          disabled={isImporting}
          className="purchase-reference-action-button"
        >
          {isImporting ? 'Importing...' : 'Import'}
        </Button>

        <Button
          type="button"
          variant="outlined"
          startIcon={<UploadIcon />}
          onClick={handleExportCSV}
          disabled={isImporting}
          className="purchase-reference-action-button"
        >
          Export
        </Button>

        <Button
          type="button"
          variant="outlined"
          startIcon={<DescriptionIcon />}
          onClick={handleDownloadSampleCSV}
          disabled={isImporting}
          className="purchase-reference-action-button"
        >
          Sample
        </Button>

        <Button
          type="button"
          variant="outlined"
          startIcon={<UndoIcon />}
          onClick={handleRollback}
          disabled={isImporting}
          className="purchase-reference-action-button"
        >
          Rollback
        </Button>
      </>
    )}

    <Box className="purchase-reference-active-toggle">
      <Typography component="span">
        Show Active Only
      </Typography>

      <Switch
        checked={!showDeactivated}
        onChange={handleToggleDeactivated}
        size="small"
        disabled={isImporting}
        inputProps={{
          'aria-label': 'Show active vehicles only',
        }}
      />
    </Box>
  </Box>
</Box>

      {/* ── Hidden file input ── */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelect}
        accept=".csv,.xlsx,.xls"
        style={FILE_INPUT_STYLE}
      />

      {/* ── Import Mode Dialog ── */}
      <Dialog
        open={importDialogOpen}
        onClose={handleImportDialogClose}
        PaperProps={DIALOG_PAPER_SMALL}
      >
        <DialogTitle className="dialog-title" sx={IMPORT_DIALOG_TITLE_SX}>
          Select Import Mode
        </DialogTitle>

        <DialogContent className="dialog-content">
          <Box sx={{ pt: 1 }}>
            <Typography variant="body2" sx={FILE_NAME_BODY_SX}>
              Selected file: <strong>{selectedFile?.name}</strong>
            </Typography>

            <Divider sx={DIVIDER_SX} />

            <Typography sx={IMPORT_MODE_LABEL_SX}>Choose import mode:</Typography>

            <Box sx={IMPORT_MODE_BOX_SX}>
              {IMPORT_MODES.map(({ mode, label, color }) => (
                <Button
                  key={mode}
                  variant={importMode === mode ? 'contained' : 'outlined'}
                  color={color}
                  onClick={() => setImportMode(mode)}
                  sx={IMPORT_BUTTON_SX}
                >
                  <Typography fontWeight={500}>{label}</Typography>
                </Button>
              ))}
            </Box>
          </Box>
        </DialogContent>

        <DialogActions className="dialog-actions" sx={DIALOG_ACTIONS_SX}>
          <button className="btn-secondary" onClick={handleImportDialogClose}>
            Cancel
          </button>
          <button className="btn-primary" onClick={handleImportSubmit}>
            Confirm
          </button>
        </DialogActions>
      </Dialog>

      {/* ── Validation Error Dialog ── */}
      <Dialog
        open={errorDialogOpen}
        onClose={handleCloseErrorDialog}
        PaperProps={DIALOG_PAPER_MEDIUM}
      >
        <DialogTitle className="dialog-title" sx={ERROR_DIALOG_TITLE_SX}>
          <Box component="span" sx={ERROR_ICON_BOX_SX}>!</Box>
          Validation Failed
        </DialogTitle>

        <DialogContent className="dialog-content">
          <Box sx={{ pt: 0 }}>
            <Typography variant="body1" sx={ERROR_COUNT_SX}>
              Import failed with {validationErrors.length} error(s):
            </Typography>

            <Box sx={ERROR_LIST_BOX_SX}>
              {validationErrors.map((error, index) => (
                <Box key={index} sx={ERROR_ITEM_SX}>
                  <Typography variant="body2" sx={ERROR_TEXT_SX}>
                    {error}
                  </Typography>
                </Box>
              ))}
            </Box>

            <Typography variant="caption" sx={ERROR_CAPTION_SX}>
              Please fix the errors in your file and try importing again.
            </Typography>
          </Box>
        </DialogContent>

        <DialogActions className="dialog-actions" sx={DIALOG_ACTIONS_SX}>
          <button className="btn-primary" onClick={handleCloseErrorDialog}>
            Close
          </button>
        </DialogActions>
      </Dialog>

      {/* ── Confirmation Dialog ── */}
      <Dialog
        open={confirmDialogOpen}
        onClose={handleCloseConfirmDialog}
        PaperProps={DIALOG_PAPER_SMALL}
      >
        <DialogTitle className="dialog-title" sx={CONFIRM_TITLE_SX}>
          Confirm Action
        </DialogTitle>

        <DialogContent className="dialog-content">
          <Typography sx={CONFIRM_BODY_SX}>{confirmationMessage}</Typography>
        </DialogContent>

        <DialogActions className="dialog-actions" sx={DIALOG_ACTIONS_SX}>
          <button className="btn-secondary" onClick={handleCloseConfirmDialog}>
            Cancel
          </button>
          <button className="btn-primary" onClick={handleConfirmAction}>
            Confirm
          </button>
        </DialogActions>
      </Dialog>

      {/* ── Table ── */}
<Box className="purchase-master-table-shell">
  <div className="purchase-native-table-wrapper">
    <table className="purchase-native-table">
          <thead>
            <tr>
              <th style={TH_STYLE}>S.NO</th>
              <th style={TH_STYLE}>Vehicle Id</th>
              <th style={TH_STYLE}>Vehicle Name</th>
              <th style={TH_STYLE}>Vehicle Model</th>
              <th style={TH_STYLE}>Vehicle Number</th>
              <th style={TH_STYLE}>Fuel Type</th>
              <th style={TH_STYLE}>Branch Name</th>
              <th style={TH_STYLE}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
               <td colSpan={8} className="empty-state">

                  <h3 style={{ fontWeight: 'bold' }}>Loading...</h3>
                </td>
              </tr>
            ) : displayedVehicles.length === 0 ? (
              <tr>
                <td colSpan={8} style={TD_STYLE}>
                  <h2>
                    {showDeactivated
                      ? 'No deactivated vehicles found'
                      : 'No active vehicles found'}
                  </h2>
                </td>
              </tr>
            ) : (
              displayedVehicles.map((vehicle, index) => (
                <tr key={vehicle.id || index}>
                  <td style={TD_STYLE}>{(page - 1) * limit + index + 1}</td>
                <td>
  <span className="purchase-master-id-pill">
    {vehicle.vehicleId || '-'}
  </span>
</td>
                 <td>
  <Box className="purchase-master-name-cell">
    <span className="purchase-master-avatar">
      {(vehicle.vehicleName || '?').charAt(0).toUpperCase()}
    </span>

    <span>{vehicle.vehicleName || '-'}</span>
  </Box>
</td>
                  <td style={TD_STYLE}>{vehicle.vehicleModel}</td>
                  <td style={TD_STYLE}>{vehicle.vehicleNo}</td>
                  <td style={TD_STYLE}>{vehicle.fuelType}</td>
                  <td style={TD_STYLE}>{vehicle.branchName}</td>
                 <td style={{ textAlign: 'center' }}>
  <Box className="purchase-master-actions">
    {showDeactivated ? (
      <Tooltip title="Activate vehicle" arrow>
        <IconButton
          type="button"
          onClick={() => handleActivate(vehicle)}
          className="purchase-master-action-button is-activate"
          aria-label="Activate vehicle"
        >
          <RefreshIcon fontSize="small" />
        </IconButton>
      </Tooltip>
    ) : (
      <>
        <Tooltip title="Edit vehicle" arrow>
          <IconButton
            type="button"
            onClick={() => handleEdit(vehicle)}
            className="purchase-master-action-button is-edit"
            aria-label="Edit vehicle"
          >
            <EditIcon fontSize="small" />
          </IconButton>
        </Tooltip>

        <Tooltip title="Deactivate vehicle" arrow>
          <IconButton
            type="button"
            onClick={() => handleDeactivate(vehicle)}
            className="purchase-master-action-button is-delete"
            aria-label="Deactivate vehicle"
          >
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </>
    )}
  </Box>
</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
</Box>
      {/* ── Pagination ── */}
      {totalPages > 1 && (
       <Box className="master-admin-pagination">
          <Pagination
            count={totalPages}
            page={page}
            color="primary"
            onChange={handlePaginationChange}
          />
        </Box>
      )}

      {/* ── Import Result Dialog ── */}
      <ImportResultDialog
        open={importResultDialogOpen}
        onClose={handleCloseImportResult}
        result={importResult}
        moduleName="Vehicle"
      />
    </>
  );
};

export default memo(VehicleTableContainer);