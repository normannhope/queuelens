import Link from "next/link";
import { Nav } from "@/components/Nav";
import { Reveal } from "@/components/Reveal";
import { QueueBadge } from "@/components/QueueBadge";
import { PLANS } from "@/lib/plans";

const SAMPLE_HUBS = [
  { name: "Bergen Cut & Shave", category: "Barbershop", level: "SHORT", waitMin: 8 },
  { name: "Nidaros Bakeri", category: "Bakery", level: "EMPTY", waitMin: 0 },
  { name: "Sentrum Legevakt", category: "Clinic", level: "LONG", waitMin: 34 },
];

export default function Home() {
  return (
    <main>
      <Nav />

      <section className="container-page relative overflow-hidden pt-10 pb-20">
        <div className="aurora" aria-hidden="true" />
        <Reveal className="relative z-10">
          <p className="mb-4 font-mono text-xs uppercase tracking-[0.2em] text-cyan">AI queue analysis, from a public webcam</p>
          <h1 className="max-w-3xl font-display text-5xl font-semibold leading-[1.05] tracking-tight text-balance sm:text-6xl">
            See the line <span className="text-amber">before</span> you leave the house.
          </h1>
          <p className="mt-5 max-w-xl text-lg text-ink/70 dark:text-paper/70">
            Point Queue Lens at any public webcam feed. Claude reads the frame, estimates the wait,
            and keeps your customers — or anyone browsing the directory — one glance from knowing
            whether now's a good time to go.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/developer/signup" className="btn-primary">
              Add your business
            </Link>
            <Link href="/directory" className="btn-ghost">
              Browse live queues
            </Link>
          </div>
        </Reveal>

        <Reveal delay={0.1} className="relative z-10 mt-16 grid gap-3 sm:grid-cols-3">
          {SAMPLE_HUBS.map((h) => (
            <div key={h.name} className="card">
              <p className="font-mono text-xs uppercase tracking-wide text-ink/50 dark:text-paper/50">{h.category}</p>
              <p className="mt-1 font-display text-lg font-medium">{h.name}</p>
              <div className="mt-3">
                <QueueBadge level={h.level} waitMin={h.waitMin} />
              </div>
            </div>
          ))}
        </Reveal>
        <p className="mt-3 text-xs text-ink/40 dark:text-paper/40">Example data shown — browse the real directory once hubs are live.</p>
      </section>

      <section className="border-y border-ink/10 bg-paper-soft/60 py-20 dark:border-paper/10 dark:bg-ink-soft/40">
        <div className="container-page">
          <Reveal>
            <h2 className="font-display text-3xl font-semibold">How it works</h2>
          </Reveal>
          <div className="mt-10 grid gap-8 sm:grid-cols-3">
            {[
              { step: "1", title: "Import the feed", body: "Paste a public webcam snapshot URL for your queue, counter, or waiting area." },
              { step: "2", title: "Claude reads it", body: "On your plan's schedule, Claude looks at the frame and estimates count, wait time, and a plain-language read." },
              { step: "3", title: "Share the status", body: "Show it on your own site with the embed snippet, or flip it public and it joins the Queue Lens directory." },
            ].map((s, i) => (
              <Reveal key={s.step} delay={i * 0.08}>
                <p className="font-mono text-sm text-amber">{s.step}</p>
                <h3 className="mt-2 font-display text-xl font-medium">{s.title}</h3>
                <p className="mt-2 text-ink/70 dark:text-paper/70">{s.body}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="container-page py-20">
        <Reveal>
          <h2 className="font-display text-3xl font-semibold">Plans — businesses only</h2>
          <p className="mt-2 text-ink/70 dark:text-paper/70">Customers browse and get alerts for free, always.</p>
        </Reveal>
        <div className="mt-10 grid gap-6 sm:grid-cols-3">
          {Object.entries(PLANS).map(([id, plan], i) => (
            <Reveal key={id} delay={i * 0.08} className="card flex flex-col">
              <h3 className="font-display text-xl font-medium">{plan.label}</h3>
              <p className="mt-2 font-mono text-3xl font-semibold tabular-nums">
                {plan.priceNok} <span className="text-base font-normal text-ink/50 dark:text-paper/50">NOK/mo</span>
              </p>
              <p className="mt-3 flex-1 text-sm text-ink/70 dark:text-paper/70">{plan.description}</p>
              <Link href="/developer/signup" className="btn-primary mt-6">
                Get started
              </Link>
            </Reveal>
          ))}
        </div>
      </section>

      <footer className="container-page flex flex-wrap items-center justify-between gap-4 border-t border-ink/10 py-10 text-sm text-ink/50 dark:border-paper/10 dark:text-paper/50">
        <span>© {new Date().getFullYear()} Queue Lens</span>
        <div className="flex gap-4">
          <Link href="/directory">Directory</Link>
          <Link href="/developer">For businesses</Link>
          <Link href="/account/signup">Customer sign up</Link>
        </div>
      </footer>
    </main>
  );
}
