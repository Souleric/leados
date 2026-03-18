import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

const ACCOUNT_STATUS: Record<number, string> = {
  1: "Active", 2: "Disabled", 3: "Unsettled", 7: "Pending Review",
  8: "Pending Closure", 9: "In Grace Period", 100: "Pending Closure",
  101: "Closed", 201: "Any Active", 202: "Any Closed",
};

export async function POST(request: NextRequest) {
  try {
    const { adAccountId, adsToken } = await request.json();

    if (!adAccountId) {
      return NextResponse.json({ error: "Ad Account ID is required" }, { status: 400 });
    }

    // Resolve token — if placeholder, load from DB
    let token = adsToken;
    if (!token || token === "__use_saved_ads__") {
      const workspaceId = process.env.WORKSPACE_ID;
      if (!workspaceId) return NextResponse.json({ error: "WORKSPACE_ID not set" }, { status: 500 });
      const supabase = createAdminClient();
      const { data } = await supabase
        .from("workspaces")
        .select("meta_ads_access_token, meta_access_token")
        .eq("id", workspaceId)
        .single();
      token = data?.meta_ads_access_token || data?.meta_access_token;
    }

    if (!token) {
      return NextResponse.json({ error: "No access token saved" }, { status: 400 });
    }

    const accountId = adAccountId.startsWith("act_") ? adAccountId : `act_${adAccountId}`;
    const url = `https://graph.facebook.com/v19.0/${accountId}?fields=name,account_status,currency,timezone_name&access_token=${token}`;
    const res = await fetch(url);
    const data = await res.json();

    if (data.error) {
      return NextResponse.json({ error: data.error.message }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      name: data.name,
      status: ACCOUNT_STATUS[data.account_status] ?? `Status ${data.account_status}`,
      currency: data.currency,
      timezone: data.timezone_name,
    });
  } catch (err: any) {
    console.error("[POST /api/settings/test-ads-connection]", err);
    return NextResponse.json({ error: err?.message ?? "Test failed" }, { status: 500 });
  }
}
