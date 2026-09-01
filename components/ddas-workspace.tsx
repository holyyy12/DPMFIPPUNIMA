'use client';
import { useEffect, useState } from 'react';
import { ArrowRight, CheckCircle2, ClipboardList, Search } from 'lucide-react';
import { DdasForm } from './ddas-form';
import { TrackingForm } from './tracking-form';

type Receipt={ticket:string;secret:string};
export function DdasWorkspace(){
 const[receipts,setReceipts]=useState<Receipt[]>([]);
 useEffect(()=>{const listener=(event:Event)=>setReceipts(current=>[...(current.filter(x=>x.ticket!==(event as CustomEvent<Receipt>).detail.ticket)),(event as CustomEvent<Receipt>).detail]);window.addEventListener('ddas:submitted',listener);return()=>window.removeEventListener('ddas:submitted',listener)},[]);
 return <section className="v5-shell v5-ddas-workspace">
  <article className="v5-ddas-step"><header><span>01</span><div><h2>Kirim Aspirasi</h2><p>Isi aspirasi, pilih tingkat kerahasiaan, dan tambahkan lampiran bila diperlukan.</p></div></header><DdasForm/></article>
  <div className="v5-ddas-side">
   <article className="v5-ddas-step"><header><span>02</span><div><h2>Daftar Aspirasi Anda</h2><p>Daftar ini hanya muncul selama sesi perangkat ini dan tidak dipublikasikan.</p></div></header>{receipts.length?<div className="v5-ticket-list">{receipts.map(x=><div key={x.ticket}><ClipboardList/><span><b>{x.ticket}</b><small>Baru dikirim · Menunggu peninjauan</small></span><button onClick={()=>{window.dispatchEvent(new CustomEvent('ddas:track',{detail:x}));document.querySelector('#lacak-aspirasi')?.scrollIntoView({behavior:'smooth'})}}>Lacak Cepat <ArrowRight/></button></div>)}</div>:<div className="v5-empty"><ClipboardList/><b>Belum ada aspirasi dalam sesi ini</b><p>Setelah pengiriman berhasil, nomor tiket akan muncul di sini.</p></div>}</article>
   <article className="v5-ddas-step" id="lacak-aspirasi"><header><span>03</span><div><h2>Lacak Aspirasi</h2><p>Gunakan nomor tiket dan kode pelacakan privat dari bukti pengiriman.</p></div></header><TrackingForm/></article>
   <article className="v5-ddas-step"><header><span>04</span><div><h2>Hasil Pelacakan</h2><p>Progress, waktu pembaruan, dan catatan publik dari DPM atau unit terkait.</p></div></header><div className="v5-tracking-preview"><div><CheckCircle2/><span><b>Aspirasi diterima</b><small>Sistem menerbitkan nomor tiket dan menyimpan aspirasi.</small></span></div><div><Search/><span><b>Pembaruan akan muncul setelah verifikasi</b><small>Catatan internal tidak pernah ditampilkan pada timeline publik.</small></span></div></div></article>
  </div>
 </section>
}
