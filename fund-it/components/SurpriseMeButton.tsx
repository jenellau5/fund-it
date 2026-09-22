'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

/**
 * The first-time-experience "Surprise me" option: finds something at
 * random that has nothing to do with what the person searched or entered
 * in their profile, but that they could still be eligible for.
 */
export default function SurpriseMeButton({ profileId }: { profileId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function go() {
    setLoading(true);
    const res = await fetch('/api/search/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ profileId, types: [], specifics: [], surpriseMe: true }),
    });
    const data = await res.json();
    router.push(`/search/${data.searchId}`);
  }

  return (
    <button onClick={go} disabled={loading} className="btn-ghost">
      {loading ? 'Looking...' : 'Surprise me'}
    </button>
  );
}
