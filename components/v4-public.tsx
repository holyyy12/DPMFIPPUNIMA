'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import {
  ArrowRight,
  BarChart3,
  Building2,
  Check,
  FileText,
  Megaphone,
  Search,
  Send,
  ShieldCheck,
  Users,
  Vote,
} from 'lucide-react';
import { PublicHeader } from './public-header';
import { PublicFooter } from './public-footer';
import { PublicComments } from './public-comments';
import { DdasWorkspace } from './ddas-workspace';
import { campusHero, news, ormawa, studies } from '@/lib/site-content';

const organizationMembers = [
  {
    role: 'Ketua Umum',
    name: 'Reynold R. Wuisan',
    unit: 'Pimpinan',
    image:
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=240&q=80',
  },
  {
    role: 'Sekretaris Umum',
    name: 'Angelica M. Tampi',
    unit: 'Sekretariat',
    image:
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=240&q=80',
  },
  {
    role: 'Ketua Komisi 1',
    name: 'Michael P. Langi',
    unit: 'Legislasi & Kebijakan',
    image:
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=240&q=80',
  },
  {
    role: 'Ketua Komisi 2',
    name: 'Stevani K. Runtuwerne',
    unit: 'Pengawasan & Advokasi',
    image:
      'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?auto=format&fit=crop&w=240&q=80',
  },
  {
    role: 'Koordinator Humas',
    name: 'Brigita T. Warouw',
    unit: 'Hubungan Masyarakat',
    image:
      'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=240&q=80',
  },
  {
    role: 'Koordinator Media',
    name: 'Yohanes R. P.',
    unit: 'Media & Informasi',
    image:
      'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=240&q=80',
  },
];

export function PublicFrame({ children }: { children: React.ReactNode }) {
  return (
    <main className="v4-public v5-public">
      <PublicHeader />
      {children}
      <div className="v5-shell">
        <section className="v4-public-cta">
          <div>
            <Users />
            <span>
              <b>
                DPM hadir untuk mendengar, mewakili, dan mengawal setiap
                aspirasi mahasiswa.
              </b>
              <small>Bersama membangun FIPP yang lebih baik.</small>
            </span>
          </div>
          <Link href="/ddas">
            <Send /> Kirim Aspirasi Sekarang
          </Link>
        </section>
      </div>
      <PublicFooter />
    </main>
  );
}

export function V4Home() {
  return (
    <PublicFrame>
      <section
        className="v5-home-hero"
        style={{ '--campus': `url(${campusHero})` } as React.CSSProperties}
      >
        <div className="v5-shell">
          <div className="v5-hero-copy">
            <span>DEWAN PERWAKILAN MAHASISWA</span>
            <h1>DPM FIPP UNIMA</h1>
            <h2>
              Representasi, Aspirasi, Legislasi,
              <br />
              dan Pengawasan Mahasiswa.
            </h2>
            <p>
              DPM FIPP UNIMA hadir sebagai jembatan komunikasi antara mahasiswa
              dan fakultas untuk mendorong perubahan, transparansi, dan kemajuan
              bersama.
            </p>
            <div>
              <Link className="v6-cta v6-cta-secondary" href="/tentang">
                <ShieldCheck /> Jelajahi DPM
              </Link>
              <Link className="v6-cta v6-cta-primary" href="/ddas">
                <Send /> Kirim Aspirasi
              </Link>
            </div>
          </div>
        </div>
      </section>
      <section className="v5-shell v5-home-cards">
        <article>
          <header>
            <span>
              <FileText />
            </span>
            <h2>Berita Terbaru</h2>
            <Link href="/d-sight?tab=berita">Lihat semua</Link>
          </header>
          <div className="v5-mini-news">
            {news.map((item) => (
              <Link href={`/berita/${item.slug}`} key={item.slug}>
                <img src={item.image} alt="" />
                <span>
                  <b>{item.title}</b>
                  <small>{item.date}</small>
                </span>
              </Link>
            ))}
          </div>
        </article>
        <article>
          <header>
            <span>
              <Megaphone />
            </span>
            <h2>D-DAS</h2>
          </header>
          <strong>
            5 <small>Total Aspirasi</small>
          </strong>
          <div className="v5-status-list">
            <p>
              <i />
              Dalam proses <b>2</b>
            </p>
            <p>
              <i />
              Ditindaklanjuti <b>1</b>
            </p>
            <p>
              <i />
              Selesai <b>2</b>
            </p>
          </div>
          <footer className="v6-card-actions">
            <Link href="/ddas">
              <Send /> Sampaikan Aspirasi
            </Link>
            <Link href="/ddas#lacak-aspirasi">
              <Search /> Lacak Aspirasi
            </Link>
          </footer>
        </article>
        <article>
          <header>
            <span>
              <BarChart3 />
            </span>
            <h2>D-SIGHT Kajian</h2>
            <Link href="/d-sight">Lihat semua</Link>
          </header>
          <div className="v5-study-list">
            {studies.map((x) => (
              <p key={x.title}>
                <FileText />
                <span>
                  <b>{x.title}</b>
                  <small>{x.date}</small>
                </span>
              </p>
            ))}
          </div>
          <footer>
            <Link href="/d-sight">
              Akses Kajian <ArrowRight />
            </Link>
          </footer>
        </article>
        <article>
          <header>
            <span>
              <Vote />
            </span>
            <h2>D-SIGHT Survei</h2>
          </header>
          <div className="v5-survey-card">
            <b>Isu prioritas mahasiswa</b>
            <p>Kualitas layanan akademik</p>
            <div>
              <i style={{ width: '68%' }} />
              <span>68%</span>
            </div>
            <p>Fasilitas ruang belajar</p>
            <div>
              <i style={{ width: '51%' }} />
              <span>51%</span>
            </div>
            <small>247 respons masuk · hasil sementara</small>
          </div>
          <footer>
            <Link href="/d-sight?tab=survei">
              Pilih Isu <ArrowRight />
            </Link>
          </footer>
        </article>
        <article>
          <header>
            <span>
              <Building2 />
            </span>
            <h2>ORMAWA FIPP</h2>
            <Link href="/ormawa">Lihat semua</Link>
          </header>
          <strong>
            12 <small>ORMAWA Aktif</small>
          </strong>
          <div className="v5-logo-cloud">
            {ormawa.slice(0, 6).map((x) => (
              <Link
                href={`/ormawa/${x.slug}`}
                key={x.slug}
                style={{ background: x.color }}
              >
                {x.short}
              </Link>
            ))}
          </div>
          <footer>
            <Link href="/ormawa">
              Kenali ORMAWA <ArrowRight />
            </Link>
          </footer>
        </article>
      </section>
    </PublicFrame>
  );
}

