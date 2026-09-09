import type { ContentMedia } from '@/lib/content-media';
export function ContentGallery({ items }: { items: ContentMedia[] }) {
  return (
    <div className="content-media-gallery">
      {items.map((m, i) => (
        <figure key={`${m.url}-${i}`}>
          {m.mimeType?.startsWith('video/') ||
          /\.(mp4|webm|mov)(\?|$)/i.test(m.url) ? (
            <video
              controls
              preload="metadata"
              src={m.url}
              aria-label={m.name}
            />
          ) : m.mimeType?.startsWith('image/') ||
            /\.(png|jpe?g|webp|gif|avif)(\?|$)/i.test(m.url) ? (
            <a href={m.url} target="_blank" rel="noreferrer">
              <img loading="lazy" src={m.url} alt={m.name} />
            </a>
          ) : (
            <a href={m.url} target="_blank" rel="noreferrer">
              Buka {m.name}
            </a>
          )}
          <figcaption>{m.name}</figcaption>
        </figure>
      ))}
    </div>
  );
}
