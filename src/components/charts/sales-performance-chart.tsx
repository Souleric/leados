"use client";

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from "recharts";

interface MemberStat {
  name: string;
  total: number;
  closed_won: number;
  in_progress: number;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/10 rounded-lg px-4 py-3 shadow-lg text-xs">
        <p className="font-bold text-slate-700 dark:text-slate-200 mb-2">{label}</p>
        {payload.map((p: any) => (
          <p key={p.name} className="font-semibold" style={{ color: p.color }}>
            {p.name}: {p.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export function SalesPerformanceChart({ data }: { data: MemberStat[] }) {
  return (
    <div className="bg-white dark:bg-white/[0.04] rounded-lg border border-slate-100/80 dark:border-white/[0.06] p-5">
      <div className="mb-4">
        <h3 className="text-sm font-bold text-slate-800 dark:text-white">Sales Person Performance</h3>
        <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Leads assigned vs closed</p>
      </div>

      {data.length === 0 ? (
        <div className="flex items-center justify-center h-[200px] text-sm text-slate-400 dark:text-slate-500">
          No sales persons yet
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={data} barCategoryGap="40%" margin={{ top: 5, right: 10, left: -10, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-slate-100 dark:text-white/[0.05]" vertical={false} />
            <XAxis
              dataKey="name"
              tick={{ fontSize: 11, fill: "currentColor" }}
              className="text-slate-500 dark:text-slate-400"
              axisLine={false}
              tickLine={false}
              interval={0}
            />
            <YAxis
              tick={{ fontSize: 11, fill: "currentColor" }}
              className="text-slate-400 dark:text-slate-500"
              axisLine={false}
              tickLine={false}
              allowDecimals={false}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: "currentColor", className: "text-slate-50 dark:text-white/[0.03]" }} />
            <Legend
              verticalAlign="top"
              align="right"
              iconType="circle"
              iconSize={7}
              wrapperStyle={{ fontSize: 11, paddingBottom: 8 }}
            />
            <Bar dataKey="total" name="Total" fill="#94a3b8" radius={[4, 4, 0, 0]} />
            <Bar dataKey="in_progress" name="In Progress" fill="#1E6FEB" radius={[4, 4, 0, 0]} />
            <Bar dataKey="closed_won" name="Closed Won" fill="#10B981" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
