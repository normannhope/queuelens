import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { readSession } from "@/lib/auth";

// Temporary bypass while the Stripe test-card flow is unreliable in
// production: a business that knows the secret code gets PROFESSIONAL for
// 31 days, same as a real checkout would grant. Gate this off (or rotate
// the code) once real billing is confirmed working end-to-end — see
// DEV_UNLOCK_CODE in Vercel env vars. No code set at all = route always 404s.
export async function POST(req: NextRequest) {
  const code = process.env.DEV_UNLOCK_CODE;
  if (!code) return NextResponse.json({ error: "Not enabled" }, { status: 404 });

  const session = await readSession("business");
  if (!session) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  if (typeof body.code !== "string" || body.code !== code) {
    return NextResponse.json({ error: "Wrong code" }, { status: 403 });
  }

  await db.business.update({
    where: { id: session.sub },
    data: { plan: "PROFESSIONAL", planRenewsAt: new Date(Date.now() + 31 * 24 * 60 * 60 * 1000) },
  });

  return NextResponse.json({ ok: true });
}
