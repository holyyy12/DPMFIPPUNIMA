-- D-DAS private data separation, comments/moderation, surveys, notifications, and operations.
alter table public.ddas_cases add column if not exists secret_version integer not null default 1;
alter table public.ddas_cases add column if not exists priority text not null default 'normal';
alter table public.ddas_cases add column if not exists category_id uuid references public.taxonomy_terms(id) on delete set null;
alter table public.ddas_cases add column if not exists risk_class text not null default 'standard';
alter table public.ddas_cases add column if not exists acknowledged_at timestamptz;
alter table public.ddas_cases add column if not exists first_response_due_at timestamptz;
alter table public.ddas_cases add column if not exists resolution_due_at timestamptz;
alter table public.ddas_cases add column if not exists resolved_at timestamptz;
alter table public.ddas_cases add column if not exists closed_at timestamptz;
alter table public.ddas_cases add column if not exists created_idempotency_key text;
alter table public.ddas_cases add column if not exists hold_at timestamptz;
alter table public.ddas_cases add column if not exists anonymized_at timestamptz;
alter table public.ddas_cases add column if not exists updated_at timestamptz not null default now();
create unique index ddas_cases_idempotency_uq on public.ddas_cases(created_idempotency_key) where created_idempotency_key is not null;
create index ddas_cases_sla_idx on public.ddas_cases(status,first_response_due_at,resolution_due_at);

alter table public.ddas_public_timeline add column if not exists created_by uuid references public.profiles(id) on delete set null;
alter table public.ddas_public_timeline add column if not exists published_at timestamptz;

create table public.ddas_private_contacts (
  id uuid primary key default gen_random_uuid(), case_id uuid not null references public.ddas_cases(id) on delete restrict,
  channel text not null, address_ciphertext text not null, address_hash text not null,
  verified_at timestamptz, consent_at timestamptz not null, notification_opt_in boolean not null default false,
  created_at timestamptz not null default now(), unique(case_id,channel,address_hash)
);
create table public.ddas_internal_notes (
  id uuid primary key default gen_random_uuid(), case_id uuid not null references public.ddas_cases(id) on delete restrict,
  body_ciphertext text not null, created_by uuid not null references public.profiles(id) on delete restrict,
  classification text not null default 'confidential', created_at timestamptz not null default now(), deleted_at timestamptz
);
create table public.ddas_assignments (
  id uuid primary key default gen_random_uuid(), case_id uuid not null references public.ddas_cases(id) on delete restrict,
  unit_id uuid not null references public.dpm_units(id) on delete restrict, assignee_id uuid references public.profiles(id) on delete restrict,
  assigned_by uuid not null references public.profiles(id) on delete restrict, assigned_at timestamptz not null default now(),
  ended_at timestamptz, reason text not null, is_primary boolean not null default true
);
create unique index ddas_assignment_primary_uq on public.ddas_assignments(case_id) where is_primary and ended_at is null;
create table public.ddas_attachments (
  id uuid primary key default gen_random_uuid(), case_id uuid not null references public.ddas_cases(id) on delete restrict,
  asset_id uuid not null references public.media_assets(id) on delete restrict,
  visibility text not null check(visibility in ('internal','requester')),
  uploaded_by_type text not null check(uploaded_by_type in ('requester','staff')),
  scan_status text not null default 'pending', created_at timestamptz not null default now()
);
create table public.ddas_case_events (
  id uuid primary key default gen_random_uuid(), case_id uuid not null references public.ddas_cases(id) on delete restrict,
  from_status public.ddas_status, to_status public.ddas_status not null,
  actor_id uuid references public.profiles(id) on delete restrict, reason text not null,
  public_timeline_id uuid references public.ddas_public_timeline(id) on delete set null,
  request_id uuid not null, created_at timestamptz not null default now()
);
create index ddas_events_case_time_idx on public.ddas_case_events(case_id,created_at desc);
create table public.ddas_related_cases (
  case_id uuid not null references public.ddas_cases(id) on delete restrict,
  related_case_id uuid not null references public.ddas_cases(id) on delete restrict,
  relation text not null, created_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(), primary key(case_id,related_case_id), check(case_id < related_case_id)
);

