"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, Bell, Info, Mail, MessageCircle, Send, Siren } from "lucide-react";
import { Button, Card, DetailList, FilterBar, Input, Kpi, PageHeader, Pager, Select, StatusBadge, Tabs } from "@/components/InventoryControlTower/shared/components/ui";
import { exceptions } from "@/components/InventoryControlTower/shared/data/mock";
import { Modal, useActionCenter } from "@/components/InventoryControlTower/shared/components/action-center";
import { apiRequest } from "@/components/InventoryControlTower/shared/lib/api";

const baseAlerts = [
  { id: "AL-101", severity: "Critical", title: "Negative Stock Detected", outlet: "BN1 Outlet", product: "Milk Bread", details: "Milk Bread stock is -7 pcs. Minimum stock is 20 pcs.", time: "10:25 AM", status: "Unresolved", unread: true },
  { id: "AL-102", severity: "High", title: "Receipt Not Confirmed", outlet: "RS Outlet", product: "Transfer DSP-1256", details: "Receipt not confirmed yet. Dispatched 45 mins ago.", time: "10:10 AM", status: "Unresolved", unread: true },
  { id: "AL-103", severity: "Medium", title: "High Wastage Alert", outlet: "SB Outlet", product: "Veg Puff", details: "Today wastage is ₹1,850. Threshold is ₹1,500.", time: "09:55 AM", status: "Pending Review", unread: true },
  { id: "AL-104", severity: "High", title: "Low Stock Alert", outlet: "KK Outlet", product: "Paneer Puff", details: "Current stock is 8 pcs. Minimum stock is 25 pcs.", time: "09:40 AM", status: "Pending Review", unread: false },
  { id: "AL-105", severity: "Low", title: "Device Offline", outlet: "PMK Outlet", product: "PMK-POS-01", details: "Inventory device has been offline since 25 mins.", time: "09:25 AM", status: "Info", unread: false },
  { id: "AL-106", severity: "Info", title: "Dispatch Completed", outlet: "SB Outlet", product: "DSP-1257", details: "Inventory dispatch delivered and receipt verified by SB Outlet.", time: "09:15 AM", status: "Resolved", unread: false },
  { id: "AL-107", severity: "Medium", title: "Expiry Product Alert", outlet: "RS Outlet", product: "Whipped Cream", details: "Batch WC250726 expires in 1 day.", time: "09:05 AM", status: "Pending Review", unread: false },
  { id: "AL-108", severity: "High", title: "Return Without Approval", outlet: "BN1 Outlet", product: "Milk Bread", details: "Return of ₹620 is pending approval.", time: "08:50 AM", status: "Pending Review", unread: false },
];

const tabs = [
  { label: "All Alerts", value: "all", count: 35 }, { label: "Unread", value: "unread", count: 12 }, { label: "Critical", value: "Critical", count: 3 }, { label: "High", value: "High", count: 8 }, { label: "Medium", value: "Medium", count: 12 }, { label: "Low", value: "Low", count: 5 }, { label: "Info", value: "Info", count: 7 },
];

