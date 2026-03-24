import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("leads")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    }
    return NextResponse.json({ lead: data });
  } catch (err) {
    console.error("[GET /api/leads/[id]]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const body = await request.json();
    const allowed = ["status", "name", "notes", "assigned_to", "tags", "campaign"];
    const updates: Record<string, unknown> = {};
    for (const key of allowed) {
      if (key in body) updates[key] = body[key];
    }
    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "No valid fields" }, { status: 400 });
    }

    // RBAC: agents can only edit leads assigned to them, and cannot reassign
    const callerRole = request.headers.get("x-auth-user-role");
    const isMasterAdmin = request.headers.get("x-auth-is-master-admin") === "true";
    const callerName = request.headers.get("x-auth-user-name");

    if (!isMasterAdmin && callerRole === "agent") {
      // Agents can never reassign a lead
      delete updates.assigned_to;

      // If only updating status (pipeline drag), allow it for any lead
      const sensitiveFields = ["name", "notes", "tags", "campaign"];
      const touchesSensitive = sensitiveFields.some((f) => f in updates);

      if (touchesSensitive) {
        // Editing lead details — only allowed on assigned leads
        const supabase = createAdminClient();
        const { data: lead } = await supabase
          .from("leads")
          .select("assigned_to")
          .eq("id", id)
          .single();

        if (!lead?.assigned_to || lead.assigned_to !== callerName) {
          return NextResponse.json(
            { error: "Agents can only edit details of leads assigned to them" },
            { status: 403 }
          );
        }
      }
    }

    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("leads")
      .update(updates)
      .eq("id", id)
      .select("*")
      .single();

    if (error || !data) {
      return NextResponse.json({ error: "Update failed" }, { status: 400 });
    }
    return NextResponse.json({ lead: data });
  } catch (err) {
    console.error("[PATCH /api/leads/[id]]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const supabase = createAdminClient();
    const { error } = await supabase.from("leads").delete().eq("id", id);
    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[DELETE /api/leads/[id]]", err);
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
}
