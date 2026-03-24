/**
 * GET /api/campaigns/leads-export?campaign_id=<optional>
 *
 * Fetches lead form submissions from Meta Lead Ads API and returns a CSV file.
 * If campaign_id is provided, only exports leads from that campaign.
 * Otherwise exports all leads across all campaigns in the ad account.
 *
 * Requires: meta_access_token (ads_read + leads_retrieval permissions)
 *           meta_ad_account_id
 */
import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

const META_API = "https://graph.facebook.com/v19.0";

async function fetchAll(url: string): Promise<any[]> {
  const results: any[] = [];
  let next: string | null = url;
  while (next) {
    const res = await fetch(next);
    const json = await res.json();
    if (json.error) throw new Error(json.error.message);
    results.push(...(json.data ?? []));
    next = json.paging?.next ?? null;
  }
  return results;
}

function toCSV(rows: Record<string, string>[]): string {
  if (rows.length === 0) return "No leads found";
  const headers = Array.from(new Set(rows.flatMap((r) => Object.keys(r))));
  const escape = (v: string) => `"${(v ?? "").replace(/"/g, '""')}"`;
  const lines = [
    headers.map(escape).join(","),
    ...rows.map((r) => headers.map((h) => escape(r[h] ?? "")).join(",")),
  ];
  return lines.join("\n");
}

export async function GET(req: NextRequest) {
  try {
    const supabase = createAdminClient();
    const workspaceId = process.env.WORKSPACE_ID;
    if (!workspaceId) return NextResponse.json({ error: "WORKSPACE_ID not set" }, { status: 500 });

    const { data: workspace } = await supabase
      .from("workspaces")
      .select("meta_access_token, meta_ads_access_token, meta_ad_account_id")
      .eq("id", workspaceId)
      .single();

    const accessToken = workspace?.meta_ads_access_token || workspace?.meta_access_token;
    const rawAccountId = workspace?.meta_ad_account_id;

    if (!accessToken) return NextResponse.json({ error: "No Meta access token saved. Go to Settings → Meta Ads." }, { status: 400 });
    if (!rawAccountId) return NextResponse.json({ error: "No Ad Account ID saved. Go to Settings → Meta Ads." }, { status: 400 });

    const adAccountId = rawAccountId.startsWith("act_") ? rawAccountId : `act_${rawAccountId}`;
    const filterCampaignId = req.nextUrl.searchParams.get("campaign_id");

    // Step 1: Get all ads with their lead gen form IDs
    let adsUrl = `${META_API}/${adAccountId}/ads?fields=id,name,campaign_id,campaign{name},adcreatives{lead_gen_form_id}&limit=100&access_token=${accessToken}`;
    if (filterCampaignId) {
      adsUrl += `&filtering=[{"field":"campaign.id","operator":"EQUAL","value":"${filterCampaignId}"}]`;
    }

    const ads = await fetchAll(adsUrl);

    // Collect unique form IDs with campaign context
    const formMap = new Map<string, { campaignId: string; campaignName: string; adName: string }>();
    for (const ad of ads) {
      const formId = ad.adcreatives?.data?.[0]?.lead_gen_form_id;
      if (formId) {
        formMap.set(formId, {
          campaignId: ad.campaign_id ?? ad.campaign?.id ?? "",
          campaignName: ad.campaign?.name ?? "Unknown Campaign",
          adName: ad.name ?? "",
        });
      }
    }

    if (formMap.size === 0) {
      return NextResponse.json({ error: "No Lead Ad forms found. Make sure your campaigns use Lead Ad forms." }, { status: 404 });
    }

    // Step 2: Fetch leads from each form
    const allLeads: Record<string, string>[] = [];

    for (const [formId, ctx] of formMap.entries()) {
      const leadsUrl = `${META_API}/${formId}/leads?fields=id,created_time,field_data&limit=500&access_token=${accessToken}`;
      const leads = await fetchAll(leadsUrl);

      for (const lead of leads) {
        const row: Record<string, string> = {
          lead_id: lead.id,
          created_at: lead.created_time,
          campaign: ctx.campaignName,
          ad: ctx.adName,
        };
        for (const field of lead.field_data ?? []) {
          row[field.name] = (field.values ?? []).join(", ");
        }
        allLeads.push(row);
      }
    }

    if (allLeads.length === 0) {
      return NextResponse.json({ error: "No lead submissions found yet." }, { status: 404 });
    }

    const csv = toCSV(allLeads);
    const filename = filterCampaignId
      ? `leads-campaign-${filterCampaignId}.csv`
      : `leads-all-${new Date().toISOString().slice(0, 10)}.csv`;

    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (err: any) {
    console.error("[GET /api/campaigns/leads-export]", err);
    return NextResponse.json({ error: err?.message ?? "Export failed" }, { status: 500 });
  }
}
