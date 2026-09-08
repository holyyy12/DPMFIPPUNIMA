-- Use the permission keys that actually exist, including global role assignments.
create or replace function private.can_read_ddas(p_case uuid) returns boolean language sql stable security definer set search_path='' as $$
 select auth.uid() is not null and auth.jwt()->>'aal'='aal2' and exists(
   select 1 from public.ddas_cases c where c.id=p_case
   and public.has_permission('ddas.read.assigned',c.assigned_unit_id,c.id)
   and (c.assigned_unit_id is not null or exists(
     select 1 from public.user_roles ur join public.role_permissions rp on rp.role_id=ur.role_id join public.permissions p on p.id=rp.permission_id
     where ur.profile_id=auth.uid() and ur.unit_id is null and ur.deleted_at is null and ur.starts_at<=now() and (ur.ends_at is null or ur.ends_at>now()) and rp.effect='allow' and p.key='ddas.read.assigned'
   ))
 );
$$;

-- A withdrawn publication must not leave an active public discussion behind.
create or replace function private.ensure_publication_thread() returns trigger language plpgsql security definer set search_path='' as $$
begin
 if new.status='published' and new.visibility='public' and new.deleted_at is null then
   insert into public.comment_threads(resource_type,resource_id,resource_key,mode) values('publication',new.id,'publication:'||new.slug,'pre') on conflict(resource_key) do nothing;
 else
   update public.comment_threads set status='inactive' where resource_type='publication' and resource_id=new.id;
 end if;
 return new;
end $$;

-- Caller-controlled path is an opaque upload capability, never a public read URL.
create index ddas_requester_uploads_case_idx on public.ddas_requester_uploads(case_id);
