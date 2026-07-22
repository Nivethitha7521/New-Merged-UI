

'use client';

import React, { useRef, useState } from 'react';
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControlLabel,
  IconButton,
  Pagination,
  Switch,
  Typography,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Description as DescriptionIcon,
  Edit as EditIcon,
  GetApp as GetAppIcon,
  Refresh as RefreshIcon,
  Search as SearchIcon,
  Undo as UndoIcon,
  Upload as UploadIcon,
} from '@mui/icons-material';
import { useAppDispatch, useAppSelector } from '../../../../redux/store';
import { Sections } from '../Models/sectionsModels';
import {
  ExportSections,
  Exportheader,
  ImportSections,
  fetchSections,
  rollbackSections,
  selectSections,
  setSnackbarMessage,
  setSnackbarOpen,
} from '../Features/sectionsSlice';
import ImportResultDialog, { ImportResultData } from '@/app/Components/ImportResultDialog';

// ─── Types ────────────────────────────────────────────────────────────────────

interface SectionsTableContainerProps {
  handleEdit: (section: Sections) => void;
  handleDeactivate: (section: Sections) => void;
  handleActivate: (section: Sections) => void;
  handleOpen: () => void;
  showDeactivated: boolean;
  setShowDeactivated: (value: boolean) => void;
  searchValue: string;
  setSearchValue: (value: string) => void;
}

type ImportMode = 'import' | 'merge' | 'replace';

