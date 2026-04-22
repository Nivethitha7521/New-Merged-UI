// components/yen-purchase/OutgoingComponent/ColumnSettingsDialog.tsx
import React, { useState, useEffect, useRef } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, List, ListItem, ListItemText, Checkbox,
  IconButton, Box, Typography, Tooltip, Paper,
} from '@mui/material';
import { Restore as RestoreIcon, DragIndicator as DragIcon } from '@mui/icons-material';
import { useDispatch, useSelector } from 'react-redux';
import {
  selectAllColumns, toggleColumnVisibility, resetToDefault,
  updateColumnOrder, showAllColumns, showOnlyColumns,
} from '../Features/columnPreferencesSlice';
import ConfirmationDialog from '@/components/confirmationDialog';

interface ColumnSettingsDialogProps {
  open: boolean;
  onClose: () => void;
}

interface ConfirmDialogProps {
  title: string;
  description: string;
  onConfirm: () => void;
}

const ColumnSettingsDialog: React.FC<ColumnSettingsDialogProps> = ({ open, onClose }) => {
  const dispatch = useDispatch();
  const columns = useSelector(selectAllColumns);
  const [localColumns, setLocalColumns] = useState<typeof columns>([]);
  const dragSrcIndex = useRef<number | null>(null);

  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [confirmDialogProps, setConfirmDialogProps] = useState<ConfirmDialogProps>({
    title: '',
    description: '',
    onConfirm: () => {},
  });

  useEffect(() => {
    if (open) setLocalColumns(columns.map(col => ({ ...col })));
  }, [open, columns]);

  const openConfirm = (props: ConfirmDialogProps) => {
    setConfirmDialogProps(props);
    setConfirmDialogOpen(true);
  };

  const handleToggleColumn = (columnId: string) => {
    dispatch(toggleColumnVisibility({ columnId }));
  };

  const handleResetToDefault = () => {
    openConfirm({
      title: 'Reset column settings',
      description: 'All column settings will be reset to default. Are you sure?',
      onConfirm: () => {
        dispatch(resetToDefault());
        setConfirmDialogOpen(false);
      },
    });
  };

  const handleShowAll = () => dispatch(showAllColumns());

  const handleHideAll = () => {
    openConfirm({
      title: 'Hide all columns',
      description: 'All columns will be hidden. You can show them again from this dialog.',
      onConfirm: () => {
        dispatch(showOnlyColumns([]));
        setConfirmDialogOpen(false);
      },
    });
  };

  const handleDragStart = (index: number) => {
    dragSrcIndex.current = index;
  };

  const handleDrop = (targetIndex: number) => {
    const srcIndex = dragSrcIndex.current;
    if (srcIndex === null || srcIndex === targetIndex) return;

    const newOrder = [...localColumns];
    const [moved] = newOrder.splice(srcIndex, 1);
    newOrder.splice(targetIndex, 0, moved);
    setLocalColumns(newOrder);
    dispatch(updateColumnOrder(newOrder.map(c => c.id)));
    dragSrcIndex.current = null;
  };

  const visibleCount = columns.filter(c => c.visible).length;
  const sortedColumns = [...localColumns].sort((a, b) => a.order - b.order);

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">Column Settings</Typography>
            <Tooltip title="Reset to Default">
              <IconButton onClick={handleResetToDefault} size="small" color="primary">
                <RestoreIcon />
              </IconButton>
            </Tooltip>
          </Box>
          <Typography variant="caption" color="text.secondary">
            {visibleCount} of {columns.length} columns visible
          </Typography>
          <Typography variant="caption" color="text.secondary" display="block">
            Settings are saved globally and will be same for all users
          </Typography>
        </DialogTitle>

        <DialogContent dividers>
          <Box sx={{ mb: 2, display: 'flex', gap: 1, justifyContent: 'space-between' }}>
            <Button size="small" onClick={handleShowAll} variant="outlined">Show All</Button>
            <Button size="small" onClick={handleHideAll} variant="outlined" color="warning">Hide All</Button>
          </Box>

          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Drag rows to reorder columns. Check/uncheck to show or hide.
          </Typography>

       <Paper variant="outlined" sx={{ maxHeight: 400, overflow: 'auto' }}>
  <List dense disablePadding>
    {sortedColumns.map((column, index) => (
      <ListItem
        key={column.id}
        draggable
        onDragStart={() => handleDragStart(index)}
        onDragOver={e => e.preventDefault()}
        onDrop={() => handleDrop(index)}
        sx={{
          borderBottom: index < sortedColumns.length - 1 ? '1px solid #e0e0e0' : 'none',
          cursor: 'grab',
          '&:active': { cursor: 'grabbing' },
          opacity: column.visible ? 1 : 0.5,
          alignItems: 'center',
          flexWrap: 'nowrap',        // ← row itself won't wrap
          minWidth: 0,               // ← allows children to shrink
        }}
      >
        <DragIcon fontSize="small" sx={{ color: 'text.disabled', mr: 1, flexShrink: 0 }} />
        <Checkbox
          checked={column.visible}
          onChange={() => handleToggleColumn(column.id)}
          size="small"
          sx={{ flexShrink: 0, p: 0.5 }}
        />
        <Box sx={{ minWidth: 0, flex: 1, ml: 1 }}>   {/* ← key fix */}
          <Typography
            variant="body2"
            sx={{
              whiteSpace: 'normal',
              wordBreak: 'break-word',
              lineHeight: 1.4,
            }}
          >
            {column.label}
          </Typography>
        </Box>
      </ListItem>
    ))}
  </List>
</Paper>
        </DialogContent>

        <DialogActions>
          <Button onClick={onClose} variant="contained">Close</Button>
        </DialogActions>
      </Dialog>

      <ConfirmationDialog
        open={confirmDialogOpen}
        onClose={() => setConfirmDialogOpen(false)}
        onConfirm={confirmDialogProps.onConfirm}
        title={confirmDialogProps.title}
        description={confirmDialogProps.description}
      />
    </>
  );
};

export default ColumnSettingsDialog;