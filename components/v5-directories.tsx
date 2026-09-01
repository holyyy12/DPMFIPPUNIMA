'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  ArrowLeft,
  BarChart3,
  CheckCircle2,
  Download,
  FileArchive,
  FileText,
  Images,
  Play,
  Search,
  Users,
  Vote,
} from 'lucide-react';
import { PublicFrame } from './v4-public';
import {
  archives,
  news,
  ormawa,
  programs,
  studies,
  tracePublications,
} from '@/lib/site-content';

function Hero({
  eyebrow,
  title,
  copy,
}: {
  eyebrow: string;
  title: string;
  copy: string;
}) {
  return (
    <section className="v5-directory-hero">
      <div className="v5-shell">
        <span>{eyebrow}</span>
        <h1>{title}</h1>
        <p>{copy}</p>
      </div>
    </section>
  );
}
export function ProgramsPage() {
  const [visiblePrograms, setVisiblePrograms] = useState(programs);
  useEffect(() => {
    const stored = localStorage.getItem('dpm-fipp-program-drafts-v1');
    if (!stored) return;
    try { setVisiblePrograms(JSON.parse(stored)); } catch { /* keep published defaults */ }
  }, []);
  return (
    <PublicFrame>
      <Hero
        eyebrow="PROGRAM KERJA"
        title="Kerja nyata, progres yang dapat dipantau."
        copy="Ikuti tujuan, publikasi foto/video, progres pelaksanaan, dan ukuran keberhasilan setiap program DPM FIPP UNIMA."
      />
      <section className="v5-shell v5-program-grid">
        {visiblePrograms.map((p) => (
          <article key={p.slug}>
            <div
              className="v5-program-media"
              style={{ backgroundImage: `url(${p.image})` }}
            >
              <span>
                {p.media === 'video' ? <Play /> : <Images />}
                {p.media}
              </span>
            </div>
            <div>
              <small>{p.unit}</small>
              <h2>{p.title}</h2>
              <p>{p.copy}</p>
              <label>
                Progress program <b>{p.progress}%</b>
                <i>
                  <em style={{ width: `${p.progress}%` }} />
                </i>
              </label>
              <label>
                Indikator keberhasilan <b>{p.success}%</b>
                <i>
                  <em style={{ width: `${p.success}%` }} />
                </i>
              </label>
              <Link href={`/program/${p.slug}`}>
                Lihat Publikasi Program <ArrowRight />
              </Link>
            </div>
          </article>
        ))}
      </section>
    </PublicFrame>
  );
}

export function ProgramDetailPage({ slug }: { slug: string }) {
  const published = programs.find((item) => item.slug === slug) ?? programs[0];
  const [program, setProgram] = useState(published);
  const [updateNote, setUpdateNote] = useState('Program berjalan sesuai rencana kerja periode 2026–2027.');
  const [updatedAt, setUpdatedAt] = useState('20 Mei 2026');

  useEffect(() => {
    const stored = localStorage.getItem('dpm-fipp-program-drafts-v1');
    if (!stored) return;
    try {
      const drafts = JSON.parse(stored) as Array<typeof published & { updateNote?: string; updatedAt?: string }>;
      const draft = drafts.find((item) => item.slug === slug);
      if (draft) {
        setProgram(draft);
        if (draft.updateNote) setUpdateNote(draft.updateNote);
        if (draft.updatedAt) setUpdatedAt(draft.updatedAt);
      }
    } catch { /* keep published defaults */ }
  }, [slug, published]);

  return <PublicFrame><section className="v5-shell v5-program-detail"><Link href="/program"><ArrowLeft/> Semua Program</Link><div className="v5-program-detail-hero" style={{backgroundImage:`linear-gradient(90deg,#043d30dd,#043d3040),url(${program.image})`}}><span>{program.media==='video'?<Play/>:<Images/>}{program.unit}</span><h1>{program.title}</h1><p>{program.copy}</p></div><div className="v5-program-detail-grid"><article><h2>Publikasi Program</h2><p>{updateNote}</p><div className="v5-inline-gallery">{programs.map(item=><span key={item.slug} style={{backgroundImage:`url(${item.image})`}}/>)}</div></article><aside><h2>Progres</h2><strong>{program.progress}%</strong><i><em style={{width:`${program.progress}%`}}/></i><p><CheckCircle2/> Indikator keberhasilan: <b>{program.success}%</b></p><p><CheckCircle2/> Pembaruan terakhir: {updatedAt}</p></aside></div></section></PublicFrame>;
}

