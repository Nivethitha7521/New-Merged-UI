'use client';
import React, { useState } from 'react';
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
  IconButton, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Button,
  Box, Tooltip
} from '@mui/material';
import { EditOutlined as EditIcon,
DeleteOutlineRounded as DeleteIcon,
RestoreRounded as RefreshIcon } from '@mui/icons-material';
import { Brand } from '../Models/BrandModel';

interface BrandTableProps {
  items: Brand[];
  loading: boolean;
  handleEdit: (id: string) => void;
  handleDeactivate: (id: string) => void;
  handleActivate: (id: string) => void;
  permissions?: {
    canEdit: boolean;
    canDelete: boolean;
  };
}

const BrandTable: React.FC<BrandTableProps> = ({
  items, loading, handleEdit, handleDeactivate, handleActivate,
  permissions = { canEdit: true, canDelete: true },
}) => {
  const [openDialog, setOpenDialog] = useState(false);
  const [actionType, setActionType] = useState<'deactivate' | 'activate' | null>(null);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const { canEdit, canDelete } = permissions;

  const handleOpenDialog = (itemId: string, action: 'deactivate' | 'activate') => {
    setSelectedItemId(itemId);
    setActionType(action);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedItemId(null);
    setActionType(null);
  };

  const handleConfirmAction = () => {
    if (actionType === 'deactivate' && selectedItemId) {
      handleDeactivate(selectedItemId);
    } else if (actionType === 'activate' && selectedItemId) {
      handleActivate(selectedItemId);
    }
    handleCloseDialog();
  };

  return (
    <Box className="purchase-master-table-shell">
      <TableContainer
      className="purchase-master-table"
        component={Paper}
        sx={{
          maxHeight: 'calc(100vh - 200px)',
          overflowY: 'auto',
          width: '100%',
        }}
      >       
        <Table stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell className='table-number-right'>S.No</TableCell>
              <TableCell>Brand ID</TableCell>
              <TableCell>Brand Name</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} align="center">Loading...</TableCell>
              </TableRow>
            ) : items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center">No Brands</TableCell>
              </TableRow>
            ) : (
              items.slice().reverse().map((item, index) => (
                <TableRow key={item.brandId}>
                  <TableCell className='table-number-right'>{index + 1}</TableCell>
                 <TableCell>
  <span className="purchase-master-id-pill">
    {item.brandId}
  </span>
</TableCell>
                <TableCell>
  <Box className="purchase-master-name-cell">
    <span className="purchase-master-avatar">
      {(item.brandName || '?').charAt(0).toUpperCase()}
    </span>

    <span>{item.brandName}</span>
  </Box>
</TableCell>
                 <TableCell>
  <span
    className={`purchase-master-status-pill ${
      item.status === 'active'
        ? 'is-active'
        : 'is-inactive'
    }`}
  >
    {item.status}
  </span>
</TableCell>
                  <TableCell>
                    <Box className="purchase-master-actions">
                    {item.status === 'active' ? (
                      <>
                        <Tooltip title={!canEdit ? "No permission to edit" : "Edit Brand"}>
                          <span>
                            <IconButton 
                            className="purchase-master-action-button is-edit"

                              onClick={() => handleEdit(item.mongoId)}
                              disabled={!canEdit}
                              sx={{ opacity: canEdit ? 1 : 0.5 }}
                            >
                              <EditIcon />
                            </IconButton>
                          </span>
                        </Tooltip>
                        
                        <Tooltip title={!canDelete ? "No permission to deactivate" : "Deactivate Brand"}>
                          <span>
                            <IconButton 
                            className="purchase-master-action-button is-delete"
                              onClick={() => handleOpenDialog(item.mongoId, 'deactivate')}
                              disabled={!canDelete}
                              sx={{ opacity: canDelete ? 1 : 0.5 }}
                            >
                              <DeleteIcon />
                            </IconButton>
                          </span>
                        </Tooltip>
                      </>
                    ) : (
                      <Tooltip title={!canDelete ? "No permission to activate" : "Activate Brand"}>
                        <span>
                          <IconButton 
                          className="purchase-master-action-button is-activate"
                            onClick={() => handleOpenDialog(item.mongoId, 'activate')}
                            disabled={!canDelete}
                            sx={{ opacity: canDelete ? 1 : 0.5 }}
                          >
                            <RefreshIcon />
                          </IconButton>
                        </span>
                      </Tooltip>
                    )}
                    </Box>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={openDialog} onClose={handleCloseDialog}>
        <DialogTitle>
          {actionType === 'deactivate' ? 'Confirm Deactivation' : 'Confirm Activation'}
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            {actionType === 'deactivate'
              ? 'Are you sure you want to deactivate this brand?'
              : 'Are you sure you want to activate this brand?'}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleConfirmAction} color="primary">
            Confirm
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default BrandTable;