-- Complete public discussion contracts and require AAL2 for privileged mutations.
create policy contents_public_read on public.contents for select to anon,authenticated
using(status='published' and deleted_at is null and visibility='public');

create or replace function public.report_public_comment(
  p_comment_id uuid, p_category text, p_detail text, p_fingerprint_hash text, p_request_id uuid
) returns uuid language plpgsql security definer set search_path=public as $$
declare report_id uuid:=gen_random_uuid();
begin
  if p_category not in ('spam','harassment','privacy','misinformation','other') then raise exception 'REPORT_INVALID'; end if;
  if not exists(select 1 from comments where id=p_comment_id and status='published') then raise exception 'COMMENT_UNAVAILABLE'; end if;
  if exists(select 1 from comment_reports where comment_id=p_comment_id and reporter_fingerprint_hash=p_fingerprint_hash and created_at>now()-interval '24 hours') then return null; end if;
  insert into comment_reports(id,comment_id,category,detail,reporter_fingerprint_hash) values(report_id,p_comment_id,p_category,nullif(trim(p_detail),''),p_fingerprint_hash);
  perform append_audit_event('public','comments.report','comment',p_comment_id,jsonb_build_object('category',p_category),'success',null,p_request_id);
  return report_id;
end $$;

create or replace function public.moderate_comment(
  p_comment_id uuid,p_to_status public.comment_status,p_reason_code text,p_reason_detail text,p_request_id uuid
) returns boolean language plpgsql security definer set search_path=public as $$
declare previous public.comment_status;
begin
  if coalesce((auth.jwt()->>'aal'),'aal1')<>'aal2' or not has_permission('comments.moderate.all') then raise exception 'FORBIDDEN'; end if;
  if p_to_status not in ('published','hidden','rejected') then raise exception 'STATUS_INVALID'; end if;
  select status into previous from comments where id=p_comment_id for update; if not found then return false; end if;
  update comments set status=p_to_status,published_at=case when p_to_status='published' then coalesce(published_at,now()) else published_at end,updated_at=now() where id=p_comment_id;
  insert into moderation_events(comment_id,action,from_status,to_status,actor_id,reason_code,reason_detail) values(p_comment_id,'status_change',previous,p_to_status,auth.uid(),p_reason_code,nullif(trim(p_reason_detail),''));
  update comment_reports set status='resolved',updated_at=now() where comment_id=p_comment_id and status='open';
  perform append_audit_event('admin','comments.moderate','comment',p_comment_id,jsonb_build_object('from',previous,'to',p_to_status),'success',p_reason_code,p_request_id);
  return true;
end $$;

create or replace function public.get_moderation_queue()
returns table(comment_id uuid,body text,display_name text,status public.comment_status,created_at timestamptz,report_count bigint,report_categories text[])
language sql stable security definer set search_path=public as $$
  select c.id,c.body,coalesce(c.display_name,'Anonim'),c.status,c.created_at,count(r.id),coalesce(array_agg(distinct r.category) filter(where r.id is not null),'{}')
  from comments c left join comment_reports r on r.comment_id=c.id and r.status='open'
  where coalesce((auth.jwt()->>'aal'),'aal1')='aal2' and has_permission('comments.moderate.all') and (c.status='pending' or r.id is not null)
  group by c.id order by count(r.id) desc,c.created_at asc;
$$;

revoke all on function public.report_public_comment(uuid,text,text,text,uuid) from public;
revoke all on function public.moderate_comment(uuid,public.comment_status,text,text,uuid) from public;
revoke all on function public.get_moderation_queue() from public;
grant execute on function public.report_public_comment(uuid,text,text,text,uuid) to anon,authenticated;
grant execute on function public.moderate_comment(uuid,public.comment_status,text,text,uuid) to authenticated;
grant execute on function public.get_moderation_queue() to authenticated;

insert into public.comment_threads(resource_type,resource_key,mode,status,max_depth) values
('publication','publication:kajian-biaya-pendidikan-2026','post','active',3),
('publication','publication:rapat-dengar-pendapat-agustus-2026','post','active',3),
('publication','publication:laporan-pengawasan-semester-ganjil','pre','active',3),
('publication','publication:keputusan-sidang-pleno-agustus-2026','pre','active',3),
('publication','publication:kalender-konsultasi-september','post','active',3),
('publication','publication:struktur-penanggung-jawab-unit','post','active',3)
on conflict(resource_key) do nothing;
