


'use client';
import React, { useRef, useEffect, createRef, useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  TextField,
  Box,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  CircularProgress,
  Autocomplete,
  Checkbox,
  Popper,
  Alert,
  Snackbar,
} from '@mui/material';
import { Delete as DeleteIcon, Close as CloseIcon, ExpandMore, ExpandLess } from '@mui/icons-material';
import { useSelector } from 'react-redux';
import { RootState } from '../../../../redux/store';
import { Recipe } from '../Models/recipeModels';

export interface IngredientItem {
  ingredients: string;
  kitQty: number;
  uom: string;
  batchQty: number;
  perGramCost: number;
  totalCost: number;
  haveIt: boolean;
  GST: number;
  isSubKitSelection?: boolean;
  isSubKitHeader?: boolean;
  totalRequiredSubkitQty?: number;
}

export interface InlineVarianceEntry {
  oldPerGramCost: number;
  newPerGramCost: number;
  priceChangePercent: number;
}

export interface RecipeTableContainerProps {
  calculatedIngredients: IngredientItem[];
  currentIngredients?: IngredientItem[];
  totalQty: number;
  totalEstimateQty: number;
  totalCost: number;
  GST: number;
  handleIngredientChange: (index: number, field: keyof IngredientItem, value: string | number | boolean) => void;
  handleDeleteIngredient: (index: number) => void;
  handleAddIngredient: () => void;
  handleSearchIngredients: (query: string) => void;
  handleClearSearch: (type: 'items' | 'ingredients') => void;
  handleLoadMoreItems: (type: 'items' | 'ingredients') => void;
  ingredientOpenDialog: boolean;
  handleOpenDialog: () => void;
  handleCloseDialog: () => void;
  tempQtyValues: { [index: number]: string };
  setTempQtyValues: React.Dispatch<React.SetStateAction<{ [index: number]: string }>>;
  recipes: Recipe[];
  handleSelectSubKit: (index: number, selectedRecipe: Recipe) => void;
  inlineVarianceMap?: Record<string, InlineVarianceEntry>;
  pendingVarianceMap?: Record<string, {
    currentPerGramCost: number;
    currentTotalCost: number;
    currentGST: number;
  }>;
  hasCommitted?: boolean;
  isVersionPreview?: boolean;
}


const VersionCompareCell = ({
  versionValue,
  currentValue,
  decimals = 2,
  prefix = '',
  suffix = '',
  versionHaveIt,
  currentHaveIt,
}: {
  versionValue: number;
  currentValue: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  versionHaveIt?: boolean;
  currentHaveIt?: boolean;
}) => {
  const diff = currentValue - versionValue;
  const color = diff > 0.001 ? '#dc2626' : diff < -0.001 ? '#16a34a' : '#6b7280';
  const bg = diff > 0.001 ? '#fee2e2' : diff < -0.001 ? '#dcfce7' : '#f3f4f6';
  const border = diff > 0.001 ? '#fca5a5' : diff < -0.001 ? '#86efac' : '#e5e7eb';
  const arrow = diff > 0.001 ? '▲' : diff < -0.001 ? '▼' : '';

  // version=true but current=false → ingredient lost in current → strike through current value
  const isBackingLoss = versionHaveIt === true && currentHaveIt === false;
  // version=false but current=true → ingredient gained in current
  const isBackingGain = versionHaveIt === false && currentHaveIt === true;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 0.25 }}>
      {/* PRIMARY: current live value */}
      <Typography sx={{
        fontSize: '11px',
       fontFamily: 'var(--erp-font-family, Inter, Arial, sans-serif)',
        fontWeight: 700,
color: isBackingLoss ? '#dc2626' : isBackingGain ? '#16a34a' : 'var(--erp-text, #101828)',
        lineHeight: 1.2,
        textDecoration: isBackingLoss ? 'line-through' : 'none',
        opacity: isBackingLoss ? 0.7 : 1,
      }}>
        {prefix}{currentValue.toFixed(decimals)}{suffix}
      </Typography>

      {/* Backing loss badge */}
      {isBackingLoss && (
        <Box sx={{
          px: 0.6, py: 0.1,
          borderRadius: '8px',
          fontSize: '8px',
          fontWeight: 700,
          fontFamily: 'monospace',
          bgcolor: '#fee2e2',
          color: '#dc2626',
          border: '1px solid #fca5a5',
          whiteSpace: 'nowrap',
          lineHeight: 1.5,
        }}>
          ✕ not in current
        </Box>
      )}

      {/* Backing gain badge */}
      {isBackingGain && (
        <Box sx={{
          px: 0.6, py: 0.1,
          borderRadius: '8px',
          fontSize: '8px',
          fontWeight: 700,
          fontFamily: 'monospace',
          bgcolor: '#dcfce7',
          color: '#16a34a',
          border: '1px solid #86efac',
          whiteSpace: 'nowrap',
          lineHeight: 1.5,
        }}>
          ✓ new in current
        </Box>
      )}

      {/* SECONDARY: version value pill (only shown when no have-it mismatch) */}
      {!isBackingLoss && !isBackingGain && (
        <Box sx={{
          px: 0.6, py: 0.1,
          borderRadius: '8px',
          fontSize: '9px',
          fontWeight: 700,
          fontFamily: 'monospace',
          bgcolor: bg,
          color,
          border: `1px solid ${border}`,
          whiteSpace: 'nowrap',
          lineHeight: 1.5,
        }}>
          {arrow} v: {prefix}{versionValue.toFixed(decimals)}{suffix}
        </Box>
      )}

      {/* Version pill shown alongside backing loss/gain too */}
      {(isBackingLoss || isBackingGain) && (
        <Box sx={{
          px: 0.6, py: 0.1,
          borderRadius: '8px',
          fontSize: '9px',
          fontWeight: 700,
          fontFamily: 'monospace',
          bgcolor: '#f3f4f6',
          color: '#6b7280',
          border: '1px solid #e5e7eb',
          whiteSpace: 'nowrap',
          lineHeight: 1.5,
        }}>
          v: {prefix}{versionValue.toFixed(decimals)}{suffix}
        </Box>
      )}
    </Box>
  );
};


// ─── Fallback cell shown when current ingredient is not found in live data ────
const CurrentNotFoundCell = () => (
  <Typography sx={{ fontSize: '10px', color: '#94a3b8', textAlign: 'right', fontStyle: 'italic' }}>
    —
  </Typography>
);

