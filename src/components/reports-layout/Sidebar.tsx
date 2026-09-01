"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import {
  HiOutlineArrowRightOnRectangle,
  HiOutlineCog6Tooth,
  HiOutlineMagnifyingGlass,
  HiOutlineSquares2X2,
  HiOutlineXMark,
} from "react-icons/hi2";
import { FaShoppingCart, FaCashRegister } from "react-icons/fa";
// import LogoutConfirmDialog from "@/components/layout/LogoutConfirmDialog";
import LogoutConfirmDialog from "@/components/reports-layout/LogoutConfirmDialog";
import { usePreferences } from "@/components/preferences/PreferencesContext";
import { useAppSnackbar } from "@/components/snackbar/SnackbarProvider";
import { clearSessionAuth, releaseActiveLock } from "@/lib/sessionSecurity";
// import { logout } from "@/redux/slices/authSlice";
import { forceLogout as logout } from "@/features/authSlice";
import { RootState } from "@/redux/store";

export interface SubMenuItem {
  label: string;
  path: string;
}

export interface MenuItem {
  label: string;
  path: string;
  icon: React.ReactNode;
}

export interface ModuleItem {
  id: string;
  label: string;
  shortLabel: string;
  color: string;
  bg: string;
  border: string;
  icon: React.ReactNode;
  children: SubMenuItem[];
}

const APP_BLUE = "#2563eb";

export const defaultModules: ModuleItem[] = [
  {
    id: "dashboard",
    label: "Dashboard",
    shortLabel: "Home",
    color: APP_BLUE,
    bg: "#eff6ff",
    border: "#bfdbfe",
    icon: <HiOutlineSquares2X2 size={14} />,
    children: [{ label: "ERP Dashboard", path: "/QlikReport" }],
  },
  {
    id: "purchase",
    label: "Yen-Purchase",
    shortLabel: "Purchase",
    color: APP_BLUE,
    bg: "#eff6ff",
    border: "#bfdbfe",
    icon: <FaShoppingCart size={14} />,
    children: [
      {
        label: "Purchase Orders",
        path: "/QlikReport/PurchaseOrder/Purchaseorder",
      },
      { label: "GRN Against PO", path: "/QlikReport/PurchaseOrder/grn" },
      { label: "GRN by Item", path: "/QlikReport/PurchaseOrder/Itemwisedate" },
      { label: "AP Invoice", path: "/QlikReport/PurchaseOrder/Apinvoice" },
      {
        label: "AP Invoice Service",
        path: "/QlikReport/PurchaseOrder/Apinvoiceservice",
      },
      {
        label: "Outgoing Payments",
        path: "/QlikReport/PurchaseOrder/Outgoing",
      },
      {
        label: "Outstanding Payments",
        path: "/QlikReport/PurchaseOrder/Outstanding",
      },
      {
        label: "Dispatches -RM",
        path: "/QlikReport/PurchaseOrder/rawmaterial2",
      },
      {
        label: "Debit Note by Item",
        path: "/QlikReport/PurchaseOrder/DebitnoteItemwise",
      },
      {
        label: "Debit Note by Amount",
        path: "/QlikReport/PurchaseOrder/DebitnoteAmountwise",
      },
      {
        label: "Petty Cash Expenses",
        path: "/QlikReport/PurchaseOrder/PettycashExpense",
      },
      {
        label: "Warehouse Stock",
        path: "/QlikReport/PurchaseOrder/WarehouseStock",
      },
    ],
  },
  {
    id: "pos",
    label: "Yen-POS",
    shortLabel: "POS",
    color: APP_BLUE,
    bg: "#eff6ff",
    border: "#bfdbfe",
    icon: <FaCashRegister size={14} />,
    children: [
      { label: "Production Entries", path: "/QlikReport/Pos/productionEntry1" },
      { label: "Dispatches", path: "/QlikReport/Pos/Dispatchall" },
      { label: "Dispatch Receive", path: "/QlikReport/Pos/DispatchReceive" },
      { label: "Sales Orders", path: "/QlikReport/Pos/saleOrder" },
      { label: "Sales by Item", path: "/QlikReport/Pos/itemwise" },
      { label: "Sales by Order", path: "/QlikReport/Pos/ItemOrder" },
      { label: "Item Transfers", path: "/QlikReport/Pos/Itemtransfer" },
      { label: "Wastage", path: "/QlikReport/Pos/wastageEntry" },
      { label: "Wastage Received", path: "/QlikReport/Pos/wastageRec" },
      { label: "Warehouse Returns", path: "/QlikReport/Pos/wastageReceive" },
      { label: "Day-End Sales", path: "/QlikReport/Pos/dayend" },
      { label: "Sales Summary", path: "/QlikReport/Pos/SalasReport" },
      { label: "Stock Closing", path: "/QlikReport/Pos/stockclosing" },
    ],
  },
];

