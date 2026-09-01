"use client";

import { useMemo, useState } from "react";
import { ArrowDownToLine, ArrowUpFromLine, IndianRupee, NotebookTabs } from "lucide-react";
import { Button, Card, Chip, FilterBar, Input, Kpi, PageHeader, Pager, Select, StatusBadge, Tabs } from "@/components/InventoryControlTower/shared/components/ui";
import { DataTable } from "@/components/InventoryControlTower/shared/components/data-table";
import { downloadCsv } from "@/components/InventoryControlTower/shared/lib/api";
import { useActionCenter } from "@/components/InventoryControlTower/shared/components/action-center";

const tx = [
  ["20 Jul 08:00", "Opening Stock", "—", 120, 0, 120, "System"],
  ["20 Jul 09:15", "Received", "GRN-045", 150, 0, 270, "Karthik"],
  ["20 Jul 09:45", "Production Receive", "PRD-012", 100, 0, 370, "Ravi"],
  ["20 Jul 11:10", "POS Outward", "OUT-3125", 0, 80, 290, "Priya"],
  ["20 Jul 13:35", "Wastage", "WST-015", 0, 5, 285, "Karthik"],
  ["20 Jul 16:20", "POS Outward", "OUT-3180", 0, 120, 165, "Priya"],
  ["21 Jul 10:30", "POS Outward", "OUT-3210", 0, 150, 135, "Priya"],
  ["21 Jul 18:50", "Transfer Out", "STO-008", 0, 30, 105, "Karthik"],
] as const;

const tabs = [
  { label: "Stock Overview", value: "overview" },
  { label: "Movement History", value: "movement" },
  { label: "Wastage & Returns", value: "wastage" },
  { label: "Pending Receipts", value: "receipts" },
  { label: "Stock Count", value: "count" },
  { label: "Batch / Expiry", value: "batch" },
];

