'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function RerunButton({
  profileId,
  types,
  specifics,
}: {
  profileId: string;
  types: string[];
  specifics: string[];
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function rerun() {
    setLoading(true);
    const res = await fetch('/api/search/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ profileId, types, specifics }),
    });
    const data = await res.json();
    router.push(`/search/${data.searchId}`);
  }

  return (
    <button onClick={rerun} disabled={loading} className="btn-primary">
      {loading ? 'Searching...' : 'Rerun'}
    </button>
  );
}
