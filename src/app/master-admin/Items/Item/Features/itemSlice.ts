import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import axios, { AxiosError } from 'axios';

import {
  Item, ApiResponse, ItemState, initialState, FetchItemsResponse, Category, subCategory,
  Branch,
  ToggleItemStatusParams,
  ToggleVarianceStatusParams,
  DeleteVarianceParams,
  SingleItemResponse,
  Variance,
  Inventory,
  OrderType,
  FetchDeactivatedItemsResponse,
  FetchDeactivatedItemsParams,
} from '../Models/itemsModels';
import {
  FetchItemsParams,
  UpdateVarianceParams, UpdateItemParams, ItemGroup, Tax, Uom,
} from '../Models/itemsModels';
import { API_BASE_URL } from '../../../../../../API_URL';


// FETCH THE ITEMGROUP

export const fetchItemGroups = createAsyncThunk<ItemGroup[]>("itemgroup/fetch", async () => {
  const response = await axios.get(`${API_BASE_URL}/itemmasters/itemGroups`);
  return response.data;
});


// FETCH THE CAT AND SUBCAT

export const fetchCategories = createAsyncThunk<
  { categories: Category[]; subcategories: subCategory[] },
  void
>('categories/fetch', async () => {
  const response = await axios.get<Category[]>(`${API_BASE_URL}/itemmasters/category`);
  const categories = response.data;
  const uniqueSubcategories = Array.from(
    new Set(categories.flatMap((cat) => cat.subCategory))
  ).map((sub) => ({ subCategoryName: sub }));
  return { categories, subcategories: uniqueSubcategories };
});


//Fetch All Taxes
export const fetchtaxs = createAsyncThunk<Tax[]>("taxes/fetch", async () => {
  const response = await axios.get(`${API_BASE_URL}/itemmasters/taxs`);
  return response.data;
});


//Fetch All Uoms
export const fetchUoms = createAsyncThunk<Uom[]>("uomss/fetch", async () => {
  const response = await axios.get(`${API_BASE_URL}/itemmasters/uoms`);
  return response.data;
});


// FETCH TEH BRANCHES
export const fetchBranches = createAsyncThunk<Branch[]>("branchs/fetchBranches", async () => {
  const response = await axios.get(`${API_BASE_URL}/itemmasters/branches`);
  return response.data;
});


// FETCH THE INVENTORY TYPES
export const fetchInventory = createAsyncThunk<Inventory[]>("inventory/fetchInventory", async () => {
  const response = await axios.get(`${API_BASE_URL}/itemmasters/inventoryTypes`);
  return response.data;
});



// FETCH THE ORDER TYPES
export const fetchOrderType = createAsyncThunk<OrderType[]>("orderTypes/fetchOrderTypes", async () => {
  const response = await axios.get(`${API_BASE_URL}/locations/orderTypes`);
  return response.data;
});


