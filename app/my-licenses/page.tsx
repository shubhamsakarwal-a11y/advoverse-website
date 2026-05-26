import { redirect } from 'next/navigation';

// Permanently redirect /my-licenses → /dashboard
export default function MyLicensesRedirect() {
  redirect('/dashboard');
}
