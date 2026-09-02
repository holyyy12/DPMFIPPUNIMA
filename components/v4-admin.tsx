'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import {
  Activity,
  Bell,
  CalendarDays,
  Check,
  ChevronRight,
  CircleGauge,
  Clock,
  FilePenLine,
  Image,
  Inbox,
  LockKeyhole,
  MessageSquare,
  Plus,
  Save,
  Search,
  Send,
  ShieldCheck,
  Trash2,
  Upload,
  UserPlus,
  Users,
} from 'lucide-react';
import { useAdminPortal } from './use-admin-portal';

function PageTitle({
  title,
  copy,
  actions,
}: {
  title: string;
  copy: string;
  actions?: React.ReactNode;
}) {
  return (
    <header className="v4-admin-title">
      <div>
        <h1>{title}</h1>
        <p>{copy}</p>
      </div>
      {actions && <div>{actions}</div>}
    </header>
  );
}
function Badge({ children }: { children: React.ReactNode }) {
  return <span className="v4-badge">{children}</span>;
}

export function AdminDashboardV4() {
  const { data, loading, error } = useAdminPortal();
  const [dashboardUnit, setDashboardUnit] = useState('Semua');
  const [dashboardPeriod, setDashboardPeriod] = useState('Semua');
  const currentPeriod = data.periods.find((item) => item.is_current);
  const statusLabel: Record<string, string> = { received: 'Masuk', triaged: 'Ditinjau', assigned: 'Diteruskan', in_progress: 'Ditindaklanjuti', waiting_for_information: 'Ditindaklanjuti', resolved: 'Selesai', closed: 'Selesai', rejected_out_of_scope: 'Selesai', reopened: 'Masuk' };
  const liveCases = data.ddasCases.map((item) => [
    item.ticket_public_id,
    item.subject,
    item.priority,
    statusLabel[item.status] ?? item.status,
    item.assigned_unit ?? 'Belum ditugaskan',
    new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(item.submitted_at)),
  ]);
  const liveStats = [
    ['Periode Aktif', currentPeriod?.name ?? 'Belum diatur', 'Tahun Akademik'],
    ['Organisasi Aktif', String(data.organizations.filter((x) => x.status === 'active').length), 'Organisasi terdaftar'],
    ['Total Aspirasi', String(data.ddasCases.length), 'Data Supabase'],
    ['Publikasi Aktif', String(data.contents.filter((x) => x.status === 'published').length), 'Berita & informasi'],
    ['Pengguna', String(data.users.filter((x) => x.status === 'active').length), 'Pengguna aktif'],
    ['Komentar Hari Ini', String(data.comments.filter((x) => new Date(x.created_at).toDateString() === new Date().toDateString()).length), 'Komentar baru'],
  ];
  const dashboardCases = useMemo(
    () =>
      liveCases.filter(
        (item) =>
          (dashboardUnit === 'Semua' || item[4] === dashboardUnit) &&
          (dashboardPeriod === 'Semua' || item[5].startsWith(dashboardPeriod)),
      ),
    [dashboardUnit, dashboardPeriod, liveCases],
  );
  const workflowStatuses = [
    'Masuk',
    'Ditinjau',
    'Diteruskan',
    'Ditindaklanjuti',
    'Selesai',
  ];
  const dashboardDates = [...new Set(liveCases.map((item) => item[5].split(',')[0]))];
  return (
    <div className="v4-admin-content">
      <PageTitle
        title="Dashboard"
        copy="Kelola dan pantau aktivitas DPM FIPP UNIMA secara menyeluruh."
      />
      {(loading || error) && <p className="v5-admin-message">{loading ? 'Memuat data Supabase…' : error}</p>}
      <div className="v4-admin-stats">
        {liveStats.map(([a, b, c], i) => (
          <article key={a}>
            <span>
              {i === 0 ? (
                <CalendarDays />
              ) : i === 1 ? (
                <Users />
              ) : i === 2 ? (
                <MessageSquare />
              ) : i === 3 ? (
                <FilePenLine />
              ) : i === 4 ? (
                <Users />
              ) : (
                <Bell />
              )}
            </span>
            <p>{a}</p>
            <strong>{b}</strong>
            <small>{c}</small>
          </article>
        ))}
      </div>
      <section className="v4-panel v4-monitor">
        <header>
          <div>
            <h2>Monitoring D-DAS</h2>
            <p>Ringkasan status aspirasi dalam sistem D-DAS.</p>
          </div>
          <select
            value={dashboardUnit}
            onChange={(event) => setDashboardUnit(event.target.value)}
            aria-label="Saring unit penanggung jawab"
          >
            <option value="Semua">Semua Unit</option>
            {[...new Set(liveCases.map((item) => item[4]))].map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
          <select
            value={dashboardPeriod}
            onChange={(event) => setDashboardPeriod(event.target.value)}
            aria-label="Saring tanggal aspirasi"
          >
            <option value="Semua">Semua Tanggal</option>
            {dashboardDates.map((date) => <option value={date} key={date}>{date}</option>)}
          </select>
        </header>
        <div>
          {workflowStatuses.map((status) => {
            const count = dashboardCases.filter(
              (item) => item[3] === status,
            ).length;
            const percentage = dashboardCases.length
              ? Math.round((count / dashboardCases.length) * 100)
              : 0;
            return (
              <article key={status}>
                <Badge>{status}</Badge>
                <strong>{count}</strong>
                <small>{percentage}% dari hasil filter</small>
                <i />
              </article>
            );
          })}
        </div>
      </section>
      <div className="v4-dashboard-grid v9-dashboard-single">
        <section className="v4-panel">
          <header>
            <div>
              <h2>Aspirasi Terbaru & Perlu Perhatian</h2>
              <p>Daftar aspirasi terbaru dan yang membutuhkan perhatian.</p>
            </div>
            <Link href="/admin/ddas">
              Lihat Semua <ChevronRight />
            </Link>
          </header>
          <div className="v4-table">
            <div>
              <b>No. Tiket</b>
              <b>Kategori</b>
              <b>Prioritas</b>
              <b>Status</b>
              <b>Unit Penanggung Jawab</b>
              <b>Dibuat Pada</b>
            </div>
            {dashboardCases.map((r) => (
              <Link href="/admin/ddas" key={r[0]}>
                {r.map((x, i) => (
                  <span key={x}>
                    {i === 1 || i === 2 || i === 3 ? <Badge>{x}</Badge> : x}
                  </span>
                ))}
              </Link>
            ))}
            {!dashboardCases.length && (
              <p className="v5-filter-empty">
                Tidak ada aspirasi yang sesuai dengan filter.
              </p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

export function CmsEditorV4() {
  const { data, loading, error, message, runAction } = useAdminPortal();
  const [selectedId, setSelectedId] = useState('');
  const selected = data.contents.find((item) => item.id === selectedId);
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [summary, setSummary] = useState('');
  const [bodyText, setBodyText] = useState('');
  const [contentTypeId, setContentTypeId] = useState('');
  const [language, setLanguage] = useState('id');
  const [fileName, setFileName] = useState('Belum ada media dipilih');
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const wanted = params.get('id');
    const requestedType = params.get('type');
    if (wanted) setSelectedId(wanted);
    if (!wanted && requestedType) {
      const match = data.contentTypes.find((item) => item.key === requestedType);
      if (match) setContentTypeId(match.id);
    }
  }, [data.contentTypes]);
  useEffect(() => {
    if (!selected) return;
    setTitle(selected.title); setSlug(selected.slug); setSummary(selected.summary); setContentTypeId(selected.content_type_id ?? '');
    setBodyText(typeof selected.body === 'string' ? selected.body : JSON.stringify(selected.body));
  }, [selected?.id]);
  const save = (status: 'draft' | 'scheduled' | 'published') => {
    if (!title.trim() || !slug.trim()) return alert('Judul dan slug wajib diisi.');
    if (!contentTypeId) return alert('Tipe konten wajib dipilih.');
    return runAction('content.save', { id: selected?.id ?? '', title: title.trim(), slug: slug.trim(), summary: summary.trim(), body: { schemaVersion: 1, blocks: [{ type: 'paragraph', text: bodyText }] }, status, contentTypeId, unitId: selected?.unit_id ?? data.units[0]?.id ?? '', language, visibility: 'public' }, status === 'published' ? 'Konten berhasil dipublikasikan.' : status === 'scheduled' ? 'Konten berhasil dijadwalkan.' : 'Draft berhasil disimpan.');
  };
  const exportContent = () => { const blob=new Blob([JSON.stringify({ title,slug,summary,body:bodyText },null,2)],{type:'application/json'}); const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=`${slug || 'konten'}.json`;a.click();URL.revokeObjectURL(a.href); };
  return (
    <div className="v4-admin-content">
      <PageTitle
        title="Editor Konten & Media"
        copy="Kelola konten Berita, Kajian, Publikasi, Media, Program Kerja, dan lainnya tanpa coding."
        actions={
          <>
            <button onClick={() => void save('draft')}>
              <Save /> Simpan Draft
            </button>
            <button onClick={() => {
              if (!selected) return alert('Simpan konten terlebih dahulu untuk melihat pratinjau.');
              const key = data.contentTypes.find((item) => item.id === selected.content_type_id)?.key;
              const href = key === 'program' ? `/program/${selected.slug}` : key === 'd-trace' ? '/d-trace' : key === 'd-dar' ? '/d-dar' : `/berita/${selected.slug}`;
              window.open(href, '_blank', 'noopener,noreferrer');
            }}>◉ Preview</button>
            <button onClick={() => void save('scheduled')}>
              <CalendarDays /> Jadwalkan
            </button>
            <button className="primary" onClick={() => void save('published')}>Publikasikan⌄</button>
          </>
        }
      />
      {(loading || error || message) && <p className="v5-admin-message">{loading ? 'Memuat data Supabase…' : error || message}</p>}
      <div className="v4-editor-grid">
        <section className="v4-panel v4-editor">
          <h2>Informasi Konten</h2>
          <div className="v4-form-two">
            <label>
              Judul *
              <input value={title} onChange={(event) => { setTitle(event.target.value); if (!selected) setSlug(event.target.value.toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')); }} />
            </label>
            <label>
              Slug *
              <input value={slug} onChange={(event) => setSlug(event.target.value)} />
            </label>
          </div>
          <label>
            Ringkasan / Excerpt *
            <textarea value={summary} onChange={(event) => setSummary(event.target.value)} />
          </label>
          <div className="v4-form-four">
            <label>
              Tipe Konten
              <select value={contentTypeId} onChange={(event) => setContentTypeId(event.target.value)}>
                <option value="">Pilih tipe</option>{data.contentTypes.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
              </select>
            </label>
            <label>
              Kategori
              <select>
                <option>Pendidikan</option>
              </select>
            </label>
            <label>
              Penulis
              <select value={data.me?.id ?? ''} disabled>
                <option value={data.me?.id}>{data.me?.name ?? 'Administrator'}</option>
              </select>
            </label>
            <label>
              Bahasa
              <select value={language} onChange={(event) => setLanguage(event.target.value)}>
                <option value="id">Bahasa Indonesia</option><option value="en">English</option>
              </select>
            </label>
          </div>
          <label>
            Body / Isi Konten *
            <div className="v4-rich-toolbar">
              Paragraph　 <b>B</b>　<i>I</i>　<u>U</u>　☷　☰　🔗　▧
            </div>
            <div
              className="v4-rich-body"
              contentEditable
              suppressContentEditableWarning
              onInput={(event) => setBodyText(event.currentTarget.innerText)}
            >
              {bodyText}
            </div>
          </label>
          <label>
            Tags
            <input defaultValue="literasi digital　×　 AI　×　 mahasiswa　×　 pendidikan　×" />
          </label>
        </section>
        <section className="v4-panel v4-media-editor">
          <h2>Media</h2>
          <label>Gambar Unggulan (Featured Image)</label>
          <div className="v4-featured">
            <Image />
            <span>
              {fileName}
              <small>{fileName === 'Belum ada media dipilih' ? 'Pilih media dari perangkat Anda.' : 'Media dipilih dan siap diunggah melalui pustaka Media.'}</small>
            </span>
          </div>
          <h3>Gambar Dalam Konten / Galeri</h3>
          <div className="v4-editor-images">
            {data.media.slice(0, 6).map((item, index) => (
              <span key={item.id} title={item.original_filename}>{index + 1}</span>
            ))}
            {!data.media.length && <small>Belum ada media pada database.</small>}
          </div>
          <input id="cms-media-file" type="file" accept="image/*,video/*,audio/*,.pdf,.doc,.docx" hidden onChange={(event) => setFileName(event.target.files?.[0]?.name ?? 'Belum ada media dipilih')} />
          <button onClick={() => document.getElementById('cms-media-file')?.click()}>
            <Upload /> Tambah Gambar
          </button>
          <label>
            Alt Text
            <input defaultValue="Mahasiswa berdiskusi tentang literasi digital" />
          </label>
          <label>
            Caption
            <textarea defaultValue="Diskusi kelompok membahas pentingnya literasi digital dalam pembelajaran." />
          </label>
        </section>
        <aside>
          <section className="v4-panel v4-preview">
            <h2>Pratinjau Konten</h2>
            <Badge>{data.contentTypes.find((item) => item.id === contentTypeId)?.name?.toUpperCase() ?? 'TIPE BELUM DIPILIH'}</Badge>
            <h3>{title || 'Judul konten'}</h3>
            <p>{summary || 'Ringkasan konten akan tampil di sini.'}</p>
            <small>{data.me?.name ?? 'Administrator'}　　{fileName}</small>
          </section>
          <section className="v4-panel">
            <h2>Revisi & Riwayat</h2>
            {selected ? <p>●　{selected.status}<small>　{new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(selected.updated_at))}</small></p> : <p>Belum ada revisi untuk konten baru.</p>}
          </section>
          <section className="v4-panel v4-danger">
            <h2>Aksi Lanjutan</h2>
            <button onClick={() => { setSelectedId(''); setTitle(`${title} (Salinan)`); setSlug(`${slug}-salinan`); }}>Duplikasi Konten</button>
            <button onClick={exportContent}>Ekspor Konten</button>
            <button onClick={() => selected && location.reload()}>Rollback ke Data Tersimpan</button>
            <button disabled={!selected} onClick={() => selected && confirm('Hapus konten ini?') && void runAction('content.delete', { id: selected.id }, 'Konten berhasil dihapus.').then(() => { setSelectedId(''); setTitle(''); setSlug(''); setSummary(''); setBodyText(''); })}>
              <Trash2 /> Hapus Konten
            </button>
          </section>
        </aside>
      </div>
    </div>
  );
}

export function DdasCaseV4() {
  const { data, loading, error, message, runAction } = useAdminPortal();
  const current = data.ddasCases[0];
  const [publicUpdate, setPublicUpdate] = useState('');
  const [internalNote, setInternalNote] = useState('');
  const caseAudit = data.audit.filter((item) => item.target_id === current?.id);
  const timeline = [
    'Masuk',
    'Ditinjau',
    'Diteruskan',
    'Ditindaklanjuti',
    'Selesai',
  ];
  return (
    <div className="v4-admin-content">
      <PageTitle
        title="Detail Kasus D-DAS"
        copy={current ? `Nomor tiket ${current.ticket_public_id} · data publik telah disanitasi.` : 'Belum ada kasus D-DAS pada database.'}
        actions={<button onClick={() => location.assign('/admin/dashboard')}>← Kembali</button>}
      />
      {(loading || error || message) && <p className="v5-admin-message">{loading ? 'Memuat data Supabase…' : error || message}</p>}
      <div className="v4-case-summary">
        {[
          ['No. Tiket', current?.ticket_public_id ?? '—'],
          ['Kategori', current?.subject ?? '—'],
          ['Prioritas', current?.priority ?? '—'],
          ['Unit Penanggung Jawab', current?.assigned_unit ?? 'Belum ditugaskan'],
          ['Status Saat Ini', current?.status ?? '—'],
          ['SLA Respon', current?.submitted_at ? `${Math.max(0, Math.round((Date.now() - new Date(current.submitted_at).getTime()) / 86400000 * 10) / 10)} hari` : '—'],
        ].map((x) => (
          <span key={x[0]}>
            <small>{x[0]}</small>
            <b>{x[1]}</b>
          </span>
        ))}
      </div>
      <div className="v4-case-grid">
        <aside>
          <section className="v4-panel">
            <h2>Ringkasan Aspirasi (Publik)</h2>
            <p>{current?.subject ?? 'Belum ada ringkasan aspirasi.'}</p>
          <div className="v4-mini-grid">
              <span>
                Dibuat oleh<b>Pengguna (Disamarkan)</b>
              </span>
              <span>
                Periode<b>{data.periods.find((item) => item.is_current)?.name ?? 'Belum diatur'}</b>
              </span>
              <span>
                Lokasi<b>Tidak dicatat pada ringkasan publik</b>
              </span>
              <span>
                Lampiran Publik<b>Tidak ada data lampiran publik</b>
              </span>
            </div>
          </section>
          <section className="v4-panel v4-timeline">
            <h2>Timeline Publik (Sanitized)</h2>
            {(current?.timeline.length ? current.timeline : timeline.map((state) => ({ state, message: 'Menunggu proses', occurredAt: '' }))).map((item, i) => (
              <p key={`${item.state}-${i}`} className={item.occurredAt ? 'done' : ''}>
                <Check />
                <span>
                  <b>{item.state}</b>
                  <small>{item.occurredAt ? new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(item.occurredAt)) : item.message}</small>
                </span>
              </p>
            ))}
          </section>
        </aside>
        <main>
          <section className="v4-panel">
            <nav className="v4-case-tabs">
              <b>🔒 Catatan Internal</b>
              <span>📎 Lampiran Internal</span>
              <span>Penugasan Unit</span>
            </nav>
            <textarea value={internalNote} onChange={(event) => setInternalNote(event.target.value)} placeholder="Tulis catatan internal (tidak akan ditampilkan ke publik)..." />
            <button className="primary" disabled={!current || !internalNote.trim()} onClick={() => current && void runAction('ddas.internal_note', { id: current.id, message: internalNote.trim() }, 'Catatan internal berhasil disimpan.').then(() => setInternalNote(''))}>
              <LockKeyhole /> Simpan Catatan
            </button>
          </section>
          <section className="v4-panel">
            <h2>Pesan Pembaruan Publik</h2>
            <textarea value={publicUpdate} onChange={(event) => setPublicUpdate(event.target.value)} placeholder="Tulis pembaruan untuk diinformasikan kepada pelapor..." />
            <button className="primary" disabled={!current || !publicUpdate.trim()} onClick={() => current && void runAction('ddas.public_update', { id: current.id, message: publicUpdate.trim() }, 'Pembaruan publik berhasil dikirim.').then(() => setPublicUpdate(''))}>
              <Send /> Kirim Pembaruan
            </button>
          </section>
          <section className="v4-panel">
            <h2>Ubah Status Workflow</h2>
            <div className="v4-status-buttons">
              {timeline.map((x, index) => {
                const status = ['received','triaged','assigned','in_progress','resolved'][index];
                return <button key={x} disabled={!current} onClick={() => current && void runAction('ddas.status', { id: current.id, status, message: `Status aspirasi diperbarui menjadi ${x}.` }, 'Status workflow berhasil diperbarui.')}>{x}</button>
              })}
            </div>
            <p className="v4-blue-note">
              <b>Status saat ini: {current?.status ?? '—'}</b>
              <br />
              Aspirasi baru diterima dan sedang dalam antrean peninjauan.
            </p>
          </section>
        </main>
        <aside>
          <section className="v4-panel">
            <h2>Log Aktor</h2>
            {caseAudit.map((item) => (
              <p key={item.id}>
                <b>{item.actor_name ?? item.actor_type}</b>
                <small>{item.action} · {new Intl.DateTimeFormat('id-ID', { dateStyle:'medium', timeStyle:'short' }).format(new Date(item.occurred_at))}</small>
              </p>
            ))}
            {!caseAudit.length && <p className="v5-filter-empty">Belum ada event audit untuk kasus ini.</p>}
          </section>
          <section className="v4-panel">
            <h2>Aktivitas Terbaru</h2>
            {current?.timeline.slice(-3).reverse().map((item) => <p key={`${item.state}-${item.occurredAt}`}>● {item.message}</p>)}
            {!current?.timeline.length && <p>Belum ada aktivitas.</p>}
          </section>
          <section className="v4-panel">
            <h2>Metadata Kasus</h2>
            <p>ID Internal　{current?.id ?? '—'}</p>
            <p>Sumber　Web Portal D-DAS</p>
            <p>Perangkat　Tidak disimpan pada snapshot admin</p>
            <p>Klasifikasi　Publik (Tersanitasi)</p>
          </section>
        </aside>
      </div>
    </div>
  );
}

export function CommentsV4() {
  const { data, loading, error, reload } = useAdminPortal();
  const comments = data.comments.map((item) => ({ id: item.id, threadId:item.thread_id, parentId:item.parent_id, author: item.display_mode === 'anonymous' ? 'Anonim' : item.display_name || 'Pengguna', status: item.status === 'pending' ? 'Perlu Penyaringan' : item.status === 'published' ? 'Dipublikasikan' : item.status === 'rejected' ? 'Ditolak' : item.status, body: item.body, source: item.resource_type === 'page' ? 'Beranda' : item.resource_type, date: new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium' }).format(new Date(item.created_at)), createdAt:item.created_at }));
  const [source, setSource] = useState('Semua');
  const [status, setStatus] = useState('Semua');
  const [sort, setSort] = useState('Terbaru');
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState(0);
  const filtered = useMemo(
    () =>
      comments.filter(
        (item) =>
          (source === 'Semua' || item.source === source) &&
          (status === 'Semua' || item.status === status) &&
          `${item.author} ${item.body}`
            .toLowerCase()
            .includes(query.toLowerCase()),
      ).sort((a, b) => sort === 'Terlama' ? a.date.localeCompare(b.date) : b.date.localeCompare(a.date)),
    [comments, source, status, query, sort],
  );
  const active = filtered[selected] ?? filtered[0] ?? { id: '', threadId:'', parentId:undefined, author: '—', status: 'Kosong', body: 'Belum ada komentar pada database.', source: '—', date: '—', createdAt:'' };
  const replies=comments.filter((item)=>item.threadId===active.threadId&&item.parentId===active.id);
  async function moderate(status: 'published' | 'hidden' | 'rejected', reasonCode: 'approved' | 'other') {
    if (!active.id) return;
    const response = await fetch('/api/admin/comments', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ commentId: active.id, status, reasonCode }) });
    if (!response.ok) return alert('Keputusan penyaringan gagal disimpan.');
    await reload();
  }
  return (
    <div className="v4-admin-content">
      <PageTitle
        title="Komentar & Penyaringan"
        copy="Tinjau, saring, dan kelola semua komentar dari Beranda, Berita, dan halaman lainnya."
      />
      {(loading || error) && <p className="v5-admin-message">{loading ? 'Memuat data Supabase…' : error}</p>}
      <div className="v4-comment-stats">
        {[
          ['Total Komentar', String(comments.length)],
          ['Perlu Penyaringan', String(comments.filter((x) => x.status === 'Perlu Penyaringan').length)],
          ['Anonim', String(comments.filter((x) => x.author === 'Anonim').length)],
          ['Ditolak', String(comments.filter((x) => x.status === 'Ditolak').length)],
        ].map((x) => (
          <article key={x[0]}>
            <MessageSquare />
            <span>
              {x[0]}
              <b>{x[1]}</b>
            </span>
          </article>
        ))}
      </div>
      <div className="v4-comment-filters">
        <select
          value={source}
          onChange={(event) => {
            setSource(event.target.value);
            setSelected(0);
          }}
          aria-label="Saring berdasarkan sumber"
        >
          <option value="Semua">Semua Sumber</option>
          {[...new Set(comments.map((item) => item.source))].map((item) => <option key={item}>{item}</option>)}
        </select>
        <select
          value={status}
          onChange={(event) => {
            setStatus(event.target.value);
            setSelected(0);
          }}
          aria-label="Saring berdasarkan status"
        >
          <option value="Semua">Semua Status</option>
          <option value="Perlu Penyaringan">Perlu Penyaringan</option>
          <option value="Dipublikasikan">Dipublikasikan</option>
          <option value="Ditolak">Ditolak</option>
        </select>
        <select value={sort} onChange={(event) => setSort(event.target.value)}>
          <option>Terbaru</option><option>Terlama</option>
        </select>
        <label>
          <input
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setSelected(0);
            }}
            placeholder="Cari komentar atau pengguna..."
          />
          <Search />
        </label>
        <button
          type="button"
          onClick={() => {
            setSource('Semua');
            setStatus('Semua');
            setQuery('');
            setSelected(0);
          }}
        >
          Reset Filter
        </button>
      </div>
      <div className="v4-comments-grid">
        <section className="v4-panel">
          <h2>Daftar Komentar</h2>
          {filtered.map((item, i) => (
            <article
              className={`v4-comment-row ${active.body === item.body ? 'selected' : ''}`}
              key={item.body}
              onClick={() => setSelected(i)}
            >
              <input
                type="checkbox"
                aria-label={`Pilih komentar ${item.author}`}
                onClick={(event) => event.stopPropagation()}
              />
              <span>{item.author.slice(0, 2)}</span>
              <div>
                <p>
                  <Badge>{item.status}</Badge>　<b>{item.body}</b>
                </p>
                <small>
                  {item.source === 'Berita'
                    ? 'Berita: Seminar Nasional Pendidikan'
                    : 'Beranda'}
                  　　💬 {i}
                </small>
              </div>
              <time>{item.date}</time>
            </article>
          ))}
          {!filtered.length && (
            <p className="v5-filter-empty">
              Tidak ada komentar yang sesuai dengan filter.
            </p>
          )}
        </section>
        <section className="v4-panel v4-thread">
          <h2>
            Pratinjau Utas　<Badge>{active.status}</Badge>
          </h2>
          <article>
            <b>😎　{active.author}</b>
            <small>{active.date}</small>
            <p>{active.body}</p>
          </article>
          <p>{replies.length} balasan</p>
          {replies.map((reply) => (
            <article className="reply" key={reply.id}>
              <b>{reply.author}</b>
              <small>{reply.date}</small>
              <p>{reply.body}</p>
            </article>
          ))}
          <footer>
            <button onClick={() => void moderate('hidden', 'other')}>
              <Trash2 /> Hapus Thread
            </button>
            <button onClick={() => active.id && location.assign(`/admin/comments?comment=${active.id}`)}>Lihat Thread Lengkap</button>
            <button className="primary" onClick={() => void moderate('published', 'approved')}>
              <ShieldCheck /> Saring Komentar
            </button>
          </footer>
        </section>
      </div>
    </div>
  );
}

export function IamV4() {
  const { data, loading, error } = useAdminPortal();
  const users = data.users.map((user) => {
    const role = user.roles[0];
    const unit = data.units.find((item) => item.id === role?.unitId);
    return [user.display_name, unit?.name ?? 'Semua Unit', role?.name ?? 'Tanpa Role', user.status === 'active' ? 'Aktif' : user.status, user.email_normalized ?? '', user.last_active_at ?? ''];
  });
  const [userQuery, setUserQuery] = useState('');
  const [unitFilter, setUnitFilter] = useState('Semua');
  const [roleFilter, setRoleFilter] = useState('Semua');
  const [statusFilter, setStatusFilter] = useState('Semua');
  const filteredUsers = useMemo(
    () =>
      users.filter(
        (user) =>
          (unitFilter === 'Semua' || user[1] === unitFilter) &&
          (roleFilter === 'Semua' || user[2] === roleFilter) &&
          (statusFilter === 'Semua' || user[3] === statusFilter) &&
          `${user[0]} ${user[1]} ${user[2]}`
            .toLowerCase()
            .includes(userQuery.toLowerCase()),
      ),
    [userQuery, unitFilter, roleFilter, statusFilter],
  );
  return (
    <div className="v4-admin-content">
      <PageTitle
        title="Pengguna, Role, Permission & DPM Units"
        copy="Kelola akun pengguna, role, izin akses, dan unit DPM secara terpusat dan aman."
      />
      {(loading || error) && <p className="v5-admin-message">{loading ? 'Memuat data Supabase…' : error}</p>}
      <div className="v5-role-note">
        <ShieldCheck />
        <p>
          <b>Role ORMAWA menggantikan Viewer</b>
          <span>
            Setelah permintaan halaman disetujui, ORMAWA dapat mengelola dan
            menerbitkan halaman organisasinya sendiri. Super Admin, Chairperson,
            dan Secretary tetap dapat melakukan intervensi.
          </span>
        </p>
      </div>
      <nav className="v4-iam-tabs">
        {[
          'Ringkasan',
          'Pengguna',
          'Role',
          'Permission Matrix',
          'DPM Units',
          'Akses per Unit',
        ].map((x, i) => (
          <button className={i === 1 ? 'active' : ''} key={x} onClick={() => location.assign(x === 'Permission Matrix' ? '/admin/permission' : `#${x.toLowerCase().replaceAll(' ', '-')}`)}>
            {x}
          </button>
        ))}
      </nav>
      <div className="v4-iam-grid">
        <section className="v4-panel">
          <header>
            <div>
              <h2>Daftar Pengguna</h2>
              <p>Kelola akun pengguna dan penetapan role berdasarkan unit.</p>
            </div>
            <button className="primary" onClick={() => location.assign('/admin/settings?tab=users')}>
              <Plus /> Tambah Pengguna
            </button>
          </header>
          <div className="v4-iam-filters">
            <input
              value={userQuery}
              onChange={(event) => setUserQuery(event.target.value)}
              placeholder="Cari nama, email, atau unit..."
            />
            <select
              value={unitFilter}
              onChange={(event) => setUnitFilter(event.target.value)}
            >
              <option value="Semua">Semua Unit</option>
              {[...new Set(users.map((user) => user[1]))].map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
            <select
              value={roleFilter}
              onChange={(event) => setRoleFilter(event.target.value)}
            >
              <option value="Semua">Semua Role</option>
              {[...new Set(users.map((user) => user[2]))].map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
            >
              <option value="Semua">Semua Status</option>
              {[...new Set(users.map((user) => user[3]))].map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </div>
          <div className="v4-table v4-users-table">
            <div>
              <b>Nama</b>
              <b>Unit</b>
              <b>Role</b>
              <b>Status</b>
              <b>Terakhir Aktif</b>
            </div>
            {filteredUsers.map((u, i) => (
              <p key={u[0]}>
                <span>
                  <b>{u[0]}</b>
                  <small>{u[4]}</small>
                </span>
                <span>
                  <Badge>{u[1]}</Badge>
                </span>
                <span>
                  <Badge>{u[2]}</Badge>
                </span>
                <span>
                  <Badge>{u[3]}</Badge>
                </span>
                <span>{u[5] ? new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium' }).format(new Date(u[5])) : 'Belum pernah'}</span>
              </p>
            ))}
            {!filteredUsers.length && (
              <p className="v5-filter-empty">
                Tidak ada pengguna yang sesuai dengan filter.
              </p>
            )}
          </div>
        </section>
        <aside>
          <section className="v4-panel">
            <header>
              <h2>DPM Units</h2>
              <button className="primary" onClick={() => location.assign('/admin/settings?tab=units')}>
                <Plus /> Tambah Unit
              </button>
            </header>
            {data.units.map((x) => (
              <p className="v4-unit-row" key={x.id}>
                <b>{x.name}</b>
                <span>{x.code}</span>
                <span>{data.users.filter((user) => user.roles.some((role) => role.unitId === x.id)).length}</span>
                <button onClick={() => location.assign(`/admin/settings?tab=units&id=${x.id}`)}>✎</button>
              </p>
            ))}
          </section>
          <div className="v4-security-note">
            <ShieldCheck />
            <p>
              <b>Kelola Unit Tanpa Coding</b>
              <small>Super Admin dapat menambah unit baru kapan saja.</small>
            </p>
          </div>
        </aside>
      </div>
      <section className="v4-panel v4-permission">
        <h2>Permission Matrix</h2>
        <div className="v4-permission-grid">
          <b>Permission</b>
          {['super_admin','chairperson','secretary','dpm_unit','ormawa'].map((key) => (
            <b key={key}>{data.roles.find((role) => role.key === key)?.name ?? key}</b>
          ))}
          {data.permissions.slice(0, 8).flatMap((permission) => [
            <span key={permission.key}>{permission.key}</span>,
            ...['super_admin','chairperson','secretary','dpm_unit','ormawa'].map((roleKey) => (
              <i key={permission.key + roleKey}>{permission.roles?.[roleKey] ? '✓' : '□'}</i>
            )),
          ])}
        </div>
      </section>
    </div>
  );
}
