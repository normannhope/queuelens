# Getting Queue Lens live at quelens.com — reference

Normann: I'll walk you through this one step at a time in chat, waiting for
you to confirm each one before handing you the next. This file is the full
reference underneath that — useful if you want to peek ahead, or come back
to a step later.

**Cost target: $0 fixed, for real.** Every piece below has a free tier that
this app is built to fit inside. The only thing that ever costs money is
Claude analyzing an actual photo, and that only happens when a hub exists
and is due for a check — zero hubs (where you are right now) means zero
spend. Stripe only takes a cut of money that already came in. There is no
monthly bill waiting for you.

## The pieces, and which free tier each sits on

| Piece | Free tier | What it's for |
|---|---|---|
| Hosting | Vercel Hobby | Runs the app, serves quelens.com |
| Database | Neon (free tier) | Businesses, hubs, customers, pins |
| AI analysis | Anthropic API (pay-per-use, ~$0 at zero volume) | The actual queue read |
| Billing | Stripe (no monthly fee, % only on real sales) | Business plan payments |
| Notifications | Web Push (free, built into browsers) | "Queue is short" alerts |
| Frequent analysis | cron-job.org (free) | Pings the analysis endpoint on a real schedule |

Nothing here is a trial that expires — these are each provider's actual
permanent free tier.

## Why push notifications instead of email

You asked for on-device notifications via "add to home screen" instead of
email, so that's what's built: `public/sw.js` + `public/manifest.webmanifest`
make the site installable, and `src/lib/push.ts` sends real notifications
straight from your server to the browser's own push service (Google's,
Mozilla's, Apple's) — free, no email provider, no per-message cost. One
real constraint worth knowing: **on iPhone/iPad, Safari only allows push
notifications for a site added to the home screen first** — a customer has
to tap Share → "Add to Home Screen" before "Enable notifications" will do
anything there. Android/desktop Chrome and Firefox don't need that step.

## Why the plans are priced the way they are (margin)

Full math is in `src/lib/plans.ts`, short version: every plan defaults to
Claude's Haiku model, which is roughly $1 per million input tokens / $5 per
million output tokens — and each analysis call is now a heavily downsized
photo (resized to 800px before it's sent — see `lib/anthropic.ts`), so one
call costs a small fraction of a cent. Even the cheapest plan (Starter,
149 NOK/mo, checked every 30 min) burns something like $2-3/month in Claude
usage against 149 NOK (~$14) coming in — a large margin, before Stripe's
own small cut. Standard and Professional scale the same way. Prices here
match what's already live on quelens.com today; change them freely in
`lib/plans.ts`, nothing else needs to know.

## The step-by-step (same steps I'll walk you through in chat)

1. **GitHub**: push this folder to a new private repo.
2. **Vercel**: free account, import that repo. Don't deploy yet.
3. **Neon**: free Postgres project, copy the connection string (`DATABASE_URL`).
4. **Anthropic**: get an API key at console.anthropic.com (`ANTHROPIC_API_KEY`).
5. **Push keys**: run `npx web-push generate-vapid-keys` on any machine with Node — free, no account, just prints two keys. Those become `NEXT_PUBLIC_VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY`.
6. **Env vars + deploy**: put everything from `.env.example` into Vercel's project settings (also make up two random strings for `AUTH_SECRET` and `CRON_SECRET` — `openssl rand -hex 32`, or ask me and I'll generate them). Deploy.
7. **Migrate the database**, once, from your own machine: `DATABASE_URL="<neon string>" npx prisma migrate deploy`.
8. **Give yourself a plan without Stripe** (since there are no real customers yet): once the DB is live, run one SQL statement (I'll hand you the exact command when we get here) to set your own business row's `plan` to `STARTER` directly — that unlocks hub creation for you to test with, with no payment wiring needed yet.
9. **Free frequent analysis**: sign up at cron-job.org (free), point a job at `https://quelens.com/api/cron/analyze` with your `CRON_SECRET` as a Bearer header, every 1-5 minutes. This is what actually gives you live-feeling updates without paying Vercel for its own faster cron.
10. **Move the domain**: in Vercel → your project → Domains, add `quelens.com`. Vercel shows the exact DNS records. Go to wherever quelens.com is managed today (its current registrar/host) and swap its DNS records to the ones Vercel gave you — that detaches it from the site it's on now and points it here instead. Usually live within an hour.
11. **Stripe, when you're ready for real (paying) customers**: create the 3 products, a Payment Link for each, a webhook to `/api/stripe/webhook`, and fill in the `PRICE_TO_PLAN` map in `src/app/api/stripe/webhook/route.ts` — not needed for your own solo testing above.

## One thing to think through, not code

Scraping a business's public webcam automatically, on a schedule, to run
it through an AI model is very likely fine for a webcam *they* opted to
hand you the URL for — that's the model this app assumes. It gets murkier
for any camera you didn't get explicit sign-off on. Not legal advice, just
worth a few minutes of thought before onboarding a business that isn't you.
