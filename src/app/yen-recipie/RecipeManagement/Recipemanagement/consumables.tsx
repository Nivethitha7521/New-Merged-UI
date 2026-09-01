

'use client';
import React, { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import {
  Box,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Checkbox,
  ListItemText,
  FormHelperText,
  IconButton,
  Grid,
} from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import DeleteIcon from '@mui/icons-material/Delete';
import { AppDispatch } from '../../../../redux/store';
import { deleteConsumable, fetchConsumables } from '../Features/recipeSlice';
import ActivateDeactivateConfirmationDialog from '@/app/Components/Dialogs/ActivateDeactivateConfirmationDialog';
import { VersionPreviewSnapshot } from '../Models/recipeModels';

interface ProfitCard {
  label: string;
  value: string;
  vValue?: string;
  bg: string;
  color: string;
  border: string;
  isUpdated?: boolean;
}

interface ConsumablesPageProps {
  consumablesSelected: string[];
  setConsumablesSelected: React.Dispatch<React.SetStateAction<string[]>>;
  consumableValues: { [key: string]: { percentage: number } };
  setConsumableValues: React.Dispatch<React.SetStateAction<{ [key: string]: { percentage: number } }>>;
  allConsumables: string[];
  setAllConsumables: React.Dispatch<React.SetStateAction<string[]>>;
  totalCost: number;
  totalConsumablePercentage: number;
  wastage: number;
  setWastage: React.Dispatch<React.SetStateAction<number>>;
  others: number;
  setOthers: React.Dispatch<React.SetStateAction<number>>;
  gst: number;
  validationErrors: { consumables: string };
  setValidationErrors: React.Dispatch<React.SetStateAction<{ itemName: string; totalServings: string; consumables: string; itemType: string }>>;
  handleOpenConsumableDialog: () => void;
  initialConsumables?: { name: string; percentage: number }[];
  profitValue: number;
  profitPercentage: number;
  totalCostValue: number;
  consumablePrice: number;
  GSTPrice: number;
  hasVarianceCommitted?: boolean;
  oldPerGramWeight?: number | null;
  oldPerPcsValue?: number | null;
  oldProfitValue?: number | null;
  oldProfitPercentage?: number | null;
  pendingVarianceMap?: Record<string, { currentTotalCost: number }>;
  versionPreviewActive?: boolean;
  versionSnapshot?: VersionPreviewSnapshot | null;
}

const ConsumablesPage: React.FC<ConsumablesPageProps> = ({
  consumablesSelected,
  setConsumablesSelected,
  consumableValues,
  setConsumableValues,
  allConsumables,
  setAllConsumables,
  totalCost,
  totalConsumablePercentage,
  wastage,
  setWastage,
  others,
  setOthers,
  gst,
  validationErrors,
  setValidationErrors,
  handleOpenConsumableDialog,
  initialConsumables = [],
  profitValue,
  profitPercentage,
  totalCostValue,
  consumablePrice,
  GSTPrice,
  hasVarianceCommitted,
  oldProfitValue = null,
  oldProfitPercentage = null,
  pendingVarianceMap = {},
  versionPreviewActive = false,
  versionSnapshot = null,
}) => {
  const dispatch = useDispatch<AppDispatch>();

  const [deleteConsumableDialogOpen, setDeleteConsumableDialogOpen] = useState(false);
  const [selectedConsumableName, setSelectedConsumableName] = useState<string>('');

  useEffect(() => {
    if (initialConsumables.length > 0) {
      const initialSelected = initialConsumables.map((item) => item.name);
      setConsumablesSelected(initialSelected);
      const initialValues = initialConsumables.reduce(
        (acc, { name, percentage }) => ({ ...acc, [name]: { percentage: percentage || 0 } }),
        {}
      );
      setConsumableValues(initialValues);
      setValidationErrors((prev) => ({
        ...prev,
        consumables: initialSelected.length > 0 ? '' : 'Required',
      }));
    }
  }, [initialConsumables, setConsumablesSelected, setConsumableValues, setValidationErrors]);

  const handleConsumableChange = (selected: string[]) => {
    const validSelected = selected.filter((name) => name && name.trim() !== '');
    setConsumablesSelected(validSelected);
    const updatedValues = validSelected.reduce(
      (acc, curr) => ({ ...acc, [curr]: consumableValues[curr] || { percentage: 0 } }),
      {} as { [key: string]: { percentage: number } }
    );
    setConsumableValues(updatedValues);
    setValidationErrors((prev) => ({
      ...prev,
      consumables: validSelected.length > 0 ? '' : 'Required',
    }));
  };

  const handleConsumableValueChange = (name: string, field: 'percentage', value: number) => {
    setConsumableValues((prev) => ({
      ...prev,
      [name]: { ...prev[name], [field]: value },
    }));
  };

  const handleDeleteConsumable = (consumableName: string) => {
    setSelectedConsumableName(consumableName);
    setDeleteConsumableDialogOpen(true);
  };

  const handleConfirmDeleteConsumable = async () => {
    try {
      await dispatch(deleteConsumable(selectedConsumableName)).unwrap();
      setAllConsumables((prev) => prev.filter((item) => item !== selectedConsumableName));
      if (consumablesSelected.includes(selectedConsumableName)) {
        handleConsumableChange(consumablesSelected.filter((item) => item !== selectedConsumableName));
      }
      const newValues = { ...consumableValues };
      delete newValues[selectedConsumableName];
      setConsumableValues(newValues);
      dispatch(fetchConsumables());
    } catch (error) {
      console.error('Failed to delete consumable:', error);
    } finally {
      setDeleteConsumableDialogOpen(false);
      setSelectedConsumableName('');
    }
  };

  // ── Version-aware profit cards ────────────────────────────────────────────
  // When version preview is active, we show the VERSION value as the primary
  // and the current value as the comparison pill — this matches the pattern
  // used in RecipeDetailsContainer (current on top, version pill below).
  const profitCards: ProfitCard[] = [
    {
      label: 'Selling Cost',
      value: totalCostValue.toFixed(2),
      vValue: versionPreviewActive && versionSnapshot
        ? versionSnapshot.totalCostValue.toFixed(2)
        : undefined,
      bg: 'var(--erp-success-soft, #dcfce7)', color: 'var(--erp-success, #0b7a42)', border: '#86efac',
    },
    {
      label: 'RMC',
      value: totalCost.toFixed(2),
      vValue: versionPreviewActive && versionSnapshot
        ? versionSnapshot.totalCost.toFixed(2)
        : undefined,
    bg: hasVarianceCommitted || Object.keys(pendingVarianceMap || {}).length > 0 ? '#fef9c3' : 'var(--erp-accent-soft, #e8efff)',
      color: hasVarianceCommitted || Object.keys(pendingVarianceMap || {}).length > 0 ? '#854d0e' : 'var(--erp-accent, #155eef)',
      border: hasVarianceCommitted || Object.keys(pendingVarianceMap || {}).length > 0 ? '#fde047' : 'var(--erp-accent-border, #9bb7f7)',
      isUpdated: hasVarianceCommitted,
    },
    {
      label: 'Consumables',
      value: consumablePrice.toFixed(2),
      vValue: versionPreviewActive && versionSnapshot
        ? versionSnapshot.consumablePrice.toFixed(2)
        : undefined,
      bg: 'var(--erp-surface-2, #f8fafc)', color: 'var(--erp-text, #101828)', border: 'var(--erp-border, #dfe5ec)',
    },
    {
      label: 'GST',
      value: GSTPrice.toFixed(2),
      vValue: versionPreviewActive && versionSnapshot
        ? versionSnapshot.GSTPrice.toFixed(2)
        : undefined,
      bg: '#fee4e2', color: 'var(--erp-danger, #d92d20)', border: '#fda29b',
    },
  ];

  const dropdownMenuProps = {
    PaperProps: {
      sx: { maxHeight: 165, width: 140 },
    },
  };

  // ── Version banner style (applied to profit section) ─────────────────────
  const vBannerStyle = versionPreviewActive && versionSnapshot
    ? { border: '1px solid var(--erp-accent-border, #9bb7f7)', background: 'var(--erp-accent-soft, #e8efff)', borderRadius: 'var(--erp-radius-lg, 17px)' }
    : {};

  return (
   <Box className="recipe-consumables-section" sx={{ mt: 2, px: 0, fontFamily: 'var(--erp-font-family, Inter, Arial, sans-serif)' }}>
     <Grid container spacing={2} className="recipe-consumables-grid">
 

        {/* ── LEFT: Consumables + RMC ── */}
       <Grid item xs={12} md={8} className="recipe-consumables-main">
          <div className="form-section">

            <div className="form-section-title">Consumable</div>

            {/* Consumable multi-select */}
              <Box className="recipe-consumable-picker" sx={{ width: { xs: '100%', sm: 192 }, mt: 0.5 }}>
              <FormControl fullWidth error={!!validationErrors.consumables} size="small">
               <InputLabel sx={{ fontSize: '11px', fontWeight: 600, fontFamily: 'var(--erp-font-family, Inter, Arial, sans-serif)' }}>
                  Consumable
                </InputLabel>
                <Select
                  multiple
                  label="Consumable"
                  value={consumablesSelected}
                  onChange={(e) => handleConsumableChange(e.target.value as string[])}
                  renderValue={(selected) => selected.join(', ')}
                sx={{ fontSize: '11px', fontWeight: 600, fontFamily: 'var(--erp-font-family, Inter, Arial, sans-serif)' }}
                  MenuProps={{
                    anchorOrigin: { vertical: 'top', horizontal: 'left' },
                    transformOrigin: { vertical: 'bottom', horizontal: 'left' },
                  }}
                >
                  <MenuItem>
                    <Button
                      fullWidth
                      startIcon={<AddIcon sx={{ fontSize: 14 }} />}
                      onClick={handleOpenConsumableDialog}
                     sx={{ fontSize: '11px', fontFamily: 'var(--erp-font-family, Inter, Arial, sans-serif)', textTransform: 'none', justifyContent: 'flex-start' }}
                    >
                      Add New Consumable
                    </Button>
                  </MenuItem>
                  {allConsumables.map((option) => (
                    <MenuItem
                      key={option}
                      value={option}
                      sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px', fontFamily: 'var(--erp-font-family, Inter, Arial, sans-serif)' }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Checkbox
                          checked={consumablesSelected.includes(option)}
                          sx={{ '& .MuiSvgIcon-root': { fontSize: 1 } }}
                        />
                        <ListItemText
                          primary={option}
                         primaryTypographyProps={{ fontSize: '11px', fontFamily: 'var(--erp-font-family, Inter, Arial, sans-serif)' }}
                        />
                      </Box>
                      <IconButton
                        edge="end"
                        size="small"
                        onClick={(e) => { e.stopPropagation(); handleDeleteConsumable(option); }}
                        sx={{ color: '#ef4444', ml: 1, '&:hover': { background: '#fee2e2' } }}
                      >
                        <DeleteIcon sx={{ fontSize: 6 }} />
                      </IconButton>
                    </MenuItem>
                  ))}
                </Select>
                {validationErrors.consumables && (
                   <FormHelperText sx={{ fontSize: '10px', fontFamily: 'var(--erp-font-family, Inter, Arial, sans-serif)' }}>
                    {validationErrors.consumables}
                  </FormHelperText>
                )}
              </FormControl>
            </Box>

            {/* Per-consumable percentage selects */}
            {consumablesSelected.length > 0 && (
              <Box
                className="recipe-consumable-rate-grid"
                sx={{ mt: 1.5 }}
              >
                {/* {consumablesSelected.map((consumable) => (
                  <Box key={consumable} sx={{ width: { xs: '100%', sm: 130 } }}>
                    <FormControl fullWidth size="small">
                      <InputLabel sx={{ fontSize: '10px', fontWeight: 600, fontFamily: '"Poppins", sans-serif' }}>
                        {`${consumable} ${consumableValues[consumable]?.percentage || 0}%`}
                      </InputLabel>
                      <Select
                        label={`${consumable} %`}
                        value={consumableValues[consumable]?.percentage || 0}
                        onChange={(e) => handleConsumableValueChange(consumable, 'percentage', Number(e.target.value))}
                        MenuProps={dropdownMenuProps}
                        sx={{ fontSize: '11px', fontWeight: 600, fontFamily: '"Poppins", sans-serif' }}
                      >
                        {Array.from({ length: 21 }, (_, i) => i).map((value) => (
                          <MenuItem key={value} value={value} sx={{ fontSize: '11px', fontFamily: '"Poppins", sans-serif' }}>
                            {value}%
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Box>
                ))} */}

                {consumablesSelected.map((consumable) => {
                  const pct = consumableValues[consumable]?.percentage || 0;
                  const price = (totalCost * pct) / 100;
                  return (
                   <Box key={consumable} sx={{ width: '100%', minWidth: 0 }}>
                      <FormControl fullWidth size="small">
                       <InputLabel sx={{ fontSize: '10px', fontWeight: 600, fontFamily: 'var(--erp-font-family, Inter, Arial, sans-serif)' }}>
                          {`${consumable} ${pct}% `}
                        </InputLabel>
                        <Select
                          label={`${consumable} %`}
                          value={pct}
                          onChange={(e) => handleConsumableValueChange(consumable, 'percentage', Number(e.target.value))}
                          renderValue={(selected) => {
                            const selPrice = (totalCost * (selected as number)) / 100;
                            return `${selected}% (₹${selPrice.toFixed(2)})`;
                          }}
                          MenuProps={dropdownMenuProps}
                          sx={{ fontSize: '11px', fontWeight: 600, fontFamily: 'var(--erp-font-family, Inter, Arial, sans-serif)' }}
                        >
                          {Array.from({ length: 21 }, (_, i) => i).map((value) => {
                            const optPrice = (totalCost * value) / 100;
                            return (
                             <MenuItem key={value} value={value} sx={{ fontSize: '11px', fontFamily: 'var(--erp-font-family, Inter, Arial, sans-serif)' }}>
                                {`${value}% (₹${optPrice.toFixed(2)})`}
                              </MenuItem>
                            );
                          })}
                        </Select>
                      </FormControl>
                    </Box>
                  );
                })}

              </Box>
            )}

            {/* Raw Material Cost sub-title */}
            <div className="form-section-title" style={{ marginTop: '12px' }}>Raw Material Cost</div>

            {/* RMC fields row */}
           <Box className="recipe-rmc-field-grid" sx={{ mt: 1 }}>

              <Box sx={{ width: '100%', minWidth: 0 }}>
                <TextField
                  label="Total Cost (RMC)"
                  autoComplete="off"
                  fullWidth
                  size="small"
                  value={totalCost.toFixed(2)}
                  InputProps={{ readOnly: true, sx: { fontSize: '11px', fontWeight: 600, fontFamily: 'var(--erp-font-family, Inter, Arial, sans-serif)' } }}
                  InputLabelProps={{ sx: { fontSize: '11px', fontWeight: 700, fontFamily: 'var(--erp-font-family, Inter, Arial, sans-serif)' } }}
                />
              </Box>

              <Box sx={{ width: '100%', minWidth: 0 }}>
                <TextField
                  label="RMC GST Price"
                  fullWidth
                  autoComplete="off"
                  size="small"
                  value={gst.toFixed(2)}
                InputProps={{ readOnly: true, sx: { fontSize: '11px', fontWeight: 600, fontFamily: 'var(--erp-font-family, Inter, Arial, sans-serif)' } }}
                  InputLabelProps={{ sx: { fontSize: '11px', fontWeight: 700, fontFamily: 'var(--erp-font-family, Inter, Arial, sans-serif)' } }}
                />
              </Box>

              <Box sx={{ width: '100%', minWidth: 0 }}>
                <TextField
                  label="Consumable"
                  autoComplete="off"
                  fullWidth
                  size="small"
                  // value={`${totalConsumablePercentage}%`}
                  value={`${totalConsumablePercentage}% (₹${consumablePrice.toFixed(2)})`}
                 InputProps={{ readOnly: true, sx: { fontSize: '11px', fontWeight: 600, fontFamily: 'var(--erp-font-family, Inter, Arial, sans-serif)' } }}
                  InputLabelProps={{ sx: { fontSize: '11px', fontWeight: 700, fontFamily: 'var(--erp-font-family, Inter, Arial, sans-serif)' } }}
                />
              </Box>

              {/* <Box sx={{ width: { xs: '100%', sm: 150 } }}>
                <FormControl fullWidth size="small">
                  <InputLabel sx={{ fontSize: '11px', fontWeight: 600, fontFamily: '"Poppins", sans-serif' }}>Wastage</InputLabel>
                  <Select
                    label="Wastage"
                    value={wastage}
                    onChange={(e) => setWastage(Number(e.target.value))}
                    MenuProps={dropdownMenuProps}
                    sx={{ fontSize: '11px', fontWeight: 600, fontFamily: '"Poppins", sans-serif' }}
                  >
                    {Array.from({ length: 21 }, (_, i) => i).map((value) => (
                      <MenuItem key={value} value={value} sx={{ fontSize: '11px', fontFamily: '"Poppins", sans-serif' }}>
                        {value}%
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>

              <Box sx={{ width: { xs: '100%', sm: 140 } }}>
                <FormControl fullWidth size="small">
                  <InputLabel sx={{ fontSize: '11px', fontWeight: 600, fontFamily: '"Poppins", sans-serif' }}>Others</InputLabel>
                  <Select
                    label="Others"
                    value={others}
                    onChange={(e) => {
                      const value = Number(e.target.value);
                      setOthers(value);
                      setValidationErrors((prev) => ({
                        ...prev,
                        others: value >= 0 ? '' : 'Others must be non-negative',
                      }));
                    }}
                    MenuProps={dropdownMenuProps}
                    sx={{ fontSize: '11px', fontWeight: 600, fontFamily: '"Poppins", sans-serif' }}
                  >
                    {Array.from({ length: 21 }, (_, i) => i).map((value) => (
                      <MenuItem key={value} value={value} sx={{ fontSize: '11px', fontFamily: '"Poppins", sans-serif' }}>
                        {value}%
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box> */}


             <Box sx={{ width: '100%', minWidth: 0 }}>
  <FormControl fullWidth size="small">
    <InputLabel sx={{ fontSize: '11px', fontWeight: 600, fontFamily: 'var(--erp-font-family, Inter, Arial, sans-serif)' }}>Wastage</InputLabel>
    <Select
      label="Wastage"
      value={wastage}
      onChange={(e) => setWastage(Number(e.target.value))}
      renderValue={(selected) => {
        const price = (totalCost * (selected as number)) / 100;
        return `${selected}% (₹${price.toFixed(2)})`;
      }}
      MenuProps={dropdownMenuProps}
      sx={{ fontSize: '11px', fontWeight: 600, fontFamily: 'var(--erp-font-family, Inter, Arial, sans-serif)' }}
    >
      {Array.from({ length: 21 }, (_, i) => i).map((value) => {
        const optPrice = (totalCost * value) / 100;
        return (
         <MenuItem key={value} value={value} sx={{ fontSize: '11px', fontFamily: 'var(--erp-font-family, Inter, Arial, sans-serif)' }}>
            {`${value}% (₹${optPrice.toFixed(2)})`}
          </MenuItem>
        );
      })}
    </Select>
  </FormControl>
</Box>

<Box sx={{ width: '100%', minWidth: 0 }}>
    <FormControl fullWidth size="small">
     <InputLabel sx={{ fontSize: '11px', fontWeight: 600, fontFamily: 'var(--erp-font-family, Inter, Arial, sans-serif)' }}>Others</InputLabel>
    <Select
      label="Others"
      value={others}
      onChange={(e) => {
        const value = Number(e.target.value);
        setOthers(value);
        setValidationErrors((prev) => ({
          ...prev,
          others: value >= 0 ? '' : 'Others must be non-negative',
        }));
      }}
      renderValue={(selected) => {
        const price = (totalCost * (selected as number)) / 100;
        return `${selected}% (₹${price.toFixed(2)})`;
      }}
      MenuProps={dropdownMenuProps}
     sx={{ fontSize: '11px', fontWeight: 600, fontFamily: 'var(--erp-font-family, Inter, Arial, sans-serif)' }}
    >
      {Array.from({ length: 21 }, (_, i) => i).map((value) => {
        const optPrice = (totalCost * value) / 100;
        return (
          <MenuItem key={value} value={value} sx={{ fontSize: '11px', fontFamily: 'var(--erp-font-family, Inter, Arial, sans-serif)' }}>
            {`${value}% (₹${optPrice.toFixed(2)})`}
          </MenuItem>
        );
      })}
    </Select>
  </FormControl>
</Box>

            </Box>
          </div>
        </Grid>

        {/* ── RIGHT: Profit Calculation ── */}
         <Grid item xs={12} md={4} className="recipe-profit-panel">
          <div className="form-section" style={{ height: '100%', ...vBannerStyle }}>

            <div className="form-section-title" style={{ textAlign: 'center', justifyContent: 'center' }}>
              PROFIT CALCULATION
              {versionPreviewActive && versionSnapshot && (
                <span style={{
                 marginLeft: 8, fontSize: '9px', fontWeight: 700, color: 'var(--erp-accent, #155eef)',
                  background: 'var(--erp-accent-soft, #e8efff)', border: '1px solid var(--erp-accent-border, #9bb7f7)',
                  borderRadius: '8px', padding: '1px 7px',
                }}>
                  VERSION PREVIEW
                </span>
              )}
            </div>

            {/* 4 coloured stat cards */}
            <div className="recipe-profit-stat-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '8px' }}>
              {profitCards.map((card) => (
                <div
                  key={card.label}
                  style={{
                     background: versionPreviewActive && versionSnapshot ? 'var(--erp-accent-soft, #e8efff)' : card.bg,
                    border: `1px solid ${versionPreviewActive && versionSnapshot ? 'var(--erp-accent-border, #9bb7f7)' : card.border}`,
                    borderRadius: 'var(--erp-radius-md, 13px)', padding: '10px 12px', textAlign: 'center',
                    position: 'relative', transition: 'all 0.3s ease',
                  }}
                >
                  {card.isUpdated && !versionPreviewActive && (
                    <div style={{
                      position: 'absolute', top: -6, right: -4,
                      background: '#f59e0b', color: 'white',
                      fontSize: '0.55rem', fontWeight: 800,
                      padding: '1px 5px', borderRadius: '8px',
                      fontFamily: 'var(--erp-font-family, Inter, Arial, sans-serif)',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                    }}>UPDATED</div>
                  )}
                  <div style={{
                    fontSize: '10px', fontWeight: 700,
                   color: versionPreviewActive && versionSnapshot ? 'var(--erp-accent, #155eef)' : card.color,
                    fontFamily: 'var(--erp-font-family, Inter, Arial, sans-serif)', textTransform: 'uppercase',
                  }}>
                    {card.label}
                  </div>
                  {/* Current value */}
                  <div style={{
                    fontSize: '13px', fontWeight: 700,
                     color: versionPreviewActive && versionSnapshot ? 'var(--erp-accent, #155eef)' : card.color,
                    fontFamily: 'var(--erp-font-family, Inter, Arial, sans-serif)', marginTop: '2px',
                  }}>
                    {card.value}
                  </div>
                  {/* Version comparison pill */}
                  {card.vValue !== undefined && (
                    <div style={{
                      marginTop: '3px', fontSize: '10px', fontWeight: 700,
                      color: parseFloat(card.vValue) > parseFloat(card.value)
                        ? '#dc2626'
                        : parseFloat(card.vValue) < parseFloat(card.value)
                          ? '#16a34a'
                          : '#6b7280',
                      background: parseFloat(card.vValue) > parseFloat(card.value)
                        ? '#fee2e2'
                        : parseFloat(card.vValue) < parseFloat(card.value)
                          ? '#dcfce7'
                          : '#f3f4f6',
                      border: `1px solid ${parseFloat(card.vValue) > parseFloat(card.value)
                        ? '#fca5a5'
                        : parseFloat(card.vValue) < parseFloat(card.value)
                          ? '#86efac'
                          : '#e5e7eb'
                        }`,
                      borderRadius: '8px', padding: '0 6px', display: 'inline-block',
                      fontFamily: 'monospace',
                    }}>
                      v: {card.vValue}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Formula note */}
           <div className="recipe-profit-formula" style={{
              marginTop: '10px', padding: '8px 10px',
              background: 'var(--erp-surface-2, #f8fafc)', border: '1px solid var(--erp-border, #dfe5ec)',
              borderRadius: 'var(--erp-radius-sm, 9px)', fontSize: '11px',
              color: 'var(--erp-text, #101828)', fontFamily: 'var(--erp-font-family, Inter, Arial, sans-serif)',
              lineHeight: 1.5, fontWeight: 600,
            }}>
              Profit = Selling Cost − RMC − Consumables − Wastage − Others − GST
            </div>

            {/* Profit value + percentage */}
           <div className="recipe-profit-result-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '8px' }}>

              {/* PROFIT VALUE */}
              <div className="recipe-profit-result" style={{
                background: versionPreviewActive && versionSnapshot
                 ? 'var(--erp-accent-soft, #e8efff)'
                  : hasVarianceCommitted && oldProfitValue !== null ? '#fef9c3' : '#f0fdf4',
                border: `1px solid ${versionPreviewActive && versionSnapshot
                  ? 'var(--erp-accent-border, #9bb7f7)'
                  : hasVarianceCommitted && oldProfitValue !== null ? '#fde047' : '#86efac'
                  }`,
               borderRadius: 'var(--erp-radius-md, 13px)', padding: '9px 10px', textAlign: 'center',
              }}>
               <div style={{ fontSize: '10px', fontWeight: 600, color: '#000000ff', fontFamily: 'var(--erp-font-family, Inter, Arial, sans-serif)', textTransform: 'uppercase' }}>
                  Profit Value
                </div>

                {versionPreviewActive && versionSnapshot ? (
                  // Version preview: current on top, version pill below
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px', marginTop: '2px' }}>
                   <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--erp-accent, #155eef)', fontFamily: 'var(--erp-font-family, Inter, Arial, sans-serif)' }}>
                      {profitValue.toFixed(2)}
                    </div>
                    <div style={{
                      fontSize: '10px', fontWeight: 700, fontFamily: 'monospace',
                      color: versionSnapshot.profitValue > profitValue
                        ? '#16a34a'
                        : versionSnapshot.profitValue < profitValue
                          ? '#dc2626'
                          : '#6b7280',
                      background: versionSnapshot.profitValue > profitValue
                        ? '#dcfce7'
                        : versionSnapshot.profitValue < profitValue
                          ? '#fee2e2'
                          : '#f3f4f6',
                      border: `1px solid ${versionSnapshot.profitValue > profitValue
                        ? '#86efac'
                        : versionSnapshot.profitValue < profitValue
                          ? '#fca5a5'
                          : '#e5e7eb'
                        }`,
                      borderRadius: '8px', padding: '0 6px',
                    }}>
                      v: {versionSnapshot.profitValue.toFixed(2)}
                    </div>
                  </div>
                ) : hasVarianceCommitted && oldProfitValue !== null ? (
                  // Variance committed: show old (strikethrough) and new
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1px', marginTop: '2px' }}>
                    <div style={{ fontSize: '10px', color: '#9ca3af', textDecoration: 'line-through', fontFamily: 'monospace' }}>
                      {oldProfitValue.toFixed(2)}
                    </div>
                    <div style={{
                      fontSize: '12px', fontWeight: 700,
                      color: profitValue >= oldProfitValue ? '#16a34a' : '#dc2626',
                     fontFamily: 'var(--erp-font-family, Inter, Arial, sans-serif)',
                    }}>
                      {profitValue.toFixed(2)}
                    </div>
                  </div>
                ) : (
                  // Normal display
                  <div style={{ fontSize: '12px', fontWeight: 700, color: '#16a34a', fontFamily: 'var(--erp-font-family, Inter, Arial, sans-serif)', marginTop: '2px' }}>
                    {profitValue.toFixed(2)}
                  </div>
                )}
              </div>

              {/* PROFIT % */}
             <div className="recipe-profit-result" style={{
                background: versionPreviewActive && versionSnapshot
                  ? 'var(--erp-accent-soft, #e8efff)'
                  : hasVarianceCommitted && oldProfitPercentage !== null ? '#fef9c3' : '#f0fdf4',
                border: `1px solid ${versionPreviewActive && versionSnapshot
                 ? 'var(--erp-accent-border, #9bb7f7)'
                  : hasVarianceCommitted && oldProfitPercentage !== null ? '#fde047' : '#86efac'
                  }`,
                borderRadius: 'var(--erp-radius-md, 13px)', padding: '9px 10px', textAlign: 'center',
              }}>
               <div style={{ fontSize: '10px', fontWeight: 600, color: '#000000ff', fontFamily: 'var(--erp-font-family, Inter, Arial, sans-serif)', textTransform: 'uppercase' }}>
                  Profit %
                </div>

                {versionPreviewActive && versionSnapshot ? (
                  // Version preview: current on top, version pill below
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px', marginTop: '2px' }}>
                   <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--erp-accent, #155eef)', fontFamily: 'var(--erp-font-family, Inter, Arial, sans-serif)' }}>
                      {profitPercentage.toFixed(2)}%
                    </div>
                    <div style={{
                      fontSize: '10px', fontWeight: 700, fontFamily: 'monospace',
                      color: versionSnapshot.profitPercentage > profitPercentage
                        ? '#16a34a'
                        : versionSnapshot.profitPercentage < profitPercentage
                          ? '#dc2626'
                          : '#6b7280',
                      background: versionSnapshot.profitPercentage > profitPercentage
                        ? '#dcfce7'
                        : versionSnapshot.profitPercentage < profitPercentage
                          ? '#fee2e2'
                          : '#f3f4f6',
                      border: `1px solid ${versionSnapshot.profitPercentage > profitPercentage
                        ? '#86efac'
                        : versionSnapshot.profitPercentage < profitPercentage
                          ? '#fca5a5'
                          : '#e5e7eb'
                        }`,
                      borderRadius: '8px', padding: '0 6px',
                    }}>
                      v: {versionSnapshot.profitPercentage.toFixed(2)}%
                    </div>
                  </div>
                ) : hasVarianceCommitted && oldProfitPercentage !== null ? (
                  // Variance committed: show old (strikethrough) and new
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1px', marginTop: '2px' }}>
                    <div style={{ fontSize: '10px', color: '#9ca3af', textDecoration: 'line-through', fontFamily: 'monospace' }}>
                      {oldProfitPercentage.toFixed(2)}%
                    </div>
                    <div style={{
                      fontSize: '12px', fontWeight: 700,
                      color: profitPercentage >= oldProfitPercentage ? '#16a34a' : '#dc2626',
                      fontFamily: 'var(--erp-font-family, Inter, Arial, sans-serif)',
                    }}>
                      {profitPercentage.toFixed(2)}%
                    </div>
                  </div>
                ) : (
                  // Normal display
                  <div style={{ fontSize: '12px', fontWeight: 700, color: '#16a34a', fontFamily: 'var(--erp-font-family, Inter, Arial, sans-serif)', marginTop: '2px' }}>
                    {profitPercentage.toFixed(2)}%
                  </div>
                )}
              </div>

            </div>

          </div>
        </Grid>

      </Grid>

      <ActivateDeactivateConfirmationDialog
        open={deleteConsumableDialogOpen}
        actionType="delete"
        onClose={() => {
          setDeleteConsumableDialogOpen(false);
          setSelectedConsumableName('');
        }}
        onConfirm={handleConfirmDeleteConsumable}
      />

    </Box>
  );
};

export default ConsumablesPage;