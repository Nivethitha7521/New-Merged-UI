

"use client";
import React, {
  useEffect,
  useState,
  useRef,
  useCallback,
  useMemo,
} from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchAllCountry,
  fetchLocationsForDropdown,
} from "../Features/warehouseSlice";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  CircularProgress,
  FormControlLabel,
  Autocomplete,
  FormGroup,
  Typography,
  Radio,
  Tooltip,
} from "@mui/material";
import { Formik, Form, Field, FormikHelpers, FormikProps } from "formik";
import * as Yup from "yup";
import { WareHouse } from "../Models/warehouseModels";
import { AppDispatch, RootState } from "@/redux/store";
import ConfirmationDialog from "../Modules/confirmationaction";

// ─── Types ────────────────────────────────────────────────────────────────────

interface WareHouseDialogProps {
  open: boolean;
  onClose: () => void;
  handleSubmit: (values: WareHouse, helpers: FormikHelpers<WareHouse>) => void;
  formData: WareHouse;
  editMode: boolean;
  handleDiscardChanges: () => void;
}

// ─── Constants (module-level — never recreated) ───────────────────────────────

const INITIAL_LOCATION_FORM: WareHouse = {
  warehouseName: "",
  aliasName: "",
  status: "active",
  type: "",
  parentLocationId: "",
  subWarehouseName: "",
  address: "",
  country: "",
  state: "",
  city: "",
  postalCode: 0,
  phoneNumber: "",
  email: "",
  latitude: 0,
  longitude: 0,
  description: "",
  managerName: "",
  managerContact: "",
  openingHours: null,
  closingHours: null,
  createdDate: null,
  lastUpdatedDate: null,
  createdBy: "",
};

// ─── Regex constants (module-level — compiled once) ──────────────────────────

const RE_ALLOWED_CHARS = /^[a-zA-Z0-9\s\-.,()/]*$/;
const RE_HAS_LETTER = /[a-zA-Z]/;
const RE_EMAIL_LOCAL = /^[a-zA-Z0-9]+@/;
const RE_EMAIL_EXTENSION = /\.[a-zA-Z]{2,}$/;
const RE_DIGITS_ONLY = /^\d+$/;
const RE_STARTS_6_TO_9 = /^[6-9]/;
const RE_VALID_PASTE_PHONE = /^[6-9]\d{9}$/;

// ─── Yup schema (module-level — compiled once, not on every render) ───────────

