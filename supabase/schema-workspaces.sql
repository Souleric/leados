-- ============================================================
-- LeadOS — Multi-tenant Workspace Schema
-- Run AFTER schema.sql
-- ============================================================

-- ── WORKSPACES ───────────────────────────────────────────────
create table if not exists public.workspaces (
  id                        uuid primary key default uuid_generate_v4(),
  name                      text not null,
  slug                      text unique,                     -- url-safe identifier
  owner_email               text,
  logo_url                  text,
  timezone                  text default 'Asia/Kuala_Lumpur',

  -- Meta / WhatsApp credentials (store encrypted in production)
  meta_app_id               text,
  meta_phone_number_id      text,
  meta_waba_id              text,
  meta_access_token         text,
  meta_webhook_verify_token text,                            -- random secret per workspace
  meta_phone_display        text,                            -- "+601X-XXXXXXX"
  meta_business_name        text,

  -- Meta Ads credentials
  meta_ad_account_id        text,
  meta_ads_access_token     text,

  -- Connection state
  meta_connected            boolean default false,
  meta_connected_at         timestamptz,

  created_at                timestamptz not null default now(),
  updated_at                timestamptz not null default now()
);

-- ── ADD workspace_id TO EXISTING TABLES ─────────────────────
alter table public.leads
  add column if not exists workspace_id uuid references public.workspaces(id) on delete cascade;

alter table public.messages
  add column if not exists workspace_id uuid references public.workspaces(id) on delete cascade;

alter table public.campaigns
  add column if not exists workspace_id uuid references public.workspaces(id) on delete cascade;

-- ── INDEXES ──────────────────────────────────────────────────
create index if not exists workspaces_slug_idx          on public.workspaces(slug);
create index if not exists leads_workspace_id_idx       on public.leads(workspace_id);
create index if not exists campaigns_workspace_id_idx   on public.campaigns(workspace_id);

-- ── TEAM MEMBERS TABLE ───────────────────────────────────────
create table if not exists public.team_members (
  id             uuid primary key default uuid_generate_v4(),
  workspace_id   uuid not null references public.workspaces(id) on delete cascade,
  name           text not null,
  email          text,
  role           text default 'agent' check (role in ('admin','agent','viewer')),
  avatar_color   text default '#7c3aed',
  status         text default 'offline' check (status in ('online','offline','busy')),
  created_at     timestamptz not null default now()
);

create index if not exists team_workspace_idx on public.team_members(workspace_id);

-- ── AUTO-UPDATE TRIGGER ──────────────────────────────────────
create or replace trigger workspaces_updated_at
  before update on public.workspaces
  for each row execute function public.handle_updated_at();

-- ── RLS ──────────────────────────────────────────────────────
alter table public.workspaces    enable row level security;
alter table public.team_members  enable row level security;

-- ── SEED: default workspace (first client) ──────────────────
-- Run this once to create the first workspace.
-- Then copy the workspace ID into your .env.local as WORKSPACE_ID.
--
-- insert into public.workspaces (name, slug, meta_webhook_verify_token)
-- values ('My Business', 'my-business', 'change-this-to-random-secret')
-- returning id;
