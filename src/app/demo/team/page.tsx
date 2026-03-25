"use client";

import { DemoHeader } from "@/components/demo/header";
import { Users, TrendingUp, UserCheck } from "lucide-react";
import { DEMO_MEMBERS, DEMO_CONTACTS, DEMO_PER_MEMBER } from "../data";

function initials(name: string) {
  return name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();
}

// Build per-member stats from contacts
const statsMap: Record<string, { total: number; new: number; contacted: number; proposal_sent: number; converted: number; inactive: number }> = {};
for (const m of DEMO_MEMBERS) {
  statsMap[m.name] = { total: 0, new: 0, contacted: 0, proposal_sent: 0, converted: 0, inactive: 0 };
}
for (const c of DEMO_CONTACTS) {
  const key = c.assigned_to && statsMap[c.assigned_to] ? c.assigned_to : null;
  if (!key) continue;
  const s = statsMap[key];
  s.total++;
  if (c.status in s) (s as any)[c.status]++;
}

const totalLeads  = DEMO_MEMBERS.reduce((acc, m) => acc + (statsMap[m.name]?.total ?? 0), 0);
const totalWon    = DEMO_MEMBERS.reduce((acc, m) => acc + (statsMap[m.name]?.converted ?? 0), 0);
const totalActive = DEMO_MEMBERS.reduce((acc, m) => acc + (statsMap[m.name]?.contacted ?? 0) + (statsMap[m.name]?.proposal_sent ?? 0), 0);

