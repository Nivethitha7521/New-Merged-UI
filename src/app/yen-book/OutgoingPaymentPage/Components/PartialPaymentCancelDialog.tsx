// PartialPaymentCancelDialog.tsx

'use client';

import React, { useEffect, useMemo, useState } from 'react';

import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Checkbox,
  Typography,
  Button,
  IconButton,
  Chip,
  Box,
  Tooltip,
} from '@mui/material';

import CancelIcon from '@mui/icons-material/Cancel';
import CloseIcon from '@mui/icons-material/Close';

import moment from 'moment';

interface Props {
  open: boolean;
  onClose: () => void;
  payment: any;
  onCancel: (historyIds: string[]) => void;
}

const PartialPaymentCancelDialog = ({
  open,
  onClose,
  payment,
  onCancel,
}: Props) => {

  const [selectedIds, setSelectedIds] =
    useState<string[]>([]);
const [confirmDialogOpen,
setConfirmDialogOpen] =
useState(false);

const [pendingCancelIds,
setPendingCancelIds] =
useState<string[]>([]);
  useEffect(() => {

    if (!open) {

      setSelectedIds([]);

    }

  }, [open]);

  const paymentHistory =
    payment?.paymentHistory || [];
const activePayments = paymentHistory.filter(
  (history: any) => !history.isCancelled
);

  const allSelected =
    activePayments.length > 0 &&
    selectedIds.length ===
      activePayments.length;

  const someSelected =
    selectedIds.length > 0 &&
    selectedIds.length <
      activePayments.length;

  const handleSelectAll = (
    checked: boolean
  ) => {

    if (checked) {

      const allIds =
  activePayments.map(
    (
      history: any,
      index: number
    ) =>
      history.historyId ||
      index.toString()
  );

      setSelectedIds(allIds);

    } else {

      setSelectedIds([]);

    }
  };

  const handleSelect = (
    historyId: string
  ) => {

    setSelectedIds((prev) => {

      if (prev.includes(historyId)) {

        return prev.filter(
          (id) => id !== historyId
        );

      }

      return [...prev, historyId];
    });
  };

const handleBulkCancel = () => {

  if (selectedIds.length === 0)
    return;

  setPendingCancelIds(
    selectedIds
  );

  setConfirmDialogOpen(true);
};

const handleSingleCancel = (
  historyId: string
) => {

  setPendingCancelIds([
    historyId
  ]);

  setConfirmDialogOpen(true);
};
const handleConfirmCancel =
() => {

  if (
    pendingCancelIds.length === 0
  ) return;

  onCancel(
    pendingCancelIds
  );

  setSelectedIds([]);

  setPendingCancelIds([]);

  setConfirmDialogOpen(false);

  onClose();
};
const totalSelectedAmount = useMemo(() => {
  return activePayments
    .filter((history: any) =>
      selectedIds.includes(history.historyId)
    )
    .reduce(
      (sum: number, history: any) =>
        sum + (history.amount || 0),
      0
    );
}, [selectedIds, activePayments]);

  const remainingPaidAmount =
    (payment?.paidAmount || 0) -
    totalSelectedAmount;

  const currentPendingAmount =
  payment?.totalPayableAmount || 0;

const pendingAmount =
  currentPendingAmount + totalSelectedAmount;

  const nextStatus =
    remainingPaidAmount <= 0
      ? 'Pending'
      : 'Partially Paid';

  const formatCurrency = (
    amount: number
  ) => {

    return new Intl.NumberFormat(
      'en-IN',
      {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }
    ).format(amount);
  };

  return (

    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
    >

      <DialogTitle>

        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="center"
        >

          <Typography
            variant="h6"
            fontWeight="bold"
          >
            Cancel Partial Payments
          </Typography>

          <Box
            display="flex"
            alignItems="center"
            gap={1}
          >

            <Tooltip title="Cancel Selected Payments">

              <span>

                <IconButton
  sx={{
    color: "#1976d2",
    "&:hover": {
      backgroundColor: "rgba(25, 118, 210, 0.08)",
    },
  }}
                  disabled={
                    selectedIds.length === 0
                  }
                  onClick={handleBulkCancel}
                >
                  <CancelIcon />
                </IconButton>

              </span>

            </Tooltip>

            <IconButton onClick={onClose}>
              <CloseIcon />
            </IconButton>

          </Box>

        </Box>

      </DialogTitle>

      <DialogContent>

        <Typography
          variant="body2"
          sx={{ mb: 2 }}
        >
          Select the payments you want
          to cancel
        </Typography>

        <TableContainer
          component={Paper}
        >

          <Table>

            <TableHead>

              <TableRow>

                <TableCell>

                  <Checkbox
                    checked={allSelected}
                    indeterminate={
                      someSelected
                    }
                    onChange={(e) =>
                      handleSelectAll(
                        e.target.checked
                      )
                    }
                  />

                </TableCell>

                <TableCell>
                  Amount
                </TableCell>

                <TableCell>
                  Date
                </TableCell>

                <TableCell>
                  Method
                </TableCell>

               <TableCell align="center">
                  Action
                </TableCell>

              </TableRow>

            </TableHead>

            <TableBody>

              {activePayments.map(
                (
                  history: any,
                  index: number
                ) => {

              

                  return (

                    <TableRow
                      key={
  history.historyId ||
  index.toString()
}
                    
                    >

                      <TableCell>

                        <Checkbox
                          checked={selectedIds.includes(
  history.historyId || index.toString()
)}
                        //   disabled={
                        //     isCancelled
                        //   }
                          onChange={() =>
  handleSelect(
    history.historyId || index.toString()
  )
}
                        />

                      </TableCell>

                      <TableCell>

                        ₹{' '}
                        {formatCurrency(
                          history.amount || 0
                        )}

                      </TableCell>

                      <TableCell>

                        {history.date
                          ? moment(
                              history.date
                            ).format(
                              'DD-MM-YYYY'
                            )
                          : '-'}

                      </TableCell>

                      <TableCell>

                        {history.paymentMethod ||
                          '-'}

                      </TableCell>

                    

                      <TableCell align="center">

                     

                          <Tooltip title="Cancel Payment">

                          <IconButton
  sx={{
    color: "#1976d2",
    "&:hover": {
      backgroundColor: "rgba(25, 118, 210, 0.08)",
    },
  }}
                              onClick={() =>
                                handleSingleCancel(
  history.historyId ||
  index.toString()
)

                              }
                            >
                              <CancelIcon />
                            </IconButton>

                          </Tooltip>

                       

                      </TableCell>

                    </TableRow>
                  );
                }
              )}

            </TableBody>

          </Table>

        </TableContainer>

        {selectedIds.length > 0 && (

          <Box
            mt={3}
            p={2}
            border="1px solid #ddd"
            borderRadius="10px"
          >

            <Typography
              variant="subtitle1"
              fontWeight="bold"
              gutterBottom
            >
              After Cancellation
            </Typography>

            <Typography>
              Remaining Paid Amount :
              ₹{' '}
              {formatCurrency(
                remainingPaidAmount
              )}
            </Typography>

            <Typography>
              Pending Amount :
              ₹{' '}
              {formatCurrency(
                pendingAmount
              )}
            </Typography>

            <Typography>
              Status :
              {nextStatus}
            </Typography>

          </Box>

        )}

      </DialogContent>
<Dialog
  open={confirmDialogOpen}
  onClose={() =>
    setConfirmDialogOpen(false)
  }
>

  <DialogTitle>
    Cancel Payment
  </DialogTitle>

  <DialogContent>

    <Typography>
      Are you sure you want
      to cancel this payment?
    </Typography>

  </DialogContent>

  <DialogActions>

    <Button
      onClick={() =>
        setConfirmDialogOpen(false)
      }
      variant="outlined"
    >
      No
    </Button>

    <Button
      onClick={handleConfirmCancel}
      variant="contained"
      sx={{
        backgroundColor:
          "#1976d2",
        color: "white",
        "&:hover": {
          backgroundColor:
            "#1565c0",
        },
      }}
    >
      Yes, Cancel
    </Button>

  </DialogActions>

</Dialog>
      <DialogActions>

        <Button
          onClick={onClose}
          variant="outlined"
        >
          Close
        </Button>

      </DialogActions>

    </Dialog>
  );
};

export default PartialPaymentCancelDialog;