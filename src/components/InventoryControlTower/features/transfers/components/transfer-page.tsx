"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowRight, Clock3, Download, PackageCheck, Plus, Repeat2, Truck, XCircle } from "lucide-react";
import { Button, Card, DetailList, FilterBar, Input, Kpi, PageHeader, Pager, SectionHeader, Select, StatusBadge, Tabs } from "@/components/InventoryControlTower/shared/components/ui";
import { DataTable } from "@/components/InventoryControlTower/shared/components/data-table";
import { Donut, SimpleBar } from "@/components/InventoryControlTower/shared/components/charts";
import { Modal, useActionCenter } from "@/components/InventoryControlTower/shared/components/action-center";
import { apiRequest, downloadCsv } from "@/components/InventoryControlTower/shared/lib/api";

const initialTransfers = [
  { id: "TRF-2026/07/124", ref: "REQ-1258", from: "Central Kitchen", to: "SB Outlet", type: "Regular", items: 12, qty: "245.50 Kg", value: "₹18,450", status: "Delivered", requestedBy: "Karthik", date: "26 Jul 09:15 AM", eta: "26 Jul 02:45 PM" },
  { id: "TRF-2026/07/123", ref: "REQ-1257", from: "Central Kitchen", to: "BN1 Outlet", type: "Cold Chain", items: 8, qty: "132.00 Kg", value: "₹12,680", status: "In Transit", requestedBy: "Suresh", date: "26 Jul 08:30 AM", eta: "26 Jul 02:30 PM" },
  { id: "TRF-2026/07/122", ref: "REQ-1256", from: "RS Outlet", to: "TRC Outlet", type: "Regular", items: 6, qty: "98.75 Kg", value: "₹6,320", status: "Pending", requestedBy: "Priya", date: "26 Jul 10:00 AM", eta: "27 Jul 10:00 AM" },
  { id: "TRF-2026/07/121", ref: "REQ-1255", from: "KK Outlet", to: "PMK Outlet", type: "Regular", items: 15, qty: "310.25 Kg", value: "₹22,150", status: "Delivered", requestedBy: "Manoj", date: "25 Jul 04:10 PM", eta: "26 Jul 07:20 AM" },
  { id: "TRF-2026/07/120", ref: "REQ-1254", from: "BN1 Outlet", to: "RS Outlet", type: "Return", items: 5, qty: "45.00 Kg", value: "₹3,250", status: "Delivered", requestedBy: "Suresh", date: "25 Jul 02:20 PM", eta: "25 Jul 05:10 PM" },
  { id: "TRF-2026/07/119", ref: "REQ-1253", from: "Central Kitchen", to: "KK Outlet", type: "Cold Chain", items: 10, qty: "156.00 Kg", value: "₹14,750", status: "Cancelled", requestedBy: "Karthik", date: "25 Jul 11:30 AM", eta: "—" },
  { id: "TRF-2026/07/118", ref: "REQ-1252", from: "PMK Outlet", to: "TRC Outlet", type: "Regular", items: 9, qty: "125.50 Kg", value: "₹8,950", status: "In Transit", requestedBy: "Deepa", date: "25 Jul 09:45 AM", eta: "25 Jul 04:00 PM" },
  { id: "TRF-2026/07/117", ref: "REQ-1251", from: "SB Outlet", to: "Central Kitchen", type: "Return", items: 7, qty: "62.30 Kg", value: "₹4,750", status: "Pending", requestedBy: "Deepa", date: "25 Jul 09:05 AM", eta: "25 Jul 09:00 AM" },
];

const tabs = [
  { label: "All Transfers", value: "all", count: 124 }, { label: "In Transit", value: "In Transit", count: 32 }, { label: "Delivered", value: "Delivered", count: 78 }, { label: "Pending", value: "Pending", count: 10 }, { label: "Cancelled", value: "Cancelled", count: 4 }, { label: "Drafts", value: "Draft", count: 3 },
];

