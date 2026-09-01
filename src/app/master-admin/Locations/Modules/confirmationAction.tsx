
// import React, { useState, useEffect } from "react";
// import {
//   Dialog,
//   DialogTitle,
//   DialogContent,
//   DialogContentText,
//   DialogActions,
//   Button,
//   CircularProgress
// } from "@mui/material";

// interface ConfirmationDialogProps {
//   open: boolean;
//   title?: string;
//   message: string;
//   onConfirm: () => Promise<void> | void;
//   onCancel: () => void;
//   confirmText?: string;
//   cancelText?: string;
// }

// const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({
//   open,
//   title = "Confirm Action",
//   message,
//   onConfirm,
//   onCancel,
//   confirmText = "Yes",
//   cancelText = "Cancel",
// }) => {
//   const [isLoading, setIsLoading] = useState(false);

//   // Reset loading state when dialog closes
//   useEffect(() => {
//     if (!open) {
//       setIsLoading(false);
//     }
//   }, [open]);

//   const handleConfirm = async () => {
//     if (isLoading) return; // Prevent double click
    
//     setIsLoading(true);
//     try {
//       // Check if onConfirm returns a promise
//       const result = onConfirm();
//       if (result && typeof result.then === 'function') {
//         await result;
//       }
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   const handleCancel = () => {
//     if (!isLoading) {
//       onCancel();
//     }
//   };

//   return (
//     <Dialog
//       open={open}
//       onClose={handleCancel}
//       PaperProps={{
//         className: "dialog-paper"
//       }}
//       aria-labelledby="confirmation-dialog-title"
//       aria-describedby="confirmation-dialog-description"
//     >
//       <DialogTitle
//         id="confirmation-dialog-title"
//         className="dialog-title"
//       >
//         {title}
//       </DialogTitle>

//       <DialogContent className="dialog-content">
//         <DialogContentText id="confirmation-dialog-description">
//           {message}
//         </DialogContentText>
//       </DialogContent>

//       <DialogActions className="dialog-actions">
//         <button
//           type="button"
//           onClick={handleCancel}
//           className="btn-secondary"
//           disabled={isLoading}
//         >
//           {cancelText}
//         </button>
//         <button
//           type="submit"
//           className="btn-primary"
//           onClick={handleConfirm}
//           disabled={isLoading}
//         >
//           {isLoading ? (
//             <>
//               <CircularProgress 
//                 size={16} 
//                 color="inherit" 
//                 sx={{ mr: 1 }} 
//               />
//               Processing...
//             </>
//           ) : (
//             confirmText
//           )}
//         </button>
//       </DialogActions>
//     </Dialog>
//   );
// };

// export default ConfirmationDialog;



















import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  CircularProgress
} from "@mui/material";

interface ConfirmationDialogProps {
  open: boolean;
  title?: string;
  message: string;
  branchName?: string;        // ✅ NEW: dynamic highlighted name
  onConfirm: () => Promise<void> | void;
  onCancel: () => void;
  confirmText?: string;
  cancelText?: string;
}

const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({
  open,
  title = "Confirm Action",
  message,
  branchName,
  onConfirm,
  onCancel,
  confirmText = "Yes",
  cancelText = "Cancel",
}) => {
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!open) {
      setIsLoading(false);
    }
  }, [open]);

  const handleConfirm = async () => {
    if (isLoading) return;
    setIsLoading(true);
    try {
      const result = onConfirm();
      if (result && typeof result.then === "function") {
        await result;
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    if (!isLoading) onCancel();
  };

  // ✅ Renders message with branchName bolded & colored if provided
  const renderMessage = () => {
    if (!branchName) return message;

    return (
      <>
        {message}{" "}
        <strong>&quot;{branchName}&quot;</strong>?
      </>
    );
  };

  return (
    <Dialog
      open={open}
      onClose={handleCancel}
      PaperProps={{ className: "dialog-paper" }}
      aria-labelledby="confirmation-dialog-title"
      aria-describedby="confirmation-dialog-description"
    >
      <DialogTitle id="confirmation-dialog-title" className="dialog-title">
        {title}
      </DialogTitle>

      <DialogContent className="dialog-content">
        <DialogContentText id="confirmation-dialog-description">
          {renderMessage()}
        </DialogContentText>
      </DialogContent>

      <DialogActions className="dialog-actions">
        <button
          type="button"
          onClick={handleCancel}
          className="btn-secondary"
          disabled={isLoading}
        >
          {cancelText}
        </button>
        <button
          type="submit"
          className="btn-primary"
          onClick={handleConfirm}
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <CircularProgress size={16} color="inherit" sx={{ mr: 1 }} />
              Processing...
            </>
          ) : (
            confirmText
          )}
        </button>
      </DialogActions>
    </Dialog>
  );
};

export default ConfirmationDialog;