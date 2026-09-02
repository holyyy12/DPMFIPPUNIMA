'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, BarChart3, CheckCircle2, Download, FileArchive, FileText, Images, Play, Search, Vote } from 'lucide-react';
import { PublicFrame } from './v4-public';
import { usePublicPortal } from './use-public-portal';
import { formatPublicDate, publicAssetUrl, type PublicContent } from '@/lib/public-portal';

type ContentMetadata = { category?: string; fileFormat?: string; fileSize?: string; downloadUrl?: string; topic?: string; period?: string; program?: { unit?: string; media?: string; image?: string } };
const metadata = (item: PublicContent) => (item.seo ?? {}) as ContentMetadata;
const categoryOf = (item: PublicContent, fallback: string) => metadata(item).category ?? metadata(item).topic ?? fallback;
function downloadUrl(item: PublicContent) {
  const direct = metadata(item).downloadUrl;
  if (direct) return direct;
  return item.featured_object_path ? publicAssetUrl(item) : '';
}
function programView(item: PublicContent) {
  const detail = metadata(item).program ?? {};
  return { ...item, copy: item.summary, unit: detail.unit ?? item.unit_name ?? item.organization_name ?? 'DPM FIPP', media: detail.media ?? 'photo', image: publicAssetUrl(item), progress: item.progress_percent ?? 0, success: item.success_percent ?? 0, updateNote: item.public_note || 'Belum ada pembaruan publik.' };
}
function Hero({ eyebrow, title, copy }: { eyebrow: string; title: string; copy: string }) {
  return <section className="v5-directory-hero"><div className="v5-shell"><span>{eyebrow}</span><h1>{title}</h1><p>{copy}</p></div></section>;
}

export function ProgramsPage() {
  const { data, loading, error } = usePublicPortal();
  const programs = data.contents.filter((item) => item.content_type === 'program').map(programView);
  return <PublicFrame><Hero eyebrow="PROGRAM KERJA" title="Kerja nyata, progres yang dapat dipantau." copy="Ikuti tujuan, publikasi foto/video, progres pelaksanaan, dan ukuran keberhasilan setiap program DPM FIPP UNIMA." /><section className="v5-shell v5-program-grid">
    {programs.map((program) => <article key={program.id}><div className="v5-program-media" style={{ backgroundImage: `url(${program.image})` }}><span>{program.media === 'video' ? <Play /> : <Images />}{program.media}</span></div><div><small>{program.unit}</small><h2>{program.title}</h2><p>{program.copy}</p><label>Progress program <b>{program.progress}%</b><i><em style={{ width: `${program.progress}%` }} /></i></label><label>Indikator keberhasilan <b>{program.success}%</b><i><em style={{ width: `${program.success}%` }} /></i></label><Link href={`/program/${program.slug}`}>Lihat Publikasi Program <ArrowRight /></Link></div></article>)}
    {!loading && !programs.length && <p className="v5-filter-empty">Belum ada program kerja yang dipublikasikan.</p>}{error && <p className="v5-filter-empty">Data program belum dapat dimuat.</p>}
  </section></PublicFrame>;
}

export function ProgramDetailPage({ slug }: { slug: string }) {
  const { data, loading } = usePublicPortal();
  const programs = data.contents.filter((item) => item.content_type === 'program').map(programView);
  const program = programs.find((item) => item.slug === slug);
  if (loading) return <PublicFrame><section className="v5-shell v5-program-detail"><p>Memuat program…</p></section></PublicFrame>;
  if (!program) return <PublicFrame><section className="v5-shell v5-program-detail"><Link href="/program"><ArrowLeft /> Semua Program</Link><h1>Program tidak ditemukan</h1><p>Program ini belum diterbitkan melalui Portal Admin.</p></section></PublicFrame>;
  return <PublicFrame><section className="v5-shell v5-program-detail"><Link href="/program"><ArrowLeft /> Semua Program</Link><div className="v5-program-detail-hero" style={{ backgroundImage: `linear-gradient(90deg,#043d30dd,#043d3040),url(${program.image})` }}><span>{program.media === 'video' ? <Play /> : <Images />}{program.unit}</span><h1>{program.title}</h1><p>{program.copy}</p></div><div className="v5-program-detail-grid"><article><h2>Publikasi Program</h2><p>{program.updateNote}</p><div className="v5-inline-gallery">{programs.map((item) => <span key={item.id} style={{ backgroundImage: `url(${item.image})` }} />)}</div></article><aside><h2>Progres</h2><strong>{program.progress}%</strong><i><em style={{ width: `${program.progress}%` }} /></i><p><CheckCircle2 /> Indikator keberhasilan: <b>{program.success}%</b></p><p><CheckCircle2 /> Pembaruan terakhir: {formatPublicDate(program.progress_updated_at ?? program.updated_at)}</p></aside></div></section></PublicFrame>;
}

