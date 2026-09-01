-- Deny-by-default policy layer, safe public projections, audited functions, and storage controls.
create or replace function public.current_profile_id()
returns uuid language sql stable security definer set search_path=public as $$
  select auth.uid()
$$;

create or replace function public.has_permission(permission_key text, p_unit_id uuid default null, p_resource_id uuid default null)
returns boolean language sql stable security definer set search_path=public as $$
  with subject as (
    select p.id from profiles p where p.id=auth.uid() and p.status='active' and p.deleted_at is null
  ), role_decisions as (
    select rp.effect
    from subject s join user_roles ur on ur.profile_id=s.id and ur.deleted_at is null
      and ur.starts_at <= now() and (ur.ends_at is null or ur.ends_at > now())
      and (ur.unit_id is null or p_unit_id is null or ur.unit_id=p_unit_id)
    join role_permissions rp on rp.role_id=ur.role_id
    join permissions p on p.id=rp.permission_id and p.key=permission_key
  ), grant_decisions as (
    select sg.effect
    from subject s join scoped_grants sg on sg.profile_id=s.id and sg.deleted_at is null
      and sg.starts_at <= now() and (sg.ends_at is null or sg.ends_at > now())
      and (sg.unit_id is null or sg.unit_id=p_unit_id)
      and (sg.resource_id is null or sg.resource_id=p_resource_id)
    join permissions p on p.id=sg.permission_id and p.key=permission_key
  ), decisions as (select effect from role_decisions union all select effect from grant_decisions)
  select exists(select 1 from decisions where effect='allow') and not exists(select 1 from decisions where effect='deny')
$$;

create or replace function public.append_audit_event(
  p_actor_type text, p_action text, p_target_type text, p_target_id uuid,
  p_scope jsonb, p_result text, p_reason text, p_request_id uuid,
  p_before_ref text default null, p_after_ref text default null
) returns uuid language plpgsql security definer set search_path=public,extensions as $$
declare previous text; new_hash text; event_id uuid := gen_random_uuid();
begin
  perform pg_advisory_xact_lock(hashtext('audit_chain'));
  select event_hash into previous from audit_events order by occurred_at desc,id desc limit 1;
  new_hash := encode(digest(concat_ws('|',event_id::text,coalesce(auth.uid()::text,''),p_actor_type,p_action,p_target_type,coalesce(p_target_id::text,''),p_result,coalesce(p_reason,''),p_request_id::text,coalesce(previous,'')),'sha256'),'hex');
  insert into audit_events(id,actor_profile_id,actor_type,action,target_type,target_id,scope,result,reason,request_id,before_ref,after_ref,event_hash,previous_hash)
  values(event_id,auth.uid(),p_actor_type,p_action,p_target_type,p_target_id,coalesce(p_scope,'{}'),p_result,p_reason,p_request_id,p_before_ref,p_after_ref,new_hash,previous);
  return event_id;
end $$;

create or replace function public.valid_ddas_transition(from_state public.ddas_status, to_state public.ddas_status)
returns boolean language sql immutable as $$
  select case
    when from_state='received' then to_state in ('triaged','rejected_out_of_scope')
    when from_state='triaged' then to_state in ('assigned','rejected_out_of_scope')
    when from_state='assigned' then to_state in ('in_progress','waiting_for_information','rejected_out_of_scope')
    when from_state='in_progress' then to_state in ('waiting_for_information','resolved')
    when from_state='waiting_for_information' then to_state in ('in_progress','resolved')
    when from_state='resolved' then to_state in ('closed','reopened')
    when from_state='closed' then to_state='reopened'
    when from_state='reopened' then to_state in ('assigned','in_progress')
    else false end
$$;

create or replace function public.track_ddas(p_ticket text, p_secret_hash text)
returns table(status public.ddas_status, submitted_at timestamptz, state public.ddas_status, safe_message text, occurred_at timestamptz)
language sql stable security definer set search_path=public as $$
  select c.status,c.submitted_at,t.state,t.safe_message,t.occurred_at
  from ddas_cases c left join ddas_public_timeline t on t.case_id=c.id and t.published_at is not null
  where c.ticket_public_id=p_ticket and c.tracking_secret_hash=p_secret_hash and c.anonymized_at is null
  order by t.occurred_at asc
$$;

