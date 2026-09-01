'use client';

import { useState } from 'react';
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
  LockKeyhole,
  Mail,
  Plus,
  Save,
  Search,
  ShieldCheck,
  Upload,
  Vote,
} from 'lucide-react';

type OrganizationMember = {
  id: number;
  role: string;
  name: string;
  unit: string;
  image: string;
};

const initialOrganizationMembers: OrganizationMember[] = [
  {
    id: 1,
    role: 'Ketua Umum',
    name: 'Reynold R. Wuisan',
    unit: 'Pimpinan',
    image:
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=240&q=80',
  },
  {
    id: 2,
    role: 'Sekretaris Umum',
    name: 'Angelica M. Tampi',
    unit: 'Sekretariat',
    image:
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=240&q=80',
  },
  {
    id: 3,
    role: 'Ketua Komisi 1',
    name: 'Michael P. Langi',
    unit: 'Legislasi & Kebijakan',
    image:
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=240&q=80',
  },
  {
    id: 4,
    role: 'Ketua Komisi 2',
    name: 'Stevani K. Runtuwerne',
    unit: 'Pengawasan & Advokasi',
    image:
      'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?auto=format&fit=crop&w=240&q=80',
  },
  {
    id: 5,
    role: 'Koordinator Humas',
    name: 'Brigita T. Warouw',
    unit: 'Hubungan Masyarakat',
    image:
      'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=240&q=80',
  },
];

function Title({
  title,
  copy,
  action = 'Simpan Perubahan',
}: {
  title: string;
  copy: string;
  action?: string;
}) {
  return (
    <header className="v4-admin-title">
      <div>
        <h1>{title}</h1>
        <p>{copy}</p>
      </div>
      <div>
        <button className="primary">
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
  return (
    <div className="v4-admin-content v5-admin-workspace">
      <Title
        title="Tampilan Situs & Aset"
        copy="Kelola Hero Beranda, teks institusional, logo, foto, dan navigasi tanpa mengubah kode."
      />
      <div className="v5-admin-layout">
        <main>
          <section className="v4-panel v5-admin-form">
            <header>
              <h2>Hero Beranda</h2>
              <span>Terbit</span>
            </header>
            <label>
              Judul utama
              <input defaultValue="DPM FIPP UNIMA" />
            </label>
            <label>
              Subjudul
              <input defaultValue="Representasi, Aspirasi, Legislasi, dan Pengawasan Mahasiswa." />
            </label>
            <label>
              Paragraf
              <textarea defaultValue="DPM FIPP UNIMA hadir sebagai jembatan komunikasi antara mahasiswa dan fakultas untuk mendorong perubahan, transparansi, dan kemajuan bersama." />
            </label>
            <label>
              Gambar Hero
              <div className="v5-asset-field">
                <img src="/fipp-campus-hero.png" alt="Pratinjau Hero" />
                <span>
                  <button>
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
                CTA 1<input defaultValue="Jelajahi DPM" />
              </label>
              <label>
                Tujuan
                <input defaultValue="/tentang" />
              </label>
              <label>
                CTA 2<input defaultValue="Kirim Aspirasi" />
              </label>
              <label>
                Tujuan
                <input defaultValue="/ddas" />
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
                <button>
                  <Upload /> Ganti Logo
                </button>
              </div>
            </label>
            <label>
              Favicon
              <button>
                <Image /> Unggah Favicon
              </button>
            </label>
            <label>
              Gambar Social Preview
              <button>
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
                <button>Kelola</button>
              </p>
            ))}
          </section>
        </aside>
      </div>
    </div>
  );
}

