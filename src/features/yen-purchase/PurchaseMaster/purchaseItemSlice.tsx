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
  Tax  // Add Tax import
} from '@/Models/purchaseitem';
import { PurchaseItemType } from '@/Models/itemType';

// ✅ IMPORTANT: use the existing category thunk from PurchaseCategorySlice
import { fetchCategoriesItem } from './PurchaseCategorySlice';
import { random } from 'lodash';

const EXPORT_CSV_URL = 'http://192.168.1.100:8000/purchaseapi/rawMaterials/export_csv';
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour in milliseconds

// ---------- EXPORT (OLD) ----------
export const exportPurchaseItemsToCSV = createAsyncThunk(
  'export/exportPurchaseItemsToCSV',
  async (_, { rejectWithValue }) => {
    try {
      if (!EXPORT_CSV_URL) {
        throw new Error('Export URL is not defined');
      }

      const response = await axios.get(EXPORT_CSV_URL, {
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

    // Only add status filter if not fetching all
    if (showDeactivated !== undefined) {
      params.status = showDeactivated ? 'deactivated' : 'active';
    }

    Object.entries(filters).forEach(([key, value]) => {
      if (value) params[key] = value;
    });

    try {
      console.log('📡 Fetching purchase items with params:', params);
      
      const response = await purchaseApi.get('http://192.168.1.100:8000/purchaseapi/rawMaterials/', { 
        params,
      });
      
      console.log('📦 Raw API response:', response.data);
      
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
      
      console.log('✅ Processed items:', items);
      console.log('✅ Total items:', totalItems);
      
      return {
        items: items,
        totalItems: totalItems,
        showDeactivated,
      };
    } catch (error: any) {
      console.error('❌ Error fetching purchase items:', error);
      console.error('❌ Error response:', error.response?.data);
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
    
    console.log('Master Admin UOM API Response:', response.data);
    
    const activeUoms = response.data.filter((uom: any) => uom.status === 'active');
    
    const uoms: UOM[] = activeUoms.map((item: any) => ({ 
      uomId: item.uomId || item.id,
      uom: item.uom,
      status: item.status
    }));
    
    return uoms;
  } catch (error: any) {
    console.error('Error fetching UOMs from master admin:', error);
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
    
    console.log('Master Admin Tax API Response:', response.data);
    
    const activeTaxes = response.data.filter((tax: any) => tax.status === 'active');
    
    const taxes: Tax[] = activeTaxes.map((item: any) => ({ 
      taxId: item.taxId || item.id,
      taxPercentage: item.taxPercentage,
      taxName: item.taxName,
      status: item.status
    }));
    
    return taxes;
  } catch (error: any) {
    console.error('Error fetching Taxes from master admin:', error);
    throw new Error(error.response?.data?.detail || 'Failed to fetch Taxes');
  }
});

// ---------- ITEM TYPE ----------
export const fetchPurchaseItemtype = createAsyncThunk('itemtype/fetch', async () => {
  try {
    const response = await purchaseApi.get<PurchaseItemType[]>('http://192.168.1.100:8000/purchaseapi/itemtypes/', {});
    
    console.log('Item Types API Response:', response.data);
    
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
    const response = await purchaseApi.get<StorageLocationItem[]>('http://192.168.1.100:8000/purchaseapi/storagelocations/', {});
    
    console.log('Location API Response:', response.data);
    
    const locations = response.data.map((item) => ({ 
      locationId: item.locationId,
      locationName: item.locationName,
      randomId:item.randomId,
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
    const response = await purchaseApi.get('http://192.168.1.100:8000/purchaseapi/itemgroups/', {});
    
    console.log('Group Items API Response:', response.data);

    const groupitems = response.data.map((item: any) => ({
      itemgroupId: item.itemgroupId,
      itemgroupName: item.itemgroupName,
      randomId:item.randomId,
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
  const response = await purchaseApi.get<Vendor[]>('http://192.168.1.100:8000/purchaseapi/vendors/');
  const vendorData = response.data.map((item) => ({
    vendorId: item.vendorId,
    vendorName: item.vendorName,
  }));
  return vendorData;
});
// Add to purchaseItemSlice.ts

export const fetchSubcategoriesByCategory = createAsyncThunk(
  'purchaseItems/fetchSubcategoriesByCategory',
  async (categoryId: string, { rejectWithValue }) => {
    try {
      const response = await purchaseApi.get(
        `http://192.168.1.100:8000/purchaseapi/purchasecategory/${categoryId}/subcategories`
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
      const purchaseToAdd = {
        ...purchase,
      };

      console.log('Sending purchase item data:', purchaseToAdd);

      const response = await purchaseApi.post<PurchaseItem>(
        'http://192.168.1.100:8000/purchaseapi/rawMaterials/',
        purchaseToAdd,
      );

      console.log('Add purchase item response:', response.data);

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
      console.log('Using cached purchase items data');
      return data;
    } else {
      localStorage.removeItem(cacheKey);
    }
  }

  const response = await purchaseApi.get<PurchaseItemSearch[]>(
    `http://192.168.1.100:8000/purchaseapi/rawMaterials/exact-name/`,
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
    console.log('🔍 searchPurchaseItems: Fetching fresh data with stock from API', { 
      searchQuery, 
      skip, 
      limit, 
      locationId 
    });
    
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
      `http://192.168.1.100:8000/purchaseapi/rawMaterials/search-with-stock`,
      { params }
    );
    
    const items = response.data?.items || [];
    console.log(`✅ searchPurchaseItems: Received ${items.length} items`);
    
    return items;
  } catch (error) {
    console.error('❌ Error fetching purchase items:', error);
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
      const purchaseToUpdate = {
        ...purchase,
      };
      
      console.log('✏️ Updating purchase item:', purchaseToUpdate);
      console.log('🆔 Update URL:', `http://192.168.1.100:8000/purchaseapi/rawMaterials/${purchase.purchaseitemId}`);

      const response = await purchaseApi.patch<PurchaseItem>(
        `http://192.168.1.100:8000/purchaseapi/rawMaterials/${purchase.purchaseitemId}`,
        purchaseToUpdate,
      );

      console.log('✅ Update response:', response.data);

      dispatch(invalidatePurchaseItemsCache());
      dispatch(invalidatePOCache());
      return response.data;
    } catch (error: any) {
      console.error('❌ Update error:', error);
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
    console.log('🔴 Deactivating item with ID:', id);
    
    const response = await purchaseApi.patch<PurchaseItem>(
      `http://192.168.1.100:8000/purchaseapi/rawMaterials/${id}/deactivate`,
      { status: 'deactivated' },
    );

    console.log('✅ Deactivation API response:', response.data);
    return id;
  } catch (error: any) {
    console.error('❌ Deactivate error:', error);
    return rejectWithValue(error.response?.data?.detail || 'Failed to deactivate purchase item');
  }
});

// ---------- ACTIVATE ----------
export const activatePurchaseItem = createAsyncThunk('purchaseItems/activate', async (id: string, { rejectWithValue }) => {
  try {
    await purchaseApi.patch<PurchaseItem>(
      `http://192.168.1.100:8000/purchaseapi/rawMaterials/${id}/activate`,
      { status: 'active' },
    );
    return id;
  } catch (error: any) {
    console.error('Activate error:', error);
    return rejectWithValue(error.response?.data?.detail || 'Failed to activate purchase item');
  }
});

// ---------- IMPORT ----------
export const importPurchaseItems = createAsyncThunk(
  'purchaseItems/import',
  async ({ file, mode }: ImportPayload, { rejectWithValue }) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('mode', mode);

      const response = await purchaseApi.post(
        'http://192.168.1.100:8000/purchaseapi/rawMaterials/import_csv',
        formData,
      );

      return response.data as ImportResponse;
    } catch (error: any) {
      if (error.response) {
        if (error.response.status === 422) {
          const detail = error.response.data.detail || {};
          if (detail.missing?.length > 0) {
            return rejectWithValue({
              message: detail.message || 'Validation failed',
              successful: [],
              updated: [],
              failed: [
                {
                  row: 0,
                  data: {},
                  error: 'Missing required columns in CSV file',
                  missingFields: detail.missing || [],
                },
              ],
              errorCount: detail.error_count || 0,
            });
          } else {
            return rejectWithValue({
              message: detail.message || 'Validation failed',
              successful: detail.successful || [],
              updated: detail.updated || [],
              failed: detail.sample_errors || [],
              errorCount: detail.error_count || 0,
            });
          }
        }
        return rejectWithValue({
          message: error.response.data.detail?.message || error.response.data.message || 'Import failed',
          successful: [],
          updated: [],
          failed: [],
          errorCount: 0,
        });
      }
      return rejectWithValue({
        message: error.message || 'Failed to import purchase items',
        successful: [],
        updated: [],
        failed: [],
        errorCount: 0,
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
        'http://192.168.1.100:8000/purchaseapi/rawMaterials/purchaseitemexport/export_csv',
        {
          responseType: 'blob',
        }
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'purchase_items.csv');
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);

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
    },
    resetExportStatus(state) {
      state.exportStatus = 'idle';
      state.exportError = null;
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
          state.totalItems = totalItems;
        } else {
          state.items = items;
          state.totalItems = totalItems;
        }
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

      // TAX (Master Admin)
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
        state.items.push(action.payload);
        state.successMessage = 'Purchase item created successfully.';
        state.error = null;
      })
      .addCase(addPurchaseItem.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to add purchase item';
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
        state.error = action.error.message || 'Failed to update purchase item';
      })

      // DEACTIVATE
      .addCase(deactivatePurchaseItem.fulfilled, (state, action) => {
        state.loading = false;
        const itemToDeactivate = state.items.find(item => item.purchaseitemId === action.payload);
        if (itemToDeactivate) {
          const deactivatedItem = { ...itemToDeactivate, status: 'deactivated' };
          state.items = state.items.filter(item => item.purchaseitemId !== action.payload);
          state.deactivatedItems.push(deactivatedItem);
        }
        state.successMessage = 'Purchase item deactivated successfully.';
        state.error = null;
      })

      // ACTIVATE
      .addCase(activatePurchaseItem.fulfilled, (state, action) => {
        state.loading = false;
        const itemToActivate = state.deactivatedItems.find(item => item.purchaseitemId === action.payload);
        if (itemToActivate) {
          const activatedItem = { ...itemToActivate, status: 'active' };
          state.deactivatedItems = state.deactivatedItems.filter(item => item.purchaseitemId !== action.payload);
          state.items.push(activatedItem);
        }
        state.successMessage = 'Purchase item activated successfully.';
        state.error = null;
      })

      // IMPORT
      .addCase(importPurchaseItems.pending, (state) => {
        state.importStatus = 'loading';
        state.importError = null;
        state.importMessage = null;
      })
      .addCase(importPurchaseItems.fulfilled, (state, action: PayloadAction<ImportResponse>) => {
        state.importStatus = 'succeeded';
        state.importMessage = action.payload.message;
        state.importResults = {
          successful: action.payload.successful || [],
          updated: action.payload.updated || [],
          failed: action.payload.failed || [],
        };
      })
      .addCase(importPurchaseItems.rejected, (state, action) => {
        state.importStatus = 'failed';
        state.importError = action.error.message || 'Failed to import purchase items';
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
      });
  },
});

// ---------- HELPERS ----------
const containsSearchQuery = (item: PurchaseItem, searchQuery: string) => {
  const query = searchQuery.toLowerCase().trim();
  const itemName = item.itemName ? item.itemName.toLowerCase() : '';
  return itemName.includes(query);
};

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
} = purchaseItemSlice.actions;

export const selectCurrentPage = (state: RootState) => state.purchaseItems.currentPage;
export const selectPageSize = (state: RootState) => state.purchaseItems.pageSize;
export const 
selectTotalItems = (state: RootState) => state.purchaseItems.totalItems;
export const selectPurchaseItems = (state: RootState) => state.purchaseItems;

export default purchaseItemSlice.reducer;