export function LedgerPage() {
  const { notify } = useActionCenter();
  const [tab, setTab] = useState("overview");
  const [movement, setMovement] = useState("All movements");
  const [batch, setBatch] = useState("");
  const [chip, setChip] = useState("All Items");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => tx.filter((row) => {
    const matchesMovement = movement === "All movements" || row[1] === movement;
    const matchesBatch = !batch.trim() || String(row[2]).toLowerCase().includes(batch.toLowerCase());
    return matchesMovement && matchesBatch;
  }), [batch, movement]);

  function exportLedger() {
    downloadCsv("inventory-ledger-milk-bread.csv", ["Date & Time", "Transaction", "Reference", "In", "Out", "Balance", "User", "Status"], filtered.map((row) => [...row, "Verified"] as Array<string | number>));
    notify("Inventory ledger exported as CSV.");
  }

  const stockRows = [
    ["Milk Bread", "Bakery", 50, 100, 120, 5, 0, 25, 23, -2, "-8.0%", <StatusBadge key="s1" value="Variance" />],
    ["Brown Bun", "Bakery", 40, 80, 85, 3, 2, 30, 30, 0, "0%", <StatusBadge key="s2" value="Normal" />],
    ["Veg Puff", "Snacks", 60, 120, 140, 8, 2, 30, 26, -4, "-13.3%", <StatusBadge key="s3" value="Variance" />],
    ["Black Forest Cake", "Cakes", 10, 10, 12, 1, 0, 7, 7, 0, "0%", <StatusBadge key="s4" value="Normal" />],
  ];

  return (
    <>
      <PageHeader title="Inventory Ledger" subtitle="Complete stock position and immutable inventory movement history" action={<Button onClick={exportLedger}>Export Ledger</Button>} />
      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <Kpi label="Opening Stock" value="120 pcs" icon={<NotebookTabs size={20} />} />
        <Kpi label="Total In" value="450 pcs" icon={<ArrowDownToLine size={20} />} tone="green" />
        <Kpi label="Total Out" value="520 pcs" icon={<ArrowUpFromLine size={20} />} tone="red" />
        <Kpi label="Stock Value" value="₹625" icon={<IndianRupee size={20} />} tone="violet" />
      </div>

      <Card className="mt-4 overflow-hidden">
        <Tabs tabs={tabs} value={tab} onChange={setTab} />
        {tab === "overview" ? <>
          <FilterBar>
            <div className="flex max-w-full gap-1.5 overflow-x-auto pb-1 ct-scrollbar-thin">{["All Items", "Variance Items", "Low Stock", "Negative Stock", "High Wastage", "Near Expiry"].map((item) => <Chip key={item} active={chip === item} onClick={() => setChip(item)}>{item}</Chip>)}</div>
            <Input placeholder="Search product..." />
            <Button variant="secondary" onClick={() => notify("Stock overview filters applied.", "info")}>Filters</Button>
            <Button variant="secondary" onClick={exportLedger}>Export</Button>
          </FilterBar>
          <DataTable headers={["Product", "Category", "Opening Stock", "Received", "Outward", "Wastage", "Returns", "Expected Stock", "Physical Stock", "Variance", "Variance %", "Status"]} rows={stockRows} />
          <Pager page={page} pages={3} onChange={setPage} summary="Showing 1 to 4 of 28 items" />
        </> : tab === "movement" ? <>
          <FilterBar><Select defaultValue="Milk Bread"><option>Milk Bread</option><option>Brown Bun</option><option>Veg Puff</option></Select><Select value={movement} onChange={(e) => setMovement(e.target.value)}><option>All movements</option><option>Opening Stock</option><option>Received</option><option>Production Receive</option><option>POS Outward</option><option>Wastage</option><option>Transfer Out</option></Select><Input placeholder="Batch / lot / reference" value={batch} onChange={(e) => setBatch(e.target.value)} /><Button onClick={() => notify(`${filtered.length} ledger movements match the filters.`, "info")}>Apply Filters</Button></FilterBar>
          <DataTable headers={["Date & Time", "Transaction", "Reference", "In", "Out", "Balance", "User", "Status"]} rows={filtered.map((row) => [row[0], <b key="transaction">{row[1]}</b>, row[2], <span key="in" className="text-emerald-600">{row[3] || "—"}</span>, <span key="out" className="text-rose-600">{row[4] || "—"}</span>, <b key="balance">{row[5]}</b>, row[6], <StatusBadge key="status" value="Verified" />])} />
        </> : tab === "wastage" ? <DataTable headers={["Time", "Product", "Reason", "Qty", "Value", "Reference", "Status"]} rows={[["13:35", "Milk Bread", "Expired", "5 pcs", "₹250", "WST-015", <StatusBadge key="w" value="Approved" />], ["15:10", "Veg Puff", "Burnt", "8 pcs", "₹80", "WST-019", <StatusBadge key="w2" value="Pending" />]]} /> : tab === "receipts" ? <DataTable headers={["Transfer", "From", "Product", "Qty", "Dispatched", "Pending Since", "Status"]} rows={[["TRF-125", "Central Kitchen", "Milk Bread", "100 pcs", "09:25 AM", "45 mins", <StatusBadge key="r" value="Pending" />]]} /> : tab === "count" ? <DataTable headers={["Count Session", "Date", "Items Counted", "Variance Items", "Status", "User"]} rows={[["CNT-0726-01", "26 Jul", "182 / 210", "9", <StatusBadge key="c" value="In Progress" />, "Karthik"], ["CNT-0725-01", "25 Jul", "210 / 210", "4", <StatusBadge key="c2" value="Completed" />, "Karthik"]]} /> : <DataTable headers={["Batch", "Product", "Mfg Date", "Expiry Date", "Qty", "Age", "Status"]} rows={[["BRD-260725-01", "Milk Bread", "26 Jul", "28 Jul", "23 pcs", "0 days", <StatusBadge key="b" value="Healthy" />], ["BRD-250725-08", "Milk Bread", "25 Jul", "27 Jul", "12 pcs", "1 day", <StatusBadge key="b2" value="Near Expiry" />]]} />}
      </Card>
    </>
  );
}
