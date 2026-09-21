


'use client';
import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../../redux/store';
import {
  Box,
  IconButton,
  Switch,
  FormControlLabel,
  Alert,
  CircularProgress,
  Typography,
} from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import {
  fetchassets,
  addasset,
  updateasset,
  deactivateasset,
  activateasset,
} from '../assetManagement/Feature/assetSlice';
import {  initialAsset } from "../assetManagement/Models/assetModels";
import YenPosPage from '../page';
import AssetTable from '../assetManagement/Modules/AssetTable';
import AssetDialog from '../assetManagement/Modules/AssetDialog';
import AssetSnackbar from '../assetManagement/Modules/AssetSnackbar';
import CloseConfirmationDialog from '../../Components/Dialogs/CloseConfirmationDialog';
import EditConfirmationDialog from '../../Components/Dialogs/EditConfirmationDialog';
import ActivateDeactivateConfirmationDialog from '../../Components/Dialogs/ActivateDeactivateConfirmationDialog';
import type { Asset } from '../assetManagement/Models/assetModels';
import { AxiosError } from 'axios';

const Asset: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { assets, deactivatedAssets, loading, error } = useSelector((state: RootState) => state.asset);
  
  const [assetData, setAssetData] = React.useState(initialAsset);
  const [validationErrors, setValidationErrors] = React.useState({
    assetName: '',
    serialNo: '',
  });
  const [openDialog, setOpenDialog] = React.useState(false);
  const [showDeactivated, setShowDeactivated] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [snackbarOpen, setSnackbarOpen] = React.useState(false);
  const [snackbarMessage, setSnackbarMessage] = React.useState('');
  const [editMode, setEditMode] = React.useState(false);
  const [confirmationDialogOpen, setConfirmationDialogOpen] = React.useState(false);
  const [editConfirmationDialogOpen, setEditConfirmationDialogOpen] = React.useState(false);
  const [closeConfirmationDialogOpen, setCloseConfirmationDialogOpen] = React.useState(false);
  const [actionType, setActionType] = React.useState<'activate' | 'deactivate'>('deactivate');
  const [selectedAsset, setSelectedAsset] = React.useState<Asset | null>(null);
  const [unsavedChanges, setUnsavedChanges] = React.useState(false);

  React.useEffect(() => {
    dispatch(fetchassets());
  }, [dispatch]);

  const handleOpen = () => {
    setAssetData(initialAsset);
    setValidationErrors({ assetName: "", serialNo: "" });
    setEditMode(false);
    setOpenDialog(true);
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
    setOpenDialog(false);
    setAssetData(initialAsset);
    setValidationErrors({ assetName: '', serialNo: '' });
    setEditMode(false);
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
    setAssetData((prev) => ({ ...prev, [name]: value }));
    setValidationErrors((prev) => ({ ...prev, [name]: '' }));
    setUnsavedChanges(true);
  };

  const validateFields = () => {
    const errors = { assetName: '', serialNo: '' };
    let isValid = true;

    if (!assetData.assetName.trim()) {
      errors.assetName = 'Asset Name is required';
      isValid = false;
    }
    if (!assetData.serialNo.trim()) {
      errors.serialNo = 'Serial No is required';
      isValid = false;
    }

    setValidationErrors(errors);
    return isValid;
  };

  const handleSubmit = async () => {
    if (!validateFields()) return;

    const isDuplicate = assets.some(
      item => item.assetName.toLowerCase() === assetData.assetName.toLowerCase() &&
      item.assetId !== assetData.assetId
    );

    if (isDuplicate) {
      setSnackbarMessage('Asset with this name already exists.');
      setSnackbarOpen(true);
      return;
    }

    if (editMode) {
      setEditConfirmationDialogOpen(true);
    } else {
      try {
        setIsSubmitting(true);
        await dispatch(addasset(assetData)).unwrap();
        setSnackbarMessage('Asset created successfully!');
        resetDialog();
        dispatch(fetchassets());
      } catch (error) {
        const err=error as AxiosError;
        setSnackbarMessage(err.message || 'An error occurred');
        setSnackbarOpen(true);
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const handleEditConfirmation = async () => {
    try {
      setIsSubmitting(true);
      await dispatch(updateasset(assetData)).unwrap();
      setSnackbarMessage('Asset updated successfully!');
      dispatch(fetchassets());
      resetDialog();
    } catch (error) {
      const err=error as AxiosError
      setSnackbarMessage(err.message || 'An error occurred');
      setSnackbarOpen(true);
    } finally {
      setIsSubmitting(false);
      setEditConfirmationDialogOpen(false);
    }
  };

  const handleEditConfirmationClose = () => {
    setEditConfirmationDialogOpen(false);
  };

  const handleEdit = (asset: Asset) => {
    setAssetData(asset);
    setValidationErrors({ assetName: '', serialNo: '' });
    setEditMode(true);
    setOpenDialog(true);
    setUnsavedChanges(false);
  };

  const handleDeactivate = (asset: Asset) => {
    setSelectedAsset(asset);
    setActionType('deactivate');
    setConfirmationDialogOpen(true);
  };

  const handleActivate = (asset: Asset) => {
    setSelectedAsset(asset);
    setActionType('activate');
    setConfirmationDialogOpen(true);
  };

  const handleToggleShowDeactivated = () => {
    setShowDeactivated(!showDeactivated);
  };

  const handleConfirmationDialogClose = () => {
    setConfirmationDialogOpen(false);
    setSelectedAsset(null);
  };

  const handleConfirmationDialogConfirm = async () => {
    if (selectedAsset && actionType) {
      try {
        if (actionType === 'deactivate') {
          await dispatch(deactivateasset(selectedAsset.assetId)).unwrap();
        } else {
          await dispatch(activateasset(selectedAsset.assetId)).unwrap();
        }
        setSnackbarMessage(`Asset ${actionType === 'deactivate' ? 'deactivated' : 'activated'}!`);
        dispatch(fetchassets());
      } catch (error) {
        const err=error as AxiosError;
        setSnackbarMessage(err.message || 'An error occurred');
      }
      setSnackbarOpen(true);
    }
    handleConfirmationDialogClose();
  };

  const handleDialogClose = (_event:React.SyntheticEvent, reason: "backdropClick" | "escapeKeyDown") => {
    if (reason === "backdropClick" && unsavedChanges) {
      setCloseConfirmationDialogOpen(true);
    } else {
      handleClose();
    }
  };

  const displayedAssets = showDeactivated ? deactivatedAssets : assets;

  const label = showDeactivated ? 'Show Activated' : 'Show Deactivated';

  return (
    <>
      <YenPosPage />

      <Box
        sx={{
          display: "flex",
          justifyContent: "flex-end",
          alignItems: "center",
          gap: "20px",
          margin: "22px",
        }}
      >
        {!showDeactivated && (
         <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginRight: 0 }}>
            <IconButton
              color="primary"
              onClick={handleOpen}
              className="icon-button-outline"
              size="small"
              sx={{ p: 0.3 }}
            >
              <AddIcon fontSize="small" />
            </IconButton>
            <Typography variant="caption" align="center" sx={{ maxWidth: 50, mt: 0.8 }}>
              Add
            </Typography>
          </Box>
        )}
        <FormControlLabel
          control={
            <Switch
              checked={showDeactivated}
              onChange={handleToggleShowDeactivated}
              color="primary"
            />
          }
          label={label}
        />
      </Box>

      {loading ? (
        <Box display="flex" justifyContent="center" mt={0}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Alert severity="error">{error}</Alert>
      ) : (
        <AssetTable 
          showDeactivated={showDeactivated}
          displayedAssets={displayedAssets}
          handleEdit={handleEdit}
          handleDeactivate={handleDeactivate}
          handleActivate={handleActivate}
        />
      )}

      <AssetDialog
        open={openDialog}
        editMode={editMode}
        assetData={assetData}
        validationErrors={validationErrors}
        isSubmitting={isSubmitting}
        handleDialogClose={handleDialogClose}
        handleChange={handleChange}
        handleSubmit={handleSubmit}
        handleClose={handleClose}
      />

      <ActivateDeactivateConfirmationDialog
        open={confirmationDialogOpen}
        actionType={actionType}
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

      <AssetSnackbar
        open={snackbarOpen}
        message={snackbarMessage}
        onClose={() => setSnackbarOpen(false)}
      />
    </>
  );
};

export default Asset;