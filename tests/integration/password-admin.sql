-- Run as one transaction. No account or permission changes survive.
begin;
select set_config('request.jwt.claims', jsonb_build_object(
  'sub', (select ur.profile_id from public.user_roles ur
    join public.roles r on r.id = ur.role_id
    join public.profiles p on p.id = ur.profile_id
    where r.key = 'super_admin' and ur.deleted_at is null
      and p.status = 'active' and p.deleted_at is null limit 1),
  'role', 'authenticated', 'aal', 'aal1'
)::text, true);
set local role authenticated;
do $$
begin
  if not public.is_active_admin_session() then
    raise exception 'Active password-only admin rejected';
  end if;
  if not public.has_permission('iam.update.all') then
    raise exception 'Super Admin permission missing';
  end if;
  perform public.get_admin_portal_snapshot();
  perform public.get_moderation_queue();
end;
$$;
reset role;

savepoint suspended_account;
update public.profiles set status = 'suspended' where id = auth.uid();
set local role authenticated;
do $$
begin
  if public.is_active_admin_session() then
    raise exception 'Suspended account admitted';
  end if;
  begin
    perform public.prepare_admin_account('test@example.com','Test','ormawa',null);
    raise exception 'Suspended account could create accounts';
  exception when raise_exception then
    if sqlerrm <> 'SUPER_ADMIN_REQUIRED' then raise; end if;
  end;
end;
$$;
reset role;
rollback to suspended_account;

savepoint no_role;
update public.user_roles set deleted_at = now() where profile_id = auth.uid();
set local role authenticated;
do $$
begin
  if public.is_active_admin_session() then
    raise exception 'Unassigned account admitted';
  end if;
end;
$$;
reset role;
rollback to no_role;

savepoint denied_permission;
-- The account still has an active role, but its action permission is denied.
update public.role_permissions set effect = 'deny'
where permission_id = (select id from public.permissions where key = 'comments.moderate.all')
  and role_id in (select role_id from public.user_roles where profile_id = auth.uid());
set local role authenticated;
do $$
begin
  if not public.is_active_admin_session() then
    raise exception 'Authentication incorrectly depends on this action permission';
  end if;
  begin
    perform public.moderate_comment(gen_random_uuid(),'deleted','other','test',gen_random_uuid());
    raise exception 'Denied permission was bypassed by password-only session';
  exception when raise_exception then
    if sqlerrm <> 'FORBIDDEN' then raise; end if;
  end;
end;
$$;
reset role;
rollback to denied_permission;

select set_config('request.jwt.claims','{"role":"authenticated","aal":"aal1"}',true);
set local role authenticated;
do $$
begin
  if public.is_active_admin_session() then
    raise exception 'Missing identity admitted';
  end if;
end;
$$;
reset role;
do $$
begin
  if has_function_privilege('anon','public.is_active_admin_session()','execute') then
    raise exception 'Anonymous access granted to admin admission RPC';
  end if;
end;
$$;
select 'Password-only admin admission and permission denial verified' as result;
rollback;
