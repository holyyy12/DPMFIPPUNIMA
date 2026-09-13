begin;
select set_config('request.jwt.claims', jsonb_build_object('sub',
  (select ur.profile_id from public.user_roles ur join public.roles r on r.id=ur.role_id
   where r.key='super_admin' and ur.deleted_at is null limit 1),
  'role','authenticated','aal','aal1')::text,true);
select set_config('test.asset',(select id::text from public.media_assets where bucket='public-media' and status='ready' and deleted_at is null and quarantined_at is null limit 1),true);
set local role authenticated;
do $$
declare result jsonb; v_id uuid; snapshot jsonb;
begin
  result := public.manage_ddar('ddar.save',jsonb_build_object('title','Rollback D-DAR','ownerType','dpm','assetId',current_setting('test.asset')));
  v_id := (result->>'id')::uuid;
  perform set_config('test.ddar_id',v_id::text,true);
  snapshot := public.get_public_portal_snapshot();
  if not exists(select 1 from jsonb_array_elements(snapshot->'contents') c where c->>'id'=v_id::text and c->'body'->'attachments'->0->>'assetId'=current_setting('test.asset')) then raise exception 'PUBLIC_FILE_MISSING'; end if;
  perform public.manage_ddar('ddar.archive',jsonb_build_object('id',v_id));
  snapshot := public.get_public_portal_snapshot();
  if exists(select 1 from jsonb_array_elements(snapshot->'contents') c where c->>'id'=v_id::text) then raise exception 'ARCHIVED_STILL_PUBLIC'; end if;
  perform public.manage_ddar('ddar.restore',jsonb_build_object('id',v_id));
  snapshot := public.get_public_portal_snapshot();
  if not exists(select 1 from jsonb_array_elements(snapshot->'contents') c where c->>'id'=v_id::text) then raise exception 'RESTORE_FAILED'; end if;
  perform public.manage_ddar('ddar.delete',jsonb_build_object('id',v_id));
  snapshot := public.get_public_portal_snapshot();
  if exists(select 1 from jsonb_array_elements(snapshot->'contents') c where c->>'id'=v_id::text) then raise exception 'DELETED_STILL_PUBLIC'; end if;
  begin
    perform public.manage_ddar('ddar.save',jsonb_build_object('title','Bad owner','ownerType','ormawa','ownerUnitId',gen_random_uuid(),'assetId',current_setting('test.asset')));
    raise exception 'INVALID_OWNER_ACCEPTED';
  exception when others then if sqlerrm <> 'INVALID_OWNER' then raise; end if; end;
  begin
    perform public.manage_ddar('ddar.save',jsonb_build_object('title','Bad asset','ownerType','dpm','assetId',gen_random_uuid()));
    raise exception 'INVALID_ASSET_ACCEPTED';
  exception when others then if sqlerrm <> 'INVALID_ASSET' then raise; end if; end;
end;
$$;
reset role;
do $$ begin
  if not exists(select 1 from public.contents where id=current_setting('test.ddar_id')::uuid and deleted_at is not null) then raise exception 'DELETE_FAILED'; end if;
  if not exists(select 1 from public.media_assets where id=current_setting('test.asset')::uuid and deleted_at is null) then raise exception 'SHARED_ASSET_DELETED'; end if;
end $$;
select set_config('request.jwt.claims','{}',true);
set local role authenticated;
do $$ begin
  begin
    perform public.manage_ddar('ddar.save','{}');
    raise exception 'UNAUTHENTICATED_ALLOWED';
  exception when others then if sqlerrm <> 'UNAUTHORIZED' then raise; end if; end;
end $$;
reset role;
rollback;
