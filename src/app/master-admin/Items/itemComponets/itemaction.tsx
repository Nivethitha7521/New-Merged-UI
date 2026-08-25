import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Button,
  TextField,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Snackbar,
  Box,
  Typography,
  IconButton,
  FormControlLabel,
  Switch,
  CircularProgress,
  Popover,
  Checkbox,
} from '@mui/material';
import {
  AddRounded as AddIcon,
  SearchRounded as SearchIcon,
  FileUploadOutlined as ImportIcon,
  FileDownloadOutlined as ExportIcon,
  DescriptionOutlined as DescriptionIcon,
  ImageOutlined as ImageIcon,
  FilterListRounded as FilterListIcon,
  PriceChangeOutlined as PriceChangeIcon,
} from '@mui/icons-material';
import MuiAlert, { AlertProps } from '@mui/material/Alert';
import { AppDispatch } from '../../../../redux/store';
import { fetchItems, Exportitem, Exportheader, uploadImagesZip, uploadVarianceImagesZip } from '../../Items/Item/Features/itemSlice';
import { useSelector } from 'react-redux';
import { RootState } from '../../../../redux/store';
import { setShowDeactivated } from '../../Items/Item/Features/itemSlice';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import UndoIcon from "@mui/icons-material/Undo";
import ImportResultDialog, { ImportResultData } from '../../../Components/ImportResultDialog';
import { API_BASE_URL } from '../../../../../API_URL';

const Alert = React.forwardRef<HTMLDivElement, AlertProps>(function Alert(props, ref) {
  return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
});

interface ItemActionsProps {
  search: string;
  setSearch: React.Dispatch<React.SetStateAction<string>>;
  dispatch: AppDispatch;
  // ── Filter props ──────────────────────────────────────────────────────────
  selectedHeaders: string[];
  headerMapping: Record<string, string>;
  visibleColumns: Record<string, boolean>;
  onToggleColumn: (key: string) => void;
}

