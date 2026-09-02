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
import { usePublicPortal } from './use-public-portal';
import { formatPublicDate, publicAssetUrl } from '@/lib/public-portal';

const campusHero='/fipp-campus-hero.png';

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
  const {data,loading,error}=usePublicPortal();
  const savedHome=(data.settings['site.home']??data.settings['site_content.home_hero']??{}) as Partial<{title:string;subtitle:string;paragraph:string;image:string;cta1:string;cta1Href:string;cta2:string;cta2Href:string}>;
  const latestNews=data.contents.filter((item)=>item.content_type==='berita').slice(0,3);
  const studies=data.contents.filter((item)=>item.content_type==='d-sight').slice(0,3);
  const surveys=data.surveys.slice(0,2);
  return (
    <PublicFrame>
      <section
        className="v5-home-hero"
        style={{ '--campus': `url(${savedHome.image??campusHero})` } as React.CSSProperties}
      >
        <div className="v5-shell">
          <div className="v5-hero-copy">
            <span>DEWAN PERWAKILAN MAHASISWA</span>
            <h1>{savedHome.title??'DPM FIPP UNIMA'}</h1>
            <h2>{savedHome.subtitle??'Representasi, Aspirasi, Legislasi, dan Pengawasan Mahasiswa.'}</h2>
            <p>{savedHome.paragraph??'DPM FIPP UNIMA hadir sebagai jembatan komunikasi antara mahasiswa dan fakultas untuk mendorong perubahan, transparansi, dan kemajuan bersama.'}</p>
            <div>
              <Link className="v6-cta v6-cta-secondary" href={savedHome.cta1Href??'/tentang'}>
                <ShieldCheck /> {savedHome.cta1??'Jelajahi DPM'}
              </Link>
              <Link className="v6-cta v6-cta-primary" href={savedHome.cta2Href??'/ddas'}>
                <Send /> {savedHome.cta2??'Kirim Aspirasi'}
              </Link>
            </div>
          </div>
        </div>
      </section>
      {(loading||error)&&<p className="v5-shell v5-filter-empty">{loading?'Memuat data publik…':error}</p>}
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
            {latestNews.map((item) => (
              <Link href={`/berita/${item.slug}`} key={item.slug}>
                <img src={publicAssetUrl(item)} alt="" />
                <span>
                  <b>{item.title}</b>
                  <small>{formatPublicDate(item.published_at??item.updated_at)}</small>
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
            {data.ddas.total} <small>Total Aspirasi</small>
          </strong>
          <div className="v5-status-list">
            <p>
              <i />
              Dalam proses <b>{data.ddas.inProgress}</b>
            </p>
            <p>
              <i />
              Ditindaklanjuti <b>{data.ddas.followedUp}</b>
            </p>
            <p>
              <i />
              Selesai <b>{data.ddas.completed}</b>
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
                  <small>{formatPublicDate(x.published_at??x.updated_at)}</small>
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
            <b>{surveys.length?'Isu prioritas mahasiswa':'Belum ada survei aktif'}</b>
            {(surveys.length?surveys:[{id:'empty',title:'Belum ada data survei',responseCount:0}]).map((survey)=><div key={survey.id}><p>{survey.title}</p><div><i style={{width:'0%'}}/><span>0%</span></div></div>)}
            <small>{surveys.reduce((sum,item)=>sum+Number(item.responseCount),0)} respons masuk · hasil sementara</small>
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
            {data.organizations.length} <small>ORMAWA Aktif</small>
          </strong>
          <div className="v5-logo-cloud">
            {data.organizations.slice(0, 6).map((x) => (
              <Link
                href={`/ormawa/${x.slug}`}
                key={x.slug}
                style={{ background: '#075d46' }}
              >
                {x.shortName??x.name.slice(0,4)}
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
  const {data,loading,error}=usePublicPortal();
  const about=data.settings['site.about'] as {description?:string}|undefined;
  const organizationMembers=(data.settings['site.organization_structure'] as Array<{id?:number;role:string;name:string;unit:string;image?:string}>|undefined)??[];
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
          <p>{about?.description??'Informasi Tentang DPM belum diisi melalui Portal Admin.'}</p>
          <div className="v4-period">
            <span>
              Berdiri Sejak<b>2006</b>
            </span>
            <span>
              Periode Aktif<b>{data.period.name??'Belum diatur'}</b>
            </span>
          </div>
        </div>
      </section>
      {(loading||error)&&<p className="v5-shell v5-filter-empty">{loading?'Memuat data publik…':error}</p>}
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
              <img src={person.image??'/dpm-crest.png'} alt={`Foto ${person.name}`} />
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
            {data.organizations.map((x) => (
              <Link
                href={`/ormawa/${x.slug}`}
                key={x.slug}
                style={{ background: '#075d46' }}
              >
                {x.shortName??x.name.slice(0,4)}
              </Link>
            ))}
          </div>
        </section>
      </section>
    </PublicFrame>
  );
}

export function V4Publications() {
  const {data,loading,error}=usePublicPortal();
  const [type, setType] = useState('Semua');
  const [unit,setUnit]=useState('Semua');
  const [sort,setSort]=useState('Terbaru');
  const [query, setQuery] = useState('');
  const publications=data.contents.filter((item)=>!['program','page'].includes(item.content_type??''));
  const filtered = useMemo(
    () =>
      publications.filter(
        (item) =>
          (type === 'Semua' || item.content_type === type) &&
          (unit==='Semua'||item.unit_name===unit)&&
          `${item.content_type} ${item.title} ${item.summary}`
            .toLowerCase()
            .includes(query.toLowerCase()),
      ).sort((a,b)=>sort==='A–Z'?a.title.localeCompare(b.title):sort==='Terlama'?new Date(a.published_at??a.updated_at).getTime()-new Date(b.published_at??b.updated_at).getTime():new Date(b.published_at??b.updated_at).getTime()-new Date(a.published_at??a.updated_at).getTime()),
    [publications,type,unit,sort,query],
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
      {(loading||error)&&<p className="v5-shell v5-filter-empty">{loading?'Memuat data publik…':error}</p>}
      <section className="v5-shell">
        <div className="v4-pub-filters">
          <label>
            <span>Jenis Konten</span>
            <select
              value={type}
              onChange={(event) => setType(event.target.value)}
            >
              <option>Semua</option>
              {[...new Set(publications.map((item) => item.content_type).filter(Boolean))].map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </label>
          <label>
            <span>Kategori</span>
            <select value={type} onChange={(event)=>setType(event.target.value)}>
              <option value="Semua">Semua Kategori</option>
              {[...new Set(publications.map((item)=>item.content_type).filter(Boolean))].map((item)=><option key={item}>{item}</option>)}
            </select>
          </label>
          <label>
            <span>Unit</span>
            <select value={unit} onChange={(event)=>setUnit(event.target.value)}>
              <option>Semua Unit</option>
              {[...new Set(publications.map((item)=>item.unit_name).filter(Boolean))].map((item)=><option key={item}>{item}</option>)}
            </select>
          </label>
          <label>
            <span>Periode</span>
            <select value={data.period.id??''} disabled>
              <option value={data.period.id??''}>{data.period.name??'Belum ada periode'}</option>
            </select>
          </label>
          <label>
            <span>Sortir</span>
            <select value={sort} onChange={(event)=>setSort(event.target.value)}>
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
          {filtered.map((p) => (
            <article key={p.id}>
              <div style={{ backgroundImage: `url(${publicAssetUrl(p)})` }}>
                <span>{p.content_type?.toUpperCase()}</span>
              </div>
              <small>{formatPublicDate(p.published_at??p.updated_at)}</small>
              <h2>{p.title}</h2>
              <p>{p.summary}</p>
              <Link href={`/berita/${p.slug}`}>
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
export function V4PublicationDetail({slug}:{slug:string}) {
  const {data,loading,error}=usePublicPortal();
  const article=data.contents.find((item)=>item.slug===slug);
  const related=data.contents.filter((item)=>item.content_type==='berita'&&item.id!==article?.id).slice(0,3);
  return (
    <PublicFrame>
      <section className="v5-shell v4-article-layout">
        <article>
          <div
            className="v4-article-image"
            style={{ backgroundImage: `url(${article?publicAssetUrl(article):campusHero})` }}
          />
          <span className="v4-tag">{article?.content_type?.toUpperCase()??'BERITA'}</span>
          <h1>{article?.title??(loading?'Memuat publikasi…':'Publikasi tidak ditemukan')}</h1>
          <small>DPM FIPP UNIMA · {formatPublicDate(article?.published_at??article?.updated_at)}</small>
          <p>{article?.summary??error??'Konten ini belum tersedia pada database.'}</p>
          {article&&<PublicComments slug={article.slug} />}
        </article>
        <aside>
          <h3>Berita Terkait</h3>
          {related.map((x) => (
            <Link href={`/berita/${x.slug}`} key={x.slug}>
              <span style={{ backgroundImage: `url(${publicAssetUrl(x)})` }} />
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
