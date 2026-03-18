import { createAdminClient } from "@/lib/supabase/server";
import type { ParsedMessage } from "./parser";
import type { DbLead, DbMessage } from "@/lib/supabase/types";

export interface UpsertResult {
  lead: DbLead;
  message: DbMessage;
  isNewLead: boolean;
}

export async function upsertLeadAndMessage(
  parsed: ParsedMessage
): Promise<UpsertResult> {
  const supabase = createAdminClient();

  // 1. Find existing lead by phone
  const { data: existingLead, error: findError } = await supabase
    .from("leads")
    .select("*")
    .eq("phone", parsed.phone)
    .maybeSingle();

  if (findError) throw new Error(`DB find lead: ${findError.message}`);

  let lead: DbLead;
  let isNewLead = false;

  if (!existingLead) {
    const { data: newLead, error: insertError } = await supabase
      .from("leads")
      .insert({
        phone: parsed.phone,
        name: parsed.contactName,
        source: "WhatsApp",
        campaign: parsed.campaign,
        status: "new",
        wa_contact_id: parsed.waContactId,
        last_message_at: parsed.timestamp.toISOString(),
      })
      .select("*")
      .single();

    if (insertError || !newLead) {
      throw new Error(`DB insert lead: ${insertError?.message}`);
    }
    lead = newLead as DbLead;
    isNewLead = true;
  } else {
    const updates: Record<string, string | null> = {
      last_message_at: parsed.timestamp.toISOString(),
    };
    const existing = existingLead as DbLead;
    if (!existing.name && parsed.contactName) updates.name = parsed.contactName;
    if (!existing.wa_contact_id) updates.wa_contact_id = parsed.waContactId;
    if (!existing.campaign && parsed.campaign) updates.campaign = parsed.campaign;

    const { data: updatedLead, error: updateError } = await supabase
      .from("leads")
      .update(updates)
      .eq("id", existing.id)
      .select("*")
      .single();

    if (updateError || !updatedLead) {
      throw new Error(`DB update lead: ${updateError?.message}`);
    }
    lead = updatedLead as DbLead;
  }

  // 2. Check for duplicate message (Meta can send duplicates)
  const { data: existingMsg } = await supabase
    .from("messages")
    .select("id")
    .eq("wa_message_id", parsed.waMessageId)
    .maybeSingle();

  let message: DbMessage;

  if (existingMsg) {
    const { data: msg } = await supabase
      .from("messages")
      .select("*")
      .eq("id", (existingMsg as { id: string }).id)
      .single();
    message = msg as DbMessage;
  } else {
    const { data: newMsg, error: msgError } = await supabase
      .from("messages")
      .insert({
        lead_id: lead.id,
        wa_message_id: parsed.waMessageId,
        direction: "inbound",
        type: parsed.type,
        content: parsed.content,
        timestamp: parsed.timestamp.toISOString(),
        status: "delivered",
      })
      .select("*")
      .single();

    if (msgError || !newMsg) {
      throw new Error(`DB insert message: ${msgError?.message}`);
    }
    message = newMsg as DbMessage;
  }

  return { lead, message, isNewLead };
}

export async function recordOutboundMessage({
  leadId,
  content,
  waMessageId,
  senderName,
}: {
  leadId: string;
  content: string;
  waMessageId: string;
  senderName: string;
}): Promise<DbMessage> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("messages")
    .insert({
      lead_id: leadId,
      wa_message_id: waMessageId,
      direction: "outbound",
      type: "text",
      content,
      sender_name: senderName,
      status: "sent",
    })
    .select("*")
    .single();

  if (error || !data) throw new Error(`DB record outbound: ${error?.message}`);

  await supabase
    .from("leads")
    .update({ last_message_at: new Date().toISOString() })
    .eq("id", leadId);

  return data as DbMessage;
}
