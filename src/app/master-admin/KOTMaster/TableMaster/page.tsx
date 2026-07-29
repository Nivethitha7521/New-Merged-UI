
////// FINAL CODE FIX OF KOT ON [ 20-11-2025 ]


'use client';
import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box,
  Button,
  TextField,
  TableContainer,
  Paper,
  Typography,
  IconButton,
  Snackbar,
  CircularProgress,
  Switch,
  FormControlLabel,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Paper as MuiPaper,
  Autocomplete,
  DialogContent,
  Grid,
  DialogActions,
  Dialog,
  DialogTitle,
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Search as SearchIcon, } from '@mui/icons-material';
import { AppDispatch, RootState } from '../../../../redux/store';
// import MasterAdminMenu from '../page';
import {
  addTable,
  setCurrentTableField,
  addArea,
  resetCurrentTable,
  postTableData,
  fetchTableData,
  fetchallBranch,
  patchTableData,
  setSelectedTableField,
  updateSeats,
  deactivateTable,
  activateTable,
  setDialogOpen,
  setSnackbarOpen,
  setSnackbarMessage,
  setShowDeactivated,
} from '../../KOTMaster/TableMaster/Features/tableSlice';

import { Branch, TableData } from '../../KOTMaster/TableMaster/Models/tableModels';
import CloseConfirmationDialog from '../../../Components/Dialogs/CloseConfirmationDialog';
import EditConfirmationDialog from '../../../Components/Dialogs/EditConfirmationDialog';
import ActivateDeactivateConfirmationDialog from '../../../Components/Dialogs/ActivateDeactivateConfirmationDialog';
import TableLayoutEditorPage from '../TableMaster/Modules/TableLayoutEditor';
import AddBranchDialog from '../TableMaster/Modules/addDialog';
import EditBranchDialog from '../TableMaster/Modules/editDialog';
import styles from './TableMaster.module.css';

interface TableMasterData {
  _id?: string;
  locationName: string;
  type: string;
  tableCount: number;
  areaName?: string;
  areaCount?: number;
  areas: { name: string; count: number }[];
  tableNumber?: string;
  customTableName?: string;
}

interface ValidationErrors {
  locationName: string;
  type: string;
  tableCount: string;
  areaName: string;
  areaCount: string;
}

interface EditValidationErrors {
  newAreaName: string;
  newAreaCount: string;
}

interface LocationErrors {
  locationName: string | null;
}

interface TablePosition {
  tableNumber: string;
  seats: number;
  position?: { x: number; y: number } | null;
}