create or replace function public.create_public_comment(
  p_thread_key text, p_parent_id uuid, p_display_mode text, p_display_name text,
  p_body text, p_credential_hash text, p_request_id uuid
) returns uuid language plpgsql security definer set search_path=public as $$
declare thread_row comment_threads; parent_row comments; comment_id uuid := gen_random_uuid(); next_status comment_status;
begin
  select * into thread_row from comment_threads where resource_key=p_thread_key and status='active';
  if not found then raise exception 'COMMENT_THREAD_UNAVAILABLE'; end if;
  if length(trim(p_body)) < 2 or length(p_body) > 4000 then raise exception 'COMMENT_INVALID'; end if;
  if p_display_mode not in ('anonymous','named') or (p_display_mode='named' and length(trim(coalesce(p_display_name,''))) < 2) then raise exception 'COMMENT_INVALID'; end if;
  if p_parent_id is not null then
    select * into parent_row from comments where id=p_parent_id and thread_id=thread_row.id;
    if not found or parent_row.depth >= thread_row.max_depth then raise exception 'COMMENT_PARENT_INVALID'; end if;
  end if;
  next_status := case when thread_row.mode='pre' then 'pending'::comment_status else 'published'::comment_status end;
  insert into comments(id,thread_id,parent_id,depth,display_mode,display_name,body,status,published_at)
  values(comment_id,thread_row.id,p_parent_id,coalesce(parent_row.depth+1,0),p_display_mode,nullif(trim(p_display_name),''),trim(p_body),next_status,case when next_status='published' then now() end);
  insert into comment_deletion_credentials(comment_id,credential_hash) values(comment_id,p_credential_hash);
  perform append_audit_event('public','comments.create','comment',comment_id,jsonb_build_object('thread',p_thread_key),'success',null,p_request_id);
  return comment_id;
end $$;

create or replace function public.delete_own_comment(p_comment_id uuid, p_credential_hash text, p_request_id uuid)
returns boolean language plpgsql security definer set search_path=public as $$
declare has_replies boolean;
begin
  update comment_deletion_credentials set used_at=now()
    where comment_id=p_comment_id and credential_hash=p_credential_hash and revoked_at is null and used_at is null
      and (expires_at is null or expires_at > now());
  if not found then return false; end if;
  select exists(select 1 from comments where parent_id=p_comment_id and deleted_at is null) into has_replies;
  update comments set body=case when has_replies then '[Komentar telah dihapus oleh pengirim]' else '' end,
    status='deleted',deleted_at=now(),delete_tombstone=has_replies,updated_at=now() where id=p_comment_id;
  perform append_audit_event('public','comments.delete_own','comment',p_comment_id,'{}','success',null,p_request_id);
  return true;
end $$;

revoke all on function public.track_ddas(text,text) from public;
revoke all on function public.create_public_comment(text,uuid,text,text,text,text,uuid) from public;
revoke all on function public.delete_own_comment(uuid,text,uuid) from public;
grant execute on function public.track_ddas(text,text) to anon,authenticated;
grant execute on function public.create_public_comment(text,uuid,text,text,text,text,uuid) to anon,authenticated;
grant execute on function public.delete_own_comment(uuid,text,uuid) to anon,authenticated;

create or replace view public.published_content with (security_invoker=true) as
select c.id,ct.key as type,c.title,c.slug,c.summary,c.published_at,c.updated_at,c.language,c.seo,c.featured_asset_id,c.unit_id,c.period_id
from contents c join content_types ct on ct.id=c.content_type_id
where c.status='published' and c.deleted_at is null and c.visibility='public';
create or replace view public.public_organizations with (security_invoker=true) as
select id,type,name,slug,short_name,description,logo_asset_id,website_url,contact_public,sort_order,period_id
from organizations where status='active' and deleted_at is null;
create or replace view public.public_comments with (security_invoker=true) as
select id,thread_id,parent_id,depth,display_mode,case when display_mode='named' then display_name end as display_name,body,published_at,delete_tombstone
from comments where status in ('published','deleted');

