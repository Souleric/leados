import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { getAuthUser } from "@/lib/auth";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const authUser = await getAuthUser();
    if (!authUser?.is_master_admin && authUser?.role !== "admin") {
      return NextResponse.json({ error: "Admin only" }, { status: 403 });
    }
    const body = await request.json();
    const allowed = ["name", "color", "sort_order"];
    const updates: Record<string, unknown> = {};
    for (const key of allowed) {
      if (key in body) updates[key] = body[key];
    }
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("membership_tiers")
      .update(updates)
      .eq("id", id)
      .select("*")
      .single();
    if (error) throw error;
    return NextResponse.json({ tier: data });
  } catch (err) {
    console.error("[PATCH /api/membership-tiers/[id]]", err);
    return NextResponse.json({ error: "Failed to update tier" }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const authUser = await getAuthUser();
    if (!authUser?.is_master_admin && authUser?.role !== "admin") {
      return NextResponse.json({ error: "Admin only" }, { status: 403 });
    }
    const supabase = createAdminClient();
    const { error } = await supabase.from("membership_tiers").delete().eq("id", id);
    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[DELETE /api/membership-tiers/[id]]", err);
    return NextResponse.json({ error: "Failed to delete tier" }, { status: 500 });
  }
}
