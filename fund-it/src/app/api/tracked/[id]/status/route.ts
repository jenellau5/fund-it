import { NextRequest, NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { auth } from '@/auth';
import { db } from '@/db';
import { opportunities } from '@/db/schema';

/**
 * Updates a tracked item's status. Not Interested deletes the row right
 * away rather than storing that status, per the lifecycle rules: nothing
 * to keep once someone says no.
 */
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const body = await req.json();
  const status = body.status as 'interested' | 'applied' | 'not_interested' | 'other' | null;
  const otherNote = typeof body.otherNote === 'string' ? body.otherNote : undefined;

  if (status === 'not_interested') {
    await db.delete(opportunities).where(eq(opportunities.id, params.id));
    return NextResponse.json({ ok: true, removed: true });
  }

  await db
    .update(opportunities)
    .set({ status, otherNote, updatedAt: new Date() })
    .where(eq(opportunities.id, params.id));

  return NextResponse.json({ ok: true });
}

/** Removes a tracked item outright, used for the "remove" half of the Applied-past-deadline prompt. */
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  await db.delete(opportunities).where(eq(opportunities.id, params.id));
  return NextResponse.json({ ok: true });
}
