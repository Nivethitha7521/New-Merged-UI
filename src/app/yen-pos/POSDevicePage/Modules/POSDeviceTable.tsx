

// import React from 'react';
// import {
//   Box,
//   Dialog,
//   DialogTitle,
//   DialogContent,
//   DialogActions,
//   Typography,
//   Pagination,
// } from '@mui/material';
// import {
//   Delete as DeleteIcon,
//   Edit as EditIcon,
//   Refresh as RefreshIcon,
//   Visibility as VisibilityIcon,
// } from '@mui/icons-material';
// import { Device } from '../Models/PosDeviceModel';
// import { RootState } from '@/redux/store';
// import { useSelector } from 'react-redux';

// interface POSDeviceTableProps {
//   displayedDevices: Device[];
//   showDeactivated: boolean;
//   handleEditDevice: (device: Device) => void;
//   handleDeactivate: (device: Device) => void;
//   handleActivate: (device: Device) => void;
//   page: number;          // ADD
//   totalPages: number;    // ADD
//   onPageChange: (value: number) => void;  // ADD
// }

// const POSDeviceTable: React.FC<POSDeviceTableProps> = ({
//   displayedDevices,
//   showDeactivated,
//   handleEditDevice,
//   handleDeactivate,
//   handleActivate,
//   page,           // ADD
//   totalPages,     // ADD
//   onPageChange,   // ADD
// }) => {
//   // const { devices, deactivatedDevices } = useSelector((state: RootState) => state.posDevice);
//   // const displayedDevice = showDeactivated ? deactivatedDevices : devices;

//   // Use the prop directly:
//   const displayedDevice = displayedDevices;

//   // ---- Dialog state for full description ----
//   const [openDescDialog, setOpenDescDialog] = React.useState(false);
//   const [selectedDescription, setSelectedDescription] = React.useState<string>('');

//   const handleOpenDescription = (description: string) => {
//     setSelectedDescription(description || 'No description');
//     setOpenDescDialog(true);
//   };

//   const handleCloseDescription = () => {
//     setOpenDescDialog(false);
//     setSelectedDescription('');
//   };

//   return (
//     <Box >

//       <div className="table-container my-1" style={{ maxHeight: 'calc(95.9vh - 170px)' }}>
//         <table className="custom-table">
//           <thead>
//             <tr>
//               <th>S.No</th>
//               <th>Till ID</th>
//               <th>Device Name</th>
//               <th>Device Original Name</th>
//               <th>Branch Name</th>
//               <th>Alias Name</th>
//               <th>Device Code</th>
//               <th>DC Status</th>
//               <th>IS-SERVER</th>
//               <th>Description</th>
//               <th>Actions</th>
//             </tr>
//           </thead>
//           <tbody>
//             {displayedDevice.length > 0 ? (
//               displayedDevice.map((device, index) => (
//                 <tr key={device.id || index}>
//                   <td style={{ textAlign: 'center' }}>{(page - 1) * 15 + index + 1}</td>
//                   <td style={{ textAlign: 'center' }}>{device.tillId}</td>
//                   <td style={{ textAlign: 'center' }}>{device.deviceName}</td>
//                   <td style={{ textAlign: 'center' }}>{device.companyName}</td>
//                   <td style={{ textAlign: 'center' }}>{device.branchName}</td>
//                   <td style={{ textAlign: 'center' }}>{device.aliasName}</td>
//                   <td style={{ textAlign: 'center' }}>{device.deviceCode}</td>
//                   <td style={{ textAlign: 'center' }}>{device.dcStatus}</td>
//                   <td style={{ textAlign: 'center' }}>
//                     <span style={{
//                       fontSize: '11px',
//                       fontWeight: 600,
//                       fontFamily: "'Poppins', sans-serif",
//                       padding: '2px 10px',
//                       borderRadius: '12px',
//                       backgroundColor: device.isServer ? '#e8f5e9' : '#fce4ec',
//                       color: device.isServer ? '#2e7d32' : '#c62828',
//                     }}>
//                       {device.isServer ? 'Yes' : 'No'}
//                     </span>
//                   </td>

//                   {/* Description cell with View icon */}
//                   <td style={{ textAlign: 'center' }}>
//                     <Box display="flex" alignItems="center" justifyContent="center" gap={1}>
//                       <Typography
//                         variant="body2"
//                         noWrap
//                         sx={{
//                           maxWidth: 50,
//                           overflow: 'hidden',
//                           textOverflow: 'ellipsis',
//                           fontFamily: '"Poppins", sans-serif'
//                         }}
//                       >
//                         {device.description || '-'}
//                       </Typography>
//                       <button
//                         onClick={() => handleOpenDescription(device.description || '')}
//                         title="View full description"
//                         className='edit-btn'
//                       >
//                         <VisibilityIcon fontSize="small" />
//                       </button>
//                     </Box>
//                   </td>

//                   {/* Actions */}
//                   <td style={{ textAlign: 'center' }}>
//                     {!showDeactivated && (
//                       <button
//                         color="primary"
//                         onClick={() => handleEditDevice(device)}
//                         className='edit-btn'
//                         title='Edit'
//                       >
//                         <EditIcon />
//                       </button>
//                     )}

