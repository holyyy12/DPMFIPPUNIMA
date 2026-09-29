-- Rollback-only test; no published organization or media remains afterward.
begin;
select set_config('request.jwt.claims',jsonb_build_object('sub',
  (select ur.profile_id from public.user_roles ur join public.roles r on r.id=ur.role_id
   where r.key='super_admin' and ur.deleted_at is null limit 1),'role','authenticated','aal','aal1')::text,true);
set local role authenticated;
do $$ declare result jsonb; org_id uuid; snapshot jsonb; begin
  result := public.manage_admin_directory('organization.save',jsonb_build_object(
    'name','Logo rollback test','slug','logo-test-'||gen_random_uuid(),'shortName','TEST',
    'description','Rollback-only fixture','contact',jsonb_build_object('logo','/dpm-crest.png','programs','Preserved')));
  org_id := (result->>'id')::uuid;
  snapshot := public.get_public_portal_snapshot();
  if not exists(select 1 from jsonb_array_elements(snapshot->'organizations') o
    where o->>'id'=org_id::text and o->'contact'->>'logo'='/dpm-crest.png') then raise exception 'PUBLIC_LOGO_NOT_SAVED'; end if;
  perform public.manage_admin_directory('organization.save',jsonb_build_object(
    'id',org_id,'name','Logo rollback test','slug','logo-test-'||org_id,'shortName','TEST',
    'description','Rollback-only fixture','contact',jsonb_build_object('logo','')));
  snapshot := public.get_public_portal_snapshot();
  if not exists(select 1 from jsonb_array_elements(snapshot->'organizations') o
    where o->>'id'=org_id::text and o->'contact'->>'logo'='' and o->'contact'->>'programs'='Preserved') then raise exception 'REMOVE_LOGO_OR_PRESERVATION_FAILED'; end if;
end $$;
reset role;
rollback;