export function TransferPage() {
  const { notify } = useActionCenter();
  const [transfers, setTransfers] = useState(initialTransfers);
  const [tab, setTab] = useState("all");
  const [query, setQuery] = useState("");
  const [fromFilter, setFromFilter] = useState("All");
  const [toFilter, setToFilter] = useState("All");
  const [typeFilter, setTypeFilter] = useState("All");
  const [selectedId, setSelectedId] = useState(initialTransfers[0].id);
  const [newOpen, setNewOpen] = useState(false);
  const [from, setFrom] = useState("Central Kitchen");
  const [to, setTo] = useState("SB Outlet");
  const [product, setProduct] = useState("Milk Bread");
  const [qty, setQty] = useState("25");
  const [busy, setBusy] = useState(false);
  const [page, setPage] = useState(1);

  useEffect(() => {
    if (typeof window !== "undefined" && new URLSearchParams(window.location.search).get("new") === "1") setNewOpen(true);
  }, []);

  const selected = transfers.find((item) => item.id === selectedId) || transfers[0];
  const locations = Array.from(new Set(transfers.flatMap((item) => [item.from, item.to])));
  const filtered = useMemo(() => transfers.filter((item) => {
    const needle = query.toLowerCase();
    return (tab === "all" || item.status === tab)
      && (fromFilter === "All" || item.from === fromFilter)
      && (toFilter === "All" || item.to === toFilter)
      && (typeFilter === "All" || item.type === typeFilter)
      && (!needle || [item.id, item.ref, item.from, item.to].some((value) => value.toLowerCase().includes(needle)));
  }), [fromFilter, query, tab, toFilter, transfers, typeFilter]);

  async function createTransfer() {
    if (from === to) { notify("From and To locations must be different.", "error"); return; }
    if (!Number(qty) || Number(qty) <= 0) { notify("Enter a valid transfer quantity.", "error"); return; }
    setBusy(true);
    const result = await apiRequest<{ id: string }>("/transfers", { method: "POST", body: JSON.stringify({ from_location_id: from, to_location_id: to, items: [{ product_id: product.toUpperCase().replaceAll(" ", "-"), product_name: product, qty: Number(qty) }] }) });
    const id = result.data?.id || `TRF-DRAFT-${Date.now().toString().slice(-4)}`;
    setTransfers((current) => [{ id, ref: "NEW-DRAFT", from, to, type: "Regular", items: 1, qty: `${qty} pcs`, value: "—", status: "Pending", requestedBy: "Inventory Admin", date: "Just now", eta: "Pending" }, ...current]);
    setSelectedId(id); setBusy(false); setNewOpen(false);
    notify(result.ok ? `${id} created successfully.` : `${id} created locally. FastAPI is unavailable, so it is not persisted.`, result.ok ? "success" : "warning");
  }

  function exportTransfers() {
    downloadCsv("stock-transfers.csv", ["Transfer ID", "Reference", "From", "To", "Type", "Items", "Quantity", "Value", "Status", "Requested By", "Transfer Date", "ETA"], filtered.map((item) => [item.id, item.ref, item.from, item.to, item.type, item.items, item.qty, item.value, item.status, item.requestedBy, item.date, item.eta]));
    notify("Stock transfer list exported as CSV.");
  }

  return (
    <>
      <PageHeader title="Stock Transfer Monitor" subtitle="Track, review and create stock transfers across all inventory locations" action={<Button onClick={() => setNewOpen(true)}><span className="flex items-center gap-2"><Plus size={15} />New Transfer</span></Button>} />
      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-6">
        <Kpi label="Total Transfers" value="124" trend="₹8,75,430 this period" icon={<Repeat2 size={19} />} />
        <Kpi label="In Transit" value="32" trend="13 outlets" icon={<Truck size={19} />} tone="orange" />
        <Kpi label="Delivered" value="78" trend="₹5,45,230" icon={<PackageCheck size={19} />} tone="green" />
        <Kpi label="Pending" value="10" trend="Action required" icon={<Clock3 size={19} />} tone="violet" />
        <Kpi label="Cancelled" value="4" trend="₹29,000" icon={<XCircle size={19} />} tone="red" />
        <Kpi label="Avg. Transit Time" value="6.2 hrs" trend="↓ 1.1 hrs vs last period" icon={<Clock3 size={19} />} tone="cyan" />
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-[1fr_330px]">
        <Card className="min-w-0 overflow-hidden">
          <Tabs tabs={tabs} value={tab} onChange={setTab} />
          <FilterBar>
            <Select value={fromFilter} onChange={(e) => setFromFilter(e.target.value)}><option>All</option>{locations.map((item) => <option key={item}>{item}</option>)}</Select>
            <Select value={toFilter} onChange={(e) => setToFilter(e.target.value)}><option>All</option>{locations.map((item) => <option key={item}>{item}</option>)}</Select>
            <Select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}><option>All</option><option>Regular</option><option>Cold Chain</option><option>Return</option></Select>
            <Input className="w-full sm:w-64" placeholder="Search by transfer ID, reference, location..." value={query} onChange={(e) => setQuery(e.target.value)} />
            <Button variant="secondary" onClick={() => { setFromFilter("All"); setToFilter("All"); setTypeFilter("All"); setQuery(""); }}>Filters</Button>
            <Button variant="secondary" onClick={exportTransfers}><span className="flex items-center gap-2"><Download size={14} />Export</span></Button>
          </FilterBar>
          <DataTable headers={["Transfer ID", "From → To", "Transfer Type", "Items / Qty", "Value", "Status", "Requested By", "Transfer Date", "ETA / Delivered", "Action"]} rows={filtered.map((item) => [
            <button key="id" className="text-left" onClick={() => setSelectedId(item.id)}><b>{item.id}</b><div className="text-[10px] text-slate-400">REF: {item.ref}</div></button>,
            <div key="route"><div className="font-semibold">{item.from}</div><div className="flex items-center gap-1 text-[10px] text-slate-400"><ArrowRight size={11} />{item.to}</div></div>, <StatusBadge key="type" value={item.type} />,
            <div key="items"><b>{item.items} items</b><div className="text-[10px] text-slate-400">{item.qty}</div></div>, item.value, <StatusBadge key="status" value={item.status} />,
            <div key="requester"><b>{item.requestedBy}</b><div className="text-[10px] text-slate-400">Inventory Team</div></div>, item.date, item.eta,
            <Button key="view" variant="secondary" className="h-8 px-2.5 text-[10px]" onClick={() => { setSelectedId(item.id); notify(`${item.id} details selected.`, "info"); }}>View</Button>,
          ])} />
          <Pager page={page} pages={5} onChange={setPage} summary="Showing 1 to 8 of 124 transfers" />
        </Card>

        <div className="space-y-4">
          <Card className="p-4">
            <h3 className="text-sm font-extrabold text-slate-900">Transfer Summary</h3>
            <Donut data={[{ name: "Delivered", value: 78 }, { name: "In Transit", value: 32 }, { name: "Pending", value: 10 }, { name: "Cancelled", value: 4 }]} />
            <DetailList rows={[["Selected", selected.id], ["Route", `${selected.from} → ${selected.to}`], ["Status", <StatusBadge key="st" value={selected.status} />], ["ETA", selected.eta]]} />
          </Card>
          <Card className="p-4"><h3 className="text-sm font-extrabold text-slate-900">Transfers by Type</h3><div className="mt-3"><SimpleBar data={[{ name: "Regular", value: 78 }, { name: "Cold Chain", value: 24 }, { name: "Return", value: 15 }, { name: "Inter Unit", value: 7 }]} /></div></Card>
          <Card className="p-4"><h3 className="text-sm font-extrabold text-slate-900">Top Transfer Routes</h3><div className="mt-3 space-y-2 text-xs">{[["Central Kitchen → SB Outlet", "24"], ["Central Kitchen → BN1 Outlet", "18"], ["KK Outlet → PMK Outlet", "12"], ["RS Outlet → TRC Outlet", "10"]].map(([route, count]) => <div key={route} className="flex justify-between gap-2"><span className="text-slate-600">{route}</span><b>{count}</b></div>)}</div></Card>
          <Card className="p-4"><h3 className="text-sm font-extrabold text-slate-900">Recent Transfer Alerts</h3><div className="mt-3 space-y-3 text-xs"><button className="w-full text-left" onClick={() => notify("Delayed transfer opened.", "info")}><b className="text-amber-700">Transfer Delay</b><div className="text-slate-500">TRF-123 to BN1 Outlet is delayed</div></button><button className="w-full text-left" onClick={() => setTab("Pending")}><b className="text-rose-700">Pending Approval</b><div className="text-slate-500">3 transfers are pending approval</div></button></div></Card>
        </div>
      </div>

      <Modal open={newOpen} onClose={() => setNewOpen(false)} title="Create Stock Transfer" description="Create a controlled inventory transfer draft between locations." size="lg" footer={<><Button variant="secondary" onClick={() => setNewOpen(false)}>Cancel</Button><Button disabled={busy} onClick={createTransfer}>{busy ? "Creating..." : "Create Transfer"}</Button></>}>
        <div className="grid gap-4 sm:grid-cols-2"><label className="text-sm font-semibold text-slate-700">From location<Select className="mt-2 w-full" value={from} onChange={(e) => setFrom(e.target.value)}>{locations.map((item) => <option key={item}>{item}</option>)}</Select></label><label className="text-sm font-semibold text-slate-700">To location<Select className="mt-2 w-full" value={to} onChange={(e) => setTo(e.target.value)}>{locations.map((item) => <option key={item}>{item}</option>)}</Select></label><label className="text-sm font-semibold text-slate-700">Product<Select className="mt-2 w-full" value={product} onChange={(e) => setProduct(e.target.value)}><option>Milk Bread</option><option>Brown Bun</option><option>Veg Puff</option><option>Black Forest Cake</option></Select></label><label className="text-sm font-semibold text-slate-700">Quantity<Input className="mt-2 w-full" type="number" min="1" value={qty} onChange={(e) => setQty(e.target.value)} /></label></div>
      </Modal>
    </>
  );
}
