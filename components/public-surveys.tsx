'use client';
import { useEffect, useState } from 'react';
type Survey = {
  id: string;
  title: string;
  options: string[];
  responses: number;
  results: { option: string; count: number }[];
};
export function PublicSurveys() {
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [message, setMessage] = useState('Memuat survei…');
  const [busy, setBusy] = useState('');
  async function load() {
    const r = await fetch('/api/surveys', { cache: 'no-store' });
    const p = (await r.json()) as {
      ok: boolean;
      data?: Survey[];
      message?: string;
    };
    if (!r.ok) throw Error(p.message);
    setSurveys(p.data ?? []);
  }
  useEffect(() => {
    void load()
      .then(() => setMessage(''))
      .catch(() => setMessage('Survei belum dapat dimuat.'));
  }, []);
  return (
    <>
      <p className="survey-feedback" role="status">
        {message}
      </p>
      <div className="v5-survey-grid">
        {surveys.map((s) => (
          <article key={s.id}>
            <h3>{s.title}</h3>
            <p>{s.responses} respons masuk</p>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const f = new FormData(e.currentTarget);
                setBusy(s.id);
                try {
                  const r = await fetch('/api/surveys', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      id: s.id,
                      option: f.get('option'),
                      consent: f.get('consent') === 'on',
                    }),
                  });
                  const p = (await r.json()) as {
                    ok: boolean;
                    message: string;
                  };
                  setMessage(p.message);
                  if (p.ok) await load();
                } catch {
                  setMessage('Pilihan belum tersimpan. Coba kembali.');
                } finally {
                  setBusy('');
                }
              }}
            >
              {s.options.map((o, i) => (
                <label className="survey-choice" key={i}>
                  <input type="radio" name="option" value={o} required />
                  <span>
                    {o} · {s.results.find((r) => r.option === o)?.count ?? 0}{' '}
                    suara
                  </span>
                </label>
              ))}
              <label className="survey-choice">
                <input type="checkbox" name="consent" required />
                <span>
                  Saya setuju memilih satu isu prioritas yang paling dibutuhkan.
                </span>
              </label>
              <button className="native-button" disabled={!!busy}>
                {busy === s.id ? 'Menyimpan…' : 'Kirim Pilihan Isu'}
              </button>
            </form>
          </article>
        ))}
      </div>
      {!message && !surveys.length && <p>Belum ada survei yang dibuka.</p>}
    </>
  );
}
