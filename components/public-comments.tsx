'use client';
import { useEffect, useState } from 'react';
import { Flag, MessageCircle, Send, Trash2 } from 'lucide-react';

type Comment = {
  id: string;
  parent_id: string | null;
  depth: number;
  display_mode: string;
  display_name: string | null;
  body: string;
  published_at: string | null;
  delete_tombstone: boolean;
};
type Receipt = { commentId: string; deletionSecret: string };

export function PublicComments({ slug }: { slug: string }) {
  const threadKey = `publication:${slug}`;
  const [comments, setComments] = useState<Comment[]>([]);
  const [status, setStatus] = useState('Memuat diskusi…');
  const [error, setError] = useState('');
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [replyTo, setReplyTo] = useState<string | null>(null);
  async function load() {
    try {
      const response = await fetch(
        `/api/comments?threadKey=${encodeURIComponent(threadKey)}`,
        { cache: 'no-store' },
      );
      const result = (await response.json()) as {
        ok: boolean;
        data?: Comment[];
        message?: string;
      };
      if (!response.ok || !result.ok)
        throw new Error(result.message ?? 'Diskusi belum dapat dimuat.');
      setComments(result.data ?? []);
      setStatus('');
    } catch (reason) {
      setStatus(
        reason instanceof Error
          ? reason.message
          : 'Diskusi belum dapat dimuat.',
      );
    }
  }
  useEffect(() => {
    void load();
  }, [threadKey]);
  return (
    <section className="public-comments" aria-labelledby="discussion-title">
      <header>
        <div>
          <p className="form-eyebrow">DISKUSI PUBLIK</p>
          <h2 id="discussion-title">Tanggapan mahasiswa</h2>
        </div>
        <span>{comments.length} komentar</span>
      </header>
      <p className="comments-policy">
        Jangan kirim data pribadi atau isi aspirasi sensitif di sini. Gunakan{' '}
        <a href="/ddas/kirim">D-DAS</a> untuk hal privat.
      </p>
      {receipt && (
        <div className="comment-receipt" role="status">
          <b>Simpan kode hapus komentar ini.</b>
          <code>{receipt.deletionSecret}</code>
          <button
            type="button"
            onClick={() =>
              navigator.clipboard.writeText(receipt.deletionSecret)
            }
          >
            Salin kode
          </button>
        </div>
      )}
      {status && <div className="comment-empty">{status}</div>}
      <div className="comment-list">
        {comments.map((comment) => (
          <article
            key={comment.id}
            style={{ marginLeft: `${Math.min(comment.depth, 3) * 24}px` }}
          >
            <div>
              <span className="comment-avatar" aria-hidden="true">
                {comment.display_name?.slice(0, 1).toUpperCase() ?? 'A'}
              </span>
              <p>
                <b>{comment.display_name ?? 'Anonim'}</b>
                <small>
                  {comment.published_at
                    ? new Intl.DateTimeFormat('id-ID', {
                        dateStyle: 'medium',
                      }).format(new Date(comment.published_at))
                    : 'Menunggu penyaringan'}
                </small>
              </p>
            </div>
            <p>{comment.body}</p>
            {!comment.delete_tombstone && (
              <footer>
                <button type="button" onClick={() => setReplyTo(comment.id)}>
                  Balas
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    const category = window.prompt(
                      'Kategori laporan: spam, harassment, privacy, misinformation, atau other',
                      'spam',
                    );
                    if (!category) return;
                    const response = await fetch('/api/comments/report', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        commentId: comment.id,
                        category,
                        detail: '',
                      }),
                    });
                    const result = (await response.json()) as {
                      message?: string;
                    };
                    window.alert(result.message ?? 'Laporan diproses.');
                  }}
                >
                  <Flag /> Laporkan
                </button>
              </footer>
            )}
          </article>
        ))}
      </div>
      <form
        className="comment-form"
        onSubmit={async (event) => {
          event.preventDefault();
          setError('');
          const form = event.currentTarget;
          const data = new FormData(form);
          try {
            const response = await fetch('/api/comments', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                threadKey,
                parentId: replyTo,
                displayMode: data.get('displayMode'),
                displayName: data.get('displayName'),
                body: data.get('body'),
                website: data.get('website'),
              }),
            });
            const result = (await response.json()) as {
              ok: boolean;
              data?: Receipt;
              message?: string;
            };
            if (!response.ok || !result.ok || !result.data)
              throw new Error(result.message ?? 'Komentar belum terkirim.');
            setReceipt(result.data);
            form.reset();
            setReplyTo(null);
            await load();
          } catch (reason) {
            setError(
              reason instanceof Error
                ? reason.message
                : 'Komentar belum terkirim.',
            );
          }
        }}
      >
        <div className="comment-form-title">
          <MessageCircle />
          <div>
            <b>{replyTo ? 'Tulis balasan' : 'Tulis komentar'}</b>
            {replyTo && (
              <button type="button" onClick={() => setReplyTo(null)}>
                Batalkan balasan
              </button>
            )}
          </div>
        </div>
        {error && (
          <div className="form-error-summary" role="alert">
            {error}
          </div>
        )}
        <label htmlFor={`comment-body-${slug}`}>Komentar</label>
        <textarea
          id={`comment-body-${slug}`}
          name="body"
          minLength={2}
          maxLength={4000}
          rows={4}
          required
        />
        <div className="comment-form-row">
          <label>
            Identitas
            <select name="displayMode" defaultValue="anonymous">
              <option value="anonymous">Anonim</option>
              <option value="named">Gunakan nama</option>
            </select>
          </label>
          <label>
            Nama tampilan (jika dipilih)
            <input name="displayName" maxLength={60} />
          </label>
        </div>
        <div className="honeypot" aria-hidden="true">
          <label>
            Website
            <input name="website" tabIndex={-1} autoComplete="off" />
          </label>
        </div>
        <button className="native-button" type="submit">
          <Send />
          Kirim komentar
        </button>
      </form>
      <details className="comment-delete">
        <summary>
          <Trash2 /> Hapus komentar sendiri
        </summary>
        <form
          onSubmit={async (event) => {
            event.preventDefault();
            const data = new FormData(event.currentTarget);
            const response = await fetch('/api/comments', {
              method: 'DELETE',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                commentId: data.get('commentId'),
                deletionSecret: data.get('deletionSecret'),
              }),
            });
            const result = (await response.json()) as { message?: string };
            setError(result.message ?? 'Permintaan selesai.');
            if (response.ok) await load();
          }}
        >
          <label>
            ID komentar
            <input name="commentId" required />
          </label>
          <label>
            Kode hapus
            <input name="deletionSecret" required />
          </label>
          <button type="submit">Hapus komentar</button>
        </form>
      </details>
    </section>
  );
}
