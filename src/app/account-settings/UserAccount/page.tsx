"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  ChevronDown,
  Eye,
  EyeOff,
  Info,
  Laptop,
  Pencil,
  Plus,
  RotateCcw,
  Search,
  Smartphone,
  Trash2,
  X,
} from "lucide-react";
import { useDispatch } from "react-redux";
import { Snackbar, Alert } from "@mui/material";

import {
  addUserLocally,
  updateUserStatusLocally,
} from "@/features/account-setting/userSlice";
import { authFetch } from "@/utils/authFetch";

const API_BASE = "https://yenerp.com/purchasetestapi";

const PREDEFINED_ROLES = [
  "Admin",
  "Super Admin",
  "Purchase Manager",
  "Purchase Assistant",
  "Store Incharge",
  "Accounts Assistant",
  "Finance Assistant",
];

const PURCHASE_SUBMODULES = [
  "purchasecategory",
  "purchasesubcategory",
  "purchaseuom",
  "itemgroup",
  "purchasetax",
  "storagelocation",
  "freight",
  "itemtype",
  "vendortype",
  "vendors",
  "purchaseitem",
  "purchaseorders_pending",
  "purchaseorders_approved",
  "purchaseorders_rejected",
  "grns",
  "grns_return",
  "apinvoices",
];

const BOOK_SUBMODULES = [
  "outgoingpayment",
  "advancepayment",
  "partialpayment",
  "paymentdone",
  "ledger",
  "purchasereturn",
];

const REPORT_SUBMODULES = ["purchaseorderreport", "posreport"];

const INVENTORY_SUBMODULES = [
  "physicalstockmodification",
  "physicalstockvariancemodification",
  "stockledger",
  "warehousephysicalstockmodification",
  "warehousephysicalstockvariancemodification",
  "warehousestockledger",
];

const SETTINGS_SUBMODULES = ["settings"];

const USERNAME_REGEX = /^.{4,}$/;
const PASSWORD_REGEX =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE_REGEX = /^\d{7,15}$/;

type PlatformType = "web" | "app";

type FormUser = {
  id: string;
  username: string;
  email: string;
  phone: string;
  countryCode: string;
  password: string;
  confirmPassword: string;
  role: string;
  active: boolean;
  grantAppAccess: boolean;
};

const EMPTY_FORM: FormUser = {
  id: "",
  username: "",
  email: "",
  phone: "",
  countryCode: "+91",
  password: "",
  confirmPassword: "",
  role: "",
  active: true,
  grantAppAccess: false,
};

export default function UserAccounts() {
  const dispatch = useDispatch();

  const [users, setUsers] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [roleAppsMap, setRoleAppsMap] = useState<Record<string, string[]>>({});

  const [showActive, setShowActive] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const [platformModalOpen, setPlatformModalOpen] = useState(false);
  const [credentialModalOpen, setCredentialModalOpen] = useState(false);
  const [selectedPlatform, setSelectedPlatform] =
    useState<PlatformType | null>(null);

  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [formUser, setFormUser] = useState<FormUser>(EMPTY_FORM);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [touched, setTouched] = useState({
    username: false,
    email: false,
    phone: false,
    password: false,
    confirmPassword: false,
    role: false,
  });

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success" as "success" | "error" | "warning",
  });

  const [confirmDialog, setConfirmDialog] = useState({
    open: false,
    title: "",
    message: "",
    onConfirm: () => {},
  });

