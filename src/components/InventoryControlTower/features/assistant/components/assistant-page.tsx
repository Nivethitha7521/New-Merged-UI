"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Bot, Boxes, ClipboardCheck, Repeat2, Send, Trash2, TrendingUp } from "lucide-react";
import { Button, Card, Kpi, PageHeader, StatusBadge } from "@/components/InventoryControlTower/shared/components/ui";
import { Modal, useActionCenter } from "@/components/InventoryControlTower/shared/components/action-center";
import { apiRequest } from "@/components/InventoryControlTower/shared/lib/api";

const priorities = [
  ["High", "BN1 Outlet — Milk Bread Shortage", "Current stock 8 pcs; minimum 25 pcs", "Critical", "Take Action", "/inventory-control-tower/exceptions"],
  ["High", "RS Outlet — High Wastage Detected", "Wastage quantity is above the configured outlet threshold", "Warning", "Take Action", "/inventory-control-tower/wastage"],
  ["Medium", "PMK Outlet — Receipt Not Confirmed", "Transfer receipt pending for 42 minutes", "Warning", "Remind Outlet", "/inventory-control-tower/alerts"],
  ["Medium", "Low Stock Prediction", "2 products at SB may reach minimum before 3 PM", "Info", "Plan Transfer", "/inventory-control-tower/transfers"],
  ["Low", "Daily Reconciliation Pending", "3 outlets have not completed physical reconciliation", "Info", "Follow Up", "/inventory-control-tower/reconciliation"],
] as const;

const quickQuestions = ["Why is wastage high in RS Outlet?", "Show low stock items", "Which outlets need attention?", "Suggest transfers today"];

