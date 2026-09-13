'use client';
import { useState } from 'react';
import type { AdminPortalSnapshot } from '@/lib/admin-portal';

type Props = {
  data: AdminPortalSnapshot;
  runAction: (
    action: string,
    payload: Record<string, unknown>,
    success?: string,
  ) => Promise<unknown>;
};
const blankUnit = { id: '', name: '', code: '', description: '' };

export function OrmawaUnitsAdmin({ data, runAction }: Props) {
  const [form, setForm] = useState(blankUnit);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const canManage = data.me?.roles.includes('super_admin');
  return (
    <div className="v5-admin-layout">
      <section className="v4-panel">
        <header>
          <div>
            <h2>ORMAWA Units</h2>
            <p>
              Identitas organisasi untuk akun dengan role ORMAWA. Terpisah dari
              unit internal DPM.
            </p>
          </div>
        </header>
        <div className="v5-admin-list">
          {data.ormawaUnits.map((unit) => (
            <article key={unit.id}>
              <span style={{ minWidth: 0 }}>
                <b>{unit.name}</b>
                <small>
                  {unit.code} · Role ORMAWA ·{' '}
                  {
                    data.users.filter((user) =>
                      user.roles.some((role) => role.ormawaUnitId === unit.id),
                    ).length
                  }{' '}
                  pengguna
                </small>
                {unit.description && <p>{unit.description}</p>}
              </span>
              {canManage && (
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => {
                    setForm({
                      id: unit.id,
                      name: unit.name,
                      code: unit.code,
                      description: unit.description,
                    });
                    setError('');
                  }}
                >
                  Edit
                </button>
              )}
            </article>
          ))}
          {!data.ormawaUnits.length && (
            <p className="v5-filter-empty">
              Belum ada ORMAWA Unit. Tambahkan BEM, KPRM, HIMAPSI, atau
              organisasi lainnya.
            </p>
          )}
        </div>
      </section>
      {canManage && (
        <form
          className="v4-panel v5-admin-form"
          onSubmit={async (event) => {
            event.preventDefault();
            setBusy(true);
            setError('');
            try {
              await runAction('ormawa.unit.save', form);
              setForm(blankUnit);
            } catch (cause) {
              setError(
                cause instanceof Error
                  ? cause.message
                  : 'Gagal menyimpan unit.',
              );
            } finally {
              setBusy(false);
            }
          }}
        >
          <h2>{form.id ? 'Edit ORMAWA Unit' : 'Tambah ORMAWA Unit'}</h2>
          <p>Unit tidak membuat role baru atau menerbitkan halaman publik.</p>
          <fieldset
            disabled={busy}
            style={{ border: 0, padding: 0, minWidth: 0 }}
          >
            <label>
              Nama organisasi
              <input
                required
                minLength={2}
                maxLength={180}
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Badan Eksekutif Mahasiswa FIPP"
              />
            </label>
            <label>
              Kode unit
              <input
                required
                minLength={2}
                maxLength={40}
                pattern="[A-Za-z0-9][A-Za-z0-9_-]{1,39}"
                value={form.code}
                onChange={(e) =>
                  setForm({ ...form, code: e.target.value.toUpperCase() })
                }
                placeholder="BEM"
              />
            </label>
            <label>
              Deskripsi (opsional)
              <textarea
                maxLength={4000}
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
              />
            </label>
            <button className="primary" type="submit">
              {busy
                ? 'Menyimpan…'
                : form.id
                  ? 'Simpan Perubahan'
                  : 'Tambah ORMAWA Unit'}
            </button>
            {form.id && (
              <button
                type="button"
                onClick={() => {
                  setForm(blankUnit);
                  setError('');
                }}
              >
                Batal Edit
              </button>
            )}
          </fieldset>
          {error && <p role="alert">{error}</p>}
        </form>
      )}
    </div>
  );
}

export function OrmawaUnitAssignment({
  data,
  runAction,
  user,
}: Props & { user: AdminPortalSnapshot['users'][number] }) {
  const current =
    user.roles.find((role) => role.key === 'ormawa')?.ormawaUnitId ?? '';
  const [selected, setSelected] = useState(current);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  return (
    <form
      onSubmit={async (event) => {
        event.preventDefault();
        setBusy(true);
        setNotice('');
        try {
          await runAction('ormawa.unit.assign', {
            id: selected,
            userId: user.id,
          });
          setNotice('Unit pengguna diperbarui.');
        } catch (cause) {
          setNotice(
            cause instanceof Error ? cause.message : 'Gagal menyimpan unit.',
          );
        } finally {
          setBusy(false);
        }
      }}
    >
      <label style={{ display: 'block', marginTop: '0.75rem' }}>
        ORMAWA Unit
        <select
          aria-label={`ORMAWA Unit untuk ${user.display_name}`}
          value={selected}
          disabled={busy}
          style={{ width: '100%', maxWidth: '100%' }}
          onChange={(event) => setSelected(event.target.value)}
        >
          <option value="">Belum ditentukan</option>
          {data.ormawaUnits
            .filter((unit) => unit.status === 'active')
            .map((unit) => (
              <option key={unit.id} value={unit.id}>
                {unit.code} — {unit.name}
              </option>
            ))}
        </select>
      </label>
      <button
        type="submit"
        disabled={busy || !selected || selected === current}
      >
        {busy ? 'Menyimpan…' : 'Simpan Unit'}
      </button>
      {notice && <p role="status">{notice}</p>}
    </form>
  );
}
