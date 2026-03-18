/**
 * Meta WhatsApp Business API — webhook payload parser.
 *
 * Example full payload:
 * {
 *   "object": "whatsapp_business_account",
 *   "entry": [{
 *     "id": "WABA_ID",
 *     "changes": [{
 *       "value": {
 *         "messaging_product": "whatsapp",
 *         "metadata": { "display_phone_number": "601...", "phone_number_id": "..." },
 *         "contacts": [{ "profile": { "name": "Ahmad Faizal" }, "wa_id": "60123456789" }],
 *         "messages": [{
 *           "from": "60123456789",
 *           "id": "wamid.xxx",
 *           "timestamp": "1710000000",
 *           "type": "text",
 *           "text": { "body": "Hello, I need a quote" }
 *         }]
 *       },
 *       "field": "messages"
 *     }]
 *   }]
 * }
 */

export type MessageType = "text" | "image" | "audio" | "document" | "template" | "interactive" | "unknown";

export interface ParsedMessage {
  /** Raw Meta message ID — used for deduplication */
  waMessageId: string;
  /** Phone in E.164 format, prefixed with + e.g. +60123456789 */
  phone: string;
  /** Contact display name from WhatsApp profile */
  contactName: string | null;
  /** wa_id from Meta (same as phone without +) */
  waContactId: string;
  /** Message body text */
  content: string;
  /** Raw Unix timestamp from Meta */
  timestamp: Date;
  /** Message type */
  type: MessageType;
  /** Referral source (if user clicked a Click-to-WhatsApp ad) */
  referralSource: string | null;
  /** Campaign name from referral headline */
  campaign: string | null;
}

export interface MetaWebhookPayload {
  object: string;
  entry: Array<{
    id: string;
    changes: Array<{
      value: {
        messaging_product: string;
        metadata: { display_phone_number: string; phone_number_id: string };
        contacts?: Array<{ profile: { name: string }; wa_id: string }>;
        messages?: Array<MetaMessage>;
        statuses?: Array<MetaStatus>;
      };
      field: string;
    }>;
  }>;
}

interface MetaMessage {
  from: string;
  id: string;
  timestamp: string;
  type: string;
  text?: { body: string };
  image?: { caption?: string; mime_type: string; sha256: string; id: string };
  audio?: { mime_type: string; sha256: string; id: string; voice?: boolean };
  document?: { caption?: string; filename?: string; mime_type: string; sha256: string; id: string };
  interactive?: { type: string; button_reply?: { id: string; title: string }; list_reply?: { id: string; title: string } };
  referral?: { source_url: string; source_id: string; source_type: string; headline: string; body: string; media_type: string };
  context?: { from: string; id: string };
}

interface MetaStatus {
  id: string;
  recipient_id: string;
  status: string;
  timestamp: string;
}

/**
 * Extract all inbound messages from a webhook payload.
 * Returns empty array if payload is a status update or malformed.
 */
export function parseWebhookPayload(payload: MetaWebhookPayload): ParsedMessage[] {
  const results: ParsedMessage[] = [];

  if (payload.object !== "whatsapp_business_account") return results;

  for (const entry of payload.entry ?? []) {
    for (const change of entry.changes ?? []) {
      if (change.field !== "messages") continue;

      const value = change.value;
      const messages = value.messages ?? [];
      const contacts = value.contacts ?? [];

      for (const msg of messages) {
        // Build a contact name lookup map
        const contactMap: Record<string, string> = {};
        for (const c of contacts) {
          contactMap[c.wa_id] = c.profile?.name ?? "";
        }

        const phone = normalizePhone(msg.from);
        const waContactId = msg.from;
        const contactName = contactMap[msg.from] ?? null;
        const timestamp = new Date(parseInt(msg.timestamp, 10) * 1000);
        const type = parseType(msg.type);
        const content = extractContent(msg);
        const referralSource = msg.referral?.source_url ?? null;
        const campaign = msg.referral?.headline ?? null;

        results.push({
          waMessageId: msg.id,
          phone,
          contactName,
          waContactId,
          content,
          timestamp,
          type,
          referralSource,
          campaign,
        });
      }
    }
  }

  return results;
}

function normalizePhone(raw: string): string {
  // Meta sends without + prefix: "60123456789" → "+60123456789"
  const digits = raw.replace(/\D/g, "");
  return `+${digits}`;
}

function parseType(raw: string): MessageType {
  const allowed: MessageType[] = ["text", "image", "audio", "document", "template", "interactive"];
  return allowed.includes(raw as MessageType) ? (raw as MessageType) : "unknown";
}

function extractContent(msg: MetaMessage): string {
  switch (msg.type) {
    case "text":
      return msg.text?.body ?? "";
    case "image":
      return msg.image?.caption ?? "[Image]";
    case "audio":
      return msg.audio?.voice ? "[Voice Message]" : "[Audio]";
    case "document":
      return msg.document?.caption ?? msg.document?.filename ?? "[Document]";
    case "interactive":
      if (msg.interactive?.button_reply) return `[Button: ${msg.interactive.button_reply.title}]`;
      if (msg.interactive?.list_reply) return `[List: ${msg.interactive.list_reply.title}]`;
      return "[Interactive]";
    default:
      return `[${msg.type}]`;
  }
}
