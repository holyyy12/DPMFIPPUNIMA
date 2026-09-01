'use client';

import Link from 'next/link';
import { Globe, LockKeyhole, Mail, Menu, Play, Search, Send, X } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

const links = [
  ['/', 'Beranda'], ['/tentang', 'Tentang'], ['/program', 'Program Kerja'], ['/berita', 'Publikasi'],
  ['/ddas', 'D-DAS'], ['/transparansi', 'Kajian'], ['/survei', 'Survei'], ['/kontak', 'Kontak'],
] as const;

export function PublicHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const active = (href: string) => href === '/' ? pathname === '/' : pathname.startsWith(href);
  return <>
    <div className="v4-public-strip"><div className="v4-shell"><span>📣 &nbsp;Salurkan aspirasi, wujudkan perubahan bersama DPM FIPP UNIMA.</span><div><Globe/><Play/><Mail/><i/><Link href="/admin/dashboard"><LockKeyhole/> Portal Admin</Link></div></div></div>
    <header className="v4-public-header">
      <div className="v4-shell v4-public-header-inner">
        <Link href="/" className="v4-public-brand" onClick={()=>setOpen(false)}>
          <img src="/dpm-crest.png" alt="Lambang DPM FIPP UNIMA" />
          <span><b>DPM FIPP UNIMA</b><small>Dewan Perwakilan Mahasiswa<br/>Fakultas Ilmu Pendidikan dan Psikologi</small></span>
        </Link>
        <nav className={open?'open':''} aria-label="Navigasi utama">
          {links.map(([href,label])=><Link key={href} href={href} className={active(href)?'active':''} onClick={()=>setOpen(false)}>{label}</Link>)}
        </nav>
        <div className="v4-public-head-actions"><Link href="/search" aria-label="Cari"><Search/></Link><Link className="v4-aspirasi-btn" href="/ddas"><Send/> Kirim Aspirasi</Link><button onClick={()=>setOpen(!open)} aria-label="Buka menu">{open?<X/>:<Menu/>}</button></div>
      </div>
    </header>
  </>;
}
