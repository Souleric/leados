"use client";

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";

interface Kpis {
  totalLeads: number;
  qualifiedLeads: number;
  closedWon: number;
  conversionRate: number;
}

const STATUSES = [
  { key: "closedWon",     label: "Closed Won",      color: "#6366f1" },
  { key: "qualifiedLeads", label: "In Progress",    color: "#818cf8" },
  { key: "new",           label: "New",             color: "#93c5fd" },
];

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/10 rounded-2xl px-4 py-3 shadow-lg text-xs">
        <p className="font-bold text-slate-700 dark:text-slate-200">{payload[0].name}</p>
        <p className="font-semibold mt-1" style={{ color: payload[0].payload.color }}>
          {payload[0].value} leads
        </p>
      </div>
    );
  }
  return null;
};

export function InquiryBreakdownChart({ kpis }: { kpis: Kpis }) {
  const inProgress = kpis.qualifiedLeads - kpis.closedWon;
  const newLeads = kpis.totalLeads - kpis.qualifiedLeads;

  const data = [
    { name: "Closed Won", value: kpis.closedWon,  color: "#6366f1" },
    { name: "In Progress", value: Math.max(0, inProgress), color: "#818cf8" },
    { name: "New",         value: Math.max(0, newLeads),   color: "#93c5fd" },
  ].filter((d) => d.value > 0);

  const total = kpis.totalLeads;

  return (
    <div className="bg-white dark:bg-white/[0.04] rounded-2xl border border-slate-100/80 dark:border-white/[0.06] p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-bold text-slate-800 dark:text-white">Lead Breakdown</h3>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">By current status</p>
        </div>
        <button className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
          <span className="text-lg leading-none">···</span>
        </button>
      </div>

      {total === 0 ? (
        <div className="flex items-center justify-center h-[200px] text-sm text-slate-400 dark:text-slate-500">
          No lead data yet
        </div>
      ) : (
        <>
          <div className="relative flex items-center justify-center">
            <ResponsiveContainer width="100%" height={160}>
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={72}
                  paddingAngle={3}
                  dataKey="value"
                  strokeWidth={0}
                >
                  {data.map((d, i) => (
                    <Cell key={i} fill={d.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute flex flex-col items-center pointer-events-none">
              <p className="text-lg font-bold text-slate-800 dark:text-white">{total}</p>
              <p className="text-[10px] text-slate-400 dark:text-slate-500">total leads</p>
            </div>
          </div>

          <div className="mt-3 space-y-1.5">
            {data.map((item) => (
              <div key={item.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-xs text-slate-500 dark:text-slate-400">{item.name}</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-20 h-1.5 bg-slate-100 dark:bg-white/[0.06] rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${Math.round((item.value / total) * 100)}%`, backgroundColor: item.color }}
                    />
                  </div>
                  <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 w-8 text-right">
                    {Math.round((item.value / total) * 100)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
