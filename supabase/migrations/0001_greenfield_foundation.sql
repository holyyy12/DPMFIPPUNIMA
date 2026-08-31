-- Greenfield-only foundation. Apply only to a new, allowlisted Supabase project.
create extension if not exists pgcrypto;

create type public.content_status as enum ('draft','in_review','approved','scheduled','published','archived','withdrawn');
create type public.ddas_status as enum ('received','triaged','assigned','in_progress','waiting_for_information','resolved','closed','rejected_out_of_scope','reopened');

create table public.periods (
  id uuid primary key default gen_random_uuid(), name text not null, slug text not null unique,
  starts_at timestamptz not null, ends_at timestamptz not null, is_current boolean not null default false,
  created_at timestamptz not null default now(), check (ends_at > starts_at)
);

create table public.dpm_units (
  id uuid primary key default gen_random_uuid(), period_id uuid not null references public.periods(id) on delete restrict,
  name text not null, slug text not null, code text not null, created_at timestamptz not null default now(),
  unique (period_id, slug), unique (period_id, code)
);

create table public.contents (
  id uuid primary key default gen_random_uuid(), unit_id uuid references public.dpm_units(id) on delete set null,
  title text not null, slug text not null unique, summary text not null default '', body jsonb not null default '{"schemaVersion":1,"blocks":[]}',
  status public.content_status not null default 'draft', published_at timestamptz, created_at timestamptz not null default now(), updated_at timestamptz not null default now(), deleted_at timestamptz
);

create table public.ddas_cases (
  id uuid primary key default gen_random_uuid(), ticket_public_id text not null unique, tracking_secret_hash text not null,
  status public.ddas_status not null default 'received', subject text not null, body_ciphertext text not null,
  assigned_unit_id uuid references public.dpm_units(id) on delete set null, submitted_at timestamptz not null default now(), retention_until timestamptz
);

create table public.ddas_public_timeline (
  id uuid primary key default gen_random_uuid(), case_id uuid not null references public.ddas_cases(id) on delete cascade,
  state public.ddas_status not null, safe_message text not null, occurred_at timestamptz not null default now()
);

alter table public.periods enable row level security;
alter table public.dpm_units enable row level security;
alter table public.contents enable row level security;
alter table public.ddas_cases enable row level security;
alter table public.ddas_public_timeline enable row level security;

create policy "published content is public" on public.contents for select using (status = 'published' and deleted_at is null);
-- No public policies exist for raw D-DAS tables: deny by default. Access must go through audited server-side RPCs.
