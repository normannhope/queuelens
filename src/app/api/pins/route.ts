import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { readSession } from "@/lib/auth";

export async function GET() {
  const session = await readSession("customer");
  if (!session) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  const pins = await db.pin.findMany({
    where: { customerId: session.sub },
    include: { hub: true },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ pins });
}

const createSchema = z.object({ hubId: z.string() });

export async function POST(req: NextRequest) {
  const session = await readSession("customer");
  if (!session) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  const body = createSchema.safeParse(await req.json());
  if (!body.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const hub = await db.hub.findUnique({ where: { id: body.data.hubId } });
  if (!hub || !hub.isPublic) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const pin = await db.pin.upsert({
    where: { customerId_hubId: { customerId: session.sub, hubId: hub.id } },
    create: { customerId: session.sub, hubId: hub.id },
    update: {},
  });
  return NextResponse.json({ pin });
}