//                     {!showDeactivated ? (
//                       <button
//                         color="primary"
//                         onClick={() => handleDeactivate(device)}
//                         className='deactivate-btn'
//                         title="deactivate"
//                       >
//                         <DeleteIcon />
//                       </button>
//                     ) : (
//                       <button
//                         color="primary"
//                         onClick={() => handleActivate(device)}
//                         className='activate-btn'
//                         title="activate"
//                       >
//                         <RefreshIcon />
//                       </button>
//                     )}
//                   </td>
//                 </tr>
//               ))
//             ) : (
//               <tr>
//                 <td colSpan={9} className="empty-state">
//                   <h2>No devices found</h2>
//                 </td>
//               </tr>
//             )}
//           </tbody>
//         </table>
//       </div>


//       {totalPages > 1 && (
//         <Box display="flex" justifyContent="center" mt={0.5}>
//           <Pagination
//             count={totalPages}
//             page={page}
//             color="primary"
//             onChange={(_, value) => onPageChange(value)}
//           />
//         </Box>
//       )}

//       {/* ---------- Full Description Dialog ---------- */}
//       <Dialog
//         open={openDescDialog}
//         onClose={handleCloseDescription}
//         maxWidth="sm"
//         fullWidth
//         PaperProps={{
//           className: "dialog-paper-medium",
//         }}>
//         <DialogTitle className='dialog-title'>Description</DialogTitle>
//         <DialogContent dividers className='dialog-content'>
//           <Typography variant="body1" style={{ whiteSpace: 'pre-line' }}>
//             {selectedDescription}
//           </Typography>
//         </DialogContent>
//         <DialogActions className='dialog-actions'>
//           <button onClick={handleCloseDescription} color="primary" className='btn-secondary'>
//             Close
//           </button>
//         </DialogActions>
//       </Dialog>
//     </Box>
//   );
// };

// export default POSDeviceTable;































import React from 'react';
import {
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Pagination,
} from '@mui/material';
import {
  Delete as DeleteIcon,
  Edit as EditIcon,
  Refresh as RefreshIcon,
  Visibility as VisibilityIcon,
} from '@mui/icons-material';
import { Device } from '../Models/PosDeviceModel';
import { RootState } from '@/redux/store';
import { useSelector } from 'react-redux';

interface POSDeviceTableProps {
  displayedDevices: Device[];
  showDeactivated: boolean;
  handleEditDevice: (device: Device) => void;
  handleDeactivate: (device: Device) => void;
  handleActivate: (device: Device) => void;
  page: number;
  totalPages: number;
  onPageChange: (value: number) => void;
  handleToggleDcStatus: (device: Device) => void; // ADD: called when user confirms status change
}

