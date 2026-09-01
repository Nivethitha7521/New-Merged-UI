
'use client';
import React, { useState, useMemo, useEffect } from 'react';
import {
  Tooltip,
  Collapse,
  Box,
  Snackbar,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
  Image as ImageIcon,
} from '@mui/icons-material';
import Image from 'next/image';
import { Item, Variance } from '../../Items/Item/Models/itemsModels';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../../../redux/store';
import {
  activateItem,
  deactivateItem,
  activateVariance,
  deactivateVariance,
} from '../../Items/Item/Features/itemSlice';

interface ItemsTableProps {
  allItems: Item[];
  selectedHeaders: string[];
  headerMapping: Record<string, string>;
  setOpenEdit: (item: Item & { fullData?: any } | null, varianceIndex?: number) => void;
  setOpenEditVariance: (open: boolean) => void;
  setIsPriceOverrideDialogOpen: (open: boolean) => void;
  search: string;
  currentPage: number;
  loading?: boolean;

  deactivatedPage?: number;
  deactivatedPageSize?: number;
  onDeactivatedTotalPages?: (total: number) => void;
}

// ── Confirmation Dialog ────────────────────────────────────────────────────────
const ConfirmationDialog: React.FC<{
  open: boolean;
  title: string;
  message: string;
  onConfirm: () => Promise<void>;
  onCancel: () => void;
  loading: boolean;
  confirmButtonText?: string;
  confirmButtonClass?: string;
}> = ({
  open,
  title,
  message,
  onConfirm,
  onCancel,
  loading,
  confirmButtonText = 'Confirm',
  confirmButtonClass = 'btn-primary',
}) => {
    return (
      <Dialog
        open={open}
        onClose={onCancel}
        PaperProps={{ className: 'dialog-paper' }}
        disableEscapeKeyDown={loading}
      >
        <DialogTitle className="dialog-title">{title}</DialogTitle>
        <DialogContent className="dialog-content">
          <DialogContentText sx={{ color: 'text.secondary' }}>{message}</DialogContentText>
        </DialogContent>
        <DialogActions className="dialog-actions">
          <button onClick={onCancel} disabled={loading} className="btn-secondary">
            Cancel
          </button>
          <button onClick={onConfirm} disabled={loading} className={confirmButtonClass}>
            {loading ? 'Processing...' : confirmButtonText}
          </button>
        </DialogActions>
      </Dialog>
    );
  };

