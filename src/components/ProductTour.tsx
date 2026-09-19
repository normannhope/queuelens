"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PLANS, type PlanId } from "@/lib/plans";

type PlanInfo = (typeof PLANS)[PlanId];

type Step = {
  title: string;
  body: string;
  // Absent = always unlocked (core flow, available on every plan). Present
  // and false = show the locked note + CTA instead of pretending this is
  // ready to use yet.
  unlocked?: (plan: PlanInfo | null) => boolean;
  lockedNote?: string;
  cta?: { href: string; label: string };
};

const STEPS: Step[] = [
  {
    title: "Add a hub",
    body: 'Paste a webcam snapshot URL — a link that returns a fresh JPG/PNG, not a viewer page. The form shows a live preview as you type, so you know right away if it\'s wired up correctly. No camera yet? The setup guide walks through picking one, or email us and we\'ll help for free.',
  },
  {
    title: "Tell Claude what it's counting",
    body: 'Pick People, Vehicles, or Custom, then add a short instruction if the frame needs context — e.g. "only count past the red line" or "ignore the drop-off lane." This is what turns a plain photo into an actual queue reading.',
  },
  {
    title: "Set your analysis schedule",
    body: "Restrict analysis to the hours you're actually open. Outside that window, checks pause automatically — no Claude usage burned, no stale overnight reading shown to customers.",
  },
  {
    title: "Go live",
    body: 'Flip a hub public to list it in the directory and unlock the embed snippet — one script tag drops a live status badge on your own site. Free-plan hubs are always public and carry a small "Powered by Queue Lens" badge — that\'s the trade for the free tier.',
  },
  {
    title: "Analysis intelligence",
    body: "Choose exactly what the public sees — wait-time estimate, headcount, both, or neither — and let analysis weigh the last few readings instead of judging one frame in isolation.",
    unlocked: (p) => !!p?.advancedOutput,
    lockedNote: "Unlocks on Standard and Professional.",
    cta: { href: "/developer/settings", label: "Upgrade" },
  },
  {
    title: "Staff alerts",
    body: "Paste a Slack, Discord, or Teams incoming webhook URL and pick a threshold — staff get pinged the moment the queue gets busy, at most once every 15 minutes so it can't spam a channel.",
    unlocked: (p) => !!p?.advancedOutput,
    lockedNote: "Unlocks on Standard and Professional.",
    cta: { href: "/developer/settings", label: "Upgrade" },
  },
  {
    title: "Run more than one location",
    body: "Professional covers up to 10 hubs on a single subscription, all on the same 5-minute cadence — built for chains and multi-location businesses.",
    unlocked: (p) => !!p && p.maxHubs > 1,
    lockedNote: "Unlocks on Professional.",
    cta: { href: "/developer/settings", label: "Upgrade" },
  },
  {
    title: "Need more than 10 hubs?",
    body: "Enterprise covers unlimited hubs, custom cadence, an SLA, and invoicing instead of card payment — for chains that outgrow Professional.",
    unlocked: () => false,
    lockedNote: "Custom plan — let's talk.",
    cta: { href: "mailto:hello@quelens.com?subject=Enterprise%20plan", label: "Contact us" },
  },
];

// A persistent, replayable walkthrough — not a one-time popup — reachable
// from DevHeader on every business page. Content is plan-aware: steps
// beyond what the signed-in account can currently use show a locked note
// and an upgrade/contact CTA instead of describing them as ready to go, so
// the tour doubles as a "here's what upgrading actually buys you" preview.
export function ProductTour({ plan }: { plan?: string }) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);

  const planInfo = plan && plan !== "NONE" ? PLANS[plan as PlanId] : null;
  const current = STEPS[step];
  const isUnlocked = current.unlocked ? current.unlocked(planInfo) : true;

  return (
    <>
      <button
        onClick={() => {
          setStep(0);
          setOpen(true);
        }}
        className="text-ink/70 hover:text-ink dark:text-paper/70 dark:hover:text-paper"
      >
        Take a tour
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            key="tour-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 p-4 backdrop-blur-sm dark:bg-black/70"
            onClick={() => setOpen(false)}
          >
            <motion.div
              key="tour-panel"
              initial={{ opacity: 0, y: 16, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.98 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              onClick={(e) => e.stopPropagation()}
              className="card relative w-full max-w-lg"
            >
              <button
                onClick={() => setOpen(false)}
                aria-label="Close tour"
                className="absolute right-5 top-5 text-ink/40 hover:text-ink dark:text-paper/40 dark:hover:text-paper"
              >
                ✕
              </button>

              <p className="font-mono text-xs uppercase tracking-[0.2em] text-cyan">
                Step {step + 1} of {STEPS.length}
              </p>

              <div className="relative mt-4 min-h-[200px] overflow-hidden">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={step}
                    initial={{ opacity: 0, x: 18 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -18 }}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                  >
                    <h3 className="font-display text-xl font-medium">{current.title}</h3>
                    <p className="mt-3 text-sm leading-relaxed text-ink/70 dark:text-paper/70">{current.body}</p>

                    {!isUnlocked && (
                      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-dashed border-ink/20 bg-ink/5 px-3.5 py-2.5 text-xs dark:border-paper/20 dark:bg-paper/5">
                        <span className="text-ink/60 dark:text-paper/60">{current.lockedNote}</span>
                        {current.cta && (
                          <a
                            href={current.cta.href}
                            onClick={() => setOpen(false)}
                            className="btn-ghost !px-3 !py-1 shrink-0 text-xs"
                          >
                            {current.cta.label}
                          </a>
                        )}
                      </div>
                    )}
                  </motion.div>
                </AnimatePresence>
              </div>

              <div className="mt-6 flex items-center justify-between">
                <div className="flex gap-1.5">
                  {STEPS.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setStep(i)}
                      aria-label={`Go to step ${i + 1}`}
                      className={`h-1.5 rounded-full transition-all ${
                        i === step ? "w-5 bg-cyan" : "w-1.5 bg-ink/15 dark:bg-paper/20"
                      }`}
                    />
                  ))}
                </div>
                <div className="flex gap-2">
                  {step > 0 && (
                    <button onClick={() => setStep((s) => s - 1)} className="btn-ghost !px-3 !py-1.5 text-sm">
                      Back
                    </button>
                  )}
                  {step < STEPS.length - 1 ? (
                    <button onClick={() => setStep((s) => s + 1)} className="btn-primary !px-4 !py-1.5 text-sm">
                      Next
                    </button>
                  ) : (
                    <button onClick={() => setOpen(false)} className="btn-primary !px-4 !py-1.5 text-sm">
                      Done
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
