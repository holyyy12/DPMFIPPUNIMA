'use client';

import { useEffect, useState } from 'react';
import {
  Activity,
  BarChart3,
  Bell,
  Building2,
  CheckCircle2,
  FileArchive,
  FileText,
  History,
  Image,
  Images,
  LockKeyhole,
  Mail,
  Plus,
  Save,
  Search,
  ShieldCheck,
  SquareArrowOutUpRight,
  Upload,
  Vote,
} from 'lucide-react';
import Link from 'next/link';
import { useAdminPortal } from './use-admin-portal';

type ProgramDraft = {
  slug: string;
  title: string;
  copy: string;
  unit: string;
  media: 'photo' | 'video' | 'gallery';
  image: string;
  progress: number;
  success: number;
  updateNote: string;
  updatedAt: string;
};

type OrganizationMember = {
  id: number;
  role: string;
  name: string;
  unit: string;
  image: string;
};

function Title({
  title,
  copy,
  action = 'Simpan Perubahan',
  onAction,
  actionDisabled = false,
}: {
  title: string;
  copy: string;
  action?: string;
  onAction?: () => void;
  actionDisabled?: boolean;
}) {
  return (
    <header className="v4-admin-title">
      <div>
        <h1>{title}</h1>
        <p>{copy}</p>
      </div>
      <div>
        <button
          type="button"
          className="primary"
          onClick={onAction}
          disabled={actionDisabled}
        >
          <Save />
          {action}
        </button>
      </div>
    </header>
  );
}
function Metric({
  icon: Icon,
  label,
  value,
  note,
}: {
  icon: typeof Activity;
  label: string;
  value: string;
  note: string;
}) {
  return (
    <article>
      <span>
        <Icon />
      </span>
      <p>{label}</p>
      <strong>{value}</strong>
      <small>{note}</small>
    </article>
  );
}

export function SiteContentAdmin() {
  const { data, loading, error, message, runAction } = useAdminPortal();
  const stored = data.settings['site.home'] as Partial<{ title:string; subtitle:string; paragraph:string; cta1:string; cta1Href:string; cta2:string; cta2Href:string }> | undefined;
  const [form, setForm] = useState({ title:'DPM FIPP UNIMA', subtitle:'Representasi, Aspirasi, Legislasi, dan Pengawasan Mahasiswa.', paragraph:'DPM FIPP UNIMA hadir sebagai jembatan komunikasi antara mahasiswa dan fakultas untuk mendorong perubahan, transparansi, dan kemajuan bersama.', cta1:'Jelajahi DPM', cta1Href:'/tentang', cta2:'Kirim Aspirasi', cta2Href:'/ddas' });
  useEffect(() => { if (stored) setForm((current) => ({ ...current, ...stored })); }, [JSON.stringify(stored)]);
  const field = (key: keyof typeof form, value:string) => setForm((current) => ({ ...current, [key]:value }));
  return (
    <div className="v4-admin-content v5-admin-workspace">
      <Title
        title="Tampilan Situs & Aset"
        copy="Kelola Hero Beranda, teks institusional, logo, foto, dan navigasi tanpa mengubah kode."
        onAction={() => void runAction('setting.save', { namespace:'site', key:'home', value:form, isPublic:true }, 'Tampilan situs berhasil disimpan ke Supabase.')}
      />
      {(loading || error || message) && <p className="v5-admin-message">{loading ? 'Memuat data Supabase…' : error || message}</p>}
      <div className="v5-admin-layout">
        <main>
          <section className="v4-panel v5-admin-form">
            <header>
              <h2>Hero Beranda</h2>
              <span>Terbit</span>
            </header>
            <label>
              Judul utama
              <input value={form.title} onChange={(event) => field('title',event.target.value)} />
            </label>
            <label>
              Subjudul
              <input value={form.subtitle} onChange={(event) => field('subtitle',event.target.value)} />
            </label>
            <label>
              Paragraf
              <textarea value={form.paragraph} onChange={(event) => field('paragraph',event.target.value)} />
            </label>
            <label>
              Gambar Hero
              <div className="v5-asset-field">
                <img src="/fipp-campus-hero.png" alt="Pratinjau Hero" />
                <span>
                  <button onClick={() => location.assign('/admin/media')}>
                    <Upload /> Ganti Gambar
                  </button>
                  <small>JPG, PNG, WebP · rekomendasi 2400×1000 px</small>
                </span>
              </div>
            </label>
          </section>
          <section className="v4-panel v5-admin-form">
            <header>
              <h2>CTA Beranda</h2>
            </header>
            <div className="v5-form-grid">
              <label>
                CTA 1<input value={form.cta1} onChange={(event) => field('cta1',event.target.value)} />
              </label>
              <label>
                Tujuan
                <input value={form.cta1Href} onChange={(event) => field('cta1Href',event.target.value)} />
              </label>
              <label>
                CTA 2<input value={form.cta2} onChange={(event) => field('cta2',event.target.value)} />
              </label>
              <label>
                Tujuan
                <input value={form.cta2Href} onChange={(event) => field('cta2Href',event.target.value)} />
              </label>
            </div>
          </section>
        </main>
        <aside>
          <section className="v4-panel v5-admin-form">
            <header>
              <h2>Identitas Visual</h2>
            </header>
            <label>
              Logo Utama
              <div className="v5-logo-editor">
                <img src="/dpm-crest.png" alt="Logo saat ini" />
                <button onClick={() => location.assign('/admin/media')}>
                  <Upload /> Ganti Logo
                </button>
              </div>
            </label>
            <label>
              Favicon
              <button onClick={() => location.assign('/admin/media')}>
                <Image /> Unggah Favicon
              </button>
            </label>
            <label>
              Gambar Social Preview
              <button onClick={() => location.assign('/admin/media')}>
                <Image /> Ganti Gambar
              </button>
            </label>
          </section>
          <section className="v4-panel v5-admin-form">
            <header>
              <h2>Pustaka Aset Cepat</h2>
            </header>
            {[
              'Logo DPM',
              'Hero Beranda',
              'Foto Tentang',
              'Logo ORMAWA',
              'Thumbnail Publikasi',
            ].map((x) => (
              <p className="v5-asset-row" key={x}>
                <Image />
                <span>
                  <b>{x}</b>
                  <small>Dapat diganti dari Media</small>
                </span>
                <button onClick={() => location.assign('/admin/media')}>Kelola</button>
              </p>
            ))}
          </section>
        </aside>
      </div>
    </div>
  );
}

