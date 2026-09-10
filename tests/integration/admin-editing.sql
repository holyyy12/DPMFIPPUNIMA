-- Run via Supabase CLI db query --linked --file. All fixture changes roll back.
begin;
select set_config('request.jwt.claims',jsonb_build_object('sub',(
  select ur.profile_id from public.user_roles ur join public.roles r on r.id=ur.role_id
  where r.key='super_admin' and ur.deleted_at is null limit 1
),'aal','aal2','role','authenticated')::text,true);
set local role authenticated;
do $$
declare
  v_period uuid;
  v_org uuid;
  v_program public.contents%rowtype;
  v_result jsonb;
begin
  v_result:=public.manage_admin_directory('period.create',jsonb_build_object('name','TEST rollback period','slug','test-rollback-'||gen_random_uuid(),'startsAt','2030-01-01','endsAt','2031-01-01'));
  v_period:=(v_result->>'id')::uuid;
  perform public.manage_admin_directory('period.activate',jsonb_build_object('id',v_period));
  if (select count(*) from public.periods where is_current)<>1 then raise exception 'ACTIVE_PERIOD_COUNT'; end if;
  if not exists(select 1 from public.periods where id=v_period and is_current) then raise exception 'PERIOD_NOT_SAVED'; end if;

  v_result:=public.manage_admin_directory('organization.save',jsonb_build_object('name','Test ORMAWA rollback','slug','test-ormawa-'||gen_random_uuid(),'shortName','TEST','description','Perkenalan pertama','contact',jsonb_build_object('programs','Program satu','media','[]'::jsonb)));
  v_org:=(v_result->>'id')::uuid;
  perform public.manage_admin_directory('organization.save',jsonb_build_object('id',v_org,'name','Test ORMAWA diperbarui','slug','test-ormawa-'||v_org,'shortName','TEST','description','Perkenalan diperbarui','contact',jsonb_build_object('programs','Program kedua','media','[]'::jsonb)));

  select c.* into v_program from public.contents c join public.content_types t on t.id=c.content_type_id where t.key='program' and c.deleted_at is null limit 1;
  if v_program.id is null then raise exception 'MISSING_PROGRAM_FIXTURE'; end if;
  perform public.update_admin_program(v_program.slug,'Program uji pembaruan','Ringkasan uji pembaruan program','DPM FIPP','gallery','/fipp-campus-hero.png',42::smallint,51::smallint,'Catatan pengujian',
    '[{"url":"https://example.com/photo.jpg","name":"Foto","mimeType":"image/jpeg"},{"url":"https://example.com/video.mp4","name":"Video","mimeType":"video/mp4"}]','Indikator keberlangsungan','Indikator keberhasilan');
  if not exists(select 1 from public.contents where id=v_program.id and jsonb_array_length(seo->'program'->'documentation')=2 and status=v_program.status) then raise exception 'GALLERY_NOT_SAVED'; end if;
  perform public.update_admin_program(v_program.slug,'Program uji pembaruan','Ringkasan uji pembaruan program','DPM FIPP','gallery','/fipp-campus-hero.png',43::smallint,52::smallint,'Catatan berikutnya','[]','Indikator keberlangsungan','Indikator keberhasilan');
  if not exists(select 1 from public.contents where id=v_program.id and jsonb_array_length(seo->'program'->'documentation')=0) then raise exception 'GALLERY_NOT_REMOVED'; end if;

  v_result:=public.prepare_admin_account('test-'||gen_random_uuid()||'@example.com','Test rollback account','ormawa',null);
  if not coalesce((v_result->>'ok')::boolean,false) then raise exception 'ACCOUNT_PREPARATION_FAILED'; end if;
end;
$$;
reset role;
do $$
begin
  if not exists(select 1 from public.organizations where name='Test ORMAWA diperbarui' and contact_public->>'programs'='Program kedua') then raise exception 'ORGANIZATION_NOT_SAVED'; end if;
end;
$$;
select set_config('request.jwt.claims','{"role":"authenticated","aal":"aal1"}',true);
set local role authenticated;
do $$
begin
  begin
    perform public.manage_admin_directory('period.activate','{}');
    raise exception 'SECURITY_TEST_FAILED';
  exception when others then
    if sqlerrm <> 'SUPER_ADMIN_REQUIRED' then raise; end if;
  end;
  begin
    perform public.prepare_admin_account('test@example.com','Test','ormawa',null);
    raise exception 'SECURITY_TEST_FAILED';
  exception when others then
    if sqlerrm <> 'SUPER_ADMIN_REQUIRED' then raise; end if;
  end;
end;
$$;
rollback;
