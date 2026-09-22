export const OPPORTUNITY_TYPES = [
  { value: 'scholarship', label: 'Scholarship' },
  { value: 'grant', label: 'Grant' },
  { value: 'certification', label: 'Certification' },
  { value: 'class', label: 'Class' },
  { value: 'internship', label: 'Internship' },
  { value: 'sponsorship', label: 'Sponsorship' },
  { value: 'webinar', label: 'Webinar' },
  { value: 'other', label: 'Other' },
] as const;

export const SPECIFICS_PRESETS = ['Athletic', 'Sports', 'Academic', 'Arts', 'STEM', 'Community service'];

export const CATEGORY_BADGE: Record<string, string> = {
  scholarship: 'badge-violet',
  grant: 'badge-mint',
  certification: 'badge-lime',
  class: 'badge-lime',
  internship: 'badge-violet',
  sponsorship: 'badge-mint',
  webinar: 'badge-lime',
  other: 'badge-violet',
};
