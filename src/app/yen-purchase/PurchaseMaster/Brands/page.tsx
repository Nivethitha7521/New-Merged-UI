'use client';
import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '@/redux/store';
import {
  fetchBrands,
  updateBrand,
  addBrand,
  deactivateBrand,
  activateBrand,
  setBrandData,
  setEditIndex,
  setDialogOpen,
  setShowDeactivated,
  selectBrands,
  setSearchQuery,
  setSnackbarMessage,
  setSnackbarOpen,
  resetImportState,
  importCSV,
  exportCSV,
} from '../Brands/Features/BrandSlice';
import { Box, Snackbar, Backdrop, CircularProgress, Typography } from '@mui/material';
import BrandActions from '../Brands/Components/BrandActions';
import BrandForm from '../Brands/Components/BrandForm';
import BrandTable from '../Brands/Components/BrandTable';
import CommonImportResultDialog from '@/components/yen-purchase/CommonImportDialog';
import { Brand } from '../Brands/Models/BrandModel';
import { FormikHelpers } from 'formik';
import { usePermissions } from '@/hooks/usePermissions';

const initialBrandState: Brand = {
  mongoId: '',
  brandId: '',
  brandName: '',
  status: 'active',
};

const normalizeNameForComparison = (name: string | undefined | null): string => {
  if (!name) return '';
  return name.trim().replace(/\s+/g, '').toLowerCase();
};

