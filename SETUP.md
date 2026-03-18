# LeadOS — Backend Setup Guide

## 1. Supabase Setup

### Create project
1. Go to https://supabase.com → New Project
2. Save your Project URL and keys (Settings → API)

### Run schema
1. Supabase Dashboard → SQL Editor → New Query
2. Paste contents of `supabase/schema.sql` → Run

### Copy env vars
```bash
cp .env.local.example .env.local
```
Fill in:
```
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

---

## 2. Meta WhatsApp Business API Setup

### Step 1 — Create Meta Developer App
1. Go to https://developers.facebook.com
2. Create App → Business type
3. Add "WhatsApp" product to your app

### Step 2 — Get credentials
- **Phone Number ID** — WhatsApp → API Setup → Phone Number ID
- **WhatsApp Access Token** — Generate a permanent token via System User
  - Business Settings → System Users → Add System User
  - Assign WhatsApp permission → Generate Token

Fill in `.env.local`:
```
META_WHATSAPP_TOKEN=EAAx...
META_PHONE_NUMBER_ID=123456789
META_WEBHOOK_VERIFY_TOKEN=my-random-secret-abc123  ← you choose this
```

### Step 3 — Register webhook
1. Deploy your app to Vercel/Railway/etc (or use ngrok for local dev)
2. WhatsApp → Configuration → Webhook
3. Callback URL: `https://your-domain.com/api/webhook/whatsapp`
4. Verify Token: same value as `META_WEBHOOK_VERIFY_TOKEN`
5. Click Verify and Save
6. Subscribe to: **messages** field

### Step 4 — Test with ngrok (local dev)
```bash
# Install ngrok: https://ngrok.com
ngrok http 3000

# Use the https URL as your webhook callback
# e.g. https://abc123.ngrok.io/api/webhook/whatsapp
```

---

## 3. Webhook Payload Reference

When a user sends "Hello" to your WhatsApp number, Meta sends:

```json
{
  "object": "whatsapp_business_account",
  "entry": [{
    "id": "YOUR_WABA_ID",
    "changes": [{
      "value": {
        "messaging_product": "whatsapp",
        "metadata": {
          "display_phone_number": "601X-XXXXXXX",
          "phone_number_id": "YOUR_PHONE_NUMBER_ID"
        },
        "contacts": [{
          "profile": { "name": "Ahmad Faizal" },
          "wa_id": "60123456789"
        }],
        "messages": [{
          "from": "60123456789",
          "id": "wamid.XXXX",
          "timestamp": "1710000000",
          "type": "text",
          "text": { "body": "Hello, I need a quote" }
        }]
      },
      "field": "messages"
    }]
  }]
}
```

**Click-to-WhatsApp ad payload** also includes:
```json
"referral": {
  "source_url": "https://fb.com/ads/...",
  "headline": "Roofing Campaign March",
  "body": "Get a free quote",
  "source_type": "ad"
}
```
→ `headline` is saved as `campaign` on the lead.

---

## 4. API Routes Reference

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/webhook/whatsapp` | Meta webhook verification |
| POST | `/api/webhook/whatsapp` | Receive incoming messages |
| GET | `/api/leads` | List leads (filter: status, source, q) |
| POST | `/api/leads` | Create lead manually |
| GET | `/api/leads/[id]` | Get single lead |
| PATCH | `/api/leads/[id]` | Update lead (status, notes, tags...) |
| GET | `/api/leads/[id]/messages` | Get conversation history |
| POST | `/api/leads/[id]/messages` | Send outbound WhatsApp message |
| GET | `/api/analytics` | Dashboard KPIs from DB views |

---

## 5. Message Flow

```
User sends WhatsApp message
        ↓
Meta WebhookAPI
        ↓
POST /api/webhook/whatsapp
        ↓
parseWebhookPayload()      ← extracts phone, name, content, campaign
        ↓
upsertLeadAndMessage()
    ├── phone exists? → use existing lead, update last_message_at
    └── new phone?   → create lead (status: "new")
        ↓
Insert message row (wa_message_id ensures dedup)
        ↓
Dashboard shows new lead ✓
```

---

## 6. Sending Messages (24-hour window)

WhatsApp only allows free-form messages within **24 hours** of the last customer message.
After 24h, you must use an approved **Template Message**.

```ts
// Within 24h — free text
await sendWhatsAppMessage({ to: "+60123456789", text: "Hello!" });

// After 24h — template required
await sendTemplateMessage({
  to: "+60123456789",
  templateName: "follow_up_v1",
  languageCode: "en_US",
  components: [{
    type: "body",
    parameters: [{ type: "text", text: "Ahmad" }]
  }]
});
```

---

## 7. Vercel Deployment

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Set env vars
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
vercel env add SUPABASE_SERVICE_ROLE_KEY
vercel env add META_WEBHOOK_VERIFY_TOKEN
vercel env add META_WHATSAPP_TOKEN
vercel env add META_PHONE_NUMBER_ID
```
