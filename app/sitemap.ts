import type { MetadataRoute } from 'next';
import { publications } from '@/lib/content/publications';
const origin='https://dpmfipp.vercel.app';
export default function sitemap():MetadataRoute.Sitemap{const fixed=['','/berita','/program','/ormawa','/survei','/tentang','/transparansi','/kebijakan/privasi','/kebijakan/komentar','/aksesibilitas','/kontak','/status'];return [...fixed.map((path)=>({url:`${origin}${path}`,lastModified:new Date('2026-09-01'),changeFrequency:'weekly' as const,priority:path===''?1:.7})),...publications.map((item)=>({url:`${origin}/berita/${item.slug}`,lastModified:new Date('2026-08-31'),changeFrequency:'monthly' as const,priority:.6}))]}
