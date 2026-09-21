"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export function TrendChart({ data, dataKey = "accuracy", suffix = "%" }: { data: any[]; dataKey?: string; suffix?: string }) {
  return (
    <ResponsiveContainer width="100%" height={250}>
      <AreaChart data={data} margin={{ left: -18, right: 6, top: 8, bottom: 0 }}>
        <defs>
          <linearGradient id="inventoryTrend" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.26} />
            <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="4 6" stroke="#e2e8f0" vertical={false} />
        <XAxis dataKey="d" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#64748b" }} />
        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#94a3b8" }} domain={[80, 100]} />
        <Tooltip formatter={(value) => [`${value}${suffix}`, "Inventory accuracy"]} />
        <Area type="monotone" dataKey={dataKey} stroke="#4f46e5" fill="url(#inventoryTrend)" strokeWidth={3} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function Donut({ data }: { data: { name: string; value: number }[] }) {
  const colors = ["#10b981", "#f59e0b", "#f43f5e", "#6366f1", "#8b5cf6"];
  return (
    <ResponsiveContainer width="100%" height={220}>
      <PieChart>
        <Pie data={data} dataKey="value" nameKey="name" innerRadius={58} outerRadius={84} paddingAngle={4} cornerRadius={6}>
          {data.map((_, i) => (
            <Cell key={i} fill={colors[i % colors.length]} />
          ))}
        </Pie>
        <Tooltip />
      </PieChart>
    </ResponsiveContainer>
  );
}

export function SimpleBar({ data }: { data: any[] }) {
  return (
    <ResponsiveContainer width="100%" height={230}>
      <BarChart data={data} margin={{ left: -16, right: 6, top: 8, bottom: 0 }}>
        <CartesianGrid strokeDasharray="4 6" stroke="#e2e8f0" vertical={false} />
        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#64748b" }} />
        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#94a3b8" }} />
        <Tooltip />
        <Bar dataKey="value" fill="#6366f1" radius={[8, 8, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
