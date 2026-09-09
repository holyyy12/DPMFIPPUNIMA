'use client';

import { ContentGallery } from './content-gallery';
import type { ContentMedia } from '@/lib/content-media';

export function EditableMedia({
  items,
  onChange,
  files,
  onFilesChange,
  documents = false,
  limit = 8,
  disabled = false,
}: {
  items: ContentMedia[];
  onChange: (items: ContentMedia[]) => void;
  files: File[];
  onFilesChange: (files: File[]) => void;
  documents?: boolean;
  limit?: number;
  disabled?: boolean;
}) {
  return (
    <fieldset
      disabled={disabled}
      style={{ minWidth: 0, border: 0, padding: 0 }}
    >
      <legend>Media dan lampiran</legend>
      <p>
        Maksimal {limit} file, 20 MB per file. Untuk mengganti file, lepaskan
        file lama lalu tambahkan penggantinya. Perubahan berlaku setelah
        disimpan.
      </p>
      {items.map((item, index) => (
        <div key={`${item.url}-${index}`} style={{ marginBottom: '1rem' }}>
          <ContentGallery items={[item]} />
          <label>
            Nama / keterangan file {index + 1}
            <input
              value={item.name}
              maxLength={255}
              onChange={(event) =>
                onChange(
                  items.map((value, position) =>
                    position === index
                      ? { ...value, name: event.target.value }
                      : value,
                  ),
                )
              }
            />
          </label>
          <button
            type="button"
            onClick={() =>
              onChange(items.filter((_, position) => position !== index))
            }
          >
            Lepaskan {item.name}
          </button>
        </div>
      ))}
      {!items.length && <p>Belum ada file terpasang.</p>}
      <label>
        Tambahkan{' '}
        {documents ? 'gambar, video, atau dokumen kajian' : 'gambar atau video'}
        <input
          type="file"
          multiple
          accept={
            documents
              ? 'image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt'
              : 'image/*,video/*'
          }
          onChange={(event) => {
            onFilesChange([...files, ...Array.from(event.target.files ?? [])]);
            event.target.value = '';
          }}
        />
      </label>
      {files.map((file, index) => (
        <p key={`${file.name}-${index}`}>
          {file.name}{' '}
          <button
            type="button"
            onClick={() =>
              onFilesChange(files.filter((_, position) => position !== index))
            }
          >
            Batalkan file ini
          </button>
        </p>
      ))}
      {items.length + files.length > limit && (
        <p role="alert">
          Jumlah file melebihi {limit}. Lepaskan atau batalkan beberapa file
          sebelum menyimpan.
        </p>
      )}
      <small>Melepas lampiran tidak menghapus file dari pustaka media.</small>
    </fieldset>
  );
}
