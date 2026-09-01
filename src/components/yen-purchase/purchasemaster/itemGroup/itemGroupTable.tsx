'use client';
import React, { useState } from 'react';
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
  IconButton, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Button,
  Box,
  Tooltip // ✅ ADD TOOLTIP
} from '@mui/material';
import { EditOutlined as EditIcon,
DeleteOutlineRounded as DeleteIcon,
RestoreRounded as RefreshIcon } from '@mui/icons-material';
import { PurchaseGroupItem } from '@/Models/itemgroup';

interface ItemGroupTableProps {
  items: PurchaseGroupItem[];
  loading: boolean;
  handleEdit: (id: string) => void;
  handleDeactivate: (id: string) => void;
  handleActivate: (id: string) => void;
  permissions?: { // ✅ ADD PERMISSIONS PROP
    canEdit: boolean;
    canDelete: boolean;
  }; // ✅ MISSING CLOSING BRACE AND SEMICOLON
}

const ItemGroupTable: React.FC<ItemGroupTableProps> = ({
  items, loading, handleEdit, handleDeactivate, handleActivate,
  permissions = { // ✅ DEFAULT PERMISSIONS
    canEdit: true,
    canDelete: true
  },
}) => {
  const [openDialog, setOpenDialog] = useState(false);
  const [actionType, setActionType] = useState<'deactivate' | 'activate' | null>(null);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);

  // ✅ DESTRUCTURE PERMISSIONS
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
          maxHeight: 'calc(100vh - 200px)', // Dynamic height based on viewport
          overflowY: 'auto',
          width: '100%',
        }}
      >       
        <Table stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell className='table-number-right'>S.No</TableCell>
              <TableCell>Item Group ID</TableCell>
              <TableCell>Item Group</TableCell>
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
                <TableCell colSpan={5} align="center">No Item Group</TableCell>
              </TableRow>
            ) : (
              // Reverse the items to make it Last-In-First-Out
              items.slice().reverse().map((item, index) => (
                <TableRow key={item.randomId}>
                  <TableCell className='table-number-right'>{index + 1}</TableCell>
                 <TableCell>
  <span className="purchase-master-id-pill">
    {item.randomId}
  </span>
</TableCell>
                 <TableCell>
  <Box className="purchase-master-name-cell">
    <span className="purchase-master-avatar">
      {(item.itemgroupName || '?').charAt(0).toUpperCase()}
    </span>

    <span>{item.itemgroupName}</span>
  </Box>
</TableCell>
                 <TableCell>
  <Box className="purchase-master-name-cell">
    <span className="purchase-master-avatar">
      {(item.itemgroupName || '?').charAt(0).toUpperCase()}
    </span>

    <span>{item.itemgroupName}</span>
  </Box>
</TableCell>
                  <TableCell>
                    <Box className="purchase-master-actions">
                    {item.status === 'active' ? (
                      <>
                        {/* Edit Button with Permission */}
                        <Tooltip title={!canEdit ? "No permission to edit" : "Edit Item Group"}>
                          <span>
                            <IconButton 
                            className="purchase-master-action-button is-edit"
                              onClick={() => handleEdit(item.itemgroupId)}
                              disabled={!canEdit}
                              sx={{ 
                                opacity: canEdit ? 1 : 0.5,
                                '&.Mui-disabled': {
                                  opacity: 0.5,
                                  color: 'grey.500'
                                }
                              }}
                            >
                              <EditIcon />
                            </IconButton>
                          </span>
                        </Tooltip>
                        
                        {/* Deactivate Button with Permission */}
                        <Tooltip title={!canDelete ? "No permission to deactivate" : "Deactivate Item Group"}>
                          <span>
                            <IconButton 
                            className="purchase-master-action-button is-delete"
                              onClick={() => handleOpenDialog(item.itemgroupId, 'deactivate')}
                              disabled={!canDelete}
                              sx={{ 
                                opacity: canDelete ? 1 : 0.5,
                                '&.Mui-disabled': {
                                  opacity: 0.5,
                                  color: 'grey.500'
                                }
                              }}
                            >
                              <DeleteIcon />
                            </IconButton>
                          </span>
                        </Tooltip>
                      </>
                    ) : (
                      /* Activate Button with Permission */
                      <Tooltip title={!canDelete ? "No permission to activate" : "Activate Item Group"}>
                        <span>
                          <IconButton 
                          className="purchase-master-action-button is-activate"
                            onClick={() => handleOpenDialog(item.itemgroupId, 'activate')}
                            disabled={!canDelete}
                            sx={{ 
                              opacity: canDelete ? 1 : 0.5,
                              '&.Mui-disabled': {
                                opacity: 0.5,
                                color: 'grey.500'
                              }
                            }}
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

      {/* Confirmation Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog}>
        <DialogTitle>
          {actionType === 'deactivate' ? 'Confirm Deactivation' : 'Confirm Activation'}
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            {actionType === 'deactivate'
              ? 'Are you sure you want to deactivate this item group?'
              : 'Are you sure you want to activate this item group?'}
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

export default ItemGroupTable;