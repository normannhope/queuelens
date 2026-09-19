"use client";
import Link from "next/link";
import { DevHeader } from "@/components/DevHeader";
import { Reveal } from "@/components/Reveal";
import { PlansOverview } from "@/components/PlansOverview";
import { useAccount } from "@/lib/useAccount";

// Logging in used to be a one-way door: once you had an account, the only
// thing left to look at was /developer ("Your hubs") — there was no way
// back to the feature overview and plan comparison you saw before signing
// up. This page is that page again, reachable from inside the dashboard
// (see the "Plans" link DevHeader adds for business accounts), with its
// CTAs pointed at billing instead of signup since you're already in.
export default function DeveloperAboutPage() {
  const { account, loading } = useAccount("business");

  if (loading) return null;
  if (!account) {
    if (typeof window !== "undefined") window.location.href = "/developer/login";
    return null;
  }

  return (
    <main>
      <DevHeader
        account={account}
        kind="business"
        links={[
          { href: "/developer", label: "Hubs" },
          { href: "/developer/settings", label: "Settings" },
        ]}
      />
      <section className="container-page pb-10 pt-2">
        <Reveal>
          <p className="mb-3 font-mono text-xs uppercase tracking-[0.2em] text-cyan">For businesses</p>
          <h1 className="max-w-2xl font-display text-3xl font-semibold leading-[1.1] tracking-tight sm:text-4xl">
            Everything Queue Lens does, and every plan.
          </h1>
          <p className="mt-4 max-w-xl text-ink/70 dark:text-paper/70">
            The same overview you saw before signing up — handy if you're deciding whether to upgrade, or just want
            a refresher on what's available at each tier.
          </p>
        </Reveal>
      </section>

      <PlansOverview ctaHref="/developer/settings" ctaLabel="Manage plan" />

      <section className="container-page py-16">
        <Reveal className="card flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-display text-xl font-semibold">Ready to put this to use?</h2>
            <p className="mt-1 text-sm text-ink/70 dark:text-paper/70">Head back to your hubs, or adjust your plan.</p>
          </div>
          <div className="flex shrink-0 gap-3">
            <Link href="/developer/settings" className="btn-ghost">
              Settings
            </Link>
            <Link href="/developer" className="btn-primary">
              Your hubs
            </Link>
          </div>
        </Reveal>
      </section>
    </main>
  );
}
