import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import bcrypt from "bcryptjs";

export async function GET() {
  try {
    const supabase = createAdminClient();
    const workspaceId = process.env.WORKSPACE_ID;
    if (!workspaceId) return NextResponse.json({ error: "WORKSPACE_ID not set" }, { status: 500 });

    const { data, error } = await supabase
      .from("team_members")
      .select("id, name, email, role, avatar_color, status, created_at, username, is_master_admin")
      .eq("workspace_id", workspaceId)
      .order("created_at", { ascending: true });

    if (error) throw error;
    return NextResponse.json({ members: data ?? [] });
  } catch (err: any) {
    console.error("[GET /api/team]", err);
    return NextResponse.json({ error: err?.message ?? "Failed to fetch team" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    // Only admins and master admin can create team members
    const callerRole = request.headers.get("x-auth-user-role");
    const isMasterAdmin = request.headers.get("x-auth-is-master-admin") === "true";
    if (!isMasterAdmin && callerRole !== "admin") {
      return NextResponse.json({ error: "Only admins can add team members" }, { status: 403 });
    }

    const supabase = createAdminClient();
    const workspaceId = process.env.WORKSPACE_ID;
    if (!workspaceId) return NextResponse.json({ error: "WORKSPACE_ID not set" }, { status: 500 });

    const body = await request.json();
    const { name, email, role, username, password } = body;
    if (!name?.trim()) return NextResponse.json({ error: "Name is required" }, { status: 400 });
    if (!username?.trim()) return NextResponse.json({ error: "Username is required" }, { status: 400 });
    if (!password || password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
    }

    // Check username uniqueness in workspace
    const { data: existing } = await supabase
      .from("team_members")
      .select("id")
      .eq("workspace_id", workspaceId)
      .ilike("username", username.trim())
      .single();

    if (existing) {
      return NextResponse.json({ error: "Username already taken" }, { status: 409 });
    }

    const password_hash = await bcrypt.hash(password, 12);

    const { data, error } = await supabase
      .from("team_members")
      .insert({
        workspace_id: workspaceId,
        name: name.trim(),
        email: email?.trim() || null,
        role: role ?? "agent",
        username: username.trim(),
        password_hash,
        is_master_admin: false,
      })
      .select("id, name, email, role, avatar_color, status, created_at, username, is_master_admin")
      .single();

    if (error) throw error;
    return NextResponse.json({ member: data }, { status: 201 });
  } catch (err: any) {
    console.error("[POST /api/team]", err);
    return NextResponse.json({ error: err?.message ?? "Failed to create member" }, { status: 500 });
  }
}
