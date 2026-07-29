
'use client';
import React, { useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../../../../redux/store';
import {
  Alert,
  Box,Button,
  CircularProgress,
  FormControlLabel,
  IconButton,
  Snackbar,
  Switch,
  Typography,Tooltip,
} from '@mui/material';
import {
  Add as AddIcon,
  ExpandLess,
  ExpandMore,
  EditOutlined as EditIcon,
DeleteOutlineRounded as DeleteIcon,
RestoreRounded as RefreshIcon,
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
<Box className="mixbox-master-toolbar">
  <Typography className="mixbox-master-toolbar-title">
    {tableTitle}
  </Typography>

  <Box className="purchase-reference-actions mixbox-master-toolbar-actions">
    {!showDeactivated && (
      <Button
        type="button"
        variant="outlined"
        startIcon={<AddIcon />}
        onClick={handleOpen}
        className="purchase-reference-action-button"
      >
        Add New
      </Button>
    )}

    <Box className="purchase-reference-active-toggle">
      <Typography component="span">
        Show Active Only
      </Typography>

      <Switch
        checked={!showDeactivated}
        onChange={() => setShowDeactivated(!showDeactivated)}
        color="primary"
        size="small"
        inputProps={{
          'aria-label': 'Show active Mix Boxes only',
        }}
      />
    </Box>
  </Box>
</Box>

      {/* Table */}
{/* Table */}
<Box className="purchase-master-table-shell">
  <div className="purchase-native-table-wrapper">
    <table className="purchase-native-table mixbox-native-table">
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
                <td style={{ textAlign: 'center' }}>
                  {index + 1}
                </td>

                <td style={{ textAlign: 'center' }}>
                  {mixBox.mixboxName}
                </td>

                <td style={{ textAlign: 'center' }}>
                  {mixBox.items.reduce(
                    (sum, item) => sum + Number(item.grams || 0),
                    0,
                  )}
                  g
                </td>

                <td style={{ textAlign: 'center' }}>
                  <Tooltip
                    title={
                      expandedRows.includes(mixBox.id)
                        ? 'Collapse items'
                        : 'Expand items'
                    }
                    arrow
                  >
                    <IconButton
                      type="button"
                      size="small"
                      onClick={() => handleExpandRow(mixBox.id)}
                      aria-label={
                        expandedRows.includes(mixBox.id)
                          ? 'Collapse Mix Box items'
                          : 'Expand Mix Box items'
                      }
                    >
                      {expandedRows.includes(mixBox.id) ? (
                        <ExpandLess />
                      ) : (
                        <ExpandMore />
                      )}
                    </IconButton>
                  </Tooltip>
                </td>

                <td style={{ textAlign: 'center' }}>
                  <Box className="purchase-master-actions">
                    {showDeactivated ? (
                      <Tooltip title="Activate Mix Box" arrow>
                        <IconButton
                          type="button"
                          onClick={() => handleActivate(mixBox)}
                          className="purchase-master-action-button is-activate"
                          aria-label="Activate Mix Box"
                        >
                          <RefreshIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    ) : (
                      <>
                        <Tooltip title="Edit Mix Box" arrow>
                          <IconButton
                            type="button"
                            onClick={() => handleEdit(mixBox)}
                            className="purchase-master-action-button is-edit"
                            aria-label="Edit Mix Box"
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>

                        <Tooltip title="Deactivate Mix Box" arrow>
                          <IconButton
                            type="button"
                            onClick={() => handleDeactivate(mixBox)}
                            className="purchase-master-action-button is-delete"
                            aria-label="Deactivate Mix Box"
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </>
                    )}
                  </Box>
                </td>
              </tr>

              {/* Expanded nested items */}
              {expandedRows.includes(mixBox.id) && (
                <tr>
                  <td
                    colSpan={5}
                    style={{
                      padding: 0,
                      backgroundColor: '#f9f9f9',
                    }}
                  >
                    <div style={{ margin: '8px 16px' }}>
                      <table
                        className="custom-tables"
                        style={{
                          width: '100%',
                          backgroundColor: '#fff',
                        }}
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
                            mixBox.items.map((item, itemIndex) => (
                              <tr key={itemIndex}>
                                <td style={{ textAlign: 'center' }}>
                                  {mixBox.mixboxName}
                                </td>

                                <td style={{ textAlign: 'center' }}>
                                  {item.item_name}
                                </td>

                                <td style={{ textAlign: 'center' }}>
                                  {item.uom || '-'}
                                </td>

                                <td style={{ textAlign: 'center' }}>
                                  {item.grams}
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td
                                colSpan={4}
                                style={{
                                  textAlign: 'center',
                                  padding: '16px',
                                }}
                              >
                                No items in this Mix Box
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
</Box>

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