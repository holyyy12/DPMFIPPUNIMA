-- Ensure a greenfield remote database has the active academic period required
-- by every DPM unit. The seed file is not applied by a normal `db push`.
insert into public.periods(name, slug, starts_at, ends_at, is_current, effective_at, status)
select
  '2026–2027',
  '2026-2027',
  '2026-07-01 00:00:00+08'::timestamptz,
  '2027-07-01 00:00:00+08'::timestamptz,
  true,
  now(),
  'active'::public.period_status
where not exists (
  select 1 from public.periods where deleted_at is null
);

create or replace function public.create_admin_unit(
  p_name text,
  p_slug text,
  p_code text,
  p_description text default '',
  p_unit_type text default 'commission'
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  v_id uuid;
  v_period uuid;
  v_name text := trim(coalesce(p_name, ''));
  v_slug text := lower(trim(coalesce(p_slug, '')));
  v_code text := upper(trim(coalesce(p_code, '')));
begin
  if v_user is null or not exists (
    select 1 from public.profiles
    where id = v_user and status = 'active' and deleted_at is null
  ) then
    raise exception 'UNAUTHORIZED';
  end if;

  if not public.has_permission('iam.update.all') then
    raise exception 'FORBIDDEN';
  end if;

  if v_name = '' or v_slug = '' or v_code = '' then
    return jsonb_build_object('ok', false, 'error', 'INVALID_UNIT');
  end if;

  select id into v_period
  from public.periods
  where is_current and deleted_at is null
  order by effective_at desc nulls last, created_at desc
  limit 1;

  if v_period is null then
    return jsonb_build_object('ok', false, 'error', 'NO_ACTIVE_PERIOD');
  end if;

  if exists (
    select 1 from public.dpm_units
    where period_id = v_period
      and deleted_at is null
      and (lower(slug) = v_slug or upper(code) = v_code)
  ) then
    return jsonb_build_object('ok', false, 'error', 'DUPLICATE_UNIT');
  end if;

  insert into public.dpm_units(
    period_id, name, slug, code, description, unit_type, sort_order, status
  )
  values (
    v_period,
    v_name,
    v_slug,
    v_code,
    coalesce(p_description, ''),
    coalesce(nullif(trim(p_unit_type), ''), 'commission'),
    coalesce((select max(sort_order) + 1 from public.dpm_units where period_id = v_period), 0),
    'active'
  )
  returning id into v_id;

  return jsonb_build_object('ok', true, 'id', v_id, 'periodId', v_period);
end;
$$;

revoke all on function public.create_admin_unit(text,text,text,text,text) from public, anon;
grant execute on function public.create_admin_unit(text,text,text,text,text) to authenticated;
