import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { readSession } from "@/lib/auth";
import { PLANS, type PlanId } from "@/lib/plans";

function slugify(name: string) {
  return (
    name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .trim()
      .replace(/\s+/g, "-")
      .slice(0, 60) +
    "-" +
    Math.random().toString(36).slice(2, 6)
  );
}

export async function GET() {
  const session = await readSession("business");
  if (!session) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const business = await db.business.findUnique({ where: { id: session.sub }, select: { plan: true } });
  if (business?.plan === "FREE") {
    // Free hubs must always be public — heal any that drifted private (e.g.
    // created under a different plan before the account switched to Free)
    // so the dashboard's Public/Private badge is never stuck wrong.
    await db.hub.updateMany({ where: { businessId: session.sub, isPublic: false }, data: { isPublic: true } });
  }

  const hubs = await db.hub.findMany({
    where: { businessId: session.sub },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ hubs });
}

const createSchema = z.object({
  name: z.string().min(1),
  address: z.string().optional(),
  category: z.string().optional(),
  webcamUrl: z.string().url(),
  instructions: z.string().max(500).optional(),
  subjectType: z.enum(["PEOPLE", "VEHICLES", "CUSTOM"]).optional(),
  isPublic: z.boolean().optional(), // ignored (forced true) on Free — see below
});

export async function POST(req: NextRequest) {
  const session = await readSession("business");
  if (!session) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const business = await db.business.findUnique({ where: { id: session.sub } });
  if (!business) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  if (business.plan === "NONE") {
    return NextResponse.json(
      { error: "Pick a plan before creating a hub — see the settings tab." },
      { status: 402 },
    );
  }

  const maxHubs = PLANS[business.plan as PlanId].maxHubs;
  const hubCount = await db.hub.count({ where: { businessId: business.id } });
  if (hubCount >= maxHubs) {
    return NextResponse.json(
      {
        error:
          maxHubs === 1
            ? "Your plan covers 1 hub. Upgrade to Professional for up to 10."
            : `Your plan covers up to ${maxHubs} hubs — you're at the limit.`,
      },
      { status: 402 },
    );
  }

  const body = createSchema.safeParse(await req.json());
  if (!body.success) return NextResponse.json({ error: body.error.issues[0]?.message }, { status: 400 });

  const hub = await db.hub.create({
    data: {
      ...body.data,
      slug: slugify(body.data.name),
      businessId: session.sub,
      // The Free plan's whole deal is distribution — its hubs start (and
      // stay, see the PATCH route) public, no opt-out. Every other plan
      // defaults to private unless the "Add a hub" form asked for public.
      isPublic: business.plan === "FREE" ? true : !!body.data.isPublic,
    },
  });
  return NextResponse.json({ hub });
}
