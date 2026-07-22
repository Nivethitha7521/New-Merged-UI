
'use client';
import React, { useMemo, useCallback } from 'react';
import {
  IconButton,
  Switch,
  FormControlLabel,
  Box,
  Typography,
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon } from '@mui/icons-material';
import DeleteIcon from '@mui/icons-material/Delete';
import RefreshIcon from '@mui/icons-material/Refresh';
import { useSelector } from 'react-redux';
import { RootState } from '../../../../redux/store';
import { DineInTax } from '../Models/dineInTaxModels';

// ─── Constants ────────────────────────────────────────────────────────────────

/** Base column count: S.NO + Name + Percentage + HSN + Actions */
const BASE_COL_COUNT = 5;

/** Each tax-code group occupies 2 columns (Name + %). */
const COLS_PER_CODE = 2;

// ─── Types ────────────────────────────────────────────────────────────────────

interface DineInTaxTableContainerProps {
  handleEdit: (tax: DineInTax) => void;
  handleActivate: (tax: DineInTax) => void;
  handleDeactivate: (tax: DineInTax) => void;
  handleOpen: () => void;
  showDeactivated: boolean;
  setShowDeactivated: (value: boolean) => void;
}

// ─── Pure helpers ─────────────────────────────────────────────────────────────

const formatPercent = (value: number | string): string => `${value}%`;

const getTotalColSpan = (maxCodes: number): number =>
  BASE_COL_COUNT + maxCodes * COLS_PER_CODE;

// ─── Sub-components ───────────────────────────────────────────────────────────

/**
 * Toolbar: title + Add button + active/deactivated toggle.
 * Extracted so it never re-renders when only table rows change.
 */
interface ToolbarProps {
  showDeactivated: boolean;
  onToggle: () => void;
  onAdd: () => void;
}

const Toolbar = React.memo<ToolbarProps>(({ showDeactivated, onToggle, onAdd }) => (
  <Box
    display="flex"
    flexDirection={{ xs: 'column', sm: 'row' }}
    alignItems={{ xs: 'flex-start', sm: 'center' }}
    justifyContent="space-between"
    my={1}
    ml={1}
    px={{ xs: 2, sm: 3 }}
    sx={{ width: '99%', boxSizing: 'border-box', mt: 2 }}
  >
    <Typography
      className="icon-action-label"
      sx={{
        fontFamily: "'Poppins', sans-serif",
        fontWeight: 750,
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        maxWidth: '100%',
        margin: 0,
      }}
    >
      {showDeactivated ? 'Deactivated DineIn Taxes' : 'Active DineIn Taxes'}
    </Typography>

    <div className="flex items-center gap-4">
      {!showDeactivated && (
        <div className="icon-action-wrapper">
          <IconButton
            color="primary"
            onClick={onAdd}
            className="icon-action-button"
            aria-label="Add DineIn Tax"
            title="Add"
          >
            <AddIcon className="icon-action-svg" />
          </IconButton>
          <Typography className="icon-action-label">Add</Typography>
        </div>
      )}

      <FormControlLabel
        control={
          <Switch
            checked={showDeactivated}
            onChange={onToggle}
            color="primary"
            size="small"
          />
        }
        label={showDeactivated ? 'Show Activated' : 'Show Deactivated'}
        sx={{
          marginLeft: 1,
          marginRight: 1,
          '& .MuiFormControlLabel-label': {
            fontSize: '0.75rem',
            fontFamily: "'Poppins', sans-serif",
          },
        }}
      />
    </div>
  </Box>
));

Toolbar.displayName = 'Toolbar';

// ─── Table header ─────────────────────────────────────────────────────────────

interface TableHeaderProps {
  maxCodes: number;
}

const TableHeader = React.memo<TableHeaderProps>(({ maxCodes }) => {
  const hasCodeCols = maxCodes > 0;
  const rowSpan     = hasCodeCols ? 2 : 1;

  return (
    <thead>
      <tr>
        <th rowSpan={rowSpan} style={{ textAlign: 'center' }}>S.NO</th>
        <th rowSpan={rowSpan} style={{ textAlign: 'center' }}>DineIn Tax Name</th>
        <th rowSpan={rowSpan} style={{ textAlign: 'center' }}>DineIn Tax Percentage</th>
        <th rowSpan={rowSpan} style={{ textAlign: 'center' }}>DineIn HSN Code</th>

        {hasCodeCols &&
          Array.from({ length: maxCodes }, (_, i) => (
            <th
              key={i}
              colSpan={COLS_PER_CODE}
              style={{
                textAlign: 'center',
                backgroundColor: 'var(--color-background-info, #e6f1fb)',
                fontSize: '0.7rem',
              }}
            >
              Tax Code {i + 1}
            </th>
          ))}

        <th rowSpan={rowSpan} style={{ textAlign: 'center' }}>Actions</th>
      </tr>

      {hasCodeCols && (
        <tr>
          {Array.from({ length: maxCodes }, (_, i) => (
            <React.Fragment key={i}>
              <th
                style={{
                  textAlign: 'center',
                  fontSize: '0.65rem',
                  backgroundColor: 'var(--color-background-tertiary, #f5f5f5)',
                }}
              >
                Name
              </th>
              <th
                style={{
                  textAlign: 'center',
                  fontSize: '0.65rem',
                  backgroundColor: 'var(--color-background-tertiary, #f5f5f5)',
                }}
              >
                %
              </th>
            </React.Fragment>
          ))}
        </tr>
      )}
    </thead>
  );
});

