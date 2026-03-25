import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = createAdminClient();
    const workspaceId = process.env.WORKSPACE_ID;

    const now = new Date();
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();
    const lastMonthEnd   = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

    const [leadsRes, perDayRes, perSourceRes, thisMonthRes, lastMonthRes, unassignedRes, membersRes] =
      await Promise.all([
        supabase.from("leads").select("status, assigned_to"),
        supabase.from("leads_per_day").select("*").limit(30),
        supabase.from("leads_per_source").select("*"),
        supabase.from("leads").select("id", { count: "exact", head: true }).gte("created_at", thisMonthStart),
        supabase.from("leads").select("id", { count: "exact", head: true }).gte("created_at", lastMonthStart).lt("created_at", lastMonthEnd),
        supabase.from("leads").select("id", { count: "exact", head: true }).is("assigned_to", null),
        workspaceId
          ? supabase.from("team_members").select("name, role").eq("workspace_id", workspaceId).eq("role", "agent")
          : Promise.resolve({ data: [] }),
      ]);

    if (leadsRes.error) throw leadsRes.error;

    const leads = (leadsRes.data ?? []) as Array<{ status: string; assigned_to: string | null }>;

    // Status counts
    const counts: Record<string, number> = {};
    for (const row of leads) {
      counts[row.status] = (counts[row.status] ?? 0) + 1;
    }

    const total       = leads.length;
    const newLeads    = counts["new"] ?? 0;
    const inProgress  = (counts["contacted"] ?? 0) + (counts["quotation_sent"] ?? 0);
    const closedWon   = counts["closed_won"] ?? 0;
    const lost        = counts["lost"] ?? 0;

    // Per-member stats for sales performance chart
    const agents = (membersRes.data ?? []) as Array<{ name: string }>;
    const perMember = agents.map((a) => {
      const memberLeads = leads.filter((l) => l.assigned_to === a.name);
      return {
        name: a.name.split(" ")[0], // first name for chart label
        total: memberLeads.length,
        closed_won: memberLeads.filter((l) => l.status === "closed_won").length,
        in_progress: memberLeads.filter((l) => l.status === "contacted" || l.status === "quotation_sent").length,
      };
    });

    const thisMonth = thisMonthRes.count ?? 0;
    const lastMonth = lastMonthRes.count ?? 0;
    const monthChange = lastMonth > 0 ? Math.round(((thisMonth - lastMonth) / lastMonth) * 100) : 0;

    return NextResponse.json({
      kpis: {
        totalLeads: total,
        newLeads,
        inProgress,
        closedWon,
        lost,
        unassigned: unassignedRes.count ?? 0,
        thisMonth,
        lastMonth,
        monthChange,
        conversionRate: total > 0 ? Math.round((closedWon / total) * 100) : 0,
      },
      perDay: perDayRes.data ?? [],
      perSource: perSourceRes.data ?? [],
      perMember,
    });
  } catch (err) {
    console.error("[GET /api/analytics]", err);
    return NextResponse.json({ error: "Failed to load analytics" }, { status: 500 });
  }
}
