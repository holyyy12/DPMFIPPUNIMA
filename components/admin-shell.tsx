'use client';

import Link from 'next/link';
import { Bell, BookOpen, CircleGauge, FilePenLine, Inbox, Landmark, Menu, MessageSquare, Search, Settings, Users, X } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

const groups = [
  { label: 'RUANG KERJA', items: [
    { href: '/admin/dashboard', label: 'Dashboard', icon: CircleGauge },
    { href: '/admin/cms', label: 'Konten', icon: FilePenLine, badge: '8' },
    { href: '/admin/media', label: 'Media', icon: BookOpen },
  ] },
  { label: 'LAYANAN', items: [
    { href: '/admin/ddas', label: 'D-DAS', icon: Inbox, badge: '12' },
    { href: '/admin/comments', label: 'Moderasi', icon: MessageSquare, badge: '4' },
  ] },
  { label: 'KELEMBAGAAN', items: [
    { href: '/admin/iam', label: 'Pengguna & akses', icon: Users },
    { href: '/admin/settings', label: 'Pengaturan', icon: Settings },
  ] },
];

const pageNames: Record<string, string> = {
  '/admin/dashboard': 'Dashboard', '/admin/cms': 'Konten', '/admin/media': 'Media', '/admin/ddas': 'D-DAS',
  '/admin/comments': 'Moderasi', '/admin/iam': 'Pengguna & akses', '/admin/settings': 'Pengaturan',
};

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const title = pageNames[pathname] ?? 'Portal Admin';

  return (
    <main className={`admin-shell${open ? ' menu-open' : ''}`}>
      <button className="admin-sidebar-backdrop" aria-label="Tutup menu admin" onClick={() => setOpen(false)} />
      <aside className="admin-sidebar" id="admin-navigation">
        <div className="admin-sidebar-head">
          <Link className="admin-brand" href="/" onClick={() => setOpen(false)}><span><Landmark /></span><p><b>DPM FIPP</b><small>ADMIN PORTAL</small></p></Link>
          <button type="button" className="admin-sidebar-close" aria-label="Tutup menu admin" onClick={() => setOpen(false)}><X /></button>
        </div>
        <nav aria-label="Navigasi admin">
          {groups.map((group) => (
            <div className="admin-nav-group" key={group.label}>
              <small>{group.label}</small>
              {group.items.map((item) => {
                const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
                const Icon = item.icon;
                return <Link className={active ? 'active' : ''} href={item.href} key={item.href} aria-current={active ? 'page' : undefined} onClick={() => setOpen(false)}><Icon /> {item.label}{item.badge && <span>{item.badge}</span>}</Link>;
              })}
            </div>
          ))}
        </nav>
        <div className="admin-user"><span>SA</span><p><b>Super Admin</b><small>Akses terverifikasi</small></p></div>
      </aside>
      <section className="admin-main">
        <header className="admin-topbar">
          <div className="admin-topbar-title">
            <button className="admin-menu-button" type="button" aria-label="Buka menu admin" aria-expanded={open} aria-controls="admin-navigation" onClick={() => setOpen(true)}><Menu /></button>
            <div><p>PORTAL ADMIN</p><h1>{title}</h1></div>
          </div>
          <div className="admin-tools"><label><Search /><input aria-label="Cari atau buka perintah" placeholder="Cari atau buka perintah…" /><kbd>Ctrl K</kbd></label><button aria-label="Notifikasi"><Bell /></button></div>
        </header>
        {children}
      </section>
    </main>
  );
}
