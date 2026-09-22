import Anthropic from '@anthropic-ai/sdk';

if (!process.env.ANTHROPIC_API_KEY) {
  // Only thrown when actually used, so the rest of the app still builds
  // and runs without a key set yet.
}

export const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Sonnet is the balance of quality and cost for this kind of research task.
// Swap for "claude-opus-5" if results need to be sharper and cost matters
// less, since this only runs on a schedule plus whenever someone searches.
export const SEARCH_MODEL = 'claude-sonnet-5';

// The web search tool. Anthropic runs the actual searching server-side;
// Claude just gets to call it and read the results. Newer dated versions
// of this tool exist with extra options (dynamic filtering, response
// inclusion control); check Anthropic's web search tool docs if it's
// worth upgrading to one of those later.
//
// max_uses caps how many searches Claude can run in one request. The
// on-demand search route has a 60s function timeout (see
// app/api/search/submit/route.ts), and an open-ended "search everything"
// prompt can run long enough to blow past that. Capping usage here bounds
// worst-case latency so searches reliably finish in time on the free plan.
export const WEB_SEARCH_TOOL = {
  type: 'web_search_20250305',
  name: 'web_search',
  max_uses: 6,
};

export type FoundOpportunity = {
  title: string;
  org: string | null;
  category:
    | 'scholarship'
    | 'grant'
    | 'certification'
    | 'class'
    | 'internship'
    | 'sponsorship'
    | 'webinar'
    | 'other';
  url: string;
  deadline: string | null; // YYYY-MM-DD, or null if rolling/ongoing
  amount: string | null;
  whyFit: string;
};

/**
 * Pulls the JSON opportunities array out of Claude's final answer. The
 * system prompt asks for a fenced ```json block as the last thing in the
 * response; this finds it regardless of what research narration came
 * before it in the transcript.
 */
export function extractOpportunities(responseText: string): FoundOpportunity[] {
  const match = responseText.match(/```json\s*([\s\S]*?)```/) ?? responseText.match(/(\[[\s\S]*\])/);
  if (!match) return [];
  try {
    const parsed = JSON.parse(match[1]);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}