//// Export The Data
// Export CSV
export const Exportitem = createAsyncThunk<void, void>(
  "Exportitem/fetch",
  async (_, { dispatch }) => {
    try {
      // get date & time
      const { data: dateTime } = await axios.get(
        "https://yenerp.com/liveapi/datetime"
      );

      const date = dateTime.current_date; // 23-01-2026
      const time = dateTime.current_time.replace(/[: ]/g, "-"); // 10-48-AM

      const fileName = `Item Master_Export_${date}_${time}.csv`;

      // export csv
      const response = await axios.get(
        `${API_BASE_URL}/itemmasters/export/`,
        { responseType: "blob" }
      );

      const blob = new Blob([response.data], {
        type: "text/csv;charset=utf-8;",
      });

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");

      link.href = url;
      link.setAttribute("download", fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();

      window.URL.revokeObjectURL(url);

      dispatch(setSnackbarOpen(true));
      dispatch(
        setSnackbarMessage("Item Master data exported successfully")
      );
    } catch (error: unknown) {
      const err = error as AxiosError;
      dispatch(setSnackbarOpen(true));
      dispatch(setSnackbarMessage("Failed to export Item Master data"));
      throw err;
    }
  }
);




export const Exportheader = createAsyncThunk<void, void>(
  "Exportheader/fetch",
  async (_, { dispatch }) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/itemmasters/export-csv-headers/`, {
        responseType: "blob",
      });

      const fileName = `Item_Master_Header_Export.xlsx`;
      const fileType = "text/csv;charset=utf-8;";

      const blob = new Blob([response.data], { type: fileType });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");

      link.href = url;
      link.setAttribute("download", fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();

      window.URL.revokeObjectURL(url);

      dispatch(setSnackbarOpen(true));
      dispatch(setSnackbarMessage("Item master Header exported successfully"));
    } catch (error: unknown) {
      const err = error as AxiosError;
      dispatch(setSnackbarOpen(true));
      dispatch(setSnackbarMessage("Failed to export Item Master Header"));
      throw err;
    }
  }
);



// Thunk to fetch single item by branchwiseItemId
export const fetchItemById = createAsyncThunk<
  Item, // Return type is Item, not SingleItemResponse
  string,
  { rejectValue: string }
>(
  'items/fetchItemById',
  async (branchwiseItemId, { rejectWithValue }) => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/itemmasters/getbyid/${branchwiseItemId}`
      );

      const data: SingleItemResponse = response.data;
      //  console.log('Raw API response:', data);

      // Transform variance object to array
      const variancesArray: Variance[] = [];
      if (data.variance) {
        Object.entries(data.variance).forEach(([key, value]) => {
          variancesArray.push({
            itemType: value.itemType,
            itemCode: value.itemCode,
            varianceName: value.varianceName,
            variance_Defaultprice: value.variance_Defaultprice,
            variance_Uom: value.variance_Uom,
            shelfLife: value.shelfLife,
            reorderLevel: value.reorderLevel,
            sapCode: value.sapCode || '',
            birthdayCake: false,
            uniqueQr: false,
            varianceStatus: value.varianceStatus,
            createdDate: value.createdDate ?? null,
            varianceImage: value.varianceImage,
            branchwise: value.branchwise,
          });
        });
      }

      // Transform SingleItemResponse to Item
      const transformedItem: Item = {
        branchwiseItemId: data.item.branchwiseItemId,
        itemType: data.item.itemType,
        itemName: data.item.itemName,
        category: data.item.category,
        subCategory: data.item.subcategory,
        itemGroup: data.item.itemGroup,
        uom: data.item.itemUom,
        item_Uom: data.item.itemUom,
        tax: parseFloat(data.item.tax) || 0,
        item_Defaultprice: data.item.itemDefaultprice,
        description: data.item.description,
        hsnCode: data.item.hsnCode,
        birthdayCake: data.item.birthdayCake,
        uniqueQr: data.item.uniqueQr,
        stockValidation: data.item.stockValidation,
        //  plateItem: data.item.plateItem,
        includeTax: data.item.includeTax,
        excludeTax: data.item.excludeTax,
        netprice: data.item.netPrice,
        taxPrice: data.item.taxPrice,
        finalPrice: data.item.finalPrice,
        itemImage: data.item.itemImage,
        status: data.item.status,
        variances: variancesArray,
        orderTypes: [],
        measurementType: '',
      };

      //  console.log('Transformed item to return:', transformedItem);
      //  console.log('Variances array:', variancesArray);

      return transformedItem; // Make sure you're returning transformedItem, not data
    } catch (error: any) {
      console.error('Error fetching item by ID:', error);
      const errorMessage =
        error.response?.data?.detail ||
          error.response?.status === 404
          ? 'Item not found'
          : 'Failed to fetch item details';
      return rejectWithValue(errorMessage);
    }
  }
);






// // Define a thunk to fetch items from the API
export const fetchItems = createAsyncThunk<
  FetchItemsResponse,
  FetchItemsParams,
  { rejectValue: string }
>(
  'items/fetchItems',
  async ({ page, limit, itemName }, { rejectWithValue }) => {
    try {
      const params: Record<string, any> = { page, limit };
      if (itemName?.trim()) params.search = itemName.trim(); // <-- use `search`

      const { data } = await axios.get<ApiResponse>(
        `${API_BASE_URL}/itemmasters/get-all-data/`,
        { params }
      );

      const { data: raw, total_pages } = data;

      const itemsArray: Item[] = Object.entries(raw).map(([key, value]) => {
        const item = value.item;
        const variance = value.variance ?? {};

        return {
          ...item,
          _id: item.branchwiseItemId ?? item._id,
          branchwiseItemId: item.branchwiseItemId ?? item._id,
          itemId: item.branchwiseItemId ?? item._id,
          //  itemId: item.itemId ?? item.branchwiseItemId ?? item._id,
          itemName: item.itemName ?? key,
          variances: Object.entries(variance).map(([vKey, vInfo]) => ({
            itemCode: vInfo.itemCode,
            varianceName: vInfo.varianceName ?? vKey,
            variance_Defaultprice: vInfo.variance_Defaultprice,
            variance_Uom: vInfo.variance_Uom,
            shelfLife: vInfo.shelfLife,
            reorderLevel: vInfo.reorderLevel,
            sapCode: vInfo.sapCode,
            varianceStatus: vInfo.varianceStatus,
            createdDate: vInfo.createdDate,
            updatedDate: vInfo.updatedDate,
            varianceImage: vInfo.varianceImage,
            branchwise: vInfo.branchwise ?? {},
          })),
        };
      });

      //   console.log("fetch Items:", data);


      return { items: itemsArray, totalPages: total_pages };
    } catch (err) {
      return rejectWithValue('Failed to load items');
    }
  },
);