const validationSchema = Yup.object().shape({
  warehouseName: Yup.string()
    .min(2, "At least 2 characters")
    .max(25, "Maximum 25 characters allowed")
    .matches(RE_ALLOWED_CHARS, "Only letters, numbers, spaces, - . , are allowed")
    .matches(RE_HAS_LETTER, "Must contain at least one letter")
    .required("Warehouse Name is required"),

  aliasName: Yup.string()
    .min(2, "At least 2 characters")
    .max(6, "Maximum 6 characters allowed")
    .matches(RE_ALLOWED_CHARS, "Only letters, numbers, spaces, - . , are allowed")
    .matches(RE_HAS_LETTER, "Must contain at least one letter")
    .required("Required"),

  type: Yup.string().required("Please select Main or Sub"),

  address: Yup.string()
    .max(100, "Maximum 100 characters allowed")
    .matches(RE_HAS_LETTER, "Must contain at least one letter")
    .required("Address is required"),

  phoneNumber: Yup.string()
    .matches(/^\d{10}$/, "Must be exactly 10 digits")
    .required("Required"),

  email: Yup.string()
    .required("Required")
    .matches(RE_EMAIL_LOCAL, "Only letters and numbers are allowed before @")
    .matches(RE_EMAIL_EXTENSION, "Must end with a valid extension (e.g. .com, .in, .co.in)")
    .email("Invalid email format"),

  state: Yup.string().when("country", {
    is: (country: string) => !!country,
    then: (schema) => schema.required("State is required"),
  }),
  city: Yup.string().when("state", {
    is: (state: string) => !!state,
    then: (schema) => schema.required("City is required"),
  }),

  parentLocationId: Yup.string().when("type", {
    is: "sub",
    then: (schema) => schema.required("Please select a parent warehouse"),
  }),

  // postalCode: Yup.number()
  //   .min(100000, "Postal Code must be at least 6 digits")
  //   .required("Postal Code is required"),

  latitude: Yup.number().required("Latitude is required"),
  longitude: Yup.number().required("Longitude is required"),

  managerName: Yup.string()
    .min(2, "Manager Name must be at least 2 characters")
    .max(25, "Maximum 25 characters allowed")
    .matches(RE_ALLOWED_CHARS, "Only letters, numbers, spaces, - . , are allowed")
    .matches(RE_HAS_LETTER, "Must contain at least one letter")
    .required("Manager Name is required"),

  managerContact: Yup.string()
    .matches(/^\d{10}$/, "Must be exactly 10 digits")
    .required("Required"),

  description: Yup.string()
    .max(50, "Maximum 50 characters allowed")
    .matches(RE_ALLOWED_CHARS, "Only letters, numbers, spaces, - . , are allowed")
    .test(
      "has-letter-if-filled",
      "Must contain at least one letter",
      (value) => !value || RE_HAS_LETTER.test(value)
    ),

  //   subWarehouseName: Yup.string().when("type", {
  //   is: "sub",
  //   then: (schema) =>
  //     schema
  //       .min(2, "At least 2 characters")
  //       .max(25, "Maximum 25 characters allowed")
  //       .matches(RE_ALLOWED_CHARS, "Only letters, numbers, spaces, - . , are allowed")
  //       .matches(RE_HAS_LETTER, "Must contain at least one letter")
  //       .required("Sub Warehouse Name is required"),
  // }),
});

// ─── Pure filter helpers (module-level) ──────────────────────────────────────

/** Strip characters not allowed in text fields. */
const filterTextChars = (value: string) =>
  value.replace(/[^a-zA-Z0-9\s\-.,]/g, "");

/** Strip characters not allowed in email field. */
const filterEmailChars = (value: string) =>
  value.replace(/[^a-zA-Z0-9@.]/g, "");

/** Phone-number change guard — returns the filtered value or null if blocked. */
const filterPhone = (value: string): string | null => {
  if (value === "") return "";
  if (!RE_DIGITS_ONLY.test(value)) return null;
  if (value.length === 1 && !RE_STARTS_6_TO_9.test(value)) return null;
  if (value.length > 10) return null;
  return value;
};

// ─── Component ───────────────────────────────────────────────────────────────

