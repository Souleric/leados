"use client";

import { Header } from "@/components/layout/header";
import { KpiCard } from "@/components/ui/kpi-card";
import { LeadsOverTimeChart } from "@/components/charts/leads-over-time";
import { LeadsBySourceChart } from "@/components/charts/leads-by-source";
import { InquiryBreakdownChart } from "@/components/charts/inquiry-breakdown";
import { SalesPerformanceChart } from "@/components/charts/sales-performance-chart";
import { useState, useEffect } from "react";
import {
  Inbox, Loader, CheckCircle, UserX,
} from "lucide-react";

interface Kpis {
  totalLeads: number;
  newLeads: number;
  inProgress: number;
  closedWon: number;
  lost: number;
  unassigned: number;
  thisMonth: number;
  lastMonth: number;
  monthChange: number;
  conversionRate: number;
}

interface MemberStat {
  name: string;
  total: number;
  closed_won: number;
  in_progress: number;
}

export default function DashboardPage() {
  const [kpis, setKpis] = useState<Kpis>({
    totalLeads: 0, newLeads: 0, inProgress: 0, closedWon: 0, lost: 0,
    unassigned: 0, thisMonth: 0, lastMonth: 0, monthChange: 0, conversionRate: 0,
  });
  const [perDay, setPerDay] = useState<{ date: string; total: number; qualified: number }[]>([]);
  const [perSource, setPerSource] = useState<{ source: string; total: number }[]>([]);
  const [perMember, setPerMember] = useState<MemberStat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res: Response = await fetch("/api/analytics");
        const data = await res.json();
        if (data?.kpis) {
          setKpis(data.kpis);
          setPerDay(data.perDay ?? []);
          setPerSource(data.perSource ?? []);
          setPerMember(data.perMember ?? []);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const fmt = (n: number) => loading ? "—" : String(n);

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <Header title="Dashboard" />

      <main className="flex-1 overflow-y-auto px-7 pb-8 scrollbar-thin">

        {/* ── KPI Cards ───────────────────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6 mt-6">
          <KpiCard
            title="New Leads"
            value={fmt(kpis.newLeads)}
            change={kpis.monthChange}
            changeLabel={`${kpis.thisMonth} this month`}
            icon={Inbox}
            iconColor="text-indigo-500"
            iconBg="bg-indigo-50 dark:bg-indigo-500/10"
          />
          <KpiCard
            title="In Progress"
            value={fmt(kpis.inProgress)}
            icon={Loader}
            iconColor="text-blue-500"
            iconBg="bg-blue-50 dark:bg-blue-500/10"
          />
          <KpiCard
            title="Closed Won"
            value={fmt(kpis.closedWon)}
            change={kpis.totalLeads > 0 ? kpis.conversionRate : undefined}
            changeLabel="conversion rate"
            icon={CheckCircle}
            iconColor="text-emerald-500"
            iconBg="bg-emerald-50 dark:bg-emerald-500/10"
          />
          <KpiCard
            title="Unassigned"
            value={fmt(kpis.unassigned)}
            icon={UserX}
            iconColor="text-amber-500"
            iconBg="bg-amber-50 dark:bg-amber-500/10"
          />
        </div>

        {/* ── Chart Row 1 ─────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
          <div className="lg:col-span-2">
            <LeadsOverTimeChart data={perDay} />
          </div>
          <InquiryBreakdownChart kpis={kpis} />
        </div>

        {/* ── Chart Row 2 ─────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <LeadsBySourceChart data={perSource} />
          <SalesPerformanceChart data={perMember} />
        </div>

      </main>
    </div>
  );
}
