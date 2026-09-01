-- Dynamic CMS, immutable revisions, workflow, taxonomy, navigation, redirects, and governed media.
alter type public.content_status add value if not exists 'changes_requested' after 'in_review';
alter type public.content_status add value if not exists 'expired' before 'archived';

create table public.content_types (
  id uuid primary key default gen_random_uuid(),
  key text not null unique, name text not null,
  route_pattern text not null unique, schema_version integer not null default 1,
  field_schema jsonb not null default '{}', workflow_key text not null default 'editorial_v1',
  is_public boolean not null default true, status public.record_status not null default 'active',
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table public.organizations (
  id uuid primary key default gen_random_uuid(), period_id uuid references public.periods(id) on delete restrict,
  type text not null, name text not null, slug text not null, short_name text,
  description text not null default '', logo_asset_id uuid, website_url text, contact_public jsonb not null default '{}',
  status public.record_status not null default 'active', sort_order integer not null default 0,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), deleted_at timestamptz
);
create unique index organizations_slug_active_uq on public.organizations(slug) where deleted_at is null;

create table public.organization_memberships (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade,
  profile_id uuid references public.profiles(id) on delete set null, name_public text, position text not null,
  period_id uuid references public.periods(id) on delete restrict, sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  check (profile_id is not null or name_public is not null)
);

alter table public.contents add column if not exists content_type_id uuid references public.content_types(id) on delete restrict;
alter table public.contents add column if not exists period_id uuid references public.periods(id) on delete restrict;
alter table public.contents add column if not exists organization_id uuid references public.organizations(id) on delete set null;
alter table public.contents add column if not exists featured boolean not null default false;
alter table public.contents add column if not exists featured_asset_id uuid;
alter table public.contents add column if not exists current_revision_id uuid;
alter table public.contents add column if not exists author_id uuid references public.profiles(id) on delete set null;
alter table public.contents add column if not exists publish_at timestamptz;
alter table public.contents add column if not exists expires_at timestamptz;
alter table public.contents add column if not exists review_due_at timestamptz;
alter table public.contents add column if not exists canonical_url text;
alter table public.contents add column if not exists seo jsonb not null default '{}';
alter table public.contents add column if not exists language text not null default 'id';
alter table public.contents add column if not exists visibility text not null default 'public';
alter table public.contents add column if not exists withdrawn_at timestamptz;
alter table public.contents add column if not exists withdrawal_reason text;

create table public.content_revisions (
  id uuid primary key default gen_random_uuid(), content_id uuid not null references public.contents(id) on delete restrict,
  revision_no integer not null, schema_version integer not null default 1,
  title text not null, summary text not null default '', blocks jsonb not null,
  metadata jsonb not null default '{}', change_note text not null,
  created_by uuid not null references public.profiles(id) on delete restrict,
  checksum text not null, is_autosave boolean not null default false,
  created_at timestamptz not null default now(), unique(content_id,revision_no)
);
alter table public.contents add constraint contents_current_revision_fk foreign key(current_revision_id) references public.content_revisions(id) on delete restrict;

