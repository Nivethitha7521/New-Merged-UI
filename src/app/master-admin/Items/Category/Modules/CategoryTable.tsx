
'use client';
import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  Popover,
  Typography,
  CircularProgress,
  Alert,
  Switch,
  FormControlLabel,
  Box,
  IconButton,
  Icon,
  Dialog,
  DialogTitle,
  DialogContent,
  Button,
  DialogActions,
  Divider,
  Pagination,TextField,
} from '@mui/material';
import {
  Add as AddIcon,
  EditOutlined as EditIcon,
  RefreshRounded as RefreshIcon,
  DeleteOutlineRounded as DeleteIcon,
  GetApp as GetAppIcon,
  Upload as UploadIcon,
  Undo as UndoIcon,
  Description as DescriptionIcon,
  Search as SearchIcon,
} from '@mui/icons-material';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../../../../../redux/store';
import {
  setShowDeactivated,
  ExportData,
  fetchCategories,
  setSnackbarMessage,
  setSnackbarOpen,
  Importcategory,
  rollbackcategory,
  Exportheader,
} from '../Features/categorySlice';
import { Category } from "../Models/categoryModels";
import ImportResultDialog, { ImportResultData } from '@/app/Components/ImportResultDialog';

interface CategoryTableContainerProps {
  handleEdit: (category: Category) => void;
  handleDeactivate: (category: Category) => void;
  handleActivate: (category: Category) => void;
  handleOpen: () => void;
  searchValue: string;
  setSearchValue: (value: string) => void;
}

