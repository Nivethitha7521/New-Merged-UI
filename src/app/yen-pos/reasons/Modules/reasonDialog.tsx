'use client';
import React, { useEffect, useRef, useState } from "react";
import { Reasons } from "../Models/reasonModels";
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    IconButton,
    CircularProgress,
    Typography,
} from "@mui/material";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import EditIcon from "@mui/icons-material/Edit";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import CloseIcon from "@mui/icons-material/Close";
// Adjust this relative path to match where this dialog file sits in your project
import ActivateDeactivateConfirmationDialog from "../../../Components/Dialogs/ActivateDeactivateConfirmationDialog";

export interface ReasonDialogProps {
    open: boolean;
    onClose: () => void;
    onSubmit: () => void;
    reasonData: Reasons;
    loading: boolean;
    mode: "Edit" | "Add";
    validationErrors: {
        module: string;
        reason: string;
    };
    handleModuleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    handleReasonListChange: (list: string[]) => void;
}

// ─── Validation helpers ───────────────────────────────────────────────────────

const hasLetter = /[a-zA-Z]/;

const getHelperText = (value: string, parentError: string): string => {
    if (value && !hasLetter.test(value)) return "Must contain at least one letter";
    return parentError;
};

const hasLetterError = (value: string): boolean => !!value && !hasLetter.test(value);

// Strips special chars, keeps letters/digits/spaces/-.,  -- shared by both fields
const sanitize = (value: string, maxLen: number) =>
    value.replace(/[^a-zA-Z0-9\s\-.,]/g, "").slice(0, maxLen);

