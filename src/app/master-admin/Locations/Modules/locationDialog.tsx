




"use client";
import React, { useEffect, useState, useRef, useCallback } from "react";
import { useDispatch } from "react-redux";
import { fetchAllCountry } from "../../WarehouseMaster/Features/warehouseSlice";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  CircularProgress,
  FormControlLabel,
  Checkbox,
  FormGroup,
  Typography,
  Radio,
  Tooltip,Box,
} from "@mui/material";
import { Formik, Form, Field, FormikHelpers, FormikProps } from "formik";
import * as Yup from "yup";
import ConfirmationDialog from "../Modules/confirmationAction";
import { Location, OrderType } from "../Models/locationModels";
import { AppDispatch } from "@/redux/store";

interface LocationDialogProps {
  open: boolean;
  onClose: () => void;
  handleSubmit: (values: Location, helpers: FormikHelpers<Location>) => void;
  formData: Location;
  editMode: boolean;
  handleDiscardChanges: () => void;
  orderTypes: OrderType[];
  loading: boolean;
}

const initialLocationForm: Location = {
  type: "",
  branchName: "",
  aliasName: "",
  status: "active",
  address: "",
  country: "",
  state: "",
  city: "",
  postalCode: 0,
  phoneNumber: 0,
  email: "",
  latitude: 0,
  longitude: 0,
  description: "",
  managerName: "",
  managerContact: 0,
  code: "",
  createdDate: null,
  lastUpdatedDate: null,
  salesTypes: [],
  createdBy: "",
};

// ─── Reusable regex ───────────────────────────────────────────────────────────
// Text fields: letters, digits, spaces, hyphen, dot, comma only
const allowedChars = /^[a-zA-Z0-9\s\-.,/]*$/;
// At least one letter required
const hasLetter = /[a-zA-Z]/;
// Email local part (before @): only letters and digits
const emailLocalPart = /^[a-zA-Z0-9]+@/;
// Email must end with a valid extension: .com .in .co.in .net .org .edu etc.
const emailExtension = /\.[a-zA-Z]{2,}$/;

const validationSchema = Yup.object().shape({
  branchName: Yup.string()
    .min(2, "At least 2 characters")
    .max(25, "Maximum 25 characters allowed")
    .matches(allowedChars, "Only letters, numbers, spaces, - . , are allowed")
    .matches(hasLetter, "Must contain at least one letter")
    .required("Branch Name is required"),

  aliasName: Yup.string()
    .min(2, "At least 2 characters")
    .max(4, "Maximum 4 characters allowed")
    .matches(allowedChars, "Only letters, numbers, spaces, - . , are allowed")
    .matches(hasLetter, "Must contain at least one letter")
    .required("Alias Name is required"),

  // Address: allows all special characters, max 25, must have a letter
  address: Yup.string()
    .max(100, "Maximum 100 characters allowed")
    .matches(allowedChars, "Only letters, numbers, spaces, - . , are allowed")
    .matches(hasLetter, "Must contain at least one letter")
    .required("Address is required"),

  managerName: Yup.string()
    .min(2, "Manager Name must be at least 2 characters")
    .max(25, "Maximum 25 characters allowed")
    .matches(allowedChars, "Only letters, numbers, spaces, - . , are allowed")
    .matches(hasLetter, "Must contain at least one letter")
    .required("Manager Name is required"),

  description: Yup.string()
    .max(50, "Maximum 50 characters allowed")
    .matches(allowedChars, "Only letters, numbers, spaces, - . , are allowed")
    .test(
      "has-letter-if-filled",
      "Must contain at least one letter",
      (value) => !value || hasLetter.test(value) // optional field — skip if empty
    ),

  phoneNumber: Yup.string()
    .matches(/^\d{10}$/, "Must be exactly 10 digits")
    .required("Required"),

  // Email: local part must be alphanumeric only (@), domain needs valid extension
  email: Yup.string()
    .required("Email is required")
    .matches(emailLocalPart, "Only letters and numbers are allowed before @")
    .matches(emailExtension, "Must end with a valid extension (e.g. .com, .in, .co.in)")
    .email("Invalid email format"),

  state: Yup.string().when("country", {
    is: (country: string) => !!country,
    then: (schema) => schema.required("State is required"),
  }),

  city: Yup.string().when("state", {
    is: (state: string) => !!state,
    then: (schema) => schema.required("City is required"),
  }),

  latitude: Yup.number().required("Latitude is required"),
  longitude: Yup.number().required("Longitude is required"),

  managerContact: Yup.string()
    .matches(/^\d{10}$/, "Must be exactly 10 digits")
    .required("Required"),


  // ✅ NEW: Sales Types required when type is "Branch"
  salesTypes: Yup.array().when("type", {
    is: "Branch",
    then: (schema) =>
      schema
        .min(1, "At least one Sales Type is required for Branch")
        .required("At least one Sales Type is required for Branch"),
    otherwise: (schema) => schema.notRequired(),
  }),
});


