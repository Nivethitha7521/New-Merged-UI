
'use client';
import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../../../redux/store';
import { Snackbar, Alert } from '@mui/material';
import MasterAdminMenu from '../page';
import {
  activateInventory,
  addInventory,
  deactivateInventory,
  fetchInventories,
  updateInventory,
  setInventoryTypeData,
  setDialogOpen,
  setSnackbarMessage,
  setSnackbarOpen,
  resetInventoryTypeData,
  setShowDeactivated,
} from '../InventoryType/Features/inventoryTypeSlice';
import CloseConfirmationDialog from '../../../Components/Dialogs/CloseConfirmationDialog';
import EditConfirmationDialog from '../../../Components/Dialogs/EditConfirmationDialog';
import ActivateDeactivateConfirmationDialog from '../../../Components/Dialogs/ActivateDeactivateConfirmationDialog';
import InventoryTable from '../InventoryType/Modules/inventoryTypeTable';
import InventoryDialog from '../InventoryType/Modules/inventoryTypeDialog';
import { Inventory } from '../InventoryType/Models/inventoryTypeModels';

const InventoryComponent: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const {
    items: inventories,
    inventoryTypeData,
    snackbarOpen,
    snackbarMessage,
    dialogOpen,
    showDeactivated,
  } = useSelector((state: RootState) => state.inventoryType);

  const [confirmationDialogOpen, setConfirmationDialogOpen] = useState(false);
  const [editConfirmationDialogOpen, setEditConfirmationDialogOpen] = useState(false);
  const [selectedInventory, setSelectedInventory] = useState<Inventory | null>(null);
  const [actionType, setActionType] = useState<'deactivate' | 'activate' | null>(null);
  const [closeConfirmationDialogOpen, setCloseConfirmationDialogOpen] = useState(false);
  const [unsavedChanges, setUnsavedChanges] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [togglingId, setTogglingId] = useState<string | null>(null);

  const [validationErrors, setValidationErrors] = useState({
    inventoryType: '',
  });

  useEffect(() => {
    dispatch(fetchInventories());
  }, [dispatch, showDeactivated]);

  // O(1) duplicate-name lookup: built once (O(n)) whenever `inventories`
  // changes, instead of re-scanning + re-lowercasing the whole list on
  // every submit (O(n) per submit).
  const inventoryTypeNameIndex = useMemo(() => {
    const map = new Map<string, string>();
    for (const item of inventories) {
      if (item.inventoryType) {
        map.set(item.inventoryType.toLowerCase(), item.id);
      }
    }
    return map;
  }, [inventories]);

  const handleOpen = useCallback(() => {
    dispatch(resetInventoryTypeData());
    setValidationErrors({ inventoryType: '' });
    dispatch(setDialogOpen('add'));
  }, [dispatch]);

  const resetDialog = useCallback(() => {
    dispatch(setDialogOpen('none'));
    dispatch(resetInventoryTypeData());
    setValidationErrors({ inventoryType: '' });
    setUnsavedChanges(false);
  }, [dispatch]);

  const handleClose = useCallback(() => {
    if (unsavedChanges) {
      setCloseConfirmationDialogOpen(true);
    } else {
      resetDialog();
    }
  }, [unsavedChanges, resetDialog]);

  const handleConfirmClose = useCallback(() => {
    resetDialog();
    setCloseConfirmationDialogOpen(false);
  }, [resetDialog]);

  const handleCancelClose = useCallback(() => {
    setCloseConfirmationDialogOpen(false);
  }, []);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    dispatch(setInventoryTypeData({ ...inventoryTypeData, [name]: value }));
    setValidationErrors((prev) => ({ ...prev, [name]: '' }));
    setUnsavedChanges(true);
  }, [dispatch, inventoryTypeData]);

  const validateFields = useCallback(() => {
    const errors = { inventoryType: '' };
    let isValid = true;

    if (!inventoryTypeData.inventoryType?.trim()) {
      errors.inventoryType = 'Inventory Type name is required';
      isValid = false;
    }

    setValidationErrors(errors);
    return isValid;
  }, [inventoryTypeData]);

  const handleSubmit = useCallback(async () => {
    if (!validateFields()) return;

    // O(1) lookup instead of an O(n) .some() scan over inventories.
    const existingId = inventoryTypeData.inventoryType
      ? inventoryTypeNameIndex.get(inventoryTypeData.inventoryType.toLowerCase())
      : undefined;
    const isDuplicate = existingId !== undefined && existingId !== inventoryTypeData.id;

    if (isDuplicate) {
      dispatch(setSnackbarMessage('Inventory Type with this name already exists.'));
      dispatch(setSnackbarOpen(true));
      return;
    }

    if (inventoryTypeData.id) {
      setEditConfirmationDialogOpen(true);
    } else {
      try {
        setIsSubmitting(true);
        await dispatch(addInventory(inventoryTypeData));
        dispatch(setSnackbarMessage('Inventory Type created successfully!'));
        resetDialog();
        dispatch(fetchInventories());
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
  }, [validateFields, inventoryTypeNameIndex, inventoryTypeData, dispatch, resetDialog]);

  const handleEditConfirmation = useCallback(async () => {
    try {
      setIsSubmitting(true);
      await dispatch(updateInventory(inventoryTypeData));
      dispatch(setSnackbarMessage('Inventory Type updated successfully!'));
      dispatch(fetchInventories());
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
  }, [dispatch, inventoryTypeData, resetDialog]);

  const handleEditConfirmationClose = useCallback(() => {
    setEditConfirmationDialogOpen(false);
  }, []);

  const handleEdit = useCallback((inventory: Inventory) => {
    dispatch(setInventoryTypeData(inventory));
    dispatch(setDialogOpen('edit'));
    setUnsavedChanges(false);
  }, [dispatch]);

  const handleDeactivate = useCallback((inventory: Inventory) => {
    setSelectedInventory(inventory);
    setActionType('deactivate');
    setConfirmationDialogOpen(true);
  }, []);

  const handleActivate = useCallback((inventory: Inventory) => {
    setSelectedInventory(inventory);
    setActionType('activate');
    setConfirmationDialogOpen(true);
  }, []);

  const handleConfirmationDialogClose = useCallback(() => {
    setConfirmationDialogOpen(false);
    setSelectedInventory(null);
    setActionType(null);
  }, []);

  const handleConfirmationDialogConfirm = useCallback(async () => {
    if (selectedInventory && actionType) {
      try {
        if (actionType === 'deactivate') {
          await dispatch(deactivateInventory(selectedInventory.id));
        } else {
          await dispatch(activateInventory(selectedInventory.id));
        }
        dispatch(setSnackbarMessage(`Inventory Type ${actionType === 'deactivate' ? 'deactivated' : 'activated'}!`));
        dispatch(fetchInventories());
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
  }, [selectedInventory, actionType, dispatch, handleConfirmationDialogClose]);


  // Handle toggle directSale field
  const handleToggleDirectSale = useCallback(async (inventory: Inventory) => {
    try {
      const updatedInventory = {
        ...inventory,
        directSale: !inventory.directSale,
      };
      await dispatch(updateInventory(updatedInventory));
      dispatch(setSnackbarMessage(`Direct Sale ${!inventory.directSale ? 'enabled' : 'disabled'} successfully!`));
      dispatch(fetchInventories());
    } catch (error: unknown) {
      let errorMessage = 'An error occurred';
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      dispatch(setSnackbarMessage(errorMessage));
      dispatch(setSnackbarOpen(true));
    }
  }, [dispatch]);

  const handleSetShowDeactivated = useCallback((value: boolean) => {
    dispatch(setShowDeactivated(value));
  }, [dispatch]);

  const handleSnackbarClose = useCallback(() => {
    dispatch(setSnackbarOpen(false));
  }, [dispatch]);

  return (
    <>
      <MasterAdminMenu />

      <InventoryTable
        handleOpen={handleOpen}
        handleEdit={handleEdit}
        handleActivate={handleActivate}
        handleDeactivate={handleDeactivate}
        handleToggleDirectSale={handleToggleDirectSale}
        showDeactivated={showDeactivated}
        setShowDeactivated={handleSetShowDeactivated}
      />

      <InventoryDialog
        open={dialogOpen !== 'none'}
        handleClose={handleClose}
        handleSubmit={handleSubmit}
        handleChange={handleChange}
        inventoryTypeData={inventoryTypeData}
        validationErrors={validationErrors}
        mode={dialogOpen as 'add' | 'edit'}
        isSubmitting={isSubmitting}
      />

      <ActivateDeactivateConfirmationDialog
        open={confirmationDialogOpen}
        actionType={actionType}
        itemName={selectedInventory?.inventoryType}
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
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      >
        <Alert
          onClose={handleSnackbarClose}
          severity="info"
          sx={{ width: '100%', backgroundColor: '#1976d2', color: 'white' }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </>
  );
};

export default InventoryComponent;