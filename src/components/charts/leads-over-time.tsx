"use client";

import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from "recharts";

interface DataPoint {
  date: string;
  total: number;
  qualified: number;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/10 rounded-lg px-4 py-3 shadow-lg shadow-slate-200/50 dark:shadow-black/30 text-xs">
        <p className="font-bold text-slate-700 dark:text-slate-200 mb-2">{label}</p>
        {payload.map((entry: any) => (
          <div key={entry.name} className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full" style={{ background: entry.color }} />
            <span className="text-slate-400 dark:text-slate-500 capitalize">{entry.name}:</span>
            <span className="font-semibold text-slate-700 dark:text-slate-200">{entry.value}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export function LeadsOverTimeChart({ data }: { data: DataPoint[] }) {
  const chartData = [...data].reverse().map((d) => ({
    date: new Date(d.date).toLocaleDateString("en-MY", { month: "short", day: "numeric" }),
    leads: d.total,
    qualified: d.qualified,
  }));

  return (
    <div className="bg-white dark:bg-white/[0.04] rounded-lg shadow-card dark:border dark:border-white/[0.06] p-5">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-sm font-bold text-slate-800 dark:text-white">Sales Overview</h3>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Leads generated over time</p>
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
          <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
            <defs>
              <linearGradient id="leadsGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="qualGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.12} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" strokeWidth={1} vertical={false} />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 10, fill: "#94a3b8" }}
              axisLine={false}
              tickLine={false}
              interval={Math.max(0, Math.floor(chartData.length / 6) - 1)}
            />
            <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "12px" }} iconType="circle" iconSize={6} />
            <Area type="monotone" dataKey="leads" stroke="#6366f1" strokeWidth={2.5} fill="url(#leadsGrad)" dot={false} activeDot={{ r: 4, fill: "#6366f1", strokeWidth: 0 }} />
            <Area type="monotone" dataKey="qualified" stroke="#10b981" strokeWidth={2.5} fill="url(#qualGrad)" dot={false} activeDot={{ r: 4, fill: "#10b981", strokeWidth: 0 }} />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