// ─── Helper: strip disallowed characters on every keystroke ──────────────────
// Text fields (branchName, aliasName, managerName, description): letters, digits, space, - . ,
const handleTextInput = (
  e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  fieldName: string,
  setFieldValue: (field: string, value: any) => void
) => {
  const filtered = e.target.value.replace(/[^a-zA-Z0-9\s\-.,]/g, "");
  setFieldValue(fieldName, filtered);
};

// Email field: allow only letters, digits, @ and . — all other special chars are blocked
const handleEmailInput = (
  e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  setFieldValue: (field: string, value: any) => void
) => {
  const filtered = e.target.value.replace(/[^a-zA-Z0-9@.]/g, "");
  setFieldValue("email", filtered);
};


const LocationDialog: React.FC<LocationDialogProps> = ({
  open,
  onClose,
  handleSubmit,
  formData,
  editMode,
  handleDiscardChanges,
  orderTypes,
  loading,
}) => {
  const dispatch = useDispatch<AppDispatch>();
  const [showDiscardDialog, setShowDiscardDialog] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [postalCodeLoading, setPostalCodeLoading] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleOrderTypeChange = (
    orderTypeId: string,
    checked: boolean,
    currentOrderTypes: string[],
    setFieldValue: (field: string, value: any) => void
  ) => {
    const updatedOrderTypes = checked
      ? [...currentOrderTypes, orderTypeId]
      : currentOrderTypes.filter((id) => id !== orderTypeId);
    setFieldValue("salesTypes", updatedOrderTypes);
  };

  const handlePostalCodeChange = async (
    postalCode: string,
    setFieldValue: (field: string, value: any) => void
  ) => {
    const trimmed = postalCode.trim();
    const numericPostalCode = Number(trimmed);

    if (trimmed.length === 6 && !isNaN(numericPostalCode)) {
      setPostalCodeLoading(true);
      setSearchError(null);

      try {
        const result = await dispatch(fetchAllCountry(numericPostalCode));

        if (fetchAllCountry.fulfilled.match(result)) {
          const data = result.payload;

          if (
            data &&
            data[0]?.Status === "Success" &&
            data[0].PostOffice &&
            data[0].PostOffice.length > 0
          ) {
            const postOffice = data[0].PostOffice[0];
            setFieldValue("country", postOffice.Country || "");
            setFieldValue("state", postOffice.State || "");
            setFieldValue("city", postOffice.Name || "");
          } else {
            setSearchError("No location found for this postal code.");
          }
        } else {
          setSearchError("Failed to fetch location details.");
        }
      } catch (error) {
        console.error("Error fetching postal code details:", error);
        setSearchError("Unexpected error occurred.");
      } finally {
        setPostalCodeLoading(false);
      }
    } else if (trimmed.length > 0) {
      setFieldValue("country", "");
      setFieldValue("state", "");
      setFieldValue("city", "");
      setSearchError(null);
    }
  };

  useEffect(() => {
    if (open && inputRef.current) {
      const timer = setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
          if (editMode) inputRef.current.select();
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [open, editMode]);

  const isFormDirty = useCallback(() => {
    return JSON.stringify(formData) !== JSON.stringify(initialLocationForm);
  }, [formData]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dialogRef.current &&
        !dialogRef.current.contains(event.target as Node) &&
        open &&
        isFormDirty()
      ) {
        setShowDiscardDialog(true);
      }
    };

    if (open) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open, formData, isFormDirty]);

  const handleCloseRequest = () => {
    if (isFormDirty()) {
      setShowDiscardDialog(true);
    } else {
      onClose();
    }
  };

  const handleConfirmDiscard = () => {
    setShowDiscardDialog(false);
    handleDiscardChanges();
    onClose();
  };

  const handleCancelDiscard = () => setShowDiscardDialog(false);

  const prepareInitialValues = () => {
    const initialValues = { ...formData };
    initialValues.type = initialValues.type || "Branch";
    initialValues.country = initialValues.country || "";
    initialValues.state = initialValues.state || "";
    initialValues.city = initialValues.city || "";
    initialValues.postalCode = Number(initialValues.postalCode) || 0;
    initialValues.latitude = Number(initialValues.latitude) || 0;
    initialValues.longitude = Number(initialValues.longitude) || 0;
    initialValues.branchName = initialValues.branchName || "";
    initialValues.aliasName = initialValues.aliasName || "";
    initialValues.address = initialValues.address || "";
    initialValues.phoneNumber = initialValues.phoneNumber || 0;
    initialValues.email = initialValues.email || "";
    initialValues.managerName = initialValues.managerName || "";
    initialValues.managerContact = initialValues.managerContact || 0;
    initialValues.description = initialValues.description || "";
    //  initialValues.salesTypes = initialValues.salesTypes || [];

    // ✅ FIX: Convert salesTypes names to IDs if needed
    if (initialValues.salesTypes && Array.isArray(initialValues.salesTypes)) {
      initialValues.salesTypes = initialValues.salesTypes.map((storedValue: string) => {
        // If it's already an ID format (OT001, OT002...), return as-is
        if (storedValue.startsWith("OT")) return storedValue;

        // Otherwise, find matching orderType and return its ID
        const matchedOrderType = orderTypes.find(
          (ot) => ot.orderTypeName === storedValue
        );
        return matchedOrderType ? matchedOrderType.orderTypeId : storedValue;
      });
    } else {
      initialValues.salesTypes = [];
    }

    return initialValues;
  };

  const getErrorMessage = (
    fieldName: keyof Location,
    formikProps: FormikProps<Location>
  ): string | undefined => {
    const { touched, errors } = formikProps;
    if (touched[fieldName] && errors[fieldName]) {
      if (typeof errors[fieldName] === "string") return errors[fieldName] as string;
      if (Array.isArray(errors[fieldName]))
        return (errors[fieldName] as string[]).join(", ");
    }
    return undefined;
  };

  return (
    <>
      <Dialog
 open={open}
  onClose={handleCloseRequest}
  maxWidth="md"
  fullWidth
  className="master-admin-form-dialog location-form-dialog"
  PaperProps={{
    className:
      "dialog-paper master-admin-form-dialog-paper",
  }}
        TransitionProps={{
          onEntered: () => {
            if (inputRef.current) {
              inputRef.current.focus();
              if (editMode) inputRef.current.select();
            }
          },
        }}
      >
<DialogTitle className="dialog-title master-admin-form-dialog-title">
  <Box>
    <Typography
      component="span"
      className="master-admin-dialog-eyebrow"
    >
      MASTER ADMIN
    </Typography>

    <Typography
      component="h2"
      className="master-admin-dialog-title-text"
    >
      {editMode ? "Edit Location" : "Add Location"}
    </Typography>

    <Typography className="master-admin-dialog-description">
      {editMode
        ? "Update the selected location information"
        : "Create a new branch or office location"}
    </Typography>
  </Box>
</DialogTitle>

        <Formik
          initialValues={prepareInitialValues()}
          enableReinitialize
          validationSchema={validationSchema}
          onSubmit={(values, formikHelpers) => {
            const formattedValues = {
              ...values,
              postalCode: Number(values.postalCode) || 0,
              latitude: Number(values.latitude) || 0,
              longitude: Number(values.longitude) || 0,
            };
            handleSubmit(formattedValues, formikHelpers);
          }}
        >
          {(formikProps) => (
             <>
              <Form>
           <DialogContent
  dividers
  className="dialog-content master-admin-form-content"
>
              {/* <DialogContent dividers className="dialog-content"> */}

                {/* ── Section 1: Basic Info ── */}
                <div className="form-section">
                  <h3 className="form-section-title">1. Basic Info & Branch Type</h3>

                  <div style={{ marginBottom: "1rem" }}>
                    <FormGroup row className="checkbox-group">
                      <FormControlLabel
                        control={
                          <Radio
                            checked={formikProps.values.type === "Branch"}
                            onChange={() => {
                              formikProps.setFieldValue("type", "Branch");
                            }}
                            size="small"
                            sx={{
                              "& .MuiSvgIcon-root": { fontSize: 32 },
                              transform: "scale(0.8)",
                              padding: "8px",
                            }}
                          />
                        }
                        label={
                          <Typography variant="caption" fontWeight={500}>
                            Branch
                          </Typography>
                        }
                        className="checkbox-label"
                      />

                      <FormControlLabel
                        control={
                          <Radio
                            checked={formikProps.values.type === "Office"}
                            onChange={() => {
                              formikProps.setFieldValue("type", "Office");
                            }}
                            size="small"
                            sx={{
                              "& .MuiSvgIcon-root": { fontSize: 32 },
                              transform: "scale(0.8)",
                              padding: "8px",
                            }}
                          />
                        }
                        label={
                          <Typography variant="caption" fontWeight={500}>
                            Office
                          </Typography>
                        }
                        className="checkbox-label"
                      />
                    </FormGroup>

                    {formikProps.touched.type && formikProps.errors.type && (
                      <div
                        style={{
                          color: "rgb(220, 38, 38)",
                          fontSize: "0.75rem",
                          marginTop: "0.25rem",
                          marginLeft: "0.5rem",
                        }}
                      >
                        {formikProps.errors.type}
                      </div>
                    )}
                  </div>



                  <div className="form-grid">

                    {/* Branch Name */}
                    <div className="form-field">
                      <TextField
                        name="branchName"
                        label="Branch Name *"
                        autoComplete="off"
                        fullWidth
                        size="small"
                        inputRef={inputRef}
                        inputProps={{ maxLength: 25 }}
                        value={formikProps.values.branchName}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          handleTextInput(e, "branchName", formikProps.setFieldValue)
                        }
                        onBlur={formikProps.handleBlur}
                        error={formikProps.touched.branchName && Boolean(formikProps.errors.branchName)}
                        helperText={getErrorMessage("branchName", formikProps)}
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
                        value={formikProps.values.aliasName}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          handleTextInput(e, "aliasName", formikProps.setFieldValue)
                        }
                        onBlur={formikProps.handleBlur}
                        error={formikProps.touched.aliasName && Boolean(formikProps.errors.aliasName)}
                        helperText={getErrorMessage("aliasName", formikProps)}
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
                        value={formikProps.values.phoneNumber || ""}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                          const value = e.target.value;
                          if (value === "") { formikProps.setFieldValue("phoneNumber", value); return; }
                          if (!/^\d+$/.test(value)) return;
                          if (value.length === 1 && !/[6-9]/.test(value)) return;
                          if (value.length <= 10) formikProps.setFieldValue("phoneNumber", value);
                        }}
                        onPaste={(e: React.ClipboardEvent<HTMLInputElement>) => {
                          if (!/^[6-9]\d{9}$/.test(e.clipboardData.getData("text")))
                            e.preventDefault();
                        }}
                        onBlur={formikProps.handleBlur}
                        error={formikProps.touched.phoneNumber && Boolean(formikProps.errors.phoneNumber)}
                        helperText={getErrorMessage("phoneNumber", formikProps)}
                        className="custom-textfield"
                        InputLabelProps={{ className: "custom-label" }}
                        InputProps={{ className: "custom-input" }}
                      />
                    </div>

                    {/* Email — only letters, digits, @ and . allowed */}
                    <div className="form-field">
                      <TextField
                        name="email"
                        label="Email *"
                        autoComplete="off"
                        fullWidth
                        size="small"
                        inputProps={{ maxLength: 50 }}
                        value={formikProps.values.email}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          handleEmailInput(e, formikProps.setFieldValue)
                        }
                        onBlur={formikProps.handleBlur}
                        error={formikProps.touched.email && Boolean(formikProps.errors.email)}
                        helperText={getErrorMessage("email", formikProps)}
                        className="custom-textfield"
                        InputLabelProps={{ className: "custom-label" }}
                        InputProps={{ className: "custom-input" }}
                      />
                    </div>
                  </div>
                </div>

                {/* ── Section 2: Location ── */}
                <div className="form-section">
                  <h3 className="form-section-title">2. Location</h3>
                  <div className="form-grid">

                    {/* Address — all special characters allowed, max 25 */}
                    <div className="form-field form-field-span-2">
                      <Tooltip
                        title={formikProps.values.address || ""}
                        arrow
                        placement="top"
                      >
                        <TextField
                          name="address"
                          label="Address *"
                          autoComplete="off"
                          fullWidth
                          size="small"
                          inputProps={{ maxLength: 100 }}
                          value={formikProps.values.address}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                            formikProps.setFieldValue("address", e.target.value)
                          }
                          onBlur={formikProps.handleBlur}
                          error={formikProps.touched.address && Boolean(formikProps.errors.address)}
                          helperText={getErrorMessage("address", formikProps)}
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
                        value={formikProps.values.postalCode || ""}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, "").slice(0, 6);
                          formikProps.setFieldValue("postalCode", value ? Number(value) : "");
                          handlePostalCodeChange(value, formikProps.setFieldValue);
                        }}
                        onKeyPress={(e: React.KeyboardEvent) => {
                          if (!/[0-9]/.test(e.key)) e.preventDefault();
                        }}
                        onPaste={(e: React.ClipboardEvent) => {
                          if (!/^\d*$/.test(e.clipboardData.getData("text"))) e.preventDefault();
                        }}
                        error={formikProps.touched.postalCode && Boolean(formikProps.errors.postalCode)}
                        helperText={getErrorMessage("postalCode", formikProps)}
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
                        error={formikProps.touched.city && Boolean(formikProps.errors.city)}
                        helperText={getErrorMessage("city", formikProps)}
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
                        error={formikProps.touched.state && Boolean(formikProps.errors.state)}
                        helperText={getErrorMessage("state", formikProps)}
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
                        error={formikProps.touched.country && Boolean(formikProps.errors.country)}
                        helperText={getErrorMessage("country", formikProps)}
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
                        value={formikProps.values.latitude || ""}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                          const value = e.target.value;
                          if (value === "" || /^\d{0,2}(\.\d{0,15})?$/.test(value))
                            formikProps.setFieldValue("latitude", value);
                        }}
                        error={formikProps.touched.latitude && Boolean(formikProps.errors.latitude)}
                        helperText={getErrorMessage("latitude", formikProps)}
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
                        value={formikProps.values.longitude || ""}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                          const value = e.target.value;
                          if (value === "" || /^\d{0,3}(\.\d{0,15})?$/.test(value))
                            formikProps.setFieldValue("longitude", value);
                        }}
                        error={formikProps.touched.longitude && Boolean(formikProps.errors.longitude)}
                        helperText={getErrorMessage("longitude", formikProps)}
                        className="custom-textfield"
                        InputLabelProps={{ className: "custom-label" }}
                        InputProps={{ className: "custom-input" }}
                      />
                    </div>
                  </div>
                </div>

                {/* ── Section 3: Manager Info ── */}
                <div className="form-section">
                  <h3 className="form-section-title">3. Manager Info</h3>
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
                        value={formikProps.values.managerName}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          handleTextInput(e, "managerName", formikProps.setFieldValue)
                        }
                        onBlur={formikProps.handleBlur}
                        error={formikProps.touched.managerName && Boolean(formikProps.errors.managerName)}
                        helperText={getErrorMessage("managerName", formikProps)}
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
                        value={formikProps.values.managerContact || ""}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                          const value = e.target.value;
                          if (value === "") { formikProps.setFieldValue("managerContact", value); return; }
                          if (!/^\d+$/.test(value)) return;
                          if (value.length === 1 && !/[6-9]/.test(value)) return;
                          if (value.length <= 10) formikProps.setFieldValue("managerContact", value);
                        }}
                        onPaste={(e: React.ClipboardEvent<HTMLInputElement>) => {
                          if (!/^[6-9]\d{9}$/.test(e.clipboardData.getData("text")))
                            e.preventDefault();
                        }}
                        onBlur={formikProps.handleBlur}
                        error={formikProps.touched.managerContact && Boolean(formikProps.errors.managerContact)}
                        helperText={getErrorMessage("managerContact", formikProps)}
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
                        inputProps={{ maxLength: 25 }}
                        value={formikProps.values.description}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          handleTextInput(e, "description", formikProps.setFieldValue)
                        }
                        onBlur={formikProps.handleBlur}
                        error={formikProps.touched.description && Boolean(formikProps.errors.description)}
                        helperText={getErrorMessage("description", formikProps)}
                        className="custom-textfield"
                        InputLabelProps={{ className: "custom-label" }}
                        InputProps={{ className: "custom-input" }}
                      />
                    </div>
                  </div>
                </div>

                {/* ── Section 4: Sales Types ── */}
                {/* <div className="form-section">
                  <h3 className="form-section-title">4. Sales Types</h3>
                  {loading ? (
                    <div className="loading-order-types">
                      <CircularProgress size={20} />
                      <Typography variant="caption">Loading order types...</Typography>
                    </div>
                  ) : orderTypes.length === 0 ? (
                    <Typography variant="caption" color="textSecondary">
                      No order types available
                    </Typography>
                  ) : (
                    <FormGroup row className="checkbox-group">
                      {orderTypes.map((orderType) => (
                        <FormControlLabel
                          key={orderType.orderTypeId}
                          control={
                            <Checkbox
                              // ✅ CHECK: Match stored ID with orderTypeId
                              checked={
                                formikProps.values.salesTypes?.includes(orderType.orderTypeId) || false
                              }
                              onChange={(e) =>
                                handleOrderTypeChange(
                                  orderType.orderTypeId,  // ✅ STORE: Always use ID
                                  e.target.checked,
                                  formikProps.values.salesTypes || [],
                                  formikProps.setFieldValue
                                )
                              }
                              size="small"
                              sx={{
                                "& .MuiSvgIcon-root": { fontSize: 32 },
                                transform: "scale(0.8)",
                                padding: "8px",
                              }}
                            />
                          }
                          label={
                            // ✅ DISPLAY: Show user-friendly name
                            <Typography variant="caption" fontWeight={500} className="checkbox-label">
                              {orderType.orderTypeName}
                            </Typography>
                          }
                          className="checkbox-label"
                        />
                      ))}
                    </FormGroup>
                  )}
                </div> */}


                {/* ── Section 4: Sales Types ── */}
                <div className="form-section">
                  <h3 className="form-section-title">4. Sales Types</h3>
                  {loading ? (
                    <div className="loading-order-types">
                      <CircularProgress size={20} />
                      <Typography variant="caption">Loading order types...</Typography>
                    </div>
                  ) : orderTypes.length === 0 ? (
                    <Typography variant="caption" color="textSecondary">
                      No order types available
                    </Typography>
                  ) : (
                    <>
                      <FormGroup row className="checkbox-group">
                        {orderTypes.map((orderType) => (
                          <FormControlLabel
                            key={orderType.orderTypeId}
                            control={
                              <Checkbox
                                checked={
                                  formikProps.values.salesTypes?.includes(orderType.orderTypeId) || false
                                }
                                onChange={(e) =>
                                  handleOrderTypeChange(
                                    orderType.orderTypeId,
                                    e.target.checked,
                                    formikProps.values.salesTypes || [],
                                    formikProps.setFieldValue
                                  )
                                }
                                // ✅ Mark checkbox group as touched on change so error shows immediately
                                onBlur={() => formikProps.setFieldTouched("salesTypes", true)}
                                size="small"
                                sx={{
                                  "& .MuiSvgIcon-root": { fontSize: 32 },
                                  transform: "scale(0.8)",
                                  padding: "8px",
                                }}
                              />
                            }
                            label={
                              <Typography variant="caption" fontWeight={500} className="checkbox-label">
                                {orderType.orderTypeName}
                              </Typography>
                            }
                            className="checkbox-label"
                          />
                        ))}
                      </FormGroup>

                      {/* ✅ NEW: Show validation error for salesTypes */}
                      {formikProps.touched.salesTypes && formikProps.errors.salesTypes && (
                        <div
                          style={{
                            color: "rgb(220, 38, 38)",
                            fontSize: "0.75rem",
                            marginTop: "0.25rem",
                            marginLeft: "0.5rem",
                          }}
                        >
                          {typeof formikProps.errors.salesTypes === "string"
                            ? formikProps.errors.salesTypes
                            : "At least one Sales Type is required for Branch"}
                        </div>
                      )}
                    </>
                  )}
                </div>

                {searchError && (
                  <div className="error-message">{searchError}</div>
                )}
              </DialogContent>

             <DialogActions className="dialog-actions master-admin-form-actions">
  <button
    type="button"
    onClick={handleCloseRequest}
    className="btn-secondary master-admin-dialog-button is-secondary"
  >
    Cancel
  </button>

  <button
    type="submit"
    className="btn-primary master-admin-dialog-button is-primary"
  >
    {editMode ? "Update" : "Create"}
  </button>
</DialogActions>
            </Form>
            </>
            
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

export default LocationDialog;