create table public.workflow_instances (
  id uuid primary key default gen_random_uuid(), content_id uuid not null unique references public.contents(id) on delete restrict,
  state public.content_status not null default 'draft', current_revision_id uuid references public.content_revisions(id) on delete restrict,
  submitted_by uuid references public.profiles(id) on delete restrict, submitted_at timestamptz,
  approved_by uuid references public.profiles(id) on delete restrict, approved_at timestamptz,
  scheduled_at timestamptz, version integer not null default 1,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.workflow_events (
  id uuid primary key default gen_random_uuid(), workflow_id uuid not null references public.workflow_instances(id) on delete restrict,
  from_state public.content_status, to_state public.content_status not null,
  actor_id uuid references public.profiles(id) on delete restrict, reason text not null,
  metadata jsonb not null default '{}', created_at timestamptz not null default now()
);
create index workflow_events_time_idx on public.workflow_events(workflow_id,created_at desc);

create table public.taxonomies (
  id uuid primary key default gen_random_uuid(), key text not null unique, name text not null,
  applies_to jsonb not null default '[]', status public.record_status not null default 'active',
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.taxonomy_terms (
  id uuid primary key default gen_random_uuid(), taxonomy_id uuid not null references public.taxonomies(id) on delete restrict,
  parent_id uuid references public.taxonomy_terms(id) on delete restrict, name text not null, slug text not null,
  description text not null default '', sort_order integer not null default 0,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique(taxonomy_id,slug), check(parent_id is null or parent_id <> id)
);
create table public.content_terms (
  content_id uuid not null references public.contents(id) on delete cascade,
  term_id uuid not null references public.taxonomy_terms(id) on delete restrict,
  primary key(content_id,term_id)
);

create table public.navigation_menus (
  id uuid primary key default gen_random_uuid(), key text not null, name text not null, locale text not null default 'id',
  status public.record_status not null default 'active', created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique(key,locale)
);
create table public.navigation_items (
  id uuid primary key default gen_random_uuid(), menu_id uuid not null references public.navigation_menus(id) on delete cascade,
  parent_id uuid references public.navigation_items(id) on delete restrict, label text not null, kind text not null,
  content_id uuid references public.contents(id) on delete restrict, url text, sort_order integer not null default 0,
  visibility_rule jsonb not null default '{}', created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  check ((content_id is not null)::integer + (url is not null)::integer = 1), check(parent_id is null or parent_id <> id)
);
create table public.redirects (
  id uuid primary key default gen_random_uuid(), source_path citext not null, target_path text not null,
  status_code integer not null default 308 check(status_code in (301,302,307,308)),
  starts_at timestamptz not null default now(), ends_at timestamptz,
  hit_count bigint not null default 0, last_hit_at timestamptz,
  created_at timestamptz not null default now(), deleted_at timestamptz,
  check(source_path <> target_path), check(ends_at is null or ends_at > starts_at)
);
create unique index redirects_source_active_uq on public.redirects(source_path) where deleted_at is null;

create type public.media_status as enum ('uploading','quarantined','ready','blocked','deleted');
create table public.media_assets (
  id uuid primary key default gen_random_uuid(), bucket text not null, object_path text not null,
  original_filename text not null, mime_type text not null, byte_size bigint not null check(byte_size > 0),
  width integer, height integer, duration_ms integer, sha256 text not null,
  status public.media_status not null default 'uploading', uploaded_by uuid not null references public.profiles(id) on delete restrict,
  unit_id uuid references public.dpm_units(id) on delete restrict, alt_default text, caption_default text,
  focal_point jsonb, scan_status text not null default 'pending', quarantined_at timestamptz,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), deleted_at timestamptz,
  unique(bucket,object_path)
);
create index media_assets_sha_idx on public.media_assets(sha256) where deleted_at is null;
create table public.media_variants (
  id uuid primary key default gen_random_uuid(), asset_id uuid not null references public.media_assets(id) on delete cascade,
  kind text not null, format text not null, width integer, height integer, byte_size bigint not null,
  object_path text not null, status public.media_status not null default 'ready', created_at timestamptz not null default now(),
  unique(asset_id,kind,format,width)
);
create table public.content_media (
  id uuid primary key default gen_random_uuid(), content_id uuid not null references public.contents(id) on delete cascade,
  revision_id uuid references public.content_revisions(id) on delete cascade, asset_id uuid not null references public.media_assets(id) on delete restrict,
  role text not null check(role in ('featured','inline','gallery','attachment')), block_id uuid,
  position text, sort_order integer not null default 0, alt_text text, caption text, credit text, focal_point jsonb,
  created_at timestamptz not null default now()
);
create unique index content_media_one_featured_uq on public.content_media(content_id,coalesce(revision_id,'00000000-0000-0000-0000-000000000000'::uuid)) where role='featured';
create index content_media_order_idx on public.content_media(content_id,revision_id,role,sort_order);
create table public.media_rights (
  id uuid primary key default gen_random_uuid(), asset_id uuid not null references public.media_assets(id) on delete cascade,
  source text not null, license text not null, credit_required boolean not null default false,
  consent_ref text, valid_from timestamptz, expires_at timestamptz, notes text,
  verified_by uuid references public.profiles(id) on delete restrict, verified_at timestamptz,
  created_at timestamptz not null default now(), check(expires_at is null or valid_from is null or expires_at > valid_from)
);
alter table public.organizations add constraint organizations_logo_fk foreign key(logo_asset_id) references public.media_assets(id) on delete set null;
alter table public.contents add constraint contents_featured_asset_fk foreign key(featured_asset_id) references public.media_assets(id) on delete set null;

do $$ declare t text; begin foreach t in array array['content_types','organizations','organization_memberships','content_revisions','workflow_instances','workflow_events','taxonomies','taxonomy_terms','content_terms','navigation_menus','navigation_items','redirects','media_assets','media_variants','content_media','media_rights'] loop execute format('alter table public.%I enable row level security',t); end loop; end $$;
