'use client';
import React from 'react';
import { Box, IconButton, Typography } from '@mui/material';
import { ChevronLeft, ChevronRight } from '@mui/icons-material';

interface VendorPaginationProps {
  currentPage: number;
  totalVendors: number;
  pageSize: number;
  handlePageChange: (newPage: number) => void;
}

const VendorPagination: React.FC<VendorPaginationProps> = ({ currentPage, totalVendors, pageSize, handlePageChange }) => {
  const totalPages = Math.max(1, Math.ceil(totalVendors / pageSize));

return (
  <Box
    className="purchase-item-pagination vendor-pagination"
    sx={{ justifyContent: 'flex-end' }}
  >
    <Box sx={{ display: 'flex', alignItems: 'center' }}>
      <IconButton
        onClick={() => handlePageChange(currentPage - 1)}
        disabled={currentPage === 1}
        size="small"
        aria-label="Previous vendor page"
      >
        <ChevronLeft />
      </IconButton>

      <Typography
        variant="body2"
        className="purchase-item-pagination-label"
        sx={{ mx: 2 }}
      >
        Page {currentPage} of {totalPages}
      </Typography>

      <IconButton
        onClick={() => handlePageChange(currentPage + 1)}
        disabled={currentPage >= totalPages}
        size="small"
        aria-label="Next vendor page"
      >
        <ChevronRight />
      </IconButton>
    </Box>
  </Box>
);
 
};

export default VendorPagination;