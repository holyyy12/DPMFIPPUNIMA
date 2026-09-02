-- Authenticated, permission-aware contract used by every Portal Admin workspace.
create or replace function public.get_admin_portal_snapshot()
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
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
        coalesce((select jsonb_agg(jsonb_build_object('key',r.key,'name',r.name,'unitId',ur.unit_id,'periodId',ur.period_id))
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
  return v_result;
end;
$$;

create or replace function public.admin_portal_action(p_action text, p_payload jsonb default '{}'::jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  v_id uuid;
  v_role uuid;
  v_permission uuid;
  v_status public.ddas_status;
begin
  if v_user is null or not exists (select 1 from public.profiles where id=v_user and status='active' and deleted_at is null) then
    raise exception 'UNAUTHORIZED';
  end if;

  case p_action
    when 'notification.mark_read' then
      v_id := (p_payload->>'id')::uuid;
      update public.notifications set read_at=coalesce(read_at,now()) where id=v_id and recipient_id=v_user;
      if not found then raise exception 'NOT_FOUND'; end if;

    when 'notification.mark_all_read' then
      update public.notifications set read_at=coalesce(read_at,now()) where recipient_id=v_user and read_at is null;

    when 'setting.save' then
      if not public.has_permission('settings.update.all') then raise exception 'FORBIDDEN'; end if;
      insert into public.settings(namespace,key,value,is_public,updated_by)
      values (p_payload->>'namespace',p_payload->>'key',coalesce(p_payload->'value','{}'::jsonb),coalesce((p_payload->>'isPublic')::boolean,false),v_user)
      on conflict(namespace,key) do update set value=excluded.value,is_public=excluded.is_public,updated_by=v_user,updated_at=now();

    when 'permission.set' then
      if not public.has_permission('iam.update.all') then raise exception 'FORBIDDEN'; end if;
      select id into v_role from public.roles where key=p_payload->>'roleKey';
      select id into v_permission from public.permissions where key=p_payload->>'permissionKey';
      if v_role is null or v_permission is null then raise exception 'NOT_FOUND'; end if;
      if coalesce((p_payload->>'allowed')::boolean,false) then
        insert into public.role_permissions(role_id,permission_id,effect) values(v_role,v_permission,'allow')
        on conflict(role_id,permission_id) do update set effect='allow';
      else
        delete from public.role_permissions where role_id=v_role and permission_id=v_permission;
      end if;

    when 'ddas.status' then
      if not public.has_permission('ddas.update.assigned') then raise exception 'FORBIDDEN'; end if;
      v_id := (p_payload->>'id')::uuid;
      v_status := (p_payload->>'status')::public.ddas_status;
      update public.ddas_cases set status=v_status,updated_at=now(),resolved_at=case when v_status='resolved' then now() else resolved_at end,
        closed_at=case when v_status='closed' then now() else closed_at end where id=v_id;
      if not found then raise exception 'NOT_FOUND'; end if;
      insert into public.ddas_public_timeline(case_id,state,safe_message,created_by,published_at)
      values(v_id,v_status,coalesce(nullif(p_payload->>'message',''),'Status aspirasi diperbarui oleh DPM FIPP UNIMA.'),v_user,now());

    when 'ddas.public_update' then
      if not public.has_permission('ddas.update.assigned') then raise exception 'FORBIDDEN'; end if;
      v_id := (p_payload->>'id')::uuid;
      select status into v_status from public.ddas_cases where id=v_id;
      if v_status is null then raise exception 'NOT_FOUND'; end if;
      insert into public.ddas_public_timeline(case_id,state,safe_message,created_by,published_at)
      values(v_id,v_status,p_payload->>'message',v_user,now());

    when 'ddas.internal_note' then
      if not public.has_permission('ddas.update.assigned') then raise exception 'FORBIDDEN'; end if;
      v_id := (p_payload->>'id')::uuid;
      if not exists(select 1 from public.ddas_cases where id=v_id) then raise exception 'NOT_FOUND'; end if;
      insert into public.ddas_internal_notes(case_id,body_ciphertext,created_by,classification)
      values(v_id,p_payload->>'message',v_user,'confidential');

    when 'content.save' then
      if not (public.has_permission('content.update.all') or public.has_permission('content.update.unit',(p_payload->>'unitId')::uuid)) then raise exception 'FORBIDDEN'; end if;
      v_id := nullif(p_payload->>'id','')::uuid;
      if v_id is null then
        insert into public.contents(title,slug,summary,body,status,content_type_id,unit_id,author_id,language,visibility)
        values(p_payload->>'title',p_payload->>'slug',coalesce(p_payload->>'summary',''),coalesce(p_payload->'body','{"schemaVersion":1,"blocks":[]}'::jsonb),
          coalesce((p_payload->>'status')::public.content_status,'draft'),nullif(p_payload->>'contentTypeId','')::uuid,nullif(p_payload->>'unitId','')::uuid,v_user,
          coalesce(p_payload->>'language','id'),coalesce(p_payload->>'visibility','public')) returning id into v_id;
      else
        update public.contents set title=p_payload->>'title',slug=p_payload->>'slug',summary=coalesce(p_payload->>'summary',''),
          body=coalesce(p_payload->'body',body),status=coalesce((p_payload->>'status')::public.content_status,status),
          content_type_id=coalesce(nullif(p_payload->>'contentTypeId','')::uuid,content_type_id),unit_id=nullif(p_payload->>'unitId','')::uuid,
          language=coalesce(p_payload->>'language',language),visibility=coalesce(p_payload->>'visibility',visibility),updated_at=now(),
          published_at=case when (p_payload->>'status')='published' then coalesce(published_at,now()) else published_at end
        where id=v_id and deleted_at is null;
        if not found then raise exception 'NOT_FOUND'; end if;
      end if;

    when 'content.delete' then
      if not public.has_permission('content.update.all') then raise exception 'FORBIDDEN'; end if;
      v_id := (p_payload->>'id')::uuid;
      update public.contents set deleted_at=now(),updated_at=now() where id=v_id and deleted_at is null;
      if not found then raise exception 'NOT_FOUND'; end if;

    else
      raise exception 'UNKNOWN_ACTION';
  end case;

  return jsonb_build_object('ok',true,'id',v_id);
end;
$$;

revoke all on function public.get_admin_portal_snapshot() from public,anon;
revoke all on function public.admin_portal_action(text,jsonb) from public,anon;
grant execute on function public.get_admin_portal_snapshot() to authenticated;
grant execute on function public.admin_portal_action(text,jsonb) to authenticated;
