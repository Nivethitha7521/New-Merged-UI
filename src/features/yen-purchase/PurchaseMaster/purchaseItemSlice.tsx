import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import axios from 'axios';
import purchaseApi from '@/utils/api';

import { RootState } from '../../../redux/store';
import { PurchaseItemSearchAdd } from '@/Models/purchaseModel';
import {
  ImportPayload,
  ImportResponse,
  initialState,
  PurchaseCategory,
  PurchaseItem,
  PurchaseItemSearch,
  SearchResponse,
  StorageLocationItem,
  UOM,
  Vendor,
  Tax
} from '@/Models/purchaseitem';
import { PurchaseItemType } from '@/Models/itemType';

// ✅ IMPORTANT: use the existing category thunk from PurchaseCategorySlice
import { fetchCategoriesItem } from './PurchaseCategorySlice';

const CACHE_DURATION = 60 * 60 * 1000; // 1 hour in milliseconds

// ---------- EXPORT (OLD) ----------
export const exportPurchaseItemsToCSV = createAsyncThunk(
  'export/exportPurchaseItemsToCSV',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get('http://192.168.1.102:8000/purchaseapi/rawMaterials/purchaseitemexport/export_csv', {
        responseType: 'blob',
      });

      if (response.status !== 200) {
        throw new Error('Failed to export purchase items to CSV');
      }

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'purchase_items.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();

      return true;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to export purchase items to CSV');
    }
  }
);

// ---------- FETCH ITEMS (WITH FILTERS) ----------
export const fetchPurchaseItems = createAsyncThunk(
  'purchaseItems/fetch',
  async ({
    page,
    size,
    showDeactivated = false,
    ...filters
  }: {
    page: number;
    size: number;
    showDeactivated?: boolean;
    itemName?: string;
    purchasecategoryName?: string;
    purchasesubcategoryName?: string;
  }) => {
    const params: Record<string, any> = {
      skip: (page - 1) * size,
      limit: size,
    };

    if (showDeactivated !== undefined) {
      params.showDeactivated = showDeactivated;
    }

    Object.entries(filters).forEach(([key, value]) => {
      if (value) params[key] = value;
    });

    try {
      console.log('📡 Fetching purchase items with params:', params);

      const response = await purchaseApi.get('/rawMaterials/', {
        params,
      });

      let items: PurchaseItem[] = [];
      let totalItems = 0;

      if (Array.isArray(response.data)) {
        items = response.data;
        totalItems = response.data.length;
      } else if (response.data.items) {
        items = response.data.items || [];
        totalItems = response.data.totalItems || response.data.total || items.length;
      } else {
        items = response.data || [];
        totalItems = items.length;
      }

      return {
        items: items,
        totalItems: totalItems,
        showDeactivated,
      };
    } catch (error: any) {
      console.error('❌ Error fetching purchase items:', error);
      throw new Error(error.response?.data?.detail || 'Error fetching purchase items');
    }
  }
);

// ---------- UOM (from Master Admin API) ----------
export const fetchUom = createAsyncThunk('uom/fetch', async () => {
  try {
    const response = await axios.get('https://yenerp.com/masteradminapi/uoms/', {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });

    const activeUoms = response.data.filter((uom: any) => uom.status === 'active');

    const uoms: UOM[] = activeUoms.map((item: any) => ({
      uomId: item.uomId || item.id,
      uom: item.uom,
      status: item.status
    }));

    return uoms;
  } catch (error: any) {
    console.error('Error fetching UOMs:', error);
    throw new Error(error.response?.data?.detail || 'Failed to fetch UOMs');
  }
});

// ---------- TAX (from Master Admin API) ----------
export const fetchTax = createAsyncThunk('tax/fetch', async () => {
  try {
    const response = await axios.get('https://yenerp.com/masteradminapi/taxes', {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });

    const activeTaxes = response.data.filter((tax: any) => tax.status === 'active');

    const taxes: Tax[] = activeTaxes.map((item: any) => ({
      taxId: item.taxId || item.id,
      taxPercentage: item.taxPercentage,
      taxName: item.taxName,
      status: item.status
    }));

    return taxes;
  } catch (error: any) {
    console.error('Error fetching Taxes:', error);
    throw new Error(error.response?.data?.detail || 'Failed to fetch Taxes');
  }
});

