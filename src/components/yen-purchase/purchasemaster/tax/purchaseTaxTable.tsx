'use client';
import React, { useState } from 'react';
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
  IconButton, Tooltip,Box
} from '@mui/material';
import { EditOutlined as EditIcon,
DeleteOutlineRounded as DeleteIcon,
RestoreRounded as RefreshIcon } from '@mui/icons-material';
import ConfirmationDialog from '@/components/confirmationDialog';
import { PurchaseTax } from '@/Models/purchasetax';

interface PurchaseTaxTableProps {
  purchaseTaxes: PurchaseTax[];
  showDeactivated: boolean;
  searchQuery: string;
  handleEdit: (id: string) => void;
  handleDeactivate: (purchasetaxId: string) => void;
  handleActivate: (purchasetaxId: string) => void;
   canEdit?: boolean;
  canDelete?: boolean;
}

const PurchaseTaxTable: React.FC<PurchaseTaxTableProps> = ({
  purchaseTaxes, showDeactivated, searchQuery, handleEdit, handleDeactivate, handleActivate, canEdit = true, canDelete = true, 
}) => {
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogAction, setDialogAction] = useState<'deactivate' | 'activate' | null>(null);
  const [selectedTaxId, setSelectedTaxId] = useState<string | null>(null);

  const handleOpenDialog = (action: 'deactivate' | 'activate', taxId: string) => {
    setSelectedTaxId(taxId);
    setDialogAction(action);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedTaxId(null);
    setDialogAction(null);
  };

  const handleConfirmAction = () => {
    if (selectedTaxId && dialogAction) {
      if (dialogAction === 'deactivate') {
        handleDeactivate(selectedTaxId);
      } else {
        handleActivate(selectedTaxId);
      }
    }
    handleCloseDialog();
  };

  const filteredPurchaseTaxes = purchaseTaxes
  .filter((tax) => {
    // Skip if tax is null or undefined
    if (!tax) return false;
    
    // Filter by status if showDeactivated is false
    if (!showDeactivated && tax.status !== 'active') return false;
    
    // Filter by search query if provided
    if (searchQuery) {
      return tax.purchasetaxName?.toLowerCase().includes(searchQuery.toLowerCase());
    }
    
    return true;
  })
  .reverse();
  return (
    <>
    <Box className="purchase-master-table-shell">
  <TableContainer
        component={Paper}
         className="purchase-master-table"
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
              <TableCell>Tax ID</TableCell>
              <TableCell>Tax Name</TableCell>
              <TableCell className='table-number-right'>Tax Percentage</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredPurchaseTaxes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  No Tax Data
                </TableCell>
              </TableRow>
            ) : (
              filteredPurchaseTaxes.map((tax, index) => (
                <TableRow key={tax.purchasetaxId}>
                  <TableCell className='table-number-right'>{index + 1}</TableCell>
                 <TableCell>
  <span className="purchase-master-id-pill">
    {tax.randomId}
  </span>
</TableCell>
                 <TableCell>
  <Box className="purchase-master-name-cell">
    <span className="purchase-master-avatar">
      {(tax.purchasetaxName || '?').charAt(0).toUpperCase()}
    </span>

    <span>{tax.purchasetaxName}</span>
  </Box>
</TableCell>
                 <TableCell className="table-number-right">
  <span className="purchase-master-value-pill">
    {tax.purchasetaxPercentage}%
  </span>
</TableCell>
                 <TableCell>
  <span
    className={`purchase-master-status-pill ${
      tax.status === 'active'
        ? 'is-active'
        : 'is-inactive'
    }`}
  >
    {tax.status}
  </span>
</TableCell>
                  <TableCell>
                    <Box className="purchase-master-actions">
                    {tax.status === 'active' ? (
                      <>
                       <IconButton
                       className="purchase-master-action-button is-edit"

                          onClick={() => handleEdit(tax.purchasetaxId)}
                          disabled={!canEdit} // ✅ ADD PERMISSION CHECK
                          sx={{
                            opacity: canEdit ? 1 : 0.5,
                            "&.Mui-disabled": {
                              opacity: 0.5,
                              color: "grey.500",
                            },
                          }}
                        >
                          <EditIcon />
                        </IconButton>
                       <IconButton
                       className="purchase-master-action-button is-delete"

                          onClick={() =>
                            handleOpenDialog("deactivate", tax.purchasetaxId)
                          }
                          disabled={!canDelete} // ✅ ADD PERMISSION CHECK
                          sx={{
                            opacity: canDelete ? 1 : 0.5,
                            "&.Mui-disabled": {
                              opacity: 0.5,
                              color: "grey.500",
                            },
                          }}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </>
                    ) : (
                      <IconButton
                      className="purchase-master-action-button is-activate"

                        onClick={() =>
                          handleOpenDialog("activate", tax.purchasetaxId)
                        }
                        disabled={!canDelete} // ✅ ADD PERMISSION CHECK
                        sx={{
                          opacity: canDelete ? 1 : 0.5,
                          "&.Mui-disabled": {
                            opacity: 0.5,
                            color: "grey.500",
                          },
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
</Box>
      <ConfirmationDialog
  open={openDialog}
  onClose={handleCloseDialog}
  onConfirm={handleConfirmAction}
  title={dialogAction === 'deactivate' ? 'Confirm Deactivation' : 'Confirm Activation'}
  description={
    dialogAction === 'deactivate'
      ? 'Are you sure you want to deactivate this purchase tax?'
      : 'Are you sure you want to activate this purchase tax?'
  }
  confirmText={dialogAction === 'deactivate' ? 'Deactivate' : 'Activate'}
  cancelText="Cancel"
/>

    </>
  );
};

export default PurchaseTaxTable;
