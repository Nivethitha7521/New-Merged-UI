"use client";

import { useMemo, useState } from "react";
import { Check, CheckCircle2, CircleDollarSign, ClipboardCheck, Clock3, Download, PackageCheck, Timer, TriangleAlert } from "lucide-react";
import { Button, Card, DetailList, Input, Kpi, PageHeader, Pager, SectionHeader, StatusBadge } from "@/components/InventoryControlTower/shared/components/ui";
import { DataTable } from "@/components/InventoryControlTower/shared/components/data-table";
import { Modal, useActionCenter } from "@/components/InventoryControlTower/shared/components/action-center";
import { apiRequest, downloadCsv } from "@/components/InventoryControlTower/shared/lib/api";

const initialRows = [
  { code: "SB", outlet: "SB Outlet", receipts: true, wastage: true, count: true, variance: 420, comment: "All good. Closing.", status: "Closed" },
  { code: "BN1", outlet: "BN1 Outlet", receipts: false, wastage: true, count: true, variance: -4800, comment: "Receipt pending for 1 item", status: "In Progress" },
  { code: "RS", outlet: "RS Outlet", receipts: true, wastage: false, count: false, variance: -6250, comment: "High wastage pending approval", status: "In Progress" },
  { code: "KK", outlet: "KK Outlet", receipts: true, wastage: true, count: true, variance: 150, comment: "—", status: "Closed" },
  { code: "PMK", outlet: "PMK Outlet", receipts: true, wastage: false, count: false, variance: -2100, comment: "Physical count not completed", status: "Pending" },
  { code: "TRC", outlet: "Trichy Outlet", receipts: true, wastage: true, count: true, variance: 0, comment: "—", status: "Closed" },
  { code: "MDU", outlet: "Madurai Outlet", receipts: true, wastage: true, count: true, variance: 250, comment: "—", status: "Closed" },
  { code: "VL", outlet: "Vellore Outlet", receipts: false, wastage: false, count: false, variance: 0, comment: "Not started", status: "Pending" },
];

