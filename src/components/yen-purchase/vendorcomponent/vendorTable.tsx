'use client';
import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  TableContainer,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Paper,
  IconButton,
  Box,
} from '@mui/material';
import {
  EditOutlined as EditIcon,
  DeleteOutlineRounded as DeleteIcon,
  RestoreRounded as RefreshIcon,
} from '@mui/icons-material';import { format } from 'date-fns';
import {
  setEditIndex,
  setVendorData,
  fetchVendors,
  setDialogOpen,
  setItemToDeactivate,
  setDeactivateDialogOpen,
  setItemToActivate,
  setActivateDialogOpen,
} from '../../../features/yen-purchase/PurchaseMaster/vendorSlice';
import { AppDispatch, RootState } from '@/redux/store';
import { Vendor } from '@/Models/vendor';
import VendorActivateDialog from './vendorActivate';
import VendorDeactivateDialog from './vendorDeactivate';

interface VendorTableProps {
  items: Vendor[];
  deactivatedItems: Vendor[];
  showDeactivated: boolean;
  loading: boolean;
  currentPage: number;
  pageSize: number;
   canEdit: boolean; // ✅ ADD PERMISSION PROP
  canDelete: boolean; // ✅ ADD PERMISSION PROP
}

const headerNameMap: Record<string, string> = {
  vendorId: 'S.No',
  randomId: 'Vendor ID',
  vendorName: 'Vendor Name',
  contactpersonName: 'Contact Person',
  contactpersonPhone: 'Phone',
  contactpersonEmail: 'Email',
  city: 'City',
  country: 'Country',
  createdDate: 'Created Date',
  updatedDate: 'Updated Date',
};

