-- Real public participation. Private replies and attachments never enter public snapshots.
create or replace function private.ensure_publication_thread() returns trigger language plpgsql security definer set search_path='' as $$
begin
  if new.status='published' and new.visibility='public' and new.deleted_at is null then
    insert into public.comment_threads(resource_type,resource_id,resource_key,mode) values('publication',new.id,'publication:'||new.slug,'pre') on conflict(resource_key) do nothing;
  end if;
  return new;
end $$;
revoke all on function private.ensure_publication_thread() from public;
create trigger publication_comment_thread after insert or update on public.contents for each row execute function private.ensure_publication_thread();
insert into public.comment_threads(resource_type,resource_id,resource_key,mode)
select 'publication',id,'publication:'||slug,'pre' from public.contents where status='published' and visibility='public' and deleted_at is null on conflict(resource_key) do nothing;

create unique index survey_response_dedupe_uq on public.survey_responses(survey_id,dedupe_hash) where dedupe_hash is not null;
create or replace function public.public_surveys() returns jsonb language sql stable security definer set search_path='' as $$
 select coalesce(jsonb_agg(jsonb_build_object('id',s.id,'title',s.title,'options',s.form_schema->'options','responses',(select count(*) from public.survey_responses r where r.survey_id=s.id),'results',(select coalesce(jsonb_agg(jsonb_build_object('option',o.value,'count',(select count(*) from public.survey_responses r where r.survey_id=s.id and r.response_ciphertext=jsonb_build_object('option',o.value)::text))),'[]'::jsonb) from jsonb_array_elements_text(s.form_schema->'options') o(value)))),'[]'::jsonb)
 from public.surveys s where status='active' and result_visibility in ('public','aggregate') and (opens_at is null or opens_at<=now()) and (closes_at is null or closes_at>now());
$$;
create or replace function public.submit_public_survey(p_id uuid,p_option text,p_dedupe text) returns boolean language plpgsql security definer set search_path='' as $$
declare s public.surveys;
begin
 select * into s from public.surveys where id=p_id and status='active' and result_visibility in ('public','aggregate') and (opens_at is null or opens_at<=now()) and (closes_at is null or closes_at>now()) for share;
 if not found or not (s.form_schema->'options' ? p_option) or length(p_dedupe)<32 then raise exception 'INVALID_SURVEY'; end if;
 insert into public.survey_responses(survey_id,response_ciphertext,consent_at,dedupe_hash) values(p_id,jsonb_build_object('option',p_option)::text,now(),p_dedupe) on conflict(survey_id,dedupe_hash) where dedupe_hash is not null do nothing;
 return found;
end $$;
revoke all on function public.public_surveys(),public.submit_public_survey(uuid,text,text) from public;
grant execute on function public.public_surveys(),public.submit_public_survey(uuid,text,text) to anon,authenticated;

-- Isolated private uploads use unguessable, short-lived, single-write object paths.
create table public.ddas_requester_uploads(
 id uuid primary key default gen_random_uuid(), case_id uuid not null references public.ddas_cases(id),
 object_path text not null unique, filename text not null, mime_type text not null, byte_size bigint not null check(byte_size between 1 and 25000000),
 created_at timestamptz not null default now(), expires_at timestamptz not null default now()+interval '30 minutes'
);
alter table public.ddas_requester_uploads enable row level security;
revoke all on public.ddas_requester_uploads from public,anon,authenticated;
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values('ddas-evidence','ddas-evidence',false,25000000,array['image/jpeg','image/png','image/webp','image/gif','video/mp4','video/webm','audio/mpeg','audio/mp4','audio/wav','audio/ogg','application/pdf','application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document','application/vnd.ms-excel','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet','application/vnd.ms-powerpoint','application/vnd.openxmlformats-officedocument.presentationml.presentation']) on conflict(id) do nothing;
create or replace function private.ddas_upload_allowed(p_path text) returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.ddas_requester_uploads u where u.object_path=p_path and u.expires_at>now());
$$;
revoke all on function private.ddas_upload_allowed(text) from public;
grant execute on function private.ddas_upload_allowed(text) to anon,authenticated;
create policy ddas_evidence_upload on storage.objects for insert to anon,authenticated with check(bucket_id='ddas-evidence' and private.ddas_upload_allowed(name));

create or replace function private.can_read_ddas(p_case uuid) returns boolean language sql stable security definer set search_path='' as $$
select auth.uid() is not null and auth.jwt()->>'aal'='aal2' and exists(select 1 from public.ddas_cases c where c.id=p_case and (public.has_permission('ddas.read.all') or (c.assigned_unit_id is not null and public.has_permission('ddas.update.assigned',c.assigned_unit_id,c.id))));
$$;
revoke all on function private.can_read_ddas(uuid) from public;
grant execute on function private.can_read_ddas(uuid) to authenticated;
create or replace function private.ddas_file_read_allowed(p_path text) returns boolean language sql stable security definer set search_path='' as $$
select exists(select 1 from public.ddas_requester_uploads u where u.object_path=p_path and private.can_read_ddas(u.case_id));
$$;
revoke all on function private.ddas_file_read_allowed(text) from public;
grant execute on function private.ddas_file_read_allowed(text) to authenticated;
create policy ddas_evidence_read on storage.objects for select to authenticated using(bucket_id='ddas-evidence' and private.ddas_file_read_allowed(name));

create or replace function public.prepare_ddas_upload(p_ticket text,p_hash text,p_name text,p_type text,p_size bigint) returns text language plpgsql security definer set search_path='' as $$
declare c uuid; path text;
begin
 select id into c from public.ddas_cases where ticket_public_id=p_ticket and tracking_secret_hash=p_hash and submitted_at>now()-interval '24 hours' for update;
 if c is null then raise exception 'INVALID_RECEIPT'; end if;
 if (select count(*) from public.ddas_requester_uploads where case_id=c)>=8 or length(p_name)>180 or length(p_name)<1 or p_size<1 or p_size>25000000 then raise exception 'INVALID_UPLOAD'; end if;
 path:=c::text||'/'||gen_random_uuid()::text||'/'||gen_random_uuid()::text;
 insert into public.ddas_requester_uploads(case_id,object_path,filename,mime_type,byte_size) values(c,path,p_name,p_type,p_size);
 return path;
end $$;
revoke all on function public.prepare_ddas_upload(text,text,text,text,bigint) from public;
grant execute on function public.prepare_ddas_upload(text,text,text,text,bigint) to anon,authenticated;

create or replace function public.admin_ddas_evidence(p_case uuid) returns jsonb language plpgsql security definer set search_path='' as $$
begin
 if not private.can_read_ddas(p_case) then raise exception 'FORBIDDEN'; end if;
 return jsonb_build_object('bodyCiphertext',(select body_ciphertext from public.ddas_cases where id=p_case),'files',(select coalesce(jsonb_agg(jsonb_build_object('id',u.id,'path',u.object_path,'name',u.filename,'type',u.mime_type,'size',u.byte_size)),'[]'::jsonb) from public.ddas_requester_uploads u join storage.objects o on o.bucket_id='ddas-evidence' and o.name=u.object_path where u.case_id=p_case));
end $$;
revoke all on function public.admin_ddas_evidence(uuid) from public,anon;
grant execute on function public.admin_ddas_evidence(uuid) to authenticated;
