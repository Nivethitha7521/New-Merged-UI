'use client';
import React, { useEffect, useState, useCallback } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Box, Typography, CircularProgress, Checkbox,
  Table, TableHead, TableRow, TableCell, TableBody,
  Chip, Alert,
} from '@mui/material';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '../../../../redux/store';
import { fetchKitsUsingSubkit, updateRecipe } from '../Features/recipeSlice';
import {
  KitUsingSubkit, Recipe, IngredientItem,
  RawMaterialCost
} from '../Models/recipeModels';

interface PendingVarianceEntry {
  currentPerGramCost: number;
  currentTotalCost: number;
  currentGST: number;
  oldPerGramCost?: number;
  oldTotalCost?: number;
  priceChangePercent?: number;
  ingredientId: string;
}

interface Props {
  open: boolean;
  subkitName: string;
  subkitRecipeId: string;
  pendingVarianceMap: Record<string, PendingVarianceEntry>;
  subkitPayload: Recipe;
  onClose: () => void;
  onAllDone: () => void;
}

const SubkitKitUpdateDialog: React.FC<Props> = ({
  open,
  subkitName,
  subkitRecipeId,
  pendingVarianceMap,
  subkitPayload,
  onClose,
  onAllDone,
}) => {
  const dispatch = useDispatch<AppDispatch>();

  const [kits, setKits] = useState<KitUsingSubkit[]>([]);
  const [fetching, setFetching] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [updating, setUpdating] = useState(false);
  const [progress, setProgress] = useState<string[]>([]);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ── Fetch KITs that use this SUBKIT ───────────────────────────────────────
  useEffect(() => {
    if (!open || !subkitName) return;
    setFetching(true);
    setSelectedIds(new Set());
    setProgress([]);
    setDone(false);
    setError(null);

    dispatch(fetchKitsUsingSubkit(subkitName))
      .unwrap()
      .then((data) => {
        setKits(data);
        setSelectedIds(new Set(data.map((k) => k.recipeId)));
      })
      .catch((e) => setError(String(e)))
      .finally(() => setFetching(false));
  }, [open, subkitName, dispatch]);

  // ── Checkbox handlers ─────────────────────────────────────────────────────
  const allSelected = kits.length > 0 && selectedIds.size === kits.length;
  const someSelected = selectedIds.size > 0 && selectedIds.size < kits.length;

  const toggleAll = () => {
    if (allSelected) setSelectedIds(new Set());
    else setSelectedIds(new Set(kits.map((k) => k.recipeId)));
  };

  const toggleOne = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };


const applyNewPricesToKitIngredients = useCallback(
  (kitIngredients: IngredientItem[]): IngredientItem[] => {
    // If no variance committed (pendingVarianceMap is empty), return ingredients as-is
    const hasVariance = Object.keys(pendingVarianceMap).length > 0;
    if (!hasVariance) return kitIngredients;

    return kitIngredients.map((ing) => {
      if (ing.isSubKitHeader || ing.isSubKitSelection) return ing;

      const lookupKey = ing.ingredients || ing.ingredientName || '';
      const pending = pendingVarianceMap[lookupKey];

      if (!pending) return ing;

      const newPerGramCost = pending.currentPerGramCost;
      const kitQty = ing.kitQty ?? ing.qty ?? 0;
      const batchQty = ing.batchQty ?? kitQty;
      const newTotalCost = newPerGramCost * batchQty;
      const gstRatio = ing.totalCost > 0 ? (ing.GST ?? 0) / ing.totalCost : 0;

      return {
        ...ing,
        perGramCost: newPerGramCost,
        totalCost: newTotalCost,
        GST: newTotalCost * gstRatio,
      };
    });
  },
  [pendingVarianceMap],
);



  // ── Estimate new perGramWeight for display ────────────────────────────────
  const estimateNewPerGramWeight = useCallback(
    (kit: KitUsingSubkit): number => {
      const updatedIngs = applyNewPricesToKitIngredients(kit.allIngredients);
      const newTotalCost = updatedIngs
        .filter((i) => i.haveIt && !i.isSubKitHeader)
        .reduce((s, i) => s + (i.totalCost ?? 0), 0);

      const existingPerGram = kit.perGramWeight;
      const existingTotalCost = kit.totalIngCost;
      if (!existingTotalCost || !existingPerGram) return 0;

      const afterBakingOutput = (existingTotalCost / existingPerGram) * 1000;
      return afterBakingOutput ? (newTotalCost / afterBakingOutput) * 1000 : 0;
    },
    [applyNewPricesToKitIngredients],
  );


