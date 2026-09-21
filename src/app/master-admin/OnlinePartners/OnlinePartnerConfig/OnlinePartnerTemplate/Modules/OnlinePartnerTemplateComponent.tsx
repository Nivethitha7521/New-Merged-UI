


"use client";
import React, { useEffect, useState, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Box, Dialog, DialogTitle, DialogContent, DialogActions, Button, Snackbar, CircularProgress, Alert, Typography, TextField, TableCell, TableRow } from '@mui/material';
//import { debounce } from 'lodash';
import { AppDispatch, RootState } from '../../../../../../redux/store';
import {
  fetchTemplates, fetchCategory, fetchSubcategory, fetchPartner, fetchDynamicData,
  addTemplate, updateTemplate, setSnackbarMessage, setSnackbarOpen,
  deleteTemplate, deleteMultipleTemplates, deleteDynamicItemFromPartner,
  bulkRemovePartnerItems,
  addTemplatesBulk,
} from '../Features/OnlineParnerTemplateSlice';
import { OnlinePartnerTemplate, dynamicData, } from '../Models/templateModels';
import FilterActionBar from '../Modules/Filters';
import TemplateTable from '../Modules/TemplateTable';
import TemplateDialogs from '../Modules/TemplateDialog';
import ActivateDeactivateConfirmationDialog from '../../../../../Components/Dialogs/ActivateDeactivateConfirmationDialog';

export interface SelectedItem {
  assignedPartners: string[];
  deactivateAssignedPartners: string[];
  itemName: string;
  currentPrice: number;
  percentage: number;
  partnerPrice: number;
  percentageError?: string;
  isTemporary?: boolean;
}

interface ComponentProps {
  selectedType: 'template' | 'dynamic';
  partnerId?: string;
  partnerName: string;
}

