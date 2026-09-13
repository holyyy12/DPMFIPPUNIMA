-- Transaction-only fixtures: no account is created in Auth over HTTP, no email is sent.
begin;
select set_config('test.admin_id', (select ur.profile_id::text from public.user_roles ur
  join public.roles r on r.id=ur.role_id where r.key='super_admin' and ur.deleted_at is null limit 1), true);
select set_config('request.jwt.claims',jsonb_build_object('sub',current_setting('test.admin_id'),'role','authenticated','aal','aal1')::text,true);
select set_config('test.roles_count',(select count(*)::text from public.roles),true);
select set_config('test.dpm_units_count',(select count(*)::text from public.dpm_units),true);
select set_config('test.organizations_count',(select count(*)::text from public.organizations),true);
select set_config('test.user_id',gen_random_uuid()::text,true);
select set_config('test.email','ormawa-test-'||gen_random_uuid()||'@example.com',true);
set local role authenticated;
do $$
declare a jsonb; b jsonb; reserved jsonb;
begin
  a := public.manage_ormawa_unit('ormawa.unit.save','{"name":"Rollback BEM","code":"ROLLBACK_BEM"}');
  b := public.manage_ormawa_unit('ormawa.unit.save','{"name":"Rollback HIMAPSI","code":"ROLLBACK_HIMAPSI"}');
  if not (a->>'ok')::boolean or not (b->>'ok')::boolean then raise exception 'UNIT_CREATE_FAILED'; end if;
  perform set_config('test.unit_a',a->>'id',true);
  perform set_config('test.unit_b',b->>'id',true);
  if (public.manage_ormawa_unit('ormawa.unit.save','{"name":"Rollback BEM","code":"ROLLBACK_BEM"}')->>'code') <> 'duplicate_unit' then raise exception 'DUPLICATE_NOT_REJECTED'; end if;
  perform public.manage_ormawa_unit('ormawa.unit.save',jsonb_build_object('id',a->>'id','name','Rollback BEM Updated','code','ROLLBACK_BEM','description','Updated'));
  if not exists(select 1 from public.ormawa_units where id=(a->>'id')::uuid and description='Updated') then raise exception 'UNIT_EDIT_FAILED'; end if;
  if (public.prepare_admin_account('test@example.com','Test','super_admin',null,(a->>'id')::uuid)->>'code') <> 'ormawa_role_required' then raise exception 'WRONG_ROLE_ALLOWED'; end if;
  if (public.prepare_admin_account('test@example.com','Test','ormawa',null,null)->>'code') <> 'invalid_ormawa_unit' then raise exception 'MISSING_UNIT_ALLOWED'; end if;
  reserved := public.prepare_admin_account(current_setting('test.email'),'Test ORMAWA','ormawa',null,(a->>'id')::uuid);
  if not (reserved->>'ok')::boolean then raise exception 'RESERVATION_FAILED'; end if;
  perform set_config('test.reservation',reserved->>'id',true);
end;
$$;
reset role;
-- Simulate Auth's account insert and the service-only finalization, then roll back.
insert into auth.users(id,email,email_confirmed_at,raw_user_meta_data)
values(current_setting('test.user_id')::uuid,current_setting('test.email'),now(),'{}');
update public.profiles set status='active' where id=current_setting('test.user_id')::uuid;
set local role service_role;
select public.finish_admin_email_invite(current_setting('test.reservation')::uuid,current_setting('test.user_id')::uuid);
reset role;
do $$ begin
  if not exists(select 1 from public.user_roles ur join public.roles r on r.id=ur.role_id
    where ur.profile_id=current_setting('test.user_id')::uuid and ur.ormawa_unit_id=current_setting('test.unit_a')::uuid and ur.unit_id is null and r.key='ormawa') then raise exception 'ASSIGNMENT_NOT_PERSISTED'; end if;
end $$;
set local role authenticated;
do $$ declare result jsonb; begin
  result := public.manage_ormawa_unit('ormawa.unit.assign',jsonb_build_object('id',current_setting('test.unit_b'),'userId',current_setting('test.user_id')));
  if not (result->>'ok')::boolean then raise exception 'REASSIGNMENT_FAILED'; end if;
  result := public.get_admin_portal_snapshot();
  if not exists(select 1 from jsonb_array_elements(result->'users') u,
    jsonb_array_elements(u->'roles') r where u->>'id'=current_setting('test.user_id') and r->>'ormawaUnitId'=current_setting('test.unit_b')) then raise exception 'SNAPSHOT_MISSING_ASSIGNMENT'; end if;
end $$;
reset role;
select set_config('request.jwt.claims',jsonb_build_object('sub',current_setting('test.user_id'),'role','authenticated','aal','aal1')::text,true);
set local role authenticated;
do $$ begin
  if (select count(*) from public.ormawa_units)<>1 then raise exception 'ORMAWA_CAN_READ_OTHER_UNITS'; end if;
  begin
    perform public.manage_ormawa_unit('ormawa.unit.assign',jsonb_build_object('id',current_setting('test.unit_a'),'userId',current_setting('test.user_id')));
    raise exception 'SELF_REASSIGNMENT_ALLOWED';
  exception when raise_exception then if sqlerrm<>'SUPER_ADMIN_REQUIRED' then raise; end if; end;
  begin
    insert into public.ormawa_units(name,code) values('Forbidden','FORBIDDEN');
    raise exception 'DIRECT_WRITE_ALLOWED';
  exception when insufficient_privilege then null; end;
end $$;
reset role;
do $$ begin
  if (select count(*) from public.roles)<>current_setting('test.roles_count')::int then raise exception 'ROLE_CREATED'; end if;
  if (select count(*) from public.dpm_units)<>current_setting('test.dpm_units_count')::int then raise exception 'DPM_UNIT_CREATED'; end if;
  if (select count(*) from public.organizations)<>current_setting('test.organizations_count')::int then raise exception 'PUBLIC_PAGE_CREATED'; end if;
  if has_table_privilege('anon','public.ormawa_units','SELECT') then raise exception 'ANONYMOUS_ACCESS'; end if;
end $$;
select 'ORMAWA units, role assignment, isolation and no public-page side effect verified' as result;
rollback;