function ItemActions({
  search,
  setSearch,
  dispatch,
  selectedHeaders,
  headerMapping,
  visibleColumns,
  onToggleColumn,
}: ItemActionsProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [importOption, setImportOption] = useState<'import' | 'merge' | 'replace' | 'rollback'>('import');
  const [rollbackDialogOpen, setRollbackDialogOpen] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const imageZipInputRef = useRef<HTMLInputElement | null>(null);

  const [priceMasterDialogOpen, setPriceMasterDialogOpen] = useState(false);

  // Loading states
  const [isImporting, setIsImporting] = useState(false);
  const [isUploadingImages, setIsUploadingImages] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isDownloadingSample, setIsDownloadingSample] = useState(false);
  const [isDownloadingrollback, setIsDownloadingrollback] = useState(false);

  // ── Filter popover state ──────────────────────────────────────────────────
  const [filterAnchorEl, setFilterAnchorEl] = useState<null | HTMLElement>(null);
  const openFilterPopover = Boolean(filterAnchorEl);

  // ── Import result dialog state ────────────────────────────────────────────
  const [importResultDialogOpen, setImportResultDialogOpen] = useState(false);
  const [importResult, setImportResult] = useState<ImportResultData | null>(null);

  // Add
  const [addMenuAnchorEl, setAddMenuAnchorEl] = useState<null | HTMLElement>(null);
  const openAddMenu = Boolean(addMenuAnchorEl);


  const [imageMenuAnchorEl, setImageMenuAnchorEl] = useState<null | HTMLElement>(null);
  const openImageMenu = Boolean(imageMenuAnchorEl);
  const itemImageZipInputRef = useRef<HTMLInputElement | null>(null);
  const varianceImageZipInputRef = useRef<HTMLInputElement | null>(null);

  const showDeactivated = useSelector((state: RootState) => state.maItems.showDeactivated);
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const router = useRouter();

  const isAnyActionLoading = isImporting || isUploadingImages || isExporting || isDownloadingSample || isDownloadingrollback;

  const debouncedSearch = useCallback(
    (value: string) => {
      if (debounceTimeoutRef.current) clearTimeout(debounceTimeoutRef.current);
      debounceTimeoutRef.current = setTimeout(() => {
        dispatch(fetchItems({ page: 1, limit: 15, itemName: value }));
      }, 3000);
    },
    [dispatch]
  );

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearch(value);
    debouncedSearch(value);
  };

  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) clearTimeout(debounceTimeoutRef.current);
    };
  }, []);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      await dispatch(Exportitem());
      setSnackbarMessage('Export completed successfully');
      setSnackbarOpen(true);
    } catch (error) {
      setSnackbarMessage('Export failed');
      setSnackbarOpen(true);
    } finally {
      setIsExporting(false);
    }
  };

  const handleDownloadSampleCSV = async () => {
    setIsDownloadingSample(true);
    try {
      await dispatch(Exportheader());
      setSnackbarMessage('Sample CSV downloaded successfully');
      setSnackbarOpen(true);
    } catch (error) {
      setSnackbarMessage('Failed to download sample CSV');
      setSnackbarOpen(true);
    } finally {
      setIsDownloadingSample(false);
    }
  };

  const handleRollback = async () => {
    setIsDownloadingrollback(true);
    try {
      const rollbackUrl = `${API_BASE_URL}/itemmasters/rollback`;
      const response = await axios.post(rollbackUrl, null, {
        headers: { 'Content-Type': 'application/json' },
      });
      const { message, restored_count } = response.data;
      const snackbarMsg = message || `Rollback successful: Restored ${restored_count} items`;
      setSnackbarMessage(snackbarMsg);
      setSnackbarOpen(true);
      dispatch(fetchItems({ page: 1, limit: 15 }));
    } catch (error: any) {
      console.error('Error during rollback:', error);
      let errorMessage = 'Failed to perform rollback';
      if (error.response?.data?.detail) {
        errorMessage = error.response.data.detail;
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      setSnackbarMessage(errorMessage);
      setSnackbarOpen(true);
    } finally {
      setIsDownloadingrollback(false);
    }
  };

  const handleFileUpload = async (file: File, option: 'import' | 'merge' | 'replace') => {
    if (!file) {
      setSnackbarMessage('No file selected');
      setSnackbarOpen(true);
      return;
    }

    setIsImporting(true);

    const formData = new FormData();
    formData.append('file', file);

    let merge = 'false';
    let replace = 'false';

    switch (option) {
      case 'merge':
        merge = 'true';
        replace = 'false';
        break;
      case 'replace':
        merge = 'false';
        replace = 'true';
        break;
      case 'import':
      default:
        merge = 'false';
        replace = 'false';
        break;
    }

    const uploadUrl = `${API_BASE_URL}/itemmasters/import/?merge=${merge}&replace=${replace}`;

    try {
      const response = await axios.post(uploadUrl, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const data = response.data;

      const resultData: ImportResultData = {
        message: data.message ?? 'Import completed.',
        inserted_count: data.inserted_count ?? 0,
        updated_count: data.updated_count ?? 0,
        no_change_count: data.no_change_count ?? 0,
        errorCount: data.errorCount ?? (data.failed?.length ?? 0),
        successful: (data.successful ?? []).map((r: any) => ({
          ...r,
          branchName: r.itemName
            ? (r.varianceName ? `${r.itemName} — ${r.varianceName}` : r.itemName)
            : `Row ${r.row}`,
          locationId: r.itemCode ?? '',
        })),
        updated: (data.updated ?? []).map((r: any) => ({
          ...r,
          branchName: r.itemName
            ? (r.varianceName ? `${r.itemName} — ${r.varianceName}` : r.itemName)
            : `Row ${r.row}`,
          locationId: r.itemCode ?? '',
        })),
        failed: (data.failed ?? []).map((r: any) => ({
          ...r,
          branchName: r.itemName
            ? (r.varianceName ? `${r.itemName} — ${r.varianceName}` : r.itemName)
            : `Row ${r.row}`,
          locationId: r.itemCode ?? '',
          error: r.status_message ?? r.error ?? 'Unknown error',
        })),
        duplicates: data.duplicates ?? [],
        duplicate_details: data.duplicate_details ?? [],
      };

      dispatch(fetchItems({ page: 1, limit: 15 }));
      setImportResult(resultData);
      setImportResultDialogOpen(true);

    } catch (error: any) {
      console.error('Error importing CSV:', error);
      let errorMessage = 'Failed to import CSV';

      if (error.response?.data) {
        const errorData = error.response.data;
        if (errorData.detail && typeof errorData.detail === 'object') {
          const { message, empty_data_count, errors } = errorData.detail;
          if (message) {
            errorMessage = message;
          } else if (errors && Array.isArray(errors)) {
            const errorList = errors.slice(0, 5).map((err: any) =>
              `${err.header} is empty at Row ${err.row}, Column ${err.column} (${err.position})`
            ).join('\n');
            errorMessage = `Import failed - Empty data found:\n${errorList}`;
            if (empty_data_count > 5) {
              errorMessage += `\n... and ${empty_data_count - 5} more error(s)`;
            }
          }
        } else if (errorData.detail && typeof errorData.detail === 'string') {
          errorMessage = errorData.detail;
        } else if (errorData.message) {
          errorMessage = errorData.message;
        }
      }

      setSnackbarMessage(errorMessage);
      setSnackbarOpen(true);
    } finally {
      setIsImporting(false);
    }
  };

  const handleImageUpload = async (file: File) => {
    if (!file) {
      setSnackbarMessage('No file selected');
      setSnackbarOpen(true);
      return;
    }
    setIsUploadingImages(true);
    try {
      await dispatch(uploadImagesZip({ file }));
      await dispatch(fetchItems({ page: 1, limit: 15 }));
      setSnackbarMessage('Images uploaded successfully');
      setSnackbarOpen(true);
    } catch (error) {
      setSnackbarMessage('Failed to upload images');
      setSnackbarOpen(true);
    } finally {
      setIsUploadingImages(false);
    }
  };



  const handleVarianceImageUpload = async (file: File) => {
    if (!file) {
      setSnackbarMessage('No file selected');
      setSnackbarOpen(true);
      return;
    }
    setIsUploadingImages(true);
    try {
      await dispatch(uploadVarianceImagesZip({ file }));
      await dispatch(fetchItems({ page: 1, limit: 15 }));
      setSnackbarMessage('Variance images uploaded successfully');
      setSnackbarOpen(true);
    } catch (error) {
      setSnackbarMessage('Failed to upload variance images');
      setSnackbarOpen(true);
    } finally {
      setIsUploadingImages(false);
    }
  };

  const handleVarianceImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleVarianceImageUpload(file);
    e.target.value = '';
  };


  const handlePriceMasterClick = () => {
    if (isAnyActionLoading) return;
    router.push('/Price-Master/priceMaster');
  };

  const handleImportClick = () => {
    if (isAnyActionLoading) return;
    fileInputRef.current?.click();
  };

  const handleImportAction = (option: 'import' | 'merge' | 'replace' | 'rollback') => {
    setImportOption(option);
    setDialogOpen(false);
    if (option === 'rollback') {
      setRollbackDialogOpen(true);
      setSelectedFile(null);
      return;
    }
    if (selectedFile) {
      handleFileUpload(selectedFile, option);
      setSelectedFile(null);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setDialogOpen(true);
    }
    e.target.value = '';
  };

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleImageUpload(file);
    e.target.value = '';
  };

  const handleDialogClose = () => {
    if (isAnyActionLoading) return;
    setDialogOpen(false);
    setSelectedFile(null);
  };

  const label = showDeactivated ? 'Show Activated' : 'Show Deactivated';

  const handleAddClick = () => {
    if (isAnyActionLoading) return;
    router.push('/master-admin/Items/add');
  };

  // ── Header display helper ─────────────────────────────────────────────────
  const getDisplayHeader = (key: string): string => {
    return headerMapping[key] ||
      key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()).trim();
  };

  return (
    <>
      <Box
       className="purchase-reference-toolbar item-master-toolbar"
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: '100%',
          gap: 2,
        }}
      >
