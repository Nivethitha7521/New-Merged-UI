

'use client';
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../../../redux/store';
import {
    fetchItemNamesDropdown,
    fetchVariancesByItemName,
} from '../../Items/Item/Features/itemSlice';
import {
    Box,
    Typography,
    TextField,
    Autocomplete,
    Container,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Snackbar,
    Alert,
    Chip,
    CircularProgress,
} from '@mui/material';
import { Delete as DeleteIcon } from '@mui/icons-material';
import axios from 'axios';
import { API_BASE_URL } from '../../../../../API_URL';
import { useRouter } from 'next/navigation';
import ItemMaster from '../add/style';
import CloseConfirmationDialog from '@/app/Components/Dialogs/CloseConfirmationDialog';
import CreateConfirmationDialog from '@/app/Components/Dialogs/createConformation';
import CheckBoxOutlineBlankIcon from '@mui/icons-material/CheckBoxOutlineBlank';
import CheckBoxIcon from '@mui/icons-material/CheckBox';
import Checkbox from '@mui/material/Checkbox';

// ─── Types ────────────────────────────────────────────────────────────────────

interface VarianceOption {
    varianceId: string;
    varianceName: string;
    itemName: string;
    itemCode: string;
    price: number;
    uom: string;
    label: string;
}

interface ComboRow {
    varianceId: string;
    itemName: string;
    varianceName: string;
    itemCode: string;
    originalPrice: number;
    uom: string;
    qty: number;
    totalOriginalPrice: number;
    adjustedPrice: number;
    discount: number;
}

// ─── Component ────────────────────────────────────────────────────────────────

