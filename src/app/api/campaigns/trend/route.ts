/**
 * GET /api/campaigns/trend
 * Fetches weekly CPL + leads + spend breakdown from Meta for the last 90 days.
 */
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

const META_API = "https://graph.facebook.com/v19.0";

function getLeadsCount(actions: Array<{ action_type: string; value: string }> = []): number {
  const types = [
    "lead",
    "onsite_conversion.messaging_conversation_started_7d",
    "onsite_conversion.messaging_conversation_started_1d",
  ];
  let count = 0;
  for (const a of actions) {
    if (types.includes(a.action_type)) count += parseInt(a.value ?? "0", 10);
  }
  return count;
}

export async function GET() {
  try {
    const supabase = createAdminClient();
    const workspaceId = process.env.WORKSPACE_ID;
    if (!workspaceId) return NextResponse.json({ error: "WORKSPACE_ID not set" }, { status: 500 });

    const { data: workspace } = await supabase
      .from("workspaces")
      .select("meta_ads_access_token, meta_access_token, meta_ad_account_id")
      .eq("id", workspaceId)
      .single();

    const accessToken = workspace?.meta_ads_access_token || workspace?.meta_access_token;
    const rawAccountId = workspace?.meta_ad_account_id;

    if (!accessToken || !rawAccountId) {
      return NextResponse.json({ trend: [] });
    }

    const adAccountId = rawAccountId.startsWith("act_") ? rawAccountId : `act_${rawAccountId}`;

    // Fetch weekly breakdowns for last 90 days across all campaigns
    const fields = "id,name,insights.date_preset(last_90d).time_increment(7){spend,actions,date_start,date_stop}";
    const url = `${META_API}/${adAccountId}/campaigns?fields=${encodeURIComponent(fields)}&limit=50&access_token=${accessToken}`;
    const res: Response = await fetch(url);
    const metaData = await res.json();

    if (metaData.error) {
      return NextResponse.json({ error: metaData.error.message }, { status: 400 });
    }

    // Aggregate weekly totals across all campaigns
    const weekMap: Record<string, { week: string; spend: number; leads: number }> = {};

    for (const campaign of metaData.data ?? []) {
      for (const insight of campaign.insights?.data ?? []) {
        const week = insight.date_start; // "2026-02-24"
        const spend = parseFloat(insight.spend ?? "0");
        const leads = getLeadsCount(insight.actions ?? []);

        if (!weekMap[week]) {
          weekMap[week] = { week, spend: 0, leads: 0 };
        }
        weekMap[week].spend += spend;
        weekMap[week].leads += leads;
      }
    }

    const trend = Object.values(weekMap)
      .sort((a, b) => a.week.localeCompare(b.week))
      .map((w) => ({
        week: w.week,
        spend: parseFloat(w.spend.toFixed(2)),
        leads: w.leads,
        cpl: w.leads > 0 ? parseFloat((w.spend / w.leads).toFixed(2)) : null,
      }));

    return NextResponse.json({ trend });
  } catch (err: any) {
    console.error("[GET /api/campaigns/trend]", err);
    return NextResponse.json({ error: err?.message ?? "Failed" }, { status: 500 });
  }
}