<Box className="item-master-toolbar-spacer" sx={{ flex: 1 }} />

       <Box className="item-master-search-slot" sx={{ flex: '0 0 auto', display: 'flex', justifyContent: 'center' }}>
          <TextField
            size="small"
            variant="outlined"
            autoComplete="off"
            placeholder="Search Items..."
            value={search}
            onChange={handleSearchChange}
            disabled={isAnyActionLoading}
           className="custom-textfield purchase-reference-search item-master-search"
            sx={{
              width: '300px',
              '& .MuiInputBase-root': {
                '&:hover fieldset': { borderColor: '#000000', borderWidth: 2 },
                '&.Mui-focused fieldset': { borderColor: '#000000ff', borderWidth: 2 },
                height: '30px',
                fontSize: '0.75rem',
              },
            }}
            InputProps={{
              startAdornment: (
              <SearchIcon className="purchase-reference-search-icon" />
              ),
            }}
          />
        </Box>

        <Box
         className="purchase-reference-actions item-master-actions"
          sx={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: 1.5,
            mt: -3.2,
          }}
        >

          {/* Price Master */}
          {/* <div className="icon-action-wrapper">
            <IconButton
              color="primary"
              onClick={() => !isAnyActionLoading && setPriceMasterDialogOpen(true)}
              disabled={isAnyActionLoading}
              className="icon-action-button"
              title="Price Master"
            >
              <PriceChangeIcon className="icon-action-svg" />
            </IconButton>
            <Typography className="icon-action-label">Price Master</Typography>
          </div> */}


          {/* Price Master */}
          <div className="icon-action-wrapper">
            <button
              color="primary"
              onClick={handlePriceMasterClick}
              disabled={isAnyActionLoading}
              className="purchase-reference-action-button item-master-price-button"
              title="Price Master"
            >
             <PriceChangeIcon className="item-master-price-icon" /> Price Master
            </button>
            {/* <Typography className="icon-action-label">Price Master</Typography> */}
          </div>


          {/* Add */}
        <div className="icon-action-wrapper purchase-reference-action-button item-master-action">
            <IconButton
              color="primary"
              onClick={handleAddClick}
              disabled={isAnyActionLoading}
              className="icon-action-button"
              title="Add"
            >
              <AddIcon className="icon-action-svg" />
            </IconButton>
            <Typography className="icon-action-label">Add</Typography>
          </div>


          {/* Add */}
          {/* <div className="icon-action-wrapper">
            <IconButton
              color="primary"
              onClick={(e) => !isAnyActionLoading && setAddMenuAnchorEl(e.currentTarget)}
              disabled={isAnyActionLoading}
              className="icon-action-button"
              title="Add"
            >
              <AddIcon className="icon-action-svg" />
            </IconButton>
            <Typography className="icon-action-label">Add</Typography>
          </div>

          <Popover
            open={openAddMenu}
            anchorEl={addMenuAnchorEl}
            onClose={() => setAddMenuAnchorEl(null)}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            transformOrigin={{ vertical: 'top', horizontal: 'center' }}
            PaperProps={{
              sx: {
                minWidth: 150,
                mt: 0.5,
                fontFamily: "'Poppins', sans-serif",
                boxShadow: '0 4px 16px rgba(0,0,0,0.10)',
              },
            }}
          >
            <Box
              onClick={() => {
                setAddMenuAnchorEl(null);
                router.push('/master-admin/Items/add');
              }}
              sx={{
                px: 2, py: 1.2,
                fontSize: '0.8rem',
                fontFamily: "'Poppins', sans-serif",
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                borderBottom: '0.5px solid',
                borderColor: 'divider',
                '&:hover': { bgcolor: 'action.hover' },
              }}
            >
              <AddIcon fontSize="small" /> Item Add
            </Box>
            <Box
              onClick={() => {
                setAddMenuAnchorEl(null);
                router.push('/master-admin/Items/combo'); // update path as needed
              }}
              sx={{
                px: 2, py: 1.2,
                fontSize: '0.8rem',
                fontFamily: "'Poppins', sans-serif",
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                '&:hover': { bgcolor: 'action.hover' },
              }}
            >
              <AddIcon fontSize="small" /> Combo Add
            </Box>
          </Popover> */}


          {/* Import */}
        <div className="icon-action-wrapper purchase-reference-action-button item-master-action">
            <IconButton
              color="primary"
              onClick={handleImportClick}
              disabled={isAnyActionLoading}
              className="icon-action-button cursor-pointer"
              title="Import"
            >
              {isImporting ? (
                <CircularProgress size={24} sx={{ color: 'primary.main' }} />
              ) : (
               <ImportIcon className="icon-action-svg" />
              )}
            </IconButton>
            <Typography className="icon-action-label">
              {isImporting ? 'Importing...' : 'Import'}
            </Typography>
          </div>

          {/* Image Upload */}
          {/* <div className="icon-action-wrapper">
            <IconButton
              color="primary"
              onClick={() => !isAnyActionLoading && imageZipInputRef.current?.click()}
              disabled={isAnyActionLoading}
              className="icon-action-button"
              title="Upload Images (ZIP)"
            >
              {isUploadingImages ? (
                <CircularProgress size={24} sx={{ color: 'primary.main' }} />
              ) : (
                <ImageIcon className="icon-action-svg" />
              )}
            </IconButton>
            <Typography className="icon-action-label">Image</Typography>
          </div> */}



          {/* Image Upload — Item / Variance choice */}
        <div className="icon-action-wrapper purchase-reference-action-button item-master-action">
            <IconButton
              color="primary"
              onClick={(e) => !isAnyActionLoading && setImageMenuAnchorEl(e.currentTarget)}
              disabled={isAnyActionLoading}
              className="icon-action-button"
              title="Upload Images (ZIP)"
            >
              {isUploadingImages ? (
                <CircularProgress size={24} sx={{ color: 'primary.main' }} />
              ) : (
                <ImageIcon className="icon-action-svg" />
              )}
            </IconButton>
            <Typography className="icon-action-label">Image</Typography>
          </div>

          <Popover
            open={openImageMenu}
            anchorEl={imageMenuAnchorEl}
            onClose={() => setImageMenuAnchorEl(null)}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            transformOrigin={{ vertical: 'top', horizontal: 'center' }}
            PaperProps={{ sx: { minWidth: 150, mt: 0.5, fontFamily: "'Poppins', sans-serif" } }}
          >
            <Box
              onClick={() => { setImageMenuAnchorEl(null); itemImageZipInputRef.current?.click(); }}
              sx={{ px: 2, py: 1.2, fontSize: '0.8rem', fontFamily: "'Poppins', sans-serif", cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 1, borderBottom: '0.5px solid', borderColor: 'divider', '&:hover': { bgcolor: 'action.hover' } }}
            >
              <ImageIcon fontSize="small" /> Item
            </Box>
            <Box
              onClick={() => { setImageMenuAnchorEl(null); varianceImageZipInputRef.current?.click(); }}
              sx={{ px: 2, py: 1.2, fontSize: '0.8rem', fontFamily: "'Poppins', sans-serif", cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 1, '&:hover': { bgcolor: 'action.hover' } }}
            >
              <ImageIcon fontSize="small" /> Variance
            </Box>
          </Popover>

          <input
            type="file"
            accept=".zip"
            ref={itemImageZipInputRef}
            style={{ display: 'none' }}
            onChange={handleImageFileChange}
            disabled={isAnyActionLoading}
          />
          <input
            type="file"
            accept=".zip"
            ref={varianceImageZipInputRef}
            style={{ display: 'none' }}
            onChange={handleVarianceImageFileChange}
            disabled={isAnyActionLoading}
          />

          <input
            type="file"
            accept=".zip"
            ref={imageZipInputRef}
            style={{ display: 'none' }}
            onChange={handleImageFileChange}
            disabled={isAnyActionLoading}
          />

          {/* Export */}
        <div className="icon-action-wrapper purchase-reference-action-button item-master-action">
            <IconButton
              color="primary"
              onClick={handleExport}
              disabled={isAnyActionLoading}
              className="icon-action-button"
              title="Export"
            >
              {isExporting ? (
                <CircularProgress size={24} sx={{ color: 'primary.main' }} />
              ) : (
              <ExportIcon className="icon-action-svg" />
              )}
            </IconButton>
            <Typography className="icon-action-label">Export</Typography>
          </div>

          {/* Sample CSV */}
        <div className="icon-action-wrapper purchase-reference-action-button item-master-action">
            <IconButton
              color="primary"
              onClick={handleDownloadSampleCSV}
              disabled={isAnyActionLoading}
              className="icon-action-button"
            >
              {isDownloadingSample ? (
                <CircularProgress size={24} sx={{ color: 'primary.main' }} />
              ) : (
                <DescriptionIcon className="icon-action-svg" />
              )}
            </IconButton>
            <Typography className="icon-action-label">Sample</Typography>
          </div>

          {/* Rollback */}
       <div className="icon-action-wrapper purchase-reference-action-button item-master-action">
            <IconButton
              color="secondary"
              onClick={handleRollback}
              className="icon-action-button"
              size="small"
              disabled={isAnyActionLoading}
            >
              {isDownloadingrollback ? (
                <CircularProgress size={24} sx={{ color: 'primary.main' }} />
              ) : (
                <UndoIcon className="icon-action-svg" />
              )}
            </IconButton>
            <Typography className="icon-action-label">Rollback</Typography>
          </div>

          {/* Show Deactivated Toggle */}
          <FormControlLabel
          className="purchase-reference-active-toggle item-master-active-toggle"
            control={
              <Switch
                checked={showDeactivated}
                onChange={() =>
                  !isAnyActionLoading && dispatch(setShowDeactivated(!showDeactivated))
                }
                disabled={isAnyActionLoading}
                color="primary"
                size="small"
              />
            }
            label={label}
            sx={{
              marginLeft: 1,
              marginRight: 1,
              '& .MuiFormControlLabel-label': {
                fontSize: '0.75rem',
                fontFamily: "'Poppins', sans-serif",
              },
            }}
          />

          {/* ── Filter Icon — next to Show Deactivated ──────────────────── */}
        <div className="icon-action-wrapper purchase-reference-action-button item-master-action">
            <IconButton
              color="primary"
              size="small"
              className="icon-action-button"
              disabled={isAnyActionLoading}
              onClick={(e) => setFilterAnchorEl(e.currentTarget)}
              title="Filter Columns"
            >
              <FilterListIcon className="icon-action-svg" />
            </IconButton>
            <Typography className="icon-action-label">Filter</Typography>
          </div>

        </Box>
      </Box>

      {/* ── Column Filter Popover ─────────────────────────────────────────── */}
      <Popover
      className="item-master-filter-popover"
        open={openFilterPopover}
        anchorEl={filterAnchorEl}
        onClose={() => setFilterAnchorEl(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        PaperProps={{
          sx: {
            width: 220,
            maxHeight: '60vh',
            overflow: 'auto',
            fontFamily: "'Poppins', sans-serif",
          },
        }}
      >
        <Box p={2} display="flex" flexDirection="column" gap={0.5}>
          <Typography
            variant="subtitle2"
            sx={{
              fontFamily: "'Poppins', sans-serif",
              fontWeight: 600,
              fontSize: '0.85rem',
              mb: 1,
            }}
          >
            Select Columns
          </Typography>
          {selectedHeaders.map((key) => (
            <FormControlLabel
              key={key}
              control={
                <Checkbox
                  checked={visibleColumns[key] !== false}
                  onChange={() => onToggleColumn(key)}
                  size="small"
                  sx={{ transform: 'scale(0.8)', padding: '4px' }}
                />
              }
              label={
                <Typography
                  sx={{ fontFamily: "'Poppins', sans-serif", fontSize: '0.78rem' }}
                >
                  {getDisplayHeader(key)}
                </Typography>
              }
              sx={{ m: 0 }}
            />
          ))}
        </Box>
      </Popover>

      {/* Hidden File Input */}
      <input
        type="file"
        accept=".csv,.xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        ref={fileInputRef}
        style={{ display: 'none' }}
        onChange={handleFileChange}
        disabled={isAnyActionLoading}
      />

      {/* Import Options Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={handleDialogClose}
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

            <Box
              component="hr"
              sx={{ my: 2, border: 'none', borderTop: '1px solid', borderColor: 'divider' }}
            />

            <Typography
              sx={{ fontFamily: "'Poppins', sans-serif", fontWeight: 500, mb: 2, fontSize: '0.8rem' }}
            >
              Choose import mode:
            </Typography>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, alignItems: 'center' }}>
              <Button
                variant={importOption === 'import' ? 'contained' : 'outlined'}
                color="primary"
                onClick={() => setImportOption('import')}
                sx={{ width: 180 }}
                disabled={isImporting}
              >
                <Typography fontWeight={500}>Import</Typography>
              </Button>

              <Button
                variant={importOption === 'merge' ? 'contained' : 'outlined'}
                color="secondary"
                onClick={() => setImportOption('merge')}
                sx={{ width: 180 }}
                disabled={isImporting}
              >
                <Typography fontWeight={500}>Merge</Typography>
              </Button>

              <Button
                variant={importOption === 'replace' ? 'contained' : 'outlined'}
                color="error"
                onClick={() => setImportOption('replace')}
                sx={{ width: 180 }}
                disabled={isImporting}
              >
                <Typography fontWeight={500}>Replace</Typography>
              </Button>
            </Box>
          </Box>
        </DialogContent>

        <DialogActions className="dialog-actions" sx={{ px: 3, pb: 2 }}>
          <button className="btn-secondary" onClick={handleDialogClose} disabled={isImporting}>
            Cancel
          </button>
          <button
            className="btn-primary"
            onClick={() => handleImportAction(importOption)}
            disabled={isImporting}
          >
            {isImporting ? 'Processing...' : 'Confirm'}
          </button>
        </DialogActions>
      </Dialog>

      {/* Rollback Confirmation Dialog */}
      <Dialog
        open={rollbackDialogOpen}
        onClose={() => !isImporting && setRollbackDialogOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle className="dialog-title">Confirm Rollback</DialogTitle>
        <DialogContent className="dialog-content">
          <label>
            Are you sure you want to rollback to the previous data? This action cannot be undone.
          </label>
        </DialogContent>
        <DialogActions className="dialog-actions">
          <button
            className="btn-secondary"
            onClick={() => setRollbackDialogOpen(false)}
            disabled={isImporting}
          >
            Cancel
          </button>
          <button
            className="btn-delete"
            onClick={() => {
              setRollbackDialogOpen(false);
              handleRollback();
            }}
            disabled={isImporting}
          >
            {isImporting ? 'Processing...' : 'Rollback'}
          </button>
        </DialogActions>
      </Dialog>

      {/* Import Result Dialog */}
      <ImportResultDialog
        open={importResultDialogOpen}
        onClose={() => {
          setImportResultDialogOpen(false);
          setImportResult(null);
        }}
        result={importResult}
        moduleName="Item"
      />

      {/* Snackbar */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setSnackbarOpen(false)}
          severity="info"
          sx={{ width: '100%', backgroundColor: '#1976d2', color: 'white' }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>


      {/* Price Master Dialog */}
      {/* <Dialog
        open={priceMasterDialogOpen}
        onClose={() => setPriceMasterDialogOpen(false)}
        maxWidth="xl"
        fullWidth
        //     PaperProps={{ className: 'dialog-paper-big' }}
        PaperProps={{
          sx: {
            height: '90vh',
            maxHeight: '90vh',
            overflow: 'hidden',
            fontFamily: "'Poppins', sans-serif",
          },
        }}
      >
        <DialogTitle
          className="dialog-title"
          sx={{
            fontFamily: "'Poppins', sans-serif",
            fontWeight: 600,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            pb: 1,
          }}
        >
          Price Master
          <IconButton
            size="small"
            onClick={() => setPriceMasterDialogOpen(false)}
            sx={{ color: 'text.secondary' }}
          >
            ✕
          </IconButton>
        </DialogTitle>

        <DialogContent
          sx={{
            p: 0,
            overflow: 'auto',
            height: '100%',
          }}
        >
          <PriceMasterComponent />
        </DialogContent>
      </Dialog> */}

    </>
  );
}

export default ItemActions;