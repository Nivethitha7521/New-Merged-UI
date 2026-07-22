

'use client';

import React, { memo } from 'react';
import { CircularProgress } from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { RootState } from '@/redux/store';
import { useSelector } from 'react-redux';
import { UomState, getDisplayFormat } from '../Modules/Uomtypes';

// ─── Types ────────────────────────────────────────────────────────────────────

interface UomTableProps {
  displayedUoms: UomState[];
  showDeactivated: boolean;
  isSubmitting: boolean;
  handleEdit: (id: string) => void;
  handleDeactivate: (id: string) => void;
  handleActivate: (id: string) => void;
}

// ─── Sub-components (stable, defined outside parent) ──────────────────────────

/** Renders the action cell for a single row — memoised to avoid re-renders. */
const RowActions = memo(
  ({
    id,
    showDeactivated,
    handleEdit,
    handleDeactivate,
    handleActivate,
    canEdit,
  }: {
    id: string;
    showDeactivated: boolean;
    handleEdit: (id: string) => void;
    handleDeactivate: (id: string) => void;
    handleActivate: (id: string) => void;
    canEdit: boolean;
  }) => {
    if (showDeactivated) {
      return (
        <button onClick={() => handleActivate(id)} className="activate-btn" title="Activate">
          <RefreshIcon />
        </button>
      );
    }
    // editStatus === true → editable; original code had `!uom.editStatus === false`
    // which is always true. Correct logic: show buttons only when editStatus is true.
    if (!canEdit) return null;
    return (
      <>
        <button onClick={() => handleEdit(id)} className="edit-btn" title="Edit">
          <EditIcon />
        </button>
        <button onClick={() => handleDeactivate(id)} className="deactivate-btns" title="Deactivate">
          <DeleteIcon />
        </button>
      </>
    );
  },
);
RowActions.displayName = 'RowActions';

// ─── Empty state messages (constant — no JSX allocation per render) ───────────

const EMPTY_ACTIVE = (
  <tr>
    <td colSpan={7} style={{ textAlign: 'center' }}>
      <h2>No active UOMs found</h2>
    </td>
  </tr>
);

const EMPTY_DEACTIVATED = (
  <tr>
    <td colSpan={7} style={{ textAlign: 'center' }}>
      <h2>No deactivated UOMs found</h2>
    </td>
  </tr>
);

// ─── Component ────────────────────────────────────────────────────────────────

const UomTable: React.FC<UomTableProps> = ({
  displayedUoms,
  showDeactivated,
  isSubmitting,
  handleEdit,
  handleDeactivate,
  handleActivate,
}) => {
  const { loading } = useSelector((state: RootState) => state.uoms);

  if (isSubmitting) {
    return (
      <div className="flex justify-center mt-4">
        <CircularProgress />
      </div>
    );
  }

  return (
    <div className="table-container" style={{ maxHeight: 'calc(95vh - 170px)' }}>
      <table className="custom-tables">
        <thead>
          <tr>
            <th>S.NO</th>
            <th>UOM ID</th>
            <th>Measurement Type</th>
            <th>UOM</th>
            <th>Precision</th>
            <th>Display Format</th>
            <th>Actions</th>
          </tr>
        </thead>

        <tbody>
          {loading ? (
            <tr>
              <td colSpan={7} style={{ textAlign: 'center' }}>
                <h3 style={{ fontWeight: 'bold' }}>Loading...</h3>
              </td>
            </tr>
          ) : displayedUoms.length === 0 ? (
            showDeactivated ? EMPTY_DEACTIVATED : EMPTY_ACTIVE
          ) : (
            displayedUoms.map((uom, index) => (
              <tr key={uom.id ?? index}>
                <td style={{ textAlign: 'center' }}>{index + 1}</td>
                <td style={{ textAlign: 'center' }}>{uom.uomId ?? 'N/A'}</td>
                <td style={{ textAlign: 'center' }}>{uom.measurementType ?? 'N/A'}</td>
                <td style={{ textAlign: 'center' }}>{uom.uom ?? 'N/A'}</td>
                <td style={{ textAlign: 'center' }}>{uom.precision ?? 'N/A'}</td>
                <td style={{ textAlign: 'center' }}>{getDisplayFormat(uom.precision)}</td>
                <td style={{ textAlign: 'center' }}>
                  <RowActions
                    id={uom.id!}
                    showDeactivated={showDeactivated}
                    handleEdit={handleEdit}
                    handleDeactivate={handleDeactivate}
                    handleActivate={handleActivate}
                    canEdit={uom.editStatus}
                  />
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default memo(UomTable);