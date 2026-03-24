/**
 * Returns the name of the sales person (role=agent) with the fewest assigned leads.
 * Used for round-robin equal distribution when auto_assign_leads is enabled.
 */
import { createAdminClient } from "@/lib/supabase/server";

export async function getNextAssignee(workspaceId: string): Promise<string | null> {
  const supabase = createAdminClient();

  // Check if auto-assign is enabled
  const { data: workspace } = await supabase
    .from("workspaces")
    .select("auto_assign_leads")
    .eq("id", workspaceId)
    .single();

  if (!workspace?.auto_assign_leads) return null;

  // Get all sales persons (role=agent)
  const { data: agents } = await supabase
    .from("team_members")
    .select("name")
    .eq("workspace_id", workspaceId)
    .eq("role", "agent");

  if (!agents || agents.length === 0) return null;

  // Count current assigned leads per agent
  const { data: leads } = await supabase
    .from("leads")
    .select("assigned_to")
    .eq("workspace_id", workspaceId)
    .not("assigned_to", "is", null);

  const countMap: Record<string, number> = {};
  for (const agent of agents) {
    countMap[agent.name] = 0;
  }
  for (const lead of leads ?? []) {
    if (lead.assigned_to && countMap[lead.assigned_to] !== undefined) {
      countMap[lead.assigned_to]++;
    }
  }

  // Pick the agent with the fewest leads
  return agents.reduce((min, agent) =>
    (countMap[agent.name] ?? 0) < (countMap[min.name] ?? 0) ? agent : min
  ).name;
}
