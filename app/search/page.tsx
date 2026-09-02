import Link from 'next/link';
import { ArrowRight, Search } from 'lucide-react';
import { PublicFooter } from '@/components/public-footer';
import { PublicHeader } from '@/components/public-header';
import { emptyPublicPortal, type PublicPortalSnapshot } from '@/lib/public-portal';
import { supabaseRpc } from '@/lib/supabase/rest';

function contentHref(type: string | undefined, slug: string) {
  if (type === 'program') return `/program/${slug}`;
  if (type === 'd-trace') return '/d-trace';
  if (type === 'd-dar') return '/d-dar';
  return `/berita/${slug}`;
}

export default async function Page({ searchParams }: { searchParams: Promise<{ q?: string; type?: string }> }) {
  const params = await searchParams;
  const query = (params.q ?? '').trim().toLowerCase();
  const type = (params.type ?? '').trim().toLowerCase();
  let snapshot: PublicPortalSnapshot = emptyPublicPortal;
  try { snapshot = await supabaseRpc<PublicPortalSnapshot>('get_public_portal_snapshot', {}, { noStore: true }); } catch { /* Render a truthful empty state when the public data service is unavailable. */ }
  const results = snapshot.contents.filter((item) =>
    (!query || `${item.title} ${item.summary} ${item.content_type ?? ''}`.toLowerCase().includes(query)) &&
    (!type || item.content_type === type),
  );
  return <main><PublicHeader /><section className="listing-hero"><div className="shell"><span className="form-eyebrow">PENCARIAN PUBLIK</span><h1>Temukan informasi resmi.</h1><form className="listing-search" action="/search"><Search /><label className="sr-only" htmlFor="search-q">Cari publikasi</label><input id="search-q" name="q" defaultValue={params.q} placeholder="Cari judul atau topik…" /><button type="submit">Cari</button></form></div></section><section className="shell search-results"><p>{results.length ? `${results.length} hasil ditemukan` : 'Tidak ada hasil yang sesuai.'}</p>{!results.length && <div className="empty-state"><h2>Belum ada data yang cocok</h2><p>Periksa ejaan atau gunakan kata pencarian yang lebih umum.</p><Link href="/berita">Lihat semua publikasi</Link></div>}{results.map((item) => { const href = contentHref(item.content_type, item.slug); return <article key={item.id}><span>{item.content_type?.toUpperCase() ?? 'PUBLIKASI'}</span><h2><Link href={href}>{item.title}</Link></h2><p>{item.summary}</p><Link href={href}>Buka <ArrowRight /></Link></article>; })}</section><PublicFooter /></main>;
}
