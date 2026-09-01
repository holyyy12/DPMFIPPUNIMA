-- Bootstrap the public program catalogue and expose one transactional update RPC.
-- The nullable actor is reserved for these migration-owned initial values; every
-- interactive write is still forced to auth.uid() by RLS and the RPC below.

alter table public.program_progress
  alter column updated_by drop not null;

insert into public.contents (
  id, content_type_id, title, slug, summary, status, published_at, visibility, seo
)
select
  seed.id,
  ct.id,
  seed.title,
  seed.slug,
  seed.summary,
  'published'::public.content_status,
  now(),
  'public',
  jsonb_build_object(
    'program', jsonb_build_object(
      'unit', seed.unit_label,
      'media', seed.media_kind,
      'image', seed.image_url
    )
  )
from (
  values
    (
      '11111111-1111-4111-8111-111111111101'::uuid,
      'forum-aspirasi',
      'Forum Aspirasi Mahasiswa',
      'Ruang dialog terjadwal untuk menghimpun isu prioritas mahasiswa dan memastikan setiap temuan memiliki tindak lanjut.',
      'Komisi II',
      'photo',
      'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=900&q=80'
    ),
    (
      '11111111-1111-4111-8111-111111111102'::uuid,
      'legislative-class',
      'Legislative Class FIPP',
      'Program literasi legislasi dan kebijakan kampus bagi organisasi mahasiswa di lingkungan FIPP.',
      'Komisi I',
      'video',
      'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=900&q=80'
    ),
    (
      '11111111-1111-4111-8111-111111111103'::uuid,
      'open-data',
      'Open Data & Transparansi',
      'Publikasi berkala laporan, kajian, dan progres kerja yang aman untuk diakses publik.',
      'Media Informasi',
      'gallery',
      'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=900&q=80'
    )
) as seed(id, slug, title, summary, unit_label, media_kind, image_url)
join public.content_types ct on ct.key = 'program'
on conflict (slug) do nothing;

insert into public.program_progress (
  content_id, progress_percent, success_percent, public_note, updated_by
)
select
  c.id,
  seed.progress_percent,
  seed.success_percent,
  'Program berjalan sesuai rencana kerja periode 2026–2027.',
  null
from (
  values
    ('forum-aspirasi', 82::smallint, 91::smallint),
    ('legislative-class', 64::smallint, 78::smallint),
    ('open-data', 71::smallint, 86::smallint)
) as seed(slug, progress_percent, success_percent)
join public.contents c on c.slug = seed.slug
on conflict (content_id) do nothing;

grant update(title, summary, seo, updated_at) on public.contents to authenticated;

create or replace function public.update_program_progress(
  p_slug text,
  p_title text,
  p_summary text,
  p_unit_label text,
  p_media_kind text,
  p_image_url text,
  p_progress_percent smallint,
  p_success_percent smallint,
  p_public_note text
)
returns jsonb
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_content public.contents%rowtype;
  v_actor uuid := auth.uid();
begin
  if v_actor is null then
    raise exception 'AUTHENTICATION_REQUIRED';
  end if;

  if not exists (
    select 1 from public.profiles p
    where p.id = v_actor and p.status = 'active' and p.deleted_at is null
  ) then
    raise exception 'ACTIVE_PROFILE_REQUIRED';
  end if;

  select c.* into v_content
  from public.contents c
  where c.slug = p_slug and c.deleted_at is null;

  if v_content.id is null then
    raise exception 'PROGRAM_NOT_FOUND';
  end if;

  if not (
    public.has_permission('content.update.all', v_content.unit_id, v_content.id)
    or public.has_permission('content.update.unit', v_content.unit_id, v_content.id)
  ) then
    raise exception 'FORBIDDEN';
  end if;

  if p_media_kind not in ('photo', 'video', 'gallery') then
    raise exception 'INVALID_MEDIA_KIND';
  end if;

  update public.contents
  set
    title = p_title,
    summary = p_summary,
    seo = coalesce(seo, '{}'::jsonb) || jsonb_build_object(
      'program', jsonb_build_object(
        'unit', p_unit_label,
        'media', p_media_kind,
        'image', p_image_url
      )
    ),
    updated_at = now()
  where id = v_content.id;

  insert into public.program_progress (
    content_id, progress_percent, success_percent, public_note, updated_by
  ) values (
    v_content.id,
    p_progress_percent,
    p_success_percent,
    p_public_note,
    v_actor
  )
  on conflict (content_id) do update set
    progress_percent = excluded.progress_percent,
    success_percent = excluded.success_percent,
    public_note = excluded.public_note,
    updated_by = excluded.updated_by,
    updated_at = now();

  insert into public.program_progress_updates (
    content_id, progress_percent, success_percent, public_note, created_by
  ) values (
    v_content.id,
    p_progress_percent,
    p_success_percent,
    p_public_note,
    v_actor
  );

  return jsonb_build_object(
    'slug', p_slug,
    'progress', p_progress_percent,
    'success', p_success_percent,
    'updatedAt', now()
  );
end;
$$;

revoke all on function public.update_program_progress(
  text, text, text, text, text, text, smallint, smallint, text
) from public, anon;

grant execute on function public.update_program_progress(
  text, text, text, text, text, text, smallint, smallint, text
) to authenticated;
