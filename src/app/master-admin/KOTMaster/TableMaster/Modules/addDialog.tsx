



import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  Alert,
  Box,
  TableContainer,
  TableRow,
  TableCell,
  TableBody,
  Paper,
  CircularProgress,
  Button,
  Table,
  TableHead,
  Dialog as ConfirmDialog,
  DialogTitle as ConfirmDialogTitle,
  DialogContent as ConfirmDialogContent,
  DialogActions as ConfirmDialogActions,
} from '@mui/material';
import { Delete as DeleteIcon } from '@mui/icons-material';
import { Branch, Area, TableMasterData, ValidationErrors, LocationErrors } from '../Models/tableModels';

interface AddBranchDialogProps {
  open: boolean;
  currentTable: TableMasterData;
  allBranch: Branch[];
  validationErrors: ValidationErrors;
  locationErrors: LocationErrors;
  areaError: string | null;
  isSubmitting: boolean;
  onClose: () => void;
  onFieldChange: (field: keyof TableMasterData, value: TableMasterData[keyof TableMasterData]) => void;
  onBranchSelection: (branchName: string) => void;
  onAddArea: () => void;
  onSubmit: (e: React.FormEvent) => void;
  isBranchAlreadyUsed: (branchName: string) => { existsInActive: boolean; existsInDeactivated: boolean };
}

