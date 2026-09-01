'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
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

const cases = [
  [
    'DAS-2026-0005',
    'Akademik',
    'Tinggi',
    'Masuk',
    'BEM Fakultas',
    '20 Mei 2026 10:23',
  ],
  [
    'DAS-2026-0004',
    'Sarana & Prasarana',
    'Sedang',
    'Ditinjau',
    'Wakil Dekan II',
    '19 Mei 2026 14:18',
  ],
  [
    'DAS-2026-0003',
    'Kemahasiswaan',
    'Tinggi',
    'Ditindaklanjuti',
    'BEM Fakultas',
    '18 Mei 2026 09:31',
  ],
  [
    'DAS-2026-0002',
    'Akademik',
    'Rendah',
    'Selesai',
    'Wakil Dekan I',
    '17 Mei 2026 16:05',
  ],
  [
    'DAS-2026-0001',
    'Keuangan',
    'Sedang',
    'Diteruskan',
    'Bagian Keuangan',
    '16 Mei 2026 11:47',
  ],
];
const stats = [
  ['Periode Aktif', '2026–2027', 'Tahun Akademik'],
  ['Organisasi Aktif', '13', 'Organisasi terdaftar'],
  ['Total Aspirasi', '5', 'Sejak periode ini'],
  ['Publikasi Aktif', '24', 'Berita & informasi'],
  ['Pengguna', '21', 'Pengguna aktif'],
  ['Komentar Hari Ini', '8', 'Komentar baru'],
];
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
  const [dashboardUnit, setDashboardUnit] = useState('Semua');
  const [dashboardPeriod, setDashboardPeriod] = useState('Semua');
  const dashboardCases = useMemo(
    () =>
      cases.filter(
        (item) =>
          (dashboardUnit === 'Semua' || item[4] === dashboardUnit) &&
          (dashboardPeriod === 'Semua' || item[5].startsWith(dashboardPeriod)),
      ),
    [dashboardUnit, dashboardPeriod],
  );
  const workflowStatuses = [
    'Masuk',
    'Ditinjau',
    'Diteruskan',
    'Ditindaklanjuti',
    'Selesai',
  ];
  return (
    <div className="v4-admin-content">
      <PageTitle
        title="Dashboard"
        copy="Kelola dan pantau aktivitas DPM FIPP UNIMA secara menyeluruh."
      />
      <div className="v4-admin-stats">
        {stats.map(([a, b, c], i) => (
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
            {[...new Set(cases.map((item) => item[4]))].map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
          <select
            value={dashboardPeriod}
            onChange={(event) => setDashboardPeriod(event.target.value)}
            aria-label="Saring tanggal aspirasi"
          >
            <option value="Semua">Semua Tanggal</option>
            <option value="20 Mei">20 Mei 2026</option>
            <option value="19 Mei">19 Mei 2026</option>
            <option value="18 Mei">18 Mei 2026</option>
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
      <div className="v4-dashboard-grid">
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
        <aside>
          <section className="v4-panel v4-quick">
            <h2>Aksi Cepat</h2>
            <div>
              {[
                ['Buat Aspirasi', Send],
                ['Buat Publikasi', FilePenLine],
                ['Tambah Pengguna', UserPlus],
                ['Kelola Organisasi', Users],
                ['Kelola Notifikasi', Bell],
                ['Lihat Laporan', Activity],
              ].map(([x, I]) => {
                const Icon = I as typeof Send;
                return (
                  <button key={x as string}>
                    <Icon />
                    {x as string}
                  </button>
                );
              })}
            </div>
          </section>
          <section className="v4-panel">
            <h2>Ringkasan Workflow</h2>
            <div className="v4-workflow">
              <span>
                <small>Rata-rata Waktu Respon</small>
                <b>1,8 hari</b>
              </span>
              <span>
                <small>Tingkat Penyelesaian</small>
                <b>60%</b>
              </span>
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}

export function CmsEditorV4() {
  return (
    <div className="v4-admin-content">
      <PageTitle
        title="Editor Konten & Media"
        copy="Kelola konten Berita, Kajian, Publikasi, Media, Program Kerja, dan lainnya tanpa coding."
        actions={
          <>
            <button>
              <Save /> Simpan Draft
            </button>
            <button>◉ Preview</button>
            <button>
              <CalendarDays /> Jadwalkan
            </button>
            <button className="primary">Publikasikan⌄</button>
          </>
        }
      />
      <div className="v4-editor-grid">
        <section className="v4-panel v4-editor">
          <h2>Informasi Konten</h2>
          <div className="v4-form-two">
            <label>
              Judul *
              <input defaultValue="Meningkatkan Literasi Digital Mahasiswa di Era AI" />
            </label>
            <label>
              Slug *
              <input defaultValue="meningkatkan-literasi-digital-mahasiswa-era-ai" />
            </label>
          </div>
          <label>
            Ringkasan / Excerpt *
            <textarea defaultValue="Literasi digital menjadi kompetensi penting bagi mahasiswa dalam menghadapi transformasi teknologi berbasis Artificial Intelligence." />
          </label>
          <div className="v4-form-four">
            <label>
              Tipe Konten
              <select>
                <option>Berita</option>
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
              <select>
                <option>Super Admin</option>
              </select>
            </label>
            <label>
              Bahasa
              <select>
                <option>Bahasa Indonesia</option>
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
            >
              <h3>Pendahuluan</h3>
              <p>
                Perkembangan teknologi digital dan kecerdasan buatan telah
                mengubah cara kita belajar, bekerja, dan berinteraksi. Mahasiswa
                perlu memiliki literasi digital yang kuat.
              </p>
              <h3>Strategi Penguatan Literasi Digital</h3>
              <ul>
                <li>Pelatihan rutin dan workshop tematik.</li>
                <li>Integrasi literasi digital dalam kurikulum.</li>
                <li>Pemanfaatan platform pembelajaran digital.</li>
              </ul>
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
              literasi-digital-ai-featured.jpg
              <small>1200 × 628 px · 240 KB</small>
            </span>
          </div>
          <h3>Gambar Dalam Konten / Galeri</h3>
          <div className="v4-editor-images">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <span key={i}>{i}</span>
            ))}
          </div>
          <button>
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
            <Badge>BERITA</Badge>
            <h3>Meningkatkan Literasi Digital Mahasiswa di Era AI</h3>
            <p>
              Literasi digital menjadi kompetensi penting bagi mahasiswa dalam
              menghadapi transformasi teknologi.
            </p>
            <small>SA　Super Admin　　　　　　20 Mei 2026</small>
          </section>
          <section className="v4-panel">
            <h2>Revisi & Riwayat</h2>
            {['v4　Published', 'v3　Scheduled', 'v2　Draft', 'v1　Draft'].map(
              (x) => (
                <p key={x}>
                  ●　{x}
                  <small>　20 Mei 2026</small>
                </p>
              ),
            )}
          </section>
          <section className="v4-panel v4-danger">
            <h2>Aksi Lanjutan</h2>
            <button>Duplikasi Konten</button>
            <button>Ekspor Konten (PDF)</button>
            <button>Rollback ke Revisi</button>
            <button>
              <Trash2 /> Hapus Konten
            </button>
          </section>
        </aside>
      </div>
    </div>
  );
}

export function DdasCaseV4() {
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
        copy="Nomor tiket DAS-2026-0005 · data publik telah disanitasi."
        actions={<button>← Kembali</button>}
      />
      <div className="v4-case-summary">
        {[
          ['No. Tiket', 'DAS-2026-0005'],
          ['Kategori', 'Akademik'],
          ['Prioritas', 'Tinggi'],
          ['Unit Penanggung Jawab', 'BEM Fakultas'],
          ['Status Saat Ini', 'Masuk'],
          ['SLA Respon', '1,8 hari'],
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
            <p>
              Mahasiswa mengeluhkan keterlambatan pengumuman hasil ujian akhir
              semester yang berdampak pada rencana akademik berikutnya.
            </p>
            <div className="v4-mini-grid">
              <span>
                Dibuat oleh<b>Pengguna (Disamarkan)</b>
              </span>
              <span>
                Periode<b>2026–2027 Ganjil</b>
              </span>
              <span>
                Lokasi<b>Fakultas Ilmu Pendidikan</b>
              </span>
              <span>
                Lampiran Publik<b>1 file</b>
              </span>
            </div>
          </section>
          <section className="v4-panel v4-timeline">
            <h2>Timeline Publik (Sanitized)</h2>
            {timeline.map((x, i) => (
              <p key={x} className={i < 3 ? 'done' : ''}>
                <Check />
                <span>
                  <b>{x}</b>
                  <small>
                    {i < 3
                      ? '20 Mei 2026 · ' + (10 + i) + ':' + (i ? '10' : '23')
                      : 'Menunggu proses'}
                  </small>
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
            <textarea placeholder="Tulis catatan internal (tidak akan ditampilkan ke publik)..." />
            <button className="primary">
              <LockKeyhole /> Simpan Catatan
            </button>
          </section>
          <section className="v4-panel">
            <h2>Pesan Pembaruan Publik</h2>
            <textarea placeholder="Tulis pembaruan untuk diinformasikan kepada pelapor..." />
            <button className="primary">
              <Send /> Kirim Pembaruan
            </button>
          </section>
          <section className="v4-panel">
            <h2>Ubah Status Workflow</h2>
            <div className="v4-status-buttons">
              {timeline.map((x) => (
                <button key={x}>{x}</button>
              ))}
            </div>
            <p className="v4-blue-note">
              <b>Status saat ini: Masuk</b>
              <br />
              Aspirasi baru diterima dan sedang dalam antrean peninjauan.
            </p>
          </section>
        </main>
        <aside>
          <section className="v4-panel">
            <h2>Log Aktor</h2>
            {[
              'Membuat tiket aspirasi',
              'Meninjau aspirasi',
              'Meneruskan ke BEM Fakultas',
            ].map((x) => (
              <p key={x}>
                <b>SA　Super Admin</b>
                <small>{x} · 20 Mei 2026</small>
              </p>
            ))}
          </section>
          <section className="v4-panel">
            <h2>Aktivitas Terbaru</h2>
            <p>● Status diubah menjadi Ditinjau</p>
            <p>● Ditugaskan ke unit BEM Fakultas</p>
            <p>● Tiket dibuat</p>
          </section>
          <section className="v4-panel">
            <h2>Metadata Kasus</h2>
            <p>ID Internal　INT-2026-0005</p>
            <p>Sumber　Web Portal D-DAS</p>
            <p>Perangkat　Chrome / Windows</p>
            <p>Klasifikasi　Publik (Tersanitasi)</p>
          </section>
        </aside>
      </div>
    </div>
  );
}

const comments = [
  {
    author: 'Anonim',
    status: 'Perlu Penyaringan',
    body: 'Apakah ada perbedaan syarat untuk mahasiswa aktif angkatan lama?',
    source: 'Beranda',
    date: '20 Mei 2026',
  },
  {
    author: 'Bintang S.',
    status: 'Dipublikasikan',
    body: 'Keren! Website baru makin informatif.',
    source: 'Berita',
    date: '19 Mei 2026',
  },
  {
    author: 'Anonim',
    status: 'Perlu Penyaringan',
    body: 'Butuh info lebih lanjut tentang pendaftaran',
    source: 'Berita',
    date: '18 Mei 2026',
  },
  {
    author: 'Ananda N.',
    status: 'Dipublikasikan',
    body: 'Terima kasih atas informasinya.',
    source: 'Beranda',
    date: '17 Mei 2026',
  },
  {
    author: 'Mario K.',
    status: 'Ditolak',
    body: 'Promosi tidak relevan',
    source: 'Beranda',
    date: '16 Mei 2026',
  },
];
export function CommentsV4() {
  const [source, setSource] = useState('Semua');
  const [status, setStatus] = useState('Semua');
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
      ),
    [source, status, query],
  );
  const active = filtered[selected] ?? filtered[0] ?? comments[0];
  return (
    <div className="v4-admin-content">
      <PageTitle
        title="Komentar & Penyaringan"
        copy="Tinjau, saring, dan kelola semua komentar dari Beranda, Berita, dan halaman lainnya."
      />
      <div className="v4-comment-stats">
        {[
          ['Total Komentar', '421'],
          ['Perlu Penyaringan', '24'],
          ['Anonim', '153'],
          ['Dihapus Hari Ini', '6'],
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
          <option value="Beranda">Beranda</option>
          <option value="Berita">Berita</option>
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
        <select>
          <option>Terbaru</option>
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
            <small>20 Mei 2026 10:23</small>
            <p>{active.body}</p>
          </article>
          <p>3 balasan</p>
          {[
            'Halo, mahasiswa aktif angkatan lama tetap dapat mendaftar selama memenuhi syarat yang berlaku.',
            'Terima kasih atas informasinya. Apakah ada batas waktu pendaftarannya?',
            'Pendaftaran dibuka sampai tanggal 31 Mei 2026.',
          ].map((x, i) => (
            <article className="reply" key={x}>
              <b>{i === 1 ? '😎 Anonim' : 'SA　Super Admin'}</b>
              <small>20 Mei 2026 10:{35 + i * 7}</small>
              <p>{x}</p>
            </article>
          ))}
          <footer>
            <button>
              <Trash2 /> Hapus Thread
            </button>
            <button>Lihat Thread Lengkap</button>
            <button className="primary">
              <ShieldCheck /> Saring Komentar
            </button>
          </footer>
        </section>
      </div>
    </div>
  );
}

const users = [
  ['Dr. Jane Mona, M.Pd', 'Pimpinan', 'Super Admin', 'Aktif'],
  ['Reynold R. Wuisan', 'Komisi 1', 'Chairperson', 'Aktif'],
  ['Angelica M. Tampi', 'Sekretariat', 'Secretary', 'Aktif'],
  ['Michael P. Langi', 'Komisi 2', 'DPM Units', 'Aktif'],
  ['Stevani K. Runtuwerne', 'Humas', 'DPM Units', 'Aktif'],
  ['Brigita T. Warouw', 'Komisi 3', 'DPM Units', 'Aktif'],
  ['Pengurus HIMAPSI', 'HIMAPSI', 'ORMAWA', 'Aktif'],
];
export function IamV4() {
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
          <button className={i === 1 ? 'active' : ''} key={x}>
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
            <button className="primary">
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
                  <small>
                    {u[0].toLowerCase().replaceAll(' ', '.')}@unima.ac.id
                  </small>
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
                <span>{20 - i} Mei 2026</span>
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
              <button className="primary">
                <Plus /> Tambah Unit
              </button>
            </header>
            {[
              ['Komisi 1', 'KOM1', '12'],
              ['Komisi 2', 'KOM2', '9'],
              ['Humas', 'HUMAS', '7'],
              ['Komisi 3', 'KOM3', '11'],
            ].map((x) => (
              <p className="v4-unit-row" key={x[0]}>
                <b>{x[0]}</b>
                <span>{x[1]}</span>
                <span>{x[2]}</span>
                <button>✎</button>
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
          {[
            'Super Admin',
            'Chairperson',
            'Secretary',
            'DPM Units',
            'ORMAWA',
          ].map((x) => (
            <b key={x}>{x}</b>
          ))}
          {[
            'content.publish',
            'ddas.update.assigned',
            'comments.moderate',
            'media.delete',
            'users.manage',
            'auditlog.view',
          ].flatMap((x, i) => [
            <span key={x}>{x}</span>,
            ...[0, 1, 2, 3, 4].map((j) => (
              <i key={x + j}>{j === 0 || j <= 3 - (i % 3) ? '✓' : '□'}</i>
            )),
          ])}
        </div>
      </section>
    </div>
  );
}
