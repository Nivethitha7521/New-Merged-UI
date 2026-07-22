
'use client';
import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Snackbar, Alert, debounce, } from '@mui/material';

import MasterAdminMenu from '../page';
import {
  activateSubCategory,
  addSubCategory,
  deactivateSubCategory,
  fetchSubCategories,
  updateSubCategory,
  setSubCategoryData,
  setDialogOpen,
  setSnackbarMessage,
  setSnackbarOpen,
  resetSubCategoryData,
  setShowDeactivated
} from '../../Items/Subcategory/Features/subcategorySlice';
import CloseConfirmationDialog from '../../../Components/Dialogs/CloseConfirmationDialog';
import EditConfirmationDialog from '../../../Components/Dialogs/EditConfirmationDialog';
import ActivateDeactivateConfirmationDialog from "../../../Components/Dialogs/ActivateDeactivateConfirmationDialog";
import SubcategoryDialog from '../../Items/Subcategory/Modules/SubcategoryDialog';
import SubcategoryTableContainer from '../../Items/Subcategory/Modules/SubcategoryTable';
import { AppDispatch, RootState } from '@/redux/store';

interface SubCategory {
  id: string;
  subCategoryName: string;
  status: string;
  subCategoryId: string;
}



const SubCategoryComponent: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const {
    items: subCategories,
    subCategoryData,
    snackbarOpen,
    snackbarMessage,
    dialogOpen,
    showDeactivated,
    page
  } = useSelector((state: RootState) => state.subCategory);

  const [searchValue, setSearchValue] = useState<string>('');
  const [confirmationDialogOpen, setConfirmationDialogOpen] = useState(false);
  const [editConfirmationDialogOpen, setEditConfirmationDialogOpen] = useState(false);
  const [selectedSubCategory, setSelectedSubCategory] = useState<SubCategory | null>(null);
  const [actionType, setActionType] = useState<'deactivate' | 'activate' | null>(null);
  const [closeConfirmationDialogOpen, setCloseConfirmationDialogOpen] = useState(false);
  const [unsavedChanges, setUnsavedChanges] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [validationErrors, setValidationErrors] = useState({
    subCategoryName: ""
  });

  // useEffect(() => {
  //   dispatch(fetchSubCategories());
  // }, [dispatch, showDeactivated]);

  // O(1) duplicate-name lookup: built once (O(n)) whenever subCategories
  // changes, instead of re-scanning + re-lowercasing the whole list on
  // every submit (O(n) per submit).
  const subCategoryNameIndex = useMemo(() => {
    const map = new Map<string, string>();
    for (const item of subCategories) {
      map.set(item.subCategoryName.toLowerCase(), item.id);
    }
    return map;
  }, [subCategories]);

  const debouncedFetch = useMemo(
    () =>
      debounce((value: string) => {
        dispatch(fetchSubCategories({ search: value, page: 1 }));
      }, 600),
    [dispatch]
  );

  useEffect(() => {
    debouncedFetch(searchValue);

    return () => {
      debouncedFetch.clear();   // ✅ IMPORTANT
    };
  }, [searchValue, debouncedFetch]);

  const handleOpen = useCallback(() => {
    dispatch(resetSubCategoryData());
    setValidationErrors({ subCategoryName: "" });
    dispatch(setDialogOpen("add"));
  }, [dispatch]);

  const resetDialog = useCallback(() => {
    dispatch(setDialogOpen("none"));
    dispatch(resetSubCategoryData());
    setValidationErrors({ subCategoryName: "" });
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
    dispatch(setSubCategoryData({ ...subCategoryData, [name]: value }));
    setValidationErrors((prev) => ({ ...prev, [name]: "" }));
    setUnsavedChanges(true);
  }, [dispatch, subCategoryData]);

  const validateFields = useCallback(() => {
    const errors = { subCategoryName: "" };
    let isValid = true;

    if (!subCategoryData.subCategoryName.trim()) {
      errors.subCategoryName = "SubCategory name is required";
      isValid = false;
    }

    setValidationErrors(errors);
    return isValid;
  }, [subCategoryData]);

  const handleSubmit = useCallback(async () => {
    if (!validateFields()) return;

    // O(1) lookup instead of an O(n) .some() scan over subCategories.
    const existingId = subCategoryNameIndex.get(subCategoryData.subCategoryName.toLowerCase());
    const isDuplicate = existingId !== undefined && existingId !== subCategoryData.id;

    if (isDuplicate) {
      dispatch(setSnackbarMessage('SubCategory with this name already exists.'));
      dispatch(setSnackbarOpen(true));
      return;
    }

    if (subCategoryData.id) {
      setEditConfirmationDialogOpen(true);
    } else {
      try {
        setIsSubmitting(true);
        await dispatch(addSubCategory(subCategoryData));
        dispatch(setSnackbarMessage('SubCategory created successfully!'));
        resetDialog();
        dispatch(fetchSubCategories({ search: searchValue, page }));
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
  }, [validateFields, subCategoryNameIndex, subCategoryData, dispatch, resetDialog, searchValue, page]);

  const handleEditConfirmation = useCallback(async () => {
    try {
      setIsSubmitting(true);
      await dispatch(updateSubCategory(subCategoryData));
      dispatch(setSnackbarMessage('SubCategory updated successfully!'));
      dispatch(fetchSubCategories({ search: searchValue, page }));
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
  }, [dispatch, subCategoryData, searchValue, page, resetDialog]);

  const handleEditConfirmationClose = useCallback(() => {
    setEditConfirmationDialogOpen(false);
  }, []);

  const handleEdit = useCallback((subCategory: SubCategory) => {
    dispatch(setSubCategoryData(subCategory));
    dispatch(setDialogOpen("edit"));
    setUnsavedChanges(false);
  }, [dispatch]);

  const handleDeactivate = useCallback((subCategory: SubCategory) => {
    setSelectedSubCategory(subCategory);
    setActionType("deactivate");
    setConfirmationDialogOpen(true);
  }, []);

  const handleActivate = useCallback((subCategory: SubCategory) => {
    setSelectedSubCategory(subCategory);
    setActionType("activate");
    setConfirmationDialogOpen(true);
  }, []);

  const handleConfirmationDialogClose = useCallback(() => {
    setConfirmationDialogOpen(false);
    setSelectedSubCategory(null);
    setActionType(null);
  }, []);

  const handleConfirmationDialogConfirm = useCallback(async () => {
    if (selectedSubCategory && actionType) {
      try {
        if (actionType === "deactivate") {
          await dispatch(deactivateSubCategory(selectedSubCategory.id));
        } else {
          await dispatch(activateSubCategory(selectedSubCategory.id));
        }
        dispatch(setSnackbarMessage(`SubCategory ${actionType === "deactivate" ? "deactivated" : "activated"}!`));
        dispatch(fetchSubCategories({ search: searchValue, page }));
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
  }, [selectedSubCategory, actionType, dispatch, searchValue, page, handleConfirmationDialogClose]);

  const handleSetShowDeactivated = useCallback((value: boolean) => {
    dispatch(setShowDeactivated(value));
  }, [dispatch]);

  const handleSnackbarClose = useCallback(() => {
    dispatch(setSnackbarOpen(false));
  }, [dispatch]);

  return (
    <>
      <MasterAdminMenu />

      <SubcategoryTableContainer
        handleEdit={handleEdit}
        handleDeactivate={handleDeactivate}
        handleActivate={handleActivate}
        handleOpen={handleOpen}
        showDeactivated={showDeactivated}
        setShowDeactivated={handleSetShowDeactivated}
        searchValue={searchValue}                 
        setSearchValue={setSearchValue}
      />

      <SubcategoryDialog
        open={dialogOpen !== 'none'}
        handleClose={handleClose}
        handleSubmit={handleSubmit}
        subCategoryData={subCategoryData}
        handleChange={handleChange}
        validationErrors={validationErrors}
        mode={dialogOpen as 'add' | 'edit'}
        loading={isSubmitting}
      />

      <ActivateDeactivateConfirmationDialog
        open={confirmationDialogOpen}
        actionType={actionType}
        itemName={selectedSubCategory?.subCategoryName}
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

export default SubCategoryComponent;