TableHeader.displayName = 'TableHeader';

// ─── Action cell ──────────────────────────────────────────────────────────────

interface ActionCellProps {
  tax: DineInTax;
  showDeactivated: boolean;
  onEdit: (tax: DineInTax) => void;
  onActivate: (tax: DineInTax) => void;
  onDeactivate: (tax: DineInTax) => void;
}

const ActionCell = React.memo<ActionCellProps>(
  ({ tax, showDeactivated, onEdit, onActivate, onDeactivate }) => {
    const handleEdit       = useCallback(() => onEdit(tax),       [tax, onEdit]);
    const handleActivate   = useCallback(() => onActivate(tax),   [tax, onActivate]);
    const handleDeactivate = useCallback(() => onDeactivate(tax), [tax, onDeactivate]);

    return (
      <td style={{ textAlign: 'center' }}>
        {showDeactivated ? (
          <button
            onClick={handleActivate}
            className="activate-btn"
            title="Activate"
            aria-label={`Activate ${tax.DineInTaxName}`}
          >
            <RefreshIcon />
          </button>
        ) : (
          <>
            <button
              onClick={handleEdit}
              className="edit-btn"
              title="Edit"
              aria-label={`Edit ${tax.DineInTaxName}`}
            >
              <EditIcon />
            </button>
            <button
              onClick={handleDeactivate}
              className="deactivate-btn"
              title="Deactivate"
              aria-label={`Deactivate ${tax.DineInTaxName}`}
            >
              <DeleteIcon />
            </button>
          </>
        )}
      </td>
    );
  }
);

ActionCell.displayName = 'ActionCell';

// ─── Single data row ──────────────────────────────────────────────────────────

interface TaxRowProps {
  tax: DineInTax;
  index: number;
  maxCodes: number;
  showDeactivated: boolean;
  onEdit: (tax: DineInTax) => void;
  onActivate: (tax: DineInTax) => void;
  onDeactivate: (tax: DineInTax) => void;
}

const TaxRow = React.memo<TaxRowProps>(
  ({ tax, index, maxCodes, showDeactivated, onEdit, onActivate, onDeactivate }) => (
    <tr key={tax.id ?? index}>
      <td style={{ textAlign: 'center' }}>{index + 1}</td>
      <td style={{ textAlign: 'center' }}>{tax.DineInTaxName}</td>
      <td style={{ textAlign: 'center' }}>{formatPercent(tax.DineInTaxPercentage)}</td>
      <td style={{ textAlign: 'center' }}>{tax.DineInhsnCode}</td>

      {maxCodes > 0 &&
        Array.from({ length: maxCodes }, (_, i) => {
          const code = tax.taxSplitup?.[i];
          return (
            <React.Fragment key={i}>
              <td style={{ textAlign: 'center', fontWeight: 500 }}>
                {code?.taxcodeName ?? '—'}
              </td>
              <td style={{ textAlign: 'center', color: 'var(--color-text-secondary)' }}>
                {code != null ? formatPercent(code.taxcodePercentage) : '—'}
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

// ─── Loading / empty state cells ──────────────────────────────────────────────

interface StatusRowProps {
  colSpan: number;
  message: string;
}

const StatusRow = React.memo<StatusRowProps>(({ colSpan, message }) => (
  <tr>
    <td
      colSpan={colSpan}
      style={{ textAlign: 'center', padding: '24px 0', color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}
    >
      {message}
    </td>
  </tr>
));

StatusRow.displayName = 'StatusRow';

// ─── Main component ───────────────────────────────────────────────────────────

const DineInTaxTableContainer: React.FC<DineInTaxTableContainerProps> = ({
  handleEdit,
  handleActivate,
  handleDeactivate,
  handleOpen,
  showDeactivated,
  setShowDeactivated,
}) => {
  const { items: dineInTaxes, deactivatedItems, loading } = useSelector(
    (state: RootState) => state.dineInTaxes
  );

  // ─── Derived data — memoized ──────────────────────────────────────────────
  const displayedTaxes = showDeactivated ? deactivatedItems : dineInTaxes;

  const maxCodes = useMemo(
    () =>
      displayedTaxes.reduce(
        (max, tax) => Math.max(max, tax.taxSplitup?.length ?? 0),
        0
      ),
    [displayedTaxes]
  );

  const totalColSpan = getTotalColSpan(maxCodes);

  const tableMinWidth = maxCodes > 0 ? `${600 + maxCodes * 180}px` : undefined;

  // ─── Stable toggle callback ───────────────────────────────────────────────
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

      <div
        className="table-container my-1"
        style={{ maxHeight: 'calc(55.5vh - 170px)', overflowX: 'auto' }}
      >
        <table
          className="custom-table"
          aria-label={showDeactivated ? 'Deactivated DineIn Taxes' : 'Active DineIn Taxes'}
          aria-busy={loading}
          style={{ minWidth: tableMinWidth }}
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
                    ? 'No deactivated DineIn taxes found'
                    : 'No active DineIn taxes found'
                }
              />
            ) : (
              displayedTaxes.map((tax, index) => (
                <TaxRow
                  key={tax.id ?? index}
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
    </>
  );
};

export default DineInTaxTableContainer;