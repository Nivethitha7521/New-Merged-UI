// components/yen-purchase/purchaseitem/importErrorDialog.tsx
import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Alert,
  Box,
  Chip,
  Paper,
  Divider
} from '@mui/material';
import { CheckCircle, Warning, Error as ErrorIcon } from '@mui/icons-material';

interface ImportErrorDialogProps {
  open: boolean;
  onClose: () => void;
  importResults: {
    successful: Array<{ row: number; data: Record<string, any> }>;
    updated: Array<{ row: number; data: Record<string, any>; error?: string }>;
    failed: Array<{ row: number; data: Record<string, any>; error: string; missingFields?: string[] }>;
  };
  mode?: 'merge' | 'replace';
  onRefresh?: () => void;
}

const ImportErrorDialog: React.FC<ImportErrorDialogProps> = ({ 
  open, 
  onClose, 
  importResults, 
  mode,
  onRefresh 
}) => {
  const { successful = [], updated = [], failed = [] } = importResults;
  
  const totalProcessed = successful.length + updated.length + failed.length;
  const hasSuccess = successful.length > 0;
  const hasUpdates = updated.length > 0;
  const hasFailures = failed.length > 0;

  const handleClose = () => {
    if (onRefresh && (hasSuccess || hasUpdates)) {
      onRefresh();
    }
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={1}>
          {hasFailures ? <ErrorIcon color="error" /> : hasSuccess ? <CheckCircle color="success" /> : <Warning color="warning" />}
          <Typography variant="h6">CSV Import Results</Typography>
          {mode && (
            <Chip 
              label={mode === 'replace' ? 'Replace Mode' : 'Merge Mode'} 
              size="small" 
              color={mode === 'replace' ? 'warning' : 'primary'}
            />
          )}
        </Box>
      </DialogTitle>
      <DialogContent>
        {/* Summary Section */}
        <Box sx={{ mb: 2 }}>
          <Alert severity={hasFailures ? 'error' : hasSuccess ? 'success' : 'info'}>
            <Typography variant="body2">
              Total processed: {totalProcessed} rows
              {hasSuccess && ` | ✅ Success: ${successful.length}`}
              {hasUpdates && ` | 🔄 Updated: ${updated.length}`}
              {hasFailures && ` | ❌ Failed: ${failed.length}`}
            </Typography>
          </Alert>
        </Box>

        {/* Success Section */}
        {hasSuccess && (
          <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
            <Typography variant="subtitle1" color="success.main" gutterBottom>
              ✅ Successfully Imported ({successful.length})
            </Typography>
            <Divider sx={{ mb: 1 }} />
            <Box sx={{ maxHeight: 200, overflow: 'auto' }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell width="60">Row</TableCell>
                    <TableCell>Item Name</TableCell>
                    <TableCell>Random ID</TableCell>
                    <TableCell>Barcode</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {successful.slice(0, 20).map((item, idx) => (
                    <TableRow key={idx}>
                      <TableCell>{item.row}</TableCell>
                      <TableCell>{item.data.itemName}</TableCell>
                      <TableCell>
                        <Chip label={item.data.randomId} size="small" variant="outlined" />
                      </TableCell>
                      <TableCell>{item.data.barcode}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {successful.length > 20 && (
                <Typography variant="caption" color="textSecondary" sx={{ display: 'block', mt: 1 }}>
                  ... and {successful.length - 20} more items
                </Typography>
              )}
            </Box>
          </Paper>
        )}

        {/* Updated Section */}
        {hasUpdates && (
          <Paper variant="outlined" sx={{ p: 2, mb: 2, backgroundColor: '#fff9e6' }}>
            <Typography variant="subtitle1" sx={{ color: '#d4a017' }} gutterBottom>
              🔄 Updated Items ({updated.length})
            </Typography>
            <Divider sx={{ mb: 1 }} />
            <Box sx={{ maxHeight: 200, overflow: 'auto' }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell width="60">Row</TableCell>
                    <TableCell>Item Name</TableCell>
                    <TableCell>Random ID</TableCell>
                    <TableCell>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {updated.slice(0, 20).map((item, idx) => (
                    <TableRow key={idx}>
                      <TableCell>{item.row}</TableCell>
                      <TableCell>{item.data.itemName}</TableCell>
                      <TableCell>
                        <Chip label={item.data.randomId} size="small" variant="outlined" />
                      </TableCell>
                      <TableCell>
                        <Chip label="Updated" size="small" color="warning" />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {updated.length > 20 && (
                <Typography variant="caption" color="textSecondary" sx={{ display: 'block', mt: 1 }}>
                  ... and {updated.length - 20} more items
                </Typography>
              )}
            </Box>
          </Paper>
        )}

        {/* Failed Section */}
        {hasFailures && (
          <Paper variant="outlined" sx={{ p: 2, backgroundColor: '#ffebee' }}>
            <Typography variant="subtitle1" color="error" gutterBottom>
              ❌ Failed Items ({failed.length})
            </Typography>
            <Divider sx={{ mb: 1 }} />
            <Box sx={{ maxHeight: 250, overflow: 'auto' }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell width="60">Row</TableCell>
                    <TableCell>Item Name</TableCell>
                    <TableCell>Error</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {failed.map((error, idx) => (
                    <TableRow key={idx}>
                      <TableCell>{error.row}</TableCell>
                      <TableCell>{error.data?.itemName || 'N/A'}</TableCell>
                      <TableCell>
                        <Typography variant="body2" color="error">
                          {error.error}
                        </Typography>
                        {error.missingFields && error.missingFields.length > 0 && (
                          <Typography variant="caption" color="textSecondary">
                            Missing: {error.missingFields.join(', ')}
                          </Typography>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
          </Paper>
        )}

        {!hasSuccess && !hasUpdates && !hasFailures && (
          <Alert severity="info">No items were processed. Please check your CSV file.</Alert>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} variant="contained" color="primary">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ImportErrorDialog;