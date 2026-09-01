import type { MetadataRoute } from 'next';
export default function robots():MetadataRoute.Robots{return {rules:[{userAgent:'*',allow:['/','/berita/','/program','/ormawa','/survei','/tentang','/transparansi','/kebijakan/','/aksesibilitas','/kontak','/status'],disallow:['/admin/','/api/','/ddas/tracking']}],sitemap:'https://dpmfipp.vercel.app/sitemap.xml',host:'https://dpmfipp.vercel.app'}}
