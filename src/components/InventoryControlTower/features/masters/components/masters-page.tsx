"use client";

import { useMemo, useState } from "react";
import { Boxes, Building2, Plus, Scale, Settings, Tags, TriangleAlert } from "lucide-react";
import { Button, Card, FilterBar, Input, Kpi, PageHeader, Select, StatusBadge, Tabs } from "@/components/InventoryControlTower/shared/components/ui";
import { DataTable } from "@/components/InventoryControlTower/shared/components/data-table";
import { Modal, useActionCenter } from "@/components/InventoryControlTower/shared/components/action-center";

const tabs = [
  { label: "Products", value: "products", count: 842 }, { label: "Categories", value: "categories", count: 18 }, { label: "Outlets", value: "outlets", count: 15 }, { label: "Min / Max Rules", value: "rules", count: 12630 }, { label: "UoM", value: "uom", count: 12 }, { label: "Reason Codes", value: "reasons", count: 24 },
];

const products = [
  ["PRD-001", "Milk Bread", "Bakery", "Pcs", "50", "120", "2 days", "Active"],
  ["PRD-002", "Brown Bun", "Bakery", "Pcs", "40", "100", "2 days", "Active"],
  ["PRD-003", "Veg Puff", "Snacks", "Pcs", "30", "80", "1 day", "Active"],
  ["PRD-004", "Black Forest Cake", "Cakes", "Kg", "5", "20", "2 days", "Active"],
  ["PRD-005", "Paneer Puff", "Snacks", "Pcs", "25", "70", "1 day", "Active"],
];

