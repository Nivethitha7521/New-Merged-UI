'use client';
import React, { useEffect, useMemo, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../redux/store';
import { setupAxios } from "@/lib/axiosSetup";
import { forceLogout } from "../features/authSlice";
import { initializeAuth, validateToken, clearSnackbar } from '../features/authSlice';
import PurchaseModuleSideMenu from '@/components/PurchaseModuleSideMenu';
import MasterAdminModuleSideMenu from '@/components/MasterAdminModuleSideMenu';
import BookModuleSideMenu from '@/components/BookModuleSideMenu';
import { Toaster } from "react-hot-toast";
import { fetchBusinesses } from '@/features/account-setting/businessSlice';
import Snackbar from "@mui/material/Snackbar";
import MuiAlert from "@mui/material/Alert";
import SideMenu from '@/components/SideMenu';
import Navbar from '@/components/Navbar';
const PROTECTED_ROUTES = [
  '/yen-purchase',
  '/yen-pos',
  '/yen-hrm',
  '/yen-crm',
  '/yen-book',
  '/yen-store',
  '/yen-inventory',
  '/master-admin',
  '/account-settings',
  '/QlikReport',
  '/WhatsApp',
];

const LoadingSpinner = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
  </div>
);

const ClientLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const router = useRouter();
  const pathname = usePathname();

  const normalizedPath = useMemo(() => {
    if (!pathname) return "";
    const parts = pathname.split("/").filter(Boolean);
    if (parts.length > 1) {
      return "/" + parts.slice(1).join("/");
    }
    return pathname;
  }, [pathname]);

  const dispatch = useDispatch<AppDispatch>();

  const { isLoggedIn, isInitialized, permissionReady, username, snackbarOpen, snackbarMessage } =
    useSelector((state: RootState) => state.auth);

const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [selectedModule, setSelectedModule] = useState('');
  const [isCheckingSession, setIsCheckingSession] = useState(true);
const [isPurchaseSubMenuOpen, setIsPurchaseSubMenuOpen] = useState(false);
const [isBookSubMenuOpen, setIsBookSubMenuOpen] = useState(false);
const [
  isMasterAdminSubMenuOpen,
  setIsMasterAdminSubMenuOpen,
] = useState(false);
const [pendingBookPath, setPendingBookPath] =
  useState<string | null>(null);


useEffect(() => {
  if (!pendingBookPath) return;

  const routeOpened =
    pathname === pendingBookPath ||
    pathname?.startsWith(`${pendingBookPath}/`);

  if (routeOpened) {
    setIsBookSubMenuOpen(false);
    setPendingBookPath(null);
  }
}, [pathname, pendingBookPath]);

