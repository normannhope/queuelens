import Link from "next/link";
import { Nav } from "@/components/Nav";
import { Reveal } from "@/components/Reveal";
import { PLANS } from "@/lib/plans";

// Shown to anyone who lands on /developer signed out — this is the sales
// pitch that used to be missing entirely (visiting /developer just bounced
// straight to a login wall). The marketing homepage still carries a short
// version of the plans for a general audience; this page goes deeper,
// specifically for someone deciding whether to actually sign up.
export function BusinessLanding() {
  return (
    <main>
      <Nav />

      <section className="container-page pt-10 pb-16">
        <Reveal>
          <p className="mb-4 font-mono text-xs uppercase tracking-[0.2em] text-cyan">For businesses</p>
          <h1 className="max-w-2xl font-display text-4xl font-semibold leading-[1.08] tracking-tight sm:text-5xl">
            Stop answering "how busy are you?" by hand.
          </h1>
          <p className="mt-5 max-w-xl text-lg text-ink/70 dark:text-paper/70">
            You already have a webcam pointed at your queue, counter, or waiting room. Queue Lens has Claude read
            it on a schedule and turns that into a live status your customers can check before they leave the
            house — on your own site, or on the public Queue Lens directory.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/developer/signup" className="btn-primary">
              Add your business
            </Link>
            <Link href="/developer/login" className="btn-ghost">
              Sign in
            </Link>
          </div>
          <p className="mt-4 text-sm text-ink/50 dark:text-paper/50">
            Free to create an account. No card needed until you pick a plan.
          </p>
        </Reveal>
      </section>

      <section className="border-y border-ink/10 bg-paper-soft/60 py-16 dark:border-paper/10 dark:bg-ink-soft/40">
        <div className="container-page">
          <Reveal>
            <h2 className="font-display text-2xl font-semibold">What you actually get</h2>
          </Reveal>
          <div className="mt-8 grid gap-6 sm:grid-cols-2">
            {[
              {
                title: "Real AI reads, not a motion sensor",
                body: "Claude looks at the actual frame — people waiting, roughly how many, how long it'll likely take — not just \"something moved.\"",
              },
              {
                title: "Your own status page, free hosting included",
                body: "Every hub gets a public page at queuelens.com/hub/your-place, kept fresh on your plan's schedule.",
              },
              {
                title: "Drop it into your own site",
                body: "One script tag embeds a live status badge wherever you want it — no iframe wrangling, no API key juggling.",
              },
              {
                title: "Customers get notified, you don't lift a finger",
                body: "Anyone can pin your hub and get a push notification the moment the line drops below the level they set.",
              },
            ].map((f, i) => (
              <Reveal key={f.title} delay={i * 0.06} className="card">
                <h3 className="font-display text-lg font-medium">{f.title}</h3>
                <p className="mt-2 text-sm text-ink/70 dark:text-paper/70">{f.body}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="container-page py-16">
        <Reveal>
          <h2 className="font-display text-2xl font-semibold">How it works</h2>
        </Reveal>
        <div className="mt-8 grid gap-8 sm:grid-cols-4">
          {[
            { step: "1", title: "Create an account", body: "Free, no card needed yet." },
            { step: "2", title: "Pick a plan", body: "Decides how often Claude checks in, and how many hubs you can run." },
            { step: "3", title: "Paste your webcam URL", body: "A direct image-snapshot link — most public webcams expose one." },
            { step: "4", title: "Go live", body: "Embed it on your site, or flip it public to join the directory." },
          ].map((s, i) => (
            <Reveal key={s.step} delay={i * 0.06}>
              <p className="font-mono text-sm text-amber">{s.step}</p>
              <h3 className="mt-2 font-display text-base font-medium">{s.title}</h3>
              <p className="mt-1.5 text-sm text-ink/70 dark:text-paper/70">{s.body}</p>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="border-y border-ink/10 bg-paper-soft/60 py-16 dark:border-paper/10 dark:bg-ink-soft/40">
        <div className="container-page">
          <Reveal>
            <h2 className="font-display text-2xl font-semibold">Plans</h2>
            <p className="mt-2 text-ink/70 dark:text-paper/70">
              Customers always browse and get alerts for free — only businesses pay.
            </p>
          </Reveal>
          <div className="mt-8 grid gap-6 sm:grid-cols-3">
            {Object.entries(PLANS).map(([id, plan], i) => (
              <Reveal key={id} delay={i * 0.08} className="card flex flex-col">
                <h3 className="font-display text-xl font-medium">{plan.label}</h3>
                <p className="mt-2 font-mono text-3xl font-semibold tabular-nums">
                  {plan.priceNok} <span className="text-base font-normal text-ink/50 dark:text-paper/50">NOK/mo</span>
                </p>
                <p className="mt-3 text-sm text-ink/70 dark:text-paper/70">{plan.description}</p>
                <ul className="mt-4 flex-1 space-y-1.5 text-sm text-ink/70 dark:text-paper/70">
                  {plan.features.map((f) => (
                    <li key={f} className="flex gap-2">
                      <span className="text-status-empty">✓</span>
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                <Link href="/developer/signup" className="btn-primary mt-6">
                  Get started
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="container-page py-16">
        <Reveal>
          <h2 className="font-display text-2xl font-semibold">Questions</h2>
        </Reveal>
        <div className="mt-8 grid gap-8 sm:grid-cols-2">
          {[
            {
              q: "Do I need special hardware?",
              a: "No — if you already have a public webcam with a direct image-snapshot URL (many do), that's all Queue Lens needs.",
            },
            {
              q: "What if I don't want the exact headcount shown?",
              a: "On Standard and Professional you control exactly what's public — wait time, headcount, both, or just the plain-language status.",
            },
            {
              q: "Can I turn it off overnight?",
              a: "Yes — every hub has an active-hours schedule, so analysis (and the cost behind it) only runs when you're actually open.",
            },
            {
              q: "What happens if I cancel?",
              a: "Your plan stays active until the end of the billing period, then your hubs simply stop updating. Nothing is deleted.",
            },
          ].map((item) => (
            <Reveal key={item.q}>
              <h3 className="font-display text-base font-medium">{item.q}</h3>
              <p className="mt-1.5 text-sm text-ink/70 dark:text-paper/70">{item.a}</p>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="container-page pb-20">
        <Reveal className="card flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-display text-xl font-semibold">Ready to see it running?</h2>
            <p className="mt-1 text-sm text-ink/70 dark:text-paper/70">Takes a few minutes from account to live status page.</p>
          </div>
          <Link href="/developer/signup" className="btn-primary shrink-0">
            Add your business
          </Link>
        </Reveal>
      </section>
    </main>
  );
}
