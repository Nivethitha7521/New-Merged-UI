"use client";

import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from "react";
import { CheckCircle2, Info, TriangleAlert, X } from "lucide-react";
import { cn } from "@/components/InventoryControlTower/shared/lib/format";

export type ToastTone = "success" | "info" | "warning" | "error";

type Toast = { id: number; message: string; tone: ToastTone };

type ActionCenterContextValue = {
  notify: (message: string, tone?: ToastTone) => void;
};

const ActionCenterContext = createContext<ActionCenterContextValue | null>(null);

export function ActionCenterProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const notify = (message: string, tone: ToastTone = "success") => {
    const id = Date.now() + Math.floor(Math.random() * 1000);
    setToasts((current) => [...current.slice(-2), { id, message, tone }]);
    window.setTimeout(() => {
      setToasts((current) => current.filter((toast) => toast.id !== id));
    }, 3600);
  };

  const value = useMemo(() => ({ notify }), []);

  return (
    <ActionCenterContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed right-3 top-20 z-[100] flex w-[calc(100%-1.5rem)] max-w-sm flex-col gap-2 sm:right-5 sm:top-24">
        {toasts.map((toast) => {
          const styles = {
            success: "border-emerald-200 bg-emerald-50 text-emerald-900",
            info: "border-blue-200 bg-blue-50 text-blue-900",
            warning: "border-amber-200 bg-amber-50 text-amber-900",
            error: "border-rose-200 bg-rose-50 text-rose-900",
          }[toast.tone];
          const Icon = toast.tone === "success" ? CheckCircle2 : toast.tone === "error" ? TriangleAlert : Info;
          return (
            <div key={toast.id} className={cn("pointer-events-auto flex items-start gap-2 rounded-2xl border p-3 text-sm font-medium shadow-lg backdrop-blur", styles)}>
              <Icon className="mt-0.5 shrink-0" size={18} />
              <span className="min-w-0 flex-1 leading-5">{toast.message}</span>
              <button aria-label="Dismiss notification" className="rounded-lg p-1 opacity-60 hover:bg-white/60 hover:opacity-100" onClick={() => setToasts((current) => current.filter((item) => item.id !== toast.id))}>
                <X size={15} />
              </button>
            </div>
          );
        })}
      </div>
    </ActionCenterContext.Provider>
  );
}

export function useActionCenter() {
  const context = useContext(ActionCenterContext);
  if (!context) throw new Error("useActionCenter must be used inside ActionCenterProvider");
  return context;
}

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = "md",
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  size?: "sm" | "md" | "lg";
}) {
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;
  const width = size === "sm" ? "max-w-md" : size === "lg" ? "max-w-3xl" : "max-w-xl";

  return (
    <div className="fixed inset-0 z-[90] flex items-end justify-center bg-slate-950/45 p-0 backdrop-blur-sm sm:items-center sm:p-4" role="dialog" aria-modal="true">
      <button aria-label="Close dialog" className="absolute inset-0" onClick={onClose} />
      <div className={cn("relative z-10 max-h-[88vh] w-full overflow-hidden rounded-t-3xl border border-slate-200 bg-white shadow-2xl sm:rounded-3xl", width)}>
        <div className="flex items-start gap-3 border-b border-slate-100 px-4 py-4 sm:px-5">
          <div className="min-w-0 flex-1">
            <h2 className="text-lg font-extrabold tracking-tight text-slate-950">{title}</h2>
            {description ? <p className="mt-1 text-xs leading-5 text-slate-500 sm:text-sm">{description}</p> : null}
          </div>
          <button aria-label="Close" className="rounded-xl border border-slate-200 p-2 text-slate-500 hover:bg-slate-50 hover:text-slate-900" onClick={onClose}>
            <X size={18} />
          </button>
        </div>
        <div className="max-h-[60vh] overflow-y-auto p-4 sm:p-5">{children}</div>
        {footer ? <div className="flex flex-wrap justify-end gap-2 border-t border-slate-100 bg-slate-50/60 px-4 py-3 sm:px-5">{footer}</div> : null}
      </div>
    </div>
  );
}
