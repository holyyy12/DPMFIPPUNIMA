import Link from 'next/link';
import { ArrowRight, CalendarDays, Search, SlidersHorizontal } from 'lucide-react';
import { PortalHeader } from '@/components/portal-header';
import { PublicFooter } from '@/components/public-footer';

const items = [
  ['D-SIGHT', 'Kajian biaya pendidikan dan akses layanan akademik 2026', 'Analisis aspirasi mahasiswa tentang transparansi biaya, layanan akademik, dan rekomendasi kebijakan.', '29 Agustus 2026'],
  ['BERITA', 'Rapat dengar pendapat mahasiswa FIPP: rangkuman dan tindak lanjut', 'Rangkuman pembahasan, komitmen unit terkait, serta jadwal evaluasi terbuka.', '27 Agustus 2026'],
  ['D-TRACE', 'Laporan pengawasan program kerja organisasi mahasiswa semester ganjil', 'Temuan, progres, dan catatan tindak lanjut pengawasan program kerja.', '24 Agustus 2026'],
  ['D-DAR', 'Arsip keputusan sidang pleno periode Agustus 2026', 'Dokumen keputusan, daftar hadir, dan ringkasan agenda sidang.', '20 Agustus 2026'],
  ['PROGRAM', 'Kalender konsultasi dan serap aspirasi September', 'Jadwal kunjungan unit dan ruang dialog terbuka bersama mahasiswa.', '18 Agustus 2026'],
  ['BERITA', 'Pembaruan struktur dan penanggung jawab unit DPM', 'Susunan unit, mandat, dan kanal komunikasi resmi periode berjalan.', '14 Agustus 2026'],
];

export default function BeritaPage() {
  return <main><PortalHeader /><section className="listing-hero"><div className="shell"><span className="form-eyebrow">PUSAT INFORMASI</span><h1>Publikasi & kerja kelembagaan.</h1><p>Temukan kajian, berita, laporan pengawasan, program, dan arsip resmi DPM FIPP UNIMA.</p><form className="listing-search"><Search /><label className="sr-only" htmlFor="q">Cari publikasi</label><input id="q" name="q" placeholder="Cari judul atau topik…" /><button>Cari</button></form></div></section><section className="shell listing-layout"><aside className="filters"><div><SlidersHorizontal size={17} /><b>Filter publikasi</b></div><label><input type="checkbox" /> Berita <span>12</span></label><label><input type="checkbox" /> D-SIGHT <span>8</span></label><label><input type="checkbox" /> D-TRACE <span>6</span></label><label><input type="checkbox" /> D-DAR <span>10</span></label><label><input type="checkbox" /> Program <span>5</span></label><button type="button">Reset filter</button></aside><div><div className="result-bar"><p>Menampilkan <b>{items.length} publikasi terbaru</b></p><select aria-label="Urutkan publikasi"><option>Terbaru</option><option>Terlama</option><option>Paling relevan</option></select></div><div className="article-list">{items.map(([type,title,summary,date], index)=><article key={title}><div className={`list-mark list-mark-${(index%3)+1}`}><span>0{index+1}</span></div><div><span className="list-type">{type}</span><h2><Link href="/berita">{title}</Link></h2><p>{summary}</p><div className="article-meta"><span><CalendarDays /> {date}</span><Link href="/berita">Baca publikasi <ArrowRight /></Link></div></div></article>)}</div></div></section><PublicFooter /></main>;
}