// ---------- ITEM TYPE ----------
export const fetchPurchaseItemtype = createAsyncThunk('itemtype/fetch', async () => {
  try {
    const response = await purchaseApi.get<PurchaseItemType[]>('/itemtypes/', {});

    const itemtypes = response.data.map(item => ({
      itemtypeId: item.itemtypeId,
      itemtypeName: item.itemtypeName,
      randomId: item.randomId,
    }));

    return itemtypes;
  } catch (error: any) {
    console.error('Error fetching item types:', error);
    throw new Error(error.response?.data?.detail || 'Failed to fetch item types');
  }
});

// ---------- STORAGE LOCATION ----------
export const fetchStorageLocationItems = createAsyncThunk('storageLocations/fetch', async () => {
  try {
    const response = await purchaseApi.get<StorageLocationItem[]>('/storagelocations/', {});

    const locations = response.data.map((item) => ({
      locationId: item.locationId,
      locationName: item.locationName,
      randomId: item.randomId,
      status: item.status
    }));

    return locations;
  } catch (error: any) {
    console.error('Error fetching locations:', error);
    throw new Error(error.response?.data?.detail || 'Failed to fetch locations');
  }
});

// ---------- GROUP ITEMS ----------
export const fetchPurchaseGroupItems = createAsyncThunk('groupItems/fetch', async () => {
  try {
    const response = await purchaseApi.get('/itemgroups/', {});

    const groupitems = response.data.map((item: any) => ({
      itemgroupId: item.itemgroupId,
      itemgroupName: item.itemgroupName,
      randomId: item.randomId,
      status: item.status
    }));

    return groupitems;
  } catch (error: any) {
    console.error('Error fetching group items:', error);
    throw new Error(error.response?.data?.detail || 'Failed to fetch group items');
  }
});

// ---------- VENDORS ----------
export const fetchAllVendors = createAsyncThunk('vendors/fetch', async () => {
  const response = await purchaseApi.get<Vendor[]>('/vendors/');
  const vendorData = response.data.map((item) => ({
    vendorId: item.vendorId,
    vendorName: item.vendorName,
  }));
  return vendorData;
});

export const fetchSubcategoriesByCategory = createAsyncThunk(
  'purchaseItems/fetchSubcategoriesByCategory',
  async (categoryId: string, { rejectWithValue }) => {
    try {
      const response = await purchaseApi.get(
        `/purchasecategory/${categoryId}/subcategories`
      );
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.detail || 'Failed to fetch subcategories');
    }
  }
);

// ---------- ADD ITEM ----------
export const addPurchaseItem = createAsyncThunk(
  'purchaseItems/add',
  async (purchase: Omit<PurchaseItem, 'purchaseitemId'>, { dispatch, rejectWithValue }) => {
    try {
      const purchaseToAdd = { ...purchase };

      const response = await purchaseApi.post<PurchaseItem>(
        '/rawMaterials/',
        purchaseToAdd,
      );

      dispatch(invalidatePurchaseItemsCache());
      dispatch(invalidatePOCache());
      return response.data;
    } catch (error: any) {
      console.error('Failed to add purchase item:', error);
      return rejectWithValue({
        message: error.response?.data?.detail || error.response?.data?.message || 'Failed to add purchase item',
        validationErrors: error.response?.data?.detail || null,
        status: error.response?.status
      });
    }
  }
);

// ---------- SEARCH (PO) ----------
export const POsearchPurchaseItems = createAsyncThunk<
  PurchaseItemSearch[],
  { searchQuery: string; skip: number; limit: number }
