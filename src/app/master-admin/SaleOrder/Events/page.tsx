
'use client';
import React, { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { RootState, AppDispatch } from "../../../../redux/store";
import {
  fetchEvents,
  addEvent,
  updateEvent,
  setEventData,
  setDialogOpen,
  setSnackbarOpen,
  setSnackbarMessage,
} from "../Events/Features/EventSlice";
import { Event } from "../Events/Models/eventModels";
import { Alert, Snackbar } from "@mui/material";
import EventTableComponent from "../Events/Modules/EventTableComponent";
import CloseConfirmationDialog from "../../../Components/Dialogs/CloseConfirmationDialog";
import EditConfirmationDialog from "../../../Components/Dialogs/EditConfirmationDialog";
import ActivateDeactivateConfirmationDialog from "../../../Components/Dialogs/ActivateDeactivateConfirmationDialog";
import EventDialog from "../Events/Modules/EventDialog";
import MenuPage from "../page";

const EventTable: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const {
    items,
    loading,
    dialogOpen,
    snackbarOpen,
    snackbarMessage,
    eventData,
  } = useSelector((state: RootState) => state.Event);

  const [viewDeactivated, setViewDeactivated] = useState(false);
  const [confirmationDialogOpen, setConfirmationDialogOpen] = useState(false);
  const [editConfirmationDialogOpen, setEditConfirmationDialogOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [actionType, setActionType] = useState<"deactivate" | "activate" | null>(null);
  const [closeConfirmationDialogOpen, setCloseConfirmationDialogOpen] = useState(false);
  const [unsavedChanges, setUnsavedChanges] = useState(false);
  const [validationErrors, setValidationErrors] = useState({ eventname: "", });

  useEffect(() => {
    dispatch(fetchEvents());
  }, [dispatch]);

  const handleOpen = () => {
    dispatch(
      setEventData({
        eventId: "",
        eventname: "",
        remarks: "",
        createdDate: null,
        updatedDate: null,
        status: "active",
      })
    );
    setValidationErrors({ eventname: "" });
    setUnsavedChanges(false);
    dispatch(setDialogOpen("add"));
  };

  const handleClose = () => {
    if (unsavedChanges) {
      setCloseConfirmationDialogOpen(true);
    } else {
      setValidationErrors({ eventname: "" });
      dispatch(setDialogOpen("none"));
    }
  };

  const handleConfirmClose = () => {
    dispatch(setDialogOpen("none"));
    setCloseConfirmationDialogOpen(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    dispatch(setEventData({ ...eventData, [name]: value }));
    setValidationErrors({ ...validationErrors, [name]: "" });
    setUnsavedChanges(true);
  };

  const validateForm = () => {
    const errors = { eventname: "" };
    let isValid = true;

    if (!eventData.eventname.trim()) {
      errors.eventname = "Event Name is required";
      isValid = false;
    } else if (!/^[A-Za-z\s]+$/.test(eventData.eventname)) {
      errors.eventname = "Event Name can only contain letters and spaces";
      isValid = false;
    } else if (eventData.eventname.length > 20) {
      errors.eventname = "Name cannot exceed 20 characters";
      isValid = false;
    }

    // Check for duplicates (excluding current item if editing)
    const isDuplicate = items.some(item =>
      item.eventname.toLowerCase() === eventData.eventname.toLowerCase() &&
      (!eventData.eventId || item.eventId !== eventData.eventId)
    );

    if (isDuplicate) {
      errors.eventname = "This event already exists";
      isValid = false;
    }

    setValidationErrors(errors);
    return isValid;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    if (eventData.eventId) {
      setEditConfirmationDialogOpen(true);
    } else {
      await dispatch(addEvent(eventData));
      dispatch(fetchEvents());
      dispatch(setSnackbarMessage("Event saved successfully!"));
      dispatch(setSnackbarOpen(true));
      setUnsavedChanges(false);
      dispatch(setDialogOpen("none"));
    }
  };

  const handleEditConfirmation = async () => {
    await dispatch(updateEvent(eventData));
    dispatch(fetchEvents());
    dispatch(setSnackbarMessage("Event updated successfully!"));
    dispatch(setSnackbarOpen(true));
    setUnsavedChanges(false);
    setEditConfirmationDialogOpen(false);
    dispatch(setDialogOpen("none"));
  };

  const handleEdit = (event: Event) => {
    setSelectedEvent(event);
    dispatch(setEventData(event));
    dispatch(setDialogOpen("edit"));
  };

  const handleDeactivate = (event: Event) => {
    setSelectedEvent(event);
    setActionType("deactivate");
    setConfirmationDialogOpen(true);
  };

  const handleActivate = (event: Event) => {
    setSelectedEvent(event);
    setActionType("activate");
    setConfirmationDialogOpen(true);
  };


  const handleConfirmationDialogConfirm = async () => {
    if (selectedEvent && actionType) {
      const updatedData = {
        ...selectedEvent,
        status: actionType === "deactivate" ? "deactivated" : "active"
      };

      await dispatch(updateEvent(updatedData));
      dispatch(fetchEvents());
      dispatch(setSnackbarMessage(`Event ${actionType} Successfully!`));
      dispatch(setSnackbarOpen(true));
    }
    setConfirmationDialogOpen(false);
    setSelectedEvent(null);
    setActionType(null);
  };

  return (
    <>
      {/* <MenuPage /> */}



      <EventTableComponent
        items={items}
        loading={loading}
        viewDeactivated={viewDeactivated}
        setViewDeactivated={setViewDeactivated}
        handleOpen={handleOpen}
        handleEdit={handleEdit}
        handleDeactivate={handleDeactivate}
        handleActivate={handleActivate}
      />

      <EventDialog
        open={dialogOpen !== "none"}
        onClose={handleClose}
        onSubmit={handleSubmit}
        eventData={eventData}
        validationErrors={validationErrors}
        handleChange={handleChange}
        loading={false}
        mode={"Edit"}
      />

      <ActivateDeactivateConfirmationDialog
        open={confirmationDialogOpen}
        actionType={actionType}
        itemName={selectedEvent?.eventname}
        onClose={() => setConfirmationDialogOpen(false)}
        onConfirm={handleConfirmationDialogConfirm}
      />

      <EditConfirmationDialog
        open={editConfirmationDialogOpen}
        onClose={() => setEditConfirmationDialogOpen(false)}
        onConfirm={handleEditConfirmation}
      />

      <CloseConfirmationDialog
        open={closeConfirmationDialogOpen}
        onClose={() => setCloseConfirmationDialogOpen(false)}
        onConfirm={handleConfirmClose}
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
          sx={{ width: '100%', backgroundColor: '#1976d2', color: 'white' }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </>
  );
};

export default EventTable;