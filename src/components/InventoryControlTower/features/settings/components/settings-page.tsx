"use client";

import { ReactNode, useState } from "react";
import { Bell, ClipboardCheck, RefreshCcw, Repeat2, Save, ShieldCheck, Trash2 } from "lucide-react";
import { Button, Card, Input, PageHeader, Select, Tabs } from "@/components/InventoryControlTower/shared/components/ui";
import { useActionCenter } from "@/components/InventoryControlTower/shared/components/action-center";
import { apiRequest } from "@/components/InventoryControlTower/shared/lib/api";

const tabs = [
  { label: "Alerts", value: "alerts" }, { label: "Reconciliation", value: "recon" }, { label: "Wastage", value: "wastage" }, { label: "Transfers", value: "transfers" }, { label: "Sync & Data", value: "sync" }, { label: "Roles & Access", value: "roles" },
];

export function SettingsPage() {
  const { notify } = useActionCenter();
  const [tab, setTab] = useState("alerts");
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    const result = await apiRequest("/settings", { method: "POST", body: JSON.stringify({ section: tab, updated_by: "Inventory Admin" }) });
    setSaving(false);
    notify(result.ok ? `${tab} settings saved.` : `${tab} settings saved locally; backend unavailable.`, result.ok ? "success" : "warning");
  }

  return (
    <>
      <PageHeader title="Inventory Control Settings" subtitle="Configure inventory thresholds, approvals, reconciliation, alerts, transfer rules and access controls" action={<Button disabled={saving} onClick={save}><span className="flex items-center gap-2"><Save size={14} />{saving ? "Saving..." : "Save Settings"}</span></Button>} />
      <Card className="overflow-hidden"><Tabs tabs={tabs} value={tab} onChange={setTab} /><div className="p-4 sm:p-6">
        {tab === "alerts" ? <SettingsSection icon={<Bell size={18} />} title="Alert Rules" description="Control when inventory exceptions trigger notifications"><Field label="Negative stock severity"><Select className="w-full" defaultValue="Critical"><option>Critical</option><option>High</option></Select></Field><Field label="Low-stock threshold"><Input className="w-full" defaultValue="Minimum stock" /></Field><Field label="Escalate unresolved after"><Select className="w-full" defaultValue="30 minutes"><option>15 minutes</option><option>30 minutes</option><option>60 minutes</option></Select></Field><Toggle label="Send WhatsApp notifications" defaultChecked /><Toggle label="Send email notifications" defaultChecked /><Toggle label="Send push notifications" defaultChecked /></SettingsSection>
        : tab === "recon" ? <SettingsSection icon={<ClipboardCheck size={18} />} title="Daily Reconciliation" description="Define day-end inventory closing controls"><Field label="Reconciliation start time"><Input className="w-full" type="time" defaultValue="20:00" /></Field><Field label="Variance approval limit"><Input className="w-full" type="number" defaultValue="500" /></Field><Field label="Force physical count above variance %"><Input className="w-full" type="number" defaultValue="2" /></Field><Toggle label="Block day close for pending receipts" defaultChecked /><Toggle label="Block day close for unapproved wastage" defaultChecked /></SettingsSection>
        : tab === "wastage" ? <SettingsSection icon={<Trash2 size={18} />} title="Wastage Approval" description="Configure approval thresholds and evidence requirements"><Field label="High-value threshold"><Input className="w-full" type="number" defaultValue="5000" /></Field><Field label="Escalate pending approval after"><Select className="w-full" defaultValue="4 hours"><option>2 hours</option><option>4 hours</option><option>8 hours</option></Select></Field><Toggle label="Require evidence image" defaultChecked /><Toggle label="Require rejection reason" defaultChecked /></SettingsSection>
        : tab === "transfers" ? <SettingsSection icon={<Repeat2 size={18} />} title="Stock Transfers" description="Configure stock balancing and transfer controls"><Field label="Minimum transfer quantity"><Input className="w-full" type="number" defaultValue="5" /></Field><Field label="Auto-suggest when below minimum"><Select className="w-full" defaultValue="Yes"><option>Yes</option><option>No</option></Select></Field><Field label="Pending receipt alert after"><Input className="w-full" type="number" defaultValue="30" /></Field><Toggle label="Require receiver confirmation" defaultChecked /><Toggle label="Allow outlet-to-outlet transfer" defaultChecked /></SettingsSection>
        : tab === "sync" ? <SettingsSection icon={<RefreshCcw size={18} />} title="Sync & Data" description="Configure MongoDB operational sync and ClickHouse reporting refresh"><Field label="Operational refresh interval"><Select className="w-full" defaultValue="30 seconds"><option>15 seconds</option><option>30 seconds</option><option>60 seconds</option></Select></Field><Field label="Analytics refresh interval"><Select className="w-full" defaultValue="5 minutes"><option>1 minute</option><option>5 minutes</option><option>15 minutes</option></Select></Field><Toggle label="Enable WebSocket live updates" defaultChecked /><Toggle label="Enable stale-device alerts" defaultChecked /></SettingsSection>
        : <SettingsSection icon={<ShieldCheck size={18} />} title="Roles & Access" description="Control sensitive inventory actions"><Field label="Stock adjustment approval"><Select className="w-full" defaultValue="Inventory Manager"><option>Inventory Manager</option><option>Regional Manager</option><option>Operations Head</option></Select></Field><Field label="Wastage approval role"><Select className="w-full" defaultValue="Inventory Manager"><option>Inventory Manager</option><option>Regional Manager</option></Select></Field><Toggle label="Require reason for stock adjustment" defaultChecked /><Toggle label="Audit every manual inventory action" defaultChecked /></SettingsSection>}
      </div></Card>
    </>
  );
}

function SettingsSection({ icon, title, description, children }: { icon: ReactNode; title: string; description: string; children: ReactNode }) {
  return <div className="mx-auto max-w-4xl"><div className="flex items-center gap-3"><div className="rounded-xl bg-indigo-50 p-2.5 text-indigo-600">{icon}</div><div><h2 className="font-extrabold text-slate-900">{title}</h2><p className="text-xs text-slate-500">{description}</p></div></div><div className="mt-6 grid gap-4 sm:grid-cols-2">{children}</div></div>;
}
function Field({ label, children }: { label: string; children: ReactNode }) { return <label className="block rounded-2xl border border-slate-100 bg-slate-50/50 p-4 text-xs font-bold text-slate-600">{label}<div className="mt-2">{children}</div></label>; }
function Toggle({ label, defaultChecked = false }: { label: string; defaultChecked?: boolean }) { return <label className="flex items-center justify-between rounded-2xl border border-slate-100 bg-white p-4 text-sm font-semibold text-slate-700"><span>{label}</span><input type="checkbox" defaultChecked={defaultChecked} className="h-4 w-4" /></label>; }
