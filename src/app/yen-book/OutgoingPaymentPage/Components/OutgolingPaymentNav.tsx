'use client';

import React from 'react';
import Link from 'next/link';
import { Box, Button } from '@mui/material';
import { usePermissions } from "@/hooks/usePermissions";

const OutgoingPaymentNav = () => {
  const { isModuleVisible } = usePermissions();

  return (
    <Box sx={{ mb: 2 }}>
      <Box display="flex" alignItems="center" flexWrap="wrap" gap={1}>
        {isModuleVisible("yenerp", "outgoingpayment") && (
          <Link href="/yen-book/OutgoingPaymentPage">
            <Button variant="contained">Outgoing Payment</Button>
          </Link>
        )}

        {isModuleVisible("yenerp", "advancepayment") && (
          <Link href="/yen-book/OutgoingPaymentPage/PreOutgoing">
            <Button variant="contained">Advance Payment</Button>
          </Link>
        )}

        {isModuleVisible("yenerp", "partialpayment") && (
          <Link href="/yen-book/OutgoingPaymentPage/PendingPayment">
            <Button variant="contained">Partial Payment</Button>
          </Link>
        )}

        {isModuleVisible("yenerp", "paymentdone") && (
          <Link href="/yen-book/OutgoingPaymentPage/PaidPayment">
            <Button variant="contained">Payment Done</Button>
          </Link>
        )}

        {isModuleVisible("yenerp", "paymenthistory") && (
          <Link href="/yen-book/OutgoingPaymentPage/PaymentHistory">
            <Button variant="contained">Payment History</Button>
          </Link>
        )}

        {isModuleVisible("yenerp", "ledger") && (
          <Link href="/yen-book/OutgoingPaymentPage/Ledger">
            <Button variant="contained">Ledger</Button>
          </Link>
        )}
      </Box>
    </Box>
  );
};

export default OutgoingPaymentNav;