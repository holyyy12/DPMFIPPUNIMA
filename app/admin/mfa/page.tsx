import Link from 'next/link';
import { AdminMfaForm } from '@/components/admin-mfa-form';
export default function Page(){return <main className="admin-auth-page"><Link className="admin-auth-back" href="/admin/login">← Kembali ke login</Link><AdminMfaForm/></main>}

