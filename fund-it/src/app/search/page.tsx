import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { getProfilesForOwner, getCustomTags } from '@/lib/data';
import SearchForm from '@/components/SearchForm';

export default async function SearchPage({ searchParams }: { searchParams: { profile?: string } }) {
  const session = await auth();
  if (!session?.user?.id) redirect('/');

  const profiles = await getProfilesForOwner(session.user.id);
  if (profiles.length === 0) redirect('/profiles');

  const activeProfile = profiles.find((p) => p.id === searchParams.profile) ?? profiles[0];
  const customTags = await getCustomTags(activeProfile.id);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl">New search</h1>
        <p className="text-text-muted">A clean sheet every time, so it&apos;s always specific to what {activeProfile.name} wants right now.</p>
      </div>
      <SearchForm
        profiles={profiles.map((p) => ({ id: p.id, name: p.name }))}
        activeProfileId={activeProfile.id}
        initialCustomTags={customTags.map((t) => ({ id: t.id, label: t.label }))}
      />
    </div>
  );
}
