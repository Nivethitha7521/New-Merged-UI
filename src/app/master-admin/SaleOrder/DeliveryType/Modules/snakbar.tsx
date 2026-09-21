"use client";
import React from "react";
import{
    Snackbar,
    Alert,
} from '@mui/material';

// interface DeliveryType{
//     deliveryTypeId:string;
//     deliveryType:string;
//     remarks:string;
//     status:'active'| 'deactivated';

// }
interface DeliveryTypeProps{
  snackbarOpen:boolean;
  handleSnackbarClose:()=>void;
  snackbarMessage:string;
}
 
const DeliveryTypeSnackbar:React.FC<DeliveryTypeProps> = ({
    snackbarOpen,
    handleSnackbarClose,
    snackbarMessage,

}) =>{
    return(

        <>
        <Snackbar
          open={snackbarOpen}
          autoHideDuration={6000}
          onClose={handleSnackbarClose}
        >
          <Alert
            onClose={handleSnackbarClose}
            severity="info" // Use info as base
            sx={{
              width: "100%",
              backgroundColor: (theme) => theme.palette.primary.main,
              color: "#ffffff",
              "& .MuiAlert-icon": {
                color: "#ffffff", // Make icon white to match
              },
            }}
          >
            {snackbarMessage}
          </Alert>
        </Snackbar></>

    );

};
export default DeliveryTypeSnackbar;
