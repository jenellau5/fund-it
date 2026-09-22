import Link from 'next/link';
import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { getProfilesForOwner, getSearchHistory } from '@/lib/data';
import RerunButton from '@/components/RerunButton';
import { OPPORTUNITY_TYPES } from '@/lib/constants';

function typeLabel(value: string) {
  return OPPORTUNITY_TYPES.find((t) => t.value === value)?.label ?? value;
}

export default async function HistoryPage({ searchParams }: { searchParams: { profile?: string } }) {
  const session = await auth();
  if (!session?.user?.id) redirect('/');

  const profiles = await getProfilesForOwner(session.user.id);
  if (profiles.length === 0) redirect('/profiles');

  const activeProfile = profiles.find((p) => p.id === searchParams.profile) ?? profiles[0];
  const history = await getSearchHistory(activeProfile.id);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap gap-2">
        {profiles.map((p) => (
          <Link
            key={p.id}
            href={`/history?profile=${p.id}`}
            className={`badge ${p.id === activeProfile.id ? 'badge-violet' : 'border border-border text-text-muted'}`}
          >
            {p.name}
          </Link>
        ))}
      </div>

      <h1 className="text-2xl">{activeProfile.name}&apos;s search history</h1>
      <p className="text-text-muted -mt-4">Searches older than 60 days clear themselves automatically.</p>

      {history.length === 0 ? (
        <p className="text-text-muted">No searches yet.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {history.map((s) => (
            <div key={s.id} className="card flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-col gap-1">
                <div className="flex flex-wrap gap-1.5">
                  {s.types.map((t) => (
                    <span key={t} className="badge badge-violet">{typeLabel(t)}</span>
                  ))}
                  {s.specifics.map((sp) => (
                    <span key={sp} className="badge badge-lime">{sp}</span>
                  ))}
                  {s.types.length === 0 && s.specifics.length === 0 && (
                    <span className="text-xs text-text-muted">Surprise me</span>
                  )}
                </div>
                <span className="mono text-xs text-text-muted">
                  {new Date(s.createdAt).toLocaleDateString()} &middot; {s.source === 'recurring' ? 'automatic sweep' : 'on demand'}
                </span>
              </div>
              <div className="flex gap-2">
                <Link href={`/search/${s.id}`} className="btn-ghost">View</Link>
                <RerunButton profileId={activeProfile.id} types={s.types} specifics={s.specifics} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
