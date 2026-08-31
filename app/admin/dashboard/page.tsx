import Link from 'next/link';
import { Activity, ChevronRight, CircleGauge, FilePenLine, Inbox, MessageSquare, ShieldCheck, Users } from 'lucide-react';

const cases = [
  ['D-DAS-2026-X8KM2P4Q', 'Akses fasilitas', 'Baru', '5 menit lalu'],
  ['D-DAS-2026-R7NQ5W2A', 'Layanan akademik', 'Ditinjau', '38 menit lalu'],
  ['D-DAS-2026-B9JH3K6M', 'Kegiatan mahasiswa', 'Ditugaskan', '2 jam lalu'],
];

export default function AdminDashboard() {
  return (
    <div className="admin-content">
      <div className="admin-page-intro"><div><span>RINGKASAN HARI INI</span><h2>Selamat datang, Admin</h2><p>Selasa, 1 September 2026 · Periode 2026/2027</p></div></div>
      <div className="alert-banner"><ShieldCheck /><p><b>Fondasi keamanan aktif</b><span>Mode greenfield · Data sintetis · Tidak terhubung ke sistem lama</span></p><Link href="/admin/settings">Lihat kontrol <ChevronRight /></Link></div>
      <div className="admin-stats"><article><span><Inbox /></span><p>Aspirasi aktif<small>Perlu tindak lanjut</small></p><strong>24</strong><em>+6 minggu ini</em></article><article><span><FilePenLine /></span><p>Konten editorial<small>Menunggu review</small></p><strong>8</strong><em>3 jatuh tempo</em></article><article><span><MessageSquare /></span><p>Antrean moderasi<small>Laporan terbuka</small></p><strong>4</strong><em>1 prioritas tinggi</em></article><article><span><Activity /></span><p>Kesehatan layanan<small>30 hari terakhir</small></p><strong>99,99%</strong><em className="good">Normal</em></article></div>
      <div className="admin-grid"><section className="admin-panel"><header><div><span>D-DAS</span><h2>Aspirasi terbaru</h2></div><Link href="/admin/ddas">Buka antrean <ChevronRight /></Link></header><div className="case-table"><div className="case-head"><span>ID tiket</span><span>Topik</span><span>Status</span><span>Diterima</span></div>{cases.map((row)=><div key={row[0]}>{row.map((cell,index)=><span key={cell} className={index===2?'case-status':''}>{cell}</span>)}</div>)}</div></section><section className="admin-panel editorial"><header><div><span>EDITORIAL</span><h2>Alur publikasi</h2></div><Link href="/admin/cms">Kelola konten <ChevronRight /></Link></header><div className="workflow"><div><b>12</b><span>Draft</span></div><ChevronRight /><div><b>8</b><span>Review</span></div><ChevronRight /><div><b>3</b><span>Disetujui</span></div><ChevronRight /><div><b>5</b><span>Terjadwal</span></div></div><div className="deadline"><CircleGauge /><p><b>3 konten mendekati tenggat</b><small>Tinjau sebelum pukul 16.00 WITA</small></p><Link href="/admin/cms">Buka</Link></div></section></div>
      <section className="admin-panel quick"><header><div><span>AKSI CEPAT</span><h2>Mulai pekerjaan</h2></div></header><div><Link href="/admin/cms"><FilePenLine /><span><b>Buat konten</b><small>Berita, kajian, atau laporan</small></span><ChevronRight /></Link><Link href="/admin/ddas"><Inbox /><span><b>Triase aspirasi</b><small>12 kasus perlu peninjauan</small></span><ChevronRight /></Link><Link href="/admin/iam"><Users /><span><b>Kelola akses</b><small>Role, unit, dan periode</small></span><ChevronRight /></Link></div></section>
    </div>
  );
}
