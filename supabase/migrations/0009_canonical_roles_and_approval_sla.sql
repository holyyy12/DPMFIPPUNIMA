-- Canonical IAM roles and backend-only approval SLA.
-- No public/admin UI contract is changed by this migration.
-- Approval policy: Organization Unit -> Secretary (36h) -> Super Admin (12h) -> system fallback approval.

create schema if not exists private;

-- ---------------------------------------------------------------------------
-- 1. Canonical role model
-- ---------------------------------------------------------------------------
insert into public.roles(key,name,description,system_role,status)
values
  ('super_admin','Super Admin','Full administrative control with audited sensitive actions',true,'active'),
  ('chairperson','Chairperson','Institutional oversight and leadership access',true,'active'),
  ('secretary','Secretary','Secretariat, review, approval, and publication operations',true,'active'),
  ('organization_unit','Organization Unit','Dynamic unit-scoped role; the concrete unit is resolved from dpm_units and user_roles.unit_id',true,'active'),
  ('ormawa','ORMAWA','Manage an approved organization profile and its program publications',true,'active')
on conflict(key) do update
set name=excluded.name,
    description=excluded.description,
    system_role=excluded.system_role,
    status='active',
    updated_at=now();

-- Historical role keys are retained only for audit/history, never for authorization.
update public.roles
set status='archived', updated_at=now(),
    description=concat(description, case when description='' then '' else ' ' end, '[Archived: replaced by canonical organization_unit + scoped permissions]')
where key in ('viewer','unit_lead','editor','reviewer','ddas_coordinator','ddas_handler','moderator')
  and status <> 'archived';

-- Permission capabilities replace the former operational role proliferation.
insert into public.permissions(key,resource,action,scope_kind,description,risk_level)
values
  ('approval.submit.unit','approval','submit','unit','Submit a unit-scoped resource for approval','normal'),
  ('approval.read.unit','approval','read','unit','Read approval requests within the assigned unit','normal'),
  ('approval.read.all','approval','read','all','Read all approval requests','high'),
  ('approval.decide.secretary','approval','decide','secretary','Decide an approval during the Secretary stage','high'),
  ('approval.decide.super_admin','approval','decide','super_admin','Decide an escalated approval during the Super Admin stage','critical')
on conflict(key) do update
set description=excluded.description, risk_level=excluded.risk_level;

-- Baseline permissions for a dynamic Organization Unit account.
insert into public.role_permissions(role_id,permission_id,effect)
select r.id,p.id,'allow'::public.permission_effect
from public.roles r
join public.permissions p on p.key in (
  'content.read.unit',
  'content.update.unit',
  'media.create.all',
  'approval.submit.unit',
  'approval.read.unit'
)
where r.key='organization_unit'
on conflict(role_id,permission_id) do update set effect=excluded.effect;

-- Secretary capabilities. Specialized D-DAS/moderation permissions remain grantable
-- through scoped_grants so unit structure can change without creating new roles.
insert into public.role_permissions(role_id,permission_id,effect)
select r.id,p.id,'allow'::public.permission_effect
from public.roles r
join public.permissions p on p.key in (
  'content.read.all',
  'content.update.all',
  'content.publish.all',
  'media.create.all',
  'media.update.all',
  'approval.read.all',
  'approval.decide.secretary'
)
where r.key='secretary'
on conflict(role_id,permission_id) do update set effect=excluded.effect;

-- Chairperson can oversee approvals but is not part of the 36h + 12h decision chain.
insert into public.role_permissions(role_id,permission_id,effect)
select r.id,p.id,'allow'::public.permission_effect
from public.roles r
join public.permissions p on p.key='approval.read.all'
where r.key='chairperson'
on conflict(role_id,permission_id) do update set effect=excluded.effect;

-- Super Admin must receive any permissions introduced after the original seed.
insert into public.role_permissions(role_id,permission_id,effect)
select r.id,p.id,'allow'::public.permission_effect
from public.roles r
cross join public.permissions p
where r.key='super_admin'
on conflict(role_id,permission_id) do update set effect=excluded.effect;

-- Preserve existing users that may have legacy unit-scoped roles.
-- The old role remains as history, while active authorization moves to organization_unit.
insert into public.user_roles(profile_id,role_id,period_id,unit_id,starts_at,ends_at,granted_by,reason)
select distinct
  ur.profile_id,
  canonical.id,
  ur.period_id,
  ur.unit_id,
  ur.starts_at,
  ur.ends_at,
  ur.granted_by,
  concat('Canonical role migration from ', legacy.key)
