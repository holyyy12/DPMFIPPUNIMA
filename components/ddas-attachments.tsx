'use client';
import { useEffect, useState } from 'react';
export function DdasAttachments({ caseId }: { caseId: string }) {
  const [data, setData] = useState<{
    files: { id: string; name: string; url: string; size: number }[];
    body?: string;
    legacyMissing?: number;
  }>({ files: [] });
  const [message, setMessage] = useState('Memuat lampiran…');
  useEffect(() => {
    let active = true;
    setData({ files: [] });
    setMessage('Memuat lampiran…');
    void fetch(`/api/admin/ddas/evidence?caseId=${caseId}`, {
      cache: 'no-store',
    })
      .then(async (r) => {
        const p = (await r.json()) as typeof data & {
          ok: boolean;
          message?: string;
        };
        if (!active) return;
        if (!r.ok) throw Error(p.message);
        setData(p);
        setMessage('');
      })
      .catch((e) => {
        if (active) setMessage(e.message);
      });
    return () => {
      active = false;
    };
  }, [caseId]);
  return (
    <section className="v4-panel">
      <h2>Isi dan Lampiran Pelapor</h2>
      {data.body && <p style={{ whiteSpace: 'pre-wrap' }}>{data.body}</p>}
      {message && <p role="status">{message}</p>}
      <ul className="ddas-upload-list">
        {data.files.map((f) => (
          <li key={f.id}>
            {f.url ? (
              <a href={f.url} target="_blank" rel="noreferrer">
                Unduh {f.name}
              </a>
            ) : (
              <span>{f.name} — tautan belum tersedia</span>
            )}
            <small> · {(f.size / 1024 / 1024).toFixed(2)} MB</small>
          </li>
        ))}
      </ul>
      {!!data.legacyMissing && (
        <p>
          Lampiran lama hanya menyimpan nama file, bukan isinya. Minta pelapor
          mengirim ulang berkas tersebut.
        </p>
      )}
      {!message && !data.files.length && !data.legacyMissing && (
        <p>Tidak ada lampiran pendukung.</p>
      )}
      <small>
        Lampiran privat, belum dipindai otomatis. Periksa keamanan sebelum
        membuka file.
      </small>
    </section>
  );
}