export function MastersPage() {
  const { notify } = useActionCenter();
  const [tab, setTab] = useState("products");
  const [query, setQuery] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [name, setName] = useState("");
  const [category, setCategory] = useState("Bakery");
  const [minQty, setMinQty] = useState("20");
  const [maxQty, setMaxQty] = useState("100");
  const filteredProducts = useMemo(() => products.filter((row) => !query || row.join(" ").toLowerCase().includes(query.toLowerCase())), [query]);

  function addMaster() {
    if (!name.trim()) { notify("Enter a name before saving.", "error"); return; }
    setAddOpen(false); setName("");
    notify(`${tab === "products" ? "Product" : "Master record"} saved locally.`, "success");
  }

  return (
    <>
      <PageHeader title="Inventory Masters" subtitle="Configure product, outlet and inventory-control master data used by the Control Center" action={<Button onClick={() => setAddOpen(true)}><span className="flex items-center gap-2"><Plus size={15} />Add Master</span></Button>} />
      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-6">
        <Kpi label="Products" value="842" icon={<Boxes size={19} />} />
        <Kpi label="Categories" value="18" icon={<Tags size={19} />} tone="violet" />
        <Kpi label="Outlets" value="15" icon={<Building2 size={19} />} tone="green" />
        <Kpi label="Min / Max Rules" value="12,630" icon={<Settings size={19} />} tone="cyan" />
        <Kpi label="Units of Measure" value="12" icon={<Scale size={19} />} tone="orange" />
        <Kpi label="Reason Codes" value="24" icon={<TriangleAlert size={19} />} tone="red" />
      </div>

      <Card className="mt-4 overflow-hidden">
        <Tabs tabs={tabs} value={tab} onChange={setTab} />
        <FilterBar><Input className="w-full sm:w-64" placeholder="Search master data..." value={query} onChange={(e) => setQuery(e.target.value)} /><Select defaultValue="All Status"><option>All Status</option><option>Active</option><option>Inactive</option></Select><Button variant="secondary" onClick={() => setQuery("")}>Filters</Button></FilterBar>
        {tab === "products" ? <DataTable headers={["Product ID", "Product", "Category", "UoM", "Default Min", "Default Max", "Shelf Life", "Status", "Action"]} rows={filteredProducts.map((row) => [...row.slice(0, 7), <StatusBadge key={`${row[0]}-status`} value={row[7]} />, <Button key={`${row[0]}-edit`} variant="secondary" className="h-8 px-2.5 text-[10px]" onClick={() => notify(`${row[1]} master opened for editing.`, "info")}>Edit</Button>])} /> : tab === "categories" ? <DataTable headers={["Category", "Products", "Stock Value", "Active", "Action"]} rows={[["Bakery", "245", "₹12.45L", <StatusBadge key="c1" value="Active" />, <Button key="e1" variant="secondary" onClick={() => notify("Bakery category opened.", "info")}>Edit</Button>], ["Snacks", "183", "₹6.25L", <StatusBadge key="c2" value="Active" />, <Button key="e2" variant="secondary" onClick={() => notify("Snacks category opened.", "info")}>Edit</Button>]]} /> : tab === "outlets" ? <DataTable headers={["Outlet Code", "Outlet", "City", "Inventory Mode", "Last Sync", "Status", "Action"]} rows={[["SB", "SB Outlet", "Madurai", "Real-time", "2 mins ago", <StatusBadge key="o1" value="Active" />, <Button key="oe1" variant="secondary" onClick={() => notify("SB Outlet master opened.", "info")}>Edit</Button>], ["BN1", "BN1 Outlet", "Madurai", "Real-time", "4 mins ago", <StatusBadge key="o2" value="Active" />, <Button key="oe2" variant="secondary" onClick={() => notify("BN1 Outlet master opened.", "info")}>Edit</Button>]]} /> : tab === "rules" ? <DataTable headers={["Outlet", "Product", "Minimum", "Maximum", "Reorder Point", "Safety Days", "Action"]} rows={[["SB Outlet", "Milk Bread", "50", "120", "60", "1.5", <Button key="r1" variant="secondary" onClick={() => notify("Min/max rule opened.", "info")}>Edit</Button>], ["BN1 Outlet", "Milk Bread", "50", "100", "60", "1.5", <Button key="r2" variant="secondary" onClick={() => notify("Min/max rule opened.", "info")}>Edit</Button>]]} /> : tab === "uom" ? <DataTable headers={["Code", "Unit", "Type", "Decimal Allowed", "Status", "Action"]} rows={[["PCS", "Pieces", "Count", "No", <StatusBadge key="u1" value="Active" />, <Button key="u2" variant="secondary" onClick={() => notify("UoM opened.", "info")}>Edit</Button>], ["KG", "Kilogram", "Weight", "Yes", <StatusBadge key="u3" value="Active" />, <Button key="u4" variant="secondary" onClick={() => notify("UoM opened.", "info")}>Edit</Button>]]} /> : <DataTable headers={["Code", "Reason", "Applies To", "Requires Evidence", "Status", "Action"]} rows={[["W-EXP", "Expired", "Wastage", "Yes", <StatusBadge key="rc1" value="Active" />, <Button key="rc2" variant="secondary" onClick={() => notify("Reason code opened.", "info")}>Edit</Button>], ["W-DMG", "Damaged", "Wastage", "Yes", <StatusBadge key="rc3" value="Active" />, <Button key="rc4" variant="secondary" onClick={() => notify("Reason code opened.", "info")}>Edit</Button>]]} />}
      </Card>

      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Add Inventory Master" description="Create a new master record. The form adapts to the selected master tab." footer={<><Button variant="secondary" onClick={() => setAddOpen(false)}>Cancel</Button><Button onClick={addMaster}>Save Master</Button></>}>
        <div className="grid gap-4 sm:grid-cols-2"><label className="text-sm font-semibold text-slate-700">Name<Input className="mt-2 w-full" value={name} onChange={(e) => setName(e.target.value)} placeholder="Enter name" /></label><label className="text-sm font-semibold text-slate-700">Category<Select className="mt-2 w-full" value={category} onChange={(e) => setCategory(e.target.value)}><option>Bakery</option><option>Snacks</option><option>Cakes</option><option>Beverages</option></Select></label><label className="text-sm font-semibold text-slate-700">Minimum Qty<Input className="mt-2 w-full" type="number" value={minQty} onChange={(e) => setMinQty(e.target.value)} /></label><label className="text-sm font-semibold text-slate-700">Maximum Qty<Input className="mt-2 w-full" type="number" value={maxQty} onChange={(e) => setMaxQty(e.target.value)} /></label></div>
      </Modal>
    </>
  );
}