const CategoryTableContainer: React.FC<CategoryTableContainerProps> = ({
  handleEdit,
  handleDeactivate,
  handleActivate,
  handleOpen,
  searchValue,
  setSearchValue,
}) => {
  const dispatch = useDispatch<AppDispatch>();
  const {
    items: categories,
    deactivatedItems,
    loading,
    error,
    searchQuery,
    showDeactivated,
    page,
    totalPages,
    limit,
  } = useSelector((state: RootState) => state.Category);

  // Import/Export States
  const [isImporting, setIsImporting] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [importMode, setImportMode] = useState<'import' | 'merge' | 'replace'>('import');
  const [errorDialogOpen, setErrorDialogOpen] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [confirmationMessage, setConfirmationMessage] = useState('');
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [selectedSubcategories, setSelectedSubcategories] = useState<string[]>([]);
  const [confirmationAction, setConfirmationAction] = useState<() => Promise<void>>(
    () => Promise.resolve
  );

  const [importResultDialogOpen, setImportResultDialogOpen] = useState(false);
  const [importResult, setImportResult] = useState<ImportResultData | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Memoized — only recalculates when source list or toggle changes
  const displayedCategories = useMemo(
    () => (showDeactivated ? deactivatedItems : categories),
    [showDeactivated, deactivatedItems, categories]
  );

  // Memoized — only recalculates when displayedCategories or searchQuery changes
  const filteredCategories = useMemo(
    () =>
      displayedCategories.filter((category) =>
        category.categoryName.toLowerCase().includes(searchQuery.toLowerCase())
      ),
    [displayedCategories, searchQuery]
  );

  // ── Stable callbacks ────────────────────────────────────────────────────────

  const handleClickSubcategories = useCallback(
    (event: React.MouseEvent<HTMLElement>, subcategories: string[]) => {
      setAnchorEl(event.currentTarget);
      setSelectedSubcategories(subcategories);
    },
    []
  );

  const handleClosePopover = useCallback(() => {
    setAnchorEl(null);
  }, []);

  const handleExportCSV = useCallback(() => {
    dispatch(ExportData());
  }, [dispatch]);

  const handleImportClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileSelect = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (file) {
        const validExtensions = ['.csv', '.xlsx', '.xls'];
        const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));

        if (!validExtensions.includes(fileExtension)) {
          dispatch(setSnackbarMessage('Please upload a valid CSV or Excel file'));
          dispatch(setSnackbarOpen(true));
          return;
        }

        setSelectedFile(file);
        setImportMode('import');
        setImportDialogOpen(true);
      }

      if (event.target) {
        event.target.value = '';
      }
    },
    [dispatch]
  );

  const handleImportSubmit = useCallback(async () => {
    if (!selectedFile) return;

    setIsImporting(true);
    setImportDialogOpen(false);

    try {
      const result = await dispatch(
        Importcategory({ file: selectedFile, mode: importMode })
      ).unwrap();

      dispatch(fetchCategories({ search: "", page: 1 }));
      setValidationErrors([]);

      setImportResult(result as unknown as ImportResultData);
      setImportResultDialogOpen(true);
    } catch (error: any) {
      console.error('Import error:', error);

      if (error && typeof error === 'object') {
        if (error.errors && Array.isArray(error.errors) && error.errors.length > 0) {
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
        dispatch(setSnackbarMessage('Failed to import Category data'));
        dispatch(setSnackbarOpen(true));
      }
    } finally {
      setIsImporting(false);
      setSelectedFile(null);
    }
  }, [selectedFile, importMode, dispatch]);

  const handleRollback = useCallback(async () => {
    setConfirmationMessage(
      'Are you sure you want to rollback to the previous data? This will undo the last replace operation.'
    );
    setConfirmationAction(() => async () => {
      try {
        await dispatch(rollbackcategory()).unwrap();
        dispatch(fetchCategories({ search: "", page: 1 }));
        setConfirmDialogOpen(false);
      } catch (error) {
        console.error('Rollback error:', error);
        setConfirmDialogOpen(false);
      }
    });
    setConfirmDialogOpen(true);
  }, [dispatch]);

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

  const handleToggleDeactivated = useCallback(() => {
    dispatch(setShowDeactivated(!showDeactivated));
  }, [dispatch, showDeactivated]);

  const handleCloseErrorDialog = useCallback(() => {
    setErrorDialogOpen(false);
  }, []);

  const handleCloseConfirmDialog = useCallback(() => {
    setConfirmDialogOpen(false);
  }, []);

  const handleCloseImportResultDialog = useCallback(() => {
    setImportResultDialogOpen(false);
    setImportResult(null);
  }, []);

  const handlePaginationChange = useCallback(
    (_event: React.ChangeEvent<unknown>, value: number) => {
      dispatch(fetchCategories({ search: searchValue, page: value }));
    },
    [dispatch, searchValue]
  );

  const openPopover = Boolean(anchorEl);
  const label = showDeactivated ? 'Show Activated' : 'Show Deactivated';

  return (
    <>
      <Box className="item-master-toolbar-shell" sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
        <Box
          className="purchase-reference-toolbar item-master-toolbar"
          sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', gap: 2 }}
        >
          <Box className="item-master-toolbar-spacer" sx={{ flex: 1 }} />

          <Box className="item-master-search-slot" sx={{ flex: '0 0 auto', display: 'flex', justifyContent: 'center' }}>
            <TextField
              size="small"
              variant="outlined"
              autoComplete="off"
              placeholder="Search Category..."
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              className="custom-textfield purchase-reference-search item-master-search"
              sx={{ width: '300px' }}
              InputProps={{ startAdornment: <SearchIcon className="purchase-reference-search-icon" /> }}
            />
          </Box>

          <Box className="purchase-reference-actions item-master-actions" sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 1.5 }}>
            {!showDeactivated && (
              <>
                <div className="icon-action-wrapper purchase-reference-action-button item-master-action">
                  <IconButton color="primary" onClick={handleOpen} className="icon-action-button" title="Add" disabled={isImporting}>
                    <AddIcon className="icon-action-svg" />
                  </IconButton>
                  <Typography className="icon-action-label">Add</Typography>
                </div>

                <div className="icon-action-wrapper purchase-reference-action-button item-master-action">
                  <IconButton color="primary" onClick={handleImportClick} className="icon-action-button" size="small" disabled={isImporting}>
                    {isImporting ? <CircularProgress size={20} className="icon-action-svg" /> : <GetAppIcon className="icon-action-svg" />}
                  </IconButton>
                  <Typography className="icon-action-label">{isImporting ? 'Importing...' : 'Import'}</Typography>
                </div>

                <div className="icon-action-wrapper purchase-reference-action-button item-master-action">
                  <IconButton color="primary" onClick={handleExportCSV} className="icon-action-button" size="small" disabled={isImporting}>
                    <UploadIcon className="icon-action-svg" />
                  </IconButton>
                  <Typography className="icon-action-label">Export</Typography>
                </div>

                <div className="icon-action-wrapper purchase-reference-action-button item-master-action">
                  <IconButton color="primary" onClick={handleDownloadSampleCSV} disabled={isImporting} className="icon-action-button" size="small">
                    <DescriptionIcon className="icon-action-svg" />
                  </IconButton>
                  <Typography className="icon-action-label">Sample</Typography>
                </div>

                <div className="icon-action-wrapper purchase-reference-action-button item-master-action">
                  <IconButton color="secondary" onClick={handleRollback} className="icon-action-button" size="small" disabled={isImporting}>
                    <UndoIcon className="icon-action-svg" />
                  </IconButton>
                  <Typography className="icon-action-label">Rollback</Typography>
                </div>
              </>
            )}
            <FormControlLabel
              className="purchase-reference-active-toggle item-master-active-toggle"
              control={<Switch checked={showDeactivated} onChange={handleToggleDeactivated} color="primary" size="small" disabled={isImporting} />}
              label={label}
            />
          </Box>
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

      {/* Import Mode Selection Dialog */}
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
              sx={{ fontFamily: "'Poppins', sans-serif", fontWeight: 500, mb: 2, fontSize: '0.8rem' }}
            >
              Choose import mode:
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, alignItems: 'center' }}>
              <Button
                variant={importMode === 'import' ? 'contained' : 'outlined'}
                color="primary"
                onClick={() => setImportMode('import')}
                sx={{ width: 180 }}
              >
                <Box><Typography fontWeight={500}>Import</Typography></Box>
              </Button>
              <Button
                variant={importMode === 'merge' ? 'contained' : 'outlined'}
                color="secondary"
                onClick={() => setImportMode('merge')}
                sx={{ width: 180 }}
              >
                <Box><Typography fontWeight={500}>Merge</Typography></Box>
              </Button>
              <Button
                variant={importMode === 'replace' ? 'contained' : 'outlined'}
                color="error"
                onClick={() => setImportMode('replace')}
                sx={{ width: 180 }}
              >
                <Box><Typography fontWeight={500}>Replace</Typography></Box>
              </Button>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions className="dialog-actions" sx={{ px: 3, pb: 2 }}>
          <button className="btn-secondary" onClick={handleImportDialogClose}>Cancel</button>
          <button className="btn-primary" onClick={handleImportSubmit}>Confirm</button>
        </DialogActions>
      </Dialog>

      {/* Validation Error Dialog */}
      <Dialog
        open={errorDialogOpen}
        onClose={handleCloseErrorDialog}
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
              sx={{ mb: 2, fontFamily: "'Poppins', sans-serif", fontWeight: 500, fontSize: '0.7rem' }}
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
              sx={{ mt: 2, display: 'block', fontFamily: "'Poppins', sans-serif", color: 'text.secondary' }}
            >
              Please fix the errors in your file and try importing again.
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions className="dialog-actions" sx={{ px: 3, pb: 2 }}>
          <button className="btn-primary" onClick={handleCloseErrorDialog} color="primary">
            Close
          </button>
        </DialogActions>
      </Dialog>

      {/* Confirmation Dialog */}
      <Dialog
        open={confirmDialogOpen}
        onClose={handleCloseConfirmDialog}
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
            {confirmationMessage}
          </Typography>
        </DialogContent>
        <DialogActions className="dialog-actions" sx={{ px: 3, pb: 2 }}>
          <button className="btn-secondary" onClick={handleCloseConfirmDialog}>Cancel</button>
          <button className="btn-primary" onClick={() => { confirmationAction(); }}>Confirm</button>
        </DialogActions>
      </Dialog>

      {/* Table */}
     <div className="item-master-table-container">
        <table className="item-master-table item-master-lookup-table item-master-lookup-table--5">
          <thead>
            <tr>
              <th>S.NO</th>
              <th>Category Id</th>
              <th>Category Name</th>
              <th>Subcategories</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center' }}>
                  <h3 style={{ fontWeight: 'bold' }}>Loading...</h3>
                </td>
              </tr>
            ) : (
              <>
                {filteredCategories.map((category, index) => (
                                  <tr key={category.categoryId || index} className="item-master-data-row">
                    <td style={{ textAlign: "center" }}>{(page - 1) * limit + index + 1}</td>
                    <td style={{ textAlign: "center" }}>{category.categoryId}</td>
                    <td style={{ textAlign: "center" }}>{category.categoryName}</td>
                    <td style={{ textAlign: "center" }}>
                      <button
                        onClick={(e) => handleClickSubcategories(e, category.subCategory || [])}
                        disabled={!category.subCategory || category.subCategory.length === 0}
                        style={{
                          background: "transparent",
                          border: "none",
                          color: category.subCategory?.length ? "#252527ff" : "#056eb4ff",
                          fontWeight: "500",
                          cursor: category.subCategory?.length ? "pointer" : "default",
                          padding: "4px 8px",
                          borderRadius: "4px",
                          fontFamily: "'Poppins', sans-serif",
                        }}
                        onMouseEnter={(e) => {
                          if (category.subCategory?.length) {
                            e.currentTarget.style.textDecoration = "underline";
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (category.subCategory?.length) {
                            e.currentTarget.style.textDecoration = "none";
                          }
                        }}
                      >
                        {category.subCategory?.length || 0} SELECTED
                      </button>
                    </td>
<td className="item-master-actions-cell">
                      <div className="flex justify-center gap-1">
                        {showDeactivated ? (
                          <IconButton
                            onClick={() => handleActivate(category)}
                            className="purchase-master-action-button is-activate"
                            title="Activate"
                            size="small"
                          >
                           <RefreshIcon />
                          </IconButton>
                        ) : (
                          <>
                            <IconButton
                              onClick={() => handleEdit(category)}
                             className="purchase-master-action-button is-edit"
                              title="Edit"
                            size="small"
                            >
                              <EditIcon />
                            </IconButton>
                            <IconButton
                              onClick={() => handleDeactivate(category)}
                             className="purchase-master-action-button is-delete"
                              title="Deactivate"
                              size="small"
                            >
                              <DeleteIcon />
                            </IconButton>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredCategories.length === 0 && (
                  <tr>
                    <td colSpan={5} className="empty-state">
                      <h2>
                        {showDeactivated ? 'No deactivated categories found' : 'No active categories found'}
                      </h2>
                    </td>
                  </tr>
                )}
              </>
            )}
          </tbody>
        </table>
      </div>

      <Popover
        open={openPopover}
        anchorEl={anchorEl}
        onClose={handleClosePopover}
        PaperProps={{ className: "custom-popover" }}
      >
        <div className="custom-popover">
          {selectedSubcategories.map((subcategoryName, index) => (
            <h4 key={index}>{subcategoryName}</h4>
          ))}
        </div>
      </Popover>

      {totalPages > 1 && (
        <Box display="flex" justifyContent="center" mt={0.5}>
        <Pagination
            count={totalPages}
            page={page}
            color="primary"
            onChange={handlePaginationChange}
            className="item-master-pagination"
          />  
        </Box>
      )}

      <ImportResultDialog
        open={importResultDialogOpen}
        onClose={handleCloseImportResultDialog}
        result={importResult}
        moduleName="Location"
      />
    </>
  );
};

export default CategoryTableContainer;
