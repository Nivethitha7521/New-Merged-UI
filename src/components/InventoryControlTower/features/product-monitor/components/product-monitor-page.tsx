"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, BarChart3, Boxes, Building2, Clock3, Download, FileText, PackageCheck, Repeat2, Sparkles, TriangleAlert } from "lucide-react";
import { Button, Card, Chip, FilterBar, Input, Kpi, PageHeader, Pager, SectionHeader, Select, StatusBadge, Tabs } from "@/components/InventoryControlTower/shared/components/ui";
import { DataTable } from "@/components/InventoryControlTower/shared/components/data-table";
import { Donut, TrendChart } from "@/components/InventoryControlTower/shared/components/charts";
import { Modal, useActionCenter } from "@/components/InventoryControlTower/shared/components/action-center";
import { apiRequest, downloadCsv } from "@/components/InventoryControlTower/shared/lib/api";
import { inventoryAccuracyTrend } from "@/components/InventoryControlTower/shared/data/mock";

const rows = [
  ["SB Outlet", 40, 150, 450, 120, 360, 70, 50, 120, 2.1, 20, "Healthy"],
  ["BN1 Outlet", 20, 70, 210, 64, 192, 26, 50, 100, 0.8, -24, "Low Stock"],
  ["RS Outlet", 15, 90, 270, 95, 285, 10, 30, 80, 0.5, -20, "Critical"],
  ["KK Outlet", 35, 80, 230, 60, 180, 55, 40, 100, 2.3, 15, "Healthy"],
  ["PMK Outlet", 25, 50, 150, 48, 144, 27, 30, 80, 1.1, -3, "Low Stock"],
  ["Trichy Outlet", 30, 60, 180, 30, 90, 60, 30, 90, 2.8, 30, "High Stock"],
  ["TVM Outlet", 20, 0, 0, 0, 0, 20, 20, 60, 0.0, -20, "Out of Stock"],
  ["Vellore Outlet", 18, 45, 135, 38, 114, 25, 25, 70, 1.3, 0, "At Min Stock"],
] as const;

const suggestions = [
  { id: "SUG-01", from: "SB Outlet", to: "BN1 Outlet", qty: 24, reason: "BN1 is 24 pcs below minimum" },
  { id: "SUG-02", from: "Trichy Outlet", to: "RS Outlet", qty: 20, reason: "RS has only 0.5 days of stock" },
  { id: "SUG-03", from: "Central Kitchen", to: "PMK Outlet", qty: 15, reason: "PMK is approaching minimum stock" },
];

const productTabs = [
  { label: "Outlet Stock Overview", value: "overview" },
  { label: "Stock Trend", value: "trend" },
  { label: "Movement History", value: "movement" },
  { label: "Batch / Expiry", value: "batch" },
];

