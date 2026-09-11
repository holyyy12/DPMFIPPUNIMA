-- Publish valid public comments immediately; never issue self-delete credentials.
create or replace function public.create_public_comment(
  p_thread_key text, p_parent_id uuid, p_display_mode text, p_display_name text,
  p_body text, p_credential_hash text, p_request_id uuid
) returns uuid language plpgsql security definer set search_path=public as $$
declare
  thread_row comment_threads;
  parent_row comments;
  comment_id uuid := gen_random_uuid();
begin
  select * into thread_row from comment_threads
  where resource_key=p_thread_key and status='active';
  if not found then raise exception 'COMMENT_THREAD_UNAVAILABLE'; end if;
  if p_body is null or length(trim(p_body)) < 2 or length(p_body) > 4000
    then raise exception 'COMMENT_INVALID'; end if;
  if p_display_mode is null or p_display_mode not in ('anonymous','named')
    or (p_display_mode='named' and length(trim(coalesce(p_display_name,''))) < 2)
    or length(coalesce(p_display_name,'')) > 60
    then raise exception 'COMMENT_INVALID'; end if;
  if p_parent_id is not null then
    select * into parent_row from comments
    where id=p_parent_id and thread_id=thread_row.id and status='published' and deleted_at is null;
    if not found or parent_row.depth >= thread_row.max_depth
      then raise exception 'COMMENT_PARENT_INVALID'; end if;
  end if;
  insert into comments(id,thread_id,parent_id,depth,display_mode,display_name,body,status,published_at)
  values(comment_id,thread_row.id,p_parent_id,coalesce(parent_row.depth+1,0),p_display_mode,
    case when p_display_mode='named' then trim(p_display_name) else null end,
    trim(p_body),'published',now());
  perform append_audit_event('public','comments.create','comment',comment_id,
    jsonb_build_object('thread',p_thread_key),'success',null,p_request_id);
  return comment_id;
end $$;

-- Preserve the old signature for rolling upgrades but make it incapable of deletion.
create or replace function public.delete_own_comment(p_comment_id uuid,p_credential_hash text,p_request_id uuid)
returns boolean language sql security invoker set search_path='' as $$ select false; $$;
revoke all on function public.delete_own_comment(uuid,text,uuid) from public,anon,authenticated;
update public.comment_deletion_credentials set revoked_at=now() where revoked_at is null;

update public.comment_threads set mode='post' where mode='pre';
create or replace function private.ensure_publication_thread()
returns trigger language plpgsql security definer set search_path='' as $$
begin
  if new.status='published' and new.visibility='public' and new.deleted_at is null then
    insert into public.comment_threads(resource_type,resource_id,resource_key,mode)
    values('publication',new.id,'publication:'||new.slug,'post')
    on conflict(resource_key) do update set mode='post',status='active';
  else
    update public.comment_threads set status='inactive'
    where resource_type='publication' and resource_id=new.id;
  end if;
  return new;
end $$;

-- Do not publish historical hidden/rejected comments or introduce a new approval path.
create or replace function public.moderate_comment(
  p_comment_id uuid,p_to_status public.comment_status,p_reason_code text,p_reason_detail text,p_request_id uuid
) returns boolean language plpgsql security definer set search_path=public as $$
declare previous public.comment_status; has_replies boolean;
begin
  if auth.uid() is null or coalesce(auth.jwt()->>'aal','aal1')<>'aal2'
    or not has_permission('comments.moderate.all') then raise exception 'FORBIDDEN'; end if;
  if p_to_status is distinct from 'deleted'::public.comment_status then raise exception 'STATUS_INVALID'; end if;
  if nullif(trim(p_reason_code),'') is null then raise exception 'REASON_REQUIRED'; end if;
  select status into previous from comments where id=p_comment_id for update;
  if not found or previous='deleted' then return false; end if;
  select exists(select 1 from comments where parent_id=p_comment_id and status='published') into has_replies;
  update comments set status='deleted',deleted_at=now(),updated_at=now(),delete_tombstone=has_replies,
    body=case when has_replies then '[Komentar dihapus oleh admin]' else '' end where id=p_comment_id;
  insert into moderation_events(comment_id,action,from_status,to_status,actor_id,reason_code,reason_detail)
  values(p_comment_id,'admin_delete',previous,'deleted',auth.uid(),p_reason_code,nullif(trim(p_reason_detail),''));
  update comment_reports set status='resolved',updated_at=now() where comment_id=p_comment_id and status='open';
  perform append_audit_event('admin','comments.delete','comment',p_comment_id,
    jsonb_build_object('from',previous,'to','deleted'),'success',p_reason_code,p_request_id);
  return true;
end $$;

create or replace view public.public_comments with (security_invoker=true) as
select id,thread_id,parent_id,depth,display_mode,
  case when display_mode='named' then display_name end as display_name,
  body,published_at,delete_tombstone
from public.comments where status='published' or (status='deleted' and delete_tombstone);

-- Block direct user mutations as well as the legacy RPC.
revoke insert,update,delete on public.comments from anon,authenticated;
revoke all on function public.create_public_comment(text,uuid,text,text,text,text,uuid) from public;
grant execute on function public.create_public_comment(text,uuid,text,text,text,text,uuid) to anon,authenticated;
revoke all on function public.moderate_comment(uuid,public.comment_status,text,text,uuid) from public,anon;
grant execute on function public.moderate_comment(uuid,public.comment_status,text,text,uuid) to authenticated;
