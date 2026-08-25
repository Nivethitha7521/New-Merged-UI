import { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, SelectHTMLAttributes } from "react";
import { cn } from "@/components/InventoryControlTower/shared/lib/format";

export function PageHeader({ title, subtitle, action }: { title: string; subtitle: string; action?: ReactNode }) {
  return (
    <div className="mb-4 flex flex-col gap-3 sm:mb-5 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <div className="mb-2 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.18em] text-indigo-600">
          <span className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
          Live inventory operations
        </div>
        <h1 className="text-[23px] font-extrabold tracking-tight text-slate-950 sm:text-[27px]">{title}</h1>
        <p className="mt-1 max-w-4xl text-xs leading-5 text-slate-500 sm:text-sm">{subtitle}</p>
      </div>
      {action ? <div className="flex w-full flex-wrap gap-2 sm:w-auto sm:justify-end">{action}</div> : null}
    </div>
  );
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={cn("ct-card", className)}>{children}</div>;
}

export function SectionHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col gap-2 border-b border-slate-100 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:px-5">
      <div>
        <h2 className="text-sm font-extrabold text-slate-900 sm:text-base">{title}</h2>
        {subtitle ? <p className="mt-0.5 text-[11px] text-slate-500 sm:text-xs">{subtitle}</p> : null}
      </div>
      {action ? <div className="flex flex-wrap gap-2">{action}</div> : null}
    </div>
  );
}

export function Kpi({
  label,
  value,
  icon,
  trend,
  tone = "indigo",
}: {
  label: string;
  value: string;
  icon: ReactNode;
  trend?: string;
  tone?: "indigo" | "green" | "orange" | "red" | "cyan" | "violet";
}) {
  const tones = {
    indigo: "from-indigo-50 to-white text-indigo-600 ring-indigo-100",
    green: "from-emerald-50 to-white text-emerald-600 ring-emerald-100",
    orange: "from-orange-50 to-white text-orange-600 ring-orange-100",
    red: "from-rose-50 to-white text-rose-600 ring-rose-100",
    cyan: "from-cyan-50 to-white text-cyan-600 ring-cyan-100",
    violet: "from-violet-50 to-white text-violet-600 ring-violet-100",
  }[tone];

  return (
    <Card className="group relative min-h-[112px] overflow-hidden p-3.5 sm:min-h-[122px] sm:p-4">
      <div className={cn("absolute -right-7 -top-8 h-24 w-24 rounded-full bg-gradient-to-br opacity-70", tones)} />
      <div className="relative flex h-full items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="line-clamp-2 text-[10px] font-semibold leading-4 text-slate-500 sm:text-xs">{label}</p>
          <p className="mt-2 truncate text-[21px] font-extrabold tracking-tight text-slate-950 sm:text-2xl">{value}</p>
          {trend ? <p className="mt-1.5 line-clamp-2 text-[10px] leading-4 text-slate-500 sm:text-[11px]">{trend}</p> : null}
        </div>
        <div className={cn("shrink-0 rounded-2xl bg-gradient-to-br p-2.5 ring-1 sm:p-3", tones)}>{icon}</div>
      </div>
    </Card>
  );
}

export function StatusBadge({ value }: { value: string }) {
  const x = value.toLowerCase();
  const c =
    x.includes("critical") || x.includes("negative") || x.includes("rejected") || x.includes("out of stock") || x.includes("cancelled")
      ? "bg-rose-50 text-rose-700 ring-1 ring-rose-100"
      : x.includes("warning") || x.includes("pending") || x.includes("low") || x.includes("progress") || x.includes("high") || x.includes("transit")
        ? "bg-amber-50 text-amber-700 ring-1 ring-amber-100"
        : x.includes("healthy") || x.includes("closed") || x.includes("approved") || x.includes("normal") || x.includes("delivered") || x.includes("verified") || x.includes("completed")
          ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100"
          : x.includes("escalated")
            ? "bg-violet-50 text-violet-700 ring-1 ring-violet-100"
            : "bg-blue-50 text-blue-700 ring-1 ring-blue-100";
  return <span className={cn("ct-badge", c)}>{value}</span>;
}

