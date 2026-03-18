import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
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
      .eq("id", params.id)
      .select("*")
      .single();

    if (error) throw error;
    return NextResponse.json({ member: data });
  } catch (err: any) {
    console.error("[PATCH /api/team/[id]]", err);
    return NextResponse.json({ error: err?.message ?? "Failed to update member" }, { status: 500 });
  }
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = createAdminClient();
    const { error } = await supabase.from("team_members").delete().eq("id", params.id);
    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("[DELETE /api/team/[id]]", err);
    return NextResponse.json({ error: err?.message ?? "Failed to delete member" }, { status: 500 });
  }
}
