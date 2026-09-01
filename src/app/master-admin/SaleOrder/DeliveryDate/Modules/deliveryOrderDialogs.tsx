
// "use client";
// import React, { useEffect, useRef } from "react";
// import {
//   Dialog,
//   DialogActions,
//   DialogContent,
//   DialogTitle,
//   Button,
//   Typography,
//   TextField,
//   Snackbar,
//   Alert,
// } from "@mui/material";
// import { DeliveryOrderItem } from "../Features/deliveryorderslice";


// interface DeliveryOrderDialogsProps {
//   editMode: boolean;
//   showUnsavedChangesDialog: boolean;
//   confirmSaveEdit: boolean;
//   editableOrder: DeliveryOrderItem | null;
//   errors: { [key: string]: string };
//   snackbarOpen: boolean;
//   snackbarMessage: string;
//   handleCancelEdit: () => void;
//   handleSaveEdit: () => void;
//   handleFieldChange: (
//     field: keyof DeliveryOrderItem,
//     value: string | number
//   ) => void;
//   confirmCancelEdit: () => void;
//   confirmSubmitEdit: () => void;
//   setSnackbarOpen: React.Dispatch<React.SetStateAction<boolean>>;
//   setSnackbarMessage: React.Dispatch<React.SetStateAction<string>>;
//   setConfirmSaveEdit: React.Dispatch<React.SetStateAction<boolean>>;
//   setShowUnsavedChangesDialog: React.Dispatch<React.SetStateAction<boolean>>;
// }

// const DeliveryOrderDialogs: React.FC<DeliveryOrderDialogsProps> = ({
//   editMode,
//   showUnsavedChangesDialog,
//   confirmSaveEdit,
//   editableOrder,
//   errors,
//   snackbarOpen,
//   snackbarMessage,
//   handleCancelEdit,
//   handleFieldChange,
//   confirmCancelEdit,
//   confirmSubmitEdit,
//   setSnackbarOpen,
//   setConfirmSaveEdit,
//   setShowUnsavedChangesDialog,
// }) => {

//   const inputRef=useRef<HTMLInputElement>(null);

// useEffect(() => {
//     if (editMode && inputRef.current) {
//       // Small delay to ensure dialog is fully rendered
//        setTimeout(() => {
//         if (inputRef.current) {
//           inputRef.current.focus();
//           // Select all text if in edit mode
//           if (editMode) {
//             inputRef.current.select();
//           }
//         }
//       }, 100);
//     }
//   }, [editMode]);

//   return (
//     <>
//       {/* Edit Dialog */}
//       <Dialog open={editMode} onClose={handleCancelEdit}>
//         <DialogTitle>Edit Delivery Order</DialogTitle>
//         <DialogContent>
//           <TextField
//             label="Config Name"
//             fullWidth
//             margin="dense"
//             required
//             error={!!errors.configName}
//             helperText={errors.configName}
//             value={editableOrder?.configName || ""}
//             onChange={(e) => handleFieldChange("configName", e.target.value)}
//             inputProps={{ maxLength: 50 }}
//           />
//           <TextField
//             label="No. of Dates"
//             fullWidth
//             margin="dense"
//             type="number"
//             required
//             error={!!errors.noOfDates}
//             helperText={errors.noOfDates}
//             value={editableOrder?.noOfDates || ""}
//             onChange={(e) =>
//               handleFieldChange("noOfDates", Number(e.target.value))
//             }
//             inputProps={{ min: 1, max: 365 }}
//           />
//         </DialogContent>
//         <DialogActions>
//           <Button onClick={handleCancelEdit}>Cancel</Button>
//           <Button onClick={() => setConfirmSaveEdit(true)} color="primary">
//             Save
//           </Button>
//         </DialogActions>
//       </Dialog>

//       {/* Save Confirmation Dialog */}
//       <Dialog
//         open={confirmSaveEdit}
//         onClose={() => setConfirmSaveEdit(false)}
//       >
//         <DialogTitle>Confirm Changes</DialogTitle>
//         <DialogContent>
//           <Typography>
//             Are you sure you want to save these changes?
//           </Typography>
//         </DialogContent>
//         <DialogActions>
//           <Button onClick={() => setConfirmSaveEdit(false)}>Cancel</Button>
//           <Button onClick={confirmSubmitEdit} color="primary">
//             Confirm Save
//           </Button>
//         </DialogActions>
//       </Dialog>

//       {/* Unsaved Changes Warning */}
//       <Dialog
//         open={showUnsavedChangesDialog}
//         onClose={() => setShowUnsavedChangesDialog(false)}
//       >
//         <DialogTitle>Unsaved Changes</DialogTitle>
//         <DialogContent>
//           <Typography>
//             You have unsaved changes. Are you sure you want to discard them?
//           </Typography>
//         </DialogContent>
//         <DialogActions>
//           <Button onClick={() => setShowUnsavedChangesDialog(false)}>
//             Keep Editing
//           </Button>
//           <Button onClick={confirmCancelEdit} color="primary">
//             Discard Changes
//           </Button>
//         </DialogActions>
//       </Dialog>

//       {/* Snackbar */}
//       <Snackbar
//         open={snackbarOpen}
//         autoHideDuration={3000}
//         onClose={() => setSnackbarOpen(false)}
//         anchorOrigin={{ vertical: "top", horizontal: "center" }}
//       >
//         <Alert
//           onClose={() => setSnackbarOpen(false)}
//           severity="success"
//           variant="filled"
//           sx={{ width: "100%" }}
//         >
//           {snackbarMessage}
//         </Alert>
//       </Snackbar>
//     </>
//   );
// };

// export default DeliveryOrderDialogs;

