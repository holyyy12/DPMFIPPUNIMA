'use client';

import { useState } from 'react';
import { Check, Copy, Download, LockKeyhole, Send } from 'lucide-react';

type Receipt = { ticket: string; secret: string };

function randomCode(length: number) {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

export function DdasForm() {
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [copied, setCopied] = useState(false);

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = { ticket: `D-DAS-2026-${randomCode(8)}`, secret: randomCode(16) };
    localStorage.setItem(`ddas:${value.ticket}`, JSON.stringify({ ...value, status: 'Diterima', createdAt: new Date().toISOString() }));
    setReceipt(value);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  if (receipt) {
    const text = `Nomor tiket: ${receipt.ticket}\nKode pelacakan: ${receipt.secret}`;
    return (
      <section className="receipt-card" aria-live="polite">
        <span className="success-icon"><Check /></span>
        <p className="form-eyebrow">ASPIRASI TERSIMPAN</p>
        <h1>Terima kasih sudah bersuara.</h1>
        <p>Aspirasi Anda sudah diterima. Simpan kedua kode di bawah ini—kode pelacakan hanya ditampilkan sekali.</p>
        <div className="credential-box"><small>NOMOR TIKET</small><strong>{receipt.ticket}</strong><small>KODE PELACAKAN PRIVAT</small><strong>{receipt.secret}</strong></div>
        <div className="receipt-actions">
          <button className="native-button" type="button" onClick={async () => { await navigator.clipboard.writeText(text); setCopied(true); }}><Copy /> {copied ? 'Tersalin' : 'Salin kode'}</button>
          <button className="native-button outline" type="button" onClick={() => { const blob = new Blob([text], { type: 'text/plain' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `${receipt.ticket}.txt`; a.click(); URL.revokeObjectURL(url); }}><Download /> Unduh bukti</button>
        </div>
        <div className="privacy-callout"><LockKeyhole size={18} /><span>Jangan bagikan kode pelacakan. DPM tidak akan meminta kode ini melalui komentar publik.</span></div>
      </section>
    );
  }

  return (
    <form className="ddas-form" onSubmit={submit}>
      <div className="form-section"><p className="form-eyebrow">01 · INFORMASI ASPIRASI</p><h2>Apa yang ingin Anda sampaikan?</h2>
        <label htmlFor="category">Kategori</label><select id="category" name="category" required defaultValue=""><option value="" disabled>Pilih kategori</option><option>Akademik</option><option>Fasilitas</option><option>Kemahasiswaan</option><option>Keuangan & UKT</option><option>Lainnya</option></select>
        <label htmlFor="subject">Judul singkat</label><input id="subject" name="subject" required minLength={8} placeholder="Contoh: Akses ruang belajar pada sore hari" />
        <label htmlFor="body">Ceritakan aspirasi Anda</label><textarea id="body" name="body" required minLength={20} rows={7} placeholder="Jelaskan situasi, dampak, dan tindak lanjut yang Anda harapkan…" />
      </div>
      <div className="form-section"><p className="form-eyebrow">02 · KONTAK OPSIONAL</p><h2>Perlu kami hubungi?</h2><p className="form-help">Kontak disimpan terpisah dari isi aspirasi dan tidak pernah tampil di halaman publik.</p>
        <label htmlFor="email">Email (opsional)</label><input id="email" name="email" type="email" placeholder="nama@student.unima.ac.id" />
      </div>
      <label className="consent-row"><input type="checkbox" required /><span>Saya memahami cakupan layanan dan menyetujui pemrosesan data seperlunya untuk penanganan aspirasi ini.</span></label>
      <button className="submit-ddas native-button" type="submit"><Send /> Kirim aspirasi dengan aman</button>
      <p className="submit-note"><LockKeyhole size={14} /> Data simulasi ini tersimpan hanya di perangkat untuk demo greenfield.</p>
    </form>
  );
}