const buildKitPayload = useCallback(
  (kit: KitUsingSubkit): Recipe => {
    const hasVariance = Object.keys(pendingVarianceMap).length > 0;
    // Only apply new prices if variance was committed (pendingVarianceMap has entries)
    const updatedIngredients = hasVariance
      ? applyNewPricesToKitIngredients(kit.allIngredients)
      : kit.allIngredients;

    const rawMaterial = kit.rawMaterial as RawMaterialCost;
    const instruction = kit.instruction ?? { stepByStepInstructions: '' };
    const timing = kit.timing ?? {
      preparationTime: null, cookingTime: null, totalTime: null, bakingWeightLoss: 0,
    };
    const assignFields = kit.assignFields ?? {
      nutritionInfo: [], cuisine: '', dietaryRestriction: '', storageInstruction: '',
    };

    return {
      recipeId: kit.recipeId,
      RECIPEID: kit.RECIPEID,
      itemType: kit.itemType,
      fields: { category: '', subCategory: '' },
      createRecipe: {
        itemName: kit.kitName,
        kitPrepare: kit.createRecipe.kitPrepare ?? 1,
        UOM: kit.createRecipe.UOM ?? '',
        totalServings: kit.createRecipe.totalServings ?? 0,
        gramsOrPcs: kit.createRecipe.gramsOrPcs ?? 0,
      },
      ingredients: { addedIngrediant: updatedIngredients },
      totals: {
        totalQty: 0, totalKitQty: 0,
        totalBatchQty: 0, totalIngCost: 0, totalGST: 0,
      },
      instruction,
      timing,
      productOutput: { productOutputGrams: 0, productOutputPcs: 0 },
      afterBaking: { bakingOutputGrams: 0, bakingOutputPcs: 0 },
      perPieceWeight: { perGramWeight: 0, perPieceWeight: 0, PcsWeight: 0 },
      sellingCost: {
        sellingCostKg: kit.sellingCost.sellingCostKg,
        sellingCostPcs: kit.sellingCost.sellingCostPcs,
        totalSellingCost: kit.sellingCost.totalSellingCost,
      },
      rawMaterial,
      profit: { profit: 0, consumablePrice: 0, gstPrice: 0, profitPercentage: 0 },
      assignFields,
      createdDate: null,
      updatedDate: new Date().toISOString(),
      remark: kit.remark ?? '',
      status: 'active',
    };
  },
  [applyNewPricesToKitIngredients, pendingVarianceMap],
);


