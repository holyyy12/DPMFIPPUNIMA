import { redirect } from 'next/navigation';

// Keep old bookmarks working without enrollment or a challenge.
export default function Page() {
  redirect('/admin/dashboard');
}
