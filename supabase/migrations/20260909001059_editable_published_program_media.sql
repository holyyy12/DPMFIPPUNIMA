-- Update published programs atomically, retaining identifiers and unrelated metadata.
create or replace function public.update_admin_program(
  p_slug text,
  p_title text,
  p_summary text,
  p_unit_label text,
  p_media_kind text,
  p_image_url text,
  p_progress_percent smallint,
  p_success_percent smallint,
  p_public_note text,
  p_documentation jsonb,
  p_continuity_indicator text,
  p_success_indicator text
)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_content public.contents%rowtype;
  v_result jsonb;
begin
  if auth.uid() is null or auth.jwt()->>'aal' is distinct from 'aal2' then
    raise exception 'MFA_REQUIRED';
  end if;

  if p_documentation is null or jsonb_typeof(p_documentation) <> 'array' then
    raise exception 'INVALID_DOCUMENTATION';
  end if;
  if jsonb_array_length(p_documentation) > 5 or exists (
    select 1 from jsonb_array_elements(p_documentation) as m
    where jsonb_typeof(m) <> 'object'
      or coalesce(m->>'url', '') !~ '^https?://'
      or length(m->>'url') > 3000
      or length(coalesce(m->>'name', '')) > 255
  ) then
    raise exception 'INVALID_DOCUMENTATION';
  end if;

  select c.* into v_content
  from public.contents c
  join public.content_types t on t.id = c.content_type_id
  where c.slug = p_slug and c.deleted_at is null and t.key = 'program'
  for update of c;
  if v_content.id is null then
    raise exception 'PROGRAM_NOT_FOUND';
  end if;

  -- Existing RPC enforces active profile, scoped permissions, RLS, and progress history.
  v_result := public.update_program_progress(
    p_slug, p_title, p_summary, p_unit_label, p_media_kind, p_image_url,
    p_progress_percent, p_success_percent, p_public_note
  );

  update public.contents
  set seo = coalesce(v_content.seo, '{}'::jsonb) || jsonb_build_object(
    'program', coalesce(v_content.seo->'program', '{}'::jsonb) || jsonb_build_object(
      'unit', p_unit_label,
      'media', p_media_kind,
      'image', p_image_url,
      'documentation', p_documentation,
      'continuityIndicator', p_continuity_indicator,
      'successIndicator', p_success_indicator
    )
  )
  where id = v_content.id;
  return v_result;
end;
$$;

revoke all on function public.update_admin_program(
  text, text, text, text, text, text, smallint, smallint, text, jsonb, text, text
) from public, anon;
grant execute on function public.update_admin_program(
  text, text, text, text, text, text, smallint, smallint, text, jsonb, text, text
) to authenticated;
