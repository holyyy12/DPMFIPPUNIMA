import type { Metadata } from 'next';
import { Geist, Manrope } from 'next/font/google';
import './globals.css';
import { supabaseRpc } from '@/lib/supabase/rest';

const geist = Geist({ variable: '--font-body', subsets: ['latin'] });
const manrope = Manrope({ variable: '--font-display', subsets: ['latin'] });

export async function generateMetadata():Promise<Metadata> {
  let home:{favicon?:string;socialPreview?:string}|undefined;
  try { const snapshot=await supabaseRpc<{settings?:Record<string,unknown>}>('get_public_portal_snapshot',{}, {noStore:true}); home=snapshot.settings?.['site.home'] as typeof home; } catch { /* build-time fallback */ }
  const preview=home?.socialPreview||'/og.png'; const favicon=home?.favicon||'/dpm-crest.png';
  return { metadataBase:new URL(process.env.NEXT_PUBLIC_SITE_URL||'https://dpmfippunima.vercel.app'), title:'DPM FIPP UNIMA — Suara Mahasiswa, Dikawal Bersama', description:'Portal resmi DPM FIPP UNIMA untuk aspirasi mahasiswa, kajian, pengawasan, publikasi, dan transparansi kelembagaan.', icons:{icon:favicon}, openGraph:{title:'DPM FIPP UNIMA',description:'Suara mahasiswa, dikawal bersama.',images:[{url:preview,width:1200,height:630,alt:'DPM FIPP UNIMA — Suara mahasiswa, dikawal bersama.'}],locale:'id_ID',type:'website'}, twitter:{card:'summary_large_image',title:'DPM FIPP UNIMA',description:'Suara mahasiswa, dikawal bersama.',images:[preview]} };
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="id"><body className={`${geist.variable} ${manrope.variable}`}>{children}</body></html>;
}
