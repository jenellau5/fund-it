import { and, desc, eq, or } from 'drizzle-orm';
import { db } from '@/db';
import { profiles, opportunities, searches, customTags } from '@/db/schema';

/** Every profile a logged-in account can see: their own, plus anyone they manage. */
export async function getProfilesForOwner(ownerUserId: string) {
  return db.select().from(profiles).where(eq(profiles.ownerUserId, ownerUserId)).orderBy(profiles.createdAt);
}

export async function getProfile(profileId: string) {
  const [p] = await db.select().from(profiles).where(eq(profiles.id, profileId)).limit(1);
  return p ?? null;
}

export async function getTrackedOpportunities(profileId: string) {
  return db
    .select()
    .from(opportunities)
    .where(eq(opportunities.profileId, profileId))
    .orderBy(desc(opportunities.foundAt));
}

export async function getSearchHistory(profileId: string) {
  return db.select().from(searches).where(eq(searches.profileId, profileId)).orderBy(desc(searches.createdAt));
}

export async function getCustomTags(profileId: string) {
  return db.select().from(customTags).where(eq(customTags.profileId, profileId)).orderBy(customTags.createdAt);
}

export async function getOpportunitiesForSearch(searchId: string) {
  return db.select().from(opportunities).where(eq(opportunities.searchId, searchId));
}
