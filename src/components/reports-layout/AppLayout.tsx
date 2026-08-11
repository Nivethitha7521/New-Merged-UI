"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useDispatch } from "react-redux";
import Sidebar from "@/components/reports-layout/Sidebar";
import Topbar from "@/components/reports-layout/Topbar";
import { usePreferences } from "@/components/preferences/PreferencesContext";
import {
  TopBarProvider,
  useTopBarContext,
} from "@/components/reports-layout/topbar-context";
import { useAppSnackbar } from "@/components/snackbar/SnackbarProvider";
import ReportErrorBoundary from "@/features/reports-engine/components/ReportErrorBoundary";
// import { logout } from "@/redux/slices/authSlice";
import { forceLogout as logout } from "@/features/authSlice";
import {
  HEARTBEAT_MS,
  INACTIVITY_TIMEOUT_MS,
  INACTIVITY_WARNING_MS,
  canStartProtectedSession,
  claimActiveLock,
  clearSessionAuth,
  getOrCreateTabId,
  isSessionExpired,
  readActiveLock,
  readSessionAuth,
  refreshActiveLock,
  releaseActiveLock,
  setFlashMessage,
} from "@/lib/sessionSecurity";

const TITLE_MAP: Record<string, string> = {
  "/QlikReport": "ERP Dashboard",
  "/QlikReport/PurchaseOrder": "Purchase Reports",
  "/QlikReport/Pos": "POS Reports",
};

const DEFAULT_SIDEBAR_COLLAPSED = true;
const SIDEBAR_STORAGE_KEY = "sidebar-collapsed";

const readInitialSidebarCollapsed = () => {
  if (typeof window === "undefined") return DEFAULT_SIDEBAR_COLLAPSED;

  const saved = window.localStorage.getItem(SIDEBAR_STORAGE_KEY);
  if (saved === "true") return true;
  if (saved === "false") return false;

  return DEFAULT_SIDEBAR_COLLAPSED;
};

