import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { signToken, COOKIE_NAME, EXPIRES_IN } from "@/lib/auth";
import bcrypt from "bcryptjs";

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();
    if (!username || !password) {
      return NextResponse.json({ error: "Username and password are required" }, { status: 400 });
    }

    const supabase = createAdminClient();
    const workspaceId = process.env.WORKSPACE_ID;
    if (!workspaceId) return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });

    // Find member by username (case-insensitive)
    const { data: member, error } = await supabase
      .from("team_members")
      .select("id, name, username, password_hash, role, is_master_admin")
      .eq("workspace_id", workspaceId)
      .ilike("username", username.trim())
      .single();

    if (error || !member || !member.password_hash) {
      return NextResponse.json({ error: "Invalid username or password" }, { status: 401 });
    }

    const valid = await bcrypt.compare(password, member.password_hash);
    if (!valid) {
      return NextResponse.json({ error: "Invalid username or password" }, { status: 401 });
    }

    const token = await signToken({
      sub: member.id,
      username: member.username,
      name: member.name,
      role: member.role,
      is_master_admin: member.is_master_admin ?? false,
    });

    const res = NextResponse.json({
      user: { id: member.id, username: member.username, name: member.name, role: member.role, is_master_admin: member.is_master_admin ?? false },
    });

    res.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: EXPIRES_IN,
      path: "/",
    });

    return res;
  } catch (err: any) {
    console.error("[POST /api/auth/login]", err);
    return NextResponse.json({ error: "Login failed" }, { status: 500 });
  }
}
