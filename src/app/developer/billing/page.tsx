"use client";
import { DevHeader } from "@/components/DevHeader";
import { useAccount } from "@/lib/useAccount";
import { PLANS, type PlanId } from "@/lib/plans";

// The Payment Link URLs live in env vars (NEXT_PUBLIC_ so the browser can
// read them) since Payment Links need no server code to redirect to. We
// append client_reference_id so the Stripe webhook knows which business to
// upgrade once payment completes — see api/stripe/webhook/route.ts.
const LINKS: Record<PlanId, string | undefined> = {
  STARTER: process.env.NEXT_PUBLIC_STRIPE_LINK_STARTER,
  STANDARD: process.env.NEXT_PUBLIC_STRIPE_LINK_STANDARD,
  PROFESSIONAL: process.env.NEXT_PUBLIC_STRIPE_LINK_PROFESSIONAL,
}; // must match stripeLinkEnvVar in lib/plans.ts

export default function BillingPage() {
  const { account, loading } = useAccount("business");
  if (loading) return null;
  if (!account) {
    if (typeof window !== "undefined") window.location.href = "/developer/login";
    return null;
  }

  return (
    <main>
      <DevHeader account={account} kind="business" links={[{ href: "/developer", label: "Hubs" }, { href: "/developer/billing", label: "Billing" }]} />
      <section className="container-page pb-20">
        <h1 className="font-display text-3xl font-semibold">Choose a plan</h1>
        <p className="mt-2 text-ink/70 dark:text-paper/70">
          Current plan: <strong>{account.plan === "NONE" || !account.plan ? "None yet" : PLANS[account.plan as PlanId]?.label}</strong>
        </p>

        <div className="mt-8 grid gap-6 sm:grid-cols-3">
          {(Object.entries(PLANS) as [PlanId, typeof PLANS[PlanId]][]).map(([id, plan]) => {
            const link = LINKS[id];
            const href = link ? `${link}?client_reference_id=${account.id}` : undefined;
            const isCurrent = account.plan === id;
            return (
              <div key={id} className={`card flex flex-col ${isCurrent ? "border-cyan" : ""}`}>
                <h3 className="font-display text-xl font-medium">{plan.label}</h3>
                <p className="mt-2 font-mono text-3xl font-semibold tabular-nums">
                  {plan.priceNok} <span className="text-base font-normal text-ink/50 dark:text-paper/50">NOK/mo</span>
                </p>
                <p className="mt-3 flex-1 text-sm text-ink/70 dark:text-paper/70">{plan.description}</p>
                {isCurrent ? (
                  <span className="btn-ghost mt-6 pointer-events-none opacity-60">Current plan</span>
                ) : href ? (
                  <a href={href} className="btn-primary mt-6">
                    Subscribe
                  </a>
                ) : (
                  <span className="mt-6 text-xs text-ink/40 dark:text-paper/40">
                    Payment link not configured yet — see setup notes.
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </main>
  );
}
