'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/** Refreshes the results page every few seconds while a search is still running. */
export default function ResultsPoller({ searchId }: { searchId: string }) {
  const router = useRouter();

  useEffect(() => {
    const id = setInterval(() => router.refresh(), 4000);
    return () => clearInterval(id);
  }, [router, searchId]);

  return null;
}