>('purchaseItems/searchPurchaseItems', async ({ searchQuery, skip, limit }) => {
  const cacheKey = `purchaseItems_${searchQuery}_skip${skip}_limit${limit}`;
  const cachedData = localStorage.getItem(cacheKey);
  const now = Date.now();

  if (cachedData) {
    const { data, timestamp } = JSON.parse(cachedData);
    if (now - timestamp < CACHE_DURATION) {
      return data;
    } else {
      localStorage.removeItem(cacheKey);
    }
  }

  const response = await purchaseApi.get<PurchaseItemSearch[]>(
    `/rawMaterials/exact-name/`,
    {
      params: {
        item_name: searchQuery,
        skip,
        limit,
      },
    }
  );

  localStorage.setItem(
    cacheKey,
    JSON.stringify({
      data: response.data,
      timestamp: now,
    })
  );

  return response.data;
});

export const invalidatePOCache = createAsyncThunk('purchaseItems/invalidateCache', async () => {
  Object.keys(localStorage).forEach((key) => {
    if (key.startsWith('purchaseItems_')) {
      localStorage.removeItem(key);
    }
  });
  console.log('Purchase items cache invalidated');
});

// ---------- SEARCH WITH STOCK ----------
export const searchPurchaseItems = createAsyncThunk<
  PurchaseItemSearchAdd[],
  {
    searchQuery: string;
    skip: number;
    limit: number;
    forceRefresh?: boolean;
    locationId?: string | null;
  }
>('purchaseOrder/searchPurchaseItems', async ({
  searchQuery,
  skip,
  limit,
  forceRefresh = false,
  locationId = null
}) => {
  try {
    const params: Record<string, any> = {
      itemName: searchQuery,
      skip,
      limit
    };

    if (locationId) {
      params.locationId = locationId;
    }

    if (forceRefresh) {
      params._t = Date.now();
    }

    const response = await purchaseApi.get<SearchResponse>(
      `/rawMaterials/search-with-stock`,
      { params }
    );

    return response.data?.items || [];
  } catch (error) {
    console.error('Error fetching purchase items:', error);
    return [];
  }
});

export const invalidatePurchaseItemsCache = createAsyncThunk(
  'purchaseItems/invalidateCache',
  async () => {
    Object.keys(localStorage).forEach((key) => {
      if (key.startsWith('purchaseItems_') || key.startsWith('searchPurchaseItems_')) {
        localStorage.removeItem(key);
      }
    });
    console.log('Purchase items cache invalidated');
  }
);

// ---------- UPDATE ITEM ----------
export const updatePurchaseItem = createAsyncThunk(
  'purchaseItems/update',
  async (purchase: PurchaseItem, { dispatch, rejectWithValue }) => {
    try {
      const purchaseToUpdate = { ...purchase };

      const response = await purchaseApi.patch<PurchaseItem>(
        `/rawMaterials/${purchase.purchaseitemId}`,
        purchaseToUpdate,
      );

      dispatch(invalidatePurchaseItemsCache());
      dispatch(invalidatePOCache());
      return response.data;
    } catch (error: any) {
      console.error('Update error:', error);
      return rejectWithValue({
        message: error.response?.data?.detail || 'Failed to update purchase item',
        validationErrors: error.response?.data?.detail,
        status: error.response?.status
      });
    }
  }
);

// ---------- DEACTIVATE ----------
export const deactivatePurchaseItem = createAsyncThunk('purchaseItems/deactivate', async (id: string, { rejectWithValue }) => {
  try {
    await purchaseApi.patch<PurchaseItem>(
      `/rawMaterials/${id}/deactivate`,
      { status: 'deactivated' },
    );
    return id;
  } catch (error: any) {
    console.error('Deactivate error:', error);
    return rejectWithValue(error.response?.data?.detail || 'Failed to deactivate purchase item');
  }
});

