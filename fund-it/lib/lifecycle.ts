/**
 * The tracked-item lifecycle rules decided in planning:
 *
 * - status is null (found, nobody reacted): once past its deadline, it is
 *   removed quietly. No tag, no prompt.
 * - not_interested: removed immediately when the person marks it, not at
 *   the deadline. (Handled at the point the status is set, not here.)
 * - interested: stays visible. Once past its deadline it gets an Expired
 *   tag instead of disappearing, with an urgency banner as the deadline
 *   approaches.
 * - applied: stays indefinitely. Once past its deadline it prompts:
 *   still waiting for a response, or remove it.
 * - other: behaves like interested once past its deadline, kept with an
 *   Expired tag alongside the person's own note.
 */

export type OpportunityStatus = 'interested' | 'applied' | 'not_interested' | 'other' | null;

export function daysUntil(deadline: string | null): number | null {
  if (!deadline) return null;
  const ms = new Date(deadline + 'T23:59:59').getTime() - Date.now();
  return Math.ceil(ms / (1000 * 60 * 60 * 24));
}

export function isExpired(deadline: string | null): boolean {
  const d = daysUntil(deadline);
  return d !== null && d < 0;
}

export function isUrgent(deadline: string | null): boolean {
  const d = daysUntil(deadline);
  return d !== null && d >= 0 && d <= 3;
}

export function urgencyLabel(deadline: string | null): string | null {
  const d = daysUntil(deadline);
  if (d === null) return null;
  if (d < 0) return 'Expired';
  if (d === 0) return 'Due today';
  if (d === 1) return '1 day left';
  if (d <= 3) return `${d} days left`;
  return null;
}

/** True when an expired, Applied item should show the "still waiting or remove?" prompt. */
export function needsAppliedCheck(status: OpportunityStatus, deadline: string | null): boolean {
  return status === 'applied' && isExpired(deadline);
}

/** True when an untouched (status null) item is past its deadline and should be deleted by the daily sweep. */
export function shouldQuietlyRemove(status: OpportunityStatus, deadline: string | null): boolean {
  return status === null && isExpired(deadline);
}
