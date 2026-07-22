
import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Box,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Paper,
  CircularProgress,
  Dialog as ConfirmDialog,
  DialogTitle as ConfirmDialogTitle,
  DialogContent as ConfirmDialogContent,
  DialogActions as ConfirmDialogActions,
} from '@mui/material';
import { Delete as DeleteIcon } from '@mui/icons-material';
import { Branch, EditValidationErrors } from '../Models/tableModels';

interface EditBranchDialogProps {
  open: boolean;
  selectedBranch: any;
  allBranch: Branch[];
  newAreaName: string;
  newAreaCount: number;
  editValidationErrors: EditValidationErrors;
  tableCountError: string | null;
  isSubmitting: boolean;
  onClose: () => void;
  onBranchChange: (field: string, value: any) => void;
  onAreaChange: (index: number, field: string, value: any) => void;
  onNewAreaNameChange: (value: string) => void;
  onNewAreaCountChange: (value: number) => void;
  onAddNewArea: (e: React.FormEvent) => void;
  onDeleteArea: (index: number) => void;
  onUpdate: () => void;
}

const EditBranchDialog: React.FC<EditBranchDialogProps> = ({
  open,
  selectedBranch,
  allBranch,
  newAreaName,
  newAreaCount,
  tableCountError,
  isSubmitting,
  onClose,
  onBranchChange,
  onAreaChange,
  onNewAreaNameChange,
  onNewAreaCountChange,
  onAddNewArea,
  onDeleteArea,
  onUpdate,
}) => {
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [areaToDelete, setAreaToDelete] = useState<number | null>(null);

  if (!selectedBranch) return null;

  const totalTablesFromAreas = selectedBranch?.areas?.reduce(
    (sum: number, area: any) => sum + (area.tableCount || 0),
    0
  ) || 0;

  const isDuplicateAreaName = (name: string) => {
    if (!name.trim()) return false;
    return selectedBranch?.areas?.some(
      (area: any) => area.areaName.toLowerCase().trim() === name.toLowerCase().trim()
    );
  };

  const newAreaNameError = !newAreaName.trim()
    ? ''
    : isDuplicateAreaName(newAreaName)
      ? 'Area name already exists'
      : '';

  const newAreaCountError =
    newAreaCount === 0
      ? ''
      : selectedBranch?.totalTableCount > 0 &&
        totalTablesFromAreas + newAreaCount > selectedBranch.totalTableCount
        ? `Total would exceed limit (${totalTablesFromAreas + newAreaCount}/${selectedBranch.totalTableCount})`
        : '';

  const handleDeleteClick = (index: number) => {
    setAreaToDelete(index);
    setDeleteConfirmOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (areaToDelete !== null) {
      onDeleteArea(areaToDelete);
    }
    setDeleteConfirmOpen(false);
    setAreaToDelete(null);
  };

  const handleDeleteCancel = () => {
    setDeleteConfirmOpen(false);
    setAreaToDelete(null);
  };

  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth="md"
        fullWidth
        PaperProps={{
          className: "dialog-paper",
        }}
      >
        <DialogTitle className="dialog-title">Edit Branch</DialogTitle>

        <DialogContent dividers className="dialog-content">
          <Box className="form-section">
            {/* Row 1: Location, Total Tables, Type, Custom Name */}
            <div className="form-grid" style={{ gap: '0.75rem', marginBottom: '1rem' }}>
              {/* Location Name (Disabled Select) */}
              <div className="form-field">
                <FormControl fullWidth sx={{
                  '& .MuiOutlinedInput-root': {
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'rgb(156, 163, 175)',  // ⭐ focus border color
                    },
                  },
                  '& .MuiInputLabel-root.Mui-focused': {
                    color: 'rgb(156, 163, 175)',  // ⭐ label color on focus
                  },
                  '& .MuiInputBase-root': {
                    height: 45,
                    fontSize: '12px',
                  },
                  '& .MuiInputLabel-root': {
                    fontSize: '13px',
                    minHeight: '32px',
                  },
                }}
                >
                  <InputLabel className="custom-label">Location Name</InputLabel>
                  <Select
                    value={selectedBranch?.location || ''}
                    label="Location Name"
                    disabled
                    className="custom-textfield"
                  >
                    {allBranch.map((b) => (
                      <MenuItem key={b.branchId} value={b.aliasName}>
                        {b.aliasName}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </div>

              {/* Total Table Count */}
              <div className="form-field">
                <TextField
                  fullWidth
                  label="Total Table Count *"
                  autoComplete="off"
                  value={selectedBranch?.totalTableCount === 0 ? '' : selectedBranch?.totalTableCount}
                  onChange={(e) => onBranchChange('totalTableCount', Number(e.target.value) || 0)}
                  className="custom-textfield"
                  InputLabelProps={{ className: "custom-label" }}
                  InputProps={{ className: "custom-input" }}
                  sx={{
                    '& .MuiOutlinedInput-root': { height: '45px' },
                  }}
                  inputProps={{
                    inputMode: 'decimal',
                    pattern: '[0-9]*\\.?[0-9]*',
                    maxLength: 3, // Optional: limit input length
                  }}
                />
              </div>

              {/* Table Name Type (Disabled) */}
              <div className="form-field">
                <FormControl fullWidth sx={{
                  '& .MuiOutlinedInput-root': {
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'rgb(156, 163, 175)',  // ⭐ focus border color
                    },
                  },
                  '& .MuiInputLabel-root.Mui-focused': {
                    color: 'rgb(156, 163, 175)',  // ⭐ label color on focus
                  },
                  '& .MuiInputBase-root': {
                    height: 45,
                    fontSize: '12px',
                  },
                  '& .MuiInputLabel-root': {
                    fontSize: '13px',
                    minHeight: '32px',
                  },
                }}
                >
                  <InputLabel className="custom-label">Table Name Type</InputLabel>
                  <Select
                    value={selectedBranch?.type || ''}
                    label="Table Name Type"
                    disabled
                    className="custom-textfield"
                  >
                    <MenuItem value="predefined">Predefined - Table</MenuItem>
                    <MenuItem value="manual">Manual - Table</MenuItem>
                  </Select>
                </FormControl>
              </div>

              {/* Custom Table Name (if manual) */}
              {selectedBranch?.type === 'manual' && (
                <div className="form-field">
                  <TextField
                    fullWidth
                    label="Custom Table Name"
                    autoComplete="off"
                    inputProps={{ maxLength: 10 }}
                    value={selectedBranch?.customTableName || ''}
                    //   onChange={(e) => onBranchChange('customTableName', e.target.value)}

                    onChange={(e) => {
                      const value = e.target.value.replace(/[^a-zA-Z\s]/g, '');
                      onBranchChange('customTableName', value);
                    }}
                    className="custom-textfield"
                    InputLabelProps={{ className: "custom-label" }}
                    InputProps={{ className: "custom-input" }}
                    sx={{
                      '& .MuiOutlinedInput-root': { height: '45px' },
                    }}
                  />
                </div>
              )}
            </div>

            {/* Row 2: Add New Area Fields + Button */}
            <div
              className="form-grid"
              style={{ gap: '0.75rem', marginBottom: '1rem', alignItems: 'flex-end' }}
            >
              {/* New Area Name */}
              <div className="form-field">
                <TextField
                  fullWidth
                  label="New Area Name"
                  placeholder="e.g. AC, Rooftop"
                  autoComplete="off"
                  value={newAreaName}
                  inputProps={{ maxLength: 30 }}
                  // onChange={(e) => onNewAreaNameChange(e.target.value)}
                  onChange={(e) => {
                    const value = e.target.value.replace(/[^a-zA-Z\s,()&/]/g, '');
                    onNewAreaNameChange(value);
                  }}
                  error={!!newAreaNameError}
                  helperText={newAreaNameError}
                  className="custom-textfield"
                  InputLabelProps={{ className: "custom-label" }}
                  InputProps={{ className: "custom-input" }}
                  sx={{
                    '& .MuiOutlinedInput-root': { height: '45px' },
                  }}
                />
              </div>

              {/* New Area Table Count */}
              <div className="form-field">
                <TextField
                  fullWidth
                  label="New Area Table Count"
                  autoComplete="off"
                  value={newAreaCount === 0 ? '' : newAreaCount}
                  onChange={(e) => onNewAreaCountChange(Number(e.target.value) || 0)}
                  error={!!newAreaCountError}
                  helperText={newAreaCountError}
                  className="custom-textfield"
                  InputLabelProps={{ className: "custom-label" }}
                  InputProps={{ className: "custom-input" }}
                  sx={{
                    '& .MuiOutlinedInput-root': { height: '45px' },
                  }}
                  inputProps={{
                    inputMode: 'decimal',
                    pattern: '[0-9]*\\.?[0-9]*',
                    maxLength: 3, // Optional: limit input length
                  }}
                />
              </div>

              {/* Preview: Table Starts With */}
              <div className="form-field">
                <TextField
                  fullWidth
                  label="Table Starts With"
                  value={
                    selectedBranch.type === 'manual'
                      ? `${selectedBranch.customTableName || 'Custom'}-T${totalTablesFromAreas + 1}`
                      : `Table ${totalTablesFromAreas + 1}`
                  }
                  disabled
                  className="custom-textfield"
                  InputLabelProps={{ className: "custom-label" }}
                  InputProps={{
                    className: "custom-input",
                    style: { backgroundColor: '#f9f9f9' },
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': { height: '45px' },
                  }}
                />
              </div>

              {/* Preview: Table Ends With */}
              <div className="form-field">
                <TextField
                  fullWidth
                  label="Table Ends With"
                  value={
                    selectedBranch.type === 'manual'
                      ? `${selectedBranch.customTableName || 'Custom'}-T${totalTablesFromAreas + newAreaCount}`
                      : `Table ${totalTablesFromAreas + newAreaCount}`
                  }
                  disabled
                  className="custom-textfield"
                  InputLabelProps={{ className: "custom-label" }}
                  InputProps={{
                    className: "custom-input",
                    style: { backgroundColor: '#f9f9f9' },
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': { height: '45px' },
                  }}
                />
              </div>

              {/* Add Area Button */}
              <div className="form-field" style={{ display: 'flex' }}>
                <button
                  type="button"
                  onClick={onAddNewArea}
                  disabled={
                    !newAreaName.trim() ||
                    newAreaCount === 0 ||
                    !!newAreaNameError ||
                    !!newAreaCountError
                  }
                  className="btn-primary"
                  style={{ height: 40, minWidth: 130 }}
                >
                  Add Area
                </button>
              </div>
            </div>

            {/* Global Table Count Error */}
            {tableCountError && (
              <Box sx={{ mb: 2 }}>
                <Alert severity="error" className="error-message">
                  {tableCountError}
                </Alert>
              </Box>
            )}

            {/* Added Areas Table */}
            {selectedBranch?.areas?.length > 0 && (
              <Box sx={{ mt: 3 }}>
                <h2 className="form-section-title">Added Areas</h2>
                <TableContainer
                  component={Paper}
                  sx={{
                    boxShadow: 1,
                    borderRadius: 1,
                    maxHeight: 220,
                    overflow: 'auto',
                  }}
                >
                  <Table size="small" stickyHeader className="custom-table">
                    <TableHead>
                      <TableRow sx={{ backgroundColor: '#d0d3d6ff' }}>
                        <TableCell align="center" sx={{ fontWeight: 550, fontSize: '0.725rem' }}>
                          Area Name
                        </TableCell>
                        <TableCell align="center" sx={{ fontWeight: 550, fontSize: '0.725rem' }}>
                          Table Count
                        </TableCell>
                        <TableCell align="center" sx={{ fontWeight: 550, fontSize: '0.725rem' }}>
                          Action
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {selectedBranch.areas.map((area: any, index: number) => (
                        <TableRow key={index} hover>
                          <TableCell align="center">
                            <TextField
                              size="small"
                              variant="outlined"
                              value={area.areaName}
                              inputProps={{ maxLength: 30 }}
                              //  onChange={(e) => onAreaChange(index, 'areaName', e.target.value)}

                              onChange={(e) => {
                                const value = e.target.value.replace(/[^a-zA-Z\s,()&/]/g, '');
                                onAreaChange(index, 'areaName', value);
                              }}
                              sx={{
                                '& .MuiInputBase-input': { fontSize: '0.7rem', py: 0.8, textAlign: 'center' },
                              }}
                            />
                          </TableCell>
                          <TableCell align="center">
                            <TextField
                              size="small"
                              variant="outlined"
                              value={area.tableCount === 0 ? '' : area.tableCount}
                              onChange={(e) =>
                                onAreaChange(index, 'tableCount', Number(e.target.value) || 0)
                              }
                              error={!!tableCountError}
                              sx={{
                                '& .MuiInputBase-input': { fontSize: '0.7rem', py: 0.8, textAlign: 'center' },
                              }}
                            />
                          </TableCell>
                          <TableCell align="center">
                            <Button
                              size="small"
                              color="error"
                              onClick={() => handleDeleteClick(index)}
                              disabled={selectedBranch.areas.length <= 1}
                              className='delete-btn'
                            >
                              <DeleteIcon fontSize="small" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            )}
          </Box>
        </DialogContent>

        <DialogActions className="dialog-actions">
          <button onClick={onClose} disabled={isSubmitting} className="btn-secondary">
            Cancel
          </button>
          <button
            onClick={onUpdate}
            disabled={isSubmitting || !!tableCountError}
            className="btn-primary"
          >
            {isSubmitting ? (
              <>
                <CircularProgress size={20} sx={{ mr: 1 }} /> Updating...
              </>
            ) : (
              'Update'
            )}
          </button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={deleteConfirmOpen}
        onClose={handleDeleteCancel}
        PaperProps={{
          className: "dialog-paper",
        }}
      >
        <ConfirmDialogTitle className="dialog-title">
          Confirm Delete
        </ConfirmDialogTitle>
        <ConfirmDialogContent>
          <Box sx={{ pt: 2 }}>
            Are you sure you want to delete the area "
            {areaToDelete !== null ? selectedBranch.areas[areaToDelete]?.areaName : ''}"?
          </Box>
        </ConfirmDialogContent>
        <ConfirmDialogActions className="dialog-actions">
          <button onClick={handleDeleteCancel} className="btn-secondary">
            Cancel
          </button>
          <button onClick={handleDeleteConfirm} className="btn-primary">
            Delete
          </button>
        </ConfirmDialogActions>
      </ConfirmDialog>
    </>
  );
};

export default EditBranchDialog;