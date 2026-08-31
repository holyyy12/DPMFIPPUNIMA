import type { Metadata } from 'next';
import { Geist, Manrope } from 'next/font/google';
import './globals.css';

const geist = Geist({ variable: '--font-body', subsets: ['latin'] });
const manrope = Manrope({ variable: '--font-display', subsets: ['latin'] });

export const metadata: Metadata = {
  metadataBase: new URL('https://dpmfipp.vercel.app'),
  title: 'DPM FIPP UNIMA — Suara Mahasiswa, Dikawal Bersama',
  description: 'Portal resmi DPM FIPP UNIMA untuk aspirasi mahasiswa, kajian, pengawasan, publikasi, dan transparansi kelembagaan.',
  openGraph: {
    title: 'DPM FIPP UNIMA',
    description: 'Suara mahasiswa, dikawal bersama.',
    images: [{ url: '/og.png', width: 1200, height: 630, alt: 'DPM FIPP UNIMA — Suara mahasiswa, dikawal bersama.' }],
    locale: 'id_ID',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'DPM FIPP UNIMA',
    description: 'Suara mahasiswa, dikawal bersama.',
    images: ['/og.png'],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="id"><body className={`${geist.variable} ${manrope.variable}`}>{children}</body></html>;
}
