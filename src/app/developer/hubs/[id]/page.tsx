"use client";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { DevHeader } from "@/components/DevHeader";
import { QueueBadge } from "@/components/QueueBadge";
import { Reveal } from "@/components/Reveal";
import { useAccount } from "@/lib/useAccount";
import { PLANS, type PlanId } from "@/lib/plans";
import { UTC_OFFSETS } from "@/lib/schedule";
import { SUBJECTS, type Subject } from "@/lib/subjects";

type Hub = {
  id: string;
  name: string;
  slug: string;
  webcamUrl: string;
  instructions: string | null;
  subjectType: Subject;
  isPublic: boolean;
  latestLevel: string | null;
  latestWaitMin: number | null;
  latestSummary: string | null;
  lastAnalyzedAt: string | null;
  activeHoursEnabled: boolean;
  activeStartHour: number;
  activeEndHour: number;
  utcOffsetMinutes: number;
  showPeopleCount: boolean;
  showWaitMinutes: boolean;
  useTrendLearning: boolean;
  staffAlertEnabled: boolean;
  staffAlertWebhookUrl: string | null;
  staffAlertThreshold: string;
};
type Analysis = { id: string; level: string; waitMin: number | null; summary: string; createdAt: string };

function hourLabel(h: number) {
  return `${String(h % 24).padStart(2, "0")}:00`;
}

