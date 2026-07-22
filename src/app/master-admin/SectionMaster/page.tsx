
'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Snackbar, debounce } from '@mui/material';
import { useAppDispatch, useAppSelector } from '../../../redux/store';
import {
  activateSection,
  addSection,
  deactivateSection,
  fetchSections,
  resetSectionsData,
  selectSections,
  setDialogOpen,
  setShowDeactivated,
  setSnackbarMessage,
  setSnackbarOpen,
  setSnackbarSeverity,
  setSectionsData,
  updateSection,
} from '../SectionMaster/Features/sectionsSlice';
import MasterAdminMenu from '../page';
import SectionsTable from './Modules/sectionsTable';
import SectionsDialog from './Modules/sectionsDialog';
import ActivateDeactivateConfirmationDialog from '@/app/Components/Dialogs/ActivateDeactivateConfirmationDialog';
import EditConfirmationDialog from '@/app/Components/Dialogs/EditConfirmationDialog';
import CloseConfirmationDialog from '@/app/Components/Dialogs/CloseConfirmationDialog';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Sections {
  id: string;
  sectionsName: string;
  aliasName: string;
  status: string;
  sectionsId: string;
  address: string;
  createdDate: Date | null;
  lastUpdatedDate: Date | null;
  code: string;
  location: string;
  createdBy: string;
}

type ActionType = 'deactivate' | 'activate' | null;

interface ValidationErrors {
  sectionsName: string;
  aliasName: string;
  location: string;
  address: string;
  code: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const HAS_LETTER_RE = /[a-zA-Z]/;

const INITIAL_VALIDATION_ERRORS: ValidationErrors = {
  sectionsName: '',
  aliasName: '',
  location: '',
  address: '',
  code: '',
};

// ─── Component ────────────────────────────────────────────────────────────────

const SectionsPage: React.FC = () => {
  const dispatch = useAppDispatch();

  const {
    items: sections,
    sectionsData,
    snackbarOpen,
    snackbarMessage,
    snackbarSeverity,
    dialogOpen,
    showDeactivated,
    page,
  } = useAppSelector(selectSections);

  // ── Local state ───────────────────────────────────────────────────────────

  const [searchValue, setSearchValue] = useState('');
  const [confirmationDialogOpen, setConfirmationDialogOpen] = useState(false);
  const [editConfirmationDialogOpen, setEditConfirmationDialogOpen] = useState(false);
  const [closeConfirmationDialogOpen, setCloseConfirmationDialogOpen] = useState(false);

  const [selectedSection, setSelectedSection] = useState<Sections | null>(null);
  const [actionType, setActionType] = useState<ActionType>(null);

  const [unsavedChanges, setUnsavedChanges] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] =
    useState<ValidationErrors>(INITIAL_VALIDATION_ERRORS);

  // ── Debounced search ──────────────────────────────────────────────────────

  const debouncedFetch = useMemo(
    () =>
      debounce((value: string) => {
        dispatch(fetchSections({ search: value, page: 1 }));
      }, 600),
    [dispatch]
  );

  useEffect(() => {
    debouncedFetch(searchValue);
    return () => debouncedFetch.clear();
  }, [searchValue, debouncedFetch]);

  // ── Dialog helpers ────────────────────────────────────────────────────────

  const resetDialog = () => {
    dispatch(setDialogOpen('none'));
    dispatch(resetSectionsData());
    setValidationErrors(INITIAL_VALIDATION_ERRORS);
    setUnsavedChanges(false);
  };

  const handleOpen = () => {
    dispatch(resetSectionsData());
    setValidationErrors(INITIAL_VALIDATION_ERRORS);
    dispatch(setDialogOpen('add'));
  };

  const handleClose = () => {
    if (unsavedChanges) {
      setCloseConfirmationDialogOpen(true);
    } else {
      resetDialog();
    }
  };

  const handleConfirmClose = () => {
    resetDialog();
    setCloseConfirmationDialogOpen(false);
  };

  const handleCancelClose = () => setCloseConfirmationDialogOpen(false);

