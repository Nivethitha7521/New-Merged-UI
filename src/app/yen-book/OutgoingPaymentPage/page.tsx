"use client";
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import Link from 'next/link';
import {
  Grid,
  Typography,
  TableContainer,
  Paper,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Box,
  FormControl,
  Checkbox,
  Snackbar,
  Tooltip,
  IconButton,
  Autocomplete,
  AutocompleteChangeReason,
  Menu,
  MenuItem,
  Divider,CircularProgress
} from '@mui/material';
import YenBookPage from '../page';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import DescriptionIcon from '@mui/icons-material/Description';
import DownloadIcon from '@mui/icons-material/Download';
import FilterAltIcon from '@mui/icons-material/FilterAlt';
import PaymentsIcon from '@mui/icons-material/Payments';
import PaymentIcon from '@mui/icons-material/Payment';
import FilterListIcon from '@mui/icons-material/FilterList';
import {
  fetchOutgoings,
  selectOutgoings, fetchVendorDetails, fetchBank, selectTotalItems, setPagination,
  setSnackbarMessage, clearSnackbarMessage, setSnackbarOpen, selectCurrentPage, selectPageSize,
  selectTotalPayableAmount,
  toggleOutgoingSelection,
  syncSelectionsWithCurrentData,
  clearSelection,
  fetchOutgoingStatuses,
  initializePreferences,
  toggleColumnVisibility
} from '../../../features/yen-purchase/Outgoing/outgoingPaymentSlice';
import { fetchGrnById, fetchItemwiseGrns, selectGrn } from '@/features/yen-purchase/GRN/grnSlice';
import { AppDispatch, RootState } from '@/redux/store';
import { Outgoing, VendorDetail } from '@/Models/outgoingModel';
import { GrnResponse, ItemDetail, ItemDetailResponse } from '@/Models/grnModel';
import jsPDF from 'jspdf';
import "jspdf-autotable";
import { fetchBusinesses, fetchPhoto, selectBusinesses } from '@/features/account-setting/businessSlice';
import { format } from 'date-fns';
import Papa from 'papaparse';
import { ChevronLeft, ChevronRight } from '@mui/icons-material';
import DateRangeDialog from '@/components/dateRange';
require('react-date-range/dist/styles.css');
require('react-date-range/dist/theme/default.css');
import { VendorSearch } from '@/Models/vendor';
import { ClearIcon } from '@mui/x-date-pickers/icons';
import moment from 'moment';
import { fetchItemwiseAps, fetchRandomIDApInvoices, selectApinvoice, setApDialogOpen, setSelectedinvoiceId } from '@/features/yen-purchase/AP/apInvoiceSlice';
import { clearDebitCreditNotes, fetchAllDebitNotesComprehensive, fetchAllDebitNotesForDocument, selectDebitCreditNote, setDebitCreditDialogOpen, setDebitCreditDocumentId, setDebitCreditDocumentType } from '@/features/yen-purchase/DebitNoteSlice';
import DebitCreditNoteDialog from '@/components/yen-purchase/DebitNoteDialog';
import GrnDialog from '@/components/yen-purchase/OutgoingComponent/GRNDialog';
import ApInvoiceDialog from '@/components/yen-purchase/OutgoingComponent/APDialog';
import { fetchPoById, selectPurchaseListState, setPoDialogOpen, setSelectedPo } from '@/features/yen-purchase/PurchaseOrder/purchaseListSlice';
import { ItemDetailResponsePO, PoResponse } from '@/Models/purchaseModel';
import PODialog from '@/components/yen-purchase/OutgoingComponent/PODialog';
import ConfirmationDialog from '@/components/confirmationDialog';
import BulkPaymentDialog from '@/components/yen-purchase/OutgoingComponent/BulkPaymentDialog';
import SinglePaymentDialog from '@/components/yen-purchase/OutgoingComponent/SinglePayment';
import { ServiceData } from '@/app/yen-purchase/ServiceOrder/Models/servicepo';
import ServiceDialog from '@/app/yen-purchase/ServiceOrder/Components/ServiceDialog';
import { fetchServiceById } from '@/app/yen-purchase/ServiceOrder/Features/servicelist';
import { usePermissions } from "@/hooks/usePermissions";
import VendorSearchAutocomplete from '@/components/vendorsearchautocomplete';

