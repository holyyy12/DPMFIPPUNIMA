'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ArrowRight, Vote } from 'lucide-react';

type Survey = {
  id: string;
  title: string;
  options: string[];
  responses: number;
  results: { option: string; count: number }[];
};

export function HomeSurveyCard() {
  const [survey, setSurvey] = useState<Survey | null>(null);
  const [message, setMessage] = useState('Memuat survei…');
  useEffect(() => {
    let controller: AbortController;
    async function load() {
      controller?.abort();
      controller = new AbortController();
      const signal = controller.signal;
      try {
        const response = await fetch('/api/surveys', {
          cache: 'no-store',
          signal,
        });
        const payload = (await response.json()) as {
          ok: boolean;
          data?: Survey[];
        };
        if (!response.ok || !payload.ok) throw new Error('survey_unavailable');
        if (signal.aborted) return;
        setSurvey(payload.data?.[0] ?? null);
        setMessage(payload.data?.length ? '' : 'Belum ada survei aktif.');
      } catch {
        if (!signal.aborted)
          setMessage(
            'Hasil survei belum dapat dimuat. Buka halaman survei untuk mencoba kembali.',
          );
      }
    }
    void load();
    window.addEventListener('focus', load);
    return () => {
      controller?.abort();
      window.removeEventListener('focus', load);
    };
  }, []);
  return (
    <article>
      <header>
        <span>
          <Vote />
        </span>
        <h2>D-SIGHT Survei</h2>
      </header>
      <div className="home-survey-summary" aria-live="polite">
        {message ? (
          <p role="status">{message}</p>
        ) : (
          survey && (
            <>
              <h3>{survey.title}</h3>
              {survey.options.slice(0, 3).map((option) => {
                const count =
                  survey.results.find((result) => result.option === option)
                    ?.count ?? 0;
                const percent =
                  survey.responses > 0
                    ? Math.min(
                        100,
                        Math.max(
                          0,
                          Math.round((count / survey.responses) * 100),
                        ),
                      )
                    : 0;
                return (
                  <div className="home-survey-result" key={option}>
                    <div>
                      <span>{option}</span>
                      <strong>{percent}%</strong>
                    </div>
                    <progress
                      value={percent}
                      max={100}
                      aria-label={`${option}: ${count} suara (${percent}%)`}
                    />
                  </div>
                );
              })}
              <small>{survey.responses} respons masuk · hasil sementara</small>
              {survey.options.length > 3 && (
                <small>Semua pilihan tersedia di halaman survei.</small>
              )}
            </>
          )
        )}
      </div>
      <footer>
        <Link href="/survei">
          Pilih Isu <ArrowRight />
        </Link>
      </footer>
    </article>
  );
}
