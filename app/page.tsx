import Link from 'next/link';
import {
  ArrowRight,
  BookOpen,
  CalendarDays,
  ChevronRight,
  FileText,
  Megaphone,
  Search,
  ShieldCheck,
} from 'lucide-react';
import { PublicFooter } from '@/components/public-footer';
import { PublicHeader } from '@/components/public-header';

const updates = [
  { type: 'D-SIGHT', title: 'Kajian biaya pendidikan dan akses layanan akademik 2026', date: '29 Agustus 2026', tone: 'bg-emerald-100 text-emerald-800' },
  { type: 'BERITA', title: 'Rapat dengar pendapat mahasiswa FIPP: rangkuman dan tindak lanjut', date: '27 Agustus 2026', tone: 'bg-amber-100 text-amber-800' },
  { type: 'D-TRACE', title: 'Laporan pengawasan program kerja organisasi mahasiswa semester ganjil', date: '24 Agustus 2026', tone: 'bg-sky-100 text-sky-800' },
];

export default function Home() {
  return (
    <main>
      <a className="skip-link" href="#konten-utama">Lewati ke konten utama</a>
      <PublicHeader />

      <section className="hero" id="konten-utama">
        <div className="shell hero-grid">
          <div>
            <div className="eyebrow"><span /> Dewan Perwakilan Mahasiswa FIPP UNIMA</div>
            <h1>Suara mahasiswa,<br /><em>dikawal bersama.</em></h1>
            <p className="hero-copy">Ruang resmi untuk menyampaikan aspirasi, mengikuti penanganannya, dan mengakses kerja pengawasan DPM secara terbuka.</p>
            <form className="search-box" action="/berita">
              <Search size={20} aria-hidden="true" />
              <label className="sr-only" htmlFor="site-search">Cari informasi publik</label>
              <input id="site-search" name="q" placeholder="Cari kajian, berita, program, atau arsip…" />
              <button type="submit">Cari</button>
            </form>
            <div className="hero-meta">
              <span><ShieldCheck size={17} /> Privasi terjaga</span>
              <span><FileText size={17} /> Proses dapat dilacak</span>
              <span><BookOpen size={17} /> Informasi terbuka</span>
            </div>
          </div>

          <aside className="action-panel" aria-label="Layanan aspirasi D-DAS">
            <div className="panel-kicker">D-DAS</div>
            <h2>Layanan aspirasi mahasiswa</h2>
            <p>Sampaikan kebutuhan, keluhan, atau gagasan Anda dengan aman. Identitas tidak dipublikasikan.</p>
            <div className="panel-actions">
              <Link className="primary-action" href="/ddas/kirim"><Megaphone size={20} /> Kirim aspirasi <ArrowRight size={18} /></Link>
              <Link className="secondary-action" href="/ddas/tracking"><ShieldCheck size={20} /> Lacak aspirasi <ChevronRight size={18} /></Link>
            </div>
            <div className="response-note"><span className="pulse" /> Rata-rata respons awal: <strong>1–2 hari kerja</strong></div>
          </aside>
        </div>
      </section>

      <section className="service-strip" aria-label="Ringkasan layanan">
        <div className="shell service-grid">
          <div><strong>24</strong><span>Aspirasi ditangani<br />bulan ini</span></div>
          <div><strong>92%</strong><span>Kasus menerima respons<br />sesuai target</span></div>
          <div><strong>18</strong><span>Kajian & laporan<br />dipublikasikan</span></div>
          <div className="status-card"><span className="status-dot" /><p><b>Semua layanan normal</b><small>Diperbarui 31 Agustus 2026, 09.30 WITA</small></p></div>
        </div>
      </section>

      <section className="section shell" aria-labelledby="terbaru-heading">
        <div className="section-heading">
          <div><span className="section-label">PUBLIKASI TERBARU</span><h2 id="terbaru-heading">Ikuti kerja dan sikap DPM</h2></div>
          <Link href="/berita">Lihat semua publikasi <ArrowRight size={16} /></Link>
        </div>
        <div className="updates-grid">
          {updates.map((item, index) => (
            <article className="update-card" key={item.title}>
              <div className={`tag ${item.tone}`}>{item.type}</div>
              <div className={`editorial-mark mark-${index + 1}`} aria-hidden="true"><span>0{index + 1}</span></div>
              <div className="update-body">
                <p><CalendarDays size={14} /> {item.date}</p>
                <h3><Link href="/berita">{item.title}</Link></h3>
                <Link className="read-more" href="/berita">Baca selengkapnya <ArrowRight size={15} /></Link>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="transparency" id="transparansi">
        <div className="shell transparency-grid">
          <div><span className="section-label light">TRANSPARANSI</span><h2>Mandat yang bisa Anda periksa.</h2><p>Dari agenda pengawasan sampai tindak lanjut aspirasi, kami menyajikan informasi yang aman untuk publik dan mudah ditelusuri.</p></div>
          <div className="transparency-links">
            <Link href="/berita"><span>01</span><p><b>D-TRACE</b><small>Laporan pengawasan & tindak lanjut</small></p><ArrowRight /></Link>
            <Link href="/berita"><span>02</span><p><b>D-SIGHT</b><small>Kajian strategis mahasiswa</small></p><ArrowRight /></Link>
            <Link href="/berita"><span>03</span><p><b>D-DAR</b><small>Dokumen dan arsip kelembagaan</small></p><ArrowRight /></Link>
          </div>
        </div>
      </section>

      <PublicFooter />
    </main>
  );
}