function Tick({ ok }: { ok: boolean }) {
  return <span className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${ok ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>{ok ? <Check size={14} /> : "!"}</span>;
}

export function ReconciliationPage() {
  const { notify } = useActionCenter();
  const [rows, setRows] = useState(initialRows);
  const [query, setQuery] = useState("");
  const [selectedCode, setSelectedCode] = useState("SB");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [remarks, setRemarks] = useState("");
  const [busy, setBusy] = useState(false);
  const [page, setPage] = useState(1);
  const selected = rows.find((row) => row.code === selectedCode) || rows[0];
  const filtered = useMemo(() => rows.filter((row) => row.outlet.toLowerCase().includes(query.toLowerCase())), [query, rows]);

  async function runAction(row: typeof initialRows[number], action: string) {
    setSelectedCode(row.code);
    if (action === "report") { setDialogOpen(true); return; }
    setBusy(true);
    const result = await apiRequest(`/reconciliation/${row.code}/action`, { method: "POST", body: JSON.stringify({ action, remarks: remarks || null }) });
    if (action === "start" || action === "continue") setRows((current) => current.map((item) => item.code === row.code ? { ...item, status: "In Progress" } : item));
    if (action === "remind") notify(`Reminder sent to ${row.outlet} inventory in-charge.`, result.ok ? "success" : "warning");
    setBusy(false);
    if (action !== "remind") notify(result.ok ? `${row.outlet}: reconciliation ${action} accepted.` : `${row.outlet}: action updated locally; FastAPI is unavailable.`, result.ok ? "success" : "warning");
  }

  async function closeDay() {
    setBusy(true);
    const result = await apiRequest(`/reconciliation/${selected.code}/action`, { method: "POST", body: JSON.stringify({ action: "close_day", remarks: remarks || "Closed from reconciliation summary" }) });
    setRows((current) => current.map((item) => item.code === selected.code ? { ...item, receipts: true, wastage: true, count: true, status: "Closed" } : item));
    setBusy(false); setDialogOpen(false); setRemarks("");
    notify(result.ok ? `${selected.outlet} day closed successfully.` : `${selected.outlet} marked closed locally; backend unavailable.`, result.ok ? "success" : "warning");
  }

  function exportRows() {
    downloadCsv("daily-inventory-reconciliation.csv", ["Outlet", "Receipts Closed", "Wastage Approved", "Physical Count", "Variance", "Comments", "Status"], filtered.map((row) => [row.outlet, row.receipts ? "Yes" : "No", row.wastage ? "Yes" : "No", row.count ? "Yes" : "No", row.variance, row.comment, row.status]));
    notify("Daily reconciliation exported as CSV.");
  }

  return (
    <>
      <PageHeader title="Daily Reconciliation" subtitle="Reconcile receipts, wastage, physical stock and variances before closing day-end inventory for every outlet" />
      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-6">
        <Kpi label="Closed Outlets" value="12 / 15" trend="80%" icon={<CheckCircle2 size={19} />} tone="green" />
        <Kpi label="In Progress" value="2 / 15" trend="13%" icon={<Timer size={19} />} tone="orange" />
        <Kpi label="Pending" value="1 / 15" trend="7%" icon={<TriangleAlert size={19} />} tone="red" />
        <Kpi label="Physical Count Completed" value="11 / 15" trend="73%" icon={<ClipboardCheck size={19} />} />
        <Kpi label="Total Variance Value" value="₹18,450" trend="0.38% of stock value" icon={<CircleDollarSign size={19} />} tone="violet" />
        <Kpi label="Est. Inventory Value" value="₹28,45,300" trend="All outlets" icon={<PackageCheck size={19} />} tone="cyan" />
      </div>

      <Card className="mt-4 overflow-hidden">
        <div className="grid grid-cols-2 gap-0 sm:grid-cols-5">
          {[
            ["Receipts Closed", "13 / 15", true], ["Wastage Approved", "11 / 15", true], ["Physical Count", "11 / 15", false], ["Variance Reviewed", "12 / 15", false], ["Day Closed", "12 / 15", false],
          ].map(([label, value, done], index) => <div key={String(label)} className="flex items-center gap-3 border-b border-r border-slate-100 p-3 last:border-r-0 sm:border-b-0"><div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 text-xs font-extrabold ${done ? "border-emerald-500 bg-emerald-50 text-emerald-700" : index === 2 ? "border-amber-500 bg-amber-50 text-amber-700" : "border-slate-200 text-slate-500"}`}>{done ? <Check size={15} /> : index + 1}</div><div><div className="text-[10px] font-bold text-slate-700 sm:text-xs">{label}</div><div className="text-[9px] text-slate-400">{value}</div></div></div>)}
        </div>
      </Card>

      <div className="mt-4 grid gap-4 xl:grid-cols-[1fr_350px]">
        <Card className="min-w-0 overflow-hidden">
          <SectionHeader title="Outlet Reconciliation Status" action={<><Input className="w-44" placeholder="Search outlet..." value={query} onChange={(e) => setQuery(e.target.value)} /><Button variant="secondary" onClick={() => setQuery("")}>Filters</Button><Button variant="secondary" onClick={exportRows}><span className="flex items-center gap-2"><Download size={14} />Export</span></Button></>} />
          <DataTable headers={["Outlet", "Receipts Closed", "Wastage Approved", "Physical Count", "Variance", "In-charge Comments", "Status", "Action"]} rows={filtered.map((row) => [
            <button key="outlet" className="font-bold text-slate-900" onClick={() => setSelectedCode(row.code)}>{row.outlet}</button>, <Tick key="r" ok={row.receipts} />, <Tick key="w" ok={row.wastage} />, <Tick key="c" ok={row.count} />,
            <span key="v" className={row.variance < 0 ? "font-bold text-rose-600" : "font-bold text-emerald-600"}>{row.variance === 0 ? "₹0" : `${row.variance < 0 ? "-" : ""}₹${Math.abs(row.variance).toLocaleString("en-IN")}`}</span>, row.comment, <StatusBadge key="s" value={row.status} />,
            <Button key="a" disabled={busy} className="h-8 px-2.5 text-[10px]" onClick={() => runAction(row, row.status === "Closed" ? "report" : row.status === "Pending" ? (row.comment === "Not started" ? "start" : "remind") : "continue")}>{row.status === "Closed" ? "View Report" : row.status === "Pending" ? (row.comment === "Not started" ? "Start" : "Remind") : "Continue"}</Button>,
          ])} />
          <Pager page={page} pages={2} onChange={setPage} summary="Showing 1 to 8 of 15 outlets" />
        </Card>

        <div className="space-y-4">
          <Card className="p-4">
            <div className="flex items-center justify-between"><h3 className="text-sm font-extrabold text-slate-900">{selected.outlet} — Reconciliation Summary</h3><StatusBadge value={selected.status} /></div>
            <div className="mt-3"><DetailList rows={[["Opening Stock Value", "₹4,56,800"], ["Total Receipts Value", "₹1,28,450"], ["Total Outward Value", "₹1,20,450"], ["Total Wastage Value", "₹1,850"], ["Total Returns Value", "₹0"], ["Expected Closing Value", "₹4,42,950"], ["Physical Stock Value", "₹4,43,370"], ["Variance Value", <span key="vv" className={selected.variance < 0 ? "text-rose-600" : "text-emerald-600"}>{selected.variance < 0 ? "-" : "+"}₹{Math.abs(selected.variance).toLocaleString("en-IN")}</span>], ["Variance %", `${Math.abs(selected.variance / 443370 * 100).toFixed(2)}%`]]} /></div>
          </Card>
          <Card className="p-4">
            <h3 className="text-sm font-extrabold text-slate-900">Reconciliation Timeline</h3>
            <div className="mt-3 space-y-3">{[["Receipts Closed", "04:40 PM"], ["Wastage Approved", "05:00 PM"], ["Physical Count Completed", "09:15 PM"], ["Variance Reviewed", "09:20 PM"], ["Day Closed", "09:25 PM"]].map(([label, time]) => <div key={label} className="flex items-center gap-2 text-xs"><span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100 text-emerald-700"><Check size={12} /></span><span className="flex-1 text-slate-600">{label}</span><span className="text-slate-400">{time}</span></div>)}</div>
            <Button className="mt-4 w-full" onClick={() => setDialogOpen(true)}>{selected.status === "Closed" ? "View Full Report" : "Complete / Close Day"}</Button>
          </Card>
        </div>
      </div>

      <Modal open={dialogOpen} onClose={() => setDialogOpen(false)} title={`${selected.outlet} reconciliation`} description="Review the closing summary. Open outlets can be closed after all inventory controls are completed." footer={<><Button variant="secondary" onClick={() => setDialogOpen(false)}>Close</Button>{selected.status !== "Closed" ? <Button disabled={busy} onClick={closeDay}>{busy ? "Closing..." : "Close Day"}</Button> : null}</>}>
        <DetailList rows={[["Status", <StatusBadge key="st" value={selected.status} />], ["Receipts", selected.receipts ? "Closed" : "Pending"], ["Wastage", selected.wastage ? "Approved" : "Pending"], ["Physical Count", selected.count ? "Completed" : "Pending"], ["Variance", `₹${selected.variance.toLocaleString("en-IN")}`]]} />
        {selected.status !== "Closed" ? <textarea className="mt-4 min-h-24 w-full rounded-xl border border-slate-200 p-3 text-sm outline-none focus:border-indigo-400" placeholder="Closing remarks..." value={remarks} onChange={(e) => setRemarks(e.target.value)} /> : null}
      </Modal>
    </>
  );
}
