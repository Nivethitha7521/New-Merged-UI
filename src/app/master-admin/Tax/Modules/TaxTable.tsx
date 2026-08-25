

'use client';
import React, { useMemo, useCallback } from 'react';
import {
  IconButton,
  Switch,
  FormControlLabel,
  Box,
  Typography,Button,Tooltip,
} from '@mui/material';
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/EditOutlined";
import DeleteIcon from "@mui/icons-material/DeleteOutlineRounded";
import RefreshIcon from "@mui/icons-material/RestoreRounded";
import { useSelector } from 'react-redux';
import { RootState } from '../../../../redux/store';

// ─── Types ────────────────────────────────────────────────────────────────────

interface TaxSplit {
  taxcodeName: string;
  taxcodePercentage: number;
}

interface Tax {
  id: string;
  taxName: string;
  taxPercentage: number;
  taxCode: string;
  taxSplitup?: TaxSplit[];
  status: string;
  taxId: string;
}

interface TaxTableContainerProps {
  handleEdit: (tax: Tax) => void;
  handleActivate: (tax: Tax) => void;
  handleDeactivate: (tax: Tax) => void;
  handleOpen: () => void;
  showDeactivated: boolean;
  setShowDeactivated: (value: boolean) => void;
}

// ─── Constants ────────────────────────────────────────────────────────────────

/**
 * Base column count: S.NO + Tax Id + Tax Name + Tax Percentage + Actions
 * Used as the single source of truth for colSpan calculations.
 */
const BASE_COL_COUNT = 5;

/** Each tax-code group occupies 2 columns (Name + %). */
const COLS_PER_CODE = 2;

// ─── Pure helpers ─────────────────────────────────────────────────────────────

const formatPercent = (value: number | string): string => `${value}%`;

const getTotalColSpan = (maxCodes: number): number =>
  BASE_COL_COUNT + maxCodes * COLS_PER_CODE;

// ─── Sub-component: toolbar ───────────────────────────────────────────────────
// Memoized so it never re-renders when only table row data changes.

interface ToolbarProps {
  showDeactivated: boolean;
  onToggle: () => void;
  onAdd: () => void;
}

const Toolbar = React.memo<ToolbarProps>(
  ({ showDeactivated, onToggle, onAdd }) => (
    <Box className="tax-master-toolbar">
      <Typography className="tax-master-toolbar-title">
        {showDeactivated
          ? "Deactivated Taxes"
          : "Active Taxes"}
      </Typography>

      <Box className="tax-master-toolbar-actions">
        {!showDeactivated && (
          <Button
            type="button"
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={onAdd}
            className="purchase-reference-action-button"
          >
            Add New
          </Button>
        )}

        <Box className="purchase-reference-active-toggle">
          <Typography component="span">
            Show Active Only
          </Typography>

          <Switch
            checked={!showDeactivated}
            onChange={onToggle}
            color="primary"
            size="small"
            inputProps={{
              "aria-label": "Show active taxes only",
            }}
          />
        </Box>
      </Box>
    </Box>
  )
);

Toolbar.displayName = 'Toolbar';

// ─── Sub-component: table header ──────────────────────────────────────────────
// Memoized — only re-renders when the number of tax-code columns changes.

interface TableHeaderProps {
  maxCodes: number;
}

const TableHeader = React.memo<TableHeaderProps>(({ maxCodes }) => {
  const hasCodeCols = maxCodes > 0;
  const rowSpan     = hasCodeCols ? 2 : 1;

  return (
    <thead>
      <tr>
       <th rowSpan={rowSpan} className="tax-column-sno">
  S.NO
</th>

<th rowSpan={rowSpan} className="tax-column-id">
  Tax ID
</th>

<th rowSpan={rowSpan} className="tax-column-name">
  Tax Name
</th>

<th rowSpan={rowSpan} className="tax-column-percentage">
  Tax Percentage
</th>

        {hasCodeCols &&
          Array.from({ length: maxCodes }, (_, i) => (
           <th
  key={i}
  colSpan={COLS_PER_CODE}
  className="tax-column-code-group"
>
  Tax Code {i + 1}
</th>
          ))}

      <th rowSpan={rowSpan} className="tax-column-actions">
  Actions
</th>
      </tr>

      {hasCodeCols && (
        <tr>
          {Array.from({ length: maxCodes }, (_, i) => (
            <React.Fragment key={i}>
            <th className="tax-column-code-name">Name</th>
<th className="tax-column-code-percentage">%</th>
            </React.Fragment>
          ))}
        </tr>
      )}
    </thead>
  );
});

TableHeader.displayName = 'TableHeader';

// ─── Sub-component: action cell ───────────────────────────────────────────────
// Stable per-row callbacks via useCallback prevent ActionCell from
// re-rendering when sibling rows change.

interface ActionCellProps {
  tax: Tax;
  showDeactivated: boolean;
  onEdit: (tax: Tax) => void;
  onActivate: (tax: Tax) => void;
  onDeactivate: (tax: Tax) => void;
}

const ActionCell = React.memo<ActionCellProps>(
  ({ tax, showDeactivated, onEdit, onActivate, onDeactivate }) => {
    const handleEdit       = useCallback(() => onEdit(tax),       [tax, onEdit]);
    const handleActivate   = useCallback(() => onActivate(tax),   [tax, onActivate]);
    const handleDeactivate = useCallback(() => onDeactivate(tax), [tax, onDeactivate]);

return (
  <td className="tax-column-actions">
    <Box className="purchase-master-actions">
      {showDeactivated ? (
        <Tooltip title="Activate tax" arrow>
          <IconButton
            type="button"
            onClick={handleActivate}
            className="purchase-master-action-button is-activate"
            aria-label={`Activate ${tax.taxName}`}
          >
            <RefreshIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      ) : (
        <>
          <Tooltip title="Edit tax" arrow>
            <IconButton
              type="button"
              onClick={handleEdit}
              className="purchase-master-action-button is-edit"
              aria-label={`Edit ${tax.taxName}`}
            >
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>

          <Tooltip title="Deactivate tax" arrow>
            <IconButton
              type="button"
              onClick={handleDeactivate}
              className="purchase-master-action-button is-delete"
              aria-label={`Deactivate ${tax.taxName}`}
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </>
      )}
    </Box>
  </td>
);
  }
);

