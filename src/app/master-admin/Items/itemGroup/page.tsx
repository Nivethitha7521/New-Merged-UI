

'use client';
import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../../../redux/store';
import { Snackbar, Alert,  } from '@mui/material';
// import MasterAdminMenu from '../page';
import {
  activateitemGroup,
  additemGroup,
  deactivateitemGroup,
  fetchitemGroups,
  updateitemGroup,
  setitemGroupData,
  setDialogOpen,
  setSnackbarMessage,
  setSnackbarOpen,
  resetitemGroupData,
  setShowDeactivated
} from '../../../master-admin/Items/itemGroup/Features/itemgroupSlice';
import CloseConfirmationDialog from '../../../Components/Dialogs/CloseConfirmationDialog';
import EditConfirmationDialog from '../../../Components/Dialogs/EditConfirmationDialog';
import ActivateDeactivateConfirmationDialog from "../../../Components/Dialogs/ActivateDeactivateConfirmationDialog";
import ItemGroupTable from '../../Items/itemGroup/Modules/itemGroupTable';
import ItemGroupDialog from '../../Items/itemGroup/Modules/itemGroupDialog';

interface ItemGroup {
  id: string;
  itemGroupName: string;
  status: string;
  itemGroupId: string;
}

const ItemGroupComponent: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const {
    items: itemGroups,
    itemGroupData,
    snackbarOpen,
    snackbarMessage,
    dialogOpen,
    showDeactivated
  } = useSelector((state: RootState) => state.itemGroup);

  const [confirmationDialogOpen, setConfirmationDialogOpen] = useState(false);
  const [editConfirmationDialogOpen, setEditConfirmationDialogOpen] = useState(false);
  const [selecteditemGroup, setSelecteditemGroup] = useState<ItemGroup | null>(null);
  const [actionType, setActionType] = useState<'deactivate' | 'activate' | null>(null);
  const [closeConfirmationDialogOpen, setCloseConfirmationDialogOpen] = useState(false);
  const [unsavedChanges, setUnsavedChanges] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [validationErrors, setValidationErrors] = useState({
    itemGroupName: ""
  });

  useEffect(() => {
    dispatch(fetchitemGroups());
  }, [dispatch, showDeactivated]);

  const handleOpen = () => {
    dispatch(resetitemGroupData());
    setValidationErrors({ itemGroupName: "" });
    dispatch(setDialogOpen("add"));
  };

  const handleClose = () => {
    if (unsavedChanges) {
      setCloseConfirmationDialogOpen(true);
    } else {
      resetDialog();
    }
  };

  const resetDialog = () => {
    dispatch(setDialogOpen("none"));
    dispatch(resetitemGroupData());
    setValidationErrors({ itemGroupName: "" });
    setUnsavedChanges(false);
  };

  const handleConfirmClose = () => {
    resetDialog();
    setCloseConfirmationDialogOpen(false);
  };

  const handleCancelClose = () => {
    setCloseConfirmationDialogOpen(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    dispatch(setitemGroupData({ ...itemGroupData, [name]: value }));
    setValidationErrors({ ...validationErrors, [name]: "" });
    setUnsavedChanges(true);
  };

  const validateFields = () => {
    const errors = { itemGroupName: "" };
    let isValid = true;

    if (!itemGroupData.itemGroupName.trim()) {
      errors.itemGroupName = "itemGroup name is required";
      isValid = false;
    }

    setValidationErrors(errors);
    return isValid;
  };

  const handleSubmit = async () => {
    if (!validateFields()) return;

    const isDuplicate = itemGroups.some(
      (item) =>
        item.itemGroupName.toLowerCase() === itemGroupData.itemGroupName.toLowerCase() &&
        item.id !== itemGroupData.id
    );

    if (isDuplicate) {
      dispatch(setSnackbarMessage('itemGroup with this name already exists.'));
      dispatch(setSnackbarOpen(true));
      return;
    }

    if (itemGroupData.id) {
      setEditConfirmationDialogOpen(true);
    } else {
      try {
        setIsSubmitting(true);
        await dispatch(additemGroup(itemGroupData));
        dispatch(setSnackbarMessage('itemGroup created successfully!'));
        resetDialog();
        dispatch(fetchitemGroups());
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

  const handleEditConfirmation = async () => {
    try {
      setIsSubmitting(true);
      await dispatch(updateitemGroup(itemGroupData));
      dispatch(setSnackbarMessage('itemGroup updated successfully!'));
      dispatch(fetchitemGroups());
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

  const handleEdit = (itemGroup: ItemGroup) => {
    dispatch(setitemGroupData(itemGroup));
    dispatch(setDialogOpen("edit"));
    setUnsavedChanges(false);
  };

  const handleDeactivate = (itemGroup: ItemGroup) => {
    setSelecteditemGroup(itemGroup);
    setActionType("deactivate");
    setConfirmationDialogOpen(true);
  };

  const handleActivate = (itemGroup: ItemGroup) => {
    setSelecteditemGroup(itemGroup);
    setActionType("activate");
    setConfirmationDialogOpen(true);
  };

  const handleConfirmationDialogClose = () => {
    setConfirmationDialogOpen(false);
    setSelecteditemGroup(null);
    setActionType(null);
  };

  const handleConfirmationDialogConfirm = async () => {
    if (selecteditemGroup && actionType) {
      try {
        if (actionType === "deactivate") {
          await dispatch(deactivateitemGroup(selecteditemGroup.id));
        } else {
          await dispatch(activateitemGroup(selecteditemGroup.id));
        }
        dispatch(setSnackbarMessage(`itemGroup ${actionType === "deactivate" ? "deactivated" : "activated"}!`));
        dispatch(fetchitemGroups());
      } catch (error: unknown) {
        let errorMessage = 'An error occurred';
        if (error instanceof Error) {
          errorMessage = error.message;
        }
        dispatch(setSnackbarMessage(errorMessage));
        dispatch(setSnackbarOpen(true));
      }
      // dispatch(setSnackbarOpen(true));
    }
    handleConfirmationDialogClose();
  };

  return (
    <>
      {/* <MasterAdminMenu /> */}


      <ItemGroupTable
        handleOpen={handleOpen}
        handleEdit={handleEdit}
        handleActivate={handleActivate}
        handleDeactivate={handleDeactivate}
        showDeactivated={showDeactivated}
        setShowDeactivated={(value: boolean) => dispatch(setShowDeactivated(value))}
      />

      <ItemGroupDialog
        open={dialogOpen !== 'none'}
        handleClose={handleClose}
        handleSubmit={handleSubmit}
        handleChange={handleChange}
        itemGroupData={itemGroupData}
        validationErrors={validationErrors}
        mode={dialogOpen as 'add' | 'edit'}
        isSubmitting={isSubmitting}
      />


      <ActivateDeactivateConfirmationDialog
        open={confirmationDialogOpen}
        actionType={actionType}
        itemName={selecteditemGroup?.itemGroupName}
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
    </>
  );
};

export default ItemGroupComponent;