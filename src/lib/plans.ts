// Plan config. Two things drive margin, and both are set here so they're
// easy to tune later: `minIntervalMinutes` (how much Claude usage a plan
// burns per month) and `model` (Haiku is the cheap, fast vision model —
// plenty for "how many people are in this frame"; Sonnet is the sharper,
// pricier one). Every tier defaults to Haiku on purpose: at roughly
// $1/$5 per million input/output tokens, one analysis (a downsized photo +
// a short prompt) costs a small fraction of a cent, so even the cheapest
// plan clears a large margin against Claude usage. Bump PROFESSIONAL to
// "claude-sonnet-5" later if a paying customer wants sharper reads — that's
// a one-line change here, nothing else to touch.
//
// Rough math at today's rates (check console.anthropic.com/settings/usage
// for your real numbers once it's running): Haiku 4.5 is about $1/$5 per
// 1M input/output tokens. One analysis call ≈ 1,200 image tokens + ~200
// prompt tokens in, ~100 tokens out ≈ $0.0017/call.
//   STARTER  (149 NOK/mo, 30-min cadence) ≈ 48 calls/day  ≈ 1,440/mo → ≈ $2.4/mo Claude cost
//   STANDARD (500 NOK/mo, 10-min cadence) ≈ 144 calls/day ≈ 4,320/mo → ≈ $7.3/mo Claude cost
//   PROFESSIONAL (1600 NOK/mo, 2-min)     ≈ 720 calls/day ≈ 21,600/mo → ≈ $37/mo Claude cost
// That's Claude cost only (no fixed hosting/DB cost on the free tiers this
// is built for) — Stripe takes its usual ~1.5-2.9% + a small fixed fee on
// top when a plan is actually paid for. Margin holds up well across all
// three; PROFESSIONAL is the one to watch as hub count grows.
export type PlanId = "STARTER" | "STANDARD" | "PROFESSIONAL";

export const PLANS: Record<
  PlanId,
  {
    label: string;
    priceNok: number;
    minIntervalMinutes: number; // how often this plan is allowed a fresh analysis
    model: string; // Anthropic model id used for this plan's analysis calls
    description: string;
    stripeLinkEnvVar: string;
  }
> = {
  STARTER: {
    label: "Starter",
    priceNok: 149,
    minIntervalMinutes: 30,
    model: "claude-haiku-4-5",
    description: "A fresh read every 30 minutes. Good for one location, low-traffic hours.",
    stripeLinkEnvVar: "NEXT_PUBLIC_STRIPE_LINK_STARTER",
  },
  STANDARD: {
    label: "Standard",
    priceNok: 500,
    minIntervalMinutes: 10,
    model: "claude-haiku-4-5",
    description: "10-minute cadence — the sweet spot for most single locations.",
    stripeLinkEnvVar: "NEXT_PUBLIC_STRIPE_LINK_STANDARD",
  },
  PROFESSIONAL: {
    label: "Professional",
    priceNok: 1600,
    minIntervalMinutes: 2,
    model: "claude-haiku-4-5", // bump to "claude-sonnet-5" if a customer wants sharper reads
    description: "2-minute cadence, near-live. (True sub-minute needs a paid host tier — see handoff notes.)",
    stripeLinkEnvVar: "NEXT_PUBLIC_STRIPE_LINK_PROFESSIONAL",
  },
};

export function stripeLinkFor(plan: PlanId): string | undefined {
  return process.env[PLANS[plan].stripeLinkEnvVar];
}