const AddBranchDialog: React.FC<AddBranchDialogProps> = ({
  open,
  currentTable,
  allBranch,
  validationErrors,
  locationErrors,
  areaError,
  isSubmitting,
  onClose,
  onFieldChange,
  onBranchSelection,
  onAddArea,
  onSubmit,
  isBranchAlreadyUsed,
}) => {

  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [areaToDelete, setAreaToDelete] = useState<number | null>(null);
  const [tableCountError, setTableCountError] = useState<string | null>(null);

  const totalAddedTables = currentTable.areas.reduce((sum, area) => sum + area.count, 0);

  const isDuplicateAreaName = (name: string) => {
    if (!name.trim()) return false;
    return currentTable.areas.some(
      (area) => area.name.toLowerCase().trim() === name.toLowerCase().trim()
    );
  };

  const getAreaNameError = () => {
    if (!currentTable.areaName?.trim()) return '';
    if (isDuplicateAreaName(currentTable.areaName)) {
      return 'Area name already exists';
    }
    return validationErrors.areaName;
  };

  const getAreaCountError = () => {
    if (!currentTable.areaCount || currentTable.areaCount === 0) return '';
    if (currentTable.tableCount === 0) return '';

    const potentialTotal = totalAddedTables + (currentTable.areaCount || 0);
    if (potentialTotal > currentTable.tableCount) {
      return `Total would exceed limit (${potentialTotal}/${currentTable.tableCount})`;
    }
    return validationErrors.areaCount;
  };


  const handleDeleteClick = (index: number) => {
    setAreaToDelete(index);
    setDeleteConfirmOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (areaToDelete !== null) {
      const updatedAreas = currentTable.areas.filter((_, i) => i !== areaToDelete);
      onFieldChange('areas', updatedAreas);

      // Recalculate total after deletion
      const newTotal = updatedAreas.reduce(
        (total: number, area: Area) => total + Number(area.count),
        0
      );
      if (currentTable.tableCount > 0 && newTotal <= currentTable.tableCount) {
        setTableCountError(null);
      }
    }
    setDeleteConfirmOpen(false);
    setAreaToDelete(null);
  };

  const handleDeleteCancel = () => {
    setDeleteConfirmOpen(false);
    setAreaToDelete(null);
  };

  const handleAreaChange = (index: number, field: 'name' | 'count', value: string | number) => {
    const updatedAreas = [...currentTable.areas];
    if (field === 'name') {
      updatedAreas[index] = { ...updatedAreas[index], name: value as string };
    } else {
      updatedAreas[index] = { ...updatedAreas[index], count: value as number };
    }

    // Validate total table count when changing area count
    if (field === 'count') {
      const totalTableCount = updatedAreas.reduce(
        (total: number, area: Area) => total + Number(area.count),
        0
      );
      if (currentTable.tableCount > 0 && totalTableCount > currentTable.tableCount) {
        setTableCountError(
          `Total table count in areas (${totalTableCount}) exceeds branch total table count (${currentTable.tableCount}).`
        );
      } else {
        setTableCountError(null);
      }
    }

    onFieldChange('areas', updatedAreas);
  };

  const areaNameError = getAreaNameError();
  const areaCountError = getAreaCountError();

  return (
    <>
      <Dialog
      className="kot-master-dialog"
        open={open}
        onClose={onClose}
        maxWidth="md"
        fullWidth
        PaperProps={{
          className: "dialog-paper",
        }}
      >
        <DialogTitle className="dialog-title">Add Branch</DialogTitle>

        <DialogContent dividers className="dialog-content">
          <form onSubmit={onSubmit}>
            <div className="form-section">

              {/* Row 1: 4 fields (Location, Total Tables, Type, Custom Name if manual) */}
              <div className="form-grid" style={{ gap: '0.75rem', marginBottom: '1rem' }}>
                {/* Location Name */}
                <div className="form-field">
                  <FormControl
                    fullWidth
                    error={!!validationErrors.locationName || !!locationErrors.locationName}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                          borderColor: 'rgb(156, 163, 175)', // ⭐ focus border color
                        },
                      },
                      '& .MuiInputLabel-root.Mui-focused': {
                        color: 'rgb(156, 163, 175)', // ⭐ label color on focus
                      },
                      '& .MuiInputBase-root': {
                        height: 45,
                        fontSize: '12px',
                      },
                      '& .MuiInputLabel-root': {
                        fontSize: '13px',
                      },
                    }}
                  >
                    <InputLabel className="custom-label">Location Name *</InputLabel>
                    <Select
                      value={currentTable.locationName || ''}
                      onChange={(e) => onBranchSelection(e.target.value as string)}
                      label="Location Name *"
                      MenuProps={{ PaperProps: { style: { maxHeight: 200 } } }}
                      className="custom-textfield"
                    >
                      {allBranch.map((branch) => {
                        const alias = branch.aliasName;
                        const used = isBranchAlreadyUsed(alias);

                        return (
                          <MenuItem
                            key={branch.branchId}
                            value={alias}
                            disabled={used.existsInActive || used.existsInDeactivated}
                            sx={{
                              opacity: used.existsInActive || used.existsInDeactivated ? 0.5 : 1,
                              fontStyle: used.existsInActive || used.existsInDeactivated ? 'italic' : 'normal',
                              fontSize: '12px',
                              minHeight: '16px',
                              paddingY: '8px',
                            }}
                          >
                            {alias}
                            {used.existsInActive && ' (Already Active)'}
                            {used.existsInDeactivated && ' (In Deactivated)'}
                          </MenuItem>
                        );
                      })}
                    </Select>

                    {(validationErrors.locationName || locationErrors.locationName) && (
                      <FormHelperText sx={{ color: '#d32f2f' }}>
                        {validationErrors.locationName || locationErrors.locationName}
                      </FormHelperText>
                    )}
                  </FormControl>
                </div>


                {/* Total Table Count */}
                <div className="form-field">
                  <TextField
                    fullWidth
                    label="Total Table Count *"
                    autoComplete="off"
                    value={currentTable.tableCount === 0 ? '' : currentTable.tableCount}
                    onChange={(e) => onFieldChange('tableCount', Number(e.target.value) || 0)}
                    error={!!validationErrors.tableCount}
                    helperText={validationErrors.tableCount}
                    className="custom-textfield"
                    InputLabelProps={{ className: "custom-label" }}
                    InputProps={{ className: "custom-input" }}
                    sx={{
                      '& .MuiAutocomplete-input': {
                        padding: '13px 14px !important',
                        fontSize: '0.813rem',
                      },
                      '& .MuiOutlinedInput-root': {
                        height: '45px',
                        padding: '0 14px !important',
                      },
                    }}
                    inputProps={{
                      inputMode: 'decimal',
                      pattern: '[0-9]*\\.?[0-9]*',
                      maxLength: 3, // Optional: limit input length
                    }}
                  />
                </div>

                {/* Table Name Type */}

                <div className="form-field">
                  <FormControl
                    fullWidth
                    error={!!validationErrors.type}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                          borderColor: 'rgb(156, 163, 175)', // ⭐ focus border color
                        },
                      },
                      '& .MuiInputLabel-root.Mui-focused': {
                        color: 'rgb(156, 163, 175)', // ⭐ label color on focus
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
                    <InputLabel className="custom-label">Table Name Type *</InputLabel>

                    <Select
                      value={currentTable.type}
                      onChange={(e) => onFieldChange('type', e.target.value)}
                      label="Table Name Type *"
                      className="custom-textfield"
                      MenuProps={{
                        MenuListProps: {
                          sx: {
                            paddingY: 0,
                          }
                        }
                      }}
                    >
                      <MenuItem
                        value="predefined"
                        sx={{
                          fontSize: '12px', // ↓ smaller text
                          minHeight: '16px', // ↓ smaller row height
                          paddingY: '8px' // ↓ smaller vertical spacing
                        }}
                      >
                        Predefined - Table
                      </MenuItem>

                      <MenuItem
                        value="manual"
                        sx={{
                          fontSize: '12px',
                          minHeight: '16px',
                          paddingY: '8px'
                        }}
                      >
                        Manual - Table
                      </MenuItem>

                    </Select>

                    {validationErrors.type && (
                      <FormHelperText sx={{ color: '#d32f2f' }}>
                        {validationErrors.type}
                      </FormHelperText>
                    )}
                  </FormControl>
                </div>


                {/* Custom Table Name - only shown when type is manual */}
                {currentTable.type === 'manual' && (
                  <div className="form-field">
                    <TextField
                      fullWidth
                      label="Custom Table Name"
                      autoComplete="off"
                      value={currentTable.customTableName || ''}
                      inputProps={{ maxLength: 10 }}
                      onChange={(e) => {
                        const value = e.target.value;
                        // Allow only letters
                        if (/^[a-zA-Z\s]*$/.test(value)) {
                          onFieldChange('customTableName', value);
                        }
                      }}
                      className="custom-textfield"
                      InputLabelProps={{ className: "custom-label" }}
                      InputProps={{ className: "custom-input" }}
                      sx={{
                        '& .MuiAutocomplete-input': {
                          padding: '13px 14px !important',
                          fontSize: '0.813rem',
                        },
                        '& .MuiOutlinedInput-root': {
                          height: '45px',
                          padding: '0 14px !important',
                        },
                      }}
                    />
                  </div>
                )}
              </div>

              {/* Row 2: 4 preview fields + Add Area button */}
              <div className="form-grid" style={{ gap: '0.75rem', marginBottom: '1rem', alignItems: 'flex-end' }}>
                {/* Area Name */}
                <div className="form-field">
                  <TextField
                    fullWidth
                    label="Area Name"
                    autoComplete="off"
                    placeholder="e.g. AC, DineIn"
                    value={currentTable.areaName || ''}
                    inputProps={{ maxLength: 30 }}
                    // onChange={(e) => onFieldChange('areaName', e.target.value)}

                    onChange={(e) => {
                      const value = e.target.value;
                      // Allow only letters
                      if (/^[a-zA-Z\s,()&/]*$/.test(value)) {
                        onFieldChange('areaName', value);
                      }
                    }}

                    error={!!areaNameError}
                    helperText={areaNameError || validationErrors.areaName}
                    className="custom-textfield"
                    InputLabelProps={{ className: "custom-label" }}
                    InputProps={{ className: "custom-input" }}
                    sx={{
                      '& .MuiAutocomplete-input': {
                        padding: '13px 14px !important',
                        fontSize: '0.813rem',
                      },
                      '& .MuiOutlinedInput-root': {
                        height: '45px',
                        padding: '0 14px !important',
                      },
                    }} />
                </div>

                {/* Area Table Count */}
                <div className="form-field">
                  <TextField
                    fullWidth
                    label="Area Table Count"
                    autoComplete="off"
                    value={currentTable.areaCount === 0 ? '' : currentTable.areaCount}
                    onChange={(e) => onFieldChange('areaCount', Number(e.target.value) || 0)}
                    error={!!areaCountError}
                    helperText={areaCountError || validationErrors.areaCount}
                    className="custom-textfield"
                    InputLabelProps={{ className: "custom-label" }}
                    InputProps={{ className: "custom-input" }}
                    sx={{
                      '& .MuiAutocomplete-input': {
                        padding: '13px 14px !important',
                        fontSize: '0.813rem',
                      },
                      '& .MuiOutlinedInput-root': {
                        height: '45px',
                        padding: '0 14px !important',
                      },
                    }}
                    inputProps={{
                      inputMode: 'decimal',
                      pattern: '[0-9]*\\.?[0-9]*',
                      maxLength: 3, // Optional: limit input length
                    }}
                  />
                </div>

                {/* Table Starts With */}
                <div className="form-field">
                  <TextField
                    fullWidth
                    label="Table Starts With"
                    value={currentTable.type === 'manual'
                      ? `${currentTable.customTableName || 'Custom'}-T1`
                      : 'Table 1'}
                    disabled
                    className="custom-textfield"
                    InputLabelProps={{ className: "custom-label" }}
                    InputProps={{
                      className: "custom-input",
                      style: { backgroundColor: '#f9f9f9' },
                    }}
                    sx={{
                      '& .MuiAutocomplete-input': {
                        padding: '13px 14px !important',
                        fontSize: '0.813rem',
                      },
                      '& .MuiOutlinedInput-root': {
                        height: '45px',
                        padding: '0 14px !important',
                      },
                    }} />
                </div>

                {/* Table Ends With */}
                <div className="form-field">
                  <TextField
                    fullWidth
                    label="Table Ends With"
                    value={currentTable.type === 'manual'
                      ? `${currentTable.customTableName || 'Custom'}-T${totalAddedTables + (currentTable.areaCount || 0)}`
                      : `Table ${totalAddedTables + (currentTable.areaCount || 0)}`}
                    disabled
                    className="custom-textfield"
                    InputLabelProps={{ className: "custom-label" }}
                    InputProps={{
                      className: "custom-input",
                      style: { backgroundColor: '#f9f9f9' },
                    }}
                    sx={{
                      '& .MuiAutocomplete-input': {
                        padding: '13px 14px !important',
                        fontSize: '0.813rem',
                      },
                      '& .MuiOutlinedInput-root': {
                        height: '45px',
                        padding: '0 14px !important',
                      },
                    }} />
                </div>

                {/* Add Area Button */}
                <div className="form-field" style={{ display: 'flex' }}>
                  <button
                    onClick={onAddArea}
                    disabled={!currentTable.areaName?.trim() ||
                      !currentTable.areaCount ||
                      !!areaNameError ||
                      !!areaCountError}
                    className="btn-primary"
                    style={{ height: 40, minWidth: 130 }}
                  >
                    Add Area
                  </button>
                </div>
              </div>

              {/* Area Error */}
              {areaError && (
                <Box sx={{ mb: 2 }}>
                  <Alert severity="error" className="error-message">
                    {areaError}
                  </Alert>
                </Box>
              )}

              {/* Table Count Error */}
              {tableCountError && (
                <Box sx={{ mb: 2 }}>
                  <Alert severity="error" className="error-message">
                    {tableCountError}
                  </Alert>
                </Box>
              )}

              {/* Added Areas Table */}
              {currentTable.areas.length > 0 && (
                <Box sx={{ mt: 2 }}>
                  <h2 className="form-section-title">
                    Added Areas
                  </h2>
                  <TableContainer
                    component={Paper}
                    sx={{
                      boxShadow: 1,
                      borderRadius: 1,
                      maxHeight: 200,
                      overflowY: "auto",
                    }}
                  >
                    <Table size="small" stickyHeader className='custom-table'>
                      <TableHead>
                        <TableRow style={{ backgroundColor: '#d0d3d6ff' }}>
                          <TableCell align="center" style={{ fontWeight: 550, fontSize: '0.725rem' }}>
                            Area Name
                          </TableCell>
                          <TableCell align="center" style={{ fontWeight: 550, fontSize: '0.725rem' }}>
                            Table Count
                          </TableCell>
                          <TableCell align="center" style={{ fontWeight: 550, fontSize: '0.725rem' }}>
                            Action
                          </TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {currentTable.areas.map((area, i) => (
                          <TableRow key={i} hover>
                            <TableCell align="center" sx={{ fontSize: '0.813rem' }}>
                              <TextField
                                size="small"
                                variant="outlined"
                                value={area.name}
                                inputProps={{ maxLength: 30 }}
                                //  onChange={(e) => handleAreaChange(i, 'name', e.target.value)}

                                onChange={(e) => {
                                  const value = e.target.value.replace(/[^a-zA-Z\s,()/]/g, '');
                                  handleAreaChange(i, 'name', value);
                                }}

                                sx={{
                                  '& .MuiInputBase-input': {
                                    fontSize: '0.7rem',
                                    py: 0.8,
                                    textAlign: 'center'
                                  },
                                }}
                              />
                            </TableCell>
                            <TableCell align="center" sx={{ fontSize: '0.813rem' }}>
                              <TextField
                                size="small"
                                variant="outlined"
                                value={area.count === 0 ? '' : area.count}
                                onChange={(e) => handleAreaChange(i, 'count', Number(e.target.value) || 0)}
                                error={!!tableCountError}
                                sx={{
                                  '& .MuiInputBase-input': {
                                    fontSize: '0.7rem',
                                    py: 0.8,
                                    textAlign: 'center'
                                  },
                                }}
                              />
                            </TableCell>
                            <TableCell align="center" sx={{ fontSize: '0.813rem' }}>
                              <Button
                                size="small"
                                color="error"
                                onClick={() => handleDeleteClick(i)}
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
            </div>
          </form>
        </DialogContent>

        <DialogActions className="dialog-actions">
          <button onClick={onClose} disabled={isSubmitting} className="btn-secondary">
            Cancel
          </button>
          <button
            onClick={onSubmit}
            disabled={isSubmitting || !!locationErrors.locationName || !!tableCountError}
            className="btn-primary"
          >
            {isSubmitting && <CircularProgress size={20} />}
            {isSubmitting ? 'Creating...' : 'Create'}
          </button>
        </DialogActions>
      </Dialog>

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
           Are you sure you want to delete the area &quot;
            {areaToDelete !== null ? currentTable.areas[areaToDelete]?.name : ''}&quot;?
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

export default AddBranchDialog;

