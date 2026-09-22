import Link from 'next/link';
import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { getProfilesForOwner, getTrackedOpportunities } from '@/lib/data';
import OpportunityCard from '@/components/OpportunityCard';
import SurpriseMeButton from '@/components/SurpriseMeButton';

export default async function DashboardPage({ searchParams }: { searchParams: { profile?: string } }) {
  const session = await auth();
  if (!session?.user?.id) redirect('/');

  const allProfiles = await getProfilesForOwner(session.user.id);

  if (allProfiles.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 pt-16 text-center">
        <h1 className="text-2xl">Let&apos;s set up who you&apos;re finding this for.</h1>
        <p className="max-w-sm text-text-muted">
          Add a profile for yourself, or for anyone you&apos;re helping, like a family member. It only takes a minute.
        </p>
        <Link href="/profiles" className="btn-primary">Add a profile</Link>
      </div>
    );
  }

  const activeProfile = allProfiles.find((p) => p.id === searchParams.profile) ?? allProfiles[0];
  const tracked = (await getTrackedOpportunities(activeProfile.id)).filter((o) => o.status !== null);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap gap-2">
        {allProfiles.map((p) => (
          <Link
            key={p.id}
            href={`/dashboard?profile=${p.id}`}
            className={`badge ${p.id === activeProfile.id ? 'badge-violet' : 'border border-border text-text-muted'}`}
          >
            {p.name}
          </Link>
        ))}
      </div>

      <div className="flex items-center justify-between">
        <h1 className="text-2xl">{activeProfile.name}&apos;s saved items</h1>
        <div className="flex gap-2">
          <SurpriseMeButton profileId={activeProfile.id} />
          <Link href={`/search?profile=${activeProfile.id}`} className="btn-primary">New search</Link>
        </div>
      </div>

      {tracked.length === 0 ? (
        <div className="card flex flex-col items-center gap-4 py-10 text-center">
          <p className="text-text-muted">Nothing saved yet for {activeProfile.name}.</p>
          <Link href={`/search?profile=${activeProfile.id}`} className="btn-primary">Run a search</Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {tracked.map((o) => (
            <OpportunityCard key={o.id} opp={o} />
          ))}
        </div>
      )}
    </div>
  );
}