export function ProductMonitorPage() {
  const router = useRouter();
  const { notify } = useActionCenter();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("All status");
  const [activeTab, setActiveTab] = useState("overview");
  const [transferOpen, setTransferOpen] = useState(false);
  const [selectedSuggestion, setSelectedSuggestion] = useState(suggestions[0]);
  const [submitting, setSubmitting] = useState(false);
  const [page, setPage] = useState(1);

  const filteredRows = useMemo(() => rows.filter((row) => {
    const matchesQuery = row[0].toLowerCase().includes(query.toLowerCase());
    const matchesStatus = status === "All status" || row[11] === status;
    return matchesQuery && matchesStatus;
  }), [query, status]);

  async function createSuggestedTransfer() {
    setSubmitting(true);
    const result = await apiRequest<{ id: string }>("/transfers", {
      method: "POST",
      body: JSON.stringify({
        from_location_id: selectedSuggestion.from,
        to_location_id: selectedSuggestion.to,
        items: [{ product_id: "MILK-BREAD", product_name: "Milk Bread", qty: selectedSuggestion.qty }],
      }),
    });
    setSubmitting(false);
    setTransferOpen(false);
    notify(result.ok
      ? `Transfer ${result.data?.id || "draft"} created: ${selectedSuggestion.qty} pcs from ${selectedSuggestion.from} to ${selectedSuggestion.to}.`
      : "Transfer draft prepared locally. FastAPI is unavailable; connect the backend to persist it.", result.ok ? "success" : "warning");
  }

  function exportRows() {
    downloadCsv(
      "milk-bread-stock-position.csv",
      ["Outlet", "Opening", "Received Today", "Received MTD", "Outward Today", "Outward MTD", "Current", "Min", "Max", "Days Stock", "Variance", "Status"],
      filteredRows.map((row) => [...row] as Array<string | number>),
    );
    notify("Product stock report exported as CSV.");
  }

  const overviewTable = (
    <>
      <DataTable
        headers={["Outlet", "Opening", "Received Today", "Received MTD", "Outward Today", "Outward MTD", "Current", "Min", "Max", "Days Stock", "Variance", "Status", "Action"]}
        rows={filteredRows.map((row) => [
          <b key="outlet">{row[0]}</b>, row[1], row[2], row[3], row[4], row[5],
          <div key="current" className="min-w-20"><b>{row[6]}</b><div className="mt-1 h-1.5 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-indigo-500" style={{ width: `${Math.min(100, Math.max(8, Number(row[6]) / Number(row[8]) * 100))}%` }} /></div></div>,
          row[7], row[8], row[9],
          <span key="variance" className={Number(row[10]) < 0 ? "font-semibold text-rose-600" : Number(row[10]) > 0 ? "font-semibold text-emerald-600" : "font-semibold text-slate-500"}>{Number(row[10]) > 0 ? `+${row[10]}` : row[10]}</span>,
          <StatusBadge key="status" value={String(row[11])} />,
          <Button key="action" variant="secondary" className="h-8 px-2.5 text-[10px]" onClick={() => notify(`${row[0]} stock detail opened.`, "info")}>View</Button>,
        ])}
      />
      <Pager page={page} pages={2} onChange={setPage} summary={`Showing 1 to ${filteredRows.length} of 15 outlets`} />
    </>
  );

  return (
    <>
      <PageHeader
        title="Product Monitor — Milk Bread"
        subtitle="Real-time product stock distribution, min/max compliance, movement, batches and transfer opportunities across all outlets"
        action={<Button onClick={() => setTransferOpen(true)}><span className="flex items-center gap-2"><Sparkles size={15} />Suggest transfer</span></Button>}
      />

      <div className="grid gap-4 xl:grid-cols-[190px_1fr_310px]">
        <Card className="hidden overflow-hidden xl:block">
          <SectionHeader title="Product Search" />
          <div className="p-3">
            <Input className="w-full" placeholder="Search product..." />
            <div className="mt-3 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">Top products</div>
            <div className="mt-2 space-y-1">
              {["Milk Bread", "Brown Bread", "Veg Puff", "Black Forest Cake", "Paneer Puff", "Orange Juice"].map((product, index) => (
                <button key={product} className={`flex w-full items-center gap-2 rounded-xl px-2.5 py-2 text-left text-xs font-semibold ${index === 0 ? "bg-indigo-50 text-indigo-700" : "text-slate-600 hover:bg-slate-50"}`} onClick={() => notify(`${product} selected.`, "info")}>
                  <span className={`h-2 w-2 rounded-full ${index === 0 ? "bg-indigo-500" : "bg-slate-300"}`} />{product}
                </button>
              ))}
            </div>
            <Button variant="secondary" className="mt-3 w-full" onClick={() => notify("Product master search opened.", "info")}>View all products</Button>
          </div>
        </Card>

        <div className="min-w-0 space-y-4">
          <Card className="overflow-hidden">
            <Tabs tabs={productTabs} value={activeTab} onChange={setActiveTab} />
            {activeTab === "overview" ? (
              <>
                <div className="grid grid-cols-2 gap-3 p-3 sm:p-4 lg:grid-cols-3 xl:grid-cols-6">
                  <Kpi label="Outlets Stocked" value="15 / 15" trend="100%" icon={<Building2 size={18} />} />
                  <Kpi label="Below Minimum" value="3" trend="20% of outlets" icon={<TriangleAlert size={18} />} tone="orange" />
                  <Kpi label="Out of Stock" value="1" trend="Needs action" icon={<Boxes size={18} />} tone="red" />
                  <Kpi label="High Stock" value="2" trend="13.3% of outlets" icon={<PackageCheck size={18} />} tone="cyan" />
                  <Kpi label="Avg. Days Stock" value="1.8 days" trend="Within target" icon={<Clock3 size={18} />} tone="violet" />
                  <Kpi label="Transfer Opportunity" value="120 pcs" trend="RS → BN1 opportunity" icon={<Repeat2 size={18} />} tone="green" />
                </div>
                <FilterBar>
                  <Select value={status} onChange={(event) => setStatus(event.target.value)}>
                    <option>All status</option><option>Healthy</option><option>Low Stock</option><option>Critical</option><option>High Stock</option><option>Out of Stock</option><option>At Min Stock</option>
                  </Select>
                  <Input placeholder="Search outlet..." value={query} onChange={(event) => setQuery(event.target.value)} />
                  <Button variant="secondary" onClick={() => { setStatus("All status"); setQuery(""); }}>Filters</Button>
                  <Button variant="secondary" onClick={exportRows}><span className="flex items-center gap-2"><Download size={14} />Export</span></Button>
                  <Button onClick={() => setTransferOpen(true)}>Suggest Transfer</Button>
                </FilterBar>
                {overviewTable}
              </>
            ) : activeTab === "trend" ? (
              <div className="p-4 sm:p-5"><SectionHeader title="Milk Bread Stock Trend" subtitle="Network stock accuracy and on-hand trend" /><div className="mt-4"><TrendChart data={inventoryAccuracyTrend} /></div></div>
            ) : activeTab === "movement" ? (
              <div className="p-4 sm:p-5">
                <DataTable headers={["Time", "Outlet", "Movement", "Reference", "In", "Out", "Balance"]} rows={[
                  ["10:25 AM", "BN1 Outlet", "Receipt", "GRN-7021", "70", "—", "26"],
                  ["10:10 AM", "RS Outlet", "Outward", "OUT-5126", "—", "18", "10"],
                  ["09:55 AM", "SB Outlet", "Wastage", "WST-215", "—", "5", "70"],
                  ["09:40 AM", "KK Outlet", "Transfer In", "TRF-124", "25", "—", "55"],
                ]} />
              </div>
            ) : (
              <div className="p-4 sm:p-5">
                <DataTable headers={["Batch", "Outlet", "Mfg Date", "Expiry Date", "Qty", "Age", "Status"]} rows={[
                  ["BRD-260725-01", "SB Outlet", "26 Jul", "28 Jul", "35", "0 days", <StatusBadge key="b1" value="Healthy" />],
                  ["BRD-250725-08", "BN1 Outlet", "25 Jul", "27 Jul", "12", "1 day", <StatusBadge key="b2" value="Near Expiry" />],
                  ["BRD-250725-03", "RS Outlet", "25 Jul", "27 Jul", "10", "1 day", <StatusBadge key="b3" value="Near Expiry" />],
                ]} />
              </div>
            )}
          </Card>
        </div>

        <div className="space-y-4">
          <Card className="p-4">
            <h3 className="text-sm font-extrabold text-slate-900">Stock Distribution</h3>
            <Donut data={[{ name: "Healthy", value: 7 }, { name: "Low Stock", value: 3 }, { name: "Critical", value: 2 }, { name: "High Stock", value: 2 }, { name: "Out of Stock", value: 1 }]} />
          </Card>
          <Card className="p-4">
            <h3 className="text-sm font-extrabold text-slate-900">Top Stock Movements</h3>
            <div className="mt-3 space-y-3 text-xs">
              {[["SB Outlet", "+120 pcs"], ["KK Outlet", "+60 pcs"], ["BN1 Outlet", "+64 pcs"]].map(([name, value]) => <div key={name} className="flex justify-between"><span className="text-slate-600">{name}</span><b className="text-emerald-600">{value}</b></div>)}
            </div>
          </Card>
          <Card className="p-4">
            <h3 className="text-sm font-extrabold text-slate-900">Top Low Stock Outlets</h3>
            <div className="mt-3 space-y-3 text-xs">
              {[["BN1 Outlet", "26 pcs"], ["RS Outlet", "10 pcs"], ["PMK Outlet", "27 pcs"]].map(([name, value]) => <div key={name} className="flex justify-between"><span className="text-slate-600">{name}</span><b className="text-rose-600">{value}</b></div>)}
            </div>
          </Card>
          <Card className="p-4">
            <h3 className="text-sm font-extrabold text-slate-900">Quick Actions</h3>
            <div className="mt-3 grid gap-2">
              <Button variant="secondary" onClick={() => setTransferOpen(true)}><span className="flex items-center gap-2"><Repeat2 size={14} />Suggest Transfer</span></Button>
              <Button variant="secondary" onClick={() => router.push("/inventory-control-tower/transfers?new=1")}><span className="flex items-center gap-2"><PackageCheck size={14} />Create Stock Transfer</span></Button>
              <Button variant="secondary" onClick={exportRows}><span className="flex items-center gap-2"><FileText size={14} />Product Stock Report</span></Button>
              <Button variant="secondary" onClick={() => notify("Stock forecast generated for Milk Bread.", "success")}><span className="flex items-center gap-2"><BarChart3 size={14} />Stock Forecast</span></Button>
            </div>
          </Card>
        </div>
      </div>

      <Modal open={transferOpen} onClose={() => setTransferOpen(false)} title="AI transfer suggestions" description="Review the recommended stock balancing move before creating a transfer draft." size="lg" footer={<><Button variant="secondary" onClick={() => setTransferOpen(false)}>Cancel</Button><Button disabled={submitting} onClick={createSuggestedTransfer}>{submitting ? "Creating..." : "Create transfer draft"}</Button></>}>
        <div className="space-y-3">
          {suggestions.map((suggestion) => {
            const selected = selectedSuggestion.id === suggestion.id;
            return <button key={suggestion.id} className={`w-full rounded-2xl border p-4 text-left transition ${selected ? "border-indigo-300 bg-indigo-50 ring-4 ring-indigo-50" : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"}`} onClick={() => setSelectedSuggestion(suggestion)}>
              <div className="flex flex-wrap items-center gap-2"><span className="rounded-full bg-white px-2 py-1 text-[10px] font-bold text-indigo-700 ring-1 ring-indigo-100">{suggestion.id}</span><span className="ml-auto text-sm font-extrabold text-slate-950">{suggestion.qty} pcs</span></div>
              <div className="mt-3 flex flex-wrap items-center gap-2 text-sm font-semibold text-slate-800"><span>{suggestion.from}</span><ArrowRight size={16} className="text-indigo-500" /><span>{suggestion.to}</span></div>
              <p className="mt-2 text-xs text-slate-500">{suggestion.reason}</p>
            </button>;
          })}
        </div>
      </Modal>
    </>
  );
}
