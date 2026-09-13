-- Owner decision, 2026-09-12: admin login requires email + password only.
-- Preserve all action-specific permissions, RLS, scoped access, and audit trails.
-- No Auth users, MFA enrollments, or application records are deleted.

create or replace function private.has_active_admin_session()
returns boolean
language sql
stable
security definer
set search_path = ''
as $function$
  select auth.uid() is not null and exists (
    select 1
    from public.profiles p
    join public.user_roles ur on ur.profile_id = p.id
    join public.roles r on r.id = ur.role_id
    where p.id = (select auth.uid())
      and p.status = 'active'
      and p.deleted_at is null
      and r.status = 'active'
      and ur.deleted_at is null
      and ur.starts_at <= now()
      and (ur.ends_at is null or ur.ends_at > now())
  );
$function$;

revoke all on function private.has_active_admin_session() from public, anon;
grant execute on function private.has_active_admin_session() to authenticated;

create or replace function public.is_active_admin_session()
returns boolean
language sql
stable
security invoker
set search_path = ''
as $function$
  select private.has_active_admin_session();
$function$;

revoke all on function public.is_active_admin_session() from public, anon;
grant execute on function public.is_active_admin_session() to authenticated;

-- public.get_moderation_queue: remove only the second-factor requirement.
CREATE OR REPLACE FUNCTION public.get_moderation_queue()
 RETURNS TABLE(comment_id uuid, body text, display_name text, status comment_status, created_at timestamp with time zone, report_count bigint, report_categories text[])
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select c.id,c.body,coalesce(c.display_name,'Anonim'),c.status,c.created_at,count(r.id),coalesce(array_agg(distinct r.category) filter(where r.id is not null),'{}')
  from comments c left join comment_reports r on r.comment_id=c.id and r.status='open'
  where private.has_active_admin_session() and has_permission('comments.moderate.all') and (c.status='pending' or r.id is not null)
  group by c.id order by count(r.id) desc,c.created_at asc;
$function$;

-- public.decide_approval_request: remove only the second-factor requirement.
CREATE OR REPLACE FUNCTION public.decide_approval_request(p_approval_request_id uuid, p_decision text, p_reason text, p_request_id uuid DEFAULT gen_random_uuid())
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  req public.approval_requests%rowtype;
  actor uuid := (select auth.uid());
  next_status text;
begin
  if actor is null then
    raise exception 'UNAUTHENTICATED';
  end if;

  if not private.has_active_admin_session() then
    raise exception 'AUTHENTICATION_REQUIRED';
  end if;

  if p_decision not in ('approved','changes_requested','rejected') then
    raise exception 'APPROVAL_DECISION_INVALID';
  end if;

  select * into req
  from public.approval_requests
  where id=p_approval_request_id
  for update;

  if not found or req.status <> 'pending' then
    raise exception 'APPROVAL_NOT_PENDING';
  end if;

  if req.requested_by=actor then
    raise exception 'SELF_APPROVAL_FORBIDDEN';
  end if;

  if req.policy_key='organization_unit_36h_12h' then
    if req.stage='secretary' then
      if not private.has_active_role('secretary',null)
         or not public.has_permission('approval.decide.secretary',req.unit_id,req.resource_id) then
        raise exception 'FORBIDDEN';
      end if;
    elsif req.stage='super_admin' then
      if not private.has_active_role('super_admin',null)
         or not public.has_permission('approval.decide.super_admin',req.unit_id,req.resource_id) then
        raise exception 'FORBIDDEN';
      end if;
    else
      raise exception 'APPROVAL_STAGE_INVALID';
    end if;
  else
    if not private.has_active_role('super_admin',null) then
      raise exception 'FORBIDDEN';
    end if;
  end if;

  next_status := p_decision;

  update public.approval_requests
  set status=next_status,
      stage='completed',
      decision_by=actor,
      decision_at=now(),
      decision_source='human',
      reason=p_reason,
      updated_at=now()
  where id=req.id;

  if req.resource_type='content' then
    perform private.apply_content_approval_result(req.resource_id,next_status,actor,p_reason,'human',req.id);
  end if;

  perform public.append_audit_event(
    'authenticated',
    concat('approval.',next_status),
    'approval_request',
    req.id,
    jsonb_build_object('unitId',req.unit_id,'stage',req.stage,'resourceType',req.resource_type,'resourceId',req.resource_id),
    'success',
    p_reason,
    p_request_id
  );

  insert into public.outbox_events(topic,aggregate_type,aggregate_id,payload_safe,dedupe_key)
  values(
    concat('approval.',next_status),
    'approval_request',
    req.id,
    jsonb_build_object('decision',next_status,'decisionSource','human','resourceType',req.resource_type),
    concat('approval.',next_status,':',req.id::text)
  )
  on conflict(dedupe_key) do nothing;

  return true;
