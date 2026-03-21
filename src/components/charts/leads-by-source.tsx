"use client";

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell,
} from "recharts";

interface DataPoint {
  source: string;
  total: number;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/10 rounded-2xl px-4 py-3 shadow-lg shadow-slate-200/50 dark:shadow-black/30 text-xs">
        <p className="font-bold text-slate-700 dark:text-slate-200">{label}</p>
        <p className="text-indigo-500 font-semibold mt-1">{payload[0].value} leads</p>
      </div>
    );
  }
  return null;
};

const COLORS = ["#6366f1", "#818cf8", "#93c5fd", "#7dd3fc", "#38bdf8", "#a5b4fc"];

export function LeadsBySourceChart({ data }: { data: DataPoint[] }) {
  const chartData = data.map((d) => ({ source: d.source, leads: d.total }));

  return (
    <div className="bg-white dark:bg-white/[0.04] rounded-2xl border border-slate-100/80 dark:border-white/[0.06] p-5">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-sm font-bold text-slate-800 dark:text-white">Leads by Source</h3>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Leads by source channel</p>
        </div>
        <button className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
          <span className="text-lg leading-none">···</span>
        </button>
      </div>
      {chartData.length === 0 ? (
        <div className="flex items-center justify-center h-[200px] text-sm text-slate-400 dark:text-slate-500">
          No lead data yet
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={chartData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
            <XAxis dataKey="source" tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(99,102,241,0.05)", radius: 8 }} />
            <Bar dataKey="leads" radius={[8, 8, 0, 0]} maxBarSize={40}>
              {chartData.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
