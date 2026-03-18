import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { recordOutboundMessage } from "@/lib/whatsapp/lead-service";
import { sendWhatsAppMessage } from "@/lib/whatsapp/sender";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("messages")
      .select("*")
      .eq("lead_id", id)
      .order("timestamp", { ascending: true });

    if (error) throw error;
    return NextResponse.json({ messages: data });
  } catch (err) {
    console.error("[GET /api/leads/[id]/messages]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const body = await request.json();
    const { content, senderName } = body;

    if (!content?.trim()) {
      return NextResponse.json({ error: "content is required" }, { status: 400 });
    }

    const supabase = createAdminClient();
    const { data: lead, error: leadError } = await supabase
      .from("leads")
      .select("phone")
      .eq("id", id)
      .single();

    if (leadError || !lead) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    }

    const { messageId } = await sendWhatsAppMessage({
      to: (lead as { phone: string }).phone,
      text: content,
    });

    const message = await recordOutboundMessage({
      leadId: id,
      content,
      waMessageId: messageId,
      senderName: senderName ?? "Agent",
    });

    return NextResponse.json({ message }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/leads/[id]/messages]", err);
    return NextResponse.json({ error: "Failed to send message" }, { status: 500 });
  }
}
