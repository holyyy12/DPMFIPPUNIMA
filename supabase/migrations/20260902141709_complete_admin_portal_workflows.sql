-- Complete the admin workspaces requested in Perubahan.docx.
-- Keep all mutations behind authenticated, permission-aware RPCs.

update storage.buckets
set file_size_limit = 20971520,
    allowed_mime_types = null
where id in ('public-media', 'private-media');

create or replace function public.register_admin_media(
  p_bucket text,
  p_object_path text,
  p_original_filename text,
  p_mime_type text,
  p_byte_size bigint,
  p_sha256 text,
  p_alt text default null,
  p_caption text default null,
  p_unit_id uuid default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  v_id uuid;
begin
  if v_user is null or not public.has_permission('media.create.all', p_unit_id) then
    raise exception 'FORBIDDEN';
  end if;
  if p_bucket not in ('public-media','private-media') or p_byte_size < 1 or p_byte_size > 20971520 then
    raise exception 'INVALID_MEDIA';
  end if;
  insert into public.media_assets(
    bucket,object_path,original_filename,mime_type,byte_size,sha256,status,
    uploaded_by,unit_id,alt_default,caption_default,scan_status
  ) values (
    p_bucket,p_object_path,p_original_filename,p_mime_type,p_byte_size,p_sha256,
    'ready',v_user,p_unit_id,nullif(trim(p_alt),''),nullif(trim(p_caption),''),'passed'
  ) returning id into v_id;
  return jsonb_build_object('ok',true,'id',v_id,'bucket',p_bucket,'objectPath',p_object_path);
end;
$$;

create or replace function public.create_admin_program(
  p_title text,
  p_summary text,
  p_unit_label text,
  p_progress_percent integer,
  p_success_percent integer,
  p_continuity_indicator text,
  p_success_indicator text,
  p_public_note text,
  p_media jsonb default '[]'::jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  v_type uuid;
  v_unit uuid;
  v_content uuid;
  v_slug text;
begin
  if v_user is null or not public.has_permission('content.update.all') then raise exception 'FORBIDDEN'; end if;
  if length(trim(p_title)) < 3 or length(trim(p_summary)) < 10 then raise exception 'INVALID_PROGRAM'; end if;
  select id into v_type from public.content_types where key='program' and status='active';
  select u.id into v_unit from public.dpm_units u left join public.periods p on p.id=u.period_id
  where lower(u.name)=lower(trim(p_unit_label)) and u.deleted_at is null
  order by p.is_current desc nulls last,u.sort_order limit 1;
  if v_unit is null then select id into v_unit from public.dpm_units where deleted_at is null order by sort_order,name limit 1; end if;
  v_slug := trim(both '-' from lower(regexp_replace(trim(p_title),'[^a-zA-Z0-9]+','-','g')));
  if v_slug = '' then v_slug := 'program-' || substr(gen_random_uuid()::text,1,8); end if;
  if exists(select 1 from public.contents where slug=v_slug and deleted_at is null) then v_slug := v_slug || '-' || substr(gen_random_uuid()::text,1,6); end if;
  insert into public.contents(unit_id,title,slug,summary,body,status,published_at,content_type_id,author_id,language,visibility,seo)
  values(v_unit,trim(p_title),v_slug,trim(p_summary),jsonb_build_object('schemaVersion',1,'blocks',jsonb_build_array(jsonb_build_object('type','paragraph','text',trim(p_summary)))),
    'published',now(),v_type,v_user,'id','public',jsonb_build_object('program',jsonb_build_object('unit',trim(p_unit_label),'media','gallery','image',coalesce(p_media->0->>'url','/fipp-campus-hero.png'),'documentation',p_media,'continuityIndicator',trim(p_continuity_indicator),'successIndicator',trim(p_success_indicator))))
  returning id into v_content;
  insert into public.program_progress(content_id,progress_percent,success_percent,public_note,updated_by)
  values(v_content,p_progress_percent,p_success_percent,trim(p_public_note),v_user);
  return jsonb_build_object('ok',true,'id',v_content,'slug',v_slug);
end;
$$;

create or replace function public.admin_portal_extended_action(p_action text, p_payload jsonb default '{}'::jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  v_id uuid;
  v_period uuid;
begin
  if v_user is null or not exists(select 1 from public.profiles where id=v_user and status='active' and deleted_at is null) then raise exception 'UNAUTHORIZED'; end if;
  case p_action
    when 'survey.save' then
      if not public.has_permission('content.update.all') then raise exception 'FORBIDDEN'; end if;
      if (select count(*) from public.surveys where status='active') >= 10 then raise exception 'SURVEY_LIMIT'; end if;
      insert into public.surveys(title,slug,form_schema,status,opens_at,result_visibility)
      values(trim(p_payload->>'title'),trim(p_payload->>'slug'),jsonb_build_object('type','single-choice','options',coalesce(p_payload->'options','[]'::jsonb)),'active',now(),'aggregate')
      returning id into v_id;
    when 'unit.save' then
      if not public.has_permission('iam.update.all') then raise exception 'FORBIDDEN'; end if;
      select id into v_period from public.periods where is_current and deleted_at is null;
      insert into public.dpm_units(period_id,name,slug,code,description,unit_type,sort_order,status)
      values(v_period,trim(p_payload->>'name'),trim(p_payload->>'slug'),upper(trim(p_payload->>'code')),coalesce(p_payload->>'description',''),coalesce(p_payload->>'unitType','commission'),
        coalesce((select max(sort_order)+1 from public.dpm_units where period_id=v_period),0),'active') returning id into v_id;
    when 'permission.create' then
      if not public.has_permission('iam.update.all') then raise exception 'FORBIDDEN'; end if;
      insert into public.permissions(key,resource,action,scope_kind,description,risk_level)
      values(trim(p_payload->>'key'),trim(p_payload->>'resource'),trim(p_payload->>'action'),coalesce(p_payload->>'scopeKind','all'),trim(p_payload->>'description'),coalesce(p_payload->>'riskLevel','normal'))
      returning id into v_id;
    when 'user.invite_request' then
      if not public.has_permission('iam.update.all') then raise exception 'FORBIDDEN'; end if;
      insert into public.access_requests(requester_id,requested_scope,justification,status)
      values(v_user,jsonb_build_object('email',lower(trim(p_payload->>'email')),'displayName',trim(p_payload->>'displayName'),'roleKey',p_payload->>'roleKey','unitId',nullif(p_payload->>'unitId','')),
        'Permintaan penambahan pengguna dari Portal Admin','pending') returning id into v_id;
    when 'ddas.assign' then
      if not public.has_permission('ddas.update.assigned') then raise exception 'FORBIDDEN'; end if;
      v_id := (p_payload->>'id')::uuid;
      update public.ddas_cases set assigned_unit_id=nullif(p_payload->>'unitId','')::uuid,status='assigned',updated_at=now() where id=v_id;
      if not found then raise exception 'NOT_FOUND'; end if;
      update public.ddas_assignments set ended_at=now() where case_id=v_id and is_primary and ended_at is null;
      insert into public.ddas_assignments(case_id,unit_id,assigned_by,assigned_at,reason,is_primary)
      values(v_id,(p_payload->>'unitId')::uuid,v_user,now(),'Ditugaskan melalui Portal Admin',true);
    when 'ddas.attach' then
      if not public.has_permission('ddas.update.assigned') then raise exception 'FORBIDDEN'; end if;
      insert into public.ddas_attachments(case_id,asset_id,visibility,uploaded_by_type,scan_status)
      values((p_payload->>'id')::uuid,(p_payload->>'assetId')::uuid,'internal','staff','passed') returning id into v_id;
    else
      raise exception 'UNKNOWN_ACTION';
  end case;
  return jsonb_build_object('ok',true,'id',v_id);
end;
$$;

revoke all on function public.register_admin_media(text,text,text,text,bigint,text,text,text,uuid) from public,anon;
revoke all on function public.create_admin_program(text,text,text,integer,integer,text,text,text,jsonb) from public,anon;
revoke all on function public.admin_portal_extended_action(text,jsonb) from public,anon;
grant execute on function public.register_admin_media(text,text,text,text,bigint,text,text,text,uuid) to authenticated;
grant execute on function public.create_admin_program(text,text,text,integer,integer,text,text,text,jsonb) to authenticated;
grant execute on function public.admin_portal_extended_action(text,jsonb) to authenticated;