export function SightPage() {
  const [selectedIssue, setSelectedIssue] = useState('');
  return (
    <PublicFrame>
      <Hero
        eyebrow="D-SIGHT"
        title="Kajian, survei, dan berita berbasis isu mahasiswa."
        copy="D-SIGHT membantu mahasiswa memahami isu melalui kajian, hasil survei agregat, dan berita yang relevan."
      />
      <section className="v5-shell v5-domain-tabs">
        <a href="#kajian">Kajian</a>
        <a href="#survei">Survei</a>
        <a href="#berita">Berita</a>
      </section>
      <section className="v5-shell v5-domain-section" id="kajian">
        <header>
          <span>
            <BarChart3 />
          </span>
          <div>
            <h2>Kajian Terbaru</h2>
            <p>Analisis dan rekomendasi kebijakan berbasis data.</p>
          </div>
        </header>
        <div className="v5-study-cards">
          {studies.map((x) => (
            <article key={x.title}>
              <span>{x.topic}</span>
              <h3>{x.title}</h3>
              <p>Diterbitkan {x.date}</p>
              <Link href="/berita/kajian-mbkm">
                Baca Kajian <ArrowRight />
              </Link>
            </article>
          ))}
        </div>
      </section>
      <section className="v5-shell v5-domain-section" id="survei">
        <header>
          <span>
            <Vote />
          </span>
          <div>
            <h2>Survei & Hasil Sementara</h2>
            <p>
              Pilih isu dan lihat hasil agregat tanpa data pribadi responden.
            </p>
          </div>
        </header>
        <div className="v5-survey-grid">
          {[
            ['Kualitas layanan akademik', 68, 247],
            ['Fasilitas ruang belajar', 51, 219],
            ['Kesejahteraan mahasiswa', 43, 184],
          ].map((x) => (
            <article key={x[0] as string}>
              <h3>{x[0]}</h3>
              <strong>{x[1]}%</strong>
              <i>
                <em style={{ width: `${x[1]}%` }} />
              </i>
              <p>{x[2]} respons masuk</p>
              <button
                className={selectedIssue === String(x[0]) ? 'selected' : ''}
                onClick={() => setSelectedIssue(String(x[0]))}
              >
                {selectedIssue === String(x[0]) ? 'Isu Dipilih' : 'Pilih Isu'}
              </button>
            </article>
          ))}
        </div>
      </section>
      <section className="v5-shell v5-domain-section" id="berita">
        <header>
          <span>
            <FileText />
          </span>
          <div>
            <h2>Berita D-SIGHT</h2>
            <p>Perkembangan isu, dialog, dan publikasi kajian.</p>
          </div>
        </header>
        <div className="v5-news-grid">
          {news.map((x) => (
            <Link href={`/berita/${x.slug}`} key={x.slug}>
              <img src={x.image} alt="" />
              <span>
                <b>{x.title}</b>
                <small>{x.date}</small>
              </span>
            </Link>
          ))}
        </div>
      </section>
    </PublicFrame>
  );
}

export function TracePage() {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('Semua');
  const filtered = useMemo(
    () =>
      tracePublications.filter(
        (item) =>
          (category === 'Semua' || item[1] === category) &&
          `${item[0]} ${item[1]}`.toLowerCase().includes(query.toLowerCase()),
      ),
    [query, category],
  );
  return (
    <PublicFrame>
      <Hero
        eyebrow="D-TRACE"
        title="Publikasi internal yang terbuka untuk publik."
        copy="Telusuri laporan kinerja, notulen publik, tindak lanjut, dan dokumen akuntabilitas internal DPM."
      />
      <section className="v5-shell">
        <div className="v5-data-toolbar">
          <label>
            <Search />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Cari publikasi D-TRACE..."
            />
          </label>
          <select
            value={category}
            onChange={(event) => setCategory(event.target.value)}
          >
            <option value="Semua">Semua Kategori</option>
            {[...new Set(tracePublications.map((item) => item[1]))].map(
              (item) => (
                <option key={item}>{item}</option>
              ),
            )}
          </select>
          <select>
            <option>Periode 2026–2027</option>
          </select>
        </div>
        <div className="v5-trace-list">
          {filtered.map((x) => (
            <article key={x[0]}>
              <span>
                <FileText />
              </span>
              <div>
                <small>{x[1]}</small>
                <h2>{x[0]}</h2>
                <p>
                  {x[3]} · {x[2]}
                </p>
              </div>
              <button>
                <Download /> Unduh
              </button>
            </article>
          ))}
        </div>
        {!filtered.length && (
          <p className="v5-filter-empty">
            Tidak ada publikasi D-TRACE yang sesuai.
          </p>
        )}
      </section>
    </PublicFrame>
  );
}

