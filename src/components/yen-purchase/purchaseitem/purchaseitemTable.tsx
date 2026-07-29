'use client';

import React from 'react';
import {
  Box,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
} from '@mui/material';

import {
  DeleteOutlineRounded as DeleteIcon,
  EditOutlined as EditIcon,
  RestoreRounded as RefreshIcon,
} from '@mui/icons-material';

import { format } from 'date-fns';

interface PurchaseTableProps {
  items: any[];
  loading: boolean;
  showDeactivated: boolean;
  handleEdit: (index: number) => void;
  handleDeactivate: (item: any) => void;
  handleActivate: (item: any) => void;
  canEdit: boolean;
  canDelete: boolean;
}

const PurchaseTable: React.FC<PurchaseTableProps> = ({
  items,
  loading,
  showDeactivated,
  handleEdit,
  handleDeactivate,
  handleActivate,
  canEdit,
  canDelete,
}) => {
  return (
    <Box className="purchase-master-table-shell purchase-item-table-shell">
      <TableContainer
        component={Paper}
        className="purchase-master-table purchase-item-table"
        sx={{
          maxHeight: 'calc(100vh - 430px)',
          overflowY: 'auto',
          width: '100%',
        }}
      >
        <Table stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell className="table-number-right">S.No</TableCell>
              <TableCell>Item Code</TableCell>
              <TableCell>Item ID</TableCell>
              <TableCell>Item Name</TableCell>
              <TableCell>Category</TableCell>
              <TableCell>Subcategory</TableCell>
              <TableCell>Item Group</TableCell>
              <TableCell className="table-number-right">
                Purchase Price
              </TableCell>
              <TableCell className="table-number-right">
                Reorder Level
              </TableCell>
              <TableCell className="table-number-right">
                Target Stock Level
              </TableCell>
              <TableCell>Created Date</TableCell>
              <TableCell>Last Updated Date</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell
                  colSpan={14}
                  align="center"
                  className="purchase-reference-empty-cell"
                >
                  Loading...
                </TableCell>
              </TableRow>
            ) : items.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={14}
                  align="center"
                  className="purchase-reference-empty-cell"
                >
                  No items found.
                </TableCell>
              </TableRow>
            ) : (
              items.map((item, index) => (
                <TableRow key={item.purchaseitemId || index}>
                  {/* Serial number */}
                  <TableCell className="table-number-right">
                    {index + 1}
                  </TableCell>

                  {/* Item code pill */}
                  <TableCell>
                    <span className="purchase-reference-id-pill">
                      {item.itemCode || '-'}
                    </span>
                  </TableCell>

                  {/* Item ID pill */}
                  <TableCell>
                    <span className="purchase-reference-id-pill">
                      {item.randomId || '-'}
                    </span>
                  </TableCell>

                  {/* Item name with avatar */}
                  <TableCell>
                    <Box className="purchase-reference-name-cell">
                      <span className="purchase-reference-avatar">
                        {(item.itemName || '?').charAt(0).toUpperCase()}
                      </span>

                      <span>{item.itemName || 'N/A'}</span>
                    </Box>
                  </TableCell>

                  <TableCell>
                    {item.purchasecategoryName || 'N/A'}
                  </TableCell>

                  <TableCell>
                    {item.purchasesubcategoryName || 'N/A'}
                  </TableCell>

                  <TableCell>
                    {item.itemgroupName || 'N/A'}
                  </TableCell>

                  <TableCell className="table-number-right">
                    {item.purchasePrice !== null &&
                    item.purchasePrice !== undefined
                      ? item.purchasePrice
                      : 'N/A'}
                  </TableCell>

                  <TableCell className="table-number-right">
                    {item.reorderLevel ?? 'N/A'}
                  </TableCell>

                  <TableCell className="table-number-right">
                    {item.targetStockLevel ?? 'N/A'}
                  </TableCell>

                  <TableCell>
                    {item.createdDate
                      ? format(item.createdDate, 'dd-MM-yyyy')
                      : '-'}
                  </TableCell>

                  <TableCell>
                    {item.lastUpdatedDate
                      ? format(item.lastUpdatedDate, 'dd-MM-yyyy')
                      : '-'}
                  </TableCell>

                  {/* Status pill */}
                  <TableCell>
                    <span
                      className={`purchase-reference-status-pill ${
                        item.status === 'deactivated'
                          ? 'is-inactive'
                          : 'is-active'
                      }`}
                    >
                      <span />

                      {item.status === 'deactivated'
                        ? 'Inactive'
                        : 'Active'}
                    </span>
                  </TableCell>

                  {/* Actions */}
                  <TableCell>
                    <Box className="purchase-reference-actions-cell">
                      {!showDeactivated ? (
                        <>
                          <Tooltip
                            title={
                              canEdit
                                ? 'Edit item'
                                : 'No edit permission'
                            }
                            arrow
                          >
                            <span>
                              <IconButton
                                type="button"
                                onClick={() => handleEdit(index)}
                                disabled={!canEdit}
                                className="purchase-reference-action-button-cell is-edit"
                                aria-label="Edit purchase item"
                              >
                                <EditIcon fontSize="small" />
                              </IconButton>
                            </span>
                          </Tooltip>

                          <Tooltip
                            title={
                              canDelete
                                ? 'Deactivate item'
                                : 'No delete permission'
                            }
                            arrow
                          >
                            <span>
                              <IconButton
                                type="button"
                                onClick={() => handleDeactivate(item)}
                                disabled={!canDelete}
                                className="purchase-reference-action-button-cell is-delete"
                                aria-label="Deactivate purchase item"
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </span>
                          </Tooltip>
                        </>
                      ) : (
                        <Tooltip
                          title={
                            canDelete
                              ? 'Activate item'
                              : 'No activate permission'
                          }
                          arrow
                        >
                          <span>
                            <IconButton
                              type="button"
                              onClick={() => handleActivate(item)}
                              disabled={!canDelete}
                              className="purchase-reference-action-button-cell is-activate"
                              aria-label="Activate purchase item"
                            >
                              <RefreshIcon fontSize="small" />
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
    </Box>
  );
};

export default PurchaseTable;