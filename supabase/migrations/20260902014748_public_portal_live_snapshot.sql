-- One sanitized, runtime source of truth for the public portal.
-- The privileged implementation lives outside the exposed API schema; the
-- public wrapper is security-invoker and only returns aggregate/public data.
create or replace function private.get_public_portal_snapshot()
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'period', coalesce((
      select jsonb_build_object('id',p.id,'name',p.name,'slug',p.slug,'startsAt',p.starts_at,'endsAt',p.ends_at)
      from public.periods p
      where p.is_current and p.deleted_at is null
      order by p.starts_at desc limit 1
    ), '{}'::jsonb),
    'settings', coalesce((
      select jsonb_object_agg(s.namespace||'.'||s.key,s.value)
      from public.settings s where s.is_public
    ), '{}'::jsonb),
    'contents', coalesce((
      select jsonb_agg(to_jsonb(x) order by x.published_at desc nulls last,x.updated_at desc)
      from (
        select c.id,c.title,c.slug,c.summary,c.body,c.status,c.featured,c.language,c.visibility,
          c.published_at,c.updated_at,c.seo,c.content_type_id,ct.key content_type,
          c.unit_id,u.name unit_name,c.organization_id,o.name organization_name,
          ma.object_path featured_object_path,ma.bucket featured_bucket,
          pp.progress_percent,pp.success_percent,pp.public_note,pp.updated_at progress_updated_at
        from public.contents c
        left join public.content_types ct on ct.id=c.content_type_id
        left join public.dpm_units u on u.id=c.unit_id
        left join public.organizations o on o.id=c.organization_id
        left join public.media_assets ma on ma.id=c.featured_asset_id and ma.status='ready' and ma.deleted_at is null
        left join public.program_progress pp on pp.content_id=c.id
        where c.status='published' and c.deleted_at is null and c.visibility='public'
      ) x
    ), '[]'::jsonb),
    'ddas', jsonb_build_object(
      'total',(select count(*) from public.ddas_cases),
      'inProgress',(select count(*) from public.ddas_cases where status in ('received','triaged','assigned','waiting_for_information','reopened')),
      'followedUp',(select count(*) from public.ddas_cases where status='in_progress'),
      'completed',(select count(*) from public.ddas_cases where status in ('resolved','closed'))
    ),
    'surveys', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id',s.id,'title',s.title,'slug',s.slug,'status',s.status,
        'opensAt',s.opens_at,'closesAt',s.closes_at,'responseCount',
        (select count(*) from public.survey_responses sr where sr.survey_id=s.id)
      ) order by s.created_at desc)
      from public.surveys s where s.status='active' and s.result_visibility in ('public','aggregate')
    ), '[]'::jsonb),
    'organizations', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id',o.id,'name',o.name,'slug',o.slug,'shortName',o.short_name,
        'description',o.description,'websiteUrl',o.website_url,'contact',o.contact_public,
        'sortOrder',o.sort_order,'members',coalesce((
          select jsonb_agg(jsonb_build_object(
            'id',m.id,'name',coalesce(p.display_name,m.name_public),'position',m.position,'sortOrder',m.sort_order
          ) order by m.sort_order)
          from public.organization_memberships m left join public.profiles p on p.id=m.profile_id
          where m.organization_id=o.id
        ),'[]'::jsonb)
      ) order by o.sort_order,o.name)
      from public.organizations o where o.status='active' and o.deleted_at is null
    ), '[]'::jsonb)
  );
$$;

revoke all on function private.get_public_portal_snapshot() from public;
grant usage on schema private to anon,authenticated;
grant execute on function private.get_public_portal_snapshot() to anon,authenticated;

create or replace function public.get_public_portal_snapshot()
returns jsonb
language sql
stable
security invoker
set search_path = ''
as $$ select private.get_public_portal_snapshot(); $$;

revoke all on function public.get_public_portal_snapshot() from public;
grant execute on function public.get_public_portal_snapshot() to anon,authenticated;
