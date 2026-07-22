

'use client';
import React, { useState } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  CircularProgress,
  Alert,
} from '@mui/material';
import { Edit as EditIcon } from '@mui/icons-material';
import DeleteIcon from '@mui/icons-material/Delete';
import RefreshIcon from '@mui/icons-material/Refresh';
import { OpeningCash } from '../Models/openingcashModels';

interface OpeningCashTableProps {
  data: OpeningCash[];
  isDeactivatedView: boolean;
  onEdit: (openingCash: OpeningCash) => void;
  onDeactivate: (openingCash: OpeningCash) => void;
  onActivate: (openingCash: OpeningCash) => void;
  onApplyAll?: (value: string, allBranches: string[]) => Promise<void>; // New prop
  applyingAll?: boolean; // Loading state
  allBranches: string[]; // Pass from parent
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
      setApplyAllValue(''); // Clear input after success
    }
  };

  const handleEditClick = (cash: OpeningCash) => {
    onEdit(cash);
  };

  return (
    <>
      {/* Header with Title + Apply All (Right Side) */}
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
        <Typography
          className='icon-action-label'
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
          Opening Cash
        </Typography>

        {/* Apply All Section */}
        <Box display="flex" alignItems="center" gap={1.5} flexWrap="wrap">

          <div className="form-field">
            <TextField
              label="Apply All (₹)"
              size="small"
              autoComplete='off'
              value={applyAllValue}
              // onChange={(e) => setApplyAllValue(e.target.value)}

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

      {/* Table */}
      <div className="table-container my-1" style={{ maxHeight: 'calc(96vh - 170px)', overflow: 'auto' }}>
        <table className="custom-table">
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
              <tr key={cash.systemOpenCashId || cash.branches}>
                <td style={{ textAlign: "center" }}>{index + 1}</td>
                <td style={{ textAlign: "center" }}>{cash.branches}</td>
                <td style={{ textAlign: "center" }}>
                  {cash.systemOpenCashId ? cash.systemOpenCash : '0'}
                </td>
                <td style={{ textAlign: "center" }}>
                  {isDeactivatedView ? (
                    <button
                      onClick={() => onActivate(cash)}
                      className="active-btn"
                      title="Activate"
                    >
                      <RefreshIcon fontSize="small" />
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={() => handleEditClick(cash)}
                        className="edit-single"
                        title="Edit"
                      >
                        <EditIcon fontSize="small" />
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}
            {data.length === 0 && (
              <tr>
                <td colSpan={4} style={{ textAlign: "center", padding: "40px" }}>
                  <h2>
                    {isDeactivatedView
                      ? "No deactivated opening cash records"
                      : "No opening cash records found"}
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