import Link from 'next/link';
import { signOut } from '@/auth';

export default function Nav({ loggedIn }: { loggedIn: boolean }) {
  return (
    <header className="flex items-center justify-between pt-2">
      <Link href={loggedIn ? '/dashboard' : '/'} className="font-heading text-xl font-extrabold">
        Fund It<span className="text-lime">.</span>
      </Link>
      {loggedIn && (
        <nav className="flex items-center gap-5 text-sm font-semibold text-text-muted">
          <Link href="/dashboard" className="hover:text-text">Dashboard</Link>
          <Link href="/search" className="hover:text-text">Search</Link>
          <Link href="/history" className="hover:text-text">History</Link>
          <Link href="/profiles" className="hover:text-text">Profiles</Link>
          <form
            action={async () => {
              'use server';
              await signOut({ redirectTo: '/' });
            }}
          >
            <button type="submit" className="hover:text-text">Sign out</button>
          </form>
        </nav>
      )}
    </header>
  );
}
