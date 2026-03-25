"use client";

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend, Cell,
} from "recharts";

interface ReachFrequencyChartProps {
  campaigns: Array<{
    name: string;
    reach: number;
    impressions: number;
    frequency: number | null;
  }>;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const reach = payload.find((p: any) => p.name === "Reach")?.value ?? 0;
    const impressions = payload.find((p: any) => p.name === "Impressions")?.value ?? 0;
    const freq = reach > 0 ? (impressions / reach).toFixed(2) : "—";
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/10 rounded-lg px-4 py-3 shadow-lg text-xs">
        <p className="font-bold text-slate-700 dark:text-slate-200 mb-2 max-w-[160px] truncate">{label}</p>
        {payload.map((entry: any) => (
          <div key={entry.name} className="flex items-center gap-2 mt-1">
            <div className="w-2 h-2 rounded-full" style={{ background: entry.color }} />
            <span className="text-slate-400">{entry.name}:</span>
            <span className="font-semibold text-slate-700 dark:text-slate-200">{entry.value?.toLocaleString()}</span>
          </div>
        ))}
        <div className="mt-2 pt-2 border-t border-slate-100 dark:border-white/10 flex items-center gap-2">
          <span className="text-slate-400">Frequency:</span>
          <span className={`font-semibold ${parseFloat(freq) > 3 ? "text-amber-500" : "text-emerald-500"}`}>
            {freq}x {parseFloat(freq) > 3 ? "⚠ audience fatigue" : "✓ healthy"}
          </span>
        </div>
      </div>
    );
  }
  return null;
};

export function ReachFrequencyChart({ campaigns }: ReachFrequencyChartProps) {
  const chartData = campaigns.map((c) => ({
    name: c.name.length > 16 ? c.name.slice(0, 16) + "…" : c.name,
    Reach: c.reach,
    Impressions: c.impressions,
    frequency: c.frequency ?? 0,
  }));

  return (
    <div className="bg-white dark:bg-white/[0.04] rounded-lg shadow-card dark:border dark:border-white/[0.06] p-5">
      <div className="mb-5">
        <h3 className="text-sm font-bold text-slate-800 dark:text-white">Reach vs Impressions</h3>
        <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
          Large gap = high frequency = audience fatigue risk
        </p>
      </div>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={chartData} margin={{ top: 5, right: 5, left: -10, bottom: 20 }} barCategoryGap="40%">
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
          <XAxis
            dataKey="name"
            tick={{ fontSize: 10, fill: "#94a3b8" }}
            axisLine={false}
            tickLine={false}
            interval={0}
          />
          <YAxis
            tick={{ fontSize: 10, fill: "#94a3b8" }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(99,102,241,0.05)", radius: 8 }} />
          <Legend wrapperStyle={{ fontSize: "11px" }} iconType="circle" iconSize={6} verticalAlign="top" align="right" />
          <Bar dataKey="Impressions" fill="#CBD5E1" radius={[6, 6, 0, 0]} maxBarSize={32} />
          <Bar dataKey="Reach" fill="#F97316" radius={[6, 6, 0, 0]} maxBarSize={32} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
