import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { computeAnalytics } from "@/lib/analytics";

export async function GET() {
  try {
    const supabase = createAdminClient();
    // Scope strictly to THIS deployment's workspace (prevents cross-tenant leak).
    const workspaceId = process.env.WORKSPACE_ID ?? null;

    const result = await computeAnalytics(supabase, workspaceId);
    return NextResponse.json(result);
  } catch (err) {
    console.error("[GET /api/analytics]", err);
    return NextResponse.json({ error: "Failed to load analytics" }, { status: 500 });
  }
}
