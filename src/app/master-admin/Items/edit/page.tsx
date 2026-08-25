

'use client';
import React, { useState, useEffect, ChangeEvent, useMemo, Suspense } from 'react';
import {
  Box,
  Typography,
  TextField,
  Autocomplete,
  Checkbox,
  FormControlLabel,
  Switch,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  CircularProgress,
  Alert,
  Snackbar,
  Container,
  Grid,
  Radio,
  Tooltip,
} from '@mui/material';
import { Delete as DeleteIcon, Search as SearchIcon } from '@mui/icons-material';
import { Image as ImageIcon } from '@mui/icons-material';
import { IconButton } from '@mui/material';
import axios from 'axios';
import { AppDispatch, RootState } from '@/redux/store';
import { Variance, Item, Branch, Category } from '../../Items/Item/Models/itemsModels';
import {
  updateItem,
  updateVariance,
  deleteVariance,
  fetchCategories,
  fetchItemGroups,
  fetchtaxs,
  fetchBranches,
  fetchUoms,
  //  fetchMeasurements,
  fetchItemById,
  uploadItemImage,
  updateItemImage,
  fetchOrderType,
  fetchInventory,
  updateVarianceImage,
  uploadVarianceImage,
  //  fetchWarehouse
} from '../../Items/Item/Features/itemSlice';
import { useDispatch, useSelector } from 'react-redux';
import { useRouter, useSearchParams } from 'next/navigation';
import ItemMaster from '../add/style';
import CloseConfirmationDialog from '@/app/Components/Dialogs/CloseConfirmationDialog';
import EditConfirmationDialog from '@/app/Components/Dialogs/EditConfirmationDialog';
import { API_BASE_URL } from '../../../../../API_URL';


// Interfaces
interface subCategory {
  subCategoryName: string;
}

interface EditItemPageProps {
  selectedItem: Item | null;
  setSelectedItem?: (item: Item | null) => void;
  search?: string;
  currentPage?: number;
  initialVarianceIndex?: number | null;
}


