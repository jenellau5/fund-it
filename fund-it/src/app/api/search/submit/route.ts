import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/db';
import { profiles, searches } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { runSearchNow } from '@/lib/search-engine';

// Give Claude's web search enough room to finish within one request.
// Hobby plans allow up to 60s per function; upgrade to Pro for longer.
export const maxDuration = 60;

/**
 * The "clean sheet" on-demand search. Runs immediately rather than being
 * queued for the next scheduled sweep, so results show up in the same
 * visit instead of the person having to come back later.
 */
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const body = await req.json();
  const { profileId, types, specifics, surpriseMe } = body as {
    profileId: string;
    types: string[];
    specifics: string[];
    surpriseMe?: boolean;
  };

  const [profile] = await db.select().from(profiles).where(eq(profiles.id, profileId)).limit(1);
  if (!profile || profile.ownerUserId !== session.user.id) {
    return NextResponse.json({ error: 'not found' }, { status: 404 });
  }

  const [search] = await db
    .insert(searches)
    .values({ profileId, types: types ?? [], specifics: specifics ?? [], source: 'on_demand' })
    .returning();

  try {
    await runSearchNow(search.id, { surpriseMe });
  } catch (err) {
    // The search row itself already records the error; still let the
    // page load so the person sees "something went wrong" instead of a
    // failed request with no explanation.
    console.error('On-demand search failed', err);
  }

  return NextResponse.json({ searchId: search.id });
}
