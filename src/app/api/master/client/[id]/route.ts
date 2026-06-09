/**
 * GET /api/master/client/[id] — read-only analytics for ONE workspace (master admin only).
 * [id] is the workspace_id. Same response shape as /api/analytics, plus the workspace name.
 */
import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { computeAnalytics } from "@/lib/analytics";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (request.headers.get("x-auth-is-master-admin") !== "true") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { id } = await params;
    const supabase = createAdminClient();

    const wsRes = await supabase
      .from("workspaces")
      .select("id, name, slug")
      .eq("id", id)
      .maybeSingle();
    if (!wsRes.data) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    const result = await computeAnalytics(supabase, id);
    return NextResponse.json({ workspace: wsRes.data, ...result });
  } catch (err) {
    console.error("[GET /api/master/client/[id]]", err);
    return NextResponse.json({ error: "Failed to load client analytics" }, { status: 500 });
  }
}
