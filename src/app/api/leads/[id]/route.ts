import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

function deriveLifecycle(status: string): string {
  if (status === "converted") return "client";
  if (status === "inactive")  return "inactive_lead";
  return "active_lead";
}

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
      return NextResponse.json({ error: "Contact not found" }, { status: 404 });
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
    const allowed = ["status", "name", "notes", "assigned_to", "tags", "campaign", "tier_id", "inactivity_reason"];
    const updates: Record<string, unknown> = {};
    for (const key of allowed) {
      if (key in body) updates[key] = body[key];
    }
    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "No valid fields" }, { status: 400 });
    }

    const callerRole    = request.headers.get("x-auth-user-role");
    const isMasterAdmin = request.headers.get("x-auth-is-master-admin") === "true";
    const callerName    = request.headers.get("x-auth-user-name");

    if (!isMasterAdmin && callerRole === "agent") {
      delete updates.assigned_to;
      delete updates.tier_id;

      const sensitiveFields = ["name", "notes", "tags", "campaign"];
      const touchesSensitive = sensitiveFields.some((f) => f in updates);
      if (touchesSensitive) {
        const supabase = createAdminClient();
        const { data: lead } = await supabase
          .from("leads")
          .select("assigned_to")
          .eq("id", id)
          .single();
        if (!lead?.assigned_to || lead.assigned_to !== callerName) {
          return NextResponse.json(
            { error: "Agents can only edit details of contacts assigned to them" },
            { status: 403 }
          );
        }
      }
    }

    const supabase = createAdminClient();

    // Lifecycle transition logic when status changes
    if ("status" in updates) {
      const newStatus = updates.status as string;
      updates.lifecycle_stage = deriveLifecycle(newStatus);

      if (newStatus === "converted") {
        const { data: existing } = await supabase
          .from("leads")
          .select("client_since")
          .eq("id", id)
          .single();
        if (!existing?.client_since) {
          updates.client_since = new Date().toISOString();
        }
      }

      if (newStatus === "proposal_sent") {
        const { data: existing } = await supabase
          .from("leads")
          .select("proposal_sent_at")
          .eq("id", id)
          .single();
        if (!existing?.proposal_sent_at) {
          updates.proposal_sent_at = new Date().toISOString();
        }
      }

      if (["new", "contacted", "proposal_sent"].includes(newStatus)) {
        updates.inactivity_reason = null;
      }
    }

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