export function SightPage() {
  const { data, loading } = usePublicPortal();
  const [selectedIssue, setSelectedIssue] = useState('');
  const studies = data.contents.filter((item) => item.content_type === 'd-sight');
  const news = data.contents.filter((item) => item.content_type === 'berita');
  return <PublicFrame><Hero eyebrow="D-SIGHT" title="Kajian, survei, dan berita berbasis isu mahasiswa." copy="D-SIGHT membantu mahasiswa memahami isu melalui kajian, hasil survei agregat, dan berita yang relevan." /><section className="v5-shell v5-domain-tabs"><a href="#kajian">Kajian</a><a href="#survei">Survei</a><a href="#berita">Berita</a></section>
    <section className="v5-shell v5-domain-section" id="kajian"><header><span><BarChart3 /></span><div><h2>Kajian Terbaru</h2><p>Analisis dan rekomendasi kebijakan berbasis data.</p></div></header><div className="v5-study-cards">{studies.map((item) => <article key={item.id}><span>{categoryOf(item, 'Kajian')}</span><h3>{item.title}</h3><p>Diterbitkan {formatPublicDate(item.published_at)}</p><Link href={`/berita/${item.slug}`}>Baca Kajian <ArrowRight /></Link></article>)}</div>{!loading && !studies.length && <p className="v5-filter-empty">Belum ada kajian yang dipublikasikan.</p>}</section>
    <section className="v5-shell v5-domain-section" id="survei"><header><span><Vote /></span><div><h2>Survei & Hasil Sementara</h2><p>Pilih isu dan lihat jumlah respons agregat tanpa data pribadi responden.</p></div></header><div className="v5-survey-grid">{data.surveys.map((survey) => <article key={survey.id}><h3>{survey.title}</h3><strong>{survey.responseCount}</strong><p>respons masuk</p><button type="button" className={selectedIssue === survey.id ? 'selected' : ''} onClick={() => setSelectedIssue(survey.id)}>{selectedIssue === survey.id ? 'Isu Dipilih' : 'Pilih Isu'}</button></article>)}</div>{!loading && !data.surveys.length && <p className="v5-filter-empty">Belum ada survei publik yang aktif.</p>}</section>
    <section className="v5-shell v5-domain-section" id="berita"><header><span><FileText /></span><div><h2>Berita D-SIGHT</h2><p>Perkembangan isu, dialog, dan publikasi kajian.</p></div></header><div className="v5-news-grid">{news.map((item) => <Link href={`/berita/${item.slug}`} key={item.id}><img src={publicAssetUrl(item)} alt="" /><span><b>{item.title}</b><small>{formatPublicDate(item.published_at)}</small></span></Link>)}</div>{!loading && !news.length && <p className="v5-filter-empty">Belum ada berita yang dipublikasikan.</p>}</section>
  </PublicFrame>;
}

