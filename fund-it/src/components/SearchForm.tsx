'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { OPPORTUNITY_TYPES, SPECIFICS_PRESETS } from '@/lib/constants';

type Tag = { id: string; label: string };

export default function SearchForm({
  profiles,
  activeProfileId,
  initialCustomTags,
}: {
  profiles: { id: string; name: string }[];
  activeProfileId: string;
  initialCustomTags: Tag[];
}) {
  const router = useRouter();
  const [profileId, setProfileId] = useState(activeProfileId);
  const [types, setTypes] = useState<Set<string>>(new Set());
  const [specifics, setSpecifics] = useState<Set<string>>(new Set());
  const [customTags, setCustomTags] = useState<Tag[]>(initialCustomTags);
  const [newTag, setNewTag] = useState('');
  const [submitting, setSubmitting] = useState(false);

  function toggle(set: Set<string>, setter: (s: Set<string>) => void, value: string) {
    const next = new Set(set);
    if (next.has(value)) next.delete(value);
    else next.add(value);
    setter(next);
  }

  async function addCustomTag() {
    const label = newTag.trim();
    if (!label) return;
    setNewTag('');
    const res = await fetch(`/api/profiles/${profileId}/tags`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ label }),
    });
    const tag = await res.json();
    setCustomTags((t) => [...t, tag]);
    setSpecifics((s) => new Set(s).add(tag.label));
  }

  async function removeCustomTag(tag: Tag) {
    setCustomTags((t) => t.filter((x) => x.id !== tag.id));
    setSpecifics((s) => {
      const next = new Set(s);
      next.delete(tag.label);
      return next;
    });
    await fetch(`/api/profiles/${profileId}/tags?tagId=${tag.id}`, { method: 'DELETE' });
  }

  async function submit() {
    setSubmitting(true);
    const res = await fetch('/api/search/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ profileId, types: Array.from(types), specifics: Array.from(specifics) }),
    });
    const data = await res.json();
    router.push(`/search/${data.searchId}`);
  }

  return (
    <div className="flex flex-col gap-6">
      {profiles.length > 1 && (
        <div className="flex flex-wrap gap-2">
          {profiles.map((p) => (
            <button
              key={p.id}
              onClick={() => setProfileId(p.id)}
              className={`badge ${p.id === profileId ? 'badge-violet' : 'border border-border text-text-muted'}`}
            >
              {p.name}
            </button>
          ))}
        </div>
      )}

      <div className="card flex flex-col gap-3">
        <p className="text-xs font-bold uppercase tracking-wide text-text-muted">Type</p>
        <div className="flex flex-wrap gap-2">
          {OPPORTUNITY_TYPES.map((t) => (
            <button
              key={t.value}
              onClick={() => toggle(types, setTypes, t.value)}
              className={`badge ${types.has(t.value) ? 'badge-violet' : 'border border-border text-text-muted'}`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="card flex flex-col gap-3">
        <p className="text-xs font-bold uppercase tracking-wide text-text-muted">Specifics</p>
        <div className="flex flex-wrap gap-2">
          {SPECIFICS_PRESETS.map((s) => (
            <button
              key={s}
              onClick={() => toggle(specifics, setSpecifics, s)}
              className={`badge ${specifics.has(s) ? 'badge-lime' : 'border border-border text-text-muted'}`}
            >
              {s}
            </button>
          ))}
          {customTags.map((t) => (
            <span
              key={t.id}
              className={`badge flex items-center gap-1.5 ${specifics.has(t.label) ? 'badge-lime' : 'border border-border text-text-muted'}`}
            >
              <button onClick={() => toggle(specifics, setSpecifics, t.label)}>{t.label}</button>
              <button onClick={() => removeCustomTag(t)} aria-label={`Remove ${t.label}`} className="text-text-muted hover:text-coral">
                &times;
              </button>
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            className="field"
            placeholder="Add your own, like Polynesian, football, tech"
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addCustomTag()}
          />
          <button onClick={addCustomTag} className="btn-ghost">+ Add</button>
        </div>
      </div>

      <button
        onClick={submit}
        disabled={submitting || (types.size === 0 && specifics.size === 0)}
        className="btn-primary justify-center py-3"
      >
        {submitting ? 'Searching...' : 'Find opportunities'}
      </button>
    </div>
  );
}
