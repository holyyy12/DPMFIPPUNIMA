-- Identity, organization periods, dynamic units, and scoped IAM.
create extension if not exists citext;

create type public.account_status as enum ('invited','active','suspended','archived');
create type public.period_status as enum ('planned','active','closed','archived');
create type public.record_status as enum ('active','inactive','archived');
create type public.permission_effect as enum ('allow','deny');

create or replace function public.set_updated_at()
returns trigger language plpgsql set search_path = public as $$
begin new.updated_at = now(); return new; end;
$$;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete restrict,
  display_name text not null,
  email_normalized citext,
  status public.account_status not null default 'invited',
  locale text not null default 'id-ID',
  last_active_at timestamptz,
  mfa_enrolled_at timestamptz,
  suspended_at timestamptz,
  suspension_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  deleted_by uuid references auth.users(id) on delete set null,
  deletion_reason text
);
create unique index profiles_email_active_uq on public.profiles(email_normalized) where deleted_at is null and email_normalized is not null;
create index profiles_status_idx on public.profiles(status) where deleted_at is null;

alter table public.periods add column if not exists effective_at timestamptz;
alter table public.periods add column if not exists status public.period_status not null default 'planned';
alter table public.periods add column if not exists updated_at timestamptz not null default now();
alter table public.periods add column if not exists deleted_at timestamptz;
create unique index periods_one_current_uq on public.periods(is_current) where is_current and deleted_at is null;

alter table public.dpm_units add column if not exists parent_id uuid references public.dpm_units(id) on delete restrict;
alter table public.dpm_units add column if not exists description text not null default '';
alter table public.dpm_units add column if not exists unit_type text not null default 'commission';
alter table public.dpm_units add column if not exists sort_order integer not null default 0;
alter table public.dpm_units add column if not exists status public.record_status not null default 'active';
alter table public.dpm_units add column if not exists updated_at timestamptz not null default now();
alter table public.dpm_units add column if not exists deleted_at timestamptz;
alter table public.dpm_units add constraint dpm_units_parent_not_self check (parent_id is null or parent_id <> id);

create table public.positions (
  id uuid primary key default gen_random_uuid(),
  period_id uuid not null references public.periods(id) on delete restrict,
  unit_id uuid not null references public.dpm_units(id) on delete restrict,
  name text not null,
  code text not null,
  rank integer not null default 0,
  description text not null default '',
  is_leadership boolean not null default false,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), deleted_at timestamptz,
  unique(period_id, unit_id, code)
);

create table public.memberships (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete restrict,
  period_id uuid not null references public.periods(id) on delete restrict,
  unit_id uuid not null references public.dpm_units(id) on delete restrict,
  position_id uuid references public.positions(id) on delete set null,
  starts_at timestamptz not null, ends_at timestamptz,
  status public.record_status not null default 'active',
  appointed_by uuid references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), deleted_at timestamptz,
  check (ends_at is null or ends_at > starts_at)
);
create index memberships_profile_status_idx on public.memberships(profile_id,status,starts_at,ends_at);
create index memberships_unit_period_idx on public.memberships(unit_id,period_id) where deleted_at is null;

create table public.permissions (
  id uuid primary key default gen_random_uuid(),
  key text not null unique check (key ~ '^[a-z][a-z0-9_]*\.[a-z][a-z0-9_]*\.[a-z][a-z0-9_]*$'),
  resource text not null, action text not null, scope_kind text not null,
  description text not null, risk_level text not null default 'normal',
  created_at timestamptz not null default now()
);

create table public.roles (
  id uuid primary key default gen_random_uuid(),
  key text not null unique, name text not null, description text not null default '',
  system_role boolean not null default false,
  status public.record_status not null default 'active',
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table public.role_permissions (
  role_id uuid not null references public.roles(id) on delete cascade,
  permission_id uuid not null references public.permissions(id) on delete cascade,
  effect public.permission_effect not null default 'allow',
  created_at timestamptz not null default now(),
  primary key(role_id,permission_id)
);

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete restrict,
  role_id uuid not null references public.roles(id) on delete restrict,
  period_id uuid references public.periods(id) on delete restrict,
  unit_id uuid references public.dpm_units(id) on delete restrict,
  starts_at timestamptz not null default now(), ends_at timestamptz,
  granted_by uuid references public.profiles(id) on delete restrict,
  reason text not null,
  created_at timestamptz not null default now(), deleted_at timestamptz,
  check (ends_at is null or ends_at > starts_at)
);
create index user_roles_active_idx on public.user_roles(profile_id,starts_at,ends_at) where deleted_at is null;

create table public.scoped_grants (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete restrict,
  permission_id uuid not null references public.permissions(id) on delete restrict,
  period_id uuid references public.periods(id) on delete restrict,
  unit_id uuid references public.dpm_units(id) on delete restrict,
  resource_type text, resource_id uuid,
  effect public.permission_effect not null default 'allow', priority integer not null default 0,
  starts_at timestamptz not null default now(), ends_at timestamptz,
  granted_by uuid references public.profiles(id) on delete restrict,
  reason text not null,
  created_at timestamptz not null default now(), deleted_at timestamptz,
  check ((resource_type is null) = (resource_id is null)),
  check (ends_at is null or ends_at > starts_at)
);
create index scoped_grants_resolver_idx on public.scoped_grants(profile_id,permission_id,effect,unit_id,period_id) where deleted_at is null;

create table public.access_reviews (
  id uuid primary key default gen_random_uuid(), period_id uuid references public.periods(id) on delete restrict,
  scope jsonb not null default '{}', status text not null default 'open', due_at timestamptz not null,
  completed_at timestamptz, owner_id uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.access_review_items (
  id uuid primary key default gen_random_uuid(), review_id uuid not null references public.access_reviews(id) on delete cascade,
  subject_id uuid not null references public.profiles(id) on delete restrict,
  grant_type text not null, grant_id uuid not null, decision text, reviewer_id uuid references public.profiles(id) on delete restrict,
  reason text, reviewed_at timestamptz, unique(review_id,grant_type,grant_id)
);

create trigger profiles_set_updated_at before update on public.profiles for each row execute function public.set_updated_at();
create trigger periods_set_updated_at before update on public.periods for each row execute function public.set_updated_at();
create trigger units_set_updated_at before update on public.dpm_units for each row execute function public.set_updated_at();

alter table public.profiles enable row level security;
alter table public.positions enable row level security;
alter table public.memberships enable row level security;
alter table public.permissions enable row level security;
alter table public.roles enable row level security;
alter table public.role_permissions enable row level security;
alter table public.user_roles enable row level security;
alter table public.scoped_grants enable row level security;
alter table public.access_reviews enable row level security;
alter table public.access_review_items enable row level security;
