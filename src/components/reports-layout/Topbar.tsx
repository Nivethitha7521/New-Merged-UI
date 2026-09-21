"use client";

import React, { useCallback, useEffect, useState } from "react";
import {
  HiOutlineArrowPath,
  HiOutlineBars3,
  HiOutlineCog6Tooth,
} from "react-icons/hi2";
import { usePreferences } from "@/components/preferences/PreferencesContext";
import { useTopBarContext } from "@/components/reports-layout/topbar-context";

interface TopbarProps {
  onMenuClick?: () => void;
  fallbackTitle: string;
  moduleLabel: string;
  onRefreshClick?: () => Promise<void> | void;
  isLoading?: boolean;
  lastUpdated?: string | number | null;
}

const Topbar: React.FC<TopbarProps> = ({
  onMenuClick,
  fallbackTitle,
  moduleLabel,
  onRefreshClick,
  isLoading = false,
  lastUpdated = null,
}) => {
  const { config } = useTopBarContext();
  const { preferences, resolvedThemeMode, openDrawer } = usePreferences();
  const [heightCompact, setHeightCompact] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showRefreshSuccess, setShowRefreshSuccess] = useState(false);

  const dark = resolvedThemeMode === "dark";

  const title =
    preferences.branding.headerTitle || config?.title || fallbackTitle;

  const isCompact =
    preferences.layout.topbarMode === "compact"
      ? true
      : preferences.layout.topbarMode === "normal"
        ? false
        : heightCompact || preferences.layout.pageDensity === "compact";

  useEffect(() => {
    const syncViewportMode = () => {
      if (typeof window === "undefined") return;
      setHeightCompact(window.innerHeight < 800 || window.innerWidth < 1024);
    };

    syncViewportMode();
    window.addEventListener("resize", syncViewportMode, { passive: true });

    return () => window.removeEventListener("resize", syncViewportMode);
  }, []);

  const formatLastUpdated = useCallback(() => {
    if (!lastUpdated) return null;

    const date = typeof lastUpdated === "number" ? new Date(lastUpdated) : new Date(lastUpdated);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
    return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
  }, [lastUpdated]);

  const handleRefresh = async () => {
    if (refreshing || isLoading) return;

    try {
      setRefreshing(true);

      if (onRefreshClick) {
        await Promise.resolve(onRefreshClick());
        setShowRefreshSuccess(true);
        setTimeout(() => setShowRefreshSuccess(false), 3000);
        return;
      }

      /**
       * Fallback: if no handler is registered (e.g. non-report pages),
       * do a hard reload with refresh=true in the URL.
       */
      if (typeof window !== "undefined") {
        const url = new URL(window.location.href);
        url.searchParams.set("refresh", "true");
        window.location.href = url.toString();
      }
    } catch (error) {
      console.error("Refresh failed:", error);
    } finally {
      setTimeout(() => setRefreshing(false), 800);
    }
  };

  const iconButtonClass = [
    "inline-flex shrink-0 items-center justify-center rounded-xl border shadow-sm outline-none transition-all duration-200",
    "focus-visible:ring-2 focus-visible:ring-[rgb(var(--app-primary-rgb)/0.28)]",
    dark
      ? "border-slate-700 bg-slate-900 text-slate-300 hover:border-slate-600 hover:bg-slate-800 hover:text-white"
      : "border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900",
    isCompact ? "h-[34px] w-[34px]" : "h-10 w-10",
    (refreshing || isLoading) && "cursor-not-allowed opacity-50",
  ]
    .filter(Boolean)
    .join(" ");

  const titleContainerClass = [
    "min-w-0 flex-1",
    isCompact ? "space-y-0.5" : "space-y-1",
  ].join(" ");

  const statusBadgeClass = [
    "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-medium transition-colors",
    dark
      ? "bg-slate-900/80 text-slate-400 border border-slate-700"
      : "bg-slate-50/80 text-slate-500 border border-slate-200",
  ].join(" ");

  return (
    <header
      className={[
        "sticky top-0 z-40 shrink-0 border-b backdrop-blur-xl transition-colors duration-200",
        dark
          ? "border-slate-800 bg-slate-950/95"
          : "border-slate-200 bg-white/95",
      ].join(" ")}
      style={{
        fontFamily: "var(--app-font-family, system-ui, sans-serif)",
        color: "var(--app-text)",
      }}
    >
      <div
        className={[
          "flex w-full flex-col",
          isCompact ? "gap-2 px-3 py-2 lg:px-4" : "gap-3 px-4 py-3 lg:px-6",
        ].join(" ")}
      >
        <div className="flex min-w-0 items-start gap-3">
          {/* Mobile Menu Button */}
          <button
            type="button"
            onClick={onMenuClick}
            className={`${iconButtonClass} lg:hidden`}
            aria-label="Open menu"
            title="Open menu"
          >
            <HiOutlineBars3 size={18} />
          </button>

          {/* Title Section */}
          <div className={titleContainerClass}>
            <div className="flex items-center gap-2">
              <p
                className="truncate text-[10px] font-black uppercase tracking-[0.26em] sm:text-[11px]"
                style={{ color: "var(--app-accent)" }}
              >
                {preferences.branding.reportName || "YenERP Reports"}
              </p>

              {/* Status Badge */}
              {(isLoading || refreshing) && (
                <span className={statusBadgeClass}>
                  <svg
                    className="h-2.5 w-2.5 animate-spin"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  <span>Loading...</span>
                </span>
              )}

              {showRefreshSuccess && (
                <span className={statusBadgeClass}>
                  <svg
                    className="h-2.5 w-2.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  <span>Refreshed!</span>
                </span>
              )}
            </div>

            <p className="truncate text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400 sm:text-xs">
              {moduleLabel}
            </p>

            <h1
              className={[
                "min-w-0 truncate font-black tracking-tight",
                dark ? "text-white" : "text-slate-950",
                isCompact
                  ? "text-base leading-tight sm:text-lg"
                  : "text-lg leading-tight sm:text-xl",
              ].join(" ")}
              title={title}
            >
              {title}
            </h1>

            {/* Last Updated Timestamp */}
            {lastUpdated && !isLoading && !refreshing && (
              <p className="text-[10px] text-slate-400 sm:text-xs">
                Last updated: {formatLastUpdated()}
              </p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex shrink-0 items-center gap-2">
            {/* Logo Section */}
            <div
              className={[
                "flex shrink-0 items-center justify-center rounded-xl border p-1 shadow-sm",
                dark
                  ? "border-slate-700 bg-slate-900"
                  : "border-slate-200 bg-white",
                isCompact ? "h-[34px] w-[34px]" : "h-10 w-10",
              ].join(" ")}
              title={preferences.branding.companyName || "Client logo"}
            >
              {preferences.branding.clientLogoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={preferences.branding.clientLogoUrl}
                  alt="Client logo"
                  className="h-full w-full object-contain"
                />
              ) : (
                <span
                  className="text-sm font-black"
                  style={{ color: "var(--app-accent)" }}
                >
                  {(preferences.branding.companyName || "Y")[0]?.toUpperCase()}
                </span>
              )}
            </div>

            {/* Refresh Button */}
            <button
              type="button"
              onClick={handleRefresh}
              className={iconButtonClass}
              aria-label="Refresh data"
              title="Refresh latest data"
              disabled={refreshing || isLoading}
            >
              <HiOutlineArrowPath
                size={18}
                className={refreshing || isLoading ? "animate-spin" : ""}
              />
            </button>

            {/* Settings Button */}
            <button
              type="button"
              onClick={openDrawer}
              className={iconButtonClass}
              aria-label="Open settings"
              title="Settings"
            >
              <HiOutlineCog6Tooth size={18} />
            </button>
          </div>
        </div>

        {/* Right Content Area */}
        {config?.rightContent ? (
          <div
            className={[
              "min-w-0 overflow-visible rounded-2xl border transition-colors",
              dark
                ? "border-slate-800 bg-slate-950/60"
                : "border-slate-200 bg-slate-50/80",
            ].join(" ")}
          >
            {config.rightContent}
          </div>
        ) : null}
      </div>
    </header>
  );
};

export default Topbar;