export function FilterBar({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={cn("ct-filter-bar flex flex-wrap items-center gap-2 border-b border-slate-100 p-3 sm:p-4", className)}>{children}</div>;
}

export function Tabs({ tabs, value, onChange, compact = false }: { tabs: Array<{ label: string; value: string; count?: number }>; value: string; onChange: (value: string) => void; compact?: boolean }) {
  return (
    <div className="overflow-x-auto border-b border-slate-100 ct-scrollbar-thin">
      <div className="flex min-w-max items-center gap-1 px-3 sm:px-4">
        {tabs.map((tab) => {
          const active = tab.value === value;
          return (
            <button
              key={tab.value}
              onClick={() => onChange(tab.value)}
              className={cn(
                "relative flex items-center gap-1.5 whitespace-nowrap border-b-2 px-2 py-3 text-[11px] font-bold transition sm:px-3 sm:text-xs",
                compact ? "py-2.5" : "",
                active ? "border-indigo-600 text-indigo-700" : "border-transparent text-slate-500 hover:text-slate-800",
              )}
            >
              {tab.label}
              {tab.count !== undefined ? <span className={cn("rounded-full px-1.5 py-0.5 text-[9px]", active ? "bg-indigo-50 text-indigo-700" : "bg-slate-100 text-slate-500")}>{tab.count}</span> : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function Chip({ children, active = false, onClick }: { children: ReactNode; active?: boolean; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "h-8 shrink-0 rounded-lg border px-2.5 text-[10px] font-bold transition sm:text-[11px]",
        active ? "border-indigo-200 bg-indigo-50 text-indigo-700" : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50",
      )}
    >
      {children}
    </button>
  );
}

export function DetailList({ rows }: { rows: Array<[string, ReactNode]> }) {
  return (
    <div className="divide-y divide-slate-100 text-sm">
      {rows.map(([label, value]) => (
        <div key={label} className="flex items-start justify-between gap-4 py-2.5">
          <span className="text-xs text-slate-500">{label}</span>
          <div className="max-w-[58%] text-right text-xs font-bold text-slate-800 sm:text-sm">{value}</div>
        </div>
      ))}
    </div>
  );
}

export function Pager({ page, pages, onChange, summary }: { page: number; pages: number; onChange: (page: number) => void; summary?: string }) {
  return (
    <div className="flex flex-col gap-2 border-t border-slate-100 px-3 py-3 text-[10px] text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:px-4">
      <span>{summary || `Page ${page} of ${pages}`}</span>
      <div className="flex items-center gap-1">
        <button disabled={page <= 1} onClick={() => onChange(page - 1)} className="h-8 rounded-lg border border-slate-200 bg-white px-2.5 font-bold disabled:opacity-40">‹</button>
        {Array.from({ length: Math.min(pages, 5) }, (_, index) => index + 1).map((item) => (
          <button key={item} onClick={() => onChange(item)} className={cn("h-8 min-w-8 rounded-lg border px-2 font-bold", item === page ? "border-indigo-600 bg-indigo-600 text-white" : "border-slate-200 bg-white text-slate-600")}>{item}</button>
        ))}
        <button disabled={page >= pages} onClick={() => onChange(page + 1)} className="h-8 rounded-lg border border-slate-200 bg-white px-2.5 font-bold disabled:opacity-40">›</button>
      </div>
    </div>
  );
}

export const Input = ({ className = "", ...props }: InputHTMLAttributes<HTMLInputElement>) => (
  <input
    {...props}
    className={cn("h-10 min-w-0 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50", className)}
  />
);

export const Select = ({ children, className = "", ...props }: SelectHTMLAttributes<HTMLSelectElement>) => (
  <select {...props} className={cn("h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50", className)}>
    {children}
  </select>
);

export const Button = ({
  children,
  variant = "primary",
  className = "",
  type = "button",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  variant?: "primary" | "secondary" | "danger" | "success";
}) => {
  const c = {
    primary: "bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-sm shadow-indigo-200 hover:from-indigo-700 hover:to-violet-700",
    secondary: "border border-slate-200 bg-white text-slate-700 shadow-sm hover:border-slate-300 hover:bg-slate-50",
    danger: "bg-rose-600 text-white hover:bg-rose-700",
    success: "bg-emerald-600 text-white hover:bg-emerald-700",
  }[variant];
  return (
    <button
      type={type}
      {...props}
      className={cn(
        "h-10 rounded-xl px-3.5 text-xs font-bold transition disabled:cursor-not-allowed disabled:opacity-50 sm:px-4 sm:text-sm",
        c,
        className,
      )}
    >
      {children}
    </button>
  );
};
