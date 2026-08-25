

'use client';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { VersionPreviewSnapshot } from '../Models/recipeModels';

interface RecipeDetailsContainerProps {
  totalEstimateQty: number;
  TotalServKitQty: number;
  afterBakingOutput: number;
  perPieceWeight: number;
  perGramWeight: number;
  perPcsValue: number;
  gramsOrPcs: number;
  sellingCost: { sellingCostKg: number; sellingCostPcs: number };
  uom: string;
  bakingWeightLoss: number;
  setbakingWeightLoss: React.Dispatch<React.SetStateAction<number>>;
  hasVarianceCommitted?: boolean;
  oldPerGramWeight?: number | null;
  oldPerPcsValue?: number | null;
  versionPreviewActive?: boolean;
  versionSnapshot?: VersionPreviewSnapshot | null;
}

// ── Small inline comparison cell ──────────────────────────────────────────────
const CompareCell = ({
  current, version, suffix = '',
}: { current: number; version: number; suffix?: string }) => (
  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
    <span style={{ fontSize: '11px', fontFamily: 'var(--erp-font-family, Inter, Arial, sans-serif)' }}>
      {current.toFixed(2)}{suffix}
    </span>
    <span style={{
      fontSize: '9px', fontWeight: 700,
      color: version > current ? '#dc2626' : version < current ? '#16a34a' : '#6b7280',
      background: version > current ? '#fee2e2' : version < current ? '#dcfce7' : '#f3f4f6',
      border: `1px solid ${version > current ? '#fca5a5' : version < current ? '#86efac' : '#e5e7eb'}`,
      borderRadius: '8px', padding: '0 5px', lineHeight: '16px',
      fontFamily: 'monospace',
    }}>
      v: {version.toFixed(2)}{suffix}
    </span>
  </div>
);

