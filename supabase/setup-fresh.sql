-- ============================================================
--  LeadOS — FRESH SETUP (single consolidated script)
--  Reconstructed from application code on 2026-06-09 because the
--  original Supabase project was deleted and the repo .sql files
--  were missing columns added via dashboard migrations.
--
--  HOW TO RUN:
--    1. Create a NEW Supabase project (new account).
--    2. Open SQL Editor → New query → paste this whole file → Run.
--    3. Then create your admin user (see supabase/MIGRATION.md step 5).
--    4. Create a PRIVATE Storage bucket named  lead-documents
--       (Dashboard → Storage → New bucket). Code uploads docs there.
--
--  Idempotent: safe to re-run. Uses the SAME workspace id as before
--  (80d301e3-...) so your existing WORKSPACE_ID env var still matches.
-- ============================================================

create extension if not exists "uuid-ossp";

-- ── shared updated_at trigger fn ─────────────────────────────
create or replace function public.handle_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ============================================================
-- WORKSPACES
-- ============================================================
create table if not exists public.workspaces (
  id                        uuid primary key default uuid_generate_v4(),
  name                      text not null,
  slug                      text unique,
  owner_email               text,
  logo_url                  text,
  timezone                  text default 'Asia/Kuala_Lumpur',

  meta_app_id               text,
  meta_phone_number_id      text,
  meta_waba_id              text,
  meta_access_token         text,
  meta_webhook_verify_token text,
  meta_phone_display        text,
  meta_business_name        text,

  meta_ad_account_id        text,
  meta_ads_access_token     text,

  meta_connected            boolean default false,
  meta_connected_at         timestamptz,

  -- round-robin lead assignment (was MISSING from repo schema files)
  auto_assign_leads         boolean default false,
  auto_assign_index         integer default 0,

  created_at                timestamptz not null default now(),
  updated_at                timestamptz not null default now()
);

-- ============================================================
-- TEAM MEMBERS  (auth lives here — custom cookie auth)
-- ============================================================
create table if not exists public.team_members (
  id             uuid primary key default uuid_generate_v4(),
  workspace_id   uuid not null references public.workspaces(id) on delete cascade,
  name           text not null,
  email          text,
  role           text default 'agent' check (role in ('admin','agent','viewer')),
  avatar_color   text default '#7c3aed',
  status         text default 'offline' check (status in ('online','offline','busy')),
  -- the three auth columns that were MISSING from repo schema files:
  username       text,
  password_hash  text,
  is_master_admin boolean not null default false,
  created_at     timestamptz not null default now()
);
-- case-insensitive unique username per workspace (login uses ilike)
create unique index if not exists team_members_ws_username_uidx
  on public.team_members (workspace_id, lower(username));

