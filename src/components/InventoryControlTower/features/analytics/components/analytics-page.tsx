"use client";

import { useState } from "react";
import { Boxes, ClipboardCheck, Download, IndianRupee, PackageSearch, ReceiptText, Trash2 } from "lucide-react";
import { Button, Card, FilterBar, Kpi, PageHeader, Select, Tabs } from "@/components/InventoryControlTower/shared/components/ui";
import { Donut, SimpleBar, TrendChart } from "@/components/InventoryControlTower/shared/components/charts";
import { inventoryAccuracyTrend } from "@/components/InventoryControlTower/shared/data/mock";
import { downloadCsv } from "@/components/InventoryControlTower/shared/lib/api";
import { useActionCenter } from "@/components/InventoryControlTower/shared/components/action-center";
import { DataTable } from "@/components/InventoryControlTower/shared/components/data-table";

const tabs = [
  { label: "Overview", value: "overview" }, { label: "Stock Value", value: "value" }, { label: "Aging", value: "aging" }, { label: "Wastage", value: "wastage" }, { label: "Receipts", value: "receipts" }, { label: "Accuracy", value: "accuracy" },
];

export function AnalyticsPage() {
  const { notify } = useActionCenter();
  const [tab, setTab] = useState("overview");
  const [period, setPeriod] = useState("Last 30 days");
  const [outlet, setOutlet] = useState("All Outlets");

  function exportReport() {
    downloadCsv("inventory-analytics-summary.csv", ["Metric", "Value"], [["Inventory Value", "₹28.45L"], ["Inventory Accuracy", "96.4%"], ["Pending Receipts", 7], ["Low Stock Items", 42], ["Excess Stock Items", 18], ["Wastage MTD", "₹1.25L"]]);
    notify("Inventory analytics summary exported as CSV.");
  }

  return (
    <>
      <PageHeader title="Inventory Reports & Analytics" subtitle="Inventory accuracy, stock value, aging, receipts, wastage and stock-risk analytics across all locations" action={<Button onClick={exportReport}><span className="flex items-center gap-2"><Download size={14} />Export Report</span></Button>} />
      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-6">
        <Kpi label="Inventory Value" value="₹28.45L" icon={<IndianRupee size={19} />} tone="cyan" />
        <Kpi label="Inventory Accuracy" value="96.4%" icon={<ClipboardCheck size={19} />} tone="green" />
        <Kpi label="Pending Receipts" value="7" icon={<ReceiptText size={19} />} tone="orange" />
        <Kpi label="Low Stock Items" value="42" icon={<Boxes size={19} />} tone="red" />
        <Kpi label="Excess Stock Items" value="18" icon={<PackageSearch size={19} />} tone="violet" />
        <Kpi label="Wastage MTD" value="₹1.25L" icon={<Trash2 size={19} />} tone="orange" />
      </div>

      <Card className="mt-4 overflow-hidden">
        <Tabs tabs={tabs} value={tab} onChange={setTab} />
        <FilterBar><Select value={period} onChange={(e) => setPeriod(e.target.value)}><option>Today</option><option>Last 7 days</option><option>Last 30 days</option><option>This month</option></Select><Select value={outlet} onChange={(e) => setOutlet(e.target.value)}><option>All Outlets</option><option>SB Outlet</option><option>BN1 Outlet</option><option>RS Outlet</option><option>KK Outlet</option></Select><Button variant="secondary" onClick={() => notify(`Analytics refreshed for ${outlet}, ${period}.`, "info")}>Apply Filters</Button></FilterBar>
        <div className="p-4 sm:p-5">
          {tab === "overview" ? <div className="grid gap-4 xl:grid-cols-3">
            <Card className="p-4 sm:p-5 xl:col-span-2"><h2 className="font-bold text-slate-900">Inventory Accuracy Trend</h2><p className="mb-3 mt-1 text-xs text-slate-500">Network-wide expected stock vs verified physical stock</p><TrendChart data={inventoryAccuracyTrend} /></Card>
            <Card className="p-4 sm:p-5"><h2 className="font-bold text-slate-900">Inventory Value by Outlet</h2><p className="mt-1 text-xs text-slate-500">Distribution of on-hand stock value</p><Donut data={[{ name: "SB", value: 482300 }, { name: "BN1", value: 368450 }, { name: "RS", value: 294600 }, { name: "KK", value: 511900 }]} /></Card>
            <Card className="p-4 sm:p-5"><h2 className="font-bold text-slate-900">Wastage by Category</h2><p className="mt-1 text-xs text-slate-500">Month-to-date inventory loss value</p><Donut data={[{ name: "Bakery", value: 14250 }, { name: "Snacks", value: 7650 }, { name: "Cakes", value: 4850 }, { name: "Beverages", value: 1700 }]} /></Card>
            <Card className="p-4 sm:p-5 xl:col-span-2"><h2 className="font-bold text-slate-900">Inventory Aging</h2><p className="mb-3 mt-1 text-xs text-slate-500">Value of stock held by age bucket</p><SimpleBar data={[{ name: "0-3d", value: 985400 }, { name: "4-7d", value: 725600 }, { name: "8-15d", value: 545300 }, { name: "16-30d", value: 325150 }, { name: "30+d", value: 78550 }]} /></Card>
          </div> : tab === "value" ? <div className="grid gap-4 xl:grid-cols-2"><Card className="p-4"><h2 className="font-bold">Stock Value by Outlet</h2><SimpleBar data={[{ name: "SB", value: 482300 }, { name: "BN1", value: 368450 }, { name: "RS", value: 294600 }, { name: "KK", value: 511900 }, { name: "PMK", value: 341250 }]} /></Card><Card className="p-4"><h2 className="font-bold">Stock Value by Category</h2><Donut data={[{ name: "Bakery", value: 1245000 }, { name: "Snacks", value: 625000 }, { name: "Beverages", value: 485000 }, { name: "Ingredients", value: 390000 }]} /></Card></div> : tab === "aging" ? <DataTable headers={["Age Bucket", "Items", "Stock Value", "% of Value", "Risk"]} rows={[["0–3 days", "342", "₹9,85,400", "34.6%", "Normal"], ["4–7 days", "218", "₹7,25,600", "25.5%", "Watch"], ["8–15 days", "124", "₹5,45,300", "19.2%", "Medium"], ["16–30 days", "61", "₹3,25,150", "11.4%", "High"], ["30+ days", "28", "₹78,550", "2.8%", "Critical"]]} /> : tab === "wastage" ? <DataTable headers={["Outlet", "Requests", "Qty", "Value", "Top Reason", "Status"]} rows={[["SB Outlet", "18", "142 pcs", "₹18,450", "Expired", "High"], ["BN1 Outlet", "11", "86 pcs", "₹12,230", "Damaged", "Medium"], ["RS Outlet", "9", "74 pcs", "₹8,900", "Burnt", "High"]]} /> : tab === "receipts" ? <DataTable headers={["Outlet", "Expected", "Confirmed", "Pending", "Mismatch", "Avg. Delay"]} rows={[["SB Outlet", "42", "41", "1", "0", "8 mins"], ["BN1 Outlet", "38", "35", "2", "1", "18 mins"], ["RS Outlet", "31", "28", "2", "1", "26 mins"]]} /> : <div className="grid gap-4 xl:grid-cols-2"><Card className="p-4"><h2 className="font-bold">Accuracy Trend</h2><TrendChart data={inventoryAccuracyTrend} /></Card><Card className="p-4"><h2 className="font-bold">Lowest Accuracy Outlets</h2><DataTable headers={["Outlet", "Accuracy", "Variance Qty", "Last Count"]} rows={[["RS Outlet", "89.2%", "-31", "Today"], ["BN1 Outlet", "92.4%", "-24", "Today"], ["PMK Outlet", "93.8%", "-9", "Yesterday"]]} /></Card></div>}
        </div>
      </Card>
    </>
  );
}
