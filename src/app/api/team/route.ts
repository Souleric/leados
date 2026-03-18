import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = createAdminClient();
    const workspaceId = process.env.WORKSPACE_ID;
    if (!workspaceId) return NextResponse.json({ error: "WORKSPACE_ID not set" }, { status: 500 });

    const { data, error } = await supabase
      .from("team_members")
      .select("*")
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
    const supabase = createAdminClient();
    const workspaceId = process.env.WORKSPACE_ID;
    if (!workspaceId) return NextResponse.json({ error: "WORKSPACE_ID not set" }, { status: 500 });

    const body = await request.json();
    const { name, email, role } = body;
    if (!name?.trim()) return NextResponse.json({ error: "Name is required" }, { status: 400 });

    const { data, error } = await supabase
      .from("team_members")
      .insert({
        workspace_id: workspaceId,
        name: name.trim(),
        email: email?.trim() || null,
        role: role ?? "agent",
      })
      .select("*")
      .single();

    if (error) throw error;
    return NextResponse.json({ member: data }, { status: 201 });
  } catch (err: any) {
    console.error("[POST /api/team]", err);
    return NextResponse.json({ error: err?.message ?? "Failed to create member" }, { status: 500 });
  }
}
