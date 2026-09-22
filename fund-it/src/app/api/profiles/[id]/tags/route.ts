import { NextRequest, NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { auth } from '@/auth';
import { db } from '@/db';
import { customTags, profiles } from '@/db/schema';

async function assertOwnsProfile(userId: string, profileId: string) {
  const [profile] = await db.select().from(profiles).where(eq(profiles.id, profileId)).limit(1);
  return profile && profile.ownerUserId === userId ? profile : null;
}

/** Adds a personal quick-pick specifics tag, like Polynesian, football, or tech. */
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  if (!(await assertOwnsProfile(session.user.id, params.id))) {
    return NextResponse.json({ error: 'not found' }, { status: 404 });
  }

  const { label } = await req.json();
  if (!label || typeof label !== 'string') return NextResponse.json({ error: 'label required' }, { status: 400 });

  const [tag] = await db.insert(customTags).values({ profileId: params.id, label: label.trim() }).returning();
  return NextResponse.json(tag);
}

/** Removes a personal quick-pick tag. People can always remove their own. */
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  if (!(await assertOwnsProfile(session.user.id, params.id))) {
    return NextResponse.json({ error: 'not found' }, { status: 404 });
  }

  const tagId = req.nextUrl.searchParams.get('tagId');
  if (!tagId) return NextResponse.json({ error: 'tagId required' }, { status: 400 });

  await db.delete(customTags).where(eq(customTags.id, tagId));
  return NextResponse.json({ ok: true });
}
