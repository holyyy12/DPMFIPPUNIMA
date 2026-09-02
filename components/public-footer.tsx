import Link from 'next/link';
import { Landmark } from 'lucide-react';

export function PublicFooter() {
  return (
    <footer>
      <div className="shell footer-grid">
        <div><div className="brand light-brand">
          <span className="brand-mark">
            <Landmark size={23} />
            </span>
            <span>
              <strong>DPM FIPP</strong>
              <small>UNIVERSITAS NEGERI MANADO</small>
            </span>
              </div>
              <p>Dewan Perwakilan Mahasiswa Fakultas Ilmu Pendidikan dan Psikologi Universitas Negeri Manado.</p>
              </div>
        <div><b>Layanan</b><Link href="/ddas/kirim">Kirim Aspirasi</Link><Link href="/ddas/tracking">Lacak Aspirasi</Link><Link href="/survei">Survei</Link><Link href="/admin/login">Portal Admin</Link></div>
        <div><b>Informasi</b><Link href="/berita">Publikasi</Link><Link href="/program">Program Kerja</Link><Link href="/ormawa">ORMAWA</Link></div>
        <div><b>Lokasi</b><Link href="https://www.google.com/maps/place/8R7W%2B3JP,+Matani+Satu,+Kec.+Tomohon+Tengah,+Kota+Tomohon,+Sulawesi+Utara/@1.3128091,124.8464812,21z/data=!4m14!1m7!3m6!1s0x32876ca73a7920a9:0xf4642be711c18fe5!2sFakultas+Ilmu+Pendidikan+dan+Psikologi+UNIMA!8m2!3d1.3131933!4d124.8459334!16s%2Fg%2F1hm37b055!3m5!1s0x32876ca7462ff247:0x205d4b5b39951139!8m2!3d1.3127302!4d124.8465933!16s%2Fg%2F11sgvyjmlr?entry=ttu&g_ep=EgoyMDI2MDgzMC4wIKXMDSoASAFQAw%3D%3D" target="_blank">Kampus FIPP Universitas Negeri Manado Jl. Kampus Kaaten, Matani Satu, Kota Tomohon, Sulawesi Utara, 95362.</Link></div>
        <div><b>Media Sosial</b><Link href="https://www.instagram.com/dpm_fipp_unima/" target="_blank">Instagram</Link><Link href="https://www.gmail.com/dpmfippunima@gmail.com" target="_blank">Email</Link></div>
      </div>
      <div className="shell copyright">
        © 2026 DPM FIPP - Universitas Negeri Manado. All Rights Reserved.<span><Link href="https://www.instagram.com/hhholyyy_/"> Developed by @hhholyyy_</Link></span>
      </div>
    </footer>
  );
}
