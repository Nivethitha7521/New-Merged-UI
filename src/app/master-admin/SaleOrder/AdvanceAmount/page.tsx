


'use client';
import React, { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box,
  //FormControlLabel,
  //Switch,
  CircularProgress,
  Alert,
  Snackbar,
} from '@mui/material';
import { AdvanceAmountDialog } from '../AdvanceAmount/Modules/AddAdvanceAmountDialog';
import { AdvanceAmountTable } from '../AdvanceAmount/Modules/AdvanceAmountTableComponent';
//import CashManagementPage from '../page';
import {
  RootState,
  AppDispatch,
} from '../../../../redux/store';
import {
  addAdvanceAmount,
  fetchAdvanceAmounts,
  updateAdvanceAmount,
  //  deactivateAdvanceAmount,
  //  activateAdvanceAmount,
  setAdvanceAmountData,
  setDialogOpen,
  setSnackbarMessage,
  setSnackbarOpen,
  //setShowDeactivated,
  resetAdvanceAmountData,
  fetchBranches,
  selectAllBranches,
  applyAllamounts,
} from '../AdvanceAmount/Features/AdvanceAmountSlice';
import { AdvanceAmount } from "../AdvanceAmount/Models/advanceamountModels";
import CloseConfirmationDialog from '../../../Components/Dialogs/CloseConfirmationDialog';
import EditConfirmationDialog from '../../../Components/Dialogs/EditConfirmationDialog';
//import ActivateDeactivateConfirmationDialog from "../../../Components/Dialogs/ActivateDeactivateConfirmationDialog";
import { AxiosError } from 'axios';
import MenuPage from '../page';

