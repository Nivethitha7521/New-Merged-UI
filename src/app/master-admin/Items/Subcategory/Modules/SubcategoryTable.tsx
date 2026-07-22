

'use client';
import React, { useRef, useState, useCallback, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../../../../../redux/store';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Switch,
  FormControlLabel,
  CircularProgress,
  Alert,
  Box,
  Typography,
  DialogActions,
  Dialog,
  DialogContent,
  DialogTitle,
  Button,
  Divider,
  Pagination,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Refresh as RefreshIcon,
  Delete as DeleteIcon,
  GetApp as GetAppIcon,
  Upload as UploadIcon,
  Undo as UndoIcon,
  Description as DescriptionIcon,
  Search as SearchIcon,
} from '@mui/icons-material';
import { ExportCSV, Exportheader, ImportSubcategory, fetchSubCategories, rollbackSubcategory, setSnackbarMessage, setSnackbarOpen } from '../Features/subcategorySlice';
import ImportResultDialog, { ImportResultData } from '@/app/Components/ImportResultDialog';

interface SubCategory {
  id: string;
  subCategoryName: string;
  status: string;
  subCategoryId: string;
}

interface SubcategoryTableContainerProps {
  handleEdit: (subcategory: SubCategory) => void;
  handleDeactivate: (subcategory: SubCategory) => void;
  handleActivate: (subcategory: SubCategory) => void;
  handleOpen: () => void;
  showDeactivated: boolean;
  setShowDeactivated: (value: boolean) => void;
  searchValue: string;
  setSearchValue: (value: string) => void;
}

// Hoisted so the array literal isn't rebuilt on every file-select event.
const VALID_IMPORT_EXTENSIONS = ['.csv', '.xlsx', '.xls'];

// ─── Memoized row ──────────────────────────────────────────────────────────
// Extracted so React can skip re-rendering rows whose own props haven't
// changed (e.g. typing in the search box, opening the import dialog, etc.
// no longer forces every <tr> in the list to re-render and rebuild its
// inline onClick closures).
interface SubCategoryRowProps {
  subCategory: SubCategory;
  rowNumber: number;
  showDeactivated: boolean;
  onEdit: (subcategory: SubCategory) => void;
  onDeactivate: (subcategory: SubCategory) => void;
  onActivate: (subcategory: SubCategory) => void;
}

const SubCategoryRow = React.memo(function SubCategoryRow({
  subCategory,
  rowNumber,
  showDeactivated,
  onEdit,
  onDeactivate,
  onActivate,
}: SubCategoryRowProps) {
  return (
    <tr>
      <td style={{ textAlign: 'center' }}>{rowNumber}</td>
      <td style={{ textAlign: 'center' }}>{subCategory.subCategoryId}</td>
      <td style={{ textAlign: 'center' }}>{subCategory.subCategoryName}</td>
      <td style={{ textAlign: 'center' }}>
        <div className="flex justify-center gap-1">
          {showDeactivated ? (
            <button
              onClick={() => onActivate(subCategory)}
              className="activate-btn"
              title="Activate"
            >
              <RefreshIcon fontSize="small" />
            </button>
          ) : (
            <>
              <button
                onClick={() => onEdit(subCategory)}
                className="edit-btn"
                title="Edit"
                style={{ fontSize: '16px' }}
              >
                <EditIcon fontSize="small" />
              </button>
              <button
                onClick={() => onDeactivate(subCategory)}
                className="deactivate-btn"
                title="Deactivate"
              >
                <DeleteIcon fontSize="small" />
              </button>
            </>
          )}
        </div>
      </td>
    </tr>
  );
});

