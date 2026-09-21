'use client';

import React from 'react';
import Link from 'next/link';
import { Box, Button } from '@mui/material';

export type PurchaseOrderTab =
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'grn-converted'
  | 'hold-grn';

interface PurchaseOrderTabsProps {
  activeTab: PurchaseOrderTab;
  showPending?: boolean;
  showApproved?: boolean;
  showRejected?: boolean;
  showGrnConverted?: boolean;
  showHoldGrn?: boolean;
  holdGrnCount?: number;
}

const PurchaseOrderTabs: React.FC<PurchaseOrderTabsProps> = ({
  activeTab,
  showPending = true,
  showApproved = true,
  showRejected = true,
  showGrnConverted = true,
  showHoldGrn = true,
  holdGrnCount = 0,
}) => {
  return (
    <Box className="purchase-order-tabs">
      {showPending && (
        <Button
          component={Link}
          href="/yen-purchase/PurchaseOrder"
          variant="outlined"
          className={`purchase-order-tab-button ${
            activeTab === 'pending' ? 'is-active' : ''
          }`}
          aria-current={activeTab === 'pending' ? 'page' : undefined}
        >
          Pending
        </Button>
      )}

      {showApproved && (
        <Button
          component={Link}
          href="/yen-purchase/PurchaseOrder/Approvedpo"
          variant="outlined"
          className={`purchase-order-tab-button ${
            activeTab === 'approved' ? 'is-active' : ''
          }`}
          aria-current={activeTab === 'approved' ? 'page' : undefined}
        >
          Approved
        </Button>
      )}

      {showRejected && (
        <Button
          component={Link}
          href="/yen-purchase/PurchaseOrder/RejectedPo"
          variant="outlined"
          className={`purchase-order-tab-button ${
            activeTab === 'rejected' ? 'is-active' : ''
          }`}
          aria-current={activeTab === 'rejected' ? 'page' : undefined}
        >
          Rejected
        </Button>
      )}

      {showGrnConverted && (
        <Button
          component={Link}
          href="/yen-purchase/PurchaseOrder/GRNConvertedPO"
          variant="outlined"
          className={`purchase-order-tab-button ${
            activeTab === 'grn-converted' ? 'is-active' : ''
          }`}
          aria-current={
            activeTab === 'grn-converted' ? 'page' : undefined
          }
        >
          GRN Converted
        </Button>
      )}

      {showHoldGrn && (
        <Button
          component={Link}
          href="/yen-purchase/PurchaseOrder/HoldGrn"
          variant="outlined"
          className={`purchase-order-tab-button ${
            activeTab === 'hold-grn' ? 'is-active' : ''
          }`}
          aria-current={activeTab === 'hold-grn' ? 'page' : undefined}
        >
          Hold GRN

          {holdGrnCount > 0 && (
            <span className="purchase-order-tab-count">
              {holdGrnCount}
            </span>
          )}
        </Button>
      )}
    </Box>
  );
};

export default PurchaseOrderTabs;