export const fetchDeactivatedItems = createAsyncThunk<
  FetchDeactivatedItemsResponse,
  FetchDeactivatedItemsParams,
  { rejectValue: string }
>(
  'items/fetchDeactivatedItems',
  async ({ page, limit, itemName }, { rejectWithValue }) => {
    try {
      const params: Record<string, any> = { page, limit };
      if (itemName?.trim()) params.search = itemName.trim();

      const { data } = await axios.get(
        `${API_BASE_URL}/itemmasters/get-deactivated/`,
        { params }
      );

      const itemsArray: Item[] = data.data.map((entry: any) => {
        const item = entry.item;
        const variances = entry.variances ?? [];

        return {
          ...item,
          _id: item.branchwiseItemId,
          branchwiseItemId: item.branchwiseItemId,
          itemId: item.branchwiseItemId,
          itemName: item.itemName,
          variances: variances.map((v: any) => ({
            itemCode: v.itemCode,
            varianceName: v.varianceName,
            variance_Defaultprice: v.variance_Defaultprice,
            variance_Uom: v.variance_Uom,
            shelfLife: v.shelfLife,
            reorderLevel: v.reorderLevel,
            sapCode: v.sapCode,
            varianceStatus: v.varianceStatus,
            branchwise: v.branchwise ?? {},
          })),
        };
      });

      return { items: itemsArray, totalPages: data.total_pages };
    } catch (err) {
      return rejectWithValue('Failed to load deactivated items');
    }
  }
);



// Define a thunk to delete a variance by itemCode
export const deleteVariance = createAsyncThunk<
  void,
  DeleteVarianceParams,
  { rejectValue: string }
>(
  'items/deleteVariance',
  async ({ itemCode, page, limit, itemName }, { dispatch, rejectWithValue }) => {
    try {
      //    console.log('Attempting to delete variance with code:', itemCode);

      const response = await axios.delete(
        `${API_BASE_URL}/itemmasters/delete-variance/${encodeURIComponent(itemCode)}`
      );

      //   console.log('Delete variance response:', response.data);

      // After successful deletion, refresh the item list
      await dispatch(fetchItems({ page, limit, itemName }));
      return;
    } catch (error: any) {
      console.error('Error deleting variance:', error);

      // Enhanced error handling
      let errorMessage = 'Failed to delete variance';

      if (error.response) {
        // Server responded with error status
        const status = error.response.status;
        const detail = error.response.data?.detail;

        if (status === 404) {
          errorMessage = `Variance with code "${itemCode}" not found. It may have been already deleted or the code is incorrect.`;
        } else if (status === 400) {
          errorMessage = detail || 'Invalid variance item code provided.';
        } else if (detail) {
          errorMessage = detail;
        } else {
          errorMessage = `Server error: ${status}`;
        }
      } else if (error.request) {
        // Network error
        errorMessage = 'Network error: Could not connect to server';
      }

      return rejectWithValue(errorMessage);
    }
  }
);



// Define a thunk to activate an item by branchwiseItemId
export const activateItem = createAsyncThunk<
  void,
  ToggleItemStatusParams,
  { rejectValue: string }
>(
  'items/activateItem',
  async ({ branchwiseItemId, page, limit, itemName }, { dispatch, rejectWithValue }) => {
    try {
      const response = await axios.patch(
        `${API_BASE_URL}/itemmasters/activate-item/${branchwiseItemId}`
      );
      // After successful activation, refresh the item list
      //  await dispatch(fetchItems({ page, limit, itemName }));
      await dispatch(fetchDeactivatedItems({ page, limit, itemName }));
      return;
    } catch (error: any) {
      console.error('Error activating item:', error);
      const errorMessage = error.response?.data?.detail || 'Failed to activate item';
      return rejectWithValue(errorMessage);
    }
  }
);

