import Link from 'next/link';
import { ArrowLeft, Landmark } from 'lucide-react';

export function PortalHeader({ backLabel = 'Kembali ke beranda' }: { backLabel?: string }) {
  return (
    <header className="site-header">
      <div className="shell flex h-20 items-center justify-between gap-5">
        <Link className="brand" href="/" aria-label="DPM FIPP UNIMA, Beranda">
          <span className="brand-mark" aria-hidden="true"><Landmark size={21} /></span>
          <span><strong>DPM FIPP</strong><small>UNIVERSITAS NEGERI MANADO</small></span>
        </Link>
        <Link className="back-link" href="/"><ArrowLeft size={16} /> {backLabel}</Link>
      </div>
    </header>
  );
}