export default function HubDetailPage({ params }: { params: { id: string } }) {
  const { account, loading } = useAccount("business");
  const [hub, setHub] = useState<Hub | null>(null);
  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [siteUrl, setSiteUrl] = useState("");

  // Schedule form is separate local state so typing doesn't fight the
  // periodic reload, and so "Save schedule" is one explicit action.
  const [schedEnabled, setSchedEnabled] = useState(false);
  const [schedStart, setSchedStart] = useState(8);
  const [schedEnd, setSchedEnd] = useState(22);
  const [schedOffset, setSchedOffset] = useState(60);
  const [schedSaving, setSchedSaving] = useState(false);
  const [schedSaved, setSchedSaved] = useState(false);

  // Same pattern for the output/intelligence toggles — local draft state,
  // one explicit save.
  const [outPeopleCount, setOutPeopleCount] = useState(false);
  const [outWaitMinutes, setOutWaitMinutes] = useState(true);
  const [outTrend, setOutTrend] = useState(false);
  const [outSaving, setOutSaving] = useState(false);
  const [outSaved, setOutSaved] = useState(false);

  // What the AI is looking for — subject + freeform instructions. Same
  // draft-state-then-save pattern as the other settings cards.
  const [subjType, setSubjType] = useState<Subject>("PEOPLE");
  const [subjInstructions, setSubjInstructions] = useState("");
  const [subjSaving, setSubjSaving] = useState(false);
  const [subjSaved, setSubjSaved] = useState(false);

  // Staff webhook alerts — same draft-state-then-save pattern.
  const [alertEnabled, setAlertEnabled] = useState(false);
  const [alertWebhook, setAlertWebhook] = useState("");
  const [alertThreshold, setAlertThreshold] = useState<"MEDIUM" | "LONG">("LONG");
  const [alertSaving, setAlertSaving] = useState(false);
  const [alertSaved, setAlertSaved] = useState(false);

  useEffect(() => setSiteUrl(window.location.origin), []);

  async function load() {
    const res = await fetch(`/api/hubs/${params.id}`);
    if (res.ok) {
      const d = await res.json();
      setHub(d.hub);
      setAnalyses(d.analyses);
      setSchedEnabled(d.hub.activeHoursEnabled);
      setSchedStart(d.hub.activeStartHour);
      setSchedEnd(d.hub.activeEndHour);
      setSchedOffset(d.hub.utcOffsetMinutes);
      setOutPeopleCount(d.hub.showPeopleCount);
      setOutWaitMinutes(d.hub.showWaitMinutes);
      setOutTrend(d.hub.useTrendLearning);
      setSubjType(d.hub.subjectType);
      setSubjInstructions(d.hub.instructions || "");
      setAlertEnabled(d.hub.staffAlertEnabled);
      setAlertWebhook(d.hub.staffAlertWebhookUrl || "");
      setAlertThreshold(d.hub.staffAlertThreshold === "MEDIUM" ? "MEDIUM" : "LONG");
    }
  }
  useEffect(() => {
    if (account) load();
  }, [account]);

  if (loading) return null;
  if (!account) {
    if (typeof window !== "undefined") window.location.href = "/developer/login";
    return null;
  }
  if (!hub) return null;

  const plan = account.plan && account.plan !== "NONE" ? PLANS[account.plan as PlanId] : null;
  const isFreePlan = account.plan === "FREE";

  async function togglePublic() {
    if (!hub || isFreePlan) return; // Free hubs stay public — see setup notes on the Free plan card.
    setBusy(true);
    setError(null);
    const res = await fetch(`/api/hubs/${hub.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isPublic: !hub.isPublic }),
    });
    setBusy(false);
    if (res.ok) load();
  }

  async function analyzeNow() {
    if (!hub) return;
    setBusy(true);
    setError(null);
    const res = await fetch(`/api/hubs/${hub.id}/analyze`, { method: "POST" });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) return setError(data.error || "Analysis failed.");
    load();
  }

  async function saveSubject() {
    if (!hub) return;
    setSubjSaving(true);
    setSubjSaved(false);
    const res = await fetch(`/api/hubs/${hub.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subjectType: subjType, instructions: subjInstructions }),
    });
    setSubjSaving(false);
    if (res.ok) {
      setSubjSaved(true);
      load();
      setTimeout(() => setSubjSaved(false), 2500);
    }
  }

  async function saveStaffAlerts() {
    if (!hub) return;
    setAlertSaving(true);
    setAlertSaved(false);
    const res = await fetch(`/api/hubs/${hub.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        staffAlertEnabled: alertEnabled,
        staffAlertWebhookUrl: alertWebhook,
        staffAlertThreshold: alertThreshold,
      }),
    });
    setAlertSaving(false);
    if (res.ok) {
      setAlertSaved(true);
      load();
      setTimeout(() => setAlertSaved(false), 2500);
    }
  }

  async function saveSchedule() {
    if (!hub) return;
    setSchedSaving(true);
    setSchedSaved(false);
    const res = await fetch(`/api/hubs/${hub.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        activeHoursEnabled: schedEnabled,
        activeStartHour: schedStart,
        activeEndHour: schedEnd,
        utcOffsetMinutes: schedOffset,
      }),
    });
    setSchedSaving(false);
    if (res.ok) {
      setSchedSaved(true);
      load();
      setTimeout(() => setSchedSaved(false), 2500);
    }
  }

  async function saveOutputSettings() {
    if (!hub) return;
    setOutSaving(true);
    setOutSaved(false);
    const res = await fetch(`/api/hubs/${hub.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        showPeopleCount: outPeopleCount,
        showWaitMinutes: outWaitMinutes,
        useTrendLearning: outTrend,
      }),
    });
    setOutSaving(false);
    if (res.ok) {
      setOutSaved(true);
      load();
      setTimeout(() => setOutSaved(false), 2500);
    }
  }

  const embedUrl = `${siteUrl}/api/embed/${hub.slug}`;
  const widgetSnippet = `<script src="${siteUrl}/api/embed/${hub.slug}/widget.js" async></script>`;

  const hourOptions = Array.from({ length: 24 }, (_, h) => h);

  return (
    <main>
      <DevHeader account={account} kind="business" links={[{ href: "/developer", label: "Hubs" }, { href: "/developer/billing", label: "Billing" }]} />
      <section className="container-page max-w-2xl pb-20">
        <Reveal>
          <div className="flex items-center justify-between">
            <h1 className="font-display text-3xl font-semibold">{hub.name}</h1>
            <label className={`flex items-center gap-2 text-sm ${isFreePlan ? "opacity-70" : ""}`}>
              <input type="checkbox" checked={hub.isPublic} onChange={togglePublic} disabled={busy || isFreePlan} />
              {isFreePlan ? "Public — required on the Free plan" : "Public (in directory + embeddable)"}
            </label>
          </div>
        </Reveal>

        <Reveal delay={0.05}>
          <div className="card mt-6">
            <div className="flex items-center justify-between">
              <QueueBadge level={hub.latestLevel} waitMin={hub.latestWaitMin} />
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={analyzeNow}
                disabled={busy}
                className="btn-ghost !px-3 !py-1.5 text-sm"
              >
                {busy ? "Working…" : "Analyze now"}
              </motion.button>
            </div>
            {hub.latestSummary && <p className="mt-3 text-sm text-ink/70 dark:text-paper/70">{hub.latestSummary}</p>}
            {error && <p className="mt-2 text-sm text-status-long">{error}</p>}
            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-ink/40 dark:text-paper/40">
              <span>Watching: {hub.webcamUrl}</span>
              {plan && <span>Cadence: every {plan.minIntervalMinutes} min</span>}
              {hub.lastAnalyzedAt && <span>Last checked: {new Date(hub.lastAnalyzedAt).toLocaleTimeString()}</span>}
            </div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={hub.webcamUrl}
              alt=""
              className="mt-3 h-28 w-full rounded-lg border border-ink/10 object-cover dark:border-paper/10"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).style.display = "none";
              }}
            />
          </div>
        </Reveal>

        <Reveal delay={0.08}>
          <div className="card mt-6">
            <h2 className="font-display text-lg font-medium">What Claude is counting</h2>
            <p className="mt-1 text-sm text-ink/60 dark:text-paper/60">
              People lines and vehicle queues look completely different in a frame — this tells Claude which one to
              look for.
            </p>
            <div className="mt-4 grid gap-2 sm:grid-cols-3">
              {(Object.entries(SUBJECTS) as [Subject, typeof SUBJECTS[Subject]][]).map(([id, s]) => (
                <button
                  type="button"
                  key={id}
                  onClick={() => setSubjType(id)}
                  className={`rounded-xl border px-3 py-2.5 text-left text-sm transition-colors ${
                    subjType === id
                      ? "border-cyan bg-cyan/10"
                      : "border-ink/15 hover:bg-ink/5 dark:border-paper/15 dark:hover:bg-paper/10"
                  }`}
                >
                  <span className="block font-medium">{s.label}</span>
                  <span className="mt-0.5 block text-xs text-ink/50 dark:text-paper/50">{s.hint}</span>
                </button>
              ))}
            </div>
            <div className="mt-4">
              <span className="label">
                Instructions for the AI {subjType === "CUSTOM" ? "" : "(optional)"}
              </span>
              <textarea
                className="field"
                rows={3}
                placeholder={
                  subjType === "VEHICLES"
                    ? "e.g. Only count cars in the left two lanes; ignore the drop-off area on the right."
                    : subjType === "CUSTOM"
                      ? "Describe exactly what to count in this frame, and what EMPTY/SHORT/MEDIUM/LONG should mean."
                      : "e.g. Only count people past the red line; ignore staff behind the counter."
                }
                value={subjInstructions}
                onChange={(e) => setSubjInstructions(e.target.value)}
              />
            </div>
            <div className="mt-4 flex items-center gap-3">
              <motion.button whileTap={{ scale: 0.96 }} onClick={saveSubject} disabled={subjSaving} className="btn-primary !px-4 !py-2 text-sm">
                {subjSaving ? "Saving…" : "Save"}
              </motion.button>
              <AnimatePresence>
                {subjSaved && (
                  <motion.span
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="text-sm text-status-empty"
                  >
                    Saved ✓
                  </motion.span>
                )}
              </AnimatePresence>
            </div>
          </div>
        </Reveal>

        <Reveal delay={0.1}>
          <div className="card mt-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-display text-lg font-medium">Analysis schedule</h2>
                <p className="mt-1 text-sm text-ink/60 dark:text-paper/60">
                  Only run analysis during hours you choose — handy if this location closes overnight.
                </p>
              </div>
              <label className="relative inline-flex cursor-pointer items-center">
                <input
                  type="checkbox"
                  checked={schedEnabled}
                  onChange={(e) => setSchedEnabled(e.target.checked)}
                  className="peer sr-only"
                />
                <div className="h-6 w-11 rounded-full bg-ink/15 transition-colors peer-checked:bg-cyan dark:bg-paper/20" />
                <div className="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-paper shadow transition-transform peer-checked:translate-x-5 dark:bg-ink" />
              </label>
            </div>

            <AnimatePresence>
              {schedEnabled && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25, ease: "easeOut" }}
                  className="overflow-hidden"
                >
                  <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                    <div>
                      <span className="label">From</span>
                      <select
                        className="field"
                        value={schedStart}
                        onChange={(e) => setSchedStart(Number(e.target.value))}
                      >
                        {hourOptions.map((h) => (
                          <option key={h} value={h}>
                            {hourLabel(h)}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <span className="label">Until</span>
                      <select className="field" value={schedEnd} onChange={(e) => setSchedEnd(Number(e.target.value))}>
                        {[...hourOptions, 24].filter((h) => h > 0).map((h) => (
                          <option key={h} value={h}>
                            {hourLabel(h)}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="col-span-2 sm:col-span-1">
                      <span className="label">Timezone</span>
                      <select
                        className="field"
                        value={schedOffset}
                        onChange={(e) => setSchedOffset(Number(e.target.value))}
                      >
                        {UTC_OFFSETS.map((o) => (
                          <option key={o.minutes} value={o.minutes}>
                            {o.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <p className="mt-2 text-xs text-ink/40 dark:text-paper/40">
                    Outside this window, checks pause automatically — no Claude usage, no wasted analysis.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="mt-4 flex items-center gap-3">
              <motion.button whileTap={{ scale: 0.96 }} onClick={saveSchedule} disabled={schedSaving} className="btn-primary !px-4 !py-2 text-sm">
                {schedSaving ? "Saving…" : "Save schedule"}
              </motion.button>
              <AnimatePresence>
                {schedSaved && (
                  <motion.span
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="text-sm text-status-empty"
                  >
                    Saved ✓
                  </motion.span>
                )}
              </AnimatePresence>
            </div>
          </div>
        </Reveal>

        <Reveal delay={0.13}>
          <div className="card mt-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-display text-lg font-medium">Analysis intelligence</h2>
                <p className="mt-1 text-sm text-ink/60 dark:text-paper/60">
                  {plan?.advancedOutput
                    ? "Control what the public sees, and let readings learn from recent history."
                    : "Unlocks on Standard and Professional."}
                </p>
              </div>
              {!plan?.advancedOutput && (
                <a href="/developer/billing" className="btn-ghost !px-3 !py-1.5 text-xs shrink-0">
                  Upgrade
                </a>
              )}
            </div>

            {plan?.advancedOutput ? (
              <div className="mt-4 space-y-3">
                <label className="flex items-center justify-between gap-4 text-sm">
                  <span>
                    Show wait-time estimate publicly
                    <span className="block text-xs text-ink/40 dark:text-paper/40">On the hub page and embed/API.</span>
                  </span>
                  <input
                    type="checkbox"
                    checked={outWaitMinutes}
                    onChange={(e) => setOutWaitMinutes(e.target.checked)}
                    className="h-4 w-4 shrink-0"
                  />
                </label>
                <label className="flex items-center justify-between gap-4 text-sm">
                  <span>
                    Show count estimate publicly
                    <span className="block text-xs text-ink/40 dark:text-paper/40">
                      The exact "~N {SUBJECTS[hub.subjectType].unit || "waiting"}" figure.
                    </span>
                  </span>
                  <input
                    type="checkbox"
                    checked={outPeopleCount}
                    onChange={(e) => setOutPeopleCount(e.target.checked)}
                    className="h-4 w-4 shrink-0"
                  />
                </label>
                <label className="flex items-center justify-between gap-4 text-sm">
                  <span>
                    Learn from recent readings
                    <span className="block text-xs text-ink/40 dark:text-paper/40">
                      Feeds the last few readings back in so Claude can judge the trend, not just this one frame.
                    </span>
                  </span>
                  <input
                    type="checkbox"
                    checked={outTrend}
                    onChange={(e) => setOutTrend(e.target.checked)}
                    className="h-4 w-4 shrink-0"
                  />
                </label>

                <div className="flex items-center gap-3 pt-1">
                  <motion.button
                    whileTap={{ scale: 0.96 }}
                    onClick={saveOutputSettings}
                    disabled={outSaving}
                    className="btn-primary !px-4 !py-2 text-sm"
                  >
                    {outSaving ? "Saving…" : "Save"}
                  </motion.button>
                  <AnimatePresence>
                    {outSaved && (
                      <motion.span
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="text-sm text-status-empty"
                      >
                        Saved ✓
                      </motion.span>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            ) : (
              <ul className="mt-4 space-y-1.5 text-sm text-ink/50 dark:text-paper/50">
                <li>· Choose whether wait-time and headcount show publicly</li>
                <li>· Let analysis learn from recent readings, not just one frame</li>
              </ul>
            )}
          </div>
        </Reveal>

        <Reveal delay={0.16}>
          <div className="card mt-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-display text-lg font-medium">Staff alerts</h2>
                <p className="mt-1 text-sm text-ink/60 dark:text-paper/60">
                  {plan?.advancedOutput
                    ? "Get a webhook ping the moment the queue gets busy — paste in a Slack, Discord, or Teams incoming webhook URL and it just works."
                    : "Unlocks on Standard and Professional."}
                </p>
              </div>
              {!plan?.advancedOutput && (
                <a href="/developer/billing" className="btn-ghost !px-3 !py-1.5 text-xs shrink-0">
                  Upgrade
                </a>
              )}
            </div>

            {plan?.advancedOutput ? (
              <div className="mt-4 space-y-3">
                <label className="flex items-center justify-between gap-4 text-sm">
                  <span>
                    Enable staff alerts
                    <span className="block text-xs text-ink/40 dark:text-paper/40">
                      At most once every 15 minutes, so it can't spam a channel.
                    </span>
                  </span>
                  <input
                    type="checkbox"
                    checked={alertEnabled}
                    onChange={(e) => setAlertEnabled(e.target.checked)}
                    className="h-4 w-4 shrink-0"
                  />
                </label>
                <div>
                  <span className="label">Webhook URL</span>
                  <input
                    type="url"
                    className="field"
                    placeholder="https://hooks.slack.com/services/…"
                    value={alertWebhook}
                    onChange={(e) => setAlertWebhook(e.target.value)}
                  />
                </div>
                <div>
                  <span className="label">Alert when queue reaches</span>
                  <select
                    className="field"
                    value={alertThreshold}
                    onChange={(e) => setAlertThreshold(e.target.value === "MEDIUM" ? "MEDIUM" : "LONG")}
                  >
                    <option value="MEDIUM">Moderate or busier</option>
                    <option value="LONG">Long only</option>
                  </select>
                </div>

                <div className="flex items-center gap-3 pt-1">
                  <motion.button
                    whileTap={{ scale: 0.96 }}
                    onClick={saveStaffAlerts}
                    disabled={alertSaving}
                    className="btn-primary !px-4 !py-2 text-sm"
                  >
                    {alertSaving ? "Saving…" : "Save"}
                  </motion.button>
                  <AnimatePresence>
                    {alertSaved && (
                      <motion.span
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="text-sm text-status-empty"
                      >
                        Saved ✓
                      </motion.span>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            ) : (
              <ul className="mt-4 space-y-1.5 text-sm text-ink/50 dark:text-paper/50">
                <li>· A webhook ping to Slack/Discord/Teams/your own endpoint when a queue crosses a threshold</li>
                <li>· Lets staff open another till or lane before customers even complain</li>
              </ul>
            )}
          </div>
        </Reveal>

        {hub.isPublic && (
          <Reveal delay={0.18}>
            <div className="card mt-6">
              <h2 className="font-display text-lg font-medium">Embed on your own site</h2>
              <p className="mt-1 text-sm text-ink/60 dark:text-paper/60">Drop this where you want the live badge to show:</p>
              <pre className="mt-3 overflow-x-auto rounded-lg bg-ink px-4 py-3 font-mono text-xs text-paper dark:bg-black">
                {widgetSnippet}
              </pre>
              <p className="mt-3 text-sm text-ink/60 dark:text-paper/60">Or read it as JSON:</p>
              <pre className="mt-2 overflow-x-auto rounded-lg bg-ink px-4 py-3 font-mono text-xs text-paper dark:bg-black">
                GET {embedUrl}
              </pre>
            </div>
          </Reveal>
        )}

        {analyses.length > 0 && (
          <Reveal delay={0.2}>
            <div className="card mt-6">
              <h2 className="font-display text-lg font-medium">History</h2>
              <ul className="mt-3 divide-y divide-ink/10 dark:divide-paper/10">
                {analyses.map((a, i) => (
                  <motion.li
                    key={a.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: i * 0.03 }}
                    className="flex items-center justify-between py-2 text-sm"
                  >
                    <span className="text-ink/50 dark:text-paper/50">{new Date(a.createdAt).toLocaleString()}</span>
                    <QueueBadge level={a.level} waitMin={a.waitMin} />
                  </motion.li>
                ))}
              </ul>
            </div>
          </Reveal>
        )}
      </section>
    </main>
  );
}