const WareHouseDialog: React.FC<WareHouseDialogProps> = ({
  open,
  onClose,
  handleSubmit,
  formData = INITIAL_LOCATION_FORM,
  editMode,
  handleDiscardChanges,
}) => {
  const dispatch = useDispatch<AppDispatch>();
  const { locationdropdown, loading: locationsLoading } = useSelector(
    (state: RootState) => state.warehouses
  );

  const formikRef = useRef<FormikProps<WareHouse>>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const [showDiscardDialog, setShowDiscardDialog] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [postalCodeLoading, setPostalCodeLoading] = useState(false);

  // ─── Fetch dropdown data when dialog opens ──────────────────────────────
  useEffect(() => {
    if (open) dispatch(fetchLocationsForDropdown());
  }, [open, dispatch]);

  // ─── Backfill parentLocationId for legacy records once dropdown is loaded ─
  useEffect(() => {
    if (!open) return;
    const values = formikRef.current?.values;
    if (
      values &&
      values.type === "sub" &&
      !values.parentLocationId &&
      values.subWarehouseName &&
      locationdropdown?.length
    ) {
      const matched = locationdropdown.find(
        (loc) => loc.branchName === values.subWarehouseName
      );
      if (matched) {
        formikRef.current?.setFieldValue("parentLocationId", matched.branchId);
      }
    }
  }, [open, locationdropdown, formData]);

  // ─── Auto-focus on open ─────────────────────────────────────────────────
  useEffect(() => {
    if (!open) return;
    const id = setTimeout(() => {
      inputRef.current?.focus();
      if (editMode) inputRef.current?.select();
    }, 100);
    return () => clearTimeout(id);
  }, [open, editMode]);

  // ─── Click-outside → discard prompt ────────────────────────────────────
  //     Stable reference: we read formData via a ref so the effect only
  //     registers/unregisters when `open` changes, not on every formData change.
  const formDataRef = useRef(formData);
  useEffect(() => { formDataRef.current = formData; }, [formData]);

  useEffect(() => {
    if (!open) return;

    const handleClickOutside = (e: MouseEvent) => {
      // The Dialog portal renders outside the component tree, so we check
      // whether the click landed inside the MUI Dialog Paper element.
      const paper = document.querySelector(".MuiDialog-paper");
      if (paper && !paper.contains(e.target as Node)) {
        const isDirty =
          JSON.stringify(formDataRef.current) !==
          JSON.stringify(INITIAL_LOCATION_FORM);
        if (isDirty) setShowDiscardDialog(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]); // stable — formData read via ref

  // ─── Dirty check (stable reference) ────────────────────────────────────
  const isFormDirty = useCallback(
    () =>
      JSON.stringify(formDataRef.current) !==
      JSON.stringify(INITIAL_LOCATION_FORM),
    [] // no deps — reads via ref
  );

  // ─── Postal code lookup with abort-controller for race-condition safety ─
  const abortRef = useRef<AbortController | null>(null);

  const handlePostalCodeChange = useCallback(
    async (
      postalCode: string,
      setFieldValue: (field: string, value: any) => void
    ) => {
      const numeric = Number(postalCode);
      if (postalCode.length !== 6 || isNaN(numeric)) return;

      // Cancel any in-flight request
      abortRef.current?.abort();
      abortRef.current = new AbortController();

      setPostalCodeLoading(true);
      try {
        const result = await dispatch(fetchAllCountry(numeric));
        // If aborted before dispatch resolved, bail out silently
        if (abortRef.current.signal.aborted) return;

        if (fetchAllCountry.fulfilled.match(result)) {
          const data = result.payload;
          if (
            data &&
            data[0]?.Status === "Success" &&
            data[0]?.PostOffice &&
            data[0].PostOffice.length > 0
          ) {
            const postOffice = data[0].PostOffice[0];
            setFieldValue("country", postOffice.Country || "");
            setFieldValue("state", postOffice.State || "");
            setFieldValue("city", postOffice.Name || "");
            setSearchError(null);
          } else {
            setSearchError("Invalid postal code or no data found.");
          }
        } else {
          setSearchError("Failed to fetch location details.");
        }
      } catch {
        if (!abortRef.current?.signal.aborted) {
          setSearchError("Unexpected error fetching location.");
        }
      } finally {
        if (!abortRef.current?.signal.aborted) setPostalCodeLoading(false);
      }
    },
    [dispatch]
  );

  // ─── Parent-location select (stable) ────────────────────────────────────
  const handleLocationSelect = useCallback(
    (location: any, setFieldValue: (field: string, value: any) => void) => {
      if (!location) return;
      setFieldValue("parentLocationId", location.branchId || "");
      setFieldValue("subWarehouseName", location.branchName || "");
      setFieldValue("address", location.address || "");
      setFieldValue("country", location.country || "");
      setFieldValue("state", location.state || "");
      setFieldValue("city", location.city || "");
      setFieldValue("postalCode", Number(location.postalCode) || 0);
      setFieldValue("latitude", Number(location.latitude) || 0);
      setFieldValue("longitude", Number(location.longitude) || 0);
    },
    []
  );

  // ─── Dialog close / discard ─────────────────────────────────────────────
  const handleCloseRequest = useCallback(() => {
    if (isFormDirty()) setShowDiscardDialog(true);
    else onClose();
  }, [isFormDirty, onClose]);

  const handleConfirmDiscard = useCallback(() => {
    setShowDiscardDialog(false);
    handleDiscardChanges();
    onClose();
  }, [handleDiscardChanges, onClose]);

  const handleCancelDiscard = useCallback(
    () => setShowDiscardDialog(false),
    []
  );

  // ─── Initial values (memoized — only recomputes when formData changes) ──
  const initialValues = useMemo<WareHouse>(
    () => {
      const source = formData || INITIAL_LOCATION_FORM;
      return {
        ...source,
        type: source.type || "main",
        parentLocationId: source.parentLocationId || "",
        country: source.country || "",
        state: source.state || "",
        city: source.city || "",
        postalCode: Number(source.postalCode) || 0,
        latitude: Number(source.latitude) || 0,
        longitude: Number(source.longitude) || 0,
        warehouseName: source.warehouseName || "",
        aliasName: source.aliasName || "",
        address: source.address || "",
        phoneNumber: source.phoneNumber || "",
        email: source.email || "",
        managerName: source.managerName || "",
        managerContact: source.managerContact || "",
        description: source.description || "",
        subWarehouseName: source.subWarehouseName || "",
      };
    },
    [formData]
  );

  // ─── Submission handler (stable) ────────────────────────────────────────
  const onSubmit = useCallback(
    (values: WareHouse, helpers: FormikHelpers<WareHouse>) => {
      handleSubmit(
        {
          ...values,
          postalCode: Number(values.postalCode) || 0,
          latitude: Number(values.latitude) || 0,
          longitude: Number(values.longitude) || 0,
        },
        helpers
      );
    },
    [handleSubmit]
  );

  // ─── Field error helper (inline — tiny, no allocation concern) ──────────
  const getError = (
    field: keyof WareHouse,
    { touched, errors }: FormikProps<WareHouse>
  ): string | undefined => {
    if (!touched[field] || !errors[field]) return undefined;
    return typeof errors[field] === "string"
      ? (errors[field] as string)
      : (errors[field] as string[]).join(", ");
  };

  // ─── TransitionProps: stable reference prevents re-creating on every render
  const onEntered = useCallback(() => {
    inputRef.current?.focus();
    if (editMode) inputRef.current?.select();
  }, [editMode]);

  // ─── Render ─────────────────────────────────────────────────────────────
  return (
    <>
      <Dialog
        open={open}
        onClose={handleCloseRequest}
        maxWidth="md"
        fullWidth
        PaperProps={{ className: "dialog-paper" }}
        TransitionProps={{ onEntered }}
      >
        <DialogTitle className="dialog-title">
          {editMode ? "Edit Warehouse" : "Add Warehouse"}
        </DialogTitle>

        <Formik
          innerRef={formikRef}
          initialValues={initialValues}
          enableReinitialize
          validationSchema={validationSchema}
          onSubmit={onSubmit}
        >
          {(fp) => (
            <Form>
              <DialogContent dividers className="dialog-content">

                {/* ── Section 1: Basic Info ── */}
                <div className="form-section">
                  <h3 className="form-section-title">1. Basic Info</h3>

                  {/* Warehouse Type */}
                  <div style={{ marginBottom: "1rem" }}>
                    <FormGroup row className="checkbox-group">
                      <FormControlLabel
                        control={
                          <Radio
                            checked={fp.values.type === "main"}
                            onChange={() => {
                              fp.setFieldValue("type", "main");
                              fp.setFieldValue("parentLocationId", "");
                            }}
                            size="small"
                            sx={{ "& .MuiSvgIcon-root": { fontSize: 32 }, transform: "scale(0.8)", padding: "8px" }}
                          />
                        }
                        label={<Typography variant="caption" fontWeight={500}>Main Warehouse</Typography>}
                        className="checkbox-label"
                      />
                      <FormControlLabel
                        control={
                          <Radio
                            checked={fp.values.type === "sub"}
                            onChange={() => fp.setFieldValue("type", "sub")}
                            size="small"
                            sx={{ "& .MuiSvgIcon-root": { fontSize: 32 }, transform: "scale(0.8)", padding: "8px" }}
                          />
                        }
                        label={<Typography variant="caption" fontWeight={500}>Sub Warehouse</Typography>}
                        className="checkbox-label"
                      />
                    </FormGroup>
                    {fp.touched.type && fp.errors.type && (
                      <div style={{ color: "rgb(220,38,38)", fontSize: "0.75rem", marginTop: "0.25rem", marginLeft: "0.5rem" }}>
                        {fp.errors.type}
                      </div>
                    )}
                  </div>

                  <div className="form-grid">
                    {/* Warehouse Name */}
                    <div className="form-field">
                      <TextField
                        name="warehouseName"
                        label="Warehouse Name *"
                        autoComplete="off"
                        fullWidth
                        size="small"
                        inputRef={inputRef}
                        inputProps={{ maxLength: 25 }}
                        value={fp.values.warehouseName}
                        onChange={(e) =>
                          fp.setFieldValue("warehouseName", filterTextChars(e.target.value))
                        }
                        onBlur={fp.handleBlur}
                        error={fp.touched.warehouseName && Boolean(fp.errors.warehouseName)}
                        helperText={getError("warehouseName", fp)}
                        className="custom-textfield"
                        InputLabelProps={{ className: "custom-label" }}
                        InputProps={{ className: "custom-input" }}
                      />
                    </div>

                    {/* Alias Name */}
                    <div className="form-field">
                      <TextField
                        name="aliasName"
                        label="Alias Name *"
                        autoComplete="off"
                        fullWidth
                        size="small"
                        inputProps={{ maxLength: 4 }}
                        value={fp.values.aliasName}
                        onChange={(e) =>
                          fp.setFieldValue("aliasName", filterTextChars(e.target.value))
                        }
                        onBlur={fp.handleBlur}
                        error={fp.touched.aliasName && Boolean(fp.errors.aliasName)}
                        helperText={getError("aliasName", fp)}
                        className="custom-textfield"
                        InputLabelProps={{ className: "custom-label" }}
                        InputProps={{ className: "custom-input" }}
                      />
                    </div>

                    {/* Phone Number */}
                    <div className="form-field">
                      <TextField
                        name="phoneNumber"
                        label="Phone Number *"
                        autoComplete="off"
                        fullWidth
                        size="small"
                        inputProps={{ maxLength: 10, inputMode: "numeric" }}
                        value={fp.values.phoneNumber || ""}
                        onChange={(e) => {
                          const filtered = filterPhone(e.target.value);
                          if (filtered !== null) fp.setFieldValue("phoneNumber", filtered);
                        }}
                        onPaste={(e) => {
                          const paste = e.clipboardData.getData("text");
                          if (!RE_VALID_PASTE_PHONE.test(paste)) e.preventDefault();
                        }}
                        onBlur={fp.handleBlur}
                        error={fp.touched.phoneNumber && Boolean(fp.errors.phoneNumber)}
                        helperText={getError("phoneNumber", fp)}
                        className="custom-textfield"
                        InputLabelProps={{ className: "custom-label" }}
                        InputProps={{ className: "custom-input" }}
                      />
                    </div>

                    {/* Email */}
                    <div className="form-field">
                      <TextField
                        name="email"
                        label="Email *"
                        autoComplete="off"
                        fullWidth
                        size="small"
                        inputProps={{ maxLength: 30 }}
                        value={fp.values.email}
                        onChange={(e) =>
                          fp.setFieldValue("email", filterEmailChars(e.target.value))
                        }
                        onBlur={fp.handleBlur}
                        error={fp.touched.email && Boolean(fp.errors.email)}
                        helperText={getError("email", fp)}
                        className="custom-textfield"
                        InputLabelProps={{ className: "custom-label" }}
                        InputProps={{ className: "custom-input" }}
                      />
                    </div>

                    {/* Parent Location (sub only) */}
                    {/* {fp.values.type === "sub" && (
                      <div className="form-field">
                        <Autocomplete
                          options={locationdropdown || []}
                          getOptionLabel={(option) => option.branchName || ""}
                          loading={locationsLoading}
                          value={
                            locationdropdown?.find(
                              (loc) => loc.branchId === fp.values.parentLocationId
                            ) || null
                          }
                          onChange={(_, value) =>
                            handleLocationSelect(value, fp.setFieldValue)
                          }
                          isOptionEqualToValue={(option, value) =>
                            option.branchId === value?.branchId
                          }
                          renderInput={(params) => (
                            <TextField
                              {...params}
                              label="Parent Warehouse"
                              size="small"
                              error={fp.touched.parentLocationId && Boolean(fp.errors.parentLocationId)}
                              helperText={getError("parentLocationId", fp)}
                              className="custom-textfield"
                              InputLabelProps={{ ...params.InputLabelProps, className: "custom-label" }}
                              InputProps={{
                                ...params.InputProps,
                                className: "custom-input",
                                endAdornment: (
                                  <>
                                    {locationsLoading && <CircularProgress color="inherit" size={20} />}
                                    {params.InputProps.endAdornment}
                                  </>
                                ),
                              }}
                            />
                          )}
                        />
                      </div>
                    )}
                     */}

                    {/* Sub Warehouse fields (sub only) */}
                    {fp.values.type === "sub" && (
                      <>

                        <div className="form-field">
                          <Autocomplete
                            options={locationdropdown || []}
                            getOptionLabel={(option) => option.branchName || ""}
                            loading={locationsLoading}
                            value={
                              locationdropdown?.find(
                                (loc) => loc.branchId === fp.values.parentLocationId
                              ) || null
                            }
                            onChange={(_, value) => {
                              {/* ← REPLACED */ }
                              if (value) {
                                handleLocationSelect(value, fp.setFieldValue);
                              } else {
                                fp.setFieldValue("parentLocationId", "");
                                fp.setFieldValue("subWarehouseName", "");
                              }
                            }}
                            isOptionEqualToValue={(option, value) =>
                              option.branchId === value?.branchId
                            }
                            renderInput={(params) => (
                              <TextField
                                {...params}
                                label="Parent Warehouse"
                                size="small"
                                error={fp.touched.parentLocationId && Boolean(fp.errors.parentLocationId)}
                                helperText={getError("parentLocationId", fp)}
                                className="custom-textfield"
                                InputLabelProps={{ ...params.InputLabelProps, className: "custom-label" }}
                                InputProps={{
                                  ...params.InputProps,
                                  className: "custom-input",
                                  endAdornment: (
                                    <>
                                      {locationsLoading && <CircularProgress color="inherit" size={20} />}
                                      {params.InputProps.endAdornment}
                                    </>
                                  ),
                                }}
                              />
                            )}
                          />
                        </div>
                      </>
                    )}


                  </div>
                </div>

                {/* ── Section 2: Location ── */}
                <div className="form-section">
                  <h3 className="form-section-title">2. Location</h3>
                  <div className="form-grid">

                    {/* Address */}
                    <div className="form-field form-field-span-2">
                      <Tooltip title={fp.values.address || ""} arrow placement="top">
                        <TextField
                          name="address"
                          label="Address *"
                          autoComplete="off"
                          fullWidth
                          size="small"
                          inputProps={{ maxLength: 100 }}
                          value={fp.values.address}
                          onChange={(e) => fp.setFieldValue("address", e.target.value)}
                          onBlur={fp.handleBlur}
                          error={fp.touched.address && Boolean(fp.errors.address)}
                          helperText={getError("address", fp)}
                          className="custom-textfield"
                          InputLabelProps={{ className: "custom-label" }}
                          InputProps={{ className: "custom-input" }}
                        />
                      </Tooltip>
                    </div>

                    {/* Postal Code */}
                    <div className="form-field">
                      <TextField
                        name="postalCode"
                        label="Postal Code"
                        autoComplete="off"
                        fullWidth
                        size="small"
                        type="text"
                        inputProps={{ maxLength: 6, inputMode: "numeric" }}
                        value={fp.values.postalCode || ""}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, "").slice(0, 6);
                          fp.setFieldValue("postalCode", value ? Number(value) : "");
                          if (value) handlePostalCodeChange(value, fp.setFieldValue);
                        }}
                        onKeyPress={(e: React.KeyboardEvent) => {
                          if (!/[0-9]/.test(e.key)) e.preventDefault();
                        }}
                        onPaste={(e: React.ClipboardEvent) => {
                          const paste = e.clipboardData.getData("text");
                          if (!/^\d*$/.test(paste)) e.preventDefault();
                        }}
                        error={fp.touched.postalCode && Boolean(fp.errors.postalCode)}
                        helperText={getError("postalCode", fp)}
                        className="custom-textfield"
                        InputLabelProps={{ className: "custom-label" }}
                        InputProps={{
                          className: "custom-input",
                          endAdornment: postalCodeLoading && (
                            <CircularProgress size={16} className="loading-spinner" />
                          ),
                        }}
                      />
                    </div>

                    {/* City */}
                    <div className="form-field">
                      <Field
                        as={TextField}
                        name="city"
                        label="City"
                        autoComplete="off"
                        fullWidth
                        size="small"
                        error={fp.touched.city && Boolean(fp.errors.city)}
                        helperText={getError("city", fp)}
                        className="custom-textfield"
                        InputLabelProps={{ className: "custom-label" }}
                        InputProps={{ className: "custom-input" }}
                      />
                    </div>

                    {/* State */}
                    <div className="form-field">
                      <Field
                        as={TextField}
                        name="state"
                        label="State"
                        autoComplete="off"
                        fullWidth
                        size="small"
                        error={fp.touched.state && Boolean(fp.errors.state)}
                        helperText={getError("state", fp)}
                        className="custom-textfield"
                        InputLabelProps={{ className: "custom-label" }}
                        InputProps={{ className: "custom-input" }}
                      />
                    </div>

                    {/* Country */}
                    <div className="form-field">
                      <Field
                        as={TextField}
                        name="country"
                        label="Country"
                        autoComplete="off"
                        fullWidth
                        size="small"
                        error={fp.touched.country && Boolean(fp.errors.country)}
                        helperText={getError("country", fp)}
                        className="custom-textfield"
                        InputLabelProps={{ className: "custom-label" }}
                        InputProps={{ className: "custom-input" }}
                      />
                    </div>

                    {/* Latitude */}
                    <div className="form-field">
                      <Field
                        as={TextField}
                        name="latitude"
                        label="Latitude"
                        autoComplete="off"
                        fullWidth
                        size="small"
                        step="any"
                        value={fp.values.latitude || ""}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                          const v = e.target.value;
                          if (v === "" || /^\d{0,2}(\.\d{0,15})?$/.test(v)) {
                            fp.setFieldValue("latitude", v);
                          }
                        }}
                        error={fp.touched.latitude && Boolean(fp.errors.latitude)}
                        helperText={getError("latitude", fp)}
                        className="custom-textfield"
                        InputLabelProps={{ className: "custom-label" }}
                        InputProps={{ className: "custom-input" }}
                      />
                    </div>

                    {/* Longitude */}
                    <div className="form-field">
                      <Field
                        as={TextField}
                        name="longitude"
                        label="Longitude"
                        autoComplete="off"
                        fullWidth
                        size="small"
                        step="any"
                        value={fp.values.longitude || ""}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                          const v = e.target.value;
                          if (v === "" || /^\d{0,3}(\.\d{0,15})?$/.test(v)) {
                            fp.setFieldValue("longitude", v);
                          }
                        }}
                        error={fp.touched.longitude && Boolean(fp.errors.longitude)}
                        helperText={getError("longitude", fp)}
                        className="custom-textfield"
                        InputLabelProps={{ className: "custom-label" }}
                        InputProps={{ className: "custom-input" }}
                      />
                    </div>
                  </div>
                </div>

                {/* ── Section 3: Meta Info ── */}
                <div className="form-section">
                  <h3 className="form-section-title">3. Meta Info</h3>
                  <div className="form-grid-manager">

                    {/* Manager Name */}
                    <div className="form-field">
                      <TextField
                        name="managerName"
                        label="Manager Name *"
                        autoComplete="off"
                        fullWidth
                        size="small"
                        inputProps={{ maxLength: 25 }}
                        value={fp.values.managerName}
                        onChange={(e) =>
                          fp.setFieldValue("managerName", filterTextChars(e.target.value))
                        }
                        onBlur={fp.handleBlur}
                        error={fp.touched.managerName && Boolean(fp.errors.managerName)}
                        helperText={getError("managerName", fp)}
                        className="custom-textfield"
                        InputLabelProps={{ className: "custom-label" }}
                        InputProps={{ className: "custom-input" }}
                      />
                    </div>

                    {/* Manager Contact */}
                    <div className="form-field">
                      <TextField
                        name="managerContact"
                        label="Manager Contact *"
                        autoComplete="off"
                        fullWidth
                        size="small"
                        inputProps={{ maxLength: 10, inputMode: "numeric" }}
                        value={fp.values.managerContact || ""}
                        onChange={(e) => {
                          const filtered = filterPhone(e.target.value);
                          if (filtered !== null)
                            fp.setFieldValue("managerContact", filtered);
                        }}
                        onPaste={(e: React.ClipboardEvent<HTMLInputElement>) => {
                          const paste = e.clipboardData.getData("text");
                          if (!RE_VALID_PASTE_PHONE.test(paste)) e.preventDefault();
                        }}
                        onBlur={fp.handleBlur}
                        error={fp.touched.managerContact && Boolean(fp.errors.managerContact)}
                        helperText={getError("managerContact", fp)}
                        className="custom-textfield"
                        InputLabelProps={{ className: "custom-label" }}
                        InputProps={{ className: "custom-input" }}
                      />
                    </div>

                    {/* Description */}
                    <div className="form-field">
                      <TextField
                        name="description"
                        label="Description"
                        autoComplete="off"
                        fullWidth
                        size="small"
                        rows={2}
                        inputProps={{ maxLength: 50 }}
                        value={fp.values.description}
                        onChange={(e) =>
                          fp.setFieldValue("description", filterTextChars(e.target.value))
                        }
                        onBlur={fp.handleBlur}
                        error={fp.touched.description && Boolean(fp.errors.description)}
                        helperText={getError("description", fp)}
                        className="custom-textfield"
                        InputLabelProps={{ className: "custom-label" }}
                        InputProps={{ className: "custom-input" }}
                      />
                    </div>
                  </div>
                </div>

                {searchError && (
                  <div className="error-message">{searchError}</div>
                )}
              </DialogContent>

              <DialogActions className="dialog-actions">
                <button type="button" onClick={handleCloseRequest} className="btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn-primary" >
                  {editMode ? "Update" : "Create"}
                </button>
              </DialogActions>
            </Form>
          )}
        </Formik>
      </Dialog>

      <ConfirmationDialog
        open={showDiscardDialog}
        title="Discard Changes?"
        message="You have unsaved changes. Are you sure you want to discard them?"
        onConfirm={handleConfirmDiscard}
        onCancel={handleCancelDiscard}
        confirmText="Discard"
        cancelText="Cancel"
      />
    </>
  );
};

export default WareHouseDialog;