function EditItemContent({
  selectedItem,
  setSelectedItem,
  search = '',
  currentPage = 1,
  initialVarianceIndex = null,
}: EditItemPageProps) {
  const dispatch: AppDispatch = useDispatch();
  const router = useRouter();
  const searchParams = useSearchParams();



  // Add state to hold the fetched item
  const [fetchedItem, setFetchedItem] = useState<Item | null>(null);
  const [isFetchingItem, setIsFetchingItem] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [varianceSearch, setVarianceSearch] = useState('');
  const [itemNameError, setItemNameError] = useState<string>('');

  const [closeConfirmOpen, setCloseConfirmOpen] = useState(false);
  const [saveConfirmOpen, setSaveConfirmOpen] = useState(false);

  const [newItem, setNewItem] = useState<Item>({
    itemName: '',
    measurementType: '',
    uom: '',
    item_Defaultprice: 0,
    netPrice: 0,
    taxPrice: 0,
    finalPrice: 0,
    category: '',
    subCategory: '',
    itemGroup: '',
    tax: 0,
    description: '',
    itemType: '',
    hsnCode: '',
    status: '',
    birthdayCake: false,
    uniqueQr: false,
    stockValidation: false,
    includeTax: false,
    excludeTax: false,
    plateItem: false,
    variances: [],
    orderTypes: [],
    image: undefined,        // ✅ Add this
    imageFile: undefined,    // ✅ Add this
    itemImage: undefined,
  });

  const [variances, setVariances] = useState<Variance[]>([]);
  const [, setEditingRow] = useState<number | null>(null);
  const [, setCurrentVariance] = useState<Variance>({
    varianceName: '',
    variance_Uom: '',
    variance_Defaultprice: 0,
    reorderLevel: 0,
    shelfLife: 0,
    sapCode: '',
    varianceStatus: '',
  });

  const [priceOverrideOpen, setPriceOverrideOpen] = useState(false);
  const [aliasPrices, setAliasPrices] = useState<Record<string, string>>({});
  const [selectedBranches, setSelectedBranches] = useState<string[]>([]);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteIndex, setDeleteIndex] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Add this state near your other state declarations
  const [modifiedVariances, setModifiedVariances] = useState<Record<number, boolean>>({});
  const [branchItemStatus, setBranchItemStatus] = useState<Record<string, boolean>>({});
  const [branchItemStatusByVariance, setBranchItemStatusByVariance] = useState<
    Record<number, Record<string, boolean>>
  >({});

  const [aliasSalesTypePrices, setAliasSalesTypePrices] = useState<
    Record<string, Record<string, string>>
  >({});
  const [enableAllBranches, setEnableAllBranches] = useState(true);
  const [excludeTaxItem, setExcludeTaxItem] = useState(false);
  const [originalPrice, setOriginalPrice] = useState<string>('');
  const [salesTypesByBranch, setSalesTypesByBranch] = useState<Record<string, string[]>>({});

  const [currentVarianceIndex, setCurrentVarianceIndex] = useState<number | null>(null);
  const [aliasPricesByVariance, setAliasPricesByVariance] = useState<Record<number, Record<string, string>>>({});
  const [aliasSalesTypePricesByVariance, setAliasSalesTypePricesByVariance] = useState<
    Record<number, Record<string, Record<string, string>>>
  >({});


  const [branchIdMap, setBranchIdMap] = useState<Record<string, string>>({});
  // ✅ ADD THIS NEW STATE near your other state declarations (around line ~85)
  const [imageError, setImageError] = useState<string>('');
  const [orderTypeIdToName, setOrderTypeIdToName] = useState<Record<string, string>>({});
  const [orderTypeNameToId, setOrderTypeNameToId] = useState<Record<string, string>>({});

  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error';
  }>({
    open: false,
    message: '',
    severity: 'success',
  });

  const {
    itemGroups,
    categories,
    taxes,
    uoms,
    branchess,
    orderTypes,
    inventory,
    loading: itemLoading
  } = useSelector((state: RootState) => state.maItems);




  const hasLetter = /[a-zA-Z]/;

  const getHelperText = (value: string, parentError: string): string => {
    if (value && !hasLetter.test(value)) return 'Must contain at least one letter';
    return parentError;
  };

  const hasLetterError = (value: string): boolean =>
    !!value && !hasLetter.test(value);


  useEffect(() => {
    // console.log('Redux state - branchess:', branchess);
    if (branchess && branchess.length > 0 && Object.keys(orderTypeIdToName).length > 0) {
      const salesTypesMap: Record<string, string[]> = {};
      const idMap: Record<string, string> = {};

      branchess.forEach((branch: Branch) => {
        const salesTypeIds = branch.salesTypes || [];

        // Convert sales type IDs to names for UI display
        const salesTypeNames = salesTypeIds.map(id =>
          orderTypeIdToName[id] || id // Fallback to ID if name not found
        );

        //  console.log(`Branch: ${branch.aliasName}, IDs:`, salesTypeIds, '-> Names:', salesTypeNames);

        salesTypesMap[branch.aliasName] = salesTypeNames;
        idMap[branch.aliasName] = branch.locationId;
      });

      // console.log('Final salesTypesMap (with names):', salesTypesMap);
      //  console.log('Final branchIdMap:', idMap);
      setSalesTypesByBranch(salesTypesMap);
      setBranchIdMap(idMap);
    }
  }, [branchess, orderTypeIdToName]);


  // ============================================================================
  // SECTION 1: UPDATE THE useEffect TO USE REDUX SLICE (Replace around line 290)
  // ============================================================================

  // Fetch order types mapping from Redux
  useEffect(() => {
    if (orderTypes && orderTypes.length > 0) {
      const nameToId: Record<string, string> = {};
      const idToName: Record<string, string> = {};

      orderTypes.forEach((item) => {
        const orderTypeName = item.orderTypeName?.trim().toUpperCase();
        const orderTypeId = item.orderTypeId?.trim();

        if (orderTypeName && orderTypeId) {
          nameToId[orderTypeName] = orderTypeId;
          idToName[orderTypeId] = orderTypeName;
        }
      });

      //  console.log('Order Type ID to Name mapping:', idToName);
      //  console.log('Order Type Name to ID mapping:', nameToId);

      setOrderTypeIdToName(idToName);
      setOrderTypeNameToId(nameToId);
    }
  }, [orderTypes]); // Dependency on orderTypes from Redux



  useEffect(() => {
    const fetchItemFromUrl = async () => {
      const itemId = searchParams?.get('id');
      const varianceIdx = searchParams?.get('varianceIndex');

      //  console.log('=== FETCH ITEM FROM URL ===');
      //  console.log('Item ID from URL:', itemId);
      //  console.log('Variance Index:', varianceIdx);

      if (itemId && !selectedItem && !fetchedItem) {
        setIsFetchingItem(true);
        try {
          const result = await dispatch(fetchItemById(itemId));

          //    console.log('Dispatch result:', result);

          if (fetchItemById.fulfilled.match(result)) {
            //     console.log('Successfully fetched item:', result.payload);
            console.log('Item ID properties:', {
              branchwiseItemId: result.payload.branchwiseItemId,
              itemId: result.payload.itemId,
              id: result.payload.id,
              fullObject: result.payload
            });
            setFetchedItem(result.payload);

            if (varianceIdx) {
              const idx = parseInt(varianceIdx);
              //  console.log('Setting variance index:', idx);
              setEditingRow(idx);
            }
          } else {
            console.error('Fetch rejected:', result);
            setSnackbar({
              open: true,
              message: (result.payload as string) || 'Failed to load item',
              severity: 'error',
            });
          }
        } catch (error) {
          console.error('Fetch error:', error);
          setSnackbar({
            open: true,
            message: 'Failed to load item data',
            severity: 'error',
          });
        } finally {
          setIsFetchingItem(false);
        }
      }
    };

    fetchItemFromUrl();
  }, [searchParams, selectedItem, fetchedItem, dispatch]);




  useEffect(() => {
    // ✅ Skip calculation during initial load - preserve backend values
    if (isInitialLoad) {
      return;
    }

    // if (newItem.item_Defaultprice) {
    if (newItem.item_Defaultprice !== '' && newItem.item_Defaultprice !== null && newItem.item_Defaultprice !== undefined) {
      const priceNum = parseFloat(String(newItem.item_Defaultprice));
      const taxNum = parseFloat(String(newItem.tax)) || 0;

      // ✅ Handle price = 0 explicitly
      if (priceNum === 0) {
        setNewItem(prev => ({
          ...prev,
          netPrice: '0',
          taxPrice: '0',
          finalPrice: '0',
        }));
        return;
      }

      if (isNaN(priceNum)) return;

      // ✅ FIXED: Handle tax = 0% correctly
      if (taxNum > 0) {
        if (!excludeTaxItem) {
          // Include Tax mode: Price is final price including tax
          setNewItem(prev => ({
            ...prev,
            netPrice: (priceNum / (1 + taxNum / 100)).toFixed(2),
            taxPrice: (priceNum - (priceNum / (1 + taxNum / 100))).toFixed(2),
            finalPrice: String(priceNum),
          }));
        } else {
          // Exclude Tax mode: Price is net price excluding tax
          const netPrice = priceNum;
          const taxAmount = netPrice * (taxNum / 100);
          setNewItem(prev => ({
            ...prev,
            netPrice: netPrice.toFixed(2),
            taxPrice: taxAmount.toFixed(2),
            finalPrice: (netPrice + taxAmount).toFixed(2),
          }));
        }
      } else {
        // ✅ Tax is 0% - set netPrice and finalPrice to the entered price
        setNewItem(prev => ({
          ...prev,
          netPrice: priceNum.toFixed(2),
          taxPrice: '0',
          finalPrice: priceNum.toFixed(2),
        }));
      }
    } else {
      // Reset when no price
      setNewItem(prev => ({
        ...prev,
        netPrice: '',
        taxPrice: '',
        finalPrice: '',
      }));
    }
  }, [excludeTaxItem, newItem.item_Defaultprice, newItem.tax, isInitialLoad]);


  // ===================== 🆕 ADD THIS =====================
  useEffect(() => {
    if (isInitialLoad) return;

    if (variances.length === 1) {
      const updatedVariances = [...variances];

      const newUom = newItem.uom || updatedVariances[0].variance_Uom || '';
      const newPrice = newItem.item_Defaultprice ?? updatedVariances[0].variance_Defaultprice;

      const uomChanged = updatedVariances[0].variance_Uom !== newUom;
      const priceChanged = String(updatedVariances[0].variance_Defaultprice) !== String(newPrice);

      if (uomChanged || priceChanged) {
        updatedVariances[0] = {
          ...updatedVariances[0],
          variance_Uom: newUom,
          variance_Defaultprice: newPrice,
        };
        setVariances(updatedVariances);
      }
    }
  }, [newItem.uom, newItem.item_Defaultprice, variances.length, isInitialLoad]);
  // =======================================================



  useEffect(() => {
    const itemToEdit = selectedItem || fetchedItem;

    if (itemToEdit) {

      setIsInitialLoad(true);

      const price = itemToEdit.item_Defaultprice ?? itemToEdit.price ?? 0;
      const parsedPrice = typeof price === 'string' ? parseFloat(price) || 0 : price;
      const parsedTax = itemToEdit.tax ? parseFloat(String(itemToEdit.tax)) || 0 : 0;


      setNewItem({
        itemName: itemToEdit.itemName || itemToEdit.name || '',
        measurementType: itemToEdit.measurementType || '',
        uom: itemToEdit.uom || itemToEdit.item_Uom || '',
        item_Defaultprice: parsedPrice,
        netPrice: itemToEdit.netPrice || 0,
        taxPrice: itemToEdit.taxPrice || 0,
        finalPrice: itemToEdit.finalPrice || 0,
        category: itemToEdit.category || '',
        subCategory: itemToEdit.subCategory || '',
        itemGroup: itemToEdit.itemGroup || '',
        tax: parsedTax,
        description: itemToEdit.description || '',
        itemType: itemToEdit.itemType || '',
        hsnCode: itemToEdit.hsnCode || '',
        status: itemToEdit.status || 'Active',
        birthdayCake: itemToEdit.birthdayCake || false,
        uniqueQr: itemToEdit.uniqueQr || false,
        stockValidation: itemToEdit.stockValidation || false,
        includeTax: itemToEdit.includeTax || false,
        excludeTax: itemToEdit.excludeTax || false,
        //   plateItem: itemToEdit.plateItem || false,
        variances: itemToEdit.variances || [],
        orderTypes: itemToEdit.orderTypes || [],
        image: itemToEdit.itemImage || undefined,
        imageFile: undefined,
        itemImage: itemToEdit.itemImage || undefined,
      });

      // Initialize excludeTaxItem from the loaded data
      setExcludeTaxItem(itemToEdit.excludeTax || false);

      setVariances(itemToEdit.variances || []);

      // ✅ Mark that initial load is complete after a short delay
      setTimeout(() => setIsInitialLoad(false), 10);

      if (initialVarianceIndex !== null && itemToEdit.variances?.[initialVarianceIndex]) {
        setEditingRow(initialVarianceIndex);
        const variance = itemToEdit.variances[initialVarianceIndex];
        setCurrentVariance({
          varianceName: variance.varianceName || '',
          variance_Uom: variance.variance_Uom || variance.uom || itemToEdit.uom || '',
          variance_Defaultprice: Number(variance.variance_Defaultprice || variance.price || 0),
          reorderLevel: Number(variance.reorderLevel || variance.reorderLevel || 0),
          shelfLife: Number(variance.shelfLife || 0),
          sapCode: variance.sapCode || '',
          varianceStatus: variance.varianceStatus || 'active',
        });
      }
    }
  }, [selectedItem, fetchedItem, initialVarianceIndex]);




  useEffect(() => {
    if (variances && variances.length > 0) {
      variances.forEach((variance) => {
        if (variance.itemCode && !originalVariancesRef.current[variance.itemCode]) {
          originalVariancesRef.current[variance.itemCode] = {
            ...variance,
            branchwise: (variance as any).branchwise || {},
          };
          //  console.log('📦 Stored original variance:', variance.itemCode, (variance as any).branchwise);
        }
      });
    }
  }, [variances]);



  useEffect(() => {
    //   console.log('Page loaded, fetching data...');
    dispatch(fetchItemGroups());
    dispatch(fetchCategories());
    dispatch(fetchUoms());
    dispatch(fetchtaxs());
    dispatch(fetchOrderType());
    dispatch(fetchInventory());
    dispatch(fetchBranches()).then(() => {
      //    console.log('Branches fetched');
    });
  }, [dispatch]);




  const checkDuplicateItemName = async (name: string, currentItemId: string) => {
    if (!name.trim()) {
      setItemNameError('');
      return;
    }

    try {
      const response = await axios.get(
        `${API_BASE_URL}/itemmasters/check-itemname/?name=${encodeURIComponent(name.trim())}&exclude_id=${currentItemId}`
      );

      // setItemNameError(
      //   response.data.isDuplicate
      //     ? `"${name.toUpperCase()}" or a similar item name already exists.`
      //     : ''
      // );
    } catch (error) {
      console.warn('Item name check failed:', error);
      setItemNameError('');
    }
  };

  const filteredVariances = useMemo(() => {
    if (!varianceSearch.trim()) return variances;

    return variances.filter(variance =>
      variance.varianceName?.toLowerCase().includes(varianceSearch.toLowerCase())
    );
  }, [variances, varianceSearch]);


  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };


  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;

    if (isInitialLoad) setIsInitialLoad(false);

    let processedValue = value;

    if (name === 'itemName') {
      processedValue = value
        .replace(/[^a-zA-Z0-9\s\-.,()&]/g, '')
        .slice(0, 200)
        .toUpperCase();
    }

    if (name === 'description') {
      processedValue = value.slice(0, 200);
    }

    if (name === 'item_Defaultprice' || name === 'tax') {
      const regex = /^\d{0,4}(\.\d{0,2})?$/;

      if (value === '' || regex.test(value)) {
        // ✅ Keep as STRING while typing
        const numValue = value === '' ? '' : (value === '0' || parseFloat(value) === 0 ? 0 : value);
        setNewItem((prev) => ({ ...prev, [name]: numValue }));

        if (name === 'item_Defaultprice' && variances.length === 1) {
          setVariances(prev => {
            const updated = [...prev];
            updated[0] = {
              ...updated[0],
              variance_Defaultprice: parseFloat(value) || 0
            };
            return updated;
          });
        }
      }

      return;
    }

    setNewItem((prev) => ({ ...prev, [name]: processedValue }));
  };


  const handleCategoryChange = (event: React.SyntheticEvent, value: Category | null) => {
    const selectedCategoryName = value ? value.categoryName : '';
    const selectedCategory = categories.find((cat) => cat.categoryName === selectedCategoryName);
    const firstsubCategory = selectedCategory && selectedCategory.subCategory.length > 0
      ? selectedCategory.subCategory[0]
      : '';
    setNewItem((prev) => ({
      ...prev,
      category: selectedCategoryName,
      subCategory: firstsubCategory,
    }));
  };

  const handlesubCategoryChange = (event: React.SyntheticEvent, value: subCategory | null) => {
    const selectedsubCategory = value ? value.subCategoryName : '';
    setNewItem((prev) => ({
      ...prev,
      subCategory: selectedsubCategory,
    }));
    if (selectedsubCategory) {
      const matchingCategory = categories.find((cat) =>
        cat.subCategory.includes(selectedsubCategory)
      );
      setNewItem(prev => ({
        ...prev,
        category: matchingCategory ? matchingCategory.categoryName : '',
      }));
    } else {
      setNewItem(prev => ({
        ...prev,
        category: '',
      }));
    }
  };


  // const handleVarianceChange = (index: number, field: keyof Variance, value: string) => {
  //   // If price field is being changed, mark this variance as modified
  //   if (field === 'variance_Defaultprice') {
  //     setModifiedVariances(prev => ({
  //       ...prev,
  //       [index]: true
  //     }));
  //   }

  //   setVariances(prev => {
  //     const updated = [...prev];
  //     updated[index] = {
  //       ...updated[index],
  //       [field]: value
  //     };
  //     return updated;
  //   });
  // };


  const handleVarianceChange = (index: number, field: keyof Variance, value: string | number) => {
    // If price field is being changed, mark this variance as modified
    if (field === 'variance_Defaultprice') {
      setModifiedVariances(prev => ({
        ...prev,
        [index]: true
      }));
    }

    setVariances(prev => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        [field]: value
      };

      // ✅ NEW: If only ONE variance exists, sync changes BACK to main item fields
      if (updated.length === 1) {
        setTimeout(() => {
          if (field === 'variance_Uom' && value) {
            setNewItem(prevItem => ({ ...prevItem, uom: String(value) }));
          }
          if (field === 'variance_Defaultprice' && value !== '') {
            setNewItem(prevItem => ({ ...prevItem, item_Defaultprice: Number(value) }));
          }
        }, 0);
      }

      return updated;
    });
  };


  const handleVarianceImageChange = (index: number, file: File) => {
    const previewUrl = URL.createObjectURL(file);
    setVariances(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], varianceImageFile: file, varianceImagePreview: previewUrl };
      return updated;
    });
  };




  const isVarianceFilled = (v?: Variance) => {
    return (
      !!v?.varianceName?.trim() &&
      !!v?.variance_Uom?.trim() &&
      v?.variance_Defaultprice !== '' &&
      v?.variance_Defaultprice !== null &&
      v?.variance_Defaultprice !== undefined &&
      v?.shelfLife !== '' &&
      v?.shelfLife !== null &&
      v?.shelfLife !== undefined
    );
  };



  // const handleAddNewVariance = () => {
  //   // ✅ FIX: If no variances exist (after delete), allow adding without validation
  //   if (variances.length === 0) {
  //     const newVariance: Variance = {
  //       varianceName: '',
  //       variance_Uom: '',
  //       variance_Defaultprice: 0,
  //       reorderLevel: 0,
  //       shelfLife: 0,
  //       sapCode: '',
  //       varianceStatus: 'active',
  //     };

  //     setVariances([newVariance]);

  //     setAliasPricesByVariance(prev => ({ ...prev, [0]: {} }));
  //     setAliasSalesTypePricesByVariance(prev => ({ ...prev, [0]: {} }));
  //     setBranchItemStatusByVariance(prev => ({ ...prev, [0]: {} }));
  //     setModifiedVariances(prev => ({ ...prev, [0]: false }));
  //     setEditingRow(0);
  //     return;
  //   }

  //   // 🔹 If top row exists and is NOT filled → block
  //   if (!isVarianceFilled(variances[0])) {
  //     setSnackbar({
  //       open: true,
  //       message: 'Please complete the first variance before adding another',
  //       severity: 'error',
  //     });
  //     return;
  //   }

  //   // ✅ Create new variance
  //   const newVariance: Variance = {
  //     varianceName: '',
  //     variance_Uom: '',
  //     variance_Defaultprice: 0,
  //     reorderLevel: 0,
  //     shelfLife: 0,
  //     sapCode: '',
  //     varianceStatus: 'active',
  //   };

  //   // ✅ Add new row at TOP
  //   setVariances(prev => [newVariance, ...prev]);

  //   // ✅ Shift alias prices
  //   setAliasPricesByVariance(prev => {
  //     const shifted: Record<number, Record<string, string>> = {};
  //     Object.keys(prev).forEach(key => {
  //       shifted[Number(key) + 1] = prev[Number(key)];
  //     });
  //     shifted[0] = {};
  //     return shifted;
  //   });

  //   setAliasSalesTypePricesByVariance(prev => {
  //     const shifted: Record<number, Record<string, Record<string, string>>> = {};
  //     Object.keys(prev).forEach(key => {
  //       shifted[Number(key) + 1] = prev[Number(key)];
  //     });
  //     shifted[0] = {};
  //     return shifted;
  //   });

  //   setBranchItemStatusByVariance(prev => {
  //     const shifted: Record<number, Record<string, boolean>> = {};
  //     Object.keys(prev).forEach(key => {
  //       shifted[Number(key) + 1] = prev[Number(key)];
  //     });
  //     shifted[0] = {};
  //     return shifted;
  //   });

  //   setModifiedVariances(prev => {
  //     const shifted: Record<number, boolean> = {};
  //     Object.keys(prev).forEach(key => {
  //       shifted[Number(key) + 1] = prev[Number(key)];
  //     });
  //     shifted[0] = false;
  //     return shifted;
  //   });

  //   setEditingRow(0);
  // };





  const handleAddNewVariance = () => {
    // ✅ FIX: If no variances exist (after delete), allow adding without validation
    if (variances.length === 0) {
      const newVariance: Variance = {
        varianceName: '',
        variance_Uom: '',
        // ✅ UPDATED: Set price to 0 if SFG, else 0 (default)
        variance_Defaultprice: newItem.itemType === "SFG" ? 0 : 0,
        reorderLevel: 0,
        shelfLife: 0,
        sapCode: '',
        varianceStatus: 'active',
        // ✅ ADDED: Set itemType to SFG if main item is SFG
        itemType: newItem.itemType === "SFG" ? "SFG" : "",
      };

      setVariances([newVariance]);

      setAliasPricesByVariance(prev => ({ ...prev, [0]: {} }));
      setAliasSalesTypePricesByVariance(prev => ({ ...prev, [0]: {} }));
      setBranchItemStatusByVariance(prev => ({ ...prev, [0]: {} }));
      setModifiedVariances(prev => ({ ...prev, [0]: false }));
      setEditingRow(0);
      return;
    }

    // 🔹 If top row exists and is NOT filled → block
    if (!isVarianceFilled(variances[0])) {
      setSnackbar({
        open: true,
        message: 'Please complete the first variance before adding another',
        severity: 'error',
      });
      return;
    }

    // ✅ Create new variance
    const newVariance: Variance = {
      varianceName: '',
      variance_Uom: '',
      // ✅ UPDATED: Set price to 0 if SFG type
      variance_Defaultprice: newItem.itemType === "SFG" ? 0 : 0,
      reorderLevel: 0,
      shelfLife: 0,
      sapCode: '',
      varianceStatus: 'active',
      // ✅ ADDED: Inherit itemType from main item
      itemType: newItem.itemType === "SFG" ? "SFG" : "",
    };

    // ✅ Add new row at TOP
    setVariances(prev => [newVariance, ...prev]);

    // ✅ Shift alias prices
    setAliasPricesByVariance(prev => {
      const shifted: Record<number, Record<string, string>> = {};
      Object.keys(prev).forEach(key => {
        shifted[Number(key) + 1] = prev[Number(key)];
      });
      shifted[0] = {};
      return shifted;
    });

    setAliasSalesTypePricesByVariance(prev => {
      const shifted: Record<number, Record<string, Record<string, string>>> = {};
      Object.keys(prev).forEach(key => {
        shifted[Number(key) + 1] = prev[Number(key)];
      });
      shifted[0] = {};
      return shifted;
    });

    setBranchItemStatusByVariance(prev => {
      const shifted: Record<number, Record<string, boolean>> = {};
      Object.keys(prev).forEach(key => {
        shifted[Number(key) + 1] = prev[Number(key)];
      });
      shifted[0] = {};
      return shifted;
    });

    setModifiedVariances(prev => {
      const shifted: Record<number, boolean> = {};
      Object.keys(prev).forEach(key => {
        shifted[Number(key) + 1] = prev[Number(key)];
      });
      shifted[0] = false;
      return shifted;
    });

    setEditingRow(0);
  };





  const handlePriceOverrideClick = (index: number) => {
    setCurrentVarianceIndex(index);
    const branches = allBranchAliases;
    setSelectedBranches(branches);
    setEnableAllBranches(true);

    const varianceData = variances[index];
    const branchwiseData = varianceData?.branchwise || {};
    const isNewVariance = !varianceData?.itemCode;
    const currentUIPrice = String(varianceData?.variance_Defaultprice || '');
    const isModified = modifiedVariances[index];

    const existingAliasPrices = aliasPricesByVariance[index] || {};
    const existingSalesTypePrices = aliasSalesTypePricesByVariance[index] || {};
    const existingItemStatus = branchItemStatusByVariance[index] || {};

    const defaultPrices: Record<string, string> = {};
    const defaultSalesTypePrices: Record<string, Record<string, string>> = {};
    const defaultItemStatus: Record<string, boolean> = {};

    branches.forEach(alias => {

      // ── ItemStatus ──────────────────────────────────────────────────────────
      if (existingItemStatus[alias] !== undefined) {
        // ✅ User already toggled and applied — always respect their saved choice
        defaultItemStatus[alias] = existingItemStatus[alias];
      } else if (isNewVariance) {
        // ✅ New variance, never opened override before — default to active (true)
        defaultItemStatus[alias] = true;
      } else {
        // ✅ Existing variance, never toggled — read from DB via originalVariancesRef
        const orig = originalVariancesRef.current[varianceData?.itemCode || ''];
        const branchwise = (orig as any)?.branchwise || {};
        const storedStatus = branchwise[alias]?.[`ItemStatus_${alias}`];
        defaultItemStatus[alias] = storedStatus === 'active' || storedStatus === 'Active';
      }

      // ── Base Price ──────────────────────────────────────────────────────────
      if (isNewVariance) {
        defaultPrices[alias] = existingAliasPrices[alias] !== undefined
          ? existingAliasPrices[alias]
          : currentUIPrice;
      } else if (isModified) {
        defaultPrices[alias] = currentUIPrice;
      } else if (existingAliasPrices[alias] !== undefined) {
        defaultPrices[alias] = existingAliasPrices[alias];
      } else {
        const branchInfo = branchwiseData[alias];
        const storedBranchPrice = branchInfo?.[`Price_${alias}`];
        defaultPrices[alias] = storedBranchPrice !== undefined
          ? String(storedBranchPrice)
          : '';
      }

      // ── Sales Type Prices ───────────────────────────────────────────────────
      const salesTypeNames = salesTypesByBranch[alias] || [];
      defaultSalesTypePrices[alias] = {};

      salesTypeNames.forEach(stName => {
        const hasStoredSalesTypeOverride = existingSalesTypePrices[alias]?.[stName] !== undefined;

        if (isNewVariance) {
          defaultSalesTypePrices[alias][stName] = hasStoredSalesTypeOverride
            ? existingSalesTypePrices[alias][stName]
            : currentUIPrice;
        } else if (isModified) {
          defaultSalesTypePrices[alias][stName] = currentUIPrice;
        } else if (hasStoredSalesTypeOverride) {
          defaultSalesTypePrices[alias][stName] = existingSalesTypePrices[alias][stName];
        } else {
          const branchInfo = branchwiseData[alias];
          const storedSalesTypePrice = branchInfo?.[`${stName}_${alias}`];
          defaultSalesTypePrices[alias][stName] = storedSalesTypePrice !== undefined
            ? String(storedSalesTypePrice)
            : '';
        }
      });
    });

    setAliasPrices(defaultPrices);
    setAliasSalesTypePrices(defaultSalesTypePrices);
    setBranchItemStatus(defaultItemStatus);
    setPriceOverrideOpen(true);
  };



  const originalVariancesRef = React.useRef<Record<string, Variance>>({});
  const isSubmittingRef = React.useRef(false);

  const handleSubmit = async () => {

    if (isSubmittingRef.current) return;
    isSubmittingRef.current = true;

    try {

      // ✅✅✅ ADD THIS IMAGE VALIDATION BLOCK ✅✅✅
      if (newItem.imageFile) {
        const validExtensions = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif', 'image/bmp', 'image/svg+xml'];
        const file = newItem.imageFile;

        if (!validExtensions.includes(file.type)) {
          setSnackbar({
            open: true,
            message: 'Invalid image format! Please upload PNG, JPEG, JPG, or WEBP only.',
            severity: 'error',
          });
          isSubmittingRef.current = false; // Reset flag before returning
          return;
        }
      }

      if (itemNameError) {
        setSnackbar({ open: true, message: itemNameError, severity: 'error' });
        return;
      }

      if (!hasLetter.test((newItem.itemName || '').trim())) {
        setSnackbar({ open: true, message: 'Item Name must contain at least one letter.', severity: 'error' });
        return;
      }

      if (newItem.description && !hasLetter.test(newItem.description.trim())) {
        setSnackbar({ open: true, message: 'Description must contain at least one letter.', severity: 'error' });
        return;
      }

      const badVariance = variances.find(
        v => v.varianceName && !hasLetter.test(v.varianceName.trim())
      );
      if (badVariance) {
        setSnackbar({
          open: true,
          message: `Variance name "${badVariance.varianceName}" must contain at least one letter.`,
          severity: 'error',
        });
        return;
      }

      const isVarianceRowEmpty = (v: Variance) => {
        return (
          !v.varianceName?.trim() &&
          !v.variance_Uom?.trim() &&
          (v.variance_Defaultprice === '' || v.variance_Defaultprice === 0 || v.variance_Defaultprice === undefined) &&
          (v.shelfLife === '' || v.shelfLife === 0 || v.shelfLife === undefined)
        );
      };

      const hasEmptyVarianceRow = variances.some(isVarianceRowEmpty);
      if (hasEmptyVarianceRow) {
        setSnackbar({ open: true, message: 'Please FILL or REMOVE THE EMPTY VARIANCE ROW before updating.', severity: 'error' });
        return;
      }

      for (const variance of variances) {
        const shelfLifeValue = variance.shelfLife ?? '';
        const parsedShelfLife = shelfLifeValue === 0 || shelfLifeValue === '0'
          ? 0
          : parseInt(shelfLifeValue as string, 10);

        if (shelfLifeValue === '' || isNaN(parsedShelfLife) || parsedShelfLife < 0) {
          setSnackbar({
            open: true,
            message: `Fill Shelf Life for variance "${variance.varianceName || 'Unnamed'}".`,
            severity: 'error',
          });
          return;
        }
      }

      const itemToEdit = selectedItem || fetchedItem;
      const itemId = itemToEdit?.branchwiseItemId || itemToEdit?.itemId || itemToEdit?.id;

      if (itemId) {
        setLoading(true);

        const mainPrice = newItem.item_Defaultprice ? Number(newItem.item_Defaultprice) : undefined;
        const oldMainPrice = itemToEdit?.item_Defaultprice ? Number(itemToEdit.item_Defaultprice) : 0;

        // ── Detect if main item fields actually changed ──────────────────────
        const mainItemChanged =
          newItem.itemName !== itemToEdit?.itemName ||
          newItem.category !== itemToEdit?.category ||
          newItem.subCategory !== itemToEdit?.subCategory ||
          newItem.birthdayCake !== itemToEdit?.birthdayCake ||
          newItem.uniqueQr !== itemToEdit?.uniqueQr ||
          newItem.stockValidation !== itemToEdit?.stockValidation ||
          newItem.includeTax !== itemToEdit?.includeTax ||
          newItem.excludeTax !== itemToEdit?.excludeTax ||
          newItem.itemType !== itemToEdit?.itemType ||
          newItem.itemGroup !== itemToEdit?.itemGroup ||
          newItem.uom !== itemToEdit?.item_Uom ||
          newItem.description !== itemToEdit?.description ||
          String(newItem.hsnCode || '') !== String(itemToEdit?.hsnCode || '') ||
          Number(newItem.tax || 0) !== Number(itemToEdit?.tax || 0) ||
          (mainPrice !== undefined && mainPrice !== oldMainPrice);

        // Step 1: Update main item ONLY if changed
        if (mainItemChanged) {
          await dispatch(
            updateItem({
              branchwiseItemId: itemId,
              updates: {
                itemType: newItem.itemType,
                itemName: newItem.itemName,
                category: newItem.category,
                subCategory: newItem.subCategory,
                itemGroup: newItem.itemGroup,
                item_Uom: newItem.uom,
                item_Defaultprice: mainPrice,
                tax: newItem.tax,
                netPrice: newItem.netPrice,
                taxPrice: newItem.taxPrice,
                finalPrice: newItem.finalPrice,
                description: newItem.description,
                status: newItem.status,
                birthdayCake: newItem.birthdayCake,
                uniqueQr: newItem.uniqueQr,
                stockValidation: newItem.stockValidation,
                includeTax: newItem.includeTax,
                excludeTax: newItem.excludeTax,
              },
              page: currentPage,
              limit: 15,
              itemName: search,
            })
          ).unwrap();
          // console.log('✅ Main item updated');
        } else {
          //console.log('⏭️ Skipping main item update — no changes detected');
        }

        // Step 1.5: Handle image upload/update
        if (newItem.imageFile) {
          try {
            //   console.log('Processing image for item:', itemId);
            const itemHasExistingImage = itemToEdit?.itemImage || fetchedItem?.itemImage;

            if (itemHasExistingImage) {
              await dispatch(updateItemImage({ branchwiseItemId: itemId, file: newItem.imageFile })).unwrap();
              //      console.log('Image updated successfully');
            } else {
              await dispatch(uploadItemImage({ branchwiseItemId: itemId, file: newItem.imageFile, page: currentPage, limit: 15, itemName: search })).unwrap();
              //      console.log('Image uploaded successfully');
            }
          } catch (imgErr: any) {
            console.error('Image processing failed:', imgErr);
          }
        }

        // Step 2: Process variances SEQUENTIALLY to avoid itemCode race condition
        //  console.log("Processing variances...");

        for (const [index, variance] of variances.entries()) {
          const variancePrice = parseFloat(variance.variance_Defaultprice as string) || 0;
          const taxNum = parseFloat(newItem.tax as string) || 0;

          let netPrice = 0;
          let taxPrice = 0;
          let finalPrice = 0;

          if (variancePrice > 0) {
            if (taxNum > 0) {
              if (!excludeTaxItem) {
                netPrice = variancePrice / (1 + taxNum / 100);
                taxPrice = variancePrice - netPrice;
                finalPrice = variancePrice;
              } else {
                netPrice = variancePrice;
                taxPrice = variancePrice * (taxNum / 100);
                finalPrice = variancePrice + taxPrice;
              }
            } else {
              netPrice = variancePrice;
              taxPrice = 0;
              finalPrice = variancePrice;
            }
          }

          const varianceAliasPrices = aliasPricesByVariance[index] || {};
          const varianceSalesTypePrices = aliasSalesTypePricesByVariance[index] || {};

          if (variance.itemCode) {
            // ── EXISTING VARIANCE ──────────────────────────────────────────
            const orig = originalVariancesRef.current[variance.itemCode];
            const origBranchwise = (orig as any)?.branchwise || {};

            // ✅ Accurate change detection using branchwise
            const branchStatusActuallyChanged = Object.entries(
              branchItemStatusByVariance[index] || {}
            ).some(([aliasName, newStatus]) => {
              const storedStatus = origBranchwise[aliasName]?.[`ItemStatus_${aliasName}`];
              const newStatusStr = newStatus ? 'active' : 'inactive';
              return storedStatus !== newStatusStr;
            });

            const thisVarianceChanged =
              !orig ||
              variance.varianceName !== orig.varianceName ||
              variance.variance_Uom !== orig.variance_Uom ||
              String(variance.variance_Defaultprice) !== String(orig.variance_Defaultprice) ||
              String(variance.shelfLife) !== String(orig.shelfLife) ||
              String(variance.reorderLevel) !== String(orig.reorderLevel) ||
              (variance.sapCode || '') !== (orig.sapCode || '') ||
              Object.keys(aliasPricesByVariance[index] || {}).length > 0 ||
              branchStatusActuallyChanged || !!variance.varianceImageFile;

            if (!thisVarianceChanged && !mainItemChanged) {
              //    console.log(`⏭️ Skipping variance ${variance.itemCode} — no changes detected`);
              continue;
            }

            //  console.log(`✏️ Updating variance ${index} — itemCode: ${variance.itemCode}`);

            // ✅ If variance_Uom is Pcs, force uniqueQr to false regardless of UI state
            const isPcsUom = variance.variance_Uom?.trim().toLowerCase() === 'pcs';
            const effectiveUniqueQr = isPcsUom ? false : (newItem.uniqueQr || false);

            const varianceUpdates: Record<string, any> = {
              itemName: newItem.itemName,
              category: newItem.category,
              subCategory: newItem.subCategory,
              varianceName: variance.varianceName,
              variance_Uom: variance.variance_Uom,
              variance_Defaultprice: parseFloat(variance.variance_Defaultprice as string) || 0,
              reorderLevel: parseInt(variance.reorderLevel as string || '0'),
              shelfLife: parseInt(variance.shelfLife as string || '0'),
              sapCode: variance.sapCode || '',
              netPrice: parseFloat(netPrice.toFixed(2)),
              taxPrice: parseFloat(taxPrice.toFixed(2)),
              finalPrice: parseFloat(finalPrice.toFixed(2)),
              birthdayCake: newItem.birthdayCake || false,
              uniqueQr: effectiveUniqueQr,
              stockValidation: newItem.stockValidation || false,
              includeTax: newItem.includeTax || false,
              excludeTax: newItem.excludeTax || false,
            };

            // ✅ Build branchData by converting branchwise (API format) → branchData (DB format)
            const existingBranchData: Record<string, any> = {};

            // ✅ Detect if variance price changed
            const newVariancePrice = parseFloat(variance.variance_Defaultprice as string) || 0;
            const origVariancePrice = parseFloat(String(orig?.variance_Defaultprice || 0));
            const priceChanged = newVariancePrice !== origVariancePrice;

            branchess.forEach((branch: Branch) => {
              const aliasName = branch.aliasName;
              const branchId = branch.locationId;
              const hasOverridePrices = varianceAliasPrices[aliasName] !== undefined;
              const storedItemStatus = branchItemStatusByVariance[index]?.[aliasName];

              // ✅ Read existing values from branchwise (API format)
              const existingBranchwise = origBranchwise[aliasName] || {};
              const existingStatus = existingBranchwise[`ItemStatus_${aliasName}`] || 'active';
              const existingPrice = existingBranchwise[`Price_${aliasName}`]
                ?? parseFloat(variance.variance_Defaultprice as string)
                ?? 0;

              // ✅ Determine effective price for this branch
              const effectivePrice = hasOverridePrices
                ? (parseFloat(varianceAliasPrices[aliasName]) || existingPrice)
                : priceChanged
                  ? newVariancePrice   // ✅ price changed — use new price
                  : existingPrice;     // ✅ price unchanged — keep existing DB price

              existingBranchData[branchId] = {
                EnableBranch: 'Y',
                // ✅ Only override ItemStatus if user explicitly toggled
                ItemStatus: storedItemStatus !== undefined
                  ? (storedItemStatus ? 'active' : 'inactive')
                  : existingStatus,
                Price: effectivePrice,
              };

              //  console.log(`🔄 Branch ${aliasName} (${branchId}): status=${existingBranchData[branchId].ItemStatus}, price=${effectivePrice}`);

              if (hasOverridePrices) {
                // ✅ User explicitly set override prices — use those
                const salesTypesForBranch = varianceSalesTypePrices[aliasName] || {};
                Object.entries(salesTypesForBranch).forEach(([stName, stPrice]) => {
                  const stId = orderTypeNameToId[stName.toUpperCase()] || stName;
                  existingBranchData[branchId][stId] = parseFloat(stPrice as string) || 0;
                });
              } else {
                // ✅ No override — update sales type prices based on price change
                const salesTypeNames = salesTypesByBranch[aliasName] || [];
                salesTypeNames.forEach(stName => {
                  const stId = orderTypeNameToId[stName.toUpperCase()] || stName;
                  const existingSalesTypePrice = existingBranchwise[`${stName}_${aliasName}`];

                  if (priceChanged) {
                    // ✅ Price changed — update all sales type prices to new price
                    existingBranchData[branchId][stId] = newVariancePrice;
                  } else {
                    // ✅ Price unchanged — keep existing sales type price from DB
                    existingBranchData[branchId][stId] = existingSalesTypePrice ?? existingPrice;
                  }
                });
              }
            });

            varianceUpdates.branchData = existingBranchData;

            await dispatch(
              updateVariance({
                itemCode: variance.itemCode,
                updates: varianceUpdates,
                page: currentPage,
                limit: 15,
                itemName: search,
              })
            ).unwrap();


            if (variance.varianceImageFile) {
              try {
                if (variance.varianceImage) {
                  await dispatch(updateVarianceImage({ itemCode: variance.itemCode, file: variance.varianceImageFile })).unwrap();
                } else {
                  await dispatch(uploadVarianceImage({ itemCode: variance.itemCode, file: variance.varianceImageFile })).unwrap();
                }
              } catch (imgErr) {
                console.error('Variance image processing failed:', imgErr);
              }
            }

          } else {
            // ── NEW VARIANCE — sequential to avoid itemCode race condition ──
            //  console.log(`Creating new variance ${index}`);

            let itemCode = 'BMFG0001';
            try {
              const codeResponse = await axios.get<{ next_itemCode: string }>(
                `${API_BASE_URL}/itemmasters/next-fgcode/`
              );
              itemCode = codeResponse.data.next_itemCode;
            } catch (error) {
              console.warn('Failed to fetch next-fgcode, defaulting to BMFG0001:', error);
            }

            const payload: Record<string, any> = {
              itemCode,
              sapCode: variance.sapCode || '',
              itemType: newItem.itemType || "",
              itemName: newItem.itemName || '',
              varianceName: variance.varianceName || '',
              variance_Uom: variance.variance_Uom || '',
              category: newItem.category || '',
              subCategory: newItem.subCategory || '',
              itemGroup: newItem.itemGroup || '',
              item_Defaultprice: parseFloat(newItem.item_Defaultprice as string) || 0,
              item_Uom: newItem.uom || '',
              variance_Defaultprice: parseFloat(variance.variance_Defaultprice as string) || 0,
              tax: parseFloat(newItem.tax as string) || 0,
              shelfLife: parseInt(variance.shelfLife as string || '0'),
              hsnCode: parseInt(newItem.hsnCode as string) || 0,
              netPrice: parseFloat(netPrice.toFixed(2)),
              taxPrice: parseFloat(taxPrice.toFixed(2)),
              finalPrice: parseFloat(finalPrice.toFixed(2)),
              status: 'Active',
              varianceStatus: "active",
              birthdayCake: newItem.birthdayCake || false,
              uniqueQr: newItem.uniqueQr || false,
              stockValidation: newItem.stockValidation || false,
              includeTax: newItem.includeTax || false,
              excludeTax: newItem.excludeTax || false,
              reorderLevel: parseInt(variance.reorderLevel as string || '0'),
              description: newItem.description || '',
            };

            const branchData: Record<string, any> = {};

            branchess.forEach((branch: Branch) => {
              const aliasName = branch.aliasName;
              const branchId = branch.locationId;

              const storedItemStatus = branchItemStatusByVariance[index]?.[aliasName];
              const itemStatus = storedItemStatus !== undefined
                ? (storedItemStatus ? 'active' : 'inactive')
                : 'active';

              let price = parseFloat(variance.variance_Defaultprice as string) || 0;
              if (varianceAliasPrices[aliasName] !== undefined) {
                price = parseFloat(varianceAliasPrices[aliasName]) || 0;
              }

              branchData[branchId] = { EnableBranch: 'Y', ItemStatus: itemStatus, Price: price };

              const salesTypesForBranch = varianceSalesTypePrices[aliasName] || {};
              const branchSalesTypeNames = salesTypesByBranch[aliasName] || [];

              branchSalesTypeNames.forEach((stName: string) => {
                const stId = orderTypeNameToId[stName.toUpperCase()] || stName;
                branchData[branchId][stId] = salesTypesForBranch[stName] !== undefined
                  ? parseFloat(salesTypesForBranch[stName]) || 0
                  : price;
              });
            });

            payload.branchData = branchData;

            // ✅ await each new variance before moving to next — prevents race condition
            await axios.post(
              `${API_BASE_URL}/itemmasters/add-item/`,
              payload
            );

            variance.itemCode = itemCode;
            //  console.log(`✅ New variance created with itemCode: ${itemCode}`);

            if (variance.varianceImageFile) {
              try {
                await dispatch(uploadVarianceImage({ itemCode, file: variance.varianceImageFile })).unwrap();
              } catch (imgErr) {
                console.error('Variance image upload failed:', imgErr);
              }
            }
          }
        }

        setSnackbar({
          open: true,
          message: newItem.imageFile ? `Item and image updated successfully!` : `Item updated successfully!`,
          severity: 'success',
        });

        if (setSelectedItem) setSelectedItem(null);

        setTimeout(() => { router.back(); }, 800);

      } else {
        setSnackbar({ open: true, message: 'Item ID missing', severity: 'error' });
      }

    } catch (err: any) {
      console.error('Update error:', err);
      const errorMessage = typeof err === 'string'
        ? err
        : err?.response?.data?.detail || err?.message || 'Update failed';
      setSnackbar({ open: true, message: errorMessage, severity: 'error' });
    } finally {
      setLoading(false);
      isSubmittingRef.current = false;
    }
  };


  const handlePriceChange = (alias: string, salesType: string, value: string) => {
    setAliasSalesTypePrices((prev) => ({
      ...prev,
      [alias]: {
        ...prev[alias],
        [salesType]: value,
      },
    }));
  };

  const handleAliasPriceChange = (alias: string, newValue: string) => {
    setAliasPrices((prev) => ({
      ...prev,
      [alias]: newValue,
    }));
  };

  const handleDeleteVariance = (index: number) => {
    setDeleteIndex(index);
    setDeleteOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (deleteIndex !== null) {
      const variance = variances[deleteIndex];
      if (variance.itemCode) {
        setLoading(true);
        try {
          await dispatch(
            deleteVariance({
              itemCode: variance.itemCode,
              page: currentPage,
              limit: 20,
              itemName: search,
            })
          ).unwrap();
          setVariances(variances.filter((_, i) => i !== deleteIndex));
          setSnackbar({
            open: true,
            message: `Variance "${variance.varianceName || 'Unknown'}" deleted successfully`,
            severity: 'success',
          });
        } catch (err: any) {
          const errorMessage = err?.message || 'Failed to delete variance.';
          setError(errorMessage);
          setSnackbar({
            open: true,
            message: errorMessage,
            severity: 'error',
          });
        } finally {
          setLoading(false);
        }
      } else {
        setVariances(variances.filter((_, i) => i !== deleteIndex));
        setSnackbar({
          open: true,
          message: `Variance "${variance.varianceName || 'Unknown'}" deleted successfully`,
          severity: 'success',
        });
      }

      // Clean up override storage for deleted variance
      setAliasPricesByVariance(prev => {
        const updated = { ...prev };
        delete updated[deleteIndex];
        return updated;
      });

      setAliasSalesTypePricesByVariance(prev => {
        const updated = { ...prev };
        delete updated[deleteIndex];
        return updated;
      });
      setDeleteOpen(false);
      setDeleteIndex(null);
    }
  };

  const allBranchAliases = useMemo(() => {
    return (branchess || []).map((b: Branch) => b.aliasName);
  }, [branchess]);

  const branchesToDisplay = useMemo(() => {
    if (enableAllBranches) {
      return allBranchAliases;
    }
    return selectedBranches
      .filter(alias => allBranchAliases.includes(alias))
      .sort((a, b) => allBranchAliases.indexOf(a) - allBranchAliases.indexOf(b));
  }, [enableAllBranches, selectedBranches, allBranchAliases]);

  const isSubmitButtonDisabled = !(
    newItem.category &&
    newItem.subCategory &&
    newItem.uom &&
    // newItem.tax &&
    // newItem.item_Defaultprice &&
    // (newItem.item_Defaultprice !== '' && newItem.item_Defaultprice !== null && newItem.item_Defaultprice !== undefined) &&

    (newItem.itemType === "SFG" || (newItem.item_Defaultprice !== '' && newItem.itemDefaultprice !== null && newItem.item_Defaultprice !== undefined)) &&
    variances.length > 0
  ) || !!itemNameError;


  const isExternalItemsCategory = newItem.category?.toUpperCase() === 'EXTERNAL ITEMS';


  const formatDateTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const datePart = date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    const timePart = date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: true }).toUpperCase();
    return `${datePart} | ${timePart}`;
  };


  return (
   <Box className="item-master-form-page">

      <ItemMaster />

      {/* ✅ Show loading spinner while fetching data */}
      {isFetchingItem ? (
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: 'calc(100vh - 100px)',
            flexDirection: 'column',
            gap: 2
          }}
        >
          <CircularProgress size={30} />
          <Typography variant="body1" color="text.secondary">
            Loading item data...
          </Typography>
        </Box>
      ) : (


        <Container maxWidth={false} sx={{ px: { xs: 2, sm: 3, md: 4 }, py: 1.5 }}>
          <Box sx={{ mb: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="h5" className="dialog-title">Edit Item</Typography>
            <Box sx={{ display: 'flex', gap: 2 }}>
              {/* <button
                className='btn-secondary'
                onClick={() => router.back()}
              //sx={{ textTransform: 'none' }}
              >
                Back
              </button> */}
              <button
                className='btn-secondary'
                onClick={() => setCloseConfirmOpen(true)}
              >
                Back
              </button>
              {/* <button
                className='btn-primary'
                onClick={handleSubmit}
                disabled={isSubmitButtonDisabled || loading}
              // sx={{ textTransform: 'none' }}
              >
                {loading ? 'Saving...' : 'Update'}
              </button> */}
              <button
                className='btn-primary'
                onClick={() => setSaveConfirmOpen(true)}
                disabled={isSubmitButtonDisabled || loading}
              >
                {loading ? 'Saving...' : 'Update'}
              </button>
            </Box>
          </Box>

          <div className="form-section">
            <Grid container spacing={1.2} sx={{ mb: 0 }}>

              {/* ✅ Item Type - FIXED VERSION */}
             <Grid item xs={12} sm={6} md={4} lg={1.2}>
                <Autocomplete
                  size="small"
                  options={inventory}
                  getOptionLabel={(option) => option.inventoryType}
                  slotProps={{
                    clearIndicator: {
                      sx: { display: "none" },
                    },
                  }}
                  renderOption={(props, option) => (
                    <li
                      {...props}
                      style={{
                        fontSize: "12px",
                        minHeight: "16px",
                        paddingTop: "8px",
                        paddingBottom: "8px",
                        fontFamily: "'Poppins', sans-serif",
                      }}
                    >
                      {option.inventoryType}
                    </li>
                  )}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="ItemType *"
                      className="custom-textfield"
                      InputLabelProps={{ className: "custom-label" }}
                      InputProps={{
                        ...params.InputProps,
                        className: "custom-input",
                      }}
                      sx={{
                        "& .MuiAutocomplete-input": {
                          padding: "13px 14px !important",
                          fontSize: "0.813rem",
                        },
                        "& .MuiOutlinedInput-root": {
                          height: "35px",
                          padding: "0 14px !important",
                        },
                      }}
                    />
                  )}
                  onChange={(_, value) =>
                    setNewItem((prev) => ({ ...prev, itemType: value?.inventoryType || "" }))
                  }
                  value={inventory.find((cat) => cat.inventoryType === newItem.itemType) || null}
                  //  disabled={itemLoading}
                  disabled={itemLoading || isExternalItemsCategory}
                />
              </Grid>

              <Grid item xs={12} sm={6} md={4} lg={1.7}>
                <TextField
                  autoComplete="off"
                  label="Item Name *"
                  name="itemName"
                  value={newItem.itemName || ""}
                  onChange={(e) => {
                    handleChange(e);
                    const itemToEdit = selectedItem || fetchedItem;
                    const currentId = itemToEdit?.branchwiseItemId || itemToEdit?.itemId || itemToEdit?.id || '';
                    checkDuplicateItemName(e.target.value, currentId);
                  }}
                  error={!!itemNameError || hasLetterError(newItem.itemName || '')}
                  helperText={
                    itemNameError
                      ? itemNameError
                      : getHelperText(newItem.itemName || '', '')
                  }
                  inputProps={{ maxLength: 40 }}
                  fullWidth
                  className="custom-textfield"
                  InputLabelProps={{ className: "custom-label" }}
                  InputProps={{ className: "custom-input" }}
                  sx={{
                    "& .MuiOutlinedInput-root": { height: "35px" },
                    "& .MuiFormHelperText-root": {
                      fontSize: "0.65rem",
                      margin: "2px 0 0 0",
                      color: "red",
                    },
                  }}
                />
              </Grid>

           <Grid item xs={12} sm={6} md={4} lg={2}>
                <Autocomplete
                  size="small"
                  options={categories}
                  getOptionLabel={(option) => option.categoryName}
                  slotProps={{
                    clearIndicator: {
                      sx: { display: "none" },
                    },
                  }}
                  renderOption={(props, option) => (
                    <li
                      {...props}
                      style={{
                        fontSize: "12px",
                        minHeight: "16px",
                        paddingTop: "8px",
                        paddingBottom: "8px",
                        fontFamily: "'Poppins', sans-serif",
                      }}
                    >
                      {option.categoryName}
                    </li>
                  )}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Category *"
                      className="custom-textfield"
                      InputLabelProps={{ className: "custom-label" }}
                      InputProps={{
                        ...params.InputProps,
                        className: "custom-input",
                      }}
                      sx={{
                        "& .MuiAutocomplete-input": {
                          padding: "13px 14px !important",
                          fontSize: "0.813rem",
                        },
                        "& .MuiOutlinedInput-root": {
                          height: "35px",
                          padding: "0 14px !important",
                        },
                      }}
                    />
                  )}
                  onChange={handleCategoryChange}
                  value={categories.find((cat) => cat.categoryName === newItem.category) || null}
                  // disabled={itemLoading}
                  disabled={itemLoading || isExternalItemsCategory}
                />
              </Grid>

             <Grid item xs={12} sm={6} md={4} lg={2}>
                <Autocomplete
                  size="small"
                  options={
                    newItem.category
                      ? categories
                        .find((cat) => cat.categoryName === newItem.category)
                        ?.subCategory.map((sub) => ({ subCategoryName: sub })) || []
                      : []
                  }
                  getOptionLabel={(option) => option.subCategoryName}
                  slotProps={{
                    clearIndicator: {
                      sx: { display: "none" },
                    },
                  }}
                  renderOption={(props, option) => (
                    <li
                      {...props}
                      style={{
                        fontSize: "12px",
                        minHeight: "16px",
                        paddingTop: "8px",
                        paddingBottom: "8px",
                        fontFamily: "'Poppins', sans-serif",
                      }}
                    >
                      {option.subCategoryName}
                    </li>
                  )}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Sub Category *"
                      placeholder={newItem.category ? "" : "Select Category first"}
                      className="custom-textfield"
                      InputLabelProps={{ className: "custom-label" }}
                      InputProps={{
                        ...params.InputProps,
                        className: "custom-input",
                      }}
                      sx={{
                        "& .MuiAutocomplete-input": {
                          padding: "13px 14px !important",
                          fontSize: "0.813rem",
                        },
                        "& .MuiOutlinedInput-root": {
                          height: "35px",
                          padding: "0 14px !important",
                        },
                      }}
                    />
                  )}
                  onChange={handlesubCategoryChange}
                  value={
                    newItem.subCategory
                      ? { subCategoryName: newItem.subCategory }
                      : null
                  }
                  // disabled={!newItem.category || itemLoading}
                  disabled={!newItem.category || itemLoading || isExternalItemsCategory}
                />
              </Grid>

             <Grid item xs={12} sm={6} md={4} lg={1.5}>
                <Autocomplete
                  size="small"
                  options={itemGroups}
                  getOptionLabel={(option) => option.itemGroupName}
                  slotProps={{
                    clearIndicator: {
                      sx: { display: "none" },
                    },
                  }}
                  renderOption={(props, option) => (
                    <li
                      {...props}
                      style={{
                        fontSize: "12px",
                        minHeight: "16px",
                        paddingTop: "8px",
                        paddingBottom: "8px",
                        fontFamily: "'Poppins', sans-serif",
                      }}
                    >
                      {option.itemGroupName}
                    </li>
                  )}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Item Group"
                      className="custom-textfield"
                      InputLabelProps={{ className: "custom-label" }}
                      InputProps={{
                        ...params.InputProps,
                        className: "custom-input",
                      }}
                      sx={{
                        "& .MuiAutocomplete-input": {
                          padding: "13px 14px !important",
                          fontSize: "0.813rem",
                        },
                        "& .MuiOutlinedInput-root": {
                          height: "35px",
                          padding: "0 14px !important",
                        },
                      }}
                    />
                  )}
                  onChange={(_, value) =>
                    setNewItem((prev) => ({
                      ...prev,
                      itemGroup: value?.itemGroupName || "",
                    }))
                  }
                  value={itemGroups.find((g) => g.itemGroupName === newItem.itemGroup) || null}
                  disabled={itemLoading}
                />
              </Grid>

             <Grid item xs={12} sm={6} md={4} lg={1.2}>
                <Autocomplete
                  size="small"
                  options={uoms}
                  getOptionLabel={(option) => option.uom}
                  slotProps={{
                    clearIndicator: {
                      sx: { display: "none" },
                    },
                  }}
                  renderOption={(props, option) => (
                    <li
                      {...props}
                      style={{
                        fontSize: "12px",
                        minHeight: "16px",
                        paddingTop: "8px",
                        paddingBottom: "8px",
                        fontFamily: "'Poppins', sans-serif",
                      }}
                    >
                      {option.uom}
                    </li>
                  )}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="UOM *"
                      className="custom-textfield"
                      InputLabelProps={{ className: "custom-label" }}
                      InputProps={{
                        ...params.InputProps,
                        className: "custom-input",
                      }}
                      sx={{
                        "& .MuiAutocomplete-input": {
                          padding: "13px 14px !important",
                          fontSize: "0.813rem",
                        },
                        "& .MuiOutlinedInput-root": {
                          height: "35px",
                          padding: "0 14px !important",
                        },
                      }}
                    />
                  )}
                  onChange={(_, value) =>
                    setNewItem((prev) => ({ ...prev, uom: value?.uom || "" }))
                  }
                  value={uoms.find((u) => u.uom === newItem.uom) || null}
                />
              </Grid>

             <Grid item xs={12} sm={6} md={4} lg={1.5}>
                <Autocomplete
                  size="small"
                  options={taxes}
                  getOptionLabel={(option) =>
                    `${option.taxName} (${option.taxPercentage}%)`
                  }
                  slotProps={{
                    clearIndicator: {
                      sx: { display: "none" },
                    },
                  }}
                  renderOption={(props, option) => (
                    <li
                      {...props}
                      style={{
                        fontSize: "12px",
                        minHeight: "16px",
                        paddingTop: "8px",
                        paddingBottom: "8px",
                        fontFamily: "'Poppins', sans-serif",
                      }}
                    >
                      {`${option.taxName} (${option.taxPercentage}%)`}
                    </li>
                  )}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Tax *"
                      className="custom-textfield"
                      InputLabelProps={{ className: "custom-label" }}
                      InputProps={{
                        ...params.InputProps,
                        className: "custom-input",
                      }}
                      sx={{
                        "& .MuiAutocomplete-input": {
                          padding: "13px 14px !important",
                          fontSize: "0.813rem",
                        },
                        "& .MuiOutlinedInput-root": {
                          height: "35px",
                          padding: "0 14px !important",
                        },
                      }}
                    />
                  )}
                  onChange={(_, value) =>
                    setNewItem((prev) => ({
                      ...prev,
                      tax: value ? (value.taxPercentage) : 0,
                    }))
                  }
                  value={taxes.find((t) => (t.taxPercentage) === newItem.tax) || null}
                />
              </Grid>

              {/* <Grid item xs={12} sm={6} md={4} lg={0.9}>
                <TextField
                  autoComplete="off"
                  label="Price *"
                  name="item_Defaultprice"
                  // value={newItem.item_Defaultprice || ""}
                 // value={newItem.item_Defaultprice === 0 ? 0 : (newItem.item_Defaultprice || "")}
                  onChange={handleChange}
                  fullWidth
                  className="custom-textfield"
                  InputLabelProps={{ className: "custom-label" }}
                  InputProps={{ className: "custom-input" }}
                  inputProps={{ inputMode: 'decimal' }}
                  sx={{ "& .MuiOutlinedInput-root": { height: "35px" } }}
                />
              </Grid> */}


             <Grid item xs={12} sm={6} md={4} lg={0.9}>
                <TextField
                  autoComplete="off"
                  label="Price *"
                  name="item_Defaultprice"
                  // ✅ UPDATED: Show 0 when SFG, otherwise show actual value
                  value={newItem.itemType === "SFG" ? 0 : (newItem.item_Defaultprice === 0 ? 0 : (newItem.item_Defaultprice || ""))}
                  onChange={handleChange}
                  fullWidth
                  className="custom-textfield"
                  InputLabelProps={{ className: "custom-label" }}
                  InputProps={{
                    className: "custom-input",
                    style: newItem.itemType === "SFG" ? { backgroundColor: "#f5f5f5" } : {}
                  }}
                  inputProps={{ inputMode: 'decimal' }}
                  sx={{ "& .MuiOutlinedInput-root": { height: "35px" } }}
                  // ✅ ADDED: Disable when item type is SFG
                  disabled={newItem.itemType === "SFG"}
                />
              </Grid>


              {/* Second Row: Net Price to Tax Price */}
             <Grid item xs={12} sm={6} md={4} lg={1}>
                <TextField
                  autoComplete="off"
                  label="Net Price"
                  value={newItem.netPrice || ""}
                  disabled={true}
                  fullWidth
                  className="custom-textfield"
                  InputLabelProps={{ className: "custom-label" }}
                  InputProps={{
                    className: "custom-input",
                    style: { backgroundColor: "#f5f5f5" },
                  }}
                  sx={{ "& .MuiOutlinedInput-root": { height: "35px" } }}
                />
              </Grid>

            <Grid item xs={12} sm={6} md={4} lg={1}>
                <TextField
                  autoComplete="off"
                  label="Tax Price"
                  value={newItem.taxPrice || ""}
                  disabled={true}
                  fullWidth
                  className="custom-textfield"
                  InputLabelProps={{ className: "custom-label" }}
                  InputProps={{
                    className: "custom-input",
                    style: { backgroundColor: "#f5f5f5" },
                  }}
                  sx={{ "& .MuiOutlinedInput-root": { height: "35px" } }}
                />
              </Grid>

              <Grid item xs={12} sm={6} md={4} lg={1}>
                <TextField
                  autoComplete="off"
                  label="Final Price"
                  value={newItem.finalPrice || ""}
                  disabled={true}
                  fullWidth
                  className="custom-textfield"
                  InputLabelProps={{ className: "custom-label" }}
                  InputProps={{
                    className: "custom-input",
                    style: { backgroundColor: "#f5f5f5" },
                  }}
                  sx={{ "& .MuiOutlinedInput-root": { height: "35px" } }}
                />
              </Grid>

             <Grid item xs={12} sm={6} md={4} lg={1.5}>
                <TextField
                  autoComplete="off"
                  label="Description"
                  name="description"
                  value={newItem.description || ""}
                  onChange={handleChange}
                  error={hasLetterError(newItem.description || '')}
                  helperText={getHelperText(newItem.description || '', '')}
                  inputProps={{ maxLength: 200 }}
                  fullWidth
                  className="custom-textfield"
                  InputLabelProps={{ className: "custom-label" }}
                  InputProps={{ className: "custom-input" }}
                  sx={{
                    "& .MuiOutlinedInput-root": { height: "35px" },
                    "& .MuiFormHelperText-root": {
                      fontSize: "0.65rem",
                      margin: "2px 0 0 0",
                      color: "red",
                    },
                  }}
                />
              </Grid>

            <Grid item xs={12} sm={6} md={4} lg={1.1}>
                <TextField
                  autoComplete="off"
                  label="HSN Code"
                  name="hsnCode"
                  value={newItem.hsnCode || ""}
                  onChange={handleChange}
                  fullWidth
                  className="custom-textfield"
                  InputLabelProps={{ className: "custom-label" }}
                  InputProps={{ className: "custom-input" }}
                  sx={{ "& .MuiOutlinedInput-root": { height: "35px" } }}
                />
              </Grid>

            <Grid item xs={12} sm={6} md={4} lg={0.9} >
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={newItem.birthdayCake}
                      // onChange={(e) =>
                      //   setNewItem((prev) => ({
                      //     ...prev,
                      //     birthdayCake: e.target.checked,
                      //   }))
                      // }
                      onChange={(e) => {
                        const isChecked = e.target.checked;
                        setNewItem((prev) => ({
                          ...prev,
                          birthdayCake: isChecked,
                          uniqueQr: isChecked, // Enable uniqueQr when birthdayCake is checked
                        }));
                      }}
                      size="small"
                    />
                  }
                  label={<Typography variant="caption">Birthday Cake</Typography>}
                />
              </Grid>

              <Grid item xs={12} sm={6} md={4} lg={0.9} >
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={newItem.uniqueQr}
                      onChange={(e) => {
                        // If birthdayCake is enabled, uniqueQr must stay enabled
                        if (newItem.birthdayCake && !e.target.checked) return;
                        setNewItem((prev) => ({
                          ...prev,
                          uniqueQr: e.target.checked,
                        }));
                      }}
                      size="small"
                    />
                  }
                  label={<Typography variant="caption">Unique QR</Typography>}
                />
              </Grid>


             <Grid item xs={12} sm={6} md={4} lg={1} >
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={newItem.stockValidation}
                      onChange={(e) => {
                        const isChecked = e.target.checked;
                        setNewItem((prev) => ({
                          ...prev,
                          stockValidation: isChecked,
                          // uniqueQr: isChecked, // Enable uniqueQr when birthdayCake is checked
                        }));
                      }}
                      size="small"
                    />
                  }
                  label={<Typography variant="caption">Stock Validation</Typography>}
                />
              </Grid>


             <Grid item xs={12} sm={6} md={4} lg={0.84}>
                <FormControlLabel
                  control={
                    <Radio
                      checked={!excludeTaxItem}
                      onChange={(e) => {
                        const isIncludeTax = e.target.checked;
                        setExcludeTaxItem(!isIncludeTax);
                        setNewItem((prev) => ({
                          ...prev,
                          includeTax: isIncludeTax,
                          excludeTax: !isIncludeTax,
                        }));
                      }}
                      size="small"
                    />
                  }
                  label={<Typography variant="caption">Include Tax</Typography>}
                />
              </Grid>


            <Grid item xs={12} sm={6} md={4} lg={0.9}>
                <FormControlLabel
                  control={
                    <Radio
                      checked={excludeTaxItem}
                      onChange={(e) => {
                        const isExcludeTax = e.target.checked;
                        setExcludeTaxItem(isExcludeTax);
                        setNewItem((prev) => ({
                          ...prev,
                          excludeTax: isExcludeTax,
                          includeTax: !isExcludeTax,
                        }));
                      }}
                      size="small"
                    />
                  }
                  label={<Typography variant="caption">Exclude Tax</Typography>}
                />
              </Grid>


              {/* <Grid item xs={12} sm={6} md={4} lg={0.9} >
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={newItem.plateItem}
                      onChange={(e) =>
                        setNewItem((prev) => ({
                          ...prev,
                          plateItem: e.target.checked,
                        }))
                      }
                      size="small"
                    />
                  }
                  label={<Typography variant="caption">Plate Item</Typography>}
                />
              </Grid> */}

              {/* 
              <Grid item xs={12} sm={6} md={4} lg={1.6}>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1.5,
                  }}
                >

                  <Box
                    onClick={() => (newItem.image || newItem.itemImage) && window.open(newItem.image || newItem.itemImage, "_blank")}
                    sx={{
                      cursor: (newItem.image || newItem.itemImage) ? "pointer" : "default",
                      width: 40,
                      height: 40,
                      border: "1px solid #e0e0e0",
                      borderRadius: "8px",
                      overflow: "hidden",
                      flexShrink: 0,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      backgroundColor: (newItem.image || newItem.itemImage) ? "transparent" : "#f5f5f5",
                    }}
                  >
                    {(newItem.image || newItem.itemImage) ? (
                      <img
                        src={newItem.image || newItem.itemImage}  // ✅ Show new image first, then stored image
                        alt="Item Preview"
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                        }}
                      />
                    ) : (
                      <Typography variant="caption" color="text.secondary">
                        No Image
                      </Typography>
                    )}
                  </Box>


                  <Box sx={{ display: "flex", gap: 1 }}>

                    <label htmlFor="image-upload-edit">
                      <Button
                        variant="outlined"
                        component="span"
                        size="small"
                        sx={{ minWidth: 60, textTransform: 'none' }}
                      >
                        Change
                      </Button>
                    </label>


                    {newItem.imageFile && (
                      <Button
                        variant="outlined"
                        color="error"
                        size="small"
                        sx={{ minWidth: 40 }}
                        onClick={() =>
                          setNewItem((prev) => ({
                            ...prev,
                            imageFile: undefined,
                            image: undefined, // ✅ Clear the preview, will show itemImage again
                          }))
                        }
                        title="Cancel Change"
                      >
                        <DeleteIcon fontSize="small" />
                      </Button>
                    )}
                  </Box>
                </Box>


                <input
                  type="file"
                  accept="image/*"
                  id="image-upload-edit"
                  style={{ display: "none" }}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const previewUrl = URL.createObjectURL(file);
                      //  console.log('New image preview URL:', previewUrl); // Debug log
                      setNewItem((prev) => ({
                        ...prev,
                        imageFile: file,
                        image: previewUrl, // ✅ Set new preview
                      }));
                    }
                  }}
                />
              </Grid> */}






            <Grid item xs={12} sm={6} md={4} lg={1.6}>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1.5,
                  }}
                >

                  <Box
                    onClick={() => (newItem.image || newItem.itemImage) && window.open(newItem.image || newItem.itemImage, "_blank")}
                    sx={{
                      cursor: (newItem.image || newItem.itemImage) ? "pointer" : "default",
                      width: 40,
                      height: 40,
                      border: "1px solid #e0e0e0",
                      borderRadius: "8px",
                      overflow: "hidden",
                      flexShrink: 0,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      backgroundColor: (newItem.image || newItem.itemImage) ? "transparent" : "#f5f5f5",
                    }}
                  >
                    {(newItem.image || newItem.itemImage) ? (
                      <img
                        src={newItem.image || newItem.itemImage}
                        alt="Item Preview"
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                        }}
                      />
                    ) : (
                      <Typography variant="caption" color="text.secondary">
                        No Image
                      </Typography>
                    )}
                  </Box>


                  <Box sx={{ display: "flex", gap: 1 }}>

                    <label htmlFor="image-upload-edit">
                      <Button
                        variant="outlined"
                        component="span"
                        size="small"
                        sx={{ minWidth: 60, textTransform: 'none' }}
                      >
                        Change
                      </Button>
                    </label>


                    {newItem.imageFile && (
                      <Button
                        variant="outlined"
                        color="error"
                        size="small"
                        sx={{ minWidth: 40 }}
                        onClick={() => {
                          setNewItem((prev) => ({
                            ...prev,
                            imageFile: undefined,
                            image: undefined,
                          }));
                          setImageError(''); // ✅ Clear error when removing image
                        }}
                        title="Cancel Change"
                      >
                        <DeleteIcon fontSize="small" />
                      </Button>
                    )}
                  </Box>
                </Box>


                {/* ✅✅✅ UPDATED FILE INPUT WITH VALIDATION ✅✅✅ */}
                <input
                  type="file"
                  accept=".png,.jpeg,.jpg,.webp,.gif,.bmp,.svg"
                  id="image-upload-edit"
                  style={{ display: "none" }}
                  onChange={(e) => {
                    const file = e.target.files?.[0];

                    // ✅ Clear previous error
                    setImageError('');

                    if (!file) return;

                    // ✅ VALID FILE EXTENSIONS LIST
                    const validExtensions = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif', 'image/bmp', 'image/svg+xml'];
                    const validExtensionNames = ['.png', '.jpeg', '.jpg', '.webp'];

                    // Get file extension
                    const fileName = file.name.toLowerCase();
                    const fileExtension = fileName.substring(fileName.lastIndexOf('.'));

                    // Check MIME type AND extension
                    const isValidType = validExtensions.includes(file.type);
                    const isValidExtension = validExtensionNames.includes(fileExtension);

                    if (!isValidType || !isValidExtension) {
                      // ❌ INVALID FILE - Show Error
                      setImageError(`Invalid format!`);

                      // Reset input so user can try again
                      e.target.value = '';

                      setSnackbar({
                        open: true,
                        message: `❌ Invalid file format! Please upload: PNG, JPEG, JPG, WEBP, GIF, BMP, or SVG`,
                        severity: 'error',
                      });
                      return;
                    }

                    // ✅ VALID FILE - Check file size (max 5MB)
                    const maxSizeInBytes = 5 * 1024 * 1024; // 5MB
                    if (file.size > maxSizeInBytes) {
                      setImageError('File too large! Maximum size is 5MB');
                      e.target.value = '';

                      setSnackbar({
                        open: true,
                        message: '❌ File too large! Maximum size allowed is 5MB',
                        severity: 'error',
                      });
                      return;
                    }

                    // ✅ ALL VALIDATIONS PASSED - Set image
                    const previewUrl = URL.createObjectURL(file);
                    setNewItem((prev) => ({
                      ...prev,
                      imageFile: file,
                      image: previewUrl,
                    }));
                  }}
                />

                {/* ✅✅✅ ERROR MESSAGE DISPLAY ✅✅✅ */}
                {imageError && (
                  <Typography
                    variant="caption"
                    sx={{
                      display: 'block',
                      mt: 0.5,
                      color: '#d32f2f',
                      fontSize: '0.7rem',
                      fontFamily: "'Poppins', sans-serif",
                      width: '100%',
                    }}
                  >
                    ⚠️ {imageError}
                  </Typography>
                )}
              </Grid>




            </Grid>
          </div>


          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              width: '100%',
              mb: 1,
            }}
          >
            {/* Left spacer */}
            <Box sx={{ flex: 1 }} />

            {/* Center - Search Field */}
            <Box sx={{ flex: '0 0 auto', display: 'flex', justifyContent: 'center' }}>
              <TextField
                size="small"
                variant="outlined"
                autoComplete="off"
                placeholder="Search Variances..."
                value={varianceSearch}
                onChange={(e) => setVarianceSearch(e.target.value)}
                className="custom-textfield"
                sx={{
                  width: '300px',
                  '& .MuiInputBase-root': {
                    '&:hover fieldset': { borderColor: '#000000', borderWidth: 2 },
                    '&.Mui-focused fieldset': { borderColor: '#000000', borderWidth: 2 },
                    height: '30px',
                    fontSize: '0.75rem'
                  }
                }}
                InputProps={{
                  startAdornment: (
                    <SearchIcon sx={{ color: 'text.secondary', mr: 1, fontSize: '1.2rem' }} />
                  ),
                }}
              />
            </Box>

            {/* Right - Add Variance Button */}
            <Box sx={{ flex: 1, display: 'flex', justifyContent: 'flex-end' }}>
              <button
                className="btn-primary"
                onClick={handleAddNewVariance}
                style={{
                  padding: '6px 12px',
                  fontSize: '0.75rem',
                  whiteSpace: 'nowrap'
                }}
                disabled={isExternalItemsCategory}
              >
                Add Variance
              </button>
            </Box>
          </Box>



          <Box sx={{
            mt: 0.5,
            width: '100%',
            overflow: 'hidden'
          }}>
            <div
              // className="table-container"
              style={{
                maxHeight: 'calc(84vh - 170px)',
                width: '100%',
                overflow: 'auto'
              }}
            >
              {/* Fixed Header Table */}
              <table
                className="custom-table"
                style={{
                  borderCollapse: 'separate',
                  borderSpacing: '0 2px', // Reduced vertical spacing
                  width: '100%',
                  minWidth: 'fit-content'
                }}
              >
                <thead>
                  <tr>
                    <th style={{ minWidth: '70px', padding: '8px 4px' }}>Image</th>
                    <th style={{ minWidth: '90px' }}>ItemCode</th>
                    <th style={{ minWidth: '90px', padding: '4px 4px' }}>SAP Code</th>
                    <th style={{ minWidth: '160px', padding: '8px 4px' }}>Variance Name</th>
                    <th style={{ minWidth: '90px', padding: '8px 4px' }}>UOM</th>
                    <th style={{ minWidth: '130px', padding: '8px 4px' }}>Price</th>
                    <th style={{ minWidth: '80px', }}>Net Price</th>
                    <th style={{ minWidth: '100px', padding: '8px 4px' }}>Tax Price</th>
                    <th style={{ minWidth: '100px', padding: '8px 4px' }}>Final Price</th>
                    <th style={{ minWidth: '70px', padding: '8px 4px' }}>ROL</th>
                    <th style={{ minWidth: '80px', padding: '8px 4px' }}>Shelf Life</th>
                    <th style={{ minWidth: '80px', padding: '8px 4px' }}>Created Date</th>

                    <th style={{ minWidth: '60px', padding: '8px 4px' }}>Actions</th>
                  </tr>
                </thead>



                <tbody>
                  {filteredVariances.map((variance) => {
                    const originalIndex = variances.findIndex(v => v === variance);

                    const priceNum = parseFloat(String(variance.variance_Defaultprice)) || 0;
                    const taxNum = parseFloat(String(newItem.tax)) || 0;

                    let netPrice = "";
                    let taxPrice = "";
                    let finalPrice = "";

                    // ✅ FIXED: Handle tax = 0% correctly
                    if (!isNaN(priceNum) && priceNum > 0) {
                      if (!isNaN(taxNum) && taxNum > 0) {
                        if (!excludeTaxItem) {
                          netPrice = (priceNum / (1 + taxNum / 100)).toFixed(2);
                          taxPrice = (priceNum - parseFloat(netPrice)).toFixed(2);
                          finalPrice = priceNum.toFixed(2);
                        } else {
                          netPrice = priceNum.toFixed(2);
                          taxPrice = (priceNum * (taxNum / 100)).toFixed(2);
                          finalPrice = (priceNum + parseFloat(taxPrice)).toFixed(2);
                        }
                      } else {
                        // ✅ Tax is 0% - show price as-is
                        netPrice = priceNum.toFixed(2);
                        taxPrice = "0.00";
                        finalPrice = priceNum.toFixed(2);
                      }
                    }

                    return (
                      <tr key={originalIndex} style={{ margin: 0, padding: 0 }}>


                        <td style={{ padding: '2px 4px', textAlign: 'center' }}>
                          <input
                            type="file"
                            accept=".png,.jpeg,.jpg,.webp"
                            id={`variance-image-edit-${originalIndex}`}
                            style={{ display: 'none' }}
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (!file) return;
                              const valid = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
                              if (!valid.includes(file.type)) {
                                setSnackbar({ open: true, message: 'Invalid image format!', severity: 'error' });
                                e.target.value = '';
                                return;
                              }
                              handleVarianceImageChange(originalIndex, file);
                            }}
                          />
                          <label htmlFor={`variance-image-edit-${originalIndex}`}>
                            <IconButton component="span" size="small" title="Upload Variance Image">
                              {(variance.varianceImagePreview || variance.varianceImage) ? (
                                <Box component="img" src={variance.varianceImagePreview || variance.varianceImage} alt="variance"
                                  sx={{ width: 28, height: 28, borderRadius: '4px', objectFit: 'cover', border: '1px solid #e0e0e0' }} />
                              ) : (
                                <ImageIcon fontSize="small" />
                              )}
                            </IconButton>
                          </label>
                        </td>


                        <td style={{ padding: '0px 0px' }}>
                          <Typography
                            variant="body2"
                            sx={{
                              fontSize: "0.75rem",
                              fontFamily: "'Poppins', sans-serif",
                              color: "rgb(55, 65, 81)",
                              paddingLeft: "10px",
                              minWidth: "100px",
                              display: "flex",
                              alignItems: "center",
                              height: "32px"
                            }}
                          >
                            {variance.itemCode || "-"}
                          </Typography>
                        </td>

                        {/* SAP Code */}
                        <td style={{ padding: '2px 4px' }}>
                          <TextField
                            autoComplete="off"
                            size="small"
                            name="sapCode"
                            value={variance.sapCode || ""}
                            //  onChange={(e) => handleVarianceChange(originalIndex, 'sapCode', e.target.value)}
                            onChange={(e) => {
                              const value = e.target.value;
                              if (/^[a-zA-Z0-9]*$/.test(value)) {
                                handleVarianceChange(originalIndex, 'sapCode', value);
                              }
                            }}
                            className="custom-textfield"
                            InputLabelProps={{ className: "custom-label" }}
                            InputProps={{ className: "custom-input" }}
                            sx={{
                              "& .MuiOutlinedInput-root": {
                                height: "32px",
                                fontSize: "0.75rem",
                                width: "100%",
                                minWidth: "100px",
                                fontFamily: "'Poppins', sans-serif",
                                ml: -2,
                              },
                              "& .MuiInputBase-input": {
                                padding: "6px 8px",
                              },
                            }}
                          />
                        </td>


                        {/* Variance Name */}
                        <td style={{ padding: '2px 4px' }}>

                          <Tooltip
                            title={variance.varianceName || ""}
                            arrow
                            placement="top"
                          >

                            <TextField
                              autoComplete="off"
                              size="small"
                              name="varianceName"
                              value={variance.varianceName || ""}
                              onChange={(e) => {
                                const filtered = e.target.value
                                  .toUpperCase()
                                  .replace(/[^a-zA-Z0-9\s\-.,/&()]/g, '') // strip special chars
                                  .slice(0, 50);                        // max 50
                                handleVarianceChange(originalIndex, 'varianceName', filtered);
                              }}
                              error={!variance.varianceName || hasLetterError(variance.varianceName)}
                              className="custom-textfield"
                              InputLabelProps={{ className: "custom-label" }}
                              InputProps={{ className: "custom-input" }}
                              sx={{
                                "& .MuiOutlinedInput-root": {
                                  height: "32px",
                                  fontSize: "0.75rem",
                                  width: "100%",
                                  minWidth: "220px",
                                  fontFamily: "'Poppins', sans-serif",
                                },
                                "& .MuiFormHelperText-root": {
                                  margin: 0,
                                  fontSize: "0.65rem",
                                  position: "absolute",
                                  bottom: "-18px",
                                },
                              }}
                            />
                          </Tooltip>
                        </td>

                        {/* UOM */}
                        <td style={{ padding: '2px 4px' }}>
                          <Autocomplete
                            size="small"
                            options={uoms}
                            getOptionLabel={(option) => option.uom}
                            slotProps={{
                              clearIndicator: {
                                sx: { display: "none" },
                              },
                            }}
                            value={uoms.find((u) => u.uom === variance.variance_Uom) || null}
                            onChange={(_, value) =>
                              handleVarianceChange(originalIndex, "variance_Uom", value?.uom || "")
                            }
                            isOptionEqualToValue={(option, value) => option.uom === value.uom}
                            renderOption={(props, option) => (
                              <li
                                {...props}
                                style={{
                                  fontSize: "0.75rem",
                                  minHeight: "16px",
                                  padding: "6px 8px",
                                  fontFamily: "'Poppins', sans-serif",
                                }}
                              >
                                {option.uom}
                              </li>
                            )}
                            renderInput={(params) => (
                              <TextField
                                {...params}
                                error={!variance.variance_Uom}
                                //  helperText={!variance.variance_Uom ? "Required" : ""}
                                InputLabelProps={{ className: "custom-label" }}
                                className="custom-textfield"
                                sx={{
                                  "& .MuiOutlinedInput-root": {
                                    height: "32px",
                                    fontSize: "0.75rem",
                                    width: "110%",
                                    minWidth: "90px",
                                    fontFamily: "'Poppins', sans-serif",
                                    ml: -0.6,
                                  },
                                  "& .MuiFormHelperText-root": {
                                    //  margin: 0,
                                    fontSize: "0.65rem",
                                    position: "absolute",
                                    bottom: "-18px",
                                  },
                                }}
                              />
                            )}
                          />
                        </td>

                        {/* Price */}
                        {/* <td style={{ padding: '2px 4px' }}>
                          <TextField
                            autoComplete="off"
                            size="small"
                            name="variance_Defaultprice"
                            value={variance.variance_Defaultprice || variance.variance_Defaultprice === 0 ? variance.variance_Defaultprice : ""}
                            // onChange={(e) => handleVarianceChange(originalIndex, 'variance_Defaultprice', e.target.value)}
                            onChange={(e) => {
                              const value = e.target.value;
                              if (/^\d{0,4}(\.\d{0,2})?$/.test(value)) {
                                handleVarianceChange(originalIndex, 'variance_Defaultprice', value);
                              }
                            }}
                            error={variance.variance_Defaultprice === '' || variance.variance_Defaultprice === null || variance.variance_Defaultprice === undefined}
                            disabled={variance.itemType === "SFG"}
                            //    helperText={!variance.variance_Defaultprice ? "Required" : ""}
                            className="custom-textfield"
                            InputLabelProps={{ className: "custom-label" }}
                            InputProps={{
                              className: "custom-input",
                              endAdornment: (
                                <Button
                                  size="small"
                                  onClick={() => handlePriceOverrideClick(originalIndex)}
                                  variant="outlined"
                                  disabled={variance.itemType === "SFG"}
                                  sx={{
                                    minWidth: "auto",
                                    height: "24px",
                                    fontSize: "0.65rem",
                                    padding: "0 6px",
                                    whiteSpace: "nowrap",
                                    textTransform: "none",
                                    fontFamily: "'Poppins', sans-serif",
                                    borderColor: "#000000",
                                    color: "rgb(55, 65, 81)",
                                    marginRight: "-6px",
                                    "&:hover": {
                                      backgroundColor: "rgb(249, 250, 251)",
                                      borderColor: "#000000",
                                    }
                                  }}
                                >
                                  Override
                                </Button>
                              )
                            }}
                            sx={{
                              "& .MuiOutlinedInput-root": {
                                height: "32px",
                                fontSize: "0.75rem",
                                width: "100%",
                                minWidth: "145px",
                                fontFamily: "'Poppins', sans-serif",
                                ml: 0.2,
                              },
                              "& .MuiInputBase-input": {
                                padding: "6px 8px 6px 10px",
                              },
                              "& .MuiFormHelperText-root": {
                                margin: 0,
                                fontSize: "0.65rem",
                                position: "absolute",
                                bottom: "-18px",
                              },
                            }}
                          />
                        </td> */}


                        {/* Price */}
                        <td style={{ padding: '2px 4px' }}>
                          <TextField
                            autoComplete="off"
                            size="small"
                            name="variance_Defaultprice"
                            // ✅ UPDATED: Show 0 when SFG type, otherwise show actual value
                            value={
                              (variance.itemType === "SFG" || newItem.itemType === "SFG")
                                ? 0
                                : (variance.variance_Defaultprice || variance.variance_Defaultprice === 0
                                  ? variance.variance_Defaultprice
                                  : "")
                            }
                            onChange={(e) => {
                              const value = e.target.value;
                              if (/^\d{0,4}(\.\d{0,2})?$/.test(value)) {
                                handleVarianceChange(originalIndex, 'variance_Defaultprice', value);
                              }
                            }}
                            error={
                              // ✅ UPDATED: Don't show error when SFG (price is forced to 0)
                              !(variance.itemType === "SFG" || newItem.itemType === "SFG") &&
                              (variance.variance_Defaultprice === '' || variance.variance_Defaultprice === null || variance.variance_Defaultprice === undefined)
                            }
                            // ✅ UPDATED: Disable for SFG items OR when main item type is SFG
                            disabled={variance.itemType === "SFG" || newItem.itemType === "SFG"}
                            className="custom-textfield"
                            InputLabelProps={{ className: "custom-label" }}
                            InputProps={{
                              className: "custom-input",
                              style: (variance.itemType === "SFG" || newItem.itemType === "SFG")
                                ? { backgroundColor: "#f5f5f5" }
                                : {},
                              endAdornment: (
                                <Button
                                  size="small"
                                  onClick={() => handlePriceOverrideClick(originalIndex)}
                                  variant="outlined"
                                  // ✅ UPDATED: Also disable override button for SFG
                                  disabled={variance.itemType === "SFG" || newItem.itemType === "SFG"}
                                  sx={{
                                    minWidth: "auto",
                                    height: "24px",
                                    fontSize: "0.65rem",
                                    padding: "0 6px",
                                    whiteSpace: "nowrap",
                                    textTransform: "none",
                                    fontFamily: "'Poppins', sans-serif",
                                    borderColor: "#000000",
                                    color: "rgb(55, 65, 81)",
                                    marginRight: "-6px",
                                    "&:hover": {
                                      backgroundColor: "rgb(249, 250, 251)",
                                      borderColor: "#000000",
                                    },
                                    // ✅ ADDED: Greyed out style when disabled
                                    "&.Mui-disabled": {
                                      color: "#999",
                                      borderColor: "#ccc",
                                    }
                                  }}
                                >
                                  Override
                                </Button>
                              )
                            }}
                            sx={{
                              "& .MuiOutlinedInput-root": {
                                height: "32px",
                                fontSize: "0.75rem",
                                width: "100%",
                                minWidth: "145px",
                                fontFamily: "'Poppins', sans-serif",
                                ml: 0.2,
                              },
                              "& .MuiInputBase-input": {
                                padding: "6px 8px 6px 10px",
                              },
                              "& .MuiFormHelperText-root": {
                                margin: 0,
                                fontSize: "0.65rem",
                                position: "absolute",
                                bottom: "-18px",
                              },
                            }}
                          />
                        </td>



                        {/* Net Price */}
                        <td style={{ padding: '2px 4px' }}>
                          <Typography
                            variant="body2"
                            sx={{
                              fontSize: "0.75rem",
                              fontFamily: "'Poppins', sans-serif",
                              color: "rgb(55, 65, 81)",
                              paddingLeft: "10px",
                              minWidth: "100px",
                              display: "flex",
                              alignItems: "center",
                              height: "32px"
                            }}
                          >
                            {netPrice || "-"}
                          </Typography>
                        </td>

                        {/* Tax Price */}
                        <td style={{ padding: '2px 4px' }}>
                          <Typography
                            variant="body2"
                            sx={{
                              fontSize: "0.75rem",
                              fontFamily: "'Poppins', sans-serif",
                              color: "rgb(55, 65, 81)",
                              paddingLeft: "10px",
                              minWidth: "100px",
                              display: "flex",
                              alignItems: "center",
                              height: "32px"
                            }}
                          >
                            {taxPrice || "-"}
                          </Typography>
                        </td>

                        {/* Final Price */}
                        <td style={{ padding: '2px 4px' }}>
                          <Typography
                            variant="body2"
                            sx={{
                              fontSize: "0.75rem",
                              fontFamily: "'Poppins', sans-serif",
                              color: "rgb(55, 65, 81)",
                              paddingLeft: "10px",
                              minWidth: "100px",
                              display: "flex",
                              alignItems: "center",
                              height: "32px"
                            }}
                          >
                            {finalPrice || "-"}
                          </Typography>
                        </td>

                        {/* Reorder Level */}
                        <td style={{ padding: '2px 4px' }}>
                          <TextField
                            autoComplete="off"
                            size="small"
                            name="reorderLevel"
                            value={variance.reorderLevel || variance.reorderLevel === 0 ? variance.reorderLevel : ""}
                            //  onChange={(e) => handleVarianceChange(originalIndex, 'reorderLevel', e.target.value)}

                            onChange={(e) => {
                              const value = e.target.value;
                              if (/^\d{0,4}$/.test(value)) {
                                handleVarianceChange(originalIndex, 'reorderLevel', value);
                              }
                            }}

                            className="custom-textfield"
                            InputLabelProps={{ className: "custom-label" }}
                            InputProps={{ className: "custom-input" }}
                            sx={{
                              "& .MuiOutlinedInput-root": {
                                height: "32px",
                                fontSize: "0.75rem",
                                width: "100%",
                                minWidth: "70px",
                                fontFamily: "'Poppins', sans-serif",
                                ml: -0.5,
                              },
                              "& .MuiInputBase-input": {
                                padding: "6px 8px",
                              },
                            }}
                          />
                        </td>

                        {/* Shelf Life */}
                        <td style={{ padding: '2px 4px' }}>
                          <TextField
                            autoComplete="off"
                            size="small"
                            name="shelfLife"
                            value={variance.shelfLife || variance.shelfLife === 0 ? variance.shelfLife : ""}
                            //  onChange={(e) => handleVarianceChange(originalIndex, 'shelfLife', e.target.value)}
                            onChange={(e) => {
                              const value = e.target.value;
                              if (/^\d{0,3}$/.test(value)) {
                                handleVarianceChange(originalIndex, 'shelfLife', value);
                              }
                            }}
                            error={variance.shelfLife === '' || variance.shelfLife === null || variance.shelfLife === undefined}
                            //    helperText={!variance.shelfLife ? "Required" : ""}
                            className="custom-textfield"
                            InputLabelProps={{ className: "custom-label" }}
                            InputProps={{ className: "custom-input" }}
                            sx={{
                              "& .MuiOutlinedInput-root": {
                                height: "32px",
                                fontSize: "0.75rem",
                                width: "100%",
                                minWidth: "80px",
                                fontFamily: "'Poppins', sans-serif",
                                ml: -0.5,
                              },
                              "& .MuiInputBase-input": {
                                padding: "6px 8px",
                              },
                              "& .MuiFormHelperText-root": {
                                margin: 0,
                                fontSize: "0.65rem",
                                position: "absolute",
                                bottom: "-18px",
                              },
                            }}
                          />
                        </td>

                        <td style={{ padding: '2px 4px' }}>
                          <Typography
                            variant="body2"
                            sx={{
                              fontSize: "0.75rem",
                              fontFamily: "'Poppins', sans-serif",
                              color: "rgb(55, 65, 81)",
                              paddingLeft: "10px",
                              minWidth: "160px",
                              display: "flex",
                              alignItems: "center",
                              height: "32px",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {variance.createdDate ? formatDateTime(variance.createdDate) : '-'}
                          </Typography>
                        </td>


                        {/* Actions */}
                        <td style={{ padding: '2px 4px' }}>
                          <div className="flex justify-center">
                            <button
                              onClick={() => handleDeleteVariance(originalIndex)}
                              className="delete-btn"
                              title="Delete"
                              style={{
                                padding: '4px',
                                minWidth: '32px',
                                height: '32px'
                              }}
                            >
                              <DeleteIcon fontSize="small" />
                            </button>
                          </div>
                        </td>

                        <td style={{ padding: '2px 4px' }}></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Box>




          {/* Price Override Dialog */}
          {priceOverrideOpen && (
            <Dialog
              open={priceOverrideOpen}
              onClose={(event, reason) => {
                if (reason === 'backdropClick') return;
                setPriceOverrideOpen(false);
              }}
              maxWidth="xl"
              fullWidth
              PaperProps={{ className: "dialog-paper-big" }}
              disableEscapeKeyDown={loading}
            >
              <DialogTitle className='dialog-title'>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <label>
                    Configure Price For Locations
                  </label>

                  <FormControlLabel
                    control={
                      <Switch
                        checked={enableAllBranches}
                        onChange={(e) => setEnableAllBranches(e.target.checked)}
                        disabled={loading}
                      />
                    }
                    label={
                      <Typography variant="body2" fontWeight={500}>
                        Enable All Branches
                      </Typography>
                    }
                  />
                </Box>
              </DialogTitle>

              <DialogContent className="dialog-content">
                <div className="form-section p-4">
                  <div style={{ display: 'flex', gap: '16px', height: '100%', minHeight: '0px' }}>
                    {/* Left: Branch Selector (Fixed) */}
                    <div style={{ width: '240px', flexShrink: 0 }}>
                      <Autocomplete
                        multiple
                        options={allBranchAliases}
                        disableCloseOnSelect
                        value={selectedBranches}
                        onChange={(event, newValue) => {
                          setSelectedBranches(newValue);
                          const updatedSalesTypePrices = { ...aliasSalesTypePrices };
                          newValue.forEach((alias) => {
                            if (!updatedSalesTypePrices[alias]) {
                              // ✅ Get the actual sales type NAMES for this branch (already converted from IDs)
                              const salesTypeNames = salesTypesByBranch[alias] || [];
                              updatedSalesTypePrices[alias] = {};

                              // ✅ Use dynamic sales type names instead of hardcoded array
                              salesTypeNames.forEach((salesTypeName) => {
                                updatedSalesTypePrices[alias][salesTypeName] = aliasPrices[alias] || '';
                              });
                            }
                          });
                          setAliasSalesTypePrices(updatedSalesTypePrices);
                        }}
                        disabled={enableAllBranches || loading}
                        renderTags={() => null}
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            label={
                              selectedBranches.length
                                ? `${selectedBranches.length} Branch${selectedBranches.length > 1 ? 'es' : ''} Selected`
                                : 'Select Branches'
                            }
                            placeholder="Search branches..."
                            variant="outlined"
                            size="small"
                            sx={{
                              "& .MuiOutlinedInput-root": {
                                minHeight: "45px",
                                alignItems: "center",
                              },
                              "& .MuiOutlinedInput-input::placeholder": {
                                opacity: 0.7,
                              },
                            }}
                          />
                        )}
                        renderOption={(props, option, { selected }) => (
                          <li {...props} key={option}>
                            <Checkbox
                              checked={selected}
                              sx={{
                                "& .MuiSvgIcon-root": { fontSize: 32 },
                                transform: "scale(1.2)",
                                padding: "8px",
                              }}
                            />
                            <Typography variant="body2">{option}</Typography>
                          </li>
                        )}
                        ListboxProps={{ style: { maxHeight: 292 } }}
                        sx={{ bgcolor: 'white' }}
                      />
                    </div>

                    {/* Right: Scrollable Price Table */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      {selectedBranches.length === 0 ? (
                        <Box
                          height="100%"
                          display="flex"
                          alignItems="center"
                          justifyContent="center"
                          bgcolor="#fafafa"
                          border="2px dashed #cbd5e1"
                          borderRadius="8px"
                        >
                          <Typography variant="h6" color="text.secondary" fontWeight={500}>
                            Select branches to edit prices
                          </Typography>
                        </Box>
                      ) : (
                        <div className="table-container" style={{ height: '100%', maxHeight: 'calc(119vh - 350px)' }}>
                          <table className="custom-table" style={{ tableLayout: 'fixed', width: '100%' }}>
                            <thead>
                              <tr>
                                <th style={{
                                  position: 'sticky',
                                  top: 0,
                                  left: 0,
                                  zIndex: 20,
                                  background: '#f1f5f9',
                                  fontWeight: 700,
                                  width: '120px',
                                  minWidth: '140px',
                                  textAlign: 'center',
                                  borderRight: '1px solid #e2e8f0',
                                  padding: '12px 8px',
                                  fontSize: '0.75rem',
                                  color: '#1e293b'
                                }}>
                                  Branch
                                </th>

                                {/* <th style={{
                                  position: 'sticky',
                                  top: 0,
                                  zIndex: 19,
                                  background: '#f1f5f9',
                                  fontWeight: 700,
                                  width: '100px',
                                  minWidth: '100px',
                                  textAlign: 'center',
                                  borderRight: '1px solid #e2e8f0',
                                  padding: '12px 8px',
                                  fontSize: '0.75rem',
                                }}>
                                  Item Status
                                </th> */}

                                <th style={{
                                  position: 'sticky',
                                  top: 0,
                                  zIndex: 19,
                                  background: '#f1f5f9',
                                  fontWeight: 700,
                                  width: '100px',
                                  minWidth: '100px',
                                  textAlign: 'center',
                                  borderRight: '1px solid #e2e8f0',
                                  padding: '12px 8px',
                                  fontSize: '0.75rem',
                                }}>
                                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.3 }}>
                                    <Checkbox
                                      checked={
                                        branchesToDisplay.length > 0 &&
                                        branchesToDisplay.every(alias => branchItemStatus[alias])
                                      }
                                      indeterminate={
                                        branchesToDisplay.some(alias => branchItemStatus[alias]) &&
                                        !branchesToDisplay.every(alias => branchItemStatus[alias])
                                      }
                                      onChange={(e) => {
                                        const checked = e.target.checked;
                                        setBranchItemStatus(prev => {
                                          const updated = { ...prev };
                                          branchesToDisplay.forEach(alias => {
                                            updated[alias] = checked;
                                          });
                                          return updated;
                                        });
                                      }}
                                      disabled={loading}
                                      sx={{
                                        '& .MuiSvgIcon-root': { fontSize: 20 },
                                        padding: '2px',
                                      }}
                                    />
                                    <span>Item Status</span>
                                  </Box>
                                </th>


                                <th style={{
                                  position: 'sticky',
                                  top: 0,
                                  zIndex: 19,
                                  background: '#f1f5f9',
                                  fontWeight: 700,
                                  width: '130px',
                                  minWidth: '130px',
                                  textAlign: 'center',
                                  borderRight: '1px solid #e2e8f0',
                                  padding: '12px 8px',
                                  fontSize: '0.75rem',
                                }}>
                                  Base Price
                                </th>
                                {/* ✅ DYNAMIC HEADERS - Get unique sales types from selected branches */}
                                {(() => {
                                  const uniqueSalesTypes = new Set<string>();
                                  branchesToDisplay.forEach(alias => {
                                    const salesTypes = salesTypesByBranch[alias] || [];
                                    salesTypes.forEach(st => uniqueSalesTypes.add(st));
                                  });
                                  return Array.from(uniqueSalesTypes).map((salesTypeName) => (
                                    <th
                                      key={salesTypeName}
                                      style={{
                                        position: 'sticky',
                                        top: 0,
                                        zIndex: 19,
                                        background: '#f1f5f9',
                                        fontWeight: 700,
                                        width: '150px',
                                        minWidth: '150px',
                                        textAlign: 'center',
                                        borderRight: '1px solid #e2e8f0',
                                        padding: '12px 8px',
                                        fontSize: '0.75rem',
                                      }}
                                    >
                                      {salesTypeName}
                                    </th>
                                  ));
                                })()}
                              </tr>
                            </thead>
                            <tbody>
                              {branchesToDisplay.map((alias) => {
                                const branchData = branchess?.find(b => b.aliasName === alias);
                                const branchSalesTypeNames = salesTypesByBranch[alias] || [];

                                return (
                                  <tr key={alias} style={{ backgroundColor: '#ffffff' }}>
                                    <td style={{
                                      position: 'sticky',
                                      left: 0,
                                      zIndex: 10,
                                      background: '#ffffff',
                                      fontWeight: 500,
                                      padding: '12px 8px',
                                      textAlign: 'center',
                                      borderRight: '1px solid #e2e8f0',
                                      fontSize: '0.713rem',
                                      boxShadow: '2px 0 4px -2px rgba(0,0,0,0.1)',
                                    }}>
                                      {alias}
                                    </td>

                                    <td style={{ padding: '8px', textAlign: 'center', borderRight: '1px solid #e2e8f0' }}>
                                      <Checkbox
                                        checked={branchItemStatus[alias] || false}
                                        onChange={(e) => {
                                          setBranchItemStatus(prev => ({
                                            ...prev,
                                            [alias]: e.target.checked
                                          }));
                                        }}
                                        disabled={loading}
                                        sx={{
                                          '& .MuiSvgIcon-root': { fontSize: 20 }
                                        }}
                                      />
                                    </td>

                                    {/* Base Price - ✅ Updates all sales types when changed */}
                                    <td style={{ padding: '8px', textAlign: 'center', borderRight: '1px solid #e2e8f0' }}>
                                      <TextField
                                        autoComplete='off'
                                        size="small"
                                        value={aliasPrices[alias] || ''}
                                        // onChange={(e) => {
                                        //   const val = e.target.value;
                                        //   handleAliasPriceChange(alias, val);

                                        //   // ✅ PRESERVE FUNCTIONALITY: Update all sales types for this branch
                                        //   const updated = { ...aliasSalesTypePrices };
                                        //   if (!updated[alias]) updated[alias] = {};

                                        //   // Use dynamic sales type names
                                        //   branchSalesTypeNames.forEach(stName => {
                                        //     updated[alias][stName] = val;
                                        //   });

                                        //   setAliasSalesTypePrices(updated);
                                        // }}

                                        // onChange={(e) => {
                                        //   const val = e.target.value;
                                        //   handleAliasPriceChange(alias, val);

                                        //   // ✅ Auto-propagate to sales types ONLY for new variances
                                        //   const isNewVariance = currentVarianceIndex !== null && !variances[currentVarianceIndex]?.itemCode;
                                        //   if (isNewVariance) {
                                        //     setAliasSalesTypePrices(prev => {
                                        //       const updated = { ...prev, [alias]: { ...(prev[alias] || {}) } };
                                        //       const salesTypes = salesTypesByBranch[alias] || [];
                                        //       salesTypes.forEach(stName => {
                                        //         updated[alias][stName] = val;
                                        //       });
                                        //       return updated;
                                        //     });
                                        //   }
                                        // }}


                                        onChange={(e) => {
                                          const val = e.target.value;

                                          // ✅ Validate decimal input
                                          if (val === '' || /^\d{0,4}(\.\d{0,2})?$/.test(val)) {
                                            // ✅ Update base price for this branch
                                            handleAliasPriceChange(alias, val);

                                            // ✅ Always auto-propagate base price to ALL sales types for this branch
                                            // Works for both new AND existing variances — old behaviour preserved
                                            setAliasSalesTypePrices(prev => {
                                              const updated = {
                                                ...prev,
                                                [alias]: { ...(prev[alias] || {}) }
                                              };
                                              const salesTypes = salesTypesByBranch[alias] || [];
                                              salesTypes.forEach(stName => {
                                                updated[alias][stName] = val;
                                              });
                                              return updated;
                                            });
                                          }
                                        }}


                                        disabled={loading}
                                        inputProps={{ min: 0, step: '0.01', style: { textAlign: 'center', fontFamily: "'Poppins', sans-serif", fontSize: "0.75rem" } }}
                                        sx={{ width: 110 }}
                                        variant="outlined"
                                      />
                                    </td>

                                    {/* ✅ DYNAMIC SALES TYPE COLUMNS */}
                                    {(() => {
                                      // Get all unique sales types across selected branches
                                      const uniqueSalesTypes = new Set<string>();
                                      branchesToDisplay.forEach(a => {
                                        const types = salesTypesByBranch[a] || [];
                                        types.forEach(t => uniqueSalesTypes.add(t));
                                      });

                                      return Array.from(uniqueSalesTypes).map((salesTypeName) => {
                                        const hasSalesType = branchSalesTypeNames.includes(salesTypeName);
                                        const value = hasSalesType
                                          ? (aliasSalesTypePrices[alias]?.[salesTypeName] ?? '')
                                          : '';

                                        return (
                                          <td key={salesTypeName} style={{ padding: '8px', textAlign: 'center', borderRight: '1px solid #e2e8f0' }}>
                                            <TextField
                                              autoComplete='off'
                                              size="small"
                                              value={value}
                                              disabled={!hasSalesType || loading}
                                              placeholder={hasSalesType ? 'Not Set' : 'N/A'}
                                              onChange={(e) => {
                                                const val = e.target.value;

                                                if (!hasSalesType) return;

                                                // ✅ PRESERVE FUNCTIONALITY: Validate decimal input
                                                if (val === '' || /^\d{0,4}(\.\d{0,2})?$/.test(val)) {
                                                  handlePriceChange(alias, salesTypeName, val);
                                                }
                                              }}
                                              inputProps={{ min: 0, step: '0.01', style: { textAlign: 'center' } }}
                                              sx={{
                                                width: '120px',
                                                '& .MuiInputBase-root': {
                                                  fontSize: '0.75rem',
                                                  backgroundColor: !hasSalesType ? '#f5f5f5' : 'white',
                                                  fontFamily: "'Poppins', sans-serif",
                                                },
                                                '& .Mui-disabled': {
                                                  backgroundColor: '#f5f5f5',
                                                  cursor: 'not-allowed',
                                                  '& input': {
                                                    color: '#999',
                                                    WebkitTextFillColor: '#999',
                                                  }
                                                }
                                              }}
                                              variant="outlined"
                                            />
                                          </td>
                                        );
                                      });
                                    })()}
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </DialogContent>

              <DialogActions sx={{ p: 1 }} className='dialog-actions'>
                <button
                  onClick={() => setPriceOverrideOpen(false)}
                  disabled={loading}
                  className='btn-secondary'
                >
                  Cancel
                </button>
                <button
                  disabled={loading || selectedBranches.length === 0}
                  // onClick={() => {
                  //   if (currentVarianceIndex !== null) {
                  //     setAliasPricesByVariance(prev => ({
                  //       ...prev,
                  //       [currentVarianceIndex]: { ...aliasPrices }
                  //     }));
                  //     setAliasSalesTypePricesByVariance(prev => ({
                  //       ...prev,
                  //       [currentVarianceIndex]: { ...aliasSalesTypePrices }
                  //     }));

                  //     // ✅ NEW: Store ItemStatus for this variance
                  //     setBranchItemStatusByVariance(prev => ({
                  //       ...prev,
                  //       [currentVarianceIndex]: { ...branchItemStatus }
                  //     }));

                  //     // ✅ Clear the modified flag after applying prices
                  //     setModifiedVariances(prev => ({
                  //       ...prev,
                  //       [currentVarianceIndex]: false
                  //     }));
                  //   }
                  //   setPriceOverrideOpen(false);
                  // }}


                  onClick={() => {
                    if (currentVarianceIndex !== null) {
                      setAliasPricesByVariance(prev => ({
                        ...prev,
                        [currentVarianceIndex]: { ...aliasPrices }
                      }));
                      setAliasSalesTypePricesByVariance(prev => ({
                        ...prev,
                        [currentVarianceIndex]: { ...aliasSalesTypePrices }
                      }));

                      setBranchItemStatusByVariance(prev => ({
                        ...prev,
                        [currentVarianceIndex]: { ...branchItemStatus }
                      }));

                      // ✅ Clear modified flag after applying — next override open
                      // will use the per-branch prices the user just set, not currentUIPrice
                      setModifiedVariances(prev => ({
                        ...prev,
                        [currentVarianceIndex]: false
                      }));
                    }
                    setPriceOverrideOpen(false);
                  }}

                  className='btn-primary'
                >
                  {loading ? 'Saving...' : 'Apply Prices'}
                </button>
              </DialogActions>
            </Dialog>
          )}

          {/* Delete Confirmation Dialog */}
          {deleteOpen && (
            <Dialog
              open={deleteOpen}
              onClose={() => setDeleteOpen(false)}
              PaperProps={{
                className: "dialog-paper"
              }}
            >
              <DialogTitle className='dialog-title'>Confirm Delete</DialogTitle>
              <DialogContent className='dialog-content'>
                <label>
                  Are you sure you want to delete this variance?
                </label>
              </DialogContent>
              <DialogActions className='dialog-actions'>
                <button
                  onClick={() => setDeleteOpen(false)}
                  className='btn-secondary'
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmDelete}
                  className='btn-delete'
                >
                  Confirm
                </button>
              </DialogActions>
            </Dialog>
          )}

          <Snackbar
            open={snackbar.open}
            autoHideDuration={4000}
            onClose={handleCloseSnackbar}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
          >
            <Alert
              onClose={handleCloseSnackbar}
              severity={snackbar.severity}
              sx={{ width: '100%' }}
            >
              {snackbar.message}
            </Alert>
          </Snackbar>

          {/* Close Confirmation Dialog */}
          <CloseConfirmationDialog
            open={closeConfirmOpen}
            onClose={() => setCloseConfirmOpen(false)}
            onConfirm={() => {
              setCloseConfirmOpen(false);
              router.back();
            }}
          />

          {/* Save Confirmation Dialog */}
          <EditConfirmationDialog
            open={saveConfirmOpen}
            onClose={() => setSaveConfirmOpen(false)}
            onConfirm={async () => {
              setSaveConfirmOpen(false);
              await handleSubmit();
            }}
          />
        </Container>
      )}
    </Box>
  );
}



// Main exported component with Suspense wrapper
// Main exported component with Suspense wrapper
const EditItemPage = () => {
  return (
    <Suspense fallback={
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    }>
      <EditItemContent selectedItem={null} />
    </Suspense>
  );
};

export default EditItemPage;

