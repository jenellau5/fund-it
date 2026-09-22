import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { profiles, searches, users, opportunities } from '@/db/schema';
import { runSearchNow } from '@/lib/search-engine';
import { sendNewMatchEmail } from '@/lib/email';
import { eq, lt, and, isNull } from 'drizzle-orm';

const SEARCH_HISTORY_DAYS = 60;

// Runs one profile after another, so this can take a while with several
// profiles. Hobby plans cap a function at 60s; if the sweep is timing out
// partway through, either upgrade to Pro (up to 300s) or split profiles
// across more than one cron entry in vercel.json.
export const maxDuration = 60;

/**
 * Daily recurring sweep. Vercel Cron calls this once a day (see
 * vercel.json); it is also safe to call by hand while testing, as long as
 * the CRON_SECRET bearer token is included.
 *
 * For every profile that has at least one opportunity type checked, runs
 * a search using that profile's standing types, and emails the owning
 * account if anything new turned up.
 */
export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization');
  if (process.env.CRON_SECRET && auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  // Search history clears itself: anything older than 60 days goes,
  // whether or not it ever led to a tracked item (tracked items live in
  // the opportunities table and are unaffected by this).
  const cutoff = new Date(Date.now() - SEARCH_HISTORY_DAYS * 24 * 60 * 60 * 1000);
  await db.delete(searches).where(lt(searches.createdAt, cutoff));

  // A result nobody ever reacted to (status still null) is removed quietly
  // once its deadline passes, no tag or prompt needed.
  const today = new Date().toISOString().slice(0, 10);
  await db.delete(opportunities).where(and(isNull(opportunities.status), lt(opportunities.deadline, today)));

  const allProfiles = await db.select().from(profiles);
  const results: Record<string, number> = {};

  for (const profile of allProfiles) {
    if (!profile.wantedTypes || profile.wantedTypes.length === 0) continue;

    const [search] = await db
      .insert(searches)
      .values({
        profileId: profile.id,
        types: profile.wantedTypes,
        specifics: [],
        source: 'recurring',
      })
      .returning();

    try {
      const found = await runSearchNow(search.id);
      results[profile.name] = found.length;

      if (found.length > 0) {
        const owner = profile.userId
          ? (await db.select().from(users).where(eq(users.id, profile.userId)).limit(1))[0]
          : (await db.select().from(users).where(eq(users.id, profile.ownerUserId)).limit(1))[0];
        if (owner?.email) {
          await sendNewMatchEmail(owner.email, profile.name, found.length, process.env.NEXTAUTH_URL ?? '');
        }
      }
    } catch (err) {
      results[profile.name] = -1;
      console.error(`Recurring search failed for ${profile.name}`, err);
    }
  }

  return NextResponse.json({ ok: true, results });
}
