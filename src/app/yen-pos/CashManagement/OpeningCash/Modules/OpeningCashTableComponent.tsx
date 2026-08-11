

'use client';
import React, { useState } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  CircularProgress,
  Alert, IconButton,
  TextField,
  Typography,
} from '@mui/material';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import RestoreRoundedIcon from '@mui/icons-material/RestoreRounded';
import { OpeningCash } from '../Models/openingcashModels';

interface OpeningCashTableProps {
  data: OpeningCash[];
  isDeactivatedView: boolean;
  onEdit: (openingCash: OpeningCash) => void;
  onDeactivate: (openingCash: OpeningCash) => void;
  onActivate: (openingCash: OpeningCash) => void;
  onApplyAll?: (value: string, allBranches: string[]) => Promise<void>;
  applyingAll?: boolean;
  allBranches: string[];
}

export const OpeningCashTable: React.FC<OpeningCashTableProps> = ({
  data,
  isDeactivatedView,
  onEdit,
  onDeactivate,
  onActivate,
  onApplyAll,
  applyingAll = false,
  allBranches,
}) => {
  const [applyAllValue, setApplyAllValue] = useState<string>('');

  const handleApplyAll = async () => {
    const trimmed = applyAllValue.trim();
    if (!trimmed || isNaN(Number(trimmed))) {
      alert('Please enter a valid number');
      return;
    }

    if (onApplyAll) {
      await onApplyAll(trimmed, allBranches);
     setApplyAllValue('');
    }
  };

  const handleEditClick = (cash: OpeningCash) => {
    onEdit(cash);
  };

  return (
    <>
 <Box className="item-master-toolbar-shell">
        <Box className="purchase-reference-toolbar item-master-toolbar">
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography className="yen-pos-toolbar-title">
              Opening Cash
            </Typography>
          </Box>
          <Box className="purchase-reference-actions item-master-actions">
            <TextField
             placeholder="Apply All (₹)"
              size="small"
             autoComplete="off"
              value={applyAllValue}
              // onChange={(e) => setApplyAllValue(e.target.value)}

              onChange={(e) => {
                const value = e.target.value;

                // Allow only digits (no decimals, max 4 digits optional)
                if (/^\d{0,4}$/.test(value)) {
                  setApplyAllValue(value);
                }
              }}


             onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  void handleApplyAll();
                }
              inputProps={{ min: 0, step: '0.01' }}
              disabled={applyingAll}
              className="custom-textfield yen-pos-apply-all-input"
            />
         <button
              type="button"
              className="item-master-price-button"
              onClick={() => void handleApplyAll()}
              disabled={!applyAllValue.trim() || applyingAll}
            >
              {applyingAll && <CircularProgress size={12} />}
              {applyingAll ? 'Applying...' : 'Apply'}
            </button>
          </Box>
        </Box>
      </Box>

      <div className="item-master-table-container">
        <table className="item-master-table item-master-lookup-table item-master-lookup-table--4 yen-pos-cash-table">
          <thead>
            <tr>
              <th>S.NO</th>
              <th>Branch Name</th>
              <th>Opening Cash</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {data.map((cash, index) => (
              <tr
                key={cash.systemOpenCashId || cash.branches}
                className="item-master-data-row"
              >
                <td>{index + 1}</td>
                <td>{cash.branches}</td>
                <td>{cash.systemOpenCashId ? cash.systemOpenCash : '0'}</td>
                <td className="item-master-actions-cell">
                  <div>
                    {isDeactivatedView ? (
                      <IconButton
                        onClick={() => onActivate(cash)}
                        className="purchase-master-action-button is-activate"
                        title="Activate"
                        size="small"
                      >
                        <RestoreRoundedIcon />
                      </IconButton>
                    ) : (
                      <IconButton
                        onClick={() => handleEditClick(cash)}
                        className="purchase-master-action-button is-edit"
                        title="Edit"
                        size="small"
                      >
                  
                  <EditOutlinedIcon />
                      </IconButton>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {data.length === 0 && (
              <tr>
               <td colSpan={4} className="empty-state">
                  <h2>
                    {isDeactivatedView
                     ? 'No deactivated opening cash records'
                      : 'No opening cash records found'}
                  </h2>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
};