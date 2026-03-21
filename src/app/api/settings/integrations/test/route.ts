import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const workspaceId = process.env.WORKSPACE_ID;
    if (!workspaceId) return NextResponse.json({ error: "WORKSPACE_ID not set" }, { status: 500 });

    const body = await request.json();
    const { provider, config } = body;

    let result: { ok: boolean; message: string };

    if (provider === "bukku") {
      result = await testBukku(config);
    } else if (provider === "autocount_cloud") {
      result = await testAutocountCloud(config);
    } else if (provider === "autocount_aotg") {
      result = await testAutocountAotg(config);
    } else {
      return NextResponse.json({ error: "Unknown provider" }, { status: 400 });
    }

    if (result.ok) {
      // Mark as active
      const supabase = createAdminClient();
      await supabase
        .from("integrations")
        .upsert(
          { workspace_id: workspaceId, provider, config, is_active: true, connected_at: new Date().toISOString() },
          { onConflict: "workspace_id,provider" }
        );
    }

    return NextResponse.json(result);
  } catch (err: any) {
    console.error("[POST /api/settings/integrations/test]", err);
    return NextResponse.json({ ok: false, message: err?.message ?? "Connection test failed" });
  }
}

async function testBukku(config: Record<string, string>) {
  const { subdomain, api_token } = config;
  if (!subdomain || !api_token) return { ok: false, message: "Subdomain and API token are required" };

  const res = await fetch(`https://api.bukku.my/companies`, {
    headers: {
      Authorization: `Bearer ${api_token}`,
      Accept: "application/json",
    },
  }).catch(() => null);

  if (!res) return { ok: false, message: "Could not reach Bukku API. Check your credentials." };
  if (res.status === 401) return { ok: false, message: "Invalid API token. Please check your Bukku API credentials." };
  if (res.status === 404 || res.ok) return { ok: true, message: "Connected to Bukku successfully!" };

  return { ok: false, message: `Bukku returned status ${res.status}` };
}

async function testAutocountCloud(config: Record<string, string>) {
  const { api_key, key_id } = config;
  if (!api_key || !key_id) return { ok: false, message: "API Key and Key ID are required" };

  const res = await fetch("https://accounting-api.autocountcloud.com/api/Quotation?pageSize=1", {
    headers: {
      "API-Key": api_key,
      "Key-ID": key_id,
      "Content-Type": "application/json",
    },
  }).catch(() => null);

  if (!res) return { ok: false, message: "Could not reach AutoCount Cloud API." };
  if (res.status === 401 || res.status === 403) return { ok: false, message: "Invalid API Key or Key ID." };
  if (res.ok) return { ok: true, message: "Connected to AutoCount Cloud successfully!" };

  return { ok: false, message: `AutoCount returned status ${res.status}` };
}

async function testAutocountAotg(config: Record<string, string>) {
  const { access_token } = config;
  if (!access_token) return { ok: false, message: "Access token is required" };

  const res = await fetch("https://aotgapi.autocountcloud.com/api/public/v1/ARQuotation/GetARQuotationList", {
    headers: {
      SOTC_AUTH: access_token,
      "Content-Type": "application/json",
    },
  }).catch(() => null);

  if (!res) return { ok: false, message: "Could not reach AutoCount AOTG API." };
  if (res.status === 401 || res.status === 403) return { ok: false, message: "Invalid access token." };
  if (res.ok) return { ok: true, message: "Connected to AutoCount (AOTG) successfully!" };

  return { ok: false, message: `AutoCount AOTG returned status ${res.status}` };
}
