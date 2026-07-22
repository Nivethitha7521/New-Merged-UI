
'use client';
import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Snackbar, Alert } from '@mui/material';
import { AppDispatch, RootState } from '../../../../redux/store';
import MasterAdminMenu from '../page';
import {
  activateCategory,
  addCategory,
  deactivateCategory,
  fetchCategories,
  fetchSubcategories,
  updateCategory,
  setCategoryData,
  setDialogOpen,
  setSnackbarMessage,
  setSnackbarOpen,
  resetCategoryData,
  resetPagination,
  incrementPage,
} from '../Category/Features/categorySlice';
import CloseConfirmationDialog from '../../../Components/Dialogs/CloseConfirmationDialog';
import EditConfirmationDialog from '../../../Components/Dialogs/EditConfirmationDialog';
import ActivateDeactivateConfirmationDialog from '../../../Components/Dialogs/ActivateDeactivateConfirmationDialog';
import CategoryTableContainer from '../Category/Modules/CategoryTable';
import CategoryDialog from '../Category/Modules/CategoryDialog';
import { debounce } from 'lodash';

interface Category {
  id: string;
  categoryName: string;
  subCategory: string[];
  status: string;
  categoryId: string;
}

// Hoisted outside the component so it is compiled once for the lifetime of the
// module instead of being re-created on every render.
const CATEGORY_NAME_REGEX = /^[A-Za-z\s/.,&-/]+$/;

