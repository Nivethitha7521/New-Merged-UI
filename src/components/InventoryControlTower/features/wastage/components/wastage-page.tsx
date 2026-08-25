"use client";

import { useMemo, useState } from "react";
import { CheckCircle2, Clock3, Eye, IndianRupee, MessageSquareMore, Settings2, Trash2, XCircle } from "lucide-react";
import { Button, Card, DetailList, FilterBar, Input, Kpi, PageHeader, Pager, Select, StatusBadge, Tabs } from "@/components/InventoryControlTower/shared/components/ui";
import { DataTable } from "@/components/InventoryControlTower/shared/components/data-table";
import { Modal, useActionCenter } from "@/components/InventoryControlTower/shared/components/action-center";
import { apiRequest } from "@/components/InventoryControlTower/shared/lib/api";

const initialRows = [
  { id: "WST-2026/07/265", outlet: "SB Outlet", date: "26 Jul 11:10 AM", product: "Milk Bread", reason: "Expired", qty: 35, uom: "Pcs", rate: 50, value: "₹1,750", requestedBy: "Karthik", role: "Store In-charge", status: "Pending", remark: "Expired yesterday. Not suitable for outward." },
  { id: "WST-2026/07/264", outlet: "BN1 Outlet", date: "26 Jul 10:45 AM", product: "Black Forest Cake", reason: "Damaged", qty: 4, uom: "Kg", rate: 490, value: "₹1,960", requestedBy: "Suresh", role: "Store In-charge", status: "Pending", remark: "Packaging damaged during handling." },
  { id: "WST-2026/07/263", outlet: "RS Outlet", date: "26 Jul 10:30 AM", product: "Veg Puff", reason: "Burnt", qty: 60, uom: "Pcs", rate: 10, value: "₹600", requestedBy: "Priya", role: "Asst. Manager", status: "Pending", remark: "Production quality issue." },
  { id: "WST-2026/07/262", outlet: "KK Outlet", date: "26 Jul 10:20 AM", product: "Brown Bun", reason: "Stale", qty: 50, uom: "Pcs", rate: 5, value: "₹250", requestedBy: "Manoj", role: "Store In-charge", status: "Pending", remark: "Shelf-life exceeded." },
  { id: "WST-2026/07/261", outlet: "PMK Outlet", date: "26 Jul 09:50 AM", product: "Cream Roll", reason: "Expired", qty: 25, uom: "Pcs", rate: 15, value: "₹375", requestedBy: "Ravi", role: "Store In-charge", status: "Pending", remark: "Batch expired." },
  { id: "WST-2026/07/260", outlet: "Trichy Outlet", date: "26 Jul 09:30 AM", product: "Veg Sandwich", reason: "Customer Return", qty: 15, uom: "Pcs", rate: 20, value: "₹300", requestedBy: "Kannan", role: "Store In-charge", status: "Pending", remark: "Approved customer return." },
  { id: "WST-2026/07/259", outlet: "Madurai Outlet", date: "26 Jul 09:15 AM", product: "Orange Juice 200ml", reason: "Leakage", qty: 10, uom: "Pcs", rate: 15, value: "₹150", requestedBy: "Deepa", role: "Store In-charge", status: "Approved", remark: "Leakage confirmed." },
  { id: "WST-2026/07/258", outlet: "Vellore Outlet", date: "26 Jul 08:55 AM", product: "Pineapple Pastry", reason: "Damaged", qty: 8, uom: "Pcs", rate: 35, value: "₹280", requestedBy: "Karthi", role: "Asst. Manager", status: "Rejected", remark: "Insufficient evidence." },
];

const tabs = [
  { label: "Pending", value: "Pending", count: 18 }, { label: "Approved", value: "Approved", count: 8 }, { label: "Rejected", value: "Rejected", count: 2 }, { label: "All", value: "All" },
];

