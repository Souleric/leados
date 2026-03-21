import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = createAdminClient();
    const workspaceId = process.env.WORKSPACE_ID;
    if (!workspaceId) return NextResponse.json({ error: "WORKSPACE_ID not set" }, { status: 500 });

    const { data, error } = await supabase
      .from("integrations")
      .select("id, provider, config, is_active, connected_at")
      .eq("workspace_id", workspaceId);

    if (error) throw error;

    // Mask sensitive fields before returning
    const safe = (data ?? []).map((row) => ({
      ...row,
      config: maskConfig(row.provider, row.config),
    }));

    return NextResponse.json({ integrations: safe });
  } catch (err: any) {
    console.error("[GET /api/settings/integrations]", err);
    return NextResponse.json({ error: err?.message ?? "Failed to fetch integrations" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createAdminClient();
    const workspaceId = process.env.WORKSPACE_ID;
    if (!workspaceId) return NextResponse.json({ error: "WORKSPACE_ID not set" }, { status: 500 });

    const body = await request.json();
    const { provider, config } = body;

    if (!["autocount_cloud", "autocount_aotg", "bukku"].includes(provider)) {
      return NextResponse.json({ error: "Invalid provider" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("integrations")
      .upsert(
        { workspace_id: workspaceId, provider, config, is_active: false },
        { onConflict: "workspace_id,provider" }
      )
      .select("*")
      .single();

    if (error) throw error;
    return NextResponse.json({ integration: { ...data, config: maskConfig(provider, data.config) } });
  } catch (err: any) {
    console.error("[POST /api/settings/integrations]", err);
    return NextResponse.json({ error: err?.message ?? "Failed to save integration" }, { status: 500 });
  }
}

function maskConfig(provider: string, config: Record<string, any>) {
  const masked = { ...config };
  const sensitiveKeys = ["api_token", "api_key", "key_id", "password", "access_token"];
  for (const key of sensitiveKeys) {
    if (masked[key]) masked[key] = "••••••••";
  }
  return masked;
}
