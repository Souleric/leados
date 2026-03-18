import { Header } from "@/components/layout/header";
import { teamMembers } from "@/lib/mock-data";
import { Users, TrendingUp, Clock, DollarSign, Plus } from "lucide-react";

const statusConfig: Record<string, { label: string; dot: string }> = {
  online: { label: "Online", dot: "bg-emerald-500" },
  offline: { label: "Offline", dot: "bg-gray-400" },
  busy: { label: "Busy", dot: "bg-amber-500" },
};

export default function TeamPage() {
  const totalLeads = teamMembers.reduce((s, m) => s + m.leadsHandled, 0);
  const avgCloseRate = (teamMembers.reduce((s, m) => s + m.closeRate, 0) / teamMembers.length).toFixed(1);
  const totalRevenue = teamMembers.reduce((s, m) => s + m.revenue, 0);

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <Header title="Team" />
      <main className="flex-1 overflow-y-auto p-6 scrollbar-thin">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Team Performance</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{teamMembers.length} agents · This month</p>
          </div>
          <button className="flex items-center gap-2 px-3 py-2 bg-violet-600 text-white text-sm font-medium rounded-lg hover:bg-violet-700 transition-colors">
            <Plus className="w-4 h-4" />
            Add Agent
          </button>
        </div>

        {/* Team KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[
            { label: "Total Agents", value: String(teamMembers.length), icon: Users, color: "text-violet-600", bg: "bg-violet-50 dark:bg-violet-950/40" },
            { label: "Leads Handled", value: String(totalLeads), icon: TrendingUp, color: "text-blue-600", bg: "bg-blue-50 dark:bg-blue-950/40" },
            { label: "Avg Close Rate", value: `${avgCloseRate}%`, icon: Clock, color: "text-emerald-600", bg: "bg-emerald-50 dark:bg-emerald-950/40" },
            { label: "Total Revenue", value: `RM ${totalRevenue.toLocaleString()}`, icon: DollarSign, color: "text-amber-600", bg: "bg-amber-50 dark:bg-amber-950/40" },
          ].map((kpi) => (
            <div key={kpi.label} className="bg-white dark:bg-white/[0.04] rounded-2xl border border-slate-100/80 dark:border-white/[0.06] p-5">
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

        {/* Agent cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
          {teamMembers.map((member) => {
            const status = statusConfig[member.status];
            return (
              <div key={member.id} className="bg-white dark:bg-white/[0.04] rounded-2xl border border-slate-100/80 dark:border-white/[0.06] p-5 hover:shadow-sm transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                        <span className="text-sm font-bold text-white">{member.avatar}</span>
                      </div>
                      <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white dark:border-gray-900 ${status.dot}`} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white leading-tight">{member.name}</p>
                      <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5">{member.role}</p>
                    </div>
                  </div>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                    member.status === "online" ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400" :
                    member.status === "busy" ? "bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400" :
                    "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400"
                  }`}>
                    {status.label}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-2.5">
                    <p className="text-[10px] text-gray-400 dark:text-gray-500 uppercase tracking-wide">Leads</p>
                    <p className="text-base font-bold text-gray-900 dark:text-white mt-0.5">{member.leadsHandled}</p>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-2.5">
                    <p className="text-[10px] text-gray-400 dark:text-gray-500 uppercase tracking-wide">Close Rate</p>
                    <p className="text-base font-bold text-gray-900 dark:text-white mt-0.5">{member.closeRate}%</p>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-2.5">
                    <p className="text-[10px] text-gray-400 dark:text-gray-500 uppercase tracking-wide">Avg Response</p>
                    <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mt-0.5">{member.avgResponseTime}</p>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-2.5">
                    <p className="text-[10px] text-gray-400 dark:text-gray-500 uppercase tracking-wide">Revenue</p>
                    <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 mt-0.5">RM {(member.revenue / 1000).toFixed(1)}k</p>
                  </div>
                </div>

                {/* Close rate bar */}
                <div className="mt-4">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] text-gray-400 dark:text-gray-500">Close Rate</span>
                    <span className="text-[10px] font-medium text-gray-600 dark:text-gray-400">{member.closeRate}%</span>
                  </div>
                  <div className="h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-violet-500 rounded-full transition-all"
                      style={{ width: `${member.closeRate}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Leaderboard table */}
        <div className="bg-white dark:bg-white/[0.04] rounded-2xl border border-slate-100/80 dark:border-white/[0.06] overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Agent Leaderboard</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-800">
                  {["Rank", "Agent", "Leads Handled", "Avg Response", "Close Rate", "Revenue (RM)"].map((h) => (
                    <th key={h} className="text-left px-5 py-3 text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[...teamMembers]
                  .sort((a, b) => b.revenue - a.revenue)
                  .map((member, index) => (
                    <tr key={member.id} className="border-b border-gray-50 dark:border-gray-800/50 hover:bg-gray-50/50 dark:hover:bg-gray-800/20 transition-colors">
                      <td className="px-5 py-3.5">
                        <span
                          className={`text-sm font-bold ${
                            index === 0 ? "text-amber-500" :
                            index === 1 ? "text-gray-400" :
                            index === 2 ? "text-amber-700 dark:text-amber-600" :
                            "text-gray-400 dark:text-gray-600"
                          }`}
                        >
                          #{index + 1}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shrink-0">
                            <span className="text-[10px] font-bold text-white">{member.avatar}</span>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">{member.name}</p>
                            <p className="text-[11px] text-gray-400 dark:text-gray-500">{member.role}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-sm text-gray-700 dark:text-gray-300">{member.leadsHandled}</td>
                      <td className="px-5 py-3.5 text-sm text-gray-700 dark:text-gray-300">{member.avgResponseTime}</td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                            <div className="h-full bg-violet-500 rounded-full" style={{ width: `${member.closeRate}%` }} />
                          </div>
                          <span className="text-xs text-gray-600 dark:text-gray-400">{member.closeRate}%</span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                          RM {member.revenue.toLocaleString()}
                        </span>
                      </td>
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
