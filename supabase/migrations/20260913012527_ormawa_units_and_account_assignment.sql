-- ORMAWA Units are organization identities beneath the existing ORMAWA role.
-- They are not DPM units and do not create or publish public organization pages.
create table public.ormawa_units (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(trim(name)) between 2 and 180),
  code text not null check (code ~ '^[A-Z0-9][A-Z0-9_-]{1,39}$'),
  description text not null default '' check (length(description) <= 4000),
  status public.record_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
create unique index ormawa_units_code_uq on public.ormawa_units (code) where deleted_at is null;
create unique index ormawa_units_name_uq on public.ormawa_units (lower(trim(name))) where deleted_at is null;
alter table public.ormawa_units enable row level security;
revoke all on public.ormawa_units from public, anon, authenticated;
grant select on public.ormawa_units to authenticated;
grant all on public.ormawa_units to service_role;

alter table public.user_roles add column ormawa_unit_id uuid references public.ormawa_units(id) on delete restrict;
alter table public.admin_email_invites add column ormawa_unit_id uuid references public.ormawa_units(id) on delete restrict;
create index user_roles_ormawa_unit_idx on public.user_roles(ormawa_unit_id) where deleted_at is null;
create index admin_invites_ormawa_unit_idx on public.admin_email_invites(ormawa_unit_id);
alter table public.user_roles add constraint user_roles_unit_kinds_exclusive check (unit_id is null or ormawa_unit_id is null);