const OutgoingPaymentComponent = React.memo(() => {
  const dispatch = useDispatch<AppDispatch>();
  const { hasPermission, isModuleVisible } = usePermissions();
  const canRead = hasPermission("yenerp", "outgoingpayment", "read");
  const { outgoings, snackbarMessage, snackbarOpen, selection, outgoingvendor, banks } = useSelector(selectOutgoings);
  const { itemwise } = useSelector(selectGrn);
  const { randomIdap, apDialogOpen, selectedinvoiceId, itemwiseap } = useSelector(selectApinvoice);
  const { businesses } = useSelector(selectBusinesses);
  const { selectedPo, poDialogOpen, loading } = useSelector(selectPurchaseListState);

  const [selectedOutgoing, setSelectedOutgoing] = useState<any>(null);
  const [openDetailsDialog, setOpenDetailsDialog] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState<VendorSearch | null>(null);
  const [viewItemsDialogOpen, setViewItemsDialogOpen] = useState(false);
  const [selectedGrn, setSelectedGrn] = useState<GrnResponse | null>(null);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [isBulkPaymentOpen, setIsBulkPaymentOpen] = useState(false);
  const [paymentTypeMultiple, setPaymentTypeMultiple] = useState<{ [outgoingId: string]: 'full' | 'partial' }>({});
  const [loadingState, setLoadingState] = useState<'idle' | 'loading' | 'succeeded' | 'failed'>('idle');
  const [loadingData, setLoadingData] = useState(true);
  const [fetchedBusinessIds, setFetchedBusinessIds] = useState(new Set());
  const [status, setStatus] = useState('');
  const selectedRows = selection.selectedOutgoingIds;
  const selectedOutgoings = selection.selectedOutgoings;
  const [paymentTerms, setPaymentTerms] = useState("");
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedService, setSelectedService] = useState<ServiceData | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc' | null>(null);
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const currentPage = useSelector(selectCurrentPage);
  const pageSize = useSelector(selectPageSize);
  const totalItems = useSelector(selectTotalItems);
  const totalPayableAmount = useSelector(selectTotalPayableAmount);
  const newPage = useSelector(selectCurrentPage);
  const [selectionRange, setSelectionRange] = useState({
    startDate: new Date(),
    endDate: new Date(),
    key: 'selection',
  });
  const dateField = 'invoiceDate';
  const fromDate = moment().utc().startOf('day').toDate();
  const toDate = moment().utc().endOf('day').toDate();
  const [columnFilterAnchorEl, setColumnFilterAnchorEl] = useState<null | HTMLElement>(null);
  const [isFilterActive, setIsFilterActive] = useState(false);
  const [availableStatuses, setAvailableStatuses] = useState<string[]>([]);
  // Replace your useState for visibleColumns with this:
  const [visibleColumns, setVisibleColumns] = useState(() => {
    const defaultColumns = [
      { id: 'serialNo', label: 'S.No', align: 'center', sortable: false, visible: true },
      { id: 'select', label: 'Select', align: 'center', sortable: false, visible: true },
      { id: 'poNo', label: 'PO.No/SO.No', align: 'left', sortable: false, visible: true },
      { id: 'grnNo', label: 'GRN No', align: 'left', sortable: false, visible: true },
      { id: 'apNo', label: 'AP No', align: 'left', sortable: false, visible: true },
      { id: 'outgoingNo', label: 'Outgoing No', align: 'left', sortable: false, visible: true },
      { id: 'vendorName', label: 'Vendor Name', align: 'left', sortable: true, visible: true },
      { id: 'type', label: 'Type', align: 'left', sortable: false, visible: true },
      { id: 'invoiceNo', label: 'Invoice No', align: 'left', sortable: false, visible: true },
      { id: 'invoiceDate', label: 'Invoice Date', align: 'left', sortable: true, visible: true },
      { id: 'invoiceAmount', label: 'Invoice Amount', align: 'right', sortable: false, visible: true },
      { id: 'taxDetails', label: 'Tax Details', align: 'left', sortable: false, visible: true },
      { id: 'discountAmount', label: 'Discount Amount', align: 'right', sortable: false, visible: true },
      { id: 'total', label: 'Total', align: 'right', sortable: false, visible: true },
      { id: 'paidAmount', label: 'Paid Amount', align: 'right', sortable: false, visible: true },
      { id: 'remainingAmount', label: 'Remaining Amount', align: 'right', sortable: false, visible: true },
      { id: 'dueDays', label: 'Due Days', align: 'center', sortable: true, visible: true },
      { id: 'paymentTerms', label: 'Payment Terms', align: 'center', sortable: true, visible: true },
      { id: 'verifiedBy', label: 'Verified By', align: 'left', sortable: false, visible: true },
      { id: 'verifiedDate', label: 'Verified Date', align: 'center', sortable: false, visible: true },
      { id: 'action', label: 'Action', align: 'center', sortable: false, visible: true },
    ];

    try {
      const saved = localStorage.getItem('outgoingPaymentColumnPreferences');
      if (saved) {
        const preferences = JSON.parse(saved);
        return defaultColumns.map(col => ({
          ...col,
          visible: preferences.find((p: any) => p.id === col.id)?.visible ?? col.visible
        }));
      }
    } catch (e) {
      console.error('Failed to load column preferences:', e);
    }

    return defaultColumns;
  });

  // And initialize tempVisibleColumns the same way:
  const [tempVisibleColumns, setTempVisibleColumns] = useState(() => {
    try {
      const saved = localStorage.getItem('outgoingPaymentColumnPreferences');
      if (saved) {
        const preferences = JSON.parse(saved);
        return preferences.filter((p: any) => p.visible).map((p: any) => p.id);
      }
    } catch (e) { }
    return ['serialNo', 'select', 'poNo', 'grnNo', 'apNo', 'outgoingNo', 'vendorName', 'type', 'invoiceNo', 'invoiceDate', 'invoiceAmount', 'taxDetails', 'discountAmount', 'total', 'paidAmount', 'remainingAmount', 'dueDays', 'paymentTerms', 'verifiedBy', 'verifiedDate', 'action'];
  });
  const hasMounted = useRef(false);
  const [confirmDialogProps, setConfirmDialogProps] = useState<{
    title: string;
    description: string | JSX.Element;
    onConfirm: () => void;
  }>({
    title: '',
    description: '',
    onConfirm: () => { },
  });
  const debitCreditNotes = useSelector((state: RootState) => selectDebitCreditNote(state).debitCreditNotes);

  const selectedApInvoice = useMemo(() => {
    if (!selectedinvoiceId) return null;
    return itemwiseap.find(ap => ap.invoiceId === selectedinvoiceId) || null;
  }, [selectedinvoiceId, itemwiseap]);

  // Column names for display
  const columnNameMap: Record<string, string> = {
    serialNo: 'S.No',
    select: 'Select',
    poNo: 'PO.No/SO.No',
    grnNo: 'GRN No',
    apNo: 'AP No',
    outgoingNo: 'Outgoing No',
    vendorName: 'Vendor Name',
    type: 'Type',
    invoiceNo: 'Invoice No',
    invoiceDate: 'Invoice Date',
    invoiceAmount: 'Invoice Amount',
    taxDetails: 'Tax Details',
    discountAmount: 'Discount Amount',
    total: 'Total',
    paidAmount: 'Paid Amount',
    remainingAmount: 'Remaining Amount',
    dueDays: 'Due Days',
    paymentTerms: 'Payment Terms',
    verifiedBy: 'Verified By',
    verifiedDate: 'Verified Date',
    action: 'Action'
  };

  // All columns for filter menu
  const allTableColumns = [
    'serialNo', 'select', 'poNo', 'grnNo', 'apNo', 'outgoingNo', 'vendorName',
    'type', 'invoiceNo', 'invoiceDate', 'invoiceAmount', 'taxDetails',
    'discountAmount', 'total', 'paidAmount', 'remainingAmount', 'dueDays',
    'paymentTerms', 'verifiedBy', 'verifiedDate', 'action'
  ];

  const handleColumnFilterClick = (event: React.MouseEvent<HTMLElement>) => {
    setColumnFilterAnchorEl(event.currentTarget);
    setTempVisibleColumns(visibleColumns.filter(col => col.visible).map(col => col.id));
  };

const handleColumnToggle = (columnId: string) => {
  // Update tempVisibleColumns
  const newTempVisibleColumns = tempVisibleColumns.includes(columnId)
    ? tempVisibleColumns.filter((id: string) => id !== columnId)
    : [...tempVisibleColumns, columnId];

  setTempVisibleColumns(newTempVisibleColumns);

  // Immediately update visibleColumns
  setVisibleColumns(prev =>
    prev.map(col => ({
      ...col,
      visible: newTempVisibleColumns.includes(col.id)
    }))
  );
};
  const handleColumnFilterClose = () => {
    setColumnFilterAnchorEl(null);
  };

  useEffect(() => {
    const loadPreferences = () => {
      try {
        const savedPreferences = localStorage.getItem('outgoingPaymentColumnPreferences');
        if (savedPreferences) {
          const preferences = JSON.parse(savedPreferences);
          // Update visibleColumns based on saved preferences
          setVisibleColumns(prev =>
            prev.map(col => ({
              ...col,
              visible: preferences.find((p: any) => p.id === col.id)?.visible ?? col.visible
            }))
          );
          // Update tempVisibleColumns
          const visibleColumnIds = preferences
            .filter((p: any) => p.visible)
            .map((p: any) => p.id);
          setTempVisibleColumns(visibleColumnIds);
        } else {
          // Set default: all columns visible
          const allVisibleIds = visibleColumns.filter(col => col.visible).map(col => col.id);
          setTempVisibleColumns(allVisibleIds);
        }
      } catch (error) {
        console.error('Failed to load column preferences:', error);
      }
    };

    loadPreferences();
  }, []);

  // Keep only this — just saving, no loading useEffect needed anymore
  useEffect(() => {
    try {
      const preferences = visibleColumns.map(col => ({ id: col.id, visible: col.visible }));
      localStorage.setItem('outgoingPaymentColumnPreferences', JSON.stringify(preferences));
    } catch (e) {
      console.error('Failed to save column preferences:', e);
    }
  }, [visibleColumns]);
useEffect(() => {
  if (!canRead) return;
  if (hasMounted.current) return;
  hasMounted.current = true;

  const defaultSortBy = sortColumn ? sortColumn : 'createdDate';
  const defaultSortOrder = sortOrder === 'asc' ? 'ascending' : 'descending';

  const sortFieldMap: { [key: string]: string } = {
    dueDays: 'intimationDays',
    paymentTerms: 'paymentTerms',
    payableAmount: 'payableAmount',
    totalPaid: 'totalPaid',
    remainingAmount: 'totalPayableAmount',
    totalPrice: 'totalPrice',
    invoiceDate: 'invoiceDate',
    vendorName: 'vendorName'
  };

  const backendSortField = sortFieldMap[defaultSortBy] || 'createdDate';

  const loadOutgoings = async () => {
    try {
      setLoadingData(true);

      await dispatch(fetchOutgoings({
        page: newPage,
        size: pageSize,
        filterByAmount: true,
        filterBy: 'invoiceDate',
        sortBy: backendSortField,
        sortOrder: defaultSortOrder
      })).unwrap();

    } catch (error) {
      console.error("Failed to fetch outgoings:", error);
    } finally {
      setLoadingData(false);
    }
  };

  loadOutgoings();

}, [dispatch, canRead]);

  useEffect(() => {
    if (!canRead) return;
    if (loadingState === 'idle') {
      dispatch(fetchItemwiseGrns());
      dispatch(fetchRandomIDApInvoices());
      dispatch(fetchItemwiseAps());
      dispatch(fetchVendorDetails({ filterByAmount: true }));
    }
  }, [loadingState, dispatch, canRead]);

  useEffect(() => {
    if (!canRead) return;
    const loadStatuses = async () => {
      try {
        const statuses = await fetchOutgoingStatuses();
        setAvailableStatuses(statuses);
      } catch (error) {
        console.error("Failed to fetch statuses:", error);
      }
    };
    loadStatuses();
  }, [canRead]);

  const filteredPayments = useMemo(() => {
    return outgoings.map(payment => {
      const totalPaid = (
        (payment.advanceAmount || 0) +
        (payment.partialAmount || 0) +
        (payment.fullPaymentAmount || 0)
      );
      const remainingAmount = Math.max(0, (payment.totalPayableAmount || 0) - totalPaid);
      return {
        ...payment,
        totalPaid,
        remainingAmount,
        totalPrice: payment.totalPrice || 0,
        payableAmount: payment.payableAmount || 0,
        discountDetails: payment.discountDetails || 0,
      };
    });
  }, [outgoings]);

  const handleApClick = (invoiceId: string | undefined) => {
    if (!invoiceId) {
      dispatch(setSnackbarMessage('Invalid AP Invoice ID'));
      dispatch(setSnackbarOpen(true));
      return;
    }
    dispatch(setSelectedinvoiceId(invoiceId));
    dispatch(setApDialogOpen(true));
  };

  const handleCloseApDialog = () => {
    dispatch(setApDialogOpen(false));
    dispatch(setSelectedinvoiceId(null));
  };

  const handlePoClick = async (poId: string) => {
    try {
      const result = await dispatch(fetchPoById(poId)).unwrap();
      if (result) {
        const transformedPo: PoResponse = {
          purchaseOrderId: result.purchaseOrderId,
          randomId: result.randomId,
          vendorName: result.vendorName,
          orderDate: typeof result.orderDate === 'string' ? result.orderDate : result.orderDate?.toISOString() || null,
          itemDetails: result.itemDetails.map((item: ItemDetailResponsePO) => ({
            itemId: item.itemId ?? 'N/A',
            itemName: item.itemName ?? 'Unknown',
            receivedQuantity: Number(item.receivedQuantity) || 0,
            poQuantity: Number(item.poQuantity) || 0,
            newPrice: Number(item.newPrice) || 0,
            totalPrice: Number(item.totalPrice) || 0,
            purchasetaxName: Number(item.purchasetaxName) || 0,
            taxPercentage: Number(item.taxPercentage) || 0,
            taxAmount: Number(item.taxAmount) || 0,
            discountAmount: Number(item.discountAmount) || 0,
            finalPrice: Number(item.finalPrice) || 0,
          })) as ItemDetailResponsePO[],
        };
        dispatch(setSelectedPo(transformedPo));
        setPoDialogOpen(true);
      } else {
        dispatch(setSnackbarMessage('Purchase Order not found.'));
        dispatch(setSnackbarOpen(true));
      }
    } catch (error) {
      dispatch(setSnackbarMessage('Failed to fetch PO details.'));
      dispatch(setSnackbarOpen(true));
      console.error('Failed to fetch PO details:', error);
    }
  };

  const handleCloseServiceDialog = () => {
    setDialogOpen(false);
    setSelectedService(null);
  };

  const handleServiceClick = async (identifier: string) => {
    if (!identifier) {
      dispatch(setSnackbarMessage('Invalid Service ID'));
      dispatch(setSnackbarOpen(true));
      return;
    }
    try {
      const result = await dispatch(fetchServiceById(identifier)).unwrap();
      setSelectedService(result);
      setDialogOpen(true);
    } catch (error) {
      dispatch(setSnackbarMessage('Failed to load service details'));
      dispatch(setSnackbarOpen(true));
      console.error('Service fetch error:', error);
    }
  };

  const handleViewCreditNotes = async (outgoingId: string, grnId?: string, apInvoiceId?: string) => {
    dispatch(clearDebitCreditNotes());
    let documentIdToUse = '';
    let documentTypeToUse = '';

    if (grnId) {
      documentIdToUse = grnId;
      documentTypeToUse = 'grn';
    } else {
      documentIdToUse = outgoingId;
      documentTypeToUse = 'outgoing_payment';
    }

   

    dispatch(setDebitCreditDocumentId(documentIdToUse));
    dispatch(setDebitCreditDocumentType(documentTypeToUse));
    dispatch(setDebitCreditDialogOpen(true));

    await dispatch(fetchAllDebitNotesComprehensive({
      documentId: documentIdToUse,
      documentType: documentTypeToUse,
      includeCleared: true,
      includeActive: true,
    })).unwrap();
  };

  const outgoingCreditNoteStatus = useMemo(() => {
    const statusMap: { [key: string]: { isDisabled: boolean; tooltipTitle: string } } = {};
    outgoings.forEach((outgoingdebit) => {
      const hasDebitCreditNotes = outgoingdebit.hasDebitCreditNotes ?? debitCreditNotes.some((note) => note.documentId === outgoingdebit.outgoingId);
      statusMap[outgoingdebit.outgoingId] = {
        isDisabled: !hasDebitCreditNotes,
        tooltipTitle: hasDebitCreditNotes ? 'View Debit/Credit Notes' : 'No Debit/Credit Notes Available',
      };
    });
    return statusMap;
  }, [outgoings, debitCreditNotes]);

  useEffect(() => {
    if (!canRead) return;
    dispatch(fetchBusinesses());
    dispatch(fetchBank());
  }, [dispatch, canRead]);

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > Math.ceil(totalItems / pageSize)) {
      return;
    }
    dispatch(setPagination({ page: newPage, size: pageSize }));
    const sortFieldMap: { [key: string]: string } = {
      dueDays: 'intimationDays',
      paymentTerms: 'paymentTerms',
      payableAmount: 'payableAmount',
      totalPaid: 'totalPaid',
      remainingAmount: 'totalPayableAmount',
      totalPrice: 'totalPrice',
      invoiceDate: 'invoiceDate',
      vendorName: 'vendorName'
    };
    const backendSortField = sortColumn ? sortFieldMap[sortColumn] : 'createdDate';
    const backendSortOrder = sortOrder === 'asc' ? 'ascending' : 'descending';
    if (isFilterActive) {
      const appliedFromDate = selectionRange?.startDate instanceof Date
        ? moment(selectionRange.startDate).startOf('day').toDate()
        : fromDate;
      const appliedToDate = selectionRange?.endDate instanceof Date
        ? moment(selectionRange.endDate).endOf('day').toDate()
        : toDate;
      dispatch(fetchOutgoings({
        page: newPage,
        size: pageSize,
        filterBy: dateField,
        fromDate: appliedFromDate,
        toDate: appliedToDate,
        filterByAmount: true,
        vendorCode: selectedVendor?.randomId,
        sortBy: backendSortField,
        sortOrder: backendSortOrder
      }));
    } else {
      dispatch(fetchOutgoings({
        page: newPage,
        size: pageSize,
        filterBy: dateField,
        filterByAmount: true,
        vendorCode: selectedVendor?.randomId,
        sortBy: backendSortField,
        sortOrder: backendSortOrder
      }));
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      handlePageChange(currentPage + 1);
    }
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      handlePageChange(currentPage - 1);
    }
  };

  useEffect(() => {
    businesses.forEach((business) => {
      if (!fetchedBusinessIds.has(business.businessId)) {
        dispatch(fetchPhoto(business.businessId));
        setFetchedBusinessIds(prevSet => new Set(prevSet).add(business.businessId));
      }
    });
  }, [businesses, fetchedBusinessIds, dispatch]);

  const handleOpenDialog = () => {
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  const handleViewDetails = (outgoing: any) => {
    setSelectedOutgoing(outgoing);
    setOpenDetailsDialog(true);
  };

  const handleSort = (column: 'dueDays' | 'paymentTerms' | 'payableAmount' | 'totalPaid' | 'remainingAmount' | 'totalPrice' | 'invoiceDate' | 'vendorName') => {
    const newSortOrder = sortColumn === column && sortOrder === 'asc' ? 'desc' : 'asc';
    setSortOrder(newSortOrder);
    setSortColumn(column);
    const sortFieldMap: { [key: string]: string } = {
      dueDays: 'intimationDays',
      paymentTerms: 'paymentTerms',
      payableAmount: 'payableAmount',
      totalPaid: 'totalPaid',
      remainingAmount: 'totalPayableAmount',
      totalPrice: 'totalPrice',
      invoiceDate: 'invoiceDate',
      vendorName: 'vendorName'
    };
    const backendSortField = sortFieldMap[column];
    const backendSortOrder = newSortOrder === 'asc' ? 'ascending' : 'descending';
    const appliedFromDate = selectionRange?.startDate instanceof Date
      ? moment(selectionRange.startDate).startOf('day').toDate()
      : fromDate;
    const appliedToDate = selectionRange?.endDate instanceof Date
      ? moment(selectionRange.endDate).endOf('day').toDate()
      : toDate;
    dispatch(fetchOutgoings({
      page: 1,
      size: pageSize,
      filterBy: dateField,
      fromDate: appliedFromDate,
      toDate: appliedToDate,
      filterByAmount: true,
      vendorCode: selectedVendor?.randomId || '',
      sortBy: backendSortField,
      sortOrder: backendSortOrder
    }));
  };

  useEffect(() => {
    dispatch(syncSelectionsWithCurrentData());
  }, [outgoings, dispatch]);

  const handleFilterClick = () => {
    setIsFilterActive(true);
    const formattedStartDate = selectionRange?.startDate instanceof Date
      ? moment(selectionRange.startDate).startOf('day').toISOString()
      : fromDate?.toISOString();
    const formattedEndDate = selectionRange?.endDate instanceof Date
      ? moment(selectionRange.endDate).endOf('day').toISOString()
      : toDate?.toISOString();
    const newPage = 1;
    dispatch(setPagination({ page: newPage, size: pageSize }));
    const sortFieldMap: { [key: string]: string } = {
      dueDays: 'intimationDays',
      paymentTerms: 'paymentTerms',
      payableAmount: 'payableAmount',
      totalPaid: 'totalPaid',
      remainingAmount: 'totalPayableAmount',
      totalPrice: 'totalPrice',
      invoiceDate: 'invoiceDate',
      vendorName: 'vendorName'
    };
    const backendSortField = sortColumn ? sortFieldMap[sortColumn] : 'createdDate';
    const backendSortOrder = sortOrder === 'asc' ? 'ascending' : 'descending';
    const filterParams: any = {
      page: newPage,
      size: pageSize,
      filterByAmount: true,
      filterByStatus: false,
      sortBy: backendSortField,
      sortOrder: backendSortOrder
    };
    if (formattedStartDate) {
      filterParams.fromDate = new Date(formattedStartDate);
    }
    if (formattedEndDate) {
      filterParams.toDate = new Date(formattedEndDate);
    }
    if (selectedVendor?.randomId) {
      filterParams.vendorCode = selectedVendor.randomId;
    }
    if (dateField && dateField.trim() !== '') {
      filterParams.filterBy = dateField.trim();
    }
    if (status && status.trim() !== '' && status.trim().toLowerCase() !== 'none' && status.trim().toLowerCase() !== 'all') {
      filterParams.status = status.trim();
    }
    if (!canRead) return;
    dispatch(fetchOutgoings(filterParams));
  };

  const handleFilterClose = () => {
    setIsFilterActive(false);
    setSelectionRange({
      startDate: new Date(),
      endDate: new Date(),
      key: 'selection',
    });
    setStatus('');
    setSelectedVendor(null);
    const sortFieldMap: { [key: string]: string } = {
      dueDays: 'intimationDays',
      paymentTerms: 'paymentTerms',
      payableAmount: 'payableAmount',
      totalPaid: 'totalPaid',
      remainingAmount: 'totalPayableAmount',
      totalPrice: 'totalPrice',
      invoiceDate: 'invoiceDate',
      vendorName: 'vendorName'
    };
    const backendSortField = sortColumn ? sortFieldMap[sortColumn] : 'createdDate';
    if (!canRead) return;
    dispatch(fetchOutgoings({
      page: currentPage,
      size: pageSize,
      filterBy: dateField,
      filterByAmount: true,
      vendorCode: undefined,
      sortBy: backendSortField,
      sortOrder: sortOrder === 'asc' ? 'ascending' : 'descending'
    }));
  };

  const handleCloseViewItemsDialog = () => {
    setViewItemsDialogOpen(false);
    setSelectedGrn(null);
  };

  const getRandomId = (grnId: string): string | undefined => {
    const grn = itemwise.find(grn => grn.grnId === grnId);
    return grn?.randomId;
  };

  const getApRandomId = (apinvoiceId: string): string | undefined => {
    const ap = randomIdap.find(ap => ap.invoiceId === apinvoiceId);
    return ap?.randomId;
  };

  const handleRowSelect = (outgoingId: string) => {
    const outgoing = outgoings.find(o => o.outgoingId === outgoingId);
    if (outgoing) {
      dispatch(toggleOutgoingSelection({ outgoingId, outgoing }));
    }
  };

  const handleSelectAllCurrentPage = (checked: boolean) => {
    outgoings.forEach((outgoing) => {
      const outgoingId = outgoing.outgoingId || '';
      const currentlySelected = selectedRows.includes(outgoingId);
      if (checked && !currentlySelected) {
        dispatch(toggleOutgoingSelection({ outgoingId, outgoing }));
      } else if (!checked && currentlySelected) {
        dispatch(toggleOutgoingSelection({ outgoingId, outgoing }));
      }
    });
  };

  const handlePaymentTypeChangeMultiple = (outgoingId: string, value: 'full' | 'partial') => {
    if (outgoingId) {
      setPaymentTypeMultiple(prev => ({ ...prev, [outgoingId]: value }));
    }
  };

  const handleGrnClick = async (grnId: string) => {
    try {
      const result = await dispatch(fetchGrnById(grnId)).unwrap();
      if (result) {
        const transformedGrn: GrnResponse = {
          grnId: result.grnId,
          randomId: result.randomId,
          vendorName: result.vendorName,
          grnDate: typeof result.grnDate === 'string' ? new Date(result.grnDate) : result.grnDate,
          itemDetails: result.itemDetails.map((item: ItemDetail) => ({
            itemId: item.itemId,
            itemName: item.itemName ?? 'Unknown',
            receivedQuantity: Number(item.receivedQuantity) || 0,
            returnedQuantity: Number(item.returnedQuantity) || 0,
            quantity: Number(item.quantity) || 0,
            unitPrice: Number(item.unitPrice) || 0,
            totalPrice: Number(item.totalPrice) || 0,
            purchasetaxName: item.purchasetaxName || 'N/A',
            discountAmount: Number(item.discountAmount) || 0,
            finalPrice: Number(item.finalPrice) || 0,
          })) as ItemDetailResponse[],
        };
        setSelectedGrn(transformedGrn);
        setViewItemsDialogOpen(true);
      } else {
        dispatch(setSnackbarMessage('GRN not found.'));
        dispatch(setSnackbarOpen(true));
      }
    } catch (error) {
      dispatch(setSnackbarMessage('Failed to fetch GRN details.'));
      dispatch(setSnackbarOpen(true));
      console.error('Failed to fetch GRN details:', error);
    }
  };

  const generateOutgoingInvoicePDF = () => {
    const doc = new jsPDF();
    let yOffset = 10;
    const logoX = 14;
    const titleX = 80;
    const business = businesses.length > 0 ? businesses[0] : null;
    if (business && business.imageUrl) {
      try {
        doc.addImage(business.imageUrl, 'JPEG', logoX, yOffset, 20, 20);
      } catch (e) {
        console.error("Image failed to load:", e);
      }
    }
    doc.setFontSize(12);
    doc.text("Outgoing Order Summary", titleX, yOffset + 10);
    const titleWidth = doc.getTextWidth("Outgoing Order Summary");
    const underlineStartX = titleX;
    const underlineEndX = underlineStartX + titleWidth;
    doc.setLineWidth(0.5);
    doc.line(underlineStartX, yOffset + 12, underlineEndX, yOffset + 12);
    yOffset += 25;
    const computedTotalPayableAmount = filteredPayments.reduce((total, outgoing) => {
      return total + (outgoing.totalPayableAmount || 0);
    }, 0);
    const today = new Date();
    const currentDate = `${today.getDate().toString().padStart(2, '0')}/${(today.getMonth() + 1).toString().padStart(2, '0')}/${today.getFullYear()}`;
    doc.setFontSize(10);
    doc.text(`Date: ${currentDate}`, 14, yOffset);
    doc.text(`Total Payable Amount: ${computedTotalPayableAmount.toFixed(2)}`, 140, yOffset);
    yOffset += 5;
    const headers = [["S.No", "PO No", "GRN No", "AP No", "Outgoing ID", "Vendor Name", "Invoice No", "Invoice Date", "Total Invoice Amount", "Paid Amount", "Remaining Amount"]];
    const rows = (filteredPayments || []).map((outgoing, index) => {
      if (!outgoing.randomId || !outgoing.vendorName || !outgoing.invoiceDate || (outgoing.totalPayableAmount || 0) <= 0) {
        return null;
      }
      return [
        `${index + 1}`,
        outgoing.poRandomId || "N/A",
        getRandomId(outgoing.grnId) || "N/A",
        getApRandomId(outgoing.invoiceId) || "N/A",
        outgoing.randomId.toString(),
        outgoing.vendorName.toString(),
        outgoing.invoiceNo || "N/A",
        outgoing.invoiceDate ? format(new Date(outgoing.invoiceDate), 'dd-MM-yyyy') : 'Not Provided',
        outgoing.payableAmount?.toFixed(2) || "0.00",
        outgoing.totalPaid?.toFixed(2) || "0.00",
        outgoing.totalPayableAmount?.toFixed(2) || "0.00",
      ];
    }).filter(row => row !== null);
    doc.autoTable({
      head: headers,
      body: rows,
      startY: yOffset,
      styles: { fillColor: [255, 255, 255], textColor: [0, 0, 0], lineColor: [0, 0, 0], fontSize: 8 },
      headStyles: { fillColor: [0, 0, 128], textColor: [255, 255, 255] },
      bodyStyles: { fillColor: [255, 255, 255], textColor: [0, 0, 0] },
    });
    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      const pageY = doc.internal.pageSize.height - 10;
      const computerGeneratedY = pageY - 10;
      doc.text("This is computer generated", doc.internal.pageSize.width / 2, computerGeneratedY, { align: 'center' });
      doc.text(`Page ${i} of ${totalPages}`, doc.internal.pageSize.width / 2, pageY, { align: 'center' });
    }
    doc.save(`PendingOutgoing.pdf`);
    setOpenDialog(false);
  };

  const generateOutgoingSummaryCSV = () => {
    const headers = [["S.No", "PO No", "GRN No", "AP No", "Outgoing No", "Vendor Name", "Invoice No", "Invoice Date", "Total Amount", "Tax Details", "Discount Amount", "Total", "Paid Amount", "Remaining Amount", "Due Days", "Payment Terms"]];
    const rows = (filteredPayments || []).map((outgoing, index) => {
      if (!outgoing.randomId || !outgoing.vendorName || !outgoing.invoiceDate || (outgoing.totalPayableAmount || 0) <= 0) {
        return null;
      }
      return [
        `${index + 1}`,
        outgoing.poRandomId || "N/A",
        getRandomId(outgoing.grnId) || "N/A",
        getApRandomId(outgoing.invoiceId) || "N/A",
        outgoing.randomId.toString(),
        outgoing.vendorName.toString(),
        outgoing.invoiceNo || "N/A",
        outgoing.invoiceDate ? format(new Date(outgoing.invoiceDate), 'dd-MM-yyyy') : 'Not Provided',
        outgoing.totalPrice?.toFixed(2) || "0.00",
        outgoing.taxDetails || "N/A",
        outgoing.discountDetails?.toFixed(2) || "0.00",
        outgoing.payableAmount?.toFixed(2) || "0.00",
        outgoing.totalPaid?.toFixed(2) || "0.00",
        outgoing.totalPayableAmount?.toFixed(2) || "0.00",
        outgoing.intimationDays || "N/A",
        outgoing.paymentTerms || "N/A",
      ];
    }).filter(row => row !== null);
    const csvData = [headers[0], ...rows];
    const csv = Papa.unparse(csvData);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "OutgoingSummary.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setOpenDialog(false);
  };

  const handlePayClick = () => {
    if (selectedOutgoings.length === 0) {
      dispatch(setSnackbarMessage('Please select at least one outgoing payment to process'));
      dispatch(setSnackbarOpen(true));
      return;
    }
    const allVerified = selectedOutgoings.every(outgoing => outgoing.isVerified === true);
    if (!allVerified) {
      dispatch(setSnackbarMessage('All selected payments must be verified before processing multiple payments'));
      dispatch(setSnackbarOpen(true));
      return;
    }
    setIsBulkPaymentOpen(true);
  };

  const handleClearAllSelections = () => {
    dispatch(clearSelection());
  };

  const handleDownload = async (outgoingId: string) => {
    const outgoingdetail = outgoings.find((outgoing) => outgoing.outgoingId === outgoingId);
    if (!outgoingdetail) {
      console.error('Outgoing not found!');
      return;
    }
    const business = businesses.length > 0 ? businesses[0] : null;
    const doc = new jsPDF();
    let yOffset = 10;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 128);
    doc.text('Pending Payment', 90, yOffset + 5);
    const textWidth = doc.getTextWidth('Pending Payment');
    doc.setDrawColor(0, 0, 128);
    doc.line(90, yOffset + 7, 90 + textWidth, yOffset + 7);
    yOffset += 10;
    if (business && business.imageUrl) {
      try {
        doc.addImage(business.imageUrl, 'JPEG', 20, 5, 20, 20);
      } catch (e) {
        console.error("Image failed to load:", e);
      }
    }
    const paymentMethod = outgoingdetail.paymentMethod;
    let paymentDetails = '';
    if (paymentMethod === 'neft') {
      paymentDetails = `NEFT No: ${outgoingdetail.neftNo}`;
    } else if (paymentMethod === 'rtgs') {
      paymentDetails = `RTGS No: ${outgoingdetail.rtgsNo}`;
    }
    doc.setFontSize(10);
    doc.text(`Payment Method: ${paymentMethod}`, 14, yOffset + 10);
    doc.text(paymentDetails, 14, yOffset + 20);
    yOffset += 15;
    const vendorDetailsRows = [[
      `Vendor Name: ${outgoingdetail.vendorName || ''}\nGSTIN: ${outgoingdetail.gstNumber || ''}\nAddress: ${outgoingdetail.address || ''}\nCity: ${outgoingdetail.city || ''}\nState: ${outgoingdetail.state || ''}\nCountry: ${outgoingdetail.country || ''}\nEmail: ${outgoingdetail.contactpersonEmail || ''}`,
      `Business Name: ${business?.companyName || ''}\nGSTIN: ${business?.gstIn || ''}\nAddress: ${business?.address1 || ''}\nPhone: ${business?.phoneNo || ''}\nEmail: ${business?.emailId || ''}`,
      `Outgoing No: ${outgoingdetail.randomId}\nPO No: ${outgoingdetail.poRandomId}\nGRN No: ${getRandomId(outgoingdetail.grnId)}\nAP No: ${outgoingdetail.apRandomId}\nDate: ${outgoingdetail.createdDate ? format(new Date(outgoingdetail.createdDate), 'dd-MM-yyyy') : ''}`
    ]];
    doc.autoTable({
      head: [['Vendor Details', 'Business Details', 'Outgoing Payment Details']],
      body: vendorDetailsRows,
      startY: yOffset,
      theme: 'grid',
      styles: { fontSize: 9, cellPadding: 4, halign: 'left', valign: 'top', overflow: 'linebreak' },
      columnStyles: { 0: { cellWidth: 60.6 }, 1: { cellWidth: 60.6 }, 2: { cellWidth: 60.6 } },
      headStyles: { fillColor: [0, 0, 128], textColor: [255, 255, 255], fontStyle: 'bold' },
    });
    yOffset = doc.autoTable.previous.finalY;
    const itemHeader = ['Invoice No', 'Invoice Date', 'Vendor Name', 'Item Name', 'Tax Details', 'Tax Amount', 'Without Tax Value', 'With Tax Value'];
    const filteredItems = outgoingdetail.grnId ? itemwise.filter(grn => grn.grnId === outgoingdetail.grnId).flatMap(grn => grn.itemDetails) : [];
    const tableRows = filteredItems.length > 0 ? filteredItems.map((item) => {
      const unitPrice = item.unitPrice || 0;
      const quantity = item.quantity || 0;
      const withoutTaxValue = unitPrice * quantity;
      const taxAmount = withoutTaxValue * (item.purchasetaxName / 100);
      return [
        outgoingdetail.invoiceNo || '-',
        outgoingdetail.invoiceDate ? format(new Date(outgoingdetail.invoiceDate), 'dd-MM-yyyy') : 'Not Provided',
        outgoingdetail.vendorName || '-',
        item.itemName,
        `${item.purchasetaxName}%`,
        taxAmount.toFixed(2),
        outgoingdetail.totalPrice?.toFixed(2),
        outgoingdetail.payableAmount?.toFixed(2),
      ];
    }) : [[outgoingdetail.invoiceNo || '', outgoingdetail.invoiceDate ? format(new Date(outgoingdetail.invoiceDate), 'dd-MM-yyyy') : 'Not Provided', outgoingdetail.vendorName || '-', '-', '-', '0.00', '0.00', '0.00']];
    doc.autoTable({
      head: [itemHeader],
      body: tableRows,
      startY: yOffset,
      theme: 'grid',
      styles: { fontSize: 8, halign: 'center', cellPadding: 2 },
      headStyles: { fillColor: [0, 0, 128], textColor: [255, 255, 255] },
    });
    yOffset = doc.autoTable.previous.finalY;
    const discount = outgoingdetail.discountDetails || 0;
    const totalPayableAmountVal = outgoingdetail.totalPayableAmount || 0;
    let paidAmount = 0;
    if (outgoingdetail.status === 'Fully Paid') {
      paidAmount = totalPayableAmountVal;
    } else if (outgoingdetail.status === 'Partially Paid') {
      paidAmount = outgoingdetail.partialAmount || 0;
    }
    const summaryTable = [['Discount', discount.toFixed(2)], ['Paid Amount', paidAmount.toFixed(2)], ['Remaining Payable Amount', totalPayableAmountVal.toFixed(2)]];
    doc.autoTable({
      head: [['Description', 'Amount']],
      body: summaryTable,
      startY: yOffset,
      theme: 'grid',
      styles: { fontSize: 8, halign: 'right', cellPadding: 2 },
    });
    const totalPagesDoc = doc.getNumberOfPages();
    for (let i = 1; i <= totalPagesDoc; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      const pageY = doc.internal.pageSize.height - 10;
      const computerGeneratedY = pageY - 10;
      doc.setTextColor(0);
      doc.text("This is computer generated", doc.internal.pageSize.width / 2, computerGeneratedY, { align: 'center' });
      doc.text(`Page ${i} of ${totalPagesDoc}`, doc.internal.pageSize.width / 2, pageY, { align: 'center' });
    }
    doc.save(`${outgoingdetail.randomId}.pdf`);
  };

  const getColorByDueDays = (dueDays: string) => {
    const dueDaysNumber = parseInt(dueDays, 10);
    if (isNaN(dueDaysNumber)) return 'black';
    if (dueDaysNumber <= 0) return 'red';
    else if (dueDaysNumber <= 5) return 'orange';
    else if (dueDaysNumber <= 10) return 'green';
    else return 'black';
  };

  const displayTotalPayableAmount = totalPayableAmount > 0 ? totalPayableAmount : filteredPayments.reduce((total, outgoing) => total + (outgoing.totalPayableAmount || 0), 0);

  const selectedPaymentsTotal = useMemo(() => {
    return selectedOutgoings.reduce((total, outgoing) => total + (outgoing.totalPayableAmount || 0), 0);
  }, [selectedOutgoings]);

  const currentPageSelectedCount = useMemo(() => {
    return filteredPayments.filter(payment => selectedRows.includes(payment.outgoingId || '')).length;
  }, [filteredPayments, selectedRows]);

  const handleVendorChange = (vendor: VendorSearch | null) => {
    setSelectedVendor(vendor);

    if (!canRead) return;

    const sortFieldMap: { [key: string]: string } = {
      dueDays: 'intimationDays',
      paymentTerms: 'paymentTerms',
      payableAmount: 'payableAmount',
      totalPaid: 'totalPaid',
      remainingAmount: 'totalPayableAmount',
      totalPrice: 'totalPrice',
      invoiceDate: 'invoiceDate',
      vendorName: 'vendorName'
    };
    const backendSortField = sortColumn ? sortFieldMap[sortColumn] : 'createdDate';
    const backendSortOrder = sortOrder === 'asc' ? 'ascending' : 'descending';

    dispatch(fetchOutgoings({
      page: 1,
      size: pageSize,
      filterByAmount: true,
      filterBy: dateField,
      vendorCode: vendor?.randomId || '',
      sortBy: backendSortField,
      sortOrder: backendSortOrder
    }));
  };

  const totalPages = Math.ceil(totalItems / pageSize);

  return (
    <Box>
      <YenBookPage />
      <Box sx={{ p: 1, backgroundColor: 'white' }}>
        {/* First Row - Module Buttons */}
        <Box display="flex" alignItems="center" justifyContent="space-between" mb={1} ml={1}>
          <Box display="flex" alignItems="center" flexWrap="wrap" gap={1}>
            {isModuleVisible("yenerp", "outgoingpayment") && (
              <Link href={"/yen-book/OutgoingPaymentPage"}>
                <Button variant="contained" sx={{ backgroundColor: "white", color: "black" }}>Outgoing Payment</Button>
              </Link>
            )}
            {isModuleVisible("yenerp", "advancepayment") && (
              <Link href={"/yen-book/OutgoingPaymentPage/PreOutgoing"}>
                <Button variant="contained" color="primary">Advance Payment</Button>
              </Link>
            )}
            {isModuleVisible("yenerp", "partialpayment") && (
              <Link href={"/yen-book/OutgoingPaymentPage/PendingPayment"}>
                <Button variant="contained" color="primary">Partial Payment</Button>
              </Link>
            )}
            {isModuleVisible("yenerp", "paymentdone") && (
              <Link href={"/yen-book/OutgoingPaymentPage/PaidPayment"}>
                <Button variant="contained" color="primary">Payment Done</Button>
              </Link>
            )}
            {isModuleVisible("yenerp", "ledger") && (
              <Link href={"/yen-book/OutgoingPaymentPage/Ledger"}>
                <Button variant="contained" color="primary">Ledger</Button>
              </Link>
            )}
            {isModuleVisible("yenerp", "purchasereturn") && (
              <Link href={"/yen-book/OutgoingPaymentPage/PurchaseReturn"}>
                <Button variant="contained" color="primary">Purchase Return</Button>
              </Link>
            )}
          </Box>
        </Box>

        {/* Second Row - Filters */}
        <Grid container spacing={1} alignItems="center" sx={{ mb: 1, mt: 1, ml: 0.5 }}>
          <Grid item xs="auto">
            <DateRangeDialog selectionRange={selectionRange} setSelectionRange={setSelectionRange} onApply={handleFilterClick} />
          </Grid>
          <Grid item xs={6} sm={4} md={2}>
            <VendorSearchAutocomplete
              value={selectedVendor}
              onChange={handleVendorChange}
              label="All Vendors"
            />
          </Grid>
          <Grid item xs={6} sm={3} md={2}>
            <Autocomplete
              value={status || null}
              onChange={(event, newValue) => setStatus(newValue || '')}
              options={availableStatuses}
              renderInput={(params) => <TextField {...params} label="Filter by Status" variant="outlined" size="small" />}
              size="small"
              fullWidth
            />
          </Grid>
          <Grid item xs="auto">
            <Tooltip title="Apply Filter">
              <IconButton onClick={handleFilterClick} color="primary" size="small" className="icon-button-outline">
                <FilterAltIcon />
              </IconButton>
            </Tooltip>
          </Grid>
          <Grid item xs="auto">
            <Tooltip title="Clear Filter">
              <IconButton onClick={handleFilterClose} color="secondary" size="small" className="icon-button-outline">
                <ClearIcon />
              </IconButton>
            </Tooltip>
          </Grid>

          <Grid item xs sx={{ flexGrow: 1 }} />

          {/* Total Payable Amount */}
          <Grid item>
            <Typography variant="h6" sx={{ fontWeight: 'bold', fontSize: '14px' }}>
              Total Payable: ₹{displayTotalPayableAmount.toFixed(2)}
              {selectedRows.length > 0 && (
                <span style={{ color: 'blue', marginLeft: '10px', fontSize: '13px' }}>
                  ( ₹{selectedPaymentsTotal.toFixed(2)} ({selectedOutgoings.length}) )
                </span>
              )}
            </Typography>
          </Grid>

          {/* Clear Selection Button */}
          {selectedOutgoings.length > 0 && (
            <Grid item>
              <Tooltip title="Clear All Selections">
                <IconButton onClick={handleClearAllSelections} color="error" size="small" className="icon-button-outline">
                  <ClearIcon />
                </IconButton>
              </Tooltip>
            </Grid>
          )}

          {/* Multiple Payments Button */}
          <Grid item>
            <Tooltip title="Process Multiple Payments">
              <span>
                <IconButton
                  color='primary'
                  onClick={handlePayClick}
                  size="small"
                  className="icon-button-outline"
                  disabled={selectedOutgoings.length === 0 || !selectedOutgoings.every(outgoing => outgoing.isVerified === true)}
                >
                  <PaymentsIcon />
                </IconButton>
              </span>
            </Tooltip>
          </Grid>

          {/* Download Button */}
          <Grid item>
            <Tooltip title="Download Report">
              <span>
                <IconButton
                  onClick={handleOpenDialog}
                  color="primary"
                  size="small"
                  disabled={!filteredPayments || filteredPayments.length === 0}
                  className="icon-button-outline"
                >
                  <DownloadIcon />
                </IconButton>
              </span>
            </Tooltip>
          </Grid>

          {/* Column Filter Button - Moved here next to Download button */}
          <Grid item>
            <Tooltip title="Column Filter">
              <IconButton
                color="primary"
                onClick={handleColumnFilterClick}
                className="icon-button-outline"
                size="small"
              >
                <FilterListIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Grid>
        </Grid>
        {/* Third Row - Data Table */}
        <Grid container spacing={2}>
          <Grid item xs={12} ml={1}>
            <TableContainer
              component={Paper}
              sx={{
                maxHeight: 'calc(100vh - 260px)',
                overflowY: 'auto',
                overflowX: 'auto',
                position: 'relative'
              }}
            >
              <Table
                stickyHeader
                size="small"
                sx={{
                  minWidth: 1200,
                  '& .MuiTableCell-root': {
                    whiteSpace: 'nowrap',
                    padding: '12px 16px',
                  },
                  '& .MuiTableCell-head': {
                    whiteSpace: 'nowrap',
                    backgroundColor: '#f5f5f5',
                    fontWeight: 'bold',
                    borderBottom: '2px solid #e0e0e0',
                  }
                }}
              >
                <TableHead>
                  <TableRow>
                    {visibleColumns.filter(col => col.visible).map((column) => {
                      const isMultiWord = column.label.includes(' ');

                      return (
                        <TableCell
                          key={column.id}
                          align={column.align as any}
                          sx={{
                            cursor: column.sortable ? 'pointer' : 'default',
                            backgroundColor: '#f5f5f5',
                            fontWeight: 'bold',
                            whiteSpace: isMultiWord ? 'normal' : 'nowrap',
                            wordBreak: 'break-word',
                            lineHeight: 1.2,
                            verticalAlign: 'top',
                            minWidth: column.id === 'action' ? 120 :
                              column.id === 'vendorName' ? 150 :
                                column.id === 'taxDetails' ? 120 :
                                  column.id === 'invoiceNo' ? 100 : 'auto',
                            padding: '10px 8px',
                          }}
                          onClick={() => column.sortable && handleSort(column.id as any)}
                        >
                          {isMultiWord ? (
                            column.label.split(' ').map((word, index, array) => (
                              <React.Fragment key={index}>
                                {word}
                                {index < array.length - 1 && <br />}
                              </React.Fragment>
                            ))
                          ) : (
                            column.label
                          )}
                          {column.sortable && sortColumn === column.id && (
                            <span style={{ marginLeft: '4px' }}>
                              {sortOrder === 'asc' ? ' ↑' : ' ↓'}
                            </span>
                          )}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                </TableHead>
                <TableBody>
                 {loadingData ? (
  <TableRow>
    <TableCell
      colSpan={visibleColumns.filter(col => col.visible).length}
      align="center"
      sx={{ py: 6 }}
    >
      <Box
        display="flex"
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
        gap={1}
      >
        <CircularProgress size={32} />
        <Typography variant="body2" color="textSecondary">
          Loading outgoing payments...
        </Typography>
      </Box>
    </TableCell>
  </TableRow>
) : filteredPayments.length === 0 ? (
  <TableRow>
    <TableCell
      colSpan={visibleColumns.filter(col => col.visible).length}
      align="center"
      sx={{ py: 6 }}
    >
      No data available
    </TableCell>
  </TableRow>
) : (
                    filteredPayments.map((payment, index) => {
                      const { isDisabled, tooltipTitle } = outgoingCreditNoteStatus[payment.outgoingId] || {
                        isDisabled: true,
                        tooltipTitle: 'No Debit/Credit Notes Available'
                      };
                      return (
                        <TableRow key={payment.outgoingId || index} hover>
                          {visibleColumns.filter(col => col.visible).map((column) => {
                            switch (column.id) {
                              case 'serialNo':
                                return (
                                  <TableCell key={column.id} align="center" sx={{ whiteSpace: 'nowrap' }}>
                                    {(currentPage - 1) * pageSize + index + 1}
                                  </TableCell>
                                );
                              case 'select':
                                return (
                                  <TableCell key={column.id} align="center" padding="checkbox" sx={{ whiteSpace: 'nowrap' }}>
                                    <Checkbox
                                      checked={selectedRows.includes(payment.outgoingId || '')}
                                      onChange={() => handleRowSelect(payment.outgoingId || '')}
                                      size="small"
                                    />
                                  </TableCell>
                                );
                              case 'poNo':
                                return (
                                  <TableCell key={column.id} align="left" sx={{ whiteSpace: 'nowrap' }}>
                                    {payment.poRandomId ? (
                                      <span
                                        style={{
                                          color: 'purple',
                                          cursor: 'pointer',
                                          textDecoration: 'underline'
                                        }}
                                        onClick={() => payment.purchaseOrderId && handlePoClick(payment.purchaseOrderId)}
                                      >
                                        {payment.poRandomId}
                                      </span>
                                    ) : payment.serviceId ? (
                                      <span
                                        style={{
                                          color: '#9c27b0',
                                          cursor: 'pointer',
                                          textDecoration: 'underline',
                                          fontWeight: '600'
                                        }}
                                        onClick={() => handleServiceClick(payment.serOId)}
                                      >
                                        {payment.serviceId}
                                      </span>
                                    ) : '-'}
                                  </TableCell>
                                );
                              case 'grnNo':
                                return (
                                  <TableCell key={column.id} align="left" sx={{ whiteSpace: 'nowrap' }}>
                                    {payment.grnId ? (
                                      <span
                                        style={{ color: 'blue', cursor: 'pointer' }}
                                        onClick={() => handleGrnClick(payment.grnId ?? '')}
                                      >
                                        {payment.grnRandomId}
                                      </span>
                                    ) : '-'}
                                  </TableCell>
                                );
                              case 'apNo':
                                return (
                                  <TableCell key={column.id} align="left" sx={{ whiteSpace: 'nowrap' }}>
                                    {payment.invoiceId ? (
                                      <span
                                        style={{ color: 'green', cursor: 'pointer' }}
                                        onClick={() => handleApClick(payment.invoiceId)}
                                      >
                                        {payment.apRandomId}
                                      </span>
                                    ) : '-'}
                                  </TableCell>
                                );
                              case 'outgoingNo':
                                return (
                                  <TableCell key={column.id} align="left" sx={{ whiteSpace: 'nowrap' }}>
                                    {payment.randomId}
                                  </TableCell>
                                );
                              case 'vendorName':
                                return (
                                  <TableCell key={column.id} align="left" sx={{ whiteSpace: 'nowrap', minWidth: 150 }}>
                                    {payment.vendorName}
                                  </TableCell>
                                );
                              case 'type':
                                return (
                                  <TableCell key={column.id} align="left" sx={{ whiteSpace: 'nowrap' }}>
                                    {payment.invoiceType}
                                  </TableCell>
                                );
                              case 'invoiceNo':
                                return (
                                  <TableCell key={column.id} align="left" sx={{ whiteSpace: 'nowrap' }}>
                                    {payment.invoiceNo || '-'}
                                  </TableCell>
                                );
                              case 'invoiceDate':
                                return (
                                  <TableCell key={column.id} align="left" sx={{ whiteSpace: 'nowrap' }}>
                                    {payment.invoiceDate ? format(new Date(payment.invoiceDate), 'dd-MM-yyyy') : ''}
                                  </TableCell>
                                );
                              case 'invoiceAmount':
                                return (
                                  <TableCell key={column.id} align="right" sx={{ whiteSpace: 'nowrap' }}>
                                    {(payment.totalPrice || 0).toFixed(2)}
                                  </TableCell>
                                );
                              case 'taxDetails':
                                const taxValue = payment.taxDetails;
                                const taxDisplay = taxValue !== null && taxValue !== undefined ? String(taxValue) : '-';
                                return (
                                  <TableCell key={column.id} align="left" sx={{ whiteSpace: 'nowrap' }}>
                                    <Tooltip title={taxDisplay !== '-' ? taxDisplay : 'No tax details'} arrow>
                                      <Typography variant="body2" sx={{ cursor: 'pointer', fontSize: '12px' }}>
                                        {taxDisplay !== '-' ? (taxDisplay.length > 15 ? taxDisplay.substring(0, 15) + '...' : taxDisplay) : '-'}
                                      </Typography>
                                    </Tooltip>
                                  </TableCell>
                                );
                              case 'discountAmount':
                                return (
                                  <TableCell key={column.id} align="right" sx={{ whiteSpace: 'nowrap' }}>
                                    {(payment.discountDetails || 0).toFixed(2)}
                                  </TableCell>
                                );
                              case 'total':
                                return (
                                  <TableCell key={column.id} align="right" sx={{ whiteSpace: 'nowrap' }}>
                                    {(payment.payableAmount || 0).toFixed(2)}
                                  </TableCell>
                                );
                              case 'paidAmount':
                                return (
                                  <TableCell key={column.id} align="right" sx={{ whiteSpace: 'nowrap' }}>
                                    {(payment.paidAmount || 0).toFixed(2)}
                                  </TableCell>
                                );
                              case 'remainingAmount':
                                return (
                                  <TableCell key={column.id} align="right" sx={{ whiteSpace: 'nowrap' }}>
                                    {(payment.totalPayableAmount || 0).toFixed(2)}
                                  </TableCell>
                                );
                              case 'dueDays':
                                return (
                                  <TableCell
                                    key={column.id}
                                    align="center"
                                    sx={{
                                      fontWeight: 'bold',
                                      color: getColorByDueDays(payment.intimationDays?.toString() || '0'),
                                      whiteSpace: 'nowrap'
                                    }}
                                  >
                                    {payment.intimationDays}
                                  </TableCell>
                                );
                              case 'paymentTerms':
                                return (
                                  <TableCell key={column.id} align="center" sx={{ whiteSpace: 'nowrap' }}>
                                    {payment.paymentTerms}
                                  </TableCell>
                                );
                              case 'verifiedBy':
                                return (
                                  <TableCell key={column.id} align="left" sx={{ whiteSpace: 'nowrap' }}>
                                    {payment.verifiedByName}
                                  </TableCell>
                                );
                              case 'verifiedDate':
                                return (
                                  <TableCell key={column.id} align="center" sx={{ whiteSpace: 'nowrap' }}>
                                    {payment.verifiedDate ? format(new Date(payment.verifiedDate), 'dd-MM-yyyy HH:mm') : '-'}
                                  </TableCell>
                                );
                              case 'action':
                                return (
                                  <TableCell key={column.id} align="center" sx={{ whiteSpace: 'nowrap', minWidth: 120 }}>
                                    <Box display="flex" alignItems="center" justifyContent="center" gap={0.5}>
                                      <Tooltip title={payment.isVerified ? "Make Payment" : "Payment not allowed - Not Verified"}>
                                        <span>
                                          <IconButton
                                            size="small"
                                            color="primary"
                                            onClick={() => handleViewDetails(payment)}
                                            disabled={selectedRows.length > 1 || !payment.isVerified}
                                          >
                                            <PaymentIcon fontSize="small" />
                                          </IconButton>
                                        </span>
                                      </Tooltip>
                                      <Tooltip title="Download PDF">
                                        <IconButton
                                          size="small"
                                          color="primary"
                                          onClick={() => handleDownload(payment.outgoingId ?? '')}
                                        >
                                          <PictureAsPdfIcon fontSize="small" />
                                        </IconButton>
                                      </Tooltip>
                                      <Tooltip title={tooltipTitle}>
                                        <span>
                                          <IconButton
                                            size="small"
                                            color="primary"
                                            onClick={() => handleViewCreditNotes(payment.outgoingId, payment.grnId, payment.invoiceId)}
                                            disabled={isDisabled}
                                          >
                                            <DescriptionIcon fontSize="small" />
                                          </IconButton>
                                        </span>
                                      </Tooltip>
                                    </Box>
                                  </TableCell>
                                );
                              default:
                                return null;
                            }
                          })}
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </TableContainer>

            {/* Pagination */}
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', mt: 2 }}>
              <IconButton onClick={handlePreviousPage} disabled={currentPage === 1} size="small">
                <ChevronLeft />
              </IconButton>
              <Typography variant="body2" sx={{ mx: 2 }}>
                Page {currentPage} of {totalPages}
              </Typography>
              <IconButton onClick={handleNextPage} disabled={currentPage >= totalPages} size="small">
                <ChevronRight />
              </IconButton>
            </Box>
          </Grid>
        </Grid>

        {/* Dialogs */}
        <DebitCreditNoteDialog />
        <PODialog open={poDialogOpen} onClose={() => dispatch(setPoDialogOpen(false))} po={selectedPo} />
        <GrnDialog open={viewItemsDialogOpen} onClose={() => setViewItemsDialogOpen(false)} grn={selectedGrn} />
        <ApInvoiceDialog open={apDialogOpen} onClose={handleCloseApDialog} apInvoice={selectedApInvoice} />
        <BulkPaymentDialog open={isBulkPaymentOpen} onClose={() => setIsBulkPaymentOpen(false)} selectedOutgoings={selectedOutgoings} />

        {/* Download Dialog */}
        <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="xs" fullWidth>
          <DialogTitle>Choose File Format</DialogTitle>
          <DialogContent>
            <Typography>Select the file format you want to download:</Typography>
          </DialogContent>
          <DialogActions sx={{ p: 2, pt: 0 }}>
            <Button onClick={generateOutgoingInvoicePDF} variant="contained" color="primary" startIcon={<PictureAsPdfIcon />} fullWidth sx={{ mb: 1 }}>
              Download PDF
            </Button>
            <Button onClick={generateOutgoingSummaryCSV} variant="contained" color="secondary" startIcon={<DescriptionIcon />} fullWidth>
              Download CSV
            </Button>
            <Button onClick={handleCloseDialog} color="inherit" fullWidth>
              Cancel
            </Button>
          </DialogActions>
        </Dialog>

        {/* Column Filter Menu */}
        {/* Column Filter Menu - Immediate update like Vendor module */}
        <Menu
          anchorEl={columnFilterAnchorEl}
          open={Boolean(columnFilterAnchorEl)}
          onClose={handleColumnFilterClose}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        >
          {allTableColumns.map((column) => (
            <MenuItem
              key={column}
              onClick={() => handleColumnToggle(column)}
              dense
            >
              <Checkbox
                checked={tempVisibleColumns.includes(column)}
                size="small"
              />
              <Typography variant="body2">{columnNameMap[column]}</Typography>
            </MenuItem>
          ))}
        </Menu>

        <Snackbar open={snackbarOpen} message={snackbarMessage} autoHideDuration={3000} onClose={() => dispatch(clearSnackbarMessage())} />
        <ConfirmationDialog open={confirmDialogOpen} onClose={() => setConfirmDialogOpen(false)} onConfirm={confirmDialogProps.onConfirm} title={confirmDialogProps.title} description={confirmDialogProps.description} />
        <SinglePaymentDialog open={openDetailsDialog} onClose={() => setOpenDetailsDialog(false)} selectedOutgoing={selectedOutgoing} currentPage={currentPage} pageSize={pageSize} dateField={dateField} onPaymentSuccess={() => { if (!canRead) return; dispatch(fetchOutgoings({ page: currentPage, size: pageSize, filterBy: dateField, filterByAmount: true })); }} />
        <ServiceDialog open={dialogOpen} onClose={() => setDialogOpen(false)} service={selectedService} />
      </Box>
    </Box>
  );
});

OutgoingPaymentComponent.displayName = 'OutgoingPaymentComponent';
export default OutgoingPaymentComponent;