'use client';
import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box,
  Typography,
  Snackbar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  Alert,
} from '@mui/material';
import { AppDispatch, RootState } from '../../../redux/store';
import {
  fetchPurchaseItems,
  addPurchaseItem,
  updatePurchaseItem,
  deactivatePurchaseItem,
  activatePurchaseItem,
  selectPurchaseItems,
  fetchPurchaseGroupItems,
  fetchAllVendors,
  fetchStorageLocationItems,
  fetchUom,
  fetchTax,
  fetchPurchaseItemtype,
  setActivateDialogOpen,
  setDeactivateDialogOpen,
  setDialogOpen,
  setEditIndex,
  setItemData,
  setItemToActivate,
  setItemToDeactivate,
  setShowDeactivated,
  setSnackbarMessage,
  setSnackbarOpen,
  selectCurrentPage,
  selectPageSize,
  selectTotalItems,
  setPagination,
  setFilters,
  clearFilters,
  exportPurchaseItemsToCSV,
  importPurchaseItems,
  exportPurchaseItems,
} from '../../../features/yen-purchase/PurchaseMaster/purchaseItemSlice';
import { fetchCategoriesItem } from '../../../features/yen-purchase/PurchaseMaster/PurchaseCategorySlice';
import * as yup from 'yup';
import YenPurchasePage from '../page';
import PurchasePagination from '../../../components/yen-purchase/purchaseitem/purchaseItempagination';
import PurchaseTable from '../../../components/yen-purchase/purchaseitem/purchaseitemTable';
import PurchaseItemForm from '../../../components/yen-purchase/purchaseitem/purchaseitemForm';
import { exportCsv } from '@/utilities/csvUtils';
import ImportErrorDialog from '../../../components/yen-purchase/purchaseitem/importErrorDialog';
import PurchaseControls from '@/components/yen-purchase/purchaseitem/purchaseitemControlers';
import { ImportResponse, PurchaseItem } from '@/Models/purchaseitem';
import { usePermissions } from '@/hooks/usePermissions';

const validationSchema = yup.object({
  itemName: yup.string().required('Item Name is required'),
  purchasecategoryName: yup.string().required('Category is required'),
  itemgroupName: yup.string().required('Item Group is required'),
  purchasePrice: yup
    .number()
    .typeError('Purchase price must be a number')
    .required('Purchase price is required')
    .moreThan(0, 'Purchase price must be greater than 0'),
  uom: yup.string().required('UOM is required'),
  taxPercentage: yup.number().typeError('Tax is required').required('Tax is required'),
  purchasesubcategoryName: yup.string().required('Subcategory is required'),
  sellingPrice: yup.number().when('saleType', {
    is: true,
    then: (schema) => schema.required('Selling price is required when Sale Type is true').min(0, 'Selling price must be greater than or equal to 0'),
    otherwise: (schema) => schema.notRequired().nullable()
  }),
});
const initialPurchaseState: PurchaseItem = {
  purchaseitemId: '',
  itemName: '',
  randomId: '',
  purchasecategoryId: '',
  purchasesubcategoryId: '',
  itemgroupId: '',
  uomId: '',
  taxId: '',
  itemTypeId: '',
  locationId: '',
  stockQuantity: 0,
  supplier: '',
  purchasePrice: 0,
  sellingPrice: 0,
  saleType: false,
  reorderLevel: 0,
  hsnCode: '',
  shelfLife: '',
  vendorTag: [],
  barcode: 0,
  description: '',
  status: '',
  createdDate: null,
  lastUpdatedDate: null,
  purchasecategoryName: '',
  purchasesubcategoryName: '',
  itemgroupName: '',
  uom: '',
  taxPercentage: 0,
  taxName: '',
  itemType: '',
  locationName: '',
};

