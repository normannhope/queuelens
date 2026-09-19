import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { readSession } from "@/lib/auth";
import { PLANS, type PlanId } from "@/lib/plans";

async function ownedHub(id: string, businessId: string) {
  const hub = await db.hub.findUnique({ where: { id } });
  if (!hub || hub.businessId !== businessId) return null;
  return hub;
}

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await readSession("business");
  if (!session) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  let hub = await ownedHub(params.id, session.sub);
  if (!hub) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Free hubs must always be public. One can still be stuck private — e.g.
  // created under a different plan before the account switched to Free —
  // and its checkbox is locked, so there'd be no way to fix it from the UI.
  // Heal it here, server-side, the moment anyone reads it.
  if (!hub.isPublic) {
    const business = await db.business.findUnique({ where: { id: session.sub }, select: { plan: true } });
    if (business?.plan === "FREE") {
      hub = await db.hub.update({ where: { id: hub.id }, data: { isPublic: true } });
    }
  }

  const analyses = await db.analysis.findMany({
    where: { hubId: hub.id },
    orderBy: { createdAt: "desc" },
    take: 20,
  });
  return NextResponse.json({ hub, analyses });
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await readSession("business");
  if (!session) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  const hub = await ownedHub(params.id, session.sub);
  if (!hub) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  const allowed = [
    "name",
    "address",
    "category",
    "webcamUrl",
    "instructions",
    "subjectType",
    "isPublic",
    "activeHoursEnabled",
    "activeStartHour",
    "activeEndHour",
    "utcOffsetMinutes",
    "showPeopleCount",
    "showWaitMinutes",
    "useTrendLearning",
    "staffAlertEnabled",
    "staffAlertWebhookUrl",
    "staffAlertThreshold",
  ];
  const data: Record<string, unknown> = {};
  for (const k of allowed) if (k in body) data[k] = body[k];

  if (typeof data.activeStartHour === "number") data.activeStartHour = Math.min(23, Math.max(0, data.activeStartHour));
  if (typeof data.activeEndHour === "number") data.activeEndHour = Math.min(24, Math.max(1, data.activeEndHour));
  if (typeof data.subjectType === "string" && !["PEOPLE", "VEHICLES", "CUSTOM"].includes(data.subjectType)) {
    delete data.subjectType;
  }
  if (typeof data.staffAlertThreshold === "string" && !["MEDIUM", "LONG"].includes(data.staffAlertThreshold)) {
    delete data.staffAlertThreshold;
  }
  if (typeof data.staffAlertWebhookUrl === "string") {
    const url = data.staffAlertWebhookUrl.trim();
    // Empty clears it; anything else has to at least look like a URL — a bad
    // webhook shouldn't silently sit there doing nothing forever.
    data.staffAlertWebhookUrl = url === "" ? null : /^https:\/\//i.test(url) ? url : null;
  }

  const business = await db.business.findUnique({ where: { id: session.sub } });
  const advancedOutput = business && business.plan !== "NONE" ? PLANS[business.plan as PlanId].advancedOutput : false;

  // "Advanced output" fields (customizing what's publicly shown, trend-aware
  // analysis, and staff webhook alerts) are a Standard/Professional perk — a
  // Starter or Free business can't smuggle them in via a raw PATCH even
  // though the UI already hides the controls.
  const advancedFields = [
    "showPeopleCount",
    "useTrendLearning",
    "staffAlertEnabled",
    "staffAlertWebhookUrl",
    "staffAlertThreshold",
  ] as const;
  if (!advancedOutput) {
    for (const f of advancedFields) delete data[f];
  }

  // The Free plan trades analysis for distribution — its hubs stay public
  // and keep the badge, non-negotiable through this route. Force it true on
  // *every* PATCH (not just one that explicitly tried to turn it off) so a
  // hub that drifted private — e.g. created under a different plan before
  // the account switched to Free — self-heals the moment anything on it is
  // saved, rather than staying stuck with no way to fix it from the UI.
  if (business?.plan === "FREE") {
    data.isPublic = true;
  }

  const updated = await db.hub.update({ where: { id: hub.id }, data });
  return NextResponse.json({ hub: updated });
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await readSession("business");
  if (!session) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  const hub = await ownedHub(params.id, session.sub);
  if (!hub) return NextResponse.json({ error: "Not found" }, { status: 404 });
  await db.hub.delete({ where: { id: hub.id } });
  return NextResponse.json({ ok: true });
}
