import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, CalendarDays } from 'lucide-react';
import { PublicFooter } from '@/components/public-footer';
import { PublicHeader } from '@/components/public-header';
import { findPublication, publications } from '@/lib/content/publications';
import { PublicComments } from '@/components/public-comments';

export async function generateMetadata({params}:{params:Promise<{slug:string}>}):Promise<Metadata>{const {slug}=await params;const item=findPublication(slug);return item?{title:`${item.title} — DPM FIPP UNIMA`,description:item.summary,openGraph:{title:item.title,description:item.summary,images:[]},twitter:{title:item.title,description:item.summary,images:[]}}:{title:'Publikasi tidak ditemukan'}}
export function generateStaticParams(){return publications.map(({slug})=>({slug}))}
export default async function Page({params}:{params:Promise<{slug:string}>}){const {slug}=await params;const item=findPublication(slug);if(!item)return <main><PublicHeader/><section className="info-hero"><div className="shell"><h1>Publikasi tidak ditemukan.</h1><Link href="/berita">Kembali ke pusat informasi</Link></div></section><PublicFooter/></main>;return <main><PublicHeader/><article className="publication-detail"><div className="shell narrow-shell"><nav aria-label="Breadcrumb" className="breadcrumb"><Link href="/">Beranda</Link><span>/</span><Link href="/berita">Informasi</Link><span>/</span><span aria-current="page">{item.type}</span></nav><span className="form-eyebrow">{item.type}</span><h1>{item.title}</h1><p className="publication-lead">{item.summary}</p><p className="publication-date"><CalendarDays/> {item.date} · Data preview sintetis</p>{item.body.map((paragraph)=><p key={paragraph}>{paragraph}</p>)}<div className="publication-tags">{item.tags.map((tag)=><Link href={`/search?q=${encodeURIComponent(tag)}`} key={tag}>#{tag}</Link>)}</div><Link className="back-link" href="/berita"><ArrowLeft/> Kembali ke publikasi</Link><PublicComments slug={slug}/></div></article><PublicFooter/></main>}
