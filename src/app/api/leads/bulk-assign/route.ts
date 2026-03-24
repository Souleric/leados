/**
 * POST /api/leads/bulk-assign
 * Distributes all currently unassigned leads equally across sales persons (round-robin).
 */
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

export async function POST() {
  try {
    const supabase = createAdminClient();
    const workspaceId = process.env.WORKSPACE_ID;
    if (!workspaceId) return NextResponse.json({ error: "WORKSPACE_ID not set" }, { status: 500 });

    // Get all sales persons sorted by join date
    const { data: agents } = await supabase
      .from("team_members")
      .select("name")
      .eq("workspace_id", workspaceId)
      .eq("role", "agent")
      .order("created_at", { ascending: true });

    if (!agents || agents.length === 0) {
      return NextResponse.json({ error: "No sales persons found. Add sales persons first." }, { status: 400 });
    }

    // Get all unassigned leads
    const { data: leads } = await supabase
      .from("leads")
      .select("id")
      .eq("workspace_id", workspaceId)
      .is("assigned_to", null)
      .order("created_at", { ascending: true });

    if (!leads || leads.length === 0) {
      return NextResponse.json({ assigned: 0, message: "No unassigned leads found." });
    }

    // Round-robin distribute
    let assigned = 0;
    for (let i = 0; i < leads.length; i++) {
      const assignee = agents[i % agents.length].name;
      await supabase
        .from("leads")
        .update({ assigned_to: assignee })
        .eq("id", leads[i].id);
      assigned++;
    }

    // Update the round-robin pointer to continue from where we left off
    const nextIndex = leads.length % agents.length;
    await supabase
      .from("workspaces")
      .update({ auto_assign_index: nextIndex })
      .eq("id", workspaceId);

    return NextResponse.json({
      assigned,
      message: `${assigned} lead${assigned !== 1 ? "s" : ""} assigned equally across ${agents.length} sales person${agents.length !== 1 ? "s" : ""}.`,
    });
  } catch (err: any) {
    console.error("[POST /api/leads/bulk-assign]", err);
    return NextResponse.json({ error: err?.message ?? "Failed" }, { status: 500 });
  }
}