create type public.comment_status as enum ('pending','published','hidden','deleted','rejected');
create table public.comment_threads (
  id uuid primary key default gen_random_uuid(), resource_type text not null, resource_id uuid,
  resource_key text not null unique, mode text not null default 'post' check(mode in ('pre','post')),
  status public.record_status not null default 'active', max_depth integer not null default 3 check(max_depth between 1 and 5),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.comments (
  id uuid primary key default gen_random_uuid(), thread_id uuid not null references public.comment_threads(id) on delete restrict,
  parent_id uuid references public.comments(id) on delete restrict, depth integer not null default 0,
  display_mode text not null default 'anonymous' check(display_mode in ('anonymous','named')),
  display_name text, body text not null, status public.comment_status not null default 'pending',
  author_profile_id uuid references public.profiles(id) on delete set null, published_at timestamptz,
  deleted_at timestamptz, delete_tombstone boolean not null default false, ip_risk_hash text,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  check(depth between 0 and 5), check((display_mode='named' and display_name is not null) or display_mode='anonymous')
);
create index comments_thread_listing_idx on public.comments(thread_id,status,created_at desc);
create table public.comment_deletion_credentials (
  id uuid primary key default gen_random_uuid(), comment_id uuid not null unique references public.comments(id) on delete restrict,
  credential_hash text not null unique, version integer not null default 1,
  expires_at timestamptz, revoked_at timestamptz, used_at timestamptz, created_at timestamptz not null default now()
);
create table public.comment_reports (
  id uuid primary key default gen_random_uuid(), comment_id uuid not null references public.comments(id) on delete restrict,
  category text not null, detail text, reporter_fingerprint_hash text, status text not null default 'open',
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index comment_reports_queue_idx on public.comment_reports(status,created_at);
create table public.moderation_events (
  id uuid primary key default gen_random_uuid(), comment_id uuid not null references public.comments(id) on delete restrict,
  action text not null, from_status public.comment_status, to_status public.comment_status not null,
  actor_id uuid not null references public.profiles(id) on delete restrict,
  reason_code text not null, reason_detail text, created_at timestamptz not null default now()
);
create table public.comment_subscriptions (
  id uuid primary key default gen_random_uuid(), thread_id uuid references public.comment_threads(id) on delete cascade,
  comment_id uuid references public.comments(id) on delete cascade, channel text not null,
  destination_ciphertext text not null, verify_token_hash text not null unique,
  verified_at timestamptz, unsubscribed_at timestamptz, created_at timestamptz not null default now(),
  check((thread_id is not null)::integer + (comment_id is not null)::integer = 1)
);

create table public.surveys (
  id uuid primary key default gen_random_uuid(), title text not null, slug text not null unique,
  schema_version integer not null default 1, form_schema jsonb not null,
  status public.record_status not null default 'inactive', opens_at timestamptz, closes_at timestamptz,
  anonymous boolean not null default true, result_visibility text not null default 'private',
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  check(closes_at is null or opens_at is null or closes_at > opens_at)
);
create table public.survey_responses (
  id uuid primary key default gen_random_uuid(), survey_id uuid not null references public.surveys(id) on delete restrict,
  respondent_id uuid references public.profiles(id) on delete set null, response_ciphertext text not null,
  consent_at timestamptz not null, submitted_at timestamptz not null default now(), dedupe_hash text
);
create index survey_responses_time_idx on public.survey_responses(survey_id,submitted_at);

create table public.notifications (
  id uuid primary key default gen_random_uuid(), recipient_id uuid not null references public.profiles(id) on delete cascade,
  type text not null, title text not null, message_safe text not null, target_path text,
  priority text not null default 'normal', read_at timestamptz, expires_at timestamptz,
  dedupe_key text not null, created_at timestamptz not null default now(), unique(recipient_id,dedupe_key)
);
create index notifications_unread_idx on public.notifications(recipient_id,created_at desc) where read_at is null;
create table public.notification_deliveries (
  id uuid primary key default gen_random_uuid(), notification_id uuid not null references public.notifications(id) on delete cascade,
  channel text not null, status text not null default 'pending', attempts integer not null default 0,
  provider_message_id text, last_error_code text, sent_at timestamptz, created_at timestamptz not null default now()
);
create table public.access_requests (
  id uuid primary key default gen_random_uuid(), requester_id uuid not null references public.profiles(id) on delete restrict,
  requested_scope jsonb not null, justification text not null, status text not null default 'pending',
  reviewer_id uuid references public.profiles(id) on delete restrict, decision_reason text, expires_at timestamptz,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  check(reviewer_id is null or reviewer_id <> requester_id)
);
create table public.approval_requests (
  id uuid primary key default gen_random_uuid(), kind text not null, resource_type text not null, resource_id uuid not null,
  requested_by uuid not null references public.profiles(id) on delete restrict,
  assigned_to uuid references public.profiles(id) on delete restrict, status text not null default 'pending',
  decision_by uuid references public.profiles(id) on delete restrict, decision_at timestamptz, reason text,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  check(decision_by is null or decision_by <> requested_by)
);
create unique index approval_one_active_uq on public.approval_requests(kind,resource_type,resource_id) where status='pending';

create table public.audit_events (
  id uuid primary key default gen_random_uuid(), occurred_at timestamptz not null default now(),
  actor_profile_id uuid references public.profiles(id) on delete set null, actor_type text not null,
  action text not null, target_type text not null, target_id uuid, scope jsonb not null default '{}',
  result text not null, reason text, request_id uuid not null, ip_hash text,
  before_ref text, after_ref text, event_hash text not null, previous_hash text,
  unique(request_id,action,target_type,target_id)
);
create index audit_events_time_idx on public.audit_events(occurred_at desc);
create index audit_events_target_idx on public.audit_events(target_type,target_id,occurred_at desc);
create table public.jobs (
  id uuid primary key default gen_random_uuid(), type text not null, payload jsonb not null default '{}',
  status text not null default 'pending', run_after timestamptz not null default now(), attempts integer not null default 0,
  max_attempts integer not null default 5, locked_at timestamptz, locked_by text, last_error_code text,
  dedupe_key text not null, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create unique index jobs_active_dedupe_uq on public.jobs(dedupe_key) where status in ('pending','running','retry');
create index jobs_queue_idx on public.jobs(status,run_after);
create table public.incidents (
  id uuid primary key default gen_random_uuid(), severity text not null, title text not null, status text not null default 'open',
  started_at timestamptz not null, detected_at timestamptz not null default now(), contained_at timestamptz, resolved_at timestamptz,
  owner_id uuid references public.profiles(id) on delete restrict, summary_safe text not null,
  postmortem_content_id uuid references public.contents(id) on delete set null, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.feature_flags (
  id uuid primary key default gen_random_uuid(), key text not null unique, description text not null,
  enabled boolean not null default false, rules jsonb not null default '{}', owner_id uuid references public.profiles(id) on delete restrict,
  expires_at timestamptz, kill_switch boolean not null default false, updated_by uuid references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.settings (
  id uuid primary key default gen_random_uuid(), namespace text not null, key text not null,
  value jsonb not null, schema_version integer not null default 1, is_public boolean not null default false,
  updated_by uuid references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(namespace,key)
);
create table public.outbox_events (
  id uuid primary key default gen_random_uuid(), topic text not null, aggregate_type text not null, aggregate_id uuid,
  payload_safe jsonb not null default '{}', status text not null default 'pending', available_at timestamptz not null default now(),
  attempts integer not null default 0, dedupe_key text not null unique, created_at timestamptz not null default now()
);

do $$ declare t text; begin foreach t in array array['ddas_private_contacts','ddas_internal_notes','ddas_assignments','ddas_attachments','ddas_case_events','ddas_related_cases','comment_threads','comments','comment_deletion_credentials','comment_reports','moderation_events','comment_subscriptions','surveys','survey_responses','notifications','notification_deliveries','access_requests','approval_requests','audit_events','jobs','incidents','feature_flags','settings','outbox_events'] loop execute format('alter table public.%I enable row level security',t); end loop; end $$;