from public.user_roles ur
join public.roles legacy on legacy.id=ur.role_id
join public.roles canonical on canonical.key='organization_unit'
where legacy.key in ('unit_lead','editor','reviewer','ddas_coordinator','ddas_handler','moderator')
  and ur.deleted_at is null
  and ur.unit_id is not null
  and not exists (
    select 1 from public.user_roles existing
    where existing.profile_id=ur.profile_id
      and existing.role_id=canonical.id
      and existing.unit_id=ur.unit_id
      and existing.period_id is not distinct from ur.period_id
      and existing.deleted_at is null
      and existing.starts_at=ur.starts_at
  );

-- Preserve legacy per-role capabilities as scoped grants during transition.
insert into public.scoped_grants(
  profile_id,permission_id,period_id,unit_id,effect,priority,starts_at,ends_at,granted_by,reason
)
select distinct
  ur.profile_id,
  rp.permission_id,
  ur.period_id,
  ur.unit_id,
  rp.effect,
  10,
  ur.starts_at,
  ur.ends_at,
  ur.granted_by,
  concat('Migrated capability from archived role ', legacy.key)
from public.user_roles ur
join public.roles legacy on legacy.id=ur.role_id
join public.role_permissions rp on rp.role_id=legacy.id
where legacy.key in ('unit_lead','editor','reviewer','ddas_coordinator','ddas_handler','moderator')
  and ur.deleted_at is null
  and ur.unit_id is not null
  and not exists (
    select 1 from public.scoped_grants sg
    where sg.profile_id=ur.profile_id
      and sg.permission_id=rp.permission_id
      and sg.unit_id is not distinct from ur.unit_id
      and sg.period_id is not distinct from ur.period_id
      and sg.deleted_at is null
      and sg.reason=concat('Migrated capability from archived role ', legacy.key)
  );

-- Archived roles must never continue to authorize users.
create or replace function public.has_permission(permission_key text, p_unit_id uuid default null, p_resource_id uuid default null)
returns boolean
language sql
stable
security definer
set search_path=''
as $$
  with subject as (
    select p.id
    from public.profiles p
    where p.id=(select auth.uid())
      and p.status='active'
      and p.deleted_at is null
  ), role_decisions as (
    select rp.effect
    from subject s
    join public.user_roles ur on ur.profile_id=s.id
      and ur.deleted_at is null
      and ur.starts_at <= now()
      and (ur.ends_at is null or ur.ends_at > now())
      and (ur.unit_id is null or p_unit_id is null or ur.unit_id=p_unit_id)
    join public.roles r on r.id=ur.role_id and r.status='active'
    join public.role_permissions rp on rp.role_id=ur.role_id
    join public.permissions p on p.id=rp.permission_id and p.key=permission_key
  ), grant_decisions as (
    select sg.effect
    from subject s
    join public.scoped_grants sg on sg.profile_id=s.id
      and sg.deleted_at is null
      and sg.starts_at <= now()
      and (sg.ends_at is null or sg.ends_at > now())
      and (sg.unit_id is null or sg.unit_id=p_unit_id)
      and (sg.resource_id is null or sg.resource_id=p_resource_id)
    join public.permissions p on p.id=sg.permission_id and p.key=permission_key
  ), decisions as (
    select effect from role_decisions
    union all
    select effect from grant_decisions
  )
  select exists(select 1 from decisions where effect='allow')
     and not exists(select 1 from decisions where effect='deny')
$$;

-- ---------------------------------------------------------------------------
-- 2. Approval SLA data model
-- ---------------------------------------------------------------------------
alter table public.approval_requests
  add column if not exists unit_id uuid references public.dpm_units(id) on delete restrict,
  add column if not exists policy_key text not null default 'manual',
  add column if not exists stage text not null default 'manual',
  add column if not exists secretary_deadline_at timestamptz,
  add column if not exists super_admin_deadline_at timestamptz,
  add column if not exists escalated_at timestamptz,
  add column if not exists fallback_at timestamptz,
  add column if not exists decision_source text;

