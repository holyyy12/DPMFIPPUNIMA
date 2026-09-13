import type { PublicContent } from './public-portal';
export type ContentMedia = {
  url: string;
  name: string;
  mimeType?: string;
  assetId?: string;
  size?: number;
};
export function contentMedia(item: PublicContent): ContentMedia[] {
  const body = item.body as
    | { attachments?: unknown[]; attachment?: unknown }
    | undefined;
  const program = item.seo?.program as
    | { documentation?: unknown[] }
    | undefined;
  const values =
    program?.documentation ??
    body?.attachments ??
    (body?.attachment ? [body.attachment] : []);
  const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, '');
  const fallback =
    item.featured_object_path &&
    item.featured_bucket !== 'private-media' &&
    baseUrl
      ? [
          {
            url: `${baseUrl}/storage/v1/object/public/${item.featured_bucket ?? 'public-media'}/${item.featured_object_path.split('/').map(encodeURIComponent).join('/')}`,
            name: item.title,
          },
        ]
      : [];
  return (Array.isArray(values) && values.length ? values : fallback).flatMap(
    (value) => {
      const m = value as {
        url?: string;
        publicUrl?: string;
        name?: string;
        mimeType?: string;
        assetId?: string;
        size?: number;
        bucket?: string;
        objectPath?: string;
      };
      if (!m || typeof m !== 'object') return [];
      const base = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, '');
      const stored =
        m.bucket === 'public-media' && m.objectPath && base
          ? `${base}/storage/v1/object/public/public-media/${m.objectPath.split('/').map(encodeURIComponent).join('/')}`
          : '';
      const url = m.url ?? m.publicUrl ?? stored;
      return typeof url === 'string' &&
        (/^https?:\/\//.test(url) || /^\/(?!\/)/.test(url))
        ? [
            {
              url,
              name: m.name ?? 'Dokumentasi',
              mimeType: m.mimeType,
              assetId: m.assetId,
              size: m.size,
            },
          ]
        : [];
    },
  );
}
