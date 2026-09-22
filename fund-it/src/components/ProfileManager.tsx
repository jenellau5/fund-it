'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { OPPORTUNITY_TYPES } from '@/lib/constants';

type Profile = {
  id: string;
  name: string;
  age: number | null;
  gender: string | null;
  ethnicity: string | null;
  hsGradYear: number | null;
  interests: string | null;
  wantedTypes: string[];
  isManaged: boolean;
};

const EMPTY: Omit<Profile, 'id'> = {
  name: '',
  age: null,
  gender: null,
  ethnicity: null,
  hsGradYear: null,
  interests: null,
  wantedTypes: [],
  isManaged: true,
};

export default function ProfileManager({ initialProfiles }: { initialProfiles: Profile[] }) {
  const router = useRouter();
  const [profiles, setProfiles] = useState(initialProfiles);
  const [editingId, setEditingId] = useState<string | 'new' | null>(null);
  const [form, setForm] = useState<Omit<Profile, 'id'>>(EMPTY);

  function startEdit(p: Profile) {
    setEditingId(p.id);
    setForm({ ...p });
  }

  function startNew() {
    setEditingId('new');
    setForm(EMPTY);
  }

  function toggleType(value: string) {
    setForm((f) => ({
      ...f,
      wantedTypes: f.wantedTypes.includes(value)
        ? f.wantedTypes.filter((t) => t !== value)
        : [...f.wantedTypes, value],
    }));
  }

  async function save() {
    if (editingId === 'new') {
      const res = await fetch('/api/profiles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const created = await res.json();
      setProfiles((p) => [...p, created]);
    } else if (editingId) {
      const res = await fetch(`/api/profiles/${editingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const updated = await res.json();
      setProfiles((p) => p.map((x) => (x.id === editingId ? updated : x)));
    }
    setEditingId(null);
    router.refresh();
  }

  async function remove(id: string) {
    await fetch(`/api/profiles/${id}`, { method: 'DELETE' });
    setProfiles((p) => p.filter((x) => x.id !== id));
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-4">
      {profiles.map((p) => (
        <div key={p.id} className="card flex items-center justify-between gap-3">
          <div>
            <p className="font-semibold">{p.name} {p.isManaged && <span className="badge badge-lime ml-2">Managed</span>}</p>
            <p className="text-xs text-text-muted">
              {[p.age && `${p.age} yrs`, p.hsGradYear && `class of ${p.hsGradYear}`].filter(Boolean).join(' · ') || 'No details yet'}
            </p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => startEdit(p)} className="btn-ghost">Edit</button>
            <button onClick={() => remove(p.id)} className="btn-ghost text-coral">Delete</button>
          </div>
        </div>
      ))}

      {editingId === null && (
        <button onClick={startNew} className="btn-primary self-start">+ Add profile</button>
      )}

      {editingId !== null && (
        <div className="card flex flex-col gap-3">
          <input className="field" placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <div className="grid grid-cols-2 gap-3">
            <input
              className="field"
              type="number"
              placeholder="Age"
              value={form.age ?? ''}
              onChange={(e) => setForm({ ...form, age: e.target.value ? Number(e.target.value) : null })}
            />
            <input
              className="field"
              type="number"
              placeholder="HS graduation year"
              value={form.hsGradYear ?? ''}
              onChange={(e) => setForm({ ...form, hsGradYear: e.target.value ? Number(e.target.value) : null })}
            />
            <input
              className="field"
              placeholder="Gender"
              value={form.gender ?? ''}
              onChange={(e) => setForm({ ...form, gender: e.target.value })}
            />
            <input
              className="field"
              placeholder="Ethnicity"
              value={form.ethnicity ?? ''}
              onChange={(e) => setForm({ ...form, ethnicity: e.target.value })}
            />
          </div>
          <textarea
            className="field"
            placeholder="Interests"
            value={form.interests ?? ''}
            onChange={(e) => setForm({ ...form, interests: e.target.value })}
          />

          <p className="text-xs font-bold uppercase tracking-wide text-text-muted">What should Fund It generally look for</p>
          <div className="flex flex-wrap gap-2">
            {OPPORTUNITY_TYPES.map((t) => (
              <button
                key={t.value}
                onClick={() => toggleType(t.value)}
                className={`badge ${form.wantedTypes.includes(t.value) ? 'badge-violet' : 'border border-border text-text-muted'}`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <label className="flex items-center gap-2 text-sm text-text-muted">
            <input
              type="checkbox"
              checked={form.isManaged}
              onChange={(e) => setForm({ ...form, isManaged: e.target.checked })}
            />
            I&apos;m managing this profile for someone who won&apos;t sign in themselves
          </label>

          <div className="flex gap-2">
            <button onClick={save} className="btn-primary">Save</button>
            <button onClick={() => setEditingId(null)} className="btn-ghost">Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}