const isLoginRoute = useMemo(() => pathname === '/', [pathname]);

  const isProtectedRoute = useMemo(() =>
    PROTECTED_ROUTES.some(route => pathname?.startsWith(route)),
    [pathname]
  );

  const isDirectAccess = useMemo(() => {
    if (typeof window === "undefined") return false;
    const navEntries = performance.getEntriesByType("navigation") as PerformanceNavigationTiming[];
    return navEntries.length > 0 && navEntries[0].type === "navigate";
  }, []);

  const rawPermissions = useSelector((state: RootState) => state.auth.permissions);
  const permissions: string[] = Array.isArray(rawPermissions) ? rawPermissions : [];
  const token = useSelector((state: RootState) => state.auth.token);
  const role = useSelector((state: RootState) => state.auth.role);
  const permissionObject = useSelector((state: RootState) => state.auth.permissions);

  const hasPurchaseAccess = useMemo(() => {
    if (!permissionObject?.yenerp) return false;
    const yenerp = permissionObject.yenerp as Record<string, { read?: boolean }>;
    const excludeKeys = [
      'purchaseorderreport', 'posreport',
      'physicalstockmodification', 'physicalstockvariancemodification', 'stockledger',
      'warehousephysicalstockmodification', 'warehousephysicalstockvariancemodification', 'warehousestockledger',
      'outgoingpayment', 'advancepayment', 'partialpayment', 'paymentdone',
      'paymenthistory', 'ledger', 'purchasereturn', 'expensecategory',
      'expensesubcategory', 'expensename',
    ];
    return Object.keys(yenerp)
      .filter((key) => !excludeKeys.includes(key))
      .some((key) => yenerp[key]?.read === true);
  }, [permissionObject]);

  const hasInventoryAccess = useMemo(() => {
    if (!permissionObject?.yenerp) return false;
    const yenerp = permissionObject.yenerp;
    const INVENTORY_KEYS = [
      "physicalstockmodification",
      "physicalstockvariancemodification",
      "stockledger",
      "warehousephysicalstockmodification",
      "warehousephysicalstockvariancemodification",
      "warehousestockledger",
    ];
    return INVENTORY_KEYS.some((key) => yenerp[key]?.read === true);
  }, [permissionObject]);

  const hasBookAccess = useMemo(() => {
    if (!permissionObject?.yenerp) return false;
    const yenerp = permissionObject.yenerp as Record<string, { read?: boolean }>;
    const BOOK_KEYS = [
      'outgoingpayment', 'advancepayment', 'partialpayment',
      'paymentdone', 'paymenthistory', 'ledger',
      'purchasereturn', 'expensecategory', 'expensesubcategory', 'expensename',
    ];
    return BOOK_KEYS.some((key) => yenerp[key]?.read === true);
  }, [permissionObject]);

  const hasPurchaseReportAccess = useMemo(() => {
    if (!permissionObject?.yenerp) return false;
    return permissionObject.yenerp?.purchaseorderreport?.read === true;
  }, [permissionObject]);

  const hasPosReportAccess = useMemo(() => {
    if (!permissionObject?.yenerp) return false;
    return permissionObject.yenerp?.posreport?.read === true;
  }, [permissionObject]);

  const hasReportsAccess = hasPurchaseReportAccess || hasPosReportAccess;

  useEffect(() => { setupAxios(); }, []);

  // ✅ PING EFFECT — duplicate இல்ல, clean-ஆ இருக்கு
  useEffect(() => {
    if (!isLoggedIn || !token) return;

    let throttleTimer: ReturnType<typeof setTimeout> | null = null;

    // isUserActive = true  → user mouse/click பண்ணான் → TTL refresh பண்ணு
    // isUserActive = false → fallback check மட்டும் → TTL refresh வேண்டாம்
    const sendPing = async (isUserActive: boolean = false) => {
      try {
        const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000"
        const browserSessionId = localStorage.getItem("browserSessionId") || "";

        const res = await fetch(`${API_BASE}/yenerpapi/ping`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "x-browser-session-id": browserSessionId,
            "x-user-active": isUserActive ? "true" : "false",
          },
        });

        if (res.status === 401) {
          dispatch(forceLogout());
          router.replace("/");
        }
      } catch (e) {
        console.log("ping error", e);
      }
    };

    // Activity trigger → TTL refresh பண்ணணும்
    const handler = () => {
      if (!throttleTimer) {
        throttleTimer = setTimeout(() => {
          sendPing(true); // user active
          throttleTimer = null;
        }, 10000);
      }
    };

    // Fallback → just validate, TTL refresh வேண்டாம்
    const fallbackInterval = setInterval(() => {
      sendPing(false);
    }, 5 * 60 * 1000);

    const events = ["mousemove", "keydown", "click", "scroll"];
    events.forEach((e) => window.addEventListener(e, handler));

    return () => {
      events.forEach((e) => window.removeEventListener(e, handler));
      clearInterval(fallbackInterval);
      if (throttleTimer) clearTimeout(throttleTimer);
    };
  }, [isLoggedIn, token]);

  // Idle auto-logout
  useEffect(() => {
    if (!isLoggedIn || !token) return;

    const IDLE_TIMEOUT_MS = 60 * 60 * 1000;
    let idleTimer: ReturnType<typeof setTimeout>;

    const resetTimer = () => {
      clearTimeout(idleTimer);
      idleTimer = setTimeout(async () => {
        dispatch(forceLogout());
        router.replace("/");
      }, IDLE_TIMEOUT_MS);
    };

    const events = ["mousemove", "keydown", "click", "scroll", "touchstart"];
    events.forEach((e) => window.addEventListener(e, resetTimer));
    resetTimer();

    return () => {
      events.forEach((e) => window.removeEventListener(e, resetTimer));
      clearTimeout(idleTimer);
    };
  }, [isLoggedIn, token, dispatch, router]);

  useEffect(() => {
    const handleStorage = (event: StorageEvent) => {
      if (event.key === "forceLogout" && event.newValue) {
        try {
          const logoutData = JSON.parse(event.newValue);
          const currentUsername = sessionStorage.getItem("username");
          const currentTenant = sessionStorage.getItem("tenant_id");
          if (logoutData.username === currentUsername && logoutData.tenantId === currentTenant) {
            dispatch(forceLogout());
            router.replace("/");
          }
        } catch {}
      }
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, [dispatch, router]);

  useEffect(() => {
    dispatch(initializeAuth());
    dispatch(fetchBusinesses());
  }, [dispatch]);

  useEffect(() => {
    if (isInitialized) {
      setIsCheckingSession(false);
    }
  }, [isInitialized]);

  useEffect(() => {
    if (!isInitialized || isCheckingSession) return;
    if (isProtectedRoute && !isLoggedIn) {
      router.replace("/");
    }
  }, [isInitialized, isCheckingSession, isProtectedRoute, isLoggedIn, router]);

  useEffect(() => {
    return () => {};
  }, []);

  const handleLogout = async () => {};

  useEffect(() => {
    if (!isInitialized || isCheckingSession) return;
    if (!isLoggedIn && isProtectedRoute) {
      router.replace('/');
    } else if (isLoggedIn && isLoginRoute) {
      router.replace('/yen-purchase');
    }
  }, [isLoggedIn, isInitialized, isProtectedRoute, isLoginRoute, router, isCheckingSession]);

  if (!isInitialized || isCheckingSession || (isLoggedIn && !permissionReady)) {
    return <LoadingSpinner />;
  }

  const handleCloseSnackbar = () => { dispatch(clearSnackbar()); };

  const snackbarElement = (
    <Snackbar
      open={snackbarOpen}
      autoHideDuration={3000}
      onClose={handleCloseSnackbar}
      anchorOrigin={{ vertical: "top", horizontal: "right" }}
    >
      <MuiAlert onClose={handleCloseSnackbar} severity="success" variant="filled" elevation={6}>
        {snackbarMessage}
      </MuiAlert>
    </Snackbar>
  );
const isPurchaseRoute =
  pathname === '/yen-purchase' ||
  pathname?.startsWith('/yen-purchase/');
const isMasterAdminRoute =
  pathname === '/master-admin' ||
  pathname?.startsWith('/master-admin/');
const isBookRoute =
  pathname === '/yen-book' ||
  pathname?.startsWith('/yen-book/');
  if (isLoggedIn) {
    return (
      <>
        <Toaster position="top-right" />
        <div className="erp-app-shell">
<SideMenu
  collapsed={!isMenuOpen}
  onToggleCollapse={() =>
    setIsMenuOpen((previousValue) => !previousValue)
  }
  onMenuClick={(
    menuItem: {
      text: string;
      path: string;
    },
  ) => {
    setSelectedModule(menuItem.text);

if (menuItem.path === '/yen-purchase') {
  setSelectedModule(menuItem.text);
  setIsBookSubMenuOpen(false);
  setIsMasterAdminSubMenuOpen(false);

  if (!pathname?.startsWith('/yen-purchase')) {
    router.push('/yen-purchase');
  }

  return;
}

if (menuItem.path === '/yen-book') {
  setIsBookSubMenuOpen((previous) => !previous);
  setIsPurchaseSubMenuOpen(false);
  setIsMasterAdminSubMenuOpen(false);

  if (!pathname?.startsWith('/yen-book')) {
    router.push('/yen-book');
  }

  return;
}
if (menuItem.path === '/master-admin') {
  setSelectedModule(menuItem.text);
  setIsPurchaseSubMenuOpen(false);
  setIsBookSubMenuOpen(false);

  if (!pathname?.startsWith('/master-admin')) {
    router.push('/master-admin');
  }

  return;
}
    setIsPurchaseSubMenuOpen(false);
    setIsBookSubMenuOpen(false);
    setIsMasterAdminSubMenuOpen(false);
    
    router.push(menuItem.path);
  }}
  activePath={pathname || '/yen-purchase'}
  showPurchaseMenu={hasPurchaseAccess}
  showBookMenu={hasBookAccess}
  showInventoryMenu={hasInventoryAccess}
  showReportsMenu={hasReportsAccess}
/>
          <div className="erp-app-main">
<Navbar
  moduleName={selectedModule}
  username={username || 'User'}
/>

  <div className="erp-module-layout">
{isPurchaseRoute && (
  <PurchaseModuleSideMenu
    expanded={isPurchaseSubMenuOpen}
    onToggle={() =>
      setIsPurchaseSubMenuOpen((previous) => !previous)
    }
    onNavigate={(menuItem) => {
      setSelectedModule(menuItem.text);

      const pageAlreadyOpen =
        pathname === menuItem.path ||
        pathname?.startsWith(`${menuItem.path}/`);

      if (!pageAlreadyOpen) {
        router.push(menuItem.path);
      }
    }}
  />
)}
{isMasterAdminRoute && (
  <MasterAdminModuleSideMenu
    expanded={isMasterAdminSubMenuOpen}
    onToggle={() =>
      setIsMasterAdminSubMenuOpen(
        (previous) => !previous
      )
    }
    onNavigate={(menuItem) => {
      setSelectedModule(menuItem.text);

      const pageAlreadyOpen =
        pathname === menuItem.path ||
        pathname?.startsWith(
          `${menuItem.path}/`
        );

      if (!pageAlreadyOpen) {
        router.push(menuItem.path);
      }
    }}
  />
)}
{isBookRoute && isBookSubMenuOpen && (
  <BookModuleSideMenu
    onNavigate={(
      menuItem: {
        text: string;
        path: string;
      },
    ) => {
      setSelectedModule(menuItem.text);

      const pageAlreadyOpen =
        pathname === menuItem.path ||
        pathname?.startsWith(`${menuItem.path}/`);

      if (pageAlreadyOpen) {
        setIsBookSubMenuOpen(false);
        setPendingBookPath(null);
        return;
      }

      setPendingBookPath(menuItem.path);
      router.push(menuItem.path);
    }}
  />
)}

<main
  className={`erp-page-viewport ${
    isPurchaseRoute
      ? 'erp-purchase-viewport'
      : ''
  } ${
    isMasterAdminRoute
      ? 'erp-master-admin-viewport'
      : ''
  }`}
>
      {children}
    </main>
  </div>
</div>
        </div>
        {snackbarElement}
      </>
    );
  }

  return (
    <>
      <Toaster position="top-right" />
      {children}
      {snackbarElement}
    </>
  );
};

export default ClientLayout;