'use client';

import { useEffect, useRef, useState } from 'react';
import type { PDFDocumentProxy } from 'pdfjs-dist';
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

export function PdfPreview({ url, name }: { url: string; name: string }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const [pdf, setPdf] = useState<PDFDocumentProxy | null>(null);
  const [page, setPage] = useState(1);
  const [error, setError] = useState('');
  const [rendering, setRendering] = useState(true);
  useEffect(() => {
    let disposed = false;
    let task:
      | ReturnType<(typeof import('pdfjs-dist'))['getDocument']>
      | undefined;
    setPdf(null);
    setPage(1);
    setError('');
    void import('pdfjs-dist')
      .then(async (library) => {
        if (disposed) return;
        library.GlobalWorkerOptions.workerSrc = workerUrl;
        task = library.getDocument({ url });
        task.onPassword = () => {
          if (!disposed)
            setError(
              'PDF ini dilindungi password. Unduh untuk membukanya dengan aplikasi PDF Anda.',
            );
        };
        const document = await task.promise;
        if (!disposed) setPdf(document);
      })
      .catch(() => {
        if (!disposed)
          setError(
            'PDF tidak dapat dimuat. Berkas mungkin tidak tersedia atau rusak. Silakan unduh untuk memeriksanya.',
          );
      });
    return () => {
      disposed = true;
      void task?.destroy();
    };
  }, [url]);
  useEffect(() => {
    if (!pdf || !canvas.current) return;
    let disposed = false;
    let render:
      | ReturnType<Awaited<ReturnType<PDFDocumentProxy['getPage']>>['render']>
      | undefined;
    setRendering(true);
    void pdf
      .getPage(page)
      .then(async (documentPage) => {
        if (disposed || !canvas.current) return;
        const viewport = documentPage.getViewport({ scale: 1.5 });
        canvas.current.width = Math.ceil(viewport.width);
        canvas.current.height = Math.ceil(viewport.height);
        render = documentPage.render({ canvas: canvas.current, viewport });
        await render.promise;
        if (!disposed) setRendering(false);
      })
      .catch(() => {
        if (!disposed) {
          setRendering(false);
          setError(
            'Halaman PDF tidak dapat ditampilkan. Silakan unduh berkas.',
          );
        }
      });
    return () => {
      disposed = true;
      render?.cancel();
    };
  }, [pdf, page]);
  return (
    <div className="pdf-preview">
      {error ? (
        <p role="alert">{error}</p>
      ) : (
        <>
          {pdf && (
            <div className="media-access-buttons pdf-preview-pagination">
              <button
                type="button"
                disabled={page <= 1 || rendering}
                onClick={() => setPage(page - 1)}
              >
                Sebelumnya
              </button>
              <span aria-live="polite">
                Halaman {page} dari {pdf.numPages}
              </span>
              <button
                type="button"
                disabled={page >= pdf.numPages || rendering}
                onClick={() => setPage(page + 1)}
              >
                Berikutnya
              </button>
            </div>
          )}
          {(!pdf || rendering) && <p role="status">Memuat halaman PDF…</p>}
          <canvas
            ref={canvas}
            aria-label={`${name}, halaman ${page}`}
            role="img"
            hidden={!pdf || rendering}
          />
        </>
      )}
    </div>
  );
}
