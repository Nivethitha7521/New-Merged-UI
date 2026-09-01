


import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import axios, { AxiosError } from "axios";
import { RootState } from "../../../../../../redux/store";


import {
  BranchwiseItem, BranchwiseItemSub, BranchwiseItemS, BranchwiseItems,
  dynamicData, partnerPost, onlinePartners,
  OnlinePartnerTemplate, initialState,
  ImportResponse
} from "../Models/templateModels";
import { API_BASE_URL } from "../../../../../../../API_URL";

// API URLs
const DYNAMIC_API = `${API_BASE_URL}/OnlinePartnerTemplate`;
const PARTNER_API_URL = `${API_BASE_URL}/OnlinePartner`;
const OnlinePartnerTemplate_API_URL = `${API_BASE_URL}/OnlinePartnerTemplate/`;
const CATEGORY_API_URL = `${API_BASE_URL}/itemmasters/categories/`;
const SUBCATEGORY_API_URL = `${API_BASE_URL}/itemmasters/subcategories`;
const ITEM_API_URL = `${API_BASE_URL}/itemmasters/items`;
const IMPORT_API_URL = `${API_BASE_URL}/OnlinePartnerTemplate/import`;
const EXPORT_API_URL = `${API_BASE_URL}/OnlinePartnerTemplate/export`;
const DYNAMIC_IMPORT_API_URL = `${API_BASE_URL}/OnlinePartner/import`;
const DYNAMIC_EXPORT_API_URL = `${API_BASE_URL}/OnlinePartner/export`;
const VARIANCE_API_URL = `${API_BASE_URL}/itemmasters/item`;




// Fetch DropDown UI   
export const fetchPartner = createAsyncThunk<onlinePartners[]>("onlinepartners/fetch", async () => {
  const response = await axios.get(PARTNER_API_URL);
  return response.data;
});

// interfaces.ts
export interface DeleteResponse {
  message: string;
  deletedCount: number;
}

/// deleteTemplateThunk
export const deleteTemplate = createAsyncThunk<
  DeleteResponse,
  string,
  { rejectValue: string }
>(
  "OnlinePartnerTemplate/delete",
  async (id, { rejectWithValue }) => {
    try {
      const url = `${OnlinePartnerTemplate_API_URL}${id}`;
      const response = await axios.delete(url);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || "Failed to delete template");
    }
  }
);




export const deleteMultipleTemplates = createAsyncThunk<
  { success: boolean; deleted_count: number; deleted_ids: string[] },
  { onlinePartnerTemplateId: string; ids: string[] },
  { rejectValue: string }
>(
  "OnlinePartnerTemplate/deleteMultiple",
  async ({ onlinePartnerTemplateId, ids }, { rejectWithValue }) => {
    try {
      const response = await axios.delete(
        `${OnlinePartnerTemplate_API_URL}${onlinePartnerTemplateId}/bulk-delete`,
        {
          data: { template_ids: ids }, // backend expects 'template_ids'
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
      return response.data;
    } catch (error: any) {
      if (error.response?.data?.detail) {
        return rejectWithValue(error.response.data.detail);
      }
      return rejectWithValue(error.message || "Failed to delete templates");
    }
  }
);

// Delete Single Dynamic Data
export const deleteDynamicData = createAsyncThunk<
  { success: boolean; message: string },
  { partnerName: string; dataId: string },
  { rejectValue: string }
>(
  "DynamicCollection/delete",
  async ({ partnerName, dataId }, { rejectWithValue }) => {
    try {
      const url = `${PARTNER_API_URL}/${encodeURIComponent(partnerName)}/collection-data/${dataId}`;
      const response = await axios.delete(url);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.detail || "Failed to delete data");
    }
  }
);

// Delete Multiple Dynamic Data
export const deleteMultipleDynamicData = createAsyncThunk<
  { success: boolean; deleted_count: number; deleted_ids: string[] },
  { partnerName: string; ids: string[] },
  { rejectValue: string }
>(
  "DynamicCollection/deleteMultiple",
  async ({ partnerName, ids }, { rejectWithValue }) => {
    try {
      const url = `${PARTNER_API_URL}/${encodeURIComponent(partnerName)}/${ids[0]}/bulk-delete`;
      const response = await axios.delete(url, {
        data: { template_ids: ids },
        headers: {
          'Content-Type': 'application/json',
        },
      });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.detail || "Failed to delete multiple dynamic data");
    }
  }
);


interface FetchDynamicArgs {
  search: string;
  partnerName: string;
}

