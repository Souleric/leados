import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = createAdminClient();
    const workspaceId = process.env.WORKSPACE_ID;
    if (!workspaceId) return NextResponse.json({ error: "WORKSPACE_ID not set" }, { status: 500 });

    const { data, error } = await supabase
      .from("knowledge_base")
      .select("id, title, content, source_type, file_name, file_url, created_at")
      .eq("workspace_id", workspaceId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return NextResponse.json({ entries: data ?? [] });
  } catch (err: any) {
    console.error("[GET /api/knowledge-base]", err);
    return NextResponse.json({ error: err?.message ?? "Failed to fetch knowledge base" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createAdminClient();
    const workspaceId = process.env.WORKSPACE_ID;
    if (!workspaceId) return NextResponse.json({ error: "WORKSPACE_ID not set" }, { status: 500 });

    const body = await request.json();
    const { title, content, source_type = "manual", file_name, file_url } = body;

    if (!title?.trim()) return NextResponse.json({ error: "Title is required" }, { status: 400 });
    if (!content?.trim()) return NextResponse.json({ error: "Content is required" }, { status: 400 });

    const { data, error } = await supabase
      .from("knowledge_base")
      .insert({
        workspace_id: workspaceId,
        title: title.trim(),
        content: content.trim(),
        source_type,
        file_name: file_name ?? null,
        file_url: file_url ?? null,
      })
      .select("*")
      .single();

    if (error) throw error;
    return NextResponse.json({ entry: data }, { status: 201 });
  } catch (err: any) {
    console.error("[POST /api/knowledge-base]", err);
    return NextResponse.json({ error: err?.message ?? "Failed to create entry" }, { status: 500 });
  }
}
