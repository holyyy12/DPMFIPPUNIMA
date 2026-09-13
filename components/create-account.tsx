'use client';
import { useState } from 'react';
import type { AdminPortalSnapshot } from '@/lib/admin-portal';

export function CreateAccount({
  data,
  runAction,
}: {
  data: AdminPortalSnapshot;
  runAction: (
    action: string,
    payload: Record<string, unknown>,
    success?: string,
  ) => Promise<{ id?: string } | undefined>;
}) {
  const [form, setForm] = useState({
    displayName: '',
    email: '',
    roleKey: 'ormawa',
    unitId: '',
    ormawaUnitId: '',
    password: '',
  });
  const [busy, setBusy] = useState(false);
  const [created, setCreated] = useState(false);
  const [notice, setNotice] = useState('');
  const update = (field: keyof typeof form, value: string) => {
    setForm((current) => ({
      ...current,
      [field]: value,
      ...(field === 'roleKey' ? { unitId: '', ormawaUnitId: '' } : {}),
    }));
    setCreated(false);
  };
  const generate = () =>
    update(
      'password',
      'Aa1!' +
        Array.from(crypto.getRandomValues(new Uint8Array(16)), (n) =>
          n.toString(16).padStart(2, '0'),
        ).join(''),
    );
  if (!data.me?.roles.includes('super_admin'))
    return <p>Pembuatan akun hanya tersedia untuk Super Admin.</p>;
  return (
    <section className="v4-panel v5-admin-form">
      <h2>Tambah Akun</h2>
      <p>
        Super Admin membuat akun dan password. Undangan email tidak diperlukan.
      </p>
      <fieldset disabled={busy} style={{ border: 0, padding: 0, minWidth: 0 }}>
        <label>
          Nama
          <input
            value={form.displayName}
            onChange={(e) => update('displayName', e.target.value)}
          />
        </label>
        <label>
          Email
          <input
            type="email"
            value={form.email}
            onChange={(e) => update('email', e.target.value)}
            autoComplete="off"
          />
        </label>
        <label>
          Password acak
          <input
            value={form.password}
            readOnly
            autoComplete="off"
            spellCheck={false}
          />
        </label>
        <button type="button" onClick={generate}>
          Buat Password Acak
        </button>
        <button
          type="button"
          disabled={!form.password}
          onClick={() =>
            void navigator.clipboard
              .writeText(form.password)
              .then(() => setNotice('Password disalin.'))
              .catch(() =>
                setNotice('Salin password secara manual dari kolom di atas.'),
              )
          }
        >
          Salin Password
        </button>
        <label>
          Role
          <select
            value={form.roleKey}
            onChange={(e) => update('roleKey', e.target.value)}
          >
            {data.roles.map((role) => (
              <option key={role.id} value={role.key}>
                {role.name}
              </option>
            ))}
          </select>
        </label>
        {form.roleKey === 'ormawa' ? (
          <label>
            ORMAWA Unit
            <select
              value={form.ormawaUnitId}
              onChange={(e) => update('ormawaUnitId', e.target.value)}
              required
            >
              <option value="">Pilih ORMAWA Unit</option>
              {data.ormawaUnits
                .filter((unit) => unit.status === 'active')
                .map((unit) => (
                  <option key={unit.id} value={unit.id}>
                    {unit.code} — {unit.name}
                  </option>
                ))}
            </select>
            {!data.ormawaUnits.length && (
              <small>Buat unit terlebih dahulu di tab ORMAWA Units.</small>
            )}
          </label>
        ) : (
          <label>
            Unit DPM
            <select
              value={form.unitId}
              onChange={(e) => update('unitId', e.target.value)}
            >
              <option value="">Tanpa unit khusus</option>
              {data.units.map((unit) => (
                <option key={unit.id} value={unit.id}>
                  {unit.name}
                </option>
              ))}
            </select>
          </label>
        )}
        <button
          className="primary"
          disabled={
            created ||
            !form.password ||
            !form.email ||
            !form.displayName ||
            (form.roleKey === 'ormawa' && !form.ormawaUnitId) ||
            (form.roleKey === 'organization_unit' && !form.unitId)
          }
          onClick={() => {
            setBusy(true);
            setNotice('');
            void runAction('user.create', form)
              .then(() => {
                setCreated(true);
                setNotice(
                  'Akun berhasil dibuat. Salin password sekarang dan sampaikan secara pribadi. Password tidak dapat ditampilkan kembali dari database.',
                );
              })
              .catch(() => {})
              .finally(() => setBusy(false));
          }}
        >
          {busy ? 'Membuat akun…' : created ? 'Akun sudah dibuat' : 'Buat Akun'}
        </button>
      </fieldset>
      {notice && <p role="status">{notice}</p>}
    </section>
  );
}