  // ── Field change ──────────────────────────────────────────────────────────

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    dispatch(setSectionsData({ ...sectionsData, [name]: value }));
    setValidationErrors((prev) => ({ ...prev, [name]: '' }));
    setUnsavedChanges(true);
  };

  // ── Validation ────────────────────────────────────────────────────────────

  const validateFields = (): boolean => {
    const errors = { ...INITIAL_VALIDATION_ERRORS };
    let isValid = true;

    if (!sectionsData.sectionsName.trim()) {
      errors.sectionsName = 'Section name is required';
      isValid = false;
    } else if (!HAS_LETTER_RE.test(sectionsData.sectionsName.trim())) {
      errors.sectionsName = 'Must contain at least one letter';
      isValid = false;
    }

    if (!sectionsData.aliasName.trim()) {
      errors.aliasName = 'Alias name is required';
      isValid = false;
    } else if (!HAS_LETTER_RE.test(sectionsData.aliasName.trim())) {
      errors.aliasName = 'Must contain at least one letter';
      isValid = false;
    }

    // Optional fields — validate only when filled
    if (sectionsData.code?.trim() && !HAS_LETTER_RE.test(sectionsData.code.trim())) {
      errors.code = 'Must contain at least one letter';
      isValid = false;
    }
    if (sectionsData.location?.trim() && !HAS_LETTER_RE.test(sectionsData.location.trim())) {
      errors.location = 'Must contain at least one letter';
      isValid = false;
    }
    if (sectionsData.address?.trim() && !HAS_LETTER_RE.test(sectionsData.address.trim())) {
      errors.address = 'Must contain at least one letter';
      isValid = false;
    }

    setValidationErrors(errors);
    return isValid;
  };

  // ── Submit ────────────────────────────────────────────────────────────────

  const handleSubmit = async () => {
    if (!validateFields()) return;

    const isDuplicate = sections.some(
      (item) =>
        item.sectionsName.toLowerCase() === sectionsData.sectionsName.toLowerCase() &&
        item.id !== sectionsData.id &&
        item.status === 'active'
    );

    if (isDuplicate) {
      dispatch(setSnackbarMessage('Section with this name already exists.'));
      dispatch(setSnackbarSeverity('error'));
      dispatch(setSnackbarOpen(true));
      return;
    }

    if (sectionsData.id) {
      setEditConfirmationDialogOpen(true);
      return;
    }

    try {
      setIsSubmitting(true);
      await dispatch(addSection({ ...sectionsData, status: sectionsData.status || 'active' })).unwrap();
      dispatch(setSnackbarMessage('Section created successfully!'));
      dispatch(setSnackbarSeverity('success'));
      await dispatch(fetchSections({ search: searchValue, page }));
      resetDialog();
    } catch (error: unknown) {
      dispatch(setSnackbarMessage(error instanceof Error ? error.message : 'An error occurred'));
      dispatch(setSnackbarSeverity('error'));
      dispatch(setSnackbarOpen(true));
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Edit confirmation ─────────────────────────────────────────────────────

  const handleEditConfirmation = async () => {
    try {
      setIsSubmitting(true);
      await dispatch(updateSection(sectionsData)).unwrap();
      dispatch(setSnackbarMessage('Section updated successfully!'));
      dispatch(setSnackbarSeverity('success'));
      await dispatch(fetchSections({ search: searchValue, page }));
      resetDialog();
    } catch (error: unknown) {
      dispatch(setSnackbarMessage(error instanceof Error ? error.message : 'An error occurred'));
      dispatch(setSnackbarSeverity('error'));
      dispatch(setSnackbarOpen(true));
    } finally {
      setIsSubmitting(false);
      setEditConfirmationDialogOpen(false);
    }
  };

  const handleEditConfirmationClose = () => setEditConfirmationDialogOpen(false);

  // ── Edit row ──────────────────────────────────────────────────────────────

  const handleEdit = (section: Sections) => {
    dispatch(setSectionsData(section));
    dispatch(setDialogOpen('edit'));
    setUnsavedChanges(false);
  };

  // ── Activate / Deactivate ─────────────────────────────────────────────────

  const handleDeactivate = (section: Sections) => {
    setSelectedSection(section);
    setActionType('deactivate');
    setConfirmationDialogOpen(true);
  };

  const handleActivate = (section: Sections) => {
    setSelectedSection(section);
    setActionType('activate');
    setConfirmationDialogOpen(true);
  };

  const handleConfirmationDialogClose = () => {
    setConfirmationDialogOpen(false);
    setSelectedSection(null);
    setActionType(null);
  };

  const handleConfirmationDialogConfirm = async () => {
    if (selectedSection && actionType) {
      try {
        if (actionType === 'deactivate') {
          await dispatch(deactivateSection(selectedSection.id!)).unwrap();
        } else {
          await dispatch(activateSection(selectedSection.id!)).unwrap();
        }
        dispatch(
          setSnackbarMessage(
            `Section ${actionType === 'deactivate' ? 'deactivated' : 'activated'}!`
          )
        );
        dispatch(setSnackbarSeverity('success'));
        await dispatch(fetchSections({ search: searchValue, page }));
      } catch (error: unknown) {
        dispatch(setSnackbarMessage(error instanceof Error ? error.message : 'An error occurred'));
        dispatch(setSnackbarSeverity('error'));
        dispatch(setSnackbarOpen(true));
      }
    }
    handleConfirmationDialogClose();
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <>
      <MasterAdminMenu />

      <SectionsTable
        handleEdit={handleEdit}
        handleDeactivate={handleDeactivate}
        handleActivate={handleActivate}
        handleOpen={handleOpen}
        showDeactivated={showDeactivated}
        setShowDeactivated={(value: boolean) => dispatch(setShowDeactivated(value))}
        searchValue={searchValue}
        setSearchValue={setSearchValue}
      />

      <SectionsDialog
        open={dialogOpen !== 'none'}
        handleClose={handleClose}
        handleSubmit={handleSubmit}
        sectionsData={sectionsData}
        handleChange={handleChange}
        validationErrors={validationErrors}
        mode={dialogOpen as 'add' | 'edit'}
        loading={isSubmitting}
      />

      <ActivateDeactivateConfirmationDialog
        open={confirmationDialogOpen}
        actionType={actionType}
        itemName={selectedSection?.sectionsName}
        onClose={handleConfirmationDialogClose}
        onConfirm={handleConfirmationDialogConfirm}
      />

      <EditConfirmationDialog
        open={editConfirmationDialogOpen}
        onClose={handleEditConfirmationClose}
        onConfirm={handleEditConfirmation}
      />

      <CloseConfirmationDialog
        open={closeConfirmationDialogOpen}
        onClose={handleCancelClose}
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
          severity={snackbarSeverity}
          sx={{ width: '100%', backgroundColor: '#1976d2', color: 'white' }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </>
  );
};

export default SectionsPage;