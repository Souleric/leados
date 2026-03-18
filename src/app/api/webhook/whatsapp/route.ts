/**
 * POST /api/webhook/whatsapp  — receives incoming WhatsApp messages
 * GET  /api/webhook/whatsapp  — Meta webhook verification (hub.challenge)
 *
 * Set this URL in Meta Developer Console:
 *   Callback URL: https://your-domain.com/api/webhook/whatsapp
 *   Verify Token: value of META_WEBHOOK_VERIFY_TOKEN env var
 */
import { NextRequest, NextResponse } from "next/server";
import { parseWebhookPayload, type MetaWebhookPayload } from "@/lib/whatsapp/parser";
import { upsertLeadAndMessage } from "@/lib/whatsapp/lead-service";

// ── GET — Meta webhook verification ──────────────────────────────────────────
// Meta sends a GET with hub.challenge when you register/update the webhook.
// We must echo back hub.challenge to confirm ownership.
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const mode      = searchParams.get("hub.mode");
  const token     = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  const verifyToken = process.env.META_WEBHOOK_VERIFY_TOKEN;

  if (!verifyToken) {
    console.error("[webhook] META_WEBHOOK_VERIFY_TOKEN not set");
    return new NextResponse("Server misconfigured", { status: 500 });
  }

  if (mode === "subscribe" && token === verifyToken) {
    console.log("[webhook] Webhook verified ✓");
    // Must return the challenge as plain text with 200
    return new NextResponse(challenge, { status: 200 });
  }

  console.warn("[webhook] Verification failed — token mismatch or wrong mode");
  return new NextResponse("Forbidden", { status: 403 });
}

// ── POST — Incoming WhatsApp messages ────────────────────────────────────────
export async function POST(request: NextRequest) {
  // 1. Parse body
  let body: MetaWebhookPayload;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // 2. Quick acknowledgement — Meta expects 200 within 5s or will retry
  //    We kick off processing async and return immediately.
  //    For production at scale, push to a queue (e.g. Upstash QStash) instead.
  processWebhook(body).catch((err) => {
    console.error("[webhook] Processing error:", err);
  });

  return NextResponse.json({ status: "ok" }, { status: 200 });
}

async function processWebhook(body: MetaWebhookPayload) {
  // 3. Extract messages from payload
  const parsed = parseWebhookPayload(body);

  if (parsed.length === 0) {
    // Could be a status update (delivered/read receipts) — nothing to store
    return;
  }

  // 4. Process each message
  for (const msg of parsed) {
    try {
      const { lead, isNewLead } = await upsertLeadAndMessage(msg);
      console.log(
        `[webhook] ${isNewLead ? "NEW" : "EXISTING"} lead ${lead.id} | ${lead.phone} | msg: "${msg.content.slice(0, 60)}"`
      );
    } catch (err) {
      console.error(`[webhook] Failed to upsert lead for ${msg.phone}:`, err);
    }
  }
}
