'use client';
import React, { useState } from 'react';
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
  IconButton,Box
} from '@mui/material';
import { EditOutlined as EditIcon,
DeleteOutlineRounded as DeleteIcon,
RestoreRounded as RefreshIcon } from '@mui/icons-material';
import ConfirmationDialog from '@/components/confirmationDialog';
import { StorageLocationItem } from '@/Models/storagelocation';

interface StorageLocationTableProps {
  items: StorageLocationItem[];
  handleEdit: (index: string) => void;
  handleDeactivate: (id: string) => void;
  handleActivate: (id: string) => void;
   canEdit: boolean; // ✅ ADD PERMISSION PROP
  canDelete: boolean; // ✅ ADD PERMISSION PROP
}

const StorageLocationTable: React.FC<StorageLocationTableProps> = ({
  items, handleEdit, handleDeactivate, handleActivate,canEdit, // ✅ ADD THIS - DESTRUCTURE THE PROP
  canDelete // ✅ ADD THIS - DESTRUCTURE THE PROP
}) => {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<'deactivate' | 'activate' | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const handleOpenDialog = (action: 'deactivate' | 'activate', id: string) => {
        if ((action === 'deactivate' && !canDelete) || (action === 'activate' && !canDelete)) {
      return; // ✅ PREVENT OPENING DIALOG IF NO PERMISSION
}
    setConfirmAction(action);
    setSelectedId(id);
    setConfirmOpen(true);  // Open dialog
  };

  const handleCloseDialog: () => void = () => {
    setConfirmOpen(false); // Close dialog
    setConfirmAction(null);
    setSelectedId(null);
  };

  const handleConfirmAction = () => {
    if (confirmAction === 'deactivate' && selectedId) {
      handleDeactivate(selectedId);
    } else if (confirmAction === 'activate' && selectedId) {
      handleActivate(selectedId);
    }
    handleCloseDialog();
  };

  return (
    <Box className="purchase-master-table-shell">
      <TableContainer
      className="purchase-master-table"
        component={Paper}
        sx={{
          maxHeight: 'calc(100vh - 200px)', // Dynamic height based on viewport
          overflowY: 'auto',
          width: '100%',
        }}
      >
        <Table
          stickyHeader
          sx={{
            tableLayout: 'fixed', // Fixes column widths to prevent overflow
            width: '100%',
          }}
        >
          <TableHead>
            <TableRow>
              <TableCell>S.No</TableCell>
              <TableCell>Location Id</TableCell>
              <TableCell>Location Name</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align='center'>
                  No Storage Location Data
                </TableCell>
              </TableRow>
            ) : (
              items.map((loc, index) => (
                <TableRow key={loc.storageLocationId}>
                 <TableCell className="table-number-right">
  {index + 1}
</TableCell>
                  <TableCell>
  <span className="purchase-master-id-pill">
    {loc.randomId}
  </span>
</TableCell>
                 <TableCell>
  <Box className="purchase-master-name-cell">
    <span className="purchase-master-avatar">
      {(loc.locationName || '?').charAt(0).toUpperCase()}
    </span>

    <span>{loc.locationName}</span>
  </Box>
</TableCell>
                 <TableCell>
  <span
    className={`purchase-master-status-pill ${
      loc.status === 'active'
        ? 'is-active'
        : 'is-inactive'
    }`}
  >
    {loc.status}
  </span>
</TableCell>
                  <TableCell>
                    <Box className="purchase-master-actions">
                    {loc.status === 'active' ? (
                      <>
                        <IconButton 
                        className="purchase-master-action-button is-edit"
                          onClick={() => handleEdit(loc.storageLocationId)}
                          disabled={!canEdit}
                          sx={{ 
                            opacity: canEdit ? 1 : 0.5,
                            '&.Mui-disabled': {
                              opacity: 0.5,
                              color: 'text.disabled'
                            }
                          }}
                        >
                          <EditIcon />
                        </IconButton>
                        
                         <IconButton 
                         className="purchase-master-action-button is-delete"
                          onClick={() => handleOpenDialog('deactivate', loc.storageLocationId)}
                          disabled={!canDelete}
                          sx={{ 
                            opacity: canDelete ? 1 : 0.5,
                            '&.Mui-disabled': {
                              opacity: 0.5,
                              color: 'text.disabled'
                            }
                          }}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </>
                    ) : (
                      <IconButton 
                      className="purchase-master-action-button is-activate"
                        onClick={() => handleOpenDialog('activate', loc.storageLocationId)}
                        disabled={!canDelete}
                        sx={{ 
                          opacity: canDelete ? 1 : 0.5,
                          '&.Mui-disabled': {
                            opacity: 0.5,
                            color: 'text.disabled'
                          }
                        }}
                      >
                        <RefreshIcon />
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

      <ConfirmationDialog
        open={confirmOpen}
        onClose={handleCloseDialog}
        onConfirm={handleConfirmAction}
        title={confirmAction === 'deactivate' ? 'Confirm Deactivation' : 'Confirm Activation'}
        description={
          confirmAction === 'deactivate'
            ? 'Are you sure you want to deactivate this storage location?'
            : 'Are you sure you want to activate this storage location?'
        }
        confirmText={confirmAction === 'deactivate' ? 'Deactivate' : 'Activate'}
        cancelText="Cancel"
      />

    </Box>
  );
};

export default StorageLocationTable;
