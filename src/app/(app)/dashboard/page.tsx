import { Header } from "@/components/layout/header";
import { KpiCard } from "@/components/ui/kpi-card";
import { LeadsOverTimeChart } from "@/components/charts/leads-over-time";
import { LeadsBySourceChart } from "@/components/charts/leads-by-source";
import { InquiryBreakdownChart } from "@/components/charts/inquiry-breakdown";
import { leads } from "@/lib/mock-data";
import {
  Users, UserCheck, TrendingUp, DollarSign, MousePointerClick,
} from "lucide-react";

export default function DashboardPage() {
  const totalLeads = leads.length;
  const qualified  = leads.filter((l) => ["contacted","quotation_sent","closed_won"].includes(l.status)).length;
  const closedWon  = leads.filter((l) => l.status === "closed_won").length;
  const convRate   = Math.round((closedWon / totalLeads) * 100);

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <Header title="Dashboard" />

      <main className="flex-1 overflow-y-auto px-7 pb-8 scrollbar-thin">

        {/* ── Hero Banner ─────────────────────────────────────────── */}
        <div className="hero-gradient hero-mesh relative rounded-3xl p-7 mb-6 overflow-hidden">
          {/* Subtle 3-D wave blob — pure CSS */}
          <div className="absolute right-0 top-0 w-[55%] h-full pointer-events-none select-none overflow-hidden rounded-3xl">
            <svg viewBox="0 0 500 260" className="w-full h-full opacity-20" preserveAspectRatio="xMidYMid slice">
              <defs>
                <radialGradient id="g1" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="white" stopOpacity="0.6" />
                  <stop offset="100%" stopColor="white" stopOpacity="0" />
                </radialGradient>
              </defs>
              {/* mesh lines */}
              {Array.from({ length: 14 }).map((_, i) => (
                <line key={`h${i}`} x1="0" y1={i * 20} x2="500" y2={i * 20} stroke="white" strokeWidth="0.5" />
              ))}
              {Array.from({ length: 26 }).map((_, i) => (
                <line key={`v${i}`} x1={i * 20} y1="0" x2={i * 20} y2="260" stroke="white" strokeWidth="0.5" />
              ))}
              {/* blob circles */}
              <circle cx="320" cy="90" r="110" fill="url(#g1)" />
              <circle cx="420" cy="180" r="80" fill="url(#g1)" />
              <circle cx="220" cy="40" r="60" fill="url(#g1)" />
            </svg>
          </div>

          <div className="relative z-10">
            <p className="text-white/70 text-xs font-semibold uppercase tracking-widest mb-1">
              Revenue Distribution
            </p>
            <h2 className="text-white text-2xl font-bold tracking-tight mb-0.5">
              RM 212,400.00
            </h2>
            <p className="text-white/60 text-xs mb-6">Total Platform Sales Generated</p>

            {/* Breakdown chips */}
            <div className="flex flex-wrap gap-3">
              {[
                { label: "By Facebook",  value: "RM 87.4k", pct: "41%" },
                { label: "By Instagram", value: "RM 52.1k", pct: "25%" },
                { label: "By Referral",  value: "RM 44.3k", pct: "21%" },
                { label: "By Other",     value: "RM 28.6k", pct: "13%" },
              ].map((item) => (
                <div
                  key={item.label}
                  className="bg-white/15 backdrop-blur-sm border border-white/20 rounded-2xl px-4 py-3 min-w-[110px]"
                >
                  <p className="text-white text-base font-bold leading-none">{item.value}</p>
                  <p className="text-white/60 text-[11px] mt-1">{item.label}</p>
                  <p className="text-white/80 text-[11px] font-semibold">{item.pct}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── KPI Cards ───────────────────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          <KpiCard
            title="Total Leads"
            value={String(totalLeads)}
            change={18}
            icon={Users}
            iconColor="text-indigo-500"
            iconBg="bg-indigo-50 dark:bg-indigo-500/10"
          />
          <KpiCard
            title="Qualified"
            value={String(qualified)}
            change={12}
            icon={UserCheck}
            iconColor="text-blue-500"
            iconBg="bg-blue-50 dark:bg-blue-500/10"
          />
          <KpiCard
            title="Conv. Rate"
            value={`${convRate}%`}
            change={5}
            icon={TrendingUp}
            iconColor="text-emerald-500"
            iconBg="bg-emerald-50 dark:bg-emerald-500/10"
          />
          <KpiCard
            title="Revenue"
            value="RM 212k"
            change={22}
            icon={DollarSign}
            iconColor="text-amber-500"
            iconBg="bg-amber-50 dark:bg-amber-500/10"
          />
          <KpiCard
            title="Cost / Lead"
            value="RM 47"
            change={-8}
            icon={MousePointerClick}
            iconColor="text-rose-500"
            iconBg="bg-rose-50 dark:bg-rose-500/10"
          />
        </div>

        {/* ── Chart Row 1 ─────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
          <div className="lg:col-span-2">
            <LeadsOverTimeChart />
          </div>
          <InquiryBreakdownChart />
        </div>

        {/* ── Chart Row 2 ─────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <LeadsBySourceChart />

          {/* Recent Activity */}
          <div className="bg-white dark:bg-white/[0.04] rounded-2xl border border-slate-100/80 dark:border-white/[0.06] p-5">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-sm font-bold text-slate-800 dark:text-white">Recent Activity</h3>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Latest lead interactions</p>
              </div>
              <button className="text-xs font-medium text-indigo-500 hover:text-indigo-600 transition-colors">
                View all
              </button>
            </div>
            <div className="space-y-3">
              {leads.slice(0, 5).map((lead) => (
                <div key={lead.id} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center shrink-0">
                    <span className="text-[10px] font-bold text-indigo-500 dark:text-indigo-400">
                      {lead.name.split(" ").map((n) => n[0]).slice(0, 2).join("")}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-slate-700 dark:text-slate-200 truncate">{lead.name}</p>
                    <p className="text-[11px] text-slate-400 dark:text-slate-500">{lead.inquiryType} · {lead.source}</p>
                  </div>
                  <span className={`text-[10px] px-2 py-1 rounded-lg font-semibold shrink-0 ${
                    lead.status === "closed_won"
                      ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400"
                      : lead.status === "new"
                      ? "bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400"
                      : lead.status === "lost"
                      ? "bg-slate-100 text-slate-500 dark:bg-white/5 dark:text-slate-400"
                      : "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400"
                  }`}>
                    {lead.status.replace("_", " ")}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