const RecipeTableContainer: React.FC<RecipeTableContainerProps> = ({
  calculatedIngredients,
  currentIngredients = [],
  totalQty,
  totalEstimateQty,
  totalCost,
  GST,
  handleIngredientChange,
  handleDeleteIngredient,
  handleAddIngredient,
  handleSearchIngredients,
  handleClearSearch,
  handleLoadMoreItems,
  ingredientOpenDialog,
  handleCloseDialog,
  tempQtyValues,
  setTempQtyValues,
  recipes,
  handleSelectSubKit,
  inlineVarianceMap = {},
  pendingVarianceMap = {},
  hasCommitted = false,
  isVersionPreview = false,
}) => {
  const { poItems, isFetchingItems, hasMoreItems } = useSelector((state: RootState) => state.recipe);
  const lastRowRef = useRef<HTMLTableRowElement | null>(null);
  const tableContainerRef = useRef<HTMLDivElement | null>(null);
  const prevLengthRef = useRef<number>(0);
  const ingredientRefs = useRef<React.RefObject<HTMLInputElement>[]>([]);
  const kitQtyRefs = useRef<React.RefObject<HTMLInputElement>[]>([]);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [collapsedSubKits, setCollapsedSubKits] = useState<Set<number>>(new Set());

  // ── Build lookup map from current (live) ingredients by name ──────────────
  const currentIngMap = React.useMemo(() => {
    const map: Record<string, IngredientItem> = {};
    currentIngredients.forEach((ing) => {
      if (ing.ingredients) map[ing.ingredients] = ing;
    });
    return map;
  }, [currentIngredients]);

  // ── Compute live totals for the totals row current columns ────────────────
  const currentLiveKitQtyTotal = React.useMemo(
    () => currentIngredients.reduce((s, i) => s + (i.haveIt ? i.kitQty : 0), 0),
    [currentIngredients],
  );

  const currentLiveTotalCost = React.useMemo(
    () => currentIngredients.reduce((s, i) => s + (i.haveIt ? i.totalCost : 0), 0),
    [currentIngredients],
  );

  const currentLiveGST = React.useMemo(
    () => currentIngredients.reduce((s, i) => s + (i.haveIt ? i.GST : 0), 0),
    [currentIngredients],
  );


  // // ADD after currentLiveGST useMemo:
  // const versionKitQtyTotal = React.useMemo(
  //   () => isVersionPreview
  //     ? calculatedIngredients.reduce((s, i) => s + (i.haveIt ? i.kitQty : 0), 0)
  //     : totalQty,
  //   [calculatedIngredients, isVersionPreview, totalQty],
  // );
  // const versionTotalCost = React.useMemo(
  //   () => isVersionPreview
  //     ? calculatedIngredients.reduce((s, i) => s + (i.haveIt ? i.totalCost : 0), 0)
  //     : totalCost,
  //   [calculatedIngredients, isVersionPreview, totalCost],
  // );
  // const versionGST = React.useMemo(
  //   () => isVersionPreview
  //     ? calculatedIngredients.reduce((s, i) => s + (i.haveIt ? i.GST : 0), 0)
  //     : GST,
  //   [calculatedIngredients, isVersionPreview, GST],
  // );

  const versionKitQtyTotal = React.useMemo(
    () => calculatedIngredients.reduce((s, i) => s + (i.haveIt ? i.kitQty : 0), 0),
    [calculatedIngredients],
  );
  const versionTotalCost = React.useMemo(
    () => calculatedIngredients.reduce((s, i) => s + (i.haveIt ? i.totalCost : 0), 0),
    [calculatedIngredients],
  );
  const versionGST = React.useMemo(
    () => calculatedIngredients.reduce((s, i) => s + (i.haveIt ? i.GST : 0), 0),
    [calculatedIngredients],
  );

  // Backing loss: ingredient haveIt=true in version but haveIt=false in current live
  const backingLossIngredients = React.useMemo(() => {
    if (!isVersionPreview) return [];
    return calculatedIngredients.filter((ing) => {
      if (!ing.ingredients || ing.isSubKitHeader || ing.isSubKitSelection) return false;
      const liveIng = currentIngMap[ing.ingredients];
      return ing.haveIt === true && liveIng && liveIng.haveIt === false;
    });
  }, [calculatedIngredients, currentIngMap, isVersionPreview]);

  const backingLossCost = React.useMemo(
    () => backingLossIngredients.reduce((s, i) => s + i.totalCost, 0),
    [backingLossIngredients],
  );


  const hasVarianceCols = !isVersionPreview &&
    (Object.keys(pendingVarianceMap).length > 0 || Object.keys(inlineVarianceMap).length > 0);

  useEffect(() => {
    ingredientRefs.current = calculatedIngredients.map((_, i) =>
      ingredientRefs.current[i] ?? createRef<HTMLInputElement>()
    );
    kitQtyRefs.current = calculatedIngredients.map((_, i) =>
      kitQtyRefs.current[i] ?? createRef<HTMLInputElement>()
    );
  }, [calculatedIngredients]);

  useEffect(() => {
    const prevLength = prevLengthRef.current;
    const currentLength = calculatedIngredients.length;

    if (currentLength > prevLength && currentLength > 0) {
      let newRowIndex = -1;
      for (let i = 0; i < calculatedIngredients.length; i++) {
        if (!calculatedIngredients[i].isSubKitHeader && !calculatedIngredients[i].isSubKitSelection) {
          if (!calculatedIngredients[i].ingredients || calculatedIngredients[i].ingredients.trim() === '') {
            newRowIndex = i;
            break;
          }
        }
      }
      if (newRowIndex === -1) {
        for (let i = calculatedIngredients.length - 1; i >= 0; i--) {
          if (!calculatedIngredients[i].isSubKitHeader && !calculatedIngredients[i].isSubKitSelection) {
            newRowIndex = i;
            break;
          }
        }
      }

      if (newRowIndex !== -1 && lastRowRef.current && tableContainerRef.current) {
        const tableRows = tableContainerRef.current.querySelectorAll('tbody tr');
        const targetRow = tableRows[newRowIndex] as HTMLElement;
        if (targetRow) {
          const totalsRow = tableContainerRef.current.querySelector('tr:last-child');
          const totalsRowHeight = totalsRow ? totalsRow.getBoundingClientRect().height : 56;
          const targetRowRect = targetRow.getBoundingClientRect();
          const containerRect = tableContainerRef.current.getBoundingClientRect();
          const scrollPosition = targetRow.offsetTop - containerRect.height / 2 + targetRowRect.height + totalsRowHeight;
          tableContainerRef.current.scrollTo({ top: Math.max(0, scrollPosition), behavior: 'smooth' });
          setTimeout(() => { ingredientRefs.current[newRowIndex]?.current?.focus(); }, 100);
        }
      }
    }
    prevLengthRef.current = currentLength;
  }, [calculatedIngredients]);

  const toggleSubKitCollapse = (headerIndex: number) => {
    setCollapsedSubKits((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(headerIndex)) newSet.delete(headerIndex); else newSet.add(headerIndex);
      return newSet;
    });
  };

  const handleIngredientKeyDown = (event: React.KeyboardEvent, index: number) => {
    if (event.key === 'Enter') { event.preventDefault(); kitQtyRefs.current[index]?.current?.focus(); }
  };

  const validateIngredients = () => {
    const emptyIdx = calculatedIngredients.findIndex(
      (ing) => !ing.isSubKitHeader && !ing.isSubKitSelection && (!ing.ingredients || ing.ingredients.trim() === '')
    );
    if (emptyIdx !== -1) {
      setSnackbarMessage('Please select an ingredient before adding a new one.');
      setSnackbarOpen(true);
      return false;
    }
    return true;
  };

  const handleAddIngredientWithValidation = () => { if (validateIngredients()) handleAddIngredient(); };

  const handleQtyKeyDown = (event: React.KeyboardEvent, index: number) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      const cur = tempQtyValues[index];
      const parsed = cur === undefined ? calculatedIngredients[index].kitQty : cur === '' ? 0 : parseFloat(cur);
      handleIngredientChange(index, 'kitQty', parsed);
      setTempQtyValues((prev) => { const next = { ...prev }; delete next[index]; return next; });
      handleAddIngredientWithValidation();
    } else if (event.key === 'Tab') {
      event.preventDefault();
      const cur = tempQtyValues[index];
      if (cur !== undefined) {
        handleIngredientChange(index, 'kitQty', cur === '' ? 0 : parseFloat(cur));
        setTempQtyValues((prev) => { const next = { ...prev }; delete next[index]; return next; });
      }
      const nextIdx = index + 1;
      if (nextIdx < calculatedIngredients.length) ingredientRefs.current[nextIdx]?.current?.focus();
    }
  };

  const isSubKitIngredient = (index: number): boolean => {
    for (let i = index - 1; i >= 0; i--) {
      if (calculatedIngredients[i].isSubKitHeader) return true;
      if (calculatedIngredients[i].isSubKitSelection) return false;
    }
    return false;
  };

  const getRowNumber = (index: number): string => {
    let regularCount = 0, currentSubKitNum = 0, subKitIngCount = 0, isInSubKit = false;
    for (let i = 0; i <= index; i++) {
      const item = calculatedIngredients[i];
      if (item.isSubKitSelection) continue;
      if (item.isSubKitHeader) {
        regularCount++;
        currentSubKitNum = regularCount;
        isInSubKit = true;
        subKitIngCount = 0;
        if (i === index) return currentSubKitNum.toString();
      } else {
        if (isInSubKit && isSubKitIngredient(i)) {
          subKitIngCount++;
          if (i === index) return `${currentSubKitNum}.${subKitIngCount}`;
        } else {
          regularCount++;
          isInSubKit = false;
          if (i === index) return regularCount.toString();
        }
      }
    }
    return (index + 1).toString();
  };

  const renderVarianceBadge = (ingredientName: string) => {
    const entry = inlineVarianceMap[ingredientName];
    if (!entry) return null;
    const isIncrease = entry.priceChangePercent > 0;
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 0.2, mt: 0.3 }}>
        <Typography sx={{ fontSize: '0.6rem', color: '#9e9e9e', textDecoration: 'line-through', fontFamily: 'monospace', lineHeight: 1 }}>
          ₹{entry.oldPerGramCost.toFixed(4)}
        </Typography>
        <Box sx={{
          px: 0.6, py: 0.1, borderRadius: '8px', fontSize: '0.58rem', fontWeight: 700,
          fontFamily: 'monospace',
          bgcolor: isIncrease ? '#fee2e2' : '#dcfce7',
          color: isIncrease ? '#dc2626' : '#16a34a',
          border: `1px solid ${isIncrease ? '#fca5a5' : '#86efac'}`,
          whiteSpace: 'nowrap', lineHeight: 1.4,
        }}>
          {isIncrease ? '▲' : '▼'} {Math.abs(entry.priceChangePercent).toFixed(2)}%
        </Box>
      </Box>
    );
  };

  const varColCount = hasVarianceCols ? 3 : 0;
  const versionColCount = isVersionPreview ? 4 : 0;
  const totalExtraCols = varColCount + versionColCount;

  return (
   <Box className="recipe-ingredient-table-section" sx={{ fontFamily: 'var(--erp-font-family, Inter, Arial, sans-serif)' }}>

      {/* ─── Version Preview Banner ──────────────────────────────────── */}
      {isVersionPreview && (
        <Box sx={{
          display: 'flex', alignItems: 'center', gap: 1,
          px: 2, py: 0.75, mb: 0.5,
          background: 'var(--erp-accent-soft, #e8efff)', border: '1px solid var(--erp-accent-border, #9bb7f7)', borderRadius: '6px',
        }}>
          <Box sx={{
           fontSize: '9px', fontWeight: 700, color: 'var(--erp-accent, #155eef)',
            background: 'var(--erp-accent-soft, #e8efff)', border: '1px solid var(--erp-accent-border, #9bb7f7)',
            borderRadius: '8px', px: 1, py: 0.25,
          }}>
            VERSION PREVIEW
          </Box>
        <Typography sx={{ fontSize: '10px', color: 'var(--erp-accent, #155eef)', fontFamily: 'var(--erp-font-family, Inter, Arial, sans-serif)', fontWeight: 500 }}>
            Version values shown in <strong>blue</strong> ·&nbsp;
            <strong>current</strong> column shows live values with <span style={{ fontFamily: 'monospace' }}>v:</span> comparison pill
          </Typography>
        </Box>
      )}

      {/* ─── Backing Loss Banner ──────────────────────────────────────── */}
      {isVersionPreview && backingLossIngredients.length > 0 && (
        <Box sx={{
          display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1,
          px: 2, py: 0.75, mb: 0.5,
          background: '#fff1f2', border: '1px solid #fca5a5', borderRadius: '6px',
        }}>
          <Box sx={{
            fontSize: '9px', fontWeight: 700, color: '#dc2626',
            background: '#fee2e2', border: '1px solid #fca5a5',
            borderRadius: '8px', px: 1, py: 0.25, whiteSpace: 'nowrap',
          }}>
            ✕ HAVE IT
          </Box>
         <Typography sx={{ fontSize: '10px', color: '#dc2626', fontFamily: 'var(--erp-font-family, Inter, Arial, sans-serif)', fontWeight: 500 }}>
            {backingLossIngredients.length} ingredient{backingLossIngredients.length > 1 ? 's' : ''} marked <strong>Have It</strong> in version but <strong>not</strong> in current:&nbsp;
            <strong>{backingLossIngredients.map(i => i.ingredients).join(', ')}</strong>
            &nbsp;· Cost impact: <strong>₹{backingLossCost.toFixed(2)}</strong>
          </Typography>
        </Box>
      )}


      {/* ─── Main Table ──────────────────────────────────────────────── */}
      <Box
        ref={tableContainerRef}
        className="recipe-ingredient-table-scroll"
        sx={{
          maxHeight: 'calc(560px - 56px)',
          overflowY: 'auto', overflowX: 'auto',
          mt: 1.5,
        border: isVersionPreview ? '1px solid var(--erp-accent-border, #9bb7f7)' : '1px solid var(--erp-border, #dfe5ec)',
          borderRadius: 'var(--erp-radius-lg, 17px)',
          boxShadow: isVersionPreview ? '0 0 0 3px var(--erp-accent-ring, rgba(21,94,239,0.16))' : 'var(--erp-shadow, 0 1px 3px rgba(16,24,40,0.08))',
          '&::-webkit-scrollbar': { width: '5px', height: '5px' },
         '&::-webkit-scrollbar-track': { background: 'transparent' },
          '&::-webkit-scrollbar-thumb': { background: 'var(--erp-accent-border, #b8c1cc)', borderRadius: '999px' },
        }}
      >
        <div className="recipe-ingredient-table-inner" style={{ width: '100%', overflowX: 'auto' }}>
          <table style={{
            width: '100%',
            minWidth: isVersionPreview ? '1100px' : '846px',
            borderCollapse: 'collapse',
            fontSize: '11px',
           fontFamily: 'var(--erp-font-family, Inter, Arial, sans-serif)',
            tableLayout: 'fixed',
          }}>
            {/* ── Column Widths ── */}
            <colgroup>
              <col style={{ width: '44px' }} />
              <col style={{ width: '220px' }} />
              <col style={{ width: '56px' }} />
              <col style={{ width: '90px' }} />
              {isVersionPreview && <col style={{ width: '90px' }} />}
              <col style={{ width: '100px' }} />
              <col style={{ width: '80px' }} />
              {isVersionPreview && <col style={{ width: '90px' }} />}
              {hasVarianceCols && <col style={{ width: '80px' }} />}
              <col style={{ width: '75px' }} />
              {isVersionPreview && <col style={{ width: '90px' }} />}
              {hasVarianceCols && <col style={{ width: '75px' }} />}
              <col style={{ width: '65px' }} />
              {isVersionPreview && <col style={{ width: '75px' }} />}
              {hasVarianceCols && <col style={{ width: '65px' }} />}
              <col style={{ width: '60px' }} />
              <col style={{ width: '56px' }} />
            </colgroup>

            <thead>
              <tr>
                <th style={thStyle({ textAlign: 'center' })}>S.No</th>
                <th style={thStyle({ textAlign: 'center' })}>Ingredient</th>
                <th style={thStyle({ textAlign: 'center' })}>UOM</th>

                {/* Kit Qty */}
                {isVersionPreview ? (
                  <>
                   <th style={thStyle({ textAlign: 'right', background: 'linear-gradient(180deg,var(--erp-accent-soft, #e8efff),var(--erp-accent-soft, #e8efff))', color: 'var(--erp-accent, #155eef)' })}>
                      Kit Qty<br /><span style={{ fontSize: '9px', fontWeight: 700, textTransform: 'none' }}>(version)</span>
                    </th>
                    <th style={thStyle({ textAlign: 'right' })}>
                      Kit Qty<br /><span style={{ fontSize: '9px', fontWeight: 700, textTransform: 'none' }}>(current)</span>
                    </th>
                  </>
                ) : (
                  <th style={thStyle({ textAlign: 'right' })}>
                    Kit Qty<br /><span style={{ fontSize: '10px', fontWeight: 700, textTransform: 'none', letterSpacing: 0 }}>(in grams)</span>
                  </th>
                )}

                <th style={thStyle({ textAlign: 'right' })}>
                  Batch Qty<br /><span style={{ fontSize: '10px', fontWeight: 700, textTransform: 'none', letterSpacing: 0 }}>(in grams)</span>
                </th>

                {/* Per Gram Cost */}
                {isVersionPreview ? (
                  <>
                   <th style={thStyle({ textAlign: 'right', background: 'linear-gradient(180deg,var(--erp-accent-soft, #e8efff),var(--erp-accent-soft, #e8efff))', color: 'var(--erp-accent, #155eef)' })}>
                      Per Gram<br /><span style={{ fontSize: '9px', fontWeight: 700, textTransform: 'none' }}>(version)</span>
                    </th>
                    <th style={thStyle({ textAlign: 'right' })}>
                      Per Gram<br /><span style={{ fontSize: '9px', fontWeight: 700, textTransform: 'none' }}>(current)</span>
                    </th>
                  </>
                ) : (
                  <th style={thStyle({ textAlign: 'right' })}>Per Gram Cost</th>
                )}
                {hasVarianceCols && (
                  <th style={thStyle({ textAlign: 'right', background: 'linear-gradient(180deg,#fef9c3,#fef3c7)', color: '#92400e' })}>
                    Current<br /><span style={{ fontSize: '8.5px', fontWeight: 700 }}>Per Gram Cost</span>
                  </th>
                )}

                {/* Total Cost */}
                {isVersionPreview ? (
                  <>
                  <th style={thStyle({ textAlign: 'right', background: 'linear-gradient(180deg,var(--erp-accent-soft, #e8efff),var(--erp-accent-soft, #e8efff))', color: 'var(--erp-accent, #155eef)' })}>
                      Total Cost<br /><span style={{ fontSize: '9px', fontWeight: 700, textTransform: 'none' }}>(version)</span>
                    </th>
                    <th style={thStyle({ textAlign: 'right' })}>
                      Total Cost<br /><span style={{ fontSize: '9px', fontWeight: 700, textTransform: 'none' }}>(current)</span>
                    </th>
                  </>
                ) : (
                  <th style={thStyle({ textAlign: 'right' })}>Total Cost</th>
                )}
                {hasVarianceCols && (
                  <th style={thStyle({ textAlign: 'right', background: 'linear-gradient(180deg,#fef9c3,#fef3c7)', color: '#92400e' })}>
                    Current<br /><span style={{ fontSize: '9px', fontWeight: 700 }}>Total Cost</span>
                  </th>
                )}

                {/* GST */}
                {isVersionPreview ? (
                  <>
                  <th style={thStyle({ textAlign: 'right', background: 'linear-gradient(180deg,var(--erp-accent-soft, #e8efff),var(--erp-accent-soft, #e8efff))', color: 'var(--erp-accent, #155eef)' })}>
                      GST<br /><span style={{ fontSize: '9px', fontWeight: 700, textTransform: 'none' }}>(version)</span>
                    </th>
                    <th style={thStyle({ textAlign: 'right' })}>
                      GST<br /><span style={{ fontSize: '9px', fontWeight: 700, textTransform: 'none' }}>(current)</span>
                    </th>
                  </>
                ) : (
                  <th style={thStyle({ textAlign: 'right' })}>GST Price</th>
                )}
                {hasVarianceCols && (
                  <th style={thStyle({ textAlign: 'right', background: 'linear-gradient(180deg,#fef9c3,#fef3c7)', color: '#92400e' })}>
                    Current<br /><span style={{ fontSize: '9px', fontWeight: 700 }}>GST</span>
                  </th>
                )}

                <th style={thStyle({ textAlign: 'center' })}>Have It</th>
                <th style={thStyle({ textAlign: 'center' })}>Actions</th>
              </tr>
            </thead>

            <tbody>
              {calculatedIngredients.length > 0 ? (
                <>
                  {calculatedIngredients.map((ing, index) => {

                    /* ── SubKit Selection Row ── */
                    if (ing.isSubKitSelection) {
                      const totalCols = 10 + totalExtraCols;
                      return (
                        <tr key={index} ref={index === calculatedIngredients.length - 1 ? lastRowRef : null}
                          style={{ background: '#f0f9ff' }}>
                          <td style={tdBase({ textAlign: 'center', color: 'var(--erp-muted, #667085)' })}>{getRowNumber(index)}</td>
                          <td style={tdBase({ padding: '3px 4px' })}>
                            <Autocomplete
                              id={`subkit-select-${index}`}
                              options={recipes.filter((r) => r.itemType === 'SUBKIT' && r.createRecipe?.itemName)}
                              getOptionLabel={(option) => option.createRecipe?.itemName || ''}
                              value={null}
                              onChange={(_event, newValue) => { if (newValue) handleSelectSubKit(index, newValue); }}
                              renderInput={(params) => (
                                <TextField {...params} placeholder="Select SUBKIT Recipe" fullWidth size="small"
                                 InputProps={{ ...params.InputProps, sx: { fontSize: '11px', fontFamily: 'var(--erp-font-family, Inter, Arial, sans-serif)' } }} />
                              )}
                              renderOption={(props, option) => (
                              <li {...props} style={{ fontSize: '11px', fontFamily: 'var(--erp-font-family, Inter, Arial, sans-serif)', padding: '4px 12px' }}>
                                  {option.createRecipe?.itemName}
                                </li>
                              )}
                              filterOptions={(options, { inputValue }) =>
                                options.filter((o) => o.createRecipe?.itemName.toLowerCase().includes(inputValue.toLowerCase()))
                              }
                              noOptionsText={recipes.length === 0 ? 'No SUBKIT recipes available' : 'No matching SUBKIT recipes found'}
                            />
                          </td>
                          <td colSpan={totalCols - 2} style={tdBase({})} />
                        </tr>
                      );
                    }

                    /* ── SubKit Header Row ── */
                    if (ing.isSubKitHeader) {
                      const isCollapsed = collapsedSubKits.has(index);
                      const totalCols = 10 + totalExtraCols;
                      return (
                        <tr key={index} ref={index === calculatedIngredients.length - 1 ? lastRowRef : null}
                          onClick={() => toggleSubKitCollapse(index)}
                          style={{
                           background: 'linear-gradient(90deg, var(--erp-accent-soft, #e8efff) 0%, #f8faff 100%)',
                            cursor: 'pointer',
                            borderTop: '2px solid #92a8c4ff',
                            borderBottom: '1px solid #92a8c4ff',
                          }}>
                         <td style={tdBase({ textAlign: 'center', fontWeight: 700, color: 'var(--erp-accent, #155eef)' })}>
                            {getRowNumber(index)}
                          </td>
                          <td style={tdBase({ textAlign: 'left' })}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              <Box sx={{
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                width: 20, height: 20, borderRadius: '50%',
                                background: 'var(--erp-accent-soft, #e8efff)', color: 'var(--erp-accent, #155eef)',
                              }}>
                                {isCollapsed ? <ExpandMore sx={{ fontSize: 16 }} /> : <ExpandLess sx={{ fontSize: 16 }} />}
                              </Box>
                              <Typography sx={{ fontWeight: 700, fontSize: '11px', color: '#1e40af', ml: 0.5 }}>
                                {String(ing.ingredients)}
                                {ing.totalRequiredSubkitQty !== undefined && ing.totalRequiredSubkitQty > 0 && (
                                  <span style={{ fontWeight: 400, color: '#3b82f6', marginLeft: 6 }}>
                                    ({ing.totalRequiredSubkitQty.toFixed(2)}g)
                                  </span>
                                )}
                              </Typography>
                            </Box>
                          </td>
                          <td colSpan={totalCols - 3} style={tdBase({})} />
                          <td style={tdBase({ textAlign: 'center' })}>
                            <IconButton size="small"
                              onClick={(e) => { e.stopPropagation(); handleDeleteIngredient(index); }}
                              disabled={isVersionPreview}
                              sx={{ color: '#ec6666ff', '&:hover': { background: '#fee2e2' }, padding: '4px' }}>
                              <DeleteIcon sx={{ fontSize: 16 }} />
                            </IconButton>
                          </td>
                        </tr>
                      );
                    }

                    /* ── Regular / SubKit Ingredient Row ── */
                    const isSubKit = isSubKitIngredient(index);

                    let shouldHide = false;
                    if (isSubKit) {
                      for (let i = index - 1; i >= 0; i--) {
                        if (calculatedIngredients[i].isSubKitHeader) { shouldHide = collapsedSubKits.has(i); break; }
                      }
                    }
                    if (shouldHide) return null;

                    const isEven = index % 2 === 0;
                    const hasVariance = !!(inlineVarianceMap && inlineVarianceMap[ing.ingredients]);
                    const hasPending = !!(pendingVarianceMap && pendingVarianceMap[ing.ingredients]);

                    // ── FIX: look up the current live ingredient by name ──────────
                    const currentIng = currentIngMap[ing.ingredients] ?? null;
                    // showVersionCompare is true when we have the live ingredient to compare
                    const showVersionCompare = isVersionPreview && currentIng !== null;

                    return (
                      <tr key={index}
                        ref={index === calculatedIngredients.length - 1 ? lastRowRef : null}
                        style={{
                          background: isVersionPreview
                            ? (isEven ? '#f0f6ff' : '#e8f1ff')
                            : hasVariance
                              ? (isEven ? '#fffbeb' : '#fef9c3')
                              : isSubKit
                                ? (isEven ? '#f9feff' : '#f0fdfe')
                                : (isEven ? 'var(--erp-surface, #ffffff)' : 'var(--erp-surface-2, #f8fafc)'),
                          transition: 'background 0.15s',
                          borderLeft: isVersionPreview
                            ? '3px solid var(--erp-accent-border, #9bb7f7)'
                            : hasVariance
                              ? '3px solid #f59e0b'
                              : isSubKit ? '3px solid #67e8f9' : '3px solid transparent',
                        }}
                        onMouseEnter={(e) => {
                          (e.currentTarget as HTMLElement).style.background = isVersionPreview
                            ? 'var(--erp-accent-soft, #e8efff)' : hasVariance ? '#fef3c7' : '#f0f9ff';
                        }}
                        onMouseLeave={(e) => {
                          (e.currentTarget as HTMLElement).style.background = isVersionPreview
                            ? (isEven ? '#f0f6ff' : '#e8f1ff')
                            : hasVariance
                              ? (isEven ? '#fffbeb' : '#fef9c3')
                              : isSubKit
                                ? (isEven ? '#f9feff' : '#f0fdfe')
                              : (isEven ? 'var(--erp-surface, #ffffff)' : 'var(--erp-surface-2, #f8fafc)');
                        }}
                      >
                        {/* S.No */}
                        <td style={tdBase({ textAlign: 'center', color: '#000', fontWeight: 600, width: 48 })}>
                          {getRowNumber(index)}
                        </td>

                        {/* Ingredient */}
                        <td style={tdBase({ width: 240, padding: '3px 4px' })}>
                          {isSubKit ? (
                            <TextField value={ing.ingredients} fullWidth size="small"
                             InputProps={{ readOnly: true, sx: { fontSize: '11px', fontFamily: 'var(--erp-font-family, Inter, Arial, sans-serif)', background: '#f0fdfe', pointerEvents: 'none' } }}
                              sx={{ '& .MuiOutlinedInput-notchedOutline': { borderColor: '#a5f3fc' } }} />
                          ) : (
                            <Autocomplete
                              id={`ingredient-select-${index}`}
                              disabled={isVersionPreview}
                              options={poItems.filter((item) => item.itemName)}
                              getOptionLabel={(option) => option.itemName || ''}
                              value={
                                poItems.find((item) => item.itemName === ing.ingredients) || {
                                  itemName: ing.ingredients, uom: ing.uom,
                                  purchasePrice: 0, purchaseitemId: '', purchasetaxName: 0,
                                }
                              }
                              onChange={(_, newValue) =>
                                handleIngredientChange(index, 'ingredients', newValue ? newValue.itemName : '')
                              }
                              onInputChange={(_, newInputValue, reason) => {
                                if (reason === 'input') {
                                  handleSearchIngredients(newInputValue);
                                  handleIngredientChange(index, 'ingredients', newInputValue);
                                } else if (reason === 'clear') {
                                  handleClearSearch('ingredients');
                                  handleIngredientChange(index, 'ingredients', '');
                                }
                              }}
                              renderInput={(params) => (
                                <TextField {...params}
                                  inputRef={ingredientRefs.current[index]}
                                  placeholder="Search ingredients" fullWidth size="small"
                                  onKeyDown={(e) => handleIngredientKeyDown(e, index)}
                                  onBlur={(e) => {
                                    const matchedItem = poItems.find(
                                      (item) => item.itemName.toLowerCase() === e.target.value.toLowerCase()
                                    );
                                    if (matchedItem?.uom) handleIngredientChange(index, 'uom', matchedItem.uom);
                                  }}
                                  InputProps={{
                                    ...params.InputProps,
                                    endAdornment: (<>{isFetchingItems && <CircularProgress size={14} />}{params.InputProps.endAdornment}</>),
                                 sx: { fontSize: '11px', fontFamily: 'var(--erp-font-family, Inter, Arial, sans-serif)' },
                                  }}
                                  sx={{
                                 '& .MuiInputBase-input': { fontSize: '11px', fontFamily: 'var(--erp-font-family, Inter, Arial, sans-serif)' },
                                    '& .MuiAutocomplete-input': { fontSize: '11px !important', fontFamily: 'var(--erp-font-family, Inter, Arial, sans-serif) !important' },
                                  }}
                                />
                              )}
                              renderOption={(props, option) => (
                               <li {...props} style={{ fontSize: '12px', fontFamily: 'var(--erp-font-family, Inter, Arial, sans-serif)', padding: '4px 16px' }}>
                                  {option.itemName}
                                </li>
                              )}
                              ListboxProps={{
                              style: { fontSize: '12px', fontFamily: 'var(--erp-font-family, Inter, Arial, sans-serif)' },
                                onScroll: (event) => {
                                  const lb = event.currentTarget;
                                  if (lb.scrollTop + lb.clientHeight >= lb.scrollHeight - 50 && hasMoreItems && !isFetchingItems)
                                    handleLoadMoreItems('ingredients');
                                },
                              }}
                              PopperComponent={(props) => (
                                <Popper {...props} style={{ ...props.style, zIndex: 12000 }} placement="bottom-start" />
                              )}
                              filterOptions={(options) => options}
                              noOptionsText="No ingredients found"
                            />
                          )}
                        </td>

                        {/* UOM */}
                        <td style={tdBase({ textAlign: 'center', width: 55 })}>
                        <Typography sx={{ fontSize: '12px', fontFamily: 'var(--erp-font-family, Inter, Arial, sans-serif)', color: '#000', fontWeight: 500 }}>
                            {ing.uom}
                          </Typography>
                        </td>

                        {/* ── Kit Qty ── */}
                        {isVersionPreview ? (
                          <>
                            {/* VERSION column — blue version value */}
                          <td style={tdBase({ textAlign: 'right', width: 90, background: 'var(--erp-accent-soft, #e8efff)' })}>
                              <Typography sx={{ fontSize: '11px', fontWeight: 700, color: 'var(--erp-accent, #155eef)', textAlign: 'right' }}>
                                {ing.kitQty === 0 ? '—' : ing.kitQty.toFixed(2)}
                              </Typography>
                            </td>
                            {/* CURRENT column — FIX: show live value as primary */}
                            <td style={tdBase({ textAlign: 'right', width: 90 })}>
                              {showVersionCompare ? (
                                <VersionCompareCell
                                  versionValue={ing.kitQty}
                                  currentValue={currentIng!.kitQty}
                                  decimals={2}
                                  versionHaveIt={ing.haveIt}
                                  currentHaveIt={currentIng!.haveIt}
                                />
                              ) : (
                                <CurrentNotFoundCell />
                              )}
                            </td>

                            {/* <td style={tdBase({ textAlign: 'right', width: 90 })}>
                              <Typography sx={{ fontSize: '11px', fontWeight: 600, color: '#111827', textAlign: 'right' }}>
                                {showVersionCompare ? currentIng!.kitQty.toFixed(2) : '—'}
                              </Typography>
                            </td> */}f

                          </>
                        ) : (
                          <td style={tdBase({ textAlign: 'right', width: 80, padding: '3px 6px' })}>
                            {isSubKit ? (
                              <Typography sx={{ fontSize: '12px', fontWeight: 500, color: '#0e7490', textAlign: 'right' }}>
                                {ing.kitQty === 0 ? '—' : ing.kitQty.toFixed(2)}
                              </Typography>
                            ) : (
                              <TextField
                                autoComplete="off"
                                disabled={isVersionPreview}
                                inputProps={{
                                  step: '0.01', min: 0,
                                 style: { textAlign: 'right', fontFamily: 'var(--erp-font-family, Inter, Arial, sans-serif)', fontSize: '11px', color: '#000', padding: '3px 9px', height: 25 },
                                }}
                                inputRef={kitQtyRefs.current[index]}
                                value={tempQtyValues[index] !== undefined ? tempQtyValues[index] : ing.kitQty === 0 ? '' : ing.kitQty}
                                onChange={(e) => {
                                  const value = e.target.value;
                                  if (value === '' || /^-?\d*\.?\d*$/.test(value))
                                    setTempQtyValues((prev) => ({ ...prev, [index]: value }));
                                }}
                                onBlur={() => {
                                  const value = tempQtyValues[index];
                                  if (value === undefined) return;
                                  handleIngredientChange(index, 'kitQty', value === '' ? 0 : parseFloat(value));
                                  setTempQtyValues((prev) => { const next = { ...prev }; delete next[index]; return next; });
                                }}
                                onKeyDown={(e) => handleQtyKeyDown(e, index)}
                                size="small"
                                sx={{ width: 85 }}
                              />
                            )}
                          </td>
                        )}

                        {/* Batch Qty */}
                        <td style={tdBase({ textAlign: 'right', width: 90 })}>
                          <Typography sx={{ fontSize: '12px', fontWeight: 500, color: '#000', textAlign: 'right' }}>
                            {ing.batchQty.toFixed(2)}
                          </Typography>
                        </td>

                        {/* ── Per Gram Cost ── */}
                        {isVersionPreview ? (
                          <>
                            {/* VERSION column */}
                           <td style={tdBase({ textAlign: 'right', width: 80, background: 'var(--erp-accent-soft, #e8efff)' })}>
                              <Typography sx={{ fontSize: '11px', fontWeight: 700, color: 'var(--erp-accent, #155eef)', textAlign: 'right' }}>
                                {ing.perGramCost.toFixed(3)}
                              </Typography>
                            </td>
                            {/* CURRENT column — FIX: live value as primary */}
                            <td style={tdBase({ textAlign: 'right', width: 90 })}>
                              {showVersionCompare ? (
                                <VersionCompareCell
                                  versionValue={ing.perGramCost}
                                  currentValue={currentIng!.perGramCost}
                                  decimals={3}
                                  versionHaveIt={ing.haveIt}
                                  currentHaveIt={currentIng!.haveIt}
                                />
                              ) : (
                                <CurrentNotFoundCell />
                              )}
                            </td>


                            {/* <td style={tdBase({ textAlign: 'right', width: 90 })}>
                              <Typography sx={{ fontSize: '11px', fontWeight: 600, color: '#111827', textAlign: 'right' }}>
                                {showVersionCompare ? currentIng!.perGramCost.toFixed(3) : '—'}
                              </Typography>
                            </td> */}

                          </>
                        ) : (
                          <td style={tdBase({ textAlign: 'right', width: 80 })}>
                            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                              <Typography sx={{
                                fontSize: '12px', fontWeight: hasVariance ? 700 : 500,
                                color: hasVariance
                                  ? (inlineVarianceMap[ing.ingredients]?.priceChangePercent > 0 ? '#dc2626' : '#16a34a')
                                  : '#000',
                                textAlign: 'right',
                              }}>
                                {ing.perGramCost.toFixed(3)}
                              </Typography>
                              {hasVariance && inlineVarianceMap[ing.ingredients] && (
                                <Typography sx={{ fontSize: '9px', color: '#9ca3af', textDecoration: 'line-through', fontFamily: 'monospace' }}>
                                  {inlineVarianceMap[ing.ingredients].oldPerGramCost.toFixed(3)}
                                </Typography>
                              )}
                            </Box>
                          </td>
                        )}

                        {/* Variance: Current Per Gram */}
                        {hasVarianceCols && (
                          <td style={tdBase({ textAlign: 'right', width: 80, background: hasPending || hasVariance ? '#fefce8' : 'transparent' })}>
                            {(hasPending || hasVariance) ? (
                              <Typography sx={{ fontSize: '12px', fontWeight: 700, color: '#b45309', textAlign: 'right' }}>
                                {hasCommitted
                                  ? ing.perGramCost.toFixed(3)
                                  : (pendingVarianceMap[ing.ingredients]?.currentPerGramCost || ing.perGramCost).toFixed(3)}
                              </Typography>
                            ) : (
                              <Typography sx={{ fontSize: '11px', color: '#d1d5db', textAlign: 'right' }}>—</Typography>
                            )}
                          </td>
                        )}

                        {/* ── Total Cost ── */}
                        {isVersionPreview ? (
                          <>
                            {/* VERSION column */}
                           <td style={tdBase({ textAlign: 'right', width: 75, background: 'var(--erp-accent-soft, #e8efff)' })}>
                              <Typography sx={{ fontSize: '11px', fontWeight: 700, color: 'var(--erp-accent, #155eef)', textAlign: 'right' }}>
                                {ing.totalCost.toFixed(2)}
                              </Typography>
                            </td>
                            {/* CURRENT column — FIX: live value as primary */}
                            <td style={tdBase({ textAlign: 'right', width: 90 })}>
                              {showVersionCompare ? (
                                <VersionCompareCell
                                  versionValue={ing.totalCost}
                                  currentValue={currentIng!.totalCost}
                                  decimals={2}
                                  versionHaveIt={ing.haveIt}
                                  currentHaveIt={currentIng!.haveIt}
                                />
                              ) : (
                                <CurrentNotFoundCell />
                              )}
                            </td>


                            {/* <td style={tdBase({ textAlign: 'right', width: 90 })}>
                              <Typography sx={{ fontSize: '11px', fontWeight: 600, color: '#166534', textAlign: 'right' }}>
                                {showVersionCompare ? currentIng!.totalCost.toFixed(2) : '—'}
                              </Typography>
                            </td> */}

                          </>
                        ) : (
                          <td style={tdBase({ textAlign: 'right', width: 75 })}>
                            <Typography sx={{ fontSize: '12px', fontWeight: 600, color: hasVariance ? '#b45309' : '#166534', textAlign: 'right' }}>
                              {ing.totalCost.toFixed(2)}
                            </Typography>
                          </td>
                        )}

                        {/* Variance: Current Total */}
                        {hasVarianceCols && (
                          <td style={tdBase({ textAlign: 'right', width: 75, background: hasPending || hasVariance ? '#fefce8' : 'transparent' })}>
                            {(hasPending || hasVariance) ? (
                              <Typography sx={{ fontSize: '12px', fontWeight: 700, color: '#b45309', textAlign: 'right' }}>
                                {hasCommitted
                                  ? ing.totalCost.toFixed(2)
                                  : (pendingVarianceMap[ing.ingredients]?.currentTotalCost || ing.totalCost).toFixed(2)}
                              </Typography>
                            ) : (
                              <Typography sx={{ fontSize: '11px', color: '#d1d5db', textAlign: 'right' }}>—</Typography>
                            )}
                          </td>
                        )}

                        {/* ── GST ── */}
                        {isVersionPreview ? (
                          <>
                            {/* VERSION column */}
                          <td style={tdBase({ textAlign: 'right', width: 65, background: 'var(--erp-accent-soft, #e8efff)' })}>
                              <Typography sx={{ fontSize: '11px', fontWeight: 700, color: 'var(--erp-accent, #155eef)', textAlign: 'right' }}>
                                {ing.GST.toFixed(2)}
                              </Typography>
                            </td>
                            {/* CURRENT column — FIX: live value as primary */}
                            <td style={tdBase({ textAlign: 'right', width: 75 })}>
                              {showVersionCompare ? (
                                <VersionCompareCell
                                  versionValue={ing.GST}
                                  currentValue={currentIng!.GST}
                                  decimals={2}
                                  versionHaveIt={ing.haveIt}
                                  currentHaveIt={currentIng!.haveIt}
                                />
                              ) : (
                                <CurrentNotFoundCell />
                              )}
                            </td>


                            {/* <td style={tdBase({ textAlign: 'right', width: 75 })}>
                              <Typography sx={{ fontSize: '11px', fontWeight: 600, color: '#92400e', textAlign: 'right' }}>
                                {showVersionCompare ? currentIng!.GST.toFixed(2) : '—'}
                              </Typography>
                            </td> */}

                          </>
                        ) : (
                          <td style={tdBase({ textAlign: 'right', width: 65 })}>
                            <Typography sx={{ fontSize: '12.5px', fontWeight: 500, color: '#92400e', textAlign: 'right' }}>
                              {ing.GST.toFixed(2)}
                            </Typography>
                          </td>
                        )}

                        {/* Variance: Current GST */}
                        {hasVarianceCols && (
                          <td style={tdBase({ textAlign: 'right', width: 65, background: hasPending || hasVariance ? '#fefce8' : 'transparent' })}>
                            {(hasPending || hasVariance) ? (
                              <Typography sx={{ fontSize: '12px', fontWeight: 700, color: '#92400e', textAlign: 'right' }}>
                                {hasCommitted
                                  ? ing.GST.toFixed(2)
                                  : (pendingVarianceMap[ing.ingredients]?.currentGST || ing.GST).toFixed(2)}
                              </Typography>
                            ) : (
                              <Typography sx={{ fontSize: '11px', color: '#d1d5db', textAlign: 'right' }}>—</Typography>
                            )}
                          </td>
                        )}

                        {/* Have It */}
                        {/* <td style={tdBase({ textAlign: 'center', width: 60 })}>
                          <Checkbox
                            checked={ing.haveIt}
                            onChange={(e) => handleIngredientChange(index, 'haveIt', e.target.checked)}
                            disabled={isVersionPreview}
                            size="small"
                            sx={{ padding: '2px', color: '#5e5e60', '&.Mui-checked': { color: '#4edc82' } }}
                          />
                        </td> */}

                        {/* Have It */}
                        <td style={tdBase({ textAlign: 'center', width: 60 })}>
                          {isVersionPreview && currentIng !== null ? (
                            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.3 }}>
                              {/* version have-it badge */}
                              <Box sx={{
                                px: 0.8, py: 0.15, borderRadius: '8px', fontSize: '9px', fontWeight: 700,
                                bgcolor: ing.haveIt ? '#dcfce7' : '#fee2e2',
                                color: ing.haveIt ? '#166534' : '#dc2626',
                                border: `1px solid ${ing.haveIt ? '#86efac' : '#fca5a5'}`,
                                lineHeight: 1.5,
                              }}>
                                v: {ing.haveIt ? 'Yes' : 'No'}
                              </Box>
                              {/* current have-it badge */}
                              <Box sx={{
                                px: 0.8, py: 0.15, borderRadius: '8px', fontSize: '9px', fontWeight: 700,
                                bgcolor: currentIng.haveIt ? '#dcfce7' : '#fee2e2',
                                color: currentIng.haveIt ? '#166534' : '#dc2626',
                                border: `1px solid ${currentIng.haveIt ? '#86efac' : '#fca5a5'}`,
                                lineHeight: 1.5,
                              }}>
                                now: {currentIng.haveIt ? 'Yes' : 'No'}
                              </Box>
                            </Box>
                          ) : (
                            <Checkbox
                              checked={ing.haveIt}
                              onChange={(e) => handleIngredientChange(index, 'haveIt', e.target.checked)}
                              disabled={isVersionPreview}
                              size="small"
                              sx={{ padding: '2px', color: '#5e5e60', '&.Mui-checked': { color: '#4edc82' } }}
                            />
                          )}
                        </td>


                        {/* Actions */}
                        <td style={tdBase({ textAlign: 'center', width: 60 })}>
                          {!isSubKit && !isVersionPreview && (
                            <IconButton size="small" onClick={() => handleDeleteIngredient(index)}
                              sx={{ color: '#ec6666', '&:hover': { background: '#fee2e2' }, padding: '4px' }}>
                              <DeleteIcon sx={{ fontSize: 14 }} />
                            </IconButton>
                          )}
                        </td>
                      </tr>
                    );
                  })}

                  {/* ── Totals Row ── */}
              <tr style={{ background: 'linear-gradient(90deg, var(--erp-surface-2, #f8fafc) 0%, var(--erp-bg, #f4f7fb) 100%)', borderTop: '2px solid #cbd5e1' }}>
                    <td style={tdBase({})} />
                 <td style={{ ...tdBase({ textAlign: 'right' }), fontWeight: 700, fontSize: '11px', color: 'var(--erp-text, #101828)', paddingRight: 16 }}>
                      Totals
                    </td>
                    <td style={tdBase({})} />

                    {/* Kit Qty totals */}
                    {isVersionPreview ? (
                      <>
                       <td style={{ ...totalCellStyle, background: 'var(--erp-accent-soft, #e8efff)' }}>
                          {/* <TotalBadge value={totalQty.toFixed(2)} color="var(--erp-accent, #155eef)" bg="var(--erp-accent-soft, #e8efff)" border="var(--erp-accent-border, #9bb7f7)" /> */}
                          <TotalBadge value={versionKitQtyTotal.toFixed(2)} color="var(--erp-accent, #155eef)" bg="var(--erp-accent-soft, #e8efff)" border="var(--erp-accent-border, #9bb7f7)" />
                        </td>
                        <td style={totalCellStyle}>
                          {/* FIX: use pre-computed live total */}
                          <TotalBadge
                            value={currentLiveKitQtyTotal.toFixed(2)}
                            color="#1e40af" bg="#e0e7ff" border="#a5b4fc"
                          />
                        </td>
                      </>
                    ) : (
                      <td style={totalCellStyle}>
                        <TotalBadge value={totalQty.toFixed(2)} />
                      </td>
                    )}

                    {/* Batch Qty */}
                    <td style={totalCellStyle}>
                      <TotalBadge value={totalEstimateQty.toFixed(2)} />
                    </td>

                    {/* Per Gram spacers */}
                    {isVersionPreview ? (
                      <>
                        <td style={tdBase({ background: 'var(--erp-accent-soft, #e8efff)' })} />
                        <td style={tdBase({})} />
                      </>
                    ) : (
                      <td style={tdBase({})} />
                    )}
                    {hasVarianceCols && <td style={tdBase({ background: '#fefce8' })} />}

                    {/* Total Cost totals */}
                    {isVersionPreview ? (
                      <>
                       <td style={{ ...totalCellStyle, background: 'var(--erp-accent-soft, #e8efff)' }}>
                          {/* <TotalBadge value={totalCost.toFixed(2)} color="var(--erp-accent, #155eef)" bg="var(--erp-accent-soft, #e8efff)" border="var(--erp-accent-border, #9bb7f7)" /> */}
                          <TotalBadge value={versionTotalCost.toFixed(2)} color="var(--erp-accent, #155eef)" bg="var(--erp-accent-soft, #e8efff)" border="var(--erp-accent-border, #9bb7f7)" />
                        </td>
                        <td style={totalCellStyle}>
                          {/* FIX: use pre-computed live total */}
                          <TotalBadge value={currentLiveTotalCost.toFixed(2)} color="#166534" bg="#dcfce7" border="#86efac" />
                        </td>
                      </>
                    ) : (
                      <td style={totalCellStyle}>
                        <TotalBadge value={totalCost.toFixed(2)} color="#166534" bg="#dcfce7" border="#86efac" />
                      </td>
                    )}
                    {hasVarianceCols && <td style={tdBase({})} />}

                    {/* GST totals */}
                    {isVersionPreview ? (
                      <>
                     <td style={{ ...totalCellStyle, background: 'var(--erp-accent-soft, #e8efff)' }}>
                          {/* <TotalBadge value={GST.toFixed(2)} color="var(--erp-accent, #155eef)" bg="var(--erp-accent-soft, #e8efff)" border="var(--erp-accent-border, #9bb7f7)" /> */}
                          <TotalBadge value={versionGST.toFixed(2)} color="var(--erp-accent, #155eef)" bg="var(--erp-accent-soft, #e8efff)" border="var(--erp-accent-border, #9bb7f7)" />
                        </td>
                        <td style={totalCellStyle}>
                          {/* FIX: use pre-computed live total */}
                          <TotalBadge value={currentLiveGST.toFixed(2)} color="#92400e" bg="#fef3c7" border="#fcd34d" />
                        </td>
                      </>
                    ) : (
                      <td style={totalCellStyle}>
                        <TotalBadge value={GST.toFixed(2)} color="#92400e" bg="#fef3c7" border="#fcd34d" />
                      </td>
                    )}
                    {hasVarianceCols && <td style={{ ...tdBase({}), background: '#fefce8' }} />}

                    <td colSpan={2} style={tdBase({})} />
                  </tr>
                </>
              ) : (
                <>
                  <tr style={{ height: 0, visibility: 'hidden' }}>
                    <td style={{ width: '44px', padding: 0 }} />
                    <td style={{ width: '220px', padding: 0 }} />
                    <td style={{ width: '56px', padding: 0 }} />
                    <td style={{ width: '90px', padding: 0 }} />
                    {isVersionPreview && <td style={{ width: '90px', padding: 0 }} />}
                    <td style={{ width: '100px', padding: 0 }} />
                    <td style={{ width: '80px', padding: 0 }} />
                    {isVersionPreview && <td style={{ width: '90px', padding: 0 }} />}
                    {hasVarianceCols && <td style={{ width: '80px', padding: 0 }} />}
                    <td style={{ width: '75px', padding: 0 }} />
                    {isVersionPreview && <td style={{ width: '90px', padding: 0 }} />}
                    {hasVarianceCols && <td style={{ width: '75px', padding: 0 }} />}
                    <td style={{ width: '65px', padding: 0 }} />
                    {isVersionPreview && <td style={{ width: '75px', padding: 0 }} />}
                    {hasVarianceCols && <td style={{ width: '65px', padding: 0 }} />}
                    <td style={{ width: '60px', padding: 0 }} />
                    <td style={{ width: '56px', padding: 0 }} />
                  </tr>
                  <tr>
                    <td colSpan={10 + totalExtraCols}
                      style={{ textAlign: 'center', padding: '48px 16px', color: '#9ca3af' }}>
                      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                        <Typography sx={{ fontSize: '14px', fontWeight: 600, color: '#d1d5db' }}>No ingredients added</Typography>
                        <Typography sx={{ fontSize: '11px', color: '#e5e7eb' }}>Add ingredients to get started</Typography>
                      </Box>
                    </td>
                  </tr>
                </>
              )}
            </tbody>
          </table>
        </div>
      </Box>

      {/* ─── Snackbar ─────────────────────────────────────────────── */}
      <Snackbar open={snackbarOpen} autoHideDuration={3000} onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert onClose={() => setSnackbarOpen(false)} severity="warning" sx={{ width: '100%', fontSize: '12px' }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>

      {/* ─── Ingredients Overview Dialog ─────────────────────────── */}
      <Dialog open={ingredientOpenDialog} onClose={handleCloseDialog} maxWidth="lg" fullWidth
        PaperProps={{ sx: { borderRadius: '10px', overflow: 'hidden' } }}>
        <DialogTitle sx={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          px: 2.5, py: 1.5,
         background: 'linear-gradient(135deg, var(--erp-surface-2, #f8fafc) 0%, var(--erp-bg, #f4f7fb) 100%)',
          borderBottom: '1px solid #e2e8f0',
          fontSize: '13px', fontWeight: 700, color: '#1e293b',
        }}>
          Ingredients Overview
         <IconButton onClick={handleCloseDialog} size="small" sx={{ color: 'var(--erp-muted, #667085)', '&:hover': { background: 'var(--erp-bg, #f4f7fb)' } }}>
            <CloseIcon sx={{ fontSize: 20 }} />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ padding: 0, display: 'flex', flexDirection: 'column', height: '55vh' }}>
          <TableContainer component={Paper} sx={{ flex: '1 1 auto', overflowY: 'auto', boxShadow: 'none', borderRadius: 0 }}>
            <Table stickyHeader size="small">
              <TableHead>
                <TableRow>
                  {[
                    { label: <span>S.No</span>, align: 'center' },
                    { label: <span>Ingredient</span>, align: 'left' },
                    { label: <span>UOM</span>, align: 'center' },
                    { label: <span>Kit Qty<br /><span style={{ fontSize: '10px', fontWeight: 700, textTransform: 'none', letterSpacing: 0 }}>(in grams)</span></span>, align: 'right' },
                    { label: <span>Batch Qty<br /><span style={{ fontSize: '10px', fontWeight: 700, textTransform: 'none', letterSpacing: 0 }}>(in grams)</span></span>, align: 'right' },
                    { label: <span>Per Gram Cost</span>, align: 'right' },
                    { label: <span>Total Cost</span>, align: 'right' },
                    { label: <span>Total GST</span>, align: 'right' },
                    { label: <span>Have It</span>, align: 'center' },
                  ].map((col, i) => (
                    <TableCell key={i} sx={{
                      background: isVersionPreview
                       ? 'linear-gradient(180deg, var(--erp-accent-soft, #e8efff) 0%, var(--erp-accent-soft, #e8efff) 100%)'
                        : 'linear-gradient(180deg, var(--erp-surface-2, #f8fafc) 0%, var(--erp-bg, #f4f7fb) 100%)',
                      borderBottom: '2px solid #cbd5e1',
                      fontWeight: 700, fontSize: '10.5px', textTransform: 'uppercase',
                      letterSpacing: '0.04em', py: 1, whiteSpace: 'nowrap', lineHeight: 1.4,
                      textAlign: col.align as 'left' | 'right' | 'center',
                      color: isVersionPreview ? 'var(--erp-accent, #155eef)' : 'inherit',
                    }}>
                      {col.label}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {calculatedIngredients.length > 0 ? (
                  <>
                    {calculatedIngredients
                      .filter((ing) => !ing.isSubKitSelection)
                      .map((ing) => {
                        const realIndex = calculatedIngredients.indexOf(ing);
                        const hasVarianceDialog = !!(inlineVarianceMap && inlineVarianceMap[ing.ingredients]);
                        // FIX: look up live ingredient for dialog too
                        const currentIngDialog = currentIngMap[ing.ingredients] ?? null;
                        const showCompareDialog = isVersionPreview && currentIngDialog !== null;

                        return (
                          <TableRow key={realIndex} sx={{
                            background: ing.isSubKitHeader
                            ? 'linear-gradient(90deg, var(--erp-accent-soft, #e8efff), #f8faff)'
                              : isVersionPreview
                                ? (realIndex % 2 === 0 ? '#f0f6ff' : '#e8f1ff')
                                : hasVarianceDialog
                                  ? (realIndex % 2 === 0 ? '#fffbeb' : '#fef9c3')
                                 : realIndex % 2 === 0 ? 'var(--erp-surface, #ffffff)' : 'var(--erp-surface-2, #f8fafc)',
                            borderLeft: ing.isSubKitHeader
                              ? '3px solid #3b82f6'
                              : isVersionPreview
                              ? '3px solid var(--erp-accent-border, #9bb7f7)'
                                : hasVarianceDialog
                                  ? '3px solid #f59e0b'
                                  : isSubKitIngredient(realIndex) ? '3px solid #67e8f9' : '3px solid transparent',
                            '&:hover': {
                            background: isVersionPreview ? 'var(--erp-accent-soft, #e8efff)' : hasVarianceDialog ? '#fef3c7' : '#f0f9ff',
                            },
                          }}>
                            <TableCell sx={{
                              textAlign: 'right', fontSize: ing.isSubKitHeader ? '11px' : '10px',
                            color: ing.isSubKitHeader ? 'var(--erp-accent, #155eef)' : '#000', fontWeight: 700,
                              width: 50, whiteSpace: 'nowrap', fontFamily: 'var(--erp-font-family, Inter, Arial, sans-serif)',
                              pr: isSubKitIngredient(realIndex) ? '2px' : '8px',
                            }}>
                              {getRowNumber(realIndex)}
                            </TableCell>

                            <TableCell sx={{
                             fontSize: '11px', fontFamily: 'var(--erp-font-family, Inter, Arial, sans-serif)',
                              fontWeight: ing.isSubKitHeader ? 700 : 600,
                              color: ing.isSubKitHeader ? '#082174' : '#1f2937',
                              pl: isSubKitIngredient(realIndex) ? 1 : 1,
                            }}>
                              {ing.ingredients}
                              {ing.isSubKitHeader && ing.totalRequiredSubkitQty !== undefined && ing.totalRequiredSubkitQty > 0 && (
                                <span style={{ fontWeight: 700, color: '#3b82f6', marginLeft: 6, fontSize: '10px' }}>
                                  ({ing.totalRequiredSubkitQty.toFixed(2)}g)
                                </span>
                              )}
                            </TableCell>

                           <TableCell sx={{ textAlign: 'center', fontSize: '10.5px', fontWeight: 700, fontFamily: 'var(--erp-font-family, Inter, Arial, sans-serif)' }}>
                              {ing.isSubKitHeader ? '' : ing.uom}
                            </TableCell>

                            {/* Kit Qty in dialog — FIX: live value as primary */}
                           <TableCell sx={{ textAlign: 'right', fontSize: '10.5px', fontWeight: 700, fontFamily: 'var(--erp-font-family, Inter, Arial, sans-serif)' }}>
                              {ing.isSubKitHeader ? '' : (
                                showCompareDialog ? (
                                  <VersionCompareCell
                                    versionValue={ing.kitQty}
                                    currentValue={currentIngDialog!.kitQty}
                                    decimals={2}
                                    versionHaveIt={ing.haveIt}
                                    currentHaveIt={currentIngDialog!.haveIt}
                                  />
                                ) : (
                                  Number.isInteger(ing.kitQty) ? ing.kitQty : ing.kitQty.toFixed(2)
                                )
                              )}
                            </TableCell>

                           <TableCell sx={{ textAlign: 'right', fontSize: '10.5px', fontWeight: 700, fontFamily: 'var(--erp-font-family, Inter, Arial, sans-serif)' }}>
                              {ing.isSubKitHeader ? '' : (Number.isInteger(ing.batchQty) ? ing.batchQty : ing.batchQty.toFixed(2))}
                            </TableCell>

                            {/* Per Gram in dialog — FIX: live value as primary */}
                           <TableCell sx={{ textAlign: 'right', fontSize: '10.5px', fontFamily: 'var(--erp-font-family, Inter, Arial, sans-serif)' }}>
                              {ing.isSubKitHeader ? '' : (
                                showCompareDialog ? (
                                  <VersionCompareCell
                                    versionValue={ing.perGramCost}
                                    currentValue={currentIngDialog!.perGramCost}
                                    decimals={3}
                                    versionHaveIt={ing.haveIt}
                                    currentHaveIt={currentIngDialog!.haveIt}
                                  />
                                ) : (
                                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 0.2 }}>
                                    <Typography sx={{
                                      fontSize: '10.5px', fontWeight: 700,
                                      color: hasVarianceDialog
                                        ? (inlineVarianceMap[ing.ingredients]?.priceChangePercent > 0 ? '#dc2626' : '#16a34a')
                                        : 'inherit',
                                     fontFamily: 'var(--erp-font-family, Inter, Arial, sans-serif)',
                                    }}>
                                      {ing.perGramCost.toFixed(3)}
                                    </Typography>
                                    {renderVarianceBadge(ing.ingredients)}
                                  </Box>
                                )
                              )}
                            </TableCell>

                            {/* Total Cost in dialog — FIX: live value as primary */}
                           <TableCell sx={{ textAlign: 'right', fontSize: '10.5px', fontWeight: 700, fontFamily: 'var(--erp-font-family, Inter, Arial, sans-serif)' }}>
                              {ing.isSubKitHeader ? '' : (
                                showCompareDialog ? (
                                  <VersionCompareCell
                                    versionValue={ing.totalCost}
                                    currentValue={currentIngDialog!.totalCost}
                                    decimals={2}
                                    versionHaveIt={ing.haveIt}
                                    currentHaveIt={currentIngDialog!.haveIt}
                                  />
                                ) : (
                                  <span style={{ color: hasVarianceDialog ? '#b45309' : '#166534' }}>
                                    {Number.isInteger(ing.totalCost) ? ing.totalCost : ing.totalCost.toFixed(2)}
                                  </span>
                                )
                              )}
                            </TableCell>

                            {/* GST in dialog — FIX: live value as primary */}
                          <TableCell sx={{ textAlign: 'right', fontSize: '10.5px', fontWeight: 700, fontFamily: 'var(--erp-font-family, Inter, Arial, sans-serif)' }}>
                              {ing.isSubKitHeader ? '' : (
                                showCompareDialog ? (
                                  <VersionCompareCell
                                    versionValue={ing.GST}
                                    currentValue={currentIngDialog!.GST}
                                    decimals={2}
                                    versionHaveIt={ing.haveIt}
                                    currentHaveIt={currentIngDialog!.haveIt}
                                  />
                                ) : (
                                  <span style={{ color: '#92400e' }}>
                                    {Number.isInteger(ing.GST) ? ing.GST : ing.GST.toFixed(2)}
                                  </span>
                                )
                              )}
                            </TableCell>

                            <TableCell sx={{ textAlign: 'center', fontSize: '11px' }}>
                              {ing.isSubKitHeader ? '' : (
                                <Box sx={{
                                  display: 'inline-block', px: 1.5, py: 0.25, borderRadius: '12px',
                                  fontSize: '10px', fontWeight: 600,
                                  background: ing.haveIt ? '#dcfce7' : '#fee2e2',
                                  color: ing.haveIt ? '#166534' : '#dc2626',
                                }}>
                                  {ing.haveIt ? 'Yes' : 'No'}
                                </Box>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}

                    {/* Dialog Totals Row */}
                    <TableRow sx={{
                     background: 'linear-gradient(90deg, var(--erp-surface-2, #f8fafc), var(--erp-bg, #f4f7fb))',
                      borderTop: '2px solid #cbd5e1',
                      position: 'sticky', bottom: 0, zIndex: 2,
                    }}>
                      <TableCell sx={{ borderTop: '2px solid #cbd5e1' }} />
                      <TableCell sx={{ textAlign: 'right', fontSize: '11px', fontWeight: 700, color: 'var(--erp-text, #101828)', fontFamily: 'var(--erp-font-family, Inter, Arial, sans-serif)', borderTop: '2px solid #cbd5e1', py: 1 }}>
                        Totals
                      </TableCell>
                      <TableCell sx={{ borderTop: '2px solid #cbd5e1' }} />
                      <TableCell sx={{ textAlign: 'right', borderTop: '2px solid #cbd5e1', py: 1 }}>
                       <Box sx={{ display: 'inline-flex', justifyContent: 'flex-end', px: 1.5, py: 0.4, borderRadius: '6px', minWidth: 60, background: 'var(--erp-accent-soft, #e8efff)', border: '1px solid var(--erp-accent-border, #9bb7f7)', color: '#1e40af', fontWeight: 700, fontSize: '11px', fontFamily: 'var(--erp-font-family, Inter, Arial, sans-serif)' }}>
                          {totalQty.toFixed(2)}
                        </Box>
                      </TableCell>
                      <TableCell sx={{ textAlign: 'right', borderTop: '2px solid #cbd5e1', py: 1 }}>
                       <Box sx={{ display: 'inline-flex', justifyContent: 'flex-end', px: 1.5, py: 0.4, borderRadius: '6px', minWidth: 60, background: 'var(--erp-accent-soft, #e8efff)', border: '1px solid var(--erp-accent-border, #9bb7f7)', color: '#1e40af', fontWeight: 700, fontSize: '11px', fontFamily: 'var(--erp-font-family, Inter, Arial, sans-serif)' }}>
                          {totalEstimateQty.toFixed(2)}
                        </Box>
                      </TableCell>
                      <TableCell sx={{ borderTop: '2px solid #cbd5e1' }} />
                      <TableCell sx={{ textAlign: 'right', borderTop: '2px solid #cbd5e1', py: 1 }}>
                       <Box sx={{ display: 'inline-flex', justifyContent: 'flex-end', px: 1.5, py: 0.4, borderRadius: '6px', minWidth: 70, background: '#dcfce7', border: '1px solid #86efac', color: '#166534', fontWeight: 700, fontSize: '11px', fontFamily: 'var(--erp-font-family, Inter, Arial, sans-serif)' }}>
                          {totalCost.toFixed(2)}
                        </Box>
                      </TableCell>
                      <TableCell sx={{ textAlign: 'right', borderTop: '2px solid #cbd5e1', py: 1 }}>
                      <Box sx={{ display: 'inline-flex', justifyContent: 'flex-end', px: 1.5, py: 0.4, borderRadius: '6px', minWidth: 60, background: '#fef3c7', border: '1px solid #fcd34d', color: '#92400e', fontWeight: 700, fontSize: '11px', fontFamily: 'var(--erp-font-family, Inter, Arial, sans-serif)' }}>
                          {GST.toFixed(2)}
                        </Box>
                      </TableCell>
                      <TableCell sx={{ borderTop: '2px solid #cbd5e1' }} />
                    </TableRow>
                  </>
                ) : (
                  <TableRow>
                    <TableCell colSpan={8} align="center" sx={{ py: 4, color: '#9ca3af', fontSize: '12px' }}>
                      No Data Found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </DialogContent>
      </Dialog>
    </Box>
  );
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function tdBase(extra: React.CSSProperties): React.CSSProperties {
  return {
   padding: '7px 10px',
    borderBottom: '1px solid var(--erp-border, #dfe5ec)',
    borderRight: '1px solid #eef1f5',
    color: 'var(--erp-text, #101828)',
    fontSize: '12px',
    fontFamily: 'var(--erp-font-family, Inter, Arial, sans-serif)',
    verticalAlign: 'middle',
    whiteSpace: 'nowrap',
    ...extra,
  };
}

const totalCellStyle: React.CSSProperties = {
padding: '7px 10px',
  borderBottom: '1px solid var(--erp-border, #dfe5ec)',
  borderRight: '1px solid #eef1f5',
  textAlign: 'right',
  verticalAlign: 'middle',
};

interface TotalBadgeProps { value: string; color?: string; bg?: string; border?: string; }
function TotalBadge({ value, color = 'var(--erp-accent, #155eef)', bg = 'var(--erp-accent-soft, #e8efff)', border = 'var(--erp-accent-border, #9bb7f7)' }: TotalBadgeProps) {
  return (
    <Box sx={{
      display: 'inline-flex', justifyContent: 'flex-end',
      px: 1.5, py: 0.8, borderRadius: 'var(--erp-radius-sm, 9px)', minWidth: 70, minHeight: 30,
      background: bg, border: `1px solid ${border}`,
     color, fontWeight: 700, fontSize: '11px', fontFamily: 'var(--erp-font-family, Inter, Arial, sans-serif)',
    }}>
      {value}
    </Box>
  );
}

function thStyle(extra: React.CSSProperties): React.CSSProperties {
  return {
   padding: '10px 10px',
    background: 'var(--erp-surface-2, #f8fafc)',
    borderBottom: '1px solid var(--erp-border, #dfe5ec)',
        color: 'var(--erp-muted, #667085)',
    fontFamily: 'var(--erp-font-family, Inter, Arial, sans-serif)',
    fontWeight: 700,
    fontSize: '10px',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.08em',
    whiteSpace: 'nowrap' as const,
    lineHeight: 1.35,
    ...extra,
  };
}

export default RecipeTableContainer;