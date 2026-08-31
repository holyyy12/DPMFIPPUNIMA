import { Clock3, LockKeyhole, MessageSquareText } from 'lucide-react';
import { DdasForm } from '@/components/ddas-form';
import { PortalHeader } from '@/components/portal-header';

export default function KirimAspirasiPage() {
  return <main><PortalHeader /><section className="subpage-hero"><div className="shell narrow-shell"><span className="form-eyebrow">D-DAS · DIGITAL ASPIRATION SYSTEM</span><h1>Sampaikan aspirasi dengan aman.</h1><p>Anda tidak wajib mencantumkan identitas. Setiap kiriman menerima nomor tiket dan kode pelacakan privat.</p><div className="trust-row"><span><LockKeyhole /> Privat secara default</span><span><Clock3 /> Respons awal 1–2 hari kerja</span><span><MessageSquareText /> Proses dapat dilacak</span></div></div></section><section className="form-layout shell"><DdasForm /><aside className="form-aside"><h2>Sebelum mengirim</h2><ol><li>Hindari menulis kata sandi atau data yang tidak relevan.</li><li>Gunakan kanal darurat kampus jika ada risiko keselamatan langsung.</li><li>Simpan nomor tiket dan kode pelacakan di tempat aman.</li></ol><div className="aside-note"><b>Privasi Anda penting</b><p>Kontak dan isi aspirasi dipisahkan. Timeline publik hanya memuat pembaruan yang sudah disanitasi.</p></div></aside></section></main>;
}
