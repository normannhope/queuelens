# Queue Lens

AI queue analysis for real businesses, built as a real deployable app —
not a demo. Two sides:

- **Developer tab** (`/developer`) — businesses sign up, pick a paid plan,
  add "hubs" (a webcam feed + a name), and Claude reads a fresh snapshot on
  a schedule to estimate the queue. Each hub can be flipped **public** —
  that's what makes it show up in the directory and become embeddable.
- **Customer app** (`/directory`, `/account`) — free for everyone. Anyone
  can browse public hubs; signed-in customers can pin ones they care about
  and turn on/off a push notification (no email) for "let me know when
  this gets short" — install the site to their home screen and it behaves
  like a small app.

See `HANDOFF.md` for exactly what you need to do to get this live at
quelens.com — this file is the technical reference.

## Stack

Next.js 14 (App Router) · PostgreSQL via Prisma · Claude (Anthropic API,
vision) for the actual analysis · Stripe Payment Links for billing ·
Web Push for on-device alerts (no email, no third-party notification
service) · Tailwind + Framer Motion for the UI. Every piece has a real,
permanent free tier — see HANDOFF.md.

## Local development

```bash
npm install
cp .env.example .env.local   # fill in the values — see HANDOFF.md
npx prisma migrate dev --name init
npm run dev
```

## How the pieces fit together

- `prisma/schema.prisma` — the whole data model: Business, Hub, Analysis,
  Customer, Pin.
- `src/lib/anthropic.ts` — fetches one frame from a hub's webcam URL and
  asks Claude to read it. This is the one function that actually "does the
  AI part."
- `src/lib/runAnalysis.ts` — wraps that call: save the reading, update the
  hub's cached "latest" fields, and check whether any customer's alert
  threshold was just crossed.
- `src/app/api/cron/analyze/route.ts` — called on a schedule (see
  `vercel.json`) and runs analysis for every public hub whose plan says
  it's due again.
- `src/app/api/hubs/[id]/analyze/route.ts` — the manual "Analyze now"
  button in the dashboard, same underlying function.
- `src/app/api/embed/[id]/route.ts` + `.../widget.js/route.ts` — the two
  ways a business pulls their own status into their own site: a plain JSON
  endpoint, or a drop-in `<script>` that renders a small live badge.
- `src/app/api/stripe/webhook/route.ts` — flips a business's plan on when
  a Stripe Payment Link checkout completes.

## Known platform limits, on purpose

- **Analysis frequency on the free tier**: Vercel Hobby's own Cron only
  fires once a day. `vercel.json` keeps that as a free daily fallback, but
  the real cadence (every 1-10 min, per plan) comes from a free external
  pinger (cron-job.org) hitting `/api/cron/analyze` — see HANDOFF.md. This
  is what keeps everything at $0 fixed cost while still feeling live.
- **iOS push needs "Add to Home Screen" first** — Safari's rule, not this
  app's. Android and desktop browsers can enable notifications straight
  from an open tab.
- **Webcam URLs must be direct image snapshots**, not a page with a video
  player embedded in it. If a business gives you a viewer page, you (or
  they) need to find the actual image/snapshot endpoint behind it.
