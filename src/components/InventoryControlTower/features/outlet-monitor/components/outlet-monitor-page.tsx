"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Boxes, ClipboardCheck, History, IndianRupee, PackageCheck, ReceiptText, RefreshCcw, Scale, TriangleAlert } from "lucide-react";
import { Button, Card, Chip, FilterBar, Input, Kpi, PageHeader, Pager, SectionHeader, Select, StatusBadge, Tabs } from "@/components/InventoryControlTower/shared/components/ui";
import { DataTable } from "@/components/InventoryControlTower/shared/components/data-table";
import { products } from "@/components/InventoryControlTower/shared/data/mock";
import { Modal, useActionCenter } from "@/components/InventoryControlTower/shared/components/action-center";
import { apiRequest, downloadCsv } from "@/components/InventoryControlTower/shared/lib/api";

const tabs = [
  { label: "Stock Overview", value: "overview" },
  { label: "Movement History", value: "movement" },
  { label: "Wastage & Returns", value: "wastage" },
  { label: "Pending Receipts", value: "receipts" },
  { label: "Stock Count", value: "count" },
  { label: "Batch / Expiry", value: "batch" },
];

export function OutletMonitorPage() {
  const router = useRouter();
  const { notify } = useActionCenter();
  const [category, setCategory] = useState("All Items");
  const [query, setQuery] = useState("");
  const [activeTab, setActiveTab] = useState("overview");
  const [actionsOpen, setActionsOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [lastSync, setLastSync] = useState("2 minutes ago");
  const [page, setPage] = useState(1);

  const filteredProducts = useMemo(() => products.filter((product) => {
    const matchesQuery = product.name.toLowerCase().includes(query.toLowerCase());
    const matchesCategory = category === "All Items"
      || (category === "Variance Items" && product.variance !== 0)
      || (category === "Low Stock" && product.variance < 0)
      || (category === "Negative Stock" && product.physical < 0)
      || (category === "High Wastage" && product.wastage >= 5)
      || (category === "Near Expiry" && ["Milk Bread", "Veg Puff"].includes(product.name));
    return matchesQuery && matchesCategory;
  }), [category, query]);

  async function runOutletAction(action: string) {
    if (action === "create_transfer") { setActionsOpen(false); router.push("/inventory-control-tower/transfers?from=SB&new=1"); return; }
    if (action === "reconcile") { setActionsOpen(false); router.push("/inventory-control-tower/reconciliation?outlet=SB"); return; }
    setBusy(true);
    const result = await apiRequest(`/outlets/SB/action`, { method: "POST", body: JSON.stringify({ action, remarks: "Triggered from SB Outlet Monitor" }) });
    setBusy(false);
    if (action === "refresh_stock") setLastSync("just now");
    setActionsOpen(false);
    notify(result.ok ? (action === "physical_count" ? "Physical count session started for SB Outlet." : "SB Outlet stock refreshed successfully.") : "Action applied locally. FastAPI is unavailable, so it is not persisted.", result.ok ? "success" : "warning");
  }

  function exportProducts() {
    downloadCsv("SB-outlet-inventory.csv", ["Product", "Category", "Opening", "Received", "Outward", "Wastage", "Returns", "Expected", "Physical", "Variance", "Status"], filteredProducts.map((p) => [p.name, p.category, p.opening, p.received, p.outward, p.wastage, p.returns, p.expected, p.physical, p.variance, p.status]));
    notify("SB Outlet inventory exported as CSV.");
  }

  return (
    <>
      <PageHeader title="SB Outlet Inventory" subtitle={`Madurai, Tamil Nadu · Last sync ${lastSync} · Live stock position, receipts, counts, wastage, returns and batches`} action={<Button onClick={() => setActionsOpen(true)}>Outlet Actions</Button>} />
      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-6">
        <Kpi label="Inventory Value" value="₹4,82,300" trend="Verified on-hand value" icon={<IndianRupee size={19} />} tone="cyan" />
        <Kpi label="Inventory Accuracy" value="96%" trend="Expected vs physical" icon={<ClipboardCheck size={19} />} tone="green" />
        <Kpi label="Wastage Today" value="₹1,850" trend="12 requests / entries" icon={<Scale size={19} />} tone="orange" />
        <Kpi label="Stock Variance" value="-₹420" trend="Net variance value" icon={<TriangleAlert size={19} />} tone="red" />
        <Kpi label="Pending Receipts" value="2" trend="Oldest 45 mins" icon={<ReceiptText size={19} />} tone="orange" />
        <Kpi label="Low Stock Items" value="8" trend="3 critical" icon={<Boxes size={19} />} tone="red" />
      </div>

      <Card className="mt-4 overflow-hidden">
        <Tabs tabs={tabs} value={activeTab} onChange={setActiveTab} />
        {activeTab === "overview" ? (
          <>
            <FilterBar>
              <div className="flex max-w-full gap-1.5 overflow-x-auto pb-1 ct-scrollbar-thin">
                {["All Items", "Variance Items", "Low Stock", "Negative Stock", "High Wastage", "Near Expiry"].map((item) => <Chip key={item} active={category === item} onClick={() => setCategory(item)}>{item}</Chip>)}
              </div>
              <Input className="w-full sm:w-52" placeholder="Search product..." value={query} onChange={(e) => setQuery(e.target.value)} />
              <Button variant="secondary" onClick={() => { setCategory("All Items"); setQuery(""); }}>Filters</Button>
              <Button variant="secondary" onClick={exportProducts}>Export</Button>
            </FilterBar>
            <DataTable headers={["Product", "Category", "Opening", "Received", "Outward", "Wastage", "Returns", "Expected", "Physical", "Variance", "Variance %", "Status", "Action"]} rows={filteredProducts.map((p) => [
              <div key="product"><b>{p.name}</b><div className="text-[10px] text-slate-400">SKU {p.name.slice(0,3).toUpperCase()}-001</div></div>, p.category, p.opening, p.received, p.outward, p.wastage, p.returns, p.expected, p.physical,
              <span key="v" className={p.variance < 0 ? "font-bold text-rose-600" : p.variance > 0 ? "font-bold text-emerald-600" : "text-slate-500"}>{p.variance > 0 ? `+${p.variance}` : p.variance}</span>,
              <span key="vp" className={p.variance < 0 ? "text-rose-600" : "text-slate-500"}>{p.expected ? `${((p.variance / p.expected) * 100).toFixed(1)}%` : "0%"}</span>, <StatusBadge key="status" value={p.status} />,
              <Button key="view" variant="secondary" className="h-8 px-2.5 text-[10px]" onClick={() => notify(`${p.name} stock detail opened.`, "info")}>View</Button>,
            ])} />
            <Pager page={page} pages={2} onChange={setPage} summary={`Showing 1 to ${filteredProducts.length} of 28 items`} />
          </>
        ) : activeTab === "movement" ? (
          <DataTable headers={["Time", "Product", "Movement", "Reference", "In", "Out", "Balance", "User"]} rows={[
            ["10:25 AM", "Milk Bread", "Receipt", "GRN-7021", "100", "—", "70", "Karthik"],
            ["10:10 AM", "Veg Puff", "Outward", "OUT-5126", "—", "18", "26", "Priya"],
            ["09:55 AM", "Brown Bun", "Wastage", "WST-215", "—", "5", "30", "Karthik"],
            ["09:40 AM", "Black Forest Cake", "Transfer In", "TRF-124", "10", "—", "7", "Ravi"],
          ]} />
        ) : activeTab === "wastage" ? (
          <DataTable headers={["Request", "Product", "Reason", "Qty", "Value", "Time", "Status", "Action"]} rows={[
            ["WST-265", "Milk Bread", "Expired", "35 pcs", "₹1,750", "11:10 AM", <StatusBadge key="w1" value="Pending" />, <Button key="a1" variant="secondary" onClick={() => router.push("/inventory-control-tower/wastage")}>Review</Button>],
            ["WST-263", "Veg Puff", "Burnt", "60 pcs", "₹600", "10:30 AM", <StatusBadge key="w2" value="Pending" />, <Button key="a2" variant="secondary" onClick={() => router.push("/inventory-control-tower/wastage")}>Review</Button>],
          ]} />
        ) : activeTab === "receipts" ? (
          <DataTable headers={["Transfer", "From", "Dispatched", "Expected", "Pending Since", "Status", "Action"]} rows={[
            ["TRF-125", "Central Kitchen", "100 pcs", "09:25 AM", "45 mins", <StatusBadge key="r1" value="Pending" />, <Button key="r2" onClick={() => router.push("/inventory-control-tower/transfers")}>Follow Up</Button>],
            ["TRF-127", "Central Kitchen", "65 pcs", "10:40 AM", "12 mins", <StatusBadge key="r3" value="Pending" />, <Button key="r4" onClick={() => router.push("/inventory-control-tower/transfers")}>Follow Up</Button>],
          ]} />
        ) : activeTab === "count" ? (
          <div className="p-4 sm:p-5"><SectionHeader title="Physical Stock Count" subtitle="Start, continue or review cycle counts for this outlet" /><div className="mt-4 grid gap-3 sm:grid-cols-3"><Kpi label="Counted" value="182 / 210" icon={<PackageCheck size={18} />} tone="green" /><Kpi label="Variance Items" value="9" icon={<TriangleAlert size={18} />} tone="orange" /><Kpi label="Last Count" value="Today 09:15" icon={<History size={18} />} /></div><Button className="mt-4" onClick={() => runOutletAction("physical_count")}>Continue Physical Count</Button></div>
        ) : (
          <DataTable headers={["Batch", "Product", "Mfg Date", "Expiry Date", "Qty", "Shelf Life", "Status"]} rows={[
            ["BRD-260725-01", "Milk Bread", "26 Jul", "28 Jul", "23 pcs", "2 days", <StatusBadge key="b1" value="Healthy" />],
            ["BRD-250725-08", "Milk Bread", "25 Jul", "27 Jul", "12 pcs", "1 day", <StatusBadge key="b2" value="Near Expiry" />],
            ["VGP-250725-09", "Veg Puff", "25 Jul", "27 Jul", "16 pcs", "1 day", <StatusBadge key="b3" value="Near Expiry" />],
          ]} />
        )}
      </Card>

      <Modal open={actionsOpen} onClose={() => setActionsOpen(false)} title="SB Outlet Actions" description="Inventory operations for the selected outlet." footer={<Button variant="secondary" onClick={() => setActionsOpen(false)}>Close</Button>}>
        <div className="grid gap-2 sm:grid-cols-2">
          <Button variant="secondary" disabled={busy} onClick={() => runOutletAction("refresh_stock")}><span className="flex items-center gap-2"><RefreshCcw size={14} />Refresh Stock</span></Button>
          <Button variant="secondary" disabled={busy} onClick={() => runOutletAction("physical_count")}>Start Physical Count</Button>
          <Button variant="secondary" onClick={() => runOutletAction("create_transfer")}>Create Transfer</Button>
          <Button variant="secondary" onClick={() => runOutletAction("reconcile")}>Open Reconciliation</Button>
        </div>
      </Modal>
    </>
  );
}
