'use client';
import Link from 'next/link';
import { Bell, BookOpen, Building2, ChartNoAxesCombined, CircleGauge, ClipboardList, FileArchive, FilePenLine, Image, Inbox, LayoutGrid, Menu, MessageSquare, ScrollText, ShieldCheck, Users, X } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

const items=[
 ['/admin/dashboard','Dashboard',LayoutGrid],['/admin/site','Tampilan Situs & Aset',Image],['/admin/ddas','D-DAS',Inbox],['/admin/insight','D-SIGHT',ChartNoAxesCombined],
 ['/admin/trace','D-TRACE',CircleGauge],['/admin/archive','D-DAR',FileArchive],['/admin/cms','Publikasi',FilePenLine],['/admin/media','Media',BookOpen],
 ['/admin/programs','Program Kerja',ClipboardList],
 ['/admin/comments','Komentar',MessageSquare],['/admin/notifications','Notifikasi',Bell],['/admin/organization','Periode & Organisasi',Building2],
 ['/admin/iam','Pengguna, Role & Permission',Users],['/admin/permission','Permission',ShieldCheck],['/admin/audit','Audit Log',ScrollText],
] as const;
const names:Record<string,string>=Object.fromEntries(items.map(x=>[x[0],x[1]]));
export function AdminShell({children}:{children:React.ReactNode}){
 const pathname=usePathname(); const[open,setOpen]=useState(false);
 useEffect(()=>{if(process.env.NEXT_PUBLIC_ENFORCE_ADMIN_AUTH!=='true'||pathname==='/admin/login'||pathname==='/admin/mfa')return;void(async()=>{const r=await fetch('/api/admin/auth/session',{cache:'no-store'});if(!r.ok)location.assign('/admin/login');else{const x=await r.json() as {aal?:string};if(x.aal!=='aal2')location.assign('/admin/mfa')}})()},[pathname]);
 if(pathname==='/admin/login'||pathname==='/admin/mfa')return children;
 return <main className={`v4-admin ${open?'menu-open':''}`}><button className="v4-admin-backdrop" onClick={()=>setOpen(false)} aria-label="Tutup menu"/>
  <aside><header><Link href="/"><img src="/dpm-crest.png" alt="Lambang DPM FIPP UNIMA"/><span><b>DPM FIPP UNIMA</b><small>ADMIN</small></span></Link><button onClick={()=>setOpen(false)}><X/></button></header>
   <div className="v4-admin-profile"><span>SA</span><p><b>Super Admin</b><small>super_admin</small><em>● Online</em></p></div>
   <nav>{items.map(([href,label,Icon])=>{const active=pathname===href||pathname.startsWith(href+'/');return <Link key={href} href={href} className={active?'active':''} onClick={()=>setOpen(false)}><Icon/>{label}{label==='Notifikasi'&&<i>12</i>}</Link>})}</nav>
   <footer><b>DPM FIPP UNIMA</b><small>Dewan Perwakilan Mahasiswa<br/>Fakultas Ilmu Pendidikan dan Psikologi<br/>Universitas Negeri Manado</small></footer>
  </aside>
  <section><header className="v4-admin-top"><div><button onClick={()=>setOpen(true)}><Menu/></button><Link href="/admin/dashboard">Beranda</Link><span>›</span><p>{names[pathname]??'Portal Admin'}</p></div><div><span><ShieldCheck/> Super Admin</span><button><Bell/><i>12</i></button></div></header>{children}<footer className="v4-admin-foot">© 2026 DPM FIPP UNIMA. Semua hak dilindungi.<span>Versi 1.0.0</span></footer></section>
 </main>
}
