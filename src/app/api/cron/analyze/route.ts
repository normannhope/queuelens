import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { runAnalysisForHub } from "@/lib/runAnalysis";
import { PLANS, type PlanId } from "@/lib/plans";
import { isHubActiveNow } from "@/lib/schedule";

export const maxDuration = 60; // Vercel Hobby currently allows up to 60s; if that's rejected at deploy, lower it and keep hub counts small for now.

// Hit on a schedule — either Vercel's own Cron (vercel.json runs this once
// a day for free, which is all the Hobby plan allows) or, for real
// cadence without paying for Vercel Pro, a free external pinger like
// cron-job.org calling this URL every 1-2 minutes (see HANDOFF.md). Either
// way this route is idempotent and cheap to over-call: it only actually
// re-analyzes a hub once its plan's interval has elapsed, so a Starter hub
// isn't burning Claude spend every time this fires if its plan says 30 min.
// Protected by CRON_SECRET so no one else can trigger paid analysis runs.
export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (process.env.CRON_SECRET && auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const hubs = await db.hub.findMany({
    where: { isPublic: true, business: { plan: { not: "NONE" } } },
    include: { business: true },
  });

  const due = hubs.filter((hub) => {
    if (!isHubActiveNow(hub)) return false; // outside the business's chosen active hours
    const plan = hub.business.plan as PlanId;
    const minMinutes = PLANS[plan]?.minIntervalMinutes ?? 5;
    if (!hub.lastAnalyzedAt) return true;
    return Date.now() - hub.lastAnalyzedAt.getTime() >= minMinutes * 60_000;
  });

  const results = await Promise.allSettled(due.map((hub) => runAnalysisForHub(hub)));
  const failures = results.filter((r) => r.status === "rejected").length;

  return NextResponse.json({ checked: hubs.length, analyzed: due.length, failed: failures });
}
