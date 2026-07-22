
'use client';
import React, { useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../../../../redux/store';
import {
  Alert,
  Box,
  CircularProgress,
  FormControlLabel,
  IconButton,
  Snackbar,
  Switch,
  Typography,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  ExpandLess,
  ExpandMore,
  GetApp as GetAppIcon,
  Refresh as RefreshIcon,
  Upload as UploadIcon,
} from '@mui/icons-material';
import { Item } from '../Models/mixboxModels';
import { fetchMixBoxes } from '../Features/mixBoxSlice';

// ─── Types ────────────────────────────────────────────────────────────────────

interface MixBox {
  id: string;
  mixboxName: string;
  totalGrams: string;
  items: Item[];
  status: string;
}

interface MixBoxTableContainerProps {
  handleEdit: (mixBox: MixBox) => void;
  handleDeactivate: (mixBox: MixBox) => void;
  handleActivate: (mixBox: MixBox) => void;
  handleOpen: () => void;
  showDeactivated: boolean;
  setShowDeactivated: (value: boolean) => void;
  searchQuery: string;
}

interface ImportResult {
  message: string;
  inserted_count: number;
  updated_count: number;
  errorCount: number;
  successful: any[];
  updated: any[];
  failed: any[];
}

type SnackbarSeverity = 'success' | 'error' | 'info';

interface SnackbarState {
  open: boolean;
  message: string;
  severity: SnackbarSeverity;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const BASE_URL = 'https://yenerp.com/fastapi/mixbox';

const INITIAL_SNACKBAR: SnackbarState = { open: false, message: '', severity: 'success' };

// ─── Component ────────────────────────────────────────────────────────────────

const MixBoxTableContainer: React.FC<MixBoxTableContainerProps> = ({
  handleEdit,
  handleDeactivate,
  handleActivate,
  handleOpen,
  showDeactivated,
  setShowDeactivated,
  searchQuery,
}) => {
  const {
    items: mixBoxes = [],
    deactivatedItems = [],
    loading,
    error,
  } = useSelector((state: RootState) => state.mixBox);
  const dispatch = useDispatch<AppDispatch>();

  const [expandedRows, setExpandedRows] = useState<string[]>([]);
  const [exportLoading, setExportLoading] = useState(false);
  const [importLoading, setImportLoading] = useState(false);
  const [snackbar, setSnackbar] = useState<SnackbarState>(INITIAL_SNACKBAR);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Helpers ──────────────────────────────────────────────────────────────

  const showSnackbar = (message: string, severity: SnackbarSeverity = 'success') =>
    setSnackbar({ open: true, message, severity });

  const handleCloseSnackbar = () =>
    setSnackbar((prev) => ({ ...prev, open: false }));

  const handleExpandRow = (id: string) =>
    setExpandedRows((prev) =>
      prev.includes(id) ? prev.filter((rowId) => rowId !== id) : [...prev, id]
    );

  // ── Export ───────────────────────────────────────────────────────────────

  const handleExportCSV = async () => {
    setExportLoading(true);
    try {
      const response = await fetch(`${BASE_URL}/export-csv`, {
        method: 'GET',
        headers: { Accept: 'text/csv' },
      });
      if (!response.ok) throw new Error('Export failed');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'mixboxes_export.csv';
      link.click();
      window.URL.revokeObjectURL(url);

      dispatch(fetchMixBoxes());
      showSnackbar('CSV exported successfully!', 'success');
    } catch {
      showSnackbar('Failed to export CSV', 'error');
    } finally {
      setExportLoading(false);
    }
  };

  // ── Import ───────────────────────────────────────────────────────────────

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.csv')) {
      showSnackbar('Please select a valid CSV file', 'error');
      return;
    }

    setImportLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`${BASE_URL}/import-csv`, {
        method: 'POST',
        body: formData,
      });
      const result: ImportResult = await response.json();

      if (!response.ok) throw new Error(result.message || 'Import failed');

      showSnackbar(
        `Imported: ${result.inserted_count} added, ${result.updated_count} updated`,
        result.errorCount > 0 ? 'info' : 'success'
      );
      dispatch(fetchMixBoxes());
    } catch {
      showSnackbar('Failed to import CSV', 'error');
    } finally {
      setImportLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // ── Derived data ─────────────────────────────────────────────────────────

  const filteredMixBoxes = (showDeactivated ? deactivatedItems : mixBoxes).filter((mixBox) =>
    mixBox.mixboxName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const tableTitle = showDeactivated ? 'Deactivated MixBoxes' : 'Active MixBoxes';
  const emptyMessage = showDeactivated
    ? 'No deactivated mix boxes found'
    : 'No active mix boxes found';

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <>
      {/* Header */}
      <Box
        display="flex"
        flexDirection={{ xs: 'column', sm: 'row' }}
        alignItems={{ xs: 'flex-start', sm: 'center' }}
        justifyContent="space-between"
        gap={2}
        my={1}
        ml={1}
        px={{ xs: 2, sm: 3 }}
        sx={{ width: '99%', boxSizing: 'border-box', mt: 1.5 }}
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
          {tableTitle}
        </Typography>

        <div className="flex items-center gap-4">
          {!showDeactivated && (
            <div className="icon-action-wrapper">
              <IconButton
                color="primary"
                onClick={handleOpen}
                className="icon-action-button"
                title="Add"
              >
                <AddIcon className="icon-action-svg" />
              </IconButton>
              <Typography className="icon-action-label">Add</Typography>
            </div>
          )}

          <FormControlLabel
            control={
              <Switch
                checked={showDeactivated}
                onChange={() => setShowDeactivated(!showDeactivated)}
                color="primary"
                size="small"
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
        </div>
      </Box>

      {/* Table */}
      <div
        className="table-container my-1"
        style={{ maxHeight: 'calc(90.5vh - 170px)', overflow: 'auto' }}
      >
        <table className="custom-table">
          <thead>
            <tr>
              <th>S.NO</th>
              <th>Mix Box Name</th>
              <th>Consolidated Grams</th>
              <th>Expand</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredMixBoxes.length === 0 ? (
              <tr>
                <td colSpan={5} className="empty-state">
                  <h2>{emptyMessage}</h2>
                </td>
              </tr>
            ) : (
              filteredMixBoxes.map((mixBox, index) => (
                <React.Fragment key={mixBox.id}>
                  {/* Main row */}
                  <tr>
                    <td style={{ textAlign: 'center' }}>{index + 1}</td>
                    <td style={{ textAlign: 'center' }}>{mixBox.mixboxName}</td>
                    <td style={{ textAlign: 'center' }}>
                      {mixBox.items.reduce((sum, item) => sum + Number(item.grams || 0), 0)}g
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <IconButton size="small" onClick={() => handleExpandRow(mixBox.id)}>
                        {expandedRows.includes(mixBox.id) ? <ExpandLess /> : <ExpandMore />}
                      </IconButton>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <div className="flex justify-center gap-1">
                        {showDeactivated ? (
                          <button
                            onClick={() => handleActivate(mixBox)}
                            className="activate-btn"
                            title="Activate"
                          >
                            <RefreshIcon fontSize="small" />
                          </button>
                        ) : (
                          <>
                            <button
                              onClick={() => handleEdit(mixBox)}
                              className="edit-btn"
                              title="Edit"
                            >
                              <EditIcon fontSize="small" />
                            </button>
                            <button
                              onClick={() => handleDeactivate(mixBox)}
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

                  {/* Expanded nested items */}
                  {expandedRows.includes(mixBox.id) && (
                    <tr>
                      <td colSpan={5} style={{ padding: 0, backgroundColor: '#f9f9f9' }}>
                        <div style={{ margin: '8px 16px' }}>
                          <table
                            className="custom-tables"
                            style={{ width: '100%', backgroundColor: '#fff' }}
                          >
                            <thead>
                              <tr>
                                <th>Mix Box</th>
                                <th>Item Name</th>
                                <th>UOM</th>
                                <th>Grams</th>
                              </tr>
                            </thead>
                            <tbody>
                              {mixBox.items.length > 0 ? (
                                mixBox.items.map((item, idx) => (
                                  <tr key={idx}>
                                    <td style={{ textAlign: 'center' }}>{mixBox.mixboxName}</td>
                                    <td style={{ textAlign: 'center' }}>{item.item_name}</td>
                                    <td style={{ textAlign: 'center' }}>{item.uom || '-'}</td>
                                    <td style={{ textAlign: 'center' }}>{item.grams}</td>
                                  </tr>
                                ))
                              ) : (
                                <tr>
                                  <td colSpan={4} style={{ textAlign: 'center', padding: '16px' }}>
                                    No items in this mix box
                                  </td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
};

export default MixBoxTableContainer;