export function WastagePage() {
  const { notify } = useActionCenter();
  const [rows, setRows] = useState(initialRows);
  const [tab, setTab] = useState("Pending");
  const [query, setQuery] = useState("");
  const [outletFilter, setOutletFilter] = useState("All Outlets");
  const [reasonFilter, setReasonFilter] = useState("All Reasons");
  const [selectedId, setSelectedId] = useState(initialRows[0].id);
  const [decision, setDecision] = useState<"approve" | "reject" | "info" | null>(null);
  const [remarks, setRemarks] = useState("");
  const [busy, setBusy] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [page, setPage] = useState(1);
  const selected = rows.find((row) => row.id === selectedId) || rows[0];
  const outlets = Array.from(new Set(rows.map((row) => row.outlet)));
  const reasons = Array.from(new Set(rows.map((row) => row.reason)));

  const filtered = useMemo(() => rows.filter((row) => {
    const needle = query.toLowerCase();
    return (tab === "All" || row.status === tab) && (outletFilter === "All Outlets" || row.outlet === outletFilter) && (reasonFilter === "All Reasons" || row.reason === reasonFilter) && (!needle || [row.id, row.product, row.outlet, row.requestedBy].some((value) => value.toLowerCase().includes(needle)));
  }), [outletFilter, query, reasonFilter, rows, tab]);

  async function submitDecision() {
    if (!decision || !selected) return;
    if (decision === "reject" && !remarks.trim()) { notify("Please enter a rejection reason.", "error"); return; }
    if (decision === "info" && !remarks.trim()) { notify("Please specify the information required.", "error"); return; }
    setBusy(true);
    if (decision === "info") {
      const result = await apiRequest(`/wastage/${selected.id}/action`, { method: "POST", body: JSON.stringify({ action: "request_info", remarks }) });
      setRows((current) => current.map((row) => row.id === selected.id ? { ...row, status: "Pending" } : row));
      setBusy(false); setDecision(null); setRemarks("");
      notify(result.ok ? `${selected.id}: clarification requested.` : `${selected.id}: clarification marked locally; backend unavailable.`, result.ok ? "success" : "warning");
      return;
    }
    const result = await apiRequest(`/wastage/${selected.id}/decision`, { method: "POST", body: JSON.stringify({ decision, remarks: remarks || null }) });
    const nextStatus = decision === "approve" ? "Approved" : "Rejected";
    setRows((current) => current.map((row) => row.id === selected.id ? { ...row, status: nextStatus } : row));
    setBusy(false); setDecision(null); setRemarks("");
    notify(result.ok ? `${selected.id} ${nextStatus.toLowerCase()} successfully.` : `${selected.id} marked ${nextStatus.toLowerCase()} locally. FastAPI is unavailable.`, result.ok ? "success" : "warning");
  }

  return (
    <>
      <PageHeader title="Wastage Approval" subtitle="Review, verify and approve inventory wastage requests from outlets" action={<Button variant="secondary" onClick={() => setSettingsOpen(true)}><span className="flex items-center gap-2"><Settings2 size={14} />Approval Settings</span></Button>} />
      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-5">
        <Kpi label="Pending Approval" value="18" trend="₹24,560" icon={<Clock3 size={19} />} tone="orange" />
        <Kpi label="High Value (>₹5,000)" value="5" trend="₹15,230" icon={<Trash2 size={19} />} tone="red" />
        <Kpi label="Approved Today" value="8" trend="₹8,750" icon={<CheckCircle2 size={19} />} tone="green" />
        <Kpi label="Rejected Today" value="2" trend="₹1,250" icon={<XCircle size={19} />} tone="red" />
        <Kpi label="Total Wastage MTD" value="₹1,25,430" trend="Inventory loss value" icon={<IndianRupee size={19} />} tone="violet" />
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-[1fr_360px]">
        <Card className="min-w-0 overflow-hidden">
          <Tabs tabs={tabs} value={tab} onChange={setTab} />
          <FilterBar>
            <Select value={outletFilter} onChange={(e) => setOutletFilter(e.target.value)}><option>All Outlets</option>{outlets.map((item) => <option key={item}>{item}</option>)}</Select>
            <Select value={reasonFilter} onChange={(e) => setReasonFilter(e.target.value)}><option>All Reasons</option>{reasons.map((item) => <option key={item}>{item}</option>)}</Select>
            <Input className="w-full sm:w-64" placeholder="Search product, reference, requester..." value={query} onChange={(e) => setQuery(e.target.value)} />
            <Button variant="secondary" onClick={() => { setOutletFilter("All Outlets"); setReasonFilter("All Reasons"); setQuery(""); }}>Filters</Button>
            <Select defaultValue="Newest First"><option>Newest First</option><option>Highest Value</option><option>Oldest First</option></Select>
          </FilterBar>
          <DataTable headers={["Request ID", "Outlet", "Date & Time", "Product", "Reason", "Qty", "UoM", "Value", "Status", "Requested By", "Action"]} rows={filtered.map((row) => [
            <button key="id" className="text-left" onClick={() => setSelectedId(row.id)}><b>{row.id}</b>{Number(row.value.replace(/\D/g, "")) > 1000 ? <div className="mt-1 text-[9px] font-bold text-rose-600">High Value</div> : null}</button>, row.outlet, row.date,
            <b key="product">{row.product}</b>, <StatusBadge key="reason" value={row.reason} />, row.qty, row.uom, row.value, <StatusBadge key="status" value={row.status} />,
            <div key="requester"><b>{row.requestedBy}</b><div className="text-[10px] text-slate-400">{row.role}</div></div>,
            <div key="actions" className="flex gap-1"><Button variant="secondary" className="h-8 px-2" onClick={() => setSelectedId(row.id)}><Eye size={13} /></Button>{row.status === "Pending" ? <><Button variant="success" className="h-8 px-2" onClick={() => { setSelectedId(row.id); setDecision("approve"); }}>✓</Button><Button variant="danger" className="h-8 px-2" onClick={() => { setSelectedId(row.id); setDecision("reject"); }}>×</Button></> : null}</div>,
          ])} />
          <Pager page={page} pages={2} onChange={setPage} summary="Showing 1 to 8 of 18 requests" />
        </Card>

        <Card className="overflow-hidden xl:sticky xl:top-24 xl:self-start">
          <div className="p-5">
            <div className="flex items-center justify-between"><StatusBadge value={selected.reason === "Expired" ? "High Value" : selected.reason} /><StatusBadge value={selected.status} /></div>
            <h2 className="mt-4 text-lg font-extrabold text-slate-950">{selected.id}</h2>
            <h3 className="mt-5 text-xs font-extrabold uppercase tracking-[0.12em] text-slate-500">Request Information</h3>
            <DetailList rows={[["Outlet", selected.outlet], ["Date & Time", selected.date], ["Requested By", `${selected.requestedBy} (${selected.role})`]]} />
            <h3 className="mt-4 text-xs font-extrabold uppercase tracking-[0.12em] text-slate-500">Product Information</h3>
            <DetailList rows={[["Product", selected.product], ["Category", selected.product.includes("Cake") ? "Cakes" : "Bakery"], ["Batch / Lot", "BRD-260725-01"], ["Mfg Date", "20 Jul 2026"], ["Exp Date", "25 Jul 2026"]]} />
            <h3 className="mt-4 text-xs font-extrabold uppercase tracking-[0.12em] text-slate-500">Wastage Details</h3>
            <DetailList rows={[["Reason", selected.reason], ["Quantity", `${selected.qty} ${selected.uom}`], ["Rate", `₹${selected.rate.toFixed(2)}`], ["Total Value", selected.value], ["Remarks", selected.remark]]} />
            <div className="mt-4 grid grid-cols-3 gap-2">{[1,2,3].map((index) => <button key={index} onClick={() => notify(`Evidence attachment ${index} opened.`, "info")} className="flex aspect-[4/3] items-center justify-center rounded-xl border border-amber-200 bg-gradient-to-br from-amber-50 to-orange-100 text-[10px] font-bold text-amber-700">Evidence {index}</button>)}</div>
          </div>
          <div className="border-t border-slate-100 p-5">
            <h3 className="text-xs font-extrabold uppercase tracking-[0.12em] text-slate-500">Approval Action</h3>
            <div className="mt-3 grid grid-cols-3 gap-2"><Button variant="success" disabled={selected.status !== "Pending"} onClick={() => setDecision("approve")}>Approve</Button><Button variant="danger" disabled={selected.status !== "Pending"} onClick={() => setDecision("reject")}>Reject</Button><Button variant="secondary" onClick={() => setDecision("info")}><span className="flex items-center justify-center gap-1"><MessageSquareMore size={13} />Info</span></Button></div>
          </div>
        </Card>
      </div>

      <Modal open={decision !== null} onClose={() => setDecision(null)} title={decision === "approve" ? "Approve wastage request" : decision === "reject" ? "Reject wastage request" : "Request more information"} description={decision === "approve" ? "Confirm the inventory write-off approval." : decision === "reject" ? "Provide a rejection reason so the outlet can correct and resubmit." : "Send a clarification request to the responsible outlet."} footer={<><Button variant="secondary" onClick={() => setDecision(null)}>Cancel</Button><Button variant={decision === "approve" ? "success" : decision === "reject" ? "danger" : "primary"} disabled={busy} onClick={submitDecision}>{busy ? "Saving..." : "Confirm"}</Button></>}>
        <div className="rounded-2xl bg-slate-50 p-4 text-sm"><div className="font-bold text-slate-900">{selected.id} · {selected.product}</div><div className="mt-1 text-slate-500">{selected.outlet} · {selected.qty} {selected.uom} · {selected.value}</div></div>
        <label className="mt-4 block text-sm font-semibold text-slate-700">Remarks {decision === "approve" ? "(optional)" : "(required)"}<textarea className="mt-2 min-h-28 w-full rounded-xl border border-slate-200 p-3 text-sm font-normal outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50" value={remarks} onChange={(e) => setRemarks(e.target.value)} placeholder="Add approval note, rejection reason or information required..." /></label>
      </Modal>

      <Modal open={settingsOpen} onClose={() => setSettingsOpen(false)} title="Wastage Approval Settings" description="Configure approval thresholds and escalation controls." footer={<><Button variant="secondary" onClick={() => setSettingsOpen(false)}>Cancel</Button><Button onClick={() => { setSettingsOpen(false); notify("Wastage approval settings saved."); }}>Save Settings</Button></>}>
        <div className="grid gap-4 sm:grid-cols-2"><label className="text-sm font-semibold text-slate-700">High-value threshold<Input className="mt-2 w-full" defaultValue="5000" type="number" /></label><label className="text-sm font-semibold text-slate-700">Auto-escalate after<Select className="mt-2 w-full" defaultValue="4 hours"><option>2 hours</option><option>4 hours</option><option>8 hours</option></Select></label></div>
      </Modal>
    </>
  );
}
