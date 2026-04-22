// PaymentHistory.tsx
'use client';

import React, { useEffect, useState, useRef } from 'react';
import {
  Grid,
  Paper,
  TextField,
  Button,
  CircularProgress,
  Box,
} from '@mui/material';
import FilterAltIcon from '@mui/icons-material/FilterAlt';
import ClearIcon from '@mui/icons-material/Clear';
import DownloadIcon from '@mui/icons-material/Download';
import DateRangeDialog from '@/components/dateRange';

interface Props {
  localFilter: string;
  setLocalFilter: (value: string) => void;
  dateFrom: string;
  setDateFrom: (value: string) => void;
  dateTo: string;
  setDateTo: (value: string) => void;
  vendorName: string;
  setVendorName: (value: string) => void;
  handleFilterApply: () => void;
  handleClearFilter: () => void;
  openExportDialog: () => void;
  exportLoading: boolean;
  disableClear: boolean;
  disableExport: boolean;
}

interface SelectionRange {
  startDate: Date;
  endDate: Date;
  key: string;
}

const PaymentHistoryFilters = ({
  localFilter,
  setLocalFilter,
  dateFrom,
  setDateFrom,
  dateTo,
  setDateTo,
  vendorName,
  setVendorName,
  handleFilterApply,
  handleClearFilter,
  openExportDialog,
  exportLoading,
  disableClear,
  disableExport,
}: Props) => {
  // Helper functions
  const parseDate = (value: string) => {
    if (!value) return new Date();
    const parsed = new Date(value);
    return isNaN(parsed.getTime()) ? new Date() : parsed;
  };

  const formatDateForInput = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Initialize selection range from props
  const [selectionRange, setSelectionRange] = useState<SelectionRange>({
    startDate: dateFrom ? parseDate(dateFrom) : new Date(),
    endDate: dateTo ? parseDate(dateTo) : new Date(),
    key: 'selection',
  });

  // Track if we're updating from internal changes
  const isInternalUpdate = useRef(false);

  // Update parent when selection range changes
  useEffect(() => {
    if (isInternalUpdate.current) {
      isInternalUpdate.current = false;
      return;
    }
    
    if (selectionRange.startDate && selectionRange.endDate) {
      const newDateFrom = formatDateForInput(selectionRange.startDate);
      const newDateTo = formatDateForInput(selectionRange.endDate);
      
      if (newDateFrom !== dateFrom) {
        setDateFrom(newDateFrom);
      }
      if (newDateTo !== dateTo) {
        setDateTo(newDateTo);
      }
    }
  }, [selectionRange.startDate, selectionRange.endDate]);

  // Update selection range when parent dates change
  useEffect(() => {
    if (dateFrom && dateTo) {
      const newStartDate = parseDate(dateFrom);
      const newEndDate = parseDate(dateTo);
      
      if (newStartDate.getTime() !== selectionRange.startDate.getTime() ||
          newEndDate.getTime() !== selectionRange.endDate.getTime()) {
        isInternalUpdate.current = true;
        setSelectionRange({
          startDate: newStartDate,
          endDate: newEndDate,
          key: 'selection',
        });
      }
    }
  }, [dateFrom, dateTo]);

  return (
    <Paper
      elevation={2}
      sx={{
        mb: 2,
        p: 2,
        backgroundColor: '#f8f9fb',
        borderRadius: 2,
      }}
    >
      <Grid container spacing={2} alignItems="center">
        {/* Payment ID Filter */}
        <Grid item xs={12} sm={6} md={2.5}>
          <TextField
            label="Payment ID"
            value={localFilter}
            onChange={(e) => setLocalFilter(e.target.value.toUpperCase())}
            fullWidth
            size="small"
            variant="outlined"
            placeholder="e.g. PV001"
          />
        </Grid>

        {/* Date Range Picker */}
        <Grid item xs={12} sm={6} md={2.5}>
          <DateRangeDialog
            selectionRange={selectionRange}
            setSelectionRange={setSelectionRange}
          />
        </Grid>

        {/* Vendor Name Filter */}
        <Grid item xs={12} sm={6} md={3}>
          <TextField
            label="Vendor Name"
            value={vendorName}
            onChange={(e) => setVendorName(e.target.value)}
            fullWidth
            size="small"
            variant="outlined"
            placeholder="Search by vendor name"
          />
        </Grid>

        {/* Action Buttons */}
        <Grid item xs={12} sm={6} md={4}>
          <Box
            sx={{
              display: 'flex',
              gap: 1,
              flexWrap: 'wrap',
              justifyContent: { xs: 'flex-start', md: 'flex-end' },
            }}
          >
            <Button
              variant="contained"
              startIcon={<FilterAltIcon />}
              onClick={handleFilterApply}
              sx={{ textTransform: 'none' }}
            >
              Apply Filters
            </Button>

            <Button
              variant="outlined"
              startIcon={<ClearIcon />}
              onClick={handleClearFilter}
              disabled={disableClear}
              sx={{ textTransform: 'none' }}
            >
              Clear All
            </Button>

            <Button
              variant="contained"
              color="secondary"
              startIcon={
                exportLoading ? (
                  <CircularProgress size={18} color="inherit" />
                ) : (
                  <DownloadIcon />
                )
              }
              onClick={openExportDialog}
              disabled={disableExport || exportLoading}
              sx={{ textTransform: 'none' }}
            >
              Export Report
            </Button>
          </Box>
        </Grid>
      </Grid>
    </Paper>
  );
};

export default PaymentHistoryFilters;