export default function DemoTeamPage() {
  const sorted = [...DEMO_MEMBERS].sort(
    (a, b) => (statsMap[b.name]?.converted ?? 0) - (statsMap[a.name]?.converted ?? 0)
  );

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <DemoHeader title="Team" />
      <main className="flex-1 overflow-y-auto p-6 scrollbar-thin">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Team</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{DEMO_MEMBERS.length} sales persons</p>
          </div>
          <div className="px-3 py-1.5 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-lg text-xs text-amber-700 dark:text-amber-400 font-medium">
            Demo — read only
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[
            { label: "Sales Persons", value: DEMO_MEMBERS.length, icon: Users,      color: "text-indigo-600",  bg: "bg-indigo-50 dark:bg-indigo-950/40" },
            { label: "Total Leads",   value: totalLeads,           icon: TrendingUp, color: "text-blue-600",    bg: "bg-blue-50 dark:bg-blue-950/40" },
            { label: "Active",        value: totalActive,          icon: UserCheck,  color: "text-amber-600",   bg: "bg-amber-50 dark:bg-amber-950/40" },
            { label: "Closed Won",    value: totalWon,             icon: UserCheck,  color: "text-emerald-600", bg: "bg-emerald-50 dark:bg-emerald-950/40" },
          ].map((kpi) => (
            <div key={kpi.label} className="bg-white dark:bg-white/[0.04] rounded-lg shadow-card dark:border dark:border-white/[0.06] p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wide">{kpi.label}</p>
                  <p className="text-xl font-bold text-gray-900 dark:text-white mt-1.5">{kpi.value}</p>
                </div>
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${kpi.bg}`}>
                  <kpi.icon className={`w-4 h-4 ${kpi.color}`} />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Member cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
          {DEMO_MEMBERS.map((member) => {
            const s = statsMap[member.name];
            const closeRate = s.total > 0 ? Math.round((s.converted / s.total) * 100) : 0;
            return (
              <div key={member.id} className="bg-white dark:bg-white/[0.04] rounded-lg shadow-card dark:border dark:border-white/[0.06] p-5">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: member.color + "20" }}>
                      <span className="text-sm font-bold" style={{ color: member.color }}>{initials(member.name)}</span>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white leading-tight">{member.name}</p>
                      <p className="text-[11px] text-gray-400 mt-0.5">{member.email}</p>
                    </div>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400">
                    Sales Person
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2 mb-4">
                  {[
                    { label: "Total",  value: s.total,     bg: "bg-slate-50 dark:bg-white/[0.03]" },
                    { label: "Won",    value: s.converted, bg: "bg-emerald-50 dark:bg-emerald-950/20" },
                    { label: "Active", value: s.contacted + s.proposal_sent, bg: "bg-amber-50 dark:bg-amber-950/20" },
                  ].map(({ label, value, bg }) => (
                    <div key={label} className={`${bg} rounded-xl p-2.5 text-center`}>
                      <p className="text-[10px] text-gray-400 uppercase tracking-wide">{label}</p>
                      <p className="text-base font-bold text-gray-900 dark:text-white mt-0.5">{value}</p>
                    </div>
                  ))}
                </div>
                <div className="flex flex-wrap gap-x-3 gap-y-1.5 mb-4 text-[11px]">
                  {[
                    { label: "New", value: s.new, color: "bg-indigo-400" },
                    { label: "Contacted", value: s.contacted, color: "bg-amber-400" },
                    { label: "Proposal", value: s.proposal_sent, color: "bg-violet-400" },
                    { label: "Inactive", value: s.inactive, color: "bg-gray-400" },
                  ].map(({ label, value, color }) => (
                    <div key={label} className="flex items-center gap-1.5">
                      <div className={`w-1.5 h-1.5 rounded-full ${color}`} />
                      <span className="text-gray-500">{label}</span>
                      <span className="font-semibold text-gray-700 dark:text-gray-200">{value}</span>
                    </div>
                  ))}
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] text-gray-400">Close Rate</span>
                    <span className="text-[10px] font-semibold text-gray-600 dark:text-gray-400">{closeRate}%</span>
                  </div>
                  <div className="h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${closeRate}%` }} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Leaderboard */}
        <div className="bg-white dark:bg-white/[0.04] rounded-lg shadow-card dark:border dark:border-white/[0.06] overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Leaderboard</h3>
            <p className="text-xs text-gray-400 mt-0.5">Ranked by leads closed</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-800">
                  {["#", "Sales Person", "Total Leads", "New", "Active", "Closed Won", "Inactive", "Close Rate"].map((h) => (
                    <th key={h} className="text-left px-5 py-3 text-[11px] font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sorted.map((member, index) => {
                  const s = statsMap[member.name];
                  const closeRate = s.total > 0 ? Math.round((s.converted / s.total) * 100) : 0;
                  return (
                    <tr key={member.id} className="border-b border-gray-50 dark:border-gray-800/50 hover:bg-gray-50/50 dark:hover:bg-gray-800/20 transition-colors">
                      <td className="px-5 py-3.5">
                        <span className={`text-sm font-bold ${
                          index === 0 ? "text-amber-500" : index === 1 ? "text-gray-400" : index === 2 ? "text-amber-700" : "text-gray-300"
                        }`}>#{index + 1}</span>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: member.color + "20" }}>
                            <span className="text-[10px] font-bold" style={{ color: member.color }}>{initials(member.name)}</span>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">{member.name}</p>
                            <p className="text-[11px] text-gray-400">{member.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-sm font-semibold text-gray-700 dark:text-gray-300">{s.total}</td>
                      <td className="px-5 py-3.5 text-sm text-indigo-600 dark:text-indigo-400">{s.new}</td>
                      <td className="px-5 py-3.5 text-sm text-amber-600 dark:text-amber-400">{s.contacted + s.proposal_sent}</td>
                      <td className="px-5 py-3.5 text-sm font-semibold text-emerald-600 dark:text-emerald-400">{s.converted}</td>
                      <td className="px-5 py-3.5 text-sm text-gray-400">{s.inactive}</td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                            <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${closeRate}%` }} />
                          </div>
                          <span className="text-xs text-gray-600 dark:text-gray-400">{closeRate}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

      </main>
    </div>
  );
}
