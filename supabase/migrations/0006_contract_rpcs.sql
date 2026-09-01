-- Transactional public contracts. Raw private tables remain inaccessible to anon.
create or replace function public.submit_ddas(
  p_ticket text, p_tracking_secret_hash text, p_subject text, p_body_ciphertext text,
  p_idempotency_key text, p_contact_ciphertext text, p_contact_hash text,
  p_consent_at timestamptz, p_notification_opt_in boolean, p_request_id uuid
) returns table(ticket text, created boolean)
language plpgsql security definer set search_path=public as $$
declare case_id uuid; existing_ticket text;
begin
  if p_ticket !~ '^D-DAS-[0-9]{4}-[A-Z0-9]{20,}$' or length(trim(p_subject)) < 8 or length(p_body_ciphertext) < 20 then
    raise exception 'DDAS_INVALID';
  end if;
  select ticket_public_id into existing_ticket from ddas_cases where created_idempotency_key=p_idempotency_key;
  if found then return query select existing_ticket,false; return; end if;

  insert into ddas_cases(ticket_public_id,tracking_secret_hash,status,subject,body_ciphertext,submitted_at,acknowledged_at,created_idempotency_key,retention_until)
  values(p_ticket,p_tracking_secret_hash,'received',trim(p_subject),p_body_ciphertext,now(),now(),p_idempotency_key,now()+interval '24 months')
  returning id into case_id;
  insert into ddas_public_timeline(case_id,state,safe_message,occurred_at,published_at)
  values(case_id,'received','Aspirasi telah diterima dan menunggu peninjauan awal.',now(),now());
  if p_contact_ciphertext is not null and p_contact_hash is not null then
    insert into ddas_private_contacts(case_id,channel,address_ciphertext,address_hash,consent_at,notification_opt_in)
    values(case_id,'email',p_contact_ciphertext,p_contact_hash,p_consent_at,p_notification_opt_in);
  end if;
  insert into ddas_case_events(case_id,from_status,to_status,reason,request_id)
  values(case_id,null,'received','Public submission durably accepted',p_request_id);
  perform append_audit_event('public','ddas.submit','ddas_case',case_id,'{}','success','durable receipt',p_request_id);
  return query select p_ticket,true;
end $$;

revoke all on function public.submit_ddas(text,text,text,text,text,text,text,timestamptz,boolean,uuid) from public;
grant execute on function public.submit_ddas(text,text,text,text,text,text,text,timestamptz,boolean,uuid) to anon,authenticated;