// ── Main Component ─────────────────────────────────────────────────────────────
const ItemsTable: React.FC<ItemsTableProps> = ({
  allItems,
  selectedHeaders,
  headerMapping,
  setOpenEdit,
  setOpenEditVariance,
  search,
  currentPage,
  loading = false,
  deactivatedPage,
  deactivatedPageSize,
  onDeactivatedTotalPages,
}) => {
  const dispatch = useDispatch<AppDispatch>();
  const showDeactivated = useSelector((state: RootState) => state.maItems.showDeactivated);

  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error';
  }>({
    open: false,
    message: '',
    severity: 'success',
  });

  const [dialog, setDialog] = useState<{
    open: boolean;
    title: string;
    message: string;
    onConfirm: () => Promise<void>;
    loading: boolean;
    confirmButtonText?: string;
    confirmButtonClass?: string;
  }>({
    open: false,
    title: '',
    message: '',
    onConfirm: async () => { },
    loading: false,
    confirmButtonText: 'Confirm',
    confirmButtonClass: 'btn-primary',
  });

  // ── Column visibility state ────────────────────────────────────────────────
  const [visibleColumns, setVisibleColumns] = useState<Record<string, boolean>>(() => {
    const map: Record<string, boolean> = {};
    selectedHeaders.forEach((h) => { map[h] = true; });
    return map;
  });

  // ── Derived visible headers ────────────────────────────────────────────────
  const shownHeaders = useMemo(
    () => selectedHeaders.filter((h) => visibleColumns[h] !== false),
    [selectedHeaders, visibleColumns]
  );

  const toggleColumn = (key: string) => {
    setVisibleColumns((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const itemsPerPage = 15;

  // ── Status detection helpers ───────────────────────────────────────────────
  const isItemActive = (item: Item): boolean => {
    return item.status === 'Active' || (!item.status || item.status === '') || item.status === 'active';
  };

  const isVarianceActive = (variance: Variance): boolean => {
    return variance.varianceStatus === 'active' || (!variance.varianceStatus || variance.varianceStatus === '');
  };

  // ── FIX 1: Filter out items that have 0 active variances in active view ────
  const filteredItems = useMemo(() => {
    // ── When deactivated: backend already filtered, just apply search ──────
    if (showDeactivated) {
      let items = [...allItems];
      if (search.trim()) {
        const lower = search.toLowerCase();
        items = items.filter((item) =>
          item.itemName?.toLowerCase().includes(lower) ||
          item.variances?.some(
            (v) =>
              v.varianceName?.toLowerCase().includes(lower) ||
              v.itemCode?.toLowerCase().includes(lower)
          )
        );
      }
      return items;
    }

    // ── Active view: filter and clean as before ────────────────────────────
    let items = [...allItems];

    // Keep only active items
    items = items.filter((item) => isItemActive(item));

    // Keep only active variances per item
    items = items.map((item) => ({
      ...item,
      variances: item.variances?.filter((v) => isVarianceActive(v)) || [],
    }));

    // ── FIX 1: Hide items that have NO active variances left ───────────────
    items = items.filter((item) => (item.variances?.length ?? 0) > 0);

    if (search.trim()) {
      const lower = search.toLowerCase();
      items = items.filter((item) =>
        item.itemName?.toLowerCase().includes(lower) ||
        item.variances?.some(
          (v) =>
            v.varianceName?.toLowerCase().includes(lower) ||
            v.itemCode?.toLowerCase().includes(lower)
        )
      );
    }

    return items;
  }, [allItems, search, showDeactivated]);

  // ── Auto-expand rows when search matches a variance ────────────────────────
  useEffect(() => {
    if (!search.trim()) {
      setExpandedRows(new Set());
      return;
    }

    const lower = search.toLowerCase();
    const toExpand = new Set<string>();

    filteredItems.forEach((item) => {
      const varianceMatch = item.variances?.some(
        (v) =>
          v.varianceName?.toLowerCase().includes(lower) ||
          v.itemCode?.toLowerCase().includes(lower)
      );
      if (varianceMatch) {
        toExpand.add(getRowKey(item));
      }
    });

    setExpandedRows(toExpand);
  }, [search, filteredItems]);

  // ── Row helpers ────────────────────────────────────────────────────────────
  const toggleRow = (key: string) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  const getRowKey = (item: Item): string =>
    item.itemCode || item.branchwiseItemId || item._id || Math.random().toString();

  const getDisplayHeader = (key: string): string => {
    return headerMapping[key] || key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()).trim();
  };

  const handleOpenEdit = (item: Item, varianceIndex?: number) => {
    const fullItemData = allItems.find((i) => i.itemName === item.itemName);
    const enrichedItem = {
      ...item,
      fullData: fullItemData?.variances || item.variances?.map((v) => ({ ...v, branchwise: {} })),
    };
    requestAnimationFrame(() => {
      setOpenEdit(enrichedItem, varianceIndex);
      if (varianceIndex !== undefined) setOpenEditVariance(true);
    });
  };

  // ── Cell renderer ──────────────────────────────────────────────────────────
  const renderCellContent = (item: Item, header: string) => {
    if (header === 'itemImage') {
      if (item.itemImage) {
        return (
          <Box
            onClick={(e) => {
              e.stopPropagation();
              window.open(item.itemImage, '_blank');
            }}
            sx={{
              cursor: 'pointer',
              width: 40,
              height: 40,
              border: '1px solid #e0e0e0',
              borderRadius: '8px',
              overflow: 'hidden',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto',
              '&:hover': {
                border: '1px solid #1976d2',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              },
            }}
          >
            <Image
              src={item.itemImage}
              alt={item.itemName || 'Item'}
              width={40}
              height={40}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          </Box>
        );
      } else {
        return (
          <Box
            sx={{
              width: 40,
              height: 40,
              border: '1px dashed #ccc',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto',
              color: '#999',
            }}
          >
            <ImageIcon fontSize="small" />
          </Box>
        );
      }
    }

    if (['variance_Defaultprice', 'reorderLevel', 'platPrice'].includes(header)) {
      const firstVariance = item.variances?.[0];
      if (header === 'variance_Defaultprice') return firstVariance?.variance_Defaultprice ?? '-';
      if (header === 'reorderLevel') return firstVariance?.reorderLevel ?? '-';
      if (header === 'platPrice') return firstVariance?.platPrice ?? item.platPrice ?? '-';
    }

    const value = (item as any)[header];

    if (header.toLowerCase().includes('tax') && typeof value === 'number') {
      return `${value}%`;
    }

    // ── Description tooltip ────────────────────────────────────────────────
    if (header === 'description') {
      const text = value !== undefined && value !== null ? String(value) : '-';
      if (text.length > 10) {
        return (
          <Tooltip title={text} arrow placement="top">
            <span style={{ cursor: 'default', whiteSpace: 'nowrap' }}>
              {text.slice(0, 10)}...
            </span>
          </Tooltip>
        );
      }
      return text || '-';
    }
    // ── End description tooltip ────────────────────────────────────────────

    return value !== undefined
      ? Array.isArray(value) ? value.join(', ') : value
      : '-';
  };


  // ── Status actions ─────────────────────────────────────────────────────────
  const handleDeactivateItem = (item: Item) => {
    const itemId = item.branchwiseItemId || item._id || item.itemId;
    if (!itemId) {
      setSnackbar({ open: true, message: 'Item ID missing', severity: 'error' });
      return;
    }
    setDialog({
      open: true,
      title: 'Confirm Item Deactivation',
      message: `Are you sure you want to deactivate item "${item.itemName || 'Unknown'}" and all its variances?`,
      loading: false,
      confirmButtonText: 'Deactivate',
      confirmButtonClass: 'btn-primary-delete',
      onConfirm: async () => {
        setDialog((d) => ({ ...d, loading: true }));
        try {
          await dispatch(
            deactivateItem({
              branchwiseItemId: itemId,
              page: currentPage,
              limit: itemsPerPage,
              itemName: search,
            })
          ).unwrap();
          setSnackbar({ open: true, message: 'Item and all variances deactivated successfully', severity: 'success' });
        } catch (err: any) {
          setSnackbar({ open: true, message: err?.message || 'Failed to deactivate item', severity: 'error' });
        } finally {
          setDialog((d) => ({ ...d, open: false, loading: false }));
        }
      },
    });
  };

  const handleActivateItem = (item: Item) => {
    const itemId = item.branchwiseItemId || item._id || item.itemId;
    if (!itemId) {
      setSnackbar({ open: true, message: 'Item ID missing', severity: 'error' });
      return;
    }
    setDialog({
      open: true,
      title: 'Confirm Item Activation',
      message: `Are you sure you want to activate item "${item.itemName || 'Unknown'}"?`,
      loading: false,
      confirmButtonText: 'Activate',
      confirmButtonClass: 'btn-primary',
      onConfirm: async () => {
        setDialog((d) => ({ ...d, loading: true }));
        try {
          await dispatch(
            activateItem({
              branchwiseItemId: itemId,
              page: currentPage,
              limit: itemsPerPage,
              itemName: search,
            })
          ).unwrap();
          setSnackbar({ open: true, message: 'Item activated successfully', severity: 'success' });
        } catch (err: any) {
          setSnackbar({ open: true, message: err?.message || 'Failed to activate item', severity: 'error' });
        } finally {
          setDialog((d) => ({ ...d, open: false, loading: false }));
        }
      },
    });
  };

  const handleDeactivateVariance = (item: Item, variance: Variance) => {
    const code = variance.itemCode;
    if (!code) {
      setSnackbar({ open: true, message: 'Variance code missing', severity: 'error' });
      return;
    }
    setDialog({
      open: true,
      title: 'Confirm Variance Deactivation',
      message: `Deactivate variance "${variance.varianceName || 'Unknown'}"? This variance will appear in the deactivated table.`,
      loading: false,
      confirmButtonText: 'Deactivate',
      confirmButtonClass: 'btn-primary-delete',
      onConfirm: async () => {
        setDialog((d) => ({ ...d, loading: true }));
        try {
          await dispatch(
            deactivateVariance({
              itemCode: code,
              page: currentPage,
              limit: itemsPerPage,
              itemName: search,
            })
          ).unwrap();
          setSnackbar({ open: true, message: 'Variance deactivated successfully', severity: 'success' });
        } catch (err: any) {
          setSnackbar({ open: true, message: err?.message || 'Failed to deactivate variance', severity: 'error' });
        } finally {
          setDialog((d) => ({ ...d, open: false, loading: false }));
        }
      },
    });
  };

  // ── FIX 2: Activate variance — also activate parent item if it's deactivated
  const handleActivateVariance = (item: Item, variance: Variance) => {
    const code = variance.itemCode;
    if (!code) {
      setSnackbar({ open: true, message: 'Variance code missing', severity: 'error' });
      return;
    }

    // Check if the parent item itself is deactivated
    const parentItemDeactivated = !isItemActive(item);
    const parentItemId = item.branchwiseItemId || item._id || item.itemId;

    const confirmMessage = parentItemDeactivated
      ? `Activate variance "${variance.varianceName || 'Unknown'}"? The parent item "${item.itemName || 'Unknown'}" is also deactivated and will be activated automatically so the variance appears in the active table.`
      : `Activate variance "${variance.varianceName || 'Unknown'}"?`;

    setDialog({
      open: true,
      title: 'Confirm Variance Activation',
      message: confirmMessage,
      loading: false,
      confirmButtonText: 'Activate',
      confirmButtonClass: 'btn-primary',
      onConfirm: async () => {
        setDialog((d) => ({ ...d, loading: true }));
        try {
          // Step 1: If parent item is deactivated, activate it first
          if (parentItemDeactivated && parentItemId) {
            await dispatch(
              activateItem({
                branchwiseItemId: parentItemId,
                page: currentPage,
                limit: itemsPerPage,
                itemName: search,
              })
            ).unwrap();
          }

          // Step 2: Activate the variance
          await dispatch(
            activateVariance({
              itemCode: code,
              page: currentPage,
              limit: itemsPerPage,
              itemName: search,
            })
          ).unwrap();

          setSnackbar({
            open: true,
            message: parentItemDeactivated
              ? 'Parent item and variance activated successfully'
              : 'Variance activated successfully',
            severity: 'success',
          });
        } catch (err: any) {
          setSnackbar({ open: true, message: err?.message || 'Failed to activate variance', severity: 'error' });
        } finally {
          setDialog((d) => ({ ...d, open: false, loading: false }));
        }
      },
    });
  };

  //   const formatDateTime = (dateStr: string) => {
  //   const date = new Date(dateStr);
  //   const datePart = date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  //   const timePart = date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: true }).toUpperCase();
  //   return `${datePart} | ${timePart}`;
  // };

  const formatDateTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const datePart = date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    const timePart = date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: true }).toUpperCase();
    return (
      <>
        <div>{datePart}</div>
        <div>{timePart}</div>
      </>
    );
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <>
      {/* ── Table ─────────────────────────────────────────────────────────── */}
    <div className="table-container item-master-table-container" style={{ maxHeight: 'calc(86.5vh - 170px)' }}>
        <table className="custom-table item-master-table">
          <thead>
            <tr>
              <th>S.No</th>
              {shownHeaders.map((header) => (
                <th key={header}>{getDisplayHeader(header)}</th>
              ))}
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={shownHeaders.length + 2} style={{ textAlign: 'center' }}>
                  <h3 style={{ fontWeight: 'bold' }}>Loading...</h3>
                </td>
              </tr>
            ) : (
              <>
                {filteredItems.length === 0 ? (
                  <tr>
                    <td colSpan={shownHeaders.length + 2} className="empty-state">
                      {showDeactivated
                        ? 'No deactivated items or variances found'
                        : 'No active items found'}
                    </td>
                  </tr>
                ) : (
                  filteredItems.map((item, index) => {
                    const rowKey = getRowKey(item);
                    const isExpanded = expandedRows.has(rowKey);

                    const serialNo = showDeactivated
                      ? index + 1
                      : (currentPage - 1) * itemsPerPage + index + 1;
                    const itemIsDeactivated = !isItemActive(item);

                    return (
                      <React.Fragment key={rowKey}>
                        {/* ── Main Item Row ──────────────────────────────── */}
                        <tr
                        className={`clickable-row item-master-data-row ${itemIsDeactivated ? 'is-deactivated' : ''}`}
                          style={itemIsDeactivated ? { backgroundColor: '#fee' } : {}}
                          onClick={() => toggleRow(rowKey)}
                         
                        >
                          <td style={{ textAlign: 'center' }}>{serialNo}</td>
                          {shownHeaders.map((header) => (
                            <td
                              key={header}
                              style={{ cursor: header === 'itemImage' ? 'default' : 'pointer' }}
                            >
                              {renderCellContent(item, header)}
                            </td>
                          ))}
                          <td
                          className="item-master-actions-cell"
                            style={{ textAlign: 'center' }}
                            onClick={(e) => e.stopPropagation()}
                          >
                            {!itemIsDeactivated && !showDeactivated && (
                              <Tooltip title="Edit Item">
                                <button
                                  className="edit-btn"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    e.preventDefault();
                                    handleOpenEdit(item);
                                  }}
                                >
                                  <EditIcon fontSize="small" />
                                </button>
                              </Tooltip>
                            )}

                            {itemIsDeactivated ? (
                              <Tooltip title="Activate Item">
                                <button
                                  className="edit-btn"
                                  style={{ marginLeft: '12px' }}
                                  onClick={() => handleActivateItem(item)}
                                >
                                  <RefreshIcon fontSize="small" />
                                </button>
                              </Tooltip>
                            ) : showDeactivated ? (
                              <Tooltip title="Item is Active (visible here because it has deactivated variances)">
                                <span style={{ marginLeft: '12px', opacity: 0.5 }}>
                                  <RefreshIcon fontSize="small" />
                                </span>
                              </Tooltip>
                            ) : (
                              <Tooltip title="Deactivate Item">
                                <button
                                  className="deactivate-btn"
                                  style={{ marginLeft: '12px' }}
                                  onClick={() => handleDeactivateItem(item)}
                                >
                                  <DeleteIcon fontSize="small" />
                                </button>
                              </Tooltip>
                            )}
                          </td>
                        </tr>

                        {/* ── Expanded Variance Sub-Table ────────────────── */}
                       <tr className="item-master-variance-collapse-row">
                          <td colSpan={shownHeaders.length + 2} style={{ padding: 0 }}>
                            <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                              <Box
                                sx={{
                                  margin: '12px auto',
                                  backgroundColor: '#fff',
                                  borderRadius: '8px',
                                  overflow: 'hidden',
                                  maxWidth: '95%',
                                  width: 'fit-content',
                                }}
                              >
                             <table className="item-master-variance-table" style={{ border: '1px solid #e5e7eb', width: '100%' }}>
                                  <thead>
                                    <tr>
                                      <th>S.no</th>
                                      <th>Image</th>
                                      <th title="Variance Name">Var Name</th>
                                      <th>Sap Code</th>
                                      <th>Item Code</th>
                                      <th title="Variance Price">Var Price</th>
                                      <th>UOM</th>
                                      <th title="Reorder Level">ROL</th>
                                      <th>Shelf Life</th>
                                      <th>CreatedDate</th>
                                      <th>UpdatedDate</th>
                                      <th>Actions</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {item.variances && item.variances.length > 0 ? (
                                      item.variances.map((variance, vIndex) => {
                                        const varianceIsDeactivated = !isVarianceActive(variance);
                                        const lower = search.toLowerCase();
                                        const varNameMatch =
                                          search.trim() &&
                                          variance.varianceName?.toLowerCase().includes(lower);
                                        const itemCodeMatch =
                                          search.trim() &&
                                          variance.itemCode?.toLowerCase().includes(lower);

                                        return (
                                          <tr
                                            key={vIndex}
                                            style={
                                              varianceIsDeactivated
                                                ? { backgroundColor: '#ffebee' }
                                                : {}
                                            }
                                          >
                                            <td style={{ textAlign: 'center' }}>{vIndex + 1}</td>


                                            <td style={{ textAlign: 'center' }}>
                                              {variance.varianceImage ? (
                                                <Box
                                                  onClick={(e) => { e.stopPropagation(); window.open(variance.varianceImage, '_blank'); }}
                                                  sx={{ cursor: 'pointer', width: 32, height: 32, border: '1px solid #e0e0e0', borderRadius: '6px', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto' }}
                                                >
                                                  <Image src={variance.varianceImage} alt={variance.varianceName || 'Variance'} width={32} height={32} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                </Box>
                                              ) : (
                                                <Box sx={{ width: 32, height: 32, border: '1px dashed #ccc', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto', color: '#999' }}>
                                                  <ImageIcon fontSize="small" />
                                                </Box>
                                              )}
                                            </td>

                                            {/* Variance Name — highlighted if search matches */}
                                            <td style={{ textAlign: 'center' }}>
                                              {varNameMatch ? (
                                                <mark
                                                  style={{
                                                    backgroundColor: '#fef08a',
                                                    borderRadius: '2px',
                                                    padding: '0 2px',
                                                  }}
                                                >
                                                  {variance.varianceName}
                                                </mark>
                                              ) : (
                                                variance.varianceName || '-'
                                              )}
                                            </td>

                                            <td style={{ textAlign: 'center' }}>
                                              {variance.sapCode || '-'}
                                            </td>

                                            {/* Item Code — highlighted if search matches */}
                                            <td style={{ textAlign: 'center' }}>
                                              {itemCodeMatch ? (
                                                <mark
                                                  style={{
                                                    backgroundColor: '#fef08a',
                                                    borderRadius: '2px',
                                                    padding: '0 2px',
                                                  }}
                                                >
                                                  {variance.itemCode}
                                                </mark>
                                              ) : (
                                                variance.itemCode || '-'
                                              )}
                                            </td>

                                            <td style={{ textAlign: 'center' }}>
                                              {variance.variance_Defaultprice ?? '-'}
                                            </td>
                                            <td style={{ textAlign: 'center' }}>
                                              {variance.variance_Uom || '-'}
                                            </td>
                                            <td style={{ textAlign: 'center' }}>
                                              {variance.reorderLevel ?? '-'}
                                            </td>
                                            <td style={{ textAlign: 'center' }}>
                                              {variance.shelfLife ?? '-'}
                                            </td>

                                            <td style={{ textAlign: 'center', whiteSpace: 'nowrap' }}>
                                              {variance.createdDate ? formatDateTime(variance.createdDate) : '-'}
                                            </td>

                                            <td style={{ textAlign: 'center', whiteSpace: 'nowrap' }}>
                                              {variance.updatedDate ? formatDateTime(variance.updatedDate) : '-'}
                                            </td>

                                            <td style={{ textAlign: 'center' }}>
                                              {!varianceIsDeactivated && (
                                                <Tooltip title="Edit Variance">
                                                  <button
                                                    className="edit-btn"
                                                    onClick={(e) => {
                                                      e.stopPropagation();
                                                      e.preventDefault();
                                                      handleOpenEdit(item, vIndex);
                                                    }}
                                                  >
                                                    <EditIcon fontSize="small" />
                                                  </button>
                                                </Tooltip>
                                              )}

                                              {varianceIsDeactivated ? (
                                                <Tooltip title="Activate Variance">
                                                  <button
                                                    className="edit-btn"
                                                    style={{
                                                      minHeight: '36px',
                                                      alignItems: 'center',
                                                      justifyContent: 'center',
                                                      padding: '0 12px',
                                                    }}
                                                    // ── FIX 2: Pass `item` so we can check parent status
                                                    onClick={() => handleActivateVariance(item, variance)}
                                                  >
                                                    <RefreshIcon fontSize="small" />
                                                  </button>
                                                </Tooltip>
                                              ) : (
                                                <Tooltip title="Deactivate Variance">
                                                  <button
                                                    className="deactivate-btn"
                                                    onClick={() =>
                                                      handleDeactivateVariance(item, variance)
                                                    }
                                                  >
                                                    <DeleteIcon fontSize="small" />
                                                  </button>
                                                </Tooltip>
                                              )}
                                            </td>
                                          </tr>
                                        );
                                      })
                                    ) : (
                                      <tr>
                                        <td colSpan={9} className="empty-state">
                                          No {showDeactivated ? 'deactivated' : 'active'} variances
                                        </td>
                                      </tr>
                                    )}
                                  </tbody>
                                </table>
                              </Box>
                            </Collapse>
                          </td>
                        </tr>
                      </React.Fragment>
                    );
                  })
                )}
              </>
            )}
          </tbody>
        </table>
      </div>

      {/* ── Snackbar ───────────────────────────────────────────────────────── */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>

      {/* ── Confirmation Dialog ────────────────────────────────────────────── */}
      <ConfirmationDialog
        open={dialog.open}
        title={dialog.title}
        message={dialog.message}
        onConfirm={dialog.onConfirm}
        onCancel={() => !dialog.loading && setDialog((d) => ({ ...d, open: false }))}
        loading={dialog.loading}
        confirmButtonText={dialog.confirmButtonText}
        confirmButtonClass={dialog.confirmButtonClass}
      />
    </>
  );
};

export default ItemsTable;