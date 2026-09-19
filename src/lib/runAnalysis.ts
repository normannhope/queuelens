import { db } from "@/lib/db";
import { analyzeQueue, type QueueReading } from "@/lib/anthropic";
import { sendQueueAlertPush } from "@/lib/push";
import { PLANS, type PlanId } from "@/lib/plans";
import type { Hub, Plan, QueueLevel } from "@prisma/client";

const LEVEL_RANK: Record<QueueLevel, number> = { EMPTY: 0, SHORT: 1, MEDIUM: 2, LONG: 3, UNKNOWN: 2 };

// One hub, one fresh analysis: call Claude (using the model + cadence its
// business's plan pays for), persist it, update the hub's denormalized
// "latest" fields (so the directory/embed can read without a join), then
// push-notify any customer alert this reading crosses. Shared by the
// manual "Analyze now" button and the scheduled cron route.
export async function runAnalysisForHub(hub: Hub & { business?: { plan: Plan } }) {
  const plan = hub.business?.plan;
  const model = plan && plan !== "NONE" ? PLANS[plan as PlanId].model : undefined;

  // Trend-aware analysis is a Standard/Professional perk (lib/plans.ts
  // advancedOutput) — the hub-level toggle only takes effect on a plan that
  // actually unlocks it, same double-check as the PATCH route.
  const advancedOutput = plan && plan !== "NONE" ? PLANS[plan as PlanId].advancedOutput : false;
  let recentHistory: { level: QueueLevel; count: number | null; minutesAgo: number }[] | undefined;
  if (hub.useTrendLearning && advancedOutput) {
    const recent = await db.analysis.findMany({
      where: { hubId: hub.id },
      orderBy: { createdAt: "desc" },
      take: 5,
    });
    const now = Date.now();
    recentHistory = recent
      .slice()
      .reverse()
      .map((a) => ({ level: a.level, count: a.count, minutesAgo: Math.round((now - a.createdAt.getTime()) / 60_000) }));
  }

  const reading = await analyzeQueue(hub.webcamUrl, hub.instructions, model, recentHistory, hub.subjectType);

  await db.$transaction([
    db.analysis.create({
      data: {
        hubId: hub.id,
        level: reading.level,
        count: reading.count,
        waitMin: reading.waitMin,
        summary: reading.summary,
      },
    }),
    db.hub.update({
      where: { id: hub.id },
      data: {
        lastAnalyzedAt: new Date(),
        latestLevel: reading.level,
        latestCount: reading.count,
        latestWaitMin: reading.waitMin,
        latestSummary: reading.summary,
      },
    }),
  ]);

  await notifyPinsIfDue(hub, reading.level, reading.summary);
  await notifyStaffIfDue(hub, reading, advancedOutput);
  return reading;
}

// Staff-facing alerting — separate from the customer-facing push above.
// Standard/Professional only (same advancedOutput gate as output
// customization). We POST a small JSON body with a top-level "text" field so
// it works as a Slack/Discord/Teams incoming webhook with zero setup beyond
// pasting the URL in — no email, no new account, nothing to implement on
// their end.
async function notifyStaffIfDue(hub: Hub, reading: QueueReading, advancedOutput: boolean) {
  if (!advancedOutput || !hub.staffAlertEnabled || !hub.staffAlertWebhookUrl) return;
  const crossed = LEVEL_RANK[reading.level] >= LEVEL_RANK[hub.staffAlertThreshold];
  const cooldownOk =
    !hub.staffAlertLastSentAt || Date.now() - hub.staffAlertLastSentAt.getTime() > 15 * 60 * 1000;
  if (!crossed || !cooldownOk) return;

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://quelens.com";
  try {
    await fetch(hub.staffAlertWebhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text: `${hub.name}: ${reading.level.toLowerCase()} — ${reading.summary}`,
        hub: hub.name,
        level: reading.level,
        count: reading.count,
        waitMin: reading.waitMin,
        summary: reading.summary,
        url: `${siteUrl}/hub/${hub.slug}`,
      }),
      signal: AbortSignal.timeout(5000),
    });
    await db.hub.update({ where: { id: hub.id }, data: { staffAlertLastSentAt: new Date() } });
  } catch {
    // A bad or unreachable webhook shouldn't break the analysis pipeline —
    // just skip this cycle and try again next time the threshold is crossed.
  }
}

async function notifyPinsIfDue(hub: Hub, level: QueueLevel, summary: string) {
  if (!hub.isPublic) return; // don't alert on private/unlisted hubs
  const pins = await db.pin.findMany({ where: { hubId: hub.id, notifyEnabled: true } });
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://quelens.com";

  for (const pin of pins) {
    const crossed = LEVEL_RANK[level] <= LEVEL_RANK[pin.notifyBelowLevel];
    // Don't re-notify more than once every 30 minutes for the same pin, even
    // if the queue stays short the whole time.
    const cooldownOk =
      !pin.lastNotifiedAt || Date.now() - pin.lastNotifiedAt.getTime() > 30 * 60 * 1000;
    if (crossed && cooldownOk) {
      await sendQueueAlertPush(pin.customerId, hub.name, summary, `${siteUrl}/hub/${hub.slug}`);
      await db.pin.update({ where: { id: pin.id }, data: { lastNotifiedAt: new Date() } });
    }
  }
}