export function TracePage() {
  const { data, loading } = usePublicPortal();
  const [query, setQuery] = useState(''); const [category, setCategory] = useState('Semua'); const [period, setPeriod] = useState('Semua');
  const items = data.contents.filter((item) => item.content_type === 'd-trace');
  const categories = [...new Set(items.map((item) => categoryOf(item, 'Publikasi')))].sort();
  const periods = [...new Set(items.map((item) => metadata(item).period ?? data.period.name ?? '').filter(Boolean))].sort();
  const filtered = useMemo(() => items.filter((item) => { const itemPeriod = metadata(item).period ?? data.period.name ?? ''; return (category === 'Semua' || categoryOf(item, 'Publikasi') === category) && (period === 'Semua' || itemPeriod === period) && `${item.title} ${item.summary}`.toLowerCase().includes(query.toLowerCase()); }), [items, query, category, period, data.period.name]);
  return <PublicFrame><Hero eyebrow="D-TRACE" title="Publikasi internal yang terbuka untuk publik." copy="Telusuri laporan kinerja, notulen publik, tindak lanjut, dan dokumen akuntabilitas internal DPM." /><section className="v5-shell"><div className="v5-data-toolbar"><label><Search /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Cari publikasi D-TRACE..." /></label><select value={category} onChange={(event) => setCategory(event.target.value)}><option value="Semua">Semua Kategori</option>{categories.map((item) => <option key={item}>{item}</option>)}</select><select value={period} onChange={(event) => setPeriod(event.target.value)}><option value="Semua">Semua Periode</option>{periods.map((item) => <option key={item}>{item}</option>)}</select></div><div className="v5-trace-list">{filtered.map((item) => { const url = downloadUrl(item); return <article key={item.id}><span><FileText /></span><div><small>{categoryOf(item, 'Publikasi')}</small><h2>{item.title}</h2><p>{formatPublicDate(item.published_at)}{metadata(item).fileFormat ? ` · ${metadata(item).fileFormat}` : ''}</p></div>{url ? <a className="v5-download-button" href={url} target="_blank" rel="noreferrer"><Download /> Unduh</a> : <button type="button" disabled title="Berkas belum diunggah"><Download /> Belum tersedia</button>}</article>; })}</div>{!loading && !filtered.length && <p className="v5-filter-empty">Tidak ada publikasi D-TRACE yang sesuai.</p>}</section></PublicFrame>;
}

export function DarPage() {
  const { data, loading } = usePublicPortal();
  const [query, setQuery] = useState(''); const [organization, setOrganization] = useState('Semua'); const [period, setPeriod] = useState('Semua');
  const items = data.contents.filter((item) => item.content_type === 'd-dar');
  const organizations = [...new Set(items.map((item) => item.organization_name ?? item.unit_name ?? 'DPM FIPP'))].sort();
  const periods = [...new Set(items.map((item) => metadata(item).period ?? data.period.name ?? '').filter(Boolean))].sort();
  const filtered = useMemo(() => items.filter((item) => { const owner = item.organization_name ?? item.unit_name ?? 'DPM FIPP'; const itemPeriod = metadata(item).period ?? data.period.name ?? ''; return (organization === 'Semua' || owner === organization) && (period === 'Semua' || itemPeriod === period) && `${owner} ${item.title} ${item.summary}`.toLowerCase().includes(query.toLowerCase()); }), [items, query, organization, period, data.period.name]);
  return <PublicFrame><Hero eyebrow="D-DAR" title="Direktori cepat arsip DPM dan ORMAWA." copy="Temukan dokumen berdasarkan organisasi, kategori, dan periode tanpa menelusuri banyak halaman." /><section className="v5-shell"><div className="v5-data-toolbar"><label><Search /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Cari nama dokumen atau organisasi..." /></label><select value={organization} onChange={(event) => setOrganization(event.target.value)}><option value="Semua">Semua Organisasi</option>{organizations.map((item) => <option key={item}>{item}</option>)}</select><select value={period} onChange={(event) => setPeriod(event.target.value)}><option value="Semua">Semua Periode</option>{periods.map((item) => <option key={item}>{item}</option>)}</select></div><div className="v5-archive-table"><div><b>Organisasi</b><b>Nama Arsip</b><b>Kategori</b><b>Periode</b><b>Format</b><b>Aksi</b></div>{filtered.map((item) => { const url = downloadUrl(item); return <article key={item.id}><span>{item.organization_name ?? item.unit_name ?? 'DPM FIPP'}</span><b><FileArchive />{item.title}</b><span>{categoryOf(item, 'Dokumen')}</span><span>{metadata(item).period ?? data.period.name ?? '—'}</span><span>{metadata(item).fileFormat ?? '—'}{metadata(item).fileSize ? ` · ${metadata(item).fileSize}` : ''}</span>{url ? <a className="v5-download-button" href={url} target="_blank" rel="noreferrer"><Download /> Unduh</a> : <button type="button" disabled title="Berkas belum diunggah"><Download /> Belum tersedia</button>}</article>; })}</div>{!loading && !filtered.length && <p className="v5-filter-empty">Tidak ada arsip yang sesuai dengan filter.</p>}</section></PublicFrame>;
}

