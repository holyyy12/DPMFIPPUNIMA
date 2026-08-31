import Link from 'next/link';
import { ArrowRight, CheckCircle2, Clock3, type LucideIcon } from 'lucide-react';

export function AdminModulePage({ eyebrow, title, description, icon: Icon, metrics, actions }: {
  eyebrow: string;
  title: string;
  description: string;
  icon: LucideIcon;
  metrics: Array<{ value: string; label: string; note: string }>;
  actions: Array<{ title: string; description: string }>;
}) {
  return (
    <div className="admin-content admin-module-content">
      <section className="admin-module-hero"><span className="admin-module-icon"><Icon /></span><div><span>{eyebrow}</span><h2>{title}</h2><p>{description}</p></div></section>
      <section className="admin-module-metrics">{metrics.map((metric) => <article key={metric.label}><strong>{metric.value}</strong><b>{metric.label}</b><small>{metric.note}</small></article>)}</section>
      <section className="admin-panel admin-workspace"><header><div><span>RUANG KERJA</span><h2>Aktivitas prioritas</h2></div></header><div className="admin-action-list">{actions.map((action, index) => <article key={action.title}><span>{index === 0 ? <Clock3 /> : <CheckCircle2 />}</span><p><b>{action.title}</b><small>{action.description}</small></p><Link href="/admin/dashboard" aria-label={`Buka ${action.title}`}>Tinjau <ArrowRight /></Link></article>)}</div></section>
      <p className="prototype-note">Modul ini menampilkan struktur navigasi dan alur kerja sesuai PRD/MIS. Operasi data produksi akan aktif setelah integrasi Supabase dan IAM selesai.</p>
    </div>
  );
}
