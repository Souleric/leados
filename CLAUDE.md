# LeadOS — Claude Instructions

## Project Overview
LeadOS is a Sales CRM web app built with Next.js 15 (App Router), Supabase, and Tailwind CSS. Deployed on Vercel at https://leados-seven.vercel.app.

## Tech Stack
- **Framework**: Next.js 15 (App Router, Turbopack)
- **Database**: Supabase (PostgreSQL via REST API)
- **Styling**: Tailwind CSS with custom design tokens
- **Auth**: Custom cookie-based auth (not Supabase Auth)
- **Deployment**: Vercel (auto-deploys from GitHub `main` branch)
- **Repo**: https://github.com/Souleric/leados

## Key Rules
- TypeScript strict mode (`noImplicitAny`) — always add explicit types, especially on `fetch()` responses and route handlers
- Never use `middleware.ts` — it's deprecated in this Next.js version; auth is handled via API route checks
- Always run `git push origin main` after commits — Vercel auto-deploys from main
- Workspace ID (single-tenant for now): `4f27de89-0d1f-4ff0-bd6b-5a2463da0719` — stored in `WORKSPACE_ID` env var
- All credentials are in `/Users/ericcheah/Antigravity/LeadOS/PROJECT-CREDENTIALS.txt` (gitignored)

## Current Feature State (as of 2026-03-24)

### Leads
- List view with search, filter by status/source, pagination
- Per-row delete button (trash icon on hover)
- Add lead manually (modal)
- Lead detail page: contact info, status, notes, documents, assigned agent
- **Google Sheet Sync**: reads 6 fields (full_name, phone, email, property_type, average_tnb_bill_per_month, address) — button on leads page, URL saved in localStorage. New phones → create lead; existing phones → update name/notes only.

### Campaigns
- Syncs from Meta Ads API (Facebook/Instagram only — TikTok removed)
- Falls back to demo data when no real campaigns exist
- CSV leads export per campaign or all campaigns
- Source: Facebook, Instagram (no TikTok)

### Settings → Business (Danger Zone)
- "Delete All Leads" button with confirm step

### Messaging
- WhatsApp panel removed from lead detail page
- Replaced with Activity Log + Messaging Channels (Messenger, IG DM, WhatsApp all "Coming soon")
- Sidebar subtitle changed from "WhatsApp CRM" → "Sales CRM"

### Planned / Coming Soon
- Facebook Messenger integration (Meta Graph API webhooks)
- Instagram DM integration (same webhook, different object type)
- Auto-scheduled Google Sheet sync (cron job)
- WhatsApp Business API (when client has WA Business account)

## Design Theme
- Investio-style financial dashboard aesthetic
- Light mode: white sidebar (`bg-white`), `slate-600` inactive nav text
- Dark mode: dark navy sidebar (`#0D1526`)
- Primary blue: `#1E6FEB`
- Background: `#F2F4F8` (light), dark neutral
- Border radius: `0.75rem`

## API Routes Summary
| Route | Method | Purpose |
|---|---|---|
| `/api/leads` | GET, POST | List / create leads |
| `/api/leads/[id]` | GET, PATCH, DELETE | Get / update / delete lead |
| `/api/leads/delete-all` | DELETE | Wipe all leads (demo reset) |
| `/api/leads/sync-gsheet` | POST | Sync leads from Google Sheet |
| `/api/campaigns` | GET | List campaigns |
| `/api/campaigns/sync` | POST | Sync campaigns from Meta Ads |
| `/api/campaigns/leads-export` | GET | Download leads CSV from Meta |
| `/api/settings/workspace` | GET, PATCH | Workspace settings |
| `/api/auth/me` | GET | Current user |
| `/api/auth/logout` | POST | Sign out |
| `/api/team` | GET | Team members |

## Database Schema Files
- `supabase/schema.sql` — leads, messages, campaigns tables
- `supabase/schema-workspaces.sql` — workspaces, team_members tables
- `supabase/schema-integrations.sql` — integrations table
- `supabase/schema-knowledge-base.sql` — knowledge base table

## Common Gotchas
- `fetch()` results need explicit `Response` type annotation: `const res: Response = await fetch(url)`
- Route params in Next.js 15 are Promises: `const { id } = await params`
- Google Sheet sync uses `onConflict: "phone"` for upsert deduplication
- The `phone` column in leads table has a UNIQUE constraint