function ComboPage() {
    const router = useRouter();
    const dispatch = useDispatch<AppDispatch>();

    // ── Redux state ───────────────────────────────────────────────────────────
    const { itemNamesDropdown, variancesByItemName, loading: itemLoading } = useSelector(
        (state: RootState) => state.maItems
    );

    // ── Local state ───────────────────────────────────────────────────────────
    const [comboName, setComboName] = useState('');
    const [comboNameError, setComboNameError] = useState('');

    const [entryPrice, setEntryPrice] = useState('');
    const [entryPriceError, setEntryPriceError] = useState('');

    const [selectedItemNames, setSelectedItemNames] = useState<string[]>([]);
    const [itemNameInput, setItemNameInput] = useState('');

    const [selectedVariance, setSelectedVariance] = useState<VarianceOption | null>(null);
    const [varianceInput, setVarianceInput] = useState('');
    const [loadingVariances, setLoadingVariances] = useState(false);

    const [comboRows, setComboRows] = useState<ComboRow[]>([]);

    // ── Qty input display state (decoupled from clamped number) ───────────────
    const [qtyInputValues, setQtyInputValues] = useState<Record<number, string>>({});

    // ── Dialogs ───────────────────────────────────────────────────────────────
    const [closeConfirmOpen, setCloseConfirmOpen] = useState(false);
    const [saveConfirmOpen, setSaveConfirmOpen] = useState(false);
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [deleteIndex, setDeleteIndex] = useState<number | null>(null);

    // ── Snackbar ──────────────────────────────────────────────────────────────
    const [snackbar, setSnackbar] = useState<{
        open: boolean;
        message: string;
        severity: 'success' | 'error' | 'warning';
    }>({ open: false, message: '', severity: 'success' });

    // ── On mount: fetch item name dropdown ────────────────────────────────────
    useEffect(() => {
        dispatch(fetchItemNamesDropdown());
    }, [dispatch]);

    // ── When selected item names change: fetch their variances ────────────────
    useEffect(() => {
        if (selectedItemNames.length === 0) return;
        setLoadingVariances(true);
        Promise.all(
            selectedItemNames.map((name) =>
                dispatch(fetchVariancesByItemName({ item_name: name, limit: 200 })).unwrap()
            )
        ).finally(() => setLoadingVariances(false));
    }, [selectedItemNames, dispatch]);

    // ── Variance options filtered by selected item names ──────────────────────
    //   const varianceOptions: VarianceOption[] = useMemo(() => {
    //     const raw = variancesByItemName ?? [];
    //     return raw
    //       .filter((v: any) => selectedItemNames.includes(v.itemName))
    //       .map((v: any) => ({
    //         varianceId: v.itemCode,
    //         varianceName: v.varianceName ?? '',
    //         itemName: v.itemName ?? '',
    //         itemCode: v.itemCode ?? '',
    //         price: parseFloat(v.variance_Defaultprice ?? 0),
    //         uom: v.variance_Uom ?? '',
    //         label: `${v.itemName ?? ''} — ${v.varianceName ?? ''}`,
    //       }));
    //   }, [variancesByItemName, selectedItemNames]);



    const varianceOptions: VarianceOption[] = useMemo(() => {
        const raw = variancesByItemName ?? [];
        return raw
            .filter((v: any) => selectedItemNames.includes(v.itemName))
            .map((v: any) => ({
                varianceId: v.itemCode,
                varianceName: v.varianceName ?? '',
                itemName: v.itemName ?? '',
                itemCode: v.itemCode ?? '',
                price: parseFloat(v.variance_Defaultprice ?? 0),
                uom: v.variance_Uom ?? '',
                // ✅ Fix: varianceName as primary label, itemName as secondary
                label: `${v.varianceName ?? ''} — ${v.itemName ?? ''}`,
            }));
    }, [variancesByItemName, selectedItemNames]);

    // ── Derived totals ────────────────────────────────────────────────────────
    const grandOriginalTotal = useMemo(
        () => comboRows.reduce((sum, r) => sum + r.totalOriginalPrice, 0),
        [comboRows]
    );

    const entryPriceNum = parseFloat(entryPrice) || 0;

    const totalDiscount = useMemo(
        () => grandOriginalTotal - entryPriceNum,
        [grandOriginalTotal, entryPriceNum]
    );

    const calculatedRows = useMemo<ComboRow[]>(() => {
        if (comboRows.length === 0) return [];
        return comboRows.map((row) => {
            if (grandOriginalTotal === 0) return { ...row, discount: 0, adjustedPrice: row.totalOriginalPrice };
            const discount =
                entryPriceNum > 0 && entryPriceNum < grandOriginalTotal
                    ? (row.totalOriginalPrice / grandOriginalTotal) * totalDiscount
                    : 0;
            const adjustedPrice = Math.max(0, row.totalOriginalPrice - discount);
            return { ...row, discount, adjustedPrice };
        });
    }, [comboRows, entryPriceNum, grandOriginalTotal, totalDiscount]);

    const adjustedTotal = useMemo(
        () => calculatedRows.reduce((sum, r) => sum + r.adjustedPrice, 0),
        [calculatedRows]
    );

    // ── Handlers ──────────────────────────────────────────────────────────────

    const handleComboNameChange = (value: string) => {
        const filtered = value.replace(/[^a-zA-Z0-9\s\-.,/&()]/g, '').slice(0, 100);
        setComboName(filtered);
        setComboNameError(filtered.trim() ? '' : 'Combo name is required.');
    };

    const handleEntryPriceChange = (value: string) => {
        if (value === '' || /^\d{0,6}(\.\d{0,2})?$/.test(value)) {
            setEntryPrice(value);
            const num = parseFloat(value) || 0;
            if (num > grandOriginalTotal && grandOriginalTotal > 0) {
                setEntryPriceError('Entry price cannot exceed total original price.');
            } else {
                setEntryPriceError('');
            }
        }
    };

    const handleItemNameChange = (_: any, values: string[]) => {
        setSelectedItemNames(values);
        setComboRows((prev) => prev.filter((r) => values.includes(r.itemName)));
        setSelectedVariance(null);
    };

    const handleVarianceSelect = (_: any, value: VarianceOption | null) => {
        if (!value) return;
        const alreadyAdded = comboRows.some(
            (r) => r.itemCode === value.itemCode && r.varianceName === value.varianceName
        );
        if (alreadyAdded) {
            setSnackbar({ open: true, message: `"${value.label}" is already in the combo.`, severity: 'warning' });
            setSelectedVariance(null);
            return;
        }
        const newRow: ComboRow = {
            varianceId: value.varianceId,
            itemName: value.itemName,
            varianceName: value.varianceName,
            itemCode: value.itemCode,
            originalPrice: value.price,
            uom: value.uom,
            qty: 1,
            totalOriginalPrice: value.price,
            adjustedPrice: value.price,
            discount: 0,
        };
        setComboRows((prev) => [...prev, newRow]);
        setSelectedVariance(null);
    };

    // ── Qty handlers (decoupled display from clamped value) ───────────────────

    const handleQtyChange = useCallback((index: number, value: string) => {
        // Always update display string so user can type freely
        setQtyInputValues((prev) => ({ ...prev, [index]: value }));

        // Don't update rows while field is empty or mid-typing
        if (value === '' || value === '-') return;

        const parsed = parseInt(value, 10);
        if (isNaN(parsed)) return;

        // Clamp to 1–10
        const qty = Math.min(10, Math.max(1, parsed));

        // Sync clamped value back to display immediately
        setQtyInputValues((prev) => ({ ...prev, [index]: String(qty) }));

        setComboRows((prev) => {
            const updated = [...prev];
            const row = updated[index];
            updated[index] = {
                ...row,
                qty,
                totalOriginalPrice: row.originalPrice * qty,
            };
            return updated;
        });
    }, []);

    const handleQtyBlur = useCallback((index: number) => {
        setQtyInputValues((prev) => {
            const raw = prev[index];
            const parsed = parseInt(raw, 10);
            const qty = isNaN(parsed) ? 1 : Math.min(10, Math.max(1, parsed));
            setComboRows((rows) => {
                const updated = [...rows];
                const row = updated[index];
                updated[index] = {
                    ...row,
                    qty,
                    totalOriginalPrice: row.originalPrice * qty,
                };
                return updated;
            });
            return { ...prev, [index]: String(qty) };
        });
    }, []);

    // ── Variance name edit ────────────────────────────────────────────────────

    const handleVarianceNameChange = useCallback((index: number, value: string) => {
        const filtered = value
            .toUpperCase()
            .replace(/[^a-zA-Z0-9\s\-.,/&()]/g, '')
            .slice(0, 50);
        setComboRows((prev) => {
            const updated = [...prev];
            updated[index] = { ...updated[index], varianceName: filtered };
            return updated;
        });
    }, []);

    const handleDeleteClick = (index: number) => {
        setDeleteIndex(index);
        setDeleteOpen(true);
    };

    const handleConfirmDelete = () => {
        if (deleteIndex !== null) {
            setComboRows((prev) => prev.filter((_, i) => i !== deleteIndex));
            // Clean up qty display state for deleted row
            setQtyInputValues((prev) => {
                const updated: Record<number, string> = {};
                Object.entries(prev).forEach(([key, val]) => {
                    const k = parseInt(key);
                    if (k < deleteIndex) updated[k] = val;
                    else if (k > deleteIndex) updated[k - 1] = val; // shift indices down
                });
                return updated;
            });
        }
        setDeleteOpen(false);
        setDeleteIndex(null);
    };

    const handleSubmit = async () => {
        if (!comboName.trim()) {
            setSnackbar({ open: true, message: 'Please enter a combo name.', severity: 'error' });
            return;
        }
        if (!entryPrice || parseFloat(entryPrice) <= 0) {
            setSnackbar({ open: true, message: 'Please enter a valid Entry Price.', severity: 'error' });
            return;
        }
        if (comboRows.length < 2) {
            setSnackbar({ open: true, message: 'Please add at least 2 variances for a combo.', severity: 'error' });
            return;
        }
        if (entryPriceError) {
            setSnackbar({ open: true, message: entryPriceError, severity: 'error' });
            return;
        }

        try {
            const payload = {
                comboName: comboName.trim(),
                entryPrice: parseFloat(entryPrice),
                totalOriginalPrice: grandOriginalTotal,
                totalDiscount,
                items: calculatedRows.map((r) => ({
                    itemCode: r.itemCode,
                    itemName: r.itemName,
                    varianceName: r.varianceName,
                    uom: r.uom,
                    qty: r.qty,
                    unitPrice: r.originalPrice,
                    originalPrice: r.totalOriginalPrice,
                    discount: parseFloat(r.discount.toFixed(2)),
                    adjustedPrice: parseFloat(r.adjustedPrice.toFixed(2)),
                })),
            };

            // TODO: Replace with your actual combo POST endpoint
            // await axios.post(`${API_BASE_URL}/itemmasters/combo/`, payload);
            console.log('Combo Payload:', payload);

            setSnackbar({ open: true, message: 'Combo created successfully!', severity: 'success' });
            setTimeout(() => router.back(), 1500);
        } catch (err: any) {
            setSnackbar({
                open: true,
                message: `Failed to save combo: ${err.response?.data?.detail ?? err.message}`,
                severity: 'error',
            });
        }
    };

    const isSubmitDisabled =
        !comboName.trim() ||
        comboRows.length < 2 ||
        !entryPrice ||
        parseFloat(entryPrice) <= 0 ||
        !!entryPriceError;

    // ── Shared styles ─────────────────────────────────────────────────────────

    const labelSx = {
        fontSize: '0.75rem',
        fontWeight: 600,
        color: '#475569',
        fontFamily: "'Poppins', sans-serif",
        mb: 0.5,
        display: 'block',
    };

    const fieldWrapSx = { display: 'flex', flexDirection: 'column' as const };

    // ── Render ────────────────────────────────────────────────────────────────

    return (
        <Box>
            <ItemMaster />

            <Container maxWidth={false} sx={{ px: { xs: 2, sm: 3, md: 4 }, py: 2 }}>

                {/* ── Header ── */}
                <Box sx={{ mb: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <DialogTitle className="dialog-title">Add Combo</DialogTitle>
                    <Box sx={{ display: 'flex', gap: 2 }}>
                        <button className="btn-secondary" onClick={() => setCloseConfirmOpen(true)}>Back</button>
                        <button className="btn-primary" onClick={() => setSaveConfirmOpen(true)} disabled={isSubmitDisabled}>
                            Submit
                        </button>
                    </Box>
                </Box>

                {/* ── Top Controls ── */}
                <div className="form-section">
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, flexWrap: 'wrap', mb: 1.5 }}>

                        {/* Combo Name */}
                        <Box sx={{ ...fieldWrapSx, minWidth: 200 }}>
                            <Typography component="span" sx={labelSx}>Combo Name *</Typography>
                            <TextField
                                autoComplete="off"
                                placeholder="Enter combo name"
                                value={comboName}
                                onChange={(e) => handleComboNameChange(e.target.value)}
                                error={!!comboNameError}
                                helperText={comboNameError}
                                size="small"
                                className="custom-textfield"
                                InputLabelProps={{ className: 'custom-label' }}
                                InputProps={{ className: 'custom-input' }}
                                sx={{
                                    '& .MuiOutlinedInput-root': { height: '35px' },
                                    '& .MuiFormHelperText-root': { fontSize: '0.65rem', margin: '2px 0 0 0', color: 'red' },
                                }}
                            />
                        </Box>

                        {/* Entry Price */}
                        <Box sx={{ ...fieldWrapSx, minWidth: 160 }}>
                            <Typography component="span" sx={labelSx}>Entry Price *</Typography>
                            <TextField
                                autoComplete="off"
                                placeholder="0.00"
                                value={entryPrice}
                                onChange={(e) => handleEntryPriceChange(e.target.value)}
                                error={!!entryPriceError}
                                helperText={entryPriceError}
                                size="small"
                                className="custom-textfield"
                                InputLabelProps={{ className: 'custom-label' }}
                                InputProps={{ className: 'custom-input' }}
                                sx={{
                                    '& .MuiOutlinedInput-root': { height: '35px' },
                                    '& .MuiFormHelperText-root': { fontSize: '0.65rem', margin: '2px 0 0 0', color: 'red' },
                                }}
                            />
                        </Box>

                        {/* Item Name Multi-select */}
                        {/* <Box sx={{ ...fieldWrapSx, minWidth: 300 }}>
                            <Typography component="span" sx={labelSx}>Item Name *</Typography>
                            <Autocomplete
                                multiple
                                size="small"
                                options={itemNamesDropdown ?? []}
                                value={selectedItemNames}
                                onChange={handleItemNameChange}
                                inputValue={itemNameInput}
                                onInputChange={(_, v) => setItemNameInput(v)}
                                loading={itemLoading}
                                disableCloseOnSelect
                                getOptionLabel={(option) => option}
                                isOptionEqualToValue={(o, v) => o === v}
                                renderTags={(value, getTagProps) =>
                                    value.map((option, index) => (
                                        <Chip
                                            label={option}
                                            size="small"
                                            {...getTagProps({ index })}
                                            sx={{ fontSize: '0.68rem', fontFamily: "'Poppins', sans-serif", height: '20px' }}
                                        />
                                    ))
                                }
                                renderOption={(props, option, { selected }) => (
                                    <li
                                        {...props}
                                        key={option}
                                        style={{
                                            fontSize: '0.78rem',
                                            fontFamily: "'Poppins', sans-serif",
                                            paddingTop: 6,
                                            paddingBottom: 6,
                                            backgroundColor: selected ? '#eff6ff' : undefined,
                                        }}
                                    >
                                        {option}
                                    </li>
                                )}
                                renderInput={(params) => (
                                    <TextField
                                        {...params}
                                        placeholder={selectedItemNames.length === 0 ? 'Search item names…' : ''}
                                        className="custom-textfield"
                                        InputProps={{
                                            ...params.InputProps,
                                            className: 'custom-input',
                                            endAdornment: (
                                                <>
                                                    {itemLoading ? <CircularProgress size={14} /> : null}
                                                    {params.InputProps.endAdornment}
                                                </>
                                            ),
                                        }}
                                        sx={{
                                            '& .MuiAutocomplete-input': { fontSize: '0.813rem', padding: '4px 8px !important' },
                                            '& .MuiOutlinedInput-root': { minHeight: '35px', padding: '2px 8px !important' },
                                        }}
                                    />
                                )}
                            />
                        </Box> */}



                        <Box sx={{ ...fieldWrapSx, minWidth: 300 }}>
                            <Typography component="span" sx={labelSx}>Item Name *</Typography>
                            <Autocomplete
                                multiple
                                size="small"
                                options={[
                                    // ✅ Selected items always appear first at the top
                                    ...(itemNamesDropdown ?? []).filter((o) => selectedItemNames.includes(o)),
                                    ...(itemNamesDropdown ?? []).filter((o) => !selectedItemNames.includes(o)),
                                ]}
                                value={selectedItemNames}
                                onChange={handleItemNameChange}
                                inputValue={itemNameInput}
                                onInputChange={(_, v) => setItemNameInput(v)}
                                loading={itemLoading}
                                disableCloseOnSelect
                                getOptionLabel={(option) => option}
                                isOptionEqualToValue={(o, v) => o === v}

                                // ✅ Hide chips — show only count badge in the input
                                renderTags={() => null}

                                renderOption={(props, option, { selected }) => (
                                    <li
                                        {...props}
                                        key={option}
                                        style={{
                                            fontSize: '0.78rem',
                                            fontFamily: "'Poppins', sans-serif",
                                            paddingTop: 4,
                                            paddingBottom: 4,
                                            paddingLeft: 8,
                                            backgroundColor: selected ? '#eff6ff' : undefined,
                                            borderBottom: selected ? '1px solid #dbeafe' : undefined,
                                        }}
                                    >
                                        {/* ✅ Checkbox for each option */}
                                        <Checkbox
                                            icon={<CheckBoxOutlineBlankIcon sx={{ fontSize: 16 }} />}
                                            checkedIcon={<CheckBoxIcon sx={{ fontSize: 16, color: '#2563eb' }} />}
                                            checked={selected}
                                            size="small"
                                            sx={{ padding: '2px 6px 2px 0px', margin: 0 }}
                                        />
                                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                                            <Typography sx={{ fontSize: '0.78rem', fontFamily: "'Poppins', sans-serif", fontWeight: selected ? 600 : 400, color: selected ? '#1e40af' : '#1e293b' }}>
                                                {option}
                                            </Typography>
                                            {selected && (
                                                <Chip
                                                    label="Selected"
                                                    size="small"
                                                    sx={{
                                                        height: '16px',
                                                        fontSize: '0.6rem',
                                                        fontFamily: "'Poppins', sans-serif",
                                                        backgroundColor: '#dbeafe',
                                                        color: '#1e40af',
                                                        ml: 1,
                                                        '& .MuiChip-label': { padding: '0 6px' },
                                                    }}
                                                />
                                            )}
                                        </Box>
                                    </li>
                                )}

                                renderInput={(params) => (
                                    <TextField
                                        {...params}
                                        placeholder={selectedItemNames.length === 0 ? 'Search item names…' : ''}
                                        className="custom-textfield"
                                        InputProps={{
                                            ...params.InputProps,
                                            className: 'custom-input',
                                            // ✅ Show count badge inside input when items are selected
                                            startAdornment: selectedItemNames.length > 0 ? (
                                                <Box
                                                    sx={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: 0.5,
                                                        ml: 0.5,
                                                        flexShrink: 0,
                                                    }}
                                                >
                                                    <Box
                                                        sx={{
                                                            backgroundColor: '#2563eb',
                                                            color: '#fff',
                                                            borderRadius: '12px',
                                                            px: 1,
                                                            py: '1px',
                                                            fontSize: '0.68rem',
                                                            fontFamily: "'Poppins', sans-serif",
                                                            fontWeight: 600,
                                                            whiteSpace: 'nowrap',
                                                            lineHeight: 1.6,
                                                        }}
                                                    >
                                                        {selectedItemNames.length} selected
                                                    </Box>
                                                </Box>
                                            ) : null,
                                            endAdornment: (
                                                <>
                                                    {itemLoading ? <CircularProgress size={14} /> : null}
                                                    {params.InputProps.endAdornment}
                                                </>
                                            ),
                                        }}
                                        sx={{
                                            '& .MuiAutocomplete-input': {
                                                fontSize: '0.813rem',
                                                padding: '4px 8px !important',
                                                minWidth: '80px !important',
                                            },
                                            '& .MuiOutlinedInput-root': {
                                                minHeight: '35px',
                                                height: '35px',
                                                padding: '0 8px !important',
                                                flexWrap: 'nowrap',
                                                overflow: 'hidden',
                                            },
                                        }}
                                    />
                                )}
                            />
                        </Box>

                        {/* Variance Dropdown */}
                        <Box sx={{ ...fieldWrapSx, minWidth: 300 }}>
                            <Typography component="span" sx={labelSx}>
                                Select Variance{' '}
                                {selectedItemNames.length === 0 && (
                                    <span style={{ fontWeight: 400, color: '#94a3b8', fontSize: '0.68rem' }}>
                                        (select item first)
                                    </span>
                                )}
                            </Typography>
                            <Autocomplete
                                size="small"
                                options={varianceOptions}
                                getOptionLabel={(option) => option.label}
                                value={selectedVariance}
                                onChange={handleVarianceSelect}
                                inputValue={varianceInput}
                                onInputChange={(_, v) => setVarianceInput(v)}
                                loading={loadingVariances}
                                disabled={selectedItemNames.length === 0}
                                isOptionEqualToValue={(o, v) => o.varianceId === v.varianceId}
                                slotProps={{ clearIndicator: { sx: { display: 'none' } } }}
                                // renderOption={(props, option) => (
                                //   <li
                                //     {...props}
                                //     key={`${option.itemCode}-${option.varianceName}`}
                                //     style={{ fontSize: '12px', minHeight: '16px', paddingTop: 8, paddingBottom: 8, fontFamily: "'Poppins', sans-serif" }}
                                //   >
                                //     <Box>
                                //       <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.78rem', fontFamily: "'Poppins', sans-serif" }}>
                                //         {option.itemName}
                                //       </Typography>
                                //       <Typography variant="caption" sx={{ color: 'text.secondary', fontFamily: "'Poppins', sans-serif" }}>
                                //         {option.varianceName} &nbsp;|&nbsp; ₹{option.price.toFixed(2)} &nbsp;|&nbsp; {option.uom}
                                //       </Typography>
                                //     </Box>
                                //   </li>
                                // )}

                                renderOption={(props, option) => (
                                    <li
                                        {...props}
                                        key={`${option.itemCode}-${option.varianceName}`}
                                        style={{
                                            fontSize: '12px',
                                            minHeight: '16px',
                                            paddingTop: 8,
                                            paddingBottom: 8,
                                            fontFamily: "'Poppins', sans-serif",
                                        }}
                                    >
                                        <Box>
                                            {/* ✅ Fix: show varianceName as bold primary text */}
                                            <Typography
                                                variant="body2"
                                                sx={{
                                                    fontWeight: 600,
                                                    fontSize: '0.78rem',
                                                    fontFamily: "'Poppins', sans-serif",
                                                }}
                                            >
                                                {option.varianceName}
                                            </Typography>
                                            {/* ✅ Fix: show itemName | price | uom as secondary info */}
                                            <Typography
                                                variant="caption"
                                                sx={{
                                                    color: 'text.secondary',
                                                    fontFamily: "'Poppins', sans-serif",
                                                }}
                                            >
                                                {option.itemName} &nbsp;|&nbsp; ₹{option.price.toFixed(2)} &nbsp;|&nbsp; {option.uom}
                                            </Typography>
                                        </Box>
                                    </li>
                                )}

                                renderInput={(params) => (
                                    <TextField
                                        {...params}
                                        placeholder={selectedItemNames.length === 0 ? 'Select item first…' : 'Search variance…'}
                                        className="custom-textfield"
                                        InputProps={{
                                            ...params.InputProps,
                                            className: 'custom-input',
                                            endAdornment: (
                                                <>
                                                    {loadingVariances ? <CircularProgress size={14} /> : null}
                                                    {params.InputProps.endAdornment}
                                                </>
                                            ),
                                        }}
                                        sx={{
                                            '& .MuiAutocomplete-input': { padding: '13px 14px !important', fontSize: '0.813rem' },
                                            '& .MuiOutlinedInput-root': { height: '35px', padding: '0 14px !important' },
                                        }}
                                    />
                                )}
                            />
                        </Box>

                        {/* Summary chips */}
                        {comboRows.length > 0 && (
                            <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', alignItems: 'flex-end', pb: 0.3, mt: 3.5 }}>
                                <Chip label={`Items: ${comboRows.length}`} size="small" variant="outlined" sx={{ fontFamily: "'Poppins', sans-serif", fontSize: '0.72rem' }} />
                                <Chip label={`Total: ₹${grandOriginalTotal.toFixed(2)}`} size="small" variant="outlined" color="primary" sx={{ fontFamily: "'Poppins', sans-serif", fontSize: '0.72rem' }} />
                                {entryPriceNum > 0 && (
                                    <Chip
                                        label={`Discount: ₹${totalDiscount.toFixed(2)}`}
                                        size="small"
                                        variant="outlined"
                                        color={totalDiscount < 0 ? 'error' : 'success'}
                                        sx={{ fontFamily: "'Poppins', sans-serif", fontSize: '0.72rem' }}
                                    />
                                )}
                            </Box>
                        )}
                    </Box>
                </div>

                {/* ── Table ── */}
                <Box sx={{ mt: 0.5, width: '100%', overflow: 'hidden' }}>
                    <div style={{ maxHeight: 'calc(92vh - 220px)', width: '100%', overflow: 'auto' }}>

                        {/* Summary bar */}
                        {calculatedRows.length > 0 && entryPriceNum > 0 && (
                            <Box
                                sx={{
                                    display: 'flex',
                                    gap: 3,
                                    mb: 1,
                                    p: '8px 12px',
                                    background: 'linear-gradient(90deg, #f0f9ff 0%, #e0f2fe 100%)',
                                    borderRadius: '8px',
                                    border: '1px solid #bae6fd',
                                    flexWrap: 'wrap',
                                    alignItems: 'center',
                                }}
                            >
                                {[
                                    { label: 'Variance Total Price', value: `₹${grandOriginalTotal.toFixed(2)}`, color: '#1e40af' },
                                    { label: 'Entry (Combo) Price', value: `₹${entryPriceNum.toFixed(2)}`, color: '#15803d' },
                                    {
                                        label: 'Total Discount',
                                        value: `₹${totalDiscount.toFixed(2)}${totalDiscount < 0 ? ' (Entry exceeds total!)' : ''}`,
                                        color: totalDiscount < 0 ? '#dc2626' : '#b45309',
                                    },
                                    { label: 'Adjusted Total', value: `₹${adjustedTotal.toFixed(2)}`, color: '#7c3aed' },
                                ].map((item, i, arr) => (
                                    <React.Fragment key={item.label}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                                            <Typography sx={{ fontSize: '0.72rem', color: '#475569', fontFamily: "'Poppins', sans-serif" }}>
                                                {item.label}:
                                            </Typography>
                                            <Typography sx={{ fontSize: '0.82rem', fontWeight: 700, color: item.color, fontFamily: "'Poppins', sans-serif" }}>
                                                {item.value}
                                            </Typography>
                                        </Box>
                                        {i < arr.length - 1 && <Typography sx={{ color: '#94a3b8', fontSize: '0.7rem' }}>—</Typography>}
                                    </React.Fragment>
                                ))}
                            </Box>
                        )}

                        <table
                            className="custom-table"
                            style={{ borderCollapse: 'separate', borderSpacing: '0 2px', width: '100%', minWidth: 'fit-content' }}
                        >
                            <thead>
                                <tr>
                                    <th style={{ minWidth: '160px', padding: '8px 4px' }}>Item Name</th>
                                    <th style={{ minWidth: '160px', padding: '8px 4px' }}>Variance Name</th>
                                    <th style={{ minWidth: '70px', padding: '8px 4px' }}>UOM</th>
                                    <th style={{ minWidth: '110px', padding: '8px 4px' }}>Unit Price (₹)</th>
                                    <th style={{ minWidth: '80px', padding: '8px 4px' }}>Qty</th>
                                    <th style={{ minWidth: '120px', padding: '8px 4px' }}>Total Price (₹)</th>
                                    <th style={{ minWidth: '110px', padding: '8px 4px' }}>Discount (₹)</th>
                                    <th style={{ minWidth: '120px', padding: '8px 4px' }}>Adjusted Price (₹)</th>
                                    <th style={{ minWidth: '60px', padding: '8px 4px' }}>Actions</th>
                                </tr>
                            </thead>

                            <tbody>
                                {calculatedRows.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan={9}
                                            style={{ textAlign: 'center', padding: '32px', color: '#94a3b8', fontFamily: "'Poppins', sans-serif", fontSize: '0.8rem' }}
                                        >
                                            Select item names, then pick variances from the dropdowns above to build your combo.
                                        </td>
                                    </tr>
                                ) : (
                                    calculatedRows.map((row, index) => (
                                        <tr key={`${row.itemCode}-${index}`}>

                                            {/* Item Name */}
                                            <td style={{ padding: '2px 4px' }}>
                                                <Typography sx={{ fontSize: '0.78rem', fontFamily: "'Poppins', sans-serif", color: '#1e293b', paddingLeft: '8px', height: '32px', display: 'flex', alignItems: 'center', fontWeight: 500 }}>
                                                    {row.itemName}
                                                </Typography>
                                            </td>

                                            {/* Variance Name – editable */}
                                            <td style={{ padding: '2px 4px' }}>
                                                <TextField
                                                    autoComplete="off"
                                                    size="small"
                                                    value={row.varianceName}
                                                    onChange={(e) => handleVarianceNameChange(index, e.target.value)}
                                                    className="custom-textfield"
                                                    InputProps={{ className: 'custom-input',readOnly: true, }}
                                                    sx={{
                                                        '& .MuiOutlinedInput-root': { height: '32px', fontSize: '0.75rem', minWidth: '160px', fontFamily: "'Poppins', sans-serif" },
                                                        '& .MuiInputBase-input': { padding: '6px 8px' },
                                                    }}
                                                />
                                            </td>

                                            {/* UOM */}
                                            <td style={{ padding: '2px 4px' }}>
                                                <Typography sx={{ fontSize: '0.75rem', fontFamily: "'Poppins', sans-serif", color: '#475569', paddingLeft: '8px', height: '32px', display: 'flex', alignItems: 'center' }}>
                                                    {row.uom || '—'}
                                                </Typography>
                                            </td>

                                            {/* Unit Price */}
                                            <td style={{ padding: '2px 4px' }}>
                                                <Typography sx={{ fontSize: '0.75rem', fontFamily: "'Poppins', sans-serif", color: '#1e293b', paddingLeft: '8px', height: '32px', display: 'flex', alignItems: 'center', fontWeight: 500 }}>
                                                    {row.originalPrice.toFixed(2)}
                                                </Typography>
                                            </td>

                                            {/* Qty – decoupled display state, clamped 1–10 */}
                                            <td style={{ padding: '2px 4px' }}>
                                                <TextField
                                                    autoComplete="off"
                                                    size="small"
                                                    type="number"
                                                    value={qtyInputValues[index] ?? String(row.qty)}
                                                    onChange={(e) => handleQtyChange(index, e.target.value)}
                                                    onBlur={() => handleQtyBlur(index)}
                                                    inputProps={{ min: 1, max: 10, step: 1 }}
                                                    className="custom-textfield"
                                                    InputProps={{ className: 'custom-input' }}
                                                    sx={{
                                                        width: '72px',
                                                        '& .MuiOutlinedInput-root': { height: '32px', fontSize: '0.75rem', fontFamily: "'Poppins', sans-serif" },
                                                        '& .MuiInputBase-input': { padding: '6px 8px', textAlign: 'center' },
                                                        '& input[type=number]': { MozAppearance: 'textfield' },
                                                        '& input[type=number]::-webkit-outer-spin-button': { WebkitAppearance: 'none', margin: 0 },
                                                        '& input[type=number]::-webkit-inner-spin-button': { WebkitAppearance: 'none', margin: 0 },
                                                    }}
                                                />
                                            </td>

                                            {/* Total Price (unit × qty) */}
                                            <td style={{ padding: '2px 4px' }}>
                                                <Typography sx={{ fontSize: '0.75rem', fontFamily: "'Poppins', sans-serif", color: '#1e40af', paddingLeft: '8px', height: '32px', display: 'flex', alignItems: 'center', fontWeight: 600 }}>
                                                    {row.totalOriginalPrice.toFixed(2)}
                                                </Typography>
                                            </td>

                                            {/* Discount */}
                                            <td style={{ padding: '2px 4px' }}>
                                                <Typography sx={{ fontSize: '0.75rem', fontFamily: "'Poppins', sans-serif", color: entryPriceNum > 0 && entryPriceNum < grandOriginalTotal ? '#b45309' : '#94a3b8', paddingLeft: '8px', height: '32px', display: 'flex', alignItems: 'center', fontWeight: 500 }}>
                                                    {entryPriceNum > 0 && entryPriceNum < grandOriginalTotal
                                                        ? `− ${row.discount.toFixed(2)}`
                                                        : '—'}
                                                </Typography>
                                            </td>

                                            {/* Adjusted Price */}
                                            <td style={{ padding: '2px 4px' }}>
                                                <Box sx={{ height: '32px', display: 'flex', alignItems: 'center', paddingLeft: '8px', minWidth: '110px', borderRadius: '6px', background: entryPriceNum > 0 && entryPriceNum < grandOriginalTotal ? '#f0fdf4' : 'transparent' }}>
                                                    <Typography sx={{ fontSize: '0.8rem', fontFamily: "'Poppins', sans-serif", color: entryPriceNum > 0 && entryPriceNum < grandOriginalTotal ? '#15803d' : '#1e293b', fontWeight: 600 }}>
                                                        {row.adjustedPrice.toFixed(2)}
                                                    </Typography>
                                                </Box>
                                            </td>

                                            {/* Delete */}
                                            <td style={{ padding: '2px 4px' }}>
                                                <div className="flex justify-center">
                                                    <button onClick={() => handleDeleteClick(index)} className="delete-btn" title="Remove" style={{ padding: '4px', minWidth: '32px', height: '32px' }}>
                                                        <DeleteIcon fontSize="small" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}

                                {/* Totals row */}
                                {calculatedRows.length > 0 && (
                                    <tr style={{ background: '#f8fafc', borderTop: '2px solid #e2e8f0' }}>
                                        <td colSpan={5} style={{ padding: '8px 12px', fontFamily: "'Poppins', sans-serif", fontSize: '0.78rem', fontWeight: 700, color: '#1e293b', textAlign: 'right' }}>
                                            TOTALS
                                        </td>
                                        <td style={{ padding: '8px', fontFamily: "'Poppins', sans-serif", fontSize: '0.78rem', fontWeight: 700, color: '#1e40af', paddingLeft: '8px' }}>
                                            ₹{grandOriginalTotal.toFixed(2)}
                                        </td>
                                        <td style={{ padding: '8px', fontFamily: "'Poppins', sans-serif", fontSize: '0.78rem', fontWeight: 700, color: '#b45309', paddingLeft: '8px' }}>
                                            {entryPriceNum > 0 && entryPriceNum < grandOriginalTotal ? `− ₹${totalDiscount.toFixed(2)}` : '—'}
                                        </td>
                                        <td style={{ padding: '8px', fontFamily: "'Poppins', sans-serif", fontSize: '0.78rem', fontWeight: 700, color: '#15803d', paddingLeft: '8px' }}>
                                            ₹{adjustedTotal.toFixed(2)}
                                        </td>
                                        <td />
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </Box>

                {/* ── Delete Confirmation ── */}
                <Dialog open={deleteOpen} onClose={() => setDeleteOpen(false)} PaperProps={{ className: 'dialog-paper' }}>
                    <DialogTitle className="dialog-title">Remove Variance</DialogTitle>
                    <DialogContent className="dialog-content">
                        <label>Are you sure you want to remove this variance from the combo?</label>
                    </DialogContent>
                    <DialogActions className="dialog-actions">
                        <button onClick={() => setDeleteOpen(false)} className="btn-secondary">Cancel</button>
                        <button onClick={handleConfirmDelete} className="btn-delete">Remove</button>
                    </DialogActions>
                </Dialog>

                {/* ── Close Confirmation ── */}
                <CloseConfirmationDialog
                    open={closeConfirmOpen}
                    onClose={() => setCloseConfirmOpen(false)}
                    onConfirm={() => { setCloseConfirmOpen(false); router.back(); }}
                />

                {/* ── Save Confirmation ── */}
                <CreateConfirmationDialog
                    open={saveConfirmOpen}
                    onClose={() => setSaveConfirmOpen(false)}
                    onConfirm={async () => { setSaveConfirmOpen(false); await handleSubmit(); }}
                />

                {/* ── Snackbar ── */}
                <Snackbar
                    open={snackbar.open}
                    autoHideDuration={4000}
                    onClose={() => setSnackbar((p) => ({ ...p, open: false }))}
                    anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
                >
                    <Alert onClose={() => setSnackbar((p) => ({ ...p, open: false }))} severity={snackbar.severity} sx={{ width: '100%' }}>
                        {snackbar.message}
                    </Alert>
                </Snackbar>

            </Container>
        </Box>
    );
}

export default ComboPage;