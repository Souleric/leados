"use client";

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { inquiryBreakdown } from "@/lib/mock-data";

const COLORS = ["#6366f1", "#818cf8", "#93c5fd", "#c7d2fe", "#e0e7ff"];

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/10 rounded-2xl px-4 py-3 shadow-lg text-xs">
        <p className="font-bold text-slate-700 dark:text-slate-200">{payload[0].name}</p>
        <p className="font-semibold mt-1" style={{ color: payload[0].payload.color }}>
          {payload[0].value}%
        </p>
      </div>
    );
  }
  return null;
};

export function InquiryBreakdownChart() {
  const total = inquiryBreakdown.reduce((s, d) => s + d.value, 0);

  return (
    <div className="bg-white dark:bg-white/[0.04] rounded-2xl border border-slate-100/80 dark:border-white/[0.06] p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-bold text-slate-800 dark:text-white">Sales Overview</h3>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">By inquiry type</p>
        </div>
        <button className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
          <span className="text-lg leading-none">···</span>
        </button>
      </div>

      <div className="relative flex items-center justify-center">
        <ResponsiveContainer width="100%" height={160}>
          <PieChart>
            <Pie
              data={inquiryBreakdown.map((d, i) => ({ ...d, color: COLORS[i] }))}
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={72}
              paddingAngle={3}
              dataKey="value"
              strokeWidth={0}
            >
              {inquiryBreakdown.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
        {/* Center label */}
        <div className="absolute flex flex-col items-center pointer-events-none">
          <p className="text-lg font-bold text-slate-800 dark:text-white">
            RM 500
          </p>
          <p className="text-[10px] text-slate-400 dark:text-slate-500">avg deal</p>
        </div>
      </div>

      {/* Legend */}
      <div className="mt-3 space-y-1.5">
        {inquiryBreakdown.map((item, i) => (
          <div key={item.type} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i] }} />
              <span className="text-xs text-slate-500 dark:text-slate-400">{item.type}</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-20 h-1.5 bg-slate-100 dark:bg-white/[0.06] rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{ width: `${item.value}%`, backgroundColor: COLORS[i] }}
                />
              </div>
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 w-8 text-right">
                {item.value}%
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
