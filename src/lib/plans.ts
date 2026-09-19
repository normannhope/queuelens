// Plan config. Three things drive margin, and all are set here so they're
// easy to tune later: `minIntervalMinutes` (how much Claude usage a plan
// burns per month), `maxHubs` (how many locations one subscription covers),
// and `model` (Haiku is the cheap, fast vision model — plenty for "how many
// people are in this frame"; Sonnet is the sharper, pricier one). Every tier
// defaults to Haiku on purpose: at roughly $1/$5 per million input/output
// tokens, one analysis (a downsized photo + a short prompt) costs a small
// fraction of a cent, so even the cheapest plan clears a large margin
// against Claude usage. Bump PROFESSIONAL to "claude-sonnet-5" later if a
// paying customer wants sharper reads — that's a one-line change here.
//
// `advancedOutput` gates the pricier settings (public-facing output
// controls, and letting the analysis take recent history into account) to
// Standard and Professional — see the "Analysis intelligence" card on a
// hub's settings page and runAnalysisForHub in lib/runAnalysis.ts.
//
// Rough math at today's rates (check console.anthropic.com/settings/usage
// for your real numbers once it's running): Haiku 4.5 is about $1/$5 per
// 1M input/output tokens. One analysis call ≈ 1,200 image tokens + ~200
// prompt tokens in, ~100 tokens out ≈ $0.0017/call.
//   STARTER  (149 NOK/mo, 20-min cadence, 1 hub)  ≈ 72 calls/day  ≈ 2,160/mo  → ≈ $3.7/mo Claude cost
//   STANDARD (500 NOK/mo, 5-min cadence, 1 hub)    ≈ 288 calls/day ≈ 8,640/mo  → ≈ $14.7/mo Claude cost
//   PROFESSIONAL (1600 NOK/mo, 5-min, up to 10 hubs) same per-hub rate as Standard, ×hub count → watch this one as hub count grows
// That's Claude cost only (no fixed hosting/DB cost on the free tiers this
// is built for) — Stripe takes its usual ~1.5-2.9% + a small fixed fee on
// top when a plan is actually paid for.
export type PlanId = "STARTER" | "STANDARD" | "PROFESSIONAL";

export const PLANS: Record<
  PlanId,
  {
    label: string;
    priceNok: number;
    minIntervalMinutes: number; // how often this plan is allowed a fresh analysis
    maxHubs: number; // how many hubs one subscription of this plan may have
    advancedOutput: boolean; // unlocks output customization + trend-aware analysis
    model: string; // Anthropic model id used for this plan's analysis calls
    description: string;
    features: string[]; // shown on the billing page and the business landing page
    stripeLinkEnvVar: string;
  }
> = {
  STARTER: {
    label: "Starter",
    priceNok: 149,
    minIntervalMinutes: 20,
    maxHubs: 1,
    advancedOutput: false,
    model: "claude-haiku-4-5",
    description: "A fresh read every 20 minutes, one hub. Good for a single low-traffic location.",
    features: [
      "1 hub",
      "A fresh read every 20 minutes",
      "Public status page + directory listing",
      "Embed snippet for your own site",
    ],
    stripeLinkEnvVar: "NEXT_PUBLIC_STRIPE_LINK_STARTER",
  },
  STANDARD: {
    label: "Standard",
    priceNok: 500,
    minIntervalMinutes: 5,
    maxHubs: 1,
    advancedOutput: true,
    model: "claude-haiku-4-5",
    description: "5-minute cadence on one hub, plus output customization and trend-aware analysis.",
    features: [
      "Everything in Starter",
      "5-minute cadence — near-live for one location",
      "Choose what's shown publicly (wait time, headcount)",
      "Analysis learns from recent readings, not just one frame",
    ],
    stripeLinkEnvVar: "NEXT_PUBLIC_STRIPE_LINK_STANDARD",
  },
  PROFESSIONAL: {
    label: "Professional",
    priceNok: 1600,
    minIntervalMinutes: 5,
    maxHubs: 10,
    advancedOutput: true,
    model: "claude-haiku-4-5", // bump to "claude-sonnet-5" if a customer wants sharper reads
    description: "Everything in Standard, across up to 10 hubs — for multi-location businesses.",
    features: [
      "Everything in Standard",
      "Up to 10 hubs on one subscription",
      "Same 5-minute cadence at every location",
      "Best for chains and multi-location businesses",
    ],
    stripeLinkEnvVar: "NEXT_PUBLIC_STRIPE_LINK_PROFESSIONAL",
  },
};

export function stripeLinkFor(plan: PlanId): string | undefined {
  return process.env[PLANS[plan].stripeLinkEnvVar];
}
