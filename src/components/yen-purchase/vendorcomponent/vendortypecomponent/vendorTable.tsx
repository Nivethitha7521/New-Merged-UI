'use client';
import React, { useState } from 'react';
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, IconButton,
  Box
} from '@mui/material';
import {
  RestoreRounded as RefreshIcon,
  DeleteOutlineRounded as DeleteIcon,
  EditOutlined as EditIcon,
} from '@mui/icons-material';import ConfirmationDialog from '../../../confirmationDialog';

interface VendorType {
  vendortypeId: string;
  vendorType: string;
  status: string;
  randomId: string;
}

interface VendorTableProps {
  vendorTypes: VendorType[];
  onEdit: (vendortypeId: string) => void;
  onDeactivate: (id: string) => void;
  onActivate: (id: string) => void;
  canEdit: boolean; // ✅ ADD PERMISSION PROP
  canDelete: boolean;
}

const VendorTable: React.FC<VendorTableProps> = ({ 
  vendorTypes, 
  onEdit, 
  onDeactivate, 
  onActivate,
  canEdit, // ✅ RECEIVE PERMISSION PROP
  canDelete
}) => {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<'deactivate' | 'activate' | null>(null);
  const [selectedVendorTypeId, setSelectedVendorTypeId] = useState<string | null>(null);

  const handleConfirmOpen = (action: 'deactivate' | 'activate', vendortypeId: string) => {
     if (!canDelete) {
      return;
    }
    setConfirmAction(action);
    setSelectedVendorTypeId(vendortypeId);
    setConfirmOpen(true);
  };

  const handleConfirmClose = () => {
    setConfirmOpen(false);
    setSelectedVendorTypeId(null);
  };

  const handleConfirmAction = () => {
    if (confirmAction === 'deactivate' && selectedVendorTypeId) {
      onDeactivate(selectedVendorTypeId);
    } else if (confirmAction === 'activate' && selectedVendorTypeId) {
      onActivate(selectedVendorTypeId);
    }
    handleConfirmClose();
  };

return (
  <Box className="purchase-master-table-shell vendor-type-table-shell">
    <TableContainer
      component={Paper}
      className="purchase-master-table vendor-type-master-table"
        sx={{
          maxHeight: 'calc(100vh - 200px)', // Dynamic height based on viewport
          overflowY: 'auto',
        }}
      >
        <Table
          stickyHeader >
          <TableHead>
            <TableRow>
              <TableCell className='table-number-right'>S.No</TableCell>
              <TableCell>Vendor Type ID</TableCell>
              <TableCell>Vendor Type</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {vendorTypes.length === 0 ? (
              <TableRow>
              <TableCell
  colSpan={5}
  align="center"
  className="purchase-master-empty-cell"
>
  No Vendor Type Data
</TableCell>
              </TableRow>
            ) : (
              vendorTypes.map((vendorType, index) => (
<TableRow key={vendorType.randomId}>
  <TableCell className="table-number-right">
    {index + 1}
  </TableCell>

  <TableCell>
    <span className="purchase-master-id-pill">
      {vendorType.randomId || '-'}
    </span>
  </TableCell>

  <TableCell>
    <Box className="purchase-master-name-cell">
      <span className="purchase-master-avatar">
        {(vendorType.vendorType || '?')
          .charAt(0)
          .toUpperCase()}
      </span>

      <span>{vendorType.vendorType || '-'}</span>
    </Box>
  </TableCell>

  <TableCell>
    <span
      className={`purchase-master-status-pill ${
        vendorType.status === 'active'
          ? 'is-active'
          : 'is-inactive'
      }`}
    >
      {vendorType.status}
    </span>
  </TableCell>

  <TableCell>
    <Box className="purchase-master-actions">
      {vendorType.status === 'active' ? (
        <>
          <IconButton
            type="button"
            onClick={() =>
              onEdit(vendorType.vendortypeId)
            }
            disabled={!canEdit}
            className="purchase-master-action-button is-edit"
            aria-label="Edit vendor type"
            title="Edit vendor type"
          >
            <EditIcon fontSize="small" />
          </IconButton>

          <IconButton
            type="button"
            onClick={() =>
              handleConfirmOpen(
                'deactivate',
                vendorType.vendortypeId,
              )
            }
            disabled={!canDelete}
            className="purchase-master-action-button is-delete"
            aria-label="Deactivate vendor type"
            title="Deactivate vendor type"
          >
            <DeleteIcon fontSize="small" />
          </IconButton>
        </>
      ) : (
        <IconButton
          type="button"
          onClick={() =>
            handleConfirmOpen(
              'activate',
              vendorType.vendortypeId,
            )
          }
          disabled={!canDelete}
          className="purchase-master-action-button is-activate"
          aria-label="Activate vendor type"
          title="Activate vendor type"
        >
          <RefreshIcon fontSize="small" />
        </IconButton>
      )}
    </Box>
  </TableCell>
</TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Confirmation Dialog */}
      <ConfirmationDialog
        open={confirmOpen}
        onClose={handleConfirmClose}
        onConfirm={handleConfirmAction}
        title={confirmAction === 'deactivate' ? 'Confirm Deactivation' : 'Confirm Activation'}
        description={
          confirmAction === 'deactivate'
            ? 'Are you sure you want to deactivate this vendor type?'
            : 'Are you sure you want to activate this vendor type?'
        }
        confirmText={'Confirm'}
        cancelText={'Cancel'}
      />
    </Box>
  );
};

export default VendorTable;