// Define a thunk to deactivate an item by branchwiseItemId
export const deactivateItem = createAsyncThunk<
  void,
  ToggleItemStatusParams,
  { rejectValue: string }
>(
  'items/deactivateItem',
  async ({ branchwiseItemId, page, limit, itemName }, { dispatch, rejectWithValue }) => {
    try {
      const response = await axios.patch(
        `${API_BASE_URL}/itemmasters/deactivate-item/${branchwiseItemId}`
      );
      // After successful deactivation, refresh the item list
      await dispatch(fetchItems({ page, limit, itemName }));
      return;
    } catch (error: any) {
      console.error('Error deactivating item:', error);
      const errorMessage = error.response?.data?.detail || 'Failed to deactivate item';
      return rejectWithValue(errorMessage);
    }
  }
);






// Define a thunk to activate a variance by itemCode
export const activateVariance = createAsyncThunk<
  void,
  ToggleVarianceStatusParams,
  { rejectValue: string }
>(
  'items/activateVariance',
  async ({ itemCode, page, limit, itemName }, { dispatch, rejectWithValue }) => {
    try {
      //  console.log('Attempting to activate variance with code:', itemCode);

      const response = await axios.patch(
        `${API_BASE_URL}/itemmasters/activate-variance/${encodeURIComponent(itemCode)}`
      );

      //  console.log('Activate variance response:', response.data);

      // After successful activation, refresh the item list
      await dispatch(fetchDeactivatedItems({ page, limit, itemName }));
      return;
    } catch (error: any) {
      console.error('Error activating variance:', error);

      let errorMessage = 'Failed to activate variance';

      if (error.response) {
        const status = error.response.status;
        const detail = error.response.data?.detail;

        if (status === 404) {
          errorMessage = `Variance with code "${itemCode}" not found.`;
        } else if (status === 400) {
          errorMessage = detail || 'Invalid variance item code provided.';
        } else if (detail) {
          errorMessage = detail;
        } else {
          errorMessage = `Server error: ${status}`;
        }
      } else if (error.request) {
        errorMessage = 'Network error: Could not connect to server';
      }

      return rejectWithValue(errorMessage);
    }
  }
);

// Define a thunk to deactivate a variance by itemCode
export const deactivateVariance = createAsyncThunk<
  void,
  ToggleVarianceStatusParams,
  { rejectValue: string }
>(
  'items/deactivateVariance',
  async ({ itemCode, page, limit, itemName }, { dispatch, rejectWithValue }) => {
    try {
      //    console.log('Attempting to deactivate variance with code:', itemCode);

      const response = await axios.patch(
        `${API_BASE_URL}/itemmasters/deactivate-variance/${encodeURIComponent(itemCode)}`
      );

      //  console.log('Deactivate variance response:', response.data);

      // After successful deactivation, refresh the item list
      await dispatch(fetchItems({ page, limit, itemName }));
      return;
    } catch (error: any) {
      console.error('Error deactivating variance:', error);

      let errorMessage = 'Failed to deactivate variance';

      if (error.response) {
        const status = error.response.status;
        const detail = error.response.data?.detail;

        if (status === 404) {
          errorMessage = `Variance with code "${itemCode}" not found.`;
        } else if (status === 400) {
          errorMessage = detail || 'Invalid variance item code provided.';
        } else if (detail) {
          errorMessage = detail;
        } else {
          errorMessage = `Server error: ${status}`;
        }
      } else if (error.request) {
        errorMessage = 'Network error: Could not connect to server';
      }

      return rejectWithValue(errorMessage);
    }
  }
);


export const updateVariance = createAsyncThunk<
  void,
  UpdateVarianceParams,
  { rejectValue: string }
>(
  'items/updateVariance',
  async ({ itemCode, updates, page, limit, itemName }, { dispatch, rejectWithValue }) => {
    try {
      //  console.log('Attempting to update variance with code:', itemCode, 'Updates:', updates);

      const response = await axios.patch(
        `${API_BASE_URL}/itemmasters/update-variance/${encodeURIComponent(itemCode)}`,
        { updates }
      );

      //  console.log('Update variance response:', response.data);

      //  await dispatch(fetchItems({ page, limit, itemName }));
      return;
    } catch (error: any) {
      console.error('Error updating variance:', error);
      const errorMessage = error.response?.data?.detail || 'Failed to update variance';
      return rejectWithValue(errorMessage);
    }
  }
);


export const updateItem = createAsyncThunk<
  void,
  UpdateItemParams,
  { rejectValue: string }