const TableMaster: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const {
    tables,
    deactivatedTables,
    currentTable,
    allBranch,
    loading,
    error,
    dialogOpen,
    snackbarOpen,
    snackbarMessage,
    showDeactivated,
  } = useSelector((state: RootState) => state.table);

  const [confirmationDialogOpen, setConfirmationDialogOpen] = useState(false);
  const [editConfirmationDialogOpen, setEditConfirmationDialogOpen] = useState(false);
  const [closeConfirmationDialogOpen, setCloseConfirmationDialogOpen] = useState(false);
  const [selectedTable, setSelectedTable] = useState<TableData | null>(null);
  const [selectedBranch, setSelectedBranch] = useState<any | null>(null);
  const [actionType, setActionType] = useState<'deactivate' | 'activate' | null>(null);
  const [unsavedChanges, setUnsavedChanges] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [locationFilter, setLocationFilter] = useState('');

  const [areaError, setAreaError] = useState<string | null>(null);
  const [newAreaName, setNewAreaName] = useState('');
  const [newAreaCount, setNewAreaCount] = useState(0);
  const [tableCountError, setTableCountError] = useState<string | null>(null);
  const [currentSeats, setCurrentSeats] = useState<number>(0);
  const [currentTableName, setCurrentTableName] = useState("");


  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({
    locationName: '',
    type: '',
    tableCount: '',
    areaName: '',
    areaCount: '',
  });

  const [editValidationErrors, setEditValidationErrors] = useState<EditValidationErrors>({
    newAreaName: '',
    newAreaCount: '',
  });

  const [locationErrors, setLocationErrors] = useState<LocationErrors>({
    locationName: null,
  });

  const [layoutViewOpen, setLayoutViewOpen] = useState(false);
  const [selectedAreaForLayout, setSelectedAreaForLayout] = useState<any>(null);
  const [layoutTables, setLayoutTables] = useState<TablePosition[]>([]);

  useEffect(() => {
    dispatch(fetchTableData());
    dispatch(fetchallBranch());
  }, [dispatch, showDeactivated]);


  useEffect(() => {
    if (selectedTable) {
      setCurrentTableName(selectedTable.tableNumber);
      setCurrentSeats(selectedTable.seats);
    }
  }, [selectedTable]);


  const validateFields = () => {
    const errors: ValidationErrors = {
      locationName: '',
      type: '',
      tableCount: '',
      areaName: '',
      areaCount: '',
    };
    let isValid = true;

    if (!currentTable.locationName) {
      errors.locationName = 'Required !';
      isValid = false;
    }
    if (!currentTable.type) {
      errors.type = 'Table Type is required.';
      isValid = false;
    }
    if (!currentTable.tableCount || currentTable.tableCount <= 0) {
      errors.tableCount = 'Required !';
      isValid = false;
    }


    setValidationErrors(errors);
    return isValid;
  };

  const validateEditForm = () => {
    let isValid = true;
    const newErrors: EditValidationErrors = { newAreaName: '', newAreaCount: '' };

    if (!newAreaName.trim()) {
      newErrors.newAreaName = 'Area name is required.';
      isValid = false;
    }

    if (!newAreaCount || newAreaCount <= 0) {
      newErrors.newAreaCount = 'Table count must be a positive number.';
      isValid = false;
    }

    setEditValidationErrors(newErrors);
    return isValid;
  };

  const handleOpen = (mode: 'add' | 'edit') => {
    if (mode === 'add') {
      dispatch(resetCurrentTable());
      setValidationErrors({
        locationName: '',
        type: '',
        tableCount: '',
        areaName: '',
        areaCount: '',
      });
      setLocationErrors({ locationName: null });
    }
    dispatch(setDialogOpen(mode));
    setUnsavedChanges(false);
  };

  const handleClose = () => {
    if (unsavedChanges) {
      setCloseConfirmationDialogOpen(true);
    } else {
      resetDialog();
    }
  };

  const resetDialog = () => {
    dispatch(setDialogOpen('none'));
    dispatch(resetCurrentTable());
    setValidationErrors({
      locationName: '',
      type: '',
      tableCount: '',
      areaName: '',
      areaCount: '',
    });
    setEditValidationErrors({ newAreaName: '', newAreaCount: '' });
    setAreaError(null);
    setUnsavedChanges(false);
    setSelectedBranch(null);
    setNewAreaName('');
    setNewAreaCount(0);
    setLocationErrors({ locationName: null });
    setTableCountError(null);
  };

  const handleConfirmClose = () => {
    resetDialog();
    setCloseConfirmationDialogOpen(false);
  };

  const handleCancelClose = () => {
    setCloseConfirmationDialogOpen(false);
  };

  const handleChange = (field: keyof TableMasterData, value: any) => {
    dispatch(setCurrentTableField({ field, value }));
    setValidationErrors({ ...validationErrors, [field]: '' });
    setUnsavedChanges(true);
  };

  const isBranchAlreadyUsed = (branchName: string) => {
    const existsInActive = tables.some(
      (table) => table.location?.toLowerCase() === branchName.toLowerCase()
    );
    const existsInDeactivated = deactivatedTables.some(
      (table) => table.location?.toLowerCase() === branchName.toLowerCase()
    );
    return { existsInActive, existsInDeactivated };
  };

  const handleBranchSelection = (selectedBranchName: string) => {
    const { existsInActive, existsInDeactivated } = isBranchAlreadyUsed(selectedBranchName);

    if (existsInActive) {
      setLocationErrors({ locationName: 'This branch is already added and in active table.' });
    } else if (existsInDeactivated) {
      setLocationErrors({ locationName: 'This branch exists in deactivated tables.' });
    } else {
      setLocationErrors({ locationName: null });
      handleChange('locationName', selectedBranchName);
    }
  };

  const handleAddArea = () => {
    if (!validateFields()) return;

    const totalAreaCount = currentTable.areas.reduce((sum, area) => sum + area.count, 0);
    if (totalAreaCount + currentTable.areaCount! > currentTable.tableCount) {
      setAreaError('Total area count exceeds table count.');
      return;
    }

    setAreaError(null);
    dispatch(addArea({ name: currentTable.areaName!, count: currentTable.areaCount! }));
    dispatch(setCurrentTableField({ field: 'areaName', value: '' }));
    dispatch(setCurrentTableField({ field: 'areaCount', value: 0 }));
    setUnsavedChanges(true);
  };


  const handleAddNewArea = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateEditForm()) return;

    const totalTableCount = selectedBranch.areas.reduce(
      (total: number, area: any) => total + area.tableCount,
      0
    );
    if (totalTableCount + newAreaCount > selectedBranch?.totalTableCount) {
      setEditValidationErrors({
        ...editValidationErrors,
        newAreaCount: `Total table count including new area (${totalTableCount + newAreaCount}) exceeds branch total table count (${selectedBranch.totalTableCount}).`,
      });
      return;
    }

    const updatedAreas = [
      ...selectedBranch.areas,
      { areaName: newAreaName, tableCount: newAreaCount, tables: [] },
    ];
    setSelectedBranch({ ...selectedBranch, areas: updatedAreas });
    setNewAreaName('');
    setNewAreaCount(0);
    setEditValidationErrors({ newAreaName: '', newAreaCount: '' });
    setUnsavedChanges(true);
    setTableCountError(null);
  };

  const handleAreaChange = (index: number, field: string, value: any) => {
    const updatedAreas = selectedBranch.areas.map((area: any, i: number) =>
      i === index ? { ...area, [field]: value } : area
    );

    if (field === 'tableCount') {
      const totalTableCount = updatedAreas.reduce(
        (total: number, area: any) => total + Number(area.tableCount),
        0
      );
      if (totalTableCount > selectedBranch.totalTableCount) {
        setTableCountError(
          `Total table count in areas (${totalTableCount}) exceeds branch total table count (${selectedBranch.totalTableCount}).`
        );
      } else {
        setTableCountError(null);
      }
    }

    setSelectedBranch({ ...selectedBranch, areas: updatedAreas });
    setUnsavedChanges(true);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!validateFields()) return;
    try {
      setIsSubmitting(true);
      const generatedTables: TableData[] = [];
      let tableNumber = 1;

      currentTable.areas.forEach((area) => {
        for (let i = 1; i <= area.count; i++) {
          currentTable.type === 'predefined'
            ? `${area.name} Table ${tableNumber}`
            : `${currentTable.customTableName} T${tableNumber}`;
          generatedTables.push({
            _id: `${currentTable?.tableId || 'temp'}-${tableNumber}`,
            location: currentTable.locationName,
            seats: 4,
            seatDetails: Array(4).fill('Seat'),
            areaName: area.name,
            status: 'active',
            tableNumber: '',
          });
          tableNumber++;
        }
      });

      dispatch(addTable(generatedTables));
      await dispatch(postTableData(currentTable)).unwrap();
      dispatch(resetCurrentTable());
      dispatch(setSnackbarMessage('Table created successfully!'));
      dispatch(setSnackbarOpen(true));
      dispatch(setDialogOpen('none'));
      dispatch(fetchTableData());
    } catch (error: unknown) {
      let errorMessage = 'An error occurred';
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      dispatch(setSnackbarMessage(errorMessage));
      dispatch(setSnackbarOpen(true));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditConfirmation = async () => {
    if (!selectedBranch) return;

    const validAreas = selectedBranch.areas.filter(
      (area: any) => area.areaName?.trim() && area.tableCount > 0
    );


    if (validAreas.length === 0) {
      dispatch(setSnackbarMessage('At least one valid area is required.'));
      dispatch(setSnackbarOpen(true));
      return;
    }

    try {
      setIsSubmitting(true);
      const updatedBranch = {
        ...selectedBranch,
        areas: validAreas.map((area: any) => {
          const currentTableCount = area.tables?.length || 0;
          const targetTableCount = Number(area.tableCount);
          let tables = area.tables?.map((table: any, index: number) => ({
            seats: table.seats || 4,
            tableNumber: table.tableNumber || `${area.areaName} T${index + 1}`,
            position: table.position || null,
          })) || [];

          if (currentTableCount < targetTableCount) {
            const newTables = Array.from(
              { length: targetTableCount - currentTableCount },
              (_, index) => ({
                seats: 4,
                tableNumber:
                  selectedBranch.type === 'predefined'
                    ? `Table ${currentTableCount + index + 1}`
                    : `${selectedBranch.customTableName || area.areaName} T${currentTableCount + index + 1}`,
                position: null,
              })
            );
            tables = [...tables, ...newTables];
          }

          if (currentTableCount > targetTableCount) {
            tables = tables.slice(0, targetTableCount);
          }

          return {
            areaName: area.areaName.trim(),
            tableCount: targetTableCount,
            tables,
          };
        }),
      };

      await dispatch(patchTableData(updatedBranch)).unwrap();
      dispatch(setSnackbarMessage('Branch Tables updated successfully!'));
      dispatch(setSnackbarOpen(true));
      dispatch(fetchTableData());
      resetDialog();
    } catch (error: unknown) {
      let errorMessage = 'An error occurred';
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      dispatch(setSnackbarMessage(errorMessage));
      dispatch(setSnackbarOpen(true));
    } finally {
      setIsSubmitting(false);
      setEditConfirmationDialogOpen(false);
    }
  };

  const handleEditConfirmationClose = () => {
    setEditConfirmationDialogOpen(false);
  };

  const handleEdit = (branch: any) => {
    const { _id, location, type, totalTableCount, totalTable, customTableName } = branch;

    let extractedTableName = customTableName || '';
    if (type === 'manual' && totalTable?.[0]?.tables?.[0]?.tableNumber && !customTableName) {
      const tableNum = totalTable[0].tables[0].tableNumber;
      extractedTableName = tableNum.split(' T')[0];
    }

    const areas = Array.isArray(totalTable)
      ? totalTable.map((area: any) => {
        const currentTableCount = area.tables?.length || 0;
        const targetTableCount = area.tableCount || currentTableCount;

        const tables = area.tables?.length
          ? area.tables.map((table: any, index: number) => ({
            tableNumber: table.tableNumber || `${area.areaName} T${index + 1}`,
            seats: table.seats || 4,
            position: table.position || null,
          }))
          : Array.from({ length: targetTableCount }, (_, index) => ({
            tableNumber: type === 'predefined'
              ? `Table ${index + 1}`
              : `${extractedTableName} T${index + 1}`,
            seats: 4,
            position: null,
          }));

        if (currentTableCount < targetTableCount) {
          const newTables = Array.from(
            { length: targetTableCount - currentTableCount },
            (_, index) => ({
              tableNumber:
                type === 'predefined'
                  ? `Table ${currentTableCount + index + 1}`
                  : `${extractedTableName} T${currentTableCount + index + 1}`,
              seats: 4,
              position: null,
            })
          );
          tables.push(...newTables);
        }

        return {
          areaName: area.areaName,
          tableCount: targetTableCount,
          tables,
        };
      })
      : [];

    setSelectedBranch({
      _id,
      location,
      type,
      totalTableCount,
      areas,
      customTableName: extractedTableName
    });

    dispatch(setCurrentTableField({ field: 'locationName', value: location }));
    dispatch(setCurrentTableField({ field: 'type', value: type }));
    dispatch(setCurrentTableField({ field: 'tableCount', value: totalTableCount }));
    dispatch(setCurrentTableField({ field: 'areas', value: areas }));
    dispatch(setCurrentTableField({ field: 'customTableName', value: extractedTableName }));

    handleOpen('edit');
  };

  const handleDeactivate = (branch: Branch) => {
    setSelectedBranch(branch);
    setActionType('deactivate');
    setConfirmationDialogOpen(true);
  };

  const handleActivate = (branch: Branch) => {
    setSelectedBranch(branch);
    setActionType('activate');
    setConfirmationDialogOpen(true);
  };

  const handleConfirmationDialogClose = () => {
    setConfirmationDialogOpen(false);
    setSelectedBranch(null);
    setActionType(null);
  };

  const handleConfirmationDialogConfirm = async () => {
    if (selectedBranch && actionType) {
      try {
        if (actionType === 'deactivate') {
          await dispatch(deactivateTable(selectedBranch._id)).unwrap();
          dispatch(setSnackbarMessage('Branch deactivated successfully!'));
        } else {
          await dispatch(activateTable(selectedBranch._id)).unwrap();
          dispatch(setSnackbarMessage('Branch activated successfully!'));
        }
        dispatch(setSnackbarOpen(true));
        dispatch(fetchTableData());
      } catch (error: unknown) {
        let errorMessage = 'An error occurred';
        if (error instanceof Error) {
          errorMessage = error.message;
        }
        dispatch(setSnackbarMessage(errorMessage));
        dispatch(setSnackbarOpen(true));
      }
    }
    handleConfirmationDialogClose();
  };

  const handleTableClick = (table: any, branchLocation: string, areaName: string, branchId: string) => {
    const selectedTableData: TableData = {
      _id: branchId,
      tableNumber: table.tableNumber || table.tableNumber || `Table ${table.index + 1}`,
      location: branchLocation,
      seats: table.seats || 4,
      seatDetails: Array(table.seats || 4).fill('Seat'),
      areaName,
      status: '',
    };
    setSelectedTable(selectedTableData);
    setCurrentSeats(table.seats || 4);
  };

  const handleUpdateTable = async () => {
    if (selectedTable && selectedTable.areaName) {
      try {
        setIsSubmitting(true);
        await dispatch(
          updateSeats({
            _id: selectedTable._id,
            areaName: selectedTable.areaName,
            tableNumber: selectedTable.tableNumber,
            seats: currentSeats,
          })
        ).unwrap();

        dispatch(setSnackbarMessage('Table Seat Updated successfully!'));
        dispatch(fetchTableData());
        dispatch(setSnackbarOpen(true));

        setSelectedTable(null);
      } catch (error: unknown) {
        let errorMessage = 'An error occurred';
        if (error instanceof Error) {
          errorMessage = error.message;
        }
        dispatch(setSnackbarMessage(errorMessage));
        dispatch(setSnackbarOpen(true));
      } finally {
        setIsSubmitting(false);
      }
    }
  };



  const handleOpenLayoutView = (area: any, branchId: string, branchLocation: string) => {
    const tablesWithPositions: TablePosition[] = (area.tables || []).map((table: any) => ({
      tableNumber: table.tableNumber,
      seats: table.seats || 4,
      position: table.position || null,
    }));

    setSelectedAreaForLayout({ ...area, branchId, branchLocation });
    setLayoutTables(tablesWithPositions);
    setLayoutViewOpen(true);
  };

  const handleCloseLayoutView = () => {
    setLayoutViewOpen(false);
    setSelectedAreaForLayout(null);
    setLayoutTables([]);
  };

  const handleSaveLayoutSuccess = () => {
    dispatch(setSnackbarMessage("Layout updated successfully!"));
    dispatch(setSnackbarOpen(true));
    dispatch(fetchTableData());
  };

  const renderTables = (tables: any, branchLocation: string, areaName: string, branchId: string) => (
  <div className={styles['layout-container']}>
    {tables?.map((table: any, index: number) => (
      <div
        key={index}
        className={styles['table-item']}
        onClick={() => handleTableClick(table, branchLocation, areaName, branchId)}
      >
        <div className={styles['table']}>{table.tableNumber || table.tableNumber}</div>
        <div className={styles['details']}>{`${table.seats} Seats`}</div>
      </div>
    ))}
  </div>
);

  const renderAreas = (areas: any, branchLocation: string, branchId: string) =>
    areas?.map((area: any, index: number) => (
      <MuiPaper
        key={index}
        elevation={5}
        sx={{ mb: 2, p: 0.9, backgroundColor: '#f9f9f9', borderRadius: '12px' }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
          <Typography className='icon-action-label'
            sx={{
              fontFamily: "'Poppins', sans-serif",
              fontWeight: 600,
              margin: 0,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              maxWidth: "100%",
              color: '#000000ff'
            }}>
            Area Name : {area.areaName}
          </Typography>
          {!showDeactivated && (
            <button
              className='btn-primary'
              color="primary"
              onClick={() => handleOpenLayoutView(area, branchId, branchLocation)}
            >
              View Layout
            </button>
          )}
        </Box>
        {renderTables(area?.tables, branchLocation, area.areaName, branchId)}
      </MuiPaper>
    ));

  const filteredTables = (showDeactivated ? deactivatedTables : tables).filter((table) =>
    table.location?.toLowerCase().includes(locationFilter.toLowerCase() || '')
  );

  const label = showDeactivated ? 'Show Activated' : 'Show Deactivated';

  return (
    <>
      {/* <MasterAdminMenu /> */}

      {layoutViewOpen && selectedAreaForLayout && (
        <TableLayoutEditorPage
          area={selectedAreaForLayout}
          branchId={selectedAreaForLayout.branchId}
          branchLocation={selectedAreaForLayout.branchLocation}
          initialTables={layoutTables}
          onClose={handleCloseLayoutView}
          onSaveSuccess={handleSaveLayoutSuccess}
        />
      )}

      {!layoutViewOpen && (
        <Box
          sx={{
            display: 'flex',
            backgroundColor: 'white',
            marginLeft: '40px',
          }}
        >
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 0,
              mb: 0,
              flexWrap: 'wrap',
            }}
          >
            <Box sx={{ minWidth: 0 }}>
              <Typography className="icon-action-label"
                sx={{
                  fontFamily: "'Poppins', sans-serif",
                  fontWeight: 600,
                  margin: 0,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  maxWidth: "100%",
                }}
              >
                {showDeactivated ? "Deactivated Tables" : "Active Tables"}
              </Typography>
            </Box>

            <Box sx={{ width: 230, marginRight: 25 }} >
              <FormControl fullWidth>
                <Autocomplete
                  freeSolo
                  options={allBranch.map((b) => b.aliasName)}
                  value={locationFilter}
                  onChange={(e, v) => setLocationFilter(v || '')}
                  inputValue={locationFilter}
                  onInputChange={(e, v) => setLocationFilter(v)}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      placeholder="Search Tables Location"
                      variant="outlined"
                      size="small"
                      sx={{
                        width: '300px',
                        '& .MuiInputBase-root': {
                          '&:hover fieldset': { borderColor: '#000000', borderWidth: 2 },
                          '&.Mui-focused fieldset': { borderColor: '#000000ff', borderWidth: 2 },

                          '& .MuiInputBase-input::placeholder': {
                            color: '#352f2fff !important',   // very dark gray / almost black
                            opacity: 1,
                            height: '30px',
                            fontSize: '0.875rem'
                          }

                        }
                      }}
                    />
                  )}
                  renderOption={(props, option) => (
                    <MenuItem
                      {...props}
                      key={option}
                      sx={{
                        fontSize: '12px',
                        minHeight: '16px',
                        paddingY: '8px',
                      }}
                    >
                      {option}
                    </MenuItem>
                  )}
                  ListboxProps={{ style: { maxHeight: 200 } }}
                  noOptionsText="No branches found"
                />
              </FormControl>
            </Box>

            <div className="flex items-center gap-4">
              {!showDeactivated && (
                <>
                  <div className="icon-action-wrapper">
                    <IconButton
                      color="primary"
                      onClick={() => handleOpen('add')}
                      className="icon-action-button"
                      title="Add"
                    >
                      <AddIcon className="icon-action-svg" />
                    </IconButton>
                    <Typography className="icon-action-label">Add</Typography>
                  </div>
                </>
              )}
              <FormControlLabel
                control={
                  <Switch
                    checked={showDeactivated}
                    onChange={() => dispatch(setShowDeactivated(!showDeactivated))}
                    color="primary"
                    size="small"
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


            <TableContainer component={Paper}
              sx={{
                maxHeight: 'calc(93vh - 170px)',
                overflowY: 'auto',
                width: '100%',
              }}
            >

              {filteredTables.map((branch) => (
                <MuiPaper
                  key={branch._id}
                  elevation={4}
                  sx={{
                    // mb: 5,
                    borderRadius: '12px',
                    overflow: 'hidden',
                    backgroundColor: '#f2f8f8ff',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                  }}
                >
                  <Box
                    sx={{
                      position: 'sticky',
                      top: 0,
                      backgroundColor: '#cfcfd8ff',
                      zIndex: 0,
                      borderBottom: '1px solid #e2e8f0',
                      p: 1,
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <Typography className="icon-action-label"
                      sx={{
                        fontFamily: "'Poppins', sans-serif",
                        fontWeight: 600,
                        margin: 0,
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        maxWidth: "100%",
                        color: '#000000ff'
                      }}
                    >
                      Branch Name : {branch.location}
                    </Typography>

                    <Box sx={{ display: 'flex', gap: 1 }}>
                      {!showDeactivated && (
                        <>
                          <button color="primary" onClick={() => handleEdit(branch)} className='edit-btn'>
                            <EditIcon />
                          </button>
                          <button color="primary" onClick={() => handleDeactivate(branch)} className='btn-primary'>
                            Deactivate
                          </button>
                        </>
                      )}
                      {showDeactivated && (
                        <button color="primary" onClick={() => handleActivate(branch)} className='btn-primary'>
                          Activate
                        </button>
                      )}
                    </Box>
                  </Box>

                  <Box sx={{ maxHeight: '70vh', overflowY: 'auto', p: 1 }}>
                    {renderAreas(branch?.totalTable, branch.location, branch._id)}
                  </Box>
                </MuiPaper>
              ))}

              {filteredTables.length === 0 && (
                <h2 className="empty-state" >
                  {showDeactivated ? 'No deactivated branches found' : 'No active branches found'}
                </h2>
              )}
            </TableContainer>

          </Box>

          {/* ADD BRANCH DIALOG - Now a separate component */}
          <AddBranchDialog
            open={dialogOpen === 'add'}
            currentTable={currentTable}
            allBranch={allBranch}
            validationErrors={validationErrors}
            locationErrors={locationErrors}
            areaError={areaError}
            isSubmitting={isSubmitting}
            onClose={handleClose}
            onFieldChange={handleChange}
            onBranchSelection={handleBranchSelection}
            onAddArea={handleAddArea}
            onSubmit={handleSubmit}
            isBranchAlreadyUsed={isBranchAlreadyUsed}
          />

          {/* EDIT BRANCH DIALOG - Now a separate component */}
          <EditBranchDialog
            open={dialogOpen === 'edit'}
            selectedBranch={selectedBranch}
            allBranch={allBranch}
            newAreaName={newAreaName}
            newAreaCount={newAreaCount}
            editValidationErrors={editValidationErrors}
            tableCountError={tableCountError}
            isSubmitting={isSubmitting}
            onClose={handleClose}
            onBranchChange={(field, value) => {
              setSelectedBranch({ ...selectedBranch, [field]: value });
              setUnsavedChanges(true);

              if (field === 'totalTableCount') {
                const cur = selectedBranch.areas.reduce(
                  (s: number, a: any) => s + Number(a.tableCount),
                  0
                );
                setTableCountError(
                  cur > value
                    ? `Total area count (${cur}) exceeds branch total (${value})`
                    : null
                );
              }
            }}
            onAreaChange={handleAreaChange}
            onNewAreaNameChange={setNewAreaName}
            onNewAreaCountChange={setNewAreaCount}
            onAddNewArea={handleAddNewArea}
            onDeleteArea={(index) => {
              const updatedAreas = selectedBranch.areas.filter((_: any, idx: number) => idx !== index);
              setSelectedBranch({ ...selectedBranch, areas: updatedAreas });
              setUnsavedChanges(true);

              const newTotal = updatedAreas.reduce(
                (s: number, a: any) => s + Number(a.tableCount),
                0
              );
              if (newTotal <= selectedBranch.totalTableCount) {
                setTableCountError(null);
              }
            }}
            onUpdate={() => setEditConfirmationDialogOpen(true)}
          />

          <ActivateDeactivateConfirmationDialog
            open={confirmationDialogOpen}
            actionType={actionType}
            itemName={selectedTable?.location}
            onClose={handleConfirmationDialogClose}
            onConfirm={handleConfirmationDialogConfirm}
          />

          <EditConfirmationDialog
            open={editConfirmationDialogOpen}
            onClose={handleEditConfirmationClose}
            onConfirm={handleEditConfirmation}
          />

          <CloseConfirmationDialog
            open={closeConfirmationDialogOpen}
            onClose={handleCancelClose}
            onConfirm={handleConfirmClose}
          />

          <Snackbar
            open={snackbarOpen}
            autoHideDuration={3000}
            onClose={() => dispatch(setSnackbarOpen(false))}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
          >
            <Alert
              onClose={() => dispatch(setSnackbarOpen(false))}
              severity="info"
              sx={{ width: '100%', backgroundColor: '#1976d2', color: 'white' }}
            >
              {snackbarMessage}
            </Alert>
          </Snackbar>


          {selectedTable && !showDeactivated && (
            <Dialog
              open={!!selectedTable}
              onClose={() => setSelectedTable(null)}
              PaperProps={{
                sx: { borderRadius: 2 }
              }}
            >
              <DialogTitle className='dialog-title'>
                Table Properties -  {selectedTable.tableNumber}
              </DialogTitle>

              <DialogContent dividers className='dialog-content'>
                <div className="form-section">
                  <div className="form-grid">

                    {/* Table Number - Read Only */}
                    <div className="form-field ">
                      <TextField
                        label="Table Name"
                        variant="outlined"
                        fullWidth
                        value={currentTableName}
                        onChange={(e) => setCurrentTableName(e.target.value)}
                        disabled
                        className="custom-textfield"
                        InputLabelProps={{ className: "custom-label" }}
                        InputProps={{ className: "custom-input" }}
                      />
                    </div>

                    {/* Location - Read Only */}
                    <div className="form-field ">
                      <FormControl
                        fullWidth
                        variant="outlined"
                        disabled
                        className="custom-textfield"
                        sx={{
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
                          },
                        }}
                      >
                        <InputLabel className="custom-label">Location</InputLabel>
                        <Select
                          value={selectedTable.location}
                          label="Location"
                          className="custom-input"
                        >
                          {allBranch.map((branch) => (
                            <MenuItem key={branch.branchId} value={branch.aliasName}>
                              {branch.aliasName}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </div>

                    {/* Area Name - Read Only */}
                    <div className="form-field ">
                      <TextField
                        label="Area Name"
                        variant="outlined"
                        value={selectedTable.areaName || ''}
                        fullWidth
                        disabled
                        className="custom-textfield"
                        InputLabelProps={{ className: "custom-label" }}
                        InputProps={{ className: "custom-input" }}
                      />
                    </div>

                    {/* Seat Number - Editable */}
                    {/* <div className="form-field ">
                      <TextField
                        label="Seat Number"
                        variant="outlined"
                        value={currentSeats}
                        onChange={(e) => setCurrentSeats(Number(e.target.value) || 0)}
                        fullWidth
                        inputProps={{ min: 1 }}
                        className="custom-textfield"
                        InputLabelProps={{ className: "custom-label" }}
                        InputProps={{ className: "custom-input" }}
                      />
                    </div> */}
                    <div className="form-field">
                      <TextField
                        label="Seat Number"
                        variant="outlined"
                        value={currentSeats}
                        onChange={(e) => {
                          const value = Number(e.target.value);

                          if (value >= 1 && value <= 20) {
                            setCurrentSeats(value);
                          } else if (e.target.value === "") {
                            setCurrentSeats(0);
                          }
                        }}
                        fullWidth
                        inputProps={{
                          min: 1,
                          max: 20,
                        }}
                        className="custom-textfield"
                        InputLabelProps={{ className: "custom-label" }}
                        InputProps={{ className: "custom-input" }}
                      />
                    </div>
                    {/* <label style={{ fontSize: "12px" }}>* Max Seat Limit Is 20 *</label> */}
                  </div>
                </div>
              </DialogContent>

              {/* <DialogActions className='dialog-actions'>
                <button
                  onClick={() => setSelectedTable(null)}
                  className='btn-secondary'
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdateTable}
                  disabled={isSubmitting || currentSeats === selectedTable.seats}
                  className='btn-primary'
                >
                  {isSubmitting ? 'Saving...' : 'Save Changes'}
                </button>
              </DialogActions> */}

              <DialogActions className='dialog-actions'>
                <button
                  onClick={() => setSelectedTable(null)}
                  className='btn-secondary'
                  disabled={isSubmitting} // Disable cancel during update
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdateTable}
                  disabled={isSubmitting || currentSeats === selectedTable.seats}
                  className='btn-primary'
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    justifyContent: 'center',
                  }}
                >
                  {isSubmitting && (
                    <CircularProgress
                      size={16}
                      sx={{ color: 'white' }}
                    />
                  )}
                  {isSubmitting ? 'Saving...' : 'Save Changes'}
                </button>
              </DialogActions>


            </Dialog>
          )}
        </Box>
      )}
    </>
  );
};

export default TableMaster;