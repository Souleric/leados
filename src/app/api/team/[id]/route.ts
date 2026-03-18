import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const supabase = createAdminClient();
    const body = await request.json();
    const { name, email, role, status } = body;

    const updates: Record<string, any> = {};
    if (name !== undefined) updates.name = name;
    if (email !== undefined) updates.email = email || null;
    if (role !== undefined) updates.role = role;
    if (status !== undefined) updates.status = status;

    const { data, error } = await supabase
      .from("team_members")
      .update(updates)
      .eq("id", id)
      .select("*")
      .single();

    if (error) throw error;
    return NextResponse.json({ member: data });
  } catch (err: any) {
    console.error("[PATCH /api/team/[id]]", err);
    return NextResponse.json({ error: err?.message ?? "Failed to update member" }, { status: 500 });
  }
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const supabase = createAdminClient();
    const { error } = await supabase.from("team_members").delete().eq("id", id);
    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("[DELETE /api/team/[id]]", err);
    return NextResponse.json({ error: err?.message ?? "Failed to delete member" }, { status: 500 });
  }
}
