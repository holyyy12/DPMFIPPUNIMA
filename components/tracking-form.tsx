'use client';

import { useState } from 'react';
import { CheckCircle2, Circle, LockKeyhole, Search } from 'lucide-react';

type Result = { ticket: string; status: string; createdAt: string };

export function TrackingForm() {
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState('');
  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError('');
    const data = new FormData(event.currentTarget); const ticket = String(data.get('ticket')).toUpperCase(); const secret = String(data.get('secret')).toUpperCase();
    const raw = localStorage.getItem(`ddas:${ticket}`);
    if (!raw) { setResult(null); setError('Kode tidak dapat diverifikasi. Periksa kembali nomor tiket dan kode pelacakan.'); return; }
    const parsed = JSON.parse(raw) as Result & { secret: string };
    if (parsed.secret !== secret) { setResult(null); setError('Kode tidak dapat diverifikasi. Periksa kembali nomor tiket dan kode pelacakan.'); return; }
    setResult(parsed);
  }
  return <div className="tracking-card"><form onSubmit={submit}><label htmlFor="ticket">Nomor tiket</label><input id="ticket" name="ticket" required placeholder="D-DAS-2026-XXXXXXXX" autoComplete="off" /><label htmlFor="secret">Kode pelacakan privat</label><input id="secret" name="secret" required placeholder="16 karakter" type="password" autoComplete="off" /><button className="native-button" type="submit"><Search /> Periksa status</button>{error && <p className="form-error" role="alert">{error}</p>}</form>{result && <div className="tracking-result" aria-live="polite"><p className="form-eyebrow">STATUS TERKINI</p><h2>{result.status}</h2><p>Tiket <b>{result.ticket}</b> berhasil diverifikasi.</p><div className="timeline"><div className="done"><CheckCircle2 /><span><b>Aspirasi diterima</b><small>{new Date(result.createdAt).toLocaleDateString('id-ID', { dateStyle: 'long' })}</small></span></div><div><Circle /><span><b>Peninjauan awal</b><small>Estimasi dalam 1–2 hari kerja</small></span></div><div><Circle /><span><b>Ditugaskan ke unit terkait</b><small>Menunggu tahap sebelumnya</small></span></div></div></div>}<p className="tracking-security"><LockKeyhole /> Pencarian ini tidak masuk riwayat analytics atau indeks publik.</p></div>;
}
