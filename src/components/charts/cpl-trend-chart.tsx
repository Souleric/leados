"use client";

import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from "recharts";

interface TrendPoint {
  week: string;
  spend: number;
  leads: number;
  cpl: number | null;
}

interface CPLTrendChartProps {
  data: TrendPoint[];
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/10 rounded-lg px-4 py-3 shadow-lg text-xs">
        <p className="font-bold text-slate-700 dark:text-slate-200 mb-2">{label}</p>
        {payload.map((entry: any) => (
          <div key={entry.name} className="flex items-center gap-2 mt-1">
            <div className="w-2 h-2 rounded-full" style={{ background: entry.color }} />
            <span className="text-slate-400">{entry.name}:</span>
            <span className="font-semibold text-slate-700 dark:text-slate-200">
              {entry.name === "CPL (RM)" ? `RM ${entry.value}` : entry.value}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export function CPLTrendChart({ data }: CPLTrendChartProps) {
  const chartData = data.map((d) => ({
    week: d.week.slice(5), // "03-24" from "2026-03-24"
    "CPL (RM)": d.cpl ?? 0,
    Leads: d.leads,
  }));

  return (
    <div className="bg-white dark:bg-white/[0.04] rounded-lg shadow-card dark:border dark:border-white/[0.06] p-5">
      <div className="mb-5">
        <h3 className="text-sm font-bold text-slate-800 dark:text-white">CPL Trend</h3>
        <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Cost per lead & leads generated weekly (last 90 days)</p>
      </div>
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
          <XAxis
            dataKey="week"
            tick={{ fontSize: 10, fill: "#94a3b8" }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            yAxisId="cpl"
            orientation="left"
            tick={{ fontSize: 10, fill: "#94a3b8" }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => `RM${v}`}
          />
          <YAxis
            yAxisId="leads"
            orientation="right"
            tick={{ fontSize: 10, fill: "#94a3b8" }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend wrapperStyle={{ fontSize: "11px" }} iconType="circle" iconSize={6} />
          <Line
            yAxisId="cpl"
            type="monotone"
            dataKey="CPL (RM)"
            stroke="#1E6FEB"
            strokeWidth={2.5}
            dot={{ r: 3, fill: "#1E6FEB" }}
            activeDot={{ r: 5 }}
          />
          <Line
            yAxisId="leads"
            type="monotone"
            dataKey="Leads"
            stroke="#F97316"
            strokeWidth={2.5}
            strokeDasharray="4 4"
            dot={{ r: 3, fill: "#F97316" }}
            activeDot={{ r: 5 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
