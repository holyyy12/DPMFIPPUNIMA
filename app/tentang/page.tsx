import Link from 'next/link';
import { ArrowRight, Eye, Landmark, MessagesSquare, Scale } from 'lucide-react';
import { PublicFooter } from '@/components/public-footer';
import { PublicHeader } from '@/components/public-header';

export default function TentangPage() {
  return <main><PublicHeader /><section className="info-hero about-hero"><div className="shell info-hero-grid"><div><span className="form-eyebrow">TENTANG DPM FIPP UNIMA</span><h1>Representasi yang hadir, bekerja, dan dapat diawasi.</h1><p>DPM FIPP UNIMA menjalankan fungsi representasi, legislasi, pengawasan, dan advokasi kepentingan mahasiswa secara bertanggung jawab.</p><Link className="native-button" href="/ddas/kirim">Sampaikan aspirasi <ArrowRight /></Link></div><span className="about-emblem"><Landmark /></span></div></section><section className="shell mandate-grid"><article><MessagesSquare /><h2>Representasi</h2><p>Menyerap, merumuskan, dan menyampaikan kepentingan mahasiswa melalui kanal yang aman dan terdokumentasi.</p></article><article><Scale /><h2>Legislasi</h2><p>Menyusun sikap, rekomendasi, dan perangkat kelembagaan berdasarkan mandat serta kebutuhan mahasiswa.</p></article><article><Eye /><h2>Pengawasan</h2><p>Mengawal program kerja dan tindak lanjut secara terbuka melalui laporan yang dapat diperiksa publik.</p></article></section><PublicFooter /></main>;
}
