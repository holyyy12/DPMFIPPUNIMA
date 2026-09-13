'use client';
import { useRef, useState } from 'react';
import { Download, Eye, X } from 'lucide-react';
import type { ContentMedia } from '@/lib/content-media';
import { mediaDownloadUrl, mediaKind, safeMediaUrl } from '@/lib/media-access';

export function MediaActions({ media }: { media: ContentMedia }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState('');
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const url = safeMediaUrl(media.url);
  const kind = mediaKind(media);
  async function preview() {
    setOpen(true);
    setError('');
    dialog.current?.showModal();
    if (kind === 'text') {
      setText('Memuat dokumen…');
      try {
        const response = await fetch(url);
        if (!response.ok) throw new Error();
        const value = await response.text();
        setText(value.slice(0, 500000));
      } catch {
        setText('');
        setError(
          'Pratinjau tidak dapat dimuat. Anda tetap dapat mengunduh file.',
        );
      }
    }
  }
  async function download(event: React.MouseEvent<HTMLAnchorElement>) {
    const target = mediaDownloadUrl(media);
    if (!target || target !== url || url.startsWith('/')) return;
    // External servers may not honor download; use a CORS-authorized blob.
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error();
      const blobUrl = URL.createObjectURL(await response.blob());
      const anchor = document.createElement('a');
      anchor.href = blobUrl;
      anchor.download = media.name;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      setTimeout(() => URL.revokeObjectURL(blobUrl), 60000);
    } catch {
      setError(
        'Server asal tidak mengizinkan unduhan langsung. Buka pratinjau untuk memeriksa berkas.',
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="media-access">
      <div className="media-access-buttons">
        <button type="button" disabled={!url} onClick={() => void preview()}>
          <Eye /> Lihat
        </button>
        {url && (
          <a
            href={mediaDownloadUrl(media)}
            download={media.name}
            onClick={(event) => {
              if (busy) event.preventDefault();
              else void download(event);
            }}
            aria-disabled={busy}
          >
            <Download /> {busy ? 'Mengunduh…' : 'Unduh'}
          </a>
        )}
      </div>
      {error && !open && <small role="alert">{error}</small>}
      <dialog
        ref={dialog}
        className="media-preview-dialog"
        onClose={() => {
          setOpen(false);
          setText('');
        }}
      >
        <div className="media-preview-header">
          <h2>{media.name}</h2>
          <button
            type="button"
            onClick={() => dialog.current?.close()}
            aria-label="Tutup pratinjau"
          >
            <X />
          </button>
        </div>
        {open && (
          <div className="media-preview-content">
            {kind === 'image' ? (
              <img src={url} alt={media.name} />
            ) : kind === 'video' ? (
              <video
                src={url}
                controls
                autoPlay={false}
                onError={() =>
                  setError(
                    'Format video ini tidak didukung browser. Silakan unduh berkas.',
                  )
                }
              />
            ) : kind === 'audio' ? (
              <audio src={url} controls />
            ) : kind === 'pdf' ? (
              <iframe src={url} title={`Pratinjau ${media.name}`} />
            ) : kind === 'office' && /^https?:/.test(url) ? (
              <>
                <p>
                  Dokumen publik ini ditampilkan melalui Microsoft Office
                  Viewer.
                </p>
                <iframe
                  src={`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(url)}`}
                  title={`Pratinjau ${media.name}`}
                  referrerPolicy="no-referrer"
                />
              </>
            ) : kind === 'text' ? (
              <pre>{text}</pre>
            ) : (
              <p>
                Format berkas ini belum dapat ditampilkan oleh browser. Gunakan
                Unduh untuk membukanya di perangkat Anda.
              </p>
            )}
            {error && <p role="alert">{error}</p>}
          </div>
        )}
        <div className="media-access-buttons">
          <a
            href={mediaDownloadUrl(media)}
            download={media.name}
            onClick={(event) => void download(event)}
          >
            <Download /> Unduh berkas
          </a>
        </div>
      </dialog>
    </div>
  );
}
