import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { readSession } from "@/lib/auth";

// PATCH toggles notifyEnabled / notifyBelowLevel — the "easy to enable and
// disable" switch on a pinned business. DELETE un-pins entirely.

async function ownedPin(id: string, customerId: string) {
  const pin = await db.pin.findUnique({ where: { id } });
  if (!pin || pin.customerId !== customerId) return null;
  return pin;
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await readSession("customer");
  if (!session) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  const pin = await ownedPin(params.id, session.sub);
  if (!pin) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  const data: Record<string, unknown> = {};
  if (typeof body.notifyEnabled === "boolean") data.notifyEnabled = body.notifyEnabled;
  if (typeof body.notifyBelowLevel === "string") data.notifyBelowLevel = body.notifyBelowLevel;

  const updated = await db.pin.update({ where: { id: pin.id }, data });
  return NextResponse.json({ pin: updated });
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await readSession("customer");
  if (!session) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  const pin = await ownedPin(params.id, session.sub);
  if (!pin) return NextResponse.json({ error: "Not found" }, { status: 404 });
  await db.pin.delete({ where: { id: pin.id } });
  return NextResponse.json({ ok: true });
}
