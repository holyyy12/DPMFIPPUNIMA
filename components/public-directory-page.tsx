import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { PublicFooter } from '@/components/public-footer';
import { PublicHeader } from '@/components/public-header';

export function PublicDirectoryPage({ eyebrow, title, description, items }: { eyebrow:string; title:string; description:string; items:Array<{label:string;title:string;description:string;href:string}> }) {
  return <main><PublicHeader /><section className="info-hero"><div className="shell"><span className="form-eyebrow">{eyebrow}</span><h1>{title}</h1><p>{description}</p></div></section><section className="shell directory-grid">{items.map((item)=><article key={item.title}><span>{item.label}</span><h2>{item.title}</h2><p>{item.description}</p><Link href={item.href}>Lihat informasi <ArrowRight size={15}/></Link></article>)}</section><PublicFooter /></main>;
}