export function InsightAdmin() {
  return (
    <div className="v4-admin-content">
      <Title
        title="D-SIGHT"
        copy="Kelola kajian, survei, berita berbasis isu, serta ringkasan hasil sementara."
        action="Buat Konten D-SIGHT"
      />
      <div className="v4-admin-stats">
        <Metric
          icon={BarChart3}
          label="Kajian Terbit"
          value="18"
          note="3 periode ini"
        />
        <Metric icon={Vote} label="Survei Aktif" value="3" note="650 respons" />
        <Metric
          icon={FileText}
          label="Berita Isu"
          value="12"
          note="4 bulan ini"
        />
      </div>
      <div className="v5-admin-layout">
        <section className="v4-panel">
          <header>
            <div>
              <h2>Daftar Kajian</h2>
              <p>Draft, review, dan publikasi kajian.</p>
            </div>
            <button className="primary">
              <Plus /> Tambah Kajian
            </button>
          </header>
          <div className="v5-admin-list">
            {[
              'Evaluasi Efektivitas Kurikulum MBKM',
              'Aksesibilitas Fasilitas Belajar',
              'Pemetaan Kebutuhan Layanan Konseling',
            ].map((x, i) => (
              <article key={x}>
                <BarChart3 />
                <span>
                  <b>{x}</b>
                  <small>{i ? 'Published' : 'In Review'} · Komisi I</small>
                </span>
                <button>Edit</button>
              </article>
            ))}
          </div>
        </section>
        <aside>
          <section className="v4-panel">
            <header>
              <h2>Survei Berjalan</h2>
              <button className="primary">
                <Plus /> Buat Survei
              </button>
            </header>
            <div className="v5-admin-list">
              {[
                'Kualitas layanan akademik',
                'Fasilitas ruang belajar',
                'Kesejahteraan mahasiswa',
              ].map((x, i) => (
                <article key={x}>
                  <Vote />
                  <span>
                    <b>{x}</b>
                    <small>{247 - i * 31} respons · Aktif</small>
                  </span>
                  <button>Hasil</button>
                </article>
              ))}
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}

export function TraceAdmin() {
  return (
    <div className="v4-admin-content">
      <Title
        title="D-TRACE"
        copy="Kelola publikasi internal DPM yang telah ditetapkan aman untuk dibaca publik."
        action="Tambah Publikasi"
      />
      <div className="v5-admin-layout">
        <section className="v4-panel">
          <header>
            <div>
              <h2>Publikasi Internal</h2>
              <p>Dokumen wajib melalui sanitasi dan klasifikasi publik.</p>
            </div>
            <button className="primary">
              <Plus /> Unggah
            </button>
          </header>
          <div className="v5-admin-list">
            {[
              'Laporan Kinerja Semester Ganjil',
              'Laporan Tindak Lanjut Aspirasi',
              'Rekapitulasi Rapat Dengar Pendapat',
              'Laporan Realisasi Program Kerja Q1',
            ].map((x, i) => (
              <article key={x}>
                <FileText />
                <span>
                  <b>{x}</b>
                  <small>
                    {i === 1 ? 'Menunggu review' : 'Published'} · PDF
                  </small>
                </span>
                <button>Edit</button>
              </article>
            ))}
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
              <select>
                <option>2026–2027</option>
              </select>
            </label>
            <label>
              Unit pemilik
              <select>
                <option>Semua Unit DPM</option>
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
  return (
    <div className="v4-admin-content">
      <Title
        title="D-DAR"
        copy="Kelola direktori arsip cepat DPM dan seluruh ORMAWA berdasarkan organisasi dan periode."
        action="Tambah Arsip"
      />
      <section className="v4-panel">
        <header>
          <div>
            <h2>Direktori Arsip</h2>
            <p>Dokumen, metadata, pemilik, dan hak akses.</p>
          </div>
          <button className="primary">
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
          {[
            ['DPM FIPP', 'LPJ 2025', 'LPJ'],
            ['BEM FIPP', 'Arsip Program Kerja', 'Program'],
            ['HIMAPSI', 'AD/ART 2026', 'Regulasi'],
            ['HMJ PGSD', 'Dokumentasi Pengabdian', 'Dokumentasi'],
          ].map((x) => (
            <p key={x[1]}>
              <span>{x[0]}</span>
              <b>
                <FileArchive />
                {x[1]}
              </b>
              <span>{x[2]}</span>
              <span>2026</span>
              <span>Publik</span>
              <button>Edit</button>
            </p>
          ))}
        </div>
      </section>
    </div>
  );
}

export function NotificationsAdmin() {
  return (
    <div className="v4-admin-content">
      <Title
        title="Notifikasi"
        copy="Kelola notifikasi in-app, template, preferensi, dan status pengiriman."
        action="Buat Notifikasi"
      />
      <div className="v4-admin-stats">
        <Metric
          icon={Bell}
          label="Belum Dibaca"
          value="12"
          note="Semua pengguna"
        />
        <Metric
          icon={Mail}
          label="Terkirim Hari Ini"
          value="46"
          note="98% berhasil"
        />
        <Metric icon={Activity} label="Antrean" value="3" note="Dijadwalkan" />
      </div>
      <div className="v5-admin-layout">
        <section className="v4-panel">
          <header>
            <h2>Notifikasi Terbaru</h2>
          </header>
          <div className="v5-admin-list">
            {[
              'Kajian baru menunggu review',
              'Aspirasi prioritas tinggi diterima',
              'Halaman ORMAWA meminta persetujuan',
              'Dokumen D-TRACE siap terbit',
            ].map((x, i) => (
              <article key={x}>
                <Bell />
                <span>
                  <b>{x}</b>
                  <small>
                    {i + 1} jam lalu ·{' '}
                    {i === 2 ? 'Perlu tindakan' : 'Informasi'}
                  </small>
                </span>
                <button>Tandai dibaca</button>
              </article>
            ))}
          </div>
        </section>
        <aside>
          <section className="v4-panel v5-admin-form">
            <header>
              <h2>Preferensi</h2>
            </header>
            {[
              'Aspirasi prioritas',
              'Permintaan approval',
              'Konten menunggu review',
              'Insiden layanan',
            ].map((x) => (
              <label key={x}>
                <input type="checkbox" defaultChecked /> {x}
              </label>
            ))}
          </section>
        </aside>
      </div>
    </div>
  );
}

export function OrganizationAdmin() {
  const [members, setMembers] = useState(initialOrganizationMembers);
  const [saved, setSaved] = useState(false);
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
      />
      <div className="v5-admin-layout">
        <main>
          <section className="v4-panel v5-admin-form">
            <header>
              <h2>Konten Halaman Tentang</h2>
              <span>Terbit</span>
            </header>
            <label>
              Deskripsi DPM
              <textarea defaultValue="DPM FIPP UNIMA adalah lembaga perwakilan mahasiswa tingkat fakultas yang menyalurkan aspirasi, menyusun kajian, menjalankan fungsi legislasi, dan mengawasi program kemahasiswaan." />
            </label>
            <label>
              Periode Aktif
              <select>
                <option>2026–2027</option>
              </select>
            </label>
            <button>
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
                          if (file)
                            updateMember(
                              member.id,
                              'image',
                              URL.createObjectURL(file),
                            );
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
                onClick={() => setSaved(true)}
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
              {['HIMAPSI', 'HIMAPEN', 'HMJ PGSD'].map((x, i) => (
                <article key={x}>
                  <Building2 />
                  <span>
                    <b>{x}</b>
                    <small>{i ? 'Halaman aktif' : 'Menunggu approval'}</small>
                  </span>
                  <button>{i ? 'Kelola' : 'Setujui'}</button>
                </article>
              ))}
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
              <input type="checkbox" defaultChecked /> ORMAWA dapat publish
              halaman sendiri setelah halaman disetujui
            </label>
          </section>
        </aside>
      </div>
    </div>
  );
}

export function PermissionAdmin() {
  const rows = [
    'content.publish.all',
    'ormawa.profile.edit.own',
    'ormawa.profile.publish.own',
    'ddas.update.assigned',
    'comments.moderate.all',
    'audit.read.all',
  ];
  return (
    <div className="v4-admin-content">
      <Title
        title="Permission"
        copy="Atur permission fleksibel untuk Super Admin, Chairperson, Secretary, Unit DPM, dan ORMAWA."
      />
      <section className="v4-panel v5-permission">
        <header>
          <div>
            <h2>Permission Matrix</h2>
            <p>Explicit deny selalu mengalahkan allow.</p>
          </div>
          <button className="primary">
            <Plus /> Tambah Permission
          </button>
        </header>
        <div>
          <b>Permission</b>
          {[
            'Super Admin',
            'Chairperson',
            'Secretary',
            'DPM Unit',
            'ORMAWA',
          ].map((x) => (
            <b key={x}>{x}</b>
          ))}
          {rows.flatMap((x, i) => [
            <span key={x}>
              <LockKeyhole />
              {x}
            </span>,
            ...[0, 1, 2, 3, 4].map((j) => (
              <label key={x + j}>
                <input
                  type="checkbox"
                  defaultChecked={
                    j === 0 || (i > 0 && j === 4 && i < 3) || (j < 3 && i < 5)
                  }
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
  return (
    <div className="v4-admin-content">
      <Title
        title="Audit Log"
        copy="Riwayat append-only untuk perubahan akses, publikasi, D-DAS, aset, dan struktur organisasi."
        action="Ekspor Audit"
      />
      <div className="v4-admin-stats">
        <Metric
          icon={History}
          label="Event 24 Jam"
          value="184"
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
          value="7"
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
            <input placeholder="Cari actor, aksi, atau target..." />
          </label>
        </header>
        <div className="v5-audit-list">
          {[
            ['Super Admin', 'content.publish', 'Kajian MBKM', 'Berhasil'],
            [
              'ORMAWA · HIMAPSI',
              'ormawa.profile.update',
              'Halaman HIMAPSI',
              'Berhasil',
            ],
            ['Chairperson', 'audit.read.all', 'Audit Log', 'Ditolak'],
            [
              'Secretary',
              'organization.structure.update',
              'Komisi II',
              'Berhasil',
            ],
            ['D-DAS Coordinator', 'ddas.assign', 'DAS-2026-0005', 'Berhasil'],
          ].map((x) => (
            <article key={x.join()}>
              <span className={x[3] === 'Ditolak' ? 'deny' : 'ok'}>{x[3]}</span>
              <div>
                <b>{x[1]}</b>
                <small>
                  {x[0]} · {x[2]}
                </small>
              </div>
              <time>20 Mei 2026 · 10:23</time>
              <button>Detail</button>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
