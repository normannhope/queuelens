import Link from "next/link";
import { Reveal } from "@/components/Reveal";
import { PLANS } from "@/lib/plans";

// The feature grid, "how it works" steps, plan cards, and FAQ — shared
// between the signed-out pitch (BusinessLanding, at /developer for anyone
// not logged in) and /developer/about (the same pitch, reachable from
// inside the dashboard, since logging in used to be a one-way door into
// "Your hubs" with no way back to see the plans/feature overview again).
// `ctaHref`/`ctaLabel` control where each plan card's button points —
// signup for a signed-out visitor, billing for someone already logged in.
export function PlansOverview({ ctaHref, ctaLabel = "Get started" }: { ctaHref: string; ctaLabel?: string }) {
  return (
    <>
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
            { step: "3", title: "Paste your webcam URL", body: "A direct image-snapshot link — most public webcams expose one. No camera yet? We'll help." },
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
                <Link href={ctaHref} className="btn-primary mt-6">
                  {ctaLabel}
                </Link>
              </Reveal>
            ))}
            <Reveal delay={Object.keys(PLANS).length * 0.08} className="card flex flex-col border-dashed border-ink/25 dark:border-paper/25">
              <h3 className="font-display text-xl font-medium">Enterprise</h3>
              <p className="mt-2 font-mono text-3xl font-semibold tabular-nums">Custom</p>
              <p className="mt-3 text-sm text-ink/70 dark:text-paper/70">
                Chains and multi-location businesses beyond 10 hubs — custom cadence, SLA, and invoicing.
              </p>
              <a href="mailto:hello@quelens.com?subject=Enterprise%20plan" className="btn-ghost mt-6">
                Contact us
              </a>
            </Reveal>
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
    </>
  );
}
