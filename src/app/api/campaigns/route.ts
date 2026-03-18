import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = createAdminClient();
    const workspaceId = process.env.WORKSPACE_ID;

    let query = supabase
      .from("campaigns")
      .select("*")
      .order("created_at", { ascending: false });

    if (workspaceId) {
      query = query.eq("workspace_id", workspaceId);
    }

    const { data, error } = await query;
    if (error) throw error;

    return NextResponse.json({ campaigns: data ?? [] });
  } catch (err: any) {
    console.error("[GET /api/campaigns]", err);
    return NextResponse.json({ error: err?.message ?? "Failed to fetch campaigns" }, { status: 500 });
  }
}
