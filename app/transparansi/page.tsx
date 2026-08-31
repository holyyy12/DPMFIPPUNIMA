import Link from 'next/link';
import { ArrowRight, BarChart3, FileCheck2, FolderArchive, ShieldCheck } from 'lucide-react';
import { PublicFooter } from '@/components/public-footer';
import { PublicHeader } from '@/components/public-header';

const areas = [
  { icon: BarChart3, code: 'D-TRACE', title: 'Pengawasan & tindak lanjut', text: 'Ringkasan pengawasan program, temuan, penanggung jawab, dan progres tindak lanjut yang aman untuk publik.' },
  { icon: FileCheck2, code: 'D-SIGHT', title: 'Kajian strategis', text: 'Kajian berbasis aspirasi dan data untuk mendukung sikap serta rekomendasi kebijakan mahasiswa.' },
  { icon: FolderArchive, code: 'D-DAR', title: 'Dokumen & arsip', text: 'Keputusan, laporan, dan dokumen kelembagaan dengan metadata serta periode yang jelas.' },
];

export default function TransparansiPage() {
  return <main><PublicHeader /><section className="info-hero"><div className="shell"><span className="form-eyebrow">TRANSPARANSI KELEMBAGAAN</span><h1>Mandat yang bisa Anda periksa.</h1><p>Informasi publik DPM disusun agar mudah ditemukan, dipahami, dan dilacak tanpa membuka data pribadi mahasiswa.</p></div></section><section className="shell info-grid">{areas.map(({icon:Icon,code,title,text})=><article key={code}><span><Icon /></span><small>{code}</small><h2>{title}</h2><p>{text}</p><Link href="/berita">Lihat publikasi <ArrowRight /></Link></article>)}</section><section className="shell privacy-band"><ShieldCheck /><div><h2>Terbuka, dengan batas privasi yang tegas.</h2><p>Timeline publik tidak memuat identitas pelapor, kontak, atau isi sensitif. Setiap publikasi melewati sanitasi dan review sebelum diterbitkan.</p></div></section><PublicFooter /></main>;
}
