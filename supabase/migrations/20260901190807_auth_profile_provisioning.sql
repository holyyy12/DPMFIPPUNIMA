create or replace function private.provision_profile_from_auth_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (
    id,
    display_name,
    email_normalized,
    status
  ) values (
    new.id,
    coalesce(
      nullif(trim(new.raw_user_meta_data ->> 'display_name'), ''),
      nullif(split_part(coalesce(new.email, ''), '@', 1), ''),
      'Pengguna'
    ),
    new.email,
    'active'::public.account_status
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

revoke all on function private.provision_profile_from_auth_user()
from public, anon, authenticated;

drop trigger if exists auth_user_profile_provisioning on auth.users;
create trigger auth_user_profile_provisioning
after insert on auth.users
for each row execute function private.provision_profile_from_auth_user();

-- Backfill profiles for Auth users that may have been created before this migration.
insert into public.profiles (id, display_name, email_normalized, status)
select
  u.id,
  coalesce(
    nullif(trim(u.raw_user_meta_data ->> 'display_name'), ''),
    nullif(split_part(coalesce(u.email, ''), '@', 1), ''),
    'Pengguna'
  ),
  u.email,
  'active'::public.account_status
from auth.users u
on conflict (id) do nothing;
