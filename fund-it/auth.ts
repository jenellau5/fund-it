import NextAuth from 'next-auth';
import Resend from 'next-auth/providers/resend';
import { DrizzleAdapter } from '@auth/drizzle-adapter';
import { db } from '@/db';
import { users, accounts, sessions, verificationTokens } from '@/db/schema';

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: DrizzleAdapter(db, {
    usersTable: users,
    accountsTable: accounts,
    sessionsTable: sessions,
    verificationTokensTable: verificationTokens,
  }),
  session: { strategy: 'database' },
  providers: [
    Resend({
      apiKey: process.env.RESEND_API_KEY,
      from: process.env.EMAIL_FROM,
    }),
  ],
  pages: {
    signIn: '/',
    verifyRequest: '/check-email',
  },
  callbacks: {
    // Explicit rather than relying on the adapter's default shape, so
    // session.user.id is always there for the profile/opportunity
    // ownership checks throughout the app.
    session({ session, user }) {
      if (session.user) session.user.id = user.id;
      return session;
    },
  },
});
