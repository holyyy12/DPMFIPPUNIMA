-- D-DAR mutations validate ownership and registered public media on the server.
create function private.manage_ddar(p_action text, p_payload jsonb)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_id uuid;
  v_type uuid;
  v_unit uuid;
  v_owner_unit uuid;
  v_owner text;
  v_asset public.media_assets%rowtype;
  v_record public.contents%rowtype;
begin
  if not private.has_active_admin_session() then raise exception 'UNAUTHORIZED'; end if;
  select id into v_type from public.content_types where key='d-dar';
  if v_type is null then raise exception 'DDAR_TYPE_MISSING'; end if;
  if p_action='ddar.save' then
    if length(trim(coalesce(p_payload->>'title',''))) not between 1 and 200 then raise exception 'INVALID_TITLE'; end if;
    v_owner_unit := nullif(p_payload->>'ownerUnitId','')::uuid;
    if p_payload->>'ownerType'='dpm' then
      v_owner := 'DPM FIPP';
      if v_owner_unit is not null then
        select 'DPM · '||name into v_owner from public.dpm_units
        where id=v_owner_unit and status='active' and deleted_at is null;
        if v_owner is null then raise exception 'INVALID_OWNER'; end if;
        v_unit := v_owner_unit;
      end if;
    elsif p_payload->>'ownerType'='ormawa' then
      select name into v_owner from public.ormawa_units
      where id=v_owner_unit and status='active' and deleted_at is null;
      if v_owner is null then raise exception 'INVALID_OWNER'; end if;
    else raise exception 'INVALID_OWNER'; end if;
  else
    v_id := nullif(p_payload->>'id','')::uuid;
    select * into v_record from public.contents
    where id=v_id and content_type_id=v_type and deleted_at is null for update;
    if not found then raise exception 'ARCHIVE_NOT_FOUND'; end if;
    v_unit := v_record.unit_id;
  end if;
  if not (public.has_permission('content.update.all') or
    (v_unit is not null and public.has_permission('content.update.unit',v_unit))) then
    raise exception 'FORBIDDEN';
  end if;
  if p_action in ('ddar.save','ddar.restore') and not
    (public.has_permission('content.publish.all') or
      (v_unit is not null and public.has_permission('content.publish.unit',v_unit))) then
    raise exception 'PUBLISH_FORBIDDEN';
  end if;
  if p_action='ddar.save' then
    select * into v_asset from public.media_assets
    where id=(p_payload->>'assetId')::uuid and bucket='public-media'
      and status='ready' and deleted_at is null and quarantined_at is null;
    if not found then raise exception 'INVALID_ASSET'; end if;
    v_id := gen_random_uuid();
    insert into public.contents(id,title,slug,summary,body,status,published_at,content_type_id,unit_id,author_id,language,visibility)
    values(v_id,trim(p_payload->>'title'),'arsip-'||v_id,'Arsip '||v_owner,
      jsonb_build_object('schemaVersion',1,'blocks','[]'::jsonb,'owner',v_owner,
        'ownerType',p_payload->>'ownerType','ownerUnitId',v_owner_unit,
        'attachments',jsonb_build_array(jsonb_build_object('assetId',v_asset.id,
          'bucket',v_asset.bucket,'objectPath',v_asset.object_path,'name',v_asset.original_filename,
          'mimeType',v_asset.mime_type,'size',v_asset.byte_size))),
      'published',now(),v_type,v_unit,auth.uid(),'id','public');
  elsif p_action='ddar.archive' then
    update public.contents set status='archived',updated_at=now() where id=v_id;
  elsif p_action='ddar.restore' then
    update public.contents set status='published',published_at=coalesce(published_at,now()),updated_at=now() where id=v_id;
  elsif p_action='ddar.delete' then
    -- Recoverable removal: never remove a storage object that other content may use.
    update public.contents set deleted_at=now(),updated_at=now() where id=v_id;
  else raise exception 'ACTION_INVALID'; end if;
  perform public.append_audit_event('admin',p_action,'content',v_id,
    jsonb_build_object('module','d-dar'),'success',null,gen_random_uuid());
  return jsonb_build_object('ok',true,'id',v_id);
end;
$$;
revoke all on function private.manage_ddar(text,jsonb) from public,anon;
grant execute on function private.manage_ddar(text,jsonb) to authenticated;
create function public.manage_ddar(p_action text,p_payload jsonb)
returns jsonb language sql security invoker set search_path = '' as $$
  select private.manage_ddar(p_action,p_payload);
$$;
revoke all on function public.manage_ddar(text,jsonb) from public,anon;
grant execute on function public.manage_ddar(text,jsonb) to authenticated;
