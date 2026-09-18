"use client";
import { useState } from "react";
import { DevHeader } from "@/components/DevHeader";
import { Reveal } from "@/components/Reveal";
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

const FEATURES: Record<PlanId, string[]> = {
  STARTER: ["1 hub", "A fresh read every 30 minutes", "Public directory listing", "Embed snippet for your own site"],
  STANDARD: ["Everything in Starter", "10-minute cadence — the sweet spot for most locations", "Priority-ish over Starter's read frequency"],
  PROFESSIONAL: ["Everything in Standard", "2-minute cadence, near-live", "Best for high-traffic single locations"],
};

export default function BillingPage() {
  const { account, loading } = useAccount("business");
  const [refreshing, setRefreshing] = useState(false);
  const [showCode, setShowCode] = useState(false);
  const [code, setCode] = useState("");
  const [codeState, setCodeState] = useState<"idle" | "checking" | "error">("idle");

  async function submitCode() {
    setCodeState("checking");
    const res = await fetch("/api/dev-unlock", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
    });
    if (res.ok) {
      window.location.reload();
    } else {
      setCodeState("error");
    }
  }

  if (loading) return null;
  if (!account) {
    if (typeof window !== "undefined") window.location.href = "/developer/login";
    return null;
  }

  const hasPlan = account.plan && account.plan !== "NONE";
  const currentPlan = hasPlan ? PLANS[account.plan as PlanId] : null;

  return (
    <main>
      <DevHeader account={account} kind="business" links={[{ href: "/developer", label: "Hubs" }, { href: "/developer/billing", label: "Billing" }]} />
      <section className="container-page pb-20">
        <Reveal>
          <h1 className="font-display text-3xl font-semibold">{hasPlan ? "Your plan" : "Choose a plan"}</h1>
          {hasPlan ? (
            <div className="mt-4 flex flex-wrap items-center gap-3 rounded-2xl border border-status-empty/30 bg-status-empty/10 px-5 py-4">
              <span className="rounded-full bg-status-empty/20 px-3 py-1 font-mono text-xs uppercase tracking-wide text-status-empty">
                Active
              </span>
              <p className="text-sm text-ink/80 dark:text-paper/80">
                You're on <strong>{currentPlan!.label}</strong> — {currentPlan!.priceNok} NOK/mo, analysis every{" "}
                {currentPlan!.minIntervalMinutes} min. Head to{" "}
                <a href="/developer" className="text-cyan underline">your hubs</a> to add or manage one.
              </p>
            </div>
          ) : (
            <p className="mt-2 max-w-xl text-ink/70 dark:text-paper/70">
              Pick a plan below to unlock hub creation. You can switch or cancel anytime — a cancellation takes
              effect at the end of the billing period and your public hubs simply stop updating, nothing is deleted.
            </p>
          )}
        </Reveal>

        {!hasPlan && (
          <Reveal delay={0.05}>
            <button
              onClick={() => {
                setRefreshing(true);
                window.location.reload();
              }}
              className="btn-ghost mt-4 text-xs"
            >
              {refreshing ? "Refreshing…" : "Just paid? Refresh this page"}
            </button>
          </Reveal>
        )}

        <Reveal delay={0.06}>
          {!showCode ? (
            <button onClick={() => setShowCode(true)} className="mt-4 block text-xs text-ink/40 underline dark:text-paper/40">
              Have an access code?
            </button>
          ) : (
            <div className="mt-4 flex max-w-xs items-center gap-2">
              <input
                type="text"
                value={code}
                onChange={(e) => {
                  setCode(e.target.value);
                  setCodeState("idle");
                }}
                placeholder="Code"
                className="w-32 rounded-lg border border-ink/15 bg-transparent px-2 py-1 text-sm dark:border-paper/15"
              />
              <button onClick={submitCode} disabled={codeState === "checking" || !code} className="btn-ghost text-xs">
                {codeState === "checking" ? "Checking…" : "Unlock"}
              </button>
              {codeState === "error" && <span className="text-xs text-red-500">Wrong code</span>}
            </div>
          )}
        </Reveal>

        <div className="mt-8 grid gap-6 sm:grid-cols-3">
          {(Object.entries(PLANS) as [PlanId, typeof PLANS[PlanId]][]).map(([id, plan], i) => {
            const link = LINKS[id];
            const href = link ? `${link}?client_reference_id=${account.id}` : undefined;
            const isCurrent = account.plan === id;
            return (
              <Reveal key={id} delay={0.08 + i * 0.06} className={`card flex flex-col ${isCurrent ? "border-cyan ring-1 ring-cyan/40" : ""}`}>
                <h3 className="font-display text-xl font-medium">{plan.label}</h3>
                <p className="mt-2 font-mono text-3xl font-semibold tabular-nums">
                  {plan.priceNok} <span className="text-base font-normal text-ink/50 dark:text-paper/50">NOK/mo</span>
                </p>
                <p className="mt-3 text-sm text-ink/70 dark:text-paper/70">{plan.description}</p>
                <ul className="mt-4 flex-1 space-y-1.5 text-sm text-ink/70 dark:text-paper/70">
                  {FEATURES[id].map((f) => (
                    <li key={f} className="flex gap-2">
                      <span className="text-status-empty">✓</span>
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                {isCurrent ? (
                  <span className="btn-ghost mt-6 pointer-events-none opacity-60">Current plan</span>
                ) : href ? (
                  <a href={href} className="btn-primary mt-6">
                    {hasPlan ? "Switch to this plan" : "Subscribe"}
                  </a>
                ) : (
                  <span className="mt-6 text-xs text-ink/40 dark:text-paper/40">
                    Payment link not configured yet — see setup notes.
                  </span>
                )}
              </Reveal>
            );
          })}
        </div>
      </section>
    </main>
  );
}
