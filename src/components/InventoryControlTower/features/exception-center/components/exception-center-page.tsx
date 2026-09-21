"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, Info, Save, ShieldAlert, Siren } from "lucide-react";
import { Button, Card, DetailList, FilterBar, Input, Kpi, PageHeader, Pager, Select, StatusBadge, Tabs } from "@/components/InventoryControlTower/shared/components/ui";
import { DataTable } from "@/components/InventoryControlTower/shared/components/data-table";
import { exceptions as initialExceptions } from "@/components/InventoryControlTower/shared/data/mock";
import { ExceptionItem } from "@/components/InventoryControlTower/shared/types/inventory";
import { Modal, useActionCenter } from "@/components/InventoryControlTower/shared/components/action-center";
import { apiRequest } from "@/components/InventoryControlTower/shared/lib/api";

type DialogMode = "request" | "adjust" | "escalate" | null;

const extra: ExceptionItem[] = [
  { id: "EX-106", severity: "medium", type: "Expiry Alert", outlet: "SB Outlet", product: "Whipped Cream", details: "Batch WC250726 expires in 1 day", time: "09:55 AM", status: "Pending Review" },
  { id: "EX-107", severity: "low", type: "Device Offline", outlet: "TVM Outlet", product: "Terminal 2", details: "Inventory device offline since 09:40 AM", time: "09:40 AM", status: "Info" },
];

const tabs = [
  { label: "All Exceptions", value: "all", count: 34 },
  { label: "Unresolved", value: "unresolved", count: 14 },
  { label: "Pending Actions", value: "pending", count: 9 },
  { label: "Escalated", value: "escalated", count: 3 },
  { label: "Resolved", value: "resolved", count: 19 },
];

