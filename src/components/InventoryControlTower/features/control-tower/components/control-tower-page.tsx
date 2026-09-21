"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, ArrowRight, Boxes, Building2, ClipboardCheck, IndianRupee, PackageCheck, ReceiptText, RefreshCcw, Repeat2, Trash2 } from "lucide-react";
import { Button, Card, Kpi, PageHeader, SectionHeader, StatusBadge } from "@/components/InventoryControlTower/shared/components/ui";
import { DataTable } from "@/components/InventoryControlTower/shared/components/data-table";
import { Donut, TrendChart } from "@/components/InventoryControlTower/shared/components/charts";
import { exceptions, inventoryAccuracyTrend, outlets } from "@/components/InventoryControlTower/shared/data/mock";
import { money } from "@/components/InventoryControlTower/shared/lib/format";
import { apiRequest } from "@/components/InventoryControlTower/shared/lib/api";
import { useActionCenter } from "@/components/InventoryControlTower/shared/components/action-center";

export function ControlTowerPage() {
  const router = useRouter();
  const { notify } = useActionCenter();
  const [syncing, setSyncing] = useState(false);
  const [lastSync, setLastSync] = useState("38 sec ago");

  async function syncNow() {
    setSyncing(true);
    const result = await apiRequest("/control-tower/sync", { method: "POST" });
    if (!result.ok) await apiRequest("/control-tower/summary");
    setSyncing(false); setLastSync("just now");
    notify(result.ok ? "Inventory network synchronized successfully." : "Dashboard refreshed locally. FastAPI sync endpoint is unavailable.", result.ok ? "success" : "warning");
  }

  return (
    <>
      <PageHeader title="Inventory Control Tower" subtitle={`Real-time inventory health, receipts, variances, wastage, transfer status and exceptions across every outlet. Last network sync ${lastSync}.`} action={<Button variant="secondary" disabled={syncing} onClick={syncNow}><span className="flex items-center justify-center gap-2"><RefreshCcw className={syncing ? "animate-spin" : ""} size={15} />{syncing ? "Syncing..." : "Sync now"}</span></Button>} />

      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-6">
        <Kpi label="Total Outlets" value="15" trend="15 connected" icon={<Building2 size={19} />} />
        <Kpi label="Healthy Inventory" value="10" trend="67% of outlets" icon={<ClipboardCheck size={19} />} tone="green" />
        <Kpi label="Critical Outlets" value="2" trend="Immediate review" icon={<AlertTriangle size={19} />} tone="red" />
        <Kpi label="Pending Receipts" value="7" trend="Across 5 outlets" icon={<ReceiptText size={19} />} tone="orange" />
        <Kpi label="Wastage Pending" value="12" trend="Awaiting approval" icon={<Trash2 size={19} />} tone="violet" />
        <Kpi label="Inventory Value" value="₹28.45L" trend="Network on-hand" icon={<IndianRupee size={19} />} tone="cyan" />
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-[1.35fr_.75fr]">
        <Card className="overflow-hidden"><SectionHeader title="Outlet Status Overview" subtitle="Inventory-only health by outlet" action={<Button variant="secondary" className="h-8" onClick={() => router.push("/inventory-control-tower/outlets")}>View all outlets</Button>} /><DataTable headers={["Outlet", "Last Sync", "Stock Value", "Pending Receipts", "Variance Qty", "Health Score", "Status"]} rows={outlets.map((outlet) => [<b key="name">{outlet.name}</b>, outlet.lastSync, money(outlet.stockValue), outlet.pendingReceipts, <span key="variance" className={outlet.varianceQty < 0 ? "font-semibold text-rose-600" : "font-semibold text-emerald-600"}>{outlet.varianceQty > 0 ? `+${outlet.varianceQty}` : outlet.varianceQty} pcs</span>, `${outlet.health}%`, <StatusBadge key="status" value={outlet.status} />])} /></Card>
        <Card className="p-4 sm:p-5"><div className="flex items-start justify-between"><div><h2 className="font-bold text-slate-900">Network Stock Health</h2><p className="mt-1 text-xs text-slate-500">Current outlet classification</p></div><span className="rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-bold text-emerald-700">96.4% accuracy</span></div><Donut data={[{ name: "Healthy", value: 10 }, { name: "Warning", value: 3 }, { name: "Critical", value: 2 }]} /><div className="grid grid-cols-3 gap-2 text-center text-[10px] text-slate-500"><div className="rounded-xl bg-emerald-50 p-2"><b className="block text-lg text-emerald-600">10</b>Healthy</div><div className="rounded-xl bg-amber-50 p-2"><b className="block text-lg text-amber-600">3</b>Warning</div><div className="rounded-xl bg-rose-50 p-2"><b className="block text-lg text-rose-600">2</b>Critical</div></div></Card>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-[1fr_1fr]">
        <Card className="p-4 sm:p-5"><h2 className="font-bold text-slate-900">Inventory Movement Today</h2><p className="mt-1 text-xs text-slate-500">Physical stock flow across the network</p><div className="mt-5 grid grid-cols-5 items-center gap-2 text-center text-[10px] sm:text-xs">{[["Dispatched", "1,250", "bg-blue-100 text-blue-700"], ["Received", "1,210", "bg-emerald-100 text-emerald-700"], ["Outward", "850", "bg-amber-100 text-amber-700"], ["Wastage", "18", "bg-rose-100 text-rose-700"], ["Current", "340", "bg-violet-100 text-violet-700"]].map(([label, value, cls], index) => <div key={label} className="relative"><div className={`mx-auto flex h-11 w-11 items-center justify-center rounded-full font-extrabold ${cls}`}>{index === 0 ? <Boxes size={17} /> : index === 1 ? <PackageCheck size={17} /> : index === 2 ? <ArrowRight size={17} /> : index === 3 ? <Trash2 size={17} /> : <Boxes size={17} />}</div><div className="mt-2 font-bold text-slate-800">{value}</div><div className="text-slate-400">{label}</div></div>)}</div></Card>
        <Card className="overflow-hidden"><SectionHeader title="Top Low Stock Items" action={<Button variant="secondary" className="h-8" onClick={() => router.push("/inventory-control-tower/products")}>View all</Button>} /><DataTable headers={["Product", "Outlet", "Current", "Minimum", "Status"]} rows={[["Milk Bread", "BN1 Outlet", "6", "20", <StatusBadge key="l1" value="Critical" />], ["Veg Puff", "RS Outlet", "8", "15", <StatusBadge key="l2" value="Low Stock" />], ["Black Forest Cake", "PMK Outlet", "2", "10", <StatusBadge key="l3" value="Critical" />], ["Brown Bun", "BN1 Outlet", "5", "12", <StatusBadge key="l4" value="Low Stock" />], ["Paneer Puff", "RS Outlet", "6", "10", <StatusBadge key="l5" value="Low Stock" />]]} /></Card>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-3">
        <Card className="p-4 sm:p-5 xl:col-span-2"><div className="mb-3 flex items-end justify-between gap-3"><div><h2 className="font-bold text-slate-900">Inventory Health Score Trend</h2><p className="mt-1 text-xs text-slate-500">Expected stock compared with verified physical stock</p></div><div className="text-right"><div className="text-xl font-extrabold text-slate-900">96.4%</div><div className="text-[10px] font-semibold text-emerald-600">+3.6 pts in 7 days</div></div></div><TrendChart data={inventoryAccuracyTrend} /></Card>
        <Card className="p-4 sm:p-5"><h2 className="font-bold text-slate-900">Category-wise Stock Value</h2><Donut data={[{ name: "Bakery", value: 1245000 }, { name: "Snacks", value: 625000 }, { name: "Beverages", value: 485000 }, { name: "Ingredients", value: 390000 }, { name: "Others", value: 100300 }]} /></Card>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-3">
        <Card className="overflow-hidden"><SectionHeader title="Exception Center" action={<Button variant="secondary" className="h-8" onClick={() => router.push("/inventory-control-tower/exceptions")}>View all</Button>} /><DataTable headers={["Type", "Outlet", "Item / Issue", "Time", "Severity", "Action"]} rows={exceptions.slice(0, 4).map((item) => [item.type, item.outlet, item.product, item.time, <StatusBadge key="s" value={item.severity} />, <Button key="a" className="h-8 px-2.5 text-[10px]" onClick={() => router.push("/inventory-control-tower/exceptions")}>Investigate</Button>])} /></Card>
        <Card className="overflow-hidden"><SectionHeader title="Pending Receipts" action={<Button variant="secondary" className="h-8" onClick={() => router.push("/inventory-control-tower/transfers")}>View all</Button>} /><DataTable headers={["Transfer", "Outlet", "Dispatched", "Pending Since", "Action"]} rows={[["TRF-125", "BN1 Outlet", "25 Jul 08:30", "1h 45m", <Button key="p1" className="h-8 px-2" onClick={() => router.push("/inventory-control-tower/transfers")}>Follow Up</Button>], ["TRF-124", "RS Outlet", "25 Jul 09:00", "1h 15m", <Button key="p2" className="h-8 px-2" onClick={() => router.push("/inventory-control-tower/transfers")}>Follow Up</Button>], ["TRF-123", "PMK Outlet", "25 Jul 09:30", "45m", <Button key="p3" className="h-8 px-2" onClick={() => router.push("/inventory-control-tower/transfers")}>Follow Up</Button>]]} /></Card>
        <Card className="overflow-hidden"><SectionHeader title="Unapproved Wastage" action={<Button variant="secondary" className="h-8" onClick={() => router.push("/inventory-control-tower/wastage")}>View all</Button>} /><DataTable headers={["Outlet", "Item", "Qty", "Value", "Action"]} rows={[["BN1 Outlet", "Veg Puff", "12", "₹240", <Button key="w1" variant="success" className="h-8 px-2" onClick={() => router.push("/inventory-control-tower/wastage")}>Review</Button>], ["RS Outlet", "Milk Bread", "8", "₹160", <Button key="w2" variant="success" className="h-8 px-2" onClick={() => router.push("/inventory-control-tower/wastage")}>Review</Button>], ["SB Outlet", "Cake Slice", "5", "₹350", <Button key="w3" variant="success" className="h-8 px-2" onClick={() => router.push("/inventory-control-tower/wastage")}>Review</Button>]]} /></Card>
      </div>

      <Card className="mt-4 overflow-hidden"><SectionHeader title="Recent Alerts" action={<Button variant="secondary" className="h-8" onClick={() => router.push("/inventory-control-tower/alerts")}>View all alerts</Button>} /><div className="grid gap-2 p-4 sm:grid-cols-2 xl:grid-cols-4">{[["Negative stock", "Brown Bun · RS Outlet", "Critical"], ["Receipt mismatch", "Milk Bread · BN1 Outlet", "High"], ["High wastage", "Veg Puff · SB Outlet", "High"], ["Device offline", "KK Outlet Terminal 2", "Medium"]].map(([title, detail, severity]) => <button key={title} onClick={() => router.push("/inventory-control-tower/alerts")} className="rounded-xl border border-slate-100 p-3 text-left hover:bg-slate-50"><div className="flex items-center justify-between gap-2"><b className="text-xs text-slate-800">{title}</b><StatusBadge value={severity} /></div><div className="mt-1 text-[11px] text-slate-500">{detail}</div></button>)}</div></Card>
    </>
  );
}