export const fetchDynamicData = createAsyncThunk<dynamicData[], FetchDynamicArgs>(
  "OnlinePartnerTemplate/fetch",
  async ({ partnerName, search = "" }) => {
    const url = `${PARTNER_API_URL}/${partnerName}/collection-data?search=${encodeURIComponent(search)}`;
    const response = await axios.get(url);
    return response.data.results;
  }
);




interface FetchTemplatesArgs {
  search: string;
}

export const fetchTemplates = createAsyncThunk<OnlinePartnerTemplate[], FetchTemplatesArgs>(
  "dynamicData/fetch",
  async ({ search = "" }) => {
    const url = `${OnlinePartnerTemplate_API_URL}?search=${encodeURIComponent(search)}`;
    const response = await axios.get(url);
    return response.data.results;
  }
);




// Delete Dynamic Item from Partner and Remove Partner from Template
export const deleteDynamicItemFromPartner = createAsyncThunk<
  { itemName: string; partnerName: string; updatedAssignedPartners: string[] },
  { partnerName: string; itemName: string }
>(
  "OnlinePartnerTemplate/deleteDynamicItemFromPartner",
  async ({ partnerName, itemName }, { rejectWithValue }) => {
    try {
      // Delete the item from the dynamic partner collection
      const url = `${OnlinePartnerTemplate_API_URL}${encodeURIComponent(
        partnerName
      )}/item/${encodeURIComponent(itemName)}`;
      await axios.delete(url);

      // Fetch the updated template data to get latest assignedPartners
      const templateResponse = await axios.get(
        `${OnlinePartnerTemplate_API_URL}?search=${encodeURIComponent(itemName)}`
      );
      const template = templateResponse.data.results.find(
        (t: OnlinePartnerTemplate) => t.itemName === itemName
      );

      return {
        itemName,
        partnerName,
        updatedAssignedPartners: template?.assignedPartners || [],
      };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.detail || "Failed to delete dynamic item");
    }
  }
);



// PARTNER NAME REMOVE FUNCTION [ DYNAMIC => TEMPLATE ]

export const bulkRemovePartnerItems = createAsyncThunk<
  {
    deleted_count: number;
    non_existent_items: string[];
    partnerName: string;
    affected_items: string[]; // Added this
  },
  { partnerName: string; itemNames: string[] },
  { rejectValue: string }
>(
  "DynamicCollection/bulkRemovePartnerItems",
  async ({ partnerName, itemNames }, { rejectWithValue }) => {
    try {
      const url = `${OnlinePartnerTemplate_API_URL}${encodeURIComponent(partnerName)}/items`;
      const response = await axios.delete(url, {
        data: { item_names: itemNames },
        headers: {
          'Content-Type': 'application/json',
        },
      });
      return {
        ...response.data,
        partnerName,
      };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.detail || "Failed to bulk remove partner items");
    }
  }
);


// Rollback Templates
export const rollbackTemplates = createAsyncThunk<
  { success: boolean; message: string; restored_count: number },
  void,
  { rejectValue: string }
>(
  "OnlinePartnerTemplate/rollback",
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${OnlinePartnerTemplate_API_URL}rollback-templates`); 
      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.detail || "Failed to rollback templates"
      );
    }
  }
);



// IMPORT TEMPLATE DATA

export const addImportData = createAsyncThunk<
  ImportResponse,
  { file: File; mode: 'add' | 'merge' | 'replace' }
>(
  "fetchImportData/add",
  async ({ file, mode }) => {
    const form = new FormData();
    form.append("file", file);
    const response = await axios.post(`${IMPORT_API_URL}?mode=${mode}`, form, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  }
);


// IMPORT DYNAMIC DATA
export const addDynamicImportData = createAsyncThunk<ImportResponse, { file: File; partnerName: string }>(
  "fetchDynamicImportData/add",
  async ({ file, partnerName }) => {
    const form = new FormData();
    form.append("file", file);
    const response = await axios.post(`${DYNAMIC_IMPORT_API_URL}?partnerName=${partnerName}`, form, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  }
);



// EXPORT HEADER
export const Exportheader = createAsyncThunk<void, void>(
  "ExportTemplateheader/fetch",
  async (_, { dispatch }) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/OnlinePartnerTemplate/export-csv-headers/`, {
        responseType: "blob",
      });

      const fileName = `Template_Header_Export.csv`;
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
      dispatch(setSnackbarMessage("Template Header exported successfully"));
    } catch (error: unknown) {
      const err = error as AxiosError;
      dispatch(setSnackbarOpen(true));
      dispatch(setSnackbarMessage("Failed to export Template Header"));
      throw err;
    }
  }
);

