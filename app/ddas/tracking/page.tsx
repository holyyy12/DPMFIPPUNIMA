import { PortalHeader } from '@/components/portal-header';
import { TrackingForm } from '@/components/tracking-form';
import { PublicFooter } from '@/components/public-footer';

export default function TrackingPage() {
  return <main><PortalHeader /><section className="subpage-hero compact"><div className="shell narrow-shell"><span className="form-eyebrow">D-DAS · PELACAKAN PRIVAT</span><h1>Lacak tindak lanjut aspirasi.</h1><p>Masukkan nomor tiket dan kode pelacakan yang Anda terima. Hasil hanya menampilkan timeline yang aman untuk pengirim.</p></div></section><section className="shell tracking-layout"><TrackingForm /><aside className="form-aside"><h2>Tidak menemukan kode?</h2><p>Untuk melindungi privasi, kami tidak dapat menampilkan apakah sebuah nomor tiket benar tanpa kode pelacakan yang sesuai.</p><div className="aside-note"><b>Butuh bantuan?</b><p>Hubungi sekretariat DPM melalui kanal resmi dengan menyiapkan bukti pengiriman.</p></div></aside></section><PublicFooter /></main>;
}
