create or replace function public.verify_admin_media_object(p_bucket text,p_path text,p_size bigint) returns boolean language sql stable security definer set search_path='' as $$
 select auth.uid() is not null and auth.jwt()->>'aal'='aal2' and public.has_permission('media.create.all')
 and p_bucket in ('public-media','private-media') and p_path like 'admin/'||auth.uid()::text||'/%'
 and exists(select 1 from storage.objects o where bucket_id=p_bucket and name=p_path and (metadata->>'size')::bigint=p_size);
$$;
revoke all on function public.verify_admin_media_object(text,text,bigint) from public,anon;
grant execute on function public.verify_admin_media_object(text,text,bigint) to authenticated;
