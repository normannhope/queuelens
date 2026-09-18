import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { readSession } from "@/lib/auth";

const schema = z.object({
  endpoint: z.string().url(),
  keys: z.object({ p256dh: z.string(), auth: z.string() }),
});

// Called once the browser grants notification permission and subscribes
// this device to push (see the client code in account/page.tsx). Saves the
// subscription so runAnalysis.ts can push to it later — no polling, no
// third-party notification service.
export async function POST(req: NextRequest) {
  const session = await readSession("customer");
  if (!session) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const body = schema.safeParse(await req.json());
  if (!body.success) return NextResponse.json({ error: "Invalid subscription" }, { status: 400 });

  await db.pushSubscription.upsert({
    where: { endpoint: body.data.endpoint },
    create: {
      customerId: session.sub,
      endpoint: body.data.endpoint,
      p256dh: body.data.keys.p256dh,
      auth: body.data.keys.auth,
    },
    update: { customerId: session.sub, p256dh: body.data.keys.p256dh, auth: body.data.keys.auth },
  });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const session = await readSession("customer");
  if (!session) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  const { endpoint } = await req.json();
  await db.pushSubscription.deleteMany({ where: { endpoint, customerId: session.sub } });
  return NextResponse.json({ ok: true });
}