// ---------- ACTIVATE ----------
export const activatePurchaseItem = createAsyncThunk('purchaseItems/activate', async (id: string, { rejectWithValue }) => {
  try {
    await purchaseApi.patch<PurchaseItem>(
      `/rawMaterials/${id}/activate`,
      { status: 'active' },
    );
    return id;
  } catch (error: any) {
    console.error('Activate error:', error);
    return rejectWithValue(error.response?.data?.detail || 'Failed to activate purchase item');
  }
});

// ============================================================
// BACKUP AND ROLLBACK ACTIONS
// ============================================================

// Get available backups
export const fetchBackups = createAsyncThunk(
  'purchaseItems/fetchBackups',
  async (_, { rejectWithValue }) => {
    try {
      const response = await purchaseApi.get('/rawMaterials/backups');
      return response.data.backups || [];
    } catch (error: any) {
      console.error('Error fetching backups:', error);
      return rejectWithValue(error.response?.data?.detail || error.message || 'Failed to fetch backups');
    }
  }
);

// Rollback to a specific backup
export const rollbackToBackup = createAsyncThunk(
  'purchaseItems/rollbackToBackup',
  async (backupId: string, { dispatch, rejectWithValue }) => {
    try {
      const response = await purchaseApi.post(`/rawMaterials/rollback?backup_id=${backupId}`);

      // Invalidate caches after rollback
      dispatch(invalidatePurchaseItemsCache());
      dispatch(invalidatePOCache());

      return response.data;
    } catch (error: any) {
      console.error('Rollback error:', error);
      return rejectWithValue({
        message: error.response?.data?.detail || error.message || 'Failed to rollback',
        status: error.response?.status
      });
    }
  }
);

// ---------- IMPORT ----------
export const importPurchaseItems = createAsyncThunk(
  'purchaseItems/import',
  async ({ file, mode }: ImportPayload, { dispatch, rejectWithValue }) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('mode', mode);

      const response = await purchaseApi.post(
        '/rawMaterials/import_csv',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      // Invalidate cache after import
      dispatch(invalidatePurchaseItemsCache());
      dispatch(invalidatePOCache());

      return response.data as ImportResponse;
    } catch (error: any) {
      console.error('Import error:', error);

      if (error.response) {
        const data = error.response.data;
        return rejectWithValue({
          message: data.detail?.message || data.message || 'Import failed',
          inserted_count: data.inserted_count || 0,
          updated_count: data.updated_count || 0,
          failed_count: data.failed_count || 0,
          successful: data.successful || [],
          updated: data.updated || [],
          failed: data.failed || [],
          backup_id: data.backup_id,
          rollback_available: data.rollback_available,
        });
      }
      return rejectWithValue({
        message: error.message || 'Failed to import purchase items',
        inserted_count: 0,
        updated_count: 0,
        failed_count: 0,
        successful: [],
        updated: [],
        failed: [],
      });
    }
  }
);

