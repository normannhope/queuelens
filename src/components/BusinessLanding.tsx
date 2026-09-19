import Link from "next/link";
import { Nav } from "@/components/Nav";
import { Reveal } from "@/components/Reveal";
import { PlansOverview } from "@/components/PlansOverview";

// Shown to anyone who lands on /developer signed out — this is the sales
// pitch that used to be missing entirely (visiting /developer just bounced
// straight to a login wall). The marketing homepage still carries a short
// version of the plans for a general audience; this page goes deeper,
// specifically for someone deciding whether to actually sign up.
export function BusinessLanding() {
  return (
    <main>
      <Nav />

      <section className="container-page relative overflow-hidden pt-10 pb-16">
        <div className="aurora" aria-hidden="true" />
        <Reveal className="relative z-10">
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

      <PlansOverview ctaHref="/developer/signup" ctaLabel="Get started" />

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
