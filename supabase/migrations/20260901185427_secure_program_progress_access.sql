-- Secure the program progress tables added by the previous migration.
-- Public visitors may only read progress attached to published public content.
-- Authenticated editors still need the canonical content permissions.

alter table public.program_progress
  alter column updated_by set default auth.uid();

alter table public.program_progress_updates
  alter column created_by set default auth.uid();

create index if not exists program_progress_updates_content_created_idx
  on public.program_progress_updates(content_id, created_at desc);

drop trigger if exists program_progress_set_updated_at on public.program_progress;
create trigger program_progress_set_updated_at
before update on public.program_progress
for each row execute function public.set_updated_at();

create policy program_progress_public_read
on public.program_progress
for select
to anon, authenticated
using (
  exists (
    select 1
    from public.contents c
    where c.id = program_progress.content_id
      and c.status = 'published'
      and c.visibility = 'public'
      and c.deleted_at is null
  )
);

create policy program_progress_editor_read
on public.program_progress
for select
to authenticated
using (
  exists (
    select 1
    from public.contents c
    where c.id = program_progress.content_id
      and (
        public.has_permission('content.read.all', c.unit_id, c.id)
        or public.has_permission('content.read.unit', c.unit_id, c.id)
      )
  )
);

create policy program_progress_editor_insert
on public.program_progress
for insert
to authenticated
with check (
  updated_by = (select auth.uid())
  and exists (
    select 1
    from public.contents c
    where c.id = program_progress.content_id
      and (
        public.has_permission('content.update.all', c.unit_id, c.id)
        or public.has_permission('content.update.unit', c.unit_id, c.id)
      )
  )
);

create policy program_progress_editor_update
on public.program_progress
for update
to authenticated
using (
  exists (
    select 1
    from public.contents c
    where c.id = program_progress.content_id
      and (
        public.has_permission('content.update.all', c.unit_id, c.id)
        or public.has_permission('content.update.unit', c.unit_id, c.id)
      )
  )
)
with check (
  updated_by = (select auth.uid())
  and exists (
    select 1
    from public.contents c
    where c.id = program_progress.content_id
      and (
        public.has_permission('content.update.all', c.unit_id, c.id)
        or public.has_permission('content.update.unit', c.unit_id, c.id)
      )
  )
);

create policy program_progress_updates_public_read
on public.program_progress_updates
for select
to anon, authenticated
using (
  exists (
    select 1
    from public.contents c
    where c.id = program_progress_updates.content_id
      and c.status = 'published'
      and c.visibility = 'public'
      and c.deleted_at is null
  )
);

create policy program_progress_updates_editor_read
on public.program_progress_updates
for select
to authenticated
using (
  exists (
    select 1
    from public.contents c
    where c.id = program_progress_updates.content_id
      and (
        public.has_permission('content.read.all', c.unit_id, c.id)
        or public.has_permission('content.read.unit', c.unit_id, c.id)
      )
  )
);

create policy program_progress_updates_editor_insert
on public.program_progress_updates
for insert
to authenticated
with check (
  created_by = (select auth.uid())
  and exists (
    select 1
    from public.contents c
    where c.id = program_progress_updates.content_id
      and (
        public.has_permission('content.update.all', c.unit_id, c.id)
        or public.has_permission('content.update.unit', c.unit_id, c.id)
      )
  )
);

grant select on public.program_progress, public.program_progress_updates
to anon, authenticated;

grant insert, update on public.program_progress to authenticated;
grant insert on public.program_progress_updates to authenticated;

-- Administrative SECURITY DEFINER RPCs are not public endpoints.
revoke execute on function public.current_profile_id() from public, anon;
revoke execute on function public.has_permission(text, uuid, uuid) from public, anon;
revoke execute on function public.get_moderation_queue() from public, anon;
revoke execute on function public.moderate_comment(uuid, public.comment_status, text, text, uuid) from public, anon;
revoke execute on function public.decide_approval_request(uuid, text, text, uuid) from public, anon;
revoke execute on function public.submit_organization_unit_approval(text, text, uuid, uuid, text, uuid) from public, anon;

grant execute on function public.current_profile_id() to authenticated;
grant execute on function public.has_permission(text, uuid, uuid) to authenticated;
grant execute on function public.get_moderation_queue() to authenticated;
grant execute on function public.moderate_comment(uuid, public.comment_status, text, text, uuid) to authenticated;
grant execute on function public.decide_approval_request(uuid, text, text, uuid) to authenticated;
grant execute on function public.submit_organization_unit_approval(text, text, uuid, uuid, text, uuid) to authenticated;

alter function public.valid_ddas_transition(public.ddas_status, public.ddas_status)
  set search_path = public;