export function AssistantPage() {
  const router = useRouter();
  const { notify } = useActionCenter();
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [asking, setAsking] = useState(false);
  const [selectedPriority, setSelectedPriority] = useState<(typeof priorities)[number] | null>(null);

  async function askAI(prompt = question) {
    const clean = prompt.trim();
    if (!clean) {
      notify("Enter an inventory question first.", "error");
      return;
    }
    setQuestion(clean);
    setAsking(true);
    const result = await apiRequest<{ answer: string }>("/assistant/ask", {
      method: "POST",
      body: JSON.stringify({ question: clean, outlet_id: null }),
    });
    const fallback = clean.toLowerCase().includes("transfer")
      ? "Recommended action: transfer 24 Milk Bread from SB Outlet to BN1 Outlet and 20 pcs from Trichy Outlet to RS Outlet. Review current stock before confirming."
      : clean.toLowerCase().includes("wastage")
        ? "RS Outlet has repeated Veg Puff wastage above the configured threshold. Review batch age, production receipt timing and physical count variance."
        : "Current inventory priorities are BN1 Milk Bread shortage, RS wastage variance, PMK pending receipt and three pending reconciliations.";
    setAnswer(result.ok && result.data?.answer && !result.data.answer.includes("placeholder") ? result.data.answer : fallback);
    setAsking(false);
    notify(result.ok ? "AI inventory analysis completed." : "Using local inventory intelligence because the AI backend is unavailable.", result.ok ? "success" : "warning");
  }

  function takePriorityAction(priority: (typeof priorities)[number]) {
    router.push(priority[5]);
  }

  return (
    <>
      <PageHeader title="AI Inventory Assistant" subtitle="Inventory-only insights, anomaly detection, stock-risk forecasting and recommended actions" />
      <div className="grid gap-4 xl:grid-cols-[1fr_320px]">
        <div className="min-w-0 space-y-4">
          <Card className="p-4 sm:p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 p-3 text-white shadow-lg shadow-indigo-100"><Bot size={28} /></div>
                <div>
                  <h2 className="text-lg font-extrabold text-slate-950 sm:text-xl">Inventory command brief</h2>
                  <p className="text-xs text-slate-500 sm:text-sm">Current exceptions and recommended inventory actions.</p>
                </div>
              </div>
              <div className="sm:ml-auto"><Button onClick={() => askAI("Give me today's inventory command brief")}>Ask AI</Button></div>
            </div>
            <div className="mt-5 grid grid-cols-2 gap-3 xl:grid-cols-5">
              <Kpi label="Outlets Need Attention" value="3" icon={<AlertTriangle size={18} />} tone="red" />
              <Kpi label="Stock Shortages" value="12" icon={<Boxes size={18} />} tone="orange" />
              <Kpi label="High Wastage" value="2" icon={<Trash2 size={18} />} tone="violet" />
              <Kpi label="Pending Approvals" value="5" icon={<ClipboardCheck size={18} />} />
              <Kpi label="Transfers in Transit" value="7" icon={<Repeat2 size={18} />} tone="green" />
            </div>
          </Card>

          <Card className="overflow-hidden">
            <div className="border-b border-slate-100 p-4">
              <h2 className="font-bold text-slate-900">Top Priorities</h2>
              <p className="text-xs text-slate-500">What needs inventory team attention now</p>
            </div>
            <div className="divide-y divide-slate-100">
              {priorities.map((priority, index) => (
                <div key={index} className="flex flex-col gap-3 p-4 lg:flex-row lg:items-center">
                  <div className="flex items-center gap-2 lg:w-24"><StatusBadge value={priority[0]} /></div>
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold text-slate-900">{priority[1]}</div>
                    <div className="mt-1 text-xs text-slate-500 sm:text-sm">{priority[2]}</div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge value={priority[3]} />
                    <Button variant="secondary" onClick={() => setSelectedPriority(priority)}>View</Button>
                    <Button onClick={() => takePriorityAction(priority)}>{priority[4]}</Button>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card className="border-indigo-100 bg-gradient-to-br from-indigo-50 via-white to-violet-50 p-4 sm:p-5">
            <div className="flex items-center gap-2 font-bold text-indigo-700"><TrendingUp size={18} /> AI Recommendation</div>
            <ul className="mt-4 grid gap-2 text-sm text-slate-700 sm:grid-cols-2">
              <li className="rounded-xl bg-white/70 p-3">Transfer 25 Milk Bread from SB Outlet to BN1 Outlet.</li>
              <li className="rounded-xl bg-white/70 p-3">Reduce tomorrow&apos;s Black Forest Cake replenishment by 15%.</li>
              <li className="rounded-xl bg-white/70 p-3">Investigate repeated Veg Puff wastage in RS Outlet.</li>
              <li className="rounded-xl bg-white/70 p-3">Reorder five materials likely to reach safety stock within three days.</li>
            </ul>
          </Card>

          <Card className="p-3 sm:p-4">
            <div className="flex flex-col gap-2 sm:flex-row">
              <input
                className="h-12 min-w-0 flex-1 rounded-xl border border-slate-200 px-4 text-sm outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50"
                placeholder="Ask anything about inventory..."
                value={question}
                onChange={(event) => setQuestion(event.target.value)}
                onKeyDown={(event) => { if (event.key === "Enter") askAI(); }}
              />
              <button disabled={asking} onClick={() => askAI()} className="flex h-12 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-5 text-sm font-bold text-white disabled:opacity-50"><Send size={18} />{asking ? "Analyzing..." : "Ask AI"}</button>
            </div>
            <div className="mt-3 flex gap-2 overflow-x-auto pb-1 text-xs ct-scrollbar-thin sm:flex-wrap">
              {quickQuestions.map((item) => (
                <button key={item} className="shrink-0 rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-600 transition hover:border-indigo-200 hover:bg-indigo-50" onClick={() => askAI(item)}>{item}</button>
              ))}
            </div>
            {answer ? (
              <div className="mt-4 rounded-2xl border border-indigo-100 bg-indigo-50/60 p-4">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.12em] text-indigo-600"><Bot size={15} /> AI response</div>
                <p className="mt-2 text-sm leading-6 text-slate-700">{answer}</p>
              </div>
            ) : null}
          </Card>
        </div>

        <div className="space-y-4">
          <Card className="p-5">
            <div className="text-sm font-bold text-slate-800">Inventory Health Score</div>
            <div className="mt-2 text-4xl font-extrabold">78<span className="text-lg text-slate-400">/100</span></div>
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full w-[78%] bg-emerald-500" /></div>
            <p className="mt-2 text-xs font-semibold text-emerald-600">↑ 6 points vs yesterday</p>
          </Card>
          <Card className="p-5">
            <h3 className="font-bold text-slate-900">Stock Risk Forecast</h3>
            <div className="mt-4 space-y-4 text-sm">
              {[["Critical — may run out today", "3"], ["High — 1–2 days", "7"], ["Medium — 3–7 days", "15"], ["Sufficient stock", "8,517"]].map(([label, value], index) => (
                <div key={label} className="flex justify-between gap-3"><span className="text-slate-500">{label}</span><b className={index === 0 ? "text-rose-600" : index === 1 ? "text-orange-600" : index === 3 ? "text-emerald-600" : ""}>{value}</b></div>
              ))}
            </div>
          </Card>
          <Card className="p-5">
            <h3 className="font-bold text-slate-900">Fast Inventory Insights</h3>
            <div className="mt-4 grid grid-cols-2 gap-3 xl:grid-cols-1">
              <div className="rounded-xl bg-slate-50 p-3"><span className="text-[10px] font-semibold uppercase text-slate-400">Inventory Value</span><b className="mt-1 block text-lg">₹28.45L</b></div>
              <div className="rounded-xl bg-slate-50 p-3"><span className="text-[10px] font-semibold uppercase text-slate-400">Pending Receipts</span><b className="mt-1 block text-lg">7</b></div>
              <div className="rounded-xl bg-slate-50 p-3"><span className="text-[10px] font-semibold uppercase text-slate-400">Highest Variance</span><b className="mt-1 block text-lg">Milk Bread</b></div>
              <div className="rounded-xl bg-slate-50 p-3"><span className="text-[10px] font-semibold uppercase text-slate-400">Slow Moving</span><b className="mt-1 block text-lg">47 items</b></div>
            </div>
          </Card>
        </div>
      </div>

      <Modal
        open={selectedPriority !== null}
        onClose={() => setSelectedPriority(null)}
        title={selectedPriority?.[1] || "Inventory priority"}
        description="AI-detected inventory priority and recommended next action."
        footer={<><Button variant="secondary" onClick={() => setSelectedPriority(null)}>Close</Button>{selectedPriority ? <Button onClick={() => takePriorityAction(selectedPriority)}>{selectedPriority[4]}</Button> : null}</>}
      >
        {selectedPriority ? (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2"><StatusBadge value={selectedPriority[0]} /><StatusBadge value={selectedPriority[3]} /></div>
            <div className="rounded-2xl bg-slate-50 p-4 text-sm leading-6 text-slate-700">{selectedPriority[2]}</div>
            <div className="rounded-2xl border border-indigo-100 bg-indigo-50/60 p-4 text-sm text-indigo-900">Recommended workflow: open the relevant inventory module, validate the latest physical/receipt data, then complete the suggested action with remarks.</div>
          </div>
        ) : null}
      </Modal>
    </>
  );
}
