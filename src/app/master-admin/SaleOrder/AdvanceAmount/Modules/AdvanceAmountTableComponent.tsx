
'use client';
import React, { useState } from 'react';
import {
  Box,
  Typography,
  TextField,
  CircularProgress,
} from '@mui/material';
import { Edit as EditIcon } from '@mui/icons-material';
import RefreshIcon from '@mui/icons-material/Refresh';
import { AdvanceAmount } from '../Models/advanceamountModels';

interface AdvanceAmountTableProps {
  data: AdvanceAmount[];
  isDeactivatedView: boolean;
  onEdit: (advanceAmount: AdvanceAmount) => void;
  // onDeactivate?: (advanceAmount: AdvanceAmount) => void;
  // onActivate?: (advanceAmount: AdvanceAmount) => void;
  onApplyAll?: (value: string, allBranches: string[]) => Promise<void>;
  applyingAll?: boolean;
  allBranches: string[];
}

export const AdvanceAmountTable: React.FC<AdvanceAmountTableProps> = ({
  data,
  isDeactivatedView,
  onEdit,
  // onDeactivate,
  // onActivate,
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
      setApplyAllValue(''); // Clear after success
    }
  };

  return (
    <>
      {/* Header: Title + Apply All */}
      <Box
        display="flex"
        flexDirection={{ xs: "column", sm: "row" }}
        alignItems={{ xs: "flex-start", sm: "center" }}
        justifyContent="space-between"
        gap={2}
        my={1}
        ml={1}
        px={{ xs: 2, sm: 3 }}
        sx={{ width: "99%", boxSizing: "border-box", mt: -1.5 }}
      >
        <Typography
          className='icon-action-label'
          sx={{
            fontFamily: "'Poppins', sans-serif",
            fontWeight: 750,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            maxWidth: "100%",
          }}
        >
          S.O Advance Amount
        </Typography>

        {/* Apply All Section */}
        <Box display="flex" alignItems="center" gap={1.5} flexWrap="wrap">

          <div className="form-field">
            <TextField
              label="Apply All (%)"
              size="small"
              autoComplete='off'
              value={applyAllValue}
              onChange={(e) => setApplyAllValue(e.target.value)}
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
      <div className="table-container my-1" style={{ maxHeight: 'calc(91vh - 170px)', overflow: 'auto' }}>
        <table className="custom-table">
          <thead>
            <tr>
              <th>S.NO</th>
              {/* <th>Name</th> */}
              <th>Branch Name</th>
              <th>Percentage (%)</th>
              {/* <th>Remark</th> */}
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {data.map((item, index) => (
              <tr key={item.amountId || item.branches}>
                <td style={{ textAlign: "center" }}>{index + 1}</td>
                {/* <td style={{ textAlign: "center" }}>{item.name}</td> */}
                <td style={{ textAlign: "center" }}>{item.branches}</td>
                <td style={{ textAlign: "center" }}>{item.percentage || '0'}</td>
                {/* <td style={{ textAlign: "center" }}>{item.remarks}</td> */}
                <td style={{ textAlign: "center" }}>
                  {isDeactivatedView ? (
                    <button
                      // onClick={() => onActivate?.(item)}
                      className="active-btn"
                      title="Activate"
                    >
                      <RefreshIcon fontSize="small" />
                    </button>
                  ) : (
                    <button
                      onClick={() => onEdit(item)}
                      className="edit-single"
                      title="Edit"
                    >
                      <EditIcon fontSize="small" />
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {data.length === 0 && (
              <tr>
                <td colSpan={4} style={{ textAlign: "center", padding: "40px" }}>
                  <h2>
                    {isDeactivatedView
                      ? "No deactivated advance amount records"
                      : "No advance amount records found"}
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