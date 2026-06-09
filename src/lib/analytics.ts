/**
 * Shared analytics computation.
 * Used by:
 *   - /api/analytics             (scoped to one workspace — the deployment's WORKSPACE_ID)
 *   - /api/master/overview       (aggregate across ALL workspaces — master admin only)
 *   - /api/master/client/[id]    (scoped to a chosen workspace — master admin drill-in)
 *
 * Pass workspaceId = null/undefined to aggregate across every workspace.
 */
import type { SupabaseClient } from "@supabase/supabase-js";

export interface AnalyticsKpis {
  totalLeads: number;
  newLeads: number;
  inProgress: number;
  closedWon: number;   // = converted (clients)
  lost: number;        // = inactive
  unassigned: number;
  thisMonth: number;
  lastMonth: number;
  monthChange: number;
  conversionRate: number;
}

export interface AnalyticsResult {
  kpis: AnalyticsKpis;
  perDay: { date: string; total: number; qualified: number }[];
  perSource: { source: string; total: number }[];
  perMember: { name: string; total: number; closed_won: number; in_progress: number }[];
}

interface LeadRow {
  status: string;
  assigned_to: string | null;
  created_at: string;
  source: string | null;
}

export async function computeAnalytics(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: SupabaseClient<any>,
  workspaceId?: string | null
): Promise<AnalyticsResult> {
  let leadsQuery = supabase.from("leads").select("status, assigned_to, created_at, source");
  let teamQuery = supabase.from("team_members").select("name, role").eq("role", "agent");
  if (workspaceId) {
    leadsQuery = leadsQuery.eq("workspace_id", workspaceId);
    teamQuery = teamQuery.eq("workspace_id", workspaceId);
  }

  const [leadsRes, teamRes] = await Promise.all([leadsQuery, teamQuery]);
  if (leadsRes.error) throw leadsRes.error;

  const leads = (leadsRes.data ?? []) as LeadRow[];

  // ── status counts ──
  const counts: Record<string, number> = {};
  for (const row of leads) counts[row.status] = (counts[row.status] ?? 0) + 1;

  const total      = leads.length;
  const newLeads   = counts["new"] ?? 0;
  const inProgress = (counts["contacted"] ?? 0) + (counts["proposal_sent"] ?? 0);
  const closedWon  = counts["converted"] ?? 0;
  const lost       = counts["inactive"] ?? 0;
  const unassigned = leads.filter((l) => !l.assigned_to).length;

  // ── month-over-month ──
  const now = new Date();
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const thisMonth = leads.filter((l) => new Date(l.created_at) >= thisMonthStart).length;
  const lastMonth = leads.filter(
    (l) => new Date(l.created_at) >= lastMonthStart && new Date(l.created_at) < thisMonthStart
  ).length;
  const monthChange = lastMonth > 0 ? Math.round(((thisMonth - lastMonth) / lastMonth) * 100) : 0;

  // ── perDay (last 30 days, most-recent first to match chart) ──
  const QUALIFIED = new Set(["contacted", "proposal_sent", "converted"]);
  const byDay: Record<string, { total: number; qualified: number }> = {};
  for (const l of leads) {
    const key = new Date(l.created_at).toISOString().slice(0, 10);
    if (!byDay[key]) byDay[key] = { total: 0, qualified: 0 };
    byDay[key].total += 1;
    if (QUALIFIED.has(l.status)) byDay[key].qualified += 1;
  }
  const perDay: AnalyticsResult["perDay"] = [];
  for (let i = 0; i < 30; i++) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    const v = byDay[key] ?? { total: 0, qualified: 0 };
    perDay.push({ date: key, total: v.total, qualified: v.qualified });
  }

  // ── perSource ──
  const bySource: Record<string, number> = {};
  for (const l of leads) {
    const s = l.source ?? "Unknown";
    bySource[s] = (bySource[s] ?? 0) + 1;
  }
  const perSource = Object.entries(bySource)
    .map(([source, total]) => ({ source, total }))
    .sort((a, b) => b.total - a.total);

  // ── perMember ──
  const agents = (teamRes.data ?? []) as Array<{ name: string }>;
  const perMember = agents.map((a) => {
    const memberLeads = leads.filter((l) => l.assigned_to === a.name);
    return {
      name: a.name.split(" ")[0],
      total: memberLeads.length,
      closed_won: memberLeads.filter((l) => l.status === "converted").length,
      in_progress: memberLeads.filter((l) => l.status === "contacted" || l.status === "proposal_sent").length,
    };
  });

  return {
    kpis: {
      totalLeads: total,
      newLeads,
      inProgress,
      closedWon,
      lost,
      unassigned,
      thisMonth,
      lastMonth,
      monthChange,
      conversionRate: total > 0 ? Math.round((closedWon / total) * 100) : 0,
    },
    perDay,
    perSource,
    perMember,
  };
}
