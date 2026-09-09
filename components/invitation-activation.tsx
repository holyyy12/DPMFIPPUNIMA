'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
export function InvitationActivation() {
  const tokens = useRef({ accessToken: '', refreshToken: '' });
  const [ready, setReady] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState('');
  useEffect(() => {
    const hash = new URLSearchParams(location.hash.slice(1));
    tokens.current = {
      accessToken: hash.get('access_token') ?? '',
      refreshToken: hash.get('refresh_token') ?? '',
    };
    history.replaceState(null, '', location.pathname);
    setReady(
      Boolean(tokens.current.accessToken && tokens.current.refreshToken),
    );
    if (!tokens.current.accessToken)
      setError(
        'Tautan undangan tidak valid atau sudah kedaluwarsa. Minta Super Admin mengirim undangan baru.',
      );
  }, []);
  return (
    <form
      className="admin-auth-card"
      onSubmit={async (event) => {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        if (form.get('password') !== form.get('confirm'))
          return setError('Konfirmasi kata sandi belum sama.');
        setBusy(true);
        setError('');
        try {
          const response = await fetch('/api/admin/auth/activate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              ...tokens.current,
              password: form.get('password'),
            }),
          });
          const body = (await response.json()) as {
            ok: boolean;
            message?: string;
          };
          if (!response.ok || !body.ok) throw new Error(body.message);
          tokens.current = { accessToken: '', refreshToken: '' };
          location.replace('/admin/mfa');
        } catch (cause) {
          setError(
            cause instanceof Error
              ? cause.message
              : 'Aktivasi gagal. Coba kembali.',
          );
        } finally {
          setBusy(false);
        }
      }}
    >
      <h1>Aktifkan akun Anda</h1>
      <p>
        Buat kata sandi, lalu lanjutkan pengaturan verifikasi dua langkah untuk
        mengakses Portal Admin.
      </p>
      {error && (
        <p role="alert" className="form-error-summary">
          {error}
        </p>
      )}
      <label htmlFor="new-password">Kata sandi baru</label>
      <Input
        id="new-password"
        name="password"
        type="password"
        autoComplete="new-password"
        minLength={12}
        maxLength={256}
        required
        disabled={!ready || busy}
      />
      <small>Gunakan sedikitnya 12 karakter.</small>
      <label htmlFor="confirm-password">Ulangi kata sandi</label>
      <Input
        id="confirm-password"
        name="confirm"
        type="password"
        autoComplete="new-password"
        minLength={12}
        maxLength={256}
        required
        disabled={!ready || busy}
      />
      <Button type="submit" className="native-button" disabled={!ready || busy}>
        {busy ? 'Mengaktifkan…' : 'Simpan Kata Sandi & Lanjutkan'}
      </Button>
      <Link href="/admin/login">Kembali ke login</Link>
    </form>
  );
}
