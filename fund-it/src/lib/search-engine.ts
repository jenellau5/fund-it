import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { searches, opportunities, profiles } from '@/db/schema';
import { anthropic, SEARCH_MODEL, WEB_SEARCH_TOOL, extractOpportunities } from './claude';

const TYPE_LABELS: Record<string, string> = {
  scholarship: 'scholarships',
  grant: 'grants',
  certification: 'certifications',
  class: 'classes or courses',
  internship: 'internships',
  sponsorship: 'sponsorships',
  webinar: 'webinars',
  other: 'other funded opportunities',
};

function buildPrompt(profile: typeof profiles.$inferSelect, types: string[], specifics: string[], surpriseMe: boolean) {
  const who = [
    `Name: ${profile.name}`,
    profile.age ? `Age: ${profile.age}` : null,
    profile.gender ? `Gender: ${profile.gender}` : null,
    profile.ethnicity ? `Ethnicity: ${profile.ethnicity}` : null,
    profile.hsGradYear ? `High school graduation year: ${profile.hsGradYear}` : null,
    profile.interests ? `Interests: ${profile.interests}` : null,
  ]
    .filter(Boolean)
    .join('\n');

  if (surpriseMe) {
    return `You are researching real, currently open funding and opportunity listings for this person:\n${who}\n\nThis is a "surprise me" request. Deliberately ignore their stated interests and the types they usually search for. Find 1 to 3 real, currently open opportunities (scholarships, grants, certifications, classes, internships, sponsorships, or webinars) that are NOT an obvious match to their profile on the surface, but that they could still be genuinely eligible for. The goal is something they would not have thought to search for themselves.\n\nYou have up to 4 or 5 web searches available for this, so make each one count rather than spreading thin. Do not rely on one generic query. Verify each listing is real, still open, and has a working link before including it.\n\nWhen you are done researching, respond with ONLY a fenced \`\`\`json code block containing an array of objects, each shaped exactly like:\n{"title": string, "org": string|null, "category": "scholarship"|"grant"|"certification"|"class"|"internship"|"sponsorship"|"webinar"|"other", "url": string, "deadline": "YYYY-MM-DD"|null, "amount": string|null, "whyFit": string}\n\n"whyFit" should plainly explain why this could be a good, if unexpected, fit. If you find nothing real and verifiable, return an empty array.`;
  }

  const typeList = types.map((t) => TYPE_LABELS[t] ?? t).join(', ');
  const specificsList = specifics.length ? specifics.join(', ') : 'none given, search broadly within the types above';

  return `You are researching real, currently open funding and opportunity listings for this person:\n${who}\n\nThey are looking for: ${typeList}.\nSpecifics to match against: ${specificsList}.\n\nYou have up to 5 or 6 web searches available for this, so prioritize rather than trying to cover everything. Combine this person's actual attributes (background, interests, school year, location if known) with the requested types and specifics, rather than one generic query. Prioritize the ecosystems most likely to have a real match for this specific person: national foundations, local and community organizations, employer or industry sponsorships, professional associations, and school- or region-specific programs.\n\nOnly include opportunities that are real, currently open (not expired), and that you can verify with a working source link. Do not invent listings.\n\nWhen you are done researching, respond with ONLY a fenced \`\`\`json code block containing an array of objects, each shaped exactly like:\n{"title": string, "org": string|null, "category": "scholarship"|"grant"|"certification"|"class"|"internship"|"sponsorship"|"webinar"|"other", "url": string, "deadline": "YYYY-MM-DD"|null, "amount": string|null, "whyFit": string}\n\n"whyFit" is one or two plain sentences on why this specific person is a good match, stated as fact, not as a probability or odds of winning. If nothing real and verifiable turns up, return an empty array.`;
}

/**
 * Runs one search to completion: calls Claude with web search, parses the
 * results, and writes them into the opportunities table. Used both for an
 * on-demand "clean sheet" search (called directly from the search page,
 * so results show up right away) and for the daily recurring sweep.
 */
export async function runSearchNow(searchId: string, opts: { surpriseMe?: boolean } = {}) {
  const [search] = await db.select().from(searches).where(eq(searches.id, searchId)).limit(1);
  if (!search) throw new Error('Search not found');

  const [profile] = await db.select().from(profiles).where(eq(profiles.id, search.profileId)).limit(1);
  if (!profile) throw new Error('Profile not found');

  await db.update(searches).set({ status: 'running' }).where(eq(searches.id, searchId));

  try {
    const prompt = buildPrompt(profile, search.types, search.specifics, opts.surpriseMe ?? false);

    const response = await anthropic.messages.create({
      model: SEARCH_MODEL,
      max_tokens: 4096,
      // Cast: the web search tool type string is newer than some pinned
      // SDK versions' TypeScript types, but the API itself accepts it.
      tools: [WEB_SEARCH_TOOL] as never,
      messages: [{ role: 'user', content: prompt }],
    });

    const textBlocks = response.content.filter(
      (b): b is { type: 'text'; text: string } => b.type === 'text'
    );
    const finalText = textBlocks.map((b) => b.text).join('\n');
    const found = extractOpportunities(finalText);

    if (found.length > 0) {
      await db.insert(opportunities).values(
        found.map((o) => ({
          profileId: profile.id,
          searchId: search.id,
          title: o.title,
          org: o.org,
          category: o.category,
          url: o.url,
          deadline: o.deadline,
          amount: o.amount,
          whyFit: o.whyFit,
          discoverIt: opts.surpriseMe ?? false,
        }))
      );
    }

    await db.update(searches).set({ status: 'done', completedAt: new Date() }).where(eq(searches.id, searchId));
    return found;
  } catch (err) {
    await db
      .update(searches)
      .set({ status: 'error', errorMessage: err instanceof Error ? err.message : String(err), completedAt: new Date() })
      .where(eq(searches.id, searchId));
    throw err;
  }
}