const norm = (p?: string | null) => (p ?? "").replace(/\/+$/, "").toLowerCase();

const isPathActive = (pathname: string | null, targetPath: string) => {
  const current = norm(pathname);
  const target = norm(targetPath);

  if (target === "/qlikreport") return current === target;
  return current === target || current.startsWith(`${target}/`);
};

const isModulePathActive = (pathname: string | null, module: ModuleItem) =>
  module.children.some((child) => isPathActive(pathname, child.path));

const getActiveModuleId = (pathname: string | null, modules: ModuleItem[]) => {
  return (
    modules.find((module) => isModulePathActive(pathname, module))?.id ?? null
  );
};

interface SidebarProps {
  collapsed?: boolean;
  mobileOpen?: boolean;
  onToggle?: (collapsed: boolean) => void;
  onMobileClose?: () => void;
  modules?: ModuleItem[];
}

const Sidebar: React.FC<SidebarProps> = ({
  collapsed = false,
  mobileOpen = false,
  onToggle,
  onMobileClose,
  modules = defaultModules,
}) => {
  const pathname = usePathname();
  const router = useRouter();
  const dispatch = useDispatch();
  const { notify } = useAppSnackbar();
  const { preferences, resolvedThemeMode, openDrawer } = usePreferences();

  const username =
    useSelector((state: RootState) => state.auth.username) || "Admin";

  const dark = resolvedThemeMode === "dark";
  const primaryColor = preferences.theme.primaryColor || APP_BLUE;

  const [logoutOpen, setLogoutOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [openModuleId, setOpenModuleId] = useState<string | null>(() =>
    getActiveModuleId(pathname, modules),
  );

  const filteredModules = useMemo(() => {
    const q = search.trim().toLowerCase();

    if (!q) return modules;

    return modules
      .map((module) => {
        const moduleMatch =
          module.label.toLowerCase().includes(q) ||
          module.shortLabel.toLowerCase().includes(q);

        const children = module.children.filter(
          (child) =>
            child.label.toLowerCase().includes(q) ||
            child.path.toLowerCase().includes(q),
        );

        if (moduleMatch) return module;
        if (children.length > 0) return { ...module, children };

        return null;
      })
      .filter(Boolean) as ModuleItem[];
  }, [modules, search]);

  useEffect(() => {
    const activeId = getActiveModuleId(pathname, modules);

    if (activeId && !search.trim()) {
      setOpenModuleId(activeId);
    }
  }, [modules, pathname, search]);

  useEffect(() => {
    if (!search.trim()) return;

    const firstMatchedModule = filteredModules[0]?.id ?? null;
    setOpenModuleId(firstMatchedModule);
  }, [filteredModules, search]);

  const handleLogout = useCallback(() => {
    clearSessionAuth();
    releaseActiveLock();
    dispatch(logout());
    setLogoutOpen(false);
    onMobileClose?.();
    notify("Logout successful.", "success");
    router.replace("/");
  }, [dispatch, notify, onMobileClose, router]);

  const toggleModule = useCallback(
    (id: string) => {
      if (collapsed) {
        onToggle?.(false);
        setOpenModuleId(id);
        return;
      }

      setOpenModuleId((current) => (current === id ? null : id));
    },
    [collapsed, onToggle],
  );

  const width = collapsed ? 64 : 236;

  const totalReports = useMemo(
    () => modules.reduce((sum, mod) => sum + mod.children.length, 0),
    [modules],
  );

  const filteredReportCount = useMemo(
    () => filteredModules.reduce((sum, mod) => sum + mod.children.length, 0),
    [filteredModules],
  );

  const panelStyle: React.CSSProperties = {
    width,
    background: dark
      ? "linear-gradient(180deg, #020617 0%, #0f172a 52%, #020617 100%)"
      : "linear-gradient(180deg, #ffffff 0%, #f8fafc 52%, #ffffff 100%)",
    borderColor: dark ? "#1e293b" : "#e2e8f0",
    color: dark ? "#e5e7eb" : "#0f172a",
    boxShadow: dark
      ? "12px 0 34px rgb(0 0 0 / 0.28)"
      : "12px 0 34px rgb(148 163 184 / 0.16)",
  };

  const mutedText = dark ? "#cbd5e1" : "#64748b";
  const strongText = dark ? "#f8fafc" : "#0f172a";
  const borderColor = dark ? "#334155" : "#e2e8f0";
  const softBg = dark ? "#1e293b" : "#f8fafc";
  const inputBg = dark ? "#1e293b" : "#ffffff";

  return (
    <>
      {mobileOpen ? (
        <div
          className="fixed inset-0 z-40 bg-slate-950/50 backdrop-blur-[2px] lg:hidden"
          onClick={onMobileClose}
        />
      ) : null}

      <aside
        style={panelStyle}
        className={[
          "fixed left-0 top-0 z-50 flex h-[100dvh] max-h-[100dvh] flex-col overflow-hidden border-r",
          "transition-[width,transform] duration-300 ease-out",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        ].join(" ")}
      >
        <div
          className="flex h-[58px] shrink-0 items-center gap-2.5 border-b"
          style={{
            padding: collapsed ? "0 8px" : "0 12px",
            borderColor,
          }}
        >
          <div
            className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-2xl border shadow-sm"
            style={{
              background: dark ? "#1e293b" : "#ffffff",
              borderColor,
              boxShadow: `0 8px 20px ${primaryColor}16`,
            }}
          >
            {preferences.branding.clientLogoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={preferences.branding.clientLogoUrl}
                alt="Client logo"
                className="h-full w-full object-contain p-1"
              />
            ) : (
              <span
                className="text-sm font-black"
                style={{ color: primaryColor }}
              >
                {(preferences.branding.companyName || "Y")[0]?.toUpperCase()}
              </span>
            )}
          </div>

          {!collapsed ? (
            <div className="min-w-0 flex-1 overflow-hidden">
              <div
                className="truncate text-[13px] font-black leading-tight"
                style={{ color: strongText }}
              >
                {preferences.branding.companyName || "Yen ERP"}
              </div>
              <div
                className="mt-0.5 truncate text-[9px] font-bold uppercase tracking-[1.8px]"
                style={{ color: dark ? "#64748b" : "#94a3b8" }}
              >
                {preferences.branding.reportName || "Qlik Analytics"}
              </div>
            </div>
          ) : null}

          <button
            type="button"
            onClick={() => onToggle?.(!collapsed)}
            className="ml-auto hidden h-8 w-8 shrink-0 items-center justify-center rounded-xl transition hover:scale-105 lg:inline-flex"
            style={{
              background: collapsed ? "transparent" : softBg,
              color: mutedText,
              border: collapsed ? "none" : `1px solid ${borderColor}`,
            }}
            aria-label="Toggle sidebar"
          >
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              {collapsed ? (
                <path d="M9 18l6-6-6-6" />
              ) : (
                <path d="M15 18l-6-6 6-6" />
              )}
            </svg>
          </button>

          <button
            type="button"
            onClick={onMobileClose}
            className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-xl transition hover:scale-105 lg:hidden"
            style={{
              background: softBg,
              color: mutedText,
              border: `1px solid ${borderColor}`,
            }}
            aria-label="Close sidebar"
          >
            <HiOutlineXMark size={15} />
          </button>
        </div>

        {!collapsed ? (
          <div className="shrink-0 px-3 pb-2.5 pt-3">
            <div
              className="group flex h-9 items-center gap-2 rounded-2xl border px-3 transition-all duration-200 focus-within:ring-2"
              style={{
                background: inputBg,
                borderColor,
                color: mutedText,
                boxShadow: dark
                  ? "inset 0 1px 0 rgb(255 255 255 / 0.04)"
                  : "0 1px 2px rgb(15 23 42 / 0.04)",
              }}
            >
              <HiOutlineMagnifyingGlass
                size={15}
                className="shrink-0 transition-transform duration-200 group-focus-within:scale-110"
                style={{ color: search ? primaryColor : mutedText }}
              />

              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search reports..."
                className="min-w-0 flex-1 bg-transparent text-[11.5px] font-bold outline-none"
                style={{
                  color: strongText,
                }}
              />

              {search ? (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="flex h-5 w-5 items-center justify-center rounded-full transition hover:scale-105"
                  style={{
                    background: dark ? "#1e293b" : "#f1f5f9",
                    color: mutedText,
                  }}
                >
                  <HiOutlineXMark size={12} />
                </button>
              ) : null}
            </div>

            <div className="mt-3 flex items-center justify-between px-1">
              <span
                className="text-[9px] font-black uppercase tracking-[2px]"
                style={{ color: dark ? "#64748b" : "#94a3b8" }}
              >
                Modules
              </span>

              <span
                className="rounded-full border px-2 py-0.5 text-[9px] font-black"
                style={{
                  background: `${primaryColor}14`,
                  borderColor: `${primaryColor}26`,
                  color: primaryColor,
                }}
              >
                {search ? filteredReportCount : totalReports}
              </span>
            </div>
          </div>
        ) : null}

        <nav
          className="sidebar-scroll flex-1 overflow-y-auto overflow-x-hidden"
          style={{
            padding: collapsed ? "10px 7px 8px" : "2px 8px 16px",
          }}
        >
          {!collapsed && filteredModules.length === 0 ? (
            <div
              className="mt-4 rounded-2xl border p-4 text-center"
              style={{
                background: softBg,
                borderColor,
              }}
            >
              <p className="text-xs font-black" style={{ color: strongText }}>
                No reports found
              </p>
              <p
                className="mt-1 text-[11px] font-medium"
                style={{ color: mutedText }}
              >
                Try another keyword
              </p>
            </div>
          ) : null}

          {filteredModules.map((module) => {
            const isOpen = openModuleId === module.id;
            const hasActiveChild = isModulePathActive(pathname, module);

            const moduleColor = primaryColor;
            const activeBg = dark ? `${primaryColor}24` : `${primaryColor}12`;
            const moduleIdleBg = "transparent";
            const moduleHoverBg = dark ? "#1e293b" : "#f1f5f9";
            const iconIdleBg = dark ? "#1e293b" : "#ffffff";
            const childLine = dark ? "#334155" : "#dbeafe";

            return (
              <div key={module.id} style={{ marginBottom: collapsed ? 8 : 5 }}>
                <button
                  type="button"
                  title={collapsed ? module.label : undefined}
                  onClick={() => toggleModule(module.id)}
                  className={[
                    "group relative flex w-full transition-all duration-200",
                    collapsed
                      ? "min-h-[48px] flex-col items-center justify-center gap-1 rounded-2xl px-1 py-2"
                      : "items-center rounded-2xl px-2 py-2",
                    !collapsed ? "hover:-translate-y-[1px]" : "",
                  ].join(" ")}
                  style={{
                    gap: collapsed ? undefined : 8,
                    background: hasActiveChild
                      ? activeBg
                      : isOpen && !collapsed
                        ? moduleHoverBg
                        : moduleIdleBg,
                    boxShadow: hasActiveChild
                      ? `0 10px 24px ${primaryColor}18`
                      : "none",
                  }}
                  onMouseEnter={(e) => {
                    if (hasActiveChild) return;
                    e.currentTarget.style.background = moduleHoverBg;
                  }}
                  onMouseLeave={(e) => {
                    if (hasActiveChild) return;
                    e.currentTarget.style.background =
                      isOpen && !collapsed ? moduleHoverBg : moduleIdleBg;
                  }}
                >
                  {hasActiveChild && !collapsed ? (
                    <span
                      className="absolute bottom-1/4 left-0 top-1/4 w-[3px] rounded-full"
                      style={{ background: moduleColor }}
                    />
                  ) : null}

                  <span
                    className="flex shrink-0 items-center justify-center transition-all duration-200 group-hover:scale-105"
                    style={{
                      width: collapsed ? 34 : 30,
                      height: collapsed ? 34 : 30,
                      borderRadius: collapsed ? 14 : 11,
                      background: hasActiveChild ? moduleColor : iconIdleBg,
                      color: hasActiveChild ? "#ffffff" : mutedText,
                      border: hasActiveChild
                        ? "none"
                        : `1px solid ${borderColor}`,
                      boxShadow: hasActiveChild
                        ? `0 8px 18px ${primaryColor}26`
                        : "none",
                    }}
                  >
                    {module.icon}
                  </span>

                  {!collapsed ? (
                    <>
                      <div className="min-w-0 flex-1 text-left">
                        <div
                          className="truncate text-[12px] font-black leading-snug"
                          style={{
                            color: hasActiveChild ? moduleColor : strongText,
                          }}
                        >
                          {module.label}
                        </div>
                        <div
                          className="mt-0.5 text-[10px] font-semibold leading-none"
                          style={{ color: mutedText }}
                        >
                          {module.children.length} reports
                        </div>
                      </div>

                      <svg
                        width="9"
                        height="9"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke={hasActiveChild ? moduleColor : mutedText}
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        style={{
                          transition: "transform 0.22s",
                          transform: isOpen ? "rotate(90deg)" : "rotate(0deg)",
                        }}
                      >
                        <path d="M9 18l6-6-6-6" />
                      </svg>
                    </>
                  ) : (
                    <>
                      <span
                        className="block max-w-[52px] truncate text-center text-[8.5px] font-black uppercase leading-none tracking-wide"
                        style={{
                          color: hasActiveChild ? moduleColor : mutedText,
                        }}
                      >
                        {module.shortLabel}
                      </span>

                      {hasActiveChild ? (
                        <span
                          className="absolute right-1.5 top-1.5 h-[5px] w-[5px] rounded-full"
                          style={{ background: moduleColor }}
                        />
                      ) : null}
                    </>
                  )}
                </button>

                {!collapsed && isOpen ? (
                  <div
                    className="ml-5 mt-1.5 space-y-1 overflow-hidden pb-1 transition-all duration-300"
                    style={{
                      paddingLeft: 8,
                      borderLeft: `1.5px solid ${childLine}`,
                    }}
                  >
                    {module.children.map((child) => {
                      const active = isPathActive(pathname, child.path);

                      return (
                        <Link
                          key={child.path}
                          href={child.path}
                          prefetch={false}
                          onClick={onMobileClose}
                          title={child.label}
                          className="group/link flex h-[30px] items-center gap-2 rounded-xl px-2 text-[11px] transition-all duration-150 hover:translate-x-0.5"
                          style={{
                            fontWeight: active ? 900 : 700,
                            color: active ? moduleColor : mutedText,
                            background: active ? activeBg : "transparent",
                          }}
                          onMouseEnter={(e) => {
                            if (active) return;
                            e.currentTarget.style.background = dark
                              ? "#1e293b"
                              : "#f8fafc";
                          }}
                          onMouseLeave={(e) => {
                            if (active) return;
                            e.currentTarget.style.background = "transparent";
                          }}
                        >
                          <span
                            className="h-[5px] w-[5px] shrink-0 rounded-full transition-all duration-150 group-hover/link:scale-125"
                            style={{
                              background: active
                                ? moduleColor
                                : dark
                                  ? "#475569"
                                  : "#cbd5e1",
                            }}
                          />
                          <span className="truncate">{child.label}</span>
                        </Link>
                      );
                    })}
                  </div>
                ) : null}
              </div>
            );
          })}
        </nav>

        <div
          className="shrink-0 border-t"
          style={{
            borderColor,
            padding: collapsed
              ? "7px 7px calc(7px + env(safe-area-inset-bottom))"
              : "8px 10px calc(8px + env(safe-area-inset-bottom))",
          }}
        >
          <div
            className="flex items-center"
            style={{
              gap: collapsed ? 0 : 8,
              justifyContent: collapsed ? "center" : "flex-start",
            }}
          >
            <div
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-[12px] font-black"
              style={{
                background: dark ? "#1e293b" : "#ffffff",
                borderColor,
                color: primaryColor,
              }}
              title={username}
            >
              {username[0]?.toUpperCase()}
            </div>

            {!collapsed ? (
              <>
                <div className="min-w-0 flex-1">
                  <div
                    className="truncate text-[11.5px] font-black"
                    style={{ color: strongText }}
                  >
                    {username}
                  </div>
                  <div
                    className="mt-0.5 text-[9.5px] font-semibold"
                    style={{ color: mutedText }}
                  >
                    Authenticated
                  </div>
                </div>

                <button
                  type="button"
                  onClick={openDrawer}
                  className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border transition hover:scale-105"
                  style={{
                    background: inputBg,
                    borderColor,
                    color: mutedText,
                  }}
                  title="Settings"
                >
                  <HiOutlineCog6Tooth size={14} />
                </button>

                <button
                  type="button"
                  onClick={() => setLogoutOpen(true)}
                  className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border transition hover:scale-105"
                  style={{
                    background: dark ? "rgb(127 29 29 / 0.20)" : "#ffffff",
                    borderColor: dark ? "rgb(127 29 29 / 0.55)" : "#fecaca",
                    color: dark ? "#fca5a5" : "#ef4444",
                  }}
                  title="Logout"
                >
                  <HiOutlineArrowRightOnRectangle size={14} />
                </button>
              </>
            ) : null}
          </div>

          {collapsed ? (
            <div className="mt-2 flex flex-col gap-1.5">
              <button
                type="button"
                onClick={openDrawer}
                className="inline-flex h-8 w-full items-center justify-center rounded-xl border transition hover:scale-105"
                style={{
                  background: inputBg,
                  borderColor,
                  color: mutedText,
                }}
                title="Settings"
              >
                <HiOutlineCog6Tooth size={14} />
              </button>

              <button
                type="button"
                onClick={() => setLogoutOpen(true)}
                className="inline-flex h-8 w-full items-center justify-center rounded-xl border transition hover:scale-105"
                style={{
                  background: dark ? "rgb(127 29 29 / 0.20)" : "#ffffff",
                  borderColor: dark ? "rgb(127 29 29 / 0.55)" : "#fecaca",
                  color: dark ? "#fca5a5" : "#ef4444",
                }}
                title="Logout"
              >
                <HiOutlineArrowRightOnRectangle size={14} />
              </button>
            </div>
          ) : null}
        </div>
      </aside>

      <LogoutConfirmDialog
        open={logoutOpen}
        onClose={() => setLogoutOpen(false)}
        onConfirm={handleLogout}
      />
    </>
  );
};

export default Sidebar;