export function V4About() {
  return (
    <PublicFrame>
      <section
        className="v5-about-hero"
        style={{ '--campus': `url(${campusHero})` } as React.CSSProperties}
      >
        <div className="v5-shell">
          <small>Beranda › Tentang</small>
          <h1>Tentang DPM FIPP UNIMA</h1>
          <h2>Representasi, Aspirasi, Legislasi, dan Pengawasan Mahasiswa.</h2>
          <p>
            DPM FIPP UNIMA adalah lembaga perwakilan mahasiswa tingkat fakultas
            yang menyalurkan aspirasi, menyusun kajian, menjalankan fungsi
            legislasi, dan mengawasi pelaksanaan kebijakan serta program
            kemahasiswaan.
          </p>
          <div className="v4-period">
            <span>
              Berdiri Sejak<b>2006</b>
            </span>
            <span>
              Periode Aktif<b>2026–2027</b>
            </span>
          </div>
        </div>
      </section>
      <section className="v5-shell v5-org">
        <header>
          <h2>Struktur Organisasi DPM FIPP UNIMA</h2>
          <p>
            Struktur ini dikelola per periode melalui Portal Admin sehingga
            perubahan jabatan dan unit tidak memerlukan perubahan kode.
          </p>
        </header>
        <div className="v6-org-people">
          {organizationMembers.map((person, index) => (
            <article className={index < 2 ? 'leader' : ''} key={person.role}>
              <img src={person.image} alt={`Foto ${person.name}`} />
              <span>
                <small>{person.role}</small>
                <b>{person.name}</b>
                <em>{person.unit}</em>
              </span>
            </article>
          ))}
        </div>
        <section className="v5-about-ormawa">
          <div>
            <span>ORMAWA FIPP</span>
            <h2>Kenali organisasi mahasiswa di lingkungan FIPP.</h2>
            <p>
              Setiap ORMAWA memiliki halaman perkenalan, galeri, informasi
              organisasi, dan daftar program kerja yang dikelola oleh
              pengurusnya.
            </p>
            <Link href="/ormawa">
              Lihat Daftar ORMAWA <ArrowRight />
            </Link>
          </div>
          <div className="v5-logo-cloud">
            {ormawa.map((x) => (
              <Link
                href={`/ormawa/${x.slug}`}
                key={x.slug}
                style={{ background: x.color }}
              >
                {x.short}
              </Link>
            ))}
          </div>
        </section>
      </section>
    </PublicFrame>
  );
}