const isEditMode = Boolean(editingUserId);

  // Super Admin is the tenant owner account auto-created at signup — it must
  // never be editable or deletable from this UI, only viewable.
  const isProtectedRole = (roleName: string) => roleName === "Super Admin";
  const resetTouched = () => {
    setTouched({
      username: false,
      email: false,
      phone: false,
      password: false,
      confirmPassword: false,
      role: false,
    });
  };

  const resetForm = () => {
    setFormUser(EMPTY_FORM);
    setEditingUserId(null);
    setSelectedPlatform(null);
    setShowPassword(false);
    setShowConfirmPassword(false);
    resetTouched();
  };

  const closeAllUserModals = () => {
    setPlatformModalOpen(false);
    setCredentialModalOpen(false);
    resetForm();
  };

  const startCreateUser = () => {
    resetForm();
    setPlatformModalOpen(true);
  };

  const continueToCredentials = () => {
    if (!selectedPlatform) return;
    setPlatformModalOpen(false);
    setCredentialModalOpen(true);
  };

  const goBackToPlatform = () => {
    if (isEditMode) {
      setCredentialModalOpen(false);
      resetForm();
      return;
    }

    setCredentialModalOpen(false);
    setPlatformModalOpen(true);
  };

  const fetchRolesFromBackend = async () => {
    try {
      const response = await authFetch(`${API_BASE}/roles`);

      if (!response.ok) {
        setRoles([]);
        return;
      }

      const rolesFromBackend = await response.json();

      if (!Array.isArray(rolesFromBackend)) {
        setRoles([]);
        return;
      }

      const activeRoles = rolesFromBackend
        .filter((role: any) => role.active === true)
        .map((role: any) => {
          const roleName = role.name;

          return {
            id: role._id || role.id,
            name: roleName,
            role_type: PREDEFINED_ROLES.includes(roleName)
              ? "Predefined"
              : "Custom",
          };
        });

      setRoles(activeRoles);
    } catch (error) {
      console.error("Error fetching roles:", error);
      setRoles([]);
    }
  };

  const fetchRoleAppsFromPermissions = async () => {
    try {
      const response = await authFetch(`${API_BASE}/permissions`);
      if (!response.ok) return;

      const data = await response.json();
      const map: Record<string, string[]> = {};

      const hasAnyCheckedPermissionExceptHide = (obj: any) => {
        if (!obj || typeof obj !== "object") return false;

        return Object.entries(obj).some(
          ([key, value]) => key !== "hide" && value === true,
        );
      };

      if (Array.isArray(data)) {
        data.forEach((item: any) => {
          const roleName = item.role_name;
          const permissions = item.permissions || {};
          const apps: string[] = [];

          Object.keys(permissions).forEach((appKey) => {
            const appPermissionObject = permissions[appKey];

            if (appKey === "yenerp") {
              let hasPurchase = false;
              let hasBook = false;
              let hasReport = false;
              let hasInventory = false;
              let hasSettings = false;

              Object.entries(appPermissionObject || {}).forEach(
                ([subKey, actions]: any) => {
                  const hasPermission = Object.entries(actions || {}).some(
                    ([key, value]) => key !== "hide" && value === true,
                  );

                  if (!hasPermission) return;

                  if (PURCHASE_SUBMODULES.includes(subKey)) hasPurchase = true;
                  if (BOOK_SUBMODULES.includes(subKey)) hasBook = true;
                  if (REPORT_SUBMODULES.includes(subKey)) hasReport = true;
                  if (INVENTORY_SUBMODULES.includes(subKey)) {
                    hasInventory = true;
                  }
                  if (SETTINGS_SUBMODULES.includes(subKey)) hasSettings = true;
                },
              );

              if (hasPurchase) apps.push("YEN_PURCHASE");
              if (hasBook) apps.push("YEN_BOOK");
              if (hasReport) apps.push("YEN_REPORT");
              if (hasInventory) apps.push("YEN_INVENTORY");
              if (hasSettings) apps.push("YEN_SETTINGS");
              return;
            }

            const submodules = Object.values(appPermissionObject || {});
            const appHasPermission = submodules.some((submodule: any) =>
              hasAnyCheckedPermissionExceptHide(submodule),
            );

            if (appHasPermission) {
              apps.push(`YEN_${appKey.toUpperCase()}`);
            }
          });

          map[roleName] = apps;
        });
      }

      setRoleAppsMap(map);
    } catch (error) {
      console.error("Error fetching role permissions:", error);
    }
  };

  const fetchUsersFromBackend = async () => {
    try {
      const response = await authFetch(`${API_BASE}/users`);

      if (!response.ok) {
        setUsers([]);
        return;
      }

      const usersFromBackend = await response.json();

      if (!Array.isArray(usersFromBackend)) {
        setUsers([]);
        return;
      }

      const transformedUsers = usersFromBackend.map((user: any) => ({
        id: user._id || user.id,
        username: user.username,
        email: user.email || "",
        phone: user.phone || user.phone_number || "",
        password: "••••••••",
        confirmPassword: "••••••••",
        role: user.role_name || user.role,
        active: user.is_active !== false,
        // Older records saved before this field existed don't have it —
        // fall back to the old heuristic (email/phone present => web).
        accountType:
          user.account_type || (user.email || user.phone ? "web" : "app"),
      }));

      setUsers(transformedUsers);
    } catch (error) {
      console.error("Error fetching users:", error);
      setUsers([]);
    }
  };

  useEffect(() => {
    fetchUsersFromBackend();
    fetchRolesFromBackend();
    fetchRoleAppsFromPermissions();
  }, []);

  useEffect(() => {
    fetchUsersFromBackend();
  }, [showActive]);

  useEffect(() => {
    if (platformModalOpen || credentialModalOpen) {
      fetchRolesFromBackend();
    }
  }, [platformModalOpen, credentialModalOpen]);

  const filteredUsers = useMemo(() => {
    return users
      .filter((user) =>
        showActive ? Boolean(user.active) : !Boolean(user.active),
      )
      .filter((user) => {
        if (!searchTerm.trim()) return true;

        const search = searchTerm.toLowerCase();

        return (
          user.username?.toLowerCase().includes(search) ||
          user.employeeId?.toLowerCase().includes(search) ||
          user.role?.toLowerCase().includes(search)
        );
      });
  }, [users, showActive, searchTerm]);

  const validateForm = () => {
    const isWeb = selectedPlatform === "web";

    setTouched({
      username: !isWeb || formUser.grantAppAccess,
      email: isWeb,
      phone: isWeb,
      password: true,
      confirmPassword: true,
      role: true,
    });

   if (isWeb) {
  const email = formUser.email.trim();
  const phone = formUser.phone.trim();

  if (!email && !phone) {
    throw new Error(
      "Please enter either an Email Address or Phone Number"
    );
  }

  if (email && !EMAIL_REGEX.test(email)) {
    throw new Error("Please enter a valid email address");
  }

  if (phone && !PHONE_REGEX.test(phone)) {
    throw new Error("Please enter a valid phone number");
  }

  if (
    formUser.grantAppAccess &&
    !USERNAME_REGEX.test(formUser.username.trim())
  ) {
    throw new Error("Username must be at least 4 characters");
  }
} else if (!USERNAME_REGEX.test(formUser.username.trim())) {
      throw new Error("Username must be at least 4 characters");
    }

    const isChangingPassword =
      !isEditMode || formUser.password !== "••••••••";

    if (isChangingPassword && !PASSWORD_REGEX.test(formUser.password)) {
      throw new Error(
        "Password must be at least 8 characters and include uppercase, lowercase, number and special character",
      );
    }

    if (
      isChangingPassword &&
      formUser.password !== formUser.confirmPassword
    ) {
      throw new Error("Passwords do not match");
    }

    if (!formUser.role) {
      throw new Error("Please select a role");
    }
  };

  const handleSaveUser = async () => {
    if (isSubmitting || !selectedPlatform) return;

    setIsSubmitting(true);

    try {
      validateForm();

      const isWeb = selectedPlatform === "web";

      /*
       * Web and App are now always independent accounts/records:
       * - A Web account's username IS its email (preferred) or phone.
       *   It is never overwritten by an app username.
       * - An App account's username is whatever was typed in the
       *   Username field.
       * - "Also grant App access" (create mode only) creates a SECOND,
       *   fully separate app-type account alongside the web one — it
       *   does not merge fields into a single record.
       */
      const resolvedUsername = isWeb
        ? formUser.email.trim()
          ? formUser.email.trim().toLowerCase()
          : `${formUser.countryCode}${formUser.phone.trim()}`
        : formUser.username.trim();

      if (isEditMode) {
       const updateData: any = {
  username: resolvedUsername,
  email:
    isWeb && formUser.email
      ? formUser.email.trim().toLowerCase()
      : null,
  phone:
    isWeb && formUser.phone
      ? `${formUser.countryCode}${formUser.phone.trim()}`
      : null,
  role_name: formUser.role,
  account_type: selectedPlatform,
};

        if (formUser.password && formUser.password !== "••••••••") {
          updateData.password = formUser.password;
        }

        const response = await authFetch(
          `${API_BASE}/users/${editingUserId}`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(updateData),
          },
        );

        if (!response.ok) {
          const errorData = await response.json();
          const detail = String(errorData.detail || "").toLowerCase();

          if (detail.includes("email already exists")) {
            setSnackbar({
              open: true,
              message: "Email already registered",
              severity: "warning",
            });
            return;
          }

          if (detail.includes("username already exists")) {
            setSnackbar({
              open: true,
              message: "Username already exists",
              severity: "warning",
            });
            return;
          }

          throw new Error(errorData.detail || "User update failed");
        }

        setUsers((previousUsers) =>
          previousUsers.map((user) =>
            user.id === editingUserId
              ? {
                  ...user,
                  username: resolvedUsername,
                  email: isWeb ? formUser.email.trim().toLowerCase() : "",
                  role: formUser.role,
                }
              : user,
          ),
        );

        setSnackbar({
          open: true,
          message: "User updated successfully!",
          severity: "success",
        });
      } else {
        const createAccount = async (payload: {
          username: string;
          email: string | null;
          phone: string | null;
          password: string;
          account_type: "web" | "app";
        }) => {
          const response = await authFetch(`${API_BASE}/users`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              username: payload.username,
              email: payload.email,
              phone: payload.phone,
              password: payload.password,
              role_name: formUser.role,
              account_type: payload.account_type,
              is_active: true,
            }),
          });

          if (!response.ok) {
            const errorData = await response.json();
            const detail = String(errorData.detail || "").toLowerCase();

            if (detail.includes("email already exists")) {
              throw new Error("Email already registered");
            }
            if (detail.includes("username already exists")) {
              throw new Error("Username already exists");
            }
            throw new Error(errorData.detail || "User creation failed");
          }

          return response.json();
        };

        // 1) Create the primary account (web or app, per the chosen platform)
        const result = await createAccount({
          username: resolvedUsername,
          email: isWeb && formUser.email ? formUser.email.trim().toLowerCase() : null,
          phone:
            isWeb && formUser.phone
              ? `${formUser.countryCode}${formUser.phone.trim()}`
              : null,
          password: formUser.password,
          account_type: isWeb ? "web" : "app",
        });

        const newUser = {
          id: result._id || result.id,
          username: resolvedUsername,
          email: isWeb ? formUser.email.trim().toLowerCase() : "",
          password: "••••••••",
          confirmPassword: "••••••••",
          role: formUser.role,
          active: true,
        };

        dispatch(addUserLocally(newUser));
        setUsers((previousUsers) => [...previousUsers, newUser]);

        // 2) If a Web user also wants app access, create a SEPARATE,
        //    independent app-type account — never merged into the web one.
        if (isWeb && formUser.grantAppAccess && formUser.username.trim()) {
          try {
            await createAccount({
              username: formUser.username.trim(),
              email: null,
              phone: null,
              password: formUser.password,
              account_type: "app",
            });
          } catch (appError: any) {
            setSnackbar({
              open: true,
              message: `Web user created, but app account failed: ${appError.message}`,
              severity: "warning",
            });
            await fetchUsersFromBackend();
            await fetchRoleAppsFromPermissions();
            closeAllUserModals();
            return;
          }
        }

        setSnackbar({
          open: true,
          message:
            isWeb && formUser.grantAppAccess
              ? "Web user and app account created successfully!"
              : selectedPlatform === "web"
                ? "Web user created successfully!"
                : "App user created successfully!",
          severity: "success",
        });
      }

      await fetchUsersFromBackend();
      await fetchRoleAppsFromPermissions();
      closeAllUserModals();
    } catch (error: any) {
      console.error("User save failed:", error);
      setSnackbar({
        open: true,
        message: error.message || "Something went wrong",
        severity: "error",
      });
    } finally {
      setIsSubmitting(false);
    }
  };


  const handleDeactivateUser = async (userId: string) => {
    try {
      const response = await authFetch(
        `${API_BASE}/users/${userId}/deactivate`,
        { method: "PATCH" },
      );

      if (!response.ok) {
        throw new Error("Unable to deactivate user");
      }

      dispatch(updateUserStatusLocally({ id: userId, active: false }));
      setUsers((previousUsers) =>
        previousUsers.map((user) =>
          user.id === userId ? { ...user, active: false } : user,
        ),
      );

      setSnackbar({
        open: true,
        message: "User deactivated successfully",
        severity: "success",
      });
    } catch (error: any) {
      setSnackbar({
        open: true,
        message: error.message || "Deactivate failed",
        severity: "error",
      });
    }
  };

  const handleRestoreUser = async (userId: string) => {
    try {
      const response = await authFetch(
        `${API_BASE}/users/${userId}/activate`,
        { method: "PATCH" },
      );

      if (!response.ok) {
        throw new Error("Unable to restore user");
      }

      dispatch(updateUserStatusLocally({ id: userId, active: true }));
      setUsers((previousUsers) =>
        previousUsers.map((user) =>
          user.id === userId ? { ...user, active: true } : user,
        ),
      );

      setSnackbar({
        open: true,
        message: "User restored successfully",
        severity: "success",
      });
    } catch (error: any) {
      setSnackbar({
        open: true,
        message: error.message || "Restore failed",
        severity: "error",
      });
    }
  };

  const openEditUser = (user: any) => {
    const platform: PlatformType = user.accountType === "app" ? "app" : "web";

    setEditingUserId(user.id);
    setSelectedPlatform(platform);
    setFormUser({
      id: user.id,
      username: platform === "app" ? user.username : "",
      email: user.email || "",
      phone: user.phone || "",
      countryCode: "+91",
      password: "••••••••",
      confirmPassword: "••••••••",
      role: user.role,
      active: user.active,
      // Web and App are now independent accounts — "grant app access" only
      // applies when creating a new account, never when editing one.
      grantAppAccess: false,
    });
    resetTouched();
    setCredentialModalOpen(true);
  };

  const fieldError = {
    username:
      touched.username &&
      !USERNAME_REGEX.test(formUser.username.trim()),
email:
  touched.email &&
  formUser.email.trim() !== "" &&
  !EMAIL_REGEX.test(formUser.email.trim()),

phone:
  touched.phone &&
  formUser.phone.trim() !== "" &&
  !PHONE_REGEX.test(formUser.phone.trim()),
    password:
      touched.password &&
      formUser.password !== "••••••••" &&
      !PASSWORD_REGEX.test(formUser.password),
    confirmPassword:
      touched.confirmPassword &&
      formUser.password !== formUser.confirmPassword,
    role: touched.role && !formUser.role,
  };

  return (
    <div className="min-h-screen bg-gray-50 px-6 pt-3 pb-6 text-gray-900">
      <div className="w-full">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 px-6 pt-4 pb-10 w-full">
      <div className="mb-6 flex items-center justify-between">
        <div className="w-80">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search user..."
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={startCreateUser}
            className="flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" />
            Add User
          </button>

          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-700">
              {showActive ? "Show Active" : "Show Inactive"}
            </span>

            <label className="relative inline-flex cursor-pointer items-center">
              <input
                type="checkbox"
                checked={showActive}
                onChange={(event) => setShowActive(event.target.checked)}
                className="peer sr-only"
              />
              <span className="h-6 w-11 rounded-full bg-gray-200 transition peer-checked:bg-blue-600" />
              <span className="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition peer-checked:translate-x-5" />
            </label>
          </div>
        </div>
      </div>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() =>
          setSnackbar((previous) => ({ ...previous, open: false }))
        }
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
      >
        <Alert
          onClose={() =>
            setSnackbar((previous) => ({ ...previous, open: false }))
          }
          severity={snackbar.severity}
          sx={{
            width: "100%",
            color: "#ffffff",
            ...(snackbar.severity === "success" && {
              backgroundColor: "#2e7d32",
            }),
            ...(snackbar.severity === "warning" && {
              backgroundColor: "#ed6c02",
            }),
            ...(snackbar.severity === "error" && {
              backgroundColor: "#d32f2f",
            }),
            "& .MuiAlert-icon": { color: "#ffffff" },
          }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>

      <div className="max-h-[calc(100vh-260px)] overflow-y-auto">
        <div className="sticky top-0 z-10 grid grid-cols-[60px_90px_1.3fr_110px_1fr_1.6fr_110px_130px] border-b border-gray-200 bg-gray-50 text-xs font-semibold">
          <div className="p-4 text-left uppercase text-gray-700">S.No</div>
          <div className="p-4 text-left uppercase text-gray-700">Type</div>
          <div className="p-4 text-left uppercase text-gray-700">Username</div>
          <div className="p-4 text-left uppercase text-gray-700">Password</div>
          <div className="p-4 text-left uppercase text-gray-700">Role</div>
          <div className="p-4 text-left uppercase text-gray-700">App</div>
          <div className="p-4 text-center uppercase text-gray-700">Status</div>
          <div className="p-4 text-center uppercase text-gray-700">Actions</div>
        </div>

        <div className="min-h-[200px] bg-white">
          {filteredUsers.length === 0 ? (
            <div className="flex w-full items-center justify-center border-b p-12 text-sm text-gray-500">
              No {showActive ? "active" : "inactive"} users found.
            </div>
          ) : (
            filteredUsers.map((user, index) => (
              <div
                key={user.id}
                className="grid grid-cols-[60px_90px_1.3fr_110px_1fr_1.6fr_110px_130px] border-b border-gray-200 text-sm transition hover:bg-gray-50"
              >
                <div className="flex items-center px-3 py-2 font-medium text-gray-700">
                  {index + 1}
                </div>

                <div className="flex items-center px-3 py-2">
                  <span
                    className={`rounded px-1.5 py-0.5 text-[10px] font-bold uppercase ${
                      user.accountType === "app"
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-blue-100 text-blue-600"
                    }`}
                  >
                    {user.accountType === "app" ? "App" : "Web"}
                  </span>
                </div>

                <div
                  className="flex items-center truncate px-3 py-2 text-gray-800"
                  title={user.username}
                >
                  {user.username}
                </div>

                <div className="flex items-center px-3 py-2 text-gray-600">
                  ••••••••
                </div>

                <div className="flex items-center px-3 py-2">
                  <span className="inline-flex whitespace-nowrap rounded-full bg-blue-100 px-4 py-2 text-xs font-medium text-blue-800">
                    {user.role}
                  </span>
                </div>

                <div className="flex items-center px-3 py-2">
                  {roleAppsMap[user.role]?.length ? (
                    <div className="flex flex-wrap gap-2">
                      {roleAppsMap[user.role].map((appName) => (
                        <span
                          key={appName}
                          className="whitespace-nowrap rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-800"
                        >
                          {appName}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-xs text-gray-400">—</span>
                  )}
                </div>

                <div className="flex items-center justify-center px-3 py-2">
                  <span
                    className={`rounded-full px-4 py-2 text-xs font-medium ${
                      user.active
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {user.active ? "Active" : "Inactive"}
                  </span>
                </div>

<div className="flex items-center justify-center px-3 py-2">
                  <div className="flex justify-center gap-4">
                    {isProtectedRole(user.role) ? (
                      <span
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-500"
                        title="Super Admin is the account owner — view only, cannot be edited or deleted"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        View only
                      </span>
                    ) : user.active ? (
                      <>
                        <button
                          onClick={() => openEditUser(user)}
                          className="rounded-lg border border-blue-200 p-2 text-blue-600 transition hover:bg-blue-50"
                          title="Edit User"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>

                        <button
                          onClick={() =>
                            setConfirmDialog({
                              open: true,
                              title: "Deactivate User",
                              message: `Are you sure you want to deactivate "${user.username}"?`,
                              onConfirm: () => {
                                handleDeactivateUser(user.id);
                                setConfirmDialog({
                                  open: false,
                                  title: "",
                                  message: "",
                                  onConfirm: () => {},
                                });
                              },
                            })
                          }
                          className="rounded-lg border border-red-200 p-2 text-red-600 transition hover:bg-red-50"
                          title="Deactivate User"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() =>
                          setConfirmDialog({
                            open: true,
                            title: "Restore User",
                            message: `Are you sure you want to restore "${user.username}"?`,
                            onConfirm: () => {
                              handleRestoreUser(user.id);
                              setConfirmDialog({
                                open: false,
                                title: "",
                                message: "",
                                onConfirm: () => {},
                              });
                            },
                          })
                        }
                        className="rounded-lg border border-green-200 p-2 text-green-600 transition hover:bg-green-50"
                        title="Restore User"
                      >
                        <RotateCcw className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {platformModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 px-4 backdrop-blur-[2px]">
          <div className="flex max-h-[calc(100vh-40px)] w-full max-w-[545px] flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex items-start justify-between border-b border-gray-100 px-7 py-6">
              <div>
                <h2 className="text-[22px] font-bold text-slate-800">
                  Create New User
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Select the platform type for this user account
                </p>
              </div>

              <button
                onClick={closeAllUserModals}
                className="rounded-lg p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="overflow-y-auto px-7 py-5">
              <div className="flex gap-3 rounded-xl border border-amber-300 bg-amber-50 px-4 py-4">
                <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-100">
                  <Info className="h-4 w-4 text-amber-600" />
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-amber-800">
                    Why do I need to choose Web or App?
                  </h3>
                  <p className="mt-1 text-[13px] leading-5 text-amber-700">
                    <strong>Web users</strong> access YENERP through a browser
                    on a laptop or desktop and require email and phone for
                    communication. <strong>App users</strong> access through
                    mobile or tablet devices and use a username for login.
                  </p>
                </div>
              </div>

              <div className="mt-6">
                <label className="text-sm font-semibold text-slate-700">
                  Select Platform Type <span className="text-red-500">*</span>
                </label>

                <div className="mt-3 grid grid-cols-2 gap-4">
                  <PlatformCard
                    selected={selectedPlatform === "web"}
                    icon={<Laptop className="h-6 w-6 text-blue-600" />}
                    iconClassName="bg-blue-100"
                    title="Web User"
                    description="For users accessing via browser on desktop/laptop. Requires email and phone verification."
                    tags={["Email", "Phone", "Password"]}
                    accent="blue"
                    onClick={() => setSelectedPlatform("web")}
                  />

                  <PlatformCard
                    selected={selectedPlatform === "app"}
                    icon={<Smartphone className="h-6 w-6 text-emerald-600" />}
                    iconClassName="bg-emerald-100"
                    title="App User"
                    description="For users accessing via mobile/tablet app. Uses username and password for login."
                    tags={["Username", "Password"]}
                    accent="green"
                    onClick={() => setSelectedPlatform("app")}
                  />
                </div>
              </div>

              <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4">
                <h3 className="text-xs font-bold uppercase tracking-wide text-slate-600">
                  Quick Comparison
                </h3>

                <div className="mt-3 grid grid-cols-[1fr_1fr_1fr] text-[12px] text-slate-600">
                  <div className="border-b border-slate-200 pb-2 font-medium">
                    Feature
                  </div>
                  <div className="border-b border-slate-200 pb-2 font-semibold text-blue-600">
                    Web User
                  </div>
                  <div className="border-b border-slate-200 pb-2 font-semibold text-emerald-600">
                    App User
                  </div>

                  <ComparisonRow
                    label="Login Method"
                    web="Browser (URL)"
                    app="Mobile App"
                  />
                  <ComparisonRow
                    label="Required Fields"
                    web="Email, Phone, Password"
                    app="Username, Password"
                  />
                  <ComparisonRow
                    label="Best For"
                    web="Office staff, Managers"
                    app="Field staff, Sales team"
                    last
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 border-t border-gray-100 px-7 py-5">
              <button
                onClick={closeAllUserModals}
                className="rounded-lg border border-slate-300 px-5 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
              >
                Cancel
              </button>

              <button
                onClick={continueToCredentials}
                disabled={!selectedPlatform}
                className={`rounded-lg px-5 py-2.5 text-sm font-semibold text-white transition ${
                  selectedPlatform
                    ? "bg-blue-600 hover:bg-blue-700"
                    : "cursor-not-allowed bg-slate-300"
                }`}
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      )}

      {credentialModalOpen && selectedPlatform && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 px-4 backdrop-blur-[2px]">
          <div className="flex max-h-[calc(100vh-40px)] w-full max-w-[500px] flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex items-start border-b border-gray-100 px-6 py-5">
              <button
                onClick={goBackToPlatform}
                className="mr-3 mt-1 rounded-lg p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span
                    className={`rounded px-2 py-0.5 text-[10px] font-bold uppercase ${
                      selectedPlatform === "web"
                        ? "bg-blue-100 text-blue-600"
                        : "bg-emerald-100 text-emerald-700"
                    }`}
                  >
                    {selectedPlatform}
                  </span>
                  <h2 className="text-[22px] font-bold text-slate-800">
                    {isEditMode ? "Edit" : "Create"}{" "}
                    {selectedPlatform === "web" ? "Web" : "App"} User
                  </h2>
                </div>

                <p className="mt-1 text-sm text-slate-500">
                  {selectedPlatform === "web"
                    ? "Fill in the credentials for browser access"
                    : "Fill in the credentials for mobile app access"}
                </p>
              </div>

              <button
                onClick={closeAllUserModals}
                className="ml-3 mt-1 rounded-lg p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="overflow-y-auto px-6 py-5">
              <div className="space-y-5">
                {selectedPlatform === "web" && (
                  <>
                    <FormField
                      label="Email Address"
                      helper="Enter Email OR Phone Number"
                      error={
                        fieldError.email
                          ? "Please enter a valid email address"
                          : ""
                      }
                    >
                      <input
                        type="email"
                        value={formUser.email}
                        placeholder="Enter email address"
                        onBlur={() =>
                          setTouched((previous) => ({
                            ...previous,
                            email: true,
                          }))
                        }
                        onChange={(event) =>
                          setFormUser((previous) => ({
                            ...previous,
                            email: event.target.value,
                          }))
                        }
                        className={inputClass(Boolean(fieldError.email))}
                      />
                    </FormField>

                    <FormField
                      label="Phone Number"
                      helper="Enter Phone Number OR Email Address"
                      error={
                        fieldError.phone
                          ? "Please enter a valid phone number"
                          : ""
                      }
                    >
                      <div className="flex gap-2">
                        <div className="relative w-[84px] shrink-0">
                          <select
                            value={formUser.countryCode}
                            onChange={(event) =>
                              setFormUser((previous) => ({
                                ...previous,
                                countryCode: event.target.value,
                              }))
                            }
                            className={`${inputClass(false)} appearance-none pr-8`}
                          >
                            <option value="+91">+91</option>
                            <option value="+1">+1</option>
                            <option value="+44">+44</option>
                            <option value="+971">+971</option>
                            <option value="+65">+65</option>
                          </select>
                          <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        </div>

                        <input
                          type="tel"
                          inputMode="numeric"
                          value={formUser.phone}
                          placeholder="Enter phone number"
                          onBlur={() =>
                            setTouched((previous) => ({
                              ...previous,
                              phone: true,
                            }))
                          }
                          onChange={(event) =>
                            setFormUser((previous) => ({
                              ...previous,
                              phone: event.target.value.replace(/\D/g, ""),
                            }))
                          }
                          className={inputClass(Boolean(fieldError.phone))}
                        />
                      </div>
                    </FormField>

                    {!isEditMode && formUser.grantAppAccess && (
                      <FormField
                        label="Username"
                        required
                        helper="This username will be used for mobile app login"
                        helperClassName="text-blue-600"
                        error={
                          fieldError.username
                            ? "Username must contain at least 4 characters"
                            : ""
                        }
                      >
                        <input
                          value={formUser.username}
                          placeholder="Enter username for app access"
                          onBlur={() =>
                            setTouched((previous) => ({
                              ...previous,
                              username: true,
                            }))
                          }
                          onChange={(event) =>
                            setFormUser((previous) => ({
                              ...previous,
                              username: event.target.value,
                            }))
                          }
                          className={inputClass(Boolean(fieldError.username))}
                        />
                      </FormField>
                    )}
                  </>
                )}

                {selectedPlatform === "app" && (
                  <FormField
                    label="Username"
                    required
                    error={
                      fieldError.username
                        ? "Username must contain at least 4 characters"
                        : ""
                    }
                  >
                    <input
                      value={formUser.username}
                      placeholder="Enter username"
                      onBlur={() =>
                        setTouched((previous) => ({
                          ...previous,
                          username: true,
                        }))
                      }
                      onChange={(event) =>
                        setFormUser((previous) => ({
                          ...previous,
                          username: event.target.value,
                        }))
                      }
                      className={inputClass(Boolean(fieldError.username))}
                    />
                  </FormField>
                )}

                <FormField
                  label="Password"
                  required
                  error={
                    fieldError.password
                      ? "Use 8+ characters with uppercase, lowercase, number and special character"
                      : ""
                  }
                >
                  <PasswordInput
                    value={formUser.password}
                    placeholder="Enter password"
                    visible={showPassword}
                    hasError={Boolean(fieldError.password)}
                    onToggle={() => setShowPassword((value) => !value)}
                    onBlur={() =>
                      setTouched((previous) => ({
                        ...previous,
                        password: true,
                      }))
                    }
                    onChange={(value) =>
                      setFormUser((previous) => ({
                        ...previous,
                        password: value,
                      }))
                    }
                  />
                </FormField>

                <FormField
                  label="Confirm Password"
                  required
                  error={
                    fieldError.confirmPassword
                      ? "Passwords do not match"
                      : ""
                  }
                >
                  <PasswordInput
                    value={formUser.confirmPassword}
                    placeholder="Confirm password"
                    visible={showConfirmPassword}
                    hasError={Boolean(fieldError.confirmPassword)}
                    onToggle={() =>
                      setShowConfirmPassword((value) => !value)
                    }
                    onBlur={() =>
                      setTouched((previous) => ({
                        ...previous,
                        confirmPassword: true,
                      }))
                    }
                    onChange={(value) =>
                      setFormUser((previous) => ({
                        ...previous,
                        confirmPassword: value,
                      }))
                    }
                  />
                </FormField>

                <FormField
                  label="Role"
                  required
                  error={fieldError.role ? "Please select a role" : ""}
                >
                  <div className="relative">
                    <select
                      value={formUser.role}
                      onBlur={() =>
                        setTouched((previous) => ({
                          ...previous,
                          role: true,
                        }))
                      }
                      onChange={(event) =>
                        setFormUser((previous) => ({
                          ...previous,
                          role: event.target.value,
                        }))
                      }
                      className={`${inputClass(Boolean(fieldError.role))} appearance-none pr-10`}
                    >
                      <option value="">-- Select Role --</option>
                      {roles.map((role) => (
                        <option key={role.id} value={role.name}>
                          {role.name} ({role.role_type})
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  </div>

                  {roles.length === 0 && (
                    <p className="mt-1 text-xs text-red-500">
                      No roles available. Create a role in Role Management
                      first.
                    </p>
                  )}
                </FormField>

                {selectedPlatform === "web" && !isEditMode && (
                  <div className="flex items-center justify-between rounded-xl border border-blue-200 bg-blue-50 px-4 py-4">
                    <div>
                      <p className="text-sm font-semibold text-blue-700">
                        Also grant App access?
                      </p>
                      <p className="mt-0.5 text-xs text-blue-600">
                        Creates a separate app login for this user, using the
                        same role
                      </p>
                    </div>

                    <label className="relative inline-flex cursor-pointer items-center">
                      <input
                        type="checkbox"
                        checked={formUser.grantAppAccess}
                        onChange={(event) =>
                          setFormUser((previous) => ({
                            ...previous,
                            grantAppAccess: event.target.checked,
                            username: event.target.checked
                              ? previous.username
                              : "",
                          }))
                        }
                        className="peer sr-only"
                      />
                      <span className="h-6 w-11 rounded-full bg-slate-300 transition peer-checked:bg-blue-600" />
                      <span className="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition peer-checked:translate-x-5" />
                    </label>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-3 border-t border-gray-100 px-6 py-5">
              <button
                onClick={goBackToPlatform}
                className="rounded-lg border border-slate-300 px-5 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
              >
                Back
              </button>

              <button
                disabled={isSubmitting}
                onClick={() => {
                  if (!isEditMode) {
                    handleSaveUser();
                    return;
                  }

                  setConfirmDialog({
                    open: true,
                    title: "Update User",
                    message: `Are you sure you want to update user "${
                      formUser.username || formUser.email
                    }"?`,
                    onConfirm: () => {
                      handleSaveUser();
                      setConfirmDialog({
                        open: false,
                        title: "",
                        message: "",
                        onConfirm: () => {},
                      });
                    },
                  });
                }}
                className={`rounded-lg px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition ${
                  isSubmitting
                    ? "cursor-not-allowed bg-slate-400"
                    : selectedPlatform === "web"
                      ? "bg-blue-600 hover:bg-blue-700"
                      : "bg-emerald-600 hover:bg-emerald-700"
                }`}
              >
                {isSubmitting
                  ? "Please wait..."
                  : isEditMode
                    ? "Update User"
                    : selectedPlatform === "web"
                      ? "Create Web User"
                      : "Create App User"}
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmDialog.open && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 px-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-xl bg-white p-6 text-center shadow-2xl">
            <h3 className="mb-2 text-lg font-semibold text-gray-800">
              {confirmDialog.title}
            </h3>
            <p className="mb-6 text-gray-600">{confirmDialog.message}</p>

            <div className="flex justify-center gap-4">
              <button
                onClick={() =>
                  setConfirmDialog({
                    open: false,
                    title: "",
                    message: "",
                    onConfirm: () => {},
                  })
                }
                className="rounded-lg bg-gray-200 px-4 py-2 transition hover:bg-gray-300"
              >
                Cancel
              </button>

              <button
                onClick={confirmDialog.onConfirm}
                className="rounded-lg bg-blue-600 px-4 py-2 text-white transition hover:bg-blue-700"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
      </div>
    </div>
  );
}

function PlatformCard({
  selected,
  icon,
  iconClassName,
  title,
  description,
  tags,
  accent,
  onClick,
}: {
  selected: boolean;
  icon: React.ReactNode;
  iconClassName: string;
  title: string;
  description: string;
  tags: string[];
  accent: "blue" | "green";
  onClick: () => void;
}) {
  const selectedClass =
    accent === "blue"
      ? "border-blue-500 bg-blue-50"
      : "border-emerald-500 bg-emerald-50";

  const ringClass =
    accent === "blue" ? "border-blue-500" : "border-emerald-500";

  const dotClass = accent === "blue" ? "bg-blue-500" : "bg-emerald-500";

  const tagClass =
    accent === "blue"
      ? "bg-blue-100 text-blue-600"
      : "bg-emerald-100 text-emerald-700";

  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative min-h-[250px] rounded-xl border-2 p-5 text-left transition hover:shadow-sm ${
        selected ? selectedClass : "border-slate-200 bg-white"
      }`}
    >
      <span
        className={`absolute right-4 top-4 flex h-5 w-5 items-center justify-center rounded-full border-2 ${
          selected ? ringClass : "border-slate-300"
        }`}
      >
        {selected && <span className={`h-2.5 w-2.5 rounded-full ${dotClass}`} />}
      </span>

      <span
        className={`flex h-12 w-12 items-center justify-center rounded-xl ${iconClassName}`}
      >
        {icon}
      </span>

      <h3 className="mt-4 text-lg font-bold text-slate-800">{title}</h3>
      <p className="mt-1 text-[13px] leading-5 text-slate-500">
        {description}
      </p>

      <div className="mt-4 flex flex-wrap gap-1.5">
        {tags.map((tag) => (
          <span
            key={tag}
            className={`rounded px-2 py-1 text-[11px] font-medium ${tagClass}`}
          >
            {tag}
          </span>
        ))}
      </div>
    </button>
  );
}

function ComparisonRow({
  label,
  web,
  app,
  last = false,
}: {
  label: string;
  web: string;
  app: string;
  last?: boolean;
}) {
  const borderClass = last ? "" : "border-b border-slate-200";

  return (
    <>
      <div className={`${borderClass} py-2`}>{label}</div>
      <div className={`${borderClass} py-2 pr-2`}>{web}</div>
      <div className={`${borderClass} py-2`}>{app}</div>
    </>
  );
}

function FormField({
  label,
  required = false,
  helper,
  helperClassName = "text-slate-400",
  error,
  children,
}: {
  label: string;
  required?: boolean;
  helper?: string;
  helperClassName?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-semibold text-slate-700">
        {label} {required && <span className="text-red-500">*</span>}
      </label>

      {children}

      {error ? (
        <p className="mt-1.5 text-xs text-red-500">{error}</p>
      ) : helper ? (
        <p className={`mt-1.5 text-xs ${helperClassName}`}>{helper}</p>
      ) : null}
    </div>
  );
}

function PasswordInput({
  value,
  placeholder,
  visible,
  hasError,
  onToggle,
  onBlur,
  onChange,
}: {
  value: string;
  placeholder: string;
  visible: boolean;
  hasError: boolean;
  onToggle: () => void;
  onBlur: () => void;
  onChange: (value: string) => void;
}) {
  return (
    <div className="relative">
      <input
        type={visible ? "text" : "password"}
        value={value}
        placeholder={placeholder}
        onBlur={onBlur}
        onChange={(event) => onChange(event.target.value)}
        className={`${inputClass(hasError)} pr-11`}
      />

      <button
        type="button"
        onClick={onToggle}
        tabIndex={-1}
        className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-1 text-slate-400 transition hover:text-slate-700"
      >
        {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  );
}

function inputClass(hasError: boolean) {
  return `h-11 w-full rounded-lg border bg-white px-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 ${
    hasError
      ? "border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/15"
      : "border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15"
  }`;
}