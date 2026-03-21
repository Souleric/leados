import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; docId: string }> }
) {
  try {
    const { id: leadId, docId } = await params;
    const supabase = createAdminClient();
    const workspaceId = process.env.WORKSPACE_ID;
    if (!workspaceId) return NextResponse.json({ error: "WORKSPACE_ID not set" }, { status: 500 });

    const { error } = await supabase
      .from("lead_documents")
      .delete()
      .eq("id", docId)
      .eq("lead_id", leadId)
      .eq("workspace_id", workspaceId);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("[DELETE /api/leads/[id]/documents/[docId]]", err);
    return NextResponse.json({ error: err?.message ?? "Failed to unlink document" }, { status: 500 });
  }
}
