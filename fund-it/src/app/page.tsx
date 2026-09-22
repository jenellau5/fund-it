import { redirect } from 'next/navigation';
import { auth, signIn } from '@/auth';

export default async function LandingPage() {
  const session = await auth();
  if (session?.user) redirect('/dashboard');

  return (
    <div className="flex flex-col items-center gap-8 pt-16 text-center">
      <div className="flex flex-col gap-3">
        <h1 className="text-4xl">Opportunity, found.</h1>
        <p className="max-w-md text-text-muted">
          Personalized scholarships, grants, certifications, and more. Found for you, not for everyone.
        </p>
      </div>

      <form
        action={async (formData: FormData) => {
          'use server';
          await signIn('resend', formData);
        }}
        className="flex w-full max-w-sm flex-col gap-3"
      >
        <input
          type="email"
          name="email"
          required
          placeholder="you@email.com"
          className="field text-center"
        />
        <button type="submit" className="btn-primary justify-center">
          Send me a sign-in link
        </button>
      </form>
      <p className="max-w-xs text-xs text-text-muted">
        No password. We email you a one-time link, and that&apos;s your account.
      </p>
    </div>
  );
}