export function ProgramsAdmin() {
  const [items, setItems] = useState<ProgramDraft[]>([]);
  const [selectedSlug, setSelectedSlug] = useState('');
  const [status, setStatus] = useState('Memuat data dari penyimpanan pusat…');
  const [isSaving, setIsSaving] = useState(false);

  const selected = items.find((item) => item.slug === selectedSlug) ?? items[0];

  const updateSelected = (field: keyof ProgramDraft, value: string | number) => {
    setItems((current) =>
      current.map((item) =>
        item.slug === selectedSlug ? { ...item, [field]: value } : item,
      ),
    );
    setStatus('Perubahan belum disimpan.');
  };

  const loadPrograms = async () => {
    setStatus('Memuat data dari penyimpanan pusat…');
    try {
      const response = await fetch('/api/programs', { cache: 'no-store' });
      const payload = (await response.json()) as {
        ok: boolean;
        data?: ProgramDraft[];
        message?: string;
      };
      if (!response.ok || !payload.ok || !payload.data?.length) {
        throw new Error(payload.message ?? 'Data program belum tersedia.');
      }
      setItems(payload.data);
      setSelectedSlug((current) =>
        payload.data?.some((item) => item.slug === current)
          ? current
          : payload.data?.[0]?.slug ?? current,
      );
      setStatus('Data terbaru berhasil dimuat dari penyimpanan pusat.');
    } catch {
      setStatus('Penyimpanan pusat belum dapat dijangkau. Tidak ada data contoh yang ditampilkan.');
    }
  };

  useEffect(() => {
    void loadPrograms();
  }, []);

  const saveProgram = async () => {
    if (!selected) return;
    setIsSaving(true);
    setStatus('Menyimpan pembaruan…');
    try {
      const response = await fetch('/api/programs', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(selected),
      });
      const payload = (await response.json()) as { ok: boolean; message?: string };
      if (!response.ok || !payload.ok) {
        throw new Error(payload.message ?? 'Pembaruan gagal disimpan.');
      }
      await loadPrograms();
      setStatus('Progres tersimpan dan langsung tersedia pada portal publik.');
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Pembaruan gagal disimpan.');
    } finally {
      setIsSaving(false);
    }
  };

  if (!selected) return <div className="v4-admin-content v7-program-admin"><Title title="Program Kerja" copy="Perbarui progres, indikator keberhasilan, catatan, dan publikasi media setiap program." action="Muat Ulang Data" onAction={() => void loadPrograms()} /><section className="v4-panel"><p className="v5-filter-empty">{status}</p></section></div>;

  return (
    <div className="v4-admin-content v7-program-admin">
      <Title
        title="Program Kerja"
        copy="Perbarui progres, indikator keberhasilan, catatan, dan publikasi media setiap program."
        action={isSaving ? 'Menyimpan…' : 'Simpan Progres'}
        onAction={() => void saveProgram()}
        actionDisabled={isSaving}
      />
      <div className="v7-storage-note" role="note">
        <ShieldCheck />
        <div>
          <b>Penyimpanan pusat aktif</b>
          <p>Perubahan disimpan di Supabase dan ditampilkan kepada seluruh pengunjung setelah berhasil disimpan.</p>
        </div>
      </div>
      <div className="v7-program-layout">
        <aside className="v4-panel v7-program-list">
          <header>
            <div><h2>Daftar Program</h2><p>Pilih program yang akan diperbarui.</p></div>
          </header>
          {items.map((item) => (
            <button
              type="button"
              key={item.slug}
              className={item.slug === selectedSlug ? 'active' : ''}
              onClick={() => { setSelectedSlug(item.slug); setStatus('Perubahan belum disimpan.'); }}
            >
              <span style={{ backgroundImage: `url(${item.image})` }} />
              <div><b>{item.title}</b><small>{item.unit} · Progres {item.progress}%</small></div>
            </button>
          ))}
        </aside>
        <main className="v4-panel v5-admin-form v7-program-editor">
          <header>
            <div><h2>Perbarui Program</h2><p>{selected.title}</p></div>
            <Link href={`/program/${selected.slug}`} target="_blank"><SquareArrowOutUpRight /> Pratinjau Publik</Link>
          </header>
          <div className="v5-form-grid">
            <label>Judul program<input value={selected.title} onChange={(event) => updateSelected('title', event.target.value)} /></label>
            <label>Unit penanggung jawab<input value={selected.unit} onChange={(event) => updateSelected('unit', event.target.value)} /></label>
          </div>
          <label>Ringkasan program<textarea value={selected.copy} onChange={(event) => updateSelected('copy', event.target.value)} /></label>
          <div className="v7-progress-fields">
            <label>
              <span>Persentase progres <b>{selected.progress}%</b></span>
              <input type="range" min="0" max="100" value={selected.progress} onChange={(event) => updateSelected('progress', Number(event.target.value))} />
            </label>
            <label>
              <span>Indikator keberhasilan <b>{selected.success}%</b></span>
              <input type="range" min="0" max="100" value={selected.success} onChange={(event) => updateSelected('success', Number(event.target.value))} />
            </label>
          </div>
          <label>Catatan pembaruan<textarea value={selected.updateNote} onChange={(event) => updateSelected('updateNote', event.target.value)} placeholder="Jelaskan capaian, kendala, atau langkah berikutnya." /></label>
          <div className="v5-form-grid">
            <label>Jenis publikasi<select value={selected.media} onChange={(event) => updateSelected('media', event.target.value)}><option value="photo">Foto</option><option value="video">Video</option><option value="gallery">Galeri</option></select></label>
            <label>URL foto/video<input value={selected.image} onChange={(event) => updateSelected('image', event.target.value)} placeholder="https://..." /></label>
          </div>
          <div className="v7-media-preview"><span style={{ backgroundImage: `url(${selected.image})` }}><Images /></span><p><b>Pratinjau media</b><small>Gunakan URL gambar publik. Unggah file permanen akan tersedia setelah penyimpanan media terhubung.</small></p></div>
          <footer className="v7-editor-actions">
            <p>{status}</p>
            <button type="button" onClick={() => void loadPrograms()} disabled={isSaving}><History /> Muat Ulang Data</button>
            <button type="button" className="primary" onClick={() => void saveProgram()} disabled={isSaving}><Save /> {isSaving ? 'Menyimpan…' : 'Perbarui Progres'}</button>
          </footer>
        </main>
      </div>
    </div>
  );
}

