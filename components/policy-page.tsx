import type { ReactNode } from 'react';
import { PublicFooter } from '@/components/public-footer';
import { PublicHeader } from '@/components/public-header';

export function PolicyPage({ eyebrow, title, lead, children }: { eyebrow:string; title:string; lead:string; children:ReactNode }) {
  return <main><PublicHeader /><section className="info-hero"><div className="shell"><span className="form-eyebrow">{eyebrow}</span><h1>{title}</h1><p>{lead}</p></div></section><article className="shell policy-page">{children}</article><PublicFooter /></main>;
}
