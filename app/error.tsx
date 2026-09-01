'use client';
import Link from 'next/link';
export default function ErrorPage({reset}:{error:Error&{digest?:string};reset:()=>void}){return <main className="error-page"><section><span>TERJADI KENDALA</span><h1>Halaman belum dapat dimuat.</h1><p>Input Anda tidak akan dikirim ulang otomatis. Coba sekali lagi atau kembali ke beranda.</p><div><button className="native-button" onClick={reset}>Coba lagi</button><Link className="native-button outline" href="/">Beranda</Link></div></section></main>}
