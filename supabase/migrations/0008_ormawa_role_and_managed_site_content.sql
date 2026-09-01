-- Forward-only transition: Viewer is replaced by a scoped ORMAWA publisher role.
insert into public.permissions(key,resource,action,scope_kind,description,risk_level) values
('ormawa.update.own','ormawa','update','own','Edit the assigned ORMAWA profile page','normal'),
('ormawa.publish.own','ormawa','publish','own','Publish the assigned ORMAWA profile after page approval','high')
on conflict(key) do update set description=excluded.description, risk_level=excluded.risk_level;

insert into public.roles(key,name,description,system_role) values
('ormawa','ORMAWA','Manage an approved organization profile and its program publications',true)
on conflict(key) do update set name=excluded.name, description=excluded.description, status='active';

update public.roles set status='archived', description='Replaced by scoped ORMAWA role' where key='viewer';

insert into public.role_permissions(role_id,permission_id,effect)
select r.id,p.id,'allow'::public.permission_effect
from public.roles r join public.permissions p on p.key in ('ormawa.update.own','ormawa.publish.own','content.read.all','media.create.all')
where r.key='ormawa'
on conflict(role_id,permission_id) do update set effect=excluded.effect;

insert into public.settings(namespace,key,value,is_public) values
('site_content','home_hero','{"title":"DPM FIPP UNIMA","subtitle":"Representasi, Aspirasi, Legislasi, dan Pengawasan Mahasiswa.","image":"/fipp-campus-hero.png"}',true),
('site_content','about_page','{"editable":true,"managedStructure":true}',true),
('site_content','asset_policy','{"logosEditable":true,"photosEditable":true,"owner":"super_admin"}',false),
('iam','ormawa_page_workflow','{"requestRoles":["super_admin","chairperson","secretary"],"selfPublishAfterApproval":true,"interventionRoles":["super_admin","chairperson","secretary"]}',false)
on conflict(namespace,key) do update set value=excluded.value, is_public=excluded.is_public, updated_at=now();
