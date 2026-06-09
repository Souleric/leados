/**
 * GET /api/master/overview — aggregate across ALL workspaces (master admin only).
 * Returns combined KPIs, a cross-client leads-over-time trend, and a per-client breakdown.
 */
import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { computeAnalytics } from "@/lib/analytics";

export async function GET(request: NextRequest) {
  // Defense in depth — middleware already gates /api/master, but double-check.
  if (request.headers.get("x-auth-is-master-admin") !== "true") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const supabase = createAdminClient();

    // Aggregate KPIs + trend across every workspace (workspaceId = null).
    const aggregate = await computeAnalytics(supabase, null);

    // Per-client breakdown.
    const [wsRes, leadsRes, campRes] = await Promise.all([
      supabase.from("workspaces").select("id, name, slug, created_at"),
      supabase.from("leads").select("workspace_id, status, last_message_at, created_at"),
      supabase.from("campaigns").select("workspace_id, spend"),
    ]);
    if (wsRes.error) throw wsRes.error;
    if (leadsRes.error) throw leadsRes.error;

    const workspaces = (wsRes.data ?? []) as Array<{ id: string; name: string; slug: string | null; created_at: string }>;
    const leads = (leadsRes.data ?? []) as Array<{ workspace_id: string | null; status: string; last_message_at: string | null; created_at: string }>;
    const campaigns = (campRes.data ?? []) as Array<{ workspace_id: string | null; spend: number | null }>;

    const spendByWs: Record<string, number> = {};
    for (const c of campaigns) {
      if (!c.workspace_id) continue;
      spendByWs[c.workspace_id] = (spendByWs[c.workspace_id] ?? 0) + Number(c.spend ?? 0);
    }

    const clients = workspaces.map((ws) => {
      const wsLeads = leads.filter((l) => l.workspace_id === ws.id);
      const total = wsLeads.length;
      const converted = wsLeads.filter((l) => l.status === "converted").length;
      const inProgress = wsLeads.filter((l) => l.status === "contacted" || l.status === "proposal_sent").length;
      const active = wsLeads.filter((l) => l.status === "new" || l.status === "contacted" || l.status === "proposal_sent").length;
      const lastActivity = wsLeads.reduce<string | null>((acc, l) => {
        const t = l.last_message_at ?? l.created_at;
        return !acc || (t && t > acc) ? t : acc;
      }, null);
      return {
        id: ws.id,
        name: ws.name,
        slug: ws.slug,
        totalLeads: total,
        activeLeads: active,
        inProgress,
        clients: converted,
        conversionRate: total > 0 ? Math.round((converted / total) * 100) : 0,
        spend: Math.round((spendByWs[ws.id] ?? 0) * 100) / 100,
        lastActivity,
      };
    });

    const totalSpend = Object.values(spendByWs).reduce((a, b) => a + b, 0);

    return NextResponse.json({
      kpis: aggregate.kpis,
      perDay: aggregate.perDay,
      perSource: aggregate.perSource,
      workspaceCount: workspaces.length,
      totalSpend: Math.round(totalSpend * 100) / 100,
      clients: clients.sort((a, b) => b.totalLeads - a.totalLeads),
    });
  } catch (err) {
    console.error("[GET /api/master/overview]", err);
    return NextResponse.json({ error: "Failed to load master overview" }, { status: 500 });
  }
}