const VendorTable: React.FC<VendorTableProps> = ({
  items,
  deactivatedItems,
  showDeactivated,
  loading,
  currentPage,
  pageSize,
   canEdit, // ✅ RECEIVE PERMISSIONS
  canDelete // ✅ RECEIVE PERMISSIONS
}) => {
  const dispatch = useDispatch<AppDispatch>();
  const selectedHeaders = useSelector((state: RootState) => state.vendor.selectedHeaders);

  const handleEdit = (index: number) => {
      if (canEdit) { 
    dispatch(setEditIndex(index));
    dispatch(setVendorData(items[index]));
    dispatch(setDialogOpen('edit'));
      }
  };

  const handleActivateClick = (vendor: Vendor) => {
     if (canDelete) { 
    dispatch(setItemToActivate(vendor));
    dispatch(setActivateDialogOpen(true));
     }
  };

  const handleDeactivateClick = (vendor: Vendor) => {
    if (canDelete) { 
    dispatch(setItemToDeactivate(vendor));
    dispatch(setDeactivateDialogOpen(true));
    }
  };

  const currentData = showDeactivated ? deactivatedItems : items;

return (
  <Box className="purchase-master-table-shell vendor-table-shell">
    <TableContainer
      component={Paper}
      className="purchase-master-table vendor-master-table"
        sx={{
          maxHeight: 'calc(100vh - 210px)',
          overflowY: 'auto',
          width: '100%',
        }}
      >
        <Table stickyHeader>
          <TableHead>
            <TableRow>
              {selectedHeaders.includes('vendorId') && <TableCell className='table-number-right' sx={{ width: '60px' }}>{headerNameMap['vendorId']}</TableCell>}
              {selectedHeaders.includes('randomId') && <TableCell sx={{ width: '120px' }}>{headerNameMap['randomId']}</TableCell>}
              {selectedHeaders.includes('vendorName') && <TableCell sx={{ width: '200px' }}>{headerNameMap['vendorName']}</TableCell>}
              {selectedHeaders.includes('contactpersonName') && (
                <TableCell sx={{ width: '150px' }}>{headerNameMap['contactpersonName']}</TableCell>
              )}
              {selectedHeaders.includes('contactpersonPhone') && (
                <TableCell  sx={{ width: '100px' }}>{headerNameMap['contactpersonPhone']}</TableCell>
              )}
              {selectedHeaders.includes('contactpersonEmail') && (
                <TableCell sx={{ width: '200px' }}>{headerNameMap['contactpersonEmail']}</TableCell>
              )}
              {selectedHeaders.includes('city') && <TableCell sx={{ width: '120px' }}>{headerNameMap['city']}</TableCell>}
              {selectedHeaders.includes('country') && <TableCell sx={{ width: '120px' }}>{headerNameMap['country']}</TableCell>}
              {selectedHeaders.includes('createdDate') && (
                <TableCell sx={{ width: '120px' }}>{headerNameMap['createdDate']}</TableCell>
              )}
              {selectedHeaders.includes('updatedDate') && (
                <TableCell sx={{ width: '120px' }}>{headerNameMap['updatedDate']}</TableCell>
              )}
              <TableCell sx={{ width: '120px' }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell
  colSpan={selectedHeaders.length + 1}
  align="center"
  className="purchase-master-empty-cell"
>
  Loading...
</TableCell>
              </TableRow>
            ) : currentData.length === 0 ? (
              <TableRow>
               <TableCell
  colSpan={selectedHeaders.length + 1}
  align="center"
  className="purchase-master-empty-cell"
>
  No Vendor Found
</TableCell>
              </TableRow>
            ) : (
              currentData.map((vendor, index) => {
                const globalIndex = (currentPage - 1) * pageSize + index + 1;
                const rowKey = vendor.vendorId ?? `vendor-${index}-${vendor.randomId ?? globalIndex}`;
                return (
                  <TableRow key={rowKey}>
                    {selectedHeaders.includes('vendorId') && <TableCell className='table-number-right' sx={{ width: '60px' }}>{globalIndex}</TableCell>}
                    {selectedHeaders.includes('randomId') && (
  <TableCell
    sx={{
      width: '120px',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
    }}
  >
    <span className="purchase-master-id-pill">
      {vendor.randomId || '-'}
    </span>
  </TableCell>
)}
                    {selectedHeaders.includes('vendorName') && (
  <TableCell
    sx={{
      width: '200px',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
    }}
  >
    <Box className="purchase-master-name-cell">
      <span className="purchase-master-avatar">
        {(vendor.vendorName || '?').charAt(0).toUpperCase()}
      </span>

      <span>{vendor.vendorName || '-'}</span>
    </Box>
  </TableCell>
)}
                    {selectedHeaders.includes('contactpersonName') && (
                      <TableCell sx={{ width: '150px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {vendor.contactpersonName}
                      </TableCell>
                    )}
                    {selectedHeaders.includes('contactpersonPhone') && (
                      <TableCell sx={{ width: '100px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {vendor.contactpersonPhone}
                      </TableCell>
                    )}
                    {selectedHeaders.includes('contactpersonEmail') && (
                      <TableCell sx={{ width: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {vendor.contactpersonEmail}
                      </TableCell>
                    )}
                    {selectedHeaders.includes('city') && (
                      <TableCell sx={{ width: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {vendor.city}
                      </TableCell>
                    )}
                    {selectedHeaders.includes('country') && (
                      <TableCell sx={{ width: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {vendor.country}
                      </TableCell>
                    )}
                    {selectedHeaders.includes('createdDate') && (
                      <TableCell sx={{ width: '120px' }}>
                        {vendor.createdDate ? format(new Date(vendor.createdDate), 'dd-MM-yyyy') : ''}
                      </TableCell>
                    )}
                    {selectedHeaders.includes('updatedDate') && (
                      <TableCell sx={{ width: '120px' }}>
                        {vendor.updatedDate ? format(new Date(vendor.updatedDate), 'dd-MM-yyyy') : ''}
                      </TableCell>
                    )}
                   <TableCell sx={{ width: '120px' }}>
  <Box className="purchase-master-actions">
    {showDeactivated ? (
      <IconButton
        type="button"
        onClick={() => handleActivateClick(vendor)}
        className="purchase-master-action-button is-activate"
        aria-label="Activate vendor"
        title="Activate vendor"
      >
        <RefreshIcon fontSize="small" />
      </IconButton>
    ) : (
      <>
        <IconButton
          type="button"
          onClick={() => handleEdit(index)}
          disabled={!canEdit}
          className="purchase-master-action-button is-edit"
          aria-label="Edit vendor"
          title="Edit vendor"
        >
          <EditIcon fontSize="small" />
        </IconButton>

        <IconButton
          type="button"
          onClick={() => handleDeactivateClick(vendor)}
          disabled={!canDelete}
          className="purchase-master-action-button is-delete"
          aria-label="Deactivate vendor"
          title="Deactivate vendor"
        >
          <DeleteIcon fontSize="small" />
        </IconButton>
      </>
    )}
  </Box>
</TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>
      <VendorDeactivateDialog canDelete={canDelete} />
      <VendorActivateDialog canDelete={canDelete} />
    </Box>
  );
};

export default VendorTable;