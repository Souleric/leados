"use client";

import { DemoHeader } from "@/components/demo/header";
import { KpiCard } from "@/components/ui/kpi-card";
import { LeadsOverTimeChart } from "@/components/charts/leads-over-time";
import { LeadsBySourceChart } from "@/components/charts/leads-by-source";
import { SalesPerformanceChart } from "@/components/charts/sales-performance-chart";
import { InquiryBreakdownChart } from "@/components/charts/inquiry-breakdown";
import { Inbox, Loader, CheckCircle, UserX } from "lucide-react";
import {
  DEMO_KPIS,
  DEMO_PER_DAY,
  DEMO_PER_SOURCE,
  DEMO_PER_MEMBER,
} from "./data";

export default function DemoDashboardPage() {
  const k = DEMO_KPIS;

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <DemoHeader title="Dashboard" />
      <main className="flex-1 overflow-y-auto px-7 pb-8 scrollbar-thin">

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6 mt-6">
          <KpiCard
            title="New Leads"
            value={String(k.newLeads)}
            change={k.monthChange}
            changeLabel={`${k.thisMonth} this month`}
            icon={Inbox}
            iconColor="text-indigo-500"
            iconBg="bg-indigo-50 dark:bg-indigo-500/10"
          />
          <KpiCard
            title="In Progress"
            value={String(k.inProgress)}
            icon={Loader}
            iconColor="text-blue-500"
            iconBg="bg-blue-50 dark:bg-blue-500/10"
          />
          <KpiCard
            title="Closed Won"
            value={String(k.closedWon)}
            change={k.conversionRate}
            changeLabel="conversion rate"
            icon={CheckCircle}
            iconColor="text-emerald-500"
            iconBg="bg-emerald-50 dark:bg-emerald-500/10"
          />
          <KpiCard
            title="Unassigned"
            value={String(k.unassigned)}
            icon={UserX}
            iconColor="text-amber-500"
            iconBg="bg-amber-50 dark:bg-amber-500/10"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
          <div className="lg:col-span-2">
            <LeadsOverTimeChart data={DEMO_PER_DAY} />
          </div>
          <InquiryBreakdownChart kpis={k} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <LeadsBySourceChart data={DEMO_PER_SOURCE} />
          <SalesPerformanceChart data={DEMO_PER_MEMBER} />
        </div>

      </main>
    </div>
  );
}
