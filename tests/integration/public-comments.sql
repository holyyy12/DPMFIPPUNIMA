-- Run in a transaction and ROLLBACK: no test comments survive.
insert into public.comment_threads(resource_type,resource_key,mode,status,max_depth)
values('publication','publication:transaction-comment-test','pre','active',3);
set local role anon;
select set_config('request.jwt.claims','{"role":"anon"}',true);
do $$ declare comment_id uuid; reply_id uuid; begin
  comment_id := public.create_public_comment('publication:transaction-comment-test',null,'anonymous',null,
    'A valid public comment',null,gen_random_uuid());
  perform set_config('test.comment_id',comment_id::text,true);
  if not exists(select 1 from public.public_comments where id=comment_id and body='A valid public comment')
    then raise exception 'Comment was not published immediately'; end if;
  reply_id := public.create_public_comment('publication:transaction-comment-test',comment_id,'named','Mahasiswa',
    'A reply without approval',null,gen_random_uuid());
  perform set_config('test.reply_id',reply_id::text,true);
  if has_function_privilege('anon','public.delete_own_comment(uuid,text,uuid)','EXECUTE')
    or has_table_privilege('anon','public.comments','DELETE')
    or has_table_privilege('authenticated','public.comments','DELETE')
    then raise exception 'Public deletion still permitted'; end if;
  begin
    perform public.delete_own_comment(comment_id,'any-old-secret',gen_random_uuid());
    raise exception 'Legacy deletion unexpectedly allowed';
  exception when insufficient_privilege then null; end;
end $$;
reset role;
select set_config('request.jwt.claims','{"role":"authenticated","aal":"aal1"}',true);
set local role authenticated;
do $$ begin
  begin
    perform public.moderate_comment(current_setting('test.comment_id')::uuid,'deleted','other','test',gen_random_uuid());
    raise exception 'Unauthenticated deletion unexpectedly allowed';
  exception when raise_exception then if sqlerrm <> 'FORBIDDEN' then raise; end if; end;
end $$;
reset role;
select set_config('request.jwt.claims','{"sub":"d1759968-72ca-4857-b1f9-99d14e544dcb","role":"authenticated","aal":"aal1"}',true);
set local role authenticated;
do $$ begin
  if not public.moderate_comment(current_setting('test.comment_id')::uuid,'deleted','other','test removal',gen_random_uuid())
    then raise exception 'Admin deletion failed'; end if;
  if not exists(select 1 from public.public_comments where id=current_setting('test.comment_id')::uuid
    and delete_tombstone and body='[Komentar dihapus oleh admin]') then raise exception 'Missing parent tombstone'; end if;
  if not exists(select 1 from public.public_comments where id=current_setting('test.reply_id')::uuid)
    then raise exception 'Reply removed by parent deletion'; end if;
  perform public.moderate_comment(current_setting('test.reply_id')::uuid,'deleted','other','test removal',gen_random_uuid());
  if exists(select 1 from public.public_comments where id=current_setting('test.reply_id')::uuid)
    then raise exception 'Deleted leaf remains public'; end if;
end $$;
reset role;
do $$ begin
  if exists(select 1 from public.comment_deletion_credentials
    where comment_id in (current_setting('test.comment_id')::uuid,current_setting('test.reply_id')::uuid))
    then raise exception 'Deletion credential issued'; end if;
end $$;
select 'Immediate publishing and admin-only deletion verified' as result;
