create table public.program_progress (
  content_id uuid primary key
    references public.contents(id) on delete cascade,

  progress_percent smallint not null default 0
    check (progress_percent between 0 and 100),

  success_percent smallint not null default 0
    check (success_percent between 0 and 100),

  public_note text not null default '',
  updated_by uuid not null references public.profiles(id),
  updated_at timestamptz not null default now()
);

create table public.program_progress_updates (
  id uuid primary key default gen_random_uuid(),
  content_id uuid not null
    references public.contents(id) on delete cascade,

  progress_percent smallint not null
    check (progress_percent between 0 and 100),

  success_percent smallint not null
    check (success_percent between 0 and 100),

  public_note text not null default '',
  asset_id uuid references public.media_assets(id) on delete set null,
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now()
);

alter table public.program_progress enable row level security;
alter table public.program_progress_updates enable row level security;