const AdvanceAmountPage: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const {
    items: advanceAmounts,
    deactivatedItems,
    loading,
    error,
    advanceAmountData,
    snackbarOpen,
    snackbarMessage,
    dialogOpen,
    showDeactivated,
    allBranch,
  } = useSelector((state: RootState) => ({
    ...state.AdvanceAmount,
    allBranch: selectAllBranches(state),
  }));

  // const [confirmationDialogOpen, setConfirmationDialogOpen] = useState(false);
  const [editConfirmationDialogOpen, setEditConfirmationDialogOpen] = useState(false);
  // const [selectedAdvanceAmount, setSelectedAdvanceAmount] = useState<AdvanceAmount | null>(null);
  // const [actionType, setActionType] = useState<"deactivate" | "activate" | null>(null);
  const [closeConfirmationDialogOpen, setCloseConfirmationDialogOpen] = useState(false);
  const [unsavedChanges, setUnsavedChanges] = useState(false);
    const [applyingAll, setApplyingAll] = useState(false);
  const [validationErrors, setValidationErrors] = useState({
   // name: "",
    percentage: "",
    branches: "",
   // remarks: "",
  });

  useEffect(() => {
    dispatch(fetchAdvanceAmounts());
    dispatch(fetchBranches());
  }, [dispatch]);

  const tableRows = useMemo(() => {
    const activeMap = new Map(advanceAmounts.map(a => [a.branches, a]));

    return allBranch.map(branchName => {
      const existing = activeMap.get(branchName);
      if (existing) return existing;

      return {
        amountId: '',
       // name: '',
        percentage: '0',
       // remarks: '',
        branches: branchName,
        status: 'active' as const,
        createdDate: null,
        updatedDate: null,
      } satisfies AdvanceAmount;
    });
  }, [allBranch, advanceAmounts]);

  const handleClose = () => {
    if (unsavedChanges) {
      setCloseConfirmationDialogOpen(true);
    } else {
      resetDialog();
    }
  };

  const resetDialog = () => {
    dispatch(setDialogOpen("none"));
    dispatch(resetAdvanceAmountData());
    setValidationErrors({ percentage: "", branches: "",  });
    setUnsavedChanges(false);
  };

  const handleConfirmClose = () => {
    resetDialog();
    setCloseConfirmationDialogOpen(false);
  };

  const handleCancelClose = () => {
    setCloseConfirmationDialogOpen(false);
  };



    const handleApplyAll = async (value: string) => {
    if (!/^\d*\.?\d*$/.test(value)) {
      dispatch(setSnackbarMessage('Invalid number'));
      dispatch(setSnackbarOpen(true));
      return;
    }
  
    setApplyingAll(true);
    try {
      await dispatch(applyAllamounts(value)).unwrap();
      dispatch(setSnackbarMessage(`Applied ${value} to all branches instantly!`));
      dispatch(setSnackbarOpen(true));
      dispatch(fetchAdvanceAmounts());
    } catch {
      dispatch(setSnackbarMessage('Failed to apply to all branches'));
      dispatch(setSnackbarOpen(true));
    } finally {
      setApplyingAll(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    dispatch(setAdvanceAmountData({ ...advanceAmountData, [name]: value }));
    setValidationErrors({ ...validationErrors, [name]: "" });
    setUnsavedChanges(true);
  };


  const validateFields = () => {
  const errors = { percentage: "", branches: "", };

  // if (!advanceAmountData.name?.trim()) {
  //   errors.name = "Required";
  // }

  const perc = advanceAmountData.percentage;

  // if (perc === null || perc === undefined || perc === "") {
  //   errors.percentage = "Required";
  // } else if (Number(perc) <= 0) {
  //   errors.percentage = "Must be greater than 0";
  // }

  if (perc === null || perc === undefined || perc === "") {
  errors.percentage = "Required";
} else if (Number(perc) < 0) {
  errors.percentage = "Must be 0 or greater";
}


  setValidationErrors(errors);
  return Object.values(errors).every(err => err === "");
};


  const handleSubmit = async () => {
  if (!validateFields()) return;

//  const currentName = advanceAmountData.name?.toLowerCase() || "";
  const currentBranch = advanceAmountData.branches?.toLowerCase() || "";

  const isDuplicate = advanceAmounts.some((amount) => {
  //  const existingName = amount.name?.toLowerCase() || "";
    const existingBranch = amount.branches?.toLowerCase() || "";

    return (
   //   existingName === currentName &&
      existingBranch === currentBranch &&
      amount.amountId !== advanceAmountData.amountId
    );
  });

  if (isDuplicate) {
    dispatch(
      setSnackbarMessage(
        "Advance Amount with this name already exists for this branch."
      )
    );
    dispatch(setSnackbarOpen(true));
    return;
  }

  if (advanceAmountData.amountId) {
    setEditConfirmationDialogOpen(true);
  } else {
    try {
      await dispatch(addAdvanceAmount(advanceAmountData));
      dispatch(setSnackbarMessage("Advance Amount added successfully!"));
      resetDialog();
      dispatch(fetchAdvanceAmounts());
    } catch (error) {
      const err = error as AxiosError;
      dispatch(setSnackbarMessage(err.message || "An error occurred"));
      dispatch(setSnackbarOpen(true));
    }
  }
};




  const handleEditConfirmation = async () => {
    try {
      await dispatch(updateAdvanceAmount(advanceAmountData));
      dispatch(setSnackbarMessage('Advance Amount updated successfully!'));
      dispatch(fetchAdvanceAmounts());
    } catch (error) {
      const err = error as AxiosError;
      dispatch(setSnackbarMessage(err.message || 'An error occurred'));
      dispatch(setSnackbarOpen(true));
    }
    setEditConfirmationDialogOpen(false);
    resetDialog();
  };

  const handleEditConfirmationClose = () => {
    setEditConfirmationDialogOpen(false);
  };

  const handleEdit = (advanceAmount: AdvanceAmount) => {
    dispatch(setAdvanceAmountData(advanceAmount));
    dispatch(setDialogOpen(advanceAmount.amountId ? "edit" : "add"));
    setUnsavedChanges(false);
  };

  // const handleDeactivate = (advanceAmount: AdvanceAmount) => {
  //   setSelectedAdvanceAmount(advanceAmount);
  //   setActionType("deactivate");
  //   setConfirmationDialogOpen(true);
  // };

  // const handleActivate = (advanceAmount: AdvanceAmount) => {
  //   setSelectedAdvanceAmount(advanceAmount);
  //   setActionType("activate");
  //   setConfirmationDialogOpen(true);
  // };

  // const handleConfirmationDialogClose = () => {
  //   setConfirmationDialogOpen(false);
  //   setSelectedAdvanceAmount(null);
  //   setActionType(null);
  // };

  // const handleConfirmationDialogConfirm = async () => {
  //   if (selectedAdvanceAmount && actionType) {
  //     try {
  //       if (actionType === "deactivate") {
  //         await dispatch(deactivateAdvanceAmount(selectedAdvanceAmount.amountId));
  //       } else {
  //         await dispatch(activateAdvanceAmount(selectedAdvanceAmount.amountId));
  //       }
  //       dispatch(setSnackbarMessage(`Advance Amount ${actionType}d!`));
  //       dispatch(fetchAdvanceAmounts());
  //       dispatch(setSnackbarOpen(true));
  //     } catch (error) {
  //       const err = error as AxiosError;
  //       dispatch(setSnackbarMessage(err.message || 'An error occurred'));
  //       dispatch(setSnackbarOpen(true));
  //     }
  //   }
  //   handleConfirmationDialogClose();
  // };

  // const toggleShowDeactivated = () => {
  //   dispatch(setShowDeactivated(!showDeactivated));
  // };

  const handleDialogClose = (_event: React.SyntheticEvent, reason: "backdropClick" | "escapeKeyDown") => {
    if (reason === "backdropClick" && unsavedChanges) {
      setCloseConfirmationDialogOpen(true);
    } else {
      handleClose();
    }
  };

  return (
    <>
      <MenuPage />
      <Box
        display="flex"
        flexDirection={{ xs: "column", sm: "row" }}
        alignItems={{ xs: "flex-start", sm: "center" }}
        justifyContent="space-between"
        gap={0}
        my={1}
        ml={1}
        px={{ xs: 2, sm: 3 }}
        sx={{ width: "99%", boxSizing: "border-box", mt: 2 }}
      >
        {/* Left: Title */}
        {/* <Typography className='icon-action-label'
          sx={{
            fontFamily: "'Poppins', sans-serif",
            fontWeight: 750,
            margin: 0,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            maxWidth: "100%",
          }}
        >
          {showDeactivated ? "Deactivated S.O Advance" : "Active S.O Advance"}
        </Typography> */}

        {/* Right: Switch */}
        {/* <FormControlLabel
          control={
            <Switch
              checked={showDeactivated}
              onChange={toggleShowDeactivated}
              color="primary"
            />
          }
          label="Show Deactivated"
        /> */}
      </Box>


        <AdvanceAmountTable
          data={showDeactivated ? deactivatedItems : tableRows}
          isDeactivatedView={showDeactivated}
          onEdit={handleEdit}
          // onDeactivate={handleDeactivate}
          //  onActivate={handleActivate}

          // === NEW PROPS ===
          onApplyAll={handleApplyAll}
          applyingAll={applyingAll}
          allBranches={allBranch}
        />
     

      <AdvanceAmountDialog
        open={dialogOpen !== "none"}
        onClose={handleDialogClose}
        onSubmit={handleSubmit}
        onChange={handleChange}
        advanceAmountData={advanceAmountData}
        validationErrors={validationErrors}
        loading={loading}
        isEditMode={!!advanceAmountData.amountId}
        unsavedChanges={unsavedChanges}
        handleClose={handleClose}
      />

      {/* <ActivateDeactivateConfirmationDialog
        open={confirmationDialogOpen}
        actionType={actionType}
        onClose={handleConfirmationDialogClose}
        onConfirm={handleConfirmationDialogConfirm}
      /> */}

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

export default AdvanceAmountPage;