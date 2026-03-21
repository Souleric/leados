import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { getAuthUser } from "@/lib/auth";
import bcrypt from "bcryptjs";

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { currentPassword, newPassword } = await request.json();
    if (!currentPassword || !newPassword) {
      return NextResponse.json({ error: "Both current and new password are required" }, { status: 400 });
    }
    if (newPassword.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
    }

    const supabase = createAdminClient();

    // Verify current password
    const { data: member } = await supabase
      .from("team_members")
      .select("password_hash")
      .eq("id", user.sub)
      .single();

    if (!member?.password_hash) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const valid = await bcrypt.compare(currentPassword, member.password_hash);
    if (!valid) {
      return NextResponse.json({ error: "Current password is incorrect" }, { status: 401 });
    }

    const newHash = await bcrypt.hash(newPassword, 12);
    const { error } = await supabase
      .from("team_members")
      .update({ password_hash: newHash })
      .eq("id", user.sub);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("[POST /api/auth/change-password]", err);
    return NextResponse.json({ error: "Failed to change password" }, { status: 500 });
  }
}