export function OrmawaDirectory() {
  const { data, loading } = usePublicPortal();
  return <PublicFrame><Hero eyebrow="ORMAWA FIPP" title="Kenali organisasi mahasiswa FIPP UNIMA." copy="Setiap organisasi memiliki ruang publik untuk memperkenalkan identitas, kepengurusan, galeri, dan program kerjanya." /><section className="v5-shell v5-ormawa-grid">{data.organizations.map((item) => { const programs = data.contents.filter((content) => content.content_type === 'program' && content.organization_id === item.id); return <article key={item.id}><span>{item.shortName || item.name.slice(0, 3).toUpperCase()}</span><h2>{item.name}</h2><p>{item.description}</p><small>{programs.length} program kerja ditampilkan</small><Link href={`/ormawa/${item.slug}`}>Buka Halaman ORMAWA <ArrowRight /></Link></article>; })}{!loading && !data.organizations.length && <p className="v5-filter-empty">Belum ada ORMAWA aktif pada database.</p>}</section></PublicFrame>;
}

export function OrmawaProfile({ slug }: { slug: string }) {
  const { data, loading } = usePublicPortal(); const item = data.organizations.find((organization) => organization.slug === slug);
  if (loading) return <PublicFrame><section className="v5-shell"><p>Memuat halaman ORMAWA…</p></section></PublicFrame>;
  if (!item) return <PublicFrame><section className="v5-shell"><h1>ORMAWA tidak ditemukan</h1><p>Halaman organisasi ini belum diterbitkan melalui Portal Admin.</p><Link href="/ormawa">Kembali ke daftar ORMAWA</Link></section></PublicFrame>;
  const programs = data.contents.filter((content) => content.content_type === 'program' && content.organization_id === item.id).map(programView);
  const gallery = data.contents.filter((content) => content.organization_id === item.id && content.featured_object_path);
  return <PublicFrame><section className="v5-ormawa-hero"><div className="v5-shell"><span>{item.shortName || item.name.slice(0, 3).toUpperCase()}</span><div><small>HALAMAN PERKENALAN ORMAWA</small><h1>{item.name}</h1><p>{item.description}</p></div></div></section><section className="v5-shell v5-ormawa-profile"><article><h2>Tentang Organisasi</h2><p>{item.description}</p>{item.members.length > 0 && <><h2>Pengurus</h2><div className="v5-ormawa-programs">{item.members.map((member, index) => <section key={member.id}><b>{String(index + 1).padStart(2, '0')}</b><span><h3>{member.name}</h3><p>{member.position}</p></span></section>)}</div></>}<h2>Program Kerja</h2><div className="v5-ormawa-programs">{programs.map((program, index) => <section key={program.id}><b>{String(index + 1).padStart(2, '0')}</b><span><h3>{program.title}</h3><p>{program.copy}</p></span></section>)}</div>{!programs.length && <p>Belum ada program kerja yang dipublikasikan.</p>}</article><aside><h2>Galeri ORMAWA</h2><div>{gallery.map((content) => <img src={publicAssetUrl(content)} alt={`Dokumentasi ${item.name}`} key={content.id} />)}</div>{!gallery.length && <p>Belum ada galeri yang dipublikasikan.</p>}<Link href="/program">Lihat Program Kerja <ArrowRight /></Link></aside></section></PublicFrame>;
}
