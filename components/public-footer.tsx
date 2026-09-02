import Link from 'next/link';
import { Landmark } from 'lucide-react';

export function PublicFooter() {
  return (
    <footer>
      <div className="shell footer-grid">
        <div><div className="brand light-brand"><span className="brand-mark"><Landmark size={21} /></span><span><strong>DPM FIPP</strong><small>UNIVERSITAS NEGERI MANADO</small></span></div><p>Ruang representasi, aspirasi, dan pengawasan mahasiswa FIPP UNIMA.</p></div>
        <div><b>Layanan</b><Link href="/ddas/kirim">Kirim Aspirasi</Link><Link href="/ddas/tracking">Lacak Aspirasi</Link><Link href="/survei">Survei</Link><Link href="/admin/login">Portal Admin</Link></div>
        <div><b>Informasi</b><Link href="/berita">Publikasi</Link><Link href="/program">Program Kerja</Link><Link href="/ormawa">ORMAWA</Link></div>
      </div>
      <div className="shell copyright">© 2026 DPM FIPP UNIMA | Developed by @hhholyyy_ <span>Bahasa Indonesia · WITA (UTC+8)</span></div>
    </footer>
  );
}
