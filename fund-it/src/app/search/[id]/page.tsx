import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { searches, profiles } from '@/db/schema';
import { getOpportunitiesForSearch } from '@/lib/data';
import OpportunityCard from '@/components/OpportunityCard';
import ResultsPoller from '@/components/ResultsPoller';

export default async function SearchResultsPage({ params }: { params: { id: string } }) {
  const [search] = await db.select().from(searches).where(eq(searches.id, params.id)).limit(1);
  if (!search) return <p className="text-text-muted">Search not found.</p>;

  const [profile] = await db.select().from(profiles).where(eq(profiles.id, search.profileId)).limit(1);
  const results = await getOpportunitiesForSearch(search.id);

  if (search.status === 'pending' || search.status === 'running') {
    return (
      <div className="flex flex-col items-center gap-3 pt-16 text-center">
        <h1 className="text-2xl">Searching for {profile?.name}...</h1>
        <p className="text-text-muted">Running several targeted searches. This usually takes under a minute.</p>
        <ResultsPoller searchId={search.id} />
      </div>
    );
  }

  if (search.status === 'error') {
    return (
      <div className="flex flex-col items-center gap-3 pt-16 text-center">
        <h1 className="text-2xl">Something went wrong</h1>
        <p className="text-text-muted">The search didn&apos;t finish. Try running it again.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl">
        {results.length === 0 ? `Nothing found for ${profile?.name}` : `Found ${results.length} for ${profile?.name}`}
      </h1>
      {results.length === 0 ? (
        <p className="text-text-muted">Nothing real and verifiable turned up this time. Try broadening the specifics, or check back later.</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {results.map((o) => (
            <OpportunityCard key={o.id} opp={o} />
          ))}
        </div>
      )}
    </div>
  );
}
