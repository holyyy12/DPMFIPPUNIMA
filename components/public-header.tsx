'use client';

import Link from 'next/link';
import { ArrowRight, Landmark, Menu, X } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

const publicLinks = [
  { href: '/', label: 'Beranda', match: (path: string) => path === '/' },
  { href: '/berita', label: 'Informasi', match: (path: string) => path.startsWith('/berita') },
  { href: '/ddas/kirim', label: 'D-DAS', match: (path: string) => path.startsWith('/ddas') },
  { href: '/transparansi', label: 'Transparansi', match: (path: string) => path.startsWith('/transparansi') },
  { href: '/tentang', label: 'Tentang DPM', match: (path: string) => path.startsWith('/tentang') },
];

export function PublicHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="site-header">
      <div className="shell public-header-row">
        <Link className="brand" href="/" aria-label="DPM FIPP UNIMA, Beranda" onClick={() => setOpen(false)}>
          <span className="brand-mark" aria-hidden="true"><Landmark size={21} /></span>
          <span><strong>DPM FIPP</strong><small>UNIVERSITAS NEGERI MANADO</small></span>
        </Link>

        <nav aria-label="Navigasi utama" className="public-nav">
          {publicLinks.map((item) => (
            <Link className={`nav-link${item.match(pathname) ? ' active' : ''}`} href={item.href} key={item.href} aria-current={item.match(pathname) ? 'page' : undefined}>
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="public-header-actions">
          <Link className="admin-link" href="/admin/dashboard">Portal Admin <ArrowRight size={15} /></Link>
          <button className="public-menu-button" type="button" aria-label={open ? 'Tutup menu' : 'Buka menu'} aria-expanded={open} aria-controls="mobile-public-nav" onClick={() => setOpen((value) => !value)}>
            {open ? <X /> : <Menu />}
          </button>
        </div>
      </div>

      <nav id="mobile-public-nav" className={`public-mobile-nav${open ? ' open' : ''}`} aria-label="Navigasi utama seluler">
        <div className="shell">
          {publicLinks.map((item) => (
            <Link className={item.match(pathname) ? 'active' : ''} href={item.href} key={item.href} aria-current={item.match(pathname) ? 'page' : undefined} onClick={() => setOpen(false)}>
              {item.label}
            </Link>
          ))}
          <Link className="mobile-admin-link" href="/admin/dashboard" onClick={() => setOpen(false)}>Buka Portal Admin <ArrowRight /></Link>
        </div>
      </nav>
    </header>
  );
}
