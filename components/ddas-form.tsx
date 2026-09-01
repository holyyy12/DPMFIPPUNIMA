'use client';

import { useState } from 'react';
import { Check, Copy, Download, LockKeyhole, Send } from 'lucide-react';

type Receipt = { ticket: string; secret: string };
type ApiResult = { ok: boolean; data?: Receipt; message?: string; requestId: string };

export function DdasForm() {
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [copied, setCopied] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');

  if (receipt) {
    const text = `Nomor tiket: ${receipt.ticket}\nKode pelacakan: ${receipt.secret}`;
    return (
      <section className="receipt-card" aria-live="polite">
        <span className="success-icon"><Check /></span>
        <p className="form-eyebrow">ASPIRASI TERSIMPAN</p>
        <h1>Terima kasih sudah bersuara.</h1>
        <p>Aspirasi Anda sudah tersimpan secara durable. Simpan kedua kode di bawah ini—kode pelacakan hanya ditampilkan pada receipt ini.</p>
        <div className="credential-box"><small>NOMOR TIKET</small><strong>{receipt.ticket}</strong><small>KODE PELACAKAN PRIVAT</small><strong>{receipt.secret}</strong></div>
        <div className="receipt-actions">
          <button className="native-button" type="button" onClick={async () => { await navigator.clipboard.writeText(text); setCopied(true); }}><Copy /> {copied ? 'Tersalin' : 'Salin kode'}</button>
          <button className="native-button outline" type="button" onClick={() => { const blob = new Blob([text], { type: 'text/plain' }); const url = URL.createObjectURL(blob); const anchor = document.createElement('a'); anchor.href = url; anchor.download = `${receipt.ticket}.txt`; anchor.click(); URL.revokeObjectURL(url); }}><Download /> Unduh bukti</button>
        </div>
        <div className="privacy-callout"><LockKeyhole size={18} /><span>Jangan bagikan kode pelacakan. DPM tidak akan meminta kode ini melalui komentar publik.</span></div>
      </section>
    );
  }

  return (
    <form className="ddas-form" onSubmit={async (event) => {
      event.preventDefault(); setError(''); setPending(true);
      const form = event.currentTarget;
      const data = new FormData(form);
      try {
        const files=Array.from((form.elements.namedItem('attachments') as HTMLInputElement)?.files??[]).map(file=>({name:file.name,type:file.type,size:file.size}));
        const response = await fetch('/api/ddas/submit', { method:'POST', headers:{'Content-Type':'application/json'}, cache:'no-store', body:JSON.stringify({ category:data.get('category'), subject:data.get('subject'), body:data.get('body'), email:data.get('email'), whatsapp:data.get('whatsapp'), submissionMode:data.get('submissionMode'), anonymityReason:data.get('anonymityReason'), attachments:files, consent:data.get('consent')==='on', notificationOptIn:data.get('notificationOptIn')==='on', website:data.get('website'), idempotencyKey:crypto.randomUUID() }) });
        const result = await response.json() as ApiResult;
        if (!response.ok || !result.ok || !result.data) throw new Error(result.message ?? 'Aspirasi belum dapat dikirim.');
        setReceipt(result.data); window.dispatchEvent(new CustomEvent('ddas:submitted',{detail:result.data})); window.scrollTo({ top:0, behavior:'smooth' });
      } catch (reason) { setError(reason instanceof Error ? reason.message : 'Aspirasi belum dapat dikirim.'); }
      finally { setPending(false); }
    }}>
      {error && <div className="form-error-summary" role="alert"><b>Aspirasi belum terkirim</b><span>{error}</span></div>}
      <div className="form-section"><p className="form-eyebrow">01 · INFORMASI ASPIRASI</p><h2>Apa yang ingin Anda sampaikan?</h2>
        <label htmlFor="category">Kategori</label><select id="category" name="category" required defaultValue=""><option value="" disabled>Pilih kategori</option><option>Akademik</option><option>Fasilitas</option><option>Kemahasiswaan</option><option>Keuangan & UKT</option><option>Lainnya</option></select>
        <label htmlFor="subject">Judul singkat</label><input id="subject" name="subject" required minLength={8} maxLength={180} placeholder="Contoh: Akses ruang belajar pada sore hari" />
        <label htmlFor="body">Ceritakan aspirasi Anda</label><textarea id="body" name="body" required minLength={20} maxLength={12000} rows={7} placeholder="Jelaskan situasi, dampak, dan tindak lanjut yang Anda harapkan…" />
        <fieldset className="v5-anonymity"><legend>Identitas pengirim</legend><label><input type="radio" name="submissionMode" value="named" defaultChecked/> Dengan identitas terverifikasi</label><label><input type="radio" name="submissionMode" value="anonymous"/> Ajukan sebagai anonim</label><p>Anonimitas diprioritaskan untuk isu berisiko tinggi, sensitif, atau yang dapat menimbulkan tekanan terhadap pelapor.</p></fieldset>
        <label htmlFor="anonymityReason">Alasan anonimitas (diisi bila memilih anonim)</label><textarea id="anonymityReason" name="anonymityReason" rows={3} maxLength={1000} placeholder="Jelaskan tingkat risiko atau sensitivitas isu."/>
        <label htmlFor="attachments">Lampiran pendukung (opsional)</label><input id="attachments" name="attachments" type="file" multiple accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx"/><p className="form-help">Maksimal 8 file, 25 MB per file. Mendukung foto, dokumen, video, dan audio.</p>
      </div>
      <div className="form-section"><p className="form-eyebrow">02 · KONTAK OPSIONAL</p><h2>Perlu kami hubungi?</h2><p className="form-help">Kontak disimpan terenkripsi dan terpisah dari isi aspirasi. Kontak tidak pernah tampil di halaman publik.</p>
        <label htmlFor="email">Email (opsional)</label><input id="email" name="email" type="email" maxLength={254} placeholder="nama@student.unima.ac.id" />
        <label htmlFor="whatsapp">Nomor WhatsApp (opsional)</label><input id="whatsapp" name="whatsapp" inputMode="tel" maxLength={20} placeholder="Contoh: +62 812 3456 7890" />
        <label className="consent-row compact"><input type="checkbox" name="notificationOptIn" /><span>Saya ingin menerima notifikasi penerimaan melalui email.</span></label>
      </div>
      <div className="honeypot" aria-hidden="true"><label htmlFor="website">Website</label><input id="website" name="website" tabIndex={-1} autoComplete="off" /></div>
      <label className="consent-row"><input type="checkbox" name="consent" required /><span>Saya memahami bahwa D-DAS bukan kanal darurat dan menyetujui pemrosesan data minimum untuk penanganan aspirasi ini.</span></label>
      <button className="submit-ddas native-button" type="submit" disabled={pending}><Send /> {pending ? 'Menyimpan secara aman…' : 'Kirim aspirasi dengan aman'}</button>
      <p className="submit-note"><LockKeyhole size={14} /> Receipt hanya diterbitkan setelah transaksi backend tersimpan.</p>
    </form>
  );
}