const OnlinePartnerTemplateComponent: React.FC<ComponentProps> = ({ selectedType, partnerName }) => {
  const dispatch = useDispatch<AppDispatch>();
  const {
    items: templates, deactivatedItems, dynamic, deactivatedDynamic, loading,
    snackbarOpen, snackbarMessage, showDeactivated, searchQuery, currentPage,
  } = useSelector((state: RootState) => state.onlinePartnerTemplate);

  const [confirmationDialogOpen, setConfirmationDialogOpen] = useState(false);
  const [createTemplateDialogOpen, setCreateTemplateDialogOpen] = useState(false);
  const [assignConfirmationDialogOpen, setAssignConfirmationDialogOpen] = useState(false);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [assignMessage,] = useState('');
  const [newPartnersToAssign,] = useState<string[]>([]);
  const [selectedItem, setSelectedItem] = useState<OnlinePartnerTemplate | dynamicData | null>(null);
  const [actionType, setActionType] = useState<'deactivate' | 'activate' | 'delete' | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFormValid, setIsFormValid] = useState(false);
  const [validationErrors, setValidationErrors] = useState({
    percentage: '', category: '', subCategory: '', varianceName: '', applyPercentage: ''
  });
  const [formData, setFormData] = useState({
    category: [] as string[], subCategory: [] as string[], varianceName: [] as string[], applyPercentage: ''
  });
  const [temporaryItems, setTemporaryItems] = useState<SelectedItem[]>([]);
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [selectedPartners, setSelectedPartners] = useState<string[]>([]);
  const [, setItemSearchQuery] = useState('');
  const [editItem, setEditItem] = useState<SelectedItem | null>(null);
  const [buttonLabel, setButtonLabel] = useState('Assign');
  const [hasAssignedItems, setHasAssignedItems] = useState(false);
  const [hasOpenedCreateDialog,] = useState(false);
  const [selectionOrder, setSelectionOrder] = useState<string[]>([]);
  const [createTemplateDisabled, setCreateTemplateDisabled] = useState(false);


  useEffect(() => {
    dispatch(fetchCategory());
    dispatch(fetchSubcategory());
    dispatch(fetchPartner());
  }, [dispatch]);


  // Inside your component
  const debounceTimeout = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Clear previous timeout
    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }

    // Set new timeout
    debounceTimeout.current = setTimeout(() => {
      if (selectedType === 'template') {
        dispatch(fetchTemplates({ search: searchQuery }));
      } else if (selectedType === 'dynamic' && partnerName) {
        dispatch(fetchDynamicData({ partnerName, search: searchQuery }));
      }
    }, 500); // Wait 500ms after last keystroke

    // Cleanup on unmount or dependency change
    return () => {
      if (debounceTimeout.current) {
        clearTimeout(debounceTimeout.current);
      }
    };
  }, [selectedType, partnerName, searchQuery, dispatch]);


  // useEffect(() => {
  //   if (selectedType === 'template') {
  //     dispatch(fetchTemplates({ search: searchQuery }));
  //   } else if (selectedType === 'dynamic' && partnerName) {
  //     dispatch(fetchDynamicData({ partnerName, search: searchQuery }));
  //   }

  // }, [selectedType, partnerName, searchQuery, dispatch]); // Removed currentPage from dependencies

  useEffect(() => {
    const hasSelectedItems = formData.varianceName.length > 0;
    const hasValidPercentage = formData.applyPercentage !== '' &&
      parseFloat(formData.applyPercentage) >= 0 &&
      parseFloat(formData.applyPercentage) <= 100;
    setIsFormValid(hasSelectedItems || (hasAssignedItems && hasValidPercentage));
  }, [formData.applyPercentage, formData.varianceName, hasAssignedItems]);

  useEffect(() => {
    if (hasAssignedItems) {
      if (formData.applyPercentage && formData.varianceName.length === 0) {
        setButtonLabel('Apply Changes');
      } else {
        setButtonLabel('Assign');
      }
    } else if (formData.varianceName.length > 0) {
      setButtonLabel('Assign');
    } else {
      setButtonLabel('Assign');
    }
  }, [formData.varianceName, formData.applyPercentage, hasAssignedItems, selectedType]);

  const handleCreateTemplate = () => {
    setCreateTemplateDialogOpen(true);
    setCreateTemplateDisabled(true);
  };

  const validateFields = () => {
    const errors = {
      percentage: '', category: '', subCategory: '', varianceName: '', applyPercentage: ''
    };
    let isValid = true;

    if (!formData.applyPercentage) {
      errors.applyPercentage = 'Required';
      isValid = false;
    } else if (parseFloat(formData.applyPercentage) < 0 || parseFloat(formData.applyPercentage) > 100) {
      errors.applyPercentage = 'give below 100';
      isValid = false;
    }

    setValidationErrors(errors);
    return isValid;
  };



  // const handleSubmit = async () => {
  //   if (!validateFields()) return;

  //   try {
  //     setIsSubmitting(true);
  //     const percentage = parseFloat(formData.applyPercentage) || 0;
  //     const errors: string[] = [];
  //     const successfullyProcessedItemNames: string[] = [];

  //     if (temporaryItems.length > 0) {
  //       const currentItems = selectedType === 'template' ? templates : dynamic;

  //       const isDuplicate = currentItems.some((item) =>
  //         temporaryItems.some(
  //           (ti) => ti.itemName.toLowerCase() === item.itemName.toLowerCase() && !ti.isTemporary
  //         )
  //       );
  //       if (isDuplicate) {
  //         dispatch(setSnackbarMessage('Item with this name already exists.'));
  //         dispatch(setSnackbarOpen(true));
  //         return;
  //       }

  //       for (const item of temporaryItems) {
  //         const isExisting = templates.find(
  //           (t) => t.itemName.toLowerCase() === item.itemName.toLowerCase() && !item.isTemporary
  //         );

  //         const submitData =
  //           selectedType === 'dynamic'
  //             ? {
  //               dynamicDataId: '',
  //               itemName: item.itemName,
  //               Defaultprice: item.currentPrice,
  //               percentage: item.percentage,
  //               partnerPrice: Math.round(item.currentPrice * (1 + item.percentage / 100)),
  //               status: 'active',
  //               partnerId: partnerName,
  //             }
  //             : {
  //               onlinePartnerTemplateId: isExisting ? isExisting.onlinePartnerTemplateId : '',
  //               itemName: item.itemName,
  //               Defaultprice: item.currentPrice,
  //               percentage: item.percentage,
  //               partnerPrice: Math.round(item.currentPrice * (1 + item.percentage / 100)),
  //               assignedPartners: item.assignedPartners,
  //               deactivateAssignedPartners: item.deactivateAssignedPartners,
  //               status: 'active',
  //             };

  //         try {
  //           if (isExisting && selectedType === 'template') {
  //             await dispatch(updateTemplate(submitData)).unwrap();
  //           } else {
  //             await dispatch(addTemplate(submitData)).unwrap();
  //           }
  //         } catch (error: unknown) { }
  //       }

  //       setSelectionOrder((prev) => {
  //         const existingItems = prev.filter((name) => !temporaryItems.some((ti) => ti.itemName === name));
  //         return [...successfullyProcessedItemNames.reverse(), ...existingItems];
  //       });
  //     } else if (buttonLabel === 'Apply Changes') {
  //       const currentItems = selectedType === 'template' ? templates : dynamic;
  //       for (const item of currentItems) {
  //         const submitData =
  //           selectedType === 'dynamic'
  //             ? {
  //               dynamicDataId: 'dynamicDataId' in item ? item.dynamicDataId : '',
  //               itemName: item.itemName,
  //               Defaultprice: item.Defaultprice,
  //               percentage,
  //               partnerPrice: Math.round(item.Defaultprice * (1 + percentage / 100)),
  //               status: 'active',
  //               partnerId: partnerName,
  //             }
  //             : {
  //               onlinePartnerTemplateId: 'onlinePartnerTemplateId' in item ? item.onlinePartnerTemplateId : '',
  //               itemName: item.itemName,
  //               Defaultprice: item.Defaultprice,
  //               percentage,
  //               partnerPrice: Math.round(item.Defaultprice * (1 + percentage / 100)),
  //               assignedPartners: item.assignedPartners || [],
  //               deactivateAssignedPartners: item.deactivateAssignedPartners || [],
  //               status: 'active',
  //             };

  //         try {
  //           await dispatch(updateTemplate(submitData)).unwrap();
  //         } catch (error: unknown) { }
  //       }
  //     }

  //     if (buttonLabel === 'Assign') {
  //       setHasAssignedItems(true);
  //     }

  //     setTemporaryItems([]);
  //     setFormData({ category: [], subCategory: [], varianceName: [], applyPercentage: '' });
  //     setSelectedRows([]);
  //     setValidationErrors({ percentage: '', category: '', subCategory: '', varianceName: '', applyPercentage: '' });
  //     setIsFormValid(false);

  //     if (errors.length > 0) {
  //       dispatch(setSnackbarMessage(errors.join('; ')));
  //     } else {
  //       dispatch(setSnackbarMessage(`Successfully ${buttonLabel === 'Assign' ? 'Assigned' : 'Updated'} All item(s)!`));
  //     }

  //     dispatch(setSnackbarOpen(true));

  //     if (selectedType === 'template') {
  //       dispatch(fetchTemplates({ search: searchQuery }));
  //     } else {
  //       dispatch(fetchDynamicData({ partnerName, search: searchQuery }));
  //     }
  //   } catch (error: unknown) {
  //     let errorMessage = 'An error occurred while processing items';
  //     if (error instanceof Error) {
  //       errorMessage = error.message;
  //     }
  //     dispatch(setSnackbarMessage(errorMessage));
  //     dispatch(setSnackbarOpen(true));
  //   } finally {
  //     setIsSubmitting(false);
  //   }
  // };



  const handleSubmit = async () => {
    if (!validateFields()) return;

    try {
      setIsSubmitting(true);
      const percentage = parseFloat(formData.applyPercentage) || 0;
      const errors: string[] = [];
      const successfullyProcessedItemNames: string[] = [];

      if (temporaryItems.length > 0) {
        const currentItems = selectedType === 'template' ? templates : dynamic;

        const isDuplicate = currentItems.some((item) =>
          temporaryItems.some(
            (ti) => ti.itemName.toLowerCase() === item.itemName.toLowerCase() && !ti.isTemporary
          )
        );
        if (isDuplicate) {
          dispatch(setSnackbarMessage('Item with this name already exists.'));
          dispatch(setSnackbarOpen(true));
          return;
        }

        const newTemplateItems: OnlinePartnerTemplate[] = [];

        for (const item of temporaryItems) {
          const isExisting = templates.find(
            (t) => t.itemName.toLowerCase() === item.itemName.toLowerCase() && !item.isTemporary
          );

          const submitData =
            selectedType === 'dynamic'
              ? {
                dynamicDataId: '',
                itemName: item.itemName,
                Defaultprice: item.currentPrice,
                percentage: item.percentage,
                partnerPrice: Math.round(item.currentPrice * (1 + item.percentage / 100)),
                status: 'active',
                partnerId: partnerName,
              }
              : {
                onlinePartnerTemplateId: isExisting ? isExisting.onlinePartnerTemplateId : '',
                itemName: item.itemName,
                Defaultprice: item.currentPrice,
                percentage: item.percentage,
                partnerPrice: Math.round(item.currentPrice * (1 + item.percentage / 100)),
                assignedPartners: item.assignedPartners,
                deactivateAssignedPartners: item.deactivateAssignedPartners,
                status: 'active',
              };

          if (selectedType === 'template' && !isExisting) {
            // Collect brand-new template items to send in ONE bulk call
            newTemplateItems.push(submitData as OnlinePartnerTemplate);
            successfullyProcessedItemNames.push(item.itemName);
          } else {
            try {
              if (isExisting && selectedType === 'template') {
                await dispatch(updateTemplate(submitData)).unwrap();
              } else {
                // dynamic-type items still go one-by-one
                await dispatch(addTemplate(submitData)).unwrap();
              }
              successfullyProcessedItemNames.push(item.itemName);
            } catch (error: unknown) {
              if (error instanceof Error) {
                errors.push(`${item.itemName}: ${error.message}`);
              }
            }
          }
        }

        if (newTemplateItems.length > 0) {
          try {
            await dispatch(addTemplatesBulk(newTemplateItems)).unwrap();
          } catch (error: unknown) {
            if (error instanceof Error) {
              errors.push(`Bulk add failed: ${error.message}`);
            }
          }
        }

        setSelectionOrder((prev) => {
          const existingItems = prev.filter((name) => !temporaryItems.some((ti) => ti.itemName === name));
          return [...successfullyProcessedItemNames.reverse(), ...existingItems];
        });
      } else if (buttonLabel === 'Apply Changes') {
        const currentItems = selectedType === 'template' ? templates : dynamic;
        for (const item of currentItems) {
          const submitData =
            selectedType === 'dynamic'
              ? {
                dynamicDataId: 'dynamicDataId' in item ? item.dynamicDataId : '',
                itemName: item.itemName,
                Defaultprice: item.Defaultprice,
                percentage,
                partnerPrice: Math.round(item.Defaultprice * (1 + percentage / 100)),
                status: 'active',
                partnerId: partnerName,
              }
              : {
                onlinePartnerTemplateId: 'onlinePartnerTemplateId' in item ? item.onlinePartnerTemplateId : '',
                itemName: item.itemName,
                Defaultprice: item.Defaultprice,
                percentage,
                partnerPrice: Math.round(item.Defaultprice * (1 + percentage / 100)),
                assignedPartners: item.assignedPartners || [],
                deactivateAssignedPartners: item.deactivateAssignedPartners || [],
                status: 'active',
              };

          try {
            await dispatch(updateTemplate(submitData)).unwrap();
          } catch (error: unknown) { }
        }
      }

      if (buttonLabel === 'Assign') {
        setHasAssignedItems(true);
      }

      setTemporaryItems([]);
      setFormData({ category: [], subCategory: [], varianceName: [], applyPercentage: '' });
      setSelectedRows([]);
      setValidationErrors({ percentage: '', category: '', subCategory: '', varianceName: '', applyPercentage: '' });
      setIsFormValid(false);

      if (errors.length > 0) {
        dispatch(setSnackbarMessage(errors.join('; ')));
      } else {
        dispatch(setSnackbarMessage(`Successfully ${buttonLabel === 'Assign' ? 'Assigned' : 'Updated'} All item(s)!`));
      }

      dispatch(setSnackbarOpen(true));

      if (selectedType === 'template') {
        dispatch(fetchTemplates({ search: searchQuery }));
      } else {
        dispatch(fetchDynamicData({ partnerName, search: searchQuery }));
      }
    } catch (error: unknown) {
      let errorMessage = 'An error occurred while processing items';
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      dispatch(setSnackbarMessage(errorMessage));
      dispatch(setSnackbarOpen(true));
    } finally {
      setIsSubmitting(false);
    }
  };
  

  const handleEditPercentage = (item: SelectedItem) => {
    setEditItem({ ...item, percentage: item.percentage, percentageError: '' });
  };

  const handlePercentageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (editItem) {
      const percentage = parseFloat(e.target.value) || 0;
      const percentageError = percentage < 0 || percentage > 100 ? 'Percentage must be between 0 and 100' : '';
      setEditItem({
        ...editItem,
        percentage,
        partnerPrice: Math.round(editItem.currentPrice * (1 + percentage / 100)),
        percentageError,
      });
    }
  };

  const isDynamicData = (item: OnlinePartnerTemplate | dynamicData | undefined): item is dynamicData => {
    return item !== undefined && 'dynamicDataId' in item;
  };

  const isOnlinePartnerTemplate = (item: OnlinePartnerTemplate | dynamicData | undefined): item is OnlinePartnerTemplate => {
    return item !== undefined && 'onlinePartnerTemplateId' in item;
  };

  const handleSavePercentage = async () => {
    if (editItem && !editItem.percentageError) {
      try {
        setIsSubmitting(true);
        const originalItem = selectedType === 'dynamic'
          ? dynamic.find((item) => item.itemName === editItem.itemName)
          : templates.find((item) => item.itemName === editItem.itemName);

        const submitData = selectedType === 'dynamic'
          ? {
            dynamicDataId: isDynamicData(originalItem) ? originalItem.dynamicDataId : '',
            itemName: editItem.itemName,
            Defaultprice: editItem.currentPrice,
            percentage: editItem.percentage,
            partnerPrice: editItem.partnerPrice,
            status: 'active',
            partnerId: partnerName,
          }
          : {
            onlinePartnerTemplateId: isOnlinePartnerTemplate(originalItem) ? originalItem.onlinePartnerTemplateId : '',
            itemName: editItem.itemName,
            Defaultprice: editItem.currentPrice,
            percentage: editItem.percentage,
            partnerPrice: editItem.partnerPrice,
            assignedPartners: editItem.assignedPartners,
            deactivateAssignedPartners: editItem.deactivateAssignedPartners,
            status: 'active',
          };

        if (
          (selectedType === 'dynamic' && !submitData.dynamicDataId) ||
          (selectedType === 'template' && !submitData.onlinePartnerTemplateId)
        ) {
          throw new Error('No valid ID found for update');
        }

        await dispatch(updateTemplate(submitData)).unwrap();
        dispatch(setSnackbarMessage('Percentage updated successfully!'));
        dispatch(setSnackbarOpen(true));
        setEditItem(null);
        setTemporaryItems((prev) =>
          prev.map((item) =>
            item.itemName === editItem.itemName
              ? { ...item, percentage: editItem.percentage, partnerPrice: editItem.partnerPrice }
              : item
          )
        );
        setSelectionOrder((prev) => {
          const existing = prev.filter((name) => name !== editItem.itemName);
          return [editItem.itemName, ...existing];
        });
        if (selectedType === 'template') {
          dispatch(fetchTemplates({ search: searchQuery }));
        } else {
          dispatch(fetchDynamicData({ partnerName, search: searchQuery }));
        }
      } catch (error: unknown) {
        let errorMessage = 'Failed to update percentage';
        if (error instanceof Error) {
          errorMessage = error.message;
        }
        dispatch(setSnackbarMessage(errorMessage));
        dispatch(setSnackbarOpen(true));
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const handleCommonDeactivate = async () => {
    if (selectedRows.length > 0) {
      const temporarySelectedItems = temporaryItems.filter((item) =>
        selectedRows.includes(item.itemName)
      );

      if (temporarySelectedItems.length > 0) {
        setTemporaryItems((prev) =>
          prev.filter((item) => !selectedRows.includes(item.itemName))
        );
        setFormData((prev) => ({
          ...prev,
          varianceName: prev.varianceName.filter((vn) => !selectedRows.includes(vn)),
        }));
        setSelectedRows((prev) =>
          prev.filter((id) => !temporarySelectedItems.some((item) => item.itemName === id))
        );
        setSelectionOrder((prev) =>
          prev.filter((name) => !temporarySelectedItems.some((item) => item.itemName === name))
        );
        dispatch(setSnackbarMessage(`${temporarySelectedItems.length} temporary item(s) removed successfully!`));
        dispatch(setSnackbarOpen(true));
        return;
      }

      if (selectedType === 'template') {
        setActionType('delete');
        setConfirmationDialogOpen(true);
      } else if (selectedType === 'dynamic') {
        setActionType('delete');
        setConfirmationDialogOpen(true);
      }
    }
  };

  const handleDelete = (item: SelectedItem | OnlinePartnerTemplate | dynamicData) => {
    // Type guard to check if item is a SelectedItem
    const isSelectedItem = (item: SelectedItem | OnlinePartnerTemplate | dynamicData): item is SelectedItem => {
      return 'currentPrice' in item;
    };

    if (isSelectedItem(item) && item.isTemporary) {
      setTemporaryItems((prev) => prev.filter((i) => i.itemName !== item.itemName));
      setFormData((prev) => ({
        ...prev,
        varianceName: prev.varianceName.filter((vn) => vn !== item.itemName),
      }));
      setSelectedRows((prev) => prev.filter((id) => id !== item.itemName));
      setSelectionOrder((prev) => prev.filter((name) => name !== item.itemName));
      dispatch(setSnackbarMessage('Temporary item removed successfully!'));
      dispatch(setSnackbarOpen(true));
      return;
    }

    if (selectedType === 'template') {
      if ('onlinePartnerTemplateId' in item) {
        setSelectedItem(item as OnlinePartnerTemplate);
        setActionType('delete');
        setConfirmationDialogOpen(true);
      }
    } else if (selectedType === 'dynamic') {
      if ('dynamicDataId' in item) {
        setSelectedItem(item as dynamicData);
        setActionType('delete');
        setConfirmationDialogOpen(true);
      }
    }
  };

  const handleConfirmationDialogConfirm = async () => {
    try {
      setIsSubmitting(true);

      if (selectedRows.length > 0) {
        const nonTemporaryIds = selectedRows.filter(
          (id) => !temporaryItems.some((item) => item.itemName === id)
        );

        if (selectedType === 'template' && actionType === 'delete') {
          if (nonTemporaryIds.length > 0) {
            const firstTemplate = templates.find((item) =>
              nonTemporaryIds.includes(item.onlinePartnerTemplateId)
            );
            const onlinePartnerTemplateId = firstTemplate?.onlinePartnerTemplateId;

            if (onlinePartnerTemplateId) {
              await dispatch(deleteMultipleTemplates({
                onlinePartnerTemplateId,
                ids: nonTemporaryIds,
              })).unwrap();

              const deletedItems = templates.filter((item) =>
                nonTemporaryIds.includes(item.onlinePartnerTemplateId)
              );

              setSelectedRows([]);
              setSelectionOrder((prev) =>
                prev.filter((name) => !deletedItems.some((item) => item.itemName === name))
              );
              dispatch(fetchTemplates({ search: searchQuery }));
              dispatch(setSnackbarMessage(`${nonTemporaryIds.length} template(s) deleted successfully!`));
            } else {
              dispatch(setSnackbarMessage('Failed to resolve template ID for deletion.'));
            }
          }
        } else if (selectedType === 'dynamic' && actionType === 'delete') {
          if (nonTemporaryIds.length > 0) {
            await dispatch(bulkRemovePartnerItems({
              partnerName,
              itemNames: nonTemporaryIds
            })).unwrap();

            setSelectedRows([]);
            setSelectionOrder((prev) =>
              prev.filter((name) => !nonTemporaryIds.includes(name))
            );
            dispatch(fetchDynamicData({ partnerName, search: searchQuery }));
            dispatch(fetchTemplates({ search: searchQuery }));
            dispatch(setSnackbarMessage(`${nonTemporaryIds.length} dynamic item(s) deleted successfully!`));
          }
        }
      } else if (selectedItem) {
        if (selectedType === 'template' && actionType === 'delete') {
          const id = 'onlinePartnerTemplateId' in selectedItem ? selectedItem.onlinePartnerTemplateId : '';
          if (id) {
            await dispatch(deleteTemplate(id)).unwrap();
            setSelectionOrder((prev) => prev.filter((name) => name !== selectedItem.itemName));
            dispatch(setSnackbarMessage('Template deleted successfully!'));
          }
        } else if (selectedType === 'dynamic' && actionType === 'delete') {
          const itemName = selectedItem.itemName;
          if (itemName) {
            await dispatch(
              deleteDynamicItemFromPartner({ partnerName, itemName })
            ).unwrap();
            setSelectionOrder((prev) => prev.filter((name) => name !== itemName));
            dispatch(setSnackbarMessage('Dynamic item deleted successfully!'));
          }
        }
      }

      dispatch(setSnackbarOpen(true));

      if (selectedType === 'template') {
        dispatch(fetchTemplates({ search: searchQuery }));
      } else {
        dispatch(fetchDynamicData({ partnerName, search: searchQuery }));
      }
    } catch (error: unknown) {
      let errorMessage = 'An error occurred';
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      dispatch(setSnackbarMessage(errorMessage));
      dispatch(setSnackbarOpen(true));
    } finally {
      setIsSubmitting(false);
      setConfirmationDialogOpen(false);
      setSelectedItem(null);
      setActionType(null);
    }
  };

  const renderAssignedPartners = (partners: string[] | undefined) => {
    if (!partners || partners.length === 0) return '';
    const partnerString = partners.map((p) => p.toUpperCase()).join(', ');
    if (partnerString.length <= 40) return partnerString;

    return (
      <Box>
        <Typography variant="body2">{partnerString.slice(0, 40) + '...'}</Typography>
        <TableRow>
          <TableCell colSpan={8} align="center">
            <Typography variant="caption">{partnerString}</Typography>
          </TableCell>
        </TableRow>
      </Box>
    );
  };

  const filteredItems = [
    ...temporaryItems.map((item) => ({ ...item, isTemporary: true })),
    ...(selectedType === 'template'
      ? showDeactivated ? deactivatedItems : templates
      : showDeactivated ? deactivatedDynamic : dynamic
    ).map((item) => ({ ...item, isTemporary: false })),
  ]
    .filter((item) => item.itemName.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => {
      const indexA = selectionOrder.indexOf(a.itemName);
      const indexB = selectionOrder.indexOf(b.itemName);
      if (indexA === -1 && indexB === -1) return 0;
      if (indexA === -1) return 1;
      if (indexB === -1) return -1;
      return indexA - indexB;
    });

  return (
    <Box className="online-partner-template-view" sx={{ mt: -3 }}>

      <FilterActionBar
        selectedType={selectedType}
        partnerName={partnerName}
        formData={formData}
        setFormData={setFormData}
        validationErrors={validationErrors}
        setValidationErrors={setValidationErrors}
        temporaryItems={temporaryItems}
        setTemporaryItems={setTemporaryItems}
        selectedRows={selectedRows}
        buttonLabel={buttonLabel}
        hasOpenedCreateDialog={hasOpenedCreateDialog}
        isFormValid={isFormValid}
        handleSubmit={handleSubmit}
        handleCommonDeactivate={handleCommonDeactivate}
        setAssignDialogOpen={setAssignDialogOpen}
        setItemSearchQuery={setItemSearchQuery}
        selectionOrder={selectionOrder}
        setSelectionOrder={setSelectionOrder}
        handleCreateTemplate={handleCreateTemplate}
        createTemplateDisabled={createTemplateDisabled}
      />

      <TemplateTable
        selectedType={selectedType}
        filteredItems={filteredItems}
        selectedRows={selectedRows}
        setSelectedRows={setSelectedRows}
        showDeactivated={showDeactivated}
        currentPage={currentPage}
        // loading={loading}
        handleEditPercentage={handleEditPercentage}
        handleDelete={handleDelete}
        renderAssignedPartners={renderAssignedPartners}
      />

      <TemplateDialogs
        assignDialogOpen={assignDialogOpen}
        setAssignDialogOpen={setAssignDialogOpen}
        assignConfirmationDialogOpen={assignConfirmationDialogOpen}
        setAssignConfirmationDialogOpen={setAssignConfirmationDialogOpen}
        selectedPartners={selectedPartners}
        setSelectedPartners={setSelectedPartners}
        assignMessage={assignMessage}
        newPartnersToAssign={newPartnersToAssign}
        isSubmitting={isSubmitting}
        selectedRows={selectedRows}
        setSelectedRows={setSelectedRows}
        selectionOrder={selectionOrder}
        setSelectionOrder={setSelectionOrder}
      />

      <Dialog
        maxWidth="sm"
        fullWidth
        className="ma-scope online-partner-template-dialog"
        PaperProps={{
          className: "dialog-paper-small online-partner-template-dialog-paper"
        }}
        open={createTemplateDialogOpen} onClose={() => {
          setCreateTemplateDialogOpen(false);
        }}>
        <DialogTitle className='dialog-title'>Create Template</DialogTitle>
        <DialogContent className='dialog-content'>
          <Typography>Please choose an ITEMS to create a template.</Typography>
        </DialogContent>
        <DialogActions className='dialog-actions'>
          <button
            onClick={() => {
              setCreateTemplateDialogOpen(false);
            }}
            color="primary"
            className='btn-primary'
          >
            Okay
          </button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={!!editItem}
        onClose={() => setEditItem(null)}
        maxWidth="sm"
        fullWidth
        className="ma-scope online-partner-template-dialog"
        PaperProps={{
         className: "dialog-paper-small online-partner-template-dialog-paper"
        }}
      >
        <DialogTitle className='dialog-title'>Edit Percentage</DialogTitle>
        <DialogContent className='dialog-content'>
          <div className='form-section'>
            <TextField
              fullWidth
              value={editItem?.percentage || ''}
              onChange={handlePercentageChange}
              variant="outlined"
              error={!!editItem?.percentageError}
              helperText={editItem?.percentageError}
              disabled={isSubmitting}
              inputProps={{
              inputMode: 'decimal',
              pattern: '[0-9]*\\.?[0-9]*',
              maxLength: 2, // Optional: limit input length
            }}
              className="custom-textfield"
              InputLabelProps={{ className: "custom-label" }}
              InputProps={{ className: "custom-input" }}
            />
          </div>
        </DialogContent>
        <DialogActions className='dialog-actions'>
          <button onClick={() => setEditItem(null)} disabled={isSubmitting} className='btn-secondary'>
            Cancel
          </button>
          <button
            onClick={handleSavePercentage}
            disabled={isSubmitting || !!editItem?.percentageError}
            className='btn-primary'
          >
            {isSubmitting ? <CircularProgress size={24} /> : 'Update'}
          </button>
        </DialogActions>
      </Dialog>

      <ActivateDeactivateConfirmationDialog
        open={confirmationDialogOpen}
        actionType={actionType}
        onClose={() => {
          setConfirmationDialogOpen(false);
          setActionType(null);
          setSelectedItem(null);
        }}
        onConfirm={handleConfirmationDialogConfirm}
      />

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={() => dispatch(setSnackbarOpen(false))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      >
        <Alert
          onClose={() => dispatch(setSnackbarOpen(false))}
          severity="info"
         className="online-partner-snackbar-alert"
          sx={{ width: '100%', backgroundColor: 'var(--erp-accent, #155eef)', color: 'var(--erp-accent-contrast, #ffffff)' }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default OnlinePartnerTemplateComponent;