-- ============================================================
-- LeadOS — Supabase Schema
-- Run this in: Supabase Dashboard → SQL Editor → New query
-- ============================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ============================================================
-- LEADS TABLE
-- ============================================================
create table if not exists public.leads (
  id            uuid primary key default uuid_generate_v4(),
  phone         text not null unique,          -- WhatsApp phone number e.g. +60123456789
  name          text,                           -- filled later by agent
  source        text default 'WhatsApp',        -- WhatsApp / Facebook / etc
  campaign      text,                           -- parsed from referral param
  status        text not null default 'new'     -- new | contacted | quotation_sent | closed_won | lost
                check (status in ('new','contacted','quotation_sent','closed_won','lost')),
  assigned_to   text,
  tags          text[] default '{}',
  notes         text default '',
  wa_contact_id text,                           -- Meta contact waid
  last_message_at timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- ============================================================
-- MESSAGES TABLE
-- ============================================================
create table if not exists public.messages (
  id            uuid primary key default uuid_generate_v4(),
  lead_id       uuid not null references public.leads(id) on delete cascade,
  wa_message_id text unique,                    -- Meta message_id (dedup)
  direction     text not null                   -- inbound | outbound
                check (direction in ('inbound','outbound')),
  type          text not null default 'text'    -- text | image | audio | document | template
                check (type in ('text','image','audio','document','template','interactive','unknown')),
  content       text not null,                  -- message body / caption
  media_url     text,                           -- signed URL if media message
  status        text default 'delivered'        -- sent | delivered | read | failed
                check (status in ('sent','delivered','read','failed')),
  sender_name   text,                           -- agent name for outbound
  timestamp     timestamptz not null default now(),
  created_at    timestamptz not null default now()
);

-- ============================================================
-- CAMPAIGNS TABLE
-- ============================================================
create table if not exists public.campaigns (
  id            uuid primary key default uuid_generate_v4(),
  name          text not null,
  platform      text default 'Facebook'
                check (platform in ('Facebook','Instagram','TikTok','Google','Other')),
  spend         numeric(10,2) default 0,
  status        text default 'active'
                check (status in ('active','paused','ended')),
  start_date    date,
  end_date      date,
  created_at    timestamptz not null default now()
);

-- ============================================================
-- INDEXES
-- ============================================================
create index if not exists leads_phone_idx        on public.leads(phone);
create index if not exists leads_status_idx       on public.leads(status);
create index if not exists leads_created_at_idx   on public.leads(created_at desc);
create index if not exists messages_lead_id_idx   on public.messages(lead_id);
create index if not exists messages_timestamp_idx on public.messages(timestamp desc);
create index if not exists messages_wa_id_idx     on public.messages(wa_message_id);

-- ============================================================
-- AUTO-UPDATE updated_at TRIGGER
-- ============================================================
create or replace function public.handle_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace trigger leads_updated_at
  before update on public.leads
  for each row execute function public.handle_updated_at();

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- API routes use service_role key → bypasses RLS
-- Enable for safety in case anon key is ever used
-- ============================================================
alter table public.leads    enable row level security;
alter table public.messages enable row level security;
alter table public.campaigns enable row level security;

-- Service role key bypasses RLS automatically.
-- Add policies here if you later add Supabase Auth for agents.

-- ============================================================
-- ANALYTICS VIEW — leads per day
-- ============================================================
create or replace view public.leads_per_day as
  select
    date_trunc('day', created_at)::date as date,
    count(*)                             as total,
    count(*) filter (where status in ('contacted','quotation_sent','closed_won')) as qualified,
    count(*) filter (where status = 'closed_won') as closed
  from public.leads
  group by 1
  order by 1 desc;

-- ============================================================
-- ANALYTICS VIEW — leads per source
-- ============================================================
create or replace view public.leads_per_source as
  select
    source,
    count(*) as total
  from public.leads
  group by source
  order by total desc;