create policy profiles_self_read on public.profiles for select to authenticated using(id=auth.uid());
create policy profiles_self_update on public.profiles for update to authenticated using(id=auth.uid()) with check(id=auth.uid());
create policy periods_public_read on public.periods for select to anon,authenticated using(status in ('active','closed') and deleted_at is null);
create policy units_public_read on public.dpm_units for select to anon,authenticated using(status='active' and deleted_at is null);
create policy positions_public_read on public.positions for select to anon,authenticated using(deleted_at is null);
create policy organizations_public_read on public.organizations for select to anon,authenticated using(status='active' and deleted_at is null);
create policy organization_members_public_read on public.organization_memberships for select to anon,authenticated using(true);
create policy content_types_public_read on public.content_types for select to anon,authenticated using(is_public and status='active');
create policy contents_editor_read on public.contents for select to authenticated using(public.has_permission('content.read.all',unit_id,id) or public.has_permission('content.read.unit',unit_id,id));
create policy contents_editor_write on public.contents for all to authenticated using(public.has_permission('content.update.all',unit_id,id) or public.has_permission('content.update.unit',unit_id,id)) with check(public.has_permission('content.update.all',unit_id,id) or public.has_permission('content.update.unit',unit_id,id));
create policy revisions_editor_read on public.content_revisions for select to authenticated using(exists(select 1 from contents c where c.id=content_id and (public.has_permission('content.read.all',c.unit_id,c.id) or public.has_permission('content.read.unit',c.unit_id,c.id))));
create policy workflow_editor_read on public.workflow_instances for select to authenticated using(exists(select 1 from contents c where c.id=content_id and public.has_permission('content.read.all',c.unit_id,c.id)));
create policy taxonomy_public_read on public.taxonomies for select to anon,authenticated using(status='active');
create policy taxonomy_terms_public_read on public.taxonomy_terms for select to anon,authenticated using(true);
create policy content_terms_public_read on public.content_terms for select to anon,authenticated using(true);
create policy navigation_public_read on public.navigation_menus for select to anon,authenticated using(status='active');
create policy navigation_items_public_read on public.navigation_items for select to anon,authenticated using(true);
create policy media_public_read on public.media_assets for select to anon,authenticated using(status='ready' and deleted_at is null and bucket='public-media');
create policy comments_public_read on public.comments for select to anon,authenticated using(status in ('published','deleted'));
create policy comment_threads_public_read on public.comment_threads for select to anon,authenticated using(status='active');
create policy notifications_recipient_read on public.notifications for select to authenticated using(recipient_id=auth.uid());
create policy notifications_recipient_update on public.notifications for update to authenticated using(recipient_id=auth.uid()) with check(recipient_id=auth.uid());
create policy iam_profiles_read on public.profiles for select to authenticated using(public.has_permission('iam.read.all',null,id));
create policy audit_authorized_read on public.audit_events for select to authenticated using(public.has_permission('audit.read.all',null,target_id));

revoke update,delete on public.audit_events from anon,authenticated;
revoke all on public.ddas_cases,public.ddas_private_contacts,public.ddas_internal_notes,public.ddas_assignments,public.ddas_case_events,public.comment_deletion_credentials from anon;

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values
('public-media','public-media',true,10485760,array['image/jpeg','image/png','image/webp','image/avif','application/pdf']),
('private-media','private-media',false,10485760,null),
('ddas-attachments','ddas-attachments',false,15728640,null),
('comment-evidence','comment-evidence',false,10485760,null),
('exports','exports',false,52428800,null),
('quarantine','quarantine',false,52428800,null)
on conflict(id) do nothing;

create policy storage_public_media_read on storage.objects for select to anon,authenticated using(bucket_id='public-media');
create policy storage_editor_insert on storage.objects for insert to authenticated with check(bucket_id in ('public-media','private-media') and public.has_permission('media.create.all'));
create policy storage_editor_update on storage.objects for update to authenticated using(bucket_id in ('public-media','private-media') and public.has_permission('media.update.all'));

grant select on public.periods,public.dpm_units,public.positions,public.organizations,public.organization_memberships,public.content_types,public.taxonomies,public.taxonomy_terms,public.content_terms,public.navigation_menus,public.navigation_items,public.media_assets,public.comment_threads,public.comments to anon,authenticated;
grant select on public.published_content,public.public_organizations,public.public_comments to anon,authenticated;
grant select(id,content_type_id,title,slug,summary,published_at,updated_at,language,seo,featured_asset_id,unit_id,period_id,status,deleted_at,visibility) on public.contents to anon,authenticated;
grant select,update(read_at) on public.notifications to authenticated;
grant select on public.profiles to authenticated;
