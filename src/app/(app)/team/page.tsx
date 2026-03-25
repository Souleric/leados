"use client";

import { Header } from "@/components/layout/header";
import { useState, useEffect, useCallback } from "react";
import { Users, TrendingUp, UserCheck, Plus, Loader2, UserX } from "lucide-react";
import Link from "next/link";

const COLORS = [
  "#7c3aed", "#2563eb", "#059669", "#d97706",
  "#dc2626", "#0891b2", "#65a30d", "#db2777",
];

const ROLE_LABELS: Record<string, string> = {
  admin: "Admin",
  agent: "Sales Person",
  viewer: "Viewer",
};

interface Member {
  id: string;
  name: string;
  email: string | null;
  role: string;
  status: string;
}

interface MemberStats {
  total: number;
  new: number;
  contacted: number;
  quotation_sent: number;
  closed_won: number;
  lost: number;
}

function initials(name: string) {
  return name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();
}

function StatPill({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <div className={`w-1.5 h-1.5 rounded-full ${color}`} />
      <span className="text-[11px] text-gray-500 dark:text-gray-400">{label}</span>
      <span className="text-[11px] font-semibold text-gray-700 dark:text-gray-200">{value}</span>
    </div>
  );
}

export default function TeamPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [stats, setStats] = useState<Record<string, MemberStats>>({});
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [teamRes, leadsRes] = await Promise.all([
        fetch("/api/team").then((r) => r.json()),
        fetch("/api/leads?limit=500").then((r) => r.json()),
      ]);

      const memberList: Member[] = teamRes.members ?? [];
      setMembers(memberList);

      // Calculate per-member stats from leads
      const statsMap: Record<string, MemberStats> = {};
      for (const m of memberList) {
        statsMap[m.name] = { total: 0, new: 0, contacted: 0, quotation_sent: 0, closed_won: 0, lost: 0 };
      }
      statsMap["__unassigned__"] = { total: 0, new: 0, contacted: 0, quotation_sent: 0, closed_won: 0, lost: 0 };

      for (const lead of leadsRes.leads ?? []) {
        const key = lead.assigned_to && statsMap[lead.assigned_to] ? lead.assigned_to : "__unassigned__";
        const s = statsMap[key];
        s.total++;
        if (lead.status in s) (s as any)[lead.status]++;
      }
      setStats(statsMap);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const totalLeads   = Object.values(stats).reduce((s, m) => s + m.total, 0);
  const totalWon     = Object.values(stats).reduce((s, m) => s + m.closed_won, 0);
  const totalActive  = Object.values(stats).reduce((s, m) => s + m.contacted + m.quotation_sent, 0);

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <Header title="Team" />
      <main className="flex-1 overflow-y-auto p-6 scrollbar-thin">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Team</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              {loading ? "Loading..." : `${members.length} member${members.length !== 1 ? "s" : ""}`}
            </p>
          </div>
          <Link
            href="/settings?tab=team"
            className="flex items-center gap-2 px-3 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Member
          </Link>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[
            { label: "Total Members", value: members.length, icon: Users,      color: "text-indigo-600",  bg: "bg-indigo-50 dark:bg-indigo-950/40" },
            { label: "Total Leads",   value: totalLeads,     icon: TrendingUp,  color: "text-blue-600",    bg: "bg-blue-50 dark:bg-blue-950/40" },
            { label: "Active",        value: totalActive,    icon: UserCheck,   color: "text-amber-600",   bg: "bg-amber-50 dark:bg-amber-950/40" },
            { label: "Closed Won",    value: totalWon,       icon: UserCheck,   color: "text-emerald-600", bg: "bg-emerald-50 dark:bg-emerald-950/40" },
          ].map((kpi) => (
            <div key={kpi.label} className="bg-white dark:bg-white/[0.04] rounded-lg shadow-card dark:border dark:border-white/[0.06] p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wide">{kpi.label}</p>
                  <p className="text-xl font-bold text-gray-900 dark:text-white mt-1.5">
                    {loading ? <span className="inline-block h-5 w-10 bg-slate-100 dark:bg-white/[0.05] rounded animate-pulse" /> : kpi.value}
                  </p>
                </div>
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${kpi.bg}`}>
                  <kpi.icon className={`w-4 h-4 ${kpi.color}`} />
                </div>
              </div>
            </div>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 text-indigo-400 animate-spin" />
          </div>
        ) : members.length === 0 ? (
          <div className="bg-white dark:bg-white/[0.04] rounded-lg shadow-card dark:border dark:border-white/[0.06] p-12 flex flex-col items-center gap-4">
            <div className="w-14 h-14 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center">
              <Users className="w-7 h-7 text-indigo-400" />
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">No team members yet</p>
              <p className="text-xs text-slate-400 mt-1">Add your sales persons in Settings → Team</p>
            </div>
            <Link href="/settings?tab=team" className="text-xs font-medium text-indigo-500 hover:text-indigo-600">
              Go to Settings →
            </Link>
          </div>
        ) : (
          <>
            {/* Member cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mb-6">
              {members.map((member, i) => {
                const color = COLORS[i % COLORS.length];
                const s = stats[member.name] ?? { total: 0, new: 0, contacted: 0, quotation_sent: 0, closed_won: 0, lost: 0 };
                const closeRate = s.total > 0 ? Math.round((s.closed_won / s.total) * 100) : 0;

                return (
                  <div key={member.id} className="bg-white dark:bg-white/[0.04] rounded-lg shadow-card dark:border dark:border-white/[0.06] p-5">
                    {/* Top row */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: color + "20" }}>
                          <span className="text-sm font-bold" style={{ color }}>{initials(member.name)}</span>
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-900 dark:text-white leading-tight">{member.name}</p>
                          <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5">{member.email ?? ROLE_LABELS[member.role]}</p>
                        </div>
                      </div>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                        member.role === "admin"
                          ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300"
                          : "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400"
                      }`}>
                        {ROLE_LABELS[member.role]}
                      </span>
                    </div>

                    {/* Stats grid */}
                    <div className="grid grid-cols-3 gap-2 mb-4">
                      {[
                        { label: "Total",    value: s.total,        bg: "bg-slate-50 dark:bg-white/[0.03]" },
                        { label: "Won",      value: s.closed_won,   bg: "bg-emerald-50 dark:bg-emerald-950/20" },
                        { label: "Active",   value: s.contacted + s.quotation_sent, bg: "bg-amber-50 dark:bg-amber-950/20" },
                      ].map(({ label, value, bg }) => (
                        <div key={label} className={`${bg} rounded-xl p-2.5 text-center`}>
                          <p className="text-[10px] text-gray-400 dark:text-gray-500 uppercase tracking-wide">{label}</p>
                          <p className="text-base font-bold text-gray-900 dark:text-white mt-0.5">{value}</p>
                        </div>
                      ))}
                    </div>

                    {/* Status breakdown */}
                    <div className="flex flex-wrap gap-x-3 gap-y-1.5 mb-4">
                      <StatPill label="New"       value={s.new}             color="bg-indigo-400" />
                      <StatPill label="Contacted" value={s.contacted}       color="bg-amber-400" />
                      <StatPill label="Quoted"    value={s.quotation_sent}  color="bg-violet-400" />
                      <StatPill label="Lost"      value={s.lost}            color="bg-gray-400" />
                    </div>

                    {/* Close rate bar */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] text-gray-400">Close Rate</span>
                        <span className="text-[10px] font-semibold text-gray-600 dark:text-gray-400">{closeRate}%</span>
                      </div>
                      <div className="h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                        <div className="h-full bg-indigo-500 rounded-full transition-all" style={{ width: `${closeRate}%` }} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Leaderboard table */}
            <div className="bg-white dark:bg-white/[0.04] rounded-lg shadow-card dark:border dark:border-white/[0.06] overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Leaderboard</h3>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">Ranked by leads closed</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-100 dark:border-gray-800">
                      {["#", "Sales Person", "Role", "Total Leads", "New", "Active", "Closed Won", "Lost", "Close Rate"].map((h) => (
                        <th key={h} className="text-left px-5 py-3 text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider whitespace-nowrap">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[...members]
                      .sort((a, b) => (stats[b.name]?.closed_won ?? 0) - (stats[a.name]?.closed_won ?? 0))
                      .map((member, index) => {
                        const color = COLORS[members.indexOf(member) % COLORS.length];
                        const s = stats[member.name] ?? { total: 0, new: 0, contacted: 0, quotation_sent: 0, closed_won: 0, lost: 0 };
                        const closeRate = s.total > 0 ? Math.round((s.closed_won / s.total) * 100) : 0;
                        return (
                          <tr key={member.id} className="border-b border-gray-50 dark:border-gray-800/50 hover:bg-gray-50/50 dark:hover:bg-gray-800/20 transition-colors">
                            <td className="px-5 py-3.5">
                              <span className={`text-sm font-bold ${
                                index === 0 ? "text-amber-500" : index === 1 ? "text-gray-400" : index === 2 ? "text-amber-700" : "text-gray-300 dark:text-gray-600"
                              }`}>#{index + 1}</span>
                            </td>
                            <td className="px-5 py-3.5">
                              <div className="flex items-center gap-2.5">
                                <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: color + "20" }}>
                                  <span className="text-[10px] font-bold" style={{ color }}>{initials(member.name)}</span>
                                </div>
                                <div>
                                  <p className="text-sm font-medium text-gray-900 dark:text-white">{member.name}</p>
                                  {member.email && <p className="text-[11px] text-gray-400">{member.email}</p>}
                                </div>
                              </div>
                            </td>
                            <td className="px-5 py-3.5">
                              <span className="text-xs text-gray-500 dark:text-gray-400">{ROLE_LABELS[member.role]}</span>
                            </td>
                            <td className="px-5 py-3.5 text-sm font-semibold text-gray-700 dark:text-gray-300">{s.total}</td>
                            <td className="px-5 py-3.5 text-sm text-indigo-600 dark:text-indigo-400">{s.new}</td>
                            <td className="px-5 py-3.5 text-sm text-amber-600 dark:text-amber-400">{s.contacted + s.quotation_sent}</td>
                            <td className="px-5 py-3.5 text-sm font-semibold text-emerald-600 dark:text-emerald-400">{s.closed_won}</td>
                            <td className="px-5 py-3.5 text-sm text-gray-400">{s.lost}</td>
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

              {/* Unassigned row */}
              {(stats["__unassigned__"]?.total ?? 0) > 0 && (
                <div className="px-5 py-3 border-t border-gray-50 dark:border-gray-800/50 flex items-center gap-3">
                  <UserX className="w-4 h-4 text-gray-300 dark:text-gray-600 shrink-0" />
                  <span className="text-xs text-gray-400 dark:text-gray-500 flex-1">Unassigned leads</span>
                  <span className="text-sm font-semibold text-gray-500 dark:text-gray-400">{stats["__unassigned__"].total}</span>
                </div>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
