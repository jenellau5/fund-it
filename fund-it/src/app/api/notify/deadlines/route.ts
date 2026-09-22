import { NextRequest, NextResponse } from 'next/server';
import { and, eq, isNull, isNotNull } from 'drizzle-orm';
import { db } from '@/db';
import { opportunities, profiles, users } from '@/db/schema';
import { isUrgent } from '@/lib/lifecycle';
import { sendDeadlineDigest } from '@/lib/email';

/**
 * Daily digest of approaching deadlines, grouped by the account that owns
 * each profile so a parent managing several people gets one email, not
 * one per kid.
 */
export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization');
  if (process.env.CRON_SECRET && auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const trackedWithDeadlines = await db
    .select({
      id: opportunities.id,
      title: opportunities.title,
      deadline: opportunities.deadline,
      url: opportunities.url,
      status: opportunities.status,
      deadlineReminderSentAt: opportunities.deadlineReminderSentAt,
      profileId: opportunities.profileId,
      profileName: profiles.name,
      ownerUserId: profiles.ownerUserId,
    })
    .from(opportunities)
    .innerJoin(profiles, eq(opportunities.profileId, profiles.id))
    .where(and(isNotNull(opportunities.status), isNotNull(opportunities.deadline)));

  const dueForReminder = trackedWithDeadlines.filter(
    (o) => isUrgent(o.deadline) && !o.deadlineReminderSentAt && o.status !== 'not_interested'
  );

  const byOwner = new Map<string, typeof dueForReminder>();
  for (const item of dueForReminder) {
    const list = byOwner.get(item.ownerUserId) ?? [];
    list.push(item);
    byOwner.set(item.ownerUserId, list);
  }

  for (const [ownerUserId, items] of byOwner) {
    const [owner] = await db.select().from(users).where(eq(users.id, ownerUserId)).limit(1);
    if (!owner?.email) continue;
    await sendDeadlineDigest(
      owner.email,
      items.map((i) => ({ title: i.title, deadline: i.deadline, url: i.url, profileName: i.profileName }))
    );
    for (const item of items) {
      await db
        .update(opportunities)
        .set({ deadlineReminderSentAt: new Date() })
        .where(eq(opportunities.id, item.id));
    }
  }

  return NextResponse.json({ ok: true, notified: dueForReminder.length });
}
