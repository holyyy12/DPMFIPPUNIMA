import type { MetadataRoute } from 'next';
import { publications } from '@/lib/content/publications';
import { ormawa, programs } from '@/lib/site-content';

const origin =
  process.env.NEXT_PUBLIC_SITE_URL ??
  'https://dpm-fipp-unima.xyrkix.chatgpt.site';

export default function sitemap(): MetadataRoute.Sitemap {
  const fixed = [
    '',
    '/tentang',
    '/program',
    '/ddas',
    '/d-sight',
    '/d-trace',
    '/d-dar',
    '/ormawa',
    '/berita',
    '/survei',
    '/transparansi',
    '/kebijakan/privasi',
    '/kebijakan/komentar',
    '/aksesibilitas',
    '/kontak',
    '/status',
  ];

  return [
    ...fixed.map((path) => ({
      url: `${origin}${path}`,
      lastModified: new Date('2026-09-01'),
      changeFrequency: 'weekly' as const,
      priority: path === '' ? 1 : 0.7,
    })),
    ...publications.map((item) => ({
      url: `${origin}/berita/${item.slug}`,
      lastModified: new Date('2026-08-31'),
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    })),
    ...programs.map((item) => ({
      url: `${origin}/program/${item.slug}`,
      lastModified: new Date('2026-09-01'),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    })),
    ...ormawa.map((item) => ({
      url: `${origin}/ormawa/${item.slug}`,
      lastModified: new Date('2026-09-01'),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    })),
  ];
}
