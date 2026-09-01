import Link from 'next/link';
import { PublicFooter } from '@/components/public-footer';
import { PublicHeader } from '@/components/public-header';
export default function NotFound(){return <main><PublicHeader/><section className="info-hero"><div className="shell"><span className="form-eyebrow">404 · HALAMAN TIDAK DITEMUKAN</span><h1>Informasi ini tidak tersedia.</h1><p>Alamat mungkin berubah, diarsipkan, atau ditarik. Gunakan pencarian atau kembali ke pusat informasi.</p><div className="not-found-actions"><Link className="native-button" href="/search">Cari informasi</Link><Link className="native-button outline" href="/">Kembali ke beranda</Link></div></div></section><PublicFooter/></main>}