const RecipeDetailsContainer: React.FC<RecipeDetailsContainerProps> = ({
  totalEstimateQty,
  TotalServKitQty,
  afterBakingOutput,
  perPieceWeight,
  perGramWeight,
  perPcsValue,
  gramsOrPcs,
  sellingCost,
  uom,
  bakingWeightLoss,
  setbakingWeightLoss,
  hasVarianceCommitted = false,
  oldPerGramWeight = null,
  oldPerPcsValue = null,
  versionPreviewActive = false,
  versionSnapshot = null,
}) => {
  const [inputValue, setInputValue] = useState<string>(
    bakingWeightLoss === 0 ? '' : bakingWeightLoss.toString()
  );
  const isEditingRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasInitialized = useRef(false);

  useEffect(() => {
    if (!hasInitialized.current) {
      setInputValue(bakingWeightLoss === 0 ? '' : bakingWeightLoss.toString());
      hasInitialized.current = true;
    }
  }, [bakingWeightLoss]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      isEditingRef.current = true;
      setInputValue(value);
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        setbakingWeightLoss(value === '' ? 0 : parseFloat(value) || 0);
        isEditingRef.current = false;
      }, 1500);
    }
  }, [setbakingWeightLoss]);

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);

  const isPcs = ['pcs', 'PCS', 'Pcs'].includes(uom);
  const isKg = ['kgs', 'KGS', 'Kg', 'kg', 'KG', 'Kgs'].includes(uom);

  // ── Version banner color ──────────────────────────────────────────────────
  const vBanner = versionPreviewActive && versionSnapshot
    ? { bg: 'var(--erp-accent-soft, #e8efff)', border: 'var(--erp-accent-border, #9bb7f7)', label: 'var(--erp-accent, #155eef)' }
    : null;

  // ── Version snapshot helpers ──────────────────────────────────────────────
  // PCS output count for version: use TotalServKitQty stored in snapshot
  const vPcsCount = versionSnapshot?.TotalServKitQty ?? 0;
  // Grams output for version
  const vGramsOutput = versionSnapshot?.totalEstimateQty ?? 0;
  // After baking grams for version
  const vAfterBakingGrams = versionSnapshot?.afterBakingOutput ?? 0;
  // After baking pcs for version (same as TotalServKitQty since no baking loss changes pcs count)
  const vAfterBakingPcs = versionSnapshot?.TotalServKitQty ?? 0;

  // Current per piece weight (grams per piece)
  const currentPerPieceGrams = isPcs
    ? (TotalServKitQty > 0 ? afterBakingOutput / TotalServKitQty : 0)
    : gramsOrPcs;

  // Version per piece weight (grams per piece)
  const vPerPieceGrams = versionSnapshot?.perPieceWeight ?? 0;

  return (
    <div className="recipe-calculation-section">
      <div className="recipe-calculation-grid">

        {/* ── PRODUCT OUTPUT ── */}
         <div className="form-section recipe-calculation-card" style={vBanner ? { border: `1px solid ${vBanner.border}`, background: vBanner.bg } : {}}>
          <div className="form-section-title" style={{ textAlign: 'center', justifyContent: 'center' }}>
            PRODUCT OUTPUT
            {vBanner && (
              <span style={{
                marginLeft: 8, fontSize: '9px', fontWeight: 700, color: vBanner.label,
                background: 'var(--erp-accent-soft, #e8efff)', border: '1px solid var(--erp-accent-border, #9bb7f7)', borderRadius: '8px', padding: '1px 7px',
              }}>
                VERSION PREVIEW
              </span>
            )}
          </div>

          <div className="recipe-calculation-split">

            {/* YIELD IN */}
            <div>
              <div className="form-section-title" style={{ textAlign: 'center', justifyContent: 'center', fontSize: '0.65rem' }}>YIELD IN</div>
           <div className="table-container recipe-mini-table" style={{ marginLeft: 0, width: '100%' }}>
                <table className="custom-tables" style={{ width: '100%', tableLayout: 'fixed' }}>
                  <thead><tr><th>Grams</th><th>Pcs</th></tr></thead>
                  <tbody>
                    <tr>
                      {/* Grams column */}
                      <td align="center">
                        {versionPreviewActive && versionSnapshot ? (
                          <CompareCell
                            current={isPcs ? totalEstimateQty : TotalServKitQty}
                            version={vGramsOutput}
                          />
                        ) : (isPcs ? totalEstimateQty.toFixed(2) : TotalServKitQty)}
                      </td>
                      {/* Pcs column — for PCS uom this is the piece count, for KG it's gramsOrPcs */}
                      <td align="center">
                        {versionPreviewActive && versionSnapshot ? (
                          <CompareCell
                            current={isPcs ? TotalServKitQty : perPieceWeight}
                            version={isPcs ? vPcsCount : versionSnapshot.perPieceWeight}
                          />
                        ) : (isPcs ? TotalServKitQty : perPieceWeight.toFixed(2))}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* AFTER BAKING OUTPUT */}
            <div>
              <div className="form-section-title" style={{ textAlign: 'center', justifyContent: 'center', fontSize: '0.65rem' }}>After Baking Output</div>
             <div className="table-container recipe-mini-table" style={{ marginLeft: 0, width: '100%' }}>
                <table className="custom-tables" style={{ width: '100%', tableLayout: 'fixed' }}>
                  <thead><tr><th>Grams</th><th>Pcs</th></tr></thead>
                  <tbody>
                    <tr>
                      {/* After baking grams */}
                      <td align="center">
                        {versionPreviewActive && versionSnapshot ? (
                          <CompareCell
                            current={afterBakingOutput}
                            version={vAfterBakingGrams}
                          />
                        ) : afterBakingOutput.toFixed(2)}
                      </td>
                      {/* After baking pcs — for PCS uom this is piece count */}
                      <td align="center">
                        {versionPreviewActive && versionSnapshot ? (
                          <CompareCell
                            current={isPcs ? TotalServKitQty : perPieceWeight}
                            version={isPcs ? vAfterBakingPcs : versionSnapshot.perPieceWeight}
                          />
                        ) : (isPcs ? TotalServKitQty : perPieceWeight.toFixed(2))}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Baking Weight Loss — disabled during preview */}
          <div style={{ marginTop: '10px' }}>
            <div className="form-section-title" style={{ fontSize: '0.65rem', marginBottom: '4px' }}>Baking Weight Loss</div>

            {versionPreviewActive && versionSnapshot ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                {/* Current live value — primary */}
                <input
                className="recipe-native-input recipe-native-input--readonly"
                  type="text"
                  value={inputValue === '' ? '0.00' : parseFloat(inputValue || '0').toFixed(2)}
                  readOnly
                  style={{
                    width: '100%', boxSizing: 'border-box',
border: '1px solid var(--erp-border-strong, #c5ced8)', borderRadius: 'var(--erp-radius-md, 13px)',
                    padding: '10px 13px', fontSize: '13px',
                    fontFamily: 'var(--erp-font-family, Inter, Arial, sans-serif)', color: 'var(--erp-text, #101828)',
                    background: 'var(--erp-surface-2, #f8fafc)', outline: 'none', cursor: 'not-allowed',
                    textAlign: 'center',
                  }}
                />
                {/* Version comparison pill */}
                <span style={{
                  fontSize: '9px', fontWeight: 700,
                  color: (versionSnapshot.bakingWeightLoss ?? 0) > (parseFloat(inputValue || '0') || 0)
                    ? '#dc2626'
                    : (versionSnapshot.bakingWeightLoss ?? 0) < (parseFloat(inputValue || '0') || 0)
                      ? '#16a34a'
                      : '#6b7280',
                  background: (versionSnapshot.bakingWeightLoss ?? 0) > (parseFloat(inputValue || '0') || 0)
                    ? '#fee2e2'
                    : (versionSnapshot.bakingWeightLoss ?? 0) < (parseFloat(inputValue || '0') || 0)
                      ? '#dcfce7'
                      : '#f3f4f6',
                  border: `1px solid ${(versionSnapshot.bakingWeightLoss ?? 0) > (parseFloat(inputValue || '0') || 0)
                      ? '#fca5a5'
                      : (versionSnapshot.bakingWeightLoss ?? 0) < (parseFloat(inputValue || '0') || 0)
                        ? '#86efac'
                        : '#e5e7eb'
                    }`,
                  borderRadius: '8px', padding: '1px 8px', lineHeight: '16px',
                  fontFamily: 'monospace', whiteSpace: 'nowrap',
                }}>
                  {(versionSnapshot.bakingWeightLoss ?? 0) > (parseFloat(inputValue || '0') || 0) ? '▲' :
                    (versionSnapshot.bakingWeightLoss ?? 0) < (parseFloat(inputValue || '0') || 0) ? '▼' : ''}
                  &nbsp;v: {(versionSnapshot.bakingWeightLoss ?? 0).toFixed(2)}
                </span>
              </div>
            ) : (
              <input
              className="recipe-native-input"
                type="text" inputMode="decimal"
                value={inputValue}
                onChange={handleChange}
                autoComplete="off"
                placeholder="Baking Weight Loss (g)"
                style={{
                  width: '100%', boxSizing: 'border-box',
                 border: '1px solid var(--erp-border-strong, #c5ced8)', borderRadius: 'var(--erp-radius-md, 13px)',
                  padding: '10px 13px', fontSize: '13px',
                  fontFamily: 'var(--erp-font-family, Inter, Arial, sans-serif)', color: 'var(--erp-text, #101828)',
                  background: 'var(--erp-surface, #ffffff)',
                  outline: 'none', cursor: 'text',
                  caretColor: 'var(--erp-text, #101828)', transition: 'border-color 0.15s, box-shadow 0.15s',
                }}
                onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--erp-accent, #155eef)'; }}
                onBlur={(e) => {
                  e.currentTarget.style.borderWidth = '1px';
                  e.currentTarget.style.borderColor = 'var(--erp-border-strong, #c5ced8)';
                  if (timerRef.current) clearTimeout(timerRef.current);
                  setbakingWeightLoss(inputValue === '' ? 0 : parseFloat(inputValue) || 0);
                  isEditingRef.current = false;
                }}
              />
            )}
          </div>

        </div>

        {/* ── RAW MATERIAL COST ── */}
                <div className="form-section recipe-calculation-card" style={vBanner ? { border: `1px solid ${vBanner.border}`, background: vBanner.bg } : {}}>
          <div className="form-section-title" style={{ textAlign: 'center', justifyContent: 'center' }}>
            RAW MATERIAL COST
            {vBanner && (
              <span style={{
                marginLeft: 8, fontSize: '9px', fontWeight: 700, color: vBanner.label,
                background: 'var(--erp-accent-soft, #e8efff)', border: '1px solid var(--erp-accent-border, #9bb7f7)', borderRadius: '8px', padding: '1px 7px',
              }}>
                VERSION PREVIEW
              </span>
            )}
          </div>

        <div className="recipe-calculation-split">

            {/* For Per Item */}
            <div>
              <div className="form-section-title" style={{ textAlign: 'center', justifyContent: 'center', fontSize: '0.65rem' }}>For Per Item</div>
            <div className="table-container recipe-mini-table" style={{ marginLeft: 0, width: '100%' }}>
                <table className="custom-tables" style={{ width: '100%', tableLayout: 'fixed' }}>
                  <thead><tr><th>₹ Kgs</th><th>₹ Pcs</th></tr></thead>
                  <tbody>
                    <tr>
                      {/* ₹ Kgs — cost per kg */}
                      <td align="center">
                        {versionPreviewActive && versionSnapshot ? (
                          <CompareCell
                            current={perGramWeight}
                            version={versionSnapshot.perGramWeight}
                          />
                        ) : hasVarianceCommitted && oldPerGramWeight !== null ? (
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1px' }}>
                            <span style={{ fontSize: '9px', color: '#9ca3af', textDecoration: 'line-through', fontFamily: 'monospace' }}>
                              {oldPerGramWeight.toFixed(2)}
                            </span>
                           <span style={{ fontSize: '11px', fontWeight: 700, color: perGramWeight > oldPerGramWeight ? '#dc2626' : '#16a34a', fontFamily: 'var(--erp-font-family, Inter, Arial, sans-serif)' }}>
                              {perGramWeight.toFixed(2)}
                            </span>
                          </div>
                        ) : (
                          <span style={{ fontSize: '11px', fontFamily: 'var(--erp-font-family, Inter, Arial, sans-serif)' }}>{perGramWeight.toFixed(2)}</span>
                        )}
                      </td>

                      {/* ₹ Pcs — cost per piece */}
                      <td align="center">
                        {versionPreviewActive && versionSnapshot ? (
                          <CompareCell
                            current={perPcsValue}
                            version={versionSnapshot.perPcsValue}
                          />
                        ) : hasVarianceCommitted && oldPerPcsValue !== null ? (
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1px' }}>
                            <span style={{ fontSize: '9px', color: '#9ca3af', textDecoration: 'line-through', fontFamily: 'monospace' }}>
                              {oldPerPcsValue.toFixed(2)}
                            </span>
<span style={{ fontSize: '11px', fontWeight: 700, color: perPcsValue > oldPerPcsValue ? '#dc2626' : '#16a34a', fontFamily: 'var(--erp-font-family, Inter, Arial, sans-serif)' }}>                              {perPcsValue.toFixed(2)}
                            </span>
                          </div>
                        ) : (
                         <span style={{ fontSize: '11px', fontFamily: 'var(--erp-font-family, Inter, Arial, sans-serif)' }}>{perPcsValue.toFixed(2)}</span>
                        )}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Per Piece Weight */}
            <div>
              <div className="form-section-title" style={{ textAlign: 'center', justifyContent: 'center', fontSize: '0.65rem' }}>Per Piece Weight</div>
             <div className="table-container recipe-mini-table" style={{ marginLeft: 0, width: '100%' }}>
                <table className="custom-tables" style={{ width: '100%', tableLayout: 'fixed' }}>
                  <thead><tr><th style={{ textAlign: 'center' }}>Grams</th></tr></thead>
                  <tbody>
                    <tr>
                      <td align="center">
                        {versionPreviewActive && versionSnapshot ? (
                          <CompareCell
                            current={currentPerPieceGrams}
                            version={vPerPieceGrams}
                          />
                        ) : (
                          totalEstimateQty
                            ? isPcs
                              ? (afterBakingOutput / TotalServKitQty).toFixed(2)
                              : gramsOrPcs.toFixed(2)
                            : '0.00'
                        )}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* ── SELLING COSTS ── */}
       <div className="form-section recipe-calculation-card" style={vBanner ? { border: `1px solid ${vBanner.border}`, background: vBanner.bg } : {}}>
          <div className="form-section-title" style={{ textAlign: 'center', justifyContent: 'center' }}>
            SELLING COSTS
            {vBanner && (
              <span style={{
                marginLeft: 8, fontSize: '9px', fontWeight: 700, color: vBanner.label,
                background: 'var(--erp-accent-soft, #e8efff)', border: '1px solid var(--erp-accent-border, #9bb7f7)', borderRadius: '8px', padding: '1px 7px',
              }}>
                VERSION PREVIEW
              </span>
            )}
          </div>

         <div className="recipe-calculation-split">
            {/* For Item */}
            <div>
              <div className="form-section-title" style={{ textAlign: 'center', justifyContent: 'center', fontSize: '0.65rem' }}>For Item</div>
              <div className="table-container recipe-mini-table" style={{ marginLeft: 0, width: '100%' }}>
                <table className="custom-tables" style={{ width: '100%', tableLayout: 'fixed' }}>
                  <thead><tr><th>₹ Kgs</th><th>₹ Pcs</th></tr></thead>
                  <tbody>
                    <tr>
                      <td align="center">
                        {versionPreviewActive && versionSnapshot ? (
                          <CompareCell
                            current={sellingCost.sellingCostKg}
                            version={versionSnapshot.sellingCostKg}
                          />
                        ) : sellingCost.sellingCostKg.toFixed(2)}
                      </td>
                      <td align="center">
                        {versionPreviewActive && versionSnapshot ? (
                          <CompareCell
                            current={sellingCost.sellingCostPcs ?? 0}
                            version={versionSnapshot.sellingCostPcs}
                          />
                        ) : (sellingCost?.sellingCostPcs ? Number(sellingCost.sellingCostPcs).toFixed(2) : '0.00')}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Total Selling Cost */}
            <div>
              <div className="form-section-title" style={{ textAlign: 'center', justifyContent: 'center', fontSize: '0.65rem' }}>Total Selling Cost</div>
            <div className="table-container recipe-mini-table" style={{ marginLeft: 0, width: '100%' }}>
                <table className="custom-tables" style={{ width: '100%', tableLayout: 'fixed' }}>
                  <thead><tr><th>₹ Total</th></tr></thead>
                  <tbody>
                    <tr>
                      <td align="center">
                        {versionPreviewActive && versionSnapshot ? (
                          <CompareCell
                            current={
                              isPcs
                                ? sellingCost.sellingCostPcs * TotalServKitQty
                                : isKg ? (sellingCost.sellingCostKg * afterBakingOutput) / 1000 : 0
                            }
                            version={versionSnapshot.totalSellingCost}
                          />
                        ) : (
                          isPcs
                            ? (sellingCost.sellingCostPcs * TotalServKitQty).toFixed(2)
                            : isKg
                              ? ((sellingCost.sellingCostKg * afterBakingOutput) / 1000).toFixed(2)
                              : '0.00'
                        )}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default RecipeDetailsContainer;