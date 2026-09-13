-- Run with Supabase CLI db query --linked --file. All test rows are rolled back.
begin;
do $$
declare sid uuid; cid uuid; ticket text:='D-DAS-2026-'||upper(replace(gen_random_uuid()::text,'-','')); path text; thread text; first_vote boolean; second_vote boolean; admin_id uuid;
begin
 insert into public.surveys(title,slug,form_schema,status,opens_at,result_visibility)
 values('QA rollback only','qa-'||gen_random_uuid(),'{"options":["A","B"]}','active',now(),'aggregate') returning id into sid;
 first_vote:=public.submit_public_survey(sid,'A',repeat('x',36));
 second_vote:=public.submit_public_survey(sid,'A',repeat('x',36));
 if not first_vote or second_vote then raise exception 'Survey deduplication failed'; end if;
 begin perform public.submit_public_survey(sid,'Invalid',repeat('y',36));raise exception 'Invalid option accepted';exception when others then if sqlerrm<>'INVALID_SURVEY' then raise; end if;end;
 select resource_key into thread from public.comment_threads where status='active' limit 1;
 if thread is not null then
  if public.create_public_comment(thread,null,'anonymous',null,'QA rollback only',repeat('q',64),gen_random_uuid()) is null then raise exception 'Comment failed';end if;
 end if;
 perform public.submit_ddas(ticket,repeat('h',43),'QA rollback subject',repeat('c',50),gen_random_uuid()::text,null,null,now(),false,gen_random_uuid());
 select id into cid from public.ddas_cases where ticket_public_id=ticket;
 path:=public.prepare_ddas_upload(ticket,repeat('h',43),'qa.pdf','application/pdf',128);
 if not private.ddas_upload_allowed(path) or private.ddas_upload_allowed('unknown') then raise exception 'Upload capability failed';end if;
 if private.can_read_ddas(cid) then raise exception 'Anonymous evidence access';end if;
 select ur.profile_id into admin_id from public.user_roles ur join public.roles r on r.id=ur.role_id where r.key='super_admin' and ur.deleted_at is null limit 1;
 if admin_id is not null then
  perform set_config('request.jwt.claims',jsonb_build_object('sub',admin_id,'aal','aal1')::text,true);
  if not private.can_read_ddas(cid) then raise exception 'Admin evidence access denied';end if;
  perform set_config('request.jwt.claims','{"role":"anon"}',true);
  if private.can_read_ddas(cid) then raise exception 'Anonymous evidence access detected';end if;
 end if;
 begin perform public.prepare_ddas_upload(ticket,'wrong','qa.pdf','application/pdf',128);raise exception 'Invalid receipt accepted';exception when others then if sqlerrm<>'INVALID_RECEIPT' then raise;end if;end;
end $$;
select 'PASS: survey, comments, receipt verification, private upload and permission boundaries' as result;
rollback;
