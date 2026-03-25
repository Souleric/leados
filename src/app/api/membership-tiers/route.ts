import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { getAuthUser } from "@/lib/auth";

export async function GET() {
  try {
    const supabase = createAdminClient();
    const workspaceId = process.env.WORKSPACE_ID;
    const { data, error } = await supabase
      .from("membership_tiers")
      .select("*")
      .eq("workspace_id", workspaceId)
      .order("sort_order");
    if (error) throw error;
    return NextResponse.json({ tiers: data });
  } catch (err) {
    console.error("[GET /api/membership-tiers]", err);
    return NextResponse.json({ error: "Failed to fetch tiers" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const authUser = await getAuthUser();
    if (!authUser?.is_master_admin && authUser?.role !== "admin") {
      return NextResponse.json({ error: "Admin only" }, { status: 403 });
    }
    const body = await request.json();
    const { name, color } = body;
    if (!name?.trim()) return NextResponse.json({ error: "Name is required" }, { status: 400 });

    const supabase = createAdminClient();
    const workspaceId = process.env.WORKSPACE_ID;

    // Get current max sort_order
    const { data: existing } = await supabase
      .from("membership_tiers")
      .select("sort_order")
      .eq("workspace_id", workspaceId)
      .order("sort_order", { ascending: false })
      .limit(1);
    const nextOrder = ((existing?.[0]?.sort_order) ?? -1) + 1;

    const { data, error } = await supabase
      .from("membership_tiers")
      .insert({ workspace_id: workspaceId, name: name.trim(), color: color ?? "#6366f1", sort_order: nextOrder })
      .select("*")
      .single();
    if (error) throw error;
    return NextResponse.json({ tier: data }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/membership-tiers]", err);
    return NextResponse.json({ error: "Failed to create tier" }, { status: 500 });
  }
}
