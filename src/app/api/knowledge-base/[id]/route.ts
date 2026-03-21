import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createAdminClient();
    const workspaceId = process.env.WORKSPACE_ID;
    if (!workspaceId) return NextResponse.json({ error: "WORKSPACE_ID not set" }, { status: 500 });

    const { id } = await params;

    const { error } = await supabase
      .from("knowledge_base")
      .delete()
      .eq("id", id)
      .eq("workspace_id", workspaceId);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("[DELETE /api/knowledge-base/[id]]", err);
    return NextResponse.json({ error: err?.message ?? "Failed to delete entry" }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createAdminClient();
    const workspaceId = process.env.WORKSPACE_ID;
    if (!workspaceId) return NextResponse.json({ error: "WORKSPACE_ID not set" }, { status: 500 });

    const { id } = await params;
    const body = await request.json();
    const { title, content } = body;

    if (!title?.trim()) return NextResponse.json({ error: "Title is required" }, { status: 400 });
    if (!content?.trim()) return NextResponse.json({ error: "Content is required" }, { status: 400 });

    const { data, error } = await supabase
      .from("knowledge_base")
      .update({ title: title.trim(), content: content.trim() })
      .eq("id", id)
      .eq("workspace_id", workspaceId)
      .select("*")
      .single();

    if (error) throw error;
    return NextResponse.json({ entry: data });
  } catch (err: any) {
    console.error("[PATCH /api/knowledge-base/[id]]", err);
    return NextResponse.json({ error: err?.message ?? "Failed to update entry" }, { status: 500 });
  }
}
