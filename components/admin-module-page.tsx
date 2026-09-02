'use client';

import Link from 'next/link';
import { ArrowRight, CheckCircle2, Clock3, type LucideIcon } from 'lucide-react';
import { useAdminPortal } from './use-admin-portal';

export function AdminModulePage({ eyebrow, title, description, icon: Icon, kind }: {
  eyebrow: string;
  title: string;
  description: string;
  icon: LucideIcon;
  kind: 'media' | 'settings';
}) {
  const { data, loading, error } = useAdminPortal();
  const currentPeriod=data.periods.find((item)=>item.is_current);
  const metrics=kind==='media' ? [
    {value:String(data.media.filter((x)=>x.status==='ready').length),label:'Aset aktif',note:'Gambar dan dokumen'},
    {value:String(data.media.filter((x)=>!x.original_filename).length),label:'Perlu metadata',note:'Aksesibilitas'},
    {value:String(data.media.filter((x)=>x.status!=='ready').length),label:'Dalam proses',note:'Pemeriksaan aset'},
  ] : [
    {value:currentPeriod?'1':'0',label:'Periode aktif',note:currentPeriod?.name ?? 'Belum diatur'},
    {value:String(data.settings['ddas.sla_days'] ?? 'Belum diatur'),label:'Target respons',note:'D-DAS'},
    {value:String(Object.keys(data.settings).length),label:'Konfigurasi',note:'Tersimpan di Supabase'},
  ];
  const actions=kind==='media' ? [
    {title:'Kelola pustaka media',description:'Tinjau aset dan metadata aksesibilitas.',href:'/admin/cms'},
    {title:'Gunakan aset pada konten',description:'Buka editor konten dan pilih media.',href:'/admin/cms'},
  ] : [
    {title:'Tinjau konfigurasi periode',description:'Kelola periode dan struktur organisasi.',href:'/admin/organization'},
    {title:'Validasi permission layanan',description:'Periksa matriks hak akses aktif.',href:'/admin/permission'},
  ];
  return (
    <div className="admin-content admin-module-content">
      <section className="admin-module-hero"><span className="admin-module-icon"><Icon /></span><div><span>{eyebrow}</span><h2>{title}</h2><p>{description}</p></div></section>
      <section className="admin-module-metrics">{metrics.map((metric) => <article key={metric.label}><strong>{metric.value}</strong><b>{metric.label}</b><small>{metric.note}</small></article>)}</section>
      {(loading||error)&&<p className="prototype-note">{loading?'Memuat data Supabase…':error}</p>}
      <section className="admin-panel admin-workspace"><header><div><span>RUANG KERJA</span><h2>Aktivitas prioritas</h2></div></header><div className="admin-action-list">{actions.map((action, index) => <article key={action.title}><span>{index === 0 ? <Clock3 /> : <CheckCircle2 />}</span><p><b>{action.title}</b><small>{action.description}</small></p><Link href={action.href} aria-label={`Buka ${action.title}`}>Tinjau <ArrowRight /></Link></article>)}</div></section>
    </div>
  );
}