end
$function$;

-- private.prepare_admin_account: remove only the second-factor requirement.
CREATE OR REPLACE FUNCTION private.prepare_admin_account(p_email text, p_name text, p_role text, p_unit uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
begin
  if auth.uid() is null or not private.has_active_admin_session()
    or not private.has_active_role('super_admin',null) then raise exception 'SUPER_ADMIN_REQUIRED'; end if;
  return public.prepare_admin_email_invite(p_email,p_name,p_role,p_unit);
end;
$function$;

-- public.prepare_admin_email_invite: remove only the second-factor requirement.
CREATE OR REPLACE FUNCTION public.prepare_admin_email_invite(p_email text, p_name text, p_role text, p_unit uuid DEFAULT NULL::uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare v_role uuid; v_id uuid; v_email text:=lower(trim(p_email));
begin
  if auth.uid() is null or not private.has_active_admin_session()
    or not public.has_permission('iam.update.all') then raise exception 'FORBIDDEN'; end if;
  if length(trim(p_name)) not between 1 and 120 or length(v_email)>254 or v_email !~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$' then
    return jsonb_build_object('ok',false,'code','invalid_input'); end if;
  select id into v_role from public.roles where key=p_role and status='active';
  if v_role is null then return jsonb_build_object('ok',false,'code','invalid_role'); end if;
  if (p_role='organization_unit' and p_unit is null) or (p_unit is not null and not exists(select 1 from public.dpm_units where id=p_unit and deleted_at is null and status='active')) then
    return jsonb_build_object('ok',false,'code','invalid_unit'); end if;
  perform pg_advisory_xact_lock(hashtextextended(v_email,0));
  if exists(select 1 from auth.users where lower(email)=v_email and email_confirmed_at is not null) then
    return jsonb_build_object('ok',false,'code','email_exists'); end if;
  if exists(select 1 from public.admin_email_invites where email=v_email and updated_at>now()-interval '60 seconds') then
    return jsonb_build_object('ok',false,'code','rate_limit'); end if;
  insert into public.admin_email_invites(email,display_name,role_id,unit_id,requested_by)
    values(v_email,trim(p_name),v_role,p_unit,auth.uid())
    on conflict(email) do update set display_name=excluded.display_name,role_id=excluded.role_id,unit_id=excluded.unit_id,
      requested_by=excluded.requested_by,status='pending',updated_at=now()
    returning id into v_id;
  return jsonb_build_object('ok',true,'id',v_id);
end $function$;

-- private.can_read_ddas: remove only the second-factor requirement.
CREATE OR REPLACE FUNCTION private.can_read_ddas(p_case uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
 select auth.uid() is not null and private.has_active_admin_session() and exists(
   select 1 from public.ddas_cases c where c.id=p_case
   and public.has_permission('ddas.read.assigned',c.assigned_unit_id,c.id)
   and (c.assigned_unit_id is not null or exists(
     select 1 from public.user_roles ur join public.role_permissions rp on rp.role_id=ur.role_id join public.permissions p on p.id=rp.permission_id
     where ur.profile_id=auth.uid() and ur.unit_id is null and ur.deleted_at is null and ur.starts_at<=now() and (ur.ends_at is null or ur.ends_at>now()) and rp.effect='allow' and p.key='ddas.read.assigned'
   ))
 );
$function$;

-- public.verify_admin_media_object: remove only the second-factor requirement.
CREATE OR REPLACE FUNCTION public.verify_admin_media_object(p_bucket text, p_path text, p_size bigint)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
 select auth.uid() is not null and private.has_active_admin_session() and public.has_permission('media.create.all')
 and p_bucket in ('public-media','private-media') and p_path like 'admin/'||auth.uid()::text||'/%'
 and exists(select 1 from storage.objects o where bucket_id=p_bucket and name=p_path and (metadata->>'size')::bigint=p_size);
$function$;

-- public.update_admin_program: remove only the second-factor requirement.
CREATE OR REPLACE FUNCTION public.update_admin_program(p_slug text, p_title text, p_summary text, p_unit_label text, p_media_kind text, p_image_url text, p_progress_percent smallint, p_success_percent smallint, p_public_note text, p_documentation jsonb, p_continuity_indicator text, p_success_indicator text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
declare
  v_content public.contents%rowtype;
  v_result jsonb;
begin
  if auth.uid() is null or not private.has_active_admin_session() then
    raise exception 'AUTHENTICATION_REQUIRED';
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
$function$;

-- private.manage_admin_directory: remove only the second-factor requirement.
CREATE OR REPLACE FUNCTION private.manage_admin_directory(p_action text, p_payload jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_id uuid := nullif(p_payload->>'id','')::uuid;
begin
  if auth.uid() is null or not private.has_active_admin_session()
    or not private.has_active_role('super_admin',null) then
    raise exception 'SUPER_ADMIN_REQUIRED';
  end if;
  if p_action = 'period.activate' then
    perform pg_advisory_xact_lock(hashtextextended('dpm-active-period',0));
    if not exists(select 1 from public.periods where id=v_id and deleted_at is null) then
      raise exception 'PERIOD_NOT_FOUND';
    end if;
    update public.periods set is_current=false, updated_at=now() where is_current;
    update public.periods set is_current=true,status='active',effective_at=coalesce(effective_at,now()),updated_at=now() where id=v_id;
  elsif p_action = 'period.create' then
    if length(trim(coalesce(p_payload->>'name',''))) not between 3 and 120 then raise exception 'INVALID_NAME'; end if;
    insert into public.periods(name,slug,starts_at,ends_at,status)
      values(trim(p_payload->>'name'),p_payload->>'slug',(p_payload->>'startsAt')::timestamptz,(p_payload->>'endsAt')::timestamptz,'planned') returning id into v_id;
  elsif p_action = 'organization.save' then
    if length(trim(coalesce(p_payload->>'name',''))) not between 3 and 180
      or coalesce(p_payload->>'slug','') !~ '^[a-z0-9]+(-[a-z0-9]+)*$'
      or length(coalesce(p_payload->>'description','')) > 20000 then raise exception 'INVALID_ORGANIZATION'; end if;
    if v_id is null then
      insert into public.organizations(name,slug,short_name,description,type,status,contact_public)
        values(trim(p_payload->>'name'),p_payload->>'slug',p_payload->>'shortName',coalesce(p_payload->>'description',''),'ormawa','active',coalesce(p_payload->'contact','{}')) returning id into v_id;
    else
      update public.organizations set name=trim(p_payload->>'name'),slug=p_payload->>'slug',short_name=p_payload->>'shortName',
        description=coalesce(p_payload->>'description',''),contact_public=coalesce(contact_public,'{}')||coalesce(p_payload->'contact','{}'),updated_at=now()
      where id=v_id and deleted_at is null;
      if not found then raise exception 'ORGANIZATION_NOT_FOUND'; end if;
    end if;
  else
    raise exception 'INVALID_ACTION';
  end if;
  perform public.append_audit_event('user',p_action,case when p_action='organization.save' then 'organization' else 'period' end,v_id,'{}','success',null,gen_random_uuid());
  return jsonb_build_object('ok',true,'id',v_id);
end;
$function$;

-- public.moderate_comment: remove only the second-factor requirement.
CREATE OR REPLACE FUNCTION public.moderate_comment(p_comment_id uuid, p_to_status comment_status, p_reason_code text, p_reason_detail text, p_request_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare previous public.comment_status; has_replies boolean;
begin
  if auth.uid() is null or not private.has_active_admin_session()
    or not has_permission('comments.moderate.all') then raise exception 'FORBIDDEN'; end if;
  if p_to_status is distinct from 'deleted'::public.comment_status then raise exception 'STATUS_INVALID'; end if;
  if nullif(trim(p_reason_code),'') is null then raise exception 'REASON_REQUIRED'; end if;
  select status into previous from comments where id=p_comment_id for update;
  if not found or previous='deleted' then return false; end if;
  select exists(select 1 from comments where parent_id=p_comment_id and status='published') into has_replies;
  update comments set status='deleted',deleted_at=now(),updated_at=now(),delete_tombstone=has_replies,
    body=case when has_replies then '[Komentar dihapus oleh admin]' else '' end where id=p_comment_id;
  insert into moderation_events(comment_id,action,from_status,to_status,actor_id,reason_code,reason_detail)
  values(p_comment_id,'admin_delete',previous,'deleted',auth.uid(),p_reason_code,nullif(trim(p_reason_detail),''));
  update comment_reports set status='resolved',updated_at=now() where comment_id=p_comment_id and status='open';
  perform append_audit_event('admin','comments.delete','comment',p_comment_id,
    jsonb_build_object('from',previous,'to','deleted'),'success',p_reason_code,p_request_id);
  return true;
end $function$;

notify pgrst, 'reload schema';
