'use client';
import Link from 'next/link';
import { Menu, Search, X } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

const links=[['/','Beranda'],['/tentang','Tentang'],['/program','Program Kerja'],['/ddas','D-DAS'],['/d-sight','D-SIGHT'],['/d-trace','D-TRACE'],['/d-dar','D-DAR']] as const;
export function PublicHeader(){
 const pathname=usePathname();const[open,setOpen]=useState(false);const active=(href:string)=>href==='/'?pathname===href:pathname.startsWith(href);
 return <header className="v5-header"><div className="v5-shell v5-navbar">
  <Link href="/" className="v5-brand" onClick={()=>setOpen(false)}><img src="/dpm-crest.png" alt="Lambang DPM FIPP UNIMA"/><span><b>DPM FIPP UNIMA</b><small>Dewan Perwakilan Mahasiswa<br/>Fakultas Ilmu Pendidikan dan Psikologi</small></span></Link>
  <nav className={open?'open':''} aria-label="Navigasi utama">{links.map(([href,label])=><Link href={href} key={href} className={active(href)?'active':''} onClick={()=>setOpen(false)}>{label}</Link>)}</nav>
  <form className="v5-nav-search" action="/search"><Search/><label className="sr-only" htmlFor="nav-search">Cari informasi</label><input id="nav-search" name="q" placeholder="Cari..."/></form>
  <button className="v5-menu" onClick={()=>setOpen(!open)} aria-expanded={open} aria-label="Buka navigasi">{open?<X/>:<Menu/>}</button>
 </div></header>
}
