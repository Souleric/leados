import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

const MAX_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = ["application/pdf", "image/jpeg", "image/png", "image/webp"];

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: leadId } = await params;
    const supabase = createAdminClient();
    const workspaceId = process.env.WORKSPACE_ID;
    if (!workspaceId) return NextResponse.json({ error: "WORKSPACE_ID not set" }, { status: 500 });

    const formData = await request.formData();
    const doc_type   = formData.get("doc_type") as string;
    const doc_number = formData.get("doc_number") as string | null;
    const doc_date   = formData.get("doc_date") as string | null;
    const due_date   = formData.get("due_date") as string | null;
    const customer_name = formData.get("customer_name") as string | null;
    const amount     = formData.get("amount") as string | null;
    const currency   = (formData.get("currency") as string | null) ?? "MYR";
    const status     = (formData.get("status") as string | null) ?? "Draft";
    const linked_by  = formData.get("linked_by") as string | null;
    const file       = formData.get("file") as File | null;

    if (!doc_type || !["quotation", "invoice"].includes(doc_type)) {
      return NextResponse.json({ error: "doc_type must be quotation or invoice" }, { status: 400 });
    }

    let file_url: string | null = null;

    if (file && file.size > 0) {
      if (file.size > MAX_SIZE) {
        return NextResponse.json({ error: "File too large. Maximum 10MB." }, { status: 400 });
      }
      if (!ALLOWED_TYPES.includes(file.type)) {
        return NextResponse.json({ error: "Only PDF, JPG, PNG files are allowed." }, { status: 400 });
      }

      const ext = file.name.split(".").pop()?.toLowerCase() ?? "pdf";
      const path = `${workspaceId}/${leadId}/${Date.now()}_${doc_type}.${ext}`;
      const arrayBuffer = await file.arrayBuffer();

      const { error: uploadError } = await supabase.storage
        .from("lead-documents")
        .upload(path, arrayBuffer, { contentType: file.type, upsert: false });

      if (uploadError) throw uploadError;

      const { data: signed } = await supabase.storage
        .from("lead-documents")
        .createSignedUrl(path, 60 * 60 * 24 * 365); // 1 year

      file_url = signed?.signedUrl ?? null;
    }

    const { data, error } = await supabase
      .from("lead_documents")
      .insert({
        workspace_id: workspaceId,
        lead_id: leadId,
        provider: "manual",
        doc_type,
        doc_id: `manual_${Date.now()}`,
        doc_number: doc_number || null,
        doc_date: doc_date || null,
        due_date: due_date || null,
        amount: amount ? parseFloat(amount) : null,
        currency,
        status,
        customer_name: customer_name || null,
        doc_url: file_url,
        raw: { file_name: file?.name ?? null },
        linked_by: linked_by || null,
      })
      .select("*")
      .single();

    if (error) throw error;
    return NextResponse.json({ document: data }, { status: 201 });
  } catch (err: any) {
    console.error("[POST /api/leads/[id]/documents/upload]", err);
    return NextResponse.json({ error: err?.message ?? "Upload failed" }, { status: 500 });
  }
}