ActionCell.displayName = 'ActionCell';

// ─── Sub-component: single data row ──────────────────────────────────────────
// Memoized — skips re-render when this row's tax object hasn't changed.

interface TaxRowProps {
  tax: Tax;
  index: number;
  maxCodes: number;
  showDeactivated: boolean;
  onEdit: (tax: Tax) => void;
  onActivate: (tax: Tax) => void;
  onDeactivate: (tax: Tax) => void;
}

const TaxRow = React.memo<TaxRowProps>(
  ({ tax, index, maxCodes, showDeactivated, onEdit, onActivate, onDeactivate }) => (
    <tr>
<td className="tax-column-sno">
  {index + 1}
</td>

<td className="tax-column-id">
  <span className="purchase-master-id-pill">
    {tax.taxId}
  </span>
</td>

<td className="tax-column-name">
  <Box className="purchase-master-name-cell">
    <span className="purchase-master-avatar">
      {(tax.taxName || "?")
        .charAt(0)
        .toUpperCase()}
    </span>

    <span>{tax.taxName}</span>
  </Box>
</td>

<td className="tax-column-percentage">
  <span className="purchase-master-value-pill">
    {formatPercent(tax.taxPercentage)}
  </span>
</td>

      {maxCodes > 0 &&
        Array.from({ length: maxCodes }, (_, i) => {
          const code = tax.taxSplitup?.[i];
          return (
            <React.Fragment key={i}>
             <td className="tax-column-code-name">
  {code?.taxcodeName ?? "—"}
</td>

<td className="tax-column-code-percentage">
  {code != null
    ? formatPercent(code.taxcodePercentage)
    : "—"}
</td>
            </React.Fragment>
          );
        })}

      <ActionCell
        tax={tax}
        showDeactivated={showDeactivated}
        onEdit={onEdit}
        onActivate={onActivate}
        onDeactivate={onDeactivate}
      />
    </tr>
  )
);

TaxRow.displayName = 'TaxRow';

// ─── Sub-component: loading / empty state row ─────────────────────────────────

interface StatusRowProps {
  colSpan: number;
  message: string;
}

const StatusRow = React.memo<StatusRowProps>(({ colSpan, message }) => (
  <tr>
<td
  colSpan={colSpan}
  className="empty-state"
>
  {message}
</td>
  </tr>
));

StatusRow.displayName = 'StatusRow';

// ─── Main component ───────────────────────────────────────────────────────────

const TaxTableContainer: React.FC<TaxTableContainerProps> = ({
  handleEdit,
  handleActivate,
  handleDeactivate,
  handleOpen,
  showDeactivated,
  setShowDeactivated,
}) => {
  const { items: taxes, deactivatedItems, loading } = useSelector(
    (state: RootState) => state.taxes
  );

  // ─── Derived data ─────────────────────────────────────────────────────────
  const displayedTaxes = showDeactivated ? deactivatedItems : taxes;

  // maxCodes drives both the header column count and row cell count.
  // Memoized so the O(n) reduce only reruns when the displayed list changes.
  const maxCodes = useMemo(
    () =>
      displayedTaxes.reduce(
        (max, tax) => Math.max(max, tax.taxSplitup?.length ?? 0),
        0
      ),
    [displayedTaxes]
  );

  const totalColSpan  = getTotalColSpan(maxCodes);
  const tableMinWidth = maxCodes > 0 ? `${600 + maxCodes * 180}px` : undefined;

  // ─── Stable toggle — prevents Toolbar re-render on unrelated state changes ─
  const handleToggle = useCallback(
    () => setShowDeactivated(!showDeactivated),
    [setShowDeactivated, showDeactivated]
  );

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <>
      <Toolbar
        showDeactivated={showDeactivated}
        onToggle={handleToggle}
        onAdd={handleOpen}
      />

      <Box className="purchase-master-table-shell tax-table-shell">
  <div className="purchase-native-table-wrapper">
    <table
      className="purchase-native-table tax-native-table"
          aria-label={showDeactivated ? 'Deactivated Taxes' : 'Active Taxes'}
          aria-busy={loading}
        style={{
  minWidth: tableMinWidth,
}}
        >
          <TableHeader maxCodes={maxCodes} />

          <tbody>
            {loading ? (
              <StatusRow colSpan={totalColSpan} message="Loading…" />
            ) : displayedTaxes.length === 0 ? (
              <StatusRow
                colSpan={totalColSpan}
                message={
                  showDeactivated
                    ? 'No deactivated taxes found'
                    : 'No active taxes found'
                }
              />
            ) : (
              displayedTaxes.map((tax, index) => (
                <TaxRow
                  key={tax.taxId || index}
                  tax={tax}
                  index={index}
                  maxCodes={maxCodes}
                  showDeactivated={showDeactivated}
                  onEdit={handleEdit}
                  onActivate={handleActivate}
                  onDeactivate={handleDeactivate}
                />
              ))
            )}
          </tbody>
        </table>
      </div>
      </Box>
    </>
  );
};

export default TaxTableContainer;