const ReasonDialog: React.FC<ReasonDialogProps> = ({
    open,
    loading,
    onClose,
    onSubmit,
    reasonData,
    validationErrors,
    handleModuleChange,
    handleReasonListChange,
}) => {
    const moduleInputRef = useRef<HTMLInputElement>(null);
    const reasonInputRef = useRef<HTMLInputElement>(null);

    // editingIndex === list.length  -> currently adding a brand-new item
    // editingIndex === some i < length -> currently editing that existing item
    // editingIndex === null -> nothing being edited, "+" button is shown
    const [editingIndex, setEditingIndex] = useState<number | null>(null);
    const [draftText, setDraftText] = useState("");

    // Tracks which row's delete icon was clicked, pending user confirmation
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [pendingDeleteIndex, setPendingDeleteIndex] = useState<number | null>(null);

    const reasonList = reasonData.reason || [];
    const isAddingNew = editingIndex !== null && editingIndex >= reasonList.length;

    // Focus the "Reason Name" field when dialog opens
    useEffect(() => {
        if (open && moduleInputRef.current) {
            const timer = setTimeout(() => {
                moduleInputRef.current?.focus();
                if (reasonData.id) moduleInputRef.current?.select();
            }, 100);
            return () => clearTimeout(timer);
        }
    }, [open, reasonData.id]);

    // Reset inline list-editing state whenever the dialog opens/closes
    useEffect(() => {
        if (!open) {
            setEditingIndex(null);
            setDraftText("");
        }
    }, [open]);

    // Focus the reason input whenever a row becomes editable
    useEffect(() => {
        if (editingIndex !== null) {
            const timer = setTimeout(() => reasonInputRef.current?.focus(), 50);
            return () => clearTimeout(timer);
        }
    }, [editingIndex]);

    const handleModuleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const filtered = sanitize(e.target.value, 30);
        const syntheticEvent = {
            ...e,
            target: { ...e.target, value: filtered, name: e.target.name },
        } as React.ChangeEvent<HTMLInputElement>;
        handleModuleChange(syntheticEvent);
    };

    // Click "+" -> open a new empty, focused row at the end of the list
    const handleAddClick = () => {
        setEditingIndex(reasonList.length);
        setDraftText("");
    };

    // Click the pencil on a saved row -> that row becomes editable
    const handleEditClick = (index: number) => {
        setEditingIndex(index);
        setDraftText(reasonList[index]);
    };

    // Click the tick -> commit the draft text into the list
    const handleSave = () => {
        const trimmed = draftText.trim();
        if (!trimmed) return;

        const updated = [...reasonList];
        if (editingIndex !== null && editingIndex < reasonList.length) {
            updated[editingIndex] = trimmed; // saving an edit to an existing row
        } else {
            updated.push(trimmed); // saving a brand-new row
        }
        handleReasonListChange(updated);
        setEditingIndex(null);
        setDraftText("");
    };

    const handleCancelEdit = () => {
        setEditingIndex(null);
        setDraftText("");
    };

    // Click the trash icon -> just open the confirmation dialog, don't delete yet
    const handleDeleteClick = (index: number) => {
        setPendingDeleteIndex(index);
        setDeleteConfirmOpen(true);
    };

    // User confirmed in the dialog -> actually remove the item
    const handleConfirmDelete = () => {
        if (pendingDeleteIndex === null) return;
        const updated = reasonList.filter((_, i) => i !== pendingDeleteIndex);
        handleReasonListChange(updated);
        if (editingIndex === pendingDeleteIndex) handleCancelEdit();
        setPendingDeleteIndex(null);
        setDeleteConfirmOpen(false);
    };

    // User cancelled -> close dialog, keep the item
    const handleCancelDelete = () => {
        setPendingDeleteIndex(null);
        setDeleteConfirmOpen(false);
    };

    return (
        <>
            <Dialog
                open={open}
                onClose={onClose}
                maxWidth="sm"
                fullWidth
                PaperProps={{ className: "dialog-paper-small" }}
            >
                <DialogTitle className="dialog-title">
                    {reasonData.id ? "Edit" : "Add"} Reason
                </DialogTitle>

                <DialogContent className="dialog-content">
                    {/* ── Reason Name ───────────────────────────────────────── */}
                    <div className="form-section">
                        <TextField
                            label="Reason Name"
                            name="module"
                            autoComplete="off"
                            type="text"
                            value={reasonData.module}
                            onChange={handleModuleTextChange}
                            inputProps={{ maxLength: 30 }}
                            margin="normal"
                            fullWidth
                            inputRef={moduleInputRef}
                            error={hasLetterError(reasonData.module) || !!validationErrors.module}
                            helperText={getHelperText(reasonData.module, validationErrors.module)}
                            className="custom-textfield"
                            InputLabelProps={{ className: "custom-label" }}
                            InputProps={{ className: "custom-input" }}
                        />
                    </div>

                    {/* ── Reasons list ──────────────────────────────────────── */}
                    <div className="form-section" style={{ marginTop: 10 }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                            <Typography className="custom-label" style={{ fontWeight: 600 }}>
                                Reasons
                            </Typography>

                            {editingIndex === null && (
                                <IconButton color="primary" onClick={handleAddClick} title="Add Reason">
                                    <AddCircleOutlineIcon />
                                </IconButton>
                            )}
                        </div>

                        {validationErrors.reason && editingIndex === null && (
                            <Typography color="error" style={{ fontSize: "0.75rem", marginTop: 2 }}>
                                {validationErrors.reason}
                            </Typography>
                        )}

                        <div
                            style={{
                                border: "1px solid #ccc",
                                borderRadius: 8,
                                marginTop: 8,
                                maxHeight: 220,
                                overflowY: "auto",
                                padding: reasonList.length === 0 && !isAddingNew ? 16 : 4,
                            }}
                        >
                            {reasonList.length === 0 && !isAddingNew && (
                                <Typography style={{ fontSize: "0.85rem", color: "#888", textAlign: "center" }}>
                                    No reasons added yet. Click + to add one.
                                </Typography>
                            )}

                            {reasonList.map((item, index) => (
                                <div
                                    key={index}
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 8,
                                        padding: "6px 8px",
                                        borderBottom:
                                            index !== reasonList.length - 1 || isAddingNew ? "1px solid #eee" : "none",
                                    }}
                                >
                                    <Typography style={{ minWidth: 20, fontSize: "0.85rem", color: "#666" }}>
                                        {index + 1}.
                                    </Typography>

                                    {editingIndex === index ? (
                                        <>
                                            <TextField
                                                inputRef={reasonInputRef}
                                                value={draftText}
                                                onChange={(e) => setDraftText(sanitize(e.target.value, 100))}
                                                onKeyDown={(e) => {
                                                    if (e.key === "Enter") handleSave();
                                                    if (e.key === "Escape") handleCancelEdit();
                                                }}
                                                inputProps={{ maxLength: 100 }}
                                                size="small"
                                                fullWidth
                                                variant="standard"
                                            />
                                            <IconButton color="primary" onClick={handleSave} title="Save">
                                                <CheckCircleIcon />
                                            </IconButton>
                                            <IconButton onClick={handleCancelEdit} title="Cancel">
                                                <CloseIcon />
                                            </IconButton>
                                        </>
                                    ) : (
                                        <>
                                            <Typography style={{ flex: 1, fontSize: "0.9rem" }}>{item}</Typography>
                                            <button className="edit-btn" onClick={() => handleEditClick(index)} title="Edit">
                                                <EditIcon fontSize="small" />
                                            </button>
                                            <button className="deactivate-btn" onClick={() => handleDeleteClick(index)} title="Remove">
                                                <DeleteOutlineIcon fontSize="small" />
                                            </button>
                                        </>
                                    )}
                                </div>
                            ))}

                            {isAddingNew && (
                                <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 8px" }}>
                                    <Typography style={{ minWidth: 20, fontSize: "0.85rem", color: "#666" }}>
                                        {reasonList.length + 1}.
                                    </Typography>
                                    <TextField
                                        inputRef={reasonInputRef}
                                        value={draftText}
                                        onChange={(e) => setDraftText(sanitize(e.target.value, 100))}
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter") handleSave();
                                            if (e.key === "Escape") handleCancelEdit();
                                        }}
                                        inputProps={{ maxLength: 100 }}
                                        size="small"
                                        fullWidth
                                        variant="standard"
                                        placeholder="Type a reason..."
                                    />
                                    <IconButton color="primary" onClick={handleSave} title="Save">
                                        <CheckCircleIcon />
                                    </IconButton>
                                    <IconButton onClick={handleCancelEdit} title="Cancel">
                                        <CloseIcon />
                                    </IconButton>
                                </div>
                            )}
                        </div>
                    </div>
                </DialogContent>

                <DialogActions className="dialog-actions">
                    <button onClick={onClose} className="btn-secondary">
                        Cancel
                    </button>
                    <button onClick={onSubmit} className="btn-primary">
                        {loading ? <CircularProgress size={24} /> : reasonData.id ? "Update" : "Create"}
                    </button>
                </DialogActions>
            </Dialog>

            <ActivateDeactivateConfirmationDialog
                open={deleteConfirmOpen}
                actionType="delete"
                itemName={pendingDeleteIndex !== null ? reasonList[pendingDeleteIndex] : undefined}
                onClose={handleCancelDelete}
                onConfirm={handleConfirmDelete}
            />
        </>
    );
};

export default ReasonDialog;