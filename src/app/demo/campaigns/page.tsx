"use client";

import { DemoHeader } from "@/components/demo/header";
import { DEMO_CAMPAIGNS } from "../data";
import { TrendingUp, DollarSign, Users, Target } from "lucide-react";

const platformColors: Record<string, string> = {
  Facebook:  "bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300",
  Instagram: "bg-pink-100 text-pink-700 dark:bg-pink-950/50 dark:text-pink-300",
};
const statusColors: Record<string, string> = {
  active: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400",
  paused: "bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400",
  ended:  "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400",
};

function fmt(n: number, prefix = "", decimals = 2) {
  return `${prefix}${n.toLocaleString("en-MY", { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}`;
}

const totalSpend  = DEMO_CAMPAIGNS.reduce((s, c) => s + c.spend, 0);
const totalLeads  = DEMO_CAMPAIGNS.reduce((s, c) => s + c.leads_count, 0);
const totalImpr   = DEMO_CAMPAIGNS.reduce((s, c) => s + c.impressions, 0);
const avgCpl      = totalLeads > 0 ? totalSpend / totalLeads : 0;

export default function DemoCampaignsPage() {
  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <DemoHeader title="Campaigns" />
      <main className="flex-1 overflow-y-auto px-7 pb-8 scrollbar-thin">

        <div className="flex items-center justify-between mb-5 mt-1">
          <div>
            <h2 className="text-xl font-bold text-slate-800 dark:text-white">Campaigns</h2>
            <p className="text-sm text-slate-400 mt-0.5">Meta Ads — Facebook & Instagram</p>
          </div>
          <div className="px-3 py-1.5 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-lg text-xs text-amber-700 dark:text-amber-400 font-medium">
            Demo — read only
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[
            { label: "Total Spend",   value: `RM ${fmt(totalSpend, "", 0)}`, icon: DollarSign,  color: "text-indigo-500",  bg: "bg-indigo-50 dark:bg-indigo-500/10" },
            { label: "Total Leads",   value: String(totalLeads),              icon: Users,        color: "text-blue-500",    bg: "bg-blue-50 dark:bg-blue-500/10" },
            { label: "Impressions",   value: `${(totalImpr / 1000).toFixed(0)}K`,icon: TrendingUp, color: "text-emerald-500", bg: "bg-emerald-50 dark:bg-emerald-500/10" },
            { label: "Avg. CPL",      value: `RM ${fmt(avgCpl, "", 2)}`,      icon: Target,       color: "text-amber-500",   bg: "bg-amber-50 dark:bg-amber-500/10" },
          ].map((kpi) => (
            <div key={kpi.label} className="bg-white dark:bg-white/[0.04] rounded-lg shadow-card dark:border dark:border-white/[0.06] p-5">
              <div className="flex items-start justify-between mb-3">
                <div className={`w-9 h-9 rounded-md flex items-center justify-center ${kpi.bg}`}>
                  <kpi.icon className={`w-[18px] h-[18px] ${kpi.color}`} strokeWidth={2.5} />
                </div>
              </div>
              <p className="text-2xl font-bold text-slate-800 dark:text-white tracking-tight">{kpi.value}</p>
              <p className="text-xs font-medium text-slate-400 mt-1.5 uppercase tracking-wide">{kpi.label}</p>
            </div>
          ))}
        </div>

        {/* Campaign Table */}
        <div className="bg-white dark:bg-white/[0.04] rounded-lg shadow-card dark:border dark:border-white/[0.06] overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 dark:border-white/[0.06] flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-800 dark:text-white">All Campaigns</h3>
            <span className="text-xs text-slate-400">{DEMO_CAMPAIGNS.length} campaigns</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100 dark:border-white/[0.06]">
                  {["Campaign", "Platform", "Status", "Spend (RM)", "Leads", "CPL (RM)", "Impressions", "Clicks"].map((h) => (
                    <th key={h} className="text-left px-5 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {DEMO_CAMPAIGNS.map((camp) => (
                  <tr key={camp.id} className="border-b border-slate-50 dark:border-white/[0.03] hover:bg-slate-50/60 dark:hover:bg-white/[0.02] transition-colors">
                    <td className="px-5 py-3.5">
                      <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">{camp.name}</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">{camp.start_date}{camp.end_date ? ` → ${camp.end_date}` : " → ongoing"}</p>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`text-[11px] px-2 py-0.5 rounded font-medium ${platformColors[camp.platform] ?? ""}`}>{camp.platform}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`text-[11px] px-2 py-0.5 rounded font-medium capitalize ${statusColors[camp.status] ?? ""}`}>{camp.status}</span>
                    </td>
                    <td className="px-5 py-3.5 text-sm font-semibold text-slate-700 dark:text-slate-300">{fmt(camp.spend, "", 0)}</td>
                    <td className="px-5 py-3.5 text-sm font-semibold text-indigo-600 dark:text-indigo-400">{camp.leads_count}</td>
                    <td className="px-5 py-3.5 text-sm text-slate-600 dark:text-slate-300">{fmt(camp.cpl)}</td>
                    <td className="px-5 py-3.5 text-sm text-slate-500 dark:text-slate-400">{camp.impressions.toLocaleString()}</td>
                    <td className="px-5 py-3.5 text-sm text-slate-500 dark:text-slate-400">{camp.clicks.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </main>
    </div>
  );
}
