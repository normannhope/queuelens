import { db } from "@/lib/db";
import { analyzeQueue } from "@/lib/anthropic";
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

  const reading = await analyzeQueue(hub.webcamUrl, hub.instructions, model);

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
  return reading;
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
