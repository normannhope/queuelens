import Link from "next/link";
import { Nav } from "@/components/Nav";
import { AuthForm } from "@/components/AuthForm";
import { Reveal } from "@/components/Reveal";
import { PLANS } from "@/lib/plans";

// A business landing here didn't come from the marketing homepage — they
// might have followed a direct link, so this page can't assume they've seen
// the plan details or "how it works" copy that lives on `/`. Everything a
// business needs to decide is repeated here, next to the form itself.
export default function BusinessSignup() {
  return (
    <main>
      <Nav />
      <section className="container-page pb-20">
        <Reveal>
          <p className="mb-3 font-mono text-xs uppercase tracking-[0.2em] text-cyan">For businesses</p>
          <h1 className="max-w-xl font-display text-3xl font-semibold sm:text-4xl">Add your business</h1>
          <p className="mt-3 max-w-xl text-ink/70 dark:text-paper/70">
            Create your account, pick a plan, then point us at your webcam feed — Queue Lens takes it from
            there. Customers always browse and get alerts for free; only businesses pay.
          </p>
        </Reveal>

        <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,1fr)_380px]">
          <Reveal delay={0.05}>
            <AuthForm kind="business" mode="signup" redirectTo="/developer/billing" />
            <p className="mt-4 text-sm text-ink/60 dark:text-paper/60">
              Already have an account? <Link href="/developer/login" className="text-cyan underline">Sign in</Link>
            </p>
          </Reveal>

          <Reveal delay={0.1} className="space-y-6">
            <div className="card">
              <h2 className="font-display text-lg font-medium">What happens next</h2>
              <ol className="mt-3 space-y-3 text-sm text-ink/70 dark:text-paper/70">
                <li><span className="font-mono text-amber">1.</span> Create your account (free, no card needed yet).</li>
                <li><span className="font-mono text-amber">2.</span> Pick a plan — this decides how often Claude checks your queue.</li>
                <li><span className="font-mono text-amber">3.</span> Add a hub: paste your webcam's public snapshot URL and you're live.</li>
                <li><span className="font-mono text-amber">4.</span> Embed the status on your own site, or flip it public to join the directory.</li>
              </ol>
            </div>

            <div className="card">
              <h2 className="font-display text-lg font-medium">Plans</h2>
              <div className="mt-3 space-y-4">
                {Object.entries(PLANS).map(([id, plan]) => (
                  <div key={id} className="border-b border-ink/10 pb-3 last:border-0 last:pb-0 dark:border-paper/10">
                    <div className="flex items-baseline justify-between gap-3">
                      <p className="font-display text-base font-medium">{plan.label}</p>
                      <p className="font-mono text-sm tabular-nums text-ink/70 dark:text-paper/70">
                        {plan.priceNok} NOK/mo
                      </p>
                    </div>
                    <p className="mt-1 text-xs text-ink/60 dark:text-paper/60">{plan.description}</p>
                  </div>
                ))}
              </div>
              <p className="mt-4 text-xs text-ink/50 dark:text-paper/50">
                Cancel anytime from your billing page. No setup fees.
              </p>
            </div>
          </Reveal>
        </div>
      </section>
    </main>
  );
}