>(
  'items/updateItem',
  async ({ branchwiseItemId, updates, page, limit, itemName }, { dispatch, rejectWithValue }) => {
    try {
      //  console.log('Updating item:', { branchwiseItemId, updates });
      await axios.patch(
        `${API_BASE_URL}/itemmasters/update-item-by-id/${branchwiseItemId}`,
        { updates }
      );
      await dispatch(fetchItems({ page, limit, itemName }));
      return;
    } catch (error: any) {
      console.error('Error updating item:', error);
      const errorMessage = error.response?.data?.detail || 'Failed to update item';
      return rejectWithValue(errorMessage);
    }
  }
);





// Upload image for a specific branchwiseItem
export const uploadItemImage = createAsyncThunk<
  { s3_path: string; message: string },
  { branchwiseItemId: string; file: File; page: number; limit: number; itemName?: string },
  { rejectValue: string }
>(
  'items/uploadItemImage',
  async ({ branchwiseItemId, file, page, limit, itemName }, { dispatch, rejectWithValue }) => {
    try {
      const formData = new FormData();
      formData.append('file', file); // 'file' matches the backend UploadFile parameter name

      const response = await axios.post(
        `${API_BASE_URL}/itemmasters/upload_image/${branchwiseItemId}`, // Adjust base URL if you have axios instance
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      // Optionally refresh the item list to show updated image (if your fetchItems includes image info)
      dispatch(fetchItems({ page, limit, itemName: itemName ?? '' }));

      return response.data; // { message, s3_path }
    } catch (error: any) {
      console.error('Error uploading image:', error);

      let errorMessage = 'Failed to upload image';

      if (error.response) {
        const status = error.response.status;
        const detail = error.response.data?.detail;

        if (status === 400) {
          errorMessage = detail || 'Invalid item ID or file';
        } else if (status === 404) {
          errorMessage = 'Item not found';
        } else if (status === 500) {
          errorMessage = detail || 'Server error while uploading image';
        } else if (detail) {
          errorMessage = detail;
        }
      } else if (error.request) {
        errorMessage = 'Network error: Unable to reach server';
      }

      return rejectWithValue(errorMessage);
    }
  }
);



// Update existing image for a specific branchwiseItem (PATCH)
export const updateItemImage = createAsyncThunk<
  {
    s3_path: string;
    message: string;
    itemImage: string;
    branchwiseItemId: string;
    itemName?: string;
    itemCode?: string;
  },
  { branchwiseItemId: string; file: File },
  { rejectValue: string }
>(
  'items/updateItemImage',
  async ({ branchwiseItemId, file }, { rejectWithValue }) => {
    try {
      const formData = new FormData();
      formData.append('file', file);

      // Using PATCH method to update existing image
      const response = await axios.patch(
        `${API_BASE_URL}/itemmasters/patch_image/${branchwiseItemId}`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      return response.data;
    } catch (error: any) {
      console.error('Error updating image:', error);

      let errorMessage = 'Failed to update image';

      if (error.response) {
        const status = error.response.status;
        const detail = error.response.data?.detail;

        if (status === 400) {
          errorMessage = detail || 'Invalid item ID or file';
        } else if (status === 404) {
          errorMessage = detail || 'Image not found. Please upload first.';
        } else if (status === 500) {
          errorMessage = detail || 'Server error while updating image';
        } else if (detail) {
          errorMessage = detail;
        }
      } else if (error.request) {
        errorMessage = 'Network error: Unable to reach server';
      } else {
        errorMessage = error.message || 'Unknown error occurred';
      }

      return rejectWithValue(errorMessage);
    }
  }
);




// Bulk upload images via ZIP file (matches your backend /upload_images_zip)
export const uploadImagesZip = createAsyncThunk<
  { message: string; uploaded_images: any[]; failed_images: any[] },
  { file: File },
  { rejectValue: string }
>(
  'items/uploadImagesZip',
  async ({ file }, { dispatch, rejectWithValue }) => {
    try {
      // Validate file is ZIP
      if (!file.name.toLowerCase().endsWith('.zip')) {
        return rejectWithValue('Please upload a valid ZIP file (.zip)');
      }

      const formData = new FormData();
      formData.append('zip_file', file);

      const response = await axios.post(
        `${API_BASE_URL}/itemmasters/upload_images_zip`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          timeout: 300000, // 5 minutes timeout for large ZIPs
        }
      );

      // After successful upload, refresh items to reflect new images
      dispatch(fetchItems({ page: 1, limit: 15 }));

      return response.data;
    } catch (error: any) {
      console.error('Error uploading images ZIP:', error);

      let errorMessage = 'Failed to upload images';

      if (error.response?.data) {
        const data = error.response.data;
        if (data.message) {
          errorMessage = data.message;
        }
        if (data.failed_images?.length > 0) {
          errorMessage += `\nFailed: ${data.failed_images.length} image(s)`;
        }
      } else if (error.code === 'ECONNABORTED') {
        errorMessage = 'Upload timed out. Try with a smaller ZIP file.';
      } else if (error.message) {
        errorMessage = error.message;
      }

      return rejectWithValue(errorMessage);
    }
  }
);




// // FETCH VARIANCES MASTER (for combo)
// export const fetchVariancesMaster = createAsyncThunk<
//   { items: any[]; total: number; pages: number },
//   { page?: number; limit?: number; search?: string },
//   { rejectValue: string }
// >(
//   'items/fetchVariancesMaster',
//   async ({ page = 1, limit = 50, search }, { rejectWithValue }) => {
//     try {
//       const params: Record<string, any> = { page, limit };
//       if (search?.trim()) params.search = search.trim();

//       const response = await axios.get(
//         `${API_BASE_URL}/itemmasters/variances/master`,
//         { params }
//       );
//       return response.data;
//     } catch (error: any) {
//       const errorMessage =
//         error.response?.data?.detail || 'Failed to fetch variances master';
//       return rejectWithValue(errorMessage);
//     }
//   }
// );





// FETCH ITEM NAMES DROPDOWN (Stage 1)
export const fetchItemNamesDropdown = createAsyncThunk<
  string[],
  void,
  { rejectValue: string }
>(
  'items/fetchItemNamesDropdown',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/itemmasters/variances/master`,
        { params: { dropdown: true } }
      );
      return response.data.itemNames ?? [];
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.detail || 'Failed to fetch item names');
    }
  }
);

// FETCH VARIANCES BY ITEM NAME (Stage 2)
export const fetchVariancesByItemName = createAsyncThunk<
  { items: any[]; total: number; pages: number },
  { item_name: string; page?: number; limit?: number },
  { rejectValue: string }
>(
  'items/fetchVariancesByItemName',
  async ({ item_name, page = 1, limit = 100 }, { rejectWithValue }) => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/itemmasters/variances/master`,
        { params: { item_name, page, limit } }
      );
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.detail || 'Failed to fetch variances');
    }
  }
);




