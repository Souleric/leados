import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: leadId } = await params;
    const supabase = createAdminClient();
    const workspaceId = process.env.WORKSPACE_ID;
    if (!workspaceId) return NextResponse.json({ error: "WORKSPACE_ID not set" }, { status: 500 });

    const { data, error } = await supabase
      .from("lead_documents")
      .select("*")
      .eq("lead_id", leadId)
      .eq("workspace_id", workspaceId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return NextResponse.json({ documents: data ?? [] });
  } catch (err: any) {
    console.error("[GET /api/leads/[id]/documents]", err);
    return NextResponse.json({ error: err?.message ?? "Failed to fetch documents" }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: leadId } = await params;
    const supabase = createAdminClient();
    const workspaceId = process.env.WORKSPACE_ID;
    if (!workspaceId) return NextResponse.json({ error: "WORKSPACE_ID not set" }, { status: 500 });

    const body = await request.json();
    const { provider, doc_type, doc_id, doc_number, doc_date, due_date, amount, currency, status, customer_name, doc_url, raw, linked_by } = body;

    if (!provider || !doc_type || !doc_id) {
      return NextResponse.json({ error: "provider, doc_type, and doc_id are required" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("lead_documents")
      .insert({
        workspace_id: workspaceId,
        lead_id: leadId,
        provider,
        doc_type,
        doc_id,
        doc_number: doc_number ?? null,
        doc_date: doc_date ?? null,
        due_date: due_date ?? null,
        amount: amount ?? null,
        currency: currency ?? "MYR",
        status: status ?? null,
        customer_name: customer_name ?? null,
        doc_url: doc_url ?? null,
        raw: raw ?? null,
        linked_by: linked_by ?? null,
      })
      .select("*")
      .single();

    if (error) throw error;
    return NextResponse.json({ document: data }, { status: 201 });
  } catch (err: any) {
    console.error("[POST /api/leads/[id]/documents]", err);
    return NextResponse.json({ error: err?.message ?? "Failed to link document" }, { status: 500 });
  }
}