interface ImportModeOption {
  mode: ImportMode;
  color: 'primary' | 'secondary' | 'error';
  label: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const VALID_EXTENSIONS = ['.csv', '.xlsx', '.xls'] as const;

const IMPORT_MODE_OPTIONS: ImportModeOption[] = [
  { mode: 'import', color: 'primary', label: 'Import' },
  { mode: 'merge', color: 'secondary', label: 'Merge' },
  { mode: 'replace', color: 'error', label: 'Replace' },
];

const ROLLBACK_MESSAGE =
  'Are you sure you want to rollback to the previous data? This will undo the last replace operation.';

// ─── Shared sx ────────────────────────────────────────────────────────────────

const scrollbarSx = {
  display: 'flex',
  alignItems: 'center',
  gap: { xs: 1.5, sm: 2, md: 1.5 },
  flexWrap: 'nowrap',
  overflowX: 'auto',
  paddingBottom: '4px',
  scrollbarWidth: 'thin',
  '&::-webkit-scrollbar': { height: '6px' },
  '&::-webkit-scrollbar-track': { background: 'transparent' },
  '&::-webkit-scrollbar-thumb': { background: '#c1c1c1', borderRadius: '3px' },
} as const;

// ─── Component ────────────────────────────────────────────────────────────────

const SectionsTable: React.FC<SectionsTableContainerProps> = ({
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
  const { items, deactivatedItems, page, totalPages } = useAppSelector(selectSections);

  // ── Import / Export state ─────────────────────────────────────────────────
  const [isImporting, setIsImporting] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [importMode, setImportMode] = useState<ImportMode>('import');

  // ── Validation error dialog (pre-import file-level errors) ───────────────
  const [errorDialogOpen, setErrorDialogOpen] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  // ── Import result dialog ─────────────────────────────────────────────────
  const [importResultDialogOpen, setImportResultDialogOpen] = useState(false);
  const [importResult, setImportResult] = useState<ImportResultData | null>(null);

  // ── Rollback confirmation dialog ─────────────────────────────────────────
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [confirmationAction, setConfirmationAction] = useState<() => Promise<void>>(
    () => async () => {}
  );

  const fileInputRef = useRef<HTMLInputElement>(null);

  const displayedSections = showDeactivated ? deactivatedItems : items;

  // ── Export CSV ────────────────────────────────────────────────────────────

  const handleExportCSV = async () => {
    try {
      await dispatch(ExportSections()).unwrap();
    } catch (error) {
      console.error('Export error:', error);
    }
  };

  // ── Import — open file picker ─────────────────────────────────────────────

  const handleImportClick = () => fileInputRef.current?.click();

  // ── Import — file selected → validate extension → open mode dialog ────────

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const ext = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
    if (!VALID_EXTENSIONS.includes(ext as typeof VALID_EXTENSIONS[number])) {
      dispatch(setSnackbarMessage('Please upload a valid CSV or Excel file'));
      dispatch(setSnackbarOpen(true));
      // Reset input so the same file can be re-selected after error
      if (event.target) event.target.value = '';
      return;
    }

    setSelectedFile(file);
    setImportMode('import');
    setImportDialogOpen(true);
    if (event.target) event.target.value = '';
  };

  // ── Import — submit with chosen mode ─────────────────────────────────────

  const handleImportSubmit = async () => {
    if (!selectedFile) return;

    setIsImporting(true);
    setImportDialogOpen(false);

    try {
      const result = await dispatch(
        ImportSections({ file: selectedFile, mode: importMode })
      ).unwrap();

      dispatch(fetchSections({ search: searchValue, page: 1 }));
      setValidationErrors([]);
      setImportResult(result as unknown as ImportResultData);
      setImportResultDialogOpen(true);
    } catch (error: any) {
      console.error('Import error:', error);

      if (error?.errors?.length) {
        // File-level validation errors → show in dedicated error dialog
        setValidationErrors(error.errors);
        setErrorDialogOpen(true);
      } else {
        const message =
          typeof error?.message === 'string'
            ? error.message
            : typeof error === 'string'
            ? error
            : 'Failed to import Sections data';
        dispatch(setSnackbarMessage(message));
        dispatch(setSnackbarOpen(true));
      }
    } finally {
      setIsImporting(false);
      setSelectedFile(null);
    }
  };

  const handleImportDialogClose = () => {
    setImportDialogOpen(false);
    setSelectedFile(null);
  };

  // ── Rollback ──────────────────────────────────────────────────────────────

  const handleRollback = () => {
    setConfirmationAction(() => async () => {
      try {
        await dispatch(rollbackSections()).unwrap();
        dispatch(fetchSections({ search: '', page: 1 }));
      } catch (error) {
        console.error('Rollback error:', error);
      } finally {
        setConfirmDialogOpen(false);
      }
    });
    setConfirmDialogOpen(true);
  };

  // ── Download sample CSV ───────────────────────────────────────────────────

  const handleDownloadSampleCSV = async () => {
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
  };

  // ─────────────────────────────────────────────────────────────────────────

  return (
    <>
      {/* ── Top bar ─────────────────────────────────────────────────────── */}
      <Box
        display="flex"
        flexDirection={{ xs: 'column', sm: 'row' }}
        alignItems={{ xs: 'flex-start', sm: 'center' }}
        justifyContent="space-between"
        gap={0}
        my={1}
        ml={1}
        px={{ xs: 2, sm: 3 }}
        sx={{ width: '99%', boxSizing: 'border-box', mt: 2 }}
      >
        <Typography
          className="icon-action-label"
          sx={{
            fontFamily: "'Poppins', sans-serif",
            fontWeight: 750,
            margin: 0,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            maxWidth: '100%',
          }}
        >
          {showDeactivated ? 'Deactivated Sections' : 'Active Sections'}
        </Typography>

        {/* Search */}
        <Box sx={{ position: 'relative', width: '280px' }}>
          <SearchIcon
            sx={{
              position: 'absolute',
              top: '50%',
              left: '10px',
              transform: 'translateY(-50%)',
              color: 'text.secondary',
              fontSize: '1.2rem',
              pointerEvents: 'none',
            }}
          />
          <input
            type="text"
            placeholder="Search section..."
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            style={{
              padding: '6px 10px 6px 38px',
              fontSize: '0.8rem',
              borderRadius: '6px',
              border: '1px solid #ccc',
              fontFamily: 'Poppins, sans-serif',
              width: '280px',
            }}
          />
        </Box>

        {/* Action buttons */}
        <Box sx={scrollbarSx}>
          {!showDeactivated && (
            <>
              <div className="icon-action-wrapper">
                <IconButton
                  color="primary"
                  onClick={handleOpen}
                  className="icon-action-button"
                  size="small"
                  disabled={isImporting}
                >
                  <AddIcon className="icon-action-svg" />
                </IconButton>
                <Typography className="icon-action-label">Add</Typography>
              </div>

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
                  {isImporting ? 'Importing...' : 'Import'}
                </Typography>
              </div>

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
                  size="small"
                >
                  <DescriptionIcon className="icon-action-svg" />
                </IconButton>
                <Typography className="icon-action-label">Sample</Typography>
              </div>

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
            </>
          )}

          <FormControlLabel
            control={
              <Switch
                checked={showDeactivated}
                onChange={() => setShowDeactivated(!showDeactivated)}
                color="primary"
                size="small"
                disabled={isImporting}
              />
            }
            label={showDeactivated ? 'Show Activated' : 'Show Deactivated'}
            sx={{
              marginLeft: 1,
              marginRight: 1,
              '& .MuiFormControlLabel-label': {
                fontSize: '0.75rem',
                fontFamily: "'Poppins', sans-serif",
              },
            }}
          />
        </Box>
      </Box>

      {/* Hidden file input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelect}
        accept=".csv,.xlsx,.xls"
        style={{ display: 'none' }}
      />

      {/* ── Import Mode Dialog ──────────────────────────────────────────── */}
      <Dialog
        open={importDialogOpen}
        onClose={handleImportDialogClose}
        PaperProps={{ className: 'dialog-paper-small' }}
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
              sx={{ mb: 1, fontFamily: "'Poppins', sans-serif", fontSize: '0.7rem' }}
            >
              Selected file: <strong>{selectedFile?.name}</strong>
            </Typography>

            <Divider sx={{ my: 2 }} />

            <Typography
              sx={{
                fontFamily: "'Poppins', sans-serif",
                fontWeight: 500,
                mb: 2,
                fontSize: '0.8rem',
              }}
            >
              Choose import mode:
            </Typography>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, alignItems: 'center' }}>
              {IMPORT_MODE_OPTIONS.map(({ mode, color, label }) => (
                <Button
                  key={mode}
                  variant={importMode === mode ? 'contained' : 'outlined'}
                  color={color}
                  onClick={() => setImportMode(mode)}
                  sx={{ width: 180 }}
                >
                  <Typography fontWeight={500}>{label}</Typography>
                </Button>
              ))}
            </Box>
          </Box>
        </DialogContent>

