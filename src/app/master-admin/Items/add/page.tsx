

'use client';
import React, { useState, useEffect, ChangeEvent, useMemo, useRef } from 'react';
import {
    Box,
    Typography,
    TextField,
    Autocomplete,
    Checkbox,
    FormControlLabel,
    Switch,
    Snackbar,
    Alert,
    Container,
    Grid,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Radio,
    IconButton,
} from '@mui/material';
import { Delete as DeleteIcon } from '@mui/icons-material';
import { Image as ImageIcon } from '@mui/icons-material';
import Image from 'next/image';
import axios from 'axios';
import { fetchItems, fetchItemGroups, fetchCategories, fetchtaxs, fetchUoms, fetchBranches, fetchInventory, deleteVariance, uploadItemImage, fetchOrderType, uploadVarianceImage } from '../../Items/Item/Features/itemSlice';
import { AppDispatch, RootState } from '../../../../redux/store';
import { Item, Variance, Branch, Category } from '../../Items/Item/Models/itemsModels';
import { useDispatch, useSelector } from 'react-redux';
import { useRouter } from 'next/navigation';
import ItemMaster from '../add/style';
import CloseConfirmationDialog from '@/app/Components/Dialogs/CloseConfirmationDialog';
import CreateConfirmationDialog from '@/app/Components/Dialogs/createConformation';
import { API_BASE_URL } from '../../../../../API_URL';

// Define additional interfaces
interface subCategory {
    subCategoryName: string;
}

// Initial state for the item
const initialItemState: Item = {
    itemType: '',
    itemName: '',
    category: '',
    subCategory: '',
    itemGroup: '',
    measurementType: '',
    uom: '',
    tax: '',
    price: '',
    netPrice: '',
    taxPrice: '',
    finalPrice: '',
    description: '',
    hsnCode: '',
    birthdayCake: false,
    uniqueQr: false,
    plateItem: false,
    stockValidation: false,
    variances: [],
    imageFile: undefined,
    image: undefined,
};

const initialVarianceState: Variance = {
    varianceName: 'REGULAR',
    uom: '',
    price: '',
    reorderLevel: '',
    shelfLife: '',
    sapCode: '',
};