// ---------- EXPORT ----------
export const exportPurchaseItems = createAsyncThunk(
  'purchaseItems/export',
  async (_, { rejectWithValue }) => {
    try {
      const response = await purchaseApi.get(
        '/rawMaterials/purchaseitemexport/export_csv',
        {
          responseType: 'blob',
        }
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `purchase_items_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);

      return true;
    } catch (error: any) {
      if (error.response) {
        return rejectWithValue(error.response.data.detail || error.response.data.message);
      }
      return rejectWithValue(error.message || 'Failed to export purchase items');
    }
  }
);

// ---------- SLICE ----------
const purchaseItemSlice = createSlice({
  name: 'purchaseItems',
  initialState,
  reducers: {
    clearSuccessMessage: (state) => {
      state.successMessage = null;
    },
    setSearchQuery: (state, action) => {
      state.searchQuery = action.payload;
    },
    setItemData: (state, action: PayloadAction<PurchaseItem>) => {
      state.itemData = action.payload;
    },
    setDialogOpen: (state, action: PayloadAction<'none' | 'edit' | 'deactivated'>) => {
      state.dialogOpen = action.payload;
    },
    setSnackbarOpen: (state, action: PayloadAction<boolean>) => {
      state.snackbarOpen = action.payload;
    },
    setSnackbarMessage: (state, action: PayloadAction<string>) => {
      state.snackbarMessage = action.payload;
    },
    setShowDeactivated: (state, action: PayloadAction<boolean>) => {
      state.showDeactivated = action.payload;
    },
    toggleShowDeactivated(state) {
      state.showDeactivated = !state.showDeactivated;
    },
    setEditIndex: (state, action: PayloadAction<number | null>) => {
      state.editIndex = action.payload;
    },
    setItemToActivate: (state, action: PayloadAction<PurchaseItem | null>) => {
      state.itemToActivate = action.payload;
    },
    setDeactivateDialogOpen: (state, action: PayloadAction<boolean>) => {
      state.deactivateDialogOpen = action.payload;
    },
    setActivateDialogOpen: (state, action: PayloadAction<boolean>) => {
      state.activateDialogOpen = action.payload;
    },
    setItemToDeactivate: (state, action: PayloadAction<PurchaseItem | null>) => {
      state.itemToDeactivate = action.payload;
    },
    setTags(state, action: PayloadAction<string[]>) {
      state.tags = action.payload;
    },
    removeTag(state, action: PayloadAction<string>) {
      state.tags = state.tags.filter((tag) => tag !== action.payload);
    },
    setPagination: (state, action: PayloadAction<{ page: number; size: number }>) => {
      state.currentPage = action.payload.page;
      state.pageSize = action.payload.size;
    },
    setFilters: (
      state,
      action: PayloadAction<{
        itemName?: string;
        purchasecategoryName?: string;
        purchasesubcategoryName?: string;
      }>
    ) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearFilters: (state) => {
      state.filters = initialState.filters;
    },
    resetImportStatus(state) {
      state.importStatus = 'idle';
      state.importError = null;
      state.importMessage = null;
      state.importResults = {
        successful: [],
        updated: [],
        failed: []
      };
    },
    resetExportStatus(state) {
      state.exportStatus = 'idle';
      state.exportError = null;
    },
    resetRollbackStatus(state) {
      state.rollbackStatus = 'idle';
      state.rollbackError = null;
    },
    clearBackups(state) {
      state.backups = [];
    },
  },
  extraReducers: (builder) => {
    builder
      // FETCH ITEMS
      .addCase(fetchPurchaseItems.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchPurchaseItems.fulfilled, (state, action) => {
        state.loading = false;
        const { items, totalItems, showDeactivated } = action.payload;

        if (showDeactivated) {
          state.deactivatedItems = items;
        } else {
          state.items = items;
        }
        state.totalItems = totalItems;
        state.error = null;
      })
      .addCase(fetchPurchaseItems.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch purchase items';
      })

      // CATEGORIES
      .addCase(fetchCategoriesItem.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchCategoriesItem.fulfilled, (state, action) => {
        state.loading = false;
        state.categories = action.payload;
        state.error = null;
      })
      .addCase(fetchCategoriesItem.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch categories';
      })

      // UOM
      .addCase(fetchUom.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchUom.fulfilled, (state, action) => {
        state.loading = false;
        state.uoms = action.payload;
        state.error = null;
      })
      .addCase(fetchUom.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch UOMs';
      })

      // TAX
      .addCase(fetchTax.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchTax.fulfilled, (state, action) => {
        state.loading = false;
        state.taxes = action.payload;
        state.error = null;
      })
      .addCase(fetchTax.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch taxes';
      })

      // LOCATIONS
      .addCase(fetchStorageLocationItems.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchStorageLocationItems.fulfilled, (state, action) => {
        state.loading = false;
        state.locations = action.payload;
        state.error = null;
      })
      .addCase(fetchStorageLocationItems.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch locations';
      })

      // GROUP ITEMS
      .addCase(fetchPurchaseGroupItems.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchPurchaseGroupItems.fulfilled, (state, action) => {
        state.loading = false;
        state.groupitems = action.payload;
        state.error = null;
      })
      .addCase(fetchPurchaseGroupItems.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch group items';
      })

      // ITEM TYPES
      .addCase(fetchPurchaseItemtype.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchPurchaseItemtype.fulfilled, (state, action) => {
        state.loading = false;
        state.itemtypes = action.payload;
        state.error = null;
      })
      .addCase(fetchPurchaseItemtype.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch item types';
      })

      // VENDORS
      .addCase(fetchAllVendors.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchAllVendors.fulfilled, (state, action) => {
        state.loading = false;
        state.vendors = action.payload;
        state.error = null;
      })
      .addCase(fetchAllVendors.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch vendors';
      })

      // ADD
      .addCase(addPurchaseItem.pending, (state) => {
        state.loading = true;
      })
      .addCase(addPurchaseItem.fulfilled, (state, action) => {
        state.loading = false;
        state.items.unshift(action.payload);
        state.successMessage = 'Purchase item created successfully.';
        state.error = null;
      })
      .addCase(addPurchaseItem.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as any)?.message || 'Failed to add purchase item';
      })

      // UPDATE
      .addCase(updatePurchaseItem.pending, (state) => {
        state.loading = true;
      })
      .addCase(updatePurchaseItem.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.items.findIndex(item => item.purchaseitemId === action.payload.purchaseitemId);
        if (index !== -1) {
          state.items[index] = action.payload;
        }
        state.successMessage = 'Purchase item updated successfully.';
        state.error = null;
      })
      .addCase(updatePurchaseItem.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as any)?.message || 'Failed to update purchase item';
      })

      // DEACTIVATE
      .addCase(deactivatePurchaseItem.fulfilled, (state, action) => {
        const itemToDeactivate = state.items.find(item => item.purchaseitemId === action.payload);
        if (itemToDeactivate) {
          const deactivatedItem = { ...itemToDeactivate, status: 'deactivated' };
          state.items = state.items.filter(item => item.purchaseitemId !== action.payload);
          state.deactivatedItems.unshift(deactivatedItem);
        }
        state.successMessage = 'Purchase item deactivated successfully.';
      })
      .addCase(deactivatePurchaseItem.rejected, (state, action) => {
        state.error = (action.payload as string) || 'Failed to deactivate purchase item';
      })

      // ACTIVATE
      .addCase(activatePurchaseItem.fulfilled, (state, action) => {
        const itemToActivate = state.deactivatedItems.find(item => item.purchaseitemId === action.payload);
        if (itemToActivate) {
          const activatedItem = { ...itemToActivate, status: 'active' };
          state.deactivatedItems = state.deactivatedItems.filter(item => item.purchaseitemId !== action.payload);
          state.items.unshift(activatedItem);
        }
        state.successMessage = 'Purchase item activated successfully.';
      })
      .addCase(activatePurchaseItem.rejected, (state, action) => {
        state.error = (action.payload as string) || 'Failed to activate purchase item';
      })
.addCase(importPurchaseItems.fulfilled, (state, action: PayloadAction<ImportResponse>) => {
  state.importStatus = 'succeeded';
  state.importMessage = action.payload.message;
  state.importError = null;

  // The API returns successful with proper fields
  const transformedSuccessful = (action.payload.successful || []).map((item: any) => ({
    row: item.row,
    data: {
      itemName: item.itemName || '',
      randomId: item.randomId || '',
      barcode: item.barcode || 0,
      ...(item.brandName && { brandName: item.brandName }),
      ...(item.aliasName && { aliasName: item.aliasName }),
      ...(item.shelfLife && { shelfLife: String(item.shelfLife) })
    }
  }));

  const transformedUpdated = (action.payload.updated || []).map((item: any) => ({
    row: item.row,
    data: { itemName: item.itemName || '' },
    error: item.error
  }));

  const transformedFailed = (action.payload.failed || []).map((item: any) => ({
    row: item.row,
    data: item.data || {},
    error: item.error,
    missingFields: item.missingFields || []
  }));

  state.importResults = {
    successful: transformedSuccessful,
    updated: transformedUpdated,
    failed: transformedFailed
  };

  // DON'T set snackbar message here - we'll use dialog only
  // state.snackbarMessage = `Imported ${action.payload.inserted_count || 0} items, updated ${action.payload.updated_count || 0}`;
  // state.snackbarOpen = true;
})

.addCase(importPurchaseItems.rejected, (state, action) => {
  state.importStatus = 'failed';
  const payload = action.payload as any;
  state.importError = payload?.message || 'Failed to import purchase items';
  
  // Store the import results even on failure
  if (payload?.successful) {
    state.importResults.successful = payload.successful.map((item: any) => ({
      row: item.row,
      data: {
        itemName: item.itemName || '',
        randomId: item.randomId || '',
        barcode: item.barcode || 0,
        ...(item.brandName && { brandName: item.brandName }),
        ...(item.aliasName && { aliasName: item.aliasName }),
        ...(item.shelfLife && { shelfLife: String(item.shelfLife) })
      }
    }));
  }
  
  if (payload?.updated) {
    state.importResults.updated = payload.updated.map((item: any) => ({
      row: item.row,
      data: { itemName: item.itemName || '' },
      error: item.error
    }));
  }
  
  if (payload?.failed) {
    state.importResults.failed = payload.failed.map((item: any) => ({
      row: item.row,
      data: item.data || {},
      error: item.error,
      missingFields: item.missingFields || []
    }));
  }
})
      // EXPORT
      .addCase(exportPurchaseItems.pending, (state) => {
        state.exportStatus = 'loading';
        state.exportError = null;
      })
      .addCase(exportPurchaseItems.fulfilled, (state) => {
        state.exportStatus = 'succeeded';
      })
      .addCase(exportPurchaseItems.rejected, (state, action) => {
        state.exportStatus = 'failed';
        state.exportError = action.error.message || 'Failed to export purchase items';
      })

      // FETCH BACKUPS
      .addCase(fetchBackups.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchBackups.fulfilled, (state, action) => {
        state.loading = false;
        state.backups = action.payload;
        state.error = null;
      })
      .addCase(fetchBackups.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch backups';
      })

      // ROLLBACK
      .addCase(rollbackToBackup.pending, (state) => {
        state.rollbackStatus = 'loading';
        state.rollbackError = null;
      })
    // Update rollback.fulfilled case
.addCase(rollbackToBackup.fulfilled, (state, action) => {
  state.rollbackStatus = 'succeeded';
  state.rollbackError = null;
  // DON'T set snackbar message - dialog will show success
  // state.snackbarMessage = action.payload.message || 'Rollback completed successfully';
  // state.snackbarOpen = true;
  state.loading = false;
})

.addCase(rollbackToBackup.rejected, (state, action) => {
  state.rollbackStatus = 'failed';
  state.rollbackError = (action.payload as any)?.message || 'Failed to rollback';
  // DON'T set snackbar message - dialog will show error
  // state.snackbarMessage = (action.payload as any)?.message || 'Rollback failed';
  // state.snackbarOpen = true;
});
  },
});

// ---------- EXPORTS ----------
export const {
  clearSuccessMessage,
  setSearchQuery,
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
  toggleShowDeactivated,
  setTags,
  removeTag,
  setPagination,
  setFilters,
  clearFilters,
  resetExportStatus,
  resetImportStatus,
  resetRollbackStatus,
  clearBackups,
} = purchaseItemSlice.actions;

export const selectCurrentPage = (state: RootState) => state.purchaseItems.currentPage;
export const selectPageSize = (state: RootState) => state.purchaseItems.pageSize;
export const selectTotalItems = (state: RootState) => state.purchaseItems.totalItems;
export const selectPurchaseItems = (state: RootState) => state.purchaseItems;
export const selectBackups = (state: RootState) => state.purchaseItems.backups;
export const selectRollbackStatus = (state: RootState) => state.purchaseItems.rollbackStatus;

export default purchaseItemSlice.reducer;