-- user_roles is not directly readable by ordinary accounts. Resolve ownership
-- in a private helper instead of widening that table's RLS policies.
create function private.can_read_ormawa_unit(p_unit uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select private.has_active_admin_session() and (
    public.has_permission('iam.read.all') or exists (
      select 1 from public.user_roles ur
      where ur.ormawa_unit_id = p_unit and ur.profile_id = (select auth.uid())
        and ur.deleted_at is null and ur.starts_at <= now()
        and (ur.ends_at is null or ur.ends_at > now())
    )
  );
$$;
revoke all on function private.can_read_ormawa_unit(uuid) from public,anon;
grant execute on function private.can_read_ormawa_unit(uuid) to authenticated;
create policy ormawa_units_read on public.ormawa_units for select to authenticated
using (deleted_at is null and private.can_read_ormawa_unit(id));

create function private.validate_ormawa_role_unit()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.ormawa_unit_id is not null then
    if not exists(select 1 from public.roles where id = new.role_id and key = 'ormawa')
      or new.unit_id is not null then raise exception 'ORMAWA_ROLE_REQUIRED'; end if;
    if not exists(select 1 from public.ormawa_units where id = new.ormawa_unit_id
      and status = 'active' and deleted_at is null) then raise exception 'ORMAWA_UNIT_INVALID'; end if;
  end if;
  return new;
end;
$$;
revoke all on function private.validate_ormawa_role_unit() from public, anon, authenticated;
create trigger user_roles_validate_ormawa_unit before insert or update of role_id, unit_id, ormawa_unit_id
on public.user_roles for each row execute function private.validate_ormawa_role_unit();

create function private.manage_ormawa_unit(p_action text, p_payload jsonb)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_id uuid := nullif(p_payload->>'id','')::uuid;
  v_user uuid;
  v_name text := trim(coalesce(p_payload->>'name',''));
  v_code text := upper(trim(coalesce(p_payload->>'code','')));
  v_role uuid;
begin
  if not private.has_active_role('super_admin',null) or not public.has_permission('iam.update.all') then
    raise exception 'SUPER_ADMIN_REQUIRED';
  end if;
  if p_action = 'ormawa.unit.save' then
    if length(v_name) not between 2 and 180 or v_code !~ '^[A-Z0-9][A-Z0-9_-]{1,39}$'
      or length(coalesce(p_payload->>'description','')) > 4000 then
      return jsonb_build_object('ok',false,'code','invalid_input');
    end if;
    if v_id is null then
      insert into public.ormawa_units(name,code,description)
      values(v_name,v_code,coalesce(p_payload->>'description','')) returning id into v_id;
    else
      update public.ormawa_units set name=v_name,code=v_code,
        description=coalesce(p_payload->>'description',''),updated_at=now()
      where id=v_id and deleted_at is null;
      if not found then return jsonb_build_object('ok',false,'code','unit_not_found'); end if;
    end if;
  elsif p_action = 'ormawa.unit.assign' then
    v_user := nullif(p_payload->>'userId','')::uuid;
    if not exists(select 1 from public.ormawa_units where id=v_id and deleted_at is null and status='active') then
      return jsonb_build_object('ok',false,'code','invalid_unit');
    end if;
    select id into v_role from public.roles where key='ormawa' and status='active';
    update public.user_roles set ormawa_unit_id=v_id,unit_id=null,period_id=null
    where profile_id=v_user and role_id=v_role and deleted_at is null and starts_at<=now()
      and (ends_at is null or ends_at>now());
    if not found then return jsonb_build_object('ok',false,'code','ormawa_role_required'); end if;
  else
    raise exception 'ACTION_INVALID';
  end if;
  perform public.append_audit_event('admin',p_action,'ormawa_unit',v_id,
    jsonb_build_object('userId',v_user),'success',null,gen_random_uuid());
  return jsonb_build_object('ok',true,'id',v_id);
exception when unique_violation then
  return jsonb_build_object('ok',false,'code','duplicate_unit');
end;
$$;
revoke all on function private.manage_ormawa_unit(text,jsonb) from public,anon;
grant execute on function private.manage_ormawa_unit(text,jsonb) to authenticated;
create function public.manage_ormawa_unit(p_action text,p_payload jsonb)
returns jsonb language sql security invoker set search_path = '' as $$
  select private.manage_ormawa_unit(p_action,p_payload);
$$;
revoke all on function public.manage_ormawa_unit(text,jsonb) from public,anon;
grant execute on function public.manage_ormawa_unit(text,jsonb) to authenticated;

-- Keep the four-argument function for older clients. New clients send both
-- unit fields explicitly; a DPM unit cannot be substituted for an ORMAWA unit.
create function private.prepare_admin_account(p_email text,p_name text,p_role text,p_unit uuid,p_ormawa_unit uuid)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_result jsonb;
begin
  if not private.has_active_role('super_admin',null) or not public.has_permission('iam.update.all') then
    raise exception 'SUPER_ADMIN_REQUIRED';
  end if;
  if p_role = 'ormawa' then
    if p_unit is not null or p_ormawa_unit is null or not exists(
      select 1 from public.ormawa_units where id=p_ormawa_unit and status='active' and deleted_at is null
    ) then return jsonb_build_object('ok',false,'code','invalid_ormawa_unit'); end if;
  elsif p_ormawa_unit is not null then
    return jsonb_build_object('ok',false,'code','ormawa_role_required');
  end if;
  v_result := private.prepare_admin_account(p_email,p_name,p_role,p_unit);
  if coalesce((v_result->>'ok')::boolean,false) then
    update public.admin_email_invites set ormawa_unit_id=p_ormawa_unit where id=(v_result->>'id')::uuid;
  end if;
  return v_result;
end;
$$;
revoke all on function private.prepare_admin_account(text,text,text,uuid,uuid) from public,anon;
grant execute on function private.prepare_admin_account(text,text,text,uuid,uuid) to authenticated;
create function public.prepare_admin_account(p_email text,p_name text,p_role text,p_unit uuid,p_ormawa_unit uuid)
returns jsonb language sql security invoker set search_path = '' as $$
  select private.prepare_admin_account(p_email,p_name,p_role,p_unit,p_ormawa_unit);
$$;
revoke all on function public.prepare_admin_account(text,text,text,uuid,uuid) from public,anon;
grant execute on function public.prepare_admin_account(text,text,text,uuid,uuid) to authenticated;

CREATE OR REPLACE FUNCTION public.finish_admin_email_invite(p_id uuid, p_user uuid DEFAULT NULL::uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare v_inv public.admin_email_invites%rowtype;
begin
  select * into v_inv from public.admin_email_invites where id=p_id for update;
  if not found or v_inv.status<>'pending' then raise exception 'INVALID_INVITATION'; end if;
  if p_user is null then
    update public.admin_email_invites set status='failed' where id=p_id; return;
  end if;
  if not exists(select 1 from auth.users where id=p_user and lower(email)=v_inv.email) then raise exception 'EMAIL_MISMATCH'; end if;
  update public.profiles set display_name=v_inv.display_name where id=p_user and deleted_at is null;
  if not found then raise exception 'PROFILE_UNAVAILABLE'; end if;
  insert into public.user_roles(profile_id,role_id,unit_id,ormawa_unit_id,period_id,granted_by,reason)
    select p_user,v_inv.role_id,v_inv.unit_id,v_inv.ormawa_unit_id,(select period_id from public.dpm_units where id=v_inv.unit_id),v_inv.requested_by,'Undangan email Portal Admin'
    where not exists(select 1 from public.user_roles where profile_id=p_user and role_id=v_inv.role_id
      and unit_id is not distinct from v_inv.unit_id and ormawa_unit_id is not distinct from v_inv.ormawa_unit_id and deleted_at is null and (ends_at is null or ends_at>now()));
  update public.admin_email_invites set status='sent',user_id=p_user where id=p_id;
end $function$;

CREATE OR REPLACE FUNCTION public.get_admin_portal_snapshot()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_user uuid := auth.uid();
  v_result jsonb;
begin
  if v_user is null or not exists (
    select 1 from public.profiles p
    where p.id = v_user and p.status = 'active' and p.deleted_at is null
  ) then
    raise exception 'UNAUTHORIZED';
  end if;

  if not (
    public.has_permission('iam.read.all')
    or public.has_permission('content.read.all')
    or public.has_permission('settings.update.all')
    or public.has_permission('ddas.read.assigned')
  ) then
    raise exception 'FORBIDDEN';
  end if;

  select jsonb_build_object(
    'me', (select jsonb_build_object(
      'id', p.id, 'name', p.display_name, 'email', p.email_normalized,
      'lastActiveAt', p.last_active_at,
      'roles', coalesce((select jsonb_agg(distinct r.key) from public.user_roles ur join public.roles r on r.id=ur.role_id
        where ur.profile_id=p.id and ur.deleted_at is null and ur.starts_at<=now() and (ur.ends_at is null or ur.ends_at>now())), '[]'::jsonb)
    ) from public.profiles p where p.id=v_user),
    'periods', coalesce((select jsonb_agg(to_jsonb(x) order by x.is_current desc,x.starts_at desc) from (
      select id,name,slug,starts_at,ends_at,is_current,status from public.periods where deleted_at is null
    ) x), '[]'::jsonb),
    'units', coalesce((select jsonb_agg(to_jsonb(x) order by x.sort_order,x.name) from (
      select id,period_id,parent_id,name,slug,code,description,unit_type,sort_order,status from public.dpm_units where deleted_at is null
    ) x), '[]'::jsonb),
    'users', coalesce((select jsonb_agg(to_jsonb(x) order by x.display_name) from (
      select p.id,p.display_name,p.email_normalized,p.status,p.last_active_at,
        coalesce((select jsonb_agg(jsonb_build_object('key',r.key,'name',r.name,'unitId',ur.unit_id,'ormawaUnitId',ur.ormawa_unit_id,'periodId',ur.period_id))
          from public.user_roles ur join public.roles r on r.id=ur.role_id
          where ur.profile_id=p.id and ur.deleted_at is null and ur.starts_at<=now() and (ur.ends_at is null or ur.ends_at>now())), '[]'::jsonb) roles
      from public.profiles p where p.deleted_at is null
    ) x), '[]'::jsonb),
    'roles', coalesce((select jsonb_agg(to_jsonb(x) order by x.name) from (
      select id,key,name,description,status from public.roles
    ) x), '[]'::jsonb),
    'permissions', coalesce((select jsonb_agg(to_jsonb(x) order by x.key) from (
      select p.id,p.key,p.description,p.risk_level,
        coalesce((select jsonb_object_agg(r.key,(rp.effect='allow')) from public.roles r
          left join public.role_permissions rp on rp.role_id=r.id and rp.permission_id=p.id), '{}'::jsonb) roles
      from public.permissions p
    ) x), '[]'::jsonb),
    'contents', coalesce((select jsonb_agg(to_jsonb(x) order by x.updated_at desc) from (
      select c.id,c.title,c.slug,c.summary,c.body,c.status,c.featured,c.language,c.visibility,c.publish_at,c.published_at,
        c.created_at,c.updated_at,c.content_type_id,ct.key content_type,c.unit_id,u.name unit_name,c.organization_id
      from public.contents c left join public.content_types ct on ct.id=c.content_type_id
      left join public.dpm_units u on u.id=c.unit_id where c.deleted_at is null
    ) x), '[]'::jsonb),
    'contentTypes', coalesce((select jsonb_agg(to_jsonb(x) order by x.name) from (
      select id,key,name,route_pattern,status from public.content_types
    ) x), '[]'::jsonb),
    'ddasCases', coalesce((select jsonb_agg(to_jsonb(x) order by x.submitted_at desc) from (
      select c.id,c.ticket_public_id,c.status,c.subject,c.priority,c.risk_class,c.assigned_unit_id,u.name assigned_unit,
        c.submitted_at,c.updated_at,c.first_response_due_at,c.resolution_due_at,
        coalesce((select jsonb_agg(jsonb_build_object('state',t.state,'message',t.safe_message,'occurredAt',t.occurred_at) order by t.occurred_at)
          from public.ddas_public_timeline t where t.case_id=c.id), '[]'::jsonb) timeline
      from public.ddas_cases c left join public.dpm_units u on u.id=c.assigned_unit_id
    ) x), '[]'::jsonb),
    'comments', coalesce((select jsonb_agg(to_jsonb(x) order by x.created_at desc) from (
      select c.id,c.thread_id,c.parent_id,c.display_mode,c.display_name,c.body,c.status,c.created_at,c.updated_at,
        t.resource_type,t.resource_key,
        (select count(*) from public.comment_reports cr where cr.comment_id=c.id and cr.status='open') report_count
      from public.comments c join public.comment_threads t on t.id=c.thread_id
    ) x), '[]'::jsonb),
    'notifications', coalesce((select jsonb_agg(to_jsonb(x) order by x.created_at desc) from (
      select id,type,title,message_safe,target_path,priority,read_at,created_at from public.notifications where recipient_id=v_user and (expires_at is null or expires_at>now())
    ) x), '[]'::jsonb),
    'organizations', coalesce((select jsonb_agg(to_jsonb(x) order by x.sort_order,x.name) from (
      select o.id,o.period_id,o.type,o.name,o.slug,o.short_name,o.description,o.website_url,o.contact_public,o.status,o.sort_order,
        coalesce((select jsonb_agg(jsonb_build_object('id',m.id,'profileId',m.profile_id,'name',coalesce(p.display_name,m.name_public),'position',m.position,'sortOrder',m.sort_order) order by m.sort_order)
          from public.organization_memberships m left join public.profiles p on p.id=m.profile_id where m.organization_id=o.id), '[]'::jsonb) members
      from public.organizations o where o.deleted_at is null
    ) x), '[]'::jsonb),
    'media', coalesce((select jsonb_agg(to_jsonb(x) order by x.created_at desc) from (
      select id,bucket,object_path,original_filename,mime_type,byte_size,status,alt_default,caption_default,created_at from public.media_assets where deleted_at is null
    ) x), '[]'::jsonb),
    'settings', coalesce((select jsonb_object_agg(namespace||'.'||key,value) from public.settings), '{}'::jsonb),
    'surveys', coalesce((select jsonb_agg(to_jsonb(x) order by x.created_at desc) from (
      select s.id,s.title,s.slug,s.status,s.opens_at,s.closes_at,s.result_visibility,s.created_at,
        (select count(*) from public.survey_responses sr where sr.survey_id=s.id) response_count
      from public.surveys s
    ) x), '[]'::jsonb),
    'audit', coalesce((select jsonb_agg(to_jsonb(x) order by x.occurred_at desc) from (
      select a.id,a.occurred_at,a.actor_profile_id,p.display_name actor_name,a.actor_type,a.action,a.target_type,a.target_id,a.result,a.reason
      from public.audit_events a left join public.profiles p on p.id=a.actor_profile_id order by a.occurred_at desc limit 100
    ) x), '[]'::jsonb)
  ) into v_result;
  return v_result || jsonb_build_object('ormawaUnits', coalesce((
    select jsonb_agg(to_jsonb(u) order by u.name)
    from public.ormawa_units u where u.deleted_at is null and (
      public.has_permission('iam.read.all') or exists (
        select 1 from public.user_roles ur where ur.profile_id=v_user and ur.ormawa_unit_id=u.id
          and ur.deleted_at is null and ur.starts_at<=now() and (ur.ends_at is null or ur.ends_at>now())
      )
    )
  ), '[]'::jsonb));
end;
$function$;

notify pgrst, 'reload schema';