const handleConfirm = async () => {
  setUpdating(true);
  setProgress([]);

  const hasVariance = Object.keys(pendingVarianceMap).length > 0;

  try {
    // Step 1: Update SUBKIT — always creates new version (user clicked Update)
    setProgress((p) => [...p, `Updating SUBKIT: ${subkitName}...`]);
    await dispatch(updateRecipe({
      recipeId: subkitRecipeId,
      recipe: subkitPayload,
      snapshotType: hasVariance ? 'price_commit' : 'manual',
      createVersion: true, // always new version when dialog confirms
    })).unwrap();
    setProgress((p) => [...p, `✅ SUBKIT updated successfully`]);

    // Step 2: Update each selected KIT
    const selectedKits = kits.filter((k) => selectedIds.has(k.recipeId));
    for (const kit of selectedKits) {
      setProgress((p) => [...p, `Updating KIT: ${kit.kitName || kit.RECIPEID}...`]);
      try {
        const payload = buildKitPayload(kit);
        await dispatch(updateRecipe({
          recipeId: kit.recipeId,
          recipe: payload,
          snapshotType: hasVariance ? 'price_commit' : 'manual',
          createVersion: true, // always new version for affected KITs
        })).unwrap();
        setProgress((p) => [...p, `✅ ${kit.kitName || kit.RECIPEID} updated`]);
      } catch {
        setProgress((p) => [...p, `❌ Failed: ${kit.kitName || kit.RECIPEID}`]);
      }
    }

    setDone(true);
  } catch (e) {
    setError(`Failed to update SUBKIT: ${String(e)}`);
  } finally {
    setUpdating(false);
  }
};


  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <Dialog
      open={open}
      onClose={!updating ? onClose : undefined}
      fullWidth
      maxWidth="md"
      classes={{ paper: 'dialog-paper-big' }}
    >
      <DialogTitle
        className="dialog-title"
        sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
      >
        <span>📦 Update SUBKIT & Affected KIT Recipes</span>
        {kits.length > 0 && !done && (
          <Chip
            label={`${kits.length} KIT${kits.length > 1 ? 's' : ''} affected`}
            size="small"
            sx={{ background: '#fef3c7', color: '#92400e', fontWeight: 700, fontSize: '11px' }}
          />
        )}
      </DialogTitle>

      <DialogContent className="dialog-content">

        {/* ── Loading ── */}
        {fetching && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 3, justifyContent: 'center' }}>
            <CircularProgress size={20} />
            <Typography sx={{ fontSize: '13px', color: '#6b7280' }}>
              Finding KIT recipes that use <strong>{subkitName}</strong>...
            </Typography>
          </Box>
        )}

        {/* ── Error ── */}
        {error && (
          <Alert severity="error" sx={{ mb: 2, fontSize: '12px' }}>{error}</Alert>
        )}

        {/* ── No KITs found ── */}
        {!fetching && !error && kits.length === 0 && !done && (
          <Box sx={{ py: 3, textAlign: 'center' }}>
            <Typography sx={{ fontSize: '13px', color: '#6b7280' }}>
              No KIT recipes use <strong>{subkitName}</strong>.
              Only the SUBKIT will be updated.
            </Typography>
          </Box>
        )}

        {/* ── Progress log ── */}
        {progress.length > 0 && (
          <Box sx={{
            background: '#f9fafb', border: '1px solid #e5e7eb',
            borderRadius: '8px', p: 2, mb: 2, maxHeight: 180, overflowY: 'auto',
          }}>
            {progress.map((line, i) => (
              <Typography key={i} sx={{
                fontSize: '12px', fontFamily: 'monospace', lineHeight: 1.8,
                color: line.startsWith('❌') ? '#dc2626'
                  : line.startsWith('✅') ? '#16a34a'
                    : '#374151',
              }}>
                {line}
              </Typography>
            ))}
          </Box>
        )}

        {/* ── KIT selection table ── */}
        {!fetching && !done && kits.length > 0 && (
          <>
            <Typography sx={{ fontSize: '12px', color: '#6b7280', mb: 1.5 }}>
              Select which KIT recipes to update with the new SUBKIT prices:
            </Typography>

            <Box sx={{ border: '1px solid #e5e7eb', borderRadius: '8px', overflow: 'hidden' }}>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ background: '#f3f4f6' }}>
                    <TableCell padding="checkbox" sx={{ pl: 1 }}>
                      <Checkbox
                        size="small"
                        checked={allSelected}
                        indeterminate={someSelected}
                        onChange={toggleAll}
                      />
                    </TableCell>
                    <TableCell sx={{ fontSize: '11px', fontWeight: 700, color: '#374151' }}>
                      KIT Name
                    </TableCell>
                    <TableCell sx={{ fontSize: '11px', fontWeight: 700, color: '#374151' }}>
                      Recipe ID
                    </TableCell>
                    <TableCell align="right" sx={{ fontSize: '11px', fontWeight: 700, color: '#374151' }}>
                      ₹ Current RMC Total
                    </TableCell>
                    <TableCell align="right" sx={{ fontSize: '11px', fontWeight: 700, color: '#374151' }}>
                     ₹ New RMC Total  
                    </TableCell>
                    <TableCell align="center" sx={{ fontSize: '11px', fontWeight: 700, color: '#374151' }}>
                      Change
                    </TableCell>
                    {/* <TableCell align="right" sx={{ fontSize: '11px', fontWeight: 700, color: '#374151' }}>
                      Profit%
                    </TableCell> */}
                  </TableRow>
                </TableHead>

                <TableBody>
                  {kits.map((kit) => {
                    const newPerGram = estimateNewPerGramWeight(kit);
                    const changePct = kit.perGramWeight
                      ? ((newPerGram - kit.perGramWeight) / kit.perGramWeight) * 100
                      : 0;
                    const isSelected = selectedIds.has(kit.recipeId);

                    return (
                      <TableRow
                        key={kit.recipeId}
                        hover
                        onClick={() => toggleOne(kit.recipeId)}
                        sx={{
                          cursor: 'pointer',
                          background: isSelected ? '#eff6ff' : 'transparent',
                          '&:hover': { background: isSelected ? '#dbeafe' : '#f9fafb' },
                        }}
                      >
                        <TableCell padding="checkbox" sx={{ pl: 1 }}>
                          <Checkbox
                            size="small"
                            checked={isSelected}
                            onChange={() => toggleOne(kit.recipeId)}
                            onClick={(e) => e.stopPropagation()}
                          />
                        </TableCell>
                        <TableCell sx={{ fontSize: '12px', fontWeight: 600, color: '#1e3a5f' }}>
                          {kit.kitName || kit.RECIPEID}
                        </TableCell>
                        <TableCell sx={{ fontSize: '11px', color: '#6b7280' }}>
                          {kit.RECIPEID}
                        </TableCell>
                        <TableCell align="right" sx={{ fontSize: '12px', color: '#374151' }}>
                          ₹{kit.perGramWeight.toFixed(4)}
                        </TableCell>
                        <TableCell align="right" sx={{ fontSize: '12px', fontWeight: 700, color: '#dc2626' }}>
                          ₹{newPerGram.toFixed(4)}
                        </TableCell>
                        <TableCell align="center">
                          <Chip
                            label={`${changePct > 0 ? '+' : ''}${changePct.toFixed(2)}%`}
                            size="small"
                            sx={{
                              fontSize: '10px', fontWeight: 700,
                              background: changePct > 0 ? '#fee2e2' : '#dcfce7',
                              color: changePct > 0 ? '#dc2626' : '#16a34a',
                            }}
                          />
                        </TableCell>
                        {/* <TableCell align="right" sx={{ fontSize: '12px', color: '#374151' }}>
                          {kit.profitPercentage.toFixed(2)}%
                        </TableCell> */}
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </Box>

            {selectedIds.size === 0 && (
              <Alert severity="info" sx={{ mt: 1.5, fontSize: '11px', py: 0.5 }}>
                No KITs selected — only the SUBKIT will be updated.
              </Alert>
            )}
          </>
        )}

        {/* ── Done ── */}
        {done && (
          <Alert severity="success" sx={{ mt: 1, fontSize: '12px' }}>
            All updates completed successfully!
          </Alert>
        )}
      </DialogContent>

      <DialogActions className="dialog-actions">
        {done ? (
          <button className="btn-primary" onClick={onAllDone}>Done</button>
        ) : (
          <>
            <button className="btn-secondary" onClick={onClose} disabled={updating}>
              Cancel
            </button>
            <button
              className="btn-primary"
              onClick={handleConfirm}
              disabled={updating || fetching}
            >
              {updating ? (
                <><CircularProgress size={14} sx={{ mr: 1 }} />Updating...</>
              ) : (
                `Update SUBKIT${selectedIds.size > 0
                  ? ` + ${selectedIds.size} KIT${selectedIds.size > 1 ? 's' : ''}`
                  : ' Only'}`
              )}
            </button>
          </>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default SubkitKitUpdateDialog;