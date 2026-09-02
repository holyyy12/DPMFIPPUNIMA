'use client';

import { useCallback, useEffect, useState } from 'react';
import { AdminPortalSnapshot, emptyAdminPortal } from '@/lib/admin-portal';

export function useAdminPortal() {
  const [data, setData] = useState<AdminPortalSnapshot>(emptyAdminPortal);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const reload = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/admin/portal', { cache: 'no-store' });
      const body = await response.json() as { ok: boolean; data?: AdminPortalSnapshot; message?: string };
      if (!response.ok || !body.ok || !body.data) throw new Error(body.message || 'Gagal memuat data.');
      setData(body.data);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Gagal memuat data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void reload(); }, [reload]);

  const runAction = useCallback(async (action: string, payload: Record<string, unknown> = {}, success = 'Perubahan berhasil disimpan.') => {
    setError('');
    setMessage('');
    const response = await fetch('/api/admin/portal', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, payload }),
    });
    const body = await response.json() as { ok: boolean; message?: string };
    if (!response.ok || !body.ok) {
      const detail = body.message || 'Aksi gagal dijalankan.';
      setError(detail);
      throw new Error(detail);
    }
    setMessage(success);
    await reload();
  }, [reload]);

  return { data, loading, error, message, reload, runAction, setMessage, setError };
}
