import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { getProfilesForOwner } from '@/lib/data';
import ProfileManager from '@/components/ProfileManager';

export default async function ProfilesPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/');

  const profiles = await getProfilesForOwner(session.user.id);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl">Profiles</h1>
        <p className="text-text-muted">Yourself, and anyone you&apos;re managing who can&apos;t sign in on their own.</p>
      </div>
      <ProfileManager
        initialProfiles={profiles.map((p) => ({
          id: p.id,
          name: p.name,
          age: p.age,
          gender: p.gender,
          ethnicity: p.ethnicity,
          hsGradYear: p.hsGradYear,
          interests: p.interests,
          wantedTypes: p.wantedTypes,
          isManaged: p.isManaged,
        }))}
      />
    </div>
  );
}
