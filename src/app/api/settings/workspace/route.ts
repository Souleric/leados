/**
 * GET  /api/settings/workspace  — fetch workspace settings
 * PATCH /api/settings/workspace — save workspace settings
 */
import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

function getWorkspaceId() {
  const id = process.env.WORKSPACE_ID;
  if (!id) throw new Error("WORKSPACE_ID env var not set");
  return id;
}

export async function GET() {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("workspaces")
      .select("*")
      .eq("id", getWorkspaceId())
      .single();

    if (error || !data) {
      return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
    }

    // Never expose access token to frontend — mask it
    const safe = {
      ...data,
      meta_access_token: data.meta_access_token
        ? `${(data.meta_access_token as string).slice(0, 8)}${"•".repeat(20)}`
        : null,
    };

    return NextResponse.json({ workspace: safe });
  } catch (err) {
    console.error("[GET /api/settings/workspace]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const allowed = [
      "name", "slug", "owner_email", "logo_url", "timezone",
      "meta_app_id", "meta_phone_number_id", "meta_waba_id",
      "meta_access_token", "meta_webhook_verify_token",
      "meta_phone_display", "meta_business_name",
    ];

    const updates: Record<string, unknown> = {};
    for (const key of allowed) {
      if (key in body && body[key] !== undefined) {
        updates[key] = body[key];
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
    }

    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("workspaces")
      .update(updates)
      .eq("id", getWorkspaceId())
      .select("*")
      .single();

    if (error || !data) {
      return NextResponse.json({ error: "Update failed" }, { status: 400 });
    }

    return NextResponse.json({ workspace: data });
  } catch (err) {
    console.error("[PATCH /api/settings/workspace]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