alter table public.approval_requests
  drop constraint if exists approval_requests_policy_key_check,
  add constraint approval_requests_policy_key_check
    check(policy_key in ('manual','organization_unit_36h_12h')),
  drop constraint if exists approval_requests_stage_check,
  add constraint approval_requests_stage_check
    check(stage in ('manual','secretary','super_admin','completed')),
  drop constraint if exists approval_requests_decision_source_check,
  add constraint approval_requests_decision_source_check
    check(decision_source is null or decision_source in ('human','system_fallback')),
  drop constraint if exists approval_requests_sla_deadlines_check,
  add constraint approval_requests_sla_deadlines_check
    check(
      policy_key <> 'organization_unit_36h_12h'
      or (
        secretary_deadline_at is not null
        and super_admin_deadline_at is not null
        and super_admin_deadline_at = secretary_deadline_at + interval '12 hours'
      )
    );

create index if not exists approval_sla_secretary_idx
  on public.approval_requests(secretary_deadline_at)
  where status='pending' and policy_key='organization_unit_36h_12h' and stage='secretary';

create index if not exists approval_sla_super_admin_idx
  on public.approval_requests(super_admin_deadline_at)
  where status='pending' and policy_key='organization_unit_36h_12h' and stage='super_admin';

drop trigger if exists approval_requests_set_updated_at on public.approval_requests;
create trigger approval_requests_set_updated_at
before update on public.approval_requests
for each row execute function public.set_updated_at();

-- Store the policy as private configuration/documentation as well.
insert into public.settings(namespace,key,value,schema_version,is_public)
values(
  'iam',
  'organization_unit_approval_sla',
  '{"secretaryHours":36,"superAdminHours":12,"fallbackApproval":true,"totalHours":48}',
  1,
  false
)
on conflict(namespace,key) do update
set value=excluded.value, schema_version=excluded.schema_version, is_public=false, updated_at=now();

-- ---------------------------------------------------------------------------
-- 3. Internal helpers
-- ---------------------------------------------------------------------------
create or replace function private.has_active_role(p_role_key text, p_unit_id uuid default null)
returns boolean
language sql
stable
security definer
set search_path=''
as $$
  select exists(
    select 1
    from public.user_roles ur
    join public.roles r on r.id=ur.role_id
    join public.profiles p on p.id=ur.profile_id
    where ur.profile_id=(select auth.uid())
      and r.key=p_role_key
      and r.status='active'
      and p.status='active'
      and p.deleted_at is null
      and ur.deleted_at is null
      and ur.starts_at <= now()
      and (ur.ends_at is null or ur.ends_at > now())
      and (p_unit_id is null or ur.unit_id is null or ur.unit_id=p_unit_id)
  )
$$;

create or replace function private.apply_content_approval_result(
  p_resource_id uuid,
  p_result text,
  p_actor_id uuid,
  p_reason text,
  p_source text,
  p_approval_request_id uuid
)
returns void
language plpgsql
security definer
set search_path=''
as $$
declare
  wf public.workflow_instances%rowtype;
  next_state public.content_status;
begin
  if p_result='approved' then
    next_state := 'approved'::public.content_status;
  elsif p_result in ('changes_requested','rejected') then
    next_state := 'changes_requested'::public.content_status;
  else
    return;
  end if;

  select * into wf
  from public.workflow_instances
  where content_id=p_resource_id
  for update;

  if not found then
    return;
  end if;

  update public.contents
  set status=next_state,
      review_due_at=null,
      updated_at=now()
  where id=p_resource_id;

  update public.workflow_instances
  set state=next_state,
      approved_by=case when next_state='approved' then p_actor_id else null end,
      approved_at=case when next_state='approved' then now() else null end,
      version=version+1,
      updated_at=now()
  where id=wf.id;

  insert into public.workflow_events(workflow_id,from_state,to_state,actor_id,reason,metadata)
  values(
    wf.id,
    wf.state,
    next_state,
    p_actor_id,
    coalesce(nullif(trim(p_reason),''),case when p_source='system_fallback' then 'System fallback approval after SLA expiry' else 'Approval decision' end),
    jsonb_build_object(
      'approvalRequestId',p_approval_request_id,
      'decisionSource',p_source,
      'policy','organization_unit_36h_12h'
    )
  );
end
$$;