export function AlertsPage() {
  const { notify } = useActionCenter();
  const [alerts, setAlerts] = useState(baseAlerts);
  const [tab, setTab] = useState("all");
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("All Types");
  const [selectedId, setSelectedId] = useState(baseAlerts[0].id);
  const [recipients, setRecipients] = useState<string[]>(["Outlet In-charge"]);
  const [message, setMessage] = useState("Alert: Milk Bread is -7 pcs in BN1 Outlet. Minimum stock is 20 pcs. Please take immediate action.");
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [scheduleAt, setScheduleAt] = useState("");
  const [busy, setBusy] = useState(false);
  const [page, setPage] = useState(1);
  const selected = alerts.find((item) => item.id === selectedId) || alerts[0];

  const filtered = useMemo(() => alerts.filter((alert) => {
    const needle = query.toLowerCase();
    return (tab === "all" || (tab === "unread" ? alert.unread : alert.severity === tab)) && (typeFilter === "All Types" || alert.title === typeFilter) && (!needle || [alert.title, alert.outlet, alert.product, alert.details].some((value) => value.toLowerCase().includes(needle)));
  }), [alerts, query, tab, typeFilter]);
  const types = Array.from(new Set(alerts.map((item) => item.title)));

  function selectAlert(id: string) {
    const alert = alerts.find((item) => item.id === id);
    if (!alert) return;
    setSelectedId(id);
    setAlerts((current) => current.map((item) => item.id === id ? { ...item, unread: false } : item));
    setMessage(`Alert: ${alert.title} in ${alert.outlet}. ${alert.product}: ${alert.details} Please take immediate action.`);
  }

  function toggleRecipient(name: string) {
    setRecipients((current) => current.includes(name) ? current.filter((item) => item !== name) : [...current, name]);
  }

  async function sendAlert(schedule?: string) {
    if (recipients.length === 0) { notify("Select at least one recipient.", "error"); return; }
    if (!message.trim()) { notify("Alert message cannot be empty.", "error"); return; }
    setBusy(true);
    const result = await apiRequest(schedule ? "/alerts/schedule" : "/alerts/send", { method: "POST", body: JSON.stringify({ alert_id: selected.id, recipients, message, schedule_at: schedule || null }) });
    setBusy(false);
    if (schedule) setScheduleOpen(false);
    notify(result.ok ? (schedule ? `Alert scheduled for ${new Date(schedule).toLocaleString()}.` : `Alert sent to ${recipients.join(", ")}.`) : (schedule ? "Alert schedule saved locally; backend unavailable." : "Alert marked as sent locally; backend unavailable."), result.ok ? "success" : "warning");
  }

  async function escalate() {
    setBusy(true);
    const result = await apiRequest("/alerts/escalate", { method: "POST", body: JSON.stringify({ alert_id: selected.id, recipients: ["Regional Manager", "Operations Head"], message, schedule_at: null }) });
    setBusy(false);
    setAlerts((current) => current.map((item) => item.id === selected.id ? { ...item, status: "Escalated" } : item));
    notify(result.ok ? `${selected.id} escalated.` : `${selected.id} marked escalated locally; backend unavailable.`, result.ok ? "success" : "warning");
  }

  return (
    <>
      <PageHeader title="Alerts & Notifications" subtitle="Real-time inventory alerts, notification history and escalation controls" />
      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-6">
        <Kpi label="Total Alerts" value="35" trend="All time" icon={<Bell size={19} />} />
        <Kpi label="Critical" value="3" trend="Requires immediate action" icon={<Siren size={19} />} tone="red" />
        <Kpi label="High" value="8" trend="Action required today" icon={<AlertTriangle size={19} />} tone="orange" />
        <Kpi label="Medium" value="12" trend="Needs review" icon={<AlertTriangle size={19} />} tone="orange" />
        <Kpi label="Low" value="5" trend="Minor issues" icon={<Info size={19} />} />
        <Kpi label="Info" value="7" trend="For information" icon={<Info size={19} />} tone="green" />
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-[1fr_365px]">
        <Card className="min-w-0 overflow-hidden">
          <Tabs tabs={tabs} value={tab} onChange={setTab} />
          <FilterBar><Button variant="secondary" onClick={() => { setTypeFilter("All Types"); setQuery(""); }}>Filters</Button><Select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}><option>All Types</option>{types.map((type) => <option key={type}>{type}</option>)}</Select><Input className="w-full sm:w-64" placeholder="Search alerts..." value={query} onChange={(e) => setQuery(e.target.value)} /><Select defaultValue="Newest First"><option>Newest First</option><option>Oldest First</option></Select></FilterBar>
          <div className="divide-y divide-slate-100">
            {filtered.map((alert) => <button key={alert.id} onClick={() => selectAlert(alert.id)} className={`grid w-full grid-cols-[auto_1fr] gap-3 p-4 text-left transition sm:grid-cols-[auto_120px_1fr_90px_auto_auto] sm:items-center ${selected.id === alert.id ? "bg-indigo-50/50" : "hover:bg-slate-50"}`}>
              <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${alert.severity === "Critical" ? "bg-rose-100 text-rose-700" : alert.severity === "High" ? "bg-orange-100 text-orange-700" : alert.severity === "Medium" ? "bg-amber-100 text-amber-700" : "bg-blue-100 text-blue-700"}`}><AlertTriangle size={17} /></span>
              <div className="sm:hidden"><div className="font-bold text-slate-900">{alert.title}</div><div className="mt-1 text-xs text-slate-500">{alert.outlet} · {alert.details}</div><div className="mt-2 flex gap-2"><StatusBadge value={alert.severity} /><span className="text-[10px] text-slate-400">{alert.time}</span></div></div>
              <div className="hidden font-bold text-slate-800 sm:block">{alert.outlet}</div>
              <div className="hidden sm:block"><div className="font-bold text-slate-900">{alert.title}</div><div className="mt-0.5 text-xs text-slate-500">{alert.details}</div></div>
              <div className="hidden text-xs text-slate-500 sm:block">{alert.time}</div>
              <div className="hidden sm:block"><StatusBadge value={alert.severity} /></div>
              <div className="hidden gap-1 sm:flex"><span className="flex h-8 w-8 items-center justify-center rounded-lg border border-emerald-200 text-emerald-600"><MessageCircle size={14} /></span><span className="flex h-8 w-8 items-center justify-center rounded-lg border border-indigo-200 text-indigo-600"><Mail size={14} /></span><span className="flex h-8 w-8 items-center justify-center rounded-lg border border-blue-200 text-blue-600"><Bell size={14} /></span></div>
            </button>)}
          </div>
          <Pager page={page} pages={5} onChange={setPage} summary="Showing 1 to 8 of 35 alerts" />
        </Card>

        <Card className="overflow-hidden xl:sticky xl:top-24 xl:self-start">
          <div className="p-5"><div className="flex items-center justify-between"><h3 className="text-sm font-extrabold text-slate-900">Alert Detail</h3><StatusBadge value={selected.severity} /></div><div className="mt-4 flex items-center justify-between"><h2 className="text-lg font-extrabold text-slate-950">{selected.title}</h2><StatusBadge value={selected.status} /></div><div className="mt-4"><DetailList rows={[["Outlet", selected.outlet], ["Product", selected.product], ["Current Stock", selected.id === "AL-101" ? <span key="cs" className="text-rose-600">-7 pcs</span> : "—"], ["Minimum Stock", selected.id === "AL-101" ? "20 pcs" : "—"], ["Time Detected", selected.time], ["Detected By", "System"]]} /></div></div>
          <div className="border-t border-slate-100 p-5"><h3 className="text-xs font-extrabold uppercase tracking-[0.12em] text-slate-500">Alert Timeline</h3><div className="mt-3 space-y-3 text-xs">{[["10:25 AM", "Alert generated by system"], ["10:26 AM", "WhatsApp sent to outlet in-charge"], ["10:26 AM", "Email sent to inventory team"], ["10:27 AM", "Push notification sent"], ["10:30 AM", "Viewed by Inventory Admin"]].map(([time, text]) => <div key={text} className="flex gap-2"><span className="text-slate-400">{time}</span><span className="text-slate-600">{text}</span></div>)}</div></div>
          <div className="border-t border-slate-100 p-5"><h3 className="text-xs font-extrabold uppercase tracking-[0.12em] text-slate-500">Send Notification / Escalate</h3><div className="mt-3 space-y-2">{["Outlet In-charge", "Inventory Team", "Regional Manager", "Operations Head"].map((name) => <label key={name} className="flex items-center justify-between text-xs text-slate-700"><span className="flex items-center gap-2"><input type="checkbox" checked={recipients.includes(name)} onChange={() => toggleRecipient(name)} />{name}</span><span className="flex gap-1 text-emerald-600"><MessageCircle size={13} /><Mail size={13} /></span></label>)}</div><Select className="mt-4 w-full" defaultValue="Negative Stock Alert"><option>Negative Stock Alert</option><option>Low Stock Alert</option><option>Pending Receipt Alert</option><option>Wastage Alert</option></Select><textarea className="mt-3 min-h-24 w-full rounded-xl border border-slate-200 p-3 text-xs outline-none focus:border-indigo-400" value={message} onChange={(e) => setMessage(e.target.value)} /><div className="mt-3 grid grid-cols-3 gap-2"><Button variant="success" disabled={busy} onClick={() => sendAlert()}><span className="flex items-center justify-center gap-1"><Send size={13} />Send</span></Button><Button disabled={busy} onClick={() => setScheduleOpen(true)}>Schedule</Button><Button variant="secondary" disabled={busy} onClick={escalate}>Escalate</Button></div></div>
        </Card>
      </div>

      <Modal open={scheduleOpen} onClose={() => setScheduleOpen(false)} title="Schedule inventory alert" description="Choose when this alert should be delivered to the selected recipients." footer={<><Button variant="secondary" onClick={() => setScheduleOpen(false)}>Cancel</Button><Button disabled={busy || !scheduleAt} onClick={() => sendAlert(scheduleAt)}>{busy ? "Scheduling..." : "Schedule alert"}</Button></>}><label className="block text-sm font-semibold text-slate-700">Date and time<Input className="mt-2 w-full" type="datetime-local" value={scheduleAt} onChange={(e) => setScheduleAt(e.target.value)} /></label><div className="mt-4 rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">Recipients: <b className="text-slate-900">{recipients.join(", ") || "None selected"}</b></div></Modal>
    </>
  );
}
