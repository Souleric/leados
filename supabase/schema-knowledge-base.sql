-- ============================================================
-- LeadOS — Knowledge Base Schema
-- Run AFTER schema-workspaces.sql
-- ============================================================

create table if not exists public.knowledge_base (
  id           uuid primary key default uuid_generate_v4(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  title        text not null,
  content      text not null,              -- full text content (parsed from file or manual entry)
  source_type  text not null default 'manual'
               check (source_type in ('manual', 'file')),
  file_name    text,                        -- original filename if uploaded
  file_url     text,                        -- Supabase Storage URL if uploaded
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index if not exists kb_workspace_idx on public.knowledge_base(workspace_id);
create index if not exists kb_created_at_idx on public.knowledge_base(created_at desc);

create or replace trigger knowledge_base_updated_at
  before update on public.knowledge_base
  for each row execute function public.handle_updated_at();

alter table public.knowledge_base enable row level security;
