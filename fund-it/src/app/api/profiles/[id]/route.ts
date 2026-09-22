import { NextRequest, NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { auth } from '@/auth';
import { db } from '@/db';
import { profiles } from '@/db/schema';

async function assertOwns(userId: string, profileId: string) {
  const [profile] = await db.select().from(profiles).where(eq(profiles.id, profileId)).limit(1);
  return profile && profile.ownerUserId === userId ? profile : null;
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  if (!(await assertOwns(session.user.id, params.id))) {
    return NextResponse.json({ error: 'not found' }, { status: 404 });
  }

  const body = await req.json();
  const [updated] = await db
    .update(profiles)
    .set({
      name: body.name,
      age: body.age || null,
      gender: body.gender || null,
      ethnicity: body.ethnicity || null,
      hsGradYear: body.hsGradYear || null,
      interests: body.interests || null,
      wantedTypes: body.wantedTypes ?? [],
      updatedAt: new Date(),
    })
    .where(eq(profiles.id, params.id))
    .returning();

  return NextResponse.json(updated);
}

/** Deleting a profile also removes its saved opportunities and search history (cascades in the schema). */
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  if (!(await assertOwns(session.user.id, params.id))) {
    return NextResponse.json({ error: 'not found' }, { status: 404 });
  }

  await db.delete(profiles).where(eq(profiles.id, params.id));
  return NextResponse.json({ ok: true });
}
