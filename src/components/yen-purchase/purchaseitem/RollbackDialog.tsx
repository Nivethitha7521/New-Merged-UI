// RollbackDialog.tsx - Simplified
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Chip,
  Box,
  Typography,
  CircularProgress,
  Alert,
  Divider
} from '@mui/material';
import { Restore as RestoreIcon } from '@mui/icons-material';

interface BackupInfo {
  backup_id: string;
  created_at: string;
  purchase_count: number;
  master_count: number;
}

interface RollbackDialogProps {
  open: boolean;
  onClose: () => void;
  onRollback: (backupId: string) => Promise<void>;
  fetchBackups: () => Promise<BackupInfo[]>;
}

const RollbackDialog: React.FC<RollbackDialogProps> = ({
  open,
  onClose,
  onRollback,
  fetchBackups
}) => {
  const [backups, setBackups] = useState<BackupInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedBackup, setSelectedBackup] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const loadBackups = async () => {
    setLoading(true);
    try {
      const backupList = await fetchBackups();
      setBackups(backupList);
    } catch (error) {
      console.error('Error loading backups:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      loadBackups();
    }
  }, [open]);

  const handleRollbackClick = (backupId: string) => {
    setSelectedBackup(backupId);
    setConfirmOpen(true);
  };

  const handleConfirmRollback = async () => {
    if (selectedBackup) {
      setLoading(true);
      try {
        await onRollback(selectedBackup);
        setConfirmOpen(false);
        onClose();
        // Reload backups after rollback
        await loadBackups();
      } catch (error) {
        console.error('Rollback error:', error);
      } finally {
        setLoading(false);
      }
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Unknown';
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const getTotalItems = (backup: BackupInfo) => {
    return backup.purchase_count + backup.master_count;
  };

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={1}>
            <RestoreIcon color="secondary" />
            <Typography variant="h6">Rollback to Previous Backup</Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Alert severity="info" sx={{ mb: 2 }}>
            This will restore BOTH Purchase Items AND Finished Goods (EX) items from the selected backup.
          </Alert>
          
          {loading ? (
            <Box display="flex" justifyContent="center" p={3}>
              <CircularProgress />
            </Box>
          ) : backups.length === 0 ? (
            <Alert severity="info">No backups available for rollback.</Alert>
          ) : (
            <List>
              {backups.map((backup, index) => (
                <React.Fragment key={backup.backup_id}>
                  {index > 0 && <Divider />}
                  <ListItem
                    sx={{
                      bgcolor: '#fafafa',
                      '&:hover': { bgcolor: '#f0f0f0' }
                    }}
                  >
                    <ListItemText
                      primary={
                        <Box>
                          <Typography variant="subtitle2" fontWeight="bold">
                            Backup: {backup.backup_id}
                          </Typography>
                          <Box display="flex" gap={1} mt={0.5}>
                            <Chip
                              label={`Purchase: ${backup.purchase_count} items`}
                              size="small"
                              color="primary"
                              variant="outlined"
                            />
                            <Chip
                              label={`Master: ${backup.master_count} items`}
                              size="small"
                              color="secondary"
                              variant="outlined"
                            />
                            <Chip
                              label={`Total: ${getTotalItems(backup)} items`}
                              size="small"
                              color="info"
                            />
                          </Box>
                          <Typography variant="caption" display="block" sx={{ mt: 0.5 }}>
                            Created: {formatDate(backup.created_at)}
                          </Typography>
                        </Box>
                      }
                    />
                    <ListItemSecondaryAction>
                      <Button
                        variant="contained"
                        color="secondary"
                        size="small"
                        onClick={() => handleRollbackClick(backup.backup_id)}
                        startIcon={<RestoreIcon />}
                      >
                        Restore
                      </Button>
                    </ListItemSecondaryAction>
                  </ListItem>
                </React.Fragment>
              ))}
            </List>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Confirm Rollback Dialog */}
      <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)}>
        <DialogTitle>Confirm Rollback</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to restore from this backup?
          </DialogContentText>
          <Alert severity="warning" sx={{ mt: 2 }}>
            This will replace ALL current Purchase Items and Finished Goods (EX) items with the backed up data.
          </Alert>
          <Alert severity="info" sx={{ mt: 1 }}>
            This action cannot be undone unless you have another backup.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmOpen(false)}>Cancel</Button>
          <Button onClick={handleConfirmRollback} color="secondary" variant="contained" autoFocus>
            Yes, Restore Now
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default RollbackDialog;