function AddItemPage() {
    const dispatch = useDispatch<AppDispatch>();
    const router = useRouter();
    const [newItem, setNewItem] = useState<Item>(initialItemState);
    const [variances, setVariances] = useState<Variance[]>([{
        ...initialVarianceState,
        varianceName: 'REGULAR',
        itemCode: '',
    }]);
    const [, setEditingRow] = useState<number | null>(null);
    const [itemNameError, setItemNameError] = useState<string>('');
    const [, setCurrentVariance] = useState<Variance>(initialVarianceState);
    const [priceOverrideOpen, setPriceOverrideOpen] = useState(false);
    const [aliasPrices, setAliasPrices] = useState<Record<string, string>>({});
    const [selectedBranches, setSelectedBranches] = useState<string[]>([]);
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [deleteIndex, setDeleteIndex] = useState<number | null>(null);
    const [loading, setLoading] = useState(false);
    const [, setError] = useState<string | null>(null);
    const [aliasSalesTypePrices, setAliasSalesTypePrices] = useState<
        Record<string, Record<string, string>>
    >({});
    const [enableAllBranches, setEnableAllBranches] = useState(true);
    const [excludeTaxItem, setExcludeTaxItem] = useState(false);
    const [, setOriginalPrice] = useState<string>('');
    const [salesTypesByBranch, setSalesTypesByBranch] = useState<Record<string, string[]>>({});

    const [closeConfirmOpen, setCloseConfirmOpen] = useState(false);
    const [saveConfirmOpen, setSaveConfirmOpen] = useState(false);

    const itemNameDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);


    const [currentVarianceIndex, setCurrentVarianceIndex] = useState<number | null>(null);
    // Add these states near your other state declarations
    const [aliasPricesByVariance, setAliasPricesByVariance] = useState<Record<number, Record<string, string>>>({});
    const [aliasSalesTypePricesByVariance, setAliasSalesTypePricesByVariance] = useState<
        Record<number, Record<string, Record<string, string>>>
    >({});

    // 1. Add new state near other state declarations (around line 100)
    const [branchItemStatus, setBranchItemStatus] = useState<Record<string, boolean>>({});
    const [branchItemStatusByVariance, setBranchItemStatusByVariance] = useState<
        Record<number, Record<string, boolean>>
    >({});

    // ✅ ADD THIS NEW STATE near your other state declarations (around line 100)
    const [imageError, setImageError] = useState<string>('');
    const [, setBranchIdMap] = useState<Record<string, string>>({});

    const [, setOrderTypeIdToName] = useState<Record<string, string>>({});
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
        inventory,
        orderTypes,
        loading: itemLoading
    } = useSelector((state: RootState) => state.maItems);

    useEffect(() => {
        //  console.log('Page loaded, fetching data...');
        dispatch(fetchItemGroups());
        dispatch(fetchCategories());
        dispatch(fetchUoms());
        dispatch(fetchtaxs());
        dispatch(fetchInventory());
        dispatch(fetchOrderType());
        dispatch(fetchBranches()).then(() => {
            //  console.log('Branches fetched');
        });
    }, [dispatch]);


    // ============================================================================
    // ULTRA-OPTIMIZED: Single useMemo for All Mappings
    // ============================================================================

    const allMappings = useMemo(() => {
        // Early return if data not ready
        if (!branchess?.length || !orderTypes?.length || !inventory?.length) {
            return {
                orderTypeIdToName: {},
                orderTypeNameToId: {},
                salesTypesByBranch: {},
                branchIdMap: {}
            };
        }

        // 1. Order Types Mapping
        const orderTypeNameToId: Record<string, string> = {};
        const orderTypeIdToName: Record<string, string> = {};

        orderTypes.forEach(({ orderTypeName, orderTypeId }) => {
            const name = orderTypeName?.trim().toUpperCase();
            const id = orderTypeId?.trim();
            if (name && id) {
                orderTypeNameToId[name] = id;
                orderTypeIdToName[id] = name;
            }
        });

        // 2. Branches Mapping
        const salesTypesMap: Record<string, string[]> = {};
        const idMap: Record<string, string> = {};

        branchess.forEach((branch: Branch) => {
            const { aliasName, locationId, salesTypes = [] } = branch;

            // Convert IDs to names
            salesTypesMap[aliasName] = salesTypes.map(id => orderTypeIdToName[id] || id);
            idMap[aliasName] = locationId;
        });

        return {
            orderTypeIdToName,
            orderTypeNameToId,
            salesTypesByBranch: salesTypesMap,
            branchIdMap: idMap
        };
    }, [branchess, orderTypes, inventory]);

    // ============================================================================
    // Single useEffect to Apply All Mappings to State
    // ============================================================================

    useEffect(() => {
        setOrderTypeIdToName(allMappings.orderTypeIdToName);
        setOrderTypeNameToId(allMappings.orderTypeNameToId);
        setSalesTypesByBranch(allMappings.salesTypesByBranch);
        setBranchIdMap(allMappings.branchIdMap);

        // Single consolidated log (only when mappings actually change)
        if (Object.keys(allMappings.orderTypeIdToName).length > 0) {
            console.log('🚀 All Mappings Applied:', {
                orderTypes: Object.keys(allMappings.orderTypeIdToName).length,
                branches: Object.keys(allMappings.branchIdMap).length
            });
        }
    }, [allMappings]);

    useEffect(() => {
        // This effect now only handles the main item's price fields
        // Variance calculations are handled separately in the table rendering
        if (newItem.price) {
            const priceNum = parseFloat(newItem.price as string);
            const taxNum = parseFloat(newItem.tax as string) || 0; // Tax can be 0

            if (isNaN(priceNum)) return;

            if (taxNum === 0) {
                // When tax is 0%, price = netPrice = finalPrice
                setNewItem(prev => ({
                    ...prev,
                    netPrice: priceNum.toFixed(2),
                    taxPrice: '0.00',
                    finalPrice: priceNum.toFixed(2),
                }));
            } else if (!excludeTaxItem) {
                // Include Tax mode: Price is final price including tax
                setNewItem(prev => ({
                    ...prev,
                    netPrice: (priceNum / (1 + taxNum / 100)).toFixed(2),
                    taxPrice: (priceNum - (priceNum / (1 + taxNum / 100))).toFixed(2),
                    finalPrice: priceNum.toFixed(2),
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
            // Reset when no price
            setNewItem(prev => ({
                ...prev,
                netPrice: '',
                taxPrice: '',
                finalPrice: '',
            }));
        }
    }, [excludeTaxItem, newItem.price, newItem.tax]);


    useEffect(() => {
        // Update the first variance when item price or UOM changes
        // Only sync if we have exactly 1 variance OR the first is REGULAR
        if (variances.length === 1 || (variances.length > 0 && variances[0].varianceName === 'REGULAR')) {
            const updatedVariances = [...variances];

            // Only update if the values are actually different (prevent infinite loops)
            const newUom = newItem.uom || updatedVariances[0].uom;
            const newPrice = newItem.price as string || updatedVariances[0].price;

            if (updatedVariances[0].uom !== newUom || updatedVariances[0].price !== newPrice) {
                updatedVariances[0] = {
                    ...updatedVariances[0],
                    uom: newUom,
                    price: newPrice,
                };
                setVariances(updatedVariances);
            }
        }
    }, [newItem.uom, newItem.price, variances.length]); // Added variances.length to dependencies



    const handleCloseSnackbar = () => {
        setSnackbar({ ...snackbar, open: false });
    };


    // ✅ NEW: Helper to check if current item is SFG (by looking up the name from stored ID)
    const isSfgItem = useMemo(() => {
        // If no itemType selected, return false
        if (!newItem.itemType) return false;

        // Find the inventory item by ID and check if its TYPE NAME is "SFG"
        const foundInventory = inventory.find((inv) => inv.inventoryId === newItem.itemType);
        return foundInventory?.inventoryType?.toUpperCase() === "SFG";
    }, [newItem.itemType, inventory]);


    const hasLetter = /[a-zA-Z]/;

    const getHelperText = (value: string, parentError: string): string => {
        if (value && !hasLetter.test(value)) return 'Must contain at least one letter';
        return parentError;
    };

    const hasLetterError = (value: string): boolean =>
        !!value && !hasLetter.test(value);

    const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;

        let processedValue = value;

        if (name === 'itemName') {
            // Strip special chars, uppercase, max 30
            processedValue = value
                .replace(/[^a-zA-Z0-9\s\-.,()&]/g, '')
                .slice(0, 200)
                .toUpperCase();
        }

        if (name === 'description') {
            processedValue = value.slice(0, 200);
        }

        setNewItem((prev) => ({ ...prev, [name]: processedValue }));

        if (name === 'price' && !excludeTaxItem) {
            setOriginalPrice(value);
        }
    };

    const checkDuplicateItemName = (name: string) => {
        if (!name.trim()) {
            setItemNameError('');
            return;
        }

        // Clear previous timer
        if (itemNameDebounceRef.current) {
            clearTimeout(itemNameDebounceRef.current);
        }

        // Wait 600ms after user stops typing before calling API
        itemNameDebounceRef.current = setTimeout(async () => {
            try {
                const response = await axios.get(
                    `${API_BASE_URL}/itemmasters/check-itemname/?name=${encodeURIComponent(name.trim())}`
                );
                const existingNames: string[] = response.data.names || [];

                const inputNormalized = name.trim().toUpperCase();

                const isDuplicate = existingNames.some((existing: string) => {
                    const existingUpper = existing.toUpperCase();

                    if (existingUpper === inputNormalized) return true;
                    if (existingUpper === inputNormalized + 'S') return true;
                    if (existingUpper === inputNormalized + 'ES') return true;
                    if (inputNormalized === existingUpper + 'S') return true;
                    if (inputNormalized === existingUpper + 'ES') return true;

                    return false;
                });

                setItemNameError(isDuplicate ? `"${name.toUpperCase()}" or a similar item name already exists.` : '');
            } catch (error) {
                console.warn('Item name check failed:', error);
                setItemNameError('');
            }
        }, 600);
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


    const handleVarianceChange = (index: number, field: keyof Variance, value: string) => {
        setVariances(prev => {
            const updated = [...prev];
            updated[index] = {
                ...updated[index],
                [field]: value
            };

            // ✅ NEW: If only ONE variance exists (or it's the REGULAR variance at index 0),
            // sync changes BACK to the main item fields
            if (updated.length === 1 || (index === 0 && updated[0]?.varianceName === 'REGULAR')) {
                // Queue state update for main item to avoid circular dependency
                setTimeout(() => {
                    if (field === 'uom' && value) {
                        setNewItem(prevItem => ({ ...prevItem, uom: value }));
                    }
                    if (field === 'price' && value) {
                        setNewItem(prevItem => ({ ...prevItem, price: value }));
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

    const handleAddNewVariance = () => {
        // FIX: If no variances exist (after delete), allow adding without validation
        if (variances.length === 0) {
            const newVariance: Variance = {
                ...initialVarianceState,
                varianceName: '',
                uom: '',
                // ✅ FIXED: Use isSfgItem helper
                price: isSfgItem ? "0" : '',
                shelfLife: '',
                itemCode: '',
                itemType: isSfgItem ? "SFG" : "",
            };

            setVariances([newVariance]);

            const newIndex = 0;
            setAliasPricesByVariance(prev => ({
                ...prev,
                [newIndex]: {},
            }));
            setAliasSalesTypePricesByVariance(prev => ({
                ...prev,
                [newIndex]: {},
            }));
            setBranchItemStatusByVariance(prev => ({
                ...prev,
                [newIndex]: {},
            }));
            return;
        }

        // ✅ Validate the LAST variance before allowing a new one
        const lastVariance = variances[variances.length - 1];

        const isLastVarianceComplete =
            lastVariance?.varianceName?.trim() !== '' &&
            lastVariance?.uom?.trim() !== '' &&
            // ✅ FIXED: For SFG items, skip price validation
            (isSfgItem ? true : (
                lastVariance?.price !== '' &&
                lastVariance?.price !== null &&
                lastVariance?.price !== undefined
            )) &&
            lastVariance?.shelfLife !== '' &&
            lastVariance?.shelfLife !== null &&
            lastVariance?.shelfLife !== undefined;

        if (!isLastVarianceComplete) {
            setSnackbar({
                open: true,
                message: 'Please fill All Required Fields for the current variance before adding a new one.',
                severity: 'error',
            });
            return;
        }

        // ✅ Add new row
        const newVariance: Variance = {
            ...initialVarianceState,
            varianceName: '',
            uom: '',
            // ✅ FIXED: Use isSfgItem helper
            price: isSfgItem ? "0" : '',
            shelfLife: '',
            itemCode: '',
            itemType: isSfgItem ? "SFG" : "",
        };

        setVariances([...variances, newVariance]);

        const newIndex = variances.length;
        setAliasPricesByVariance(prev => ({
            ...prev,
            [newIndex]: {},
        }));
        setAliasSalesTypePricesByVariance(prev => ({
            ...prev,
            [newIndex]: {},
        }));
        setBranchItemStatusByVariance(prev => ({
            ...prev,
            [newIndex]: {},
        }));
    };




    const handlePriceOverrideClick = (index: number) => {
        setCurrentVarianceIndex(index);
        const branches = allBranchAliases;
        setSelectedBranches(branches);
        setEnableAllBranches(true);

        // Get existing override prices for this variance, or use default
        const existingAliasPrices = aliasPricesByVariance[index] || {};
        const existingSalesTypePrices = aliasSalesTypePricesByVariance[index] || {};
        const existingItemStatus = branchItemStatusByVariance[index] || {}; // ✅ NEW

        const defaultPrices: Record<string, string> = {};
        const defaultSalesTypePrices: Record<string, Record<string, string>> = {};
        const defaultItemStatus: Record<string, boolean> = {}; // ✅ NEW

        // Use existing override prices if available, otherwise use variance price
        const currentVariancePrice = String(variances[index]?.price || '');

        branches.forEach(alias => {
            // ✅ NEW: Initialize ItemStatus (default to true/active for new items)
            defaultItemStatus[alias] = existingItemStatus[alias] !== undefined ? existingItemStatus[alias] : true;

            // Use existing price if available, otherwise use variance price
            defaultPrices[alias] = existingAliasPrices[alias] || currentVariancePrice;

            // Get sales type NAMES for this branch (already converted from IDs)
            const salesTypeNames = salesTypesByBranch[alias] || [];
            defaultSalesTypePrices[alias] = existingSalesTypePrices[alias] || {};

            // Use the actual sales type names from the branch
            salesTypeNames.forEach(stName => {
                // Use existing sales type price if available, otherwise use alias price
                defaultSalesTypePrices[alias][stName] = existingSalesTypePrices[alias]?.[stName] || defaultPrices[alias];
            });
        });

        setAliasPrices(defaultPrices);
        setAliasSalesTypePrices(defaultSalesTypePrices);
        setBranchItemStatus(defaultItemStatus); // ✅ NEW
        setPriceOverrideOpen(true);
    };



    const handleSubmit = async () => {
        try {


            // ✅✅✅ ADD THIS VALIDATION BLOCK ✅✅✅
            if (newItem.imageFile) {
                const validExtensions = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
                const file = newItem.imageFile;

                if (!validExtensions.includes(file.type)) {
                    setSnackbar({
                        open: true,
                        message: 'Invalid image format!',
                        severity: 'error',
                    });
                    return; // Stop submission
                }
            }

            if (!newItem.itemName || !newItem.itemName.trim()) {
                setSnackbar({
                    open: true,
                    message: 'Please enter a valid Item Name.',
                    severity: 'error',
                });
                return;
            }

            if (!newItem.itemType || !newItem.itemType.trim()) {
                setSnackbar({
                    open: true,
                    message: 'Please Choose The Item Type.',
                    severity: 'error',
                });
                return;
            }

            if (!hasLetter.test((newItem.itemName || '').trim())) {
                setSnackbar({
                    open: true,
                    message: 'Item Name must contain at least one letter.',
                    severity: 'error',
                });
                return;
            }

            if (!newItem.hsnCode || !newItem.hsnCode.trim()) {
                setSnackbar({
                    open: true,
                    message: 'HSN Code is Required.',
                    severity: 'error',
                });
                return;
            }

            // Block submit if description is filled but has no letter
            if (newItem.description && !hasLetter.test(newItem.description.trim())) {
                setSnackbar({
                    open: true,
                    message: 'Description must contain at least one letter.',
                    severity: 'error',
                });
                return;
            }

            // Block submit if any varianceName is filled but has no letter
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

            for (const variance of variances) {
                const shelfLifeValue = variance.shelfLife ?? '';
                const parsedShelfLife = shelfLifeValue === 0 || shelfLifeValue === '0'
                    ? 0
                    : parseInt(shelfLifeValue as string, 10);

                if (
                    shelfLifeValue === '' ||
                    isNaN(parsedShelfLife) ||
                    parsedShelfLife < 0
                ) {
                    setSnackbar({
                        open: true,
                        message: `Fill Shelf Life for variance "${variance.varianceName || 'Unnamed'}".`,
                        severity: 'error',
                    });
                    return;
                }
            }

            let firstItemId: string | null = null;

            for (const variance of variances) {
                if (!variance.itemCode) {
                    let itemCode = 'BMFG0001';
                    try {
                        const codeResponse = await axios.get<{ next_itemCode: string }>(
                            `${API_BASE_URL}/itemmasters/next-fgcode/`
                        );
                        itemCode = codeResponse.data.next_itemCode;
                    } catch (error) {
                        console.warn('Failed to fetch next-fgcode, defaulting to BMFG0001:', error);
                    }

                    const variancePrice = parseFloat(variance.price as string) || 0;
                    const taxNum = parseFloat(newItem.tax as string) || 0;

                    let netPrice = 0;
                    let taxPrice = 0;
                    let finalPrice = 0;

                    if (variancePrice > 0) {
                        if (taxNum === 0) {
                            // When tax is 0%, price = netPrice = finalPrice
                            netPrice = variancePrice;
                            taxPrice = 0;
                            finalPrice = variancePrice;
                        } else if (!excludeTaxItem) {
                            // Include Tax mode
                            netPrice = variancePrice / (1 + taxNum / 100);
                            taxPrice = variancePrice - netPrice;
                            finalPrice = variancePrice;
                        } else {
                            // Exclude Tax mode
                            netPrice = variancePrice;
                            taxPrice = variancePrice * (taxNum / 100);
                            finalPrice = variancePrice + taxPrice;
                        }
                    }

                    const payload: Record<string, any> = {
                        itemCode: itemCode,
                        sapCode: variance.sapCode || '',
                        itemType: newItem.itemType || '',
                        itemName: newItem.itemName || '',
                        varianceName: variance.varianceName || '',
                        variance_Uom: variance.uom || '',
                        category: newItem.category || '',
                        subCategory: newItem.subCategory || '',
                        itemGroup: newItem.itemGroup || '',
                        item_Defaultprice: parseFloat(newItem.price as string) || 0,
                        item_Uom: newItem.uom || '',
                        variance_Defaultprice: parseFloat(variance.price as string) || 0,
                        tax: parseFloat(newItem.tax as string) || 0,
                        shelfLife: parseInt(variance.shelfLife as string || '0'),
                        hsnCode: parseInt(newItem.hsnCode as string) || 0,
                        netPrice: parseFloat(netPrice.toFixed(2)),
                        taxPrice: parseFloat(taxPrice.toFixed(2)),
                        finalPrice: parseFloat(finalPrice.toFixed(2)),
                        status: 'Active',
                        varianceStatus: "active",
                        description: newItem.description || '',
                        birthdayCake: newItem.birthdayCake || false,
                        uniqueQr: newItem.uniqueQr || false,
                        stockValidation: newItem.stockValidation || false,
                        includeTax: newItem.includeTax || true,
                        excludeTax: newItem.excludeTax || false,
                        //  plateItem: newItem.plateItem || false,
                        reorderLevel: parseInt(variance.reorderLevel as string || '0'),
                    };

                    // Build branchData object using branchId as keys
                    const branchData: Record<string, any> = {};
                    const varianceIndex = variances.findIndex(v => v === variance);
                    const varianceAliasPrices = aliasPricesByVariance[varianceIndex] || {};
                    const varianceSalesTypePrices = aliasSalesTypePricesByVariance[varianceIndex] || {};

                    branchess.forEach((branch: Branch) => {
                        const aliasName = branch.aliasName;
                        const branchId = branch.locationId;

                        let price = parseFloat(variance.price as string) || 0;

                        // Check if there's an override price for this branch (stored by aliasName)
                        if (varianceAliasPrices[aliasName] !== undefined) {
                            price = parseFloat(varianceAliasPrices[aliasName]) || 0;
                        }


                        // ✅ NEW: Get ItemStatus from stored variance state (default to active)
                        const storedItemStatus = branchItemStatusByVariance[varianceIndex]?.[aliasName];
                        const itemStatus = storedItemStatus !== undefined ? (storedItemStatus ? 'active' : 'inactive') : 'active';


                        // Initialize branchData with branchId as key
                        branchData[branchId] = {
                            EnableBranch: 'Y',
                            ItemStatus: itemStatus,
                            Price: price,
                        };

                        const salesTypesForBranch = varianceSalesTypePrices[aliasName] || {};
                        const branchSalesTypeNames = salesTypesByBranch[aliasName] || [];

                        // ✅ Convert sales type NAMES to IDs for database storage
                        branchSalesTypeNames.forEach((stName: string) => {
                            // Get the ID for this name
                            const stId = orderTypeNameToId[stName.toUpperCase()] || stName;

                            if (salesTypesForBranch[stName] !== undefined) {
                                branchData[branchId][stId] = parseFloat(salesTypesForBranch[stName]) || 0;
                            } else {
                                branchData[branchId][stId] = price;
                            }
                        });
                    });

                    // Add branchData to payload
                    payload.branchData = branchData;

                    const response = await axios.post(
                        `${API_BASE_URL}/itemmasters/add-item/`,
                        payload
                    );

                    if (!firstItemId && response.data._id) {
                        firstItemId = response.data._id;
                    }

                    variance.itemCode = itemCode;


                    if (variance.varianceImageFile) {
                        try {
                            await dispatch(uploadVarianceImage({ itemCode, file: variance.varianceImageFile })).unwrap();
                        } catch (err) {
                            console.error('Variance image upload failed:', err);
                        }
                    }
                }
            }

            setSnackbar({
                open: true,
                message: 'All items created successfully!',
                severity: 'success',
            });

            if (newItem.imageFile && firstItemId) {
                try {
                    await dispatch(
                        uploadItemImage({
                            branchwiseItemId: firstItemId,
                            file: newItem.imageFile,
                            page: 1,
                            limit: 15,
                        })
                    ).unwrap();
                    setSnackbar({
                        open: true,
                        message: 'Item created and image uploaded successfully!',
                        severity: 'success',
                    });
                } catch (err) {
                    console.error('Image upload failed after item creation:', err);
                    setSnackbar({
                        open: true,
                        message: 'Item created, but image upload failed.',
                        severity: 'error',
                    });
                }
            }

            dispatch(fetchItems({ page: 1, limit: 15 }));
            handleReset();
            router.push('/master-admin/Items/Item');
        } catch (error: any) {
            console.error('Error saving item:', error);
            setSnackbar({
                open: true,
                message: `Failed to save item: ${error.response?.data?.detail || error.message}`,
                severity: 'error',
            });
        }
    };


    const handleReset = () => {
        setNewItem(initialItemState);
        setVariances([{ ...initialVarianceState, varianceName: 'REGULAR', itemCode: '' }]);
        setCurrentVariance(initialVarianceState);
        setSelectedBranches([]);
        setAliasPrices({});
        setAliasSalesTypePrices({});
        setEnableAllBranches(false);
        setExcludeTaxItem(false);
        setEditingRow(null);
        setPriceOverrideOpen(false);
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
                            page: 0,
                            limit: 0,
                            itemName: '',
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
        //   newItem.itemType &&
        newItem.category &&
        newItem.subCategory &&
        newItem.uom &&
        newItem.tax &&
        // newItem.price &&
        (isSfgItem ? true : newItem.price) &&
        variances.length > 0
    ) || !!itemNameError;



    // Simple tab navigation handler
    const handleTabNavigation = (e: React.KeyboardEvent) => {
        if (e.key === 'Tab') {
            e.preventDefault();

            const target = e.target as HTMLElement;
            const formElements = Array.from(
                document.querySelectorAll(
                    'input:not([type="checkbox"]):not([type="file"]), .MuiAutocomplete-root input'
                )
            );

            const currentIndex = formElements.indexOf(target);

            if (currentIndex > -1) {
                let nextIndex = e.shiftKey ? currentIndex - 1 : currentIndex + 1;

                // Ensure we stay within bounds
                if (nextIndex >= 0 && nextIndex < formElements.length) {
                    const nextElement = formElements[nextIndex] as HTMLElement;

                    // Focus on the next element
                    nextElement.focus();

                    // If it's an autocomplete input, open the dropdown
                    const autocompleteRoot = nextElement.closest('.MuiAutocomplete-root');
                    if (autocompleteRoot) {
                        setTimeout(() => {
                            const openButton = autocompleteRoot.querySelector('button[aria-label="Open"]') as HTMLElement;
                            if (openButton) {
                                openButton.click();
                            }
                        }, 10);
                    }
                }
            }
        }
    };


    // Handler for autocomplete input key events
    const handleAutocompleteTab = (e: React.KeyboardEvent) => {
        if (e.key === 'Tab') {
            const target = e.target as HTMLElement;
            const listbox = document.querySelector('.MuiAutocomplete-listbox');

            // Check if dropdown is open
            if (listbox) {
                e.preventDefault();

                // Get the VISUALLY FOCUSED option (the one with pointer/mouse hover or keyboard focus)
                let focusedOption = null;

                // Method 1: Check for mouse hover (when user moves mouse over an option)
                const hoveredOption = listbox.querySelector(':hover[role="option"]') as HTMLElement;
                if (hoveredOption) {
                    focusedOption = hoveredOption;
                }

                // Method 2: Check for Material-UI's focus visible (when using arrow keys)
                if (!focusedOption) {
                    const visibleFocusOption = listbox.querySelector('.Mui-focused[role="option"]') as HTMLElement;
                    if (visibleFocusOption) {
                        focusedOption = visibleFocusOption;
                    }
                }

                // Method 3: Check for Material-UI focus state
                if (!focusedOption) {
                    const dataFocusOption = listbox.querySelector('[data-focus="true"][role="option"]') as HTMLElement;
                    if (dataFocusOption) {
                        focusedOption = dataFocusOption;
                    }
                }

                // Method 4: Check for aria-activedescendant pattern
                if (!focusedOption) {
                    const input = target.closest('.MuiAutocomplete-root')?.querySelector('input') as HTMLInputElement;
                    if (input && input.getAttribute('aria-activedescendant')) {
                        const activeId = input.getAttribute('aria-activedescendant');
                        focusedOption = document.getElementById(activeId!) as HTMLElement;
                    }
                }

                // Method 5: Fallback to first option if nothing is visually focused
                if (!focusedOption) {
                    focusedOption = listbox.querySelector('[role="option"]') as HTMLElement;
                }

                // If we found an option to select
                if (focusedOption) {
                    // Select the focused option
                    focusedOption.click();
                }

                // Continue with normal tab navigation
                setTimeout(() => {
                    const currentInput = target.closest('.MuiAutocomplete-root')?.querySelector('input') as HTMLElement;
                    if (currentInput) {
                        const formElements = Array.from(
                            document.querySelectorAll(
                                'input:not([type="checkbox"]):not([type="file"]), .MuiAutocomplete-root input'
                            )
                        );

                        const currentIndex = formElements.indexOf(currentInput);
                        let nextIndex = e.shiftKey ? currentIndex - 1 : currentIndex + 1;

                        if (nextIndex >= 0 && nextIndex < formElements.length) {
                            const nextElement = formElements[nextIndex] as HTMLElement;
                            nextElement.focus();

                            // Auto-open next dropdown if it's an autocomplete
                            const nextAutocomplete = nextElement.closest('.MuiAutocomplete-root');
                            if (nextAutocomplete) {
                                setTimeout(() => {
                                    const openButton = nextAutocomplete.querySelector('button[aria-label="Open"]') as HTMLElement;
                                    if (openButton) openButton.click();
                                }, 10);
                            }
                        }
                    }
                }, 50);
            }
        }
    };

    // Special handler for when inside dropdown options (not the input field)
    const handleDropdownOptionTab = (e: React.KeyboardEvent) => {
        if (e.key === 'Tab') {
            e.preventDefault();
            const target = e.target as HTMLElement;

            // This is already an option, so we can click it directly
            target.click();

            // Move to next field
            setTimeout(() => {
                const currentInput = target.closest('.MuiAutocomplete-root')?.querySelector('input') as HTMLElement;
                if (currentInput) {
                    const formElements = Array.from(
                        document.querySelectorAll(
                            'input:not([type="checkbox"]):not([type="file"]), .MuiAutocomplete-root input'
                        )
                    );

                    const currentIndex = formElements.indexOf(currentInput);
                    let nextIndex = e.shiftKey ? currentIndex - 1 : currentIndex + 1;

                    if (nextIndex >= 0 && nextIndex < formElements.length) {
                        const nextElement = formElements[nextIndex] as HTMLElement;
                        nextElement.focus();

                        // Auto-open next dropdown if it's an autocomplete
                        const nextAutocomplete = nextElement.closest('.MuiAutocomplete-root');
                        if (nextAutocomplete) {
                            setTimeout(() => {
                                const openButton = nextAutocomplete.querySelector('button[aria-label="Open"]') as HTMLElement;
                                if (openButton) openButton.click();
                            }, 10);
                        }
                    }
                }
            }, 50);
        }
    };

    const handleFormKeyDown = (e: React.KeyboardEvent) => {
        const target = e.target as HTMLElement;

        // Check if we're in an autocomplete dropdown option
        const isDropdownOption = target.getAttribute('role') === 'option';

        if (isDropdownOption && e.key === 'Tab') {
            // Handle tab from within dropdown options
            handleDropdownOptionTab(e);
            return;
        }

        // Handle tab for autocomplete input fields
        const isAutocompleteInput = target.closest('.MuiAutocomplete-inputRoot');
        if (isAutocompleteInput && e.key === 'Tab') {
            handleAutocompleteTab(e);
            return;
        }

        // Handle tab for all other inputs
        if (e.key === 'Tab') {
            handleTabNavigation(e);
        }
    };

    return (

       <Box className="item-master-form-page">
            <ItemMaster />

            <Container maxWidth={false} sx={{ px: { xs: 2, sm: 3, md: 4 }, py: 2 }}>
                <Box sx={{ mb: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <DialogTitle className="dialog-title">Add Item</DialogTitle>
                    <Box sx={{ display: 'flex', gap: 2 }}>
                        {/* <button
                            className='btn-secondary'
                            onClick={() => router.back()}
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
                            disabled={isSubmitButtonDisabled}
                        >
                            Submit
                        </button> */}
                        <button
                            className='btn-primary'
                            onClick={() => setSaveConfirmOpen(true)}
                            disabled={isSubmitButtonDisabled}
                        >
                            Submit
                        </button>
                    </Box>
                </Box>
                <div className="form-section" onKeyDown={handleFormKeyDown}>
                    <Grid container spacing={1.2} sx={{ mb: 0 }}>
                        {/* First Row: Item Name to Price field (7 fields) */}

<Grid item xs={12} sm={6} md={4} lg={1.2}>                            <Autocomplete
                                size="small"
                                options={inventory}
                                slotProps={{
                                    clearIndicator: {
                                        sx: { display: "none" },
                                    },
                                }}
                                getOptionLabel={(option) => option.inventoryType}
                                onKeyDown={handleAutocompleteTab}
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
                                        label="Item Type *"
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
                                onChange={(_, value) => {
                                    // ✅ Store the inventory ID, not the name
                                    const inventoryId = value?.inventoryId || "";
                                    setNewItem((prev) => ({
                                        ...prev,
                                        itemType: inventoryId,  // Store ID in state
                                    }));
                                }}
                                value={
                                    // ✅ Find by ID and display the name
                                    inventory.find((inv) => inv.inventoryId === newItem.itemType) || null
                                }
                                disabled={itemLoading}
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
                                    checkDuplicateItemName(e.target.value);
                                }}
                                error={!!itemNameError || hasLetterError(newItem.itemName || '')}
                                helperText={
                                    itemNameError
                                        ? itemNameError
                                        : getHelperText(newItem.itemName || '', '')
                                }
                                inputProps={{ maxLength: 60 }}
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
                                slotProps={{
                                    clearIndicator: {
                                        sx: { display: "none" },
                                    },
                                }}
                                getOptionLabel={(option) => option.categoryName}
                                onKeyDown={handleAutocompleteTab}
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
                                disabled={itemLoading}
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
                                onKeyDown={handleAutocompleteTab}
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
                                disabled={!newItem.category || itemLoading}
                            />
                        </Grid>

                        <Grid item xs={12} sm={6} md={4} lg={1.5}>
                            <Autocomplete
                                size="small"
                                options={itemGroups}
                                slotProps={{
                                    clearIndicator: {
                                        sx: { display: "none" },
                                    },
                                }}
                                getOptionLabel={(option) => option.itemGroupName}
                                onKeyDown={handleAutocompleteTab}
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
                                slotProps={{
                                    clearIndicator: {
                                        sx: { display: "none" },
                                    },
                                }}
                                options={uoms}
                                getOptionLabel={(option) => option.uom}
                                onKeyDown={handleAutocompleteTab}
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
                                onKeyDown={handleAutocompleteTab}
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
                                        tax: value ? `${value.taxPercentage}%` : "",
                                    }))
                                }
                                value={taxes.find((t) => `${t.taxPercentage}%` === newItem.tax) || null}
                            />
                        </Grid>

                        <Grid item xs={12} sm={6} md={4} lg={0.9}>
                            <TextField
                                autoComplete="off"
                                label="Price *"
                                name="price"
                                // ✅ FIXED: Use isSfgItem helper (checks ID → Name mapping)
                                value={isSfgItem ? 0 : (newItem.price || "")}
                                onChange={(e) => {
                                    const value = e.target.value;
                                    if (/^\d{0,4}(\.\d{0,2})?$/.test(value)) {
                                        setNewItem({
                                            ...newItem,
                                            price: value,
                                        });
                                    }
                                }}
                                fullWidth
                                className="custom-textfield"
                                InputLabelProps={{ className: "custom-label" }}
                                InputProps={{
                                    className: "custom-input",
                                    style: isSfgItem ? { backgroundColor: "#f5f5f5" } : {}
                                }}
                                sx={{ "& .MuiOutlinedInput-root": { height: "35px" } }}
                                // ✅ FIXED: Use isSfgItem helper
                                disabled={isSfgItem}
                            />
                        </Grid>



                        {/* Second Row: Net Price to Image Delete Icon (6 fields) */}
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
                                onChange={(e) => {
                                    const value = e.target.value;
                                    if (/^\d{0,8}$/.test(value)) {
                                        handleChange(e);
                                    }
                                }}
                                fullWidth
                                className="custom-textfield"
                                InputLabelProps={{ className: "custom-label" }}
                                InputProps={{ className: "custom-input" }}
                                sx={{ "& .MuiOutlinedInput-root": { height: "35px" } }}
                            />
                        </Grid>


                        {/* Third Row: 4 Checkboxes in a single row */}
                       <Grid item xs={12} sm={6} md={4} lg={0.9} >
                            <FormControlLabel
                                control={
                                    <Checkbox
                                        checked={newItem.birthdayCake}
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

                      <Grid item xs={12} sm={6} md={4} lg={0.84} >
                            <FormControlLabel
                                control={
                                    <Radio
                                        checked={!excludeTaxItem}
                                        onChange={(e) => setExcludeTaxItem(!e.target.checked)}
                                        size="small"
                                    />
                                }
                                label={<Typography variant="caption">Include Tax</Typography>}
                            />
                        </Grid>

                        <Grid item xs={12} sm={6} md={4} lg={0.9} >
                            <FormControlLabel
                                control={
                                    <Radio
                                        checked={excludeTaxItem}
                                        onChange={(e) => setExcludeTaxItem(e.target.checked)}
                                        size="small"
                                    />
                                }
                                label={<Typography variant="caption">Exclude Tax</Typography>}
                            />
                        </Grid>

                       <Grid item xs={12} sm={6} md={4} lg={1.6}>
                            {newItem.image ? (
                                <Box
                                    sx={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 1,
                                    }}
                                >
                                    {/* Square Image Preview */}
                                    <Box
                                        onClick={() => window.open(newItem.image, "_blank")}
                                        sx={{
                                            cursor: "pointer",
                                            width: 40,
                                            height: 40,
                                            border: "1px solid #e0e0e0",
                                            borderRadius: "8px",
                                            overflow: "hidden",
                                            flexShrink: 0,
                                        }}
                                    >
                                        <Image
                                            src={newItem.image}
                                            alt="Item Preview"
                                            width={40}
                                            height={40}
                                            style={{
                                                width: "100%",
                                                height: "100%",
                                                objectFit: "cover",
                                            }}
                                        />
                                    </Box>

                                    {/* Buttons Container */}
                                    <Box sx={{ display: "flex", gap: 1 }}>
                                        {/* Change Button */}
                                        <label htmlFor="image-upload">
                                            <Button
                                                variant="outlined"
                                                component="span"
                                                size="small"
                                                sx={{ minWidth: 60 }}
                                            >
                                                Change
                                            </Button>
                                        </label>

                                        {/* Delete Button */}
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
                                                setImageError(''); // Clear error when removing image
                                            }}
                                            title="Remove Image"
                                        >
                                            <DeleteIcon fontSize="small" />
                                        </Button>
                                    </Box>
                                </Box>
                            ) : (
                                <label htmlFor="image-upload">
                                    <Button
                                        variant="outlined"
                                        component="span"
                                        sx={{ height: 35, width: "100%" }}
                                    >
                                        Upload Image
                                    </Button>
                                </label>
                            )}

                            {/* ✅✅✅ UPDATED FILE INPUT WITH VALIDATION ✅✅✅ */}
                            <input
                                type="file"
                                id="image-upload"
                                style={{ display: "none" }}
                                accept=".png,.jpeg,.jpg,.webp,.gif,.bmp,.svg"
                                onChange={(e) => {
                                    const file = e.target.files?.[0];

                                    // Clear previous error
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
                                        setImageError(`Invalid file format!`);

                                        // Reset input so user can try again
                                        e.target.value = '';

                                        setSnackbar({
                                            open: true,
                                            message: `❌ Invalid file format! Please upload: PNG, JPEG, JPG, WEBP, GIF, BMP, or SVG`,
                                            severity: 'error',
                                        });
                                        return;
                                    }

                                    // ✅ VALID FILE - Check file size (optional: max 5MB)
                                    const maxSizeInBytes = 5 * 1024 * 1024; // 5MB
                                    if (file.size > maxSizeInBytes) {
                                        setImageError('File too large! Maximum size allowed is 5MB');
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
                                    }}
                                >
                                    ⚠️ {imageError}
                                </Typography>
                            )}
                        </Grid>


                    </Grid>
                </div>

                {/* Variances Section */}

                <Box
                    sx={{
                        display: 'flex',
                        justifyContent: 'flex-end',
                        alignItems: 'center',
                        width: '100%',
                    }}
                >
                    <button
                        className="btn-primary"
                        onClick={handleAddNewVariance}
                        style={{
                            padding: '6px 12px',
                            fontSize: '0.75rem',
                            whiteSpace: 'nowrap'
                        }}
                    >
                        Add Variance
                    </button>
                </Box>

                <Box sx={{
                    mt: 0.5,
                    width: '100%',
                    overflow: 'hidden'
                }}>
                    <div
                        // className="table-container"
                        style={{
                            maxHeight: 'calc(92vh - 170px)',
                            width: '100%',
                            overflow: 'auto'
                        }}
                    >
                        {/* Single Table Structure (not separated) */}
                        <table
                            className="custom-table"
                            style={{
                                borderCollapse: 'separate',
                                borderSpacing: '0 2px', // Reduced from 6px to 2px
                                width: '100%',
                                minWidth: 'fit-content'
                            }}
                        >
                            <thead>
                                <tr>
                                    <th style={{ minWidth: '70px', padding: '8px 4px' }}>Image</th>
                                    <th style={{ minWidth: '100px', padding: '8px 4px' }}>SAP Code</th>
                                    <th style={{ minWidth: '180px', padding: '8px 4px' }}>Variance Name</th>
                                    <th style={{ minWidth: '90px', padding: '8px 4px' }}>UOM</th>
                                    <th style={{ minWidth: '130px', padding: '8px 4px' }}>Price</th>
                                    <th style={{ minWidth: '100px', padding: '8px 4px' }}>Net Price</th>
                                    <th style={{ minWidth: '100px', padding: '8px 4px' }}>Tax Price</th>
                                    <th style={{ minWidth: '100px', padding: '8px 4px' }}>Final Price</th>
                                    <th style={{ minWidth: '70px', padding: '8px 4px' }}>ROL</th>
                                    <th style={{ minWidth: '80px', padding: '8px 4px' }}>Shelf Life</th>

                                    <th style={{ minWidth: '60px', padding: '8px 4px' }}>Actions</th>
                                </tr>
                            </thead>

                            <tbody>
                                {variances.map((variance, index) => {
                                    // Calculate based on each variance's individual price
                                    const priceNum = parseFloat(variance.price as string) || 0;
                                    const taxNum = parseFloat(newItem.tax as string) || 0;

                                    let netPrice = "";
                                    let taxPrice = "";
                                    let finalPrice = "";

                                    if (!isNaN(priceNum) && priceNum > 0) {
                                        if (taxNum === 0) {
                                            // When tax is 0%, price = netPrice = finalPrice
                                            netPrice = priceNum.toFixed(2);
                                            taxPrice = "0";
                                            finalPrice = priceNum.toFixed(2);
                                        } else if (!excludeTaxItem) {
                                            // Include Tax mode: variance price already includes tax
                                            netPrice = (priceNum / (1 + taxNum / 100)).toFixed(2);
                                            taxPrice = (priceNum - parseFloat(netPrice)).toFixed(2);
                                            finalPrice = priceNum.toFixed(2);
                                        } else {
                                            // Exclude Tax mode: variance price is net price
                                            netPrice = priceNum.toFixed(2);
                                            taxPrice = (priceNum * (taxNum / 100)).toFixed(2);
                                            finalPrice = (priceNum + parseFloat(taxPrice)).toFixed(2);
                                        }
                                    }

                                    return (
                                        <tr key={index} style={{ margin: 0, padding: 0 }}>


                                            <td style={{ padding: '2px 4px', textAlign: 'center' }}>
                                                <input
                                                    type="file"
                                                    accept=".png,.jpeg,.jpg,.webp"
                                                    id={`variance-image-${index}`}
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
                                                        handleVarianceImageChange(index, file);
                                                    }}
                                                />
                                                <label htmlFor={`variance-image-${index}`}>
                                                    <IconButton component="span" size="small" title="Upload Variance Image">
                                                        {variance.varianceImagePreview ? (
                                                            <Box component="img" src={variance.varianceImagePreview} alt="variance"
                                                                sx={{ width: 28, height: 28, borderRadius: '4px', objectFit: 'cover', border: '1px solid #e0e0e0' }} />
                                                        ) : (
                                                            <ImageIcon fontSize="small" />
                                                        )}
                                                    </IconButton>
                                                </label>
                                            </td>


                                            {/* SAP Code */}
                                            <td style={{ padding: '2px 4px' }}>
                                                <TextField
                                                    autoComplete="off"
                                                    size="small"
                                                    name="sapCode"
                                                    value={variance.sapCode || ""}
                                                    onChange={(e) => {
                                                        const value = e.target.value;
                                                        if (/^[a-zA-Z0-9]*$/.test(value)) {
                                                            handleVarianceChange(index, 'sapCode', value);
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
                                                            ml: -0.5,
                                                        },
                                                        "& .MuiInputBase-input": {
                                                            padding: "6px 8px",
                                                        },
                                                    }}
                                                />
                                            </td>


                                            {/* Variance Name */}
                                            <td style={{ padding: '2px 4px' }}>
                                                <TextField
                                                    autoComplete="off"
                                                    size="small"
                                                    name="varianceName"
                                                    value={variance.varianceName || ""}
                                                    onChange={(e) => {
                                                        const filtered = e.target.value
                                                            .toUpperCase() // convert all letters to uppercase
                                                            .replace(/[^a-zA-Z0-9\s\-.,/&()]/g, '') // strip special chars
                                                            .slice(0, 50);                        // max 50
                                                        handleVarianceChange(index, 'varianceName', filtered);
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
                                            </td>

                                            {/* UOM */}
                                            <td style={{ padding: '2px 4px' }}>
                                                <Autocomplete
                                                    size="small"
                                                    options={uoms}
                                                    getOptionLabel={(option) => option.uom}
                                                    value={uoms.find((u) => u.uom === variance.uom) || null}
                                                    onChange={(_, value) =>
                                                        handleVarianceChange(index, "uom", value?.uom || "")
                                                    }
                                                    isOptionEqualToValue={(option, value) => option.uom === value.uom}
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
                                                            error={!variance.uom}
                                                            //   helperText={!variance.uom ? "Required" : ""}
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
                                                                    margin: 0,
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
                                            <td style={{ padding: '2px 4px' }}>
                                                <TextField
                                                    autoComplete="off"
                                                    size="small"
                                                    name="price"
                                                    // ✅ FIXED: Use isSfgItem helper
                                                    value={isSfgItem ? 0 : (variance.price || "")}
                                                    onChange={(e) => {
                                                        const value = e.target.value;
                                                        if (/^\d{0,4}(\.\d{0,2})?$/.test(value)) {
                                                            handleVarianceChange(index, 'price', value);
                                                        }
                                                    }}
                                                    error={!isSfgItem && !variance.price}
                                                    // ✅ FIXED: Disable when SFG
                                                    disabled={isSfgItem}
                                                    className="custom-textfield"
                                                    InputLabelProps={{ className: "custom-label" }}
                                                    InputProps={{
                                                        className: "custom-input",
                                                        style: isSfgItem ? { backgroundColor: "#f5f5f5" } : {},
                                                        endAdornment: (
                                                            <Button
                                                                size="small"
                                                                onClick={() => handlePriceOverrideClick(index)}
                                                                variant="outlined"
                                                                // ✅ FIXED: Disable override button when SFG
                                                                disabled={isSfgItem}
                                                                sx={{
                                                                    minWidth: "auto",
                                                                    height: "24px",
                                                                    fontSize: "0.65rem",
                                                                    padding: "0 6px",
                                                                    whiteSpace: "nowrap",
                                                                    textTransform: "none",
                                                                    fontFamily: "'Poppins', sans-serif",
                                                                    borderColor: "rgb(209, 213, 219)",
                                                                    color: "rgb(55, 65, 81)",
                                                                    marginRight: "-6px",
                                                                    "&:hover": {
                                                                        backgroundColor: "rgb(249, 250, 251)",
                                                                        borderColor: "rgb(156, 163, 175)",
                                                                    },
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
                                                            minWidth: "130px",
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
                                                    value={variance.reorderLevel || ""}
                                                    onChange={(e) => {
                                                        const value = e.target.value;
                                                        if (/^\d{0,4}$/.test(value)) {
                                                            handleVarianceChange(index, 'reorderLevel', value);
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
                                                    value={variance.shelfLife || ""}
                                                    onChange={(e) => {
                                                        const value = e.target.value;
                                                        if (/^\d{0,3}$/.test(value)) {
                                                            handleVarianceChange(index, 'shelfLife', value);
                                                        }
                                                    }}
                                                    error={!variance.shelfLife}
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



                                            {/* Actions */}
                                            <td style={{ padding: '2px 4px' }}>
                                                <div className="flex justify-center">
                                                    <button
                                                        onClick={() => handleDeleteVariance(index)}
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
                        {/* Header */}
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
                                                        // Get the sales type NAMES for this branch
                                                        const salesTypeNames = salesTypesByBranch[alias] || [];
                                                        updatedSalesTypePrices[alias] = {};

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
                                            ListboxProps={{ style: { maxHeight: 272 } }}
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
                                                                color: '#1e293b',
                                                            }}>
                                                                Branch
                                                            </th>

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
                                                            {/* ✅ DYNAMIC HEADERS */}
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

                                                                    {/* Base Price */}
                                                                    <td style={{ padding: '8px', textAlign: 'center', borderRight: '1px solid #e2e8f0' }}>
                                                                        <TextField
                                                                            autoComplete='off'
                                                                            size="small"
                                                                            value={aliasPrices[alias] || ''}
                                                                            onChange={(e) => {
                                                                                const val = e.target.value;
                                                                                if (val === '' || /^\d*\.?\d{0,2}$/.test(val)) {
                                                                                    handleAliasPriceChange(alias, val);
                                                                                    const updated = { ...aliasSalesTypePrices };
                                                                                    if (!updated[alias]) updated[alias] = {};
                                                                                    branchSalesTypeNames.forEach(st => {
                                                                                        updated[alias][st] = val;
                                                                                    });
                                                                                    setAliasSalesTypePrices(updated);
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

                        {/* Actions */}
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
                                onClick={() => {
                                    if (currentVarianceIndex !== null) {
                                        // Save override prices for this specific variance
                                        setAliasPricesByVariance(prev => ({
                                            ...prev,
                                            [currentVarianceIndex]: { ...aliasPrices }
                                        }));
                                        setAliasSalesTypePricesByVariance(prev => ({
                                            ...prev,
                                            [currentVarianceIndex]: { ...aliasSalesTypePrices }
                                        }));
                                        // ✅ NEW: Save ItemStatus for this variance
                                        setBranchItemStatusByVariance(prev => ({
                                            ...prev,
                                            [currentVarianceIndex]: { ...branchItemStatus }
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

                {/* Delete Confirmation Modal */}
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
                <CreateConfirmationDialog
                    open={saveConfirmOpen}
                    onClose={() => setSaveConfirmOpen(false)}
                    onConfirm={async () => {
                        setSaveConfirmOpen(false);
                        await handleSubmit();
                    }}
                />
            </Container>
        </Box>
    );
}

export default AddItemPage;