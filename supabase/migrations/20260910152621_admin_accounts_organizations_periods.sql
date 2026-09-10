-- Privileged directory changes are narrowly scoped and require an active Super Admin with MFA.
create function private.manage_admin_directory(p_action text, p_payload jsonb)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_id uuid := nullif(p_payload->>'id','')::uuid;
begin
  if auth.uid() is null or auth.jwt()->>'aal' is distinct from 'aal2'
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
$$;
revoke all on function private.manage_admin_directory(text,jsonb) from public,anon;
grant usage on schema private to authenticated;
grant execute on function private.manage_admin_directory(text,jsonb) to authenticated;
create function public.manage_admin_directory(p_action text,p_payload jsonb)
returns jsonb language sql security invoker set search_path='' as $$
  select private.manage_admin_directory(p_action,p_payload);
$$;
revoke all on function public.manage_admin_directory(text,jsonb) from public,anon;
grant execute on function public.manage_admin_directory(text,jsonb) to authenticated;

-- Reuse the existing invitation reservation/finalization without sending an email.
-- Only this checked wrapper may reserve a directly created account.
create function private.prepare_admin_account(p_email text,p_name text,p_role text,p_unit uuid)
returns jsonb language plpgsql security definer set search_path='' as $$
begin
  if auth.uid() is null or auth.jwt()->>'aal' is distinct from 'aal2'
    or not private.has_active_role('super_admin',null) then raise exception 'SUPER_ADMIN_REQUIRED'; end if;
  return public.prepare_admin_email_invite(p_email,p_name,p_role,p_unit);
end;
$$;
revoke all on function private.prepare_admin_account(text,text,text,uuid) from public,anon;
grant execute on function private.prepare_admin_account(text,text,text,uuid) to authenticated;
create function public.prepare_admin_account(p_email text,p_name text,p_role text,p_unit uuid default null)
returns jsonb language sql security invoker set search_path='' as $$
  select private.prepare_admin_account(p_email,p_name,p_role,p_unit);
$$;
revoke all on function public.prepare_admin_account(text,text,text,uuid) from public,anon;
grant execute on function public.prepare_admin_account(text,text,text,uuid) to authenticated;