-- ---------------------------------------------------------------------------
-- 4. RPC: submit an Organization Unit resource for the 36h + 12h workflow
-- ---------------------------------------------------------------------------
create or replace function public.submit_organization_unit_approval(
  p_kind text,
  p_resource_type text,
  p_resource_id uuid,
  p_unit_id uuid,
  p_reason text default null,
  p_request_id uuid default gen_random_uuid()
)
returns uuid
language plpgsql
security definer
set search_path=''
as $$
declare
  approval_id uuid := gen_random_uuid();
  now_at timestamptz := now();
  secretary_due timestamptz := now_at + interval '36 hours';
  super_admin_due timestamptz := now_at + interval '48 hours';
  wf public.workflow_instances%rowtype;
  prior_state public.content_status;
begin
  if (select auth.uid()) is null then
    raise exception 'UNAUTHENTICATED';
  end if;

  if not public.has_permission('approval.submit.unit',p_unit_id,p_resource_id) then
    raise exception 'FORBIDDEN';
  end if;

  if not private.has_active_role('organization_unit',p_unit_id)
     and not private.has_active_role('super_admin',null) then
    raise exception 'FORBIDDEN';
  end if;

  if p_kind is null or length(trim(p_kind))=0
     or p_resource_type is null or length(trim(p_resource_type))=0 then
    raise exception 'APPROVAL_INVALID';
  end if;

  if p_resource_type='content' then
    select wi.state into prior_state
    from public.workflow_instances wi
    where wi.content_id=p_resource_id;

    if not exists(
      select 1 from public.contents c
      where c.id=p_resource_id
        and c.deleted_at is null
        and c.unit_id=p_unit_id
    ) then
      raise exception 'APPROVAL_RESOURCE_INVALID';
    end if;

    insert into public.workflow_instances as wi(content_id,state,current_revision_id,submitted_by,submitted_at)
    select c.id,'in_review'::public.content_status,c.current_revision_id,(select auth.uid()),now_at
    from public.contents c
    where c.id=p_resource_id
    on conflict(content_id) do update
      set state='in_review'::public.content_status,
          current_revision_id=excluded.current_revision_id,
          submitted_by=excluded.submitted_by,
          submitted_at=excluded.submitted_at,
          approved_by=null,
          approved_at=null,
          version=wi.version+1,
          updated_at=now()
    returning * into wf;

    update public.contents
    set status='in_review'::public.content_status,
        review_due_at=secretary_due,
        updated_at=now()
    where id=p_resource_id;

    insert into public.workflow_events(workflow_id,from_state,to_state,actor_id,reason,metadata)
    values(
      wf.id,
      prior_state,
      'in_review'::public.content_status,
      (select auth.uid()),
      coalesce(nullif(trim(p_reason),''),'Submitted for approval'),
      jsonb_build_object('policy','organization_unit_36h_12h')
    );
  end if;

  insert into public.approval_requests(
    id,kind,resource_type,resource_id,requested_by,unit_id,status,policy_key,stage,
    secretary_deadline_at,super_admin_deadline_at,reason,created_at,updated_at
  ) values(
    approval_id,trim(p_kind),trim(p_resource_type),p_resource_id,(select auth.uid()),p_unit_id,'pending',
    'organization_unit_36h_12h','secretary',secretary_due,super_admin_due,p_reason,now_at,now_at
  );

  perform public.append_audit_event(
    'authenticated',
    'approval.submit',
    'approval_request',
    approval_id,
    jsonb_build_object('unitId',p_unit_id,'resourceType',p_resource_type,'resourceId',p_resource_id),
    'success',
    p_reason,
    p_request_id
  );

  insert into public.outbox_events(topic,aggregate_type,aggregate_id,payload_safe,dedupe_key)
  values(
    'approval.submitted',
    'approval_request',
    approval_id,
    jsonb_build_object('stage','secretary','secretaryDeadlineAt',secretary_due,'resourceType',p_resource_type),
    concat('approval.submitted:',approval_id::text)
  )
  on conflict(dedupe_key) do nothing;

  return approval_id;
end
$$;

-- ---------------------------------------------------------------------------
-- 5. RPC: manual decision, with separation of duties and stage enforcement
-- ---------------------------------------------------------------------------
create or replace function public.decide_approval_request(
  p_approval_request_id uuid,
  p_decision text,
  p_reason text,
  p_request_id uuid default gen_random_uuid()
)
returns boolean
language plpgsql
security definer
set search_path=''
as $$
declare
  req public.approval_requests%rowtype;
  actor uuid := (select auth.uid());
  next_status text;