        <DialogActions className="dialog-actions" sx={{ px: 3, pb: 2 }}>
          <button className="btn-secondary" onClick={handleImportDialogClose}>
            Cancel
          </button>
          <button className="btn-primary" onClick={handleImportSubmit}>
            Confirm
          </button>
        </DialogActions>
      </Dialog>

      {/* ── Validation Error Dialog (pre-import file-level errors) ────── */}
      <Dialog
        open={errorDialogOpen}
        onClose={() => setErrorDialogOpen(false)}
        PaperProps={{ className: 'dialog-paper-medium' }}
      >
        <DialogTitle
          className="dialog-title"
          sx={{
            fontFamily: "'Poppins', sans-serif",
            fontWeight: 600,
            color: 'error.main',
            display: 'flex',
            alignItems: 'center',
            gap: 1,
          }}
        >
          <Box
            component="span"
            sx={{
              backgroundColor: 'error.light',
              borderRadius: '50%',
              width: 32,
              height: 32,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
            }}
          >
            !
          </Box>
          Validation Failed
        </DialogTitle>

        <DialogContent className="dialog-content">
          <Box sx={{ pt: 0 }}>
            <Typography
              variant="body1"
              sx={{
                mb: 2,
                fontFamily: "'Poppins', sans-serif",
                fontWeight: 500,
                fontSize: '0.7rem',
              }}
            >
              Import failed with {validationErrors.length} error(s):
            </Typography>

            <Box
              sx={{
                maxHeight: '400px',
                overflowY: 'auto',
                backgroundColor: '#f5f5f5',
                borderRadius: 1,
                p: 2,
              }}
            >
              {validationErrors.map((error, index) => (
                <Box
                  key={index}
                  sx={{
                    mb: 1.5,
                    p: 1.5,
                    backgroundColor: 'white',
                    borderLeft: '3px solid',
                    borderColor: 'error.main',
                    borderRadius: 1,
                    fontFamily: "'Poppins', sans-serif",
                  }}
                >
                  <Typography
                    variant="body2"
                    sx={{
                      fontFamily: "'Courier New', monospace",
                      fontSize: '0.85rem',
                      fontWeight: 600,
                      color: 'text.primary',
                    }}
                  >
                    {error}
                  </Typography>
                </Box>
              ))}
            </Box>