export function ExceptionCenterPage() {
  const { notify } = useActionCenter();
  const [items, setItems] = useState<ExceptionItem[]>([...initialExceptions, ...extra]);
  const [selectedId, setSelectedId] = useState(initialExceptions[0].id);
  const [typeFilter, setTypeFilter] = useState("All Types");
  const [outletFilter, setOutletFilter] = useState("All Outlets");
  const [severityFilter, setSeverityFilter] = useState("All Severity");
  const [activeTab, setActiveTab] = useState("all");
  const [query, setQuery] = useState("");
  const [dialog, setDialog] = useState<DialogMode>(null);
  const [remarks, setRemarks] = useState("");
  const [savedNote, setSavedNote] = useState("");
  const [recipient, setRecipient] = useState("Outlet In-charge");
  const [physicalQty, setPhysicalQty] = useState("");
  const [busy, setBusy] = useState(false);
  const [page, setPage] = useState(1);

  const selected = items.find((item) => item.id === selectedId) || items[0];
  const types = useMemo(() => Array.from(new Set(items.map((item) => item.type))), [items]);
  const outlets = useMemo(() => Array.from(new Set(items.map((item) => item.outlet))), [items]);
  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return items.filter((item) => {
      const matchesType = typeFilter === "All Types" || item.type === typeFilter;
      const matchesOutlet = outletFilter === "All Outlets" || item.outlet === outletFilter;
      const matchesSeverity = severityFilter === "All Severity" || item.severity === severityFilter.toLowerCase();
      const matchesQuery = !needle || [item.type, item.outlet, item.product, item.details, item.id].some((v) => v.toLowerCase().includes(needle));
      const status = item.status.toLowerCase();
      const matchesTab = activeTab === "all" || (activeTab === "unresolved" && status.includes("unresolved")) || (activeTab === "pending" && status.includes("pending")) || (activeTab === "escalated" && status.includes("escalated")) || (activeTab === "resolved" && (status.includes("resolved") || status.includes("closed")));
      return matchesType && matchesOutlet && matchesSeverity && matchesQuery && matchesTab;
    });
  }, [activeTab, items, outletFilter, query, severityFilter, typeFilter]);

  async function runAction(action: string, newStatus: string, actionRemarks?: string) {
    if (!selected) return;
    setBusy(true);
    const result = await apiRequest(`/exceptions/${selected.id}/action`, { method: "POST", body: JSON.stringify({ action, remarks: actionRemarks || null }) });
    setItems((current) => current.map((item) => item.id === selected.id ? { ...item, status: newStatus } : item));
    setBusy(false);
    notify(result.ok ? `${selected.id}: ${newStatus}.` : `${selected.id} updated locally. FastAPI is unavailable, so this change is not persisted.`, result.ok ? "success" : "warning");
  }

  async function investigate(item: ExceptionItem = selected) {
    setSelectedId(item.id);
    setBusy(true);
    const result = await apiRequest(`/exceptions/${item.id}/action`, { method: "POST", body: JSON.stringify({ action: "investigate", remarks: "Investigation started from Exception Center" }) });
    setItems((current) => current.map((entry) => entry.id === item.id ? { ...entry, status: "Investigating" } : entry));
    setBusy(false);
    notify(result.ok ? `${item.id} investigation started.` : `${item.id} marked Investigating locally; FastAPI is not reachable.`, result.ok ? "success" : "warning");
  }

  async function submitDialog() {
    if (dialog === "request") await runAction("request_info", "Awaiting Info", `Requested from ${recipient}. ${remarks}`.trim());
    if (dialog === "adjust") {
      if (!physicalQty.trim()) { notify("Enter the verified physical quantity before requesting an adjustment.", "error"); return; }
      await runAction("adjust_stock", "Adjustment Pending", `Verified physical qty: ${physicalQty}. ${remarks}`.trim());
    }
    if (dialog === "escalate") await runAction("escalate", "Escalated", `Escalated to ${recipient}. ${remarks}`.trim());
    setDialog(null); setRemarks(""); setPhysicalQty("");
  }

  const currentStock = selected?.type === "Negative Stock" ? "-7 pcs" : selected?.type === "Low Stock" ? "10 pcs" : "26 pcs";
  const minStock = selected?.type === "Low Stock" ? "20 pcs" : "20 pcs";

  return (
    <>
      <PageHeader title="Exception Center" subtitle="Real-time inventory exceptions, root-cause review and controlled corrective actions" />
      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-5">
        <Kpi label="Critical" value="6" trend="Requires immediate action" icon={<Siren size={20} />} tone="red" />
        <Kpi label="High" value="8" trend="Action required today" icon={<ShieldAlert size={20} />} tone="orange" />
        <Kpi label="Medium" value="12" trend="Needs review" icon={<AlertTriangle size={20} />} tone="orange" />
        <Kpi label="Low" value="5" trend="Minor issues" icon={<Info size={20} />} />
        <Kpi label="Info" value="3" trend="For information" icon={<Info size={20} />} tone="violet" />
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-[1fr_365px]">
        <Card className="min-w-0 overflow-hidden">
          <Tabs tabs={tabs} value={activeTab} onChange={setActiveTab} />
          <FilterBar>
            <Select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}><option>All Types</option>{types.map((type) => <option key={type}>{type}</option>)}</Select>
            <Select value={outletFilter} onChange={(e) => setOutletFilter(e.target.value)}><option>All Outlets</option>{outlets.map((outlet) => <option key={outlet}>{outlet}</option>)}</Select>
            <Select value={severityFilter} onChange={(e) => setSeverityFilter(e.target.value)}><option>All Severity</option><option>Critical</option><option>High</option><option>Medium</option><option>Low</option></Select>
            <Input placeholder="Search exceptions..." value={query} onChange={(e) => setQuery(e.target.value)} />
            <Button variant="secondary" onClick={() => { setTypeFilter("All Types"); setOutletFilter("All Outlets"); setSeverityFilter("All Severity"); setQuery(""); }}>Filters</Button>
          </FilterBar>
          <DataTable headers={["Severity", "Type", "Outlet", "Product / Issue", "Details", "Time", "Status", "Action"]} rows={filtered.map((item) => [
            <StatusBadge key="severity" value={item.severity} />, item.type, item.outlet, item.product, item.details, item.time, <StatusBadge key="status" value={item.status} />,
            <Button key="action" disabled={busy} className="h-8 px-2.5 text-[10px]" onClick={() => investigate(item)}>Investigate</Button>,
          ])} />
          {filtered.length === 0 ? <div className="p-8 text-center text-sm text-slate-500">No exceptions match the current filters.</div> : null}
          <Pager page={page} pages={5} onChange={setPage} summary={`Showing 1 to ${filtered.length} of 34 exceptions`} />
        </Card>

        {selected ? <Card className="overflow-hidden xl:sticky xl:top-24 xl:self-start">
          <div className="p-5">
            <div className="flex items-center justify-between gap-2"><StatusBadge value={selected.severity} /><StatusBadge value={selected.status} /></div>
            <h2 className="mt-4 text-xl font-extrabold text-slate-950">{selected.type}</h2>
            <div className="mt-4"><DetailList rows={[["Outlet", selected.outlet], ["Product", selected.product], ["Current Stock", <span key="cs" className={currentStock.startsWith("-") ? "text-rose-600" : ""}>{currentStock}</span>], ["Minimum Stock", minStock], ["Detected", selected.time], ["Detected By", "System"]]} /></div>
          </div>
          <div className="border-t border-slate-100 p-5">
            <h3 className="text-xs font-extrabold uppercase tracking-[0.12em] text-slate-500">Stock Summary</h3>
            <DetailList rows={[["Opening Stock", "20 pcs"], ["Received Today", "70 pcs"], ["Outward Today", "64 pcs"], ["Wastage", "5 pcs"], ["Returns", "0 pcs"], ["Expected Stock", "21 pcs"], ["Physical Stock", currentStock], ["Variance", selected.type === "Negative Stock" ? "-28 pcs" : "-11 pcs"]]} />
          </div>
          <div className="border-t border-slate-100 p-5">
            <div className="flex items-center justify-between"><h3 className="text-xs font-extrabold uppercase tracking-[0.12em] text-slate-500">Recent Transactions</h3><button className="text-[10px] font-bold text-indigo-600" onClick={() => notify("Full ledger opened for this product.", "info")}>View all</button></div>
            <div className="mt-3 space-y-2 text-[11px]">
              {[["10:20 AM", "POS Outward OUT-5847", "-4 pcs"], ["10:10 AM", "POS Outward OUT-5846", "-6 pcs"], ["09:55 AM", "Wastage WST-215", "-2 pcs"], ["09:40 AM", "Receipt GRN-4545", "+15 pcs"]].map(([time, label, qty]) => <div key={time} className="grid grid-cols-[62px_1fr_auto] gap-2"><span className="text-slate-400">{time}</span><span className="text-slate-600">{label}</span><b className={qty.startsWith("+") ? "text-emerald-600" : "text-rose-600"}>{qty}</b></div>)}
            </div>
          </div>
          <div className="border-t border-slate-100 p-5">
            <h3 className="text-xs font-extrabold uppercase tracking-[0.12em] text-slate-500">Actions</h3>
            <div className="mt-3 grid grid-cols-2 gap-2"><Button variant="success" disabled={busy} onClick={() => investigate(selected)}>Investigate</Button><Button disabled={busy} onClick={() => setDialog("request")}>Request Clarification</Button><Button variant="secondary" disabled={busy} onClick={() => setDialog("adjust")}>Adjust Stock</Button><Button variant="danger" disabled={busy} onClick={() => setDialog("escalate")}>Escalate</Button></div>
            <textarea className="mt-3 min-h-24 w-full rounded-xl border border-slate-200 p-3 text-xs outline-none focus:border-indigo-400" placeholder="Write your notes here..." value={savedNote} onChange={(e) => setSavedNote(e.target.value)} />
            <Button className="mt-2 w-full" variant="secondary" onClick={() => notify(savedNote.trim() ? "Exception note saved." : "Enter a note before saving.", savedNote.trim() ? "success" : "warning")}><span className="flex items-center justify-center gap-2"><Save size={14} />Save Note</span></Button>
          </div>
        </Card> : null}
      </div>

      <Modal open={dialog !== null} onClose={() => setDialog(null)} title={dialog === "request" ? "Request information" : dialog === "adjust" ? "Request stock adjustment" : "Escalate exception"} description="Complete the controlled inventory action with traceable remarks." footer={<><Button variant="secondary" onClick={() => setDialog(null)}>Cancel</Button><Button variant={dialog === "escalate" ? "danger" : "primary"} disabled={busy} onClick={submitDialog}>{busy ? "Saving..." : "Confirm action"}</Button></>}>
        <div className="space-y-4">
          <div className="rounded-2xl bg-slate-50 p-4 text-sm"><div className="font-bold text-slate-900">{selected?.id} · {selected?.type}</div><div className="mt-1 text-slate-500">{selected?.outlet} · {selected?.product}</div></div>
          {dialog !== "adjust" ? <label className="block text-sm font-semibold text-slate-700">Send / escalate to<Select className="mt-2 w-full" value={recipient} onChange={(e) => setRecipient(e.target.value)}><option>Outlet In-charge</option><option>Inventory Team</option><option>Regional Manager</option><option>Operations Head</option></Select></label> : <label className="block text-sm font-semibold text-slate-700">Verified physical quantity<Input className="mt-2 w-full" type="number" min="0" placeholder="Enter physical quantity" value={physicalQty} onChange={(e) => setPhysicalQty(e.target.value)} /></label>}
          <label className="block text-sm font-semibold text-slate-700">Remarks<textarea className="mt-2 min-h-28 w-full rounded-xl border border-slate-200 bg-white p-3 text-sm font-normal outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50" placeholder="Add investigation notes or reason..." value={remarks} onChange={(e) => setRemarks(e.target.value)} /></label>
        </div>
      </Modal>
    </>
  );
}
