import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { readSession } from "@/lib/auth";

// The one "subscribe" path that isn't a Stripe Payment Link redirect — the
// Free plan costs nothing, so there's nothing for Stripe to collect. Free
// hubs are always public and carry the Queue Lens badge (enforced in
// api/hubs/route.ts and api/hubs/[id]/route.ts, not just this route) — that's
// the trade for free analysis, not an oversight.
export async function POST() {
  const session = await readSession("business");
  if (!session) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const business = await db.business.update({
    where: { id: session.sub },
    data: { plan: "FREE", planRenewsAt: null },
  });
  return NextResponse.json({ ok: true, plan: business.plan });
}
