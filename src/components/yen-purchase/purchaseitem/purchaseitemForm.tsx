'use client';
import React, { useState, useEffect, useRef } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button,
  Grid, TextField, FormControl, InputLabel, Select, MenuItem,
  FormHelperText, Box, IconButton, Typography, Divider,
  Checkbox, FormControlLabel
} from '@mui/material';
import { Formik, Form, FormikHelpers, useFormikContext, FormikProps } from 'formik';
import * as yup from 'yup';
import AddIcon from '@mui/icons-material/Add';
import ConfirmationDialog from '../../confirmationDialog';
import AddEditDialog from '../purchasemaster/category/addEditdialog';
import PurchaseSubcategoryForm from '../purchasemaster/subcategory/purchaseSubcategoryForm';
import { addPurchaseSubcategory, fetchPurchaseSubcategories, selectPurchaseSubcategoryItems } from '@/features/yen-purchase/PurchaseMaster/PurchaseSubcategorySlice';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '@/redux/store';
import { useSelector } from '@/features/hooks';
import { setSnackbarMessage, setSnackbarOpen } from '@/features/yen-purchase/PurchaseMaster/purchaseItemSlice';
import { fetchCategories } from '@/features/yen-purchase/PurchaseMaster/PurchaseCategorySlice';

interface PurchaseItemFormProps {
  open: boolean;
  onClose: () => void;
  initialValues: any;
  validationSchema: yup.ObjectSchema<any>;
  onSubmit: (values: any) => Promise<void>;
  editIndex: number | null;
  categories: any[];
  uoms: any[];
  groupitems: any[];
  taxes: any[];
  locations: any[];
  itemtypes: any[];
  existingItems: any[];
}

interface SubcategoryItem {
  purchasesubcategoryId?: string;
  purchasesubcategoryName?: string;
  randomId?: string;
  name?: string;
  id?: string;
}

interface CategoryWithSubcategories {
  purchasecategoryId: string;
  purchasecategoryName: string;
  randomId?: string;
  subcategories: (string | SubcategoryItem)[];
}

const FormDirtyTracker: React.FC<{ setIsDirty: (dirty: boolean) => void }> = ({ setIsDirty }) => {
  const formik = useFormikContext();
  useEffect(() => {
    setIsDirty(formik.dirty);
  }, [formik.dirty, setIsDirty]);
  return null;
};

const SectionHeader: React.FC<{ title: string }> = ({ title }) => (
  <Box sx={{ mb: 2, mt: 1 }}>
    <Typography variant="subtitle1" fontWeight={600} sx={{ color: 'primary.main', mb: 0.5 }}>
      {title}
    </Typography>
    <Divider />
  </Box>
);