// EXPORT TEMPLATE DATA
export const fetchExportData = createAsyncThunk<void, void>(
  "fetchExportData/fetch",
  async () => {
    // get date & time
    const { data: dateTime } = await axios.get(
      "https://yenerp.com/liveapi/datetime"
    );

    const date = dateTime.current_date; // 23-01-2026
    const time = dateTime.current_time.replace(/[: ]/g, "-"); // 10-48-AM

    const fileName = `Online_Partner_Templates_${date}_${time}.csv`;

    const response = await axios.get(`${EXPORT_API_URL}?format=csv`, {
      responseType: "blob",
    });

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
  }
);


// EXPORT DYNAMIC DATA

export const fetchDynamicPartnerData = createAsyncThunk<void, string>(
  "fetchDynamicPartnerData/fetch",
  async (partnerName, { dispatch }) => {
    // get date & time
    const { data: dateTime } = await axios.get(
      "https://yenerp.com/liveapi/datetime"
    );

    const date = dateTime.current_date; // 23-01-2026
    const time = dateTime.current_time.replace(/[: ]/g, "-"); // 10-48-AM

    const fileName = `${partnerName}_dynamic_data_${date}_${time}.csv`;

    const response = await axios.get(
      `${DYNAMIC_EXPORT_API_URL}?partnerName=${partnerName}&format=csv`,
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
    dispatch(setSnackbarMessage("Data exported successfully"));
  }
);



// Fetch Category
export const fetchCategory = createAsyncThunk<BranchwiseItem[]>("BranchwiseItem/fetch", async () => {
  const response = await axios.get(CATEGORY_API_URL);
  const categories = response.data.categories;
  if (Array.isArray(categories)) {
    return categories.map((categoryName: string) => ({
      category: categoryName,
    }));
  } else {
    return [];
  }
});

// Fetch Subcategory
export const fetchSubcategory = createAsyncThunk<BranchwiseItemSub[]>("BranchwiseItemSub/fetch", async () => {
  const response = await axios.get(SUBCATEGORY_API_URL);
  const subcategories = response.data.subcategories;
  if (Array.isArray(subcategories)) {
    return subcategories.map((subcategoryName: string) => ({
      subcategory: subcategoryName,
    }));
  } else {
    return [];
  }
});

// Fetch Subcategories By
export const fetchSubcategoriesBy = createAsyncThunk<BranchwiseItemS[], string[]>(
  "BranchwiseItemS/fetchByCategories",
  async (categories) => {
    const queryString = categories.map((cat) => `category=${cat}`).join("&");
    const response = await axios.get(`${SUBCATEGORY_API_URL}?${queryString}`);
    const subcategories = response.data.subcategories;
    const result: BranchwiseItemS[] = [];

    for (const [category, subcatList] of Object.entries(subcategories)) {
      if (Array.isArray(subcatList)) {
        (subcatList as string[]).forEach((subCatName) => {
          result.push({ subcat: subCatName, category });
        });
      }
    }
    return result;
  }
);

// Fetch Item By Category & SubCategory
export const fetchItem = createAsyncThunk<BranchwiseItems[], { category?: string[]; subcategory?: string[] }>(
  "BranchwiseItems/fetch",
  async ({ category, subcategory }) => {
    const params = new URLSearchParams();
    if (category && category.length > 0) {
      category.forEach((cat) => params.append("category", cat));
    }
    if (subcategory && subcategory.length > 0) {
      subcategory.forEach((sub) => params.append("subcategory", sub));
    }
    const response = await axios.get(`${ITEM_API_URL}?${params.toString()}`);
    const items = response.data.items;
    if (Array.isArray(items)) {
      return items.map((item: BranchwiseItems) => ({
        varianceName: item.varianceName,
        subCategory: item.subCategory,
        category: item.category,
        variance_Defaultprice: item.variance_Defaultprice || 0,
      }));
    } else {
      return [];
    }
  }
);


// Fetch All Items
interface FetchItemsArgs {
  page?: number;
  limit?: number;
  search?: string;
}

interface FetchItemsResponse {
  results: BranchwiseItems[];
  totalPages: number;
  currentPage: number;
}
export const fetchItems = createAsyncThunk<FetchItemsResponse, FetchItemsArgs>(
  "BranchwiseItemVariance/fetchAll",
  async ({ page = 1, limit = 50, search = "" }) => {
    const url = `${VARIANCE_API_URL}?page=${page}&limit=${limit}&search=${search}`;
    const response = await axios.get(url);
    const { results, pages, page: currentPage } = response.data;

    // Check if results is an array
    if (Array.isArray(results)) {
      // Flatten the results by mapping over categories and their items
      const flattenedItems = results.flatMap((categoryItem: { category: string; items: BranchwiseItems[] }) =>
        categoryItem.items.map((item: BranchwiseItems) => ({
          varianceName: item.varianceName,
          subCategory: undefined, // Explicitly set to undefined since backend doesn't provide it
          category: categoryItem.category,
          variance_Defaultprice: item.variance_Defaultprice || 0,
        }))
      );

      return {
        results: flattenedItems,
        totalPages: pages,
        currentPage,
      };
    } else {
      return {
        results: [],
        totalPages: 0,
        currentPage: 1,
      };
    }
  }
);


// ADD NEW DATA FOR BOTH
export const addTemplate = createAsyncThunk<
  OnlinePartnerTemplate | dynamicData,
  OnlinePartnerTemplate | dynamicData
>("OnlinePartnerTemplate/add", async (data) => {
  let url: string;
  const payload = { ...data };

  if ("partnerId" in data && data.partnerId) {
    const partnerName = data.partnerId;
    url = `${PARTNER_API_URL}/${partnerName}/collection-data`;
    payload.status = payload.status || "active";
  } else {
    url = OnlinePartnerTemplate_API_URL;
  }
  const response = await axios.post(url, payload);
  return response.data;
});



// ADD MULTIPLE NEW TEMPLATE DOCS IN ONE API CALL
export const addTemplatesBulk = createAsyncThunk<
  OnlinePartnerTemplate[],
  OnlinePartnerTemplate[]
>("OnlinePartnerTemplate/addBulk", async (dataArray) => {
  const response = await axios.post(OnlinePartnerTemplate_API_URL, dataArray);
  // backend returns List[str] of inserted ids in the same order as dataArray
  const insertedIds: string[] = response.data;
  return dataArray.map((item, index) => ({
    ...item,
    onlinePartnerTemplateId: insertedIds[index],
  }));
});

// POST TEMPLATE DATA TO DYNAMIC COLLECTION
export const postToDynamicCollection = createAsyncThunk<
  string[],
  { partnerName: string; data: partnerPost | partnerPost[] }
>("OnlinePartnerTemplate/postToDynamicCollection", async ({ partnerName, data }) => {
  const url = `${DYNAMIC_API}/${partnerName}/collection-data`;
  const payload = { template_data: Array.isArray(data) ? data : [data] };
  const response = await axios.post(url, payload);
  return response.data;
});




export const updateTemplate = createAsyncThunk<
  OnlinePartnerTemplate | dynamicData,
  OnlinePartnerTemplate | dynamicData
>("OnlinePartnerTemplate/update", async (data) => {
  let url: string;
  if ("dynamicDataId" in data && data.dynamicDataId && "partnerId" in data) {
    const partnerName = encodeURIComponent(data.partnerId);
    url = `${PARTNER_API_URL}/${partnerName}/collection-data/${data.dynamicDataId}`;
  } else if ("onlinePartnerTemplateId" in data && data.onlinePartnerTemplateId) {
    url = `${OnlinePartnerTemplate_API_URL}${data.onlinePartnerTemplateId}`;
  } else {
    throw new Error("Invalid ID provided for update");
  }
  const response = await axios.patch(url, {
    itemName: data.itemName,
    Defaultprice: data.Defaultprice,
    percentage: data.percentage,
    partnerPrice: data.partnerPrice,
    status: data.status,
    ...(data.assignedPartners && { assignedPartners: data.assignedPartners }),
    ...(data.deactivateAssignedPartners && { deactivateAssignedPartners: data.deactivateAssignedPartners }),
  });
//  console.log("Response: ", response);
  return response.data;
});



const TemplateSlice = createSlice({
  name: "Template",
  initialState,
  reducers: {
    setTemplateData: (state, action: PayloadAction<OnlinePartnerTemplate | dynamicData>) => {
      state.templateData = action.payload;
    },
    setEditIndex: (state, action: PayloadAction<number | null>) => {
      state.editIndex = action.payload;
    },
    setDialogOpen: (state, action: PayloadAction<"none" | "edit" | "add">) => {
      state.dialogOpen = action.payload;
    },
    setSnackbarOpen: (state, action: PayloadAction<boolean>) => {
      state.snackbarOpen = action.payload;
    },
    setSnackbarMessage: (state, action: PayloadAction<string>) => {
      state.snackbarMessage = action.payload;
    },
    setSearchQuery: (state, action: PayloadAction<string>) => {
      state.searchQuery = action.payload;
    },
    setShowDeactivated: (state, action: PayloadAction<boolean>) => {
      state.showDeactivated = action.payload;
    },
    incrementItemsPage: (state) => {
      state.itemsPage += 1;
    },
    resetPagination: (state) => {
      state.currentPage = 1;
      state.totalPages = 1;
    },
    resetItemsPagination: (state) => {
      state.itemsPage = 1;
      state.itemsTotalPages = 1;
      state.product = [];
      state.hasMoreItems = true;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Partners
      .addCase(fetchPartner.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPartner.fulfilled, (state, action) => {
        state.loading = false;
        state.partner = action.payload;
      })
      .addCase(fetchPartner.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message ?? "Failed to fetch Partner";
        state.partner = [];
      })


      .addCase(deleteTemplate.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteTemplate.fulfilled, (state, action) => {
        state.loading = false;
        const id = action.meta.arg;
        state.items = state.items.filter((item) => item.onlinePartnerTemplateId !== id);
        state.deactivatedItems = state.deactivatedItems.filter((item) => item.onlinePartnerTemplateId !== id);
        state.snackbarOpen = true;
        state.snackbarMessage = action.payload.message || "Template deleted successfully";
      })
      .addCase(deleteTemplate.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to delete template";
        state.snackbarOpen = true;
        state.snackbarMessage = action.payload || "Failed to delete template";
      })


      // Delete Multiple Templates
      .addCase(deleteMultipleTemplates.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteMultipleTemplates.fulfilled, (state, action) => {
        state.loading = false;
        const { deleted_ids } = action.payload;
        state.items = state.items.filter(
          item => !deleted_ids.includes(item.onlinePartnerTemplateId)
        );
        state.snackbarMessage = `${deleted_ids.length} templates deleted successfully`;
        state.snackbarOpen = true;
      })
      .addCase(deleteMultipleTemplates.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.snackbarMessage = action.payload as string;
        state.snackbarOpen = true;
      })





      .addCase(deleteDynamicData.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteDynamicData.fulfilled, (state, action) => {
        state.loading = false;
        const { dataId } = action.meta.arg;
        state.dynamic = state.dynamic.filter((item) => item.dynamicDataId !== dataId);
        state.deactivatedDynamic = state.deactivatedDynamic.filter((item) => item.dynamicDataId !== dataId);
        state.snackbarOpen = true;
        state.snackbarMessage = action.payload.message || "Dynamic data deleted successfully";
      })
      .addCase(deleteDynamicData.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to delete dynamic data";
        state.snackbarOpen = true;
        state.snackbarMessage = action.payload || "Failed to delete dynamic data";
      })

      // Delete Multiple Dynamic Data
      .addCase(deleteMultipleDynamicData.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteMultipleDynamicData.fulfilled, (state, action) => {
        state.loading = false;
        const { deleted_ids } = action.payload;
        state.dynamic = state.dynamic.filter(
          (item) => !deleted_ids.includes(item.dynamicDataId)
        );
        state.deactivatedDynamic = state.deactivatedDynamic.filter(
          (item) => !deleted_ids.includes(item.dynamicDataId)
        );
        state.snackbarOpen = true;
        state.snackbarMessage = `${deleted_ids.length} dynamic data entries deleted successfully`;
      })
      .addCase(deleteMultipleDynamicData.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to delete multiple dynamic data";
        state.snackbarOpen = true;
        state.snackbarMessage = action.payload || "Failed to delete multiple dynamic data";
      })



      // Fetch Templates
      .addCase(fetchTemplates.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTemplates.fulfilled, (state, action) => {
        state.loading = false;
        const items = action.payload;

        state.items = items.filter((item) => item.status === "active");
        state.deactivatedItems = items.filter((item) => item.status === "deactivated");
      })
      .addCase(fetchTemplates.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message ?? "Failed to fetch templates";
      })

      // Fetch Dynamic Data
      .addCase(fetchDynamicData.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDynamicData.fulfilled, (state, action) => {
        state.loading = false;
        const dynamic = action.payload;

        state.dynamic = dynamic.filter((item) => item.status === "active");
        state.deactivatedDynamic = dynamic.filter((item) => item.status === "deactivated");
      })
      .addCase(fetchDynamicData.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message ?? "Failed to fetch Dynamic Datas";
      })




      // DELETE THE PARTNER NAME IN THE TEMPLATE
      .addCase(deleteDynamicItemFromPartner.fulfilled, (state, action) => {
        const { itemName, updatedAssignedPartners } = action.payload;
        const item = state.items.find((t) => t.itemName === itemName);
        if (item) {
          item.assignedPartners = updatedAssignedPartners;
        }
      })




      .addCase(bulkRemovePartnerItems.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(bulkRemovePartnerItems.fulfilled, (state, action) => {
        state.loading = false;
        const { deleted_count, non_existent_items, partnerName, affected_items } = action.payload;
        const normalizedPartnerName = partnerName.toLowerCase().replace(" ", "_");

        // Update dynamic data by removing deleted items
        state.dynamic = state.dynamic.filter(
          item => !affected_items.includes(item.itemName) || item.partnerId !== normalizedPartnerName
        );

        // Update deactivatedDynamic if needed
        state.deactivatedDynamic = state.deactivatedDynamic.filter(
          item => !affected_items.includes(item.itemName) || item.partnerId !== normalizedPartnerName
        );

        // Update templates to remove this partner from assignedPartners
        state.items = state.items.map(item => {
          if (affected_items.includes(item.itemName)) {
            return {
              ...item,
              assignedPartners: item.assignedPartners.filter(p => p !== normalizedPartnerName),
            };
          }
          return item;
        });

        state.deactivatedItems = state.deactivatedItems.map(item => {
          if (affected_items.includes(item.itemName)) {
            return {
              ...item,
              assignedPartners: item.assignedPartners.filter(p => p !== normalizedPartnerName),
            };
          }
          return item;
        });

        state.snackbarOpen = true;
        state.snackbarMessage = `Successfully removed ${deleted_count} items for partner ${partnerName}${non_existent_items.length ? `; non-existent items: ${non_existent_items.join(", ")}` : ""
          }`;
      })
      .addCase(bulkRemovePartnerItems.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to bulk remove partner items";
        state.snackbarOpen = true;
        state.snackbarMessage = action.payload || "Failed to bulk remove partner items";
      })





      // ADD TEMPLATE IMPORT DATA
      // .addCase(addImportData.pending, (state) => {
      //   state.loading = true;
      //   state.error = null;
      // })
      // .addCase(addImportData.fulfilled, (state, action) => {
      //   state.loading = false;
      //   const payload = action.payload;
      //   if (Array.isArray(payload)) {
      //     state.items = [...state.items, ...payload.filter((item) => item.status === "active")];
      //     state.deactivatedItems = [
      //       ...state.deactivatedItems,
      //       ...payload.filter((item) => item.status === "deactivated"),
      //     ];
      //     state.snackbarOpen = true;
      //     state.snackbarMessage = "Template data imported successfully";
      //   } else {
      //     console.error("addImportData.fulfilled: payload is not an array", payload);
      //     state.snackbarOpen = true;
      //     state.snackbarMessage = "Error: Unexpected data format";
      //   }
      // })
      // .addCase(addImportData.rejected, (state, action) => {
      //   state.loading = false;
      //   state.error = action.error.message ?? "Failed to import template data";
      //   state.snackbarOpen = true;
      //   state.snackbarMessage = "Failed to import template data";
      // })




      // Rollback Templates
      .addCase(rollbackTemplates.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(rollbackTemplates.fulfilled, (state, action) => {
        state.loading = false;
        state.snackbarOpen = true;
        state.snackbarMessage = action.payload.message || "Templates rolled back successfully";
      })
      .addCase(rollbackTemplates.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to rollback templates";
        state.snackbarOpen = true;
        state.snackbarMessage = action.payload || "Failed to rollback templates";
      })


      .addCase(addImportData.fulfilled, (state, action) => {
        state.loading = false;
        const payload = action.payload;

        // Check if import was successful
        if (payload.success) {
          state.snackbarOpen = true;
          state.snackbarMessage = payload.message || "Template data imported successfully";
        } else {
          state.snackbarOpen = true;
          state.snackbarMessage = payload.message || "Import completed with errors";
        }

        // Note: Don't update items here - let fetchTemplates handle the refresh
      })
      .addCase(addImportData.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message ?? "Failed to import template data";
        state.snackbarOpen = true;
        state.snackbarMessage = action.error.message ?? "Failed to import template data";
      })

      // ADD DYNAMIC IMPORT DATA
      .addCase(addDynamicImportData.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addDynamicImportData.fulfilled, (state, action) => {
        state.loading = false;
        const payload = action.payload;
        if (Array.isArray(payload)) {
          state.dynamic = [...state.dynamic, ...payload.filter((item) => item.status === "active")];
          state.deactivatedDynamic = [
            ...state.deactivatedDynamic,
            ...payload.filter((item) => item.status === "deactivated"),
          ];
          state.snackbarOpen = true;
          state.snackbarMessage = "Dynamic data imported successfully";
        } else {
          console.error("addDynamicImportData.fulfilled: payload is not an array", payload);
          state.snackbarOpen = true;
          state.snackbarMessage = "Error: Unexpected data format";
        }
      })
      .addCase(addDynamicImportData.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message ?? "Failed to import dynamic data";
        state.snackbarOpen = true;
        state.snackbarMessage = "Failed to import dynamic data";
      })

      // FETCH TEMPLATE EXPORT DATA
      .addCase(fetchExportData.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchExportData.fulfilled, (state) => {
        state.loading = false;
        state.snackbarOpen = true;
        state.snackbarMessage = "Template data exported successfully";
      })
      .addCase(fetchExportData.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message ?? "Failed to export template data";
        state.snackbarOpen = true;
        state.snackbarMessage = "Failed to export template data";
      })

      // FETCH DYNAMIC EXPORT DATA
      .addCase(fetchDynamicPartnerData.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDynamicPartnerData.fulfilled, (state) => {
        state.loading = false;
        state.snackbarOpen = true;
        state.snackbarMessage = "Dynamic data exported successfully";
      })
      .addCase(fetchDynamicPartnerData.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message ?? "Failed to export dynamic data";
        state.snackbarOpen = true;
        state.snackbarMessage = "Failed to export dynamic data";
      })

      // Fetch Category
      .addCase(fetchCategory.pending, (state) => {
        //state.loading = true;
        state.error = null;
      })
      .addCase(fetchCategory.fulfilled, (state, action) => {
        state.loading = false;
        state.category = action.payload;
      })
      .addCase(fetchCategory.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message ?? "Failed to fetch Category";
        state.category = [];
      })

      // Fetch Subcategory
      .addCase(fetchSubcategory.pending, (state) => {
        // state.loading = true;
        state.error = null;
      })
      .addCase(fetchSubcategory.fulfilled, (state, action) => {
        state.loading = false;
        state.subCategory = action.payload;
      })
      .addCase(fetchSubcategory.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message ?? "Failed to fetch subcategory";
        state.subCategory = [];
      })

      // Fetch Subcategories By
      .addCase(fetchSubcategoriesBy.pending, (state) => {
        //  state.loading = true;
        state.error = null;
        state.filteredSubCategories = [];
      })
      .addCase(fetchSubcategoriesBy.fulfilled, (state, action) => {
        state.loading = false;
        state.filteredSubCategories = action.payload;
      })
      .addCase(fetchSubcategoriesBy.rejected, (state, action) => {
        state.loading = false;
        state.filteredSubCategories = [];
        state.error = action.error.message ?? "Failed to fetch subcategories";
      })

      // Fetch Item
      .addCase(fetchItem.pending, (state) => {
        //state.loading = true;
        state.error = null;
      })
      .addCase(fetchItem.fulfilled, (state, action) => {
        state.loading = false;
        state.product = action.payload;
      })
      .addCase(fetchItem.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message ?? "Failed to fetch items";
        state.product = [];
      })

      // Fetch All Items
      .addCase(fetchItems.pending, (state) => {
        state.isFetchingItems = true;
        state.error = null;
      })
      .addCase(fetchItems.fulfilled, (state, action) => {
        state.isFetchingItems = false;
        state.product =
          action.payload.currentPage === 1
            ? action.payload.results
            : [...state.product, ...action.payload.results];
        state.itemsPage = action.payload.currentPage;
        state.itemsTotalPages = action.payload.totalPages;
        state.hasMoreItems = state.itemsPage < state.itemsTotalPages;

      })
      .addCase(fetchItems.rejected, (state, action) => {
        state.isFetchingItems = false;
        state.error = action.error.message ?? "Failed to fetch all items";
        state.hasMoreItems = false;
      })

      // Add Template
      .addCase(addTemplate.fulfilled, (state, action) => {
        const newItem = action.payload;
        if ("partnerId" in newItem && newItem.partnerId) {
          const item = newItem as dynamicData;
          if (item.status === "active") {
            if (!state.dynamic.some((existing) => existing.dynamicDataId === item.dynamicDataId)) {
              state.dynamic.push(item);
            }
          } else {
            if (
              !state.deactivatedDynamic.some((existing) => existing.dynamicDataId === item.dynamicDataId)
            ) {
              state.deactivatedDynamic.push(item);
            }
          }
        } else {
          const item = newItem as OnlinePartnerTemplate;
          if (item.status === "active") {
            if (
              !state.items.some((existing) => existing.onlinePartnerTemplateId === item.onlinePartnerTemplateId)
            ) {
              state.items.push(item);

            }
          } else {
            if (
              !state.deactivatedItems.some(
                (existing) => existing.onlinePartnerTemplateId === item.onlinePartnerTemplateId
              )
            ) {
              state.deactivatedItems.push(item);

            }
          }
        }
      })
      .addCase(addTemplate.rejected, (state, action) => {
        state.error = action.error.message ?? "Failed to add item";
      })



      // Add Templates Bulk
      .addCase(addTemplatesBulk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addTemplatesBulk.fulfilled, (state, action) => {
        state.loading = false;
        action.payload.forEach((item) => {
          if (item.status === "active") {
            if (!state.items.some((existing) => existing.onlinePartnerTemplateId === item.onlinePartnerTemplateId)) {
              state.items.push(item);
            }
          } else {
            if (!state.deactivatedItems.some((existing) => existing.onlinePartnerTemplateId === item.onlinePartnerTemplateId)) {
              state.deactivatedItems.push(item);
            }
          }
        });
      })
      .addCase(addTemplatesBulk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message ?? "Failed to add items in bulk";
      })
      

      // Post to Dynamic Collection
      .addCase(postToDynamicCollection.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(postToDynamicCollection.fulfilled, (state, action) => {
        state.loading = false;
        state.snackbarOpen = true;
        state.snackbarMessage = "Successfully posted to dynamic collection";
        const assignedIds = action.meta.arg.data;
        const partnerName = action.meta.arg.partnerName;
        state.items = state.items.map((item) => {
          if (
            Array.isArray(assignedIds)
              ? assignedIds.some((assigned) => assigned.itemName === item.itemName)
              : assignedIds.itemName === item.itemName
          ) {
            const updatedPartners = [...(item.assignedPartners || []), partnerName];

            return {
              ...item,
              assignedPartners: updatedPartners,
            };
          }
          return item;
        });
        state.deactivatedItems = state.deactivatedItems.map((item) => {
          if (
            Array.isArray(assignedIds)
              ? assignedIds.some((assigned) => assigned.itemName === item.itemName)
              : assignedIds.itemName === item.itemName
          ) {
            const updatedPartners = [...(item.assignedPartners || []), partnerName];

            return {
              ...item,
              assignedPartners: updatedPartners,
            };
          }
          return item;
        });
      })
      .addCase(postToDynamicCollection.rejected, (state, action) => {
        state.loading = false;
        state.snackbarOpen = true;
        state.snackbarMessage = action.error.message ?? "Failed to post to dynamic collection";
      })

      // Update Template
      .addCase(updateTemplate.fulfilled, (state, action) => {
        const payload = action.payload;
        if ("dynamicDataId" in payload) {
          const index = state.dynamic.findIndex((p) => p.dynamicDataId === payload.dynamicDataId);
          if (index !== -1) {
            state.dynamic[index] = payload;
          } else {
            const deactivatedIndex = state.deactivatedDynamic.findIndex(
              (p) => p.dynamicDataId === payload.dynamicDataId
            );
            if (deactivatedIndex !== -1) {
              state.deactivatedDynamic[deactivatedIndex] = payload;
            }
          }
        } else if ("onlinePartnerTemplateId" in payload) {
          const index = state.items.findIndex(
            (p) => p.onlinePartnerTemplateId === payload.onlinePartnerTemplateId
          );
          if (index !== -1) {
            state.items[index] = payload;

          } else {
            const deactivatedIndex = state.deactivatedItems.findIndex(
              (p) => p.onlinePartnerTemplateId === payload.onlinePartnerTemplateId
            );
            if (deactivatedIndex !== -1) {
              state.deactivatedItems[deactivatedIndex] = payload;

            }
          }
        }
      })
      .addCase(updateTemplate.rejected, (state, action) => {
        state.error = action.error.message ?? "Failed to update item";
      });
  },
});

export const {
  setTemplateData,
  setEditIndex,
  setDialogOpen,
  setSnackbarOpen,
  setSnackbarMessage,
  setSearchQuery,
  setShowDeactivated,
  incrementItemsPage,
  resetPagination,
  resetItemsPagination,
} = TemplateSlice.actions;

export const selectSwiggy = (state: RootState) => state.onlinePartnerTemplate;

export default TemplateSlice.reducer;