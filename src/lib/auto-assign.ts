/**
 * Pure round-robin auto-assignment.
 * Each new lead goes to the next sales person in turn — unaffected by historical lead counts.
 * New sales persons join the rotation and get 1 lead per cycle, same as everyone else.
 */
import { createAdminClient } from "@/lib/supabase/server";

export async function getNextAssignee(workspaceId: string): Promise<string | null> {
  const supabase = createAdminClient();

  // Check if auto-assign is enabled
  const { data: workspace } = await supabase
    .from("workspaces")
    .select("auto_assign_leads, auto_assign_index")
    .eq("id", workspaceId)
    .single();

  if (!workspace?.auto_assign_leads) return null;

  // Get all sales persons sorted by join date (stable order)
  const { data: agents } = await supabase
    .from("team_members")
    .select("name")
    .eq("workspace_id", workspaceId)
    .eq("role", "agent")
    .order("created_at", { ascending: true });

  if (!agents || agents.length === 0) return null;

  const currentIndex = workspace.auto_assign_index ?? 0;
  const assignee = agents[currentIndex % agents.length].name;
  const nextIndex = (currentIndex + 1) % agents.length;

  // Advance the pointer
  await supabase
    .from("workspaces")
    .update({ auto_assign_index: nextIndex })
    .eq("id", workspaceId);

  return assignee;
}