export function DarPage() {
  const [query, setQuery] = useState('');
  const [organization, setOrganization] = useState('Semua');
  const [period, setPeriod] = useState('Semua');
  const filtered = useMemo(
    () =>
      archives.filter(
        (item) =>
          (organization === 'Semua' || item[0] === organization) &&
          (period === 'Semua' || item[3] === period) &&
          `${item[0]} ${item[1]} ${item[2]}`
            .toLowerCase()
            .includes(query.toLowerCase()),
      ),
    [query, organization, period],
  );
  return (
    <PublicFrame>
      <Hero
        eyebrow="D-DAR"
        title="Direktori cepat arsip DPM dan ORMAWA."
        copy="Temukan dokumen berdasarkan organisasi, kategori, dan periode tanpa menelusuri banyak halaman."
      />
      <section className="v5-shell">
        <div className="v5-data-toolbar">
          <label>
            <Search />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Cari nama dokumen atau organisasi..."
            />
          </label>
          <select
            value={organization}
            onChange={(event) => setOrganization(event.target.value)}
          >
            <option value="Semua">Semua Organisasi</option>
            {[...new Set(archives.map((item) => item[0]))].map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
          <select
            value={period}
            onChange={(event) => setPeriod(event.target.value)}
          >
            <option value="Semua">Semua Periode</option>
            {[...new Set(archives.map((item) => item[3]))].map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </div>
        <div className="v5-archive-table">
          <div>
            <b>Organisasi</b>
            <b>Nama Arsip</b>
            <b>Kategori</b>
            <b>Periode</b>
            <b>Format</b>
            <b>Aksi</b>
          </div>
          {filtered.map((x) => (
            <article key={x[1]}>
              <span>{x[0]}</span>
              <b>
                <FileArchive />
                {x[1]}
              </b>
              <span>{x[2]}</span>
              <span>{x[3]}</span>
              <span>{x[4]}</span>
              <button>
                <Download /> Unduh
              </button>
            </article>
          ))}
        </div>
        {!filtered.length && (
          <p className="v5-filter-empty">
            Tidak ada arsip yang sesuai dengan filter.
          </p>
        )}
      </section>
    </PublicFrame>
  );
}

export function OrmawaDirectory() {
  return (
    <PublicFrame>
      <Hero
        eyebrow="ORMAWA FIPP"
        title="Kenali organisasi mahasiswa FIPP UNIMA."
        copy="Setiap organisasi memiliki ruang publik untuk memperkenalkan identitas, kepengurusan, galeri, dan program kerjanya."
      />
      <section className="v5-shell v5-ormawa-grid">
        {ormawa.map((x) => (
          <article key={x.slug}>
            <span style={{ background: x.color }}>{x.short}</span>
            <h2>{x.name}</h2>
            <p>{x.description}</p>
            <small>{x.programs.length} program kerja ditampilkan</small>
            <Link href={`/ormawa/${x.slug}`}>
              Buka Halaman ORMAWA <ArrowRight />
            </Link>
          </article>
        ))}
      </section>
    </PublicFrame>
  );
}
export function OrmawaProfile({ slug }: { slug: string }) {
  const item = ormawa.find((x) => x.slug === slug) ?? ormawa[0];
  return (
    <PublicFrame>
      <section
        className="v5-ormawa-hero"
        style={{ background: `linear-gradient(120deg,${item.color},#073d30)` }}
      >
        <div className="v5-shell">
          <span>{item.short}</span>
          <div>
            <small>HALAMAN PERKENALAN ORMAWA</small>
            <h1>{item.name}</h1>
            <p>{item.description}</p>
          </div>
        </div>
      </section>
      <section className="v5-shell v5-ormawa-profile">
        <article>
          <h2>Tentang Organisasi</h2>
          <p>
            {item.description} Halaman ini dikelola langsung oleh role ORMAWA
            dengan intervensi Super Admin, Chairperson, atau Secretary bila
            diperlukan.
          </p>
          <h2>Program Kerja</h2>
          <div className="v5-ormawa-programs">
            {item.programs.map((x, i) => (
              <section key={x}>
                <b>0{i + 1}</b>
                <span>
                  <h3>{x}</h3>
                  <p>
                    Program aktif periode 2026–2027 · informasi dan publikasi
                    dikelola pengurus ORMAWA.
                  </p>
                </span>
              </section>
            ))}
          </div>
        </article>
        <aside>
          <h2>Galeri ORMAWA</h2>
          <div>
            {news.map((x) => (
              <img
                src={x.image}
                alt={`Dokumentasi ${item.name}`}
                key={x.slug}
              />
            ))}
          </div>
          <Link href="/program">
            Lihat Program Kerja <ArrowRight />
          </Link>
        </aside>
      </section>
    </PublicFrame>
  );
}
