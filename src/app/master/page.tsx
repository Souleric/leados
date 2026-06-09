"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Header } from "@/components/layout/header";
import { KpiCard } from "@/components/ui/kpi-card";
import { LeadsOverTimeChart } from "@/components/charts/leads-over-time";
import { Building2, Users, CheckCircle, DollarSign, ChevronRight } from "lucide-react";

interface ClientRow {
  id: string;
  name: string;
  slug: string | null;
  totalLeads: number;
  activeLeads: number;
  inProgress: number;
  clients: number;
  conversionRate: number;
  spend: number;
  lastActivity: string | null;
}

interface Overview {
  kpis: { totalLeads: number; closedWon: number; inProgress: number; unassigned: number; conversionRate: number };
  perDay: { date: string; total: number; qualified: number }[];
  workspaceCount: number;
  totalSpend: number;
  clients: ClientRow[];
}

export default function MasterDashboardPage() {
  const [data, setData] = useState<Overview | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/master/overview", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setData(d))
      .catch((e) => console.error(e))
      .finally(() => setLoading(false));
  }, []);

  const fmt = (n?: number) => (loading || n === undefined ? "—" : String(n));
  const money = (n: number) => "RM " + n.toLocaleString("en-MY", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  const ago = (iso: string | null) => {
    if (!iso) return "—";
    const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
    if (days <= 0) return "Today";
    if (days === 1) return "Yesterday";
    if (days < 30) return `${days}d ago`;
    return new Date(iso).toLocaleDateString("en-MY", { month: "short", day: "numeric" });
  };

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <Header title="Master Overview" />

      <main className="flex-1 overflow-y-auto px-7 pb-8 scrollbar-thin">
        {/* KPI cards — combined across all clients */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6 mt-6">
          <KpiCard
            title="Active Clients"
            value={fmt(data?.workspaceCount)}
            icon={Building2}
            iconColor="text-violet-500"
            iconBg="bg-violet-50 dark:bg-violet-500/10"
          />
          <KpiCard
            title="Total Leads"
            value={fmt(data?.kpis.totalLeads)}
            icon={Users}
            iconColor="text-indigo-500"
            iconBg="bg-indigo-50 dark:bg-indigo-500/10"
          />
          <KpiCard
            title="Conversions"
            value={fmt(data?.kpis.closedWon)}
            change={data?.kpis.conversionRate}
            changeLabel="overall conversion rate"
            icon={CheckCircle}
            iconColor="text-emerald-500"
            iconBg="bg-emerald-50 dark:bg-emerald-500/10"
          />
          <KpiCard
            title="Total Ad Spend"
            value={loading ? "—" : money(data?.totalSpend ?? 0)}
            icon={DollarSign}
            iconColor="text-amber-500"
            iconBg="bg-amber-50 dark:bg-amber-500/10"
          />
        </div>

        {/* Cross-client trend */}
        <div className="mb-6">
          <LeadsOverTimeChart data={data?.perDay ?? []} />
        </div>

        {/* Per-client breakdown */}
        <div className="bg-white dark:bg-white/[0.04] rounded-lg shadow-card dark:border dark:border-white/[0.06] overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 dark:border-white/[0.06]">
            <h2 className="text-sm font-semibold text-slate-800 dark:text-white">Clients</h2>
            <p className="text-xs text-slate-400 mt-0.5">Each client&apos;s progress — click a row to drill in</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[11px] uppercase tracking-wide text-slate-400 border-b border-slate-100 dark:border-white/[0.06]">
                  <th className="text-left font-medium px-5 py-2.5">Client</th>
                  <th className="text-right font-medium px-3 py-2.5">Leads</th>
                  <th className="text-right font-medium px-3 py-2.5">Active</th>
                  <th className="text-right font-medium px-3 py-2.5">In Progress</th>
                  <th className="text-right font-medium px-3 py-2.5">Clients</th>
                  <th className="text-left font-medium px-3 py-2.5 w-40">Conversion</th>
                  <th className="text-right font-medium px-3 py-2.5">Spend</th>
                  <th className="text-right font-medium px-3 py-2.5">Last activity</th>
                  <th className="px-3 py-2.5"></th>
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr><td colSpan={9} className="px-5 py-8 text-center text-slate-400">Loading…</td></tr>
                )}
                {!loading && (data?.clients.length ?? 0) === 0 && (
                  <tr><td colSpan={9} className="px-5 py-8 text-center text-slate-400">No clients yet.</td></tr>
                )}
                {data?.clients.map((c) => (
                  <tr key={c.id} className="border-b border-slate-50 dark:border-white/[0.04] hover:bg-slate-50 dark:hover:bg-white/[0.03] transition-colors">
                    <td className="px-5 py-3">
                      <Link href={`/master/clients/${c.id}`} className="font-medium text-slate-800 dark:text-white hover:text-violet-600">
                        {c.name}
                      </Link>
                    </td>
                    <td className="text-right px-3 py-3 text-slate-700 dark:text-slate-200">{c.totalLeads}</td>
                    <td className="text-right px-3 py-3 text-slate-500">{c.activeLeads}</td>
                    <td className="text-right px-3 py-3 text-slate-500">{c.inProgress}</td>
                    <td className="text-right px-3 py-3 text-emerald-600 dark:text-emerald-400 font-medium">{c.clients}</td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 rounded-full bg-slate-100 dark:bg-white/[0.08] overflow-hidden">
                          <div className="h-full bg-violet-500 rounded-full" style={{ width: `${Math.min(c.conversionRate, 100)}%` }} />
                        </div>
                        <span className="text-[11px] text-slate-500 w-8 text-right">{c.conversionRate}%</span>
                      </div>
                    </td>
                    <td className="text-right px-3 py-3 text-slate-500">{money(c.spend)}</td>
                    <td className="text-right px-3 py-3 text-slate-400 text-xs">{ago(c.lastActivity)}</td>
                    <td className="px-3 py-3 text-right">
                      <Link href={`/master/clients/${c.id}`} className="inline-flex text-slate-300 hover:text-violet-600">
                        <ChevronRight className="w-4 h-4" />
                      </Link>
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
