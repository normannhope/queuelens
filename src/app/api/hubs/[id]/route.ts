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
  const hub = await ownedHub(params.id, session.sub);
  if (!hub) return NextResponse.json({ error: "Not found" }, { status: 404 });
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
    "isPublic",
    "activeHoursEnabled",
    "activeStartHour",
    "activeEndHour",
    "utcOffsetMinutes",
    "showPeopleCount",
    "showWaitMinutes",
    "useTrendLearning",
  ];
  const data: Record<string, unknown> = {};
  for (const k of allowed) if (k in body) data[k] = body[k];

  if (typeof data.activeStartHour === "number") data.activeStartHour = Math.min(23, Math.max(0, data.activeStartHour));
  if (typeof data.activeEndHour === "number") data.activeEndHour = Math.min(24, Math.max(1, data.activeEndHour));

  // "Advanced output" fields (customizing what's publicly shown, and
  // trend-aware analysis) are a Standard/Professional perk — a Starter
  // business can't smuggle them in via a raw PATCH even though the UI
  // already hides the controls.
  const advancedFields = ["showPeopleCount", "useTrendLearning"] as const;
  if (advancedFields.some((f) => f in data)) {
    const business = await db.business.findUnique({ where: { id: session.sub } });
    const advancedOutput = business && business.plan !== "NONE" ? PLANS[business.plan as PlanId].advancedOutput : false;
    if (!advancedOutput) {
      for (const f of advancedFields) delete data[f];
    }
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
