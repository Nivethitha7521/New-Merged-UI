


// "use client";
// import React, { useEffect, useRef } from "react";
// import {
//   Box,
//   Card,
//   IconButton,
//   Radio,
//   TextField,
//   Typography,
// } from "@mui/material";
// import { Close, Edit, Save } from "@mui/icons-material";
// import {
//   DeliveryOrderItem,
//   Config,
// } from "../Features/deliveryorderslice";

// interface EditData {
//   noOfChangeableDate: string;
//   configures: Config[];
// }

// interface DeliveryOrderProps {
//   order: DeliveryOrderItem;
//   isActive: boolean;
//   enabledOrderId: string | null;
//   onRadioChange: (id: string) => void;
//   selectedConfigId: string | null;
//   onEditClick: (config: Config) => void;
//   onEditChange: (
//     field: string
//   ) => (
//     event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
//   ) => void;
//   editData: EditData;
//   onEditSubmit: () => void;
//   onEditCancel: () => void;
// }

// const DeliveryOrderCard: React.FC<DeliveryOrderProps> = ({
//   order,
//   enabledOrderId,
//   onRadioChange,
//   selectedConfigId,
//   onEditClick,
//   onEditChange,
//   editData,
//   onEditSubmit,
//   onEditCancel,
// }) => {
//   const inputRef = useRef<HTMLInputElement>(null);

//   useEffect(() => {
//     if (selectedConfigId && inputRef.current) {
//       // Focus the input when entering edit mode
//       inputRef.current.focus();
//       // Select all text in the input
//       inputRef.current.select();
//     }
//   }, [selectedConfigId]); // Run this effect whenever selectedConfigId changes

//   const formatDate = (date: string) =>
//     new Date(date).toLocaleDateString("en-US", {
//       year: "numeric",
//       month: "numeric",
//       day: "numeric",
//     });

//   return (
//     <Box
//       display="flex"
//       justifyContent="start"
//       mb={-1}
//       width="92%"
//       marginLeft="30px"
//     >
//       <Box
//         display="flex"
//         alignItems="center"
//         gap={0}
//         width="100%"
//       >
//         {/* Radio Button */}
//         <Box>
//           <Radio
//             checked={order.deliveryOrderId === enabledOrderId}
//             onChange={() => onRadioChange(order.deliveryOrderId)}
//             color="primary"
//             sx={{
//               "& .MuiSvgIcon-root": { fontSize: 40 },
//               p: 0,
//             }}
//           />
//         </Box>

//         {/* Delivery Order Card */}
//         <Card
//           sx={{
//             border:
//               order.deliveryOrderId === enabledOrderId
//                 ? "2px solid #1976d2"
//                 : "1px solid #ccc",
//             boxShadow: 2,
//             width: "100%",
//             px: 2,
//             py: 0.7,
//             overflowX: "auto",
//           }}
//         >
//           <Box display="flex" alignItems="center" flexWrap="nowrap" gap={0}>
//             {/* Config Fields */}
//             {order.configures.map((cfg) => (
//               <Box
//                 key={cfg.configId}
//                 display="flex"
//                 alignItems="center"
//                 gap={0.5}
//                 minWidth={200}
//               >
//                 <Typography fontWeight={600} fontSize="0.5rem" padding='5px'>
//                   {cfg.configName}
//                 </Typography>

//                 <Typography fontSize="0.8rem" fontWeight={500}>
//                   Days:
//                 </Typography>

//                 <TextField
//                   size="small"
//                   value={
//                     selectedConfigId === cfg.configId
//                       ? editData.noOfChangeableDate
//                       : cfg.noOfChangeableDate
//                   }
//                   onChange={onEditChange("noOfChangeableDate")}
//                   sx={{ width: 20 }}
//                   InputProps={{
//                     readOnly:
//                       selectedConfigId !== cfg.configId ||
//                       order.status !== "enabled",
//                     inputRef: selectedConfigId === cfg.configId ? inputRef : null,
//                   }}
//                 />