const CategoryComponent: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const {
    items: activeCategories,
    deactivatedItems,
    categoryData,
    snackbarOpen,
    snackbarMessage,
    dialogOpen,
    allSubcategories,
    currentPage,
    totalPages,
    isFetchingItems,
    hasMoreItems,
  } = useSelector((state: RootState) => state.Category);

  const allCategories = useMemo(() =>
    [...activeCategories, ...deactivatedItems],
    [activeCategories, deactivatedItems]
  );

  // O(1) duplicate-name lookup.
  // Building the index costs O(n) and only happens when the underlying
  // category lists actually change (thanks to useMemo). Every subsequent
  // duplicate check inside handleSubmit then becomes a single Map.get(),
  // i.e. O(1), instead of re-scanning the whole array (O(n)) and calling
  // .toLowerCase() on every item each time the user hits submit.
  const categoryNameIndex = useMemo(() => {
    const map = new Map<string, string>();
    for (const cat of allCategories) {
      map.set(cat.categoryName, cat.id);
    }
    return map;
  }, [allCategories]);

  const [searchValue, setSearchValue] = useState<string>('');
  const [confirmationDialogOpen, setConfirmationDialogOpen] = useState(false);
  const [editConfirmationDialogOpen, setEditConfirmationDialogOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [actionType, setActionType] = useState<'deactivate' | 'activate' | null>(null);
  const [closeConfirmationDialogOpen, setCloseConfirmationDialogOpen] = useState(false);
  const [unsavedChanges, setUnsavedChanges] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [subcategorySearchQuery, setSubcategorySearchQuery] = useState('');

  const [validationErrors, setValidationErrors] = useState({
    categoryName: '',
    subCategory: '',
  });

  // // Initial load
  // useEffect(() => {
  //   dispatch(fetchCategories());
  //   dispatch(fetchSubcategories({ page: 1, search: '' }));
  // }, [dispatch]);

  const debouncedFetch = useMemo(
    () =>
      debounce((value: string) => {
        dispatch(fetchCategories({ search: value, page: 1 }));
        dispatch(fetchSubcategories({ page: 1, search: '' }));
      }, 600),
    [dispatch]
  );

  useEffect(() => {
    debouncedFetch(searchValue);

    return () => {
      debouncedFetch.cancel();   // ✅ IMPORTANT
    };
  }, [searchValue, debouncedFetch]);

  // Debounced search for subcategories
  const debouncedSearch = useMemo(
    () =>
      debounce((query: string) => {
        setSubcategorySearchQuery(query);
        dispatch(resetPagination());
        dispatch(fetchSubcategories({ page: 1, limit: 30, search: query }));
      }, 500),
    [dispatch]
  );

  useEffect(() => {
    return () => {
      debouncedSearch.cancel();
    };
  }, [debouncedSearch]);

  const handleOpen = useCallback(() => {
    dispatch(resetCategoryData());
    dispatch(resetPagination());
    dispatch(fetchSubcategories({ page: 1, search: '' }));
    setValidationErrors({ categoryName: '', subCategory: '' });
    setSubcategorySearchQuery('');
    dispatch(setDialogOpen('add'));
    setUnsavedChanges(false);
  }, [dispatch]);

  const resetDialog = useCallback(() => {
    dispatch(setDialogOpen('none'));
    dispatch(resetCategoryData());
    setValidationErrors({ categoryName: '', subCategory: '' });
    setUnsavedChanges(false);
    setSubcategorySearchQuery('');
  }, [dispatch]);

  const handleClose = useCallback((reason: 'backdropClick' | 'escapeKeyDown') => {
    if (unsavedChanges && reason !== 'escapeKeyDown') {
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
    dispatch(setCategoryData({ ...categoryData, [name]: value }));
    setValidationErrors((prev) => ({ ...prev, [name]: '' }));
    setUnsavedChanges(true);
  }, [dispatch, categoryData]);

  const validateFields = useCallback(() => {
    const errors = { categoryName: '', subCategory: '' };
    let isValid = true;

    if (!categoryData.categoryName.trim()) {
      errors.categoryName = 'Category name is required';
      isValid = false;
    } else if (!CATEGORY_NAME_REGEX.test(categoryData.categoryName)) {
      errors.categoryName = 'Only letters, spaces, and / are allowed';
      isValid = false;
    }

    if (categoryData.subCategory.length === 0) {
      errors.subCategory = 'At least one subcategory must be selected';
      isValid = false;
    }

    setValidationErrors(errors);
    return isValid;
  }, [categoryData]);

  const handleSubmit = useCallback(async () => {
    if (!validateFields()) return;

    // O(1) duplicate check via the pre-built Map instead of an O(n) array scan.
    const existingId = categoryNameIndex.get(categoryData.categoryName.toLowerCase());
    const isDuplicate = existingId !== undefined && existingId !== categoryData.id;

    if (isDuplicate) {
      dispatch(setSnackbarMessage('Category with this name already exists.'));
      dispatch(setSnackbarOpen(true));
      return;
    }

    if (categoryData.id) {
      setEditConfirmationDialogOpen(true);
    } else {
      try {
        setIsSubmitting(true);
        await dispatch(addCategory({
          categoryName: categoryData.categoryName,
          subCategory: categoryData.subCategory,
          status: 'active',
        })).unwrap();

        dispatch(setSnackbarMessage('Category created successfully!'));
        resetDialog();
        dispatch(fetchCategories({ search: "", page: 1 }));
      } catch (error: any) {
        dispatch(setSnackbarMessage(error.message || 'Failed to create category'));
        dispatch(setSnackbarOpen(true));
      } finally {
        setIsSubmitting(false);
      }
    }
  }, [validateFields, categoryNameIndex, categoryData, dispatch, resetDialog]);

  const handleEditConfirmation = useCallback(async () => {
    try {
      setIsSubmitting(true);
      const updatedCategory = {
        ...categoryData,
        subCategory: [...categoryData.subCategory],
      };
      await dispatch(updateCategory(updatedCategory)).unwrap();

      dispatch(setSnackbarMessage('Category updated successfully!'));
      dispatch(fetchCategories({ search: "", page: 1 }));
      resetDialog();
    } catch (error: any) {
      dispatch(setSnackbarMessage(error.message || 'Failed to update category'));
      dispatch(setSnackbarOpen(true));
    } finally {
      setIsSubmitting(false);
      setEditConfirmationDialogOpen(false);
    }
  }, [categoryData, dispatch, resetDialog]);

  const handleEditConfirmationClose = useCallback(() => {
    setEditConfirmationDialogOpen(false);
  }, []);

  const handleEdit = useCallback((category: Category) => {
    dispatch(setCategoryData({
      ...category,
      subCategory: category.subCategory || [],
    }));
    dispatch(setDialogOpen('edit'));
    setUnsavedChanges(false);
    setSubcategorySearchQuery('');
    dispatch(resetPagination());
    dispatch(fetchSubcategories({ page: 1, search: '' }));
  }, [dispatch]);

  const handleDeactivate = useCallback((category: Category) => {
    setSelectedCategory(category);
    setActionType('deactivate');
    setConfirmationDialogOpen(true);
  }, []);

  const handleActivate = useCallback((category: Category) => {
    setSelectedCategory(category);
    setActionType('activate');
    setConfirmationDialogOpen(true);
  }, []);

  const handleConfirmationDialogClose = useCallback(() => {
    setConfirmationDialogOpen(false);
    setSelectedCategory(null);
    setActionType(null);
  }, []);

  const handleConfirmationDialogConfirm = useCallback(async () => {
    if (!selectedCategory || !actionType) return;

    try {
      if (actionType === 'deactivate') {
        await dispatch(deactivateCategory(selectedCategory.id)).unwrap();
      } else {
        await dispatch(activateCategory(selectedCategory.id)).unwrap();
      }
      dispatch(setSnackbarMessage(`Category ${actionType}d successfully!`));
      dispatch(fetchCategories({ search: "", page: 1 }));
    } catch (error: any) {
      dispatch(setSnackbarMessage(error.message || `Failed to ${actionType} category`));
      dispatch(setSnackbarOpen(true));
    } finally {
      handleConfirmationDialogClose();
    }
  }, [selectedCategory, actionType, dispatch, handleConfirmationDialogClose]);

  const handleSubcategoryChange = useCallback((_event: React.SyntheticEvent, newValue: string[]) => {
    dispatch(setCategoryData({
      ...categoryData,
      subCategory: newValue,
    }));
    setValidationErrors((prev) => ({ ...prev, subCategory: '' }));
    setUnsavedChanges(true);
  }, [dispatch, categoryData]);

  const handleLoadMoreSubcategories = useCallback(() => {
    if (hasMoreItems && !isFetchingItems) {
      dispatch(incrementPage());
      dispatch(fetchSubcategories({
        page: currentPage + 1,
        limit: 30,
        search: subcategorySearchQuery,
      }));
    }
  }, [hasMoreItems, isFetchingItems, dispatch, currentPage, subcategorySearchQuery]);

  const handleSubcategoryFieldOpen = useCallback(() => {
    dispatch(resetPagination());
    dispatch(fetchSubcategories({ page: 1, limit: 30, search: subcategorySearchQuery }));
  }, [dispatch, subcategorySearchQuery]);

  const handleSearchSubcategories = useCallback((query: string) => {
    debouncedSearch(query);
  }, [debouncedSearch]);

  const handleClearSearch = useCallback(() => {
    setSubcategorySearchQuery('');
    dispatch(resetPagination());
    dispatch(fetchSubcategories({ page: 1, limit: 30, search: '' }));
  }, [dispatch]);

  const handleSnackbarClose = useCallback(() => {
    dispatch(setSnackbarOpen(false));
  }, [dispatch]);

  return (
    <>
      <MasterAdminMenu />

      <CategoryTableContainer
        handleEdit={handleEdit}
        handleDeactivate={handleDeactivate}
        handleActivate={handleActivate}
        handleOpen={handleOpen}
        // showDeactivated={showDeactivated}
        // setShowDeactivated={setShowDeactivated}
        searchValue={searchValue}
        setSearchValue={setSearchValue}
      />

      <CategoryDialog
        open={dialogOpen !== 'none'}
        onClose={handleClose}
        onSubmit={handleSubmit}
        categoryData={categoryData}
        onFieldChange={handleChange}
        onSubcategoryChange={handleSubcategoryChange}
        validationErrors={validationErrors}
        mode={dialogOpen === 'edit' ? 'edit' : 'add'}
        isSubmitting={isSubmitting}
        allSubcategories={allSubcategories}
        hasMore={hasMoreItems}
        isFetching={isFetchingItems}
        onLoadMore={handleLoadMoreSubcategories}
        onSearch={handleSearchSubcategories}
        onOpen={handleSubcategoryFieldOpen}
        onClearSearch={handleClearSearch}
      />

      <ActivateDeactivateConfirmationDialog
        open={confirmationDialogOpen}
        actionType={actionType}
        itemName={selectedCategory?.categoryName}
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
        autoHideDuration={4000}
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

export default CategoryComponent;