begin
  if actor is null then
    raise exception 'UNAUTHENTICATED';
  end if;

  if coalesce((auth.jwt()->>'aal'),'aal1') <> 'aal2' then
    raise exception 'MFA_REQUIRED';
  end if;

  if p_decision not in ('approved','changes_requested','rejected') then
    raise exception 'APPROVAL_DECISION_INVALID';
  end if;

  select * into req
  from public.approval_requests
  where id=p_approval_request_id
  for update;

  if not found or req.status <> 'pending' then
    raise exception 'APPROVAL_NOT_PENDING';
  end if;

  if req.requested_by=actor then
    raise exception 'SELF_APPROVAL_FORBIDDEN';
  end if;

  if req.policy_key='organization_unit_36h_12h' then
    if req.stage='secretary' then
      if not private.has_active_role('secretary',null)
         or not public.has_permission('approval.decide.secretary',req.unit_id,req.resource_id) then
        raise exception 'FORBIDDEN';
      end if;
    elsif req.stage='super_admin' then
      if not private.has_active_role('super_admin',null)
         or not public.has_permission('approval.decide.super_admin',req.unit_id,req.resource_id) then
        raise exception 'FORBIDDEN';
      end if;
    else
      raise exception 'APPROVAL_STAGE_INVALID';
    end if;
  else
    if not private.has_active_role('super_admin',null) then
      raise exception 'FORBIDDEN';
    end if;
  end if;

  next_status := p_decision;

  update public.approval_requests
  set status=next_status,
      stage='completed',
      decision_by=actor,
      decision_at=now(),
      decision_source='human',
      reason=p_reason,
      updated_at=now()
  where id=req.id;

  if req.resource_type='content' then
    perform private.apply_content_approval_result(req.resource_id,next_status,actor,p_reason,'human',req.id);
  end if;

  perform public.append_audit_event(
    'authenticated',
    concat('approval.',next_status),
    'approval_request',
    req.id,
    jsonb_build_object('unitId',req.unit_id,'stage',req.stage,'resourceType',req.resource_type,'resourceId',req.resource_id),
    'success',
    p_reason,
    p_request_id
  );

  insert into public.outbox_events(topic,aggregate_type,aggregate_id,payload_safe,dedupe_key)
  values(
    concat('approval.',next_status),
    'approval_request',
    req.id,
    jsonb_build_object('decision',next_status,'decisionSource','human','resourceType',req.resource_type),
    concat('approval.',next_status,':',req.id::text)
  )
  on conflict(dedupe_key) do nothing;

  return true;
end
$$;

-- ---------------------------------------------------------------------------
-- 6. Cron processor: 36h escalation + 12h fallback approval
-- ---------------------------------------------------------------------------
create or replace function private.process_approval_deadlines()
returns jsonb
language plpgsql
security definer
set search_path=''
as $$
declare
  req public.approval_requests%rowtype;
  escalated_count integer := 0;
  fallback_count integer := 0;
  audit_request_id uuid;