const PurchaseItemForm: React.FC<PurchaseItemFormProps> = ({
  open,
  onClose,
  initialValues,
  validationSchema,
  onSubmit,
  editIndex,
  categories: propCategories,
  uoms,
  groupitems,
  taxes,
  locations,
  itemtypes,
  existingItems
}) => {
  const dispatch = useDispatch<AppDispatch>();
  const { items: purchaseSubcategories } = useSelector(selectPurchaseSubcategoryItems);
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);
  const [showDuplicateDialog, setShowDuplicateDialog] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [loading, setLoading] = useState(false);
  const formRef = React.useRef<FormikProps<any>>(null);
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [subcategoryDialogOpen, setSubcategoryDialogOpen] = useState(false);
  const [isSaleType, setIsSaleType] = useState(initialValues.saleType || false);
  const existingSubcategories = purchaseSubcategories.map(item => item.purchasesubcategoryName);
  const inputRef = useRef<HTMLInputElement>(null);
  const [localCategories, setLocalCategories] = useState(propCategories);

  // Update saleType when initialValues change
  useEffect(() => {
    setIsSaleType(initialValues.saleType || false);
  }, [initialValues.saleType]);

  const allSubcategories = (localCategories as CategoryWithSubcategories[]).flatMap(category => {
    const subcategories = category.subcategories || [];
    return subcategories.map((sub: string | SubcategoryItem) => {
      if (typeof sub === 'string') {
        return {
          name: sub,
          id: '',
          randomId: '',
          categoryName: category.purchasecategoryName,
          categoryId: category.purchasecategoryId,
          categoryRandomId: category.randomId || '',
          uniqueKey: `${category.purchasecategoryId}-${sub}`
        };
      } else {
        const subName = sub.purchasesubcategoryName || sub.name || '';
        const subRandomId = sub.randomId || sub.purchasesubcategoryId || sub.id || '';
        return {
          name: subName,
          id: sub.purchasesubcategoryId || sub.id || '',
          randomId: subRandomId,
          categoryName: category.purchasecategoryName,
          categoryId: category.purchasecategoryId,
          categoryRandomId: category.randomId || '',
          uniqueKey: `${category.purchasecategoryId}-${subName}`
        };
      }
    });
  });

  const handleDialogClose = (forceClose = false) => {
    if (isDirty && !forceClose) {
      setShowCloseConfirm(true);
      return;
    }
    onClose();
    setIsDirty(false);
    setShowDuplicateDialog(false);
  };

  useEffect(() => {
    setLocalCategories(propCategories);
  }, [propCategories]);

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.key === 'F5' || (e.ctrlKey && e.key === 'r')) && isDirty) {
        e.preventDefault();
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isDirty]);

  const handleCategoryAdded = () => {
    setCategoryDialogOpen(false);
    dispatch(fetchCategories());
  };

  useEffect(() => {
    if (open) {
      const timer = setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
          const length = inputRef.current.value.length;
          inputRef.current.setSelectionRange(length, length);
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [open]);

  const handleModalClose = (event: {}, reason: 'backdropClick' | 'escapeKeyDown') => {
    if (isDirty) {
      setShowCloseConfirm(true);
    } else {
      handleDialogClose(true);
    }
  };

  const handleCloseConfirm = (shouldClose: boolean) => {
    setShowCloseConfirm(false);
    if (shouldClose) {
      handleDialogClose(true);
    }
  };

  const handleDuplicateDialogClose = () => {
    setShowDuplicateDialog(false);
  };

  const handleManualSubmit = async () => {
    if (formRef.current) {
      const formik = formRef.current;
      const errors = await formik.validateForm();

      formik.setTouched({
        itemName: true,
        purchasesubcategoryName: true,
        purchasecategoryName: true,
        itemgroupName: true,
        itemType: true,
        supplier: true,
        uom: true,
        purchasePrice: true,
        taxPercentage: true,
        stockQuantity: !isSaleType,
        reorderLevel: !isSaleType,
        sellingPrice: isSaleType,
        hsnCode: true,
        locationName: true,
        shelfLife: true,
        barcode: true,
        description: true,
      });

      if (Object.keys(errors).length > 0) {
        dispatch(setSnackbarMessage('Please fill all required fields'));
        dispatch(setSnackbarOpen(true));
        return;
      }

      formik.submitForm();
    }
  };

  const handleFormSubmit = async (values: any, actions: FormikHelpers<any>) => {
    try {
      setLoading(true);

      let selectedSubcategoryId = values.purchasesubcategoryId || '';
      let selectedSubcategoryName = values.purchasesubcategoryName || '';

      if (!selectedSubcategoryId && selectedSubcategoryName) {
        const foundSub = allSubcategories.find(sub => sub.name === selectedSubcategoryName);
        if (foundSub) {
          selectedSubcategoryId = foundSub.randomId || foundSub.id || '';
        }
      }

      const selectedItemType = itemtypes.find((type: any) => type.itemtypeName === values.itemType);
      const selectedUOM = uoms.find((uomItem: any) => uomItem.uom === values.uom);
      const selectedTax = taxes.find((taxItem: any) => taxItem.taxPercentage === values.taxPercentage);
      const selectedCategory = localCategories.find((cat: any) => cat.purchasecategoryName === values.purchasecategoryName);
      const selectedItemGroup = groupitems.find((group: any) => group.itemgroupName === values.itemgroupName);
      const selectedLocation = locations.find((loc: any) => loc.locationName === values.locationName);

      const normalizedValues: any = {
        itemName: values.itemName.trim(),
        purchasesubcategoryId: selectedSubcategoryId,
        purchasecategoryId: selectedCategory?.randomId || selectedCategory?.purchasecategoryId || '',
        itemgroupId: selectedItemGroup?.randomId || selectedItemGroup?.itemgroupId || '',
        uomId: selectedUOM?.uomId || '',
        taxId: selectedTax?.taxId || '',
        itemTypeId: selectedItemType?.randomId || selectedItemType?.itemtypeId || '',
        locationId: selectedLocation?.randomId || selectedLocation?.locationId || '',
        purchasePrice: Number(values.purchasePrice),
        sellingPrice: isSaleType ? Number(values.sellingPrice) : 0,
        saleType: isSaleType,
        stockQuantity: isSaleType ? 0 : Number(values.stockQuantity),
        reorderLevel: isSaleType ? 0 : Number(values.reorderLevel),
        supplier: values.supplier || '',
        hsnCode: values.hsnCode || '',
        shelfLife: values.shelfLife || '',
        barcode: values.barcode || '',
        description: values.description || '',
        vendorTag: values.vendorTag || [],
        purchasesubcategoryName: selectedSubcategoryName,
        purchasecategoryName: values.purchasecategoryName,
        itemgroupName: values.itemgroupName,
        uom: values.uom,
        taxPercentage: values.taxPercentage,
        itemType: values.itemType,
        locationName: values.locationName,
      };

      if (editIndex !== null) {
        normalizedValues.purchaseitemId = values.purchaseitemId;
      }

      await onSubmit(normalizedValues);
      handleDialogClose(true);
    } catch (error) {
      console.error('Error in form submission:', error);
    } finally {
      setLoading(false);
      actions.setSubmitting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleModalClose}
      maxWidth="md"
      fullWidth
      disableEscapeKeyDown={isDirty}
      PaperProps={{
        sx: {
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '90vh',
          overflow: 'hidden',
        }
      }}
    >
      <DialogTitle>
        {editIndex !== null ? 'Edit Purchase Item' : 'Add Purchase Item'}
      </DialogTitle>

      <Formik
        innerRef={formRef}
        initialValues={initialValues}
        validationSchema={validationSchema}
        onSubmit={handleFormSubmit}
        enableReinitialize
      >
        {({ values, handleChange, setFieldValue, errors, touched }) => (
          <Form style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, overflow: 'hidden' }}>
            <FormDirtyTracker setIsDirty={setIsDirty} />
            <DialogContent
              dividers
              sx={{
                flex: 1,
                overflowY: 'auto',
                minHeight: 0,
              }}
            >
              {/* SECTION 1: Basic Information */}
              <Box sx={{ display: 'flex',mb: 1, mt: 1 }}>
                <SectionHeader title="Basic Information" />
                {/* Sale Type Checkbox - Next to Basic Information header */}
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={isSaleType}
                      onChange={(e) => {
                        const newValue = e.target.checked;
                        setIsSaleType(newValue);
                        setFieldValue('saleType', newValue);
                        if (newValue) {
                          setFieldValue('stockQuantity', 0);
                          setFieldValue('reorderLevel', 0);
                        } else {
                          setFieldValue('sellingPrice', 0);
                        }
                      }}
                      size="small"
                    />
                  }
                  label="Sale Type"
                  sx={{ ml: 1,mb:2 }}
                />
              </Box>
              <Grid container spacing={1.5} sx={{ mb: 2 }}>

                {/* Item Name */}
                <Grid item xs={12} sm={6} md={3}>
                  <TextField
                    inputRef={inputRef}
                    fullWidth
                    autoComplete="off"
                    label="Item Name*"
                    name="itemName"
                    size="small"
                    value={values.itemName}
                    onChange={handleChange}
                    onBlur={() => {
                      if (values.itemName) {
                        const normalizedInputName = values.itemName.trim().toLowerCase().replace(/\s+/g, '');
                        const existingItem = existingItems.find(
                          item =>
                            item.itemName.trim().toLowerCase().replace(/\s+/g, '') === normalizedInputName &&
                            item.purchaseitemId !== values.purchaseitemId
                        );
                        if (existingItem) {
                          formRef.current?.setFieldError('itemName', 'Item with this name already exists');
                          setShowDuplicateDialog(true);
                        }
                      }
                    }}
                    error={touched.itemName && Boolean(errors.itemName)}
                    helperText={touched.itemName && errors.itemName ? String(errors.itemName) : ''}
                    required
                  />
                </Grid>

                {/* Purchase Subcategory */}
                <Grid item xs={12} sm={6} md={3}>
                  <Box sx={{
                    display: 'inline-flex',
                    width: '100%',
                    border: '1px solid rgba(0,0,0,0.23)',
                    borderRadius: 1,
                    backgroundColor: 'white',
                    '&:hover': { borderColor: 'black' },
                    '&:focus-within': { borderColor: '#1976d2', borderWidth: 2 }
                  }}>
                    <FormControl
                      fullWidth
                      size="small"
                      error={touched.purchasesubcategoryName && Boolean(errors.purchasesubcategoryName)}
                      sx={{
                        '& .MuiOutlinedInput-root': { border: 'none', '& fieldset': { border: 'none' } },
                        '& .MuiInputLabel-root': {
                          backgroundColor: 'white', px: 0.5,
                          transform: values.purchasesubcategoryName ? 'translate(14px, -9px) scale(0.75)' : 'translate(14px, 12px) scale(1)',
                        },
                        '& .MuiInputLabel-shrink': { transform: 'translate(14px, -9px) scale(0.75)' }
                      }}
                    >
                      <InputLabel>Subcategory*</InputLabel>
                      <Select
                        label="Subcategory*"
                        name="purchasesubcategoryName"
                        value={values.purchasesubcategoryName || ''}
                        onChange={(event) => {
                          const selectedSubcategoryName = event.target.value as string;
                          const selectedSub = allSubcategories.find(sub => sub.name === selectedSubcategoryName);
                          if (selectedSub && selectedSub.randomId) {
                            setFieldValue('purchasesubcategoryName', selectedSubcategoryName);
                            setFieldValue('purchasesubcategoryId', selectedSub.randomId);
                            if (selectedSub.categoryName) {
                              setFieldValue('purchasecategoryName', selectedSub.categoryName);
                              setFieldValue('purchasecategoryId', selectedSub.categoryRandomId || '');
                            }
                          } else {
                            setFieldValue('purchasesubcategoryName', '');
                            setFieldValue('purchasesubcategoryId', '');
                          }
                        }}
                        required
                      >
                        {allSubcategories.length > 0 ? (
                          allSubcategories.map((subcategory, idx) => (
                            <MenuItem key={subcategory.uniqueKey || `sub-${idx}`} value={subcategory.name}>
                              {subcategory.name}
                            </MenuItem>
                          ))
                        ) : (
                          <MenuItem key="no-subcategories" disabled>No subcategories available</MenuItem>
                        )}
                      </Select>
                    </FormControl>
                    <IconButton
                      onClick={() => setSubcategoryDialogOpen(true)}
                      size="small"
                      sx={{ height: 'auto', width: 40, borderRadius: 0, borderLeft: '1px solid rgba(0,0,0,0.23)', flexShrink: 0 }}
                    >
                      <AddIcon fontSize="small" color="primary" />
                    </IconButton>
                  </Box>
                  <FormHelperText error>
                    {touched.purchasesubcategoryName && errors.purchasesubcategoryName ? String(errors.purchasesubcategoryName) : ''}
                  </FormHelperText>
                </Grid>

                {/* Purchase Category */}
                <Grid item xs={12} sm={6} md={3}>
                  <Box sx={{
                    display: 'inline-flex',
                    width: '100%',
                    border: '1px solid rgba(0,0,0,0.23)',
                    borderRadius: 1,
                    backgroundColor: 'white',
                    '&:hover': { borderColor: 'black' },
                    '&:focus-within': { borderColor: '#1976d2', borderWidth: 2 }
                  }}>
                    <FormControl
                      fullWidth
                      size="small"
                      error={touched.purchasecategoryName && Boolean(errors.purchasecategoryName)}
                      sx={{
                        '& .MuiOutlinedInput-root': { border: 'none', '& fieldset': { border: 'none' } },
                        '& .MuiInputLabel-root': {
                          backgroundColor: 'white', px: 0.5,
                          transform: values.purchasecategoryName ? 'translate(14px, -9px) scale(0.75)' : 'translate(14px, 12px) scale(1)',
                        },
                        '& .MuiInputLabel-shrink': { transform: 'translate(14px, -9px) scale(0.75)' }
                      }}
                    >
                      <InputLabel>Category*</InputLabel>
                      <Select
                        label="Category*"
                        name="purchasecategoryName"
                        value={values.purchasecategoryName}
                        onChange={(event) => {
                          const selectedCategory = event.target.value as string;
                          setFieldValue('purchasecategoryName', selectedCategory);
                          setFieldValue('purchasesubcategoryName', '');
                          setFieldValue('purchasesubcategoryId', '');
                          const selectedCategoryObj = localCategories.find((cat: any) => cat.purchasecategoryName === selectedCategory);
                          if (selectedCategoryObj) {
                            setFieldValue('purchasecategoryId', selectedCategoryObj.randomId || selectedCategoryObj.purchasecategoryId || '');
                          }
                        }}
                        required
                        sx={{ '& .MuiOutlinedInput-notchedOutline': { border: 'none' }, '& .MuiSelect-select': { py: 1.5 } }}
                      >
                        {localCategories.length > 0 ? (
                          localCategories.map((category, idx) => (
                            <MenuItem key={category.purchasecategoryId || `cat-${idx}`} value={category.purchasecategoryName}>
                              {category.purchasecategoryName}
                            </MenuItem>
                          ))
                        ) : (
                          <MenuItem key="no-categories" disabled>No categories available</MenuItem>
                        )}
                      </Select>
                    </FormControl>
                    <IconButton
                      onClick={() => setCategoryDialogOpen(true)}
                      size="small"
                      sx={{ height: 'auto', width: 40, borderRadius: 0, borderLeft: '1px solid rgba(0,0,0,0.23)', flexShrink: 0 }}
                    >
                      <AddIcon fontSize="small" color="primary" />
                    </IconButton>
                  </Box>
                  <FormHelperText error>
                    {touched.purchasecategoryName && errors.purchasecategoryName ? String(errors.purchasecategoryName) : ''}
                  </FormHelperText>
                </Grid>

                {/* Item Group */}
                <Grid item xs={12} sm={6} md={3}>
                  <FormControl fullWidth size="small" error={touched.itemgroupName && Boolean(errors.itemgroupName)}>
                    <InputLabel>Item Group*</InputLabel>
                    <Select label="Item Group*" name="itemgroupName" value={values.itemgroupName} onChange={handleChange} required>
                      {groupitems.length > 0 ? (
                        groupitems.map((groupitem, index) => (
                          <MenuItem key={groupitem.itemgroupId || `group-${index}`} value={groupitem.itemgroupName}>
                            {groupitem.itemgroupName}
                          </MenuItem>
                        ))
                      ) : (
                        <MenuItem key="no-groups" disabled>No item groups available</MenuItem>
                      )}
                    </Select>
                    <FormHelperText>{touched.itemgroupName && errors.itemgroupName ? String(errors.itemgroupName) : ''}</FormHelperText>
                  </FormControl>
                </Grid>

                {/* Item Type */}
                <Grid item xs={12} sm={6} md={3}>
                  <FormControl fullWidth size="small" error={touched.itemType && Boolean(errors.itemType)}>
                    <InputLabel>Item Type*</InputLabel>
                    <Select
                      label="Item Type*"
                      name="itemType"
                      value={values.itemType || ''}
                      onChange={(event) => {
                        const selectedTypeName = event.target.value;
                        const selectedType = itemtypes.find((type: any) => type.itemtypeName === selectedTypeName);
                        setFieldValue('itemType', selectedTypeName);
                        if (selectedType) setFieldValue('itemTypeId', selectedType.randomId);
                      }}
                      required
                    >
                      {itemtypes.length > 0 ? (
                        itemtypes.map((type: any) => (
                          <MenuItem key={type.randomId || type.itemtypeId} value={type.itemtypeName}>{type.itemtypeName}</MenuItem>
                        ))
                      ) : (
                        <MenuItem key="no-types" disabled>No item types available</MenuItem>
                      )}
                    </Select>
                    <FormHelperText>{touched.itemType && errors.itemType ? String(errors.itemType) : ''}</FormHelperText>
                  </FormControl>
                </Grid>

                {/* Supplier */}
                <Grid item xs={12} sm={6} md={3}>
                  <TextField
                    fullWidth size="small" label="Supplier*" name="supplier" autoComplete='off'
                    value={values.supplier} onChange={handleChange}
                    error={touched.supplier && Boolean(errors.supplier)}
                    helperText={touched.supplier && errors.supplier ? String(errors.supplier) : ''}
                    required
                  />
                </Grid>

              </Grid>

              {/* SECTION 2: Pricing & Inventory */}
              <SectionHeader title="Pricing & Inventory" />
              <Grid container spacing={1.5} sx={{ mb: 2 }}>

                {/* UOM */}
                <Grid item xs={12} sm={6} md={3}>
                  <FormControl fullWidth size="small" error={touched.uom && Boolean(errors.uom)}>
                    <InputLabel>UOM*</InputLabel>
                    <Select label="UOM*" name="uom" value={values.uom || ''} onChange={handleChange} required>
                      {uoms.length > 0 ? (
                        uoms.map((uomItem: any) => (
                          <MenuItem key={uomItem.uomId || uomItem.uom} value={uomItem.uom}>{uomItem.uom}</MenuItem>
                        ))
                      ) : (
                        <MenuItem key="no-uoms" disabled>No UOMs available</MenuItem>
                      )}
                    </Select>
                    <FormHelperText>{touched.uom && errors.uom ? String(errors.uom) : ''}</FormHelperText>
                  </FormControl>
                </Grid>

                {/* Purchase Price */}
                <Grid item xs={12} sm={6} md={isSaleType ? 2 : 2}>
                  <TextField
                    fullWidth size="small" label="Purchase Price*" name="purchasePrice"
                    value={values.purchasePrice} onChange={handleChange}
                    error={touched.purchasePrice && Boolean(errors.purchasePrice)}
                    helperText={touched.purchasePrice && errors.purchasePrice ? String(errors.purchasePrice) : ''}
                    type="number" InputProps={{ inputProps: { step: '1' } }} required
                  />
                </Grid>

                {/* Selling Price - shown only when Sale Type is true */}
                {isSaleType && (
                  <Grid item xs={12} sm={6} md={2}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Selling Price*"
                      name="sellingPrice"
                      value={values.sellingPrice ?? ''}
                      onChange={handleChange}
                      error={touched.sellingPrice && Boolean(errors.sellingPrice)}
                      helperText={touched.sellingPrice && errors.sellingPrice ? String(errors.sellingPrice) : ''}
                      type="number"
                      InputProps={{ inputProps: { step: '0.01', min: 0 } }}
                      required
                    />
                  </Grid>
                )}

                {/* Tax Percentage */}
                <Grid item xs={12} sm={6} md={isSaleType ? 2 : 2}>
                  <FormControl fullWidth size="small" error={touched.taxPercentage && Boolean(errors.taxPercentage)}>
                    <InputLabel>Tax Percentage*</InputLabel>
                    <Select
                      label="Tax Percentage*"
                      name="taxPercentage"
                      value={values.taxPercentage ?? ''}
                      onChange={(event) => {
                        const numValue = Number(event.target.value);
                        setFieldValue('taxPercentage', numValue);
                        const selectedTax = taxes.find(tax => tax.taxPercentage === numValue);
                        if (selectedTax) setFieldValue('taxId', selectedTax.taxId);
                      }}
                      required
                    >
                      {taxes && taxes.length > 0 ? (
                        taxes.map(tax => (
                          <MenuItem key={tax.taxId || tax.taxPercentage} value={tax.taxPercentage}>
                            {`${tax.taxName || `GST ${tax.taxPercentage}%`} - ${tax.taxPercentage}%`}
                          </MenuItem>
                        ))
                      ) : (
                        <MenuItem key="no-taxes" disabled>No taxes available</MenuItem>
                      )}
                    </Select>
                    <FormHelperText>{touched.taxPercentage && errors.taxPercentage ? String(errors.taxPercentage) : ''}</FormHelperText>
                  </FormControl>
                </Grid>

                {/* Reorder Level */}
                <Grid item xs={12} sm={6} md={2}>
                  <TextField
                    fullWidth size="small" label="Reorder Level*" name="reorderLevel"
                    value={values.reorderLevel} onChange={handleChange}
                    error={touched.reorderLevel && Boolean(errors.reorderLevel)}
                    helperText={touched.reorderLevel && errors.reorderLevel ? String(errors.reorderLevel) : ''}
                    type="number" inputProps={{ min: 0 }} required
                  />
                </Grid>
              </Grid>

              {/* SECTION 3: Additional Details */}
              <SectionHeader title="Additional Details" />
              <Grid container spacing={1.5}>

                {/* HSN Code */}
                <Grid item xs={12} sm={6} md={2}>
                  <TextField
                    fullWidth size="small" label="HSN Code*" name="hsnCode"
                    value={values.hsnCode} onChange={handleChange}
                    error={touched.hsnCode && Boolean(errors.hsnCode)}
                    helperText={touched.hsnCode && errors.hsnCode ? String(errors.hsnCode) : ''}
                    required
                  />
                </Grid>

                {/* Storage Location */}
                <Grid item xs={12} sm={6} md={3}>
                  <FormControl fullWidth size="small" error={touched.locationName && Boolean(errors.locationName)}>
                    <InputLabel>Storage Location*</InputLabel>
                    <Select label="Storage Location*" name="locationName" value={values.locationName || ''} onChange={handleChange} required>
                      {locations.length > 0 ? (
                        locations.map(location => (
                          <MenuItem key={location.locationId || location.randomId} value={location.locationName}>{location.locationName}</MenuItem>
                        ))
                      ) : (
                        <MenuItem key="no-locations" disabled>No locations available</MenuItem>
                      )}
                    </Select>
                    <FormHelperText>{touched.locationName && errors.locationName ? String(errors.locationName) : ''}</FormHelperText>
                  </FormControl>
                </Grid>

                {/* Shelf Life */}
                <Grid item xs={12} sm={6} md={2}>
                  <TextField
                    fullWidth size="small" label="Shelf Life*" name="shelfLife" autoComplete='off'
                    value={values.shelfLife} onChange={handleChange}
                    error={touched.shelfLife && Boolean(errors.shelfLife)}
                    helperText={touched.shelfLife && errors.shelfLife ? String(errors.shelfLife) : ''}
                    required
                  />
                </Grid>

                {/* Barcode */}
                <Grid item xs={12} sm={6} md={2}>
                  <TextField
                    disabled
                    fullWidth
                    size="small"
                    label="Barcode*"
                    name="barcode"
                    autoComplete='off'
                    value={values.barcode}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '');
                      setFieldValue('barcode', value);
                    }}
                    type="text"
                  />
                </Grid>

                {/* Description */}
                <Grid item xs={12}>
                  <TextField
                    fullWidth size="small" label="Description*" name="description" autoComplete='off'
                    value={values.description} onChange={handleChange}
                    error={touched.description && Boolean(errors.description)}
                    helperText={touched.description && errors.description ? String(errors.description) : ''}
                    rows={1}
                  />
                </Grid>
              </Grid>

            </DialogContent>

            <DialogActions>
              <Button onClick={() => handleDialogClose(false)} color="primary">
                Cancel
              </Button>
              <Button
                type="button"
                variant="contained"
                color="primary"
                disabled={loading}
                onClick={handleManualSubmit}
              >
                {loading ? 'Processing...' : editIndex !== null ? 'Update' : 'Add'}
              </Button>
            </DialogActions>
          </Form>
        )}
      </Formik>

      <ConfirmationDialog
        open={showCloseConfirm}
        title="Unsaved Changes"
        description="You have unsaved changes. Are you sure you want to leave?"
        onClose={() => handleCloseConfirm(false)}
        onConfirm={() => handleCloseConfirm(true)}
        confirmText="Confirm"
        cancelText="Cancel"
      />

      <ConfirmationDialog
        open={showDuplicateDialog}
        title="Duplicate Item Name"
        description="An item with this name already exists. Please choose a different name."
        onClose={handleDuplicateDialogClose}
        onConfirm={handleDuplicateDialogClose}
        confirmText="OK"
        cancelText=""
      />

      <AddEditDialog
        open={categoryDialogOpen}
        onClose={() => setCategoryDialogOpen(false)}
        onCategoryAdded={handleCategoryAdded}
      />

      <PurchaseSubcategoryForm
        open={subcategoryDialogOpen}
        onClose={() => setSubcategoryDialogOpen(false)}
        onSubmit={async (newSubcategory) => {
          try {
            await dispatch(addPurchaseSubcategory(newSubcategory));
            await dispatch(fetchCategories());
            if (formRef.current) {
              formRef.current.setFieldValue('purchasesubcategoryName', newSubcategory.purchasesubcategoryName);
            }
          } catch (error) {
            // Handle error
          }
        }}
        initialValues={{
          purchasesubcategoryName: '',
          purchasesubcategoryId: '',
          status: 'active',
          randomId: ''
        }}
        editIndex={null}
        loading={false}
        existingSubcategories={existingSubcategories}
      />
    </Dialog>
  );
};

export default PurchaseItemForm;