-- ============================================================
-- LeadOS — Integrations Schema (AutoCount + Bukku)
-- Run AFTER schema-workspaces.sql
-- ============================================================

-- Integration credentials per workspace
create table if not exists public.integrations (
  id           uuid primary key default uuid_generate_v4(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  provider     text not null check (provider in ('autocount_cloud', 'autocount_aotg', 'bukku')),
  config       jsonb not null default '{}',   -- encrypted in prod; stores API credentials
  is_active    boolean not null default false,
  connected_at timestamptz,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  unique (workspace_id, provider)
);

-- Documents linked from accounting software to leads
create table if not exists public.lead_documents (
  id            uuid primary key default uuid_generate_v4(),
  workspace_id  uuid not null references public.workspaces(id) on delete cascade,
  lead_id       uuid not null references public.leads(id) on delete cascade,
  provider      text not null,                -- autocount_cloud | autocount_aotg | bukku
  doc_type      text not null check (doc_type in ('quotation', 'invoice')),
  doc_id        text not null,                -- ID from accounting system
  doc_number    text,                         -- e.g. QT-00001 / INV-00123
  doc_date      text,
  due_date      text,
  amount        numeric(14,2),
  currency      text default 'MYR',
  status        text,                         -- e.g. Draft, Approved, Paid
  customer_name text,
  doc_url       text,
  raw           jsonb,                        -- full response snapshot
  linked_by     text,                         -- agent name who linked it
  created_at    timestamptz not null default now()
);

create index if not exists integrations_workspace_idx   on public.integrations(workspace_id);
create index if not exists lead_documents_lead_idx      on public.lead_documents(lead_id);
create index if not exists lead_documents_workspace_idx on public.lead_documents(workspace_id);

create or replace trigger integrations_updated_at
  before update on public.integrations
  for each row execute function public.handle_updated_at();

alter table public.integrations   enable row level security;
alter table public.lead_documents enable row level security;
