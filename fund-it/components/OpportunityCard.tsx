'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { CATEGORY_BADGE } from '@/lib/constants';
import { isExpired, needsAppliedCheck, urgencyLabel } from '@/lib/lifecycle';

type Opportunity = {
  id: string;
  title: string;
  org: string | null;
  category: string;
  url: string;
  deadline: string | null;
  amount: string | null;
  whyFit: string;
  status: 'interested' | 'applied' | 'not_interested' | 'other' | null;
  otherNote: string | null;
  discoverIt: boolean;
};

export default function OpportunityCard({ opp }: { opp: Opportunity }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [otherNote, setOtherNote] = useState(opp.otherNote ?? '');
  const [showOtherInput, setShowOtherInput] = useState(false);

  const expired = isExpired(opp.deadline);
  const urgency = urgencyLabel(opp.deadline);
  const badgeClass = CATEGORY_BADGE[opp.category] ?? 'badge-violet';

  function setStatus(status: Opportunity['status'], note?: string) {
    startTransition(async () => {
      await fetch(`/api/tracked/${opp.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, otherNote: note }),
      });
      router.refresh();
    });
  }

  function remove() {
    startTransition(async () => {
      await fetch(`/api/tracked/${opp.id}/status`, { method: 'DELETE' });
      router.refresh();
    });
  }

  return (
    <div className={`card flex flex-col gap-3 border-t-2 ${opp.discoverIt ? 'border-t-lime' : 'border-t-violet'}`}>
      <div className="flex flex-wrap items-center gap-2">
        <span className={`badge ${badgeClass}`}>{opp.category}</span>
        {opp.discoverIt && <span className="badge badge-lime">Discover It</span>}
        {expired && <span className="badge badge-coral">Expired</span>}
        {!expired && urgency && <span className="badge badge-coral">{urgency}</span>}
      </div>

      <div>
        <h3 className="text-base">{opp.title}</h3>
        {opp.org && <p className="text-xs text-text-muted">{opp.org}</p>}
      </div>

      <p className="text-sm text-text-muted">{opp.whyFit}</p>

      <div className="mono flex flex-wrap gap-4 text-xs text-text-muted">
        {opp.deadline && <span>Deadline: {opp.deadline}</span>}
        {opp.amount && <span>{opp.amount}</span>}
      </div>

      <a href={opp.url} target="_blank" rel="noreferrer" className="text-sm font-semibold text-violet hover:underline">
        View source
      </a>

      {needsAppliedCheck(opp.status, opp.deadline) ? (
        <div className="flex flex-col gap-2 rounded-xl border border-coral/40 bg-coral-soft p-3">
          <p className="text-sm font-semibold text-coral">Past the deadline. Still waiting to hear back, or remove it?</p>
          <div className="flex gap-2">
            <button disabled={pending} onClick={() => setStatus('applied')} className="btn-ghost">
              Still waiting
            </button>
            <button disabled={pending} onClick={remove} className="btn-ghost">
              Remove
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          <button
            disabled={pending}
            onClick={() => setStatus('interested')}
            className={opp.status === 'interested' ? 'btn-primary' : 'btn-ghost'}
          >
            Interested
          </button>
          <button
            disabled={pending}
            onClick={() => setStatus('applied')}
            className={opp.status === 'applied' ? 'btn-primary' : 'btn-ghost'}
          >
            Applied
          </button>
          <button disabled={pending} onClick={() => setStatus('not_interested')} className="btn-ghost">
            Not interested
          </button>
          <button
            disabled={pending}
            onClick={() => setShowOtherInput((s) => !s)}
            className={opp.status === 'other' ? 'btn-primary' : 'btn-ghost'}
          >
            Other
          </button>
        </div>
      )}

      {showOtherInput && (
        <div className="flex gap-2">
          <input
            className="field"
            placeholder="What did you do with this one?"
            value={otherNote}
            onChange={(e) => setOtherNote(e.target.value)}
          />
          <button
            disabled={pending}
            onClick={() => {
              setStatus('other', otherNote);
              setShowOtherInput(false);
            }}
            className="btn-primary"
          >
            Save
          </button>
        </div>
      )}
      {opp.status === 'other' && opp.otherNote && !showOtherInput && (
        <p className="text-xs text-text-muted">Note: {opp.otherNote}</p>
      )}
    </div>
  );
}
