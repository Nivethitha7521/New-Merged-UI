'use client';

import React from 'react';
import { Box, Pagination, Typography } from '@mui/material';

interface PurchasePaginationProps {
  currentPage: number;
  pageSize: number;
  totalItems: number;
  handlePageChange: (newPage: number) => void;
}

const PurchasePagination: React.FC<PurchasePaginationProps> = ({
  currentPage,
  pageSize,
  totalItems,
  handlePageChange,
}) => {
  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

  return (
    <Box className="purchase-item-pagination">
      <Typography className="purchase-item-pagination-label">
        Showing {totalItems === 0 ? 0 : startItem}-{endItem} of {totalItems} items
      </Typography>

      <Pagination
        count={totalPages}
        page={currentPage}
        onChange={(_event, value) => handlePageChange(value)}
        color="primary"
        size="small"
        shape="rounded"
        showFirstButton
        showLastButton
      />
    </Box>
  );
};

export default PurchasePagination;