const BrandPage: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const {
    items: brands,
    deactivatedItems,
    brandData,
    editIndex,
    dialogOpen,
    showDeactivated,
    searchQuery,
    importing,
    exporting,
    importSuccess,
    importResult,
    showImportResultDialog,
    snackbarOpen,
    snackbarMessage,
  } = useSelector(selectBrands);

  const { hasPermission, isModuleVisible } = usePermissions();
  
  const canAdd = hasPermission('yenerp', 'brand', 'add');
  const canEdit = hasPermission('yenerp', 'brand', 'edit');
  const canDelete = hasPermission('yenerp', 'brand', 'delete');

  // Only ONE fetch on mount and when showDeactivated changes
  useEffect(() => {
    dispatch(fetchBrands(showDeactivated));
  }, [dispatch, showDeactivated]);

  const handleDialogOpen = () => {
    if (!canAdd) {
      dispatch(setSnackbarMessage('You do not have permission to add brands'));
      dispatch(setSnackbarOpen(true));
      return;
    }
    dispatch(setDialogOpen('edit'));
  };

  const handleDialogClose = () => {
    dispatch(setDialogOpen('none'));
    dispatch(setBrandData(initialBrandState));
    dispatch(setEditIndex(null));
  };

  const handleExportCSV = () => {
    dispatch(exportCSV());
  };

  const handleSampleCSV = () => {
    const sampleHeader = 'Brand Name,Status\n';
    const sampleRows = 'Sample Brand 1,active\nSample Brand 2,active\n';
    const csvContent = `${sampleHeader}${sampleRows}`;
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sample_brands.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImportCSV = (file: File): Promise<any> => {
    return new Promise((resolve, reject) => {
      dispatch(importCSV(file))
        .unwrap()
        .then((response) => {
          resolve(response);
        })
        .catch((error) => {
          const errorMessage = error?.detail || error?.message || 'Import failed';
          reject(new Error(errorMessage));
        });
    });
  };

  const handleImportResultsClose = () => {
    dispatch(resetImportState());
  };

  const handleAddUpdateBrand = async (
    values: Brand,
    { setFieldError }: FormikHelpers<Brand>
  ): Promise<void> => {
    const normalizedName = values.brandName.trim().replace(/\s+/g, ' ');
    if (!normalizedName) {
      setFieldError('brandName', 'Brand name cannot be empty');
      return;
    }
     
    if (editIndex !== null && !canEdit) {
      dispatch(setSnackbarMessage('You do not have permission to edit brands'));
      dispatch(setSnackbarOpen(true));
      return;
    }

    const isDuplicate = [...brands, ...deactivatedItems].some(
      (brand) =>
        normalizeNameForComparison(brand.brandName) === normalizeNameForComparison(normalizedName) &&
        brand.mongoId !== values.mongoId
    );

    if (isDuplicate) {
      setFieldError('brandName', 'Brand name already exists');
      return;
    }

    const payload = { ...values, brandName: normalizedName };
    if (editIndex !== null) {
      try {
        await dispatch(updateBrand({ id: brandData.mongoId, data: payload })).unwrap();
        dispatch(setSnackbarMessage('Brand updated successfully'));
        dispatch(setSnackbarOpen(true));
        dispatch(fetchBrands(showDeactivated));
        handleDialogClose();
      } catch (error: any) {
        const message = error.message?.includes('already exists')
          ? 'Brand name already exists'
          : `Failed to update brand: ${error.message}`;
        dispatch(setSnackbarMessage(message));
        dispatch(setSnackbarOpen(true));
      }
    } else {
      try {
        await dispatch(addBrand(payload)).unwrap();
        dispatch(setSnackbarMessage('Brand added successfully'));
        dispatch(setSnackbarOpen(true));
        dispatch(fetchBrands(showDeactivated));
        handleDialogClose();
      } catch (error: any) {
        const message = error.message?.includes('already exists')
          ? 'Brand name already exists'
          : `Failed to add brand: ${error.message}`;
        dispatch(setSnackbarMessage(message));
        dispatch(setSnackbarOpen(true));
      }
    }
  };

  const handleEditBrand = (id: string) => {
    if (!canEdit) {
      dispatch(setSnackbarMessage('You do not have permission to edit brands'));
      dispatch(setSnackbarOpen(true));
      return;
    }
    
    const item = brands.find((brand) => brand.mongoId === id);
    if (item) {
      dispatch(setBrandData({
        ...item,
        brandName: item.brandName ? item.brandName.trim().replace(/\s+/g, ' ') : '',
      }));
      dispatch(setEditIndex(0));
      dispatch(setDialogOpen('edit'));
    }
  };

  const handleDeactivateBrand = (id: string) => {
    if (!canDelete) {
      dispatch(setSnackbarMessage('You do not have permission to deactivate brands'));
      dispatch(setSnackbarOpen(true));
      return;
    }
    
    dispatch(deactivateBrand(id))
      .unwrap()
      .then(() => {
        dispatch(setSnackbarMessage('Brand deactivated successfully'));
        dispatch(setSnackbarOpen(true));
        dispatch(fetchBrands(showDeactivated));
      })
      .catch((error) => {
        dispatch(setSnackbarMessage(`Failed to deactivate brand: ${error.message}`));
        dispatch(setSnackbarOpen(true));
      });
  };

  const handleActivateBrand = (id: string) => {
    if (!canDelete) {
      dispatch(setSnackbarMessage('You do not have permission to activate brands'));
      dispatch(setSnackbarOpen(true));
      return;
    }
    
    dispatch(activateBrand(id))
      .unwrap()
      .then(() => {
        dispatch(setSnackbarMessage('Brand activated successfully'));
        dispatch(setSnackbarOpen(true));
        dispatch(fetchBrands(showDeactivated));
      })
      .catch((error) => {
        dispatch(setSnackbarMessage(`Failed to activate brand: ${error.message}`));
        dispatch(setSnackbarOpen(true));
      });
  };

  const toggleShowDeactivated = () => {
    dispatch(setShowDeactivated(!showDeactivated));
  };

  const filteredItems = showDeactivated
    ? deactivatedItems
    : brands.filter((item) =>
        item.brandName
          ? normalizeNameForComparison(item.brandName).includes(normalizeNameForComparison(searchQuery || ''))
          : false
      );

  if (!isModuleVisible("yenerp", "brand")) {
    return null;
  }

  return (
    <Box>
      <BrandActions
        searchQuery={searchQuery || ''}
        onSearchChange={(e) => dispatch(setSearchQuery(e.target.value || ''))}
        onDialogOpen={handleDialogOpen}
        onSampleCSV={handleSampleCSV}
        onImportCSV={handleImportCSV}
        onExportCSV={handleExportCSV}
        showDeactivated={showDeactivated}
        onToggleShowDeactivated={toggleShowDeactivated}
        importing={importing}
        exporting={exporting}
        permissions={{ canAdd, canEdit, canDelete }}
      />
      <BrandTable
        items={filteredItems}
        loading={importing || exporting}
        handleEdit={handleEditBrand}
        handleDeactivate={handleDeactivateBrand}
        handleActivate={handleActivateBrand}
        permissions={{ canEdit, canDelete }}
      />
      <BrandForm
        open={dialogOpen !== 'none'}
        onClose={handleDialogClose}
        onSubmit={handleAddUpdateBrand}
        initialValues={brandData}
        editIndex={editIndex}
        loading={importing || exporting}
      />
      <CommonImportResultDialog
        open={showImportResultDialog}
        onClose={handleImportResultsClose}
        importResult={importResult}
        module="brand"
      />
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={() => dispatch(setSnackbarOpen(false))}
        message={String(snackbarMessage)} 
      />
      <Backdrop sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }} open={importing || exporting}>
        <Box display="flex" flexDirection="column" alignItems="center" gap={2}>
          <CircularProgress color="inherit" />
          <Typography>
            {importing ? 'Import is in progress, please wait...' : 'Export is in progress, please wait...'}
          </Typography>
        </Box>
      </Backdrop>
    </Box>
  );
};

export default BrandPage;