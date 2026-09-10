'use client';
import { useState } from 'react';
import type { AdminPortalSnapshot } from '@/lib/admin-portal';
import type { ContentMedia } from '@/lib/content-media';
import { EditableMedia } from './editable-media';
import { uploadFiles } from './admin-rework';

export function OrganizationEditor({
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
  const empty = {
    id: '',
    name: '',
    slug: '',
    shortName: '',
    description: '',
    programs: '',
  };
  const [form, setForm] = useState(empty);
  const [media, setMedia] = useState<ContentMedia[]>([]);
  const [files, setFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  function choose(id: string) {
    const item = data.organizations.find((o) => o.id === id);
    setForm(
      item
        ? {
            id: item.id,
            name: item.name,
            slug: item.slug,
            shortName: item.short_name ?? '',
            description: item.description,
            programs: item.contact_public?.programs ?? '',
          }
        : empty,
    );
    setMedia(item?.contact_public?.media ?? []);
    setFiles([]);
    setNotice('');
  }
  if (!data.me?.roles.includes('super_admin'))
    return (
      <p>Hubungi Super Admin untuk membuat atau mengelola halaman ORMAWA.</p>
    );
  return (
    <section className="v4-panel v5-admin-form">
      <h2>Halaman Perkenalan ORMAWA</h2>
      <p>
        Buat langsung tanpa permintaan ORMAWA. Setelah disimpan, halaman
        tersedia di portal publik.
      </p>
      <fieldset disabled={busy} style={{ border: 0, padding: 0, minWidth: 0 }}>
        <label>
          Pilih halaman
          <select value={form.id} onChange={(e) => choose(e.target.value)}>
            <option value="">Buat ORMAWA Baru</option>
            {data.organizations.map((o) => (
              <option key={o.id} value={o.id}>
                {o.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Nama ORMAWA
          <input
            value={form.name}
            onChange={(e) =>
              setForm({
                ...form,
                name: e.target.value,
                slug: form.id
                  ? form.slug
                  : e.target.value
                      .toLowerCase()
                      .replace(/[^a-z0-9]+/g, '-')
                      .replace(/^-|-$/g, ''),
              })
            }
          />
        </label>
        <label>
          Singkatan
          <input
            value={form.shortName}
            onChange={(e) => setForm({ ...form, shortName: e.target.value })}
          />
        </label>
        <label>
          Alamat halaman
          <input
            value={form.slug}
            onChange={(e) => setForm({ ...form, slug: e.target.value })}
          />
        </label>
        <label>
          Perkenalan / Informasi
          <textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
        </label>
        <label>
          Daftar program kerja
          <textarea
            value={form.programs}
            onChange={(e) => setForm({ ...form, programs: e.target.value })}
            placeholder="Satu program per baris"
          />
        </label>
        <EditableMedia
          items={media}
          onChange={setMedia}
          files={files}
          onFilesChange={setFiles}
          disabled={busy}
        />
        <button
          className="primary"
          disabled={!form.name.trim() || !form.slug}
          onClick={() => {
            setBusy(true);
            setNotice('');
            void (async () => {
              try {
                const added = await uploadFiles(
                  files,
                  'public-media',
                  8 - media.length,
                  20 * 1024 * 1024,
                );
                const all = [
                  ...media,
                  ...added.map((m) => ({ ...m, url: m.publicUrl })),
                ];
                setMedia(all);
                setFiles([]);
                const result = await runAction(
                  'organization.save',
                  { ...form, contact: { media: all, programs: form.programs } },
                  'Halaman ORMAWA berhasil disimpan.',
                );
                if (result?.id)
                  setForm((current) => ({ ...current, id: result.id! }));
                setNotice('Halaman ORMAWA telah diterbitkan.');
              } catch (e) {
                setNotice(
                  e instanceof Error ? e.message : 'Penyimpanan gagal.',
                );
              } finally {
                setBusy(false);
              }
            })();
          }}
        >
          Simpan & Terbitkan Halaman
        </button>
      </fieldset>
      {notice && <p role="status">{notice}</p>}
      {form.slug && (
        <a href={`/ormawa/${form.slug}`} target="_blank" rel="noreferrer">
          Lihat halaman publik
        </a>
      )}
    </section>
  );
}

export function PeriodEditor({
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
  const [selected, setSelected] = useState('');
  const [draft, setDraft] = useState({ name: '', startsAt: '', endsAt: '' });
  const [busy, setBusy] = useState(false);
  async function act(action: string, payload: Record<string, unknown>) {
    setBusy(true);
    try {
      await runAction(
        action,
        payload,
        action === 'period.create'
          ? 'Periode dibuat. Pilih periode tersebut untuk mengaktifkannya.'
          : 'Periode aktif diperbarui di portal publik.',
      );
      if (action === 'period.create')
        setDraft({ name: '', startsAt: '', endsAt: '' });
    } catch {
    } finally {
      setBusy(false);
    }
  }
  const isAdmin = data.me?.roles.includes('super_admin');
  return (
    <fieldset
      disabled={busy || !isAdmin}
      style={{ border: 0, padding: 0, minWidth: 0 }}
    >
      <legend>Periode Kepengurusan</legend>
      <label>
        Periode aktif
        <select
          value={selected || data.periods.find((p) => p.is_current)?.id || ''}
          onChange={(e) => setSelected(e.target.value)}
        >
          <option value="">Pilih periode</option>
          {data.periods.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
              {p.is_current ? ' (aktif)' : ''}
            </option>
          ))}
        </select>
      </label>
      <p>
        Mengaktifkan periode mengubah periode acuan situs. Data unit dan konten
        periode lama tetap disimpan.
      </p>
      <button
        type="button"
        disabled={!selected}
        onClick={() => void act('period.activate', { id: selected })}
      >
        Aktifkan Periode
      </button>
      <details>
        <summary>Tambah periode baru</summary>
        <label>
          Nama periode
          <input
            value={draft.name}
            onChange={(e) => setDraft({ ...draft, name: e.target.value })}
            placeholder="2027–2028"
          />
        </label>
        <label>
          Mulai
          <input
            type="date"
            value={draft.startsAt}
            onChange={(e) => setDraft({ ...draft, startsAt: e.target.value })}
          />
        </label>
        <label>
          Selesai
          <input
            type="date"
            value={draft.endsAt}
            onChange={(e) => setDraft({ ...draft, endsAt: e.target.value })}
          />
        </label>
        <button
          type="button"
          disabled={
            !draft.name ||
            !draft.startsAt ||
            !draft.endsAt ||
            draft.endsAt <= draft.startsAt
          }
          onClick={() =>
            void act('period.create', {
              ...draft,
              slug: draft.name
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/^-|-$/g, ''),
            })
          }
        >
          Tambah Periode
        </button>
      </details>
      {!isAdmin && <p>Hanya Super Admin dapat mengubah periode.</p>}
    </fieldset>
  );
}
