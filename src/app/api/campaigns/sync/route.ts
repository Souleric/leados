/**
 * POST /api/campaigns/sync
 * Fetches campaigns + insights from Meta Marketing API and upserts into Supabase.
 *
 * Requirements:
 *  - Workspace must have meta_access_token saved (with ads_read permission)
 *  - Workspace must have meta_ad_account_id saved (e.g. "act_123456789")
 */
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

const META_API = "https://graph.facebook.com/v19.0";

function mapStatus(metaStatus: string): string {
  const s = metaStatus.toUpperCase();
  if (s === "ACTIVE") return "active";
  if (s === "PAUSED") return "paused";
  return "ended";
}

function getLeadsCount(actions: Array<{ action_type: string; value: string }> = []): number {
  // Lead Ads: action_type = "lead"
  // Click-to-WhatsApp: action_type = "onsite_conversion.messaging_conversation_started_7d"
  const types = [
    "lead",
    "onsite_conversion.messaging_conversation_started_7d",
    "onsite_conversion.messaging_conversation_started_1d",
  ];
  let count = 0;
  for (const a of actions) {
    if (types.includes(a.action_type)) {
      count += parseInt(a.value ?? "0", 10);
    }
  }
  return count;
}

export async function POST() {
  try {
    const supabase = createAdminClient();
    const workspaceId = process.env.WORKSPACE_ID;
    if (!workspaceId) {
      return NextResponse.json({ error: "WORKSPACE_ID not set" }, { status: 500 });
    }

    // Get workspace credentials
    const { data: workspace, error: wsError } = await supabase
      .from("workspaces")
      .select("meta_access_token, meta_ads_access_token, meta_ad_account_id")
      .eq("id", workspaceId)
      .single();

    if (wsError || !workspace) {
      return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
    }

    // Use ads-specific token first, fallback to WhatsApp token (if it has ads_read permission)
    const accessToken = workspace.meta_ads_access_token || workspace.meta_access_token;
    const rawAccountId = workspace.meta_ad_account_id;

    if (!accessToken) {
      return NextResponse.json(
        { error: "No access token saved. Go to Settings → Meta Ads and save your access token." },
        { status: 400 }
      );
    }
    if (!rawAccountId) {
      return NextResponse.json(
        { error: "No Ad Account ID saved. Go to Settings → Meta Ads and save your Ad Account ID." },
        { status: 400 }
      );
    }

    // Ensure the account ID has "act_" prefix
    const adAccountId = rawAccountId.startsWith("act_") ? rawAccountId : `act_${rawAccountId}`;

    // Fetch campaigns with insights from Meta
    const fields = [
      "id",
      "name",
      "status",
      "objective",
      "daily_budget",
      "lifetime_budget",
      "start_time",
      "stop_time",
      "insights.date_preset(last_30d){spend,impressions,reach,frequency,clicks,cpl,cpm,cpc,actions}",
    ].join(",");

    const url = `${META_API}/${adAccountId}/campaigns?fields=${encodeURIComponent(fields)}&limit=50&access_token=${accessToken}`;
    const metaRes = await fetch(url);
    const metaData = await metaRes.json();

    if (metaData.error) {
      return NextResponse.json(
        { error: `Meta API error: ${metaData.error.message}` },
        { status: 400 }
      );
    }

    const campaigns: any[] = metaData.data ?? [];
    if (campaigns.length === 0) {
      return NextResponse.json({ synced: 0, message: "No campaigns found in this ad account." });
    }

    // Build upsert rows
    const rows = campaigns.map((c: any) => {
      const insights = c.insights?.data?.[0] ?? {};
      const spend = parseFloat(insights.spend ?? "0");
      const impressions = parseInt(insights.impressions ?? "0", 10);
      const reach = parseInt(insights.reach ?? "0", 10);
      const frequency = parseFloat(insights.frequency ?? "0") || null;
      const clicks = parseInt(insights.clicks ?? "0", 10);
      const cpm = parseFloat(insights.cpm ?? "0") || null;
      const cpc = parseFloat(insights.cpc ?? "0") || null;
      const leadsCount = getLeadsCount(insights.actions ?? []);
      // Use Meta's CPL if available, else calculate
      const cpl = insights.cpl
        ? parseFloat(insights.cpl)
        : leadsCount > 0
        ? parseFloat((spend / leadsCount).toFixed(2))
        : null;

      return {
        workspace_id: workspaceId,
        meta_campaign_id: c.id,
        name: c.name,
        objective: c.objective ?? null,
        platform: "Facebook", // default; user can change
        status: mapStatus(c.status),
        spend,
        impressions,
        reach,
        frequency,
        clicks,
        leads_count: leadsCount,
        cpl,
        cpm,
        cpc,
        start_date: c.start_time ? c.start_time.split("T")[0] : null,
        end_date: c.stop_time ? c.stop_time.split("T")[0] : null,
        last_synced_at: new Date().toISOString(),
      };
    });

    // Upsert — match on meta_campaign_id + workspace_id
    const { error: upsertError } = await supabase
      .from("campaigns")
      .upsert(rows, { onConflict: "meta_campaign_id,workspace_id", ignoreDuplicates: false });

    if (upsertError) throw upsertError;

    return NextResponse.json({ synced: rows.length, message: `Synced ${rows.length} campaigns from Meta.` });
  } catch (err: any) {
    console.error("[POST /api/campaigns/sync]", err);
    return NextResponse.json({ error: err?.message ?? "Sync failed" }, { status: 500 });
  }
}
