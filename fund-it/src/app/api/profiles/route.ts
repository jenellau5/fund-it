import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/db';
import { profiles } from '@/db/schema';

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const body = await req.json();
  const [profile] = await db
    .insert(profiles)
    .values({
      ownerUserId: session.user.id,
      userId: body.isManaged ? null : session.user.id,
      isManaged: !!body.isManaged,
      name: body.name,
      age: body.age || null,
      gender: body.gender || null,
      ethnicity: body.ethnicity || null,
      hsGradYear: body.hsGradYear || null,
      interests: body.interests || null,
      wantedTypes: body.wantedTypes ?? [],
    })
    .returning();

  return NextResponse.json(profile);
}