            <Typography
              variant="caption"
              sx={{
                mt: 2,
                display: 'block',
                fontFamily: "'Poppins', sans-serif",
                color: 'text.secondary',
              }}
            >
              Please fix the errors in your file and try importing again.
            </Typography>
          </Box>
        </DialogContent>

        <DialogActions className="dialog-actions" sx={{ px: 3, pb: 2 }}>
          <button className="btn-primary" onClick={() => setErrorDialogOpen(false)}>
            Close
          </button>
        </DialogActions>
      </Dialog>

      {/* ── Import Result Dialog ────────────────────────────────────────── */}
      <ImportResultDialog
        open={importResultDialogOpen}
        onClose={() => {
          setImportResultDialogOpen(false);
          setImportResult(null);
        }}
        result={importResult}
        moduleName="Section"
      />

      {/* ── Rollback Confirmation Dialog ────────────────────────────────── */}
      <Dialog
        open={confirmDialogOpen}
        onClose={() => setConfirmDialogOpen(false)}
        PaperProps={{ className: 'dialog-paper-small' }}
      >
        <DialogTitle
          className="dialog-title"
          sx={{ fontFamily: "'Poppins', sans-serif", fontWeight: 500 }}
        >
          Confirm Action
        </DialogTitle>
        <DialogContent className="dialog-content">
          <Typography sx={{ fontFamily: "'Poppins', sans-serif", fontSize: '0.9rem' }}>
            {ROLLBACK_MESSAGE}
          </Typography>
        </DialogContent>
        <DialogActions className="dialog-actions" sx={{ px: 3, pb: 2 }}>
          <button className="btn-secondary" onClick={() => setConfirmDialogOpen(false)}>
            Cancel
          </button>
          <button className="btn-primary" onClick={() => confirmationAction()}>
            Confirm
          </button>
        </DialogActions>
      </Dialog>

      {/* ── Table ──────────────────────────────────────────────────────── */}
      <div className="table-container" style={{ maxHeight: 'calc(91.7vh - 170px)' }}>
        <table className="custom-table">
          <thead>
            <tr>
              <th>S.No</th>
              <th>Sections Id</th>
              <th>Section Name</th>
              <th>Code</th>
              <th>Location</th>
              <th>Address</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {displayedSections.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center' }}>
                  <h2>
                    {showDeactivated
                      ? 'No deactivated sections found'
                      : 'No active sections found'}
                  </h2>
                </td>
              </tr>
            ) : (
              displayedSections.map((section, index) => (
                <tr key={section.id || `temp-${index}`}>
                  <td style={{ textAlign: 'center' }}>{(page - 1) * 30 + index + 1}</td>
                  <td style={{ textAlign: 'center' }}>{section.sectionsId || 'N/A'}</td>
                  <td style={{ textAlign: 'center' }}>{section.sectionsName || 'N/A'}</td>
                  <td style={{ textAlign: 'center' }}>{section.code || 'N/A'}</td>
                  <td style={{ textAlign: 'center' }}>{section.location || 'N/A'}</td>
                  <td style={{ textAlign: 'center' }}>{section.address || 'N/A'}</td>
                  <td style={{ textAlign: 'center' }}>
                    {showDeactivated ? (
                      <button
                        onClick={() => handleActivate(section)}
                        className="activate-btn"
                        title="Activate"
                      >
                        <RefreshIcon />
                      </button>
                    ) : (
                      <>
                        <button
                          onClick={() => handleEdit(section)}
                          className="edit-btn"
                          title="Edit"
                        >
                          <EditIcon />
                        </button>
                        <button
                          onClick={() => handleDeactivate(section)}
                          className="deactivate-btn"
                          title="Deactivate"
                        >
                          <DeleteIcon />
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ── Pagination ─────────────────────────────────────────────────── */}
      {totalPages > 1 && (
        <Box display="flex" justifyContent="center" mt={0.5}>
          <Pagination
            count={totalPages}
            page={page}
            color="primary"
            onChange={(_, value) => {
              dispatch(fetchSections({ search: searchValue, page: value }));
            }}
          />
        </Box>
      )}
    </>
  );
};

export default SectionsTable; ` `