const POSDeviceTable: React.FC<POSDeviceTableProps> = ({
  displayedDevices,
  showDeactivated,
  handleEditDevice,
  handleDeactivate,
  handleActivate,
  page,
  totalPages,
  onPageChange,
  handleToggleDcStatus, // ADD
}) => {
  const displayedDevice = displayedDevices;

  // ---- Dialog state for full description ----
  const [openDescDialog, setOpenDescDialog] = React.useState(false);
  const [selectedDescription, setSelectedDescription] = React.useState<string>('');

  const handleOpenDescription = (description: string) => {
    setSelectedDescription(description || 'No description');
    setOpenDescDialog(true);
  };

  const handleCloseDescription = () => {
    setOpenDescDialog(false);
    setSelectedDescription('');
  };

  // ---- Dialog state for DC Status change confirmation ----
  const [openStatusDialog, setOpenStatusDialog] = React.useState(false);
  const [selectedDevice, setSelectedDevice] = React.useState<Device | null>(null);

  const isActiveStatus = (status: string) =>
    String(status).toLowerCase() === 'active';

  const handleOpenStatusDialog = (device: Device) => {
    setSelectedDevice(device);
    setOpenStatusDialog(true);
  };

  const handleCloseStatusDialog = () => {
    setOpenStatusDialog(false);
    setSelectedDevice(null);
  };

  const handleConfirmStatusChange = () => {
    if (selectedDevice) {
      handleToggleDcStatus(selectedDevice);
    }
    handleCloseStatusDialog();
  };

  return (
    <Box>

      <div className="table-container my-1" style={{ maxHeight: 'calc(95.9vh - 170px)' }}>
        <table className="custom-table">
          <thead>
            <tr>
              <th>S.No</th>
              <th>Till ID</th>
              <th>Device Name</th>
              <th>Device Original Name</th>
              <th>Branch Name</th>
              <th>Alias Name</th>
              <th>Device Code</th>
              <th>DC Status</th>
              <th>IS-SERVER</th>
              <th>Description</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {displayedDevice.length > 0 ? (
              displayedDevice.map((device, index) => (
                <tr key={device.id || index}>
                  <td style={{ textAlign: 'center' }}>{(page - 1) * 15 + index + 1}</td>
                  <td style={{ textAlign: 'center' }}>{device.tillId}</td>
                  <td style={{ textAlign: 'center' }}>{device.deviceName}</td>
                  <td style={{ textAlign: 'center' }}>{device.companyName}</td>
                  <td style={{ textAlign: 'center' }}>{device.branchName}</td>
                  <td style={{ textAlign: 'center' }}>{device.aliasName}</td>
                  <td style={{ textAlign: 'center' }}>{device.deviceCode}</td>

                  {/* DC Status as clickable badge */}
                  <td style={{ textAlign: 'center' }}>
                    <span
                      onClick={() => handleOpenStatusDialog(device)}
                      title="Click to change status"
                      style={{
                        cursor: 'pointer',
                        fontSize: '11px',
                        fontWeight: 600,
                        fontFamily: "'Poppins', sans-serif",
                        padding: '2px 10px',
                        borderRadius: '12px',
                        backgroundColor: isActiveStatus(device.dcStatus) ? '#e8f5e9' : '#fce4ec',
                        color: isActiveStatus(device.dcStatus) ? '#2e7d32' : '#c62828',
                      }}
                    >
                      {device.dcStatus}
                    </span>
                  </td>

                  <td style={{ textAlign: 'center' }}>
                    <span style={{
                      fontSize: '11px',
                      fontWeight: 600,
                      fontFamily: "'Poppins', sans-serif",
                      padding: '2px 10px',
                      borderRadius: '12px',
                      backgroundColor: device.isServer ? '#e8f5e9' : '#fce4ec',
                      color: device.isServer ? '#2e7d32' : '#c62828',
                    }}>
                      {device.isServer ? 'Yes' : 'No'}
                    </span>
                  </td>

                  {/* Description cell with View icon */}
                  <td style={{ textAlign: 'center' }}>
                    <Box display="flex" alignItems="center" justifyContent="center" gap={1}>
                      <Typography
                        variant="body2"
                        noWrap
                        sx={{
                          maxWidth: 50,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          fontFamily: '"Poppins", sans-serif'
                        }}
                      >
                        {device.description || '-'}
                      </Typography>
                      <button
                        onClick={() => handleOpenDescription(device.description || '')}
                        title="View full description"
                        className='edit-btn'
                      >
                        <VisibilityIcon fontSize="small" />
                      </button>
                    </Box>
                  </td>

                  {/* Actions */}
                  <td style={{ textAlign: 'center' }}>
                    {!showDeactivated && (
                      <button
                        color="primary"
                        onClick={() => handleEditDevice(device)}
                        className='edit-btn'
                        title='Edit'
                      >
                        <EditIcon />
                      </button>
                    )}

                    {!showDeactivated ? (
                      <button
                        color="primary"
                        onClick={() => handleDeactivate(device)}
                        className='deactivate-btn'
                        title="deactivate"
                      >
                        <DeleteIcon />
                      </button>
                    ) : (
                      <button
                        color="primary"
                        onClick={() => handleActivate(device)}
                        className='activate-btn'
                        title="activate"
                      >
                        <RefreshIcon />
                      </button>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={11} className="empty-state">
                  <h2>No devices found</h2>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>


      {totalPages > 1 && (
        <Box display="flex" justifyContent="center" mt={0.5}>
          <Pagination
            count={totalPages}
            page={page}
            color="primary"
            onChange={(_, value) => onPageChange(value)}
          />
        </Box>
      )}

      {/* ---------- Full Description Dialog ---------- */}
      <Dialog
        open={openDescDialog}
        onClose={handleCloseDescription}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          className: "dialog-paper-medium",
        }}>
        <DialogTitle className='dialog-title'>Description</DialogTitle>
        <DialogContent dividers className='dialog-content'>
          <Typography variant="body1" style={{ whiteSpace: 'pre-line' }}>
            {selectedDescription}
          </Typography>
        </DialogContent>
        <DialogActions className='dialog-actions'>
          <button onClick={handleCloseDescription} color="primary" className='btn-secondary'>
            Close
          </button>
        </DialogActions>
      </Dialog>

      {/* ---------- DC Status Change Confirmation Dialog ---------- */}
      <Dialog
        open={openStatusDialog}
        onClose={handleCloseStatusDialog}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          className: "dialog-paper-medium",
        }}>
        <DialogTitle className='dialog-title'>Confirm Status Change</DialogTitle>
        <DialogContent dividers className='dialog-content'>
          <Typography variant="body1">
            {selectedDevice && (
              isActiveStatus(selectedDevice.dcStatus)
                ? `Are you sure you want to change the status of "${selectedDevice.deviceName}" to Inactive?`
                : `Are you sure you want to change the status of "${selectedDevice.deviceName}" to Active?`
            )}
          </Typography>
        </DialogContent>
        <DialogActions className='dialog-actions'>
          <button onClick={handleCloseStatusDialog} className='btn-secondary'>
            Cancel
          </button>
          <button onClick={handleConfirmStatusChange} className='btn-primary'>
            Confirm
          </button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default POSDeviceTable;