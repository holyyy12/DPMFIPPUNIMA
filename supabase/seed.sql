-- Bootstrap reference data only. No real users, legacy content, credentials, or PII.
insert into public.permissions(key,resource,action,scope_kind,description,risk_level) values
('content.read.all','content','read','all','Read all editorial content','normal'),
('content.read.unit','content','read','unit','Read unit editorial content','normal'),
('content.update.all','content','update','all','Update all content','high'),
('content.update.unit','content','update','unit','Update unit content','normal'),
('content.publish.all','content','publish','all','Publish approved content','high'),
('media.create.all','media','create','all','Upload governed media','normal'),
('media.update.all','media','update','all','Update governed media','normal'),
('ddas.read.assigned','ddas','read','assigned','Read assigned cases','high'),
('ddas.update.assigned','ddas','update','assigned','Transition assigned cases','high'),
('comments.moderate.all','comments','moderate','all','Moderate comments','high'),
('iam.read.all','iam','read','all','Read IAM configuration','high'),
('iam.update.all','iam','update','all','Manage IAM configuration','critical'),
('audit.read.all','audit','read','all','Read append-only audit trail','critical'),
('settings.update.all','settings','update','all','Manage site configuration','high'),
('ormawa.update.own','ormawa','update','own','Edit the assigned ORMAWA profile page','normal'),
('ormawa.publish.own','ormawa','publish','own','Publish the assigned ORMAWA profile after page approval','high')
on conflict(key) do nothing;

insert into public.roles(key,name,description,system_role) values
('super_admin','Super Admin','Full administrative control with AAL2 and audited sensitive actions',true),
('chairperson','Chairperson','Institutional operations without audit-log access',true),
('secretary','Secretary','Secretariat permissions assigned explicitly',true),
('unit_lead','Unit Lead','Scoped unit management',true),
('editor','Editor','Create and revise scoped content',true),
('reviewer','Reviewer','Review content with separation of duties',true),
('ddas_coordinator','D-DAS Coordinator','Coordinate case intake and assignment',true),
('ddas_handler','D-DAS Handler','Handle assigned cases',true),
('moderator','Moderator','Moderate comments and reports',true),
('ormawa','ORMAWA','Manage an approved organization profile and its program publications',true)
on conflict(key) do nothing;

insert into public.role_permissions(role_id,permission_id,effect)
select r.id,p.id,'allow'::public.permission_effect from public.roles r join public.permissions p on p.key in ('ormawa.update.own','ormawa.publish.own','content.read.all','media.create.all') where r.key='ormawa'
on conflict(role_id,permission_id) do update set effect=excluded.effect;

insert into public.role_permissions(role_id,permission_id,effect)
select r.id,p.id,'allow'::public.permission_effect from public.roles r cross join public.permissions p where r.key='super_admin'
on conflict(role_id,permission_id) do update set effect=excluded.effect;

insert into public.role_permissions(role_id,permission_id,effect)
select r.id,p.id,'allow'::public.permission_effect from public.roles r join public.permissions p on p.key in ('content.read.all','content.update.all','content.publish.all','media.create.all','media.update.all','ddas.read.assigned','ddas.update.assigned','comments.moderate.all','settings.update.all') where r.key='chairperson'
on conflict(role_id,permission_id) do update set effect=excluded.effect;
insert into public.role_permissions(role_id,permission_id,effect)
select r.id,p.id,'deny'::public.permission_effect from public.roles r join public.permissions p on p.key='audit.read.all' where r.key='chairperson'
on conflict(role_id,permission_id) do update set effect=excluded.effect;

insert into public.content_types(key,name,route_pattern,field_schema) values
('berita','Berita','/berita/[slug]','{"required":["title","summary","blocks"]}'),
('d-sight','D-SIGHT','/d-sight/[slug]','{"required":["title","summary","blocks"]}'),
('d-trace','D-TRACE','/d-trace/[slug]','{"required":["title","summary","blocks"]}'),
('d-dar','D-DAR','/d-dar/[slug]','{"required":["title","summary","blocks"]}'),
('program','Program Kerja','/program/[slug]','{"required":["title","summary","blocks"]}'),
('page','Halaman Statis','/[slug]','{"required":["title","blocks"]}')
on conflict(key) do nothing;

insert into public.taxonomies(key,name,applies_to) values
('category','Kategori','["berita","d-sight","d-trace","d-dar","program"]'),
('tag','Tag','["berita","d-sight","d-trace","d-dar","program"]'),
('ddas_category','Kategori D-DAS','["ddas"]')
on conflict(key) do nothing;

insert into public.comment_threads(resource_type,resource_key,mode,status,max_depth)
values('page','home','post','active',3) on conflict(resource_key) do nothing;

insert into public.feature_flags(key,description,enabled,kill_switch) values
('cms_new_renderer','Versioned CMS block renderer',false,true),
('ddas_secure_tracking','Independent-secret D-DAS tracking',false,true),
('comments_rollout','Public comments and moderation',false,true),
('search_index','Public full-text search',false,true),
('notifications','In-app and opt-in delivery',false,true)
on conflict(key) do nothing;

insert into public.settings(namespace,key,value,schema_version,is_public) values
('site','timezone','"Asia/Makassar"',1,true),
('site','locale','"id-ID"',1,true),
('service','ddas_first_response_days','2',1,true),
('privacy','analytics_enabled','false',1,true)
on conflict(namespace,key) do nothing;