export function InsightAdmin() {
  const { data, loading, error } = useAdminPortal();
  const studies = data.contents.filter((item) => ['study', 'kajian', 'news'].includes(item.content_type ?? ''));
  const surveys = data.surveys;
  const openEditor = (id?: string, type?: string) => location.assign(`/admin/cms?${new URLSearchParams({ ...(id ? { id } : {}), ...(type ? { type } : {}) })}`);
  return (
    <div className="v4-admin-content">
      <Title
        title="D-SIGHT"
        copy="Kelola kajian, survei, berita berbasis isu, serta ringkasan hasil sementara."
        action="Buat Konten D-SIGHT"
        onAction={() => openEditor(undefined, 'study')}
      />
      {(loading || error) && <p className="v5-admin-message">{loading ? 'Memuat data Supabase…' : error}</p>}
      <div className="v4-admin-stats">
        <Metric
          icon={BarChart3}
          label="Kajian Terbit"
          value={String(studies.filter((x) => x.status === 'published').length)}
          note="Data Supabase"
        />
        <Metric icon={Vote} label="Survei Aktif" value={String(surveys.filter((x) => x.status === 'active').length)} note={`${surveys.reduce((sum, x) => sum + Number(x.response_count), 0)} respons`} />
        <Metric
          icon={FileText}
          label="Berita Isu"
          value={String(data.contents.filter((x) => x.content_type === 'news' && x.status === 'published').length)}
          note="Berita terbit"
        />
      </div>
      <div className="v5-admin-layout">
        <section className="v4-panel">
          <header>
            <div>
              <h2>Daftar Kajian</h2>
              <p>Draft, review, dan publikasi kajian.</p>
            </div>
            <button className="primary" onClick={() => openEditor(undefined, 'study')}>
              <Plus /> Tambah Kajian
            </button>
          </header>
          <div className="v5-admin-list">
            {studies.map((x) => (
              <article key={x.id}>
                <BarChart3 />
                <span>
                  <b>{x.title}</b>
                  <small>{x.status} · {x.unit_name ?? 'DPM FIPP'}</small>
                </span>
                <button onClick={() => openEditor(x.id)}>Edit</button>
              </article>
            ))}
            {!studies.length && <p className="v5-filter-empty">Belum ada kajian pada database.</p>}
          </div>
        </section>
        <aside>
          <section className="v4-panel">
            <header>
              <h2>Survei Berjalan</h2>
              <button className="primary" onClick={() => openEditor(undefined, 'survey')}>
                <Plus /> Buat Survei
              </button>
            </header>
            <div className="v5-admin-list">
              {surveys.map((x) => (
                <article key={x.id}>
                  <Vote />
                  <span>
                    <b>{x.title}</b>
                    <small>{x.response_count} respons · {x.status}</small>
                  </span>
                  <button onClick={() => location.assign(`/admin/cms?survey=${x.id}`)}>Hasil</button>
                </article>
              ))}
              {!surveys.length && <p className="v5-filter-empty">Belum ada survei pada database.</p>}
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}

export function TraceAdmin() {
  const { data, loading, error } = useAdminPortal();
  const records = data.contents.filter((item) => ['trace', 'd-trace', 'internal_publication'].includes(item.content_type ?? ''));
  const edit = (id?: string) => location.assign(`/admin/cms?type=trace${id ? `&id=${id}` : ''}`);
  return (
    <div className="v4-admin-content">
      <Title
        title="D-TRACE"
        copy="Kelola publikasi internal DPM yang telah ditetapkan aman untuk dibaca publik."
        action="Tambah Publikasi"
        onAction={() => edit()}
      />
      {(loading || error) && <p className="v5-admin-message">{loading ? 'Memuat data Supabase…' : error}</p>}
      <div className="v5-admin-layout">
        <section className="v4-panel">
          <header>
            <div>
              <h2>Publikasi Internal</h2>
              <p>Dokumen wajib melalui sanitasi dan klasifikasi publik.</p>
            </div>
            <button className="primary" onClick={() => edit()}>
              <Plus /> Unggah
            </button>
          </header>
          <div className="v5-admin-list">
            {records.map((x) => (
              <article key={x.id}>
                <FileText />
                <span>
                  <b>{x.title}</b>
                  <small>{x.status} · {x.unit_name ?? 'DPM FIPP'}</small>
                </span>
                <button onClick={() => edit(x.id)}>Edit</button>
              </article>
            ))}
            {!records.length && <p className="v5-filter-empty">Belum ada publikasi D-TRACE pada database.</p>}
          </div>
        </section>
        <aside>
          <section className="v4-panel v5-admin-form">
            <header>
              <h2>Aturan Publikasi</h2>
            </header>
            <label>
              Klasifikasi
              <select>
                <option>Publik (Tersanitasi)</option>
              </select>
            </label>
            <label>
              Periode
              <select defaultValue={data.periods.find((x) => x.is_current)?.id}>
                {data.periods.map((x) => <option value={x.id} key={x.id}>{x.name}</option>)}
              </select>
            </label>
            <label>
              Unit pemilik
              <select>
                <option value="">Semua Unit DPM</option>
                {data.units.map((x) => <option value={x.id} key={x.id}>{x.name}</option>)}
              </select>
            </label>
            <label>
              <input type="checkbox" defaultChecked /> Sudah melewati
              pemeriksaan data pribadi
            </label>
          </section>
        </aside>
      </div>
    </div>
  );
}

export function ArchiveAdmin() {
  const { data, loading, error } = useAdminPortal();
  const archives = data.contents.filter((item) => ['archive', 'd-dar', 'document'].includes(item.content_type ?? ''));
  const edit = (id?: string) => location.assign(`/admin/cms?type=archive${id ? `&id=${id}` : ''}`);
  return (
    <div className="v4-admin-content">
      <Title
        title="D-DAR"
        copy="Kelola direktori arsip cepat DPM dan seluruh ORMAWA berdasarkan organisasi dan periode."
        action="Tambah Arsip"
        onAction={() => edit()}
      />
      {(loading || error) && <p className="v5-admin-message">{loading ? 'Memuat data Supabase…' : error}</p>}
      <section className="v4-panel">
        <header>
          <div>
            <h2>Direktori Arsip</h2>
            <p>Dokumen, metadata, pemilik, dan hak akses.</p>
          </div>
          <button className="primary" onClick={() => edit()}>
            <Upload /> Unggah Arsip
          </button>
        </header>
        <div className="v5-admin-table">
          <div>
            <b>Organisasi</b>
            <b>Dokumen</b>
            <b>Kategori</b>
            <b>Periode</b>
            <b>Akses</b>
            <b>Aksi</b>
          </div>
          {archives.map((x) => (
            <p key={x.id}>
              <span>{x.unit_name ?? 'DPM FIPP'}</span>
              <b>
                <FileArchive />
                {x.title}
              </b>
              <span>{x.content_type ?? 'Arsip'}</span>
              <span>{new Date(x.updated_at).getFullYear()}</span>
              <span>{x.status}</span>
              <button onClick={() => edit(x.id)}>Edit</button>
            </p>
          ))}
          {!archives.length && <p className="v5-filter-empty">Belum ada arsip pada database.</p>}
        </div>
      </section>
    </div>
  );
}

export function NotificationsAdmin() {
  const { data, loading, error, message, runAction } = useAdminPortal();
  const unread = data.notifications.filter((item) => !item.read_at);
  const storedPreferences = data.settings['notifications.preferences'] as Record<string, boolean> | undefined;
  const preferenceLabels = ['Aspirasi prioritas','Permintaan approval','Konten menunggu review','Insiden layanan'];
  const [preferences, setPreferences] = useState<Record<string, boolean>>({});
  useEffect(() => { setPreferences(storedPreferences ?? Object.fromEntries(preferenceLabels.map((label) => [label,true]))); }, [JSON.stringify(storedPreferences)]);
  return (
    <div className="v4-admin-content">
      <Title
        title="Notifikasi"
        copy="Kelola notifikasi in-app, template, preferensi, dan status pengiriman."
        action="Buat Notifikasi"
        onAction={() => location.assign('/admin/cms?type=notification')}
      />
      {(loading || error || message) && <p className="v5-admin-message">{loading ? 'Memuat data Supabase…' : error || message}</p>}
      <div className="v4-admin-stats">
        <Metric
          icon={Bell}
          label="Belum Dibaca"
          value={String(unread.length)}
          note="Untuk akun ini"
        />
        <Metric
          icon={Mail}
          label="Terkirim Hari Ini"
          value={String(data.notifications.filter((x) => new Date(x.created_at).toDateString() === new Date().toDateString()).length)}
          note="Masuk hari ini"
        />
        <Metric icon={Activity} label="Antrean" value={String(data.notifications.filter((x) => x.priority === 'high' && !x.read_at).length)} note="Prioritas tinggi" />
      </div>
      <div className="v5-admin-layout">
        <section className="v4-panel">
          <header>
            <h2>Notifikasi Terbaru</h2>
          </header>
          <div className="v5-admin-list">
            {data.notifications.map((x) => (
              <article key={x.id}>
                <Bell />
                <span>
                  <b>{x.title}</b>
                  <small>{x.message_safe} · {x.priority}</small>
                </span>
                {x.read_at ? <small>Dibaca</small> : <button onClick={() => void runAction('notification.mark_read', { id: x.id }, 'Notifikasi ditandai dibaca.')}>Tandai dibaca</button>}
              </article>
            ))}
            {!data.notifications.length && <p className="v5-filter-empty">Belum ada notifikasi.</p>}
          </div>
        </section>
        <aside>
          <section className="v4-panel v5-admin-form">
            <header>
              <h2>Preferensi</h2>
            </header>
            {preferenceLabels.map((x) => (
              <label key={x}>
                <input type="checkbox" checked={preferences[x] ?? true} onChange={(event) => { const next={...preferences,[x]:event.target.checked};setPreferences(next);void runAction('setting.save',{namespace:'notifications',key:'preferences',value:next,isPublic:false},'Preferensi notifikasi berhasil disimpan.'); }} /> {x}
              </label>
            ))}
          </section>
        </aside>
      </div>
    </div>
  );
}

export function OrganizationAdmin() {
  const { data, loading, error, message, runAction } = useAdminPortal();
  const storedMembers = data.settings['site.organization_structure'] as OrganizationMember[] | undefined;
  const storedAbout = data.settings['site.about'] as { description?:string } | undefined;
  const [members, setMembers] = useState<OrganizationMember[]>([]);
  const [about, setAbout] = useState('');
  const [saved, setSaved] = useState(false);
  const [ormawaPublish, setOrmawaPublish] = useState(true);
  useEffect(() => { const savedPolicy=data.settings['organization.ormawa_self_publish']; if(typeof savedPolicy==='boolean') setOrmawaPublish(savedPolicy); }, [data.settings]);
  useEffect(() => { if (storedMembers) setMembers(storedMembers); }, [JSON.stringify(storedMembers)]);
  useEffect(() => { if (storedAbout?.description) setAbout(storedAbout.description); }, [storedAbout?.description]);
  const updateMember = (
    id: number,
    field: keyof OrganizationMember,
    value: string,
  ) => {
    setMembers((current) =>
      current.map((member) =>
        member.id === id ? { ...member, [field]: value } : member,
      ),
    );
    setSaved(false);
  };
  const addMember = () => {
    setMembers((current) => [
      ...current,
      {
        id: Date.now(),
        role: 'Jabatan Baru',
        name: 'Nama Pengurus',
        unit: 'Unit/Komisi',
        image: '/dpm-crest.png',
      },
    ]);
    setSaved(false);
  };
  return (
    <div className="v4-admin-content">
      <Title
        title="Periode, Struktur & ORMAWA"
        copy="Kelola halaman Tentang, struktur organisasi, periode, dan permintaan halaman ORMAWA tanpa coding."
        onAction={() => void Promise.all([
          runAction('setting.save', { namespace:'site', key:'about', value:{ description:about }, isPublic:true }, 'Konten organisasi berhasil disimpan.'),
          runAction('setting.save', { namespace:'site', key:'organization_structure', value:members, isPublic:true }, 'Struktur organisasi berhasil disimpan.'),
        ]).then(() => setSaved(true))}
      />
      {(loading || error || message) && <p className="v5-admin-message">{loading ? 'Memuat data Supabase…' : error || message}</p>}
      <div className="v5-admin-layout">
        <main>
          <section className="v4-panel v5-admin-form">
            <header>
              <h2>Konten Halaman Tentang</h2>
              <span>Terbit</span>
            </header>
            <label>
              Deskripsi DPM
              <textarea value={about} onChange={(event) => { setAbout(event.target.value); setSaved(false); }} />
            </label>
            <label>
              Periode Aktif
              <select value={data.periods.find((item) => item.is_current)?.id ?? ''} disabled>
                {data.periods.map((item) => <option value={item.id} key={item.id}>{item.name}</option>)}
              </select>
            </label>
            <button onClick={() => void runAction('setting.save', { namespace:'site', key:'about', value:{ description:about }, isPublic:true }, 'Konten Tentang berhasil disimpan.')}>
              <Save /> Simpan Konten Tentang
            </button>
          </section>
          <section className="v4-panel">
            <header>
              <div>
                <h2>Struktur Organisasi</h2>
                <p>Susun jabatan, unit, nama pengurus, dan urutan tampil.</p>
              </div>
              <button className="primary" type="button" onClick={addMember}>
                <Plus /> Tambah Unit/Jabatan
              </button>
            </header>
            <div className="v6-structure-editor">
              {members.map((member) => (
                <article key={member.id}>
                  <div className="v6-member-photo">
                    <img src={member.image} alt={`Foto ${member.name}`} />
                    <label>
                      <Upload /> Ganti foto
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/webp"
                        onChange={(event) => {
                          const file = event.target.files?.[0];
                          if (file) {
                            if (file.size > 2_000_000) return alert('Foto maksimal 2 MB.');
                            const reader=new FileReader(); reader.onload=()=>updateMember(member.id,'image',String(reader.result)); reader.readAsDataURL(file);
                          }
                        }}
                      />
                    </label>
                  </div>
                  <div className="v6-member-fields">
                    <label>
                      Jabatan
                      <input
                        value={member.role}
                        onChange={(event) =>
                          updateMember(member.id, 'role', event.target.value)
                        }
                      />
                    </label>
                    <label>
                      Nama pengurus
                      <input
                        value={member.name}
                        onChange={(event) =>
                          updateMember(member.id, 'name', event.target.value)
                        }
                      />
                    </label>
                    <label>
                      Unit/Komisi
                      <input
                        value={member.unit}
                        onChange={(event) =>
                          updateMember(member.id, 'unit', event.target.value)
                        }
                      />
                    </label>
                  </div>
                  <button
                    className="v6-remove"
                    type="button"
                    onClick={() =>
                      setMembers((current) =>
                        current.filter((item) => item.id !== member.id),
                      )
                    }
                  >
                    Hapus
                  </button>
                </article>
              ))}
            </div>
            <footer className="v6-editor-footer">
              <p>
                {saved
                  ? 'Perubahan struktur tersimpan.'
                  : `${members.length} pengurus siap ditampilkan pada halaman Tentang.`}
              </p>
              <button
                className="primary"
                type="button"
                onClick={() => void runAction('setting.save', { namespace:'site', key:'organization_structure', value:members, isPublic:true }, 'Struktur organisasi berhasil disimpan.').then(() => setSaved(true))}
              >
                <Save /> Simpan Struktur
              </button>
            </footer>
          </section>
        </main>
        <aside>
          <section className="v4-panel">
            <header>
              <div>
                <h2>Permintaan Halaman ORMAWA</h2>
                <p>
                  Alur: meminta halaman → disetujui → ORMAWA edit & publish.
                </p>
              </div>
            </header>
            <div className="v5-admin-list">
              {data.organizations.map((x) => (
                <article key={x.id}>
                  <Building2 />
                  <span>
                    <b>{x.short_name ?? x.name}</b>
                    <small>{x.status === 'active' ? 'Halaman aktif' : x.status}</small>
                  </span>
                  <button onClick={() => location.assign(`/admin/cms?organization=${x.id}`)}>Kelola</button>
                </article>
              ))}
              {!data.organizations.length && <p className="v5-filter-empty">Belum ada ORMAWA pada database.</p>}
            </div>
          </section>
          <section className="v4-panel v5-admin-form">
            <header>
              <h2>Intervensi Pengelola</h2>
            </header>
            <p>
              Super Admin, Chairperson, dan Secretary dapat memperbarui halaman
              ORMAWA bila halaman tidak terurus atau melanggar kebijakan.
            </p>
            <label>
              Role pengelola
              <select>
                <option>ORMAWA</option>
              </select>
            </label>
            <label>
              <input type="checkbox" checked={ormawaPublish} onChange={(event) => { setOrmawaPublish(event.target.checked); void runAction('setting.save',{namespace:'organization',key:'ormawa_self_publish',value:event.target.checked,isPublic:false},'Kebijakan ORMAWA berhasil disimpan.'); }} /> ORMAWA dapat publish
              halaman sendiri setelah halaman disetujui
            </label>
          </section>
        </aside>
      </div>
    </div>
  );
}

export function PermissionAdmin() {
  const { data, loading, error, message, runAction, reload } = useAdminPortal();
  const roleKeys = ['super_admin', 'chairperson', 'secretary', 'dpm_unit', 'ormawa'];
  const roleNames = roleKeys.map((key) => data.roles.find((role) => role.key === key)?.name ?? key.replaceAll('_', ' '));
  return (
    <div className="v4-admin-content">
      <Title
        title="Permission"
        copy="Atur permission fleksibel untuk Super Admin, Chairperson, Secretary, Unit DPM, dan ORMAWA."
        action="Muat Ulang"
        onAction={() => void reload()}
      />
      {(loading || error || message) && <p className="v5-admin-message">{loading ? 'Memuat data Supabase…' : error || message}</p>}
      <section className="v4-panel v5-permission">
        <header>
          <div>
            <h2>Permission Matrix</h2>
            <p>Explicit deny selalu mengalahkan allow.</p>
          </div>
          <button className="primary" onClick={() => location.assign('/admin/iam')}>
            <Plus /> Tambah Permission
          </button>
        </header>
        <div>
          <b>Permission</b>
          {roleNames.map((x) => (
            <b key={x}>{x}</b>
          ))}
          {data.permissions.flatMap((permission) => [
            <span key={permission.key} title={permission.description}>
              <LockKeyhole />
              {permission.key}
            </span>,
            ...roleKeys.map((roleKey) => (
              <label key={permission.key + roleKey}>
                <input
                  type="checkbox"
                  checked={Boolean(permission.roles?.[roleKey])}
                  onChange={(event) => void runAction('permission.set', { permissionKey: permission.key, roleKey, allowed: event.target.checked }, 'Permission berhasil diperbarui.')}
                />
              </label>
            )),
          ])}
        </div>
      </section>
    </div>
  );
}

export function AuditAdmin() {
  const { data, loading, error } = useAdminPortal();
  const [query, setQuery] = useState('');
  const records = data.audit.filter((item) => `${item.actor_name ?? item.actor_type} ${item.action} ${item.target_type} ${item.result}`.toLowerCase().includes(query.toLowerCase()));
  const exportAudit = () => {
    const rows = [['Waktu','Aktor','Aksi','Target','Hasil','Alasan'], ...records.map((x) => [x.occurred_at,x.actor_name ?? x.actor_type,x.action,x.target_type,x.result,x.reason ?? ''])];
    const blob = new Blob([rows.map((row) => row.map((cell) => `"${String(cell).replaceAll('"','""')}"`).join(',')).join('\n')], { type: 'text/csv;charset=utf-8' });
    const link = document.createElement('a'); link.href=URL.createObjectURL(blob); link.download=`audit-${new Date().toISOString().slice(0,10)}.csv`; link.click(); URL.revokeObjectURL(link.href);
  };
  return (
    <div className="v4-admin-content">
      <Title
        title="Audit Log"
        copy="Riwayat append-only untuk perubahan akses, publikasi, D-DAS, aset, dan struktur organisasi."
        action="Ekspor Audit"
        onAction={exportAudit}
      />
      {(loading || error) && <p className="v5-admin-message">{loading ? 'Memuat data Supabase…' : error}</p>}
      <div className="v4-admin-stats">
        <Metric
          icon={History}
          label="Event 24 Jam"
          value={String(data.audit.filter((x) => Date.now() - new Date(x.occurred_at).getTime() <= 86400000).length)}
          note="Semua layanan"
        />
        <Metric
          icon={ShieldCheck}
          label="Integrity"
          value="Valid"
          note="Chain verified"
        />
        <Metric
          icon={LockKeyhole}
          label="Akses Ditolak"
          value={String(data.audit.filter((x) => x.result.toLowerCase().includes('den')).length)}
          note="Diblokir kebijakan"
        />
      </div>
      <section className="v4-panel">
        <header>
          <div>
            <h2>Aktivitas Sistem</h2>
            <p>Data sensitif dan secret tidak dicatat di audit.</p>
          </div>
          <label className="v5-audit-search">
            <Search />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Cari actor, aksi, atau target..." />
          </label>
        </header>
        <div className="v5-audit-list">
          {records.map((x) => (
            <article key={x.id}>
              <span className={x.result.toLowerCase().includes('den') ? 'deny' : 'ok'}>{x.result}</span>
              <div>
                <b>{x.action}</b>
                <small>{x.actor_name ?? x.actor_type} · {x.target_type}</small>
              </div>
              <time>{new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(x.occurred_at))}</time>
              <button onClick={() => alert(x.reason || 'Tidak ada detail tambahan yang aman ditampilkan.')}>Detail</button>
            </article>
          ))}
          {!records.length && <p className="v5-filter-empty">Tidak ada event audit yang sesuai.</p>}
        </div>
      </section>
    </div>
  );
}