const SubcategoryTableContainer: React.FC<SubcategoryTableContainerProps> = ({
  handleEdit,
  handleDeactivate,
  handleActivate,
  handleOpen,
  showDeactivated,
  setShowDeactivated,
  searchValue,
  setSearchValue
}) => {
  const dispatch = useDispatch<AppDispatch>();
  const {
    items: subCategories,
    deactivatedItems,
    loading,
    error,
    page,
    totalPages,
    limit
  } = useSelector((state: RootState) => state.subCategory);


  // Import/Export States
  const [isImporting, setIsImporting] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [importMode, setImportMode] = useState<'import' | 'merge' | 'replace'>('import');
  const [errorDialogOpen, setErrorDialogOpen] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [confirmationMessage, setConfirmationMessage] = useState('');
  const [confirmationAction, setConfirmationAction] = useState<() => Promise<void>>(
    () => Promise.resolve()
  );


    // ── NEW: Import result dialog state ──────────────────────────────────────
    const [importResultDialogOpen, setImportResultDialogOpen] = useState(false);
    const [importResult, setImportResult] = useState<ImportResultData | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);


  const displayedSubCategories = showDeactivated ? deactivatedItems : subCategories;

  const handleExportCSV = useCallback(() => {
    dispatch(ExportCSV());
  }, [dispatch]);

  // Open file picker when import icon is clicked
  const handleImportClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  // When file is selected, open the import dialog
  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));

      if (!VALID_IMPORT_EXTENSIONS.includes(fileExtension)) {
        dispatch(setSnackbarMessage('Please upload a valid CSV or Excel file'));
        dispatch(setSnackbarOpen(true));
        return;
      }

      setSelectedFile(file);
      setImportMode('import'); // Default mode
      setImportDialogOpen(true);
    }

    // Reset input
    if (event.target) {
      event.target.value = '';
    }
  }, [dispatch]);

  const handleImportSubmit = useCallback(async () => {
    if (!selectedFile) return;

    setIsImporting(true);
    setImportDialogOpen(false);

    try {
      // unwrap() returns the ImportResultData from the slice
      const result = await dispatch(
        ImportSubcategory({ file: selectedFile, mode: importMode })
      ).unwrap();

      // Refresh table
      dispatch(fetchSubCategories({ search: '', page: 1 }));
      setValidationErrors([]);

      // ── Open the result dialog with backend response ───────────────────
      setImportResult(result as unknown as ImportResultData);
      setImportResultDialogOpen(true);

    } catch (error: any) {
      console.error('Import error:', error);

      if (error && typeof error === 'object') {
        if (error.errors && Array.isArray(error.errors) && error.errors.length > 0) {
          // File-level validation errors → show in the error dialog
          setValidationErrors(error.errors);
          setErrorDialogOpen(true);
        } else if (error.message && typeof error.message === 'string') {
          dispatch(setSnackbarMessage(error.message));
          dispatch(setSnackbarOpen(true));
        }
      } else if (typeof error === 'string') {
        dispatch(setSnackbarMessage(error));
        dispatch(setSnackbarOpen(true));
      } else {
        dispatch(setSnackbarMessage('Failed to import Subcategory data'));
        dispatch(setSnackbarOpen(true));
      }
    } finally {
      setIsImporting(false);
      setSelectedFile(null);
    }
  }, [selectedFile, dispatch, importMode]);

  // Handle rollback
  const handleRollback = useCallback(async () => {
    setConfirmationMessage(
      'Are you sure you want to rollback to the previous data? This will undo the last replace operation.'
    );
    setConfirmationAction(() => async () => {
      try {
        await dispatch(rollbackSubcategory()).unwrap();
        dispatch(fetchSubCategories({ search: '', page: 1 }));
        setConfirmDialogOpen(false);
      } catch (error) {
        console.error('Rollback error:', error);
        setConfirmDialogOpen(false);
      }
    });
    setConfirmDialogOpen(true);
  }, [dispatch]);

  // Handle download sample CSV
  const handleDownloadSampleCSV = useCallback(async () => {
    setIsImporting(true);
    try {
      await dispatch(Exportheader()).unwrap();
      dispatch(setSnackbarMessage('Sample CSV downloaded successfully'));
      dispatch(setSnackbarOpen(true));
    } catch (error) {
      dispatch(setSnackbarMessage('Failed to download sample CSV'));
      dispatch(setSnackbarOpen(true));
    } finally {
      setIsImporting(false);
    }
  }, [dispatch]);

  const handleImportDialogClose = useCallback(() => {
    setImportDialogOpen(false);
    setSelectedFile(null);
  }, []);

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchValue(e.target.value);
  }, [setSearchValue]);

  const handleToggleShowDeactivated = useCallback(() => {
    setShowDeactivated(!showDeactivated);
  }, [setShowDeactivated, showDeactivated]);

  const handleErrorDialogClose = useCallback(() => setErrorDialogOpen(false), []);
  const handleConfirmDialogCancel = useCallback(() => setConfirmDialogOpen(false), []);
  const handleConfirmDialogConfirm = useCallback(() => {
    confirmationAction();
  }, [confirmationAction]);

  const handleImportResultDialogClose = useCallback(() => {
    setImportResultDialogOpen(false);
    setImportResult(null);
  }, []);

  const handlePaginationChange = useCallback(
    (_event: React.ChangeEvent<unknown>, value: number) => {
      dispatch(fetchSubCategories({ search: searchValue, page: value }));
    },
    [dispatch, searchValue]
  );

  const setImportModeImport = useCallback(() => setImportMode('import'), []);
  const setImportModeMerge = useCallback(() => setImportMode('merge'), []);
  const setImportModeReplace = useCallback(() => setImportMode('replace'), []);

  const label = showDeactivated ? 'Show Activated' : 'Show Deactivated';

  return (
    <>
      <Box
        display="flex"
        flexDirection={{ xs: "column", sm: "row" }}
        alignItems={{ xs: "flex-start", sm: "center" }}
        justifyContent="space-between"
        gap={0}
        my={1}
        ml={1}
        px={{ xs: 2, sm: 3 }}
        sx={{ width: "99%", boxSizing: "border-box", mt: -2 }}
      >
        <Typography className='icon-action-label'
          sx={{
            fontFamily: "'Poppins', sans-serif",
            fontWeight: 750,
            margin: 0,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            maxWidth: "100%",
          }}
        >
          {showDeactivated ? "Deactivated SubCategory" : "Active SubCategory"}
        </Typography>


        <Box sx={{ position: "relative", width: "280px" }}>
          <SearchIcon
            sx={{
              position: "absolute",
              top: "50%",
              left: "10px",
              transform: "translateY(-50%)",
              color: "text.secondary",
              fontSize: "1.2rem",
              pointerEvents: "none", // prevents blocking typing
            }}
          />

          <input
            type="text"
            placeholder="Search SubCategory ..."
            value={searchValue}
            onChange={handleSearchChange}
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

        <div className="flex items-center gap-2.5">
          {!showDeactivated && (
            <>
              <div className="icon-action-wrapper">
                <IconButton
                  color="primary"
                  onClick={handleOpen}
                  className="icon-action-button"
                  title="Add"
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
                onChange={handleToggleShowDeactivated}
                color="primary"
                size="small"
                disabled={isImporting}
              />
            }
            label={label}
            sx={{
              marginLeft: 1,
              marginRight: 1,
              "& .MuiFormControlLabel-label": {
                fontSize: "0.75rem",
                fontFamily: "'Poppins', sans-serif",
              },
            }}
          />
        </div>
      </Box>

      {/* Hidden file input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelect}
        accept=".csv,.xlsx,.xls"
        style={{ display: 'none' }}
      />

      {/* Import Mode Selection Dialog */}
      <Dialog
        open={importDialogOpen}
        onClose={handleImportDialogClose}
        PaperProps={{
          className: 'dialog-paper-small',
        }}
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

            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                gap: 1.5,
                alignItems: 'center',
              }}
            >
              {/* IMPORT */}
              <Button
                variant={importMode === 'import' ? 'contained' : 'outlined'}
                color="primary"
                onClick={setImportModeImport}
                sx={{ width: 180 }}
              >
                <Box>
                  <Typography fontWeight={500}>Import</Typography>
                </Box>
              </Button>

              {/* MERGE */}
              <Button
                variant={importMode === 'merge' ? 'contained' : 'outlined'}
                color="secondary"
                onClick={setImportModeMerge}
                sx={{ width: 180 }}
              >
                <Box>
                  <Typography fontWeight={500}>Merge</Typography>
                </Box>
              </Button>

              {/* REPLACE */}
              <Button
                variant={importMode === 'replace' ? 'contained' : 'outlined'}
                color="error"
                onClick={setImportModeReplace}
                sx={{ width: 180 }}
              >
                <Box>
                  <Typography fontWeight={500}>Replace</Typography>
                </Box>
              </Button>
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

      {/* Validation Error Dialog */}
      <Dialog
        open={errorDialogOpen}
        onClose={handleErrorDialogClose}
        PaperProps={{
          className: 'dialog-paper-medium',
        }}
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
          <button
            className="btn-primary"
            onClick={handleErrorDialogClose}
            color="primary"
          >
            Close
          </button>
        </DialogActions>
      </Dialog>

      {/* Confirmation Dialog */}
      <Dialog
        open={confirmDialogOpen}
        onClose={handleConfirmDialogCancel}
        PaperProps={{
          className: 'dialog-paper-small',
        }}
      >
        <DialogTitle
          className="dialog-title"
          sx={{ fontFamily: "'Poppins', sans-serif", fontWeight: 500 }}
        >
          Confirm Action
        </DialogTitle>
        <DialogContent className="dialog-content">
          <Typography sx={{ fontFamily: "'Poppins', sans-serif", fontSize: '0.9rem' }}>
            {confirmationMessage}
          </Typography>
        </DialogContent>
        <DialogActions className="dialog-actions" sx={{ px: 3, pb: 2 }}>
          <button className="btn-secondary" onClick={handleConfirmDialogCancel}>
            Cancel
          </button>
          <button
            className="btn-primary"
            onClick={handleConfirmDialogConfirm}
          >
            Confirm
          </button>
        </DialogActions>
      </Dialog>



      <div className="table-container my-1" style={{ maxHeight: 'calc(85.5vh - 170px)' }}>
        <table className="custom-table">
          <thead>
            <tr>
              <th>S.NO</th>
              <th>Subcategory Id</th>
              <th>SubCategory Name</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={4} style={{ textAlign: 'center' }}>
                  <h3 style={{ fontWeight: 'bold' }}>Loading...</h3>
                </td>
              </tr>
            ) : (
              <>
                {displayedSubCategories.map((subCategory, index) => (
                  <SubCategoryRow
                    key={subCategory.subCategoryId || index}
                    subCategory={subCategory}
                    rowNumber={(page - 1) * limit + index + 1}
                    showDeactivated={showDeactivated}
                    onEdit={handleEdit}
                    onDeactivate={handleDeactivate}
                    onActivate={handleActivate}
                  />
                ))}
                {displayedSubCategories.length === 0 && (
                  <tr>
                    <td colSpan={4} className="empty-state">
                      <h2>
                        {showDeactivated ? 'No deactivated subcategories found' : 'No active subcategories found'}
                      </h2>
                    </td>
                  </tr>
                )}
              </>
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <Box display="flex" justifyContent="center" mt={0.5}>
          <Pagination
            count={totalPages}
            page={page}
            color="primary"
            onChange={handlePaginationChange}
          />
        </Box>
      )}

      <ImportResultDialog
        open={importResultDialogOpen}
        onClose={handleImportResultDialogClose}
        result={importResult}
        moduleName="Location"
      />


    </>
  );
};

export default SubcategoryTableContainer;