//                 {/* Edit Buttons */}
//                 {cfg.noOfChangeableDate !== 0 && (
//                   <>
//                     {selectedConfigId === cfg.configId ? (
//                       <>
//                         <IconButton
//                           onClick={onEditSubmit}
//                           size="small"
//                           color="primary"
//                         >
//                           <Save fontSize="small" />
//                         </IconButton>
//                         <IconButton
//                           onClick={onEditCancel}
//                           size="small"
//                           color="error"
//                         >
//                           <Close fontSize="small" />
//                         </IconButton>
//                       </>
//                     ) : (
//                       <IconButton
//                         onClick={() => onEditClick(cfg)}
//                         size="small"
//                         color="primary"
//                         disabled={order.status !== "enabled"}
//                       >
//                         <Edit fontSize="small" />
//                       </IconButton>
//                     )}
//                   </>
//                 )}
//               </Box>
//             ))}

//             {/* Spacer */}
//             <Box flexGrow={5} />

//             {/* Description */}
//             <Box minWidth={280}>
//               <Typography sx={{ fontSize: "0.75rem" }}>
//                 <strong>Description:</strong>{" "}
//                 {order.configures.every((cfg) => cfg.noOfChangeableDate === 0)
//                   ? "Delivery date cannot be changed."
//                   : "Delivery date can be changed based on configuration."}
//               </Typography>
//             </Box>

//             {/* Created & Updated Dates */}
//             <Box minWidth={160} display="flex" flexDirection="column" gap={0.5}>
//               <Typography sx={{ fontSize: "0.7rem" }}>
//                 <strong>Created:</strong> {formatDate(order.createdDate)}
//               </Typography>
//               <Typography sx={{ fontSize: "0.7rem" }}>
//                 <strong>Updated:</strong> {formatDate(order.updatedDate)}
//               </Typography>
//             </Box>
//           </Box>
//         </Card>
//       </Box>
//     </Box>
//   );
// };

// export default DeliveryOrderCard;




















"use client";
import React, { useEffect, useRef } from "react";
import {
  Box,
  Card,
  IconButton,
  Radio,
  TextField,
  Typography,
} from "@mui/material";
 import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import SaveOutlinedIcon from "@mui/icons-material/SaveOutlined";
import {
  DeliveryOrderItem,
  Config,
} from "../Features/deliveryorderslice";

interface EditData {
  noOfChangeableDate: string;
  configures: Config[];
}

interface DeliveryOrderProps {
  order: DeliveryOrderItem;
  isActive: boolean;
  enabledOrderId: string | null;
  onRadioChange: (id: string) => void;
  selectedConfigId: string | null;
  onEditClick: (config: Config) => void;
  onEditChange: (
    field: string
  ) => (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => void;
  editData: EditData;
  onEditSubmit: () => void;
  onEditCancel: () => void;
}

const DeliveryOrderCard: React.FC<DeliveryOrderProps> = ({
  order,
  enabledOrderId,
  onRadioChange,
  selectedConfigId,
  onEditClick,
  onEditChange,
  editData,
  onEditSubmit,
  onEditCancel,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (selectedConfigId && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [selectedConfigId]);

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "numeric",
      day: "numeric",
    });

