# Fund It

Opportunity, found. Personalized scholarships, grants, certifications, classes, internships, sponsorships, and webinars, matched to a real person instead of a generic list.

## Stack

GitHub for the code, Vercel for hosting and the scheduled jobs, Neon for the Postgres database, Auth.js for magic-link login, the Anthropic API for the actual research, and Resend for email.

## One-time setup

1. **Push this to your repo.** From inside this folder:
   ```
   git init
   git add .
   git commit -m "Fund It, initial build"
   git branch -M main
   git remote add origin https://github.com/<your-username>/fund-it.git
   git push -u origin main
   ```

2. **Create a Neon project** at neon.tech. Copy the connection string it gives you into `DATABASE_URL`.

3. **Copy `.env.example` to `.env.local`** and fill in every value. `npx auth secret` generates `AUTH_SECRET`. `CRON_SECRET` can be any random string, it just has to match what you put in Vercel later.

4. **Push the database schema** to Neon:
   ```
   npm install
   npm run db:push
   ```

5. **Get a Resend account and API key** at resend.com, and verify a sending domain (or use their test domain while trying things out). This is what sends sign-in links and notification emails.

6. **Get an Anthropic API key** at console.anthropic.com. This is what powers the actual search.

7. **Import the repo into Vercel.** In the project's Settings, add every variable from `.env.example` as an environment variable (use your real values, not the placeholders). Vercel reads `vercel.json` automatically and sets up the two scheduled jobs for you, the daily recurring search sweep and the daily deadline email.

8. **Deploy.** Vercel builds and gives you a URL. That's the live app.

## How the pieces fit together

A person signs in with just their email, no password, through a one-time link. Adults sign in on their own; someone too young to hold an email login (like a kid) gets a "managed" profile instead, added from the Profiles page under whoever is managing them.

Every search starts from a clean sheet: pick the types (scholarship, grant, certification, and so on) and any specifics (presets like athletic or academic, plus your own custom tags), and it runs immediately, not on a delay. A daily scheduled job (`/api/search/run`) also sweeps every profile using whatever types they've checked as "always look for," so new things can turn up even without someone actively searching.

A found result with nobody's reaction sits there until its deadline passes, then it's quietly removed. Interested and Other stay visible and get an Expired tag once the deadline passes. Applied stays indefinitely and, once expired, asks whether you're still waiting to hear back or want it removed. Not Interested is removed the moment it's marked. Search history older than 60 days clears itself.

## A few things worth knowing before you lean on this daily

- **Vercel's free Hobby plan only runs scheduled jobs once a day.** The recurring sweep and the deadline email are both set to run daily for that reason. On-demand searches don't depend on this limit since they run the moment someone submits one.
- **The daily sweep runs through your profiles one at a time**, so with a lot of profiles it could bump into the 60-second function limit on Hobby. If that happens, either split profiles across a couple of cron entries in `vercel.json`, or upgrade to Vercel Pro for a longer limit.
- **Nothing here has been run end to end yet.** This was built and reviewed carefully, but the actual install, deploy, and first sign-in should be treated as the real first test. Watch the Vercel function logs if something doesn't work on the first try, most issues at this stage are a missing or mistyped environment variable.
- **Costs are pay-per-use, not free.** Neon, Vercel, and Resend all have workable free tiers for this scale. The Anthropic API is billed by usage. A daily sweep across a handful of profiles, plus occasional on-demand searches, should run to a few dollars a month at most, but keep an eye on it the first month.
