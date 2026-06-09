"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/layout/header";
import { KpiCard } from "@/components/ui/kpi-card";
import { LeadsOverTimeChart } from "@/components/charts/leads-over-time";
import { LeadsBySourceChart } from "@/components/charts/leads-by-source";
import { InquiryBreakdownChart } from "@/components/charts/inquiry-breakdown";
import { SalesPerformanceChart } from "@/components/charts/sales-performance-chart";
import { Inbox, Loader, CheckCircle, UserX, ArrowLeft, Eye } from "lucide-react";

interface Kpis {
  totalLeads: number; newLeads: number; inProgress: number; closedWon: number;
  lost: number; unassigned: number; thisMonth: number; lastMonth: number;
  monthChange: number; conversionRate: number;
}

interface ClientAnalytics {
  workspace: { id: string; name: string; slug: string | null };
  kpis: Kpis;
  perDay: { date: string; total: number; qualified: number }[];
  perSource: { source: string; total: number }[];
  perMember: { name: string; total: number; closed_won: number; in_progress: number }[];
}

export default function MasterClientPage() {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<ClientAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    fetch(`/api/master/client/${id}`, { cache: "no-store" })
      .then((r) => {
        if (r.status === 404) { setNotFound(true); return null; }
        return r.ok ? r.json() : null;
      })
      .then((d) => setData(d))
      .catch((e) => console.error(e))
      .finally(() => setLoading(false));
  }, [id]);

  const k = data?.kpis;
  const fmt = (n?: number) => (loading || n === undefined ? "—" : String(n));

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <Header title={data?.workspace?.name ? `Client · ${data.workspace.name}` : "Client"} />

      <main className="flex-1 overflow-y-auto px-7 pb-8 scrollbar-thin">
        {/* Back + read-only banner */}
        <div className="flex items-center justify-between mt-6 mb-4">
          <Link href="/master" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-violet-600">
            <ArrowLeft className="w-4 h-4" /> All clients
          </Link>
          <span className="inline-flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded-full bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-400">
            <Eye className="w-3 h-3" /> Read-only
          </span>
        </div>

        {notFound ? (
          <div className="py-20 text-center text-slate-400">Client not found.</div>
        ) : (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <KpiCard title="New Leads" value={fmt(k?.newLeads)} change={k?.monthChange} changeLabel={`${k?.thisMonth ?? 0} this month`} icon={Inbox} iconColor="text-indigo-500" iconBg="bg-indigo-50 dark:bg-indigo-500/10" />
              <KpiCard title="In Progress" value={fmt(k?.inProgress)} icon={Loader} iconColor="text-blue-500" iconBg="bg-blue-50 dark:bg-blue-500/10" />
              <KpiCard title="Clients" value={fmt(k?.closedWon)} change={k && k.totalLeads > 0 ? k.conversionRate : undefined} changeLabel="conversion rate" icon={CheckCircle} iconColor="text-emerald-500" iconBg="bg-emerald-50 dark:bg-emerald-500/10" />
              <KpiCard title="Unassigned" value={fmt(k?.unassigned)} icon={UserX} iconColor="text-amber-500" iconBg="bg-amber-50 dark:bg-amber-500/10" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
              <div className="lg:col-span-2">
                <LeadsOverTimeChart data={data?.perDay ?? []} />
              </div>
              <InquiryBreakdownChart kpis={k ?? { totalLeads: 0, newLeads: 0, inProgress: 0, closedWon: 0, lost: 0 }} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <LeadsBySourceChart data={data?.perSource ?? []} />
              <SalesPerformanceChart data={data?.perMember ?? []} />
            </div>
          </>
        )}
      </main>
    </div>
  );
}
