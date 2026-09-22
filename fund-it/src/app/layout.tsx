import type { Metadata } from 'next';
import './globals.css';
import { auth } from '@/auth';
import Nav from '@/components/Nav';

export const metadata: Metadata = {
  title: 'Fund It',
  description: 'Opportunity, found. Personalized scholarships, grants, and more.',
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  return (
    <html lang="en">
      <body>
        <div className="mx-auto flex min-h-screen max-w-4xl flex-col gap-6 px-4 pb-16 pt-6">
          <Nav loggedIn={!!session?.user} />
          <main className="flex flex-col gap-6">{children}</main>
        </div>
      </body>
    </html>
  );
}
