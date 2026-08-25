


import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, Box, Checkbox, Typography
} from '@mui/material';
import { AppDispatch, RootState } from '../../../../../../redux/store';
import { setSnackbarMessage, setSnackbarOpen, postToDynamicCollection } from '../Features/OnlineParnerTemplateSlice';

interface TemplateDialogsProps {
  assignDialogOpen: boolean;
  setAssignDialogOpen: React.Dispatch<React.SetStateAction<boolean>>;
  assignConfirmationDialogOpen: boolean;
  setAssignConfirmationDialogOpen: React.Dispatch<React.SetStateAction<boolean>>;
  selectedPartners: string[];
  setSelectedPartners: React.Dispatch<React.SetStateAction<string[]>>;
  assignMessage: string;
  newPartnersToAssign: string[];
  isSubmitting: boolean;
  selectedRows: string[];
  setSelectedRows: React.Dispatch<React.SetStateAction<string[]>>;
  selectionOrder: string[];
  setSelectionOrder: React.Dispatch<React.SetStateAction<string[]>>;
}

const TemplateDialogs: React.FC<TemplateDialogsProps> = ({
  assignDialogOpen,
  setAssignDialogOpen,
  assignConfirmationDialogOpen,
  setAssignConfirmationDialogOpen,
  selectedPartners,
  setSelectedPartners,
  isSubmitting,
  selectedRows,
  setSelectedRows,

  setSelectionOrder,
}) => {
  const dispatch = useDispatch<AppDispatch>();
  const { partner, items: templates } = useSelector((state: RootState) => state.onlinePartnerTemplate);

  const [assignMessage, setAssignMessage] = useState("");
  const [newPartnersToAssign, setNewPartnersToAssign] = useState<string[]>([]);



  const handleAssignItems = () => {
    const itemsToAssign = templates
      .filter((item) => selectedRows.includes(item.onlinePartnerTemplateId))
      .map((item) => ({
        itemName: item.itemName,
        Defaultprice: item.itemName,
        percentage: Math.floor(item.percentage),
        partnerPrice: item.partnerPrice,
        status: "active",
        assignedPartners: item.assignedPartners || [],
        deactivateAssignedPartners: item.deactivateAssignedPartners || [],
      }));

    const alreadyAssigned: { partnerName: string; itemNames: string[] }[] = [];
    const deactivatedAssignments: { partnerName: string; itemNames: string[] }[] = [];
    const newAssignments: { partnerName: string; itemNames: string[] }[] = [];

    selectedPartners.forEach((partnerName) => {
      const assignedItems = itemsToAssign
        .filter((item) =>
          item.assignedPartners
            .map((p) => p.toLowerCase())
            .includes(partnerName.toLowerCase())
        )
        .map((item) => item.itemName);

      const deactivatedItems = itemsToAssign
        .filter((item) =>
          item.deactivateAssignedPartners
            .map((p) => p.toLowerCase())
            .includes(partnerName.toLowerCase())
        )
        .map((item) => item.itemName);

      const unassignedItems = itemsToAssign
        .filter(
          (item) =>
            !item.assignedPartners
              .map((p) => p.toLowerCase())
              .includes(partnerName.toLowerCase()) &&
            !item.deactivateAssignedPartners
              .map((p) => p.toLowerCase())
              .includes(partnerName.toLowerCase())
        )
        .map((item) => item.itemName);

      if (assignedItems.length > 0) {
        alreadyAssigned.push({ partnerName, itemNames: assignedItems });
      }
      if (deactivatedItems.length > 0) {
        deactivatedAssignments.push({ partnerName, itemNames: deactivatedItems });
      }
      if (unassignedItems.length > 0) {
        newAssignments.push({ partnerName, itemNames: unassignedItems });
      }
    });

    setAssignMessage(JSON.stringify({ alreadyAssigned, deactivatedAssignments, newAssignments }));
    setNewPartnersToAssign(newAssignments.map((assignment) => assignment.partnerName));
    setAssignConfirmationDialogOpen(true);
  };


  const handleAssignConfirmation = async () => {
    if (newPartnersToAssign.length === 0) {
      setAssignConfirmationDialogOpen(false);
      setAssignDialogOpen(false);
      setSelectedPartners([]);
      dispatch(setSnackbarMessage('No new assignments to process.'));
      dispatch(setSnackbarOpen(true));
      return;
    }

    try {
      const itemsToAssign = templates
        .filter((item) => selectedRows.includes(item.onlinePartnerTemplateId))
        .map((item) => ({
          itemName: item.itemName,
          Defaultprice: item.Defaultprice,
          percentage: Math.floor(item.percentage),
          partnerPrice: item.partnerPrice,
          status: 'active',
        }));

      for (const partnerName of newPartnersToAssign) {
        const newItemsForPartner = itemsToAssign.filter((item) =>
          !templates
            .find((t) => t.itemName === item.itemName)
            ?.assignedPartners
            ?.map((p) => p.toLowerCase())
            ?.includes(partnerName.toLowerCase())
        );
        if (newItemsForPartner.length > 0) {
          await dispatch(postToDynamicCollection({ partnerName, data: newItemsForPartner })).unwrap();
          setSelectionOrder((prev) => [
            ...newItemsForPartner.map((item) => item.itemName).reverse(),
            ...prev.filter((name) => !newItemsForPartner.some((ni) => ni.itemName === name)),
          ]);
        }
      }

      dispatch(setSnackbarMessage('Items assigned successfully!'));
      dispatch(setSnackbarOpen(true));
      setAssignConfirmationDialogOpen(false);
      setAssignDialogOpen(false);
      setSelectedRows([]);
      setSelectedPartners([]);
    } catch (error: unknown) {
      let errorMessage = 'An error occurred';
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      dispatch(setSnackbarMessage(errorMessage));
      dispatch(setSnackbarOpen(true));
    }
  };

  return (
    <>
      <Dialog
        open={assignDialogOpen}
        onClose={() => setAssignDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        className="ma-scope online-partner-template-dialog"
        PaperProps={{
        className: "dialog-paper-small online-partner-template-dialog-paper"
        }}
      >
        <DialogTitle className='dialog-title'>Assign Partners</DialogTitle>
        <DialogContent className='dialog-content'>
         <Box className="online-partner-assign-select-all" sx={{ display: 'flex', justifyContent: 'flex-end', mt: 0 }}>
            <button
              onClick={() => setSelectedPartners(partner.map((p) => p.partnerName))}
              disabled={isSubmitting}
              className='btn-primary'
            >
              Select All
            </button>
          </Box>
         <Box className="online-partner-assign-list" sx={{ mt: -4 }}>
            {partner.map((p) => (
 <Box className="online-partner-assign-row" key={p.onlinePartnersId} sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>                <Checkbox
                  checked={selectedPartners.includes(p.partnerName)}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    setSelectedPartners((prev) =>
                      checked ? [...prev, p.partnerName] : prev.filter((name) => name !== p.partnerName)
                    );
                  }}
                  sx={{ '& .MuiSvgIcon-root': { fontSize: 32 }, transform: 'scale(0.8)', padding: '8px' }}
                />
                <Typography>{p.partnerName}</Typography>
              </Box>
            ))}
          </Box>
        </DialogContent>
        <DialogActions className='dialog-actions'>
          <button onClick={() => setAssignDialogOpen(false)} disabled={isSubmitting} className='btn-secondary'>
            Cancel
          </button>
          <button
            onClick={handleAssignItems}
            disabled={isSubmitting || selectedPartners.length === 0}
            className='btn-primary'
          >
            Confirm
          </button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={assignConfirmationDialogOpen}
        onClose={() => setAssignConfirmationDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        className="ma-scope online-partner-template-dialog"
        PaperProps={{
          className: "dialog-paper-small online-partner-template-dialog-paper"
        }}
      >
        <DialogTitle className='dialog-title'>Assignment Confirmation</DialogTitle>
        <DialogContent className='dialog-content'>
          {assignMessage ? (
            (() => {
              const parsedMessage = JSON.parse(assignMessage);
              const { alreadyAssigned, newAssignments } = parsedMessage;

              const renderItemsForPartner = (partnerName: string, itemNames: string[]) => (
                <Box key={partnerName} sx={{ mb: 1 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                    {partnerName.toUpperCase()}
                  </Typography>
                  {itemNames.map((itemName) => (
                    <Typography key={itemName} sx={{ pl: 2 }}>
                      {itemName}
                    </Typography>
                  ))}
                </Box>
              );

              const renderAssignmentsByPartner = (
                assignments: { partnerName: string; itemNames: string[] }[],
                backgroundColor: string
              ) => {
                return assignments.map(({ partnerName, itemNames }) => (
                  <Box
                    key={partnerName}
                    sx={{ mb: 1, p: 1, backgroundColor, borderRadius: 1 }}
                  >
                    {renderItemsForPartner(partnerName, itemNames)}
                  </Box>
                ));
              };

              return (
                <Box>
                  <Box mb={2}>
                    <h3 className="form-section-title">New Assignments:</h3>
                    {newAssignments.length > 0 ? (
                      renderAssignmentsByPartner(newAssignments, '#e8f5e9')
                    ) : (
                      <h3 className="form-section-subtitle">No new assignments will be made.</h3>
                    )}
                  </Box>
                  <Box mb={2}>
                    <h3 className="form-section-title">
                      Already Assigned:
                    </h3>
                    {alreadyAssigned.length > 0 ? (
                      renderAssignmentsByPartner(alreadyAssigned, '#fffde7')
                    ) : (
                      <h3 className="form-section-subtitle">No items are already assigned to the selected partners.</h3>
                    )}
                  </Box>
                </Box>
              );
            })()
          ) : (
            <h3 className="form-section-title">No assignment data available.</h3>
          )}
        </DialogContent>
        <DialogActions className='dialog-actions'>
          <button onClick={() => setAssignConfirmationDialogOpen(false)} disabled={isSubmitting} className='btn-secondary'>
            Cancel
          </button>
          <button
            onClick={handleAssignConfirmation}
            disabled={isSubmitting || newPartnersToAssign.length === 0}
            className='btn-primary'
          >
            Confirm
          </button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default TemplateDialogs;