-- ============================================================
-- MEMBERSHIP TIERS
-- ============================================================
create table if not exists public.membership_tiers (
  id           uuid primary key default uuid_generate_v4(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  name         text not null,
  color        text not null default '#6366f1',
  sort_order   integer not null default 0,
  created_at   timestamptz not null default now()
);

-- ============================================================
-- LEADS  (final shape, post all migrations folded in)
-- ============================================================
create table if not exists public.leads (
  id              uuid primary key default uuid_generate_v4(),
  workspace_id    uuid references public.workspaces(id) on delete cascade,
  phone           text not null unique,
  name            text,
  source          text default 'WhatsApp',
  campaign        text,
  status          text not null default 'new'
                  check (status in ('new','contacted','proposal_sent','converted','inactive')),
  lifecycle_stage text not null default 'active_lead'
                  check (lifecycle_stage in ('active_lead','client','inactive_lead')),
  tier_id         uuid references public.membership_tiers(id) on delete set null,
  assigned_to     text,
  tags            text[] default '{}',
  notes           text default '',
  wa_contact_id   text,
  proposal_sent_at  timestamptz,
  inactivity_reason text,
  client_since      timestamptz,
  last_message_at timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- ============================================================
-- MESSAGES
-- ============================================================
create table if not exists public.messages (
  id            uuid primary key default uuid_generate_v4(),
  workspace_id  uuid references public.workspaces(id) on delete cascade,
  lead_id       uuid not null references public.leads(id) on delete cascade,
  wa_message_id text unique,
  direction     text not null check (direction in ('inbound','outbound')),
  type          text not null default 'text'
                check (type in ('text','image','audio','document','template','interactive','unknown')),
  content       text not null,
  media_url     text,
  status        text default 'delivered' check (status in ('sent','delivered','read','failed')),
  sender_name   text,
  timestamp     timestamptz not null default now(),
  created_at    timestamptz not null default now()
);

-- ============================================================
-- CAMPAIGNS  (composite unique for per-workspace upsert)
-- ============================================================
create table if not exists public.campaigns (
  id                uuid primary key default uuid_generate_v4(),
  workspace_id      uuid references public.workspaces(id) on delete cascade,
  name              text not null,
  platform          text default 'Facebook'
                    check (platform in ('Facebook','Instagram','Google','Other')),
  objective         text,
  status            text default 'active' check (status in ('active','paused','ended')),
  spend             numeric(10,2) default 0,
  impressions       integer default 0,
  reach             integer default 0,
  frequency         numeric(6,2),
  clicks            integer default 0,
  leads_count       integer default 0,
  cpl               numeric(10,2),
  cpm               numeric(10,2),
  cpc               numeric(10,2),
  meta_campaign_id  text,
  start_date        date,
  end_date          date,
  last_synced_at    timestamptz,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  unique (meta_campaign_id, workspace_id)
);

-- ============================================================
-- INTEGRATIONS  (AutoCount / Bukku)
-- ============================================================
create table if not exists public.integrations (
  id           uuid primary key default uuid_generate_v4(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  provider     text not null check (provider in ('autocount_cloud','autocount_aotg','bukku')),
  config       jsonb not null default '{}',
  is_active    boolean not null default false,
  connected_at timestamptz,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  unique (workspace_id, provider)
);

-- ============================================================
-- LEAD DOCUMENTS  (quotes/invoices linked from accounting + uploads)
-- ============================================================
create table if not exists public.lead_documents (
  id            uuid primary key default uuid_generate_v4(),
  workspace_id  uuid not null references public.workspaces(id) on delete cascade,
  lead_id       uuid not null references public.leads(id) on delete cascade,
  provider      text not null,
  doc_type      text not null check (doc_type in ('quotation','invoice')),
  doc_id        text not null,
  doc_number    text,
  doc_date      text,
  due_date      text,
  amount        numeric(14,2),
  currency      text default 'MYR',
  status        text,
  customer_name text,
  doc_url       text,
  raw           jsonb,
  linked_by     text,
  created_at    timestamptz not null default now()
);

-- ============================================================
-- KNOWLEDGE BASE
-- ============================================================
create table if not exists public.knowledge_base (
  id           uuid primary key default uuid_generate_v4(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  title        text not null,
  content      text not null,
  source_type  text not null default 'manual' check (source_type in ('manual','file')),
  file_name    text,
  file_url     text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- ============================================================
-- INDEXES
-- ============================================================
create index if not exists workspaces_slug_idx        on public.workspaces(slug);
create index if not exists team_workspace_idx         on public.team_members(workspace_id);
create index if not exists leads_phone_idx            on public.leads(phone);
create index if not exists leads_status_idx           on public.leads(status);
create index if not exists leads_created_at_idx       on public.leads(created_at desc);
create index if not exists leads_workspace_id_idx     on public.leads(workspace_id);
create index if not exists messages_lead_id_idx       on public.messages(lead_id);
create index if not exists messages_timestamp_idx     on public.messages(timestamp desc);
create index if not exists messages_wa_id_idx         on public.messages(wa_message_id);
create index if not exists campaigns_workspace_id_idx on public.campaigns(workspace_id);
create index if not exists integrations_workspace_idx on public.integrations(workspace_id);
create index if not exists lead_documents_lead_idx    on public.lead_documents(lead_id);
create index if not exists lead_documents_workspace_idx on public.lead_documents(workspace_id);
create index if not exists kb_workspace_idx           on public.knowledge_base(workspace_id);
create index if not exists kb_created_at_idx          on public.knowledge_base(created_at desc);

-- ============================================================
-- updated_at TRIGGERS
-- ============================================================
drop trigger if exists workspaces_updated_at on public.workspaces;
create trigger workspaces_updated_at before update on public.workspaces
  for each row execute function public.handle_updated_at();

drop trigger if exists leads_updated_at on public.leads;
create trigger leads_updated_at before update on public.leads
  for each row execute function public.handle_updated_at();

drop trigger if exists integrations_updated_at on public.integrations;
create trigger integrations_updated_at before update on public.integrations
  for each row execute function public.handle_updated_at();

drop trigger if exists knowledge_base_updated_at on public.knowledge_base;
create trigger knowledge_base_updated_at before update on public.knowledge_base
  for each row execute function public.handle_updated_at();

-- ============================================================
-- ANALYTICS VIEWS  (status filters updated to current values)
-- ============================================================
create or replace view public.leads_per_day as
  select date_trunc('day', created_at)::date as date,
         count(*)                                                        as total,
         count(*) filter (where status in ('contacted','proposal_sent','converted')) as qualified,
         count(*) filter (where status = 'converted')                    as closed
  from public.leads
  group by 1 order by 1 desc;

create or replace view public.leads_per_source as
  select source, count(*) as total
  from public.leads
  group by source order by total desc;

-- ============================================================
-- ROW LEVEL SECURITY  (service-role key bypasses RLS; on for safety)
-- ============================================================
alter table public.workspaces      enable row level security;
alter table public.team_members    enable row level security;
alter table public.membership_tiers enable row level security;
alter table public.leads           enable row level security;
alter table public.messages        enable row level security;
alter table public.campaigns       enable row level security;
alter table public.integrations    enable row level security;
alter table public.lead_documents  enable row level security;
alter table public.knowledge_base  enable row level security;

-- ============================================================
-- SEED: workspace (REUSES the old WORKSPACE_ID so env stays valid)
-- ============================================================
insert into public.workspaces (id, name, slug, owner_email, meta_webhook_verify_token)
values ('80d301e3-6f64-43d5-968b-d9bfdb08788f',
        'LeadOS', 'leados', 'ericcheah@betasocial.my',
        'change-this-to-a-random-secret')
on conflict (id) do nothing;

-- SEED: a default membership tier
insert into public.membership_tiers (workspace_id, name, color, sort_order)
values ('80d301e3-6f64-43d5-968b-d9bfdb08788f', 'Basic Member', '#6366f1', 0)
on conflict do nothing;

-- ============================================================
--  NEXT: create your admin login. DO NOT hardcode a password here.
--  Run:   node scripts/make-admin.mjs <username> <password>
--  and paste the INSERT it prints. (See supabase/MIGRATION.md step 5.)
-- ============================================================
