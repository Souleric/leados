"use client";

import { Header } from "@/components/layout/header";
import { CampaignChart } from "@/components/charts/campaign-chart";
import { useState, useEffect, useCallback } from "react";
import { TrendingUp, DollarSign, Users, Target, RefreshCw, Loader2, BarChart2, ExternalLink, Download } from "lucide-react";

const platformColors: Record<string, string> = {
  Facebook:  "bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300",
  Instagram: "bg-pink-100 text-pink-700 dark:bg-pink-950/50 dark:text-pink-300",
  TikTok:    "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
  Google:    "bg-green-100 text-green-700 dark:bg-green-950/50 dark:text-green-300",
  Other:     "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
};

const statusColors: Record<string, string> = {
  active: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400",
  paused: "bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400",
  ended:  "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400",
};

interface Campaign {
  id: string;
  name: string;
  platform: string;
  status: string;
  spend: number;
  impressions: number;
  clicks: number;
  leads_count: number;
  cpl: number | null;
  cpm: number | null;
  cpc: number | null;
  start_date: string | null;
  end_date: string | null;
  last_synced_at: string | null;
  meta_campaign_id: string | null;
}


function fmt(n: number | null | undefined, prefix = "", decimals = 2) {
  if (n == null) return "—";
  return `${prefix}${n.toLocaleString("en-MY", { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}`;
}

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [exportingId, setExportingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/campaigns");
      const data = await res.json();
      setCampaigns(data.campaigns ?? []);
    } catch (e) {
      setCampaigns([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleSync = async () => {
    setSyncing(true);
    setSyncMsg(null);
    try {
      const res = await fetch("/api/campaigns/sync", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Sync failed");
      setSyncMsg({ type: "ok", text: data.message ?? `Synced ${data.synced} campaigns` });
      await load();
    } catch (e: any) {
      setSyncMsg({ type: "err", text: e.message ?? "Sync failed" });
    } finally {
      setSyncing(false);
    }
  };

  const handleExport = async (campaignId?: string) => {
    const key = campaignId ?? "all";
    setExportingId(key);
    try {
      const url = "/api/campaigns/leads-export" + (campaignId ? `?campaign_id=${campaignId}` : "");
      const res = await fetch(url);
      if (!res.ok) {
        const err = await res.json();
        setSyncMsg({ type: "err", text: err.error ?? "Export failed" });
        return;
      }
      const blob = await res.blob();
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = res.headers.get("Content-Disposition")?.match(/filename="(.+)"/)?.[1] ?? "leads.csv";
      a.click();
      URL.revokeObjectURL(a.href);
    } catch {
      setSyncMsg({ type: "err", text: "Export failed" });
    } finally {
      setExportingId(null);
    }
  };

  const totalSpend   = campaigns.reduce((s, c) => s + (c.spend ?? 0), 0);
  const totalLeads   = campaigns.reduce((s, c) => s + (c.leads_count ?? 0), 0);
  const totalClicks  = campaigns.reduce((s, c) => s + (c.clicks ?? 0), 0);
  const avgCPL       = totalLeads > 0 ? totalSpend / totalLeads : null;

  const lastSynced   = campaigns
    .map((c) => c.last_synced_at)
    .filter(Boolean)
    .sort()
    .at(-1);

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <Header title="Campaigns" />
      <main className="flex-1 overflow-y-auto p-6 scrollbar-thin">

        {/* Header row */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Campaigns</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              {loading ? "Loading..." : `${campaigns.length} campaigns`}
              {lastSynced && (
                <span className="ml-2 text-[11px] text-gray-400">
                  · Last synced {new Date(lastSynced).toLocaleString("en-MY", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                </span>
              )}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {campaigns.length > 0 && (
              <button
                onClick={() => handleExport()}
                disabled={exportingId === "all"}
                className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-white/[0.04] border border-[#E2E6EF] dark:border-white/[0.08] hover:border-[#1E6FEB]/40 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-xl transition-colors disabled:opacity-60"
              >
                {exportingId === "all" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                Download All Leads
              </button>
            )}
            <button
              onClick={handleSync}
              disabled={syncing}
              className="flex items-center gap-2 px-4 py-2 bg-[#1E6FEB] hover:bg-[#1a63d4] disabled:opacity-60 text-white text-sm font-semibold rounded-xl transition-colors"
            >
              {syncing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              {syncing ? "Syncing..." : "Sync from Meta"}
            </button>
          </div>
        </div>

        {/* Sync message */}
        {syncMsg && (
          <div className={`mb-5 px-4 py-3 rounded-xl text-xs font-medium ${
            syncMsg.type === "ok"
              ? "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-300 border border-emerald-100 dark:border-emerald-900/30"
              : "bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-300 border border-red-100 dark:border-red-900/30"
          }`}>
            {syncMsg.text}
            {syncMsg.type === "err" && syncMsg.text.includes("Ad Account ID") && (
              <span className="ml-1">
                Go to <a href="/settings" className="underline">Settings → WhatsApp</a> to add it.
              </span>
            )}
          </div>
        )}

        {/* KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[
            { label: "Total Spend",     value: fmt(totalSpend, "RM ", 2),   icon: DollarSign, color: "text-amber-600",  bg: "bg-amber-50 dark:bg-amber-950/40" },
            { label: "Leads from Ads",  value: String(totalLeads),           icon: Users,      color: "text-violet-600", bg: "bg-violet-50 dark:bg-violet-950/40" },
            { label: "Total Clicks",    value: totalClicks.toLocaleString(), icon: Target,     color: "text-emerald-600",bg: "bg-emerald-50 dark:bg-emerald-950/40" },
            { label: "Avg Cost / Lead", value: fmt(avgCPL, "RM ", 2),        icon: TrendingUp, color: "text-blue-600",   bg: "bg-blue-50 dark:bg-blue-950/40" },
          ].map((kpi) => (
            <div key={kpi.label} className="bg-white dark:bg-white/[0.04] rounded-2xl border border-slate-100/80 dark:border-white/[0.06] p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wide">{kpi.label}</p>
                  <p className="text-xl font-bold text-gray-900 dark:text-white mt-1.5">
                    {loading ? <span className="inline-block h-5 w-16 bg-slate-100 dark:bg-white/[0.05] rounded animate-pulse" /> : kpi.value}
                  </p>
                </div>
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${kpi.bg}`}>
                  <kpi.icon className={`w-4 h-4 ${kpi.color}`} />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Chart */}
        {campaigns.length > 0 && (
          <div className="mb-6">
            <CampaignChart />
          </div>
        )}

        {/* Empty state */}
        {!loading && campaigns.length === 0 ? (
          <div className="bg-white dark:bg-white/[0.04] rounded-2xl border border-slate-100/80 dark:border-white/[0.06] p-12 flex flex-col items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center">
              <BarChart2 className="w-7 h-7 text-indigo-400" />
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">No campaigns yet</p>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 max-w-xs">
                Click <strong>Sync from Meta</strong> to pull your Facebook/Instagram ad campaigns. Make sure your Ad Account ID and Access Token are saved in Settings first.
              </p>
            </div>
            <a
              href="/settings"
              className="flex items-center gap-1.5 text-xs font-medium text-indigo-500 hover:text-indigo-600 transition-colors"
            >
              Go to Settings <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        ) : (
          /* Table */
          <div className="bg-white dark:bg-white/[0.04] rounded-2xl border border-slate-100/80 dark:border-white/[0.06] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-gray-800">
                    {["Campaign", "Platform", "Status", "Spend (RM)", "Leads", "Clicks", "CPL (RM)", "CPM (RM)", "CPC (RM)", ""].map((h) => (
                      <th key={h} className="text-left px-5 py-3 text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    Array.from({ length: 4 }).map((_, i) => (
                      <tr key={i} className="border-b border-gray-50 dark:border-gray-800/50">
                        {Array.from({ length: 9 }).map((_, j) => (
                          <td key={j} className="px-5 py-4">
                            <div className="h-3 bg-slate-100 dark:bg-white/[0.05] rounded animate-pulse w-16" />
                          </td>
                        ))}
                      </tr>
                    ))
                  ) : (
                    campaigns.map((c) => (
                      <tr key={c.id} className="border-b border-gray-50 dark:border-gray-800/50 hover:bg-gray-50/50 dark:hover:bg-gray-800/20 transition-colors">
                        <td className="px-5 py-3.5 max-w-[220px]">
                          <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{c.name}</p>
                          {c.start_date && (
                            <p className="text-[11px] text-gray-400 mt-0.5">
                              {c.start_date}{c.end_date ? ` → ${c.end_date}` : ""}
                            </p>
                          )}
                        </td>
                        <td className="px-5 py-3.5">
                          <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${platformColors[c.platform] ?? platformColors.Other}`}>
                            {c.platform}
                          </span>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium capitalize ${statusColors[c.status] ?? statusColors.ended}`}>
                            {c.status}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-sm text-gray-700 dark:text-gray-300 font-medium">
                          {fmt(c.spend, "", 2)}
                        </td>
                        <td className="px-5 py-3.5 text-sm text-gray-700 dark:text-gray-300">
                          {c.leads_count ?? 0}
                        </td>
                        <td className="px-5 py-3.5 text-sm text-gray-700 dark:text-gray-300">
                          {c.clicks?.toLocaleString() ?? "—"}
                        </td>
                        <td className="px-5 py-3.5 text-sm text-gray-700 dark:text-gray-300">
                          {fmt(c.cpl, "", 2)}
                        </td>
                        <td className="px-5 py-3.5 text-sm text-gray-700 dark:text-gray-300">
                          {fmt(c.cpm, "", 2)}
                        </td>
                        <td className="px-5 py-3.5 text-sm text-gray-700 dark:text-gray-300">
                          {fmt(c.cpc, "", 2)}
                        </td>
                        <td className="px-5 py-3.5">
                          {c.meta_campaign_id && c.meta_campaign_id !== "demo" && (
                            <button
                              onClick={() => handleExport(c.meta_campaign_id!)}
                              disabled={exportingId === c.meta_campaign_id}
                              title="Download leads CSV"
                              className="flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-medium text-[#1E6FEB] border border-[#1E6FEB]/30 rounded-lg hover:bg-[#EBF2FF] dark:hover:bg-[#1E6FEB]/10 transition-colors disabled:opacity-50"
                            >
                              {exportingId === c.meta_campaign_id
                                ? <Loader2 className="w-3 h-3 animate-spin" />
                                : <Download className="w-3 h-3" />}
                              CSV
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Setup guide */}
        {!loading && campaigns.length === 0 && (
          <div className="mt-5 rounded-2xl border border-indigo-100 dark:border-indigo-900/40 bg-indigo-50/50 dark:bg-indigo-950/20 p-5">
            <p className="text-xs font-semibold text-indigo-700 dark:text-indigo-300 mb-3">Setup checklist to enable Meta Ads sync</p>
            <ol className="space-y-2">
              {[
                { step: 1, text: 'Go to Settings → WhatsApp → Manual Configuration' },
                { step: 2, text: 'Enter your Ad Account ID (from Meta Business Manager → Ad Accounts)' },
                { step: 3, text: 'Make sure your Access Token has ads_read permission (Business Settings → System Users → Edit Permissions)' },
                { step: 4, text: 'Click Save Settings, then come back here and click Sync from Meta' },
              ].map(({ step, text }) => (
                <li key={step} className="flex gap-3 text-xs text-indigo-600 dark:text-indigo-400">
                  <span className="w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center shrink-0 text-[10px] font-bold">{step}</span>
                  {text}
                </li>
              ))}
            </ol>
          </div>
        )}

      </main>
    </div>
  );
}