const publications = [
  [
    'BERITA',
    'Forum Aspirasi Mahasiswa Periode 2026–2027',
    'Forum aspirasi menjadi ruang dialog terbuka antara mahasiswa dan pimpinan fakultas.',
  ],
  [
    'KAJIAN',
    'Evaluasi Efektivitas Kurikulum MBKM',
    'Kajian implementasi MBKM dan rekomendasi perbaikan.',
  ],
  [
    'D-SIGHT',
    'Potret Aspirasi Mahasiswa April 2026',
    'Ringkasan data aspirasi berdasarkan topik dan status.',
  ],
  [
    'D-TRACE',
    'Tindak Lanjut Aspirasi Maret–April',
    'Laporan tindak lanjut bersama unit terkait.',
  ],
  [
    'MEDIA',
    'Diskusi Publik Pendidikan Inklusif',
    'Dokumentasi kegiatan diskusi publik.',
  ],
  [
    'ARSIP',
    'Laporan Kinerja DPM Periode 2025',
    'Dokumen akuntabilitas organisasi.',
  ],
];
export function V4Publications() {
  const [type, setType] = useState('Semua');
  const [query, setQuery] = useState('');
  const filtered = useMemo(
    () =>
      publications.filter(
        (item) =>
          (type === 'Semua' || item[0] === type) &&
          `${item[0]} ${item[1]} ${item[2]}`
            .toLowerCase()
            .includes(query.toLowerCase()),
      ),
    [type, query],
  );
  return (
    <PublicFrame>
      <section
        className="v4-publication-hero"
        style={{ '--campus': `url(${campusHero})` } as React.CSSProperties}
      >
        <div className="v5-shell">
          <small>Beranda › Publikasi</small>
          <h1>Publikasi, Kajian & Media</h1>
          <p>
            Akses informasi resmi, hasil kajian, laporan, data, dan dokumentasi
            DPM FIPP UNIMA.
          </p>
        </div>
      </section>
      <section className="v5-shell">
        <div className="v4-pub-filters">
          <label>
            <span>Jenis Konten</span>
            <select
              value={type}
              onChange={(event) => setType(event.target.value)}
            >
              <option>Semua</option>
              {[...new Set(publications.map((item) => item[0]))].map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </label>
          <label>
            <span>Kategori</span>
            <select>
              <option>Semua Kategori</option>
              <option>Kemahasiswaan</option>
              <option>Akademik</option>
              <option>Akuntabilitas</option>
            </select>
          </label>
          <label>
            <span>Unit</span>
            <select>
              <option>Semua Unit</option>
              <option>DPM FIPP</option>
              <option>Komisi I</option>
              <option>Komisi II</option>
            </select>
          </label>
          <label>
            <span>Periode</span>
            <select>
              <option>2026–2027</option>
              <option>2025–2026</option>
            </select>
          </label>
          <label>
            <span>Sortir</span>
            <select>
              <option>Terbaru</option>
              <option>Terlama</option>
              <option>A–Z</option>
            </select>
          </label>
          <label>
            <span>Pencarian</span>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Cari publikasi..."
            />
          </label>
        </div>
        <div className="v4-pub-grid">
          {filtered.map((p, i) => (
            <article key={p[1]}>
              <div style={{ backgroundImage: `url(${news[i % 3].image})` }}>
                <span>{p[0]}</span>
              </div>
              <small>{12 - i} Mei 2026</small>
              <h2>{p[1]}</h2>
              <p>{p[2]}</p>
              <Link href="/berita/forum-aspirasi-mahasiswa">
                Baca selengkapnya <ArrowRight />
              </Link>
            </article>
          ))}
          {!filtered.length && (
            <p className="v5-filter-empty">
              Tidak ada publikasi yang sesuai dengan filter.
            </p>
          )}
        </div>
      </section>
    </PublicFrame>
  );
}
export function V4PublicationDetail() {
  return (
    <PublicFrame>
      <section className="v5-shell v4-article-layout">
        <article>
          <div
            className="v4-article-image"
            style={{ backgroundImage: `url(${news[0].image})` }}
          />
          <span className="v4-tag">KEGIATAN</span>
          <h1>
            Forum Aspirasi Mahasiswa Periode 2026–2027: Wadah Dialog dan
            Penguatan Representasi
          </h1>
          <small>DPM FIPP UNIMA · 12 Mei 2026</small>
          <p>
            DPM FIPP UNIMA menyelenggarakan Forum Aspirasi Mahasiswa sebagai
            ruang terbuka untuk menyampaikan gagasan, kritik, dan solusi atas
            isu akademik maupun non-akademik.
          </p>
          <div className="v4-inline-gallery">
            {news.map((x) => (
              <span
                key={x.slug}
                style={{ backgroundImage: `url(${x.image})` }}
              />
            ))}
          </div>
          <p>
            Isu prioritas akan ditindaklanjuti melalui program kerja dan
            advokasi kelembagaan. Setiap pembaruan publik disanitasi sebelum
            ditampilkan.
          </p>
          <PublicComments slug="forum-aspirasi-mahasiswa" />
        </article>
        <aside>
          <h3>Berita Terkait</h3>
          {news.map((x) => (
            <Link href={`/berita/${x.slug}`} key={x.slug}>
              <span style={{ backgroundImage: `url(${x.image})` }} />
              <b>{x.title}</b>
            </Link>
          ))}
        </aside>
      </section>
    </PublicFrame>
  );
}
export function V4Ddas() {
  return (
    <PublicFrame>
      <section className="v5-ddas-intro">
        <div className="v5-shell">
          <span>D-DAS</span>
          <h1>Data, Dialog, Aspirasi, Solusi.</h1>
          <p>
            Kirim aspirasi dengan aman, simpan nomor tiket, lihat daftar
            pengiriman dalam sesi Anda, dan ikuti pembaruan yang sudah
            disanitasi.
          </p>
          <div>
            <b>
              <ShieldCheck /> Aman & Rahasia
            </b>
            <b>
              <Check /> Transparan
            </b>
            <b>
              <Megaphone /> Responsif
            </b>
          </div>
        </div>
      </section>
      <DdasWorkspace />
    </PublicFrame>
  );
}
