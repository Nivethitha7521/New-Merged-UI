'use client';
import React, { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch } from '../../../redux/store';
import {
  fetchWhatsAppRoles,
  fetchWhatsappMessages,
  postWhatsappMessage,
  removeAdminFromMessage,
  selectWhatsappMessages,
  setSnackbarOpen,
} from '../WhatsappMaster/Features/whatsAppMessage';
import { WhatsApp, WhatsappMessage } from '../WhatsappMaster/Models/whatsappModels';
import {
  Box,
  Typography,
  Checkbox,
  CircularProgress,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TableContainer,
  Snackbar,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Tooltip,
  Fade,
  Backdrop,
  Paper,
  alpha,
  useTheme,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import RadioButtonUncheckedRoundedIcon from '@mui/icons-material/RadioButtonUncheckedRounded';
import WhatsAppMenu from '../page';

const WhatsAppMessagesPage: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const theme = useTheme();
  const { roles, messages, posting, snackbarOpen, snackbarMessage } =
    useSelector(selectWhatsappMessages);

  const [actionDialog, setActionDialog] = useState<{
    open: boolean;
    type: 'add' | 'remove';
    data: null | { row: WhatsappMessage; role: WhatsApp };
  }>({ open: false, type: 'add', data: null });

  useEffect(() => {
    dispatch(fetchWhatsAppRoles());
    dispatch(fetchWhatsappMessages());
  }, [dispatch]);

  const activeRoles = useMemo(
    () => roles.filter((r) => r.status === 'active'),
    [roles],
  );

  const groupedData = useMemo(() => {
    const groups: Record<string, WhatsappMessage[]> = {};
    messages.forEach((msg) => {
      if (!groups[msg.module]) groups[msg.module] = [];
      groups[msg.module].push(msg);
    });
    return groups;
  }, [messages]);

  const handleCheckboxClick = (
    row: WhatsappMessage,
    role: WhatsApp,
    willBeChecked: boolean,
  ) => {
    setActionDialog({ open: true, type: willBeChecked ? 'add' : 'remove', data: { row, role } });
  };

  const handleConfirmAction = async () => {
    if (!actionDialog.data) return;
    const { row, role } = actionDialog.data;
    try {
      if (actionDialog.type === 'add') {
        await dispatch(
          postWhatsappMessage({
            module: row.module,
            subModule: row.subModule,
            adminId: role.adminId,
            enable: true,
            status: 'active',
          }),
        ).unwrap();
      } else {
        await dispatch(
          removeAdminFromMessage({
            module: row.module,
            subModule: row.subModule,
            adminName: role.adminId,
          }),
        ).unwrap();
      }
      dispatch(fetchWhatsappMessages());
    } catch (err) {
      console.error(err);
    } finally {
      setActionDialog((prev) => ({ ...prev, open: false }));
    }
  };

  const isAdminAssigned = (row: WhatsappMessage, role: WhatsApp) => {
    if (!row.adminId) return false;
    const list = Array.isArray(row.adminId) ? row.adminId : [row.adminId];
    return list.includes(role.adminId);
  };

  const ROLE_COL_W = 160;
  const SUBMOD_COL_W = 220;
  const tableMinWidth = SUBMOD_COL_W + activeRoles.length * ROLE_COL_W;

  return (
    <Box
      sx={{
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      <WhatsAppMenu />

      <Box
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          px: { xs: 1, sm: 2, md: 2, lg: 3 },
          py: { xs: 2, sm: 3 },
          ml: 2,
        }}
      >
        {/* Loading Overlay */}
        <Backdrop
          open={posting}
          sx={{
            position: 'fixed',
            zIndex: (t) => t.zIndex.modal + 1,
            bgcolor: 'rgba(255,255,255,0.85)',
            backdropFilter: 'blur(4px)',
          }}
        >
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 2,
              p: 4,
              borderRadius: '12px',
              bgcolor: '#fff',
              border: '1px solid #E5E7EB',
              boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
            }}
          >
            <CircularProgress size={28} thickness={4.5} sx={{ color: '#374151' }} />
            <Typography
              variant="caption"
              fontWeight={600}
              sx={{ color: '#6B7280', letterSpacing: '1px', fontSize: '0.68rem', textTransform: 'uppercase' }}
            >
              Updating Permissions
            </Typography>
          </Box>
        </Backdrop>

        {/* Scrollable Accordions */}
        <Box
          sx={{
            flex: 1,
            overflow: 'auto',
            minHeight: 0,
            '&::-webkit-scrollbar': { width: 6 },
            '&::-webkit-scrollbar-track': { bgcolor: 'transparent' },
            '&::-webkit-scrollbar-thumb': {
              bgcolor: '#D1D5DB',
              borderRadius: 4,
              '&:hover': { bgcolor: '#9CA3AF' },
            },
          }}
        >
          {Object.entries(groupedData).map(([moduleName, subModules], idx) => (
            <Fade in timeout={300 + idx * 60} key={moduleName}>
              <Accordion
                defaultExpanded={idx === 0}
                elevation={0}
                sx={{
                  mb: 2.5,
                  border: '1px solid #E5E7EB',
                  borderRadius: '12px !important',
                  overflow: 'hidden',
                  bgcolor: '#fff',
                  '&:before': { display: 'none' },
                  transition: 'box-shadow 0.2s ease, border-color 0.2s ease',
                  '&:hover': {
                    borderColor: '#D1D5DB',
                    boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
                  },
                  '&.Mui-expanded': {
                    margin: '0 0 20px 0',
                    borderColor: '#D1D5DB',
                    boxShadow: '0 4px 16px rgba(0,0,0,0.07)',
                  },
                }}
              >
                {/* Accordion Header */}
                <AccordionSummary
                  expandIcon={<ExpandMoreIcon sx={{ color: '#9CA3AF', fontSize: 20 }} />}
                  sx={{
                    bgcolor: '#FAFAFA',
                    minHeight: 52,
                    '&.Mui-expanded': { minHeight: 52 },
                    px: 2.5,
                    borderBottom: '1px solid #F3F4F6',
                    '& .MuiAccordionSummary-content': { my: 0, alignItems: 'center', gap: 1.5 },
                  }}
                >
                  {/* Neutral dot */}
                  <Box
                    sx={{
                      width: 7,
                      height: 7,
                      borderRadius: '50%',
                      bgcolor: '#9CA3AF',
                      flexShrink: 0,
                    }}
                  />
                  <Typography
                    variant="subtitle2"
                    fontWeight={600}
                    sx={{ fontSize: '0.875rem', color: '#111827', letterSpacing: '0.1px' }}
                  >
                    {moduleName}
                  </Typography>
                 
                </AccordionSummary>

                <AccordionDetails sx={{ p: 0 }}>
                  <TableContainer
                    sx={{
                      overflow: 'auto',
                      maxHeight: '500px',
                      '&::-webkit-scrollbar': { width: 4, height: 4 },
                      '&::-webkit-scrollbar-thumb': {
                        borderRadius: 8,
                        bgcolor: '#E5E7EB',
                        '&:hover': { bgcolor: '#D1D5DB' },
                      },
                      '&::-webkit-scrollbar-track': { bgcolor: 'transparent' },
                    }}
                  >
                    <Table
                      size="small"
                      padding="none"
                      stickyHeader
                      sx={{
                        tableLayout: 'fixed',
                        minWidth: `${tableMinWidth}px`,
                        width: '100%',
                      }}
                    >
                      <TableHead>
                        <TableRow>
                    
                          <TableCell
                            sx={{
                              width: `${SUBMOD_COL_W}px`,
                              minWidth: `${SUBMOD_COL_W}px`,
                              p: '12px 20px',
                              bgcolor: '#FAFAFA',
                              borderBottom: '2px solid #E5E7EB',
                              borderRight: '1px solid #F3F4F6',
                              position: 'sticky',
                              left: 0,
                              top: 0,
                              zIndex: 10,
                            }}
                          >
                          
                          </TableCell>

                          {/* Role headers */}
                          {activeRoles.map((role) => (
                            <TableCell
                              key={role.adminId}
                              align="center"
                              sx={{
                                width: `${ROLE_COL_W}px`,
                                minWidth: `${ROLE_COL_W}px`,
                                p: '12px 8px',
                                bgcolor: '#FAFAFA',
                                borderBottom: '2px solid #E5E7EB',
                                borderLeft: '1px solid #F3F4F6',
                                position: 'sticky',
                                top: 0,
                                zIndex: 9,
                              }}
                            >
                              <Tooltip
                                title={`${role.whatsAppRollName} — ${role.mobileNumber}`}
                                arrow
                                placement="top"
                              >
                                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.4 }}>
                                  <Typography
                                    variant="caption"
                                    fontWeight={600}
                                    sx={{
                                      fontSize: '0.75rem',
                                      lineHeight: 1.3,
                                      maxWidth: ROLE_COL_W - 24,
                                      overflow: 'hidden',
                                      textOverflow: 'ellipsis',
                                      whiteSpace: 'nowrap',
                                      display: 'block',
                                      color: '#111827',
                                    }}
                                  >
                                    {role.whatsAppRollName}
                                  </Typography>
                                  <Typography
                                    variant="caption"
                                    sx={{ fontSize: '0.6rem', color: '#9CA3AF', lineHeight: 1, letterSpacing: '0.3px' }}
                                  >
                                    {role.mobileNumber}
                                  </Typography>
                                </Box>
                              </Tooltip>
                            </TableCell>
                          ))}
                        </TableRow>
                      </TableHead>

                      <TableBody>
                        {subModules.map((row, rowIdx) => (
                          <TableRow
                            key={row.whatsappMessageId}
                            sx={{
                              height: 46,
                              bgcolor: rowIdx % 2 === 0 ? '#fff' : '#FAFAFA',
                              '&:last-child td': { borderBottom: 0 },
                              transition: 'background-color 0.15s',
                              '&:hover': { bgcolor: '#F5F6F8' },
                            }}
                          >
                            {/* Sticky Sub-Module label */}
                            <TableCell
                              sx={{
                                width: `${SUBMOD_COL_W}px`,
                                minWidth: `${SUBMOD_COL_W}px`,
                                p: '0 20px',
                                borderRight: '1px solid #F3F4F6',
                                position: 'sticky',
                                left: 0,
                                zIndex: 5,
                                bgcolor: 'inherit',
                              }}
                            >
                              <Typography
                                variant="body2"
                                fontWeight={500}
                                sx={{
                                  fontSize: '0.82rem',
                                  color: '#374151',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap',
                                }}
                              >
                                {row.subModule}
                              </Typography>
                            </TableCell>

                            {/* Checkboxes */}
                            {activeRoles.map((role) => {
                              const assigned = isAdminAssigned(row, role);
                              return (
                                <TableCell
                                  key={`${row.whatsappMessageId}-${role.adminId}`}
                                  align="center"
                                  sx={{
                                    p: 0,
                                    borderLeft: '1px solid #F3F4F6',
                                    width: `${ROLE_COL_W}px`,
                                    minWidth: `${ROLE_COL_W}px`,
                                  }}
                                >
                                  <Tooltip
                                    title={assigned ? `Revoke ${role.whatsAppRollName}` : `Assign ${role.whatsAppRollName}`}
                                    arrow
                                    placement="top"
                                  >
                                    <Checkbox
                                      checked={assigned || false}
                                      onClick={() => handleCheckboxClick(row, role, !assigned)}
                                      icon={
                                        <RadioButtonUncheckedRoundedIcon
                                          sx={{ fontSize: 19, color: '#D1D5DB' }}
                                        />
                                      }
                                      checkedIcon={
                                        <CheckCircleRoundedIcon
                                          sx={{ fontSize: 19, color: '#111827' }}
                                        />
                                      }
                                      size="small"
                                      sx={{
                                        p: '9px',
                                        transition: 'transform 0.15s',
                                        '&:hover': {
                                          bgcolor: '#F3F4F6',
                                          transform: 'scale(1.12)',
                                        },
                                      }}
                                    />
                                  </Tooltip>
                                </TableCell>
                              );
                            })}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </AccordionDetails>
              </Accordion>
            </Fade>
          ))}

          {/* Empty State */}
          {Object.keys(groupedData).length === 0 && !posting && (
            <Fade in timeout={500}>
              <Paper
                elevation={0}
                sx={{
                  p: 10,
                  textAlign: 'center',
                  border: '1px dashed #E5E7EB',
                  borderRadius: 3,
                  bgcolor: '#fff',
                  maxWidth: 560,
                  mx: 'auto',
                }}
              >
                <Typography variant="h6" fontWeight={600} sx={{ mb: 1, color: '#374151', fontSize: '1rem' }}>
                  No Modules Found
                </Typography>
                <Typography variant="body2" sx={{ color: '#9CA3AF', lineHeight: 1.7, fontSize: '0.85rem' }}>
                  There are no modules configured for WhatsApp permissions yet. Please check back later or contact an administrator.
                </Typography>
              </Paper>
            </Fade>
          )}
        </Box>
      </Box>

      {/* Confirmation Dialog */}
      <Dialog
        open={actionDialog.open}
        onClose={() => setActionDialog((p) => ({ ...p, open: false }))}
        PaperProps={{
          elevation: 0,
          sx: {
            borderRadius: '14px',
            border: '1px solid #E5E7EB',
            maxWidth: 460,
            width: '100%',
            overflow: 'hidden',
          },
        }}
        TransitionComponent={Fade}
        transitionDuration={150}
      >
        <DialogTitle
          sx={{
            pt: 3,
            pb: 0.5,
            px: 3.5,
            fontWeight: 700,
            fontSize: '1rem',
            color: '#111827',
          }}
        >
          {actionDialog.type === 'add' ? 'Assign Permission' : 'Revoke Permission'}
        </DialogTitle>

        <DialogContent sx={{ pb: 2, px: 3.5, pt: 1.5 }}>
          <DialogContentText
            variant="body2"
            sx={{ color: '#6B7280', lineHeight: 1.9, fontSize: '0.88rem' }}
          >
            {actionDialog.type === 'add'
              ? 'Are you sure you want to grant access to'
              : 'Are you sure you want to remove access from'}
            {' '}
            <Box
              component="span"
              sx={{
                fontWeight: 600,
                color: '#111827',
                bgcolor: '#F3F4F6',
                px: 1,
                py: 0.3,
                borderRadius: 1,
                fontSize: '0.84rem',
              }}
            >
              {actionDialog.data?.role?.whatsAppRollName}
            </Box>
            {' '}for the sub-module{' '}
            <Box
              component="span"
              sx={{
                fontWeight: 600,
                color: '#111827',
                bgcolor: '#F3F4F6',
                px: 1,
                py: 0.3,
                borderRadius: 1,
                fontSize: '0.84rem',
              }}
            >
              {actionDialog.data?.row?.subModule}
            </Box>
            ?
          </DialogContentText>
        </DialogContent>

        <DialogActions sx={{ px: 3.5, pb: 3, pt: 1, gap: 1, justifyContent: 'flex-end' }}>
          <Button
            variant="outlined"
            onClick={() => setActionDialog((p) => ({ ...p, open: false }))}
            sx={{
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 600,
              px: 3,
              fontSize: '0.84rem',
              borderColor: '#E5E7EB',
              color: '#6B7280',
              '&:hover': { borderColor: '#D1D5DB', bgcolor: '#F9FAFB' },
            }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleConfirmAction}
            color={actionDialog.type === 'add' ? 'primary' : 'error'}
            disableElevation
            sx={{
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 600,
              px: 3.5,
              fontSize: '0.84rem',
            }}
          >
            {actionDialog.type === 'add' ? 'Confirm Assignment' : 'Confirm Removal'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={() => dispatch(setSnackbarOpen(false))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => dispatch(setSnackbarOpen(false))}
          severity="success"
          variant="filled"
          sx={{
            width: '100%',
            maxWidth: 420,
            borderRadius: '10px',
            fontWeight: 500,
            fontSize: '0.85rem',
            boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
            px: 3,
            py: 2,
          }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default WhatsAppMessagesPage;