'use client';
import React, { useState } from "react";
import { useDispatch } from "react-redux";
import { AppDispatch } from "../../../redux/store";
import { setWhatsAppData, setDialogOpen } from "../WhatsappAdmin/Features/whatsAppSlice";
import WhatsAppTableComponent from "../WhatsappAdmin/Modules/whatsappTable";
import WhatsAppDialog from "../WhatsappAdmin/Modules/whatsappDialog";

const WhatsAppPage: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const [viewDeactivated, setViewDeactivated] = useState(false);

  const [, setCloseConfirmationDialogOpen] = useState(false);
  const [unsavedChanges] = useState(false);

  const handleOpen = () => {
    dispatch(
      setWhatsAppData({
        moduleAdminId: "", // Reset the ID
        whatsAppRollName: "",
        mobileNumber: "",
        status: "active",
      })
    );
    dispatch(setDialogOpen("add"));
  };

  const handleClose = () => {
    if (unsavedChanges) {
      setCloseConfirmationDialogOpen(true);
    } else {
      dispatch(setDialogOpen("none"));
    }
  };

  return (
    <>
     
      <WhatsAppTableComponent
        viewDeactivated={viewDeactivated}
        setViewDeactivated={setViewDeactivated}
        handleOpen={handleOpen}
      />
      <WhatsAppDialog handleClose={handleClose} />
    </>
  );
};

export default WhatsAppPage;