const PurchasePage: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { hasPermission, isModuleVisible } = usePermissions();
  const [permissionLoading, setPermissionLoading] = useState(true);
  const [subcategoriesList, setSubcategoriesList] = useState<any[]>([]);
  const [permissionState, setPermissionState] = useState({
    canAdd: false,
    canEdit: false,
    canDelete: false,
    moduleVisible: false
  });

  useEffect(() => {
    const moduleVisible = isModuleVisible('yenerp', 'purchaseitem');
    const canAdd = hasPermission('yenerp', 'purchaseitem', 'add');
    const canEdit = hasPermission('yenerp', 'purchaseitem', 'edit');
    const canDelete = hasPermission('yenerp', 'purchaseitem', 'delete');

    console.log('🎯 Purchase Item Action Permissions:', { canAdd, canEdit, canDelete });
    console.log('👁️ Module Visible:', moduleVisible);

    setPermissionState({
      canAdd,
      canEdit,
      canDelete,
      moduleVisible
    });
    setPermissionLoading(false);
  }, []);

  const { canAdd, canEdit, canDelete, moduleVisible } = permissionState;

  const purchaseItemsState = useSelector(selectPurchaseItems);

  const {
    items,
    deactivatedItems,
    showDeactivated,
    snackbarMessage,
    snackbarOpen,
    loading,
    categories,
    uoms,
    groupitems,
    taxes,
    locations,
    vendors,
    itemtypes,
    itemToActivate,
    itemToDeactivate,
    dialogOpen,
    deactivateDialogOpen,
    activateDialogOpen,
    editIndex,
    filters,
  } = purchaseItemsState;

  const currentPage = useSelector(selectCurrentPage);
  const pageSize = useSelector(selectPageSize);
  const totalItems = useSelector(selectTotalItems);
  const newPage = useSelector(selectCurrentPage);

  const [importResults, setImportResults] = useState<{
    successful: Array<{ row: number; data: Record<string, string> }>;
    updated: Array<{ row: number; data: Record<string, string>; error?: string }>;
    failed: Array<{ row: number; data: Record<string, string>; error: string; missingFields: string[] }>;
  }>({
    successful: [],
    updated: [],
    failed: [],
  });

  const [itemName, setItemName] = useState('');
  const [category, setCategory] = useState('');
  const [subcategory, setSubcategory] = useState('');
  const [errorDialogOpen, setErrorDialogOpen] = useState(false);
  const [exportStatus, setExportStatus] = useState<'idle' | 'loading' | 'succeeded' | 'failed'>('idle');

  useEffect(() => {
    const allSubcategories: any[] = [];

    if (categories && Array.isArray(categories) && categories.length > 0) {
      categories.forEach((category: any) => {
        const subcategories = category.subcategories;

        if (subcategories && Array.isArray(subcategories) && subcategories.length > 0) {
          subcategories.forEach((sub: any) => {
            allSubcategories.push({
              id: sub.randomId,
              name: sub.purchasesubcategoryName,
              randomId: sub.randomId,
              purchasesubcategoryId: sub.randomId,
              purchasesubcategoryName: sub.purchasesubcategoryName,
              categoryId: category.purchasecategoryId,
              categoryName: category.purchasecategoryName
            });
          });
        }
      });
    }

    setSubcategoriesList(allSubcategories);
    console.log('✅ Subcategories with IDs:', allSubcategories);
  }, [categories]);

  useEffect(() => {
    if (!moduleVisible) return;

    dispatch(fetchPurchaseGroupItems());
    dispatch(fetchStorageLocationItems());
    dispatch(fetchUom());
    dispatch(fetchTax());
    dispatch(fetchCategoriesItem());
    dispatch(fetchPurchaseItemtype());
    dispatch(fetchAllVendors());
  }, [dispatch, moduleVisible]);

  useEffect(() => {
    if (!moduleVisible) return;

    dispatch(
      fetchPurchaseItems({
        page: currentPage,
        size: pageSize,
        showDeactivated: showDeactivated,
        ...filters,
      })
    );
  }, [dispatch, currentPage, pageSize, showDeactivated, moduleVisible]);

  useEffect(() => {
    console.log('🔍 Categories loaded:', categories);
    categories.forEach(cat => {
      console.log(`📂 Category: ${cat.purchasecategoryName}`);
      console.log(`   Subcategories:`, cat.subcategories);
    });
    
    console.log('🔍 Subcategories List built:', subcategoriesList);
  }, [categories, subcategoriesList]);

  useEffect(() => {
    if (filters.itemName !== itemName) {
      setItemName(filters.itemName || '');
    }
    if (filters.purchasecategoryName !== category) {
      setCategory(filters.purchasecategoryName || '');
    }
    if (filters.purchasesubcategoryName !== subcategory) {
      setSubcategory(filters.purchasesubcategoryName || '');
    }
  }, [filters]);

  const handleFilter = () => {
    const newFilters = {
      itemName,
      purchasecategoryName: category,
      purchasesubcategoryName: subcategory,
    };
    dispatch(setFilters(newFilters));
    dispatch(setPagination({ page: 1, size: pageSize }));
    dispatch(
      fetchPurchaseItems({
        page: 1,
        size: pageSize,
        ...newFilters,
      })
    );
  };

  const handleClearFilters = () => {
    setItemName('');
    setCategory('');
    setSubcategory('');
    dispatch(clearFilters());
    dispatch(setPagination({ page: 1, size: pageSize }));
    dispatch(
      fetchPurchaseItems({
        page: 1,
        size: pageSize,
        showDeactivated: showDeactivated,
      })
    );
  };

  const handlePageChange = (newPageVal: number) => {
    const maxPage = Math.ceil(totalItems / pageSize);
    if (newPageVal < 1 || newPageVal > maxPage) return;

    const currentFilters = {
      ...(filters.itemName && { itemName: filters.itemName }),
      ...(filters.purchasecategoryName && { purchasecategoryName: filters.purchasecategoryName }),
      ...(filters.purchasesubcategoryName && { purchasesubcategoryName: filters.purchasesubcategoryName }),
    };

    dispatch(setPagination({ page: newPageVal, size: pageSize }));
    dispatch(
      fetchPurchaseItems({
        page: newPageVal,
        size: pageSize,
        ...currentFilters,
      })
    );
  };

  const handleDialogOpen = () => dispatch(setDialogOpen('edit'));
  const handleDialogClose = () => {
    dispatch(setDialogOpen('none'));
    dispatch(setItemData(initialPurchaseState));
    dispatch(setEditIndex(null));
  };

  const handleEdit = (index: number) => {
    if (canEdit) {
      dispatch(setEditIndex(index));
      const itemToEdit = items[index] as PurchaseItem;

      const uomDisplay = uoms.find((u: any) => u.uomId === itemToEdit.uomId);
      const taxDisplay = taxes.find((t: any) => t.taxId === itemToEdit.taxId);
      const itemTypeDisplay = itemtypes.find((t: any) => t.randomId === itemToEdit.itemTypeId || t.itemtypeId === itemToEdit.itemTypeId);
      const categoryDisplay = categories.find((c: any) => c.purchasecategoryId === itemToEdit.purchasecategoryId || c.randomId === itemToEdit.purchasecategoryId);
      const itemGroupDisplay = groupitems.find((g: any) => g.itemgroupId === itemToEdit.itemgroupId);
      const locationDisplay = locations.find((l: any) => l.locationId === itemToEdit.locationId);
      
      let subcategoryDisplay = '';
      let subcategoryId = itemToEdit.purchasesubcategoryId || '';
      
      for (const category of categories) {
        const subcategories = category.subcategories || [];
        const foundSub = subcategories.find((sub: any) => 
          sub.randomId === subcategoryId || 
          sub.purchasesubcategoryId === subcategoryId ||
          sub.id === subcategoryId
        );
        if (foundSub) {
          subcategoryDisplay = foundSub.purchasesubcategoryName;
          break;
        }
      }

      const editValues = {
        ...itemToEdit,
        uom: uomDisplay?.uom || '',
        taxPercentage: taxDisplay?.taxPercentage || '',
        itemType: itemTypeDisplay?.itemtypeName || '',
        purchasecategoryName: categoryDisplay?.purchasecategoryName || '',
        itemgroupName: itemGroupDisplay?.itemgroupName || '',
        locationName: locationDisplay?.locationName || '',
        purchasesubcategoryName: subcategoryDisplay,
        purchasesubcategoryId: subcategoryId,
        saleType: itemToEdit.saleType || false,
        sellingPrice: itemToEdit.sellingPrice || 0,
      };

      dispatch(setItemData(editValues as PurchaseItem));
      handleDialogOpen();
    }
  };

  const handleDeactivateClick = (item: PurchaseItem) => {
    if (canDelete) {
      dispatch(setItemToDeactivate(item));
      dispatch(setDeactivateDialogOpen(true));
    }
  };

  const handleActivateClick = (item: PurchaseItem) => {
    if (canDelete) {
      dispatch(setItemToActivate(item));
      dispatch(setActivateDialogOpen(true));
    }
  };

  const handleConfirmDeactivate = async () => {
    try {
      if (itemToDeactivate) {
        console.log('🔴 Starting deactivation process...');
        await dispatch(deactivatePurchaseItem(itemToDeactivate.purchaseitemId)).unwrap();

        dispatch(setSnackbarMessage('Purchase item deactivated successfully'));
        dispatch(setSnackbarOpen(true));
        dispatch(setDeactivateDialogOpen(false));

        dispatch(fetchPurchaseItems({ page: currentPage, size: pageSize }));
      }
    } catch (error: any) {
      console.error('❌ Deactivation error:', error);
      dispatch(setSnackbarMessage(`Failed to deactivate purchase item: ${error.message}`));
      dispatch(setSnackbarOpen(true));
    }
  };

  const handleConfirmActivate = async () => {
    try {
      if (itemToActivate) {
        await dispatch(activatePurchaseItem(itemToActivate.purchaseitemId)).unwrap();
        dispatch(setSnackbarMessage('Purchase item activated successfully'));
        dispatch(setSnackbarOpen(true));
        dispatch(setActivateDialogOpen(false));
      }
    } catch (error: any) {
      dispatch(setSnackbarMessage(`Failed to activate purchase item: ${error.message}`));
      dispatch(setSnackbarOpen(true));
    }
  };

  const handleImportCSV = async (file: File, mode: 'merge' | 'replace' | 'rollback') => {
    try {
      const resultAction = await dispatch(importPurchaseItems({ file, mode }));

      if (importPurchaseItems.fulfilled.match(resultAction)) {
        const result = resultAction.payload as ImportResponse;
        setImportResults({
          successful: result.successful || [],
          updated: result.updated || [],
          failed: result.failed || [],
        });
        setErrorDialogOpen(true);
        dispatch(
          setSnackbarMessage(
            `Imported ${result.inserted_count || 0} items, updated ${result.updated_count || 0}`
          )
        );
        dispatch(fetchPurchaseItems({ page: currentPage, size: pageSize }));
      } else if (importPurchaseItems.rejected.match(resultAction)) {
        const errorPayload = resultAction.payload as any;
        const importResults = {
          successful: errorPayload?.successful || [],
          updated: errorPayload?.updated || [],
          failed: errorPayload?.failed || [],
        };

        if (errorPayload?.detail?.missing?.length > 0) {
          importResults.failed = [
            {
              row: 0,
              data: {},
              error: 'Missing required columns in CSV file',
              missingFields: errorPayload.detail.missing,
            },
          ];
        }

        setImportResults(importResults);
        setErrorDialogOpen(true);
        dispatch(
          setSnackbarMessage(
            errorPayload?.message || 'Import failed. Please check your file and try again.'
          )
        );
      }
    } catch (error: any) {
      dispatch(
        setSnackbarMessage(`Import error: ${error.message || 'Unknown error occurred'}`)
      );
    } finally {
      dispatch(setSnackbarOpen(true));
    }
  };

  const handleExportCSV = () => {
    setExportStatus('loading');
    dispatch(exportPurchaseItems())
      .unwrap()
      .then(() => {
        setExportStatus('succeeded');
        dispatch(setSnackbarMessage('Export successful'));
        dispatch(setSnackbarOpen(true));
      })
      .catch(() => {
        setExportStatus('failed');
        dispatch(setSnackbarMessage('Export Failed'));
        dispatch(setSnackbarOpen(true));
      });
  };