  return (
    <Box
      display="flex"
      justifyContent="start"
      mb={1}
      width="100%"
      marginLeft="0"
    >
      <Box display="flex" alignItems="center" gap={1} width="100%">
        {/* Radio Button */}
        <Box>
          <Radio
            checked={order.deliveryOrderId === enabledOrderId}
            onChange={() => onRadioChange(order.deliveryOrderId)}
            color="primary"
            sx={{
            "& .MuiSvgIcon-root": { fontSize: 14 },
              p: 0,
            }}
          />
        </Box>

        {/* Delivery Order Card */}
        <Card
          sx={{
            border:
              order.deliveryOrderId === enabledOrderId
                ? "2px solid #1976d2"
                : "1px solid #e5e7eb",
            boxShadow: "0 2px 4px 0 rgba(0, 0, 0, 0.05)",
            borderRadius: "0.375rem",
            width: "100%",
            px: 2,
            py: 1.2,
            overflowX: "auto",
            backgroundColor: "#ffffff",
            transition: "all 0.2s",
            "&:hover": {
              boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
            },
          }}
        >
          <Box display="flex" alignItems="center" flexWrap="nowrap" gap={2}>
            {/* Config Fields */}
            {order.configures.map((cfg) => (
              <Box
                key={cfg.configId}
                display="flex"
                alignItems="center"
                gap={2}
                minWidth={220}
                sx={{
                  padding: "8px 12px",
                  backgroundColor: "#f9fafb",
                  borderRadius: "0.375rem",
                  border: "1px solid #e5e7eb",
                }}
              >
                <Typography
                  sx={{
                    fontWeight: 600,
                    fontSize: "0.813rem",
                    color: "#374151",
                    fontFamily: '"Source sans 3", sans-serif',
                  }}
                >
                  {cfg.configName}
                </Typography>

                <Typography
                  sx={{
                    fontSize: "0.75rem",
                    fontWeight: 500,
                    color: "#6b7280",
                    fontFamily: '"Source sans 3", sans-serif',
                  }}
                >
                  Days:
                </Typography>

                <TextField
                  size="small"
                  value={
                    selectedConfigId === cfg.configId
                      ? editData.noOfChangeableDate
                      : cfg.noOfChangeableDate
                  }
                  onChange={onEditChange("noOfChangeableDate")}
                  sx={{
                    width: 60,
                    "& .MuiOutlinedInput-root": {
                      fontSize: "0.813rem",
                      fontFamily: '"Source sans 3", sans-serif',
                      backgroundColor: "#ffffff",
                      borderRadius: "0.375rem",
                      "& fieldset": {
                        borderColor: "#d1d5db",
                      },
                      "&:hover fieldset": {
                        borderColor: "#9ca3af",
                      },
                      "&.Mui-focused fieldset": {
                        borderColor: "#1976d2",
                        borderWidth: "2px",
                      },
                    },
                    "& .MuiOutlinedInput-input": {
                      padding: "6px 10px",
                      textAlign: "center",
                    },
                  }}
                  InputProps={{
                    readOnly:
                      selectedConfigId !== cfg.configId ||
                      order.status !== "enabled",
                    inputRef: selectedConfigId === cfg.configId ? inputRef : null,
                  }}
                />

                {/* Edit Buttons */}
                {cfg.noOfChangeableDate !== 0 && (
                  <>
                    {selectedConfigId === cfg.configId ? (
                      <>
                        <IconButton
                          onClick={onEditSubmit}
                          size="small"
                         className="purchase-master-action-button is-edit"
                          title="Save"
                        >
                          <SaveOutlinedIcon />
                        </IconButton>
                        <IconButton
                          onClick={onEditCancel}
                          size="small"
                         className="purchase-master-action-button is-delete"
                          title="Cancel"
                        >
                        <CloseRoundedIcon />
                        </IconButton>
                      </>
                    ) : (
                      <IconButton
                        onClick={() => onEditClick(cfg)}
                        size="small"
                        disabled={order.status !== "enabled"}
                        className="purchase-master-action-button is-edit"
                        title="Edit"
                      >
                      <EditOutlinedIcon />
                      </IconButton>
                    )}
                  </>
                )}
              </Box>
            ))}

            {/* Spacer */}
            <Box flexGrow={1} />

            {/* Description */}
            <Box
              minWidth={280}
              sx={{
                padding: "8px 12px",
                backgroundColor: "#f9fafb",
                borderRadius: "0.375rem",
                border: "1px solid #e5e7eb",
              }}
            >
              <Typography
                sx={{
                  fontSize: "0.75rem",
                  fontFamily: '"Source sans 3", sans-serif',
                  color: "#374151",
                }}
              >
                <strong style={{ fontWeight: 600 }}>Description:</strong>{" "}
                {order.configures.every((cfg) => cfg.noOfChangeableDate === 0)
                  ? "Delivery date cannot be changed."
                  : "Delivery date can be changed based on configuration."}
              </Typography>
            </Box>

            {/* Created & Updated Dates */}
            <Box
              minWidth={180}
              display="flex"
              flexDirection="column"
              gap={0.5}
              sx={{
                padding: "8px 12px",
                backgroundColor: "#f9fafb",
                borderRadius: "0.375rem",
                border: "1px solid #e5e7eb",
              }}
            >
              <Typography
                sx={{
                  fontSize: "0.7rem",
                  fontFamily: '"Source sans 3", sans-serif',
                  color: "#374151",
                }}
              >
                <strong style={{ fontWeight: 600 }}>Created:</strong>{" "}
                {formatDate(order.createdDate)}
              </Typography>
              <Typography
                sx={{
                  fontSize: "0.7rem",
                  fontFamily: '"Source sans 3", sans-serif',
                  color: "#374151",
                }}
              >
                <strong style={{ fontWeight: 600 }}>Updated:</strong>{" "}
                {formatDate(order.updatedDate)}
              </Typography>
            </Box>
          </Box>
        </Card>
      </Box>
    </Box>
  );
};

export default DeliveryOrderCard;