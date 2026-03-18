/**
 * Meta Graph API — send outbound WhatsApp messages.
 * Docs: https://developers.facebook.com/docs/whatsapp/cloud-api/messages
 */

interface SendResult {
  messageId: string;
}

/**
 * Send a plain text message via WhatsApp Cloud API.
 */
export async function sendWhatsAppMessage({
  to,
  text,
}: {
  to: string;
  text: string;
}): Promise<SendResult> {
  const token = process.env.META_WHATSAPP_TOKEN;
  const phoneNumberId = process.env.META_PHONE_NUMBER_ID;

  if (!token || !phoneNumberId) {
    throw new Error("META_WHATSAPP_TOKEN or META_PHONE_NUMBER_ID not set");
  }

  // Normalize: remove + for Meta API
  const recipient = to.replace(/^\+/, "");

  const url = `https://graph.facebook.com/v19.0/${phoneNumberId}/messages`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: recipient,
      type: "text",
      text: {
        preview_url: false,
        body: text,
      },
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(
      `Meta API error ${response.status}: ${JSON.stringify(err)}`
    );
  }

  const data = await response.json();
  const messageId: string = data.messages?.[0]?.id ?? `local_${Date.now()}`;

  return { messageId };
}

/**
 * Send a template message (for re-engaging 24h+ inactive leads).
 * You must have approved templates in your Meta WABA.
 */
export async function sendTemplateMessage({
  to,
  templateName,
  languageCode = "en_US",
  components = [],
}: {
  to: string;
  templateName: string;
  languageCode?: string;
  components?: unknown[];
}): Promise<SendResult> {
  const token = process.env.META_WHATSAPP_TOKEN;
  const phoneNumberId = process.env.META_PHONE_NUMBER_ID;

  if (!token || !phoneNumberId) {
    throw new Error("META_WHATSAPP_TOKEN or META_PHONE_NUMBER_ID not set");
  }

  const recipient = to.replace(/^\+/, "");
  const url = `https://graph.facebook.com/v19.0/${phoneNumberId}/messages`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to: recipient,
      type: "template",
      template: {
        name: templateName,
        language: { code: languageCode },
        components,
      },
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(`Meta API error ${response.status}: ${JSON.stringify(err)}`);
  }

  const data = await response.json();
  return { messageId: data.messages?.[0]?.id ?? `local_${Date.now()}` };
}