const handleDownloadSampleCSV = () => {
  // Match backend HEADER_MAPPING as closely as possible
  const sampleHeaders = [
    "Item Name",           // Required
    "Item Code",
    "Category",            // purchasecategoryName
    "Subcategory",         // purchasesubcategoryName
    "Item Group",          // itemgroupName - Required
    "UOM",                 // Required
    "Stock Quantity",
    "Supplier",
    "Purchase Price",      // Required
    "Selling Price",
    "Sale Type",           // Yes/No or true/false
    "Tax Rate",            // Most reliable column name (backend supports many variants)
    "Reorder Level",
    "Item Type",
    "HSN Code",
    "Shelf Life",
    "Vendor Tags",
    "Location",            // locationName
    "Barcode",
    "Description"
  ];

  const sampleData = [
    {
      "Item Name": "Sample Raw Material",
      "Item Code": "RM001",
      "Category": "Raw Materials",
      "Subcategory": "Chemicals",
      "Item Group": "Raw Materials",
      "UOM": "KG",
      "Stock Quantity": "100.00",
      "Supplier": "ABC Suppliers",
      "Purchase Price": "125.50",
      "Selling Price": "",
      "Sale Type": "No",
      "Tax Rate": "18",
      "Reorder Level": "20",
      "Item Type": "Raw Material",
      "HSN Code": "29151200",
      "Shelf Life": "24 months",
      "Vendor Tags": "SupplierA,SupplierB",
      "Location": "Main Warehouse",
      "Description": "High quality raw material sample"
    },
    {
      "Item Name": "Sample Finished Good",
      "Item Code": "FG001",
      "Category": "Finished Goods",
      "Subcategory": "Packaged",
      "Item Group": "Finished Goods",
      "UOM": "PCS",
      "Stock Quantity": "50",
      "Supplier": "XYZ Manufacturers",
      "Purchase Price": "450.00",
      "Selling Price": "599.00",
      "Sale Type": "Yes",
      "Tax Rate": "12",
      "Reorder Level": "10",
      "Item Type": "Finished Good",
      "HSN Code": "21069099",
      "Shelf Life": "12 months",
      "Vendor Tags": "VendorX",
      "Location": "FG Store",
      "Description": "Premium finished product"
    }
  ];

  // Create CSV content
  let csvContent = sampleHeaders.join(',') + '\n';

  sampleData.forEach(row => {
    const values = sampleHeaders.map(header => {
      const value = row[header as keyof typeof row] ?? '';
      // Escape commas and quotes
      const escaped = String(value).replace(/"/g, '""');
      return `"${escaped}"`;
    });
    csvContent += values.join(',') + '\n';
  });

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'sample_purchase_items.csv';
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
const handleSubmit = async (values: any) => {
  try {
    console.log('🔄 Submitting form data:', values);
    console.log('📋 Available subcategories with IDs:', subcategoriesList);
    
    const getRandomId = (item: any) => {
      if (!item) return '';
      return item.randomId || item.uomId || item.taxId || item.itemgroupId || item.locationId;
    };
    
    // Create lookup maps
    const itemTypeMap = new Map();
    itemtypes.forEach((t: any) => {
      itemTypeMap.set(t.itemtypeName, t);
    });
    
    const uomMap = new Map();
    uoms.forEach((u: any) => {
      uomMap.set(u.uom, u);
    });
    
    const taxMap = new Map();
    taxes.forEach((t: any) => {
      taxMap.set(t.taxPercentage, t);
      taxMap.set(String(t.taxPercentage), t);
    });
    
    const categoryMap = new Map();
    categories.forEach((c: any) => {
      categoryMap.set(c.purchasecategoryName, c);
    });
    
    const itemGroupMap = new Map();
    groupitems.forEach((g: any) => {
      itemGroupMap.set(g.itemgroupName, g);
    });
    
    const locationMap = new Map();
    locations.forEach((l: any) => {
      locationMap.set(l.locationName, l);
    });
    
    // Get subcategory ID
    const selectedSubcategoryName = values.purchasesubcategoryName;
    let selectedSubcategoryId = '';
    
    if (selectedSubcategoryName) {
      const foundSubcategory = subcategoriesList.find(
        (sub: any) => sub.name === selectedSubcategoryName || sub.purchasesubcategoryName === selectedSubcategoryName
      );
      
      if (foundSubcategory) {
        selectedSubcategoryId = foundSubcategory.id || foundSubcategory.randomId;
        console.log('✅ Found subcategory ID:', selectedSubcategoryId, 'for name:', selectedSubcategoryName);
      } else {
        console.error('❌ Subcategory not found in list:', selectedSubcategoryName);
        console.log('Available subcategories:', subcategoriesList);
        dispatch(setSnackbarMessage(`Subcategory "${selectedSubcategoryName}" not found`));
        dispatch(setSnackbarOpen(true));
        return;
      }
    }
    
    // Get selected objects from maps
    const selectedTax = taxMap.get(values.taxPercentage);
    const selectedItemType = itemTypeMap.get(values.itemType);
    const selectedUOM = uomMap.get(values.uom);
    const selectedCategory = categoryMap.get(values.purchasecategoryName);
    const selectedItemGroup = itemGroupMap.get(values.itemgroupName);
    const selectedLocation = locationMap.get(values.locationName);
    
    // Validate all required selections
    if (!selectedTax) {
      dispatch(setSnackbarMessage(`Tax rate "${values.taxPercentage}%" not found`));
      dispatch(setSnackbarOpen(true));
      return;
    }
    
    if (!selectedItemType) {
      dispatch(setSnackbarMessage(`Item Type "${values.itemType}" not found`));
      dispatch(setSnackbarOpen(true));
      return;
    }
    
    if (!selectedUOM) {
      dispatch(setSnackbarMessage(`UOM "${values.uom}" not found`));
      dispatch(setSnackbarOpen(true));
      return;
    }
    
    if (!selectedCategory) {
      dispatch(setSnackbarMessage(`Category "${values.purchasecategoryName}" not found`));
      dispatch(setSnackbarOpen(true));
      return;
    }
    
    if (!selectedItemGroup) {
      dispatch(setSnackbarMessage(`Item Group "${values.itemgroupName}" not found`));
      dispatch(setSnackbarOpen(true));
      return;
    }
    
    if (!selectedLocation) {
      dispatch(setSnackbarMessage(`Location "${values.locationName}" not found`));
      dispatch(setSnackbarOpen(true));
      return;
    }
    
    // Validate subcategory belongs to selected category
    const categorySubcategories = selectedCategory.subcategories || [];
    const isSubcategoryValid = categorySubcategories.some(
      (sub: any) => (sub.randomId === selectedSubcategoryId) || (sub.purchasesubcategoryName === selectedSubcategoryName)
    );
    
    if (!isSubcategoryValid && selectedSubcategoryId) {
      console.warn('⚠️ Subcategory does not belong to selected category!');
      dispatch(setSnackbarMessage(`"${selectedSubcategoryName}" does not belong to category "${values.purchasecategoryName}"`));
      dispatch(setSnackbarOpen(true));
      return;
    }
    
    // Check if selling price is required when saleType is true
    const isSaleTypeValue = values.saleType || false;
    if (isSaleTypeValue && (!values.sellingPrice || values.sellingPrice <= 0)) {
      dispatch(setSnackbarMessage('Selling price is required and must be greater than 0 when Sale Type is enabled'));
      dispatch(setSnackbarOpen(true));
      return;
    }
    
    let dataToSend: any;
    
    if (editIndex !== null) {
      // UPDATE existing item
      const itemToEdit = items[editIndex];
      dataToSend = {
        purchaseitemId: itemToEdit.purchaseitemId,
        itemName: values.itemName.trim(),
        itemCode: values.itemCode || '',
        itemTypeId: getRandomId(selectedItemType),
        uomId: selectedUOM.uomId,
        taxId: selectedTax.taxId,
        purchasecategoryId: getRandomId(selectedCategory),
        itemgroupId: getRandomId(selectedItemGroup),
        locationId: getRandomId(selectedLocation),
        purchasesubcategoryId: selectedSubcategoryId,
        taxPercentage: Number(values.taxPercentage),
        stockQuantity: isSaleTypeValue ? 0 : Number(values.stockQuantity) || 0,
        saleType: isSaleTypeValue,
        purchasePrice: Number(values.purchasePrice) || 0,
        sellingPrice: isSaleTypeValue ? Number(values.sellingPrice) : null,
        reorderLevel: isSaleTypeValue ? 0 : Number(values.reorderLevel) || 0,
        supplier: values.supplier || '',
        hsnCode: values.hsnCode || '',
        shelfLife: values.shelfLife || '',
        barcode: Number(values.barcode) || 0,  // 🔥 Convert to number
        description: values.description || '',
        vendorTag: values.vendorTag || [],
      };
      
      console.log('📤 FINAL Edit data:', dataToSend);
      await dispatch(updatePurchaseItem(dataToSend)).unwrap();
      dispatch(setSnackbarMessage('Item updated successfully'));
    } else {
      // ADD new item
      dataToSend = {
        itemName: values.itemName.trim(),
        itemCode: values.itemCode || '',
        itemTypeId: getRandomId(selectedItemType),
        uomId: selectedUOM.uomId,
        taxId: selectedTax.taxId,
        purchasecategoryId: getRandomId(selectedCategory),
        itemgroupId: getRandomId(selectedItemGroup),
        locationId: getRandomId(selectedLocation),
        purchasesubcategoryId: selectedSubcategoryId,
        taxPercentage: Number(values.taxPercentage),
        stockQuantity: isSaleTypeValue ? 0 : Number(values.stockQuantity) || 0,
        saleType: isSaleTypeValue,
        purchasePrice: Number(values.purchasePrice) || 0,
        sellingPrice: isSaleTypeValue ? Number(values.sellingPrice) : null,
        reorderLevel: isSaleTypeValue ? 0 : Number(values.reorderLevel) || 0,
        supplier: values.supplier || '',
        hsnCode: values.hsnCode || '',
        shelfLife: values.shelfLife || '',
        barcode: Number(values.barcode) || 0,  // 🔥 Convert to number
        description: values.description || '',
        vendorTag: values.vendorTag || [],
        status: 'active',
      };
      
      console.log('📤 FINAL Add data:', dataToSend);
      await dispatch(addPurchaseItem(dataToSend)).unwrap();
      dispatch(setSnackbarMessage('Item added successfully'));
    }
    
    dispatch(setSnackbarOpen(true));
    handleDialogClose();
    
    // Refresh the items list
    dispatch(fetchPurchaseItems({
      page: currentPage,
      size: pageSize,
      showDeactivated: showDeactivated,
      ...filters
    }));
    
  } catch (error: any) {
    console.error('❌ Submission error:', error);
    let errorMessage = `Failed to ${editIndex !== null ? 'update' : 'add'} item`;
    
    if (error.response?.data?.detail) {
      errorMessage = error.response.data.detail;
    } else if (error.payload?.message) {
      errorMessage = error.payload.message;
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    dispatch(setSnackbarMessage(errorMessage));
    dispatch(setSnackbarOpen(true));
  }
};

  const handleRefresh = () => {
    console.log('🔄 Manual refresh triggered');

    const currentFilters = {
      ...(filters.itemName && { itemName: filters.itemName }),
      ...(filters.purchasecategoryName && { purchasecategoryName: filters.purchasecategoryName }),
      ...(filters.purchasesubcategoryName && { purchasesubcategoryName: filters.purchasesubcategoryName }),
    };

    dispatch(
      fetchPurchaseItems({
        page: currentPage,
        size: pageSize,
        ...currentFilters,
      })
    );

    dispatch(setSnackbarMessage('Data refreshed successfully'));
    dispatch(setSnackbarOpen(true));
  };

  const paginatedItems = showDeactivated ? deactivatedItems : items;

  if (permissionLoading) {
    return (
      <Box p={3}>
        <Typography>Loading permissions...</Typography>
      </Box>
    );
  }

  if (!moduleVisible) {
    return (
      <Box p={3}>
        <Alert severity="error">
          You do not have access to the Purchase Item module.
        </Alert>
      </Box>
    );
  }

  return (
    <Box>
      <YenPurchasePage />
      <Box sx={{ pt: 1, pl: 2, pr: 1 }}>
        <PurchaseControls
          handleDialogOpen={canAdd ? handleDialogOpen : undefined}
          itemName={itemName}
          category={category}
          subcategory={subcategory}
          setItemName={setItemName}
          setCategory={setCategory}
          setSubcategory={setSubcategory}
          handleFilter={handleFilter}
          handleClearFilters={handleClearFilters}
          handleDownloadSampleCSV={handleDownloadSampleCSV}
          handleImportCSV={handleImportCSV}
          handleExportCSV={handleExportCSV}
          showDeactivated={showDeactivated}
          setShowDeactivated={(value) => dispatch(setShowDeactivated(value))}
          loading={loading}
          exportStatus={exportStatus}
          canAdd={canAdd}
          handleRefresh={handleRefresh}
        />

        <PurchaseTable
          items={paginatedItems}
          loading={loading}
          showDeactivated={showDeactivated}
          handleEdit={handleEdit}
          handleDeactivate={handleDeactivateClick}
          handleActivate={handleActivateClick}
          canEdit={canEdit}
          canDelete={canDelete}
        />

        <PurchasePagination
          currentPage={currentPage}
          pageSize={pageSize}
          totalItems={totalItems}
          handlePageChange={handlePageChange}
        />

        <PurchaseItemForm
          open={dialogOpen === 'edit'}
          onClose={handleDialogClose}
          initialValues={editIndex !== null ? { ...items[editIndex] } : initialPurchaseState}
          validationSchema={validationSchema}
          onSubmit={handleSubmit}
          editIndex={editIndex}
          categories={categories}
          uoms={uoms}
          groupitems={groupitems}
          taxes={taxes}
          locations={locations}
          itemtypes={itemtypes}
          existingItems={items}
        />

        <Dialog
          open={deactivateDialogOpen}
          onClose={() => dispatch(setDeactivateDialogOpen(false))}
        >
          <DialogTitle>Confirm Deactivation</DialogTitle>
          <DialogContent>
            <DialogContentText>
              Are you sure you want to deactivate {itemToDeactivate?.itemName}?
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => dispatch(setDeactivateDialogOpen(false))} color="primary">
              Cancel
            </Button>
            <Button onClick={handleConfirmDeactivate} color="primary">
              Confirm Deactivate
            </Button>
          </DialogActions>
        </Dialog>

        <Dialog
          open={activateDialogOpen}
          onClose={() => dispatch(setActivateDialogOpen(false))}
        >
          <DialogTitle>Confirm Activation</DialogTitle>
          <DialogContent>
            <DialogContentText>
              Are you sure you want to activate {itemToActivate?.itemName}?
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => dispatch(setActivateDialogOpen(false))} color="primary">
              Cancel
            </Button>
            <Button onClick={handleConfirmActivate} color="primary">
              Confirm Activate
            </Button>
          </DialogActions>
        </Dialog>

        <Snackbar
          open={snackbarOpen}
          autoHideDuration={6000}
          onClose={() => dispatch(setSnackbarOpen(false))}
          message={snackbarMessage}
        />

        <ImportErrorDialog
          open={errorDialogOpen}
          onClose={() => setErrorDialogOpen(false)}
          importResults={importResults}
        />
      </Box>
    </Box>
  );
};

export default PurchasePage;