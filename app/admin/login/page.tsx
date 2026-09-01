import Link from 'next/link';
import { AdminLoginForm } from '@/components/admin-login-form';
export default function Page(){return <main className="admin-auth-page"><Link className="admin-auth-back" href="/">← Kembali ke portal publik</Link><AdminLoginForm/></main>}

