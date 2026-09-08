create table public.admin_email_invites (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  display_name text not null,
  role_id uuid not null references public.roles(id),
  unit_id uuid references public.dpm_units(id),
  requested_by uuid not null references public.profiles(id),
  status text not null default 'pending' check(status in ('pending','sent','failed')),
  user_id uuid references auth.users(id),
  updated_at timestamptz not null default now()
);
alter table public.admin_email_invites enable row level security;
revoke all on public.admin_email_invites from public, anon, authenticated;

create function public.prepare_admin_email_invite(p_email text,p_name text,p_role text,p_unit uuid default null)
returns jsonb language plpgsql security definer set search_path='' as $$
declare v_role uuid; v_id uuid; v_email text:=lower(trim(p_email));
begin
  if auth.uid() is null or coalesce(auth.jwt()->>'aal','') <> 'aal2'
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
end $$;

create function public.finish_admin_email_invite(p_id uuid,p_user uuid default null)
returns void language plpgsql security definer set search_path='' as $$
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
  insert into public.user_roles(profile_id,role_id,unit_id,period_id,granted_by,reason)
    select p_user,v_inv.role_id,v_inv.unit_id,(select period_id from public.dpm_units where id=v_inv.unit_id),v_inv.requested_by,'Undangan email Portal Admin'
    where not exists(select 1 from public.user_roles where profile_id=p_user and role_id=v_inv.role_id
      and unit_id is not distinct from v_inv.unit_id and deleted_at is null and (ends_at is null or ends_at>now()));
  update public.admin_email_invites set status='sent',user_id=p_user where id=p_id;
end $$;
revoke all on function public.prepare_admin_email_invite(text,text,text,uuid) from public,anon;
grant execute on function public.prepare_admin_email_invite(text,text,text,uuid) to authenticated;
revoke all on function public.finish_admin_email_invite(uuid,uuid) from public,anon,authenticated;
grant execute on function public.finish_admin_email_invite(uuid,uuid) to service_role;