export const uploadVarianceImage = createAsyncThunk<
  { s3_path: string; message: string; varianceImage: string },
  { itemCode: string; file: File },
  { rejectValue: string }
>('items/uploadVarianceImage', async ({ itemCode, file }, { rejectWithValue }) => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    const response = await axios.post(
      `${API_BASE_URL}/itemmasters/upload_variance_image/${itemCode}`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );
    return response.data;
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.detail || 'Failed to upload variance image');
  }
});

export const updateVarianceImage = createAsyncThunk<
  { s3_path: string; message: string; varianceImage: string },
  { itemCode: string; file: File },
  { rejectValue: string }
>('items/updateVarianceImage', async ({ itemCode, file }, { rejectWithValue }) => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    const response = await axios.patch(
      `${API_BASE_URL}/itemmasters/patch_variance_image/${itemCode}`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );
    return response.data;
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.detail || 'Failed to update variance image');
  }
});



// Bulk upload VARIANCE images via ZIP file (matches backend /upload_variance_images_zip)
export const uploadVarianceImagesZip = createAsyncThunk<
  { message: string; uploaded_images: any[]; failed_images: any[] },
  { file: File },
  { rejectValue: string }
>(
  'items/uploadVarianceImagesZip',
  async ({ file }, { dispatch, rejectWithValue }) => {
    try {
      if (!file.name.toLowerCase().endsWith('.zip')) {
        return rejectWithValue('Please upload a valid ZIP file (.zip)');
      }

      const formData = new FormData();
      formData.append('zip_file', file);

      const response = await axios.post(
        `${API_BASE_URL}/itemmasters/upload_variance_images_zip`,
        formData,
        {
          headers: { 'Content-Type': 'multipart/form-data' },
          timeout: 300000,
        }
      );

      dispatch(fetchItems({ page: 1, limit: 15 }));

      return response.data;
    } catch (error: any) {
      console.error('Error uploading variance images ZIP:', error);
      let errorMessage = 'Failed to upload variance images';

      if (error.response?.data) {
        const data = error.response.data;
        if (data.message) errorMessage = data.message;
        if (data.failed_images?.length > 0) {
          errorMessage += `\nFailed: ${data.failed_images.length} image(s)`;
        }
      } else if (error.code === 'ECONNABORTED') {
        errorMessage = 'Upload timed out. Try with a smaller ZIP file.';
      } else if (error.message) {
        errorMessage = error.message;
      }

      return rejectWithValue(errorMessage);
    }
  }
);


