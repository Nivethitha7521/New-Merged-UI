
'use client';
import React, { useState } from 'react';
import {
  Box,
  Typography,
  TextField,
  CircularProgress,IconButton,
} from '@mui/material';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import RestoreRoundedIcon from '@mui/icons-material/RestoreRounded';
import SearchIcon from '@mui/icons-material/Search';
import { AdvanceAmount } from '../Models/advanceamountModels';

interface AdvanceAmountTableProps {
  data: AdvanceAmount[];
  isDeactivatedView: boolean;
  onEdit: (advanceAmount: AdvanceAmount) => void;
  // onDeactivate?: (advanceAmount: AdvanceAmount) => void;
  // onActivate?: (advanceAmount: AdvanceAmount) => void;
onApplyAll?: (
  value: string,
  allBranches: string[]
) => Promise<void>;
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
  const [searchValue, setSearchValue] = useState('');

  const filteredData = React.useMemo(() => {
    const query = searchValue.trim().toLowerCase();
    if (!query) return data;

    return data.filter((item) =>
      item.branches?.toLowerCase().includes(query) ||
      item.percentage?.toString().toLowerCase().includes(query)
    );
  }, [data, searchValue]);
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
{/* Header: Title + Search + Apply All */}
<Box
  className="item-master-toolbar-shell"
  sx={{
    display: 'flex',
    justifyContent: 'space-between',
    mb: 1,
  }}
>
  <Box
    className="purchase-reference-toolbar item-master-toolbar"
    sx={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      width: '100%',
      gap: 2,
    }}
  >
    {/* LEFT - Title */}
    <Box sx={{ flex: 1, minWidth: 0 }}>
      <Typography className="sale-order-toolbar-title">
        S.O Advance Amount
      </Typography>
    </Box>

    {/* CENTER - Search */}
    <Box
      className="item-master-search-slot"
      sx={{
        flex: '0 0 auto',
        display: 'flex',
        justifyContent: 'center',
      }}
    >
      <TextField
        size="small"
        variant="outlined"
        autoComplete="off"
        placeholder="Search Branch..."
        value={searchValue}
        onChange={(e) => setSearchValue(e.target.value)}
        className="custom-textfield purchase-reference-search item-master-search"
        sx={{ width: '300px' }}
        InputProps={{
          startAdornment: (
            <SearchIcon className="purchase-reference-search-icon" />
          ),
        }}
      />
    </Box>

    {/* RIGHT - Apply All */}
    <Box
      className="purchase-reference-actions item-master-actions"
      sx={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-end',
        gap: 1,
      }}
    >
      <TextField
        placeholder="Apply All (%)"
        size="small"
        autoComplete="off"
        value={applyAllValue}
        onChange={(e) => setApplyAllValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            void handleApplyAll();
          }
        }}
        inputProps={{
          min: 0,
          step: '0.01',
        }}
        sx={{ width: 110 }}
        disabled={applyingAll}
        className="custom-textfield sale-order-apply-all-input"
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

{/* Table */}
 <div className="item-master-table-container">
        <table className="item-master-table item-master-lookup-table sale-order-lookup-table--4">
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
           {filteredData.map((item, index) => (
              <tr key={item.amountId || item.branches} className="item-master-data-row">
                <td style={{ textAlign: "center" }}>{index + 1}</td>
                {/* <td style={{ textAlign: "center" }}>{item.name}</td> */}
                <td style={{ textAlign: "center" }}>{item.branches}</td>
                <td style={{ textAlign: "center" }}>{item.percentage || '0'}</td>
                {/* <td style={{ textAlign: "center" }}>{item.remarks}</td> */}
 <td className="item-master-actions-cell">
  <div>
    {isDeactivatedView ? (
      <IconButton
        // onClick={() => onActivate?.(item)}
        className="purchase-master-action-button is-activate"
        title="Activate"
        size="small"
      >
        <RestoreRoundedIcon />
      </IconButton>
    ) : (
      <IconButton
        onClick={() => onEdit(item)}
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
           {filteredData.length === 0 && (
              <tr>
               <td colSpan={4} className="empty-state">
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