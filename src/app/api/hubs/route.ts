import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { readSession } from "@/lib/auth";

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
});

export async function POST(req: NextRequest) {
  const session = await readSession("business");
  if (!session) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const business = await db.business.findUnique({ where: { id: session.sub } });
  if (!business) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  if (business.plan === "NONE") {
    return NextResponse.json(
      { error: "Pick a plan before creating a hub — see the billing tab." },
      { status: 402 },
    );
  }

  const body = createSchema.safeParse(await req.json());
  if (!body.success) return NextResponse.json({ error: body.error.issues[0]?.message }, { status: 400 });

  const hub = await db.hub.create({
    data: { ...body.data, slug: slugify(body.data.name), businessId: session.sub },
  });
  return NextResponse.json({ hub });
}
