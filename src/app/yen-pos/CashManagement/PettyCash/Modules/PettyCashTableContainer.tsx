'use client';
import React, { useState } from 'react';
import {
  Box,
  Typography,
  TextField,
  CircularProgress,
} from '@mui/material';
import { Edit as EditIcon } from '@mui/icons-material';
import { PettyCash } from '../Models/pettycashModels';   // adjust path

import DeleteIcon from '@mui/icons-material/Delete';
import RefreshIcon from '@mui/icons-material/Refresh';
import { useSelector } from 'react-redux';
import { RootState } from '@/redux/store';


interface PettyCashTableProps {
  data: PettyCash[];
  isDeactivatedView: boolean;
  onEdit: (cash: PettyCash) => void;
  onDeactivate: (cash: PettyCash) => void;
  onActivate: (cash: PettyCash) => void;
  onApplyAll?: (value: string, allBranches: string[]) => Promise<void>; // New prop
  applyingAll?: boolean; // Loading state
  allBranches: string[]; // Pass from parent
}

export const PettyCashTable: React.FC<PettyCashTableProps> = ({
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
      setApplyAllValue(''); // Clear input after success
    }
  };

  const { showDeactivated } = useSelector((state: RootState) => state.Category);

  return (
    <>
      <Box
        display="flex"
        flexDirection={{ xs: "column", sm: "row" }}
        alignItems={{ xs: "flex-start", sm: "center" }}
        justifyContent="space-between"
        gap={2}
        my={1}
        ml={1}
        px={{ xs: 2, sm: 3 }}
        sx={{ width: "99%", boxSizing: "border-box", mt: -3 }}
      >
        <Typography className='icon-action-label'
          sx={{
            fontFamily: "'Poppins', sans-serif",
            fontWeight: 750,
            margin: 0,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            maxWidth: "100%",
          }}
        >
          {showDeactivated ? "Petty Cash" : "Petty Cash"}
        </Typography>



        {/* Apply All Section */}
        <Box display="flex" alignItems="center" gap={1.5} flexWrap="wrap">

          <div className="form-field">
            <TextField
              label="Apply All (₹)"
              size="small"
              autoComplete='off'
              value={applyAllValue}
              //onChange={(e) => setApplyAllValue(e.target.value)}

              onChange={(e) => {
                const value = e.target.value;

                // Allow only digits (no decimals, max 4 digits optional)
                if (/^\d{0,4}$/.test(value)) {
                  setApplyAllValue(value);
                }
              }}

              onKeyDown={(e) => e.key === 'Enter' && handleApplyAll()}
              inputProps={{ min: 0, step: '0.01' }}
              sx={{ width: 120 }}
              disabled={applyingAll}
              className="custom-textfield"
              InputLabelProps={{
                className: "custom-label"
              }}
              InputProps={{
                className: "custom-input"
              }}
            />
          </div>

          <button
            className='btn-primary'
            onClick={handleApplyAll}
            disabled={!applyAllValue.trim() || applyingAll}
          >
            {applyingAll && <CircularProgress size={16} />}
            {applyingAll ? 'Applying...' : 'Apply'}
          </button>
        </Box>
      </Box>

      <div className="table-container my-1" style={{ maxHeight: 'calc(96vh - 170px)', overflow: 'auto' }}>
        <table className="custom-table">
          <thead>
            <tr>
              <th style={{ color: 'Black', fontWeight: 'bold', textAlign: 'center' }}>S.NO</th>
              <th style={{ color: 'Black', fontWeight: 'bold', textAlign: 'center' }}>Branch Name</th>
              <th style={{ color: 'Black', fontWeight: 'bold', textAlign: 'center' }}>Petty Cash</th>
              <th style={{ color: 'Black', fontWeight: 'bold', textAlign: 'center' }}>Actions</th>
            </tr>
          </thead>

          <tbody>
            {data.map((cash, index) => (
              <tr key={cash.pettyCashId || cash.branches}>
                <td style={{ textAlign: 'center' }}>{index + 1}</td>
                <td style={{ textAlign: 'center' }}>{cash.branches}</td>
                <td style={{ textAlign: 'center' }}>
                  {/* {cash.pettyCash} */}
                  {cash.pettyCashId ? cash.pettyCash : '0'}
                </td>
                <td style={{ textAlign: 'center' }}>
                  {isDeactivatedView ? (
                    <button
                      color="primary"
                      onClick={() => onActivate(cash)}
                      className="active-btn"
                      title="Activate"
                    >
                      <RefreshIcon />
                    </button>
                  ) : (
                    <>
                      <button
                        color="primary"
                        onClick={() => onEdit(cash)}
                        className="edit-single"
                        title="Edit"
                      >

                        <EditIcon />
                      </button>

                      {/* {cash.pettyCashId && (
                      <IconButton
                        color="primary"
                        onClick={() => onDeactivate(cash)}
                        style={{ marginLeft: '10px' }}
                      >
                        <DeleteIcon/>
                      </IconButton>
                    )} */}
                    </>
                  )}
                </td>
              </tr>
            ))}

            {data.length === 0 && (
              <tr>
                <td colSpan={4} style={{ textAlign: 'center' }}>
                  <h2>No data found</h2>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>

    // </Box >
  );
};