const itemsSlice = createSlice({
  name: 'items',
  initialState,
  reducers: {

    setSnackbarOpen: (state, action: PayloadAction<boolean>) => {
      state.snackbarOpen = action.payload;
    },
    setSnackbarMessage: (state, action: PayloadAction<string>) => {
      state.snackbarMessage = action.payload;
    },
    setCurrentPage(state, action: PayloadAction<number>) {
      state.currentPage = action.payload;
    },

    setShowDeactivated: (state, action: PayloadAction<boolean>) => {
      state.showDeactivated = action.payload;
    },
    clearError(state) {
      state.error = null;
    },
    resetItems(state) {
      state.items = [];
      state.currentPage = 1;
      state.totalPages = 1;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder



      .addCase(fetchOrderType.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchOrderType.fulfilled, (state, action) => {
        state.loading = false;
        state.orderTypes = action.payload;
        state.error = null;
      })
      .addCase(fetchOrderType.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch OrderTypes';
      })

      .addCase(fetchItemGroups.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchItemGroups.fulfilled, (state, action) => {
        state.loading = false;
        state.itemGroups = action.payload; // Store fetched item groups
        state.error = null;
      })
      .addCase(fetchItemGroups.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch item groups';
      })

      .addCase(fetchCategories.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCategories.fulfilled, (state, action) => {
        state.loading = false;
        state.categories = action.payload.categories;
        state.subcategories = action.payload.subcategories;
        state.error = null;
      })
      .addCase(fetchCategories.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch categories';
      })



      .addCase(fetchtaxs.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchtaxs.fulfilled, (state, action) => {
        state.loading = false;
        state.taxes = action.payload; // Store fetched item groups
        state.error = null;
      })
      .addCase(fetchtaxs.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch taxes';
      })




      .addCase(fetchUoms.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUoms.fulfilled, (state, action) => {
        state.loading = false;
        state.uoms = action.payload; // Store fetched item groups
        state.error = null;
      })
      .addCase(fetchUoms.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch uoms';
      })



      .addCase(fetchBranches.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchBranches.fulfilled, (state, action) => {
        state.loading = false;
        state.branchess = action.payload;
        state.error = null;
      })
      .addCase(fetchBranches.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch branches';
      })


      .addCase(fetchInventory.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchInventory.fulfilled, (state, action) => {
        state.loading = false;
        state.inventory = action.payload; // Store fetched item groups
        state.error = null;
      })
      .addCase(fetchInventory.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch inventory';
      })

      // Export CSV
      .addCase(Exportitem.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(Exportitem.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(Exportitem.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message ?? "Failed to export BranchWise Item data";
      })



      //// Export The Header
      .addCase(Exportheader.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(Exportheader.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(Exportheader.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message ?? "Failed to export BranchWise Item Header";
      })




      // Fetch Item by ID
      .addCase(fetchItemById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchItemById.fulfilled, (state, action) => {
        state.loading = false;
        // state.currentItem = action.payload; // assuming you add currentItem?: SingleItemResponse to ItemState
        state.error = null;
      })
      .addCase(fetchItemById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to fetch item by ID';
      })



      .addCase(fetchItems.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchItems.fulfilled, (state, action: PayloadAction<FetchItemsResponse>) => {
        state.loading = false;
        state.items = action.payload.items;
        state.totalPages = action.payload.totalPages;
        state.error = null;
      })
      .addCase(fetchItems.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || '';
      })


      .addCase(fetchDeactivatedItems.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDeactivatedItems.fulfilled, (state, action) => {
        state.loading = false;
        state.deactivatedItems = action.payload.items;
        state.deactivatedTotalPages = action.payload.totalPages;
        state.error = null;
      })
      .addCase(fetchDeactivatedItems.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to load deactivated items';
      })

      // Activate Item
      .addCase(activateItem.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(activateItem.fulfilled, (state) => {
        state.loading = false;
        state.error = null;
      })
      .addCase(activateItem.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to activate item';
      })
      // Deactivate Item
      .addCase(deactivateItem.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deactivateItem.fulfilled, (state) => {
        state.loading = false;
        state.error = null;
      })
      .addCase(deactivateItem.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to deactivate item';
      })
      // Activate Variance
      .addCase(activateVariance.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(activateVariance.fulfilled, (state) => {
        state.loading = false;
        state.error = null;
      })
      .addCase(activateVariance.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to activate variance';
      })
      // Deactivate Variance
      .addCase(deactivateVariance.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deactivateVariance.fulfilled, (state) => {
        state.loading = false;
        state.error = null;
      })
      .addCase(deactivateVariance.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to deactivate variance';
      })




      .addCase(updateVariance.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateVariance.fulfilled, (state) => {
        state.loading = false;
        state.error = null;
      })
      .addCase(updateVariance.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to update variance';
      })
      .addCase(updateItem.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateItem.fulfilled, (state) => {
        state.loading = false;
        state.error = null;
      })
      .addCase(updateItem.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to update item';
      })



      // Upload Item Image
      .addCase(uploadItemImage.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(uploadItemImage.fulfilled, (state, action) => {
        state.loading = false;
        state.error = null;
        // Optionally store the s3_path somewhere if needed
        // state.lastUploadedImagePath = action.payload.s3_path;
      })
      .addCase(uploadItemImage.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to upload image';
      })


      // Update Item Image
      .addCase(updateItemImage.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateItemImage.fulfilled, (state, action) => {
        state.loading = false;
        state.error = null;
        // Optionally store the s3_path somewhere if needed
        // state.lastUploadedImagePath = action.payload.s3_path;
      })
      .addCase(updateItemImage.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to upload image';
      })




      .addCase(uploadImagesZip.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(uploadImagesZip.fulfilled, (state, action) => {
        state.loading = false;
        const { uploaded_images, failed_images } = action.payload;
        let msg = action.payload.message;
        if (failed_images.length > 0) {
          msg += ` | Failed: ${failed_images.length}`;
        }
        state.snackbarMessage = msg;
        state.snackbarOpen = true;
      })
      .addCase(uploadImagesZip.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to upload images ZIP';
        state.snackbarMessage = state.error;
        state.snackbarOpen = true;
      })



      // // Fetch Variances Master
      // .addCase(fetchVariancesMaster.pending, (state) => {
      //   state.loading = true;
      //   state.error = null;
      // })
      // .addCase(fetchVariancesMaster.fulfilled, (state, action) => {
      //   state.loading = false;
      //   state.variancesMaster = action.payload.items;
      //   state.error = null;
      // })
      // .addCase(fetchVariancesMaster.rejected, (state, action) => {
      //   state.loading = false;
      //   state.error = action.payload || 'Failed to fetch variances master';
      // });



      .addCase(fetchItemNamesDropdown.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchItemNamesDropdown.fulfilled, (state, action) => {
        state.loading = false;
        state.itemNamesDropdown = action.payload;
      })
      .addCase(fetchItemNamesDropdown.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to fetch item names';
      })
      .addCase(fetchVariancesByItemName.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchVariancesByItemName.fulfilled, (state, action) => {
        state.loading = false;
        state.variancesByItemName = action.payload.items;
      })
      .addCase(fetchVariancesByItemName.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to fetch variances';
      })

      .addCase(uploadVarianceImage.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(uploadVarianceImage.fulfilled, (state) => { state.loading = false; state.error = null; })
      .addCase(uploadVarianceImage.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to upload variance image';
      })
      .addCase(updateVarianceImage.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(updateVarianceImage.fulfilled, (state) => { state.loading = false; state.error = null; })
      .addCase(updateVarianceImage.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to update variance image';
      })



      .addCase(uploadVarianceImagesZip.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(uploadVarianceImagesZip.fulfilled, (state, action) => {
        state.loading = false;
        const { uploaded_images, failed_images } = action.payload;
        let msg = action.payload.message;
        if (failed_images.length > 0) {
          msg += ` | Failed: ${failed_images.length}`;
        }
        state.snackbarMessage = msg;
        state.snackbarOpen = true;
      })
      .addCase(uploadVarianceImagesZip.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to upload variance images ZIP';
        state.snackbarMessage = state.error;
        state.snackbarOpen = true;
      });

  },
});

export const {
  setCurrentPage,
  clearError,
  resetItems,
  setSnackbarOpen,
  setSnackbarMessage,
  setShowDeactivated,
} = itemsSlice.actions;
export default itemsSlice.reducer;

// Export types for use in components
export type { ItemState, FetchItemsParams, FetchItemsResponse };