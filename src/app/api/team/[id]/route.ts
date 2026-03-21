import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const callerRole = request.headers.get("x-auth-user-role");
    const isMasterAdmin = request.headers.get("x-auth-is-master-admin") === "true";

    // Only admin/master admin can update team members
    if (!isMasterAdmin && callerRole !== "admin") {
      return NextResponse.json({ error: "Only admins can update team members" }, { status: 403 });
    }

    const supabase = createAdminClient();

    // Cannot modify the master admin's role or username
    const { data: target } = await supabase
      .from("team_members")
      .select("is_master_admin")
      .eq("id", id)
      .single();

    if (target?.is_master_admin && !isMasterAdmin) {
      return NextResponse.json({ error: "Cannot modify the master admin" }, { status: 403 });
    }

    const body = await request.json();
    const { name, email, role, status } = body;

    const updates: Record<string, any> = {};
    if (name !== undefined) updates.name = name;
    if (email !== undefined) updates.email = email || null;
    // Cannot change the master admin's role
    if (role !== undefined && !target?.is_master_admin) updates.role = role;
    if (status !== undefined) updates.status = status;

    const { data, error } = await supabase
      .from("team_members")
      .update(updates)
      .eq("id", id)
      .select("id, name, email, role, avatar_color, status, created_at, username, is_master_admin")
      .single();

    if (error) throw error;
    return NextResponse.json({ member: data });
  } catch (err: any) {
    console.error("[PATCH /api/team/[id]]", err);
    return NextResponse.json({ error: err?.message ?? "Failed to update member" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const isMasterAdmin = request.headers.get("x-auth-is-master-admin") === "true";
    const callerRole = request.headers.get("x-auth-user-role");

    if (!isMasterAdmin && callerRole !== "admin") {
      return NextResponse.json({ error: "Only admins can remove team members" }, { status: 403 });
    }

    const supabase = createAdminClient();

    // Cannot delete the master admin
    const { data: target } = await supabase
      .from("team_members")
      .select("is_master_admin")
      .eq("id", id)
      .single();

    if (target?.is_master_admin) {
      return NextResponse.json({ error: "The master admin cannot be removed" }, { status: 403 });
    }

    const { error } = await supabase.from("team_members").delete().eq("id", id);
    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("[DELETE /api/team/[id]]", err);
    return NextResponse.json({ error: err?.message ?? "Failed to delete member" }, { status: 500 });
  }
}