function getFallbackTitle(pathname: string) {
  const matchedEntry = Object.entries(TITLE_MAP)
    .sort((a, b) => b[0].length - a[0].length)
    .find(([prefix]) => pathname.startsWith(prefix));

  if (matchedEntry) return matchedEntry[1];

  const segment = pathname.split("/").filter(Boolean).pop();
  if (!segment) return "ERP Dashboard";

  return segment
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function getModuleLabel(pathname: string) {
  if (pathname.startsWith("/QlikReport/Pos")) return "POS";
  if (pathname.startsWith("/QlikReport/PurchaseOrder")) return "PO";
  if (pathname.startsWith("/QlikReport/Inventory")) return "Inventory";
  if (pathname.startsWith("/QlikReport")) return "Dashboard";
  return "Reports";
}

/**
 * Inner layout component — must be inside TopBarProvider to read onRefresh from context.
 */
const AppLayoutInner: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const pathname = usePathname();
  const router = useRouter();
  const dispatch = useDispatch();
  const { notify } = useAppSnackbar();
  const { isReady: preferencesReady } = usePreferences();
  const { onRefresh } = useTopBarContext();

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(
    readInitialSidebarCollapsed,
  );
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const warningShownRef = useRef(false);
  const activityRef = useRef(Date.now());

  useEffect(() => {
    if (!preferencesReady) return;

    if (window.localStorage.getItem(SIDEBAR_STORAGE_KEY) === null) {
      window.localStorage.setItem(
        SIDEBAR_STORAGE_KEY,
        String(isSidebarCollapsed),
      );
    }
  }, [isSidebarCollapsed, preferencesReady]);

  useEffect(() => {
    setIsMobileSidebarOpen(false);
  }, [pathname]);

  const sidebarWidth = isSidebarCollapsed ? 70 : 240;
  const fallbackTitle = useMemo(() => getFallbackTitle(pathname), [pathname]);
  const moduleLabel = useMemo(() => getModuleLabel(pathname), [pathname]);

  const handleToggleSidebar = (collapsed: boolean) => {
    setIsSidebarCollapsed(collapsed);
    localStorage.setItem(SIDEBAR_STORAGE_KEY, collapsed.toString());
  };

  useEffect(() => {
    const { token, username } = readSessionAuth();
    if (!token) return;

    if (isSessionExpired()) {
      clearSessionAuth();
      releaseActiveLock();
      dispatch(logout());
      setFlashMessage(
        "Your session has expired. Please log in again.",
        "warning",
      );
      router.replace("/");
      return;
    }

    if (!canStartProtectedSession(username)) {
      clearSessionAuth();
      dispatch(logout());
      setFlashMessage(
        "Your session has been ended because this account was signed in from another session.",
        "warning",
      );
      router.replace("/");
      return;
    }

    claimActiveLock(username);

    const heartbeat = window.setInterval(() => {
      const auth = readSessionAuth();
      if (!auth.token) return;
      refreshActiveLock(auth.username);
    }, HEARTBEAT_MS);

    const handleStorage = (event: StorageEvent) => {
      if (event.key !== "erp_active_tab_lock") return;
      const nextLock = readActiveLock();
      const currentTabId = getOrCreateTabId();

      if (
        nextLock &&
        nextLock.tabId !== currentTabId &&
        nextLock.username === username
      ) {
        clearSessionAuth();
        dispatch(logout());
        setFlashMessage(
          "Your session has been ended because this account was signed in from another session.",
          "warning",
        );
        notify(
          "Your session has been ended because this account was signed in from another session.",
          "warning",
        );
        router.replace("/");
      }
    };

    const markActivity = () => {
      activityRef.current = Date.now();
      warningShownRef.current = false;
    };

    const activityEvents: Array<keyof WindowEventMap> = [
      "mousemove",
      "keydown",
      "click",
      "scroll",
      "touchstart",
    ];

    activityEvents.forEach((eventName) => {
      window.addEventListener(eventName, markActivity, { passive: true });
    });

    const inactivityCheck = window.setInterval(() => {
      const idleFor = Date.now() - activityRef.current;

      if (
        !warningShownRef.current &&
        idleFor >= INACTIVITY_TIMEOUT_MS - INACTIVITY_WARNING_MS
      ) {
        warningShownRef.current = true;
        notify("Your session will expire soon due to inactivity.", "warning");
      }

      if (idleFor >= INACTIVITY_TIMEOUT_MS) {
        clearSessionAuth();
        releaseActiveLock();
        dispatch(logout());
        setFlashMessage("You were logged out due to inactivity.", "warning");
        router.replace("/");
      }
    }, 10000);

    const handlePageHide = () => {
      releaseActiveLock();
    };

    window.addEventListener("storage", handleStorage);
    window.addEventListener("pagehide", handlePageHide);

    return () => {
      window.clearInterval(heartbeat);
      window.clearInterval(inactivityCheck);
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("pagehide", handlePageHide);
      activityEvents.forEach((eventName) => {
        window.removeEventListener(eventName, markActivity);
      });
    };
  }, [dispatch, notify, router]);

  return (
    <div className="flex h-dvh overflow-hidden bg-[var(--app-bg)] text-[var(--app-text)]">
      <Sidebar
        collapsed={isSidebarCollapsed}
        mobileOpen={isMobileSidebarOpen}
        onToggle={handleToggleSidebar}
        onMobileClose={() => setIsMobileSidebarOpen(false)}
      />

      <div
        className="hidden shrink-0 transition-[width] duration-200 ease-in-out lg:block"
        style={{ width: sidebarWidth }}
      />

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <Topbar
          fallbackTitle={fallbackTitle}
          moduleLabel={moduleLabel}
          onMenuClick={() => setIsMobileSidebarOpen(true)}
          onRefreshClick={onRefresh ?? undefined}
        />

        <div className="flex min-h-0 min-w-0 flex-1 overflow-hidden">
          {pathname.startsWith("/QlikReport") ? (
            <ReportErrorBoundary>{children}</ReportErrorBoundary>
          ) : (
            children
          )}
        </div>
      </div>
    </div>
  );
};

/**
 * Outer wrapper — provides TopBarProvider so AppLayoutInner can consume context.
 */
const AppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <TopBarProvider>
      <AppLayoutInner>{children}</AppLayoutInner>
    </TopBarProvider>
  );
};

export default AppLayout;
