import type { ContentMedia } from './content-media';

export function mediaKind(media: ContentMedia) {
  const path = media.url.split(/[?#]/)[0].toLowerCase();
  if (
    media.mimeType?.startsWith('image/') ||
    /\.(png|jpe?g|webp|gif|avif|svg)$/.test(path)
  )
    return 'image';
  if (
    media.mimeType?.startsWith('video/') ||
    /\.(mp4|webm|mov|m4v)$/.test(path)
  )
    return 'video';
  if (media.mimeType?.startsWith('audio/') || /\.(mp3|wav|ogg|m4a)$/.test(path))
    return 'audio';
  if (media.mimeType === 'application/pdf' || path.endsWith('.pdf'))
    return 'pdf';
  if (/\.(docx?|xlsx?|pptx?)$/.test(path)) return 'office';
  if (/\.(txt|csv)$/.test(path) || media.mimeType === 'text/plain')
    return 'text';
  return 'other';
}

export function safeMediaUrl(value: string) {
  if (/^\/(?!\/)/.test(value)) return value;
  try {
    const url = new URL(value);
    return ['http:', 'https:'].includes(url.protocol) ? url.toString() : '';
  } catch {
    return '';
  }
}

// Storage sets Content-Disposition even for cross-origin links, where the
// browser ignores the HTML download attribute. Never proxy arbitrary URLs.
export function mediaDownloadUrl(media: ContentMedia) {
  const safe = safeMediaUrl(media.url);
  if (!safe) return '';
  if (safe.startsWith('/')) return safe;
  const url = new URL(safe);
  if (
    url.hostname.endsWith('.supabase.co') &&
    url.pathname.startsWith('/storage/v1/object/public/')
  ) {
    url.searchParams.set('download', media.name || 'download');
    return url.toString();
  }
  return safe;
}