begin
  -- Secretary SLA expired: move to Super Admin. Deadline remains anchored at T+48h.
  for req in
    select *
    from public.approval_requests
    where status='pending'
      and policy_key='organization_unit_36h_12h'
      and stage='secretary'
      and secretary_deadline_at <= now()
    order by secretary_deadline_at,id
    for update skip locked
  loop
    update public.approval_requests
    set stage='super_admin',
        escalated_at=coalesce(escalated_at,now()),
        assigned_to=null,
        updated_at=now()
    where id=req.id;

    if req.resource_type='content' then
      update public.contents
      set review_due_at=req.super_admin_deadline_at,
          updated_at=now()
      where id=req.resource_id;
    end if;

    audit_request_id := gen_random_uuid();
    perform public.append_audit_event(
      'system',
      'approval.escalated',
      'approval_request',
      req.id,
      jsonb_build_object('from','secretary','to','super_admin','policy','organization_unit_36h_12h'),
      'success',
      'Secretary 36-hour approval window expired',
      audit_request_id
    );

    insert into public.outbox_events(topic,aggregate_type,aggregate_id,payload_safe,dedupe_key)
    values(
      'approval.escalated',
      'approval_request',
      req.id,
      jsonb_build_object('stage','super_admin','superAdminDeadlineAt',req.super_admin_deadline_at,'resourceType',req.resource_type),
      concat('approval.escalated:',req.id::text)
    )
    on conflict(dedupe_key) do nothing;

    escalated_count := escalated_count + 1;
  end loop;

  -- Super Admin SLA expired: system fallback approval.
  for req in
    select *
    from public.approval_requests
    where status='pending'
      and policy_key='organization_unit_36h_12h'
      and stage='super_admin'
      and super_admin_deadline_at <= now()
    order by super_admin_deadline_at,id
    for update skip locked
  loop
    update public.approval_requests
    set status='approved',
        stage='completed',
        decision_by=null,
        decision_at=now(),
        decision_source='system_fallback',
        fallback_at=now(),
        reason=coalesce(nullif(reason,''),'System fallback approval after Secretary 36h + Super Admin 12h SLA expired'),
        updated_at=now()
    where id=req.id;

    if req.resource_type='content' then
      perform private.apply_content_approval_result(
        req.resource_id,
        'approved',
        null,
        'System fallback approval after Secretary 36h + Super Admin 12h SLA expired',
        'system_fallback',
        req.id
      );
    end if;

    audit_request_id := gen_random_uuid();
    perform public.append_audit_event(
      'system',
      'approval.fallback_approved',
      'approval_request',
      req.id,
      jsonb_build_object('policy','organization_unit_36h_12h','resourceType',req.resource_type,'resourceId',req.resource_id),
      'success',
      'Secretary 36-hour and Super Admin 12-hour approval windows expired',
      audit_request_id
    );

    insert into public.outbox_events(topic,aggregate_type,aggregate_id,payload_safe,dedupe_key)
    values(
      'approval.fallback_approved',
      'approval_request',
      req.id,
      jsonb_build_object('decision','approved','decisionSource','system_fallback','resourceType',req.resource_type),
      concat('approval.fallback_approved:',req.id::text)
    )
    on conflict(dedupe_key) do nothing;

    fallback_count := fallback_count + 1;
  end loop;

  return jsonb_build_object('escalated',escalated_count,'fallbackApproved',fallback_count,'processedAt',now());
end
$$;

-- ---------------------------------------------------------------------------
-- 7. Approval visibility: read-only through Data API; mutations go through RPCs.
-- ---------------------------------------------------------------------------
drop policy if exists approval_authorized_read on public.approval_requests;
create policy approval_authorized_read
on public.approval_requests
for select
to authenticated
using(
  requested_by=(select auth.uid())
  or public.has_permission('approval.read.all',unit_id,resource_id)
  or public.has_permission('approval.read.unit',unit_id,resource_id)
);

grant select on public.approval_requests to authenticated;
revoke insert,update,delete on public.approval_requests from anon,authenticated;

-- Protect RPCs and private helpers.
revoke all on function public.submit_organization_unit_approval(text,text,uuid,uuid,text,uuid) from public;
revoke all on function public.decide_approval_request(uuid,text,text,uuid) from public;
grant execute on function public.submit_organization_unit_approval(text,text,uuid,uuid,text,uuid) to authenticated;
grant execute on function public.decide_approval_request(uuid,text,text,uuid) to authenticated;

revoke all on schema private from public,anon,authenticated;
revoke execute on all functions in schema private from public,anon,authenticated;

-- append_audit_event is an internal helper, not a public RPC. Existing definer RPCs
-- can still call it as their function owner after these revocations.
revoke all on function public.append_audit_event(text,text,text,uuid,jsonb,text,text,uuid,text,text) from public;
revoke all on function public.append_audit_event(text,text,text,uuid,jsonb,text,text,uuid,text,text) from anon,authenticated;

-- ---------------------------------------------------------------------------
-- 8. Supabase Cron schedule. One-minute cadence keeps the 36h / 12h SLA bounded.
-- ---------------------------------------------------------------------------
create extension if not exists pg_cron with schema pg_catalog;

do $$
begin
  if exists(select 1 from cron.job where jobname='dpm-approval-sla') then
    perform cron.unschedule('dpm-approval-sla');
  end if;
end
$$;

select cron.schedule(
  'dpm-approval-sla',
  '* * * * *',
  'select private.process_approval_deadlines();'
);
