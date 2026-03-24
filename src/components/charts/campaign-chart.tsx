"use client";

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from "recharts";

interface CampaignChartProps {
  campaigns: Array<{
    name: string;
    leads_count: number;
    clicks: number;
  }>;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/10 rounded-2xl px-4 py-3 shadow-lg text-xs">
        <p className="font-bold text-slate-700 dark:text-slate-200 mb-2 max-w-[160px] truncate">{label}</p>
        {payload.map((entry: any) => (
          <div key={entry.name} className="flex items-center gap-2 mt-1">
            <div className="w-2 h-2 rounded-full" style={{ background: entry.color }} />
            <span className="text-slate-400">{entry.name}:</span>
            <span className="font-semibold text-slate-700 dark:text-slate-200">{entry.value}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export function CampaignChart({ campaigns }: CampaignChartProps) {
  const chartData = campaigns.map((c) => ({
    name: c.name.length > 18 ? c.name.slice(0, 18) + "…" : c.name,
    Leads: c.leads_count,
    Clicks: c.clicks,
  }));
  return (
    <div className="bg-white dark:bg-white/[0.04] rounded-2xl border border-slate-100/80 dark:border-white/[0.06] p-5">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-sm font-bold text-slate-800 dark:text-white">Leads per Campaign</h3>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Leads generated vs conversions</p>
        </div>
        <button className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
          <span className="text-lg leading-none">···</span>
        </button>
      </div>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={chartData} margin={{ top: 5, right: 5, left: -25, bottom: 30 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
          <XAxis
            dataKey="name"
            tick={{ fontSize: 9, fill: "#94a3b8" }}
            axisLine={false}
            tickLine={false}
            angle={-25}
            textAnchor="end"
          />
          <YAxis
            tick={{ fontSize: 10, fill: "#94a3b8" }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(99,102,241,0.05)", radius: 8 }} />
          <Legend wrapperStyle={{ fontSize: "11px" }} iconType="circle" iconSize={6} />
          <Bar dataKey="Leads" fill="#6366f1" radius={[6, 6, 0, 0]} maxBarSize={28} />
          <Bar dataKey="Clicks" fill="#93c5fd" radius={[6, 6